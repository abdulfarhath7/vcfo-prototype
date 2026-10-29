import * as React from "react";
import Link from "next/link";
import * as Tip from "@radix-ui/react-tooltip";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
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
  /** Home card only: a short note after the number ("3 new", "2 clients"). */
  note?: string;
  /** E-04: "How is this counted?" One sentence, shown in a white info card on hover and focus. */
  how?: string;
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
  /** Small chip after the name line (client stage). */
  tag?: React.ReactNode;
  /** Company tile before the name (client home). */
  lead?: React.ReactNode;
  /** Small text after the tag: "6 of 25 steps". */
  sub?: React.ReactNode;
  /** One main action (R-17). */
  actions?: React.ReactNode;
  stats: StatItem[];
  /** Clock after the date: "12:31 PM" on staff portals. */
  time?: string;
}

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * R-17 (H3c): one compact home card on every portal home, about 80 px tall. The colour wash holds the greeting
 * or company on the left, five mini tiles in one row, and one main action on the right. It wraps on phones.
 */
export function GreetingCard({ date, name, eyebrow, tag, lead, sub, actions, stats, time }: GreetingCardProps) {
  const when = `${WD[date.getDay()]} ${fmt(date)}${time ? ` · ${time}` : ""}`;
  return (
    <section className="bg-wash flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-md border-1.5 border-line py-3.5 pl-5 pr-4" aria-label="Summary">
      <div className="mr-1 flex min-w-0 flex-none items-center gap-3">
        {lead}
        <div className="flex min-w-0 flex-col gap-[3px]">
          {!lead && <span className="text-12.5 text-wash-ink-2">{when}</span>}
          <h1 className="whitespace-nowrap text-20 font-medium text-ink">{eyebrow ? `${eyebrow}, ${name}` : name}</h1>
          {(tag || sub) && (
            <span className="flex items-center gap-2 whitespace-nowrap text-12.5 text-wash-ink-2">
              {tag}
              {sub}
            </span>
          )}
        </div>
      </div>
      <Tip.Provider>
        <div className="flex min-w-0 flex-[999_1_520px] flex-wrap gap-2">
          {stats.slice(0, 5).map((s) => (
            <MiniTile key={s.label} s={s} />
          ))}
        </div>
      </Tip.Provider>
      {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
    </section>
  );
}

/**
 * R-18 (home card): 56 px tile. A 12 px label, a 20 px number and a short 12 px note on the left;
 * a 52 x 24 trend line on the right where history exists, or a 44 px bar for a share.
 */
function MiniTile({ s }: { s: StatItem }) {
  const note = s.note ?? s.of;
  const inner = (
    <span className="flex h-full min-w-0 items-center gap-2">
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-[3px]">
        <span className="truncate text-12 font-medium text-muted">{s.label}</span>
        <span className="flex min-w-0 items-baseline gap-1.5">
          <b className={cn("whitespace-nowrap text-20 font-medium leading-none tabular-nums", s.bad ? "text-bad" : s.good ? "text-ok" : "text-ink")}>{s.value}</b>
          {note && <span className="truncate text-12 text-muted">{note}</span>}
          {s.bar !== undefined && (
            <span className="ml-0.5 block h-[5px] w-11 flex-none self-center overflow-hidden rounded-bar bg-raised" aria-hidden>
              <i className="block h-full rounded-bar bg-ok-mid" style={{ width: `${s.bar}%` }} />
            </span>
          )}
        </span>
      </span>
      {s.spark && <MiniSpark points={s.spark} className={cn("mini-spark", SPARK[s.sparkTone ?? (s.bad ? "bad" : s.good ? "ok" : "accent")])} />}
    </span>
  );
  const cls = cn(
    "mini-tile h-14 min-w-[104px] flex-[1_1_120px] rounded-md border border-wash-tile-line bg-wash-tile pl-3 pr-2.5 shadow-mini",
    s.href && "transition-colors hover:border-line-2",
  );
  const tile = s.href ? (
    <Link href={s.href} className={cls} aria-label={`${s.label}: ${s.value}${note ? `, ${note}` : ""}. Open the list`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
  if (!s.how) return tile;
  // E-04 (TP2): a white info card says how the number is counted and which list the tile opens (E-05).
  return (
    <Tip.Root delayDuration={350}>
      <Tip.Trigger asChild>{tile}</Tip.Trigger>
      <Tip.Portal>
        <Tip.Content side="bottom" align="start" sideOffset={6} collisionPadding={12} className="z-50 max-w-[260px] rounded-md border border-line bg-surface px-3 py-2.5 text-13 text-ink shadow-float">
          <b className="block text-12 font-medium text-muted">How is this counted?</b>
          <span className="mt-0.5 block leading-snug">{s.how}</span>
          {s.href && <span className="mt-1.5 block text-12 font-medium text-accent">Click to open the list</span>}
        </Tip.Content>
      </Tip.Portal>
    </Tip.Root>
  );
}

/** 52 x 24 trend line with a soft area and a dot on the last point. */
function MiniSpark({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const xy = points.map((p, i) => [2 + (i / (points.length - 1)) * 48, 20 - ((p - min) / (max - min || 1)) * 16] as const);
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lx, ly] = xy[xy.length - 1]!;
  return (
    <svg width="52" height="24" viewBox="0 0 52 24" className={cn("flex-none", className)} aria-hidden>
      <path d={`M2,24 L${line.replaceAll(" ", " L")} L50,24 Z`} fill="currentColor" fillOpacity=".14" />
      <polyline points={line} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.5" fill="currentColor" />
    </svg>
  );
}
