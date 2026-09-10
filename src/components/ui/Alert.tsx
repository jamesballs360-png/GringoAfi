import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { ReactNode } from "react";

type Kind = "success" | "error" | "warning" | "info";

const styles: Record<Kind, { bg: string; text: string; icon: typeof Info }> = {
  success: { bg: "bg-pine-50 border-pine-100", text: "text-pine-600", icon: CheckCircle2 },
  error: { bg: "bg-red-50 border-clay/20", text: "text-clay", icon: AlertCircle },
  warning: { bg: "bg-gold-100/60 border-gold-100", text: "text-gold-600", icon: AlertTriangle },
  info: { bg: "bg-pine-50 border-pine-100", text: "text-pine-600", icon: Info },
};

export default function Alert({ kind = "info", children }: { kind?: Kind; children: ReactNode }) {
  const s = styles[kind];
  const Icon = s.icon;
  return (
    <div className={`flex items-start gap-2.5 rounded-md border p-3 text-sm ${s.bg} ${s.text}`}>
      <Icon size={16} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}