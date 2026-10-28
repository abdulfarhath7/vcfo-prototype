"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TODAY, d, fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { PHASES, MCA_REVIEW, COI_EXPECTED, TIMELINE, STEPS, stepsOf, doneCount, stepTone, stepHref, phaseHref, type Step } from "@/data/incorporation";
import { INC_AXIS, INC_PLAN } from "@/data/incorporation-detail";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { GanttTimeline, StatusCircle, type GanttRow, type RowStatus } from "@/components/cards/GanttTimeline";
import { Chevron } from "@/components/ui/Chevron";
import { TimelineEditor, type EditPhase } from "@/components/cards/TimelineEditor";
import { useDrill, type DrillSpec } from "@/components/cards/DrillDialog";

const DAY = 86400000;
const addDays = (x: Date, n: number) => new Date(x.getFullYear(), x.getMonth(), x.getDate() + n);
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);

const BASE: EditPhase[] = [
  { id: "p1", name: "Phase 1 · Name Application", start: PHASES[0].start, end: PHASES[0].end, done: true, kind: "done" },
  { id: "p2", name: "Phase 2 · Incorporation", start: PHASES[1].start, end: PHASES[1].end, kind: "cur" },
  { id: "mca", name: "MCA review", start: MCA_REVIEW.start, end: MCA_REVIEW.end, kind: "review" },
  { id: "coi", name: "COI", start: COI_EXPECTED, end: COI_EXPECTED, milestone: true, kind: "coi" },
];

const statusOf = (s: Step) => (s.status === "Waiting" ? "Waiting" : s.status);

/** v7c_timeline_b drill: the steps of each timeline row, one tab per row. */
export function timelineDrill(after: boolean, portal = "client"): DrillSpec {
  const tabOf = (s: Step) => (s.n <= 5 ? 0 : s.n <= 12 ? 1 : s.n === 13 ? 2 : 3);
  const rows = STEPS.filter((s) => s.phase < 3).map((s) => ({
    name: s.title,
    meta: s.done ? fmt(s.done) : s.due ? fmt(s.due) : undefined,
    status: after ? "Completed" : statusOf(s),
    tone: after ? ("ok" as const) : stepTone[s.status],
    tab: tabOf(s),
    href: stepHref(portal, s.n),
  }));
  return {
    title: "Timeline phases",
    tabs: [
      { label: "Phase 1 · Name", count: 5 },
      { label: "Phase 2 · Incorporation", count: 7 },
      { label: "MCA review", count: 1 },
      { label: "COI", count: 1 },
    ],
    rows,
    link: { name: "Incorporation", href: portal === "client" ? "/client/incorporation" : `/${portal}/clients/northwind` },
  };
}

