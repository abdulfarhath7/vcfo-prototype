"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Copy, List, Send, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, d, fmt } from "@/lib/dates";
import { STEPS, PHASES, stepTone, type StepStatus } from "@/data/incorporation";
import { clientById } from "@/data/staff-clients";
import { CONTACTS } from "@/data/staff-clients";
import { stepState, stepHistory, stepForm, assistText, fieldTone, type FormField, type FieldState } from "@/data/staff-steps";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty, HeadLink } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { Thread, type ThreadStep } from "@/components/cards/Thread";
import { identityTile, ClientDot, personOf, stepHrefFor, clientHref, type StaffPortal } from "./parts";
import { AboutStepPanel } from "./step-parts";

// Ported from reference/old-screens/s/lead/Step.dc.html (lead, manager and admin share it). Dates move back 10 days.

const STEP7_NOTES = [
  { id: "n1", who: "Bharath", date: d(2026, 10, 4), text: "Ask for a fresh bill if it is older than 15 Aug." },
  { id: "n2", who: "Pranay", date: d(2026, 10, 2), text: "Bill must show the same address as the agreement." },
];

const dot: Record<FieldState, string> = { Accepted: "bg-ok-mid", Review: "bg-accent", Asked: "bg-warn-mid", "Not asked": "bg-line" };
const iso = (x?: Date) => (x ? `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}` : "");
const fromIso = (s: string) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};

function FieldRow({ f, onChange, onState, onRemind }: { f: FormField; onChange: (v: string) => void; onState: (s: FieldState, note?: string) => void; onRemind: () => void }) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  return (
    <ListRow className="flex-wrap items-start md:flex-nowrap">
      <i className={cn("mt-1.5 h-2.5 w-2.5 flex-none rounded-full", dot[f.state])} aria-hidden />
      <span className="grid min-w-0 flex-1 gap-1">
        <b className="font-semibold">
          {f.label}
          {f.required && f.state !== "Accepted" && <span className="text-bad"> *</span>}
        </b>
        {f.kind === "text" ? (
          <Input value={f.value} onChange={(e) => onChange(e.target.value)} aria-label={f.label} className="h-8 text-13" disabled={f.state === "Accepted"} />
        ) : f.value ? (
          <span className="truncate text-12.5 text-muted">
            <span className="font-mono">{f.value}</span>
            {f.note && <span className="text-bad"> · {f.note}</span>}
          </span>
        ) : (
          <span className="text-12.5 text-muted">
            Drop a file or{" "}
            <button type="button" className="font-semibold text-accent hover:underline" onClick={() => fileRef.current?.click()}>
              browse
            </button>
            {f.note && <span> · {f.note}</span>}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange(file.name);
                  onState("Review");
                }
              }}
            />
          </span>
        )}
      </span>
      <span className="flex flex-none flex-wrap items-center gap-1.5">
        <Chip tone={fieldTone[f.state]} fixed>
          {f.state === "Asked" ? `Asked${f.note?.match(/\d+/) ? ` · ${f.note.match(/\d+/)![0]}d` : ""}` : f.state}
        </Chip>
        <span className="w-[52px] text-right font-mono text-12 text-muted">{f.date ? fmt(f.date) : ""}</span>
        {f.state === "Asked" && (
          <Button size="sm" variant="outline" onClick={onRemind}>
            Send reminder
          </Button>
        )}
        {f.state === "Review" && (
          <>
            <Button size="sm" variant="soft" onClick={() => onState("Accepted")}>
              Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onState("Asked", "Sent back")}>
              Reject
            </Button>
          </>
        )}
        {f.state === "Accepted" && f.kind === "file" && (
          <Upload size={14} strokeWidth={1.5} className="text-faint" aria-hidden />
        )}
      </span>
    </ListRow>
  );
}

