import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import WithdrawalTicker from "@/components/WithdrawalTicker";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  Wallet,
  TrendingUp,
  CalendarClock,
  Target,
  ArrowUpFromLine,
  ShieldAlert,
  ShieldCheck,
  PiggyBank,
  Receipt,
  Plus,
} from "lucide-react";

export default async function DashboardOverview() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: wallet }, { data: investments }, { data: transactions }, { data: profile }, { data: withdrawals }] = await Promise.all([
    supabase.from("wallets").select("balance").eq("user_id", user!.id).single(),
    supabase.from("investments").select("*, investment_plans(name)").eq("user_id", user!.id).eq("status", "active"),
    supabase.from("transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(6),
    supabase.from("profiles").select("full_name, kyc_status").eq("id", user!.id).single(),
    supabase.from("withdrawals").select("amount").eq("user_id", user!.id).eq("status", "approved"),
  ]);

  const activeInvested = (investments ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
  const expectedReturns = (investments ?? []).reduce((sum, i) => sum + Number(i.expected_return), 0);
  const dailyIncome = (investments ?? []).reduce((sum, i) => sum + Number(i.daily_payout ?? 0), 0);
  const totalWithdrawn = (withdrawals ?? []).reduce((sum, w) => sum + Number(w.amount), 0);
  const kycApproved = profile?.kyc_status === "approved";
  const kycPending = profile?.kyc_status === "pending";

  return (
    <>
      <WithdrawalTicker />
      <main className="p-6 md:p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="eyebrow mb-1">Overview</p>
            <h1 className="font-display text-3xl">Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"}</h1>
          </div>
        </div>

        {!kycApproved && (
          <Link href="/dashboard/kyc" className="block mb-6">
            <div className="flex items-center gap-3 rounded-md border border-gold-100 bg-gold-100/50 px-4 py-3 hover:bg-gold-100/70 transition-colors">
              {kycPending ? (
                <ShieldCheck size={18} className="text-gold-600 shrink-0" />
              ) : (
                <ShieldAlert size={18} className="text-gold-600 shrink-0" />
              )}
              <p className="text-sm font-medium text-gold-600 flex-1">
                {kycPending ? "Your verification is under review" : "Verify your identity to unlock withdrawals"}
              </p>
              <span className="text-xs font-medium text-gold-600 underline shrink-0">
                {kycPending ? "View status" : "Verify now"}
              </span>
            </div>
          </Link>
        )}

       <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
          <StatCard icon={Wallet} label="Wallet balance" value={formatMoney(Number(wallet?.balance ?? 0))} />
          <StatCard icon={TrendingUp} label="Active investments" value={formatMoney(activeInvested)} />
          <StatCard icon={PiggyBank} label="Daily income" value={formatMoney(dailyIncome)} tone="text-pine-600" />
          <StatCard icon={Target} label="Expected returns" value={formatMoney(expectedReturns)} tone="text-pine-600" />
          <StatCard icon={ArrowUpFromLine} label="Total withdrawn" value={formatMoney(totalWithdrawn)} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-lg">Active investments</h2>
              <Link href="/dashboard/plans" className="text-sm text-pine font-medium hover:text-pine-600 transition-colors">Invest more</Link>
            </div>
            {investments?.length ? (
              <div>
                {investments.map((inv: any) => (
                  <div key={inv.id} className="ledger-row">
                    <div>
                      <p className="text-sm font-medium">{inv.investment_plans?.name}</p>
                      <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <CalendarClock size={12} /> Matures {formatDate(inv.matures_at)}
                      </p>
                    </div>
                    <span className="tabular text-sm font-semibold">{formatMoney(Number(inv.amount))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No active investments yet"
                description="Pick a plan to start earning structured returns."
                action={
                  <Link href="/dashboard/plans">
                    <Button size="sm" icon={<Plus size={14} />}>Browse plans</Button>
                  </Link>
                }
              />
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-lg">Recent activity</h2>
              <Link href="/dashboard/wallet" className="text-sm text-pine font-medium hover:text-pine-600 transition-colors">Full history</Link>
            </div>
            {transactions?.length ? (
              <div>
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="ledger-row">
                    <div>
                      <p className="text-sm font-medium capitalize">{tx.type.replace("_", " ")}</p>
                      <p className="text-xs text-muted">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-sm font-semibold">{formatMoney(Number(tx.amount))}</p>
                      <Badge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                description="Fund your wallet to see activity appear here."
                action={
                  <Link href="/dashboard/wallet">
                    <Button size="sm" variant="secondary">Fund wallet</Button>
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}