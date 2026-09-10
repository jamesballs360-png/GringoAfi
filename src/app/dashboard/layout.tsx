import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard" },
  { href: "/dashboard/plans", label: "Investment plans", icon: "TrendingUp" },
  { href: "/dashboard/wallet", label: "Wallet", icon: "Wallet" },
  { href: "/dashboard/referrals", label: "Referrals", icon: "Users" },
  { href: "/dashboard/gifts", label: "Gifts", icon: "Gift" },
  { href: "/dashboard/kyc", label: "Verification", icon: "ShieldCheck" },
  { href: "/dashboard/profile", label: "Profile", icon: "UserCircle" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.is_suspended) redirect("/login");

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar
        items={navItems}
        base="/dashboard"
        title={profile?.full_name ?? "Investor"}
        avatarChoice={profile?.avatar_choice}
      />
      <div className="flex-1 pt-14 md:pt-0">{children}</div>
    </div>
  );
}