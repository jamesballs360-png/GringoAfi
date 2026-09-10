"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";

export default function InvestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [plan, setPlan] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const [{ data: planData }, { data: wallet }] = await Promise.all([
        supabase.from("investment_plans").select("*").eq("id", id).single(),
        supabase.from("wallets").select("balance").eq("user_id", user!.id).single(),
      ]);
      setPlan(planData);
      setBalance(Number(wallet?.balance ?? 0));
      setAmount(planData ? String(planData.min_amount) : "");
      setLoading(false);
    }
    load();
  }, [id]);

  const numericAmount = Number(amount) || 0;
  const projectedProfit = plan ? (numericAmount * plan.roi_percent) / 100 : 0;
  const projectedDaily = plan ? projectedProfit / plan.duration_days : 0;
  const belowMin = plan ? numericAmount > 0 && numericAmount < Number(plan.min_amount) : false;
  const aboveMax = plan ? numericAmount > Number(plan.max_amount) : false;
  const outOfRange = belowMin || aboveMax;

  async function handleInvest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("invest_in_plan", {
      p_plan_id: id,
      p_amount: numericAmount,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (loading) return <main className="p-8 max-w-2xl text-sm text-muted">Loading plan…</main>;
  if (!plan) return <main className="p-8 max-w-2xl text-sm text-muted">Plan not found.</main>;

  return (
    <main className="p-8 max-w-2xl">
      <Link href="/dashboard/plans" className="text-sm text-pine font-medium">← Back to plans</Link>
      <p className="eyebrow mt-4 mb-1">Invest</p>
      <h1 className="font-display text-3xl mb-8">{plan.name}</h1>

      <div className="card p-6 mb-6">
        <div className="ledger-row"><span className="text-sm text-muted">Wallet balance</span><span className="tabular font-semibold">{formatMoney(balance)}</span></div>
        <div className="ledger-row"><span className="text-sm text-muted">Return rate</span><span className="tabular font-semibold text-pine-600">{plan.roi_percent}%</span></div>
        <div className="ledger-row"><span className="text-sm text-muted">Term</span><span className="tabular font-semibold">{plan.duration_days} days</span></div>
        <div className="ledger-row"><span className="text-sm text-muted">Min / Max</span><span className="tabular text-sm">{formatMoney(Number(plan.min_amount))} – {formatMoney(Number(plan.max_amount))}</span></div>
      </div>

      {success ? (
        <div className="card p-6 text-center">
          <p className="text-pine-600 font-medium">Investment placed. Redirecting to your dashboard…</p>
        </div>
      ) : (
        <form onSubmit={handleInvest} className="card p-6 space-y-4">
          <div>
            <label className="label" htmlFor="amount">Amount to invest</label>
            <input
              id="amount" type="number" className="input tabular" required
              min={plan.min_amount} max={plan.max_amount} step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="rounded-md bg-pine-50 p-4">
            <p className="text-xs text-muted mb-1">Projected return over {plan.duration_days} days</p>
            <p className="tabular text-2xl font-semibold text-pine-600">{formatMoney(projectedProfit)}</p>
            <p className="text-xs text-muted mt-2">≈ {formatMoney(projectedDaily)} credited to your wallet daily, plus your {formatMoney(numericAmount)} capital back at maturity</p>
          </div>

          {error && <p className="text-sm text-clay">{error}</p>}
          {outOfRange && (
            <p className="text-sm text-clay">
              {belowMin
                ? `Minimum for this plan is ${formatMoney(Number(plan.min_amount))}.`
                : `Maximum for this plan is ${formatMoney(Number(plan.max_amount))}.`}
            </p>
          )}
          {numericAmount > balance && (
            <p className="text-sm text-clay">Amount exceeds your wallet balance. <Link href="/dashboard/wallet" className="underline">Fund your wallet</Link>.</p>
          )}

          <button type="submit" disabled={submitting || numericAmount > balance || outOfRange || numericAmount <= 0} className="btn-primary w-full py-3">
            {submitting ? "Placing investment…" : "Confirm investment"}
          </button>
        </form>
      )}
    </main>
  );
}