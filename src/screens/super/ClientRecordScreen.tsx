"use client";
import * as React from "react";
import Link from "next/link";
import { Mail, Repeat } from "lucide-react";
import { STAFF_TODAY, daysFrom, fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, type ChipTone } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty, HeadLink } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ActivityList, type ActivityRow } from "@/components/cards/ActivityList";
import { GanttTimeline } from "@/components/cards/GanttTimeline";
import { PhaseRows, type Phase } from "@/components/cards/PhaseRows";
import { DocList } from "@/components/cards/DocList";
import { AUDIT } from "@/data/shared";
import { PHASES, STEPS, stepTone } from "@/data/incorporation";
import { docsOf, docsTabCount, ganttOf } from "@/data/staff-record";
import { clientById as staffClientById, type StaffClient } from "@/data/staff-clients";
import { currentStepN, stepState } from "@/data/staff-steps";
import { registrationsFor, obligationsFor, type StaffObligation, type StaffRegistration } from "@/data/staff-compliance";
import { FREQ_LABEL, OB_TYPES, REG_TYPES, type ObType, type RegType } from "@/data/staff-regs-table";
import { DAYS_TO_COI } from "@/data/staff-today";
import { AboutStepPanel } from "@/screens/staff/step-parts";
import { FILINGS, HEALTH_TONE, REGS, SERVICE_TONE, WORK_TONE, auditOf, clientById, servicesOf, stageLabel, type FirmClient, type Service, type Work } from "@/data/super";
import { EXPECTED_COI, PHASE_TOTALS, REG_CELL, adminOf, ageBucket, codeOf, dueOf, notesOf, phasesOf, rateOf, rupees, type RegCode } from "@/data/super-firm";
import { AssignDialog, useAssignments } from "./assign";
import { ClientTile } from "./parts";
import { waitWord } from "@/data/status-words";

// Client record, ported from reference/old-screens/s/super/Overview.dc.html: the staff record page.
// Head: initials tile, name, stage, Documents; contact, admin, manager and project lead with Reassign;
// the step, days to COI, days with the holder and the current step. Tabs switch in place (R-36).
// The old tabs come first: Incorporation (timeline and steps), Registrations, Obligations, Documents, Notes.
// Fees (C-0045: money on the client record) and Audit follow.

type TabKey = "incorporation" | "registrations" | "obligations" | "documents" | "notes" | "fees" | "audit";

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

/** The staff view of this client: the shared lead record data when the client is in it, else the firm data. */
const staffOf = (c: FirmClient): StaffClient => staffClientById(c.id) ?? asStaff(c);

/** Step time as the lead record shows it: "Done 26 Sep", "Due 9 Oct" or the typical time. */
function stepLabel(sc: StaffClient, n: number) {
  const st = stepState(sc, n);
  if (st.status === "Completed" && st.done) return `Done ${fmt(st.done)}`;
  if (st.status === "Upcoming") return STEPS[n - 1].time;
  return st.to ? `Due ${fmt(st.to)}` : STEPS[n - 1].time;
}

function phaseRows(c: FirmClient): Phase[] {
  const p = phasesOf(c);
  const sc = staffOf(c);
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
        const st = stepState(sc, s.n).status;
        return { n: s.n, title: s.title, owner: s.owner, ownerLabel: s.owner === "client" ? c.short : undefined, status: st, tone: stepTone[st], time: stepLabel(sc, s.n), href: `/super/clients/${c.id}/step/${s.n}` };
      }),
    };
  });
  if (c.stage === "compliance") rows.push({ id: "phase-4", name: "Registrations", done: p[3], total: 23, status: p[3] === 23 ? "Done" : "In progress", tone: p[3] === 23 ? "ok" : "prog" });
  return rows;
}

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

