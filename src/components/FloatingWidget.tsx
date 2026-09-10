"use client";

import { useEffect, useState } from "react";

// TODO: replace these two with your real links
const TELEGRAM_GROUP_URL = "https://t.me/YOUR-GROUP-NAME";

export default function FloatingWidget() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShowScrollTop(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="w-12 h-12 rounded-full bg-pine text-white shadow-card flex items-center justify-center hover:bg-pine-600 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}

      <button
        onClick={() => setChatOpen(true)}
        aria-label="Open live chat"
        className="w-12 h-12 rounded-full bg-[#5B6EF5] text-white shadow-card flex items-center justify-center hover:brightness-110 transition"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>

      <a href={TELEGRAM_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join our Telegram group"
        className="w-12 h-12 rounded-full bg-[#229ED9] text-white shadow-card flex items-center justify-center hover:brightness-110 transition"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.94 4.53 18.68 20.2c-.25 1.1-.9 1.37-1.82.85l-5.03-3.71-2.43 2.34c-.27.27-.5.5-1.02.5l.37-5.15 9.38-8.47c.41-.36-.09-.56-.63-.2L6.5 12.9l-5.03-1.57c-1.1-.34-1.11-1.09.23-1.61L20.5 3.05c.91-.33 1.71.22 1.44 1.48z" />
        </svg>
      </a>

      <div className="absolute right-14 bottom-16 rotate-[-8deg] bg-gold text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-card whitespace-nowrap pointer-events-none">
        We're here
      </div>

      {chatOpen && (
        <div className="absolute bottom-16 right-14 w-72 card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display text-sm font-semibold">Chat with us</p>
            <button onClick={() => setChatOpen(false)} aria-label="Close chat" className="text-muted hover:text-ink">✕</button>
          </div>
          <p className="text-xs text-muted">
            Live chat isn't connected yet — this is a placeholder panel.
            Hook up Tawk.to, Crisp, or another provider here.
          </p>
        </div>
      )}
    </div>
  );
}