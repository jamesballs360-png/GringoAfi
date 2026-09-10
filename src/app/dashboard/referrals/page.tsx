"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney, formatDate } from "@/lib/utils";

export default function ReferralsPage() {
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [levels, setLevels] = useState<{ level: number; count: number; percent: number }[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      const [{ data: profile }, { data: referrals }, { data: rates }, { data: tx }] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", user!.id).single(),
        supabase.from("referrals").select("level").eq("referrer_id", user!.id),
        supabase.from("referral_levels").select("*").order("level"),
        supabase.from("transactions").select("*").eq("user_id", user!.id).eq("type", "referral_commission").order("created_at", { ascending: false }),
      ]);

      setCode(profile?.referral_code ?? "");

      const counts: Record<number, number> = {};
      (referrals ?? []).forEach((r) => { counts[r.level] = (counts[r.level] ?? 0) + 1; });
      setLevels((rates ?? []).map((r) => ({ level: r.level, percent: Number(r.percent), count: counts[r.level] ?? 0 })));

      setCommissions(tx ?? []);
      setTotalEarned((tx ?? []).reduce((sum, t) => sum + Number(t.amount), 0));
      setLoading(false);
    }
    load();
  }, []);

  const link = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${code}` : "";

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <main className="p-8 text-sm text-muted">Loading…</main>;

  return (
    <main className="p-8 max-w-4xl">
      <p className="eyebrow mb-1">Referrals</p>
      <h1 className="font-display text-3xl mb-8">Earn by referring investors</h1>

      <div className="card p-6 mb-6">
        <p className="text-xs text-muted mb-2">Your referral code</p>
        <p className="tabular text-2xl font-semibold mb-4">{code}</p>
        <div className="flex gap-2">
          <input readOnly value={link} className="input tabular text-xs" />
          <button onClick={copyLink} className="btn-secondary shrink-0">{copied ? "Copied" : "Copy link"}</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="font-display text-lg mb-4">Your network</h2>
          {levels.map((l) => (
            <div key={l.level} className="ledger-row">
              <span className="text-sm text-muted">Level {l.level} · {l.percent}% commission</span>
              <span className="tabular font-semibold">{l.count} {l.count === 1 ? "person" : "people"}</span>
            </div>
          ))}
        </div>
        <div className="card p-6">
          <h2 className="font-display text-lg mb-4">Total earned</h2>
          <p className="tabular text-3xl font-semibold text-pine-600">{formatMoney(totalEarned)}</p>
          <p className="text-xs text-muted mt-2">Paid straight into your wallet when referred investors fund a plan.</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-2">Commission history</h2>
        {commissions.length ? (
          commissions.map((c) => (
            <div key={c.id} className="ledger-row">
              <div>
                <p className="text-sm font-medium">{c.note}</p>
                <p className="text-xs text-muted">{formatDate(c.created_at)}</p>
              </div>
              <span className="tabular text-sm font-semibold text-pine-600">+ {formatMoney(Number(c.amount))}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted py-8 text-center">No commissions yet — share your link to start earning.</p>
        )}
      </div>
    </main>
  );
}
