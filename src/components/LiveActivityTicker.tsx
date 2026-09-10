"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";

type ActivityRow = {
  id: string;
  masked_phone: string;
  type: string;
  amount: number;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  deposit: "Deposit",
  investment: "Investment",
  roi_payout: "Payout",
  daily_income: "Daily Income",
  referral_commission: "Referral Bonus",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function LiveActivityTicker() {
  const supabase = createClient();
  const [rows, setRows] = useState<ActivityRow[]>([]);

  async function load() {
    const { data, error } = await supabase.rpc("get_activity_feed", { limit_count: 20 });
    if (!error && data) setRows(data as ActivityRow[]);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!rows.length) return null;

  const looped = [...rows, ...rows];

  return (
    <div className="w-full overflow-hidden bg-ink py-3">
      <div className="flex gap-3 animate-marquee w-max">
        {looped.map((row, i) => (
          <div
            key={`${row.id}-${i}`}
            className="shrink-0 w-56 rounded-md bg-[#1B2F27] px-4 py-3 border border-white/5"
          >
            <p className="text-xs text-white/70 mb-1">{row.masked_phone}</p>
            <p className="tabular text-lg font-semibold text-pine-400 mb-0.5">
              {formatMoney(Number(row.amount))}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gold-100/80">{TYPE_LABELS[row.type] ?? row.type}</span>
              <span className="text-[11px] text-white/40">{timeAgo(row.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}