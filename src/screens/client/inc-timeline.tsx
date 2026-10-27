"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TODAY, d, fmt } from "@/lib/dates";
import { PHASES, MCA_REVIEW, COI_EXPECTED, TIMELINE, TIMELINE_TICKS, STEPS, stepsOf, doneCount, stepTone, stepHref, type Step } from "@/data/incorporation";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { GanttTimeline, type GanttRow } from "@/components/cards/GanttTimeline";
import { TimelineEditor, type EditPhase } from "@/components/cards/TimelineEditor";
import { useDrill, type DrillSpec } from "@/components/cards/DrillDialog";

const DAY = 86400000;
const addDays = (x: Date, n: number) => new Date(x.getTime() + n * DAY);
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);

const BASE: EditPhase[] = [
  { id: "p1", name: "Phase 1 · Name application", start: PHASES[0].start, end: PHASES[0].end, done: true, kind: "done" },
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
function RowSteps({ steps, after, portal, onAll }: { steps: Step[]; after: boolean; portal: string; onAll: () => void }) {
  return (
    <div>
      <ul>
        {steps.map((s) => (
          <li key={s.n}>
            <Link href={stepHref(portal, s.n)} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13 first:border-t-0 hover:bg-surface md:px-5 md:pl-12">
              <span className="w-6 flex-none font-mono text-12 text-faint">{s.n}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{s.title}</span>
              <span className="hidden font-mono text-12 text-muted sm:inline">{s.done ? fmt(s.done) : s.due ? fmt(s.due) : ""}</span>
              <Chip tone={after ? "ok" : stepTone[s.status]}>{after ? "Completed" : statusOf(s)}</Chip>
              <ChevronRight size={16} strokeWidth={1.5} className="flex-none text-faint" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex justify-end border-t border-line-soft px-4 py-2 md:px-5">
        <Button variant="link" size="sm" onClick={onAll}>
          Open list
        </Button>
      </div>
    </div>
  );
}

/**
 * Timeline card for the client home and the incorporation page.
 * Edit opens the timeline editor (tl-editor.js). The client sends a change request; staff portals save at once.
 * Each row expands to its steps; "Open list" opens the drill-down pop-up.
 */
export function TimelineCardFull({ after = false, portal = "client", className }: { after?: boolean; portal?: string; className?: string }) {
  const mode = portal === "client" ? "client" : "manager";
  const [saved, setSaved] = React.useState<EditPhase[]>(BASE);
  const [pending, setPending] = React.useState<{ phases: EditPhase[]; reason: string } | null>(null);
  const [changed, setChanged] = React.useState<{ by: string; on: Date }>({ by: "Pranay", on: d(2026, 10, 1) });
  const [edit, setEdit] = React.useState(false);
  const toast = useUndoToast();
  const drill = useDrill();

  const [p1, p2, mca, coi] = saved;
  const p3Start = coi.start;
  const p3End = addDays(p3Start, daysBetween(PHASES[2].start, PHASES[2].end));
  const openAll = (tab: number) => drill.open(timelineDrill(after, portal), tab);
  const detail = (steps: Step[], tab: number) => <RowSteps steps={steps} after={after} portal={portal} onAll={() => openAll(tab)} />;

  // After incorporation: every phase is done (v7c_timeline_a). COI on 28 Oct, the date on the greeting chip.
  const rows: GanttRow[] = after
    ? [
        { id: "p1", name: PHASES[0].short, status: "done", bars: [{ from: p1.start, to: p1.end, kind: "done" }], count: "5/5", note: { text: `Done ${fmt(p1.end)}` }, detail: detail(stepsOf(1), 0) },
        { id: "p2", name: PHASES[1].short, status: "done", bars: [{ from: p2.start, to: p2.end, kind: "done" }], count: "9/9", note: { text: `Filed ${fmt(p2.end)}` }, detail: detail(STEPS.filter((s) => s.phase === 2 && s.n <= 12), 1) },
        { id: "mca", name: "MCA review", status: "done", bars: [{ from: mca.start, to: mca.end, kind: "done" }], milestone: coi.start, note: { text: `COI ${fmt(coi.start)}` }, detail: detail(STEPS.filter((s) => s.n >= 13 && s.n <= 14), 2) },
        { id: "p3", name: PHASES[2].short, status: "current", bars: [{ from: p3Start, to: p3End, kind: "cur" }], count: "7/11" },
      ]
    : [
        { id: "p1", name: PHASES[0].short, status: "done", bars: [{ from: p1.start, to: p1.end, kind: "done" }], count: `${doneCount(1)}/${stepsOf(1).length}`, note: { text: `Done ${fmt(p1.end)}` }, detail: detail(stepsOf(1), 0) },
        {
          id: "p2",
          name: PHASES[1].short,
          status: "current",
          bars: [
            { from: p2.start, to: TODAY, kind: "cur" },
            { from: TODAY, to: p2.end, kind: "rest" },
          ],
          count: `${doneCount(2)}/${STEPS.filter((s) => s.phase === 2 && s.n <= 12).length}`,
          note: { text: "22%" },
          detail: detail(STEPS.filter((s) => s.phase === 2 && s.n <= 12), 1),
        },
        { id: "mca", name: "MCA review", status: "planned", bars: [{ from: mca.start, to: mca.end, kind: "plan" }], milestone: coi.start, note: { text: `COI ${fmt(coi.start)}` }, detail: detail(STEPS.filter((s) => s.n >= 13 && s.n <= 14), 2) },
        { id: "p3", name: PHASES[2].short, status: "planned", bars: [{ from: p3Start, to: p3End, kind: "plan" }], count: `${doneCount(3)}/${stepsOf(3).length}` },
      ];

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

  return (
    <SectionCard
      title="Timeline"
      className={className}
      meta={after ? undefined : `Changed ${changed.on.getTime() === TODAY.getTime() ? "today" : fmt(changed.on)} · ${changed.by}`}
      flush
      right={
        after ? (
          <Chip tone="ok">Completed</Chip>
        ) : (
          <>
            {pending && (
              <PopoverCard
                title="Change request"
                align="end"
                trigger={
                  <button type="button" className="inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-sm bg-warn-soft px-2 text-12 font-semibold text-warn">
                    <i className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
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
                    <dd className="font-mono text-12.5">
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
        )
      }
    >
      <GanttTimeline start={TIMELINE.start} end={TIMELINE.end} ticks={TIMELINE_TICKS} rows={rows} today={after ? d(2026, 11, 8) : TODAY} />
      {!after && <TimelineEditor open={edit} onOpenChange={setEdit} phases={pending?.phases ?? saved} start={TIMELINE.start} end={TIMELINE.end} mode={mode} onSave={save} />}
      {drill.node}
      {toast.node}
    </SectionCard>
  );
}
