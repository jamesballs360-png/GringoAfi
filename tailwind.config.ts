import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16211D",
        paper: "#F7FAF8",
        panel: "#FFFFFF",
        pine: {
          DEFAULT: "#0F9D6D",
          50: "#E6F7F0",
          100: "#C3ECDC",
          400: "#17B37E",
          600: "#0B7A54",
          700: "#075C3F",
        },
        gold: {
          DEFAULT: "#E0A83E",
          100: "#FBF0DA",
          400: "#E9BE6B",
          600: "#B9852A",
        },
        clay: "#E4574F",
        line: "#E3E8E4",
        muted: "#68766F",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,157,109,0.06), 0 8px 24px -12px rgba(15,157,109,0.14)",
        "card-hover": "0 2px 4px rgba(15,157,109,0.08), 0 16px 32px -12px rgba(15,157,109,0.20)",
        "gold-glow": "0 1px 2px rgba(224,168,62,0.15), 0 8px 24px -8px rgba(224,168,62,0.25)",
        sm: "0 1px 2px rgba(22,33,29,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;