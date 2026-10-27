"use client";
import * as React from "react";
import { Lock, RotateCcw, Undo2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt, frac, TODAY } from "@/lib/dates";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Input";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid } from "./DataGrid";

export interface EditPhase {
  id: string;
  name: string;
  start: Date;
  end: Date;
  /** Done phases are locked. */
  done?: boolean;
  /** The COI: a single date, drawn as a diamond. */
  milestone?: boolean;
  /** Bar colour: done, current, review, coi. */
  kind?: "done" | "cur" | "review" | "coi";
}

export interface TimelineEditorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  phases: EditPhase[];
  /** Axis of the editor. */
  start: Date;
  end: Date;
  /** "client" sends a change request with a reason. "manager" saves at once. */
  mode: "client" | "manager";
  onSave: (next: EditPhase[], reason?: string) => void;
}

const DAY = 86400000;
const num = (d: Date, t0: Date) => Math.round((d.getTime() - t0.getTime()) / DAY);
const toDate = (n: number, t0: Date) => new Date(t0.getTime() + n * DAY);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};

interface P {
  s: number;
  e: number;
}

const barTone: Record<NonNullable<EditPhase["kind"]>, string> = {
  done: "bg-ok-mid",
  cur: "bg-accent",
  review: "bg-idle",
  coi: "bg-brand",
};

/** Cascade (tl-editor.js): a phase never starts before the previous one ends. Later phases keep their length. */
function applyMove(ph: P[], meta: EditPhase[], i: number, ns: number, ne: number, kind: "move" | "start" | "end", max: number) {
  const out = ph.map((p) => ({ ...p }));
  const p = out[i];
  if (meta[i].done) return out;
  const minS = i ? out[i - 1].e : 0;
  if (meta[i].milestone) {
    ns = Math.max(minS, Math.min(max, ns));
    ne = ns;
  } else if (kind === "move") {
    const w = p.e - p.s;
    ns = Math.max(minS, ns);
    ne = Math.min(max, ns + w);
    ns = ne - w;
  } else {
    ns = Math.max(minS, ns);
    ne = Math.max(ns + 1, Math.min(max, ne));
  }
  const shift = ne - p.e;
  p.s = ns;
  p.e = ne;
  for (let j = i + 1; j < out.length; j++) {
    const q = out[j];
    const prev = out[j - 1];
    const w = q.e - q.s;
    if (shift > 0 || q.s > prev.e) {
      q.s = Math.max(prev.e, q.s + shift);
      q.e = meta[j].milestone ? q.s : Math.min(max, q.s + w);
    }
    if (q.s < prev.e) {
      q.s = prev.e;
      q.e = meta[j].milestone ? q.s : q.s + w;
    }
  }
  return out;
}

