"use client";
import { cn } from "@/lib/cn";
import { TODAY } from "@/lib/dates";
import { barFill, type BarTone } from "@/components/ui/Bar";

export interface YearMonth {
  key: string;
  year: number;
  /** 0-based month. */
  month: number;
  /** "Oct 2026" */
  short: string;
}

export interface YearMark {
  date: Date;
  tone: BarTone;
  title: string;
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Twelve small months (cal-views.js Year view). A day with items is filled with the worst tone.
 * `legend` lists the tones from worst to best; each month shows a count per tone. Click a month to open it.
 */
export function YearGrid({ months, marks, legend, onPick, today = TODAY }: { months: YearMonth[]; marks: YearMark[]; legend: Array<{ tone: BarTone; label: string }>; onPick?: (key: string) => void; /** The day framed as today. */ today?: Date }) {
  const rank = (t: BarTone) => {
    const i = legend.findIndex((l) => l.tone === t);
    return i < 0 ? legend.length : i;
  };
  return (
    <div className="grid grid-cols-1 gap-3 p-4 min-[420px]:grid-cols-2 md:p-5 lg:grid-cols-3 2xl:grid-cols-4">
      {months.map((m) => {
        const inMonth = marks.filter((x) => x.date.getFullYear() === m.year && x.date.getMonth() === m.month);
        const lead = (new Date(m.year, m.month, 1).getDay() + 6) % 7;
        const days = new Date(m.year, m.month + 1, 0).getDate();
        const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => i - lead + 1);
        const now = m.year === today.getFullYear() && m.month === today.getMonth();
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onPick?.(m.key)}
            aria-label={`${m.short} · ${inMonth.length} filings · open the month`}
            className={cn("min-w-0 rounded-md border border-line bg-surface p-2.5 text-left hover:bg-raised", now && "shadow-[inset_0_0_0_2px_var(--navy)]")}
          >
            <span className="mb-1.5 flex items-center gap-2">
              <b className="flex-1 text-12.5 font-semibold">{m.short}</b>
              <span className="font-mono text-11 text-muted">{inMonth.length}</span>
            </span>
            <span className="grid grid-cols-7 gap-0.5">
              {cells.map((n, i) => {
                if (n < 1 || n > days) return <span key={i} className="h-5" />;
                const date = new Date(m.year, m.month, n);
                const list = inMonth.filter((x) => sameDay(x.date, date));
                const worst = list.length ? list.reduce((w, x) => (rank(x.tone) < rank(w.tone) ? x : w)).tone : undefined;
                const isToday = sameDay(date, today);
                return (
                  <span
                    key={i}
                    title={list.length ? list.map((x) => x.title).slice(0, 3).join(", ") + (list.length > 3 ? ` +${list.length - 3}` : "") : undefined}
                    className={cn(
                      "grid h-5 min-w-0 place-items-center rounded-sm font-mono text-[10.5px] tracking-tight",
                      worst ? cn(barFill[worst], "font-semibold text-white") : "text-faint",
                      isToday && !worst && "font-semibold text-ink shadow-[inset_0_0_0_1.5px_var(--navy)]",
                      isToday && worst && "shadow-[0_0_0_1.5px_var(--navy)]",
                    )}
                  >
                    {n}
                  </span>
                );
              })}
            </span>
            <span className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1 text-11.5 font-semibold text-muted">
              {legend.map((l) => {
                const c = inMonth.filter((x) => x.tone === l.tone).length;
                if (!c) return null;
                return (
                  <span key={l.tone} className="inline-flex items-center gap-1" title={l.label}>
                    <i className={cn("h-[7px] w-[7px] rounded-full", barFill[l.tone])} aria-hidden />
                    {c}
                  </span>
                );
              })}
              {inMonth.length === 0 && <span className="text-faint">None</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
