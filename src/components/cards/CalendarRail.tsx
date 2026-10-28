"use client";
import * as React from "react";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { AreaShort, CAL_FILL, CAL_STATUSES, CAL_STROKE, CalDateTile, CalStatusChip, worstStatus, type CalStatus } from "./MonthCalendar";

// Old calendar right rail (index.html donutCard, focusCard variant A, agendaRail): status donut,
// next deadline and coming up. The rail cards have no 52 px head, as in the old screen.

const card = "rounded-md border-1.5 border-line bg-surface";

/** Donut of the month with the four statuses. Click a ring part or a legend row to drill down. */
export function CalDonutCard({ counts, label, onPick }: { counts: Record<CalStatus, number>; label: string; onPick?: (s: CalStatus | "all") => void }) {
  const total = CAL_STATUSES.reduce((n, s) => n + counts[s], 0);
  const C = 2 * Math.PI * 35;
  let acc = 0;
  return (
    <div className={cn(card, "flex items-center gap-4 px-4 py-3")}>
      <svg width="88" height="88" viewBox="0 0 88 88" className="flex-none" role="img" aria-label={`${total} filings in ${label}`}>
        <circle cx="44" cy="44" r="35" fill="none" stroke="var(--line-soft)" strokeWidth="11" />
        {total > 0 &&
          CAL_STATUSES.map((s) => {
            const len = (C * counts[s]) / total;
            const el = counts[s] ? (
              <circle
                key={s}
                cx="44"
                cy="44"
                r="35"
                fill="none"
                stroke={CAL_STROKE[s]}
                strokeWidth="11"
                strokeDasharray={`${Math.max(len - 2, 0)} ${C}`}
                strokeDashoffset={-acc}
                transform="rotate(-90 44 44)"
                className={cn(onPick && "cursor-pointer")}
                onClick={() => onPick?.(s)}
              >
                <title>{`${s} · ${counts[s]}`}</title>
              </circle>
            ) : null;
            acc += len;
            return el;
          })}
        <text x="44" y="43" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--ink)" pointerEvents="none">
          {total}
        </text>
        <text x="44" y="58" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--muted)" pointerEvents="none">
          {label}
        </text>
      </svg>
      <ul className="grid min-w-0 flex-1 grid-cols-1 gap-1.5">
        {CAL_STATUSES.map((s) => (
          <li key={s}>
            {onPick ? (
              <button type="button" onClick={() => onPick(s)} className="flex w-full items-center gap-2 text-left text-12.5 font-semibold hover:text-accent">
                <i className={cn("h-2.5 w-2.5 flex-none rounded-[3px]", CAL_FILL[s])} aria-hidden />
                <span className="flex-1">{s}</span>
                <b className=" font-semibold">{counts[s]}</b>
              </button>
            ) : (
              <span className="flex w-full items-center gap-2 text-12.5 font-semibold">
                <i className={cn("h-2.5 w-2.5 flex-none rounded-[3px]", CAL_FILL[s])} aria-hidden />
                <span className="flex-1">{s}</span>
                <b className=" font-semibold">{counts[s]}</b>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface NextDeadline {
  days: number;
  title: React.ReactNode;
  /** Area tag and state chip under the title. */
  area: string;
  areaTitle?: string;
  state?: { label: string; tone: "ok" | "warn" | "idle" };
  /** More tags after the state chip, for example the client. */
  extra?: React.ReactNode;
  /** Shown after the title: the portal link. */
  link?: React.ReactNode;
  /** A line under the card for the first late item. */
  late?: { name: string; text: string; onClick?: () => void };
}

/** Old focusCard (owner pick A): days tile, the filing, its area and state, Open filing and Remind me. */
export function NextDeadlineCard({ next, onOpen, onRemind, onTile, reminded }: { next: NextDeadline; onOpen: () => void; onRemind: () => void; onTile?: () => void; reminded?: boolean }) {
  return (
    <div className={cn(card, "overflow-hidden")}>
      <div className="px-4 pb-3.5 pt-4">
        <div className="flex items-center gap-1.5 text-11 font-bold text-ink">
          <i className="h-1.5 w-1.5 rounded-[2px] bg-brand" aria-hidden />
          Next deadline
        </div>
        <div className="mt-2.5 flex items-center gap-3.5">
          <button type="button" onClick={onTile} className="grid h-[62px] w-[58px] flex-none place-content-center rounded-lg bg-idle-soft text-center leading-none text-ink" aria-label={`${next.days} days left`}>
            <b className="text-[28px] font-bold">{next.days}</b>
            <small className="mt-1 text-11 font-bold tracking-wide text-muted">{next.days === 1 ? "DAY" : "DAYS"}</small>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1 text-[18px] font-bold leading-tight tracking-tight">
              {next.title}
              {next.link}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <AreaShort title={next.areaTitle}>{next.area}</AreaShort>
              {next.state && (
                <Chip tone={next.state.tone} dot={false} className="h-5 gap-1 px-1.5 text-11.5">
                  {next.state.tone === "ok" && <Check size={11} strokeWidth={2.4} aria-hidden />}
                  {next.state.label}
                </Chip>
              )}
              {next.extra}
            </div>
          </div>
        </div>
        <div className="mt-3.5 flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" onClick={onOpen}>
            Open filing <ArrowRight size={13} strokeWidth={1.6} />
          </Button>
          {reminded ? (
            <Chip tone="ok" className="h-[30px]">
              Reminder set
            </Chip>
          ) : (
            <Button size="sm" className="text-ink" onClick={onRemind}>
              Remind me
            </Button>
          )}
        </div>
      </div>
      {next.late && (
        <button type="button" onClick={next.late.onClick} className="flex w-full items-center gap-2 border-t border-line-soft px-4 py-2.5 text-left text-12.5 hover:bg-raised">
          <i className="h-2 w-2 flex-none rounded-[2px] bg-bad-mid" aria-hidden />
          <b className="truncate font-bold">{next.late.name}</b>
          <span className="flex-none font-bold text-bad">{next.late.text}</span>
          <ChevronRight size={14} strokeWidth={1.6} className="ml-auto flex-none text-muted" />
        </button>
      )}
    </div>
  );
}

export interface ComingItem {
  id: string;
  date: Date;
  area: string;
  areaTitle?: string;
  name: string;
  status: CalStatus;
}

/** Old agendaRail "Coming up": one date tile per day, each filing with its area and status chip. */
export function ComingUpCard({ items, onPick, title = "Coming up" }: { items: ComingItem[]; onPick?: (id: string) => void; title?: string }) {
  const days: Array<[number, ComingItem[]]> = [];
  for (const it of items) {
    const t = it.date.getTime();
    const last = days[days.length - 1];
    if (last && last[0] === t) last[1].push(it);
    else days.push([t, [it]]);
  }
  return (
    <div className={cn(card, "px-4 pb-1.5 pt-3.5")}>
      <div className="mb-1 flex items-center gap-2 border-b border-line-soft pb-2">
        <h2 className="flex-1 text-12.5 font-bold">{title}</h2>
        <span className=" text-11 text-muted">{items.length}</span>
      </div>
      {days.length === 0 ? (
        <p className="py-3 text-13 text-faint">None</p>
      ) : (
        days.map(([t, list]) => (
          <div key={t} className="flex items-center gap-2.5 border-t border-line-soft py-2.5 first:border-t-0">
            <CalDateTile date={new Date(t)} status={worstStatus(list)} />
            <ul className="grid min-w-0 flex-1 grid-cols-1 gap-1.5">
              {list.map((x) => (
                <li key={x.id} className="min-w-0">
                  <button type="button" onClick={() => onPick?.(x.id)} className="flex w-full min-w-0 items-center gap-2 text-left hover:text-accent">
                    <AreaShort title={x.areaTitle}>{x.area}</AreaShort>
                    <span className="min-w-0 flex-1 truncate text-12.5 font-bold">{x.name}</span>
                    <CalStatusChip status={x.status} className="flex-none" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
