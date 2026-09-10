"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney, formatDate } from "@/lib/utils";
import Badge from "@/components/Badge";

export default function AdminDepositsPage() {
  const supabase = createClient();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("deposits")
      .select("*, profiles!deposits_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    setDeposits(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    setBusyId(id);
    await supabase.rpc("approve_deposit", { deposit_id: id });
    setBusyId(null);
    load();
  }

  async function reject(id: string) {
    setBusyId(id);
    await supabase.rpc("reject_deposit", { deposit_id: id });
    setBusyId(null);
    load();
  }

  const pending = deposits.filter((d) => d.status === "pending");
  const reviewed = deposits.filter((d) => d.status !== "pending");

  return (
    <main className="p-8 max-w-5xl">
      <p className="eyebrow mb-1">Deposits</p>
      <h1 className="font-display text-3xl mb-8">Review deposit requests</h1>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="card p-6 mb-8">
            <h2 className="font-display text-lg mb-2">Pending ({pending.length})</h2>
            {pending.length ? pending.map((d) => (
              <div key={d.id} className="ledger-row">
                <div>
                  <p className="text-sm font-medium">{d.profiles?.full_name}</p>
                  <p className="text-xs text-muted">{d.profiles?.email} · Ref: {d.payment_reference} · {formatDate(d.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-sm font-semibold">{formatMoney(Number(d.amount))}</span>
                  <button disabled={busyId === d.id} onClick={() => approve(d.id)} className="btn-primary py-1.5 px-3 text-xs">Approve</button>
                  <button disabled={busyId === d.id} onClick={() => reject(d.id)} className="btn-danger py-1.5 px-3 text-xs">Reject</button>
                </div>
              </div>
            )) : <p className="text-sm text-muted py-6 text-center">No pending deposits.</p>}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg mb-2">History</h2>
            {reviewed.map((d) => (
              <div key={d.id} className="ledger-row">
                <div>
                  <p className="text-sm font-medium">{d.profiles?.full_name}</p>
                  <p className="text-xs text-muted">{formatDate(d.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm font-semibold">{formatMoney(Number(d.amount))}</p>
                  <Badge status={d.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
