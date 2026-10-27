"use client";
import * as React from "react";
import Link from "next/link";
import { FileText, Repeat } from "lucide-react";
import { TODAY, daysFrom, fmt, fmtYear, urgency } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { barFill } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, type ChipTone } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { PhaseBar } from "@/components/ui/PhaseBar";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ActivityList, type ActivityRow } from "@/components/cards/ActivityList";
import { GanttTimeline } from "@/components/cards/GanttTimeline";
import { PhaseRows, type Phase } from "@/components/cards/PhaseRows";
import { DocList } from "@/components/cards/DocList";
import { AUDIT } from "@/data/shared";
import { PHASES, STEPS, stepTone, type StepStatus } from "@/data/incorporation";
import { docsOf, ganttOf } from "@/data/staff-record";
import type { StaffClient } from "@/data/staff-clients";
import {
  FILINGS,
  HEALTH_TONE,
  REGS,
  RISKS,
  RISK_STATUS_TONE,
  SERVICE_TONE,
  SEVERITY_TONE,
  WORK_TONE,
  auditOf,
  clientById,
  servicesOf,
  stageLabel,
  stageTone,
  type FirmClient,
  type Risk,
  type Service,
  type Work,
} from "@/data/super";
import { EXPECTED_COI, PHASE_NAMES, PHASE_TOTALS, REG_CELL, adminOf, ageBucket, codeOf, dueOf, notesOf, phasesOf, progressOf, rateOf, rupees, type RegCode } from "@/data/super-firm";
import { AssignDialog, useAssignments } from "./assign";

// Client record, ported from reference/old-screens/s/super/Overview.dc.html.
// Head: contact, admin, manager and project lead with Reassign, step count, days to COI, days with the holder, the current step.
// Tabs switch in place (R-36): overview, incorporation (timeline and steps), registrations, filings, documents, services, fees, risks, audit, notes.

type TabKey = "overview" | "incorporation" | "registrations" | "filings" | "documents" | "services" | "fees" | "risks" | "audit" | "notes";

const REG_TONE: Record<RegCode, ChipTone> = { d: "ok", p: "prog", w: "warn", n: "idle", x: "idle" };

/** Shape the firm client for the shared staff record helpers (timeline, documents). */
function asStaff(c: FirmClient): StaffClient {
  return {
    ...c,
    code: codeOf(c),
    phases: phasesOf(c),
    pendingWith: c.owner === "client" ? "Client" : c.owner === "mca" ? "MCA" : "SBC",
    days: c.daysInStep,
    health: c.health === "Due soon" ? "Due this week" : c.health,
  };
}

function stepStatus(c: FirmClient, n: number, phase: 1 | 2 | 3): StepStatus {
  if (c.id === "northwind") return STEPS[n - 1].status;
  const done = phasesOf(c)[phase - 1];
  const idx = STEPS.filter((s) => s.phase === phase).findIndex((s) => s.n === n);
  if (idx < done) return "Completed";
  const cur = ([1, 2, 3] as const).find((p) => phasesOf(c)[p - 1] < PHASE_TOTALS[p - 1]);
  if (cur === phase && idx === done) return c.health === "Overdue" || c.health === "Stuck" ? "Sent back" : c.owner === "client" ? "Waiting" : "In progress";
  return "Upcoming";
}

function phaseRows(c: FirmClient): Phase[] {
  const p = phasesOf(c);
  const rows: Phase[] = PHASES.map((ph) => {
    const done = p[ph.n - 1];
    const total = PHASE_TOTALS[ph.n - 1];
    const status = done === total ? "Done" : done > 0 || (ph.n > 1 && p[ph.n - 2] === PHASE_TOTALS[ph.n - 2]) ? "In progress" : "Upcoming";
    return {
      id: ph.id,
      name: ph.name,
      done,
      total,
      status,
      tone: status === "Done" ? "ok" : status === "In progress" ? "prog" : "idle",
      steps: STEPS.filter((s) => s.phase === ph.n).map((s) => {
        const st = stepStatus(c, s.n, ph.n);
        return { n: s.n, title: s.title, owner: s.owner, ownerLabel: s.owner === "client" ? c.short : undefined, status: st, tone: stepTone[st], time: s.time, href: `/super/clients/${c.id}/step/${s.n}` };
      }),
    };
  });
  if (c.stage === "compliance") rows.push({ id: "phase-4", name: "Registrations", done: p[3], total: 23, status: p[3] === 23 ? "Done" : "In progress", tone: p[3] === 23 ? "ok" : "prog" });
  return rows;
}

