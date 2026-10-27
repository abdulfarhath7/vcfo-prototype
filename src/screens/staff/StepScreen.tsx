"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { List, Send } from "lucide-react";
import { TODAY, d, fmt } from "@/lib/dates";
import { STEPS, stepTone } from "@/data/incorporation";
import { clientById } from "@/data/staff-clients";
import { CLIENT_PEOPLE } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { FileBadge, fileType } from "@/components/ui/FileBadge";
import { Input } from "@/components/ui/Input";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { Thread, type ThreadStep } from "@/components/cards/Thread";
import { identityTile, ClientDot, personOf, type StaffPortal } from "./parts";

type DocState = "Accepted" | "Submitted" | "Asked" | "Sent back";

interface StepDoc {
  id: string;
  name: string;
  file?: string;
  state: DocState;
  date: Date;
  note?: string;
}

const docTone: Record<DocState, "ok" | "prog" | "warn" | "bad"> = { Accepted: "ok", Submitted: "prog", Asked: "warn", "Sent back": "bad" };

// Step 7 (Registered office address) ported from reference/old-screens/s/lead/Step.dc.html. Dates move back 10 days.
const STEP7_DOCS: StepDoc[] = [
  { id: "sd1", name: "Rent agreement", file: "rent-agreement-2026.pdf", state: "Accepted", date: d(2026, 9, 30) },
  { id: "sd2", name: "NOC from owner", file: "noc-unsigned.pdf", state: "Submitted", date: d(2026, 10, 4), note: "Signature missing" },
  { id: "sd3", name: "Utility bill, under 2 months", state: "Asked", date: d(2026, 10, 1) },
];

const STEP7_THREAD: ThreadStep[] = [
  { id: "th1", title: "Documents asked from the client", state: "done", date: d(2026, 9, 29), by: "Bharath" },
  { id: "th2", title: "Address details and rent agreement accepted", state: "done", date: d(2026, 9, 30), by: "Bharath" },
  { id: "th3", title: "NOC uploaded without signature", state: "done", date: d(2026, 10, 4), by: "Rohan Kumar", owner: "client" },
  { id: "th4", title: "Utility bill and signed NOC", state: "current", date: TODAY, owner: "client", note: "Asked 5 days ago" },
  { id: "th5", title: "SBC review", state: "upcoming", owner: "sbc" },
  { id: "th6", title: "Step complete", state: "upcoming" },
];

const STEP7_NOTES = [
  { id: "n1", who: "Bharath", date: d(2026, 10, 4), text: "Ask for a fresh bill if it is older than 15 Aug." },
  { id: "n2", who: "Pranay", date: d(2026, 10, 2), text: "Bill must show the same address as the agreement." },
];

function genericDocs(names: string[] | undefined, done: boolean): StepDoc[] {
  return (names ?? []).map((n, i) => ({ id: `g${i}`, name: n.replace(/\.[a-z]+$/i, ""), file: /\./.test(n) ? n : undefined, state: done ? "Accepted" : i === 0 ? "Submitted" : "Asked", date: d(2026, 10, 1 + i) }));
}

function genericThread(done: boolean, owner: ThreadStep["owner"], lead: string): ThreadStep[] {
  return [
    { id: "g1", title: "Step opened", state: "done", date: d(2026, 9, 28), by: lead },
    { id: "g2", title: "Documents asked", state: "done", date: d(2026, 9, 29), by: lead },
    { id: "g3", title: owner === "client" ? "Client uploads" : "SBC works the step", state: done ? "done" : "current", date: done ? d(2026, 10, 2) : TODAY, owner },
    { id: "g4", title: "Review", state: done ? "done" : "upcoming", date: done ? d(2026, 10, 3) : undefined, owner: "sbc" },
    { id: "g5", title: "Step complete", state: done ? "done" : "upcoming", date: done ? d(2026, 10, 3) : undefined },
  ];
}

