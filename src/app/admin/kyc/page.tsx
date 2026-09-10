"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import Badge from "@/components/Badge";

export default function AdminKycPage() {
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await supabase
      .from("kyc_submissions")
      .select("*, profiles!kyc_submissions_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    setSubmissions(data ?? []);

    const urls: Record<string, string> = {};
    for (const s of data ?? []) {
      const { data: signed } = await supabase.storage.from("kyc-documents").createSignedUrl(s.id_image_url, 3600);
      if (signed) urls[s.id] = signed.signedUrl;
    }
    setImageUrls(urls);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string, userId: string) {
    setBusyId(id);
    await supabase.from("kyc_submissions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("profiles").update({ kyc_status: "approved" }).eq("id", userId);
    setBusyId(null);
    load();
  }

  async function reject(id: string, userId: string) {
    setBusyId(id);
    const reason = reasonDraft[id] || "Documents unclear or invalid";
    await supabase.from("kyc_submissions").update({ status: "rejected", rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("profiles").update({ kyc_status: "rejected" }).eq("id", userId);
    setBusyId(null);
    load();
  }

  const pending = submissions.filter((s) => s.status === "pending");
  const reviewed = submissions.filter((s) => s.status !== "pending");

  return (
    <main className="p-8 max-w-4xl">
      <p className="eyebrow mb-1">Verification</p>
      <h1 className="font-display text-3xl mb-8">Review KYC submissions</h1>

      {loading ? <p className="text-sm text-muted">Loading…</p> : (
        <>
          <div className="space-y-4 mb-8">
            {pending.length ? pending.map((s) => (
              <div key={s.id} className="card p-6">
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium">{s.profiles?.full_name}</p>
                    <p className="text-xs text-muted">{s.id_type} · {s.id_number} · {formatDate(s.created_at)}</p>
                  </div>
                  <Badge status={s.status} />
                </div>
                {imageUrls[s.id] && (
                  <img src={imageUrls[s.id]} alt="ID document" className="rounded-md border border-line max-h-64 object-contain mb-4" />
                )}
                <input
                  className="input mb-3 text-sm"
                  placeholder="Rejection reason (if rejecting)"
                  value={reasonDraft[s.id] ?? ""}
                  onChange={(e) => setReasonDraft({ ...reasonDraft, [s.id]: e.target.value })}
                />
                <div className="flex gap-3">
                  <button disabled={busyId === s.id} onClick={() => approve(s.id, s.user_id)} className="btn-primary py-1.5 px-4 text-xs">Approve</button>
                  <button disabled={busyId === s.id} onClick={() => reject(s.id, s.user_id)} className="btn-danger py-1.5 px-4 text-xs">Reject</button>
                </div>
              </div>
            )) : <p className="text-sm text-muted py-6 text-center">No pending submissions.</p>}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg mb-2">History</h2>
            {reviewed.map((s) => (
              <div key={s.id} className="ledger-row">
                <div>
                  <p className="text-sm font-medium">{s.profiles?.full_name}</p>
                  <p className="text-xs text-muted">{formatDate(s.created_at)}</p>
                </div>
                <Badge status={s.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