function StepView({ portal, id, n }: { portal: StaffPortal; id: string; n: number }) {
  const c = clientById(id);
  const step = STEPS.find((s) => s.n === n);
  const base = c && step ? stepState(c, n) : undefined;
  const toast = useUndoToast();
  const [status, setStatus] = React.useState<StepStatus>(base?.status ?? "Upcoming");
  const [win, setWin] = React.useState({ from: base?.from, to: base?.to });
  const [editWin, setEditWin] = React.useState<{ from: string; to: string } | null>(null);
  const [fields, setFields] = React.useState<FormField[]>(() => (c && step ? stepForm(c, n) : []));
  const [dirty, setDirty] = React.useState(false);
  const [history, setHistory] = React.useState<ThreadStep[]>(() => (c && step ? stepHistory(c, n) : []));
  const [notes, setNotes] = React.useState(id === "northwind" && n === 7 ? STEP7_NOTES : []);
  const [draft, setDraft] = React.useState("");
  const [reminded, setReminded] = React.useState(false);
  const [tab, setTab] = React.useState("forms");
  const [about, setAbout] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (!c || !step) return <SectionCard title="Step">{<Empty>No step</Empty>}</SectionCard>;
  const done = status === "Completed";
  const owner = step.by ?? (step.owner === "client" ? c.short : step.owner === "mca" ? "MCA" : c.lead);
  const holder = step.owner === "client" ? CONTACTS[c.id]?.name ?? c.short : step.owner === "mca" ? "MCA" : owner;
  const filed = fields.filter((f) => f.state === "Accepted");
  const toFile = fields.filter((f) => f.state !== "Accepted");
  const phaseSteps = STEPS.filter((s) => s.phase === step.phase);
  const phase = PHASES[step.phase - 1];
  const states = phaseSteps.map((s) => stepState(c, s.n).status);
  const docsReady = states.filter((x) => x === "Completed").length;
  const docsWaiting = states.filter((x) => x === "Waiting" || x === "Sent back").length;
  const docsNeed = states.length - docsReady - docsWaiting;

  const patch = (fid: string, p: Partial<FormField>) => {
    setFields((fs) => fs.map((x) => (x.id === fid ? { ...x, ...p } : x)));
    setDirty(true);
  };
  const log = (title: string, owner?: ThreadStep["owner"]) =>
    setHistory((h) => {
      const doneRows = h.filter((x) => x.state === "done");
      const rest = h.filter((x) => x.state !== "done");
      return [...doneRows, { id: `l${Date.now()}`, title, state: "done", date: TODAY, by: personOf(portal), owner }, ...rest];
    });

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard
        title={`Step ${step.n} · ${step.title}`}
        icon={{ Icon: List, tone: identityTile[c.tone] }}
        meta={
          <Link href={clientHref(portal, c.id)} className="inline-flex items-center gap-1.5 hover:underline">
            <ClientDot tone={c.tone} />
            {c.short}
          </Link>
        }
        right={
          <Button size="sm" variant="outline" onClick={() => setAbout(true)}>
            About this step
          </Button>
        }
      >
        <KeyValue
          cols={3}
          rows={[
            { k: "Status", v: <Chip tone={stepTone[status]}>{status}</Chip> },
            { k: "Owner", v: <OwnerChip owner={step.owner} label={step.owner === "client" ? c.short : undefined} /> },
            { k: "Works it", v: owner },
            {
              k: "Window",
              v: (
                <span className="inline-flex items-center gap-2">
                  <span className="font-mono text-12.5">
                    {win.from ? fmt(win.from) : ""} to {win.to ? fmt(win.to) : ""}
                  </span>
                  {!done && (
                    <Button size="sm" variant="link" onClick={() => setEditWin({ from: iso(win.from), to: iso(win.to) })}>
                      Edit
                    </Button>
                  )}
                </span>
              ),
            },
            { k: "Typical time", v: step.time },
            { k: "Phase", v: `Phase ${step.phase} · ${phase.short}` },
          ]}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line-soft pt-3">
          <HeadLink href={`/${portal}/documents`}>Open in document pack ›</HeadLink>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => {
              try {
                void navigator.clipboard?.writeText(assistText(c, n));
              } catch {}
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />} {copied ? "Copied" : "Copy for Assist"}
          </Button>
        </div>
      </SectionCard>

      <Cols>
        <Col>
          <SectionCard
            title={tab === "forms" ? "Forms" : "Activity"}
            meta={tab === "forms" ? `${filed.length} of ${fields.length} filed` : `${history.filter((h) => h.state !== "upcoming").length} events`}
            flush
            right={
              <Tabs
                items={[
                  { key: "forms", label: "Forms", count: fields.length },
                  { key: "activity", label: "Activity", count: history.filter((h) => h.state !== "upcoming").length },
                ]}
                value={tab}
                onChange={setTab}
              />
            }
          >
            {tab === "forms" ? (
              <>
                {fields.length === 0 && <Empty />}
                {filed.length > 0 && <h3 className="bg-raised px-4 py-1.5 font-mono text-11.5 text-muted md:px-5">FILED · {filed.length}</h3>}
                {filed.map((f) => (
                  <FieldRow key={f.id} f={f} onChange={(v) => patch(f.id, { value: v })} onState={(st, note) => patch(f.id, { state: st, note, date: TODAY })} onRemind={() => toast.show(`Reminder sent for ${f.label}`)} />
                ))}
                {toFile.length > 0 && <h3 className="border-t border-line-soft bg-raised px-4 py-1.5 font-mono text-11.5 text-muted md:px-5">TO FILE · {toFile.length}</h3>}
                {toFile.map((f) => (
                  <FieldRow
                    key={f.id}
                    f={f}
                    onChange={(v) => patch(f.id, { value: v })}
                    onState={(st, note) => {
                      patch(f.id, { state: st, note, date: TODAY });
                      if (st === "Accepted") log(`${f.label} accepted`, "sbc");
                      if (note === "Sent back") log(`${f.label} sent back`, "sbc");
                    }}
                    onRemind={() => {
                      patch(f.id, { note: "Reminder sent today" });
                      toast.show(`Reminder sent to ${holder} for ${f.label}`);
                    }}
                  />
                ))}
                <footer className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
                  <span className="mr-auto inline-flex items-center gap-1.5 text-12.5 text-muted">
                    <i className={cn("h-1.5 w-1.5 rounded-full", dirty ? "bg-warn-mid" : "bg-ok-mid")} aria-hidden />
                    {dirty ? "Unsaved changes" : "Draft saved"}
                  </span>
                  <Button size="sm" variant="outline" disabled={!dirty} onClick={() => setDirty(false)}>
                    Save
                  </Button>
                  {!done && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        log("Form sent to the client to fill", "client");
                        toast.show(`${CONTACTS[c.id]?.name ?? c.short} can fill the form now`);
                      }}
                    >
                      Request client to fill
                    </Button>
                  )}
                  {!done && portal === "lead" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        log(`Approval asked from ${c.manager}`, "sbc");
                        toast.show(`Approval asked from ${c.manager}`);
                      }}
                    >
                      Request manager approval
                    </Button>
                  )}
                  {!done && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setFields(fields.map((f) => (f.state === "Accepted" ? f : { ...f, state: "Accepted", date: TODAY, note: undefined })));
                        setStatus("Completed");
                        setDirty(false);
                        setHistory((h) => [...h.filter((x) => x.state === "done"), { id: "fin", title: "Step complete", state: "done", date: TODAY, by: personOf(portal) }]);
                        toast.show(`Step ${n} marked complete`);
                      }}
                    >
                      Mark all complete
                    </Button>
                  )}
                </footer>
              </>
            ) : (
              <div className="px-4 py-4 md:px-5">
                <Thread steps={history} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="Notes" meta={notes.length ? String(notes.length) : undefined} flush>
            {notes.map((x) => (
              <ListRow key={x.id} className="items-start">
                <span className="w-[64px] flex-none font-mono text-12 text-muted">{fmt(x.date)}</span>
                <span className="min-w-0 flex-1">{x.text}</span>
                <span className="flex-none text-12.5 text-muted">{x.who}</span>
              </ListRow>
            ))}
            <form
              className="flex items-center gap-2 border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5"
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
                <Button size="sm" variant="primary" onClick={() => setReminded(true)} disabled={done || status === "Upcoming"}>
                  <Send size={14} strokeWidth={1.5} /> Send reminder
                </Button>
              )
            }
          >
            <KeyValue
              cols={1}
              rows={[
                { k: "Holder", v: done ? "Nobody" : status === "Upcoming" ? "Not open yet" : holder },
                { k: "Side", v: done || status === "Upcoming" ? "" : step.owner === "client" ? c.short : step.owner === "mca" ? "MCA" : "SBC" },
                { k: "Since", v: done || status === "Upcoming" ? "" : win.from ? fmt(win.from) : "" },
                { k: "Days", v: done || status === "Upcoming" ? "" : String(c.days) },
                { k: "Last reminder", v: reminded ? fmt(TODAY) : done || status === "Upcoming" ? "" : fmt(d(2026, 10, 3)) },
              ]}
            />
          </SectionCard>

          <SectionCard title={phase.name} meta={`${states.filter((x) => x === "Completed").length} of ${phaseSteps.length}`} flush>
            {phaseSteps.map((s, i) => {
              const st = states[i];
              const cur = s.n === n;
              return (
                <ListRow key={s.n} href={stepHrefFor(portal, c.id, s.n)} className={cn("py-2", cur && "bg-warn-soft hover:bg-warn-soft")}>
                  <span
                    className={cn(
                      "grid h-5 w-5 flex-none place-items-center rounded-full text-11 font-bold",
                      st === "Completed" ? "bg-ok-mid text-white" : st === "Upcoming" ? "text-faint shadow-[inset_0_0_0_1.5px_var(--line)]" : "bg-btn text-white",
                    )}
                  >
                    {st === "Completed" ? <Check size={11} strokeWidth={2.4} /> : s.n}
                  </span>
                  <span className={cn("min-w-0 flex-1 truncate", cur && "font-semibold")}>{s.title}</span>
                  <span className="flex-none text-12 text-muted">{s.owner === "client" ? "Client" : s.owner === "mca" ? "MCA" : "Project lead"}</span>
                </ListRow>
              );
            })}
          </SectionCard>

          <SectionCard title={`${phase.short} documents`} flush right={<HeadLink href={`/${portal}/documents`}>Open document pack ›</HeadLink>}>
            <div className="flex flex-wrap gap-2 px-4 py-3 md:px-5">
              <Chip tone="ok">{docsReady} ready</Chip>
              <Chip tone="warn">{docsNeed} need inputs</Chip>
              <Chip tone="prog">{docsWaiting} waiting</Chip>
            </div>
          </SectionCard>
        </Col>
      </Cols>

      <AboutStepPanel open={about} onOpenChange={setAbout} n={n} />
      <Modal
        open={!!editWin}
        onOpenChange={(v) => !v && setEditWin(null)}
        size="sm"
        title="Edit the window"
        sub={`Step ${n} · ${c.short}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditWin(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (editWin) {
                  setWin({ from: editWin.from ? fromIso(editWin.from) : win.from, to: editWin.to ? fromIso(editWin.to) : win.to });
                  log(`Window moved to ${editWin.to ? fmt(fromIso(editWin.to)) : ""}`, "sbc");
                  toast.show("Window saved. The client sees the new date.");
                }
                setEditWin(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {editWin && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From">
              <Input type="date" value={editWin.from} onChange={(e) => setEditWin({ ...editWin, from: e.target.value })} />
            </Field>
            <Field label="To">
              <Input type="date" value={editWin.to} onChange={(e) => setEditWin({ ...editWin, to: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
      {toast.node}
    </div>
  );
}

export function StepScreen({ portal }: { portal: StaffPortal }) {
  const params = useParams<{ id: string; n: string }>();
  return <StepView key={`${params.id}-${params.n}`} portal={portal} id={params.id} n={Number(params.n)} />;
}
