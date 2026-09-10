"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatMoney, formatDate } from "@/lib/utils";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import { ArrowLeft, Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [referralCounts, setReferralCounts] = useState<{ level: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { data: profileData },
        { data: walletData },
        { data: investmentData },
        { data: txData },
        { data: referralData },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("wallets").select("balance").eq("user_id", id).single(),
        supabase.from("investments").select("*, investment_plans(name)").eq("user_id", id).order("started_at", { ascending: false }),
        supabase.from("transactions").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
        supabase.from("referrals").select("level").eq("referrer_id", id),
      ]);

      setProfile(profileData);
      setWallet(walletData);
      setInvestments(investmentData ?? []);
      setTransactions(txData ?? []);

      const counts: Record<number, number> = {};
      (referralData ?? []).forEach((r) => { counts[r.level] = (counts[r.level] ?? 0) + 1; });
      setReferralCounts(Object.entries(counts).map(([level, count]) => ({ level: Number(level), count })));

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <main className="p-8 text-sm text-muted">Loading…</main>;
  if (!profile) return <main className="p-8 text-sm text-muted">User not found.</main>;

  const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalDeposited = transactions.filter((t) => t.type === "deposit" && t.status === "completed").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalWithdrawn = transactions.filter((t) => t.type === "withdrawal" && t.status === "completed").reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <main className="p-8 max-w-5xl">
      <Link href="/admin/users" className="text-sm text-pine font-medium flex items-center gap-1.5 mb-4">
        <ArrowLeft size={14} /> Back to users
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="eyebrow mb-1">Investor</p>
          <h1 className="font-display text-3xl">{profile.full_name}</h1>
          <p className="text-sm text-muted mt-1">{profile.email} · {profile.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={profile.kyc_status} />
          <Badge status={profile.role} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Wallet} label="Wallet balance" value={formatMoney(Number(wallet?.balance ?? 0))} />
        <StatCard icon={TrendingUp} label="Total invested (lifetime)" value={formatMoney(totalInvested)} />
        <StatCard icon={ArrowDownToLine} label="Total deposited" value={formatMoney(totalDeposited)} tone="text-pine-600" />
        <StatCard icon={ArrowUpFromLine} label="Total withdrawn" value={formatMoney(totalWithdrawn)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h2 className="font-display text-lg mb-2">Active & past investments</h2>
          {investments.length ? (
            <div className="max-h-80 overflow-y-auto">
              {investments.map((inv) => (
                <div key={inv.id} className="ledger-row">
                  <div>
                    <p className="text-sm font-medium">{inv.investment_plans?.name}</p>
                    <p className="text-xs text-muted">Started {formatDate(inv.started_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-semibold">{formatMoney(Number(inv.amount))}</p>
                    <Badge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted py-8 text-center">No investments yet.</p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg mb-2">Referral network</h2>
          {referralCounts.length ? (
            referralCounts.map((r) => (
              <div key={r.level} className="ledger-row">
                <span className="text-sm text-muted">Level {r.level}</span>
                <span className="tabular font-semibold">{r.count} {r.count === 1 ? "person" : "people"}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted py-8 text-center">Hasn't referred anyone yet.</p>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-2">Full transaction history</h2>
        {transactions.length ? (
          <div className="max-h-96 overflow-y-auto">
            {transactions.map((tx) => (
              <div key={tx.id} className="ledger-row">
                <div>
                  <p className="text-sm font-medium capitalize">{tx.type.replace("_", " ")}</p>
                  <p className="text-xs text-muted">{formatDate(tx.created_at)}{tx.note ? ` · ${tx.note}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="tabular text-sm font-semibold">{formatMoney(Number(tx.amount))}</p>
                  <Badge status={tx.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted py-8 text-center">No transactions yet.</p>
        )}
      </div>
    </main>
  );
}