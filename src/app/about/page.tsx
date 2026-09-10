import Link from "next/link";

export default function AboutPage() {
  return (
    <main>
      <header className="border-b border-line">
        <nav className="flex items-center gap-3">
  <Link href="/about" className="text-sm font-medium text-muted hover:text-ink px-2">About</Link>
  <Link href="/login" className="btn-secondary">Log in</Link>
  <Link href="/signup" className="btn-primary">Open an account</Link>
</nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="eyebrow mb-4">About us</p>
        <h1 className="font-display text-4xl leading-[1.1] font-medium mb-6">
          A structured, transparent way to invest.
        </h1>
        <p className="text-lg text-muted max-w-2xl">
          GringoAfi is a platform for structured, fixed-term investing. You choose a plan
          with a stated minimum, a stated return, and a stated date — then track every
          deposit, payout, and referral commission as a clear entry in your ledger.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14 border-t border-line">
        <p className="eyebrow mb-3">Our approach</p>
        <h2 className="font-display text-2xl font-medium mb-4">No vague promises — just numbers you can check.</h2>
        <p className="text-sm text-muted leading-relaxed">
          We built GringoAfi around one idea: an investor should always be able to see
          exactly where their money stands. Every plan states its minimum and maximum
          amount, its return, and its term up front. Every deposit, withdrawal, investment,
          and payout is logged as its own entry, so your account reads like a statement,
          not a promise.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14 border-t border-line">
        <p className="eyebrow mb-3">How it works</p>
        <h2 className="font-display text-2xl font-medium mb-8">Four steps, start to finish.</h2>
        <div className="space-y-6">
          {[
            { n: "01", t: "Fund your wallet", d: "Deposit by reference. Once it's confirmed, your balance updates and is logged." },
            { n: "02", t: "Choose a plan", d: "Every plan lists its minimum, its return, and its term — decide with the full picture." },
            { n: "03", t: "Track your returns", d: "Watch your investment and any referral earnings accrue, itemized in your ledger." },
            { n: "04", t: "Withdraw or reinvest", d: "At maturity, request a withdrawal or put your returns into a new plan." },
          ].map((step) => (
            <div key={step.n} className="flex gap-5">
              <span className="tabular text-sm text-pine-400 pt-0.5">{step.n}</span>
              <div>
                <p className="font-medium text-sm mb-1">{step.t}</p>
                <p className="text-sm text-muted">{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14 border-t border-line">
        <p className="eyebrow mb-3">Why people trust GringoAfi</p>
        <h2 className="font-display text-2xl font-medium mb-8">Verification and oversight, built in.</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { t: "Identity verification", d: "Investors verify their identity before withdrawing, so accounts are tied to real people." },
            { t: "Reviewed transactions", d: "Deposits and withdrawals are checked before funds move — nothing is automatic or unaccountable." },
            { t: "A full transaction history", d: "Every entry — deposit, investment, payout, commission — stays visible in your account." },
            { t: "Transparent referrals", d: "Commission rates are fixed and stated, and every payout is logged against the plan that earned it." },
          ].map((item) => (
            <div key={item.t} className="card p-5">
              <p className="font-medium text-sm mb-1">{item.t}</p>
              <p className="text-sm text-muted">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14 border-t border-line">
        <p className="eyebrow mb-3">A note on risk</p>
        <h2 className="font-display text-2xl font-medium mb-4">Investing carries risk.</h2>
        <p className="text-sm text-muted leading-relaxed">
          Returns on any plan are not guaranteed, and past performance is not a promise of
          future results. Only invest money you can afford to have tied up for the length
          of a plan's term. Read each plan's terms before you commit funds.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 border-t border-line text-center">
        <h2 className="font-display text-2xl font-medium mb-3">Ready to see it for yourself?</h2>
        <p className="text-sm text-muted mb-8">Open an account and look through the plans — no commitment until you invest.</p>
        <div className="flex justify-center gap-3">
          <Link href="/signup" className="btn-primary px-6 py-3 text-base">Open an account</Link>
          <Link href="/#plans" className="btn-secondary px-6 py-3 text-base">See plans</Link>
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