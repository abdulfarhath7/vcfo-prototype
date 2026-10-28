import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtLong } from "@/lib/dates";
import type { Tone } from "@/components/icons";

export interface StatItem {
  label: string;
  value: React.ReactNode;
  /** Small text after the value: "/ 6". */
  of?: string;
  Icon: LucideIcon;
  tone: Tone;
  /** Red value for the one metric that is bad. */
  bad?: boolean;
  /** Green value for done. */
  good?: boolean;
  /** Small line under the number: "3 new today". */
  sub?: string;
  /** Sparkline points. */
  spark?: number[];
  /** Sparkline colour; default from bad/good, else blurple. */
  sparkTone?: "bad" | "ok" | "teal" | "warn" | "accent";
  /** Small green progress bar under the number, in percent. */
  bar?: number;
  href?: string;
}

/** R-18 (KP1): label 13 px with a 15 px icon, number 26 px tabular, sub line 12.5 px, optional sparkline. */
export function NumberStrip({ items, className, onWash }: { items: StatItem[]; className?: string; onWash?: boolean }) {
  return (
    <div className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]", className)}>
      {items.map((s) => {
        const inner = (
          <>
            <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-13 font-medium text-ink-2">
              <s.Icon size={15} strokeWidth={1.6} className="flex-none text-muted" aria-hidden />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="flex min-w-0 items-end gap-2.5">
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <b className={cn("text-26 font-medium tabular-nums", s.bad ? "text-bad" : s.good ? "text-ok" : "text-ink")}>
                  {s.value}
                  {s.of && <small className="ml-1 text-14 font-medium text-muted">{s.of}</small>}
                </b>
                {s.bar !== undefined && (
                  <span className="block h-1 w-full max-w-[120px] overflow-hidden rounded-bar bg-line" aria-hidden>
                    <i className="block h-full rounded-bar bg-ok-mid" style={{ width: `${s.bar}%` }} />
                  </span>
                )}
                {s.sub && <span className="truncate text-12.5 text-muted">{s.sub}</span>}
              </span>
              {s.spark && <Spark points={s.spark} className={SPARK[s.sparkTone ?? (s.bad ? "bad" : s.good ? "ok" : "accent")]} />}
            </span>
          </>
        );
        const cls = cn(
          "flex min-w-0 flex-col justify-start gap-1.5 rounded-md px-4 py-3.5",
          onWash ? "border border-wash-tile-line bg-wash-tile shadow-tile" : "border-1.5 border-line bg-surface",
          s.href && "transition-colors hover:border-line-2",
        );
        return s.href ? (
          <Link key={s.label} href={s.href} className={cls}>
            {inner}
          </Link>
        ) : (
          <div key={s.label} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

const SPARK = { bad: "text-bad-mid", ok: "text-ok-mid", teal: "text-teal-mid", warn: "text-warn-mid", accent: "text-accent-mid" } as const;

/** 68 x 30 sparkline in the colour of what it measures. */
function Spark({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 66 + 1},${29 - ((p - min) / (max - min || 1)) * 26}`).join(" ");
  return (
    <svg width="68" height="30" viewBox="0 0 68 30" className={cn("hidden flex-none sm:block", className)} aria-hidden>
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface GreetingCardProps {
  date: Date;
  name: string;
  /** Greeting before the name: "Good afternoon" gives "Good afternoon, Mithilesh". */
  eyebrow?: string;
  /** Chip or small text after the name. */
  tag?: React.ReactNode;
  /** Company tile before the name (client home). */
  lead?: React.ReactNode;
  /** Small line under the name: project lead, CIN. */
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  stats: StatItem[];
  /** Clock after the date: "12:31 PM" on staff portals, as in the old greeting. */
  time?: string;
}

/**
 * R-17 (H3): one home card on every portal. Date, greeting or company name, the actions and the number tiles,
 * on the deep colour wash. The tiles float on it.
 */
export function GreetingCard({ date, name, eyebrow, tag, lead, sub, actions, stats, time }: GreetingCardProps) {
  const when = time ? `${fmtLong(date)} · ${time}` : fmtLong(date);
  return (
    <section className="bg-wash flex flex-col gap-5 rounded-md border-1.5 border-line px-4 pb-5 pt-[18px] md:px-6 md:pb-6 md:pt-[22px]" aria-label="Summary">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-0 flex-[1_1_300px] items-center gap-4">
          {lead}
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-13 text-wash-ink-2">{when}</span>
            <h1 className="flex flex-wrap items-center gap-2.5 text-22 font-medium tracking-[-0.01em] text-ink md:text-28">
              <span className="min-w-0">{eyebrow ? `${eyebrow}, ${name}` : name}</span>
              {tag}
            </h1>
            {sub && <span className="text-13 text-wash-ink-2">{sub}</span>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
      <NumberStrip items={stats} onWash />
    </section>
  );
}
