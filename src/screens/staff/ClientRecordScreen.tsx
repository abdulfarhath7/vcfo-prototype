"use client";
import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import { fmt } from "@/lib/dates";
import { STEPS, PHASES, stepTone, type StepStatus } from "@/data/incorporation";
import { clientById, healthTone, obligationsOf, REG_NAMES, REG_CODES, REG_STATUS, PHASE_TOTALS, type StaffClient, type ObligationRow } from "@/data/staff-clients";
import { docsOf, auditOf, ganttOf } from "@/data/staff-record";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard, Empty } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { GanttTimeline } from "@/components/cards/GanttTimeline";
import { PhaseRows, type Phase } from "@/components/cards/PhaseRows";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { DocList } from "@/components/cards/DocList";
import { ActivityList } from "@/components/cards/ActivityList";
import { identityTile, stepHrefFor, type StaffPortal } from "./parts";

type TabKey = "overview" | "registrations" | "obligations" | "documents" | "timeline" | "audit";

/** Step status for a client. Northwind uses the incorporation plan; others derive it from their phase counts. */
function stepStatus(c: StaffClient, n: number, phase: 1 | 2 | 3): StepStatus {
  if (c.id === "northwind") return STEPS[n - 1].status;
  const inPhase = STEPS.filter((s) => s.phase === phase).map((s) => s.n);
  const done = c.phases[phase - 1];
  const idx = inPhase.indexOf(n);
  if (idx < done) return "Completed";
  const curPhase = ([1, 2, 3] as const).find((p) => c.phases[p - 1] < PHASE_TOTALS[p - 1]);
  if (curPhase === phase && idx === done) return c.health === "Overdue" || c.health === "Stuck" ? "Sent back" : c.pendingWith === "Client" ? "Waiting" : "In progress";
  return "Upcoming";
}

function phasesOf(c: StaffClient, portal: StaffPortal): Phase[] {
  const rows: Phase[] = PHASES.map((p) => {
    const done = c.phases[p.n - 1];
    const total = PHASE_TOTALS[p.n - 1];
    const status = done === total ? "Done" : done > 0 || (p.n > 1 && c.phases[p.n - 2] === PHASE_TOTALS[p.n - 2]) ? "In progress" : "Upcoming";
    return {
      id: p.id,
      name: p.name,
      done,
      total,
      status,
      tone: (status === "Done" ? "ok" : status === "In progress" ? "prog" : "idle") as ChipTone,
      steps: STEPS.filter((s) => s.phase === p.n).map((s) => {
        const st = stepStatus(c, s.n, p.n);
        return { n: s.n, title: s.title, owner: s.owner, ownerLabel: s.owner === "client" ? c.short : undefined, status: st, tone: stepTone[st], time: s.time, href: stepHrefFor(portal, c.id, s.n) };
      }),
    };
  });
  if (c.stage === "compliance") {
    const reg = c.phases[3];
    rows.push({ id: "phase-4", name: "Registrations", done: reg, total: PHASE_TOTALS[3], status: reg === PHASE_TOTALS[3] ? "Done" : "In progress", tone: reg === PHASE_TOTALS[3] ? "ok" : "prog" });
  }
  return rows;
}

interface RegRow {
  id: string;
  name: string;
  code: keyof typeof REG_STATUS;
  number: string;
}

function regsOf(c: StaffClient): RegRow[] {
  const codes = REG_CODES[c.id] ?? "nnnnnnnnn";
  return REG_NAMES.map((name, i) => {
    const code = codes[i] as keyof typeof REG_STATUS;
    return { id: `${c.id}-${name}`, name, code, number: code === "d" && name === "GST" ? c.gstin ?? "" : "" };
  });
}

