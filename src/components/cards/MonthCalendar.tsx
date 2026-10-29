"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Chip, regOf, type Regulator } from "@/components/ui/Chip";
import { PopoverCard } from "@/components/ui/PopoverCard";

// Old compliance calendar (reference/old-screens/s/comp/index.html monthGrid, v6 grid lines).
// One table: a tinted weekday band, a line between every date, today framed as a whole cell.
// Each day shows its number tinted by the worst status, a count in the corner and up to two tags.

/** The four statuses of the old calendar. */
export type CalStatus = "Filed" | "Due soon" | "Overdue" | "Upcoming";
export const CAL_STATUSES: CalStatus[] = ["Filed", "Due soon", "Overdue", "Upcoming"];

export interface CalItem {
  id: string;
  date: Date;
  label: string;
  status: CalStatus;
  /** A non-statutory task (C-3): a hollow square before the label. */
  task?: boolean;
  /** Hover text, for example "Starts 12 Oct · High". */
  hint?: string;
}

/** Worst first: the day takes the tint of its worst item (old RANK: over, due, up, ok). */
const RANK: CalStatus[] = ["Overdue", "Due soon", "Upcoming", "Filed"];
export const worstStatus = (list: Array<{ status: CalStatus }>): CalStatus => RANK.find((s) => list.some((i) => i.status === s)) ?? "Upcoming";

/** Soft tint for a day number or a date tile. */
export const CAL_TINT: Record<CalStatus, string> = {
  Overdue: "bg-bad-soft text-bad",
  "Due soon": "bg-warn-soft text-warn",
  Upcoming: "bg-idle-soft text-ink",
  Filed: "bg-ok-soft text-ok",
};

/** Solid mark: the left edge of a tag, a legend square, a dot. */
export const CAL_FILL: Record<CalStatus, string> = {
  Overdue: "bg-bad-mid",
  "Due soon": "bg-warn-mid",
  Upcoming: "bg-faint",
  Filed: "bg-ok-mid",
};

/** Donut stroke for each status. */
export const CAL_STROKE: Record<CalStatus, string> = {
  Filed: "var(--ok-mid)",
  "Due soon": "var(--warn-mid)",
  Overdue: "var(--bad-mid)",
  Upcoming: "var(--faint)",
};

const CHIP_TONE = { Filed: "ok", "Due soon": "warn", Overdue: "bad", Upcoming: "idle" } as const;

/** Status chip with its icon (old chip(): filled glyph and label). */
export function CalStatusChip({ status, className, compact }: { status: CalStatus; className?: string; compact?: boolean }) {
  // Compact (narrow rails): the status dot only; the word stays for screen readers.
  if (compact)
    return (
      <span title={status} className={cn("inline-flex h-6 w-6 flex-none items-center justify-center rounded-md", CAL_CHIP_SOFT[CHIP_TONE[status]], className)}>
        <i className={cn("h-[7px] w-[7px] rounded-[2px]", CAL_CHIP_DOT[CHIP_TONE[status]])} aria-hidden />
        <span className="sr-only">{status}</span>
      </span>
    );
  return (
    <Chip tone={CHIP_TONE[status]} fixed className={className}>
      {status}
    </Chip>
  );
}

const CAL_CHIP_SOFT: Record<string, string> = { ok: "bg-ok-soft", warn: "bg-warn-soft", bad: "bg-bad-soft", idle: "bg-idle-soft", prog: "bg-accent-soft", teal: "bg-teal-soft", violet: "bg-violet-soft" };
const CAL_CHIP_DOT: Record<string, string> = { ok: "bg-ok-mid", warn: "bg-warn-mid", bad: "bg-bad-mid", idle: "bg-idle-mid", prog: "bg-accent-mid", teal: "bg-teal-mid", violet: "bg-violet-mid" };

/** C-3: the non-statutory mark. An 8 px hollow square in ink-2; statutory items keep the solid regulator swatch. */
export function TaskMark({ className }: { className?: string }) {
  return <i className={cn("h-2 w-2 flex-none rounded-[2px] border-1.5 border-ink-2", className)} aria-hidden />;
}

/** Short area tag for tight spots (IT, GST, PAY, FEMA, MCA): the R-43 swatch and the short word. `task` shows the hollow task mark. */
export function AreaShort({ children, title, task }: { children: React.ReactNode; title?: string; task?: boolean }) {
  const word = typeof children === "string" ? children : "";
  const r = regOf(word === "PAY" ? "Payroll" : word === "IT" ? "Income tax" : title ?? word);
  return (
    <span title={title} className="inline-flex h-5 flex-none items-center gap-1 rounded-sm border-1.5 border-line bg-surface px-1.5 text-11 font-medium text-ink-2">
      {task ? <TaskMark /> : <i className={cn("h-1.5 w-1.5 flex-none rounded-[2px]", r ? REG_DOT[r] : "bg-idle-mid")} aria-hidden />}
      {children}
    </span>
  );
}

const REG_DOT: Record<Regulator, string> = { mca: "bg-reg-mca", gst: "bg-reg-gst", it: "bg-reg-it", payroll: "bg-reg-payroll", fema: "bg-reg-fema", labour: "bg-reg-labour" };

