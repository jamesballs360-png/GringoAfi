"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LogOut, Menu, X,
  LayoutDashboard, TrendingUp, Wallet, Users, Gift, ShieldCheck, UserCircle,
  ArrowDownCircle, ArrowUpCircle, ListChecks, Settings,
  type LucideIcon,
} from "lucide-react";
import AvatarIcon from "./AvatarIcon";

// Icon components can't be passed as props from Server Components (the
// layout files) into this Client Component — only serializable data like
// strings can cross that boundary. So layouts pass an icon NAME string,
// and this map resolves it to the real icon, entirely on the client side.
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, TrendingUp, Wallet, Users, Gift, ShieldCheck, UserCircle,
  ArrowDownCircle, ArrowUpCircle, ListChecks, Settings,
};

type NavItem = { href: string; label: string; icon?: string };

export default function Sidebar({
  items,
  base,
  title,
  avatarChoice = "neutral",
}: {
  items: NavItem[];
  base: string;
  title: string;
  avatarChoice?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const icon = avatarChoice;

  const brandBlock = (
    <div>
      <Link href="/" className="font-display text-lg font-semibold text-gold-600 flex items-center gap-2">
        <AvatarIcon type={icon} size={22} />
        <span>GringoAfi</span>
      </Link>
      <p className="text-xs text-muted mt-0.5">{title}</p>
    </div>
  );

  const navLinks = (
    <>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon ? ICONS[item.icon] : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-pine-50 text-pine-600" : "text-muted hover:bg-pine-50 hover:text-ink"
              }`}
            >
              {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-pine" />}
              {Icon && <Icon size={16} strokeWidth={2} className={active ? "text-pine-600" : "text-muted"} />}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-line">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-red-50 hover:text-clay transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — visible below the md breakpoint only */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-panel border-b border-line">
        <Link href="/" className="font-display text-base font-semibold text-gold-600 flex items-center gap-1.5">
          <AvatarIcon type={icon} size={20} />
          <span>GringoAfi</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-pine-50 transition-colors"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Mobile drawer + backdrop — only rendered when open */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[80%] bg-panel h-full flex flex-col shadow-card-hover">
            <div className="flex items-center justify-between px-6 py-6 border-b border-line">
              {brandBlock}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-pine-50 transition-colors"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            {navLinks}
          </aside>
        </div>
      )}

      {/* Desktop sidebar — always visible at md breakpoint and above */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-line bg-panel min-h-screen flex-col">
        <div className="px-6 py-6 border-b border-line">
          {brandBlock}
        </div>
        {navLinks}
      </aside>
    </>
  );
}