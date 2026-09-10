"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatMoney, formatDate } from "@/lib/utils";
import Badge from "@/components/Badge";
import { AlertTriangle, ArrowUpDown, Download } from "lucide-react";

type SortKey = "balance" | "invested" | "withdrawn" | "deposited" | null;

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDesc, setSortDesc] = useState(true);

  async function load() {
    const [{ data: profiles }, { data: wallets }, { data: investments }, { data: deposits }, { data: withdrawals }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("wallets").select("user_id, balance"),
      supabase.from("investments").select("user_id, amount"),
      supabase.from("deposits").select("user_id, amount").eq("status", "approved"),
      supabase.from("withdrawals").select("user_id, amount").eq("status", "approved"),
    ]);

    const balanceMap: Record<string, number> = {};
    (wallets ?? []).forEach((w) => { balanceMap[w.user_id] = Number(w.balance); });

    const investedMap: Record<string, number> = {};
    (investments ?? []).forEach((i) => { investedMap[i.user_id] = (investedMap[i.user_id] ?? 0) + Number(i.amount); });

    const depositedMap: Record<string, number> = {};
    (deposits ?? []).forEach((d) => { depositedMap[d.user_id] = (depositedMap[d.user_id] ?? 0) + Number(d.amount); });

    const withdrawnMap: Record<string, number> = {};
    (withdrawals ?? []).forEach((w) => { withdrawnMap[w.user_id] = (withdrawnMap[w.user_id] ?? 0) + Number(w.amount); });

    const merged = (profiles ?? []).map((p) => ({
      ...p,
      balance: balanceMap[p.id] ?? 0,
      invested: investedMap[p.id] ?? 0,
      deposited: depositedMap[p.id] ?? 0,
      withdrawn: withdrawnMap[p.id] ?? 0,
    }));

    setUsers(merged);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleSuspend(id: string, current: boolean) {
    await supabase.from("profiles").update({ is_suspended: !current }).eq("id", id);
    load();
  }

  async function changeRole(id: string, role: string) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    load();
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  const filtered = useMemo(() => {
    let result = users.filter((u) =>
      `${u.full_name} ${u.email} ${u.phone}`.toLowerCase().includes(query.toLowerCase())
    );
    if (sortKey) {
      result = [...result].sort((a, b) => (sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]));
    }
    return result;
  }, [users, query, sortKey, sortDesc]);

  function exportCsv() {
    const headers = ["Name", "Email", "Phone", "Role", "KYC", "Wallet balance", "Total invested", "Total deposited", "Total withdrawn", "Joined"];
    const rows = filtered.map((u) => [
      u.full_name, u.email, u.phone, u.role, u.kyc_status,
      u.balance.toFixed(2), u.invested.toFixed(2), u.deposited.toFixed(2), u.withdrawn.toFixed(2),
      formatDate(u.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gringoafi-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function SortHeader({ label, sortField }: { label: string; sortField: SortKey }) {
    return (
      <button
        onClick={() => toggleSort(sortField)}
        className="flex items-center gap-1 font-medium hover:text-pine-600 transition-colors"
      >
        {label} <ArrowUpDown size={12} className={sortKey === sortField ? "text-pine-600" : "text-muted"} />
      </button>
    );
  }

  return (
    <main className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="eyebrow mb-1">Users</p>
          <h1 className="font-display text-3xl">Manage users</h1>
        </div>
        <button onClick={exportCsv} className="btn-secondary text-sm flex items-center gap-1.5">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <input className="input max-w-xs mb-6" placeholder="Search by name, email, phone…"
        value={query} onChange={(e) => setQuery(e.target.value)} />

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-muted">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted border-b border-line">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">KYC</th>
                <th className="p-4"><SortHeader label="Wallet" sortField="balance" /></th>
                <th className="p-4"><SortHeader label="Invested" sortField="invested" /></th>
                <th className="p-4"><SortHeader label="Deposited" sortField="deposited" /></th>
                <th className="p-4"><SortHeader label="Withdrawn" sortField="withdrawn" /></th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const flagged = u.withdrawn > u.deposited && u.deposited > 0;
                return (
                  <tr key={u.id} className="border-b border-line last:border-none hover:bg-pine-50/40">
                    <td className="p-4 font-medium">
                      <Link href={`/admin/users/${u.id}`} className="hover:text-pine-600 transition-colors flex items-center gap-1.5">
                        {u.full_name}
                        {flagged && <AlertTriangle size={13} className="text-gold-600" titleAccess="Withdrawn more than deposited" />}
                      </Link>
                    </td>
                    <td className="p-4 text-muted">{u.email}<br />{u.phone}</td>
                    <td className="p-4">
                      <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="input py-1.5 text-xs">
                        <option value="investor">Investor</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4"><Badge status={u.kyc_status} /></td>
                    <td className="p-4 tabular font-semibold">{formatMoney(u.balance)}</td>
                    <td className="p-4 tabular">{formatMoney(u.invested)}</td>
                    <td className="p-4 tabular">{formatMoney(u.deposited)}</td>
                    <td className="p-4 tabular">{formatMoney(u.withdrawn)}</td>
                    <td className="p-4">
                      <button onClick={() => toggleSuspend(u.id, u.is_suspended)}
                        className={`text-xs font-medium ${u.is_suspended ? "text-pine-600" : "text-clay"}`}>
                        {u.is_suspended ? "Reactivate" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}