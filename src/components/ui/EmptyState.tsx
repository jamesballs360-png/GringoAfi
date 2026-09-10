import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-12 h-12 rounded-full bg-pine-50 flex items-center justify-center mb-4">
        <Icon size={22} className="text-pine-400" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink mb-1">{title}</p>
      {description && <p className="text-sm text-muted max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}