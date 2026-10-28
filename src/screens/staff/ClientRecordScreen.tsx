"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { STAFF_TODAY as TODAY, fmt } from "@/lib/dates";
import { STEPS } from "@/data/incorporation";
import { clientById, CONTACTS, incDone, doneSteps } from "@/data/staff-clients";
import { docsOf, auditOf, ganttOf, notesOf, preCoiRegsOf, DOCS_EXPECTED, docsTabCount, type RecordNote } from "@/data/staff-record";
import { registrationsFor, obligationsFor, staffObHref, staffRegHref, type StaffObligation, type StaffRegistration } from "@/data/staff-compliance";
import { currentStepN } from "@/data/staff-steps";
import { feesOf, rupees, type Invoice } from "@/data/staff-fees";
import { Button } from "@/components/ui/Button";
import { AreaPill, Chip, OwnerChip, type ChipTone } from "@/components/ui/Chip";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, Empty, HeadLink, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { GanttTimeline, type GanttRow } from "@/components/cards/GanttTimeline";
import { FREQ_LABEL, OB_TYPES, type ObType, type RegType } from "@/data/staff-regs-table";
import { DAYS_TO_COI } from "@/data/staff-today";
import { AboutStepPanel } from "./step-parts";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { DocList } from "@/components/cards/DocList";
import { ActivityList } from "@/components/cards/ActivityList";
import { personOf, stepHrefFor, type StaffPortal } from "./parts";
import { ClientTile } from "./grids";
import { AssignDialog, PhaseTrack, ReassignDialog, StepList, assignLead, curPhaseOf, leadOf, managerOf, useAssignments } from "./record-parts";

type TabKey = "overview" | "registrations" | "obligations" | "documents" | "notes" | "fees" | "timeline" | "audit";