/** tl-editor.js: drag or type dates per phase, snap to days or weeks, cascade, before and after, undo, save or request. */
export function TimelineEditor({ open, onOpenChange, phases, start, end, mode, onSave }: TimelineEditorProps) {
  const span = num(end, start);
  const base = React.useMemo(() => phases.map((p) => ({ s: num(p.start, start), e: num(p.end, start) })), [phases, start]);
  const [ph, setPh] = React.useState<P[]>(base);
  const [hist, setHist] = React.useState<P[][]>([]);
  const [snap, setSnap] = React.useState("day");
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState(false);
  const laneRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ i: number; x0: number; from: P[]; kind: "move" | "start" | "end"; moved: boolean } | null>(null);
  const toast = useUndoToast(3000);

  React.useEffect(() => {
    if (open) {
      setPh(base);
      setHist([]);
      setReason("");
      setErr(false);
    }
  }, [open, base]);

  const step = snap === "week" ? 7 : 1;
  const x = (n: number) => `${frac(toDate(n, start), start, end) * 100}%`;
  const push = (cur: P[]) => setHist((h) => [...h.slice(-59), cur]);
  const locked = () => toast.show(`${phases.find((p) => p.done)?.name ?? "This phase"} is done, so its dates are locked`);

  const onDown = (e: React.PointerEvent, i: number, kind: "move" | "start" | "end") => {
    e.stopPropagation();
    if (phases[i].done) return locked();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { i, x0: e.clientX, from: ph, kind, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const g = drag.current;
    const w = laneRef.current?.getBoundingClientRect().width ?? 600;
    if (!g) return;
    const ppd = w / span;
    const dd = Math.round((e.clientX - g.x0) / ppd / step) * step;
    if (!dd && !g.moved) return;
    if (!g.moved) push(g.from);
    g.moved = true;
    const p = g.from[g.i];
    const next =
      g.kind === "move"
        ? applyMove(g.from, phases, g.i, p.s + dd, p.e + dd, "move", span)
        : g.kind === "start"
          ? applyMove(g.from, phases, g.i, Math.min(p.e - 1, p.s + dd), p.e, "start", span)
          : applyMove(g.from, phases, g.i, p.s, Math.max(p.s + 1, p.e + dd), "end", span);
    setPh(next);
  };
  const onUp = () => {
    drag.current = null;
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    if (phases[i].done) return locked();
    const d = (e.key === "ArrowRight" ? 1 : -1) * step;
    const p = ph[i];
    push(ph);
    setPh(e.shiftKey && !phases[i].milestone ? applyMove(ph, phases, i, p.s, p.e + d, "end", span) : applyMove(ph, phases, i, p.s + d, p.e + d, "move", span));
  };
  const typeDate = (i: number, which: "s" | "e", v: string) => {
    if (!v) return;
    const n = num(fromIso(v), start);
    const p = ph[i];
    push(ph);
    if (phases[i].milestone) setPh(applyMove(ph, phases, i, n, n, "move", span));
    else setPh(which === "s" ? applyMove(ph, phases, i, Math.min(n, p.e - 1), p.e, "start", span) : applyMove(ph, phases, i, p.s, Math.max(n, p.s + 1), "end", span));
  };

  const coiI = phases.findIndex((p) => p.milestone);
  const coi = coiI >= 0 ? ph[coiI].s : ph[ph.length - 1].e;
  const coi0 = coiI >= 0 ? base[coiI].s : base[base.length - 1].e;
  const slip = coi - coi0;
  const changed = ph.some((p, i) => p.s !== base[i].s || p.e !== base[i].e);
  const label = (p: P, i: number) => (phases[i].milestone ? fmt(toDate(p.s, start)) : `${fmt(toDate(p.s, start))} to ${fmt(toDate(p.e, start))}`);

  const ticks: number[] = [];
  for (let n = 0; n <= span; n++) if (toDate(n, start).getDay() === 1) ticks.push(n);

  const commit = () => {
    if (!changed) return toast.show("No changes to save");
    if (mode === "client" && !reason.trim()) {
      setErr(true);
      return;
    }
    onSave(
      phases.map((p, i) => ({ ...p, start: toDate(ph[i].s, start), end: toDate(ph[i].e, start) })),
      mode === "client" ? reason.trim() : undefined,
    );
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      flush
      title={mode === "client" ? "Request a timeline change" : "Edit timeline"}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={commit}>
            {mode === "client" ? "Send request" : "Save timeline"}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-4 py-2.5 md:px-5">
        <span className="text-12.5 font-semibold text-muted">Snap</span>
        <Tabs
          items={[
            { key: "day", label: "Day" },
            { key: "week", label: "Week" },
          ]}
          value={snap}
          onChange={setSnap}
        />
        <span className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            disabled={!hist.length}
            onClick={() => {
              setPh(hist[hist.length - 1]);
              setHist((h) => h.slice(0, -1));
            }}
          >
            <Undo2 size={14} strokeWidth={1.5} /> Undo
          </Button>
          <Button
            size="sm"
            disabled={!changed}
            onClick={() => {
              push(ph);
              setPh(base);
            }}
          >
            <RotateCcw size={14} strokeWidth={1.5} /> Reset
          </Button>
        </span>
      </div>

      {/* Gantt lanes */}
      <div className="overflow-x-auto px-4 pt-3 md:px-5" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="grid min-w-[520px] grid-cols-[120px_minmax(0,1fr)] md:grid-cols-[170px_minmax(0,1fr)_150px]">
          <span />
          <div ref={laneRef} className="relative h-9 border-b border-line">
            {ticks.map((n, k) => (
              <span key={n} className={cn("absolute bottom-1 -translate-x-1/2 whitespace-nowrap font-mono text-11 text-faint", k % 2 === 1 && "hidden sm:block")} style={{ left: x(n) }}>
                {fmt(toDate(n, start))}
              </span>
            ))}
            <span className="absolute -top-0.5 -translate-x-1/2 rounded-sm bg-brand px-1.5 text-[10.5px] font-bold text-white" style={{ left: `${frac(TODAY, start, end) * 100}%` }}>
              Today {fmt(TODAY)}
            </span>
          </div>
          <span className="hidden md:block" />
          {phases.map((meta, i) => {
            const p = ph[i];
            const b = base[i];
            const moved = p.s !== b.s || p.e !== b.e;
            const dd = p.e - b.e;
            return (
              <React.Fragment key={meta.id}>
                <div className="flex h-[52px] items-center gap-1.5 border-t border-line-soft pr-2 text-12.5 font-semibold">
                  {meta.done && <Lock size={13} strokeWidth={1.5} className="flex-none text-muted" aria-label="Done, locked" />}
                  <span className="min-w-0 truncate">{meta.name}</span>
                </div>
                <div className="relative h-[52px] border-t border-line-soft">
                  {moved && (
                    <span
                      className={cn("pointer-events-none absolute top-[13px] h-[26px] rounded-[6px] border-[1.5px] border-dashed border-faint", meta.milestone && "w-[18px] -translate-x-1/2 rotate-45 scale-75 rounded-[3px]")}
                      style={{ left: x(b.s), width: meta.milestone ? undefined : `calc(${x(b.e)} - ${x(b.s)})` }}
                      aria-hidden
                    />
                  )}
                  <span
                    role="slider"
                    tabIndex={0}
                    aria-label={meta.name}
                    aria-valuemin={0}
                    aria-valuemax={span}
                    aria-valuenow={p.s}
                    aria-valuetext={label(p, i)}
                    aria-disabled={meta.done || undefined}
                    onPointerDown={(e) => onDown(e, i, "move")}
                    onKeyDown={(e) => onKey(e, i)}
                    title={label(p, i)}
                    className={cn(
                      "group absolute top-[13px] h-[26px] touch-none rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-accent-line",
                      barTone[meta.kind ?? (meta.done ? "done" : "cur")],
                      meta.done ? "cursor-not-allowed opacity-80" : "cursor-grab active:cursor-grabbing",
                      meta.milestone && "w-[18px] -translate-x-1/2 rotate-45 scale-75 rounded-[3px]",
                    )}
                    style={{ left: x(p.s), width: meta.milestone ? undefined : `calc(${x(p.e)} - ${x(p.s)})` }}
                  >
                    {!meta.milestone && !meta.done && (
                      <>
                        <span onPointerDown={(e) => onDown(e, i, "start")} className="absolute inset-y-0 -left-0.5 w-3 cursor-ew-resize" aria-hidden />
                        <span onPointerDown={(e) => onDown(e, i, "end")} className="absolute inset-y-0 -right-0.5 w-3 cursor-ew-resize" aria-hidden />
                      </>
                    )}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 border-l-[1.5px] border-brand" style={{ left: `${frac(TODAY, start, end) * 100}%` }} aria-hidden />
                </div>
                <div className="hidden h-[52px] flex-col items-end justify-center border-t border-line-soft text-right md:flex">
                  <b className="font-mono text-11.5 font-semibold">{label(p, i)}</b>
                  {dd !== 0 && <span className={cn("text-11.5 font-semibold", dd > 0 ? "text-bad" : "text-ok")}>{`${dd > 0 ? "+" : ""}${dd} d`}</span>}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mt-4 flex flex-wrap items-center gap-3 rounded-md bg-raised px-3.5 py-3 md:mx-5">
        <span className="text-14.5 font-semibold">
          COI {fmt(toDate(coi0, start))}
          {slip !== 0 && ` → ${fmt(toDate(coi, start))}`}
        </span>
        <Chip tone={slip > 0 ? "bad" : slip < 0 ? "ok" : "idle"}>{slip > 0 ? `Slipped by ${slip} day${slip > 1 ? "s" : ""}` : slip < 0 ? `Pulled in by ${-slip} day${slip < -1 ? "s" : ""}` : "No change to the COI date"}</Chip>
      </div>

      <div className="px-4 pt-4 md:px-5">
        <DataGrid
          inset
          className="rounded-md border border-line"
          rows={phases.map((m, i) => ({ m, i }))}
          rowKey={(r) => r.m.id}
          columns={[
            { key: "phase", label: "Phase", render: (r) => <span className="font-semibold">{r.m.name}</span> },
            { key: "before", label: "Before", mono: true, width: 150, render: (r) => label(base[r.i], r.i) },
            {
              key: "after",
              label: "After",
              width: 290,
              render: (r) =>
                r.m.done ? (
                  <span className="font-mono text-12.5 text-muted">{label(ph[r.i], r.i)}</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <input type="date" aria-label={`${r.m.name} ${r.m.milestone ? "date" : "start"}`} value={iso(toDate(ph[r.i].s, start))} onChange={(e) => typeDate(r.i, "s", e.target.value)} className="h-[30px] rounded-sm border border-line bg-surface px-1.5 font-mono text-12 text-ink" />
                    {!r.m.milestone && (
                      <>
                        <span className="text-faint">to</span>
                        <input type="date" aria-label={`${r.m.name} end`} value={iso(toDate(ph[r.i].e, start))} onChange={(e) => typeDate(r.i, "e", e.target.value)} className="h-[30px] rounded-sm border border-line bg-surface px-1.5 font-mono text-12 text-ink" />
                      </>
                    )}
                  </span>
                ),
            },
            {
              key: "chg",
              label: "Change",
              width: 96,
              render: (r) => {
                const dd = ph[r.i].e - base[r.i].e;
                return dd === 0 ? <span className="text-faint">-</span> : <span className={cn("font-semibold", dd > 0 ? "text-bad" : "text-ok")}>{`${dd > 0 ? "+" : ""}${dd} days`}</span>;
              },
            },
          ]}
        />
      </div>

      {mode === "client" && (
        <div className="px-4 pb-4 pt-4 md:px-5">
          <Field label="Reason for the change">
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErr(false);
              }}
              rows={3}
              placeholder="Office NOC from the landlord will arrive on 22 Oct."
              className={cn("w-full rounded-md border bg-surface px-3 py-2 text-13.5 text-ink outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent-line", err ? "border-bad" : "border-line")}
            />
          </Field>
          {err && <p className="mt-1 text-12 text-bad">Add a reason for the change.</p>}
        </div>
      )}
      {mode === "manager" && <div className="h-4" />}
      {toast.node}
    </Modal>
  );
}
