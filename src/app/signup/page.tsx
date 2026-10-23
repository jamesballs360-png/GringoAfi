"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

// Password box with an eye button to show/hide the password
function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        className="input pr-12"
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(params.get("ref") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      phone,
      options: {
        data: {
          full_name: fullName,
          phone,
          referral_code: referralCode || null,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthShell>
        <p className="eyebrow mb-3">Check your inbox</p>
        <h1 className="font-display text-2xl mb-3">Confirm your email</h1>
        <p className="text-sm text-muted mb-6">
          We sent a confirmation link to <span className="text-ink font-medium">{email}</span>.
          Verify it, then log in to fund your wallet.
        </p>
        <Link href="/login" className="btn-primary">Go to login</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <p className="eyebrow mb-3">Open an account</p>
      <h1 className="font-display text-2xl mb-6">Create your ledger account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="fullName">Full name</label>
          <input id="fullName" className="input" required value={fullName}
            onChange={(e) => setFullName(e.target.value)} placeholder="Ama Owusu" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="ama@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <input id="phone" type="tel" className="input" required value={phone}
            onChange={(e) => setPhone(e.target.value)} placeholder="+233 24 000 0000" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <PasswordField
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            minLength={8}
          />
        </div>
        <div>
          <label className="label" htmlFor="referralCode">Referral code <span className="text-muted font-normal">(optional)</span></label>
          <input id="referralCode" className="input" value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="e.g. 8F2K9C1A" />
        </div>

        {error && <p className="text-sm text-clay">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted text-center">
        Already have an account? <Link href="/login" className="text-pine font-medium">Log in</Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-xl font-semibold block mb-8">Ledger</Link>
        <div className="card p-8">{children}</div>
      </div>
    </main>
  );
}