const serviceCols: Column<Service>[] = [
  { key: "name", label: "Service", render: (s) => <span className="font-semibold">{s.name}</span> },
  { key: "area", label: "Area" },
  { key: "started", label: "Started", width: 110, render: (s) => fmtYear(s.started) },
  { key: "owner", label: "Owner" },
  { key: "status", label: "Status", width: 124, render: (s) => <Chip fixed tone={SERVICE_TONE[s.status]}>{s.status}</Chip> },
];

const feeCols: Column<Service>[] = [
  { key: "name", label: "Service", render: (s) => <span className="font-semibold">{s.name}</span> },
  { key: "fee", label: "Fee", align: "right", width: 140, render: (s) => `${rupees(rateOf(s.id).fee)}${rateOf(s.id).per ? ` ${rateOf(s.id).per}` : ""}` },
  { key: "billing", label: "Billing", render: (s) => (rateOf(s.id).per ? "Monthly, in advance" : s.status === "Done" ? "Billed in full" : "50% on start, 50% on completion") },
  { key: "status", label: "Status", width: 124, render: (s) => <Chip fixed tone={SERVICE_TONE[s.status]}>{s.status}</Chip> },
];

const filingCols: Column<Work>[] = [
  { key: "item", label: "Form", render: (w) => <span className="font-semibold">{w.item}</span> },
  { key: "group", label: "Statute" },
  { key: "due", label: "Due", width: 80, render: (w) => <span className={cn(w.status === "Overdue" && "font-semibold text-bad")}>{fmt(w.due)}</span> },
  { key: "owner", label: "With", width: 112, render: (w) => <OwnerChip owner={w.owner} /> },
  { key: "status", label: "Status", width: 124, render: (w) => <Chip fixed tone={WORK_TONE[w.status]}>{w.status}</Chip> },
];

const riskCols: Column<Risk>[] = [
  { key: "title", label: "Risk", render: (r) => <span className="font-semibold">{r.title}</span> },
  { key: "area", label: "Area" },
  { key: "owner", label: "Owner" },
  { key: "since", label: "Since", width: 80, render: (r) => fmt(r.since) },
  { key: "severity", label: "Severity", width: 124, render: (r) => <Chip fixed tone={SEVERITY_TONE[r.severity]}>{r.severity}</Chip> },
  { key: "status", label: "Status", width: 124, render: (r) => <Chip fixed tone={RISK_STATUS_TONE[r.status]}>{r.status}</Chip> },
];

interface RegRow {
  id: string;
  name: string;
  code: RegCode;
}

