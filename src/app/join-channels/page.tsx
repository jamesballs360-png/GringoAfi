"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// TODO: replace with your real links (same ones used in FloatingWidget.tsx)
const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/YOUR-CHANNEL-ID";
const TELEGRAM_GROUP_URL = "https://t.me/YOUR-GROUP-NAME";

export default function JoinChannelsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ joined_channels: true })
      .eq("id", user!.id);

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-md">
        <p className="font-display text-xl font-semibold block mb-8 text-center">GringoAfi</p>
        <div className="card p-8 text-center">
          <p className="eyebrow mb-3">One last step</p>
          <h1 className="font-display text-2xl mb-3">Join our channels</h1>
          <p className="text-sm text-muted mb-8">
            Before you get access to your account, join our WhatsApp channel and
            Telegram group — that's where we share updates, plan changes, and
            announcements.
          </p>

          <div className="space-y-3 mb-8">
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center rounded-md bg-[#25D366] px-4 py-3 text-sm font-medium text-white hover:brightness-110 transition"
            >
              Join WhatsApp Channel
            </a>
            <a
              href={TELEGRAM_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center rounded-md bg-[#229ED9] px-4 py-3 text-sm font-medium text-white hover:brightness-110 transition"
            >
              Join Telegram Group
            </a>
          </div>

          {error && <p className="text-sm text-clay mb-4">{error}</p>}

          <button onClick={handleContinue} disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? "Continuing…" : "I've joined both — Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}