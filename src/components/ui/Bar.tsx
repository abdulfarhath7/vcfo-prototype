import { cn } from "@/lib/cn";

export type BarTone = "accent" | "ok" | "warn" | "bad" | "violet" | "teal" | "idle" | "navy";

export const barFill: Record<BarTone, string> = {
  accent: "bg-accent",
  ok: "bg-ok-mid",
  warn: "bg-warn-mid",
  bad: "bg-bad-mid",
  violet: "bg-violet",
  teal: "bg-teal",
  idle: "bg-faint",
  navy: "bg-navy",
};

/** 6 px progress bar on a hairline track. */
export function Bar({ pct, tone = "accent", className, height = 6 }: { pct: number; tone?: BarTone; className?: string; height?: 6 | 8 | 10 }) {
  return (
    <span className={cn("block w-full overflow-hidden rounded-full bg-line-soft", className)} style={{ height }} aria-hidden>
      <i className={cn("block h-full rounded-full", barFill[tone])} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </span>
  );
}
