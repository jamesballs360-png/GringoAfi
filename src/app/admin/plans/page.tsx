"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { Lock, Plus, Trash2 } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  min_amount: number;
  max_amount: number;
  roi_percent: number;
  duration_days: number;
  is_active: boolean;
};

type Form = {
  name: string;
  description: string;
  min_amount: string;
  max_amount: string;
  roi_percent: string;
  duration_days: string;
};

const emptyForm: Form = {
  name: "",
  description: "",
  min_amount: "",
  max_amount: "",
  roi_percent: "",
  duration_days: "",
};

function validate(f: Form): string | null {
  const min = Number(f.min_amount);
  const max = Number(f.max_amount);
  const roi = Number(f.roi_percent);
  const days = Number(f.duration_days);
  if (!f.name.trim()) return "Give the plan a name.";
  if (!(min > 0)) return "Minimum amount must be greater than 0.";
  if (!(max > min)) return "Maximum amount must be greater than the minimum.";
  if (!(roi > 0)) return "Return % must be greater than 0.";
  if (!Number.isInteger(days) || days < 1) return "Term must be a whole number of days (1 or more).";
  return null;
}

export default function AdminPlansPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeCounts, setActiveCounts] = useState<Record<string, number>>({});
  const [totalCounts, setTotalCounts] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<Record<string, Partial<Form>>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);
  const [pageNotice, setPageNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newForm, setNewForm] = useState<Form>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    const [{ data: planRows }, { data: invRows }] = await Promise.all([
      supabase.from("investment_plans").select("*").order("min_amount", { ascending: true }),
      supabase.from("investments").select("plan_id, status"),
    ]);
    setPlans((planRows ?? []) as Plan[]);
    const active: Record<string, number> = {};
    const total: Record<string, number> = {};
    (invRows ?? []).forEach((r) => {
      total[r.plan_id] = (total[r.plan_id] ?? 0) + 1;
      if (r.status === "active") active[r.plan_id] = (active[r.plan_id] ?? 0) + 1;
    });
    setActiveCounts(active);
    setTotalCounts(total);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function formFor(plan: Plan): Form {
    const d = drafts[plan.id] ?? {};
    return {
      name: d.name ?? plan.name,
      description: d.description ?? (plan.description ?? ""),
      min_amount: d.min_amount ?? String(plan.min_amount),
      max_amount: d.max_amount ?? String(plan.max_amount),
      roi_percent: d.roi_percent ?? String(plan.roi_percent),
      duration_days: d.duration_days ?? String(plan.duration_days),
    };
  }

  function setField(id: string, field: keyof Form, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function save(plan: Plan) {
    const form = formFor(plan);
    const err = validate(form);
    if (err) {
      setNotice({ id: plan.id, type: "error", text: err });
      return;
    }
    setSavingId(plan.id);
    setNotice(null);
    setPageNotice(null);

    const locked = (activeCounts[plan.id] ?? 0) > 0;
    const { error } = await supabase
      .from("investment_plans")
      .update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        min_amount: Number(form.min_amount),
        max_amount: Number(form.max_amount),
        roi_percent: Number(form.roi_percent),
        duration_days: locked ? plan.duration_days : Number(form.duration_days),
      })
      .eq("id", plan.id);

    setSavingId(null);
    if (error) {
      setNotice({ id: plan.id, type: "error", text: error.message });
      return;
    }
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[plan.id];
      return next;
    });
    setNotice({ id: plan.id, type: "success", text: "Saved. Investors will see this on their Plans page." });
    load();
  }

  async function toggleActive(plan: Plan) {
    setNotice(null);
    setPageNotice(null);
    const { error } = await supabase
      .from("investment_plans")
      .update({ is_active: !plan.is_active })
      .eq("id", plan.id);
    if (error) {
      setNotice({ id: plan.id, type: "error", text: error.message });
      return;
    }
    load();
  }

  async function deletePlan(plan: Plan) {
    setDeletingId(plan.id);
    setNotice(null);
    setPageNotice(null);
    const { error } = await supabase.rpc("delete_plan", { p_plan_id: plan.id });
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (error) {
      setNotice({ id: plan.id, type: "error", text: error.message });
      return;
    }
    setPageNotice({ type: "success", text: `"${plan.name}" was deleted.` });
    load();
  }

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(newForm);
    if (err) {
      setCreateMsg({ type: "error", text: err });
      return;
    }
    setCreating(true);
    setCreateMsg(null);
    const { error } = await supabase.from("investment_plans").insert({
      name: newForm.name.trim(),
      description: newForm.description.trim() || null,
      min_amount: Number(newForm.min_amount),
      max_amount: Number(newForm.max_amount),
      roi_percent: Number(newForm.roi_percent),
      duration_days: Number(newForm.duration_days),
    });
    setCreating(false);
    if (error) {
      setCreateMsg({ type: "error", text: error.message });
      return;
    }
    setNewForm(emptyForm);
    setCreateMsg({ type: "success", text: "Plan created." });
    load();
  }

  return (
    <main className="p-6 md:p-8 max-w-5xl">
      <p className="eyebrow mb-1">Plans</p>
      <h1 className="font-display text-3xl mb-4">Manage investment plans</h1>

      <div className="mb-6">
        <Alert kind="info">
          Edits apply to <strong>new</strong> investments only. Investments already running keep the return, amount and
          schedule they started with. The term is locked while a plan has active investments, and a plan can only be
          deleted if nobody has ever invested in it (hide it instead).
        </Alert>
      </div>

      {pageNotice && (
        <div className="mb-6">
          <Alert kind={pageNotice.type}>{pageNotice.text}</Alert>
        </div>
      )}

      {/* Add a plan */}
      <div className="card p-6 mb-8">
        <h2 className="font-display text-lg mb-4">Add a plan</h2>
        <form onSubmit={createPlan} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Min amount</label>
              <input type="number" step="0.01" className="input tabular" value={newForm.min_amount} onChange={(e) => setNewForm({ ...newForm, min_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Max amount</label>
              <input type="number" step="0.01" className="input tabular" value={newForm.max_amount} onChange={(e) => setNewForm({ ...newForm, max_amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Return %</label>
              <input type="number" step="0.01" className="input tabular" value={newForm.roi_percent} onChange={(e) => setNewForm({ ...newForm, roi_percent: e.target.value })} />
            </div>
            <div>
              <label className="label">Term (days)</label>
              <input type="number" className="input tabular" value={newForm.duration_days} onChange={(e) => setNewForm({ ...newForm, duration_days: e.target.value })} />
            </div>
          </div>
          {createMsg && <Alert kind={createMsg.type}>{createMsg.text}</Alert>}
          <Button type="submit" loading={creating} icon={<Plus size={14} />}>
            Create plan
          </Button>
        </form>
      </div>

      {/* Existing plans */}
      <h2 className="font-display text-lg mb-4">Existing plans</h2>
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-muted">No plans yet. Add your first one above.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {plans.map((plan) => {
            const form = formFor(plan);
            const locked = (activeCounts[plan.id] ?? 0) > 0;
            const hasHistory = (totalCounts[plan.id] ?? 0) > 0;
            const dirty = Object.keys(drafts[plan.id] ?? {}).length > 0;
            return (
              <div key={plan.id} className={`card p-5 ${plan.is_active ? "" : "opacity-70"}`}>
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-lg truncate">{plan.name}</p>
                    <p className="text-xs text-muted">
                      {formatMoney(Number(plan.min_amount))} – {formatMoney(Number(plan.max_amount))}
                      {" · "}
                      {activeCounts[plan.id] ?? 0} active investment{(activeCounts[plan.id] ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleActive(plan)}
                    className={`shrink-0 rounded-sm px-2.5 py-1 text-xs font-medium ${
                      plan.is_active ? "bg-pine-50 text-pine-600 hover:bg-pine-100" : "bg-line text-muted hover:bg-pine-50"
                    }`}
                  >
                    {plan.is_active ? "Visible · Hide" : "Hidden · Show"}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="label">Name</label>
                    <input className="input" value={form.name} onChange={(e) => setField(plan.id, "name", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input className="input" value={form.description} onChange={(e) => setField(plan.id, "description", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Min amount</label>
                      <input type="number" step="0.01" className="input tabular" value={form.min_amount} onChange={(e) => setField(plan.id, "min_amount", e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Max amount</label>
                      <input type="number" step="0.01" className="input tabular" value={form.max_amount} onChange={(e) => setField(plan.id, "max_amount", e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Return %</label>
                      <input type="number" step="0.01" className="input tabular" value={form.roi_percent} onChange={(e) => setField(plan.id, "roi_percent", e.target.value)} />
                    </div>
                    <div>
                      <label className="label flex items-center gap-1">
                        Term (days) {locked && <Lock size={11} className="text-muted" />}
                      </label>
                      <input
                        type="number"
                        className="input tabular disabled:opacity-60 disabled:cursor-not-allowed"
                        value={form.duration_days}
                        disabled={locked}
                        onChange={(e) => setField(plan.id, "duration_days", e.target.value)}
                      />
                    </div>
                  </div>
                  {locked && (
                    <p className="text-xs text-muted">
                      Term is locked because this plan has active investments. Hide the plan and create a new one to use a different term.
                    </p>
                  )}
                </div>

                {notice?.id === plan.id && (
                  <div className="mt-4">
                    <Alert kind={notice.type}>{notice.text}</Alert>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" onClick={() => save(plan)} loading={savingId === plan.id} disabled={!dirty}>
                    Save changes
                  </Button>
                  <Button
                    variant="danger"
                    icon={<Trash2 size={14} />}
                    disabled={hasHistory}
                    onClick={() => setConfirmDeleteId(plan.id)}
                    title={hasHistory ? "This plan has investment history, so it can't be deleted" : "Delete this plan"}
                  >
                    Delete
                  </Button>
                </div>

                {hasHistory && (
                  <p className="text-xs text-muted mt-2">
                    Can't be deleted: it has {totalCounts[plan.id]} investment{totalCounts[plan.id] === 1 ? "" : "s"} on record. Use Hide instead.
                  </p>
                )}

                {confirmDeleteId === plan.id && (
                  <div className="mt-3 rounded-md border border-clay/30 bg-red-50 p-3">
                    <p className="text-sm text-clay mb-3">Delete “{plan.name}” permanently? This can't be undone.</p>
                    <div className="flex gap-2">
                      <Button variant="danger" size="sm" loading={deletingId === plan.id} onClick={() => deletePlan(plan)}>
                        Yes, delete
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}