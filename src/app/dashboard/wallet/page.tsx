"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatMoney, formatDate } from "@/lib/utils";
import Badge from "@/components/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonRow } from "@/components/ui/Skeleton";
import {
  Wallet as WalletIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  Smartphone,
  Building2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Copy,
  Check,
} from "lucide-react";

// Allowed range for every deposit and withdrawal (also enforced in the database)
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 10000;

export default function WalletPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>("unsubmitted");
  const [hasInvested, setHasInvested] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [accountName, setAccountName] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [depositCode, setDepositCode] = useState<string>("");

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: wallet }, { data: tx }, { data: settingsRows }, { data: profile }, { count: investmentCount }] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", user!.id).single(),
      supabase.from("transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("platform_settings").select("*"),
      supabase.from("profiles").select("kyc_status").eq("id", user!.id).single(),
      supabase.from("investments").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    ]);
    setBalance(Number(wallet?.balance ?? 0));
    setTransactions(tx ?? []);
    const map: Record<string, string> = {};
    (settingsRows ?? []).forEach((s) => { map[s.key] = s.value; });
    setSettings(map);
    setKycStatus(profile?.kyc_status ?? "unsubmitted");
    setHasInvested((investmentCount ?? 0) > 0);

    const { data: code } = await supabase.rpc("get_or_create_deposit_code");
    setDepositCode(code ?? "");

    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const isVerified = kycStatus === "approved";
  const canWithdraw = isVerified && hasInvested;

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const { error } = await supabase.rpc("submit_deposit_request", {
      p_amount: Number(amount),
      p_code: depositCode,
    });

    setSubmitting(false);
    if (error) {
      setMessage({ type: "err", text: error.message });
    } else {
      setMessage({ type: "ok", text: "Deposit request submitted. Awaiting admin approval." });
      setAmount("");
      loadData();
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const { error } = await supabase.rpc("request_withdrawal", {
      p_amount: Number(amount),
      p_method: method,
      p_details: details,
      p_account_name: accountName,
    });

    setSubmitting(false);
    if (error) {
      setMessage({ type: "err", text: error.message });
    } else {
      setMessage({ type: "ok", text: "Withdrawal request submitted. Funds are on hold pending review." });
      setAmount(""); setMethod(""); setAccountName(""); setDetails("");
      loadData();
    }
  }

  return (
    <>
      <main className="p-6 md:p-8 max-w-4xl">
        <p className="eyebrow mb-1">Wallet</p>
        <h1 className="font-display text-3xl mb-8">Your balance</h1>

        <div className="card p-6 mb-8 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-pine-50 flex items-center justify-center shrink-0">
            <WalletIcon size={20} className="text-pine-400" />
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">Available balance</p>
            <p className="tabular text-4xl font-semibold">{formatMoney(balance)}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-6">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setTab("deposit"); setMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${tab === "deposit" ? "bg-pine text-white" : "bg-pine-50 text-pine-600 hover:bg-pine-100"}`}
              >
                <ArrowDownToLine size={14} /> Deposit
              </button>
              <button
                onClick={() => { setTab("withdraw"); setMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${tab === "withdraw" ? "bg-pine text-white" : "bg-pine-50 text-pine-600 hover:bg-pine-100"}`}
              >
                <ArrowUpFromLine size={14} /> Withdraw
              </button>
            </div>

            {tab === "deposit" ? (
              <form onSubmit={handleDeposit} className="space-y-4">
                <p className="text-sm text-muted">Make payment to the account below, then submit the reference for approval.</p>

                {(settings.momo_number || settings.bank_account_number) ? (
                  <div className="rounded-md bg-pine-50 p-4 space-y-1.5">
                    {settings.momo_number && (
                      <div className="ledger-row !py-1.5">
                        <span className="text-xs text-muted flex items-center gap-1.5"><Smartphone size={13} /> MoMo number</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular text-sm font-semibold">{settings.momo_number}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(settings.momo_number, "momo_number")}
                            aria-label="Copy MoMo number"
                            className="w-6 h-6 rounded flex items-center justify-center text-muted hover:bg-pine-100 hover:text-pine-600 transition-colors shrink-0"
                          >
                            {copiedField === "momo_number" ? <Check size={13} className="text-pine-600" /> : <Copy size={13} />}
                          </button>
                        </span>
                      </div>
                    )}
                    {settings.momo_name && (
                      <div className="ledger-row !py-1.5">
                        <span className="text-xs text-muted flex items-center gap-1.5"><Smartphone size={13} /> MoMo registered name</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular text-sm font-semibold">{settings.momo_name}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(settings.momo_name, "momo_name")}
                            aria-label="Copy MoMo registered name"
                            className="w-6 h-6 rounded flex items-center justify-center text-muted hover:bg-pine-100 hover:text-pine-600 transition-colors shrink-0"
                          >
                            {copiedField === "momo_name" ? <Check size={13} className="text-pine-600" /> : <Copy size={13} />}
                          </button>
                        </span>
                      </div>
                    )}
                    {settings.bank_account_number && (
                      <div className="ledger-row !py-1.5">
                        <span className="text-xs text-muted flex items-center gap-1.5"><Building2 size={13} /> Bank</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular text-sm font-semibold">{settings.bank_name} · {settings.bank_account_number} {settings.bank_account_name && `(${settings.bank_account_name})`}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(settings.bank_account_number, "bank_number")}
                            aria-label="Copy bank account number"
                            className="w-6 h-6 rounded flex items-center justify-center text-muted hover:bg-pine-100 hover:text-pine-600 transition-colors shrink-0"
                          >
                            {copiedField === "bank_number" ? <Check size={13} className="text-pine-600" /> : <Copy size={13} />}
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert kind="warning">Payment account details haven't been set up yet — contact support before sending funds.</Alert>
                )}

                <div>
                  <label className="label" htmlFor="dep-amount">Amount</label>
                  <input id="dep-amount" type="number" step="0.01" min={MIN_AMOUNT} max={MAX_AMOUNT} className="input tabular" required
                    value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <p className="text-xs text-muted mt-1.5">Minimum {formatMoney(MIN_AMOUNT)} · Maximum {formatMoney(MAX_AMOUNT)} per deposit.</p>
                </div>
                <div>
                  <label className="label">Your payment reference</label>
                  <div className="flex items-center gap-2 rounded-md border border-pine bg-pine-50 px-3.5 py-2.5">
                    <span className="tabular text-sm font-semibold flex-1">{depositCode || "Loading…"}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(depositCode, "deposit_code")}
                      aria-label="Copy your payment reference"
                      className="w-6 h-6 rounded flex items-center justify-center text-pine-600 hover:bg-pine-100 transition-colors shrink-0"
                    >
                      {copiedField === "deposit_code" ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1.5">Include this exact code as the note/reference on your MoMo or bank transfer. It's unique to this deposit and can only be used once.</p>
                </div>
                <Button type="submit" loading={submitting} fullWidth>
                  {submitting ? "Submitting…" : "Submit deposit request"}
                </Button>
                <p className="text-xs text-muted text-center flex items-center justify-center gap-1.5">
                  <Clock size={12} /> You'll receive your funds within 1–20 minutes of us confirming your payment.
                </p>
              </form>
            ) : !isVerified ? (
              <div className="rounded-md bg-gold-100/60 border border-gold-100 p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-3">
                  {kycStatus === "pending" ? <ShieldCheck size={18} className="text-gold-600" /> : <ShieldAlert size={18} className="text-gold-600" />}
                </div>
                <p className="text-sm font-medium text-ink mb-1">Verify your identity to withdraw</p>
                <p className="text-sm text-muted mb-4">
                  {kycStatus === "pending"
                    ? "Your verification is under review. You'll be able to withdraw once it's approved."
                    : "You need to complete identity verification before you can request a withdrawal."}
                </p>
                {kycStatus !== "pending" && (
                  <Link href="/dashboard/kyc">
                    <Button size="sm">Verify now</Button>
                  </Link>
                )}
              </div>
            ) : !hasInvested ? (
              <div className="rounded-md bg-gold-100/60 border border-gold-100 p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp size={18} className="text-gold-600" />
                </div>
                <p className="text-sm font-medium text-ink mb-1">Invest before you withdraw</p>
                <p className="text-sm text-muted mb-4">
                  You need to place at least one investment before you can request a withdrawal.
                </p>
                <Link href="/dashboard/plans">
                  <Button size="sm">View plans</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <p className="text-sm text-muted">Funds are held from your balance immediately and released to your payout method once approved.</p>
                <div>
                  <label className="label" htmlFor="wd-amount">Amount</label>
                  <input id="wd-amount" type="number" step="0.01" min={MIN_AMOUNT} max={Math.min(balance, MAX_AMOUNT)} className="input tabular" required
                    value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <p className="text-xs text-muted mt-1.5">Minimum {formatMoney(MIN_AMOUNT)} · Maximum {formatMoney(MAX_AMOUNT)} per withdrawal.</p>
                </div>
                <div>
                  <label className="label" htmlFor="wd-method">Payout method</label>
                  <input id="wd-method" className="input" required placeholder="Mobile money / Bank transfer"
                    value={method} onChange={(e) => setMethod(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="wd-name">Account name</label>
                  <input id="wd-name" className="input" required placeholder="Name registered on the account"
                    value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="wd-details">Payout details</label>
                  <input id="wd-details" className="input" required placeholder="Account number / MoMo number"
                    value={details} onChange={(e) => setDetails(e.target.value)} />
                </div>
                <Button type="submit" loading={submitting} fullWidth>
                  {submitting ? "Submitting…" : "Request withdrawal"}
                </Button>
              </form>
            )}

            {message && (
              <div className="mt-4">
                <Alert kind={message.type === "ok" ? "success" : "error"}>{message.text}</Alert>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg mb-2">Transaction history</h2>
            {loading ? (
              <div>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : transactions.length ? (
              <div className="max-h-[420px] overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="ledger-row">
                    <div>
                      <p className="text-sm font-medium capitalize">{tx.type.replace("_", " ")}</p>
                      <p className="text-xs text-muted">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-sm font-semibold">{formatMoney(Number(tx.amount))}</p>
                      <Badge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Receipt} title="No transactions yet" description="Your deposits, investments, and payouts will appear here." />
            )}
          </div>
        </div>
      </main>
    </>
  );
}