/** 44 px date tile tinted by status: day number over the weekday. */
export function CalDateTile({ date, status, className }: { date: Date; status: CalStatus; className?: string }) {
  return (
    <span className={cn("grid h-12 w-11 flex-none place-content-center rounded-md text-center leading-none", CAL_TINT[status], className)} aria-hidden>
      <b className="text-[18px] font-bold">{date.getDate()}</b>
      <small className="mt-1 text-11 font-semibold opacity-85">{WD[date.getDay()]}</small>
    </span>
  );
}

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function gridDays(year: number, month: number) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: Math.ceil((lead + count) / 7) * 7 }, (_, i) => new Date(year, month, 1 - lead + i));
}

/**
 * Month grid of the compliance calendar. Click a day with items to open its pop-over.
 * `dayTitle` and `dayBody` fill the pop-over; `dayBody` gets a `close` callback.
 */
export function MonthCalendar({
  year,
  month,
  today,
  items,
  dayTitle,
  dayBody,
  className,
}: {
  year: number;
  /** 0-based month. */
  month: number;
  today: Date;
  items: CalItem[];
  dayTitle?: (date: Date, list: CalItem[]) => React.ReactNode;
  dayBody?: (date: Date, list: CalItem[], close: () => void) => React.ReactNode;
  className?: string;
}) {
  const [openDay, setOpenDay] = React.useState<number | null>(null);
  const days = gridDays(year, month);
  return (
    <div className={cn("overflow-hidden rounded-md border border-line", className)}>
      <div className="grid grid-cols-7">
        {HEAD.map((w) => (
          <div key={w} className="border-b border-line bg-navy-tint px-1.5 py-1.5 text-11 font-bold uppercase tracking-wider text-muted md:px-2">
            {w}
          </div>
        ))}
        {days.map((day, i) => {
          const inMonth = day.getMonth() === month;
          const isToday = sameDay(day, today);
          const list = inMonth ? items.filter((x) => sameDay(x.date, day)) : [];
          const s = list.length ? worstStatus(list) : undefined;
          const t = day.getTime();
          const lastRow = i >= days.length - 7;
          const cls = cn(
            "relative flex h-[60px] w-full min-w-0 flex-col gap-1 bg-surface p-1 text-left md:h-24 md:px-2 md:py-1.5",
            i % 7 !== 6 && "border-r border-line",
            !lastRow && "border-b",
            "border-line",
            isToday && "bg-accent-soft shadow-[inset_0_0_0_2px_var(--accent)]",
            !isToday && openDay === t && "shadow-[inset_0_0_0_2px_var(--accent-line)]",
          );
          const head = (
            <span className="flex items-center gap-1">
              <span
                className={cn(
                  "inline-grid h-6 min-w-6 place-items-center rounded-sm px-1 text-13 font-bold",
                  !inMonth ? "text-faint" : s ? CAL_TINT[s] : "text-ink",
                )}
                aria-current={isToday ? "date" : undefined}
              >
                {day.getDate()}
              </span>
              {list.length > 1 && <span className="ml-auto hidden text-11 text-muted md:inline">{list.length}</span>}
            </span>
          );
          if (!list.length)
            return (
              <div key={t} className={cls}>
                {head}
              </div>
            );
          return (
            <PopoverCard
              key={t}
              open={openDay === t}
              onOpenChange={(v) => setOpenDay(v ? t : null)}
              width={340}
              side="right"
              align="start"
              title={dayTitle?.(day, list)}
              label={`${day.getDate()} ${MONTHS[month]}`}
              trigger={
                <button type="button" className={cn(cls, "hover:bg-raised", isToday && "hover:bg-accent-soft")} aria-label={`${day.getDate()} ${MONTHS[month]}, ${list.length} filing${list.length > 1 ? "s" : ""}`}>
                  {head}
                  <span className="hidden min-w-0 flex-col gap-1 md:flex">
                    {list.slice(0, 2).map((x) => (
                      <span key={x.id} title={x.hint} className="flex h-5 min-w-0 items-center gap-1.5 overflow-hidden rounded-[3px] bg-navy-tint pr-1.5 text-11 font-semibold text-ink">
                        <i className={cn("w-[3px] flex-none self-stretch rounded-l-[3px]", CAL_FILL[x.status])} aria-hidden />
                        {x.task && <TaskMark />}
                        <span className="truncate">{x.label}</span>
                      </span>
                    ))}
                    {list.length > 2 && <span className="pl-0.5 text-11 font-bold text-accent">+{list.length - 2} more</span>}
                  </span>
                  <span className="flex flex-wrap gap-0.5 md:hidden" aria-hidden>
                    {list.map((x) => (x.task ? <TaskMark key={x.id} className="h-1.5 w-1.5 border" /> : <i key={x.id} className={cn("h-1.5 w-1.5 rounded-[2px]", CAL_FILL[x.status])} />))}
                  </span>
                </button>
              }
            >
              {dayBody?.(day, list, () => setOpenDay(null))}
            </PopoverCard>
          );
        })}
      </div>
    </div>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