/** Steps of one timeline row, shown when the row expands. */
function RowSteps({ steps, after, portal, onAll, phase }: { steps: Step[]; after: boolean; portal: string; onAll: () => void; phase?: 1 | 2 | 3 }) {
  return (
    <div>
      <ul>
        {steps.map((s) => (
          <li key={s.n}>
            <Link href={stepHref(portal, s.n)} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13 first:border-t-0 hover:bg-hover md:px-5 md:pl-12">
              <span className="w-14 flex-none font-mono text-12 text-muted">Step {s.n}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{s.title}</span>
              <span className="hidden text-12.5 text-muted sm:inline">{s.done ? fmt(s.done) : s.due ? fmt(s.due) : ""}</span>
              <Chip tone={after ? "ok" : stepTone[s.status]} fixed>
                {after ? "Completed" : s.status === "Upcoming" ? "Not started" : statusOf(s)}
              </Chip>
              <ChevronRight size={16} strokeWidth={1.6} className="flex-none text-faint" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-3 border-t border-line-soft px-4 py-2 md:px-5">
        <Button variant="link" size="sm" onClick={onAll}>
          Open list
        </Button>
        {phase && (
          <Button asChild variant="link" size="sm">
            <Link href={phaseHref(portal, phase)}>Open phase {phase}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}


/**
 * Edit, change request and save for a timeline card (tl-editor.js).
 * The client sends a change request; staff portals save at once.
 */
function useTimelineEdit(portal: string) {
  const mode = portal === "client" ? "client" : "manager";
  const [saved, setSaved] = React.useState<EditPhase[]>(BASE);
  const [pending, setPending] = React.useState<{ phases: EditPhase[]; reason: string } | null>(null);
  const [changed, setChanged] = React.useState<{ by: string; on: Date }>({ by: "Pranay", on: d(2026, 10, 1) });
  const [edit, setEdit] = React.useState(false);
  const toast = useUndoToast();
  const coi = saved[3];

  const save = (next: EditPhase[], reason?: string) => {
    const slip = daysBetween(coi.start, next[3].start);
    if (mode === "client") {
      setPending({ phases: next, reason: reason ?? "" });
      toast.show(`Change request sent to ${portal === "client" ? "Pranay" : "the manager"}`, () => setPending(null));
      return;
    }
    const prev = saved;
    const prevChanged = changed;
    setSaved(next);
    setChanged({ by: "you", on: TODAY });
    toast.show(`Timeline saved · COI ${fmt(next[3].start)}${slip ? (slip > 0 ? ` · slipped by ${slip} d` : ` · pulled in by ${-slip} d`) : ""}`, () => {
      setSaved(prev);
      setChanged(prevChanged);
    });
  };

  const right = (
    <>
      {pending && (
        <PopoverCard
          title="Change request"
          align="end"
          trigger={
            <button type="button" className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md bg-warn-soft px-2 text-12 font-medium text-warn">
              <i className="h-1.5 w-1.5 rounded-[2px] bg-current" aria-hidden />
              <span className="hidden sm:inline">Request pending · </span>COI {fmt(pending.phases[3].start)}
            </button>
          }
          footer={
            <Button size="sm" onClick={() => setPending(null)}>
              Withdraw
            </Button>
          }
        >
          <dl className="grid gap-2 px-4 py-3 text-13">
            <div>
              <dt className="text-12 text-muted">Waiting for</dt>
              <dd className="font-medium">Pranay · Manager</dd>
            </div>
            <div>
              <dt className="text-12 text-muted">COI</dt>
              <dd className="text-13">
                {fmt(coi.start)} → {fmt(pending.phases[3].start)}
              </dd>
            </div>
            <div>
              <dt className="text-12 text-muted">Reason</dt>
              <dd>{pending.reason}</dd>
            </div>
          </dl>
        </PopoverCard>
      )}
      <Button size="sm" onClick={() => setEdit(true)}>
        Edit
      </Button>
    </>
  );

  const nodes = (
    <>
      <TimelineEditor open={edit} onOpenChange={setEdit} phases={pending?.phases ?? saved} start={TIMELINE.start} end={TIMELINE.end} mode={mode} onSave={save} />
      {toast.node}
    </>
  );
  return { saved, changed, right, nodes };
}

/** Weekly ticks from `start` to the first week edge on or after `last` (v7c_timeline: 12 Sep to 7 Nov). */
function weekAxis(start: Date, last: Date, narrow: boolean) {
  // An even number of weeks, so the phone view can show every second tick and still end on the axis end.
  const weeks = Math.max(8, Math.ceil(daysBetween(start, last) / 14) * 2);
  const ticks = Array.from({ length: weeks + 1 }, (_, i) => addDays(start, i * 7));
  return { start, end: ticks[ticks.length - 1], ticks: narrow ? ticks.filter((_, i) => i % 2 === 0) : ticks };
}

/** True below the md breakpoint (old layoutGantt thins the axis labels on narrow cards). */
function useNarrow() {
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia("(max-width: 767px)");
    const on = () => setNarrow(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return narrow;
}

/**
 * Timeline card for the client home (v7c_timeline_b, v7c_timeline_a).
 * Rows: Phase 1 · Name Application, Phase 2 · Incorporation, MCA review, COI.
 * Each row expands to its steps; "Open list" opens the drill-down pop-up.
 */
export function TimelineCardFull({ after = false, portal = "client", className }: { after?: boolean; portal?: string; className?: string }) {
  const tl = useTimelineEdit(portal);
  const drill = useDrill();
  const [p1, p2, mca, coi] = tl.saved;
  const today = after ? d(2026, 11, 8) : TODAY;
  // Every second week: the home card is narrow at 1440 too.
  const axis = weekAxis(d(2026, 9, 12), after ? addDays(today, 1) : addDays(coi.start, 7), true);
  const openAll = (tab: number) => drill.open(timelineDrill(after, portal), tab);
  const detail = (steps: Step[], tab: number, phase?: 1 | 2) => <RowSteps steps={steps} after={after} portal={portal} phase={phase} onAll={() => openAll(tab)} />;
  const p2Steps = STEPS.filter((s) => s.phase === 2 && s.n <= 12);
  const mcaSteps = STEPS.filter((s) => s.n >= 13 && s.n <= 14);

  const rows: GanttRow[] = [
    { id: "p1", name: "Phase 1 · Name Application", status: "done", bars: [{ from: p1.start, to: p1.end, kind: "done" }], note: { text: `Done ${fmt(p1.end)}` }, detail: detail(stepsOf(1), 0, 1) },
    after
      ? { id: "p2", name: "Phase 2 · Incorporation", status: "done", bars: [{ from: p2.start, to: p2.end, kind: "done" }], note: { text: `Filed ${fmt(p2.end)}` }, detail: detail(p2Steps, 1, 2) }
      : // R-21: the current phase is solid up to today, hatched for the rest.
        { id: "p2", name: "Phase 2 · Incorporation", status: "current", bars: today > p2.start && today < p2.end ? [{ from: p2.start, to: today, kind: "cur" }, { from: today, to: p2.end, kind: "rest" }] : [{ from: p2.start, to: p2.end, kind: "cur" }], note: { text: "22%" }, detail: detail(p2Steps, 1, 2) },
    { id: "mca", name: "MCA review", status: after ? "done" : "planned", bars: [{ from: mca.start, to: mca.end, kind: after ? "done" : "plan" }], detail: detail(mcaSteps, 2) },
    { id: "coi", name: "COI", status: after ? "done" : "planned", bars: [], milestone: coi.start, note: { text: fmt(coi.start) }, detail: detail(STEPS.filter((s) => s.n === 14), 3) },
  ];

  return (
    <SectionCard
      title="Timeline"
      className={className}
      meta={after ? undefined : `Changed ${tl.changed.on.getTime() === TODAY.getTime() ? "today" : fmt(tl.changed.on)} · ${tl.changed.by}`}
      flush
      right={after ? <Chip tone="ok">Completed</Chip> : tl.right}
    >
      <GanttTimeline start={axis.start} end={axis.end} ticks={axis.ticks} rows={rows} today={today} wideNames />
      {!after && tl.nodes}
      {drill.node}
    </SectionCard>
  );
}

/* ---------- Incorporation page timeline: SPICe+ Part A, SPICe+ Part B, Post-incorporation ---------- */

interface PhaseLine {
  n: 1 | 2 | 3;
  name: string;
  status: RowStatus;
  plan: [Date, Date];
  /** Actual end when the phase finished after its plan. */
  end?: Date;
  done: number;
  total: number;
  coi?: boolean;
}

/** One phase row of the old landing Gantt (phaseRow): status, name, bar, then the label beside the bar. */
function PhaseLineRow({ line, x, todayX, open, onToggle }: { line: PhaseLine; x: (dt: Date) => number; todayX: number; open: boolean; onToggle: () => void }) {
  const pct = Math.round((line.done / line.total) * 100);
  const a = x(line.plan[0]);
  const planEnd = x(line.plan[1]);
  const b = line.end && line.end > line.plan[1] ? x(line.end) : planEnd;
  const lateDays = line.end && line.end > line.plan[1] ? daysBetween(line.plan[1], line.end) : 0;
  const labelLeft = b > 75;
  return (
    <div
      className="grid h-row cursor-pointer grid-cols-[200px_minmax(0,1fr)] items-center px-4 hover:bg-hover md:grid-cols-[230px_minmax(0,1fr)] md:px-5"
      onClick={onToggle}
      role="button"
      aria-expanded={open}
      aria-label={`${line.name} · ${line.done} of ${line.total} steps`}
    >
      <div className="flex min-w-0 items-center gap-2 text-14 font-medium">
        <Chevron open={open} />
        <StatusCircle status={line.status} />
        <span className="min-w-0 truncate">{line.name}</span>
      </div>
      <div className="relative h-full">
        <span className="absolute top-1/2 flex h-[14px] -translate-y-1/2 overflow-hidden rounded-bar" style={{ left: `${a}%`, width: `${Math.max(b - a, 1.5)}%` }}>
          {line.status === "done" ? (
            <>
              <i className="h-full bg-ok-mid" style={{ width: `${((planEnd - a) / (b - a)) * 100}%` }} />
              {lateDays > 0 && <i className="h-full flex-1 bg-bad-mid" aria-label={`${lateDays} days late`} />}
            </>
          ) : line.status === "current" ? (
            <>
              <i className="h-full bg-primary" style={{ width: `${Math.max(pct, 4)}%` }} />
              <i className="hatch h-full flex-1" />
            </>
          ) : (
            <i className="h-full w-full rounded-bar bg-raised shadow-[inset_0_0_0_1px_var(--line)]" />
          )}
        </span>
        {line.coi && <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-brand" style={{ left: `${b}%` }} aria-label={`COI ${fmt(line.plan[1])}`} />}
        <span className={cn("absolute top-1/2 flex -translate-y-1/2 items-baseline gap-1.5 whitespace-nowrap text-12.5 text-muted")} style={labelLeft ? { right: `calc(${100 - a}% + 12px)` } : { left: `calc(${b}% + 14px)` }}>
          <b className="text-14 font-medium text-ink">{pct}%</b>
          <span>
            {line.done} / {line.total} steps
          </span>
          {lateDays > 0 && <span className="font-medium text-bad">{lateDays} days late</span>}
        </span>
        <span className="absolute inset-y-0 border-l-[1.5px] border-brand" style={{ left: `${todayX}%` }} aria-hidden />
      </div>
    </div>
  );
}

/**
 * Timeline card of the incorporation page (old phasesCard).
 * Rows: SPICe+ Part A, SPICe+ Part B (ends with the COI diamond), Post-incorporation.
 * Each row expands to its steps. Edit sends a change request, as on the home timeline.
 */
export function IncPhaseTimelineCard({ after = false, className }: { after?: boolean; className?: string }) {
  const tl = useTimelineEdit("client");
  const drill = useDrill();
  const [open, setOpen] = React.useState<number | null>(null);
  const today = after ? d(2026, 11, 8) : TODAY;
  const coi = tl.saved[3].start;
  const frac = (dt: Date) => Math.min(100, Math.max(0, (daysBetween(INC_AXIS.start, dt) / daysBetween(INC_AXIS.start, INC_AXIS.end)) * 100));
  const narrow = useNarrow();
  const ticks: Date[] = [];
  for (let t = addDays(INC_AXIS.start, 7); t < INC_AXIS.end; t = addDays(t, narrow ? 14 : 7)) ticks.push(t);
  const p3Total = stepsOf(3).length;
  const lines: PhaseLine[] = [
    { n: 1, name: "SPICe+ Part A", status: "done", plan: INC_PLAN[1], end: PHASES[0].end, done: stepsOf(1).length, total: stepsOf(1).length },
    { n: 2, name: "SPICe+ Part B", status: after ? "done" : "current", plan: [INC_PLAN[2][0], coi], done: after ? stepsOf(2).length : doneCount(2), total: stepsOf(2).length, coi: true },
    { n: 3, name: "Post-incorporation", status: after ? "current" : "planned", plan: [coi, INC_PLAN[3][1]], done: after ? 7 : doneCount(3), total: p3Total },
  ];
  const all = STEPS.filter((s) => s.status === "Completed").length;
  return (
    <SectionCard title="Timeline" className={className} meta={`${after ? 21 : all} of ${STEPS.length} steps · Sep to Nov 2026`} flush right={after ? <Chip tone="ok">Incorporated</Chip> : tl.right}>
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid h-[34px] grid-cols-[200px_minmax(0,1fr)] items-end px-4 pb-1.5 text-11.5 text-faint md:grid-cols-[230px_minmax(0,1fr)] md:px-5">
            <span />
            <div className="relative h-full">
              {ticks.map((t) => (
                <span key={t.getTime()} className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap" style={{ left: `${frac(t)}%` }}>
                  {fmt(t)}
                </span>
              ))}
            </div>
          </div>
          {lines.map((l) => (
            <div key={l.n} className="border-t border-line-soft">
              <PhaseLineRow line={l} x={frac} todayX={frac(today)} open={open === l.n} onToggle={() => setOpen(open === l.n ? null : l.n)} />
              {open === l.n && (
                <div className="border-t border-line-soft bg-raised">
                  <RowSteps steps={stepsOf(l.n)} after={after && l.n < 3} portal="client" phase={l.n} onAll={() => drill.open(timelineDrill(after), Math.min(l.n - 1, 1))} />
                </div>
              )}
            </div>
          ))}
          <div className="grid h-[26px] grid-cols-[200px_minmax(0,1fr)] px-4 md:grid-cols-[230px_minmax(0,1fr)] md:px-5">
            <span />
            <div className="relative h-full">
              <span className="absolute inset-y-0 border-l-[1.5px] border-brand" style={{ left: `${frac(today)}%` }} aria-hidden />
              <span className="absolute bottom-1 -translate-x-1/2 rounded-sm bg-brand px-1.5 py-px text-11 font-medium text-white" style={{ left: `${frac(today)}%` }}>
                Today
              </span>
            </div>
          </div>
        </div>
      </div>
      {!after && tl.nodes}
      {drill.node}
    </SectionCard>
  );
}