const regTone: Record<StaffRegistration["status"], ChipTone> = { Granted: "ok", "In progress": "prog", "Waiting on client": "teal", "Not started": "idle", "Not needed": "idle" };
const obTone: Record<StaffObligation["status"], ChipTone> = { Filed: "ok", "In progress": "prog", "Waiting on client": "teal", Upcoming: "idle", Overdue: "bad" };
const feeTone: Record<Invoice["status"], ChipTone> = { Paid: "ok", Due: "warn", Overdue: "bad" };

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
  const [picked, setPicked] = React.useState<number | null>(null);

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
  // ?phase=n picks a phase; otherwise the step list opens on the current phase (R-22).
  const shownPhase = picked ?? (phase ? Math.min(3, Math.max(0, Number(phase) - 1)) : cur ? STEPS[cur - 1].phase - 1 : curPhaseOf(c));

  const regCols: Column<StaffRegistration>[] = [
    { key: "name", label: "Registration", render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: "authority", label: "Authority", width: 110 },
    { key: "form", label: "Form", width: 110, mono: true },
    { key: "idValue", label: "Number", width: 190, mono: true, render: (r) => r.idValue ?? "" },
    { key: "owner", label: "Owner", width: 110, render: (r) => <OwnerChip owner={r.owner} label={r.owner === "client" ? c.short : undefined} /> },
    { key: "next", label: "Next", width: 150, render: (r) => r.nextLabel ?? "" },
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
    { key: "name", label: "Obligation", render: (o) => <span className="font-medium text-ink">{o.name}</span> },
    { key: "form", label: "Form", width: 110, mono: true },
    { key: "area", label: "Area", width: 124, render: (o) => <AreaPill area={o.area} /> },
    { key: "frequency", label: "Frequency", width: 100 },
    { key: "period", label: "Period", width: 110 },
    { key: "due", label: "Due", width: 80, render: (o) => <span className={o.status === "Overdue" ? "font-medium text-bad" : undefined}>{fmt(o.due)}</span> },
    { key: "owner", label: "Owner", width: 110, render: (o) => <OwnerChip owner={o.owner} label={o.owner === "client" ? c.short : undefined} /> },
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
    { key: "amount", label: "Amount", width: 110, align: "right", render: (i) => rupees(i.amount) },
    { key: "due", label: "Due", width: 80, render: (i) => <span className={i.status === "Overdue" && !paid.has(i.id) ? "font-medium text-bad" : undefined}>{fmt(i.due)}</span> },
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
      {/* R-02 plain head: tile, 28 px name, stage, a muted meta line, actions on the right; then the record's numbers. */}
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <div className="flex min-w-0 flex-[1_1_320px] items-start gap-3">
            <ClientTile c={c} size={44} />
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="min-w-0 text-28 font-medium leading-9 tracking-[-0.01em]">{c.name}</h1>
                <Chip tone={inc ? "violet" : "teal"} dot={false} fixed>
                  {inc ? "Incorporating" : "Compliance"}
                </Chip>
              </div>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-13.5 text-muted">
                {contact && (
                  <>
                    <span>{contact.name}</span>
                    <span aria-hidden>·</span>
                    <a href={`mailto:${contact.email}`} className="hover:text-ink hover:underline">
                      {contact.email}
                    </a>
                  </>
                )}
                {portal === "admin" && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      Manager <b className="font-medium text-ink">{manager}</b>
                    </span>
                  </>
                )}
                {portal !== "lead" && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      Project lead <b className="font-medium text-ink">{lead}</b>
                    </span>
                    <Button size="sm" variant="link" className="h-auto px-0" onClick={() => setReassign(true)}>
                      Reassign
                    </Button>
                  </>
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setTab("documents")}>
            Documents {docs.length}
            {DOCS_EXPECTED[c.id] ? `/${DOCS_EXPECTED[c.id]}` : ""}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <span className="flex items-baseline gap-1.5">
            <b className="text-20 font-medium">{cur ? `Step ${cur}` : "Incorporated"}</b>
            <span className="text-13 text-muted">{cur ? `of ${cur <= 14 ? 14 : 25}` : `${c.phases[3]} of 23 registrations`}</span>
          </span>
          {inc && DAYS_TO_COI[c.id] !== undefined && (
            <span className="flex items-baseline gap-1.5">
              <b className="text-20 font-medium">{DAYS_TO_COI[c.id]}</b>
              <span className="text-13 text-muted">days to COI</span>
            </span>
          )}
          <span className="flex items-baseline gap-1.5">
            <b className="text-20 font-medium">{c.days}d</b>
            <span className="text-13 text-muted">with {c.pendingWith === "Client" ? "client" : c.pendingWith}</span>
          </span>
          <Link href={cur ? stepHrefFor(portal, c.id, cur) : `/${portal}/registrations`} className="flex min-w-0 flex-wrap items-center gap-2 text-14 hover:underline">
            <span className="text-muted">Now</span>
            <b className="truncate font-medium">
              <span className="font-mono text-13">{c.code}</span> · {c.step}
            </b>
            <Chip tone={c.pendingWith === "Client" ? "teal" : c.pendingWith === "MCA" ? "violet" : "prog"} fixed>
              {c.pendingWith === "Client" ? "Waiting on client" : `With ${c.pendingWith}`}
            </Chip>
          </Link>
        </div>
      </header>
      <Tabs
        variant="underline"
        items={[
          { key: "overview", label: "Incorporation", count: inc && cur ? `${cur}/14` : `${incDone(c)}/25` },
          { key: "registrations", label: "Registrations", count: regs.length ? regs.filter((r) => r.status !== "Not needed").length : preCoiRegsOf(c).length },
          { key: "obligations", label: "Obligations", count: obs.length || OB_TYPES.length },
          { key: "documents", label: "Documents", count: docsTabCount(c.id, docs.length) },
          { key: "notes", label: "Notes", count: notes.length },
        ]}
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
      />

      {tab === "overview" && (
        <>
          {timelineCard}
          <SectionCard title="Steps" meta={`${doneSteps(c)} of 48 tasks${cur ? ` · Step ${cur} of ${cur <= 14 ? 14 : 25}` : ""}`} right={cur && <HeadLink href={stepHrefFor(portal, c.id, cur)}>Open current step ›</HeadLink>}>
            <PhaseTrack c={c} picked={shownPhase} onPick={setPicked} />
            <div className="mt-4 border-t border-line-soft pt-3">
              {shownPhase < 3 ? (
                <StepList c={c} phase={(shownPhase + 1) as 1 | 2 | 3} hrefFor={(n) => stepHrefFor(portal, c.id, n)} onAbout={setAbout} />
              ) : (
                <div className="flex flex-wrap items-center gap-3 py-1 text-14">
                  <span className="min-w-0 flex-1">
                    <b className="font-medium">{c.phases[3]}</b> <span className="text-muted">of 23 registrations</span>
                    {c.stage === "compliance" && (
                      <>
                        <span className="text-muted"> · now </span>
                        <span className="font-mono text-13">{c.code}</span> {c.step}
                      </>
                    )}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setTab("registrations")}>
                    Open registrations
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>
          <AboutStepPanel key={about ?? 0} open={about !== null} onOpenChange={(v) => !v && setAbout(null)} n={about ?? 1} />
        </>
      )}
      {tab === "registrations" && regs.length === 0 && (
        <DataGrid
          title="Registrations"
          meta="After the certificate"
          columns={[
            { key: "name", label: "Registration", render: (r: RegType) => <span className="font-medium text-ink">{r.name}</span> },
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
            { key: "name", label: "Obligation", render: (o: ObType) => <span className="font-medium text-ink">{o.name}</span> },
            { key: "law", label: "Law", width: 130 },
            { key: "fr", label: "Frequency", width: 120, render: (o: ObType) => FREQ_LABEL[o.fr] },
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
              <span className="w-[64px] flex-none text-12 text-muted">{fmt(n.date)}</span>
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
                  <Send size={14} strokeWidth={1.6} /> Send invoice
                </Button>
              </>
            }
          >
            <KeyValue
              cols={3}
              rows={[
                { k: "Billed this year", v: rupees(fees.paid + fees.outstanding) },
                { k: "Paid", v: rupees(fees.paid + (fees.outstanding - outstanding)) },
                { k: "Outstanding", v: <span className={outstanding ? "font-medium text-bad" : undefined}>{rupees(outstanding)}</span> },
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
