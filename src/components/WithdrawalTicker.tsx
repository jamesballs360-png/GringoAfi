"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import { ArrowUpFromLine } from "lucide-react";

type WithdrawalRow = {
  id: string;
  masked_phone: string;
  amount: number;
  created_at: string;
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

export default function WithdrawalTicker() {
  const supabase = createClient();
  const [rows, setRows] = useState<WithdrawalRow[]>([]);

  async function load() {
    const { data, error } = await supabase.rpc("get_recent_withdrawals", { limit_count: 20 });
    if (!error && data) setRows(data as WithdrawalRow[]);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!rows.length) return null;

  // Repeat the list so even 1–2 withdrawals fill the strip, then double it for a seamless loop
  let base = [...rows];
  while (base.length < 8) base = [...base, ...rows];
  const looped = [...base, ...base];

  return (
    <div className="w-full overflow-hidden border-b border-line bg-panel py-3" aria-label="Recent withdrawals">
      <style>{`
        @keyframes withdrawal-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .withdrawal-marquee-track {
          animation: withdrawal-marquee 45s linear infinite;
        }
        .withdrawal-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="withdrawal-marquee-track flex gap-3 w-max">
        {looped.map((row, i) => (
          <div
            key={`${row.id}-${i}`}
            className="shrink-0 w-60 rounded-md border border-pine-100 bg-pine-50 px-4 py-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="tabular text-xs text-muted">{row.masked_phone}</p>
              <span className="w-5 h-5 rounded-full bg-pine-100 flex items-center justify-center">
                <ArrowUpFromLine size={11} className="text-pine-600" />
              </span>
            </div>
            <p className="tabular text-lg font-semibold text-pine-600">{formatMoney(Number(row.amount))}</p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[11px] font-medium text-gold-600">Withdrawn</span>
              <span className="text-[11px] text-muted">{timeAgo(row.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}