// The lead record's grids (s/lead/Overview.dc.html), so the super admin sees the same statuses as the lead.
// The super portal has no registration or obligation page, so these rows do not link (the admin pages open the admin portal).
const leadRegTone: Record<StaffRegistration["status"], ChipTone> = { Granted: "ok", "In progress": "prog", "Waiting on client": "warn", "Not started": "idle", "Not needed": "idle" };
const leadObTone: Record<StaffObligation["status"], ChipTone> = { Filed: "ok", "In progress": "prog", "Waiting on client": "warn", Upcoming: "idle", Overdue: "bad" };
const afterCoiChip = () => (
  <Chip tone="idle" fixed>
    After COI
  </Chip>
);
const regTypeCols: Column<RegType>[] = [
  { key: "name", label: "Registration", render: (r) => <span className="font-semibold">{r.name}</span> },
  { key: "auth", label: "Authority", width: 160 },
  { key: "form", label: "Form", width: 160, mono: true },
  { key: "status", label: "Status", width: 130, render: afterCoiChip },
];
const obTypeCols: Column<ObType>[] = [
  { key: "name", label: "Obligation", render: (o) => <span className="font-semibold">{o.name}</span> },
  { key: "law", label: "Law", width: 130 },
  { key: "fr", label: "Frequency", width: 120, render: (o) => FREQ_LABEL[o.fr] },
  { key: "status", label: "Status", width: 130, render: afterCoiChip },
];

interface RegRow {
  id: string;
  name: string;
  code: RegCode;
}

