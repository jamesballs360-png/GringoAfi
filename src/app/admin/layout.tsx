import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

const navItems = [
  { href: "/admin", label: "Overview", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "Users", icon: "Users" },
  { href: "/admin/deposits", label: "Deposits", icon: "ArrowDownCircle" },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: "ArrowUpCircle" },
  { href: "/admin/plans", label: "Plans", icon: "ListChecks" },
  { href: "/admin/kyc", label: "Verification", icon: "ShieldCheck" },
  { href: "/admin/settings", label: "Payment settings", icon: "Settings" },
  { href: "/admin/gifts", label: "Gifts", icon: "Gift" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar items={navItems} base="/admin" title={`Admin · ${profile?.full_name ?? ""}`} />
      <div className="flex-1 pt-14 md:pt-0">{children}</div>
    </div>
  );
}