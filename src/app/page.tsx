import Link from "next/link";
import HeroStatementCard from "@/components/HeroStatementCard";

const plans = [
  { name: "Starter", roi: "10%", days: 30, range: "GHS 100 – 999" },
  { name: "Growth", roi: "18%", days: 45, range: "GHS 1,000 – 4,999" },
  { name: "Premium", roi: "30%", days: 60, range: "GHS 5,000 – 50,000" },
];

const whyChoose = [
  { bg: "bg-pine-50", title: "Real ledger tracking", desc: "Every deposit, payout, and commission logged as its own entry — nothing hidden." },
  { bg: "bg-[#E4EEF7]", title: "Fixed terms, stated up front", desc: "Minimum, return, and maturity date are shown before you ever commit funds." },
  { bg: "bg-gold-100", title: "Reviewed, not automatic", desc: "Deposits and withdrawals are checked by a person before funds move." },
  { bg: "bg-[#F7E4EE]", title: "Referrals that pay out", desc: "Earn commission up to three levels deep when people you refer invest." },
];

export default function LandingPage() {
  return (
    <main>
      {/* NAV */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-xl font-semibold tracking-tight">GringoAfi</span>
          <nav className="flex items-center gap-3">
            <Link href="/about" className="text-sm font-medium text-muted hover:text-ink px-2">About</Link>
            <Link href="/login" className="btn-secondary">Log in</Link>
            <Link href="/signup" className="btn-primary">Open an account</Link>
          </nav>
        </div>
      </header>

      {/* HERO — dark pine hero with a wave curve flowing into the light page below */}
      <section className="relative bg-pine-700 pb-24 md:pb-28 overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-gold-100 mb-6">
              Structured ROI plans, backed by a full ledger
            </span>
            <h1 className="font-display text-5xl leading-[1.05] font-medium text-white">
              Every cedi,<br />
              <span className="text-gold-100 underline decoration-gold-400 decoration-2 underline-offset-4">accounted for.</span>
            </h1>
            <p className="mt-6 text-base text-white/70 max-w-md">
              Put money into fixed-term plans with a stated return and a stated date.
              No jargon, no guesswork — just an entry in the ledger for every deposit,
              payout, and referral you earn.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/signup" className="btn-primary px-6 py-3 text-base">Start investing →</Link>
              <Link href="#plans" className="inline-flex items-center justify-center rounded-md border border-white/25 bg-white/5 px-6 py-3 text-base font-medium text-white hover:bg-white/10 transition-colors">See plans</Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-white/50">
              <span>3 investment plans</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>Multi-level referrals</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>24/7 dashboard access</span>
            </div>
          </div>

          {/* Signature element: a live-looking ledger card, styled like a mock app window */}
          <HeroStatementCard />
        </div>

        {/* Wave divider — a single smooth curve cut into the base of the hero */}
        <svg
          className="absolute bottom-0 left-0 w-full text-paper"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,64 C240,120 480,120 720,90 C960,60 1200,0 1440,32 L1440,120 L0,120 Z"
          />
        </svg>
      </section>

      {/* PLANS */}
      <section id="plans" className="mx-auto max-w-6xl px-6 py-16">
        <p className="eyebrow mb-3 text-center">Plans</p>
        <h2 className="font-display text-3xl font-medium mb-10 text-center">Pick a term that fits your goal.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <div key={p.name} className="card p-6">
              <span className="tabular text-xs text-muted">0{i + 1}</span>
              <h3 className="font-display text-2xl mt-2 mb-1">{p.name}</h3>
              <p className="text-sm text-muted mb-6">{p.range}</p>
              <div className="ledger-row">
                <span className="text-sm text-muted">Return</span>
                <span className="tabular font-semibold text-pine-600">{p.roi}</span>
              </div>
              <div className="ledger-row">
                <span className="text-sm text-muted">Term</span>
                <span className="tabular font-semibold">{p.days} days</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-16 border-t border-line">
        <p className="eyebrow mb-3 text-center">How it works</p>
        <h2 className="font-display text-3xl font-medium mb-10 text-center">Three steps to your first investment.</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-xl mb-2">Fund your wallet</h3>
            <p className="text-sm text-muted">Deposit by reference, we confirm it, your balance updates — every step logged.</p>
          </div>
          <div>
            <h3 className="font-display text-xl mb-2">Choose a plan</h3>
            <p className="text-sm text-muted">Each plan states its minimum, its return, and its maturity date up front.</p>
          </div>
          <div>
            <h3 className="font-display text-xl mb-2">Earn, and refer</h3>
            <p className="text-sm text-muted">Get paid at maturity, plus commission when people you referred invest — three levels deep.</p>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US — colorful benefit cards */}
      <section className="mx-auto max-w-6xl px-6 py-16 border-t border-line">
        <p className="eyebrow mb-3 text-center">Why GringoAfi</p>
        <h2 className="font-display text-3xl font-medium mb-10 text-center">Built to be checked, not just trusted.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {whyChoose.map((item) => (
            <div key={item.title} className={`rounded-lg p-5 ${item.bg}`}>
              <h3 className="font-display text-base font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-ink/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted flex justify-between">
          <span>© {new Date().getFullYear()} GringoAfi</span>
          <span>Investing carries risk. Read the terms before you fund your wallet.</span>
        </div>
      </footer>
    </main>
  );
}