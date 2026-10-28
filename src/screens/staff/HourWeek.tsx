"use client";
import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { clientById, type StaffClient } from "@/data/staff-clients";
import type { AllDayItem, CalBlock } from "@/data/staff-work";

// Hour calendar: day columns, hours 9 AM to 6 PM, timed blocks in the client colour.
// Old sources: reference/old-screens/s/lead/Work.dc.html (H0 9, 44 px an hour), WorkPlan.dc.html, s/mgr/Leads.dc.html.

export const H0 = 9;
export const HOURS = 10;
const PX = 44;
const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** Block colours per client identity tone (R-35). Soft on the week view, solid in the plan dialog. */
const soft: Record<StaffClient["tone"], string> = {
  accent: "bg-accent-soft text-accent",
  violet: "bg-violet-soft text-violet",
  teal: "bg-teal-soft text-teal",
  warn: "bg-warn-soft text-warn",
  ok: "bg-ok-soft text-ok",
  idle: "bg-idle-soft text-idle",
};
const solid: Record<StaffClient["tone"], string> = {
  accent: "bg-accent text-white",
  violet: "bg-violet text-white",
  teal: "bg-teal text-white",
  warn: "bg-warn text-white",
  ok: "bg-ok text-white",
  idle: "bg-idle text-white",
};
const dashed: Record<StaffClient["tone"], string> = {
  accent: "border-accent text-accent",
  violet: "border-violet text-violet",
  teal: "border-teal text-teal",
  warn: "border-warn text-warn",
  ok: "border-ok text-ok",
  idle: "border-idle text-idle",
};

/** "10:00", "2:30" */
export function clockOf(h: number) {
  const hh = Math.floor(h + 1e-9);
  const m = Math.round((h - hh) * 60);
  return `${hh > 12 ? hh - 12 : hh}:${m < 10 ? "0" : ""}${m}`;
}
export const spanOf = (b: CalBlock) => `${clockOf(b.start)} to ${clockOf(b.end)}${b.end >= 12 ? " PM" : " AM"}`;
const hourLabel = (h: number) => `${h > 12 ? h - 12 : h} ${h >= 12 ? "PM" : "AM"}`;
const timeOf = (h: number) => `${clockOf(h)} ${h >= 12 ? "PM" : "AM"}`;

/** Where a block sits: day index, start and end hour. */
export type Slot = Pick<CalBlock, "day" | "start" | "end">;
type Edge = "move" | "top" | "bottom";
/** Drags snap to 15 minutes. A block is at least 30 minutes long (old Work.dc.html). */
const Q = 0.25;
const MIN = 0.5;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function slotAfter(b: CalBlock, edge: Edge, dx: number, dy: number, colW: number, nDays: number): Slot {
  const dh = Math.round(dy / PX / Q) * Q;
  if (edge === "top") return { day: b.day, start: clamp(b.start + dh, H0, b.end - MIN), end: b.end };
  if (edge === "bottom") return { day: b.day, start: b.start, end: clamp(b.end + dh, b.start + MIN, H0 + HOURS) };
  const len = b.end - b.start;
  const start = clamp(b.start + dh, H0, H0 + HOURS - len);
  return { day: clamp(b.day + Math.round(dx / colW), 0, nDays - 1), start, end: start + len };
}

/** Moved blocks, keyed by scope and block id. move() returns the undo. */
export function useBlockMoves() {
  const [moved, setMoved] = React.useState<Record<string, Slot>>({});
  const move = (key: string, to: Slot) => {
    const before = moved;
    setMoved({ ...moved, [key]: to });
    return () => setMoved(before);
  };
  return [moved, move] as const;
}

/** Top or bottom edge of a block: drag it, or focus it and press the up and down arrows. */
function EdgeHandle({ b, edge, onGrab, onNudge }: { b: CalBlock; edge: "top" | "bottom"; onGrab: (e: React.PointerEvent<HTMLElement>, b: CalBlock, edge: Edge) => void; onNudge: (e: React.KeyboardEvent, b: CalBlock, edge: "top" | "bottom") => void }) {
  const h = edge === "top" ? b.start : b.end;
  return (
    <span
      role="slider"
      tabIndex={0}
      aria-label={`${edge === "top" ? "Start" : "End"} time · ${b.title}`}
      aria-valuemin={H0}
      aria-valuemax={H0 + HOURS}
      aria-valuenow={h}
      aria-valuetext={timeOf(h)}
      onPointerDown={(e) => onGrab(e, b, edge)}
      onKeyDown={(e) => onNudge(e, b, edge)}
      className={cn("absolute inset-x-0 z-[2] h-2 cursor-ns-resize touch-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy", edge === "top" ? "top-0" : "bottom-0")}
    />
  );
}

