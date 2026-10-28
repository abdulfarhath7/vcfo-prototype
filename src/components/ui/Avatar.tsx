import { cn } from "@/lib/cn";

const palette = [
  "bg-accent-soft text-accent",
  "bg-violet-soft text-violet",
  "bg-teal-soft text-teal",
  "bg-warn-soft text-warn",
  "bg-ok-soft text-ok",
  "bg-idle-soft text-idle",
];

/** Old two-letter codes for one-word names (s/super/data.js). */
const ONE_WORD: Record<string, string> = { Pranay: "PN", Bharath: "BH", Krishna: "KR", Mithilesh: "MI" };

export function initials(name: string) {
  const one = ONE_WORD[name.trim()];
  if (one) return one;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function Avatar({ name, size = 30, className, onNavy }: { name: string; size?: 24 | 30 | 36 | 44; className?: string; onNavy?: boolean }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return (
    <span
      className={cn(
        "inline-grid flex-none place-items-center rounded-md font-bold",
        size === 24 ? "text-[10px]" : size === 30 ? "text-11.5" : "text-12.5",
        onNavy ? "bg-navy-on text-white" : palette[idx],
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
