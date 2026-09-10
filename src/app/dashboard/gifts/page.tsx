"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney, formatDate } from "@/lib/utils";

export default function GiftsPage() {
  const supabase = createClient();
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);
  const [nextSpinAt, setNextSpinAt] = useState<Date | null>(null);

  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("gifts")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setGifts(data ?? []);

    const lastSpin = (data ?? []).find((g) => g.source === "spin");
    if (lastSpin) {
      const next = new Date(new Date(lastSpin.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
      setNextSpinAt(next > new Date() ? next : null);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const total = gifts.reduce((sum, g) => sum + Number(g.amount), 0);
  const canSpin = !nextSpinAt;

  async function handleSpin() {
    setSpinning(true);
    setSpinError(null);
    setSpinResult(null);

    // purely cosmetic delay so the spin feels like a spin, not an instant fetch
    const [result] = await Promise.all([
      supabase.rpc("claim_weekly_spin"),
      new Promise((resolve) => setTimeout(resolve, 1600)),
    ]);

    setSpinning(false);

    if (result.error) {
      setSpinError(result.error.message);
      return;
    }
    setSpinResult(Number(result.data));
    load();
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    setRedeeming(true);
    setRedeemMessage(null);

    const { data, error } = await supabase.rpc("redeem_code", { p_code: code });

    setRedeeming(false);
    if (error) {
      setRedeemMessage({ type: "err", text: error.message });
    } else {
      setRedeemMessage({ type: "ok", text: `Code redeemed — ${formatMoney(Number(data))} added to your wallet.` });
      setCode("");
      load();
    }
  }

  return (
    <main className="p-8 max-w-3xl">
      <p className="eyebrow mb-1">Gifts</p>
      <h1 className="font-display text-3xl mb-8">Bonuses you've received</h1>

      <div className="card p-6 mb-6">
        <p className="text-xs text-muted mb-1">Total gifted</p>
        <p className="tabular text-3xl font-semibold text-pine-600">{formatMoney(total)}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Weekly spin */}
        <div className="card p-6 text-center">
          <h2 className="font-display text-lg mb-4">Weekly spin</h2>

          <div
            className={`mx-auto mb-4 w-24 h-24 rounded-full border-4 border-pine flex items-center justify-center text-2xl font-display font-semibold text-pine-600 ${
              spinning ? "animate-spin" : ""
            }`}
          >
            {spinning ? "🎡" : spinResult !== null ? formatMoney(spinResult) : "GH₵?"}
          </div>

          {canSpin ? (
            <button onClick={handleSpin} disabled={spinning} className="btn-primary px-6">
              {spinning ? "Spinning…" : "Spin now"}
            </button>
          ) : (
            <p className="text-xs text-muted">
              Next spin available {nextSpinAt?.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          )}

          {spinError && <p className="text-xs text-clay mt-3">{spinError}</p>}
          {spinResult !== null && !spinning && (
            <p className="text-sm text-pine-600 font-medium mt-3">You won {formatMoney(spinResult)}!</p>
          )}
        </div>

        {/* Redeem a code */}
        <div className="card p-6">
          <h2 className="font-display text-lg mb-4">Redeem a code</h2>
          <form onSubmit={handleRedeem} className="space-y-3">
            <input
              className="input tabular uppercase"
              placeholder="e.g. 8F2K9C1A"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
            <button type="submit" disabled={redeeming || !code} className="btn-primary w-full">
              {redeeming ? "Redeeming…" : "Redeem"}
            </button>
            {redeemMessage && (
              <p className={`text-sm ${redeemMessage.type === "ok" ? "text-pine-600" : "text-clay"}`}>{redeemMessage.text}</p>
            )}
          </form>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-2">History</h2>
        {loading ? (
          <p className="text-sm text-muted py-8 text-center">Loading…</p>
        ) : gifts.length ? (
          gifts.map((g) => (
            <div key={g.id} className="ledger-row">
              <div>
                <p className="text-sm font-medium">{g.note || "Bonus"}</p>
                <p className="text-xs text-muted">{formatDate(g.created_at)}</p>
              </div>
              <span className="tabular text-sm font-semibold text-pine-600">+{formatMoney(Number(g.amount))}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted py-8 text-center">You haven't received any gifts yet.</p>
        )}
      </div>
    </main>
  );
}
