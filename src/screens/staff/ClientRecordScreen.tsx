"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Building2, Mail, Phone, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, daysFrom, fmt } from "@/lib/dates";
import { STEPS, PHASES, stepTone } from "@/data/incorporation";
import { clientById, healthTone, PHASE_TOTALS, CONTACTS, incDone, doneSteps, type StaffClient } from "@/data/staff-clients";
import { docsOf, auditOf, ganttOf, notesOf, type RecordNote } from "@/data/staff-record";
import { registrationsFor, obligationsFor, staffObHref, staffRegHref, type StaffObligation, type StaffRegistration } from "@/data/staff-compliance";
import { currentStepN, stepState } from "@/data/staff-steps";
import { feesOf, rupees, type Invoice } from "@/data/staff-fees";
import { Row } from "@/components/shell/Page";
import { Bar } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, Tag, type ChipTone } from "@/components/ui/Chip";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, Empty, HeadLink, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { GanttTimeline, type GanttRow } from "@/components/cards/GanttTimeline";
import { PhaseRows, type Phase } from "@/components/cards/PhaseRows";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { DocList } from "@/components/cards/DocList";
import { ActivityList } from "@/components/cards/ActivityList";
import { identityTile, personOf, stepHrefFor, type StaffPortal } from "./parts";
import { HolderDot } from "./grids";
import { AssignDialog, ReassignDialog, assignLead, leadOf, managerOf, useAssignments } from "./record-parts";

type TabKey = "overview" | "registrations" | "obligations" | "documents" | "notes" | "fees" | "timeline" | "audit";

const stepLabel = (c: StaffClient, n: number) => {
  const st = stepState(c, n);
  if (st.status === "Completed" && st.done) return `Done ${fmt(st.done)}`;
  if (st.status === "Upcoming") return STEPS[n - 1].time;
  return st.to ? `Due ${fmt(st.to)}` : STEPS[n - 1].time;
};

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
        const st = stepState(c, s.n).status;
        return { n: s.n, title: s.title, owner: s.owner, ownerLabel: s.owner === "client" ? c.short : undefined, status: st, tone: stepTone[st], time: stepLabel(c, s.n), href: stepHrefFor(portal, c.id, s.n) };
      }),
    };
  });
  if (c.stage === "compliance") {
    const reg = c.phases[3];
    rows.push({ id: "phase-4", name: "Registrations", done: reg, total: PHASE_TOTALS[3], status: reg === PHASE_TOTALS[3] ? "Done" : "In progress", tone: reg === PHASE_TOTALS[3] ? "ok" : "prog" });
  }
  return rows;
}

const regTone: Record<StaffRegistration["status"], ChipTone> = { Granted: "ok", "In progress": "prog", "Waiting on client": "warn", "Not started": "idle", "Not needed": "idle" };
const obTone: Record<StaffObligation["status"], ChipTone> = { Filed: "ok", "In progress": "prog", "Waiting on client": "warn", Upcoming: "idle", Overdue: "bad" };
const feeTone: Record<Invoice["status"], ChipTone> = { Paid: "ok", Due: "warn", Overdue: "bad" };

const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};

