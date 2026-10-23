import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  tone = "text-ink",
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: string;
  icon?: LucideIcon;
}) {
  const length = value.length;
  const fontSize =
    length > 14 ? "1rem" :
    length > 11 ? "1.15rem" :
    length > 9 ? "1.35rem" :
    "1.5rem";

  return (
    <div className="card p-5 min-w-0 transition-shadow duration-200 hover:shadow-card-hover">
      <div className="flex items-center justify-between mb-2">
      <p className="text-xs uppercase tracking-wide text-muted leading-tight">{label}</p>
        {Icon && (
          <div className="w-7 h-7 rounded-md bg-pine-50 flex items-center justify-center shrink-0">
            <Icon size={14} strokeWidth={2} className="text-pine-400" />
          </div>
        )}
      </div>
      <p
        className={`tabular font-semibold ${tone} whitespace-nowrap overflow-hidden text-ellipsis`}
        style={{ fontSize }}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}