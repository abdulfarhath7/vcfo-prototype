"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { STAFF_TODAY as TODAY, fmt } from "@/lib/dates";
import { PORTALS } from "@/data/nav";
import { STEPS, PHASES, stepTone, type StepStatus } from "@/data/incorporation";
import { clientById, CONTACTS } from "@/data/staff-clients";
import { stepState, stepHistory, stepForm, stepDocs, assistText, fieldTone, type FormField, type FieldState } from "@/data/staff-steps";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { StepMark, type StepState, type StepTone } from "@/components/ui/StepMark";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, Empty } from "@/components/cards/SectionCard";
import { Thread, type ThreadStep } from "@/components/cards/Thread";
import type { StaffPortal } from "./parts";
import { AboutStepPanel } from "./step-parts";

// Ported from reference/old-screens/s/lead/Step.dc.html. Lead, manager, admin and super admin share it (the old pages are the same).
// K-27: the step code is "Step 7", not "Pre-7". R-11: Forms and Activity are views of one step, so underline tabs (N4).
// R-22: ST5 marks on the form rows and the phase rail. R-15, R-16: card heads with a tile.

export type StepPortal = StaffPortal | "super";

const stepHref = (portal: StepPortal, id: string, n: number) => `/${portal}/clients/${id}/step/${n}`;
const packHref = (portal: StepPortal) => `/${portal}/documents`;

const iso = (x?: Date) => (x ? `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}` : "");
const fromIso = (s: string) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};

/** ST5 marks (R-22): done green tick, live a ring in the status colour, upcoming a dashed square. */
const MARK: Record<StepStatus, { state: StepState; tone: StepTone }> = {
  Completed: { state: "done", tone: "prog" },
  Waiting: { state: "now", tone: "teal" },
  "In progress": { state: "now", tone: "prog" },
  "Sent back": { state: "now", tone: "bad" },
  Upcoming: { state: "next", tone: "prog" },
};

/** Row mark of a form field: accepted done, asked waiting (teal), review amber or red with a problem, not asked dashed. */
function FieldGlyph({ f }: { f: FormField }) {
  if (f.state === "Not asked") return <StepMark state="next" size={20} label="Not asked" />;
  if (f.state === "Accepted") return <StepMark state="done" size={20} label="Accepted" />;
  const bad = f.state === "Review" && !!f.note;
  return <StepMark state="now" size={20} tone={bad ? "bad" : f.state === "Review" ? "warn" : "teal"} label={f.state} />;
}

/** "rent-agreement-2026.pdf · 2.1 MB". R-28: a file name is not an identifier, so it stays in the interface font. */
function FileLine({ value }: { value: string }) {
  return <>{value}</>;
}

function DropZone({ onFile }: { onFile: (name: string) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  return (
    <span
      className={cn("mt-1.5 flex h-10 items-center gap-1 rounded-md border-1.5 border-dashed px-3 text-13 text-muted", over ? "border-accent-mid bg-accent-soft" : "border-line-2")}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file.name);
      }}
    >
      Drop a file or
      <button type="button" className="font-medium text-accent hover:underline" onClick={() => ref.current?.click()}>
        browse
      </button>
      <input
        ref={ref}
        type="file"
        className="hidden"
        aria-label="Upload a file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file.name);
        }}
      />
    </span>
  );
}

/** One form row: ST5 mark, name and detail, 104 px chip column, action column (old .fr grid). */
function FieldRow({ f, onChange, onState, onRemind }: { f: FormField; onChange: (v: string) => void; onState: (s: FieldState, note?: string) => void; onRemind: () => void }) {
  const days = f.note?.match(/\d+/)?.[0];
  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-t border-line-soft px-4 py-3 sm:grid-cols-[24px_minmax(0,1fr)_104px_150px] md:px-5">
      <FieldGlyph f={f} />
      <span className="min-w-0">
        <b className="block text-14 font-medium">
          {f.label}
          {f.required && f.state === "Asked" && <span className="text-bad"> *</span>}
        </b>
        {f.state === "Accepted" ? (
          <span className="block text-12.5 text-muted">
            <FileLine value={f.value} />
          </span>
        ) : f.kind === "text" && f.state !== "Not asked" ? (
          <Input value={f.value} onChange={(e) => onChange(e.target.value)} aria-label={f.label} className="mt-1.5" />
        ) : f.state === "Review" ? (
          <span className="block text-12.5 text-muted">
            <FileLine value={f.value} />
            {f.date && ` · client submitted ${fmt(f.date)}`}
            {f.note && ` · ${f.note}`}
          </span>
        ) : f.state === "Asked" ? (
          <DropZone
            onFile={(name) => {
              onChange(name);
              onState("Review");
            }}
          />
        ) : null}
      </span>
      <span className="col-start-2 flex flex-wrap items-center gap-2 sm:contents">
        <Chip tone={f.state === "Asked" ? "teal" : fieldTone[f.state]} fixed>
          {f.state === "Asked" && days ? `Asked · ${days}d` : f.state}
        </Chip>
        <span className="flex items-center gap-1">
          {f.state === "Accepted" && <span className="text-13 text-muted">{f.date ? fmt(f.date) : ""}</span>}
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
              <Button size="sm" variant="outline" className="text-bad" onClick={() => onState("Asked", "Sent back")}>
                Reject
              </Button>
            </>
          )}
        </span>
      </span>
    </div>
  );
}

