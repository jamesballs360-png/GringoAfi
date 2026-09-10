export default function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative bg-pine-700 pb-10 overflow-hidden">
      <div className="relative mx-auto max-w-5xl px-8 pt-10 pb-4">
        {eyebrow && (
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-gold-100 mb-3">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-3xl font-medium text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-white/70 max-w-xl">{subtitle}</p>}
      </div>

      {/* Wave divider — same curve used on the landing page hero, for consistency */}
      <svg
        className="absolute bottom-0 left-0 w-full text-paper"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,42 C240,80 480,80 720,60 C960,40 1200,0 1440,20 L1440,80 L0,80 Z"
        />
      </svg>
    </div>
  );
}