export interface HourWeekProps {
  days: Date[];
  blocks: CalBlock[];
  allDay?: AllDayItem[];
  /** The day that shows the now line and the navy date box. */
  today?: Date;
  /** Hour of the now line on today, e.g. 12.5. */
  now?: number;
  /** Solid blocks with white text (plan dialog). */
  solidBlocks?: boolean;
  /** Show the day load ("3.5 h") under each day name. */
  showLoad?: boolean;
  /** Blocks the person left out (plan dialog). */
  skipped?: Set<string>;
  onBlock?: (b: CalBlock) => void;
  /** Blocks that onBlock acts on. Other blocks show as plain boxes, not buttons. Default: all blocks when onBlock is set. */
  canOpen?: (b: CalBlock) => boolean;
  /** Turns on drag-to-plan: drag a block to move it, drag its top or bottom edge to change the start or end. */
  onMove?: (b: CalBlock, to: Slot) => void;
  className?: string;
}

export function HourWeek({ days, blocks, allDay = [], today, now, solidBlocks, showLoad, skipped, onBlock, canOpen, onMove, className }: HourWeekProps) {
  const [live, setLive] = React.useState<(Slot & { id: string }) | null>(null);
  // A drag ends with a click on the block. This stops that click from opening the task.
  const dragged = React.useRef(false);
  const placed = live ? blocks.map((b) => (b.id === live.id ? { ...b, ...live } : b)) : blocks;

  const drag = React.useRef<{ b: CalBlock; edge: Edge; x0: number; y0: number; colW: number; to: Slot | null } | null>(null);

  const grab = (e: React.PointerEvent<HTMLElement>, b: CalBlock, edge: Edge) => {
    // Touch scrolls the page. On touch, only the edge handles drag.
    // An edge handle sits inside the block. Stop the block from starting a move as well.
    e.stopPropagation();
    if (e.button !== 0 || (edge === "move" && e.pointerType === "touch")) return;
    const colW = e.currentTarget.closest("[data-day]")?.getBoundingClientRect().width || 1;
    drag.current = { b, edge, x0: e.clientX, y0: e.clientY, colW, to: null };
  };
  const onDrag = (e: React.PointerEvent<HTMLElement>) => {
    const g = drag.current;
    if (!g || (!g.to && Math.abs(e.clientX - g.x0) + Math.abs(e.clientY - g.y0) < 4)) return;
    // From the first real move, the hour grid keeps the pointer while the block moves between day columns.
    // A plain click does not get here, so it still reaches the block.
    if (!g.to) e.currentTarget.setPointerCapture(e.pointerId);
    g.to = slotAfter(g.b, g.edge, e.clientX - g.x0, e.clientY - g.y0, g.colW, days.length);
    setLive({ id: g.b.id, ...g.to });
  };
  const onDrop = () => {
    const g = drag.current;
    drag.current = null;
    setLive(null);
    if (!g?.to) return;
    dragged.current = true;
    window.setTimeout(() => (dragged.current = false), 0);
    const { b, to } = g;
    if (to.day !== b.day || to.start !== b.start || to.end !== b.end) onMove?.(b, to);
  };
  const swallow = (e: React.MouseEvent) => {
    if (dragged.current) e.stopPropagation();
  };
  const nudge = (e: React.KeyboardEvent, b: CalBlock, edge: "top" | "bottom") => {
    const step = e.key === "ArrowUp" ? -Q : e.key === "ArrowDown" ? Q : 0;
    if (!step) return;
    e.preventDefault();
    const to = slotAfter(b, edge, 0, step * PX, 1, days.length);
    if (to.start !== b.start || to.end !== b.end) onMove?.(b, to);
  };

  const isToday = (x: Date) => !!today && x.getTime() === today.getTime();
  const cols = { gridTemplateColumns: `56px repeat(${days.length}, minmax(${days.length > 1 ? 80 : 200}px, 1fr))` };
  const load = (i: number) => blocks.filter((b) => b.day === i && !skipped?.has(b.id)).reduce((a, b) => a + (b.end - b.start), 0);
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className={cn("rounded-md border border-line", days.length > 1 && "min-w-[640px]")}>
        <div className="grid border-b border-line" style={cols}>
          <span className="border-r border-line-soft" aria-hidden />
          {days.map((x, i) => (
            <div key={i} className={cn("grid justify-items-center gap-1 border-r border-line-soft py-2 last:border-r-0", isToday(x) && "bg-raised")}>
              <span className="text-11 font-bold tracking-wide text-muted">{DOW[x.getDay()]}</span>
              <span className={cn("grid h-6 min-w-[26px] place-items-center rounded-sm px-1 text-14 font-semibold", isToday(x) && "border border-navy text-ink")}>{x.getDate()}</span>
              {showLoad && <span className="font-mono text-11 text-faint">{load(i)} h</span>}
            </div>
          ))}
        </div>
        {allDay.length > 0 && (
          <div className="grid border-b border-line" style={cols}>
            <span className="border-r border-line-soft px-1.5 py-1.5 text-right text-11 text-faint">All day</span>
            {days.map((x, i) => (
              <div key={i} className={cn("grid min-w-0 gap-1 border-r border-line-soft p-1 last:border-r-0", isToday(x) && "bg-raised")}>
                {allDay
                  .filter((a) => a.day === i)
                  .map((a) => (
                    <span
                      key={a.text}
                      title={a.kind === "locked" ? `${a.text} · manager date · locked` : `${a.text} · filing · read-only`}
                      className={cn("flex min-w-0 items-center gap-1 truncate rounded-sm border border-line border-l-[3px] bg-surface px-1.5 py-0.5 text-11.5 font-semibold", a.kind === "filing" ? "border-l-bad" : "border-l-navy")}
                    >
                      {a.kind === "locked" && <Lock size={11} strokeWidth={1.5} className="flex-none" aria-hidden />}
                      <span className="truncate">{a.text}</span>
                    </span>
                  ))}
              </div>
            ))}
          </div>
        )}
        <div data-hours className="grid" style={cols} onPointerMove={onMove ? onDrag : undefined} onPointerUp={onMove ? onDrop : undefined} onPointerCancel={onMove ? onDrop : undefined}>
          <div className="relative border-r border-line-soft" style={{ height: HOURS * PX }}>
            {Array.from({ length: HOURS }, (_, h) => (
              <span key={h} className="absolute right-1.5 whitespace-nowrap text-11 font-semibold text-ink-2" style={{ top: h * PX + 2 }}>
                {hourLabel(H0 + h)}
              </span>
            ))}
          </div>
          {days.map((x, i) => (
            <div key={i} data-day={i} className={cn("relative border-r border-line-soft last:border-r-0", isToday(x) && "bg-raised")} style={{ height: HOURS * PX }}>
              {Array.from({ length: HOURS }, (_, h) => (
                <i key={h} className="absolute inset-x-0 border-t border-line-soft" style={{ top: h * PX }} aria-hidden />
              ))}
              {placed
                .filter((b) => b.day === i)
                .map((b) => {
                  const c = clientById(b.client);
                  const tone = c?.tone ?? "idle";
                  const off = skipped?.has(b.id);
                  const active = !!onBlock && (canOpen ? canOpen(b) : true);
                  const held = live?.id === b.id;
                  const body = (
                    <>
                      <b className="block truncate font-semibold">{b.title}</b>
                      <span className="block truncate">{spanOf(b)}</span>
                      {b.note && <span className="block truncate text-11 opacity-80">{b.note}</span>}
                    </>
                  );
                  return (
                    <div
                      key={b.id}
                      title={`${b.title} · ${c?.short ?? ""} · ${spanOf(b)}${b.late ? " · after the due date" : ""}`}
                      onPointerDown={onMove ? (e) => grab(e, b, "move") : undefined}
                      onClickCapture={onMove ? swallow : undefined}
                      className={cn(
                        "absolute inset-x-1 z-[1] overflow-hidden rounded-md text-left text-11.5 leading-snug",
                        b.own ? cn("border-[1.5px] border-dashed bg-surface", dashed[tone]) : solidBlocks ? solid[tone] : soft[tone],
                        b.late && "ring-2 ring-warn ring-offset-1 ring-offset-surface",
                        off && "opacity-40",
                        active && "hover:brightness-95",
                        onMove && "cursor-grab select-none",
                        held && "z-[3] cursor-grabbing shadow-pop ring-2 ring-navy",
                      )}
                      style={{ top: (b.start - H0) * PX + 1, height: (b.end - b.start) * PX - 2 }}
                    >
                      {active ? (
                        <button type="button" onClick={() => onBlock?.(b)} className={cn("block h-full w-full px-1.5 py-1 text-left", onMove && "cursor-[inherit]")}>
                          {body}
                        </button>
                      ) : (
                        <div className="px-1.5 py-1">{body}</div>
                      )}
                      {onMove && (
                        <>
                          <EdgeHandle b={b} edge="top" onGrab={grab} onNudge={nudge} />
                          <EdgeHandle b={b} edge="bottom" onGrab={grab} onNudge={nudge} />
                        </>
                      )}
                    </div>
                  );
                })}
              {isToday(x) && now !== undefined && now >= H0 && now <= H0 + HOURS && (
                <span className="pointer-events-none absolute inset-x-0 z-[2] flex items-center" style={{ top: (now - H0) * PX }} aria-hidden>
                  <i className="-ml-1 h-2 w-2 rounded-full bg-brand" />
                  <i className="h-0.5 flex-1 bg-brand" />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
