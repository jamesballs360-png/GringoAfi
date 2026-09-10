"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";

const emptyForm = { name: "", description: "", min_amount: "", max_amount: "", roi_percent: "", duration_days: "" };

export default function AdminPlansPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("investment_plans").select("*").order("created_at", { ascending: false });
    setPlans(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("investment_plans").insert({
      name: form.name,
      description: form.description,
      min_amount: Number(form.min_amount),
      max_amount: Number(form.max_amount),
      roi_percent: Number(form.roi_percent),
      duration_days: Number(form.duration_days),
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm(emptyForm);
    load();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("investment_plans").update({ is_active: !current }).eq("id", id);
    load();
  }

  return (
    <main className="p-8 max-w-5xl">
      <p className="eyebrow mb-1">Plans</p>
      <h1 className="font-display text-3xl mb-8">Manage investment plans</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="font-display text-lg mb-4">Create a plan</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Min amount</label>
                <input type="number" step="0.01" className="input tabular" required value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} />
              </div>
              <div>
                <label className="label">Max amount</label>
                <input type="number" step="0.01" className="input tabular" required value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: e.target.value })} />
              </div>
              <div>
                <label className="label">ROI %</label>
                <input type="number" step="0.01" className="input tabular" required value={form.roi_percent} onChange={(e) => setForm({ ...form, roi_percent: e.target.value })} />
              </div>
              <div>
                <label className="label">Duration (days)</label>
                <input type="number" className="input tabular" required value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
              </div>
            </div>
            {error && <p className="text-sm text-clay">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
              {submitting ? "Creating…" : "Create plan"}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg mb-4">Existing plans</h2>
          {loading ? <p className="text-sm text-muted">Loading…</p> : plans.map((p) => (
            <div key={p.id} className="ledger-row">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted">{p.roi_percent}% · {p.duration_days}d · {formatMoney(Number(p.min_amount))}–{formatMoney(Number(p.max_amount))}</p>
              </div>
              <button onClick={() => toggleActive(p.id, p.is_active)}
                className={`text-xs font-medium ${p.is_active ? "text-clay" : "text-pine-600"}`}>
                {p.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
