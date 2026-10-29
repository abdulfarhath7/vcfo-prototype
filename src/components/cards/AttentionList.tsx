import * as React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { daysFrom, fmt, tile, urgency, type Urgency } from "@/lib/dates";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Empty } from "./SectionCard";

export interface AttentionRow {
  id: string;
  date: Date;
  title: string;
  sub?: string;
  chip: { label: string; tone?: ChipTone };
  /** Tint the full row soft red and show a small navy action (R-20). */
  urgent?: boolean;
  action?: { label: string; href: string };
  href?: string;
  /** Force the date tile tint. Default comes from the date. */
  tint?: Urgency;
  /** Show a red alert tile in place of the date tile, with a red left edge (old client alerts). */
  alert?: boolean;
}

const tileTone: Record<Urgency, string> = {
  bad: "border-transparent bg-bad-soft text-bad",
  warn: "border-transparent bg-warn-soft text-warn",
  prog: "border-accent-line bg-accent-soft text-accent",
  idle: "border-line bg-surface text-ink",
};

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** "Mon 19 Oct 2026": the exact date for tooltips (E-11). */
export const fullDate = (d: Date) => `${WD[d.getDay()]} ${fmt(d)} ${d.getFullYear()}`;

/** E-11: relative due words for attention lists. Plain dates stay in tables (R-29). */
export function dueWords(date: Date, today: Date) {
  const n = daysFrom(date, today);
  if (n < -1) return `${-n} days late`;
  if (n === -1) return "1 day late";
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  return `In ${n} days`;
}

/** 44 px date tile tinted by urgency. The exact date shows as a tooltip. */
export function DateTile({ date, tint, className }: { date: Date; tint?: Urgency; className?: string }) {
  const t = tile(date);
  const u = tint ?? urgency(date);
  return (
    <span title={fullDate(date)} className={cn("grid w-11 flex-none place-items-center rounded-md border-1.5 py-1 leading-none", tileTone[u], className)}>
      <b className="text-16 font-medium">{t.day}</b>
      <span className={cn("text-[10.5px] font-medium uppercase tracking-wider", u === "idle" ? "text-muted" : "opacity-80")}>{t.mon}</span>
    </span>
  );
}

/**
 * R-20: full-width rows, 44 px date tile, chip on the right, urgent row soft red with a navy action.
 * With `today` (due lists only), the sub line starts with relative words: "In 3 days", "2 days late" (E-11).
 */
export function AttentionList({ rows, className, today }: { rows: AttentionRow[]; className?: string; today?: Date }) {
  if (rows.length === 0) return <Empty />;
  return (
    <ul className={className}>
      {rows.map((r) => {
        const body = (
          <>
            {r.alert ? (
              <span className="grid h-11 w-11 flex-none place-items-center rounded border border-bad bg-surface text-bad" aria-hidden>
                <AlertCircle size={16} strokeWidth={1.6} />
              </span>
            ) : (
              <DateTile date={r.date} tint={r.tint} />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-13.5 font-semibold">{r.title}</span>
              {r.alert ? (
                <Chip tone={r.chip.tone} className="mt-1">{r.chip.label}</Chip>
              ) : (
                (r.sub || today) && (
                  <span className="block truncate text-12.5 text-muted">
                    {today && (
                      <span title={fullDate(r.date)} className={cn(daysFrom(r.date, today) < 0 ? "text-bad" : daysFrom(r.date, today) <= 3 ? "text-warn" : undefined)}>
                        {dueWords(r.date, today)}
                      </span>
                    )}
                    {today && r.sub && " · "}
                    {r.sub}
                  </span>
                )
              )}
            </span>
            <span className="flex flex-none items-center gap-2">
              {!r.alert && <Chip tone={r.chip.tone} fixed>{r.chip.label}</Chip>}
              {r.action && (
                <Button asChild variant="strong" size="sm">
                  <Link href={r.action.href}>{r.action.label}</Link>
                </Button>
              )}
            </span>
          </>
        );
        const cls = cn("flex items-center gap-3 border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5", r.urgent && "bg-bad-soft",
          r.alert && "border-l-2 border-l-bad", r.href && "hover:bg-hover");
        return (
          <li key={r.id}>
            {r.href ? (
              <Link href={r.href} className={cls}>
                {body}
              </Link>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