export function ClientRecordScreen({ id }: { id: string }) {
  const [tab, setTab] = React.useState<TabKey>("incorporation");
  const [assignOpen, setAssignOpen] = React.useState(false);
  const { managerOf } = useAssignments();
  const toast = useUndoToast();
  const c = clientById(id);
  const [notes, setNotes] = React.useState(() => (c ? notesOf(c) : []));
  const [draft, setDraft] = React.useState("");
  const [about, setAbout] = React.useState<number | null>(null);
  if (!c) return null;

  const manager = managerOf(c);
  const staff = staffOf(c);
  const services = servicesOf(c);
  const filings = FILINGS.filter((f) => f.clientId === c.id);
  const docs = docsOf(staff);
  const gantt = ganttOf(staff);
  const regs: RegRow[] = REGS.map((name, i) => ({ id: name, name, code: (c.reg[i] ?? "n") as RegCode }));
  const audit: ActivityRow[] = c.id === "northwind" ? AUDIT.map((a) => ({ id: a.id, date: a.date, time: a.time, text: `${a.action}: ${a.target}`, who: a.who })) : auditOf(c);
  const contact = c.contacts[0];
  const coi = EXPECTED_COI[c.id];
  const due = dueOf(c.id);
  const ph = phasesOf(c);
  const incDone = ph.slice(0, 3).reduce((a, b) => a + b, 0);
  const allDone = ph.reduce((a, b) => a + b, 0);
  const inc = c.stage === "incorporating";
  const holder = c.owner === "client" ? "client" : c.owner === "mca" ? "MCA" : "SBC";
  const stepHref = c.stepNo ? `/super/clients/${c.id}/step/${c.stepNo}` : undefined;
  // A client in the lead data shows the lead's numbers and grids; the others use the firm data.
  const inLead = !!staffClientById(c.id);
  const cur = inLead ? currentStepN(staff) : c.stepNo;
  const leadRegs = inLead ? registrationsFor("admin", c.id) : [];
  const leadObs = inLead ? obligationsFor("admin", c.id) : [];
  const daysToCoi = DAYS_TO_COI[c.id] ?? (coi ? daysFrom(coi, STAFF_TODAY) : undefined);
  const healthLabel = staff.pendingWith === "Client" ? "Waiting on client" : `With ${staff.pendingWith}`;
  const healthTone: ChipTone = staff.pendingWith === "Client" ? "warn" : staff.pendingWith === "MCA" ? "violet" : "prog";

  const tabs = [
    { key: "incorporation", label: "Incorporation", count: inc && cur ? `${cur}/14` : `${incDone}/25` },
    { key: "registrations", label: "Registrations", count: inLead ? (leadRegs.length ? leadRegs.filter((r) => r.status !== "Not needed").length : REG_TYPES.length) : regs.filter((r) => r.code !== "x").length },
    { key: "obligations", label: "Obligations", count: inLead ? leadObs.length || OB_TYPES.length : filings.length },
    { key: "documents", label: "Documents", count: docsTabCount(c.id, docs.length) },
    { key: "notes", label: "Notes", count: notes.length },
    { key: "fees", label: "Fees" },
    { key: "audit", label: "Audit" },
  ];

  const regCols: Column<RegRow>[] = [
    { key: "name", label: "Registration", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "number", label: "Number", mono: true, render: (r) => (r.code === "d" && r.name === "GST" ? c.gstin ?? "" : "") },
    { key: "with", label: "With", width: 120, render: (r) => (r.code === "w" ? c.short : r.code === "p" ? c.lead : "") },
    { key: "status", label: "Status", width: 150, render: (r) => <Chip fixed tone={REG_TONE[r.code]} className="w-[140px]">{REG_CELL[r.code].label}</Chip> },
  ];

  const leadRegCols: Column<StaffRegistration>[] = [
    { key: "name", label: "Registration", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "authority", label: "Authority", width: 110 },
    { key: "form", label: "Form", width: 110, mono: true },
    { key: "idValue", label: "Number", width: 190, mono: true, render: (r) => r.idValue ?? "" },
    { key: "owner", label: "Owner", width: 110, render: (r) => <OwnerChip owner={r.owner} label={r.owner === "client" ? c.short : undefined} /> },
    { key: "next", label: "Next", width: 150, render: (r) => r.nextLabel ?? "" },
    { key: "status", label: "Status", width: 130, render: (r) => <Chip tone={leadRegTone[r.status]} fixed>{r.status}</Chip> },
  ];
  const leadObCols: Column<StaffObligation>[] = [
    { key: "name", label: "Obligation", render: (o) => <span className="font-semibold">{o.name}</span> },
    { key: "form", label: "Form", width: 110, mono: true },
    { key: "area", label: "Area", width: 110 },
    { key: "frequency", label: "Frequency", width: 100 },
    { key: "period", label: "Period", width: 110 },
    { key: "due", label: "Due", width: 80, render: (o) => <span className={o.status === "Overdue" ? "font-semibold text-bad" : undefined}>{fmt(o.due)}</span> },
    { key: "owner", label: "Owner", width: 110, render: (o) => <OwnerChip owner={o.owner} label={o.owner === "client" ? c.short : undefined} /> },
    { key: "status", label: "Status", width: 140, render: (o) => <Chip tone={leadObTone[o.status]} fixed>{o.status}</Chip> },
  ];

  const now = (
    <span className="min-w-0">
      <span className="text-12.5 text-muted">Now </span>
      <b className="font-semibold">
        {inLead ? staff.code : codeOf(c)} · {c.step}
      </b>
      <Chip tone={inLead ? healthTone : HEALTH_TONE[c.health]} className="ml-2 align-middle">
        {inLead ? healthLabel : waitWord(c.health)}
      </Chip>
    </span>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      <section className="rounded-lg border border-line bg-raised px-4 pb-3 pt-4 md:px-5" aria-label={c.name}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <ClientTile client={c} className="h-8 w-8 text-12" />
          <h1 className="min-w-0 truncate text-[20px] font-semibold leading-tight tracking-tight">{c.name}</h1>
          <span className="ml-auto flex items-center gap-2">
            <Chip tone={inc ? "warn" : "teal"}>{stageLabel(c)}</Chip>
            <Button size="sm" variant="outline" onClick={() => setTab("documents")}>
              Documents {docs.length}
            </Button>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-13 text-ink-2">
          {contact && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              {contact.name} ·
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 text-accent hover:underline">
                <Mail size={14} strokeWidth={1.6} /> {contact.email}
              </a>
            </span>
          )}
          <span className="min-w-0">
            Admin: <b className="font-semibold text-ink">{adminOf(manager)}</b> · Manager: <b className="font-semibold text-ink">{manager}</b> · Project lead: <b className="font-semibold text-ink">{c.lead}</b>
          </span>
          <Button size="sm" variant="link" onClick={() => setAssignOpen(true)}>
            <Repeat size={14} strokeWidth={1.6} /> Reassign
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <span>
            <b className="text-22 font-semibold">{cur ? `Step ${cur}` : c.code}</b>
            <span className="ml-1 text-12.5 text-muted">{cur ? `of ${cur <= 14 ? 14 : 25}` : `${ph[3]} of 23 registrations`}</span>
          </span>
          <span>
            <b className="text-22 font-semibold">{inc && daysToCoi !== undefined ? daysToCoi : `${allDone}/48`}</b>
            <span className="ml-1 text-12.5 text-muted">{inc ? "days to COI" : "steps done"}</span>
          </span>
          <span>
            <b className="text-22 font-semibold">{c.daysInStep}d</b>
            <span className="ml-1 text-12.5 text-muted">with {holder}</span>
          </span>
          {stepHref ? (
            <Link href={stepHref} className="min-w-0 hover:underline">
              {now}
            </Link>
          ) : (
            now
          )}
        </div>
      </section>

      <div className="overflow-x-auto">
        <Tabs items={tabs} value={tab} onChange={(k) => setTab(k as TabKey)} />
      </div>

      {tab === "incorporation" && (
        <>
          <SectionCard title="Timeline" flush>
            <GanttTimeline start={gantt.start} end={gantt.end} ticks={gantt.ticks} rows={gantt.rows} today={STAFF_TODAY} wideNames={inc} noCount={inc} />
          </SectionCard>
          <SectionCard title="Steps" meta={`${allDone} of 48 tasks${cur ? ` · Step ${cur} of 25` : ""}`} flush right={stepHref ? <HeadLink href={stepHref}>Open current step ›</HeadLink> : undefined}>
            <PhaseRows phases={phaseRows(c)} openId={c.stepNo ? `phase-${STEPS[c.stepNo - 1].phase}` : undefined} onAbout={setAbout} />
          </SectionCard>
          <AboutStepPanel key={about ?? 0} open={about !== null} onOpenChange={(v) => !v && setAbout(null)} n={about ?? 1} />
        </>
      )}
      {tab === "registrations" && inLead && leadRegs.length === 0 && <DataGrid title="Registrations" meta="After the certificate" columns={regTypeCols} rows={REG_TYPES} rowKey={(r) => r.id} pageSize={16} />}
      {tab === "registrations" && inLead && leadRegs.length > 0 && (
        <DataGrid title="Registrations" meta={`${leadRegs.filter((r) => r.status === "Granted").length} granted`} columns={leadRegCols} rows={leadRegs} rowKey={(r) => r.id} empty="None" />
      )}
      {tab === "obligations" && inLead && leadObs.length === 0 && <DataGrid title="Obligations" meta="After the certificate" columns={obTypeCols} rows={OB_TYPES} rowKey={(o) => o.id} pageSize={25} />}
      {tab === "obligations" && inLead && leadObs.length > 0 && (
        <DataGrid title="Obligations" meta="FY 2026-27" columns={leadObCols} rows={leadObs} rowKey={(o) => o.id} rowLate={(o) => o.status === "Overdue"} empty="None" />
      )}
      {tab === "registrations" && !inLead && <DataGrid title="Registrations" columns={regCols} rows={regs} rowKey={(r) => r.id} />}
      {tab === "obligations" && !inLead && <DataGrid title="Obligations" meta="October" columns={filingCols} rows={filings} rowKey={(w) => w.id} rowLate={(w) => w.status === "Overdue"} empty="Filings begin after the certificate" />}
      {tab === "documents" && (
        <SectionCard title="Documents" meta={String(docs.length)} flush right={<HeadLink href="/super/documents">All documents ›</HeadLink>}>
          <DocList groups={[{ label: "Latest", docs }]} />
        </SectionCard>
      )}
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
      {tab === "audit" && (
        <SectionCard title="Audit" flush>
          <ActivityList rows={audit} />
        </SectionCard>
      )}
      {tab === "notes" && (
        <SectionCard title="Notes" meta={String(notes.length)} flush>
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
              setNotes([{ id: `n${Date.now()}`, who: "Mithilesh", date: STAFF_TODAY, text: draft.trim() }, ...notes]);
              setDraft("");
            }}
          >
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a note" aria-label="Note" />
            <Button type="submit" variant="primary">
              Add
            </Button>
          </form>
        </SectionCard>
      )}

      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} clientId={c.id} onDone={(m) => toast.show(m)} />
      {toast.node}
    </div>
  );
}