export function ClientRecordScreen({ id }: { id: string }) {
  const [tab, setTab] = React.useState<TabKey>("overview");
  const [assignOpen, setAssignOpen] = React.useState(false);
  const { managerOf } = useAssignments();
  const toast = useUndoToast();
  const c = clientById(id);
  const [notes, setNotes] = React.useState(() => (c ? notesOf(c) : []));
  const [draft, setDraft] = React.useState("");
  if (!c) return null;

  const manager = managerOf(c);
  const staff = asStaff(c);
  const services = servicesOf(c);
  const filings = FILINGS.filter((f) => f.clientId === c.id);
  const risks = RISKS.filter((r) => r.clientId === c.id);
  const docs = docsOf(staff);
  const gantt = ganttOf(staff);
  const regs: RegRow[] = REGS.map((name, i) => ({ id: name, name, code: (c.reg[i] ?? "n") as RegCode }));
  const audit: ActivityRow[] = c.id === "northwind" ? AUDIT.map((a) => ({ id: a.id, date: a.date, time: a.time, text: `${a.action}: ${a.target}`, who: a.who })) : auditOf(c);
  const contact = c.contacts[0];
  const coi = EXPECTED_COI[c.id];
  const due = dueOf(c.id);
  const incDone = phasesOf(c).slice(0, 3).reduce((a, b) => a + b, 0);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "incorporation", label: "Incorporation", count: `${incDone}/25` },
    { key: "registrations", label: "Registrations", count: regs.filter((r) => r.code === "d").length },
    { key: "filings", label: "Filings", count: filings.length },
    { key: "documents", label: "Documents", count: docs.length },
    { key: "services", label: "Services", count: services.length },
    { key: "fees", label: "Fees" },
    { key: "risks", label: "Risks", count: risks.length },
    { key: "audit", label: "Audit" },
    { key: "notes", label: "Notes", count: notes.length },
  ];

  const regCols: Column<RegRow>[] = [
    { key: "name", label: "Registration", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "number", label: "Number", mono: true, render: (r) => (r.code === "d" && r.name === "GST" ? c.gstin ?? "" : "") },
    { key: "with", label: "With", width: 120, render: (r) => (r.code === "w" ? c.short : r.code === "p" ? c.lead : "") },
    { key: "status", label: "Status", width: 150, render: (r) => <Chip fixed tone={REG_TONE[r.code]} className="w-[140px]">{REG_CELL[r.code].label}</Chip> },
  ];

  const stepHref = c.stepNo ? `/super/clients/${c.id}/step/${c.stepNo}` : undefined;

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard title={c.name} bare>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <i className={cn("h-2.5 w-2.5 flex-none rounded-full", barFill[c.tone])} aria-hidden />
          <h1 className="min-w-0 truncate text-[18px] font-semibold leading-tight tracking-tight">{c.name}</h1>
          <Chip tone={stageTone(c)}>{stageLabel(c)}</Chip>
          <Chip tone={HEALTH_TONE[c.health]}>{c.health}</Chip>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setTab("documents")}>
            <FileText size={14} strokeWidth={1.5} /> Documents {docs.length}
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-13 text-ink-2">
          {contact && (
            <span className="min-w-0 truncate">
              {contact.name} ·{" "}
              <a href={`mailto:${contact.email}`} className="font-mono text-12.5 text-accent hover:underline">
                {contact.email}
              </a>
            </span>
          )}
          <span className="min-w-0 truncate">
            Admin <b className="font-semibold">{adminOf(manager)}</b> · Manager <b className="font-semibold">{manager}</b> · Project lead <b className="font-semibold">{c.lead}</b>
          </span>
          <Button size="sm" variant="link" onClick={() => setAssignOpen(true)}>
            <Repeat size={14} strokeWidth={1.5} /> Reassign
          </Button>
        </div>
        <KeyValue
          cols={3}
          className="mt-4"
          rows={[
            { k: c.stepNo ? "Step" : "Progress", v: c.stepNo ? `${c.stepNo} of 25` : `${progressOf(c)}% of 48 steps` },
            { k: c.stage === "incorporating" ? "Days to COI" : "Next date", v: c.stage === "incorporating" && coi ? `${daysFrom(coi)} · ${fmt(coi)}` : <span className={cn(urgency(c.next) === "bad" && "text-bad")}>{fmt(c.next)}</span> },
            { k: "With", v: `${c.owner === "client" ? "Client" : c.owner === "mca" ? "MCA" : "SBC"} · ${c.daysInStep} days` },
            {
              k: "Now",
              v: stepHref ? (
                <Link href={stepHref} className="text-accent hover:underline">
                  {codeOf(c)} · {c.step}
                </Link>
              ) : (
                c.step
              ),
            },
            { k: "Overdue", v: <span className={cn(c.overdue > 0 && "text-bad")}>{c.overdue}</span> },
            { k: "Progress", v: <PhaseBar done={phasesOf(c)} totals={PHASE_TOTALS} names={PHASE_NAMES} className="mt-2 w-40" /> },
          ]}
        />
        <div className="-mx-4 mt-4 overflow-x-auto border-t border-line-soft px-4 pt-3 md:-mx-5 md:px-5">
          <Tabs items={tabs} value={tab} onChange={(k) => setTab(k as TabKey)} />
        </div>
      </SectionCard>

      {tab === "overview" && (
        <Cols>
          <Col>
            <SectionCard title="Company details">
              <KeyValue
                rows={[
                  { k: "CIN", v: c.cin ?? "After incorporation", mono: !!c.cin },
                  { k: "PAN", v: c.pan ?? "After incorporation", mono: !!c.pan },
                  { k: "GSTIN", v: c.gstin ?? "Not registered", mono: !!c.gstin },
                  { k: c.stage === "incorporating" ? "Client since" : "Incorporated", v: fmtYear(c.since) },
                  { k: "Stage", v: stageLabel(c) },
                  { k: "Area", v: c.area },
                ]}
              />
            </SectionCard>
            <SectionCard title="Timeline" flush>
              <GanttTimeline start={gantt.start} end={gantt.end} ticks={gantt.ticks} rows={gantt.rows} />
            </SectionCard>
          </Col>
          <Col>
            <SectionCard title="People" flush>
              {[
                { name: adminOf(manager), role: "Admin · SBC" },
                { name: manager, role: "Manager · SBC" },
                { name: c.lead, role: "Project lead · SBC" },
                ...c.contacts.map((p) => ({ name: p.name, role: p.role, email: p.email })),
              ].map((p: { name: string; role: string; email?: string }) => (
                <ListRow key={`${p.role}-${p.name}`}>
                  <Avatar name={p.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block truncate text-12.5 text-muted">{p.role}</span>
                  </span>
                  {p.email && <span className="hidden truncate font-mono text-12 text-muted sm:inline">{p.email}</span>}
                </ListRow>
              ))}
            </SectionCard>
            <SectionCard title="Services" flush>
              {services.map((s) => (
                <ListRow key={s.id}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{s.name}</span>
                    <span className="block truncate text-12.5 text-muted">
                      {s.area} · since {fmtYear(s.started)}
                    </span>
                  </span>
                  <Chip tone={SERVICE_TONE[s.status]}>{s.status}</Chip>
                </ListRow>
              ))}
            </SectionCard>
          </Col>
        </Cols>
      )}

      {tab === "incorporation" && (
        <>
          <SectionCard title="Timeline" flush>
            <GanttTimeline start={gantt.start} end={gantt.end} ticks={gantt.ticks} rows={gantt.rows} />
          </SectionCard>
          <SectionCard title="Steps" meta={`${incDone} of 25 · ${codeOf(c)}`} flush right={stepHref ? <Link href={stepHref} className="whitespace-nowrap text-13 font-semibold text-accent hover:underline">Open current step ›</Link> : undefined}>
            <PhaseRows phases={phaseRows(c)} openId={c.stage === "incorporating" ? `phase-${phasesOf(c)[0] < 5 ? 1 : 2}` : undefined} />
          </SectionCard>
        </>
      )}
      {tab === "registrations" && <DataGrid title="Registrations" columns={regCols} rows={regs} rowKey={(r) => r.id} />}
      {tab === "filings" && <DataGrid title="Filings" meta="October" columns={filingCols} rows={filings} rowKey={(w) => w.id} rowLate={(w) => w.status === "Overdue"} empty="No filings before the certificate" />}
      {tab === "documents" && (
        <SectionCard title="Documents" meta={String(docs.length)} flush right={<Link href="/super/documents" className="whitespace-nowrap text-13 font-semibold text-accent hover:underline">All documents ›</Link>}>
          <DocList groups={[{ label: "Latest", docs }]} />
        </SectionCard>
      )}
      {tab === "services" && <DataGrid title="Services" columns={serviceCols} rows={services} rowKey={(s) => s.id} />}
      {tab === "fees" && (
        <Cols>
          <Col>
            <DataGrid title="Fees by service" columns={feeCols} rows={services} rowKey={(s) => s.id} />
          </Col>
          <Col>
            <SectionCard title="Outstanding">
              {due ? (
                <KeyValue
                  cols={1}
                  rows={[
                    { k: "Amount", v: <span className={cn(due.days > 60 && "text-bad")}>{rupees(due.amount)}</span> },
                    { k: "Outstanding for", v: `${due.days} days` },
                    { k: "Ageing", v: ageBucket(due.days) },
                  ]}
                />
              ) : (
                <Empty>Nothing outstanding</Empty>
              )}
            </SectionCard>
          </Col>
        </Cols>
      )}
      {tab === "risks" && <DataGrid title="Risks" columns={riskCols} rows={risks} rowKey={(r) => r.id} empty="No risks" />}
      {tab === "audit" && (
        <SectionCard title="Audit" flush>
          <ActivityList rows={audit} />
        </SectionCard>
      )}
      {tab === "notes" && (
        <SectionCard title="Notes" flush>
          {notes.map((n) => (
            <ListRow key={n.id} className="items-start">
              <span className="w-[64px] flex-none font-mono text-12 text-muted">{fmt(n.date)}</span>
              <span className="min-w-0 flex-1">{n.text}</span>
              <span className="flex-none text-12.5 text-muted">{n.who}</span>
            </ListRow>
          ))}
          <form
            className="flex items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              setNotes([{ id: `n${Date.now()}`, who: "Mithilesh", date: TODAY, text: draft.trim() }, ...notes]);
              setDraft("");
            }}
          >
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a note" aria-label="Note" />
            <Button type="submit">Add</Button>
          </form>
        </SectionCard>
      )}

      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} clientId={c.id} onDone={(m) => toast.show(m)} />
      {toast.node}
    </div>
  );
}
