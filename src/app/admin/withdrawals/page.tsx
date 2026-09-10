"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney, formatDate } from "@/lib/utils";
import Badge from "@/components/Badge";

export default function AdminWithdrawalsPage() {
  const supabase = createClient();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("withdrawals")
      .select("*, profiles!withdrawals_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    setWithdrawals(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    setBusyId(id);
    await supabase.rpc("approve_withdrawal", { withdrawal_id: id });
    setBusyId(null);
    load();
  }

  async function reject(id: string) {
    setBusyId(id);
    await supabase.rpc("reject_withdrawal", { withdrawal_id: id });
    setBusyId(null);
    load();
  }

  const pending = withdrawals.filter((w) => w.status === "pending");
  const reviewed = withdrawals.filter((w) => w.status !== "pending");

  return (
    <main className="p-8 max-w-5xl">
      <p className="eyebrow mb-1">Withdrawals</p>
      <h1 className="font-display text-3xl mb-8">Review withdrawal requests</h1>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="card p-6 mb-8">
            <h2 className="font-display text-lg mb-2">Pending ({pending.length})</h2>
            {pending.length ? pending.map((w) => (
              <div key={w.id} className="ledger-row">
                <div>
                  <p className="text-sm font-medium">{w.profiles?.full_name}</p>
                  <p className="text-xs text-muted">{w.payout_method} · {w.payout_account_name} · {w.payout_details} · {formatDate(w.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-sm font-semibold">{formatMoney(Number(w.amount))}</span>
                  <button disabled={busyId === w.id} onClick={() => approve(w.id)} className="btn-primary py-1.5 px-3 text-xs">Approve</button>
                  <button disabled={busyId === w.id} onClick={() => reject(w.id)} className="btn-danger py-1.5 px-3 text-xs">Reject</button>
                </div>
              </div>
            )) : <p className="text-sm text-muted py-6 text-center">No pending withdrawals.</p>}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg mb-2">History</h2>
            {reviewed.map((w) => (
              <div key={w.id} className="ledger-row">
                <div>
                  <p className="text-sm font-medium">{w.profiles?.full_name}</p>
                  <p className="text-xs text-muted">{formatDate(w.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm font-semibold">{formatMoney(Number(w.amount))}</p>
                  <Badge status={w.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}