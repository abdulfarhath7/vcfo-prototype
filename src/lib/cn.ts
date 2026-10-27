import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom font sizes and colours from tailwind.config.ts, so twMerge can tell them apart.
const sizes = ["11", "11.5", "12", "12.5", "13", "13.5", "14", "14.5", "16", "22", "24", "44"];
const colours = [
  "white", "canvas", "surface", "raised", "line", "line-soft", "ink", "ink-2", "muted", "faint",
  "navy", "navy-2", "navy-tint", "navy-ink", "navy-faint", "navy-line", "navy-hover", "navy-on",
  "accent", "accent-soft", "accent-line", "ok", "ok-soft", "ok-mid", "warn", "warn-soft", "warn-mid",
  "bad", "bad-soft", "bad-mid", "violet", "violet-soft", "teal", "teal-soft", "idle", "idle-soft", "brand",
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: { color: colours },
    classGroups: { "font-size": [{ text: sizes }] },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
