"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Bell, MapPin, Phone, ShieldAlert, Eye, EyeOff } from "lucide-react";

type RememberedUser = { name: string; email: string; lastSignIn: string };

const STORAGE_KEY = "gringoafi_last_user";

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
  return `${time} | ${date}`;
}

// Password box with an eye button to show/hide the password
function PasswordField({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className="input pr-12"
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
      >
        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [remembered, setRemembered] = useState<RememberedUser | null>(null);
  const [showFullForm, setShowFullForm] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: RememberedUser = JSON.parse(stored);
      setRemembered(parsed);
      setEmail(parsed.email);
    } else {
      setShowFullForm(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .single();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: profile?.full_name ?? "Investor",
        email,
        lastSignIn: new Date().toISOString(),
      })
    );

    setLoading(false);
    router.push(profile?.role === "admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  function switchAccount() {
    localStorage.removeItem(STORAGE_KEY);
    setRemembered(null);
    setEmail("");
    setPassword("");
    setShowFullForm(true);
  }

  const signupUrl = typeof window !== "undefined" ? `${window.location.origin}/signup` : "";
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&color=12-36-24&bgcolor=255-255-255&data=${encodeURIComponent(signupUrl)}`;

  return (
    <main className="min-h-screen flex flex-col bg-pine-700">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <p className="font-display text-lg font-semibold text-white">
            {remembered ? <>Welcome back, <span className="text-gold-100">{remembered.name.split(" ")[0]}</span></> : "GringoAfi"}
          </p>
          {remembered && <p className="text-xs text-white/50 mt-0.5">{remembered.email}</p>}
        </div>
        <button aria-label="Notifications" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <Bell size={18} className="text-gold-100" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="rounded-lg bg-pine-600/40 border border-white/10 p-5">
          <div className="rounded-md bg-white p-3">
            <img src={qrSrc} alt="QR code linking to the GringoAfi signup page" width={200} height={200} className="rounded-sm" />
          </div>

          <a
            href={signupUrl}
            className="mt-3 flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-600 transition-colors"
          >
            Open on this device
          </a>
        </div>
        <p className="text-xs text-white/40 mt-6">Scan with your phone camera to open GringoAfi on another device</p>
      </div>

      <div className="bg-panel rounded-t-3xl px-6 pt-6 pb-8">
        {!showFullForm && remembered ? (
          <>
            <p className="text-center text-sm text-muted mb-4">
              Last signed in: <span className="font-medium text-ink">{formatTimestamp(remembered.lastSignIn)}</span>
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <PasswordField
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                autoFocus
              />
              {error && <p className="text-sm text-clay text-center">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base rounded-full">
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <button onClick={switchAccount} className="block w-full text-center text-sm text-pine font-medium mt-4">
              Switch account
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              className="input"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <PasswordField
              value={password}
              onChange={setPassword}
              placeholder="Password"
            />
            {error && <p className="text-sm text-clay text-center">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base rounded-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
            {remembered && (
              <button type="button" onClick={() => setShowFullForm(false)} className="block w-full text-center text-sm text-muted mt-1">
                Cancel
              </button>
            )}
          </form>
        )}

        <p className="text-center text-xs text-muted mt-5">
          No account yet?{" "}
          <Link href="/signup" className="text-pine font-medium">Open one</Link>
        </p>

        <p className="text-center text-[11px] text-muted/70 mt-3 leading-relaxed">
          By using GringoAfi you agree to our{" "}
          <Link href="/about" className="text-pine underline">Terms of Use</Link> and{" "}
          <Link href="/about" className="text-pine underline">Privacy Policy</Link>
        </p>

        <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-line">
          <a href="https://wa.me/YOUR-NUMBER" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 text-center">
            <span className="w-9 h-9 rounded-full bg-gold-100 flex items-center justify-center">
              <Phone size={16} className="text-gold-600" />
            </span>
            <span className="text-xs text-muted">Support</span>
          </a>
          <Link href="/about" className="flex flex-col items-center gap-1.5 text-center">
            <span className="w-9 h-9 rounded-full bg-gold-100 flex items-center justify-center">
              <MapPin size={16} className="text-gold-600" />
            </span>
            <span className="text-xs text-muted">About us</span>
          </Link>
          <a href="https://wa.me/YOUR-NUMBER" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 text-center">
            <span className="w-9 h-9 rounded-full bg-gold-100 flex items-center justify-center">
              <ShieldAlert size={16} className="text-gold-600" />
            </span>
            <span className="text-xs text-muted">Report fraud</span>
          </a>
        </div>
      </div>
    </main>
  );
}