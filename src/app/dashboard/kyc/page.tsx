"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Badge from "@/components/Badge";

export default function KycPage() {
  const supabase = createClient();
  const [status, setStatus] = useState<string>("unsubmitted");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [idType, setIdType] = useState("National ID");
  const [idNumber, setIdNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("kyc_status").eq("id", user!.id).single();
    const { data: latest } = await supabase
      .from("kyc_submissions").select("*").eq("user_id", user!.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    setStatus(profile?.kyc_status ?? "unsubmitted");
    setRejectionReason(latest?.rejection_reason ?? null);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user!.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, file);
    if (uploadError) {
      setSubmitting(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from("kyc_submissions").insert({
      user_id: user!.id,
      id_type: idType,
      id_number: idNumber,
      id_image_url: path,
    });

    if (insertError) {
      setSubmitting(false);
      setError(insertError.message);
      return;
    }

    await supabase.from("profiles").update({ kyc_status: "pending" }).eq("id", user!.id);

    setSubmitting(false);
    load();
  }

  if (loading) return <main className="p-8 text-sm text-muted">Loading…</main>;

  return (
    <main className="p-8 max-w-xl">
      <p className="eyebrow mb-1">Verification</p>
      <h1 className="font-display text-3xl mb-2">Identity verification</h1>
      <div className="mb-8"><Badge status={status} /></div>

      {status === "approved" && (
        <div className="card p-6"><p className="text-sm text-pine-600">You're verified. No further action needed.</p></div>
      )}

      {status === "pending" && (
        <div className="card p-6"><p className="text-sm text-muted">Your documents are under review. This usually takes 1–2 business days.</p></div>
      )}

      {(status === "unsubmitted" || status === "rejected") && (
        <div className="card p-6">
          {status === "rejected" && rejectionReason && (
            <p className="text-sm text-clay mb-4">Previous submission was rejected: {rejectionReason}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="idType">ID type</label>
              <select id="idType" className="input" value={idType} onChange={(e) => setIdType(e.target.value)}>
                <option>National ID</option>
                <option>Passport</option>
                <option>Driver's License</option>
                <option>Voter ID</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="idNumber">ID number</label>
              <input id="idNumber" className="input" required value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="idImage">Photo of your ID</label>
              <input id="idImage" type="file" accept="image/*" required className="input"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            {error && <p className="text-sm text-clay">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
