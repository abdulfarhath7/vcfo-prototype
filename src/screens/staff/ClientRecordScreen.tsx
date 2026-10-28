"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { STAFF_TODAY as TODAY, fmt } from "@/lib/dates";
import { STEPS, PHASES, stepTone } from "@/data/incorporation";
import { clientById, PHASE_TOTALS, CONTACTS, incDone, doneSteps, type StaffClient } from "@/data/staff-clients";
import { docsOf, auditOf, ganttOf, notesOf, preCoiRegsOf, DOCS_EXPECTED, docsTabCount, type RecordNote } from "@/data/staff-record";
import { registrationsFor, obligationsFor, staffObHref, staffRegHref, type StaffObligation, type StaffRegistration } from "@/data/staff-compliance";
import { currentStepN, stepState } from "@/data/staff-steps";
import { feesOf, rupees, type Invoice } from "@/data/staff-fees";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, type ChipTone } from "@/components/ui/Chip";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, Empty, HeadLink, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { GanttTimeline, type GanttRow } from "@/components/cards/GanttTimeline";
import { PhaseRows, type Phase } from "@/components/cards/PhaseRows";
import { FREQ_LABEL, OB_TYPES, type ObType, type RegType } from "@/data/staff-regs-table";
import { DAYS_TO_COI } from "@/data/staff-today";
import { AboutStepPanel } from "./step-parts";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { DocList } from "@/components/cards/DocList";
import { ActivityList } from "@/components/cards/ActivityList";
import { personOf, stepHrefFor, type StaffPortal } from "./parts";
import { ClientTile } from "./grids";
import { AssignDialog, ReassignDialog, assignLead, leadOf, managerOf, useAssignments } from "./record-parts";

type TabKey = "overview" | "registrations" | "obligations" | "documents" | "notes" | "fees" | "timeline" | "audit";

const stepLabel = (c: StaffClient, n: number) => {
  const st = stepState(c, n);
  if (st.status === "Completed" && st.done) return `Done ${fmt(st.done)}`;
  if (st.status === "Upcoming") return STEPS[n - 1].time;
  // Old record: the step with the client shows "Client · 5d".
  if (st.status === "Waiting") return `Client · ${c.days}d`;
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
        return {
          n: s.n,
          title: s.title,
          owner: s.owner,
          ownerLabel: s.owner === "client" ? c.short : undefined,
          status: st,
          tone: stepTone[st],
          time: stepLabel(c, s.n),
          href: stepHrefFor(portal, c.id, s.n),
        };
      }),
    };
  });
  if (c.stage === "compliance") {
    const reg = c.phases[3];
    rows.push({
      id: "phase-4",
      name: "Registrations",
      done: reg,
      total: PHASE_TOTALS[3],
      status: reg === PHASE_TOTALS[3] ? "Done" : "In progress",
      tone: reg === PHASE_TOTALS[3] ? "ok" : "prog",
    });
  }
  return rows;
}

const regTone: Record<StaffRegistration["status"], ChipTone> = {
  Granted: "ok",
  "In progress": "prog",
  "Waiting on client": "warn",
  "Not started": "idle",
  "Not needed": "idle",
};
const obTone: Record<StaffObligation["status"], ChipTone> = {
  Filed: "ok",
  "In progress": "prog",
  "Waiting on client": "warn",
  Upcoming: "idle",
  Overdue: "bad",
};
const feeTone: Record<Invoice["status"], ChipTone> = {
  Paid: "ok",
  Due: "warn",
  Overdue: "bad",
};

const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};

