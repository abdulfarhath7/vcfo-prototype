import type { Config } from "tailwindcss";

// Every colour comes from src/styles/tokens.css. Components never write hex.
const v = (name: string) => `var(--${name})`;

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff", // literal so opacity modifiers (bg-white/[.12]) work on the navy band
      canvas: v("canvas"),
      surface: v("surface"),
      raised: v("raised"),
      line: v("line"),
      "line-soft": v("line-soft"),
      ink: v("ink"),
      "ink-2": v("ink-2"),
      muted: v("muted"),
      faint: v("faint"),
      navy: v("navy"),
      "navy-2": v("navy-2"),
      "navy-tint": v("navy-tint"),
      "navy-ink": v("navy-ink"),
      "navy-faint": v("navy-faint"),
      "navy-line": v("navy-line"),
      "navy-hover": v("navy-hover"),
      "navy-on": v("navy-on"),
      accent: { DEFAULT: v("accent"), soft: v("accent-soft"), line: v("accent-line") },
      ok: { DEFAULT: v("ok"), soft: v("ok-soft"), mid: v("ok-mid") },
      warn: { DEFAULT: v("warn"), soft: v("warn-soft"), mid: v("warn-mid") },
      bad: { DEFAULT: v("bad"), soft: v("bad-soft"), mid: v("bad-mid") },
      violet: { DEFAULT: v("violet"), soft: v("violet-soft") },
      teal: { DEFAULT: v("teal"), soft: v("teal-soft") },
      idle: { DEFAULT: v("idle"), soft: v("idle-soft") },
      brand: v("brand"),
      scrim: v("scrim"),
      btn: v("btn"),
      "btn-hover": v("btn-hover"),
    },
    fontFamily: {
      sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      mono: ["var(--font-mono)", "ui-monospace", "monospace"],
    },
    borderRadius: {
      none: "0",
      sm: "5px",
      DEFAULT: "6px",
      md: "8px",
      lg: "10px",
      full: "9999px",
    },
    extend: {
      fontSize: {
        "11": ["11px", "1.3"],
        "11.5": ["11.5px", "1.3"],
        "12": ["12px", "1.4"],
        "12.5": ["12.5px", "1.4"],
        "13": ["13px", "1.45"],
        "13.5": ["13.5px", "1.45"],
        "14": ["14px", "1.5"],
        "14.5": ["14.5px", "1.4"],
        "16": ["16px", "1.3"],
        "22": ["22px", "1.25"],
        "24": ["24px", "1.2"],
        "44": ["44px", "1"],
      },
      spacing: {
        "4.5": "18px",
        "13": "52px",
        "head": "52px",
        "row": "46px",
        "side": "248px",
        "top": "60px",
      },
      maxWidth: { page: "1440px" },
      boxShadow: {
        none: "none",
        pop: "0 8px 24px rgba(0,0,0,.12)",
      },
    },
  },
  plugins: [],
};

export default config;