function Record({ portal }: { portal: StaffPortal }) {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const phase = search.get("phase");
  const c = clientById(params.id);
  const [tab, setTab] = React.useState<TabKey>("overview");

  if (!c) return <SectionCard title="Client">{<Empty>No client</Empty>}</SectionCard>;
  const gantt = ganttOf(c);
  const regs = regsOf(c);
  const obs = obligationsOf(c);

  const regCols: Column<RegRow>[] = [
    { key: "name", label: "Registration", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "number", label: "Number", mono: true },
    { key: "owner", label: "Owner", width: 120, render: (r) => (r.code === "w" ? c.short : r.code === "p" ? c.lead : "") },
    { key: "status", label: "Status", width: 130, render: (r) => <Chip tone={REG_STATUS[r.code].tone} fixed>{REG_STATUS[r.code].label}</Chip> },
  ];
  const obTone: Record<ObligationRow["status"], ChipTone> = { Filed: "ok", "Due this week": "warn", Upcoming: "idle", Overdue: "bad" };
  const obCols: Column<ObligationRow>[] = [
    { key: "name", label: "Obligation", render: (o) => <span className="font-semibold">{o.name}</span> },
    { key: "area", label: "Area", width: 110 },
    { key: "period", label: "Period", width: 110 },
    { key: "due", label: "Due", width: 80, render: (o) => fmt(o.due) },
    { key: "status", label: "Status", width: 130, render: (o) => <Chip tone={obTone[o.status]} fixed>{o.status}</Chip> },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard title={c.name} icon={{ Icon: Building2, tone: identityTile[c.tone] }} meta={<Chip tone={healthTone[c.health]}>{c.health}</Chip>}>
        <KeyValue
          cols={3}
          rows={[
            { k: "CIN", v: c.cin ?? "", mono: true },
            { k: "PAN", v: c.pan ?? "", mono: true },
            { k: "GSTIN", v: c.gstin ?? "", mono: true },
            { k: "Stage", v: c.stage === "incorporating" ? "Incorporating" : "Compliance" },
            { k: "Current step", v: `${c.code} · ${c.step}` },
            { k: "Next date", v: fmt(c.next) },
            { k: "Project lead", v: c.lead },
            { k: "Manager", v: c.manager },
            { k: "With", v: `${c.pendingWith} · ${c.days} days` },
          ]}
        />
        <div className="-mx-4 mt-4 overflow-x-auto border-t border-line-soft px-4 pt-3 md:-mx-5 md:px-5">
          <Tabs
            items={[
              { key: "overview", label: "Overview" },
              { key: "registrations", label: "Registrations", count: regs.filter((r) => r.code === "d").length },
              { key: "obligations", label: "Obligations", count: obs.filter((o) => o.status !== "Filed").length || undefined },
              { key: "documents", label: "Documents", count: docsOf(c).length },
              { key: "timeline", label: "Timeline" },
              { key: "audit", label: "Audit" },
            ]}
            value={tab}
            onChange={(k) => setTab(k as TabKey)}
          />
        </div>
      </SectionCard>

      {tab === "overview" && (
        <>
          <SectionCard title="Timeline" flush>
            <GanttTimeline start={gantt.start} end={gantt.end} ticks={gantt.ticks} rows={gantt.rows} />
          </SectionCard>
          <SectionCard title="Steps" flush>
            <PhaseRows key={phase ?? "none"} phases={phasesOf(c, portal)} openId={phase ? `phase-${phase}` : c.stage === "incorporating" ? `phase-${c.phases[0] < 5 ? 1 : 2}` : undefined} />
          </SectionCard>
        </>
      )}
      {tab === "registrations" && <DataGrid title="Registrations" columns={regCols} rows={regs} rowKey={(r) => r.id} />}
      {tab === "obligations" && <DataGrid title="Obligations" meta="FY 2026-27" columns={obCols} rows={obs} rowKey={(o) => o.id} rowLate={(o) => o.status === "Overdue"} empty="None" />}
      {tab === "documents" && (
        <SectionCard title="Documents" flush>
          <DocList groups={[{ label: "All", docs: docsOf(c) }]} />
        </SectionCard>
      )}
      {tab === "timeline" && (
        <SectionCard title="Timeline" flush>
          <GanttTimeline start={gantt.start} end={gantt.end} ticks={gantt.ticks} rows={gantt.rows} />
        </SectionCard>
      )}
      {tab === "audit" && (
        <SectionCard title="Audit" flush>
          <ActivityList rows={auditOf(c)} />
        </SectionCard>
      )}
    </div>
  );
}

/** C-0032: record tabs switch in place. ?phase=n opens a phase in Overview. */
export function ClientRecordScreen({ portal }: { portal: StaffPortal }) {
  return (
    <React.Suspense>
      <Record portal={portal} />
    </React.Suspense>
  );
}