function Record({ portal }: { portal: StaffPortal }) {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const phase = search.get("phase");
  const c = clientById(params.id);
  const s = useAssignments();
  const toast = useUndoToast();
  const [tab, setTab] = React.useState<TabKey>("overview");
  const [about, setAbout] = React.useState<number | null>(null);
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
  const manager = managerOf(c, s);
  const lead = leadOf(c, s);
  const inc = c.stage === "incorporating";

  const regCols: Column<StaffRegistration>[] = [
    {
      key: "name",
      label: "Registration",
      render: (r) => <span className="font-semibold">{r.name}</span>,
    },
    { key: "authority", label: "Authority", width: 110 },
    { key: "form", label: "Form", width: 110, mono: true },
    {
      key: "idValue",
      label: "Number",
      width: 190,
      mono: true,
      render: (r) => r.idValue ?? "",
    },
    {
      key: "owner",
      label: "Owner",
      width: 110,
      render: (r) => <OwnerChip owner={r.owner} label={r.owner === "client" ? c.short : undefined} />,
    },
    {
      key: "next",
      label: "Next",
      width: 150,
      render: (r) => r.nextLabel ?? "",
    },
    {
      key: "status",
      label: "Status",
      width: 130,
      render: (r) => (
        <Chip tone={regTone[r.status]} fixed>
          {r.status}
        </Chip>
      ),
    },
  ];
  const obCols: Column<StaffObligation>[] = [
    {
      key: "name",
      label: "Obligation",
      render: (o) => <span className="font-semibold">{o.name}</span>,
    },
    { key: "form", label: "Form", width: 110, mono: true },
    { key: "area", label: "Area", width: 110 },
    { key: "frequency", label: "Frequency", width: 100 },
    { key: "period", label: "Period", width: 110 },
    {
      key: "due",
      label: "Due",
      width: 80,
      render: (o) => <span className={o.status === "Overdue" ? "font-semibold text-bad" : undefined}>{fmt(o.due)}</span>,
    },
    {
      key: "owner",
      label: "Owner",
      width: 110,
      render: (o) => <OwnerChip owner={o.owner} label={o.owner === "client" ? c.short : undefined} />,
    },
    {
      key: "status",
      label: "Status",
      width: 140,
      render: (o) => (
        <Chip tone={obTone[o.status]} fixed>
          {o.status}
        </Chip>
      ),
    },
  ];
  const invCols: Column<Invoice>[] = [
    { key: "number", label: "Invoice", width: 140, mono: true },
    { key: "date", label: "Date", width: 80, render: (i) => fmt(i.date) },
    { key: "item", label: "For" },
    {
      key: "amount",
      label: "Amount",
      width: 110,
      align: "right",
      render: (i) => rupees(i.amount),
    },
    {
      key: "due",
      label: "Due",
      width: 80,
      render: (i) => <span className={i.status === "Overdue" && !paid.has(i.id) ? "font-semibold text-bad" : undefined}>{fmt(i.due)}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: 130,
      render: (i) => (
        <Chip tone={paid.has(i.id) ? "ok" : feeTone[i.status]} fixed>
          {paid.has(i.id) ? "Paid" : i.status}
        </Chip>
      ),
    },
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setDraftEnds(Object.fromEntries(gantt.filter((r) => r.bars.length).map((r) => [r.id, iso(r.bars[r.bars.length - 1].to)])));
            setEditing(true);
          }}
        >
          Edit
        </Button>
      }
    >
      <GanttTimeline start={g.start} end={g.end} ticks={g.ticks} rows={gantt} today={TODAY} wideNames={inc} noCount={inc} />
    </SectionCard>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Old record head (s/lead/Overview.dc.html): grey band with the name, contact, step count, days to COI, holder and the current step. */}
      <section className="overflow-hidden rounded-lg bg-line-soft" aria-label={c.name}>
        <div className="grid gap-3 px-4 pb-3 pt-4 md:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <ClientTile c={c} size={36} />
            <h1 className="min-w-0 flex-1 truncate text-22 font-semibold tracking-tight">{c.name}</h1>
            <Chip tone={inc ? "warn" : "teal"}>{inc ? "Incorporating" : "Compliance"}</Chip>
            <Button size="sm" variant="outline" onClick={() => setTab("documents")}>
              Documents {docs.length}
              {DOCS_EXPECTED[c.id] ? `/${DOCS_EXPECTED[c.id]}` : ""}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-13 text-ink-2">
            {contact && (
              <>
                <span>{contact.name}</span>
                <a href={`mailto:${contact.email}`} className="hover:underline">
                  {contact.email}
                </a>
              </>
            )}
            {portal !== "lead" && (
              <span className="inline-flex items-center gap-2 text-muted">
                {portal === "admin" && (
                  <span>
                    Manager <b className="font-semibold text-ink">{manager}</b> ·
                  </span>
                )}
                <span>
                  Project lead <b className="font-semibold text-ink">{lead}</b>
                </span>
                <Button size="sm" variant="link" onClick={() => setReassign(true)}>
                  Reassign
                </Button>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-4 pb-4 pt-1 md:px-5">
          <span className="flex items-baseline gap-1.5">
            <b className="text-22 font-semibold">{cur ? `Step ${cur}` : "Incorporated"}</b>
            <span className="text-12.5 text-muted">{cur ? `of ${cur <= 14 ? 14 : 25}` : `${c.phases[3]} of 23 registrations`}</span>
          </span>
          {inc && DAYS_TO_COI[c.id] !== undefined && (
            <span className="flex items-baseline gap-1.5">
              <b className="text-22 font-semibold">{DAYS_TO_COI[c.id]}</b>
              <span className="text-12.5 text-muted">days to COI</span>
            </span>
          )}
          <span className="flex items-baseline gap-1.5">
            <b className="text-22 font-semibold">{c.days}d</b>
            <span className="text-12.5 text-muted">with {c.pendingWith === "Client" ? "client" : c.pendingWith}</span>
          </span>
          <Link href={cur ? stepHrefFor(portal, c.id, cur) : `/${portal}/registrations`} className="flex min-w-0 flex-wrap items-center gap-2 text-13 hover:underline">
            <span className="text-muted">Now</span>
            <b className="truncate font-semibold">
              {c.code} · {c.step}
            </b>
            <Chip tone={c.pendingWith === "Client" ? "warn" : c.pendingWith === "MCA" ? "violet" : "prog"}>{c.pendingWith === "Client" ? "Waiting on client" : `With ${c.pendingWith}`}</Chip>
          </Link>
        </div>
      </section>
      <div className="overflow-x-auto">
        <Tabs
          items={[
            {
              key: "overview",
              label: "Incorporation",
              count: inc && cur ? `${cur}/14` : `${incDone(c)}/25`,
            },
            {
              key: "registrations",
              label: "Registrations",
              count: regs.length ? regs.filter((r) => r.status !== "Not needed").length : preCoiRegsOf(c).length,
            },
            {
              key: "obligations",
              label: "Obligations",
              count: obs.length || OB_TYPES.length,
            },
            { key: "documents", label: "Documents", count: docsTabCount(c.id, docs.length) },
            { key: "notes", label: "Notes", count: notes.length },
          ]}
          value={tab}
          onChange={(k) => setTab(k as TabKey)}
        />
      </div>

      {tab === "overview" && (
        <>
          {timelineCard}
          <SectionCard title="Steps" meta={`${doneSteps(c)} of 48 tasks${cur ? ` · Step ${cur} of ${cur <= 14 ? 14 : 25}` : ""}`} flush right={cur && <HeadLink href={stepHrefFor(portal, c.id, cur)}>Open current step ›</HeadLink>}>
            <PhaseRows key={phase ?? "none"} phases={phasesOf(c, portal)} openId={phase ? `phase-${phase}` : cur ? `phase-${STEPS[cur - 1].phase}` : undefined} onAbout={setAbout} />
          </SectionCard>
          <AboutStepPanel key={about ?? 0} open={about !== null} onOpenChange={(v) => !v && setAbout(null)} n={about ?? 1} />
        </>
      )}
      {tab === "registrations" && regs.length === 0 && (
        <DataGrid
          title="Registrations"
          meta="After the certificate"
          columns={[
            {
              key: "name",
              label: "Registration",
              render: (r: RegType) => <span className="font-semibold">{r.name}</span>,
            },
            { key: "auth", label: "Authority", width: 160 },
            { key: "form", label: "Form", width: 160, mono: true },
            {
              key: "status",
              label: "Status",
              width: 130,
              render: () => (
                <Chip tone="idle" fixed>
                  After COI
                </Chip>
              ),
            },
          ]}
          rows={preCoiRegsOf(c)}
          rowKey={(r) => r.id}
          pageSize={16}
        />
      )}
      {tab === "obligations" && obs.length === 0 && (
        <DataGrid
          title="Obligations"
          meta="After the certificate"
          columns={[
            {
              key: "name",
              label: "Obligation",
              render: (o: ObType) => <span className="font-semibold">{o.name}</span>,
            },
            { key: "law", label: "Law", width: 130 },
            {
              key: "fr",
              label: "Frequency",
              width: 120,
              render: (o: ObType) => FREQ_LABEL[o.fr],
            },
            {
              key: "status",
              label: "Status",
              width: 130,
              render: () => (
                <Chip tone="idle" fixed>
                  After COI
                </Chip>
              ),
            },
          ]}
          rows={OB_TYPES}
          rowKey={(o) => o.id}
          pageSize={25}
        />
      )}
      {tab === "registrations" && regs.length > 0 && (
        <DataGrid
          title="Registrations"
          meta={`${regs.filter((r) => r.status === "Granted").length} granted`}
          columns={regCols}
          rows={regRows}
          rowKey={(r) => r.id}
          rowHref={(r) => staffRegHref(portal, r.id)}
          empty="None"
          filters={
            <Select
              value={regStatus}
              onChange={(e) => setRegStatus(e.target.value)}
              options={[{ value: "", label: "All statuses" }, ...(["Granted", "In progress", "Waiting on client", "Not started", "Not needed"] as const).map((x) => ({ value: x, label: x }))]}
              aria-label="Status"
            />
          }
        />
      )}
      {tab === "obligations" && obs.length > 0 && (
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
              <Select
                value={obFreq}
                onChange={(e) => setObFreq(e.target.value)}
                options={[{ value: "", label: "All frequencies" }, ...["Monthly", "Quarterly", "Half-yearly", "Annual", "Event"].map((x) => ({ value: x, label: x }))]}
                aria-label="Frequency"
              />
              <Select
                value={obStatus}
                onChange={(e) => setObStatus(e.target.value)}
                options={[{ value: "", label: "All statuses" }, ...["Overdue", "Waiting on client", "In progress", "Upcoming", "Filed"].map((x) => ({ value: x, label: x }))]}
                aria-label="Status"
              />
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
              setNotes([
                {
                  id: `n${notes.length + 1}-${Date.now()}`,
                  who: personOf(portal),
                  date: TODAY,
                  text: draft.trim(),
                },
                ...notes,
              ]);
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
                {
                  k: "Billed this year",
                  v: rupees(fees.paid + fees.outstanding),
                },
                {
                  k: "Paid",
                  v: rupees(fees.paid + (fees.outstanding - outstanding)),
                },
                {
                  k: "Outstanding",
                  v: <span className={outstanding ? "font-semibold text-bad" : undefined}>{rupees(outstanding)}</span>,
                },
                {
                  k: "Oldest open invoice",
                  v: outstanding && fees.days ? `${fees.days} days` : "",
                },
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
                    if (!v || !r.bars.length) return r;
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
          {gantt
            .filter((r) => r.bars.length)
            .map((r) => (
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