/** Practice areas for one client (reference/old-patch/shared/v7c_practice.dc.html). */
function PracticeAreas({ c, regs, obs, portal }: { c: StaffClient; regs: StaffRegistration[]; obs: StaffObligation[]; portal: StaffPortal }) {
  const cur = currentStepN(c);
  const coi = stepState(c, 14);
  const incDoneAll = incDone(c) === 25;
  const granted = regs.filter((r) => r.status === "Granted");
  const needed = regs.filter((r) => r.status !== "Not needed");
  const counts = {
    Filed: obs.filter((o) => o.status === "Filed").length,
    "Due soon": obs.filter((o) => o.status === "In progress" || o.status === "Waiting on client").length,
    Overdue: obs.filter((o) => o.status === "Overdue").length,
    Upcoming: obs.filter((o) => o.status === "Upcoming").length,
  };
  return (
    <Row cols={3}>
      <SectionCard title="Incorporation" right={<Chip tone={incDoneAll ? "ok" : "prog"}>{incDoneAll ? "Done" : "In progress"}</Chip>}>
        <p className="text-22 font-semibold">{incDoneAll ? "Incorporated" : `Step ${cur} of 25`}</p>
        <Bar pct={Math.round((incDone(c) / 25) * 100)} tone={incDoneAll ? "ok" : "accent"} className="mt-3" />
        <p className="mt-2 truncate text-12.5 text-muted">
          {incDoneAll ? `Post-incorporation ${c.phases[2]} of 11` : `${c.step}${coi.to && c.phases[1] < 9 ? ` · certificate expected ${fmt(coi.to)}` : ""}`}
        </p>
      </SectionCard>
      <SectionCard title="Registrations" right={<Chip tone={c.stage === "incorporating" ? "idle" : granted.length === needed.length ? "ok" : "prog"}>{c.stage === "incorporating" ? "Not started" : granted.length === needed.length ? "Done" : "In progress"}</Chip>}>
        <p className="text-22 font-semibold">{c.stage === "incorporating" ? "After the certificate" : `${granted.length} of ${needed.length} registered`}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {needed.slice(0, 8).map((r) => (
            <Link key={r.id} href={staffRegHref(portal, r.id)}>
              <Tag tone={r.status === "Granted" ? "ok" : r.status === "Not started" ? "idle" : "prog"}>{r.name.replace(" registration", "")}</Tag>
            </Link>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Compliances" right={counts.Overdue ? <Chip tone="bad">{counts.Overdue} overdue</Chip> : <Chip tone={obs.length ? "ok" : "idle"}>{obs.length ? "On track" : "Not started"}</Chip>}>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(counts) as Array<keyof typeof counts>).map((k) => (
            <span key={k} className="min-w-0">
              <b className={cn("block text-22 font-semibold", k === "Overdue" && counts[k] > 0 && "text-bad", k === "Filed" && "text-ok")}>{counts[k]}</b>
              <span className="block truncate text-12 text-muted">{k}</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-12.5 text-muted">{obs.length ? `${obs.length} filings this year` : "Filings begin after the certificate"}</p>
      </SectionCard>
    </Row>
  );
}

function Record({ portal }: { portal: StaffPortal }) {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const phase = search.get("phase");
  const c = clientById(params.id);
  const s = useAssignments();
  const toast = useUndoToast();
  const [tab, setTab] = React.useState<TabKey>("overview");
  const [gantt, setGantt] = React.useState<GanttRow[]>(() => (c ? ganttOf(c).rows : []));
  const [editing, setEditing] = React.useState(false);
  const [draftEnds, setDraftEnds] = React.useState<Record<string, string>>({});
  const [notes, setNotes] = React.useState<RecordNote[]>(() => (c ? notesOf(c) : []));
  const [draft, setDraft] = React.useState("");
  const [reassign, setReassign] = React.useState(false);
  const [regStatus, setRegStatus] = React.useState("");
  const [obFreq, setObFreq] = React.useState("");
  const [obStatus, setObStatus] = React.useState("");
  const [paid, setPaid] = React.useState<Set<string>>(new Set());

  if (!c) return <SectionCard title="Client">{<Empty>No client</Empty>}</SectionCard>;
  const g = ganttOf(c);
  const regs = registrationsFor("admin", c.id);
  const obs = obligationsFor("admin", c.id);
  const docs = docsOf(c);
  const fees = feesOf(c);
  const contact = CONTACTS[c.id];
  const cur = currentStepN(c);
  const coi = stepState(c, 14);
  const manager = managerOf(c, s);
  const lead = leadOf(c, s);
  const inc = c.stage === "incorporating";

  const regCols: Column<StaffRegistration>[] = [
    { key: "name", label: "Registration", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "authority", label: "Authority", width: 110 },
    { key: "form", label: "Form", width: 110, mono: true },
    { key: "idValue", label: "Number", width: 190, mono: true, render: (r) => r.idValue ?? "" },
    { key: "owner", label: "Owner", width: 110, render: (r) => <OwnerChip owner={r.owner} label={r.owner === "client" ? c.short : undefined} /> },
    { key: "next", label: "Next", width: 150, render: (r) => r.nextLabel ?? "" },
    { key: "status", label: "Status", width: 130, render: (r) => <Chip tone={regTone[r.status]} fixed>{r.status}</Chip> },
  ];
  const obCols: Column<StaffObligation>[] = [
    { key: "name", label: "Obligation", render: (o) => <span className="font-semibold">{o.name}</span> },
    { key: "form", label: "Form", width: 110, mono: true },
    { key: "area", label: "Area", width: 110 },
    { key: "frequency", label: "Frequency", width: 100 },
    { key: "period", label: "Period", width: 110 },
    { key: "due", label: "Due", width: 80, render: (o) => <span className={o.status === "Overdue" ? "font-semibold text-bad" : undefined}>{fmt(o.due)}</span> },
    { key: "owner", label: "Owner", width: 110, render: (o) => <OwnerChip owner={o.owner} label={o.owner === "client" ? c.short : undefined} /> },
    { key: "status", label: "Status", width: 140, render: (o) => <Chip tone={obTone[o.status]} fixed>{o.status}</Chip> },
  ];
  const invCols: Column<Invoice>[] = [
    { key: "number", label: "Invoice", width: 140, mono: true },
    { key: "date", label: "Date", width: 80, render: (i) => fmt(i.date) },
    { key: "item", label: "For" },
    { key: "amount", label: "Amount", width: 110, align: "right", render: (i) => rupees(i.amount) },
    { key: "due", label: "Due", width: 80, render: (i) => <span className={i.status === "Overdue" && !paid.has(i.id) ? "font-semibold text-bad" : undefined}>{fmt(i.due)}</span> },
    { key: "status", label: "Status", width: 130, render: (i) => <Chip tone={paid.has(i.id) ? "ok" : feeTone[i.status]} fixed>{paid.has(i.id) ? "Paid" : i.status}</Chip> },
    {
      key: "act",
      label: "",
      width: 130,
      render: (i) =>
        i.status !== "Paid" && !paid.has(i.id) ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPaid(new Set([...paid, i.id]));
              toast.show(`Payment recorded for ${i.number}`, () => setPaid((p) => new Set([...p].filter((x) => x !== i.id))));
            }}
          >
            Record payment
          </Button>
        ) : null,
    },
  ];
  const regRows = regs.filter((r) => !regStatus || r.status === regStatus);
  const obRows = obs.filter((o) => (!obFreq || o.frequency === obFreq) && (!obStatus || o.status === obStatus));
  const outstanding = fees.invoices.filter((i) => i.status !== "Paid" && !paid.has(i.id)).reduce((a, i) => a + i.amount, 0);
  const timelineCard = (
    <SectionCard
      title="Timeline"
      flush
      right={
        portal !== "admin" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDraftEnds(Object.fromEntries(gantt.map((r) => [r.id, iso(r.bars[r.bars.length - 1].to)])));
              setEditing(true);
            }}
          >
            Edit
          </Button>
        )
      }
    >
      <GanttTimeline start={g.start} end={g.end} ticks={g.ticks} rows={gantt} />
    </SectionCard>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard
        title={c.name}
        icon={{ Icon: Building2, tone: identityTile[c.tone] }}
        meta={<Chip tone={inc ? "violet" : "teal"}>{inc ? "Incorporating" : "Compliance"}</Chip>}
        right={
          <Button size="sm" variant="outline" onClick={() => setTab("documents")}>
            Documents {docs.length}
          </Button>
        }
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-13">
            {contact && (
              <>
                <span className="font-semibold">{contact.name}</span>
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 text-accent hover:underline">
                  <Mail size={14} strokeWidth={1.5} /> {contact.email}
                </a>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-ink-2 hover:underline">
                  <Phone size={14} strokeWidth={1.5} /> {contact.phone}
                </a>
              </>
            )}
            {portal !== "lead" && (
              <span className="inline-flex items-center gap-2 text-muted">
                {portal === "admin" && (
                  <>
                    Manager <b className="font-semibold text-ink">{manager}</b> ·
                  </>
                )}
                Project lead <b className="font-semibold text-ink">{lead}</b>
                <Button size="sm" variant="link" onClick={() => setReassign(true)}>
                  Reassign
                </Button>
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-line-soft pt-3 md:grid-cols-4">
            <span>
              <b className="block text-22 font-semibold">{cur ? `Step ${cur}` : "Incorporated"}</b>
              <span className="text-12.5 text-muted">{cur ? "of 25" : `${c.phases[3]} of 23 registrations`}</span>
            </span>
            <span>
              <b className="block text-22 font-semibold">{inc && coi.to ? daysFrom(coi.to) : `${doneSteps(c)}/48`}</b>
              <span className="text-12.5 text-muted">{inc ? "days to COI" : "steps done"}</span>
            </span>
            <span>
              <b className={cn("block text-22 font-semibold", c.days > 4 && "text-bad")}>{c.days}d</b>
              <span className="text-12.5 text-muted">with {c.pendingWith === "Client" ? "client" : c.pendingWith}</span>
            </span>
            <Link href={cur ? stepHrefFor(portal, c.id, cur) : `/${portal}/registrations`} className="col-span-2 min-w-0 rounded-md border border-line px-3 py-2 hover:bg-raised md:col-span-1">
              <span className="flex items-center gap-2 text-12.5 text-muted">
                <HolderDot c={c} /> Now
              </span>
              <b className="block truncate text-13.5 font-semibold">
                {c.code} · {c.step}
              </b>
              <Chip tone={healthTone[c.health]} className="mt-1">
                {c.health}
              </Chip>
            </Link>
          </div>
          <KeyValue
            cols={3}
            rows={[
              { k: "CIN", v: c.cin ?? "", mono: true },
              { k: "PAN", v: c.pan ?? "", mono: true },
              { k: "GSTIN", v: c.gstin ?? "", mono: true },
            ]}
          />
        </div>
        <div className="-mx-4 mt-4 overflow-x-auto border-t border-line-soft px-4 pt-3 md:-mx-5 md:px-5">
          <Tabs
            items={[
              { key: "overview", label: "Incorporation", count: `${incDone(c)}/25` },
              { key: "registrations", label: "Registrations", count: regs.filter((r) => r.status !== "Not needed").length },
              { key: "obligations", label: "Obligations", count: obs.length },
              { key: "documents", label: "Documents", count: docs.length },
              { key: "notes", label: "Notes", count: notes.length },
              { key: "fees", label: "Fees" },
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
          <PracticeAreas c={c} regs={regs} obs={obs} portal={portal} />
          {timelineCard}
          <SectionCard title="Steps" meta={`${doneSteps(c)} of 48 tasks${cur ? ` · Step ${cur} of 25` : ""}`} flush right={cur && <HeadLink href={stepHrefFor(portal, c.id, cur)}>Open current step ›</HeadLink>}>
            <PhaseRows key={phase ?? "none"} phases={phasesOf(c, portal)} openId={phase ? `phase-${phase}` : cur ? `phase-${STEPS[cur - 1].phase}` : undefined} />
          </SectionCard>
        </>
      )}
      {tab === "registrations" && (
        <DataGrid
          title="Registrations"
          meta={`${regs.filter((r) => r.status === "Granted").length} granted`}
          columns={regCols}
          rows={regRows}
          rowKey={(r) => r.id}
          rowHref={(r) => staffRegHref(portal, r.id)}
          empty="None"
          filters={<Select value={regStatus} onChange={(e) => setRegStatus(e.target.value)} options={[{ value: "", label: "All statuses" }, ...(["Granted", "In progress", "Waiting on client", "Not started", "Not needed"] as const).map((x) => ({ value: x, label: x }))]} aria-label="Status" />}
        />
      )}
      {tab === "obligations" && (
        <DataGrid
          title="Obligations"
          meta="FY 2026-27"
          columns={obCols}
          rows={obRows}
          rowKey={(o) => o.id}
          rowHref={(o) => staffObHref(portal, o.id)}
          rowLate={(o) => o.status === "Overdue"}
          empty={inc ? "Filings begin after the certificate" : "None"}
          filters={
            <>
              <Select value={obFreq} onChange={(e) => setObFreq(e.target.value)} options={[{ value: "", label: "All frequencies" }, ...["Monthly", "Quarterly", "Half-yearly", "Annual", "Event"].map((x) => ({ value: x, label: x }))]} aria-label="Frequency" />
              <Select value={obStatus} onChange={(e) => setObStatus(e.target.value)} options={[{ value: "", label: "All statuses" }, ...["Overdue", "Waiting on client", "In progress", "Upcoming", "Filed"].map((x) => ({ value: x, label: x }))]} aria-label="Status" />
            </>
          }
        />
      )}
      {tab === "documents" && (
        <SectionCard title="Documents" meta={String(docs.length)} flush right={<HeadLink href={`/${portal}/docs/vault`}>Vault ›</HeadLink>}>
          <DocList groups={[{ label: "All", docs }]} />
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
              setNotes([{ id: `n${notes.length + 1}-${Date.now()}`, who: personOf(portal), date: TODAY, text: draft.trim() }, ...notes]);
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
      {tab === "fees" && (
        <>
          <SectionCard
            title="Fees"
            meta={fees.engagement}
            right={
              <>
                <Button size="sm" variant="outline" disabled={!outstanding} onClick={() => toast.show(`Reminder sent to ${contact?.name ?? c.short}`)}>
                  Send reminder
                </Button>
                <Button size="sm" variant="primary" onClick={() => toast.show(`Invoice sent to ${contact?.email ?? c.short}`)}>
                  <Send size={14} strokeWidth={1.5} /> Send invoice
                </Button>
              </>
            }
          >
            <KeyValue
              cols={3}
              rows={[
                { k: "Billed this year", v: rupees(fees.paid + fees.outstanding) },
                { k: "Paid", v: rupees(fees.paid + (fees.outstanding - outstanding)) },
                { k: "Outstanding", v: <span className={outstanding ? "font-semibold text-bad" : undefined}>{rupees(outstanding)}</span> },
                { k: "Oldest open invoice", v: outstanding && fees.days ? `${fees.days} days` : "" },
                { k: "Engagement", v: fees.engagement },
                { k: "Bills to", v: contact?.email ?? "" },
              ]}
            />
          </SectionCard>
          <DataGrid title="Invoices" columns={invCols} rows={fees.invoices} rowKey={(i) => i.id} rowLate={(i) => i.status === "Overdue" && !paid.has(i.id)} />
        </>
      )}
      {tab === "timeline" && timelineCard}
      {tab === "audit" && (
        <SectionCard title="Audit" flush>
          <ActivityList rows={auditOf(c)} />
        </SectionCard>
      )}

      <Modal
        open={editing}
        onOpenChange={setEditing}
        title="Edit the timeline"
        sub={c.short}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setGantt(
                  gantt.map((r) => {
                    const v = draftEnds[r.id];
                    if (!v) return r;
                    const bars = [...r.bars];
                    const last = bars[bars.length - 1];
                    const to = fromIso(v);
                    if (to > last.from) bars[bars.length - 1] = { ...last, to };
                    return { ...r, bars };
                  }),
                );
                setEditing(false);
                toast.show("Timeline saved. The client sees the new dates.");
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          {gantt.map((r) => (
            <Field key={r.id} label={`${r.name} · planned end`}>
              <Input type="date" value={draftEnds[r.id] ?? ""} onChange={(e) => setDraftEnds({ ...draftEnds, [r.id]: e.target.value })} />
            </Field>
          ))}
        </div>
      </Modal>
      {portal === "admin" && <AssignDialog open={reassign} onOpenChange={setReassign} mode="client" clientId={c.id} onDone={(t) => toast.show(t)} />}
      {portal === "manager" && (
        <ReassignDialog
          open={reassign}
          onOpenChange={setReassign}
          title={c.short}
          from={lead}
          manager={manager}
          onConfirm={(to) => {
            assignLead(c.id, to);
            toast.show(`${c.short} is now with ${to}`);
          }}
        />
      )}
      {toast.node}
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

