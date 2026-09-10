"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const fields = [
  { key: "momo_number", label: "MoMo number" },
  { key: "momo_name", label: "MoMo registered name" },
  { key: "payment_reference", label: "Payment reference" },
  { key: "bank_name", label: "Bank name" },
  { key: "bank_account_number", label: "Bank account number" },
  { key: "bank_account_name", label: "Bank account name" },
];

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("platform_settings").select("*");
    const map: Record<string, string> = {};
    (data ?? []).forEach((s) => { map[s.key] = s.value; });
    setValues(map);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    for (const f of fields) {
      const { error } = await supabase
        .from("platform_settings")
        .update({ value: values[f.key] ?? "" })
        .eq("key", f.key);
      if (error) {
        setSaving(false);
        setMessage(`Error saving ${f.label}: ${error.message}`);
        return;
      }
    }

    setSaving(false);
    setMessage("Saved. Investors will see these details on the deposit form.");
  }

  if (loading) return <main className="p-8 text-sm text-muted">Loading…</main>;

  return (
    <main className="p-8 max-w-lg">
      <p className="eyebrow mb-1">Settings</p>
      <h1 className="font-display text-3xl mb-8">Payment account details</h1>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input
              className="input"
              value={values[f.key] ?? ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            />
          </div>
        ))}
        {message && <p className="text-sm text-pine-600">{message}</p>}
        <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
          {saving ? "Saving…" : "Save details"}
        </button>
      </form>
    </main>
  );
}