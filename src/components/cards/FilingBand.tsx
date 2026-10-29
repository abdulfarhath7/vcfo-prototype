import * as React from "react";
import { cn } from "@/lib/cn";
import { AreaPill } from "@/components/ui/Chip";

// Spectrum Compliances "By filing" (Compliances.dc.html): the band over each filing's client rows.
// Shared by the staff Filings and Obligations pages, so both bands look the same.

/** B-06 date tile tints: red overdue, amber due soon, blurple later, green filed, grey none. */
export type DateTone = "bad" | "warn" | "accent" | "ok" | "idle";

const TILE: Record<DateTone, string> = {
  bad: "bg-bad-soft text-bad",
  warn: "bg-warn-soft text-warn",
  accent: "bg-accent-soft text-accent",
  ok: "bg-ok-soft text-ok",
  idle: "bg-raised text-ink-2",
};

/** 44 px date tile: day over the month in small capitals. */
export function DateTile({ day, month, tone, className }: { day: number | string; month: string; tone: DateTone; className?: string }) {
  return (
    <span className={cn("inline-flex h-11 w-11 flex-none flex-col items-center justify-center rounded-md leading-none", TILE[tone], className)} aria-label={`Due ${day} ${month}`}>
      <b className="text-16 font-medium">{day}</b>
      <span className="mt-[3px] text-[10.5px] font-medium uppercase tracking-[.06em]">{month}</span>
    </span>
  );
}

/** "3 of 5 filed" with a 8 px green bar (G1). The track is white because the band is grey. */
export function FiledBar({ filed, total, className }: { filed: number; total: number; className?: string }) {
  const pct = total ? Math.round((filed / total) * 100) : 0;
  return (
    <span className={cn("flex w-[190px] items-center gap-2.5", className)}>
      <span className="whitespace-nowrap text-12.5 font-normal text-muted">
        {filed} of {total} filed
      </span>
      <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-bar bg-surface" role="progressbar" aria-label={`${filed} of ${total} filed`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <i className="absolute inset-y-0 left-0 rounded-bar bg-ok-mid" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

/** Band of one filing: date tile, name and due line, area pill, filed count with a bar. Wraps on a phone. */
export function FilingBand({ day, month, tone, name, sub, area, filed, total }: { day: number | string; month: string; tone: DateTone; name: string; sub: string; area: string; filed: number; total: number }) {
  return (
    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3.5 gap-y-2">
      <DateTile day={day} month={month} tone={tone} />
      <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
        <span className="truncate text-14.5 font-medium text-ink">{name}</span>
        <span className="text-12.5 text-muted">{sub}</span>
      </span>
      <AreaPill area={area} />
      <FiledBar filed={filed} total={total} />
    </span>
  );
}
