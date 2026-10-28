"use client";
import * as React from "react";
import Link from "next/link";
import * as P from "@radix-ui/react-popover";
import { ChevronDown, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Tabs, type TabItem } from "@/components/ui/Tabs";

// Old calendar filter bar (index.html calRedesign, cal-views.js picker):
// ‹ October ▾ 2026 ▾ ›, FY chip, area pill with counts, then Month / Year / Timeline and Filings on the right.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const monthKey = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, "0")}`;
export const parseKey = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m - 1 };
};
export const stepKey = (key: string, k: number) => {
  const { year, month } = parseKey(key);
  const t = year * 12 + month + k;
  return monthKey(Math.floor(t / 12), ((t % 12) + 12) % 12);
};

/** ‹ Month ▾ Year ▾ › with the old month / year picker pop-over. */
export function MonthNav({ value, onChange, now }: { value: string; onChange: (key: string) => void; now: string }) {
  const { year, month } = parseKey(value);
  const nowP = parseKey(now);
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"m" | "y">("m");
  const [viewY, setViewY] = React.useState(year);
  const [base, setBase] = React.useState(year - 12);
  const anchor = React.useRef<HTMLDivElement>(null);
  const yearsRef = React.useRef<HTMLDivElement>(null);
  const toggle = (m: "m" | "y") => {
    if (open && mode === m) return setOpen(false);
    setMode(m);
    setViewY(year);
    setBase(year - 12 - (((year - 12) % 4) + 4) % 4);
    setOpen(true);
  };
  React.useEffect(() => {
    if (open && mode === "y") {
      const g = yearsRef.current;
      const on = g?.querySelector<HTMLElement>("[data-on]");
      if (g && on) g.scrollTop = on.offsetTop - g.clientHeight / 2 + on.offsetHeight / 2;
    }
  }, [open, mode, base]);
  const pick = (key: string) => {
    onChange(key);
    setOpen(false);
  };
  const pkBtn = "inline-flex h-7 items-center gap-1 rounded-sm px-1.5 text-13 font-bold text-ink hover:bg-raised aria-expanded:bg-raised";
  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Anchor asChild>
        <div ref={anchor} className="inline-flex h-8 flex-none items-center rounded-md border border-line bg-surface px-0.5">
          <button type="button" className="grid h-7 w-6 place-items-center rounded-sm text-ink-2 hover:bg-raised" aria-label="Previous month" onClick={() => onChange(stepKey(value, -1))}>
            <ChevronLeft size={15} strokeWidth={1.5} />
          </button>
          <button type="button" className={pkBtn} aria-haspopup="dialog" aria-expanded={open && mode === "m"} aria-label="Choose month" onClick={() => toggle("m")}>
            {MONTHS[month]}
            <ChevronDown size={12} strokeWidth={2} className="text-muted" />
          </button>
          <button type="button" className={pkBtn} aria-haspopup="dialog" aria-expanded={open && mode === "y"} aria-label="Choose year" onClick={() => toggle("y")}>
            {year}
            <ChevronDown size={12} strokeWidth={2} className="text-muted" />
          </button>
          <button type="button" className="grid h-7 w-6 place-items-center rounded-sm text-ink-2 hover:bg-raised" aria-label="Next month" onClick={() => onChange(stepKey(value, 1))}>
            <ChevronRight size={15} strokeWidth={1.5} />
          </button>
        </div>
      </P.Anchor>
      <P.Portal>
        <P.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          onInteractOutside={(e) => {
            if (anchor.current?.contains(e.target as Node)) e.preventDefault();
          }}
          aria-label="Choose month and year"
          className="z-50 w-[304px] max-w-[calc(100vw-24px)] rounded-lg border border-line bg-surface p-3 text-ink shadow-pop outline-none"
        >
          <div className="mb-2.5 flex items-center justify-between gap-1.5">
            <button
              type="button"
              className="grid h-[30px] w-[30px] place-items-center rounded-md border border-line text-ink-2 hover:bg-raised"
              aria-label={mode === "m" ? "Previous year" : "Earlier years"}
              onClick={() => (mode === "m" ? setViewY(viewY - 1) : setBase(base - 32))}
            >
              <ChevronLeft size={15} strokeWidth={1.5} />
            </button>
            <span className="flex items-center gap-1">
              <button type="button" className={cn("inline-flex h-[30px] items-center gap-1 rounded-md px-2.5 text-14 font-bold hover:bg-raised", mode === "m" && "bg-raised")} onClick={() => setMode("m")}>
                {MONTHS[month]} <ChevronDown size={12} strokeWidth={2} className="text-muted" />
              </button>
              <button type="button" className={cn("inline-flex h-[30px] items-center gap-1 rounded-md px-2.5 text-14 font-bold hover:bg-raised", mode === "y" && "bg-raised")} onClick={() => setMode("y")}>
                {viewY} <ChevronDown size={12} strokeWidth={2} className="text-muted" />
              </button>
            </span>
            <button
              type="button"
              className="grid h-[30px] w-[30px] place-items-center rounded-md border border-line text-ink-2 hover:bg-raised"
              aria-label={mode === "m" ? "Next year" : "Later years"}
              onClick={() => (mode === "m" ? setViewY(viewY + 1) : setBase(base + 32))}
            >
              <ChevronRight size={15} strokeWidth={1.5} />
            </button>
          </div>
          {mode === "m" ? (
            <div className="grid grid-cols-3 gap-1" role="grid" aria-label={`Months of ${viewY}`}>
              {SHORT.map((s, k) => {
                const on = viewY === year && k === month;
                const isNow = viewY === nowP.year && k === nowP.month;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-label={`${MONTHS[k]} ${viewY}`}
                    aria-current={on ? "date" : undefined}
                    onClick={() => pick(monthKey(viewY, k))}
                    className={cn("h-[42px] rounded-md text-14 font-medium", on ? "bg-btn text-white" : "hover:bg-raised", !on && isNow && "shadow-[inset_0_0_0_1px_var(--navy)]")}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          ) : (
            <div ref={yearsRef} className="grid max-h-[240px] grid-cols-4 gap-1 overflow-y-auto" role="grid" aria-label="Years">
              {Array.from({ length: 32 }, (_, i) => base + i).map((y) => (
                <button
                  key={y}
                  type="button"
                  data-on={y === year ? "" : undefined}
                  onClick={() => pick(monthKey(y, month))}
                  className={cn("h-[42px] rounded-md font-mono text-13.5", y === year ? "bg-btn text-white" : "hover:bg-raised", y !== year && y === nowP.year && "shadow-[inset_0_0_0_1px_var(--navy)]")}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2.5 flex justify-end border-t border-line-soft pt-2">
            <button type="button" className="rounded-sm px-1 text-13 font-semibold text-accent hover:underline" onClick={() => pick(now)}>
              Today
            </button>
          </div>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}

/** The calendar bar that sits above the grid and the rail. */
export function CalendarBar({
  lead,
  month,
  onMonth,
  now,
  fy = "FY 2026-27",
  areas,
  area,
  onArea,
  view,
  onView,
  filingsHref,
}: {
  lead?: React.ReactNode;
  month: string;
  onMonth: (key: string) => void;
  now: string;
  fy?: string;
  areas: TabItem[];
  area: string;
  onArea: (key: string) => void;
  view: string;
  onView: (key: string) => void;
  /** The Filings button; left out when the page has its own. */
  filingsHref?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 xl:flex-nowrap">
      {lead}
      <span className={cn(view !== "month" && "invisible")}>
        <MonthNav value={month} onChange={onMonth} now={now} />
      </span>
      <span className="inline-flex h-8 flex-none items-center rounded-md bg-warn-soft px-2 font-mono text-11 font-semibold text-warn">{fy}</span>
      <Tabs items={areas} value={area} onChange={onArea} className="min-w-0 xl:flex-shrink [&_button]:px-2 xl:[&_button]:px-[7px]" />
      <span className="ml-auto flex flex-none items-center gap-1.5">
        <Tabs
          items={[
            { key: "month", label: "Month" },
            { key: "year", label: "Year" },
            { key: "timeline", label: "Timeline" },
          ]}
          value={view}
          onChange={onView}
        />
        {filingsHref && (
          <Button asChild size="sm" className="h-8 font-bold text-ink">
            <Link href={filingsHref}>
              <FileText size={14} strokeWidth={1.5} /> Filings
            </Link>
          </Button>
        )}
      </span>
    </div>
  );
}
