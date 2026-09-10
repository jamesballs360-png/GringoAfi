"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AvatarIcon from "@/components/AvatarIcon";

const OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "neutral", label: "Prefer not to say" },
];

export default function ProfilePage() {
  const supabase = createClient();
  const [current, setCurrent] = useState("neutral");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles").select("avatar_choice").eq("id", user!.id).single();
      setCurrent(data?.avatar_choice ?? "neutral");
      setLoading(false);
    }
    load();
  }, []);

  async function choose(value: string) {
    setSaving(true);
    setSaved(false);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ avatar_choice: value }).eq("id", user!.id);
    setSaving(false);
    if (!error) {
      setCurrent(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (loading) return <main className="p-8 max-w-xl text-sm text-muted">Loading…</main>;

  return (
    <main className="p-8 max-w-xl">
      <p className="eyebrow mb-1">Profile</p>
      <h1 className="font-display text-3xl mb-8">Your avatar</h1>

      <div className="card p-6">
        <p className="text-sm text-muted mb-5">Choose the icon shown next to your name in the sidebar.</p>
        <div className="grid grid-cols-3 gap-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => choose(opt.value)}
              disabled={saving}
              className={`rounded-md border p-4 flex flex-col items-center gap-2 transition-colors ${
                current === opt.value ? "border-pine bg-pine-50" : "border-line hover:bg-pine-50"
              }`}
            >
              <AvatarIcon type={opt.value} size={40} />
              <span className="text-xs font-medium text-muted">{opt.label}</span>
            </button>
          ))}
        </div>
        {saved && <p className="text-sm text-pine-600 mt-4">Saved.</p>}
      </div>
    </main>
  );
}