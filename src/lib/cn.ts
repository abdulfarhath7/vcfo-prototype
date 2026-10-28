import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom font sizes and colours from tailwind.config.ts, so twMerge can tell them apart.
const sizes = ["11", "11.5", "12", "12.5", "13", "13.5", "14", "14.5", "15", "16", "18", "20", "22", "24", "26", "28", "40", "44"];
const colours = [
  "white", "canvas", "surface", "raised", "hover", "line", "line-2", "line-soft", "ink", "ink-2", "muted", "faint",
  "navy", "navy-2", "navy-tint", "navy-ink", "navy-faint", "navy-line", "navy-hover", "navy-on", "navy-on-ink",
  "primary", "primary-hover", "primary-on", "strong", "strong-on", "danger", "danger-hover", "focus", "ghost", "ghost-hover",
  "accent", "accent-soft", "accent-line", "accent-mid", "ok", "ok-soft", "ok-mid", "warn", "warn-soft", "warn-mid",
  "bad", "bad-soft", "bad-mid", "violet", "violet-soft", "violet-mid", "teal", "teal-soft", "teal-mid", "idle", "idle-soft", "idle-mid",
  "info", "info-soft", "info-line", "info-mid", "caution", "caution-soft", "caution-line",
  "reg-mca", "reg-gst", "reg-it", "reg-payroll", "reg-fema", "reg-labour", "wash-tile", "wash-tile-line", "wash-ink-2", "brand",
  "scrim", "btn", "btn-hover",
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: { color: colours },
    classGroups: {
      "font-size": [{ text: sizes }],
      "border-w": [{ border: ["1.5"] }],
      "border-w-t": [{ "border-t": ["1.5"] }],
      "border-w-b": [{ "border-b": ["1.5"] }],
      "border-w-l": [{ "border-l": ["1.5"] }],
      "border-w-r": [{ "border-r": ["1.5"] }],
      rounded: [{ rounded: ["bar", "mark"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