const groupHead = "bg-raised px-4 py-2 text-11.5 font-medium uppercase tracking-[.07em] text-muted md:px-5";

export function StepView({ portal, id, n }: { portal: StepPortal; id: string; n: number }) {
  const c = clientById(id);
  const step = STEPS.find((s) => s.n === n);
  const base = c && step ? stepState(c, n) : undefined;
  const toast = useUndoToast();
  const me = PORTALS[portal].person;
  const [status, setStatus] = React.useState<StepStatus>(base?.status ?? "Upcoming");
  const [win, setWin] = React.useState({ from: base?.from, to: base?.to });
  const [editWin, setEditWin] = React.useState<{ from: string; to: string } | null>(null);
  const [fields, setFields] = React.useState<FormField[]>(() => (c && step ? stepForm(c, n) : []));
  const [history, setHistory] = React.useState<ThreadStep[]>(() => (c && step ? stepHistory(c, n) : []));
  const [tab, setTab] = React.useState("forms");
  const [about, setAbout] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (!c || !step) return <SectionCard title="Step">{<Empty>No step</Empty>}</SectionCard>;
  const done = status === "Completed";
  const holder = step.owner === "client" ? (CONTACTS[c.id]?.name ?? c.short) : step.owner === "mca" ? "MCA" : (step.by ?? c.lead);
  const filed = fields.filter((f) => f.state === "Accepted");
  const toFile = fields.filter((f) => f.state !== "Accepted");
  const phaseSteps = STEPS.filter((s) => s.phase === step.phase);
  const phase = PHASES[step.phase - 1];
  const states = phaseSteps.map((s) => (s.n === n ? status : stepState(c, s.n).status));
  const docs = stepDocs(c, n);
  const mark = MARK[status];

  const patch = (fid: string, p: Partial<FormField>) => setFields((fs) => fs.map((x) => (x.id === fid ? { ...x, ...p } : x)));
  const log = (title: string, owner?: ThreadStep["owner"]) =>
    setHistory((h) => {
      const doneRows = h.filter((x) => x.state === "done");
      const rest = h.filter((x) => x.state !== "done");
      return [...doneRows, { id: `l${Date.now()}`, title, state: "done", date: TODAY, by: me, owner }, ...rest];
    });

  return (
    <div className="grid grid-cols-1 gap-3.5">
      {/* R-02 plain head: step code, 28 px title, client and phase, the status chip, "What's this?" on the right. */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StepMark state={mark.state} tone={mark.tone} label={status} />
        <div className="min-w-0 flex-[1_1_280px]">
          <h1 className="text-28 font-medium leading-9 tracking-[-0.01em]">{step.title}</h1>
          <p className="flex flex-wrap items-center gap-x-2 text-13.5 text-muted">
            <span className="font-mono text-13">Step {step.n}</span>
            <span aria-hidden>·</span>
            <span>{c.name}</span>
            <span aria-hidden>·</span>
            <span>{phase.short}</span>
          </p>
        </div>
        <Chip tone={stepTone[status]} fixed>
          {status}
        </Chip>
        <Button variant="outline" onClick={() => setAbout(true)}>
          What&apos;s this?
        </Button>
      </header>

      {/* Window bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-md border-1.5 border-line bg-surface px-4 py-2.5">
        <Calendar size={15} strokeWidth={1.6} className="text-muted" aria-hidden />
        <span className="text-13 text-muted">Window</span>
        <span className="text-14 font-medium">From {win.from ? fmt(win.from) : ""}</span>
        <span className="text-muted" aria-hidden>
          →
        </span>
        <span className="text-14 font-medium">To {win.to ? fmt(win.to) : ""}</span>
        {!done && (
          <Button size="sm" variant="ghost" onClick={() => setEditWin({ from: iso(win.from), to: iso(win.to) })}>
            Edit
          </Button>
        )}
        <Link href={packHref(portal)} className="text-13 font-medium text-accent hover:underline">
          Open in document pack →
        </Link>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => {
            try {
              navigator.clipboard?.writeText(assistText(c, n)).catch(() => undefined);
            } catch {}
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy for Assist"}
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 overflow-hidden rounded-md border-1.5 border-line bg-surface" aria-label={tab === "forms" ? "Forms" : "Activity"}>
          <Tabs
            variant="underline"
            className="px-4 pt-1.5 md:px-5"
            items={[
              { key: "forms", label: "Forms", count: fields.length },
              { key: "activity", label: "Activity", count: history.length },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === "forms" ? (
            <>
              {fields.length === 0 && <Empty />}
              {filed.length > 0 && <h3 className={groupHead}>Filed · {filed.length}</h3>}
              {filed.map((f) => (
                <FieldRow key={f.id} f={f} onChange={(v) => patch(f.id, { value: v })} onState={(st, note) => patch(f.id, { state: st, note, date: TODAY })} onRemind={() => toast.show(`Reminder sent for ${f.label}`)} />
              ))}
              {toFile.length > 0 && <h3 className={cn(groupHead, "border-t border-line-soft")}>To file · {toFile.length}</h3>}
              {toFile.map((f) => (
                <FieldRow
                  key={f.id}
                  f={f}
                  onChange={(v) => patch(f.id, { value: v })}
                  onState={(st, note) => {
                    patch(f.id, { state: st, note, date: TODAY });
                    if (st === "Accepted") log(`${f.label} accepted`, "sbc");
                    if (st === "Review") log(`${f.label} uploaded by SBC`, "sbc");
                    if (note === "Sent back") log(`${f.label} sent back`, "sbc");
                  }}
                  onRemind={() => {
                    log(`Reminder sent for ${f.label}`, "sbc");
                    toast.show(`Reminder sent to ${holder} for ${f.label}`);
                  }}
                />
              ))}
              <footer className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
                <span className="inline-flex items-center gap-1.5 text-13 text-muted">
                  <i className="h-[7px] w-[7px] rounded-[2px] bg-ok-mid" aria-hidden />
                  Draft saved
                </span>
                <span className="flex-1" />
                {!done && (
                  <>
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
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        const before = { fields, history };
                        setFields(fields.map((f) => (f.state === "Accepted" ? f : { ...f, state: "Accepted", date: TODAY, note: undefined })));
                        setStatus("Completed");
                        setHistory((h) => [...h.filter((x) => x.state === "done"), { id: "fin", title: "Step complete", state: "done", date: TODAY, by: me }]);
                        toast.show(`Step ${n} marked complete`, () => {
                          setFields(before.fields);
                          setHistory(before.history);
                          setStatus(base?.status ?? "Upcoming");
                        });
                      }}
                    >
                      Mark all complete
                    </Button>
                  </>
                )}
              </footer>
            </>
          ) : (
            <div className="px-4 py-4 md:px-5">
              <Thread steps={history} />
            </div>
          )}
        </section>

        <div className="grid min-w-0 grid-cols-1 gap-3.5">
          <SectionCard title={step.phase === 2 ? "SPICe+ Part B" : phase.name} meta={`${states.filter((x) => x === "Completed").length} of ${phaseSteps.length}`} bodyClassName="px-4 py-3 md:px-4">
            <ol className="flex flex-col">
              {phaseSteps.map((s, i) => {
                const st = states[i];
                const cur = s.n === n;
                const m = MARK[st];
                const who = s.owner === "client" ? "Client" : s.owner === "mca" ? "MCA" : "Project lead";
                return (
                  <li key={s.n} className={cn("relative -mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5", cur && "bg-hover")}>
                    {i < phaseSteps.length - 1 && <span className={cn("absolute bottom-[-6px] left-[18px] top-[26px] w-[1.5px]", st === "Completed" ? "bg-ok-mid" : "bg-line")} aria-hidden />}
                    <StepMark state={m.state} tone={m.tone} size={20} className="relative z-[1]" label={st} />
                    <span className="w-[50px] flex-none font-mono text-12 text-muted">Step {s.n}</span>
                    <Link href={stepHref(portal, c.id, s.n)} aria-current={cur ? "step" : undefined} className={cn("min-w-0 flex-1 truncate text-13.5 after:absolute after:inset-0 hover:underline", cur ? "font-medium text-ink" : "text-ink-2")}>
                      {s.title}
                    </Link>
                    <User size={14} strokeWidth={1.6} className={s.owner === "client" ? "text-faint" : "text-ink-2"} role="img" aria-label={who} />
                  </li>
                );
              })}
            </ol>
          </SectionCard>

          <SectionCard title={step.phase === 3 ? "Post-incorporation documents" : "Pre-incorporation documents"} bodyClassName="px-4 py-3 md:px-4">
            <div className="flex flex-wrap gap-1.5">
              <Tag tone="ok">{docs.ready} ready</Tag>
              <Tag tone="warn">{docs.need} need inputs</Tag>
              <Tag tone="idle">{docs.waiting} waiting</Tag>
            </div>
            <Link href={packHref(portal)} className="mt-3 inline-block text-13 font-medium text-accent hover:underline">
              Open document pack →
            </Link>
          </SectionCard>
        </div>
      </div>

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
                  toast.show("Window saved", { kind: "saved", sub: "The client sees the new date." });
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
