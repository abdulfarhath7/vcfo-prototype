import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtLong } from "@/lib/dates";
import { IconTile } from "@/components/ui/IconTile";
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
  href?: string;
}

/** R-18: 30 px tinted icon tile, 12 px gap, label above the number. */
export function NumberStrip({ items, className }: { items: StatItem[]; className?: string }) {
  const n = items.length;
  return (
    <div className={cn("grid grid-cols-2 bg-surface md:grid-cols-3", n >= 6 ? "xl:grid-cols-6" : n === 5 ? "xl:grid-cols-5" : n === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3", className)}>
      {items.map((s, i) => {
        const inner = (
          <>
            <IconTile Icon={s.Icon} tone={s.tone} size={30} className="mt-0.5" />
            <span className="min-w-0">
              <span className="block truncate text-12.5 text-muted">{s.label}</span>
              <span className={cn("block text-24 font-semibold leading-tight tracking-tight", s.bad && "text-bad")}>
                {s.value}
                {s.of && <small className="ml-1 text-14 font-medium text-muted">{s.of}</small>}
              </span>
            </span>
          </>
        );
        const cls = cn(
          "flex items-start gap-3 px-4 py-3.5 md:px-5",
          "border-t border-line-soft md:border-t-0",
          i % 2 === 1 && "border-l border-line-soft",
          "md:border-l md:[&:nth-child(3n+1)]:border-l-0",
          n >= 4 && "xl:[&:nth-child(3n+1)]:border-l xl:first:border-l-0",
          i < 2 && "border-t-0",
          i >= 3 && "md:border-t",
          i >= Math.min(n, 6) && "xl:border-t",
          "xl:border-t-0",
          s.href && "hover:bg-raised",
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

export interface GreetingCardProps {
  date: Date;
  name: string;
  /** Small line above the name: "Good morning, Bharath" on staff portals. */
  eyebrow?: string;
  /** Chip or small text after the name. */
  tag?: React.ReactNode;
  actions?: React.ReactNode;
  stats: StatItem[];
}

/** R-17: navy band with date, name and actions. White number strip below. Same on every portal. */
export function GreetingCard({ date, name, eyebrow, tag, actions, stats }: GreetingCardProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface" aria-label="Summary">
      <div className="flex flex-wrap items-center gap-3 bg-navy px-4 py-4 text-white md:px-6 md:py-[18px]">
        <div className="min-w-0">
          <div className="text-12.5 text-navy-ink">{eyebrow ?? fmtLong(date)}</div>
          <h1 className="flex flex-wrap items-center gap-2.5 text-[20px] font-semibold leading-tight tracking-tight md:text-22">
            <span className="truncate">{name}</span>
            {tag}
          </h1>
          {eyebrow && <div className="text-12.5 text-navy-ink">{fmtLong(date)}</div>}
        </div>
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <NumberStrip items={stats} />
    </section>
  );
}
