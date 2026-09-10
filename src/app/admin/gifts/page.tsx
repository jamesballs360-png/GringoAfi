"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney, formatDate } from "@/lib/utils";

export default function AdminGiftsPage() {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [gifts, setGifts] = useState<any[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(true);

  const [codeAmount, setCodeAmount] = useState("");
  const [codeMaxUses, setCodeMaxUses] = useState("1");
  const [codeExpiresDays, setCodeExpiresDays] = useState("");
  const [generating, setGenerating] = useState(false);
  const [codeMessage, setCodeMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);

  async function loadGifts() {
    const { data } = await supabase
      .from("gifts")
      .select("*, profiles!gifts_user_id_fkey(full_name, phone)")
      .order("created_at", { ascending: false })
      .limit(30);
    setGifts(data ?? []);
    setLoadingGifts(false);
  }

  async function loadCodes() {
    const { data } = await supabase
      .from("redemption_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setCodes(data ?? []);
    setLoadingCodes(false);
  }

  useEffect(() => { loadGifts(); loadCodes(); }, []);

  async function searchUsers(q: string) {
    setQuery(q);
    setSelectedUser(null);
    if (q.trim().length < 2) {
      setUsers([]);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, email")
      .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(8);
    setUsers(data ?? []);
  }

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setMessage(null);

    const { error } = await supabase.rpc("grant_gift", {
      p_user_id: selectedUser.id,
      p_amount: Number(amount),
      p_note: note || null,
    });

    setSubmitting(false);
    if (error) {
      setMessage({ type: "err", text: error.message });
    } else {
      setMessage({ type: "ok", text: `Gift of ${formatMoney(Number(amount))} sent to ${selectedUser.full_name}.` });
      setAmount(""); setNote(""); setSelectedUser(null); setQuery(""); setUsers([]);
      loadGifts();
    }
  }

  async function handleGenerateCode(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setCodeMessage(null);

    const { data, error } = await supabase.rpc("generate_code", {
      p_amount: Number(codeAmount),
      p_max_uses: Number(codeMaxUses) || 1,
      p_expires_days: codeExpiresDays ? Number(codeExpiresDays) : null,
    });

    setGenerating(false);
    if (error) {
      setCodeMessage({ type: "err", text: error.message });
    } else {
      setCodeMessage({ type: "ok", text: `Code generated: ${data}` });
      setCodeAmount(""); setCodeMaxUses("1"); setCodeExpiresDays("");
      loadCodes();
    }
  }

  return (
    <main className="p-8 max-w-5xl">
      <p className="eyebrow mb-1">Gifts</p>
      <h1 className="font-display text-3xl mb-8">Grant bonuses & codes</h1>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="card p-6">
          <h2 className="font-display text-lg mb-4">Send a direct gift</h2>
          <form onSubmit={handleGrant} className="space-y-4">
            <div>
              <label className="label" htmlFor="search">Find investor</label>
              <input
                id="search" className="input" placeholder="Search by name, phone, or email"
                value={query} onChange={(e) => searchUsers(e.target.value)}
              />
              {users.length > 0 && !selectedUser && (
                <div className="mt-2 rounded-md border border-line overflow-hidden">
                  {users.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setUsers([]); setQuery(u.full_name); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-pine-50 border-b border-line last:border-none"
                    >
                      <p className="font-medium">{u.full_name}</p>
                      <p className="text-xs text-muted">{u.phone} · {u.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedUser && (
              <div className="rounded-md bg-pine-50 p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{selectedUser.full_name}</p>
                  <p className="text-xs text-muted">{selectedUser.phone}</p>
                </div>
                <button type="button" onClick={() => { setSelectedUser(null); setQuery(""); }} className="text-xs text-clay">Change</button>
              </div>
            )}

            <div>
              <label className="label" htmlFor="amount">Amount</label>
              <input id="amount" type="number" step="0.01" min="0.01" className="input tabular" required
                value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="note">Reason (optional)</label>
              <input id="note" className="input" placeholder="e.g. Referral milestone bonus"
                value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {message && (
              <p className={`text-sm ${message.type === "ok" ? "text-pine-600" : "text-clay"}`}>{message.text}</p>
            )}

            <button type="submit" disabled={submitting || !selectedUser} className="btn-primary w-full py-2.5">
              {submitting ? "Sending…" : "Send gift"}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg mb-4">Generate a redemption code</h2>
          <form onSubmit={handleGenerateCode} className="space-y-4">
            <div>
              <label className="label" htmlFor="code-amount">Amount</label>
              <input id="code-amount" type="number" step="0.01" min="0.01" className="input tabular" required
                value={codeAmount} onChange={(e) => setCodeAmount(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="code-uses">Max uses</label>
                <input id="code-uses" type="number" min="1" className="input tabular"
                  value={codeMaxUses} onChange={(e) => setCodeMaxUses(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="code-expiry">Expires in (days)</label>
                <input id="code-expiry" type="number" min="1" className="input tabular" placeholder="Never"
                  value={codeExpiresDays} onChange={(e) => setCodeExpiresDays(e.target.value)} />
              </div>
            </div>

            {codeMessage && (
              <p className={`text-sm break-all ${codeMessage.type === "ok" ? "text-pine-600" : "text-clay"}`}>{codeMessage.text}</p>
            )}

            <button type="submit" disabled={generating} className="btn-primary w-full py-2.5">
              {generating ? "Generating…" : "Generate code"}
            </button>
          </form>

          <h3 className="font-display text-base mt-6 mb-2">Recent codes</h3>
          {loadingCodes ? (
            <p className="text-sm text-muted py-4 text-center">Loading…</p>
          ) : codes.length ? (
            <div className="max-h-56 overflow-y-auto">
              {codes.map((c) => (
                <div key={c.id} className="ledger-row">
                  <div>
                    <p className="tabular text-sm font-semibold">{c.code}</p>
                    <p className="text-xs text-muted">{c.times_used}/{c.max_uses} used · {formatDate(c.created_at)}</p>
                  </div>
                  <span className="tabular text-sm font-semibold text-pine-600">{formatMoney(Number(c.amount))}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted py-4 text-center">No codes generated yet.</p>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-2">Recent gifts</h2>
        {loadingGifts ? (
          <p className="text-sm text-muted py-8 text-center">Loading…</p>
        ) : gifts.length ? (
          <div className="max-h-[420px] overflow-y-auto">
            {gifts.map((g) => (
              <div key={g.id} className="ledger-row">
                <div>
                  <p className="text-sm font-medium">{g.profiles?.full_name}</p>
                  <p className="text-xs text-muted">{g.note || "No reason given"} · {formatDate(g.created_at)}</p>
                </div>
                <span className="tabular text-sm font-semibold text-pine-600">+{formatMoney(Number(g.amount))}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted py-8 text-center">No gifts sent yet.</p>
        )}
      </div>
    </main>
  );
}