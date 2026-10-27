"use client";
import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { barFill, type BarTone } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";

export interface WindowItem {
  id: string;
  title: string;
  due: Date;
  start: Date;
  end: Date;
  tone: BarTone;
  /** Filed: the window cannot move. */
  locked?: boolean;
}

export interface WindowLane {
  id: string;
  label: string;
  /** Group row (area name): no bars. */
  group?: boolean;
  items?: WindowItem[];
}

const DAY = 86400000;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ZMAX = 40;

const dayN = (date: Date, from: Date) => Math.round((date.getTime() - from.getTime()) / DAY);
const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

/**
 * Filing windows on a zoomable strip (cal-views.js Timeline view). Drag a bar to move it, drag an edge to resize it.
 * Arrow keys move a focused bar; Shift + arrow resizes it. Filed bars are locked. The parent keeps the dates and the undo.
 */
export function FilingWindows({
  start,
  end,
  lanes,
  onChange,
  onLocked,
  focus,
}: {
  start: Date;
  end: Date;
  lanes: WindowLane[];
  onChange: (id: string, s: Date, e: Date) => void;
  onLocked?: (item: WindowItem) => void;
  /** Scroll to this date on first paint. */
  focus?: Date;
}) {
  const days = dayN(end, start);
  const vp = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(800);
  const [ppd, setPpd] = React.useState<number | null>(null);
  const [live, setLive] = React.useState<{ id: string; s: number; e: number } | null>(null);
  const drag = React.useRef<{ id: string; mode: "move" | "start" | "end"; x0: number; s0: number; e0: number; snap: number } | null>(null);

  React.useEffect(() => {
    const el = vp.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const minP = width / days;
  const fitP = Math.max(minP, Math.min(ZMAX, width / 61));
  const p = Math.max(minP, Math.min(ZMAX, ppd ?? fitP));
  const level = p >= 20 ? "Days" : p >= 7 ? "Weeks" : "Months";
  const snap = p < 7 ? 7 : 1;

  React.useEffect(() => {
    if (ppd === null && vp.current && focus) vp.current.scrollLeft = dayN(focus, start) * fitP - 4;
    // first paint only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const zoom = (np: number) => {
    const el = vp.current;
    const mid = el ? (el.scrollLeft + el.clientWidth / 2) / p : 0;
    const next = Math.max(minP, Math.min(ZMAX, np));
    setPpd(next);
    requestAnimationFrame(() => {
      if (el) el.scrollLeft = mid * next - el.clientWidth / 2;
    });
  };

  const ruler: React.ReactNode[] = [];
  for (let n = 0; n <= days; n++) {
    const d = addDays(start, n);
    if (d.getDate() === 1)
      ruler.push(
        <span key={`m${n}`} className="absolute top-1 h-3.5 whitespace-nowrap border-l border-line pl-1.5 text-11 font-semibold leading-[14px] text-ink-2" style={{ left: n * p }}>
          {MON[d.getMonth()]} {d.getFullYear()}
        </span>,
      );
    const tick = level === "Days" ? true : level === "Weeks" ? d.getDay() === 1 : d.getDate() === 15;
    if (tick)
      ruler.push(
        <span key={`t${n}`} className="absolute bottom-1 -translate-x-1/2 whitespace-nowrap font-mono text-[10.5px] text-faint" style={{ left: n * p + (level === "Days" ? p / 2 : 0) }}>
          {level === "Weeks" ? fmt(d) : d.getDate()}
        </span>,
      );
  }

  const win = (it: WindowItem) => (live && live.id === it.id ? { s: live.s, e: live.e } : { s: dayN(it.start, start), e: dayN(it.end, start) });

  const onDown = (e: React.PointerEvent, it: WindowItem, mode: "move" | "start" | "end") => {
    e.preventDefault();
    e.stopPropagation();
    if (it.locked) {
      onLocked?.(it);
      return;
    }
    const w = win(it);
    drag.current = { id: it.id, mode, x0: e.clientX, s0: w.s, e0: w.e, snap };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setLive({ id: it.id, s: w.s, e: w.e });
  };
  const onMove = (e: React.PointerEvent) => {
    const g = drag.current;
    if (!g) return;
    const dd = Math.round((e.clientX - g.x0) / p / g.snap) * g.snap;
    let s = g.s0;
    let en = g.e0;
    if (g.mode === "move") {
      s += dd;
      en += dd;
    } else if (g.mode === "start") s = Math.min(en - 1, s + dd);
    else en = Math.max(s + 1, en + dd);
    setLive({ id: g.id, s: Math.max(0, s), e: Math.min(days, en) });
  };
  const onUp = () => {
    const g = drag.current;
    drag.current = null;
    if (g && live && (live.s !== g.s0 || live.e !== g.e0)) onChange(g.id, addDays(start, live.s), addDays(start, live.e));
    setLive(null);
  };
  const onKey = (e: React.KeyboardEvent, it: WindowItem) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    if (it.locked) {
      onLocked?.(it);
      return;
    }
    const w = win(it);
    const d = (e.key === "ArrowRight" ? 1 : -1) * snap;
    if (e.shiftKey) onChange(it.id, addDays(start, w.s), addDays(start, Math.max(w.s + 1, w.e + d)));
    else onChange(it.id, addDays(start, w.s + d), addDays(start, w.e + d));
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md border border-line bg-raised p-0.5" role="group" aria-label="Zoom the timeline">
          <Button size="iconSm" variant="ghost" onClick={() => zoom(p / 1.5)} disabled={p <= minP + 0.01} aria-label="Zoom out">
            <Minus size={14} strokeWidth={1.5} />
          </Button>
          <span className="min-w-[56px] text-center text-12 font-semibold text-muted">{level}</span>
          <Button size="iconSm" variant="ghost" onClick={() => zoom(p * 1.5)} disabled={p >= ZMAX - 0.01} aria-label="Zoom in">
            <Plus size={14} strokeWidth={1.5} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => zoom(fitP)}>
            Fit
          </Button>
        </span>
      </div>
      <div className="grid grid-cols-[minmax(96px,140px)_minmax(0,1fr)] overflow-hidden rounded-md border border-line select-none">
        <div className="border-r border-line">
          <div className="h-10 border-b border-line" />
          {lanes.map((l) =>
            l.group ? (
              <div key={l.id} className="flex h-6 items-center bg-raised px-2.5 text-11.5 font-semibold text-muted">
                {l.label}
              </div>
            ) : (
              <div key={l.id} className="flex h-[30px] items-center truncate border-t border-line-soft px-2.5 text-12 font-semibold" title={l.label}>
                <span className="truncate">{l.label}</span>
              </div>
            ),
          )}
        </div>
        <div ref={vp} className="relative overflow-x-auto overflow-y-hidden [scrollbar-width:thin]" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="relative" style={{ width: days * p }}>
            <div className="relative h-10 border-b border-line bg-surface">{ruler}</div>
            {lanes.map((l) =>
              l.group ? (
                <div key={l.id} className="h-6 bg-raised" />
              ) : (
                <div key={l.id} className="relative h-[30px] border-t border-line-soft">
                  {(l.items ?? []).map((it) => {
                    const w = win(it);
                    const due = dayN(it.due, start);
                    const late = w.e > due && !it.locked;
                    const tip = `${it.title} · window ${fmt(addDays(start, w.s))} to ${fmt(addDays(start, w.e))} · due ${fmt(it.due)}${it.locked ? " · filed" : late ? " · ends after the due date" : ""}`;
                    return (
                      <React.Fragment key={it.id}>
                        <span
                          role="slider"
                          tabIndex={0}
                          aria-label={tip}
                          aria-valuemin={0}
                          aria-valuemax={days}
                          aria-valuenow={w.s}
                          title={tip}
                          onPointerDown={(e) => onDown(e, it, "move")}
                          onKeyDown={(e) => onKey(e, it)}
                          className={cn(
                            "group absolute top-[7px] h-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line",
                            barFill[it.tone],
                            it.locked ? "cursor-not-allowed opacity-70" : "cursor-grab",
                            late && "ring-1 ring-bad",
                            live?.id === it.id && "cursor-grabbing ring-2 ring-accent-line",
                          )}
                          style={{ left: w.s * p, width: Math.max(6, (w.e - w.s) * p) }}
                        >
                          {!it.locked && (
                            <>
                              <span className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize" onPointerDown={(e) => onDown(e, it, "start")} aria-hidden />
                              <span className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize" onPointerDown={(e) => onDown(e, it, "end")} aria-hidden />
                            </>
                          )}
                        </span>
                        <span className={cn("pointer-events-none absolute top-1 h-[22px] w-0.5 rounded-full", late ? "bg-bad" : "bg-btn")} style={{ left: due * p }} aria-hidden />
                      </React.Fragment>
                    );
                  })}
                </div>
              ),
            )}
            <span className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-brand" style={{ left: dayN(TODAY, start) * p }} aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
