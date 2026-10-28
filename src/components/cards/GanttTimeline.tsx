"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { StepMark } from "@/components/ui/StepMark";
import { fmt, frac, TODAY } from "@/lib/dates";
import { Chevron } from "@/components/ui/Chevron";

export type BarKind = "done" | "late" | "cur" | "rest" | "plan";
export type RowStatus = "done" | "current" | "planned";

export interface GanttBar {
  from: Date;
  to: Date;
  kind: BarKind;
}

export interface GanttRow {
  id: string;
  name: string;
  sub?: string;
  status: RowStatus;
  bars: GanttBar[];
  /** Orange COI diamond (R-21). */
  milestone?: Date;
  /** Right column: "5/5", "3d late". */
  count?: string;
  note?: { text: string; bad?: boolean };
  /** Text right after the last bar or the diamond: "Done 28 Sep", "11%", "9 Nov" (old record timeline). */
  label?: string;
  /** Rows that expand show this. */
  detail?: React.ReactNode;
}

const barCls: Record<BarKind, string> = {
  done: "bg-ok-mid",
  late: "bg-bad-mid",
  cur: "bg-primary",
  rest: "hatch",
  plan: "bg-raised shadow-[inset_0_0_0_1px_var(--line)]",
};

/** R-22 (ST5): one marker per row. Done green tick, current a ring with a blurple square, planned a dashed square. */
export function StatusCircle({ status, className }: { status: RowStatus; className?: string }) {
  return <StepMark state={status === "done" ? "done" : status === "current" ? "now" : "next"} size={20} className={className} label={status} />;
}

export interface GanttTimelineProps {
  start: Date;
  end: Date;
  ticks: Date[];
  rows: GanttRow[];
  today?: Date;
  /** 280 px name column so "Phase 1 · Name application" fits on one line. */
  wideNames?: boolean;
  /** Drop the right count column when rows use `label`. */
  noCount?: boolean;
  className?: string;
}

/** R-21: Gantt with 46 px rows, 16 px bars with 6 px corners, orange today line, orange COI diamond. */
export function GanttTimeline({ start, end, ticks, rows, today = TODAY, wideNames, noCount, className }: GanttTimelineProps) {
  const [open, setOpen] = React.useState<string | null>(null);
  const x = (d: Date) => `${frac(d, start, end) * 100}%`;
  const todayX = x(today);
  const cols = cn(
    noCount ? "grid-cols-[minmax(140px,200px)_minmax(0,1fr)_16px]" : "grid-cols-[minmax(140px,200px)_minmax(0,1fr)_72px]",
    wideNames
      ? noCount
        ? "md:grid-cols-[280px_minmax(0,1fr)_56px]"
        : "md:grid-cols-[280px_minmax(0,1fr)_100px]"
      : noCount
        ? "md:grid-cols-[230px_minmax(0,1fr)_56px]"
        : "md:grid-cols-[230px_minmax(0,1fr)_100px]",
  );
  const endOf = (r: GanttRow) => {
    const t = Math.max(r.milestone ? r.milestone.getTime() : 0, ...r.bars.map((b) => b.to.getTime()));
    return t ? new Date(t) : null;
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="min-w-[560px]">
        <div className={cn("grid h-[46px] items-end px-4 pb-1.5 text-11.5 text-faint md:px-5", cols)}>
          <span />
          <div className="relative h-full">
            <div className="absolute inset-x-0 bottom-0 flex justify-between">
              {ticks.map((t) => (
                <span key={t.getTime()} className="w-0 whitespace-nowrap">
                  {fmt(t)}
                </span>
              ))}
            </div>
            <span className="absolute -bottom-1.5 h-[22px] border-l-[1.5px] border-brand" style={{ left: todayX }}>
              <span className="absolute -left-6 -top-[22px] rounded-sm bg-brand px-1.5 py-px text-[10.5px] font-medium text-white">Today</span>
            </span>
          </div>
          <span />
        </div>
        {rows.map((r) => {
          const expandable = !!r.detail;
          const isOpen = open === r.id;
          return (
            <div key={r.id} className="border-t border-line-soft">
              <div
                className={cn("grid h-row items-center px-4 md:px-5", cols, expandable && "cursor-pointer hover:bg-hover")}
                onClick={expandable ? () => setOpen(isOpen ? null : r.id) : undefined}
                role={expandable ? "button" : undefined}
                aria-expanded={expandable ? isOpen : undefined}
              >
                <div className="flex min-w-0 items-center gap-2 text-14 font-medium">
                  {expandable ? <Chevron open={isOpen} /> : <span className="w-4" />}
                  <StatusCircle status={r.status} />
                  <span className="min-w-0 truncate">
                    {r.name}
                    {r.sub && <small className="block truncate text-12 font-normal text-muted">{r.sub}</small>}
                  </span>
                </div>
                <div className="relative h-full">
                  {r.bars.map((b, i) => (
                    <span
                      key={i}
                      className={cn("absolute top-1/2 h-[14px] -translate-y-1/2 rounded-bar", barCls[b.kind], b.kind === "late" && "rounded-l-none")}
                      style={{ left: x(b.from), width: `calc(${x(b.to)} - ${x(b.from)})` }}
                    />
                  ))}
                  {r.milestone && (
                    <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-brand" style={{ left: x(r.milestone) }} aria-label={`Milestone ${fmt(r.milestone)}`} />
                  )}
                  <span className="absolute inset-y-0 border-l-[1.5px] border-brand" style={{ left: todayX }} aria-hidden />
                  {r.label && endOf(r) && (
                    <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-2.5 text-12.5 font-medium text-muted" style={{ left: x(endOf(r)!) }}>
                      {r.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap text-12.5 text-muted">
                  {r.count && <b className="font-semibold text-ink">{r.count}</b>}
                  {r.note && <span className={cn(r.note.bad && "font-semibold text-bad")}>{r.note.text}</span>}
                </div>
              </div>
              {isOpen && r.detail && <div className="border-t border-line-soft bg-raised">{r.detail}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
