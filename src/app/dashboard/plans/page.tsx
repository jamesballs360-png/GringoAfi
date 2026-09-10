import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";

export default async function PlansPage() {
  const supabase = createClient();
  const { data: plans } = await supabase
    .from("investment_plans")
    .select("*")
    .eq("is_active", true)
    .order("min_amount", { ascending: true });

  return (
    <main className="p-8 max-w-5xl">
      <p className="eyebrow mb-1">Plans</p>
      <h1 className="font-display text-3xl mb-8">Choose an investment plan</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {plans?.map((plan, i) => (
          <div key={plan.id} className="card p-6 flex flex-col">
                        <span className="tabular text-xs text-muted">Level {i + 1}</span>
            <h2 className="font-display text-xl mt-2 mb-1">{plan.name}</h2>
            <p className="text-sm text-muted mb-6 flex-1">{plan.description}</p>
            <div className="ledger-row">
              <span className="text-sm text-muted">Return</span>
              <span className="tabular font-semibold text-pine-600">{plan.roi_percent}%</span>
            </div>
            <div className="ledger-row">
              <span className="text-sm text-muted">Term</span>
              <span className="tabular font-semibold">{plan.duration_days} days</span>
            </div>
            <div className="ledger-row">
              <span className="text-sm text-muted">Range</span>
              <span className="tabular text-sm">{formatMoney(Number(plan.min_amount))} – {formatMoney(Number(plan.max_amount))}</span>
            </div>
            <Link href={`/dashboard/invest/${plan.id}`} className="btn-primary mt-4">Invest now</Link>
          </div>
        ))}
      </div>

      {!plans?.length && (
        <p className="text-sm text-muted py-12 text-center">No plans are open right now — check back soon.</p>
      )}
    </main>
  );
}
