"use client";

import { useEffect, useState } from "react";

const ledgerSample = [
  { label: "Opening balance", value: "GHS 0.00", tone: "text-muted" },
  { label: "Deposit — approved", value: "+ GHS 2,000.00", tone: "text-pine-600" },
  { label: "Invested — Growth plan", value: "− GHS 2,000.00", tone: "text-clay" },
  { label: "Referral commission — Level 1", value: "+ GHS 100.00", tone: "text-pine-600" },
  { label: "ROI payout — Growth plan matured", value: "+ GHS 2,360.00", tone: "text-pine-600" },
];

const ACCENTS = ["#0F9D6D", "#E0A83E", "#3B82F6", "#A855F7", "#EC4899"];

export default function HeroStatementCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % ACCENTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const accent = ACCENTS[index];

  return (
    <div
      className="rounded-lg bg-panel overflow-hidden transition-shadow duration-1000"
      style={{ boxShadow: `0 1px 2px rgba(0,0,0,0.06), 0 16px 40px -12px ${accent}55` }}
    >
      <div
        className="flex items-center gap-1.5 px-4 py-2.5 border-b border-line transition-colors duration-1000"
        style={{ backgroundColor: `${accent}0D` }}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-clay/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-gold-400/60" />
        <span
          className="w-2.5 h-2.5 rounded-full transition-colors duration-1000"
          style={{ backgroundColor: accent }}
        />
        <span className="ml-2 text-xs text-muted">Account statement</span>
      </div>
      <div className="p-6">
        <div className="flex items-baseline justify-between mb-2">
          <span
            className="text-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-1000"
            style={{ color: accent }}
          >
            Sample statement
          </span>
          <span className="text-xs text-muted">Illustrative</span>
        </div>
        <div className="mb-4">
          <span className="tabular text-3xl font-semibold">GHS 2,460.00</span>
          <span className="ml-2 text-sm text-muted">current balance</span>
        </div>
        <div>
          {ledgerSample.map((row) => (
            <div key={row.label} className="ledger-row">
              <span className="text-sm text-muted">{row.label}</span>
              <span className={`tabular text-sm font-medium ${row.tone}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}