import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import LiveActivityTicker from "@/components/LiveActivityTicker";

export default async function AdminOverview() {
  const supabase = createClient();

  const [
    { count: userCount },
    { data: invested },
    { count: pendingDeposits },
    { count: pendingWithdrawals },
    { count: pendingKyc },
    { data: approvedDeposits },
    { data: approvedWithdrawals },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("investments").select("amount"),
    supabase.from("deposits").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("kyc_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("deposits").select("amount").eq("status", "approved"),
    supabase.from("withdrawals").select("amount").eq("status", "approved"),
  ]);

  const totalInvested = (invested ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
  const totalDeposited = (approvedDeposits ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  const totalWithdrawn = (approvedWithdrawals ?? []).reduce((sum, w) => sum + Number(w.amount), 0);

  return (
    <>
      <LiveActivityTicker />
      <main className="p-6 md:p-8 max-w-5xl">
        <p className="eyebrow mb-1">Overview</p>
        <h1 className="font-display text-3xl mb-8">Platform summary</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <StatCard label="Total users" value={String(userCount ?? 0)} />
          <StatCard label="Total invested" value={formatMoney(totalInvested)} />
          <StatCard label="Pending KYC" value={String(pendingKyc ?? 0)} tone={pendingKyc ? "text-gold-600" : "text-ink"} />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total deposited" value={formatMoney(totalDeposited)} tone="text-pine-600" />
          <StatCard label="Total withdrawn" value={formatMoney(totalWithdrawn)} />
          <StatCard label="Pending deposits" value={String(pendingDeposits ?? 0)} tone={pendingDeposits ? "text-gold-600" : "text-ink"} />
          <StatCard label="Pending withdrawals" value={String(pendingWithdrawals ?? 0)} tone={pendingWithdrawals ? "text-gold-600" : "text-ink"} />
        </div>
      </main>
    </>
  );
}