function StepView({ portal, id, n }: { portal: StaffPortal; id: string; n: number }) {
  const c = clientById(id);
  const step = STEPS.find((s) => s.n === n);
  const isStep7 = id === "northwind" && step?.n === 7;
  const done = step?.status === "Completed";
  const [docs, setDocs] = React.useState<StepDoc[]>(() => (isStep7 ? STEP7_DOCS : genericDocs(step?.docs, done)));
  const [notes, setNotes] = React.useState(isStep7 ? STEP7_NOTES : []);
  const [draft, setDraft] = React.useState("");
  const [reminded, setReminded] = React.useState(false);

  if (!c || !step) return <SectionCard title="Step">{<Empty>No step</Empty>}</SectionCard>;
  const owner = step.by ?? (step.owner === "client" ? c.short : step.owner === "mca" ? "MCA" : c.lead);
  const holder = step.owner === "client" ? CLIENT_PEOPLE[0].name : step.owner === "mca" ? "MCA" : owner;
  const setState = (id: string, state: DocState) => setDocs(docs.map((x) => (x.id === id ? { ...x, state, date: TODAY } : x)));

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard
        title={`Step ${step.n} · ${step.title}`}
        icon={{ Icon: List, tone: identityTile[c.tone] }}
        meta={
          <span className="inline-flex items-center gap-1.5">
            <ClientDot tone={c.tone} />
            {c.short}
          </span>
        }
      >
        <KeyValue
          cols={3}
          rows={[
            { k: "Status", v: <Chip tone={stepTone[step.status]}>{step.status}</Chip> },
            { k: "Owner", v: <OwnerChip owner={step.owner} label={step.owner === "client" ? c.short : undefined} /> },
            { k: "Works it", v: owner },
            { k: "Due", v: step.due ? fmt(step.due) : step.done ? `Done ${fmt(step.done)}` : "" },
            { k: "Typical time", v: step.time },
            { k: "Phase", v: `Phase ${step.phase}` },
          ]}
        />
      </SectionCard>

      <Cols>
        <Col>
          <SectionCard
            title="Documents"
            meta={`${docs.filter((x) => x.state === "Accepted").length} of ${docs.length} accepted`}
            flush
            right={
              <Button size="sm" variant="primary" onClick={() => setDocs([...docs, { id: `r${docs.length}`, name: "New document", state: "Asked", date: TODAY }])}>
                Request
              </Button>
            }
          >
            {docs.length === 0 ? (
              <Empty />
            ) : (
              docs.map((x) => (
                <ListRow key={x.id} className="flex-wrap md:flex-nowrap">
                  <FileBadge type={x.file ? fileType(x.file) : "PDF"} className={x.file ? undefined : "opacity-40"} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{x.name}</span>
                    <span className="block truncate text-12.5 text-muted">
                      {x.file && <span className="font-mono">{x.file}</span>}
                      {x.file && <span className="mx-1.5 text-faint">·</span>}
                      {fmt(x.date)}
                      {x.note && <span className="text-bad"> · {x.note}</span>}
                    </span>
                  </span>
                  <Chip tone={docTone[x.state]} fixed>
                    {x.state}
                  </Chip>
                  {x.state === "Submitted" && (
                    <span className="flex flex-none gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setState(x.id, "Sent back")}>
                        Send back
                      </Button>
                      <Button size="sm" variant="soft" onClick={() => setState(x.id, "Accepted")}>
                        Approve
                      </Button>
                    </span>
                  )}
                </ListRow>
              ))
            )}
          </SectionCard>

          <SectionCard title="Step history">
            <Thread steps={isStep7 ? STEP7_THREAD : genericThread(done, step.owner, c.lead)} />
          </SectionCard>

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
                setNotes([{ id: `n${notes.length + 1}`, who: personOf(portal), date: TODAY, text: draft.trim() }, ...notes]);
                setDraft("");
              }}
            >
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a note" aria-label="Note" />
              <Button type="submit">Add</Button>
            </form>
          </SectionCard>
        </Col>
        <Col>
          <SectionCard
            title="Who holds it now"
            right={
              reminded ? (
                <Chip tone="ok">Reminder sent</Chip>
              ) : (
                <Button size="sm" variant="primary" onClick={() => setReminded(true)} disabled={done}>
                  <Send size={14} strokeWidth={1.5} /> Send reminder
                </Button>
              )
            }
          >
            <KeyValue
              cols={1}
              rows={[
                { k: "Holder", v: done ? "Nobody" : holder },
                { k: "Side", v: done ? "" : step.owner === "client" ? c.short : step.owner === "mca" ? "MCA" : "SBC" },
                { k: "Since", v: done ? "" : fmt(d(2026, 10, 1)) },
                { k: "Days", v: done ? "" : String(c.id === "northwind" ? 5 : c.days) },
                { k: "Last reminder", v: reminded ? fmt(TODAY) : done ? "" : fmt(d(2026, 10, 3)) },
              ]}
            />
          </SectionCard>
        </Col>
      </Cols>
    </div>
  );
}

export function StepScreen({ portal }: { portal: StaffPortal }) {
  const params = useParams<{ id: string; n: string }>();
  return <StepView key={`${params.id}-${params.n}`} portal={portal} id={params.id} n={Number(params.n)} />;
}
