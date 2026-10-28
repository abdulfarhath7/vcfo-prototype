"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { TODAY, fmt, fmtYear } from "@/lib/dates";
import { PHASES, COI_EXPECTED, stepsOf, doneCount, stepHref, phaseHref, type Step } from "@/data/incorporation";
import { useClientState } from "@/components/shell/ClientState";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { StatusCircle } from "@/components/cards/GanttTimeline";
import { PageHead, Dot } from "./navy-head";
import { DrillModal, JourneyCard, PortalProof, StatCard, stepDate, stepWord, statusGroups, type DrillSpec } from "./inc-parts";
import { stepDetail } from "./step-detail";
import { INC_PLAN } from "@/data/incorporation-detail";

const circle = (s: Step) => (s.status === "Completed" ? "done" : s.status === "Upcoming" ? "planned" : "current");

export function PhaseScreen({ n }: { n: 1 | 2 | 3 }) {
  const { incorporated } = useClientState();
  const toast = useUndoToast();
  const [drill, setDrill] = React.useState<DrillSpec | null>(null);
  const p = PHASES[n - 1];
  const steps = stepsOf(n);
  const done = doneCount(n);
  const pct = Math.round((done / steps.length) * 100);
  // Old phPlan and phEnd: planned start; a finished phase ends on its last step, an open one on its plan.
  const start = INC_PLAN[n][0];
  const end = p.status === "Done" ? p.end : INC_PLAN[n][1];
  const lateDays = p.status === "Done" && p.end > INC_PLAN[n][1] ? Math.round((p.end.getTime() - INC_PLAN[n][1].getTime()) / 86400000) : 0;
  // Focus: the first step waiting on Northwind, else the first open step, else the last (old renderPhase).
  const focus = (steps.find((s) => s.owner === "client" && s.status === "Waiting") ?? steps.find((s) => s.status !== "Completed") ?? steps[steps.length - 1]).n;
  const cur = steps.find((s) => s.n === focus)!;
  const owners = [
    { label: "Northwind", tone: "warn" as const, items: steps.filter((s) => s.owner === "client").map((s) => s.n) },
    { label: "SBC", tone: "accent" as const, items: steps.filter((s) => s.owner === "sbc").map((s) => s.n) },
    { label: "MCA", tone: "violet" as const, items: steps.filter((s) => s.owner === "mca").map((s) => s.n) },
  ].filter((o) => o.items.length > 0);
  const drillPhase = () => setDrill({ title: `Phase ${p.n} · ${p.short}`, sub: `${done} of ${steps.length} steps done`, groups: statusGroups(steps) });

  const columns: Column<Step>[] = [
    { key: "st", label: "", width: 40, align: "center", render: (s) => <StatusCircle status={circle(s)} className="mx-auto" /> },
    {
      key: "title",
      label: "Step",
      render: (s) => (
        <span className="flex min-w-[200px] items-baseline gap-2">
          <span className="flex-none font-mono text-12 text-muted">Step {s.n}</span>
          <span className="truncate font-medium">{s.title}</span>
        </span>
      ),
    },
    { key: "owner", label: "Owner", width: 124, render: (s) => <OwnerChip owner={s.owner} label={s.owner === "client" ? "Northwind" : undefined} /> },
    {
      key: "status",
      label: "Status",
      width: 124,
      render: (s) => {
        // R-13: a late step reads Overdue (was an extra "Urgent" tag beside the name).
        const w = s.status !== "Completed" && s.status !== "Upcoming" && !!s.due && s.due < TODAY ? { tone: "bad" as const, label: "Overdue" } : stepWord(s);
        return (
          <Chip tone={w.tone} fixed>
            {w.label}
          </Chip>
        );
      },
    },
    {
      key: "date",
      label: "Date",
      width: 128,
      render: (s) => {
        const dt = stepDate(s);
        return <span className={cn("whitespace-nowrap", dt.late ? "font-medium text-bad" : "text-muted")}>{dt.text}</span>;
      },
    },
    { key: "proof", label: "Portal", width: 110, render: (s) => <PortalProof step={s} forms={stepDetail(s.n)?.forms ?? []} notify={toast.show} /> },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHead
        label={`Phase ${p.n} · ${p.short}`}
        title={`Phase ${p.n} · ${p.short}`}
        meta={
          <>
            <button type="button" onClick={drillPhase} className="text-accent hover:underline">
              {done}/{steps.length} steps · {pct}%
            </button>
            <Dot />
            <span>
              {fmt(start)} → {fmt(end)}
            </span>
            <Dot />
            <span>
              {p.status === "Done" ? "finished" : "ends"} {fmtYear(end)}
            </span>
          </>
        }
        links={[
          ...(n > 1 ? [{ href: phaseHref("client", n - 1), label: `Phase ${n - 1} · ${PHASES[n - 2].short}`, dir: "prev" as const }] : []),
          ...(n < 3 ? [{ href: phaseHref("client", n + 1), label: `Phase ${n + 1} · ${PHASES[n].short}`, dir: "next" as const }] : []),
        ]}
      />
      <SectionCard title="Progress" meta={`${done} of ${steps.length} steps`}>
        {/* Old renderPhase .psum: one bar, the COI diamond on Part B, the label after the bar, then key dates as pills. */}
        <button type="button" onClick={drillPhase} className="flex w-full items-center gap-4 text-left" aria-label="Steps of this phase by status">
          <span className="relative flex h-3.5 min-w-0 flex-1 items-center">
            <span className="flex h-2.5 w-full overflow-hidden rounded-bar bg-raised" aria-hidden>
              <i className={cn("block h-full", pct === 100 ? "bg-ok-mid" : "bg-primary")} style={{ width: `${lateDays > 0 ? (1 - lateDays / Math.max(1, (end.getTime() - start.getTime()) / 86400000)) * 100 : pct}%` }} />
              {lateDays > 0 && <i className="block h-full flex-1 bg-bad-mid" />}
            </span>
            {p.n === 2 && <span className="absolute -right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 rounded-[2px] bg-brand" aria-label={`COI ${fmt(COI_EXPECTED)}`} />}
          </span>
          <span className="flex flex-none items-baseline gap-2 whitespace-nowrap text-12.5 text-muted">
            <b className="text-14 font-medium text-ink">{pct}%</b>
            <span>
              {done} / {steps.length} steps
            </span>
            {lateDays > 0 && <span className="font-medium text-bad">{lateDays} days late</span>}
            <span className="hidden font-medium text-ink sm:inline">
              {p.status === "Done" ? "Finished" : "Ends"} {fmt(end)}
            </span>
          </span>
        </button>
        <dl className="mt-3 flex flex-wrap gap-2 text-12.5 text-muted">
          <div className="rounded-md bg-raised px-2.5 py-1">
            Starts <b className="font-medium text-ink">{fmt(start)}</b>
          </div>
          <div className="rounded-md bg-raised px-2.5 py-1">
            {p.status === "Done" ? "Finished" : "Ends"} <b className="font-medium text-ink">{fmt(end)}</b>
          </div>
          {p.status !== "Done" && (
            <div className="rounded-md bg-raised px-2.5 py-1">
              Now{" "}
              <Link href={stepHref("client", cur.n)} className="font-medium text-accent hover:underline">
                Step {cur.n} · {cur.title}
              </Link>
            </div>
          )}
          {p.n === 2 && (
            <div className="rounded-md bg-raised px-2.5 py-1">
              COI <b className="font-medium text-ink">{fmt(COI_EXPECTED)}</b>
              {incorporated ? "" : " (expected)"}
            </div>
          )}
          <div className="rounded-md bg-raised px-2.5 py-1">
            Reviewer <b className="font-medium text-ink">Bharath</b>
          </div>
        </dl>
      </SectionCard>
      <Cols>
        <Col>
          <DataGrid title="Steps" meta={`${steps.length} steps`} columns={columns} rows={steps} rowKey={(s) => String(s.n)} rowHref={(s) => stepHref("client", s.n)} selectedKey={String(focus)} pageSize={14} rowLate={(s) => s.owner === "client" && !!s.due && s.due < TODAY && s.status !== "Completed"} />
        </Col>
        <Col>
          <JourneyCard phase={n} focus={focus} />
          <StatCard
            title="Who is doing it"
            unit="steps"
            segs={owners}
            onOpen={() => setDrill({ title: `Who is doing it · Phase ${p.n}`, sub: `${p.short} · ${steps.length} steps`, groups: owners })}
          />
        </Col>
      </Cols>
      <DrillModal spec={drill} onClose={() => setDrill(null)} />
      {toast.node}
    </div>
  );
}
