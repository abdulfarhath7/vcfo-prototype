"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Calendar, Check, Clock, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { STAFF_TODAY as TODAY, fmt } from "@/lib/dates";
import { PORTALS } from "@/data/nav";
import { STEPS, PHASES, type StepStatus } from "@/data/incorporation";
import { clientById, CONTACTS } from "@/data/staff-clients";
import { stepState, stepHistory, stepForm, stepDocs, assistText, fieldTone, type FormField, type FieldState } from "@/data/staff-steps";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, Empty } from "@/components/cards/SectionCard";
import { Thread, type ThreadStep } from "@/components/cards/Thread";
import type { StaffPortal } from "./parts";
import { AboutStepPanel } from "./step-parts";

// Ported from reference/old-screens/s/lead/Step.dc.html. Lead, manager, admin and super admin share it (the old pages are the same).
// K-27: the step code is "Step 7", not "Pre-7". R-11: picked tab is navy. R-15, R-16: card heads with a tile.

export type StepPortal = StaffPortal | "super";

const stepHref = (portal: StepPortal, id: string, n: number) => `/${portal}/clients/${id}/step/${n}`;
const packHref = (portal: StepPortal) => `/${portal}/documents`;

const iso = (x?: Date) => (x ? `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}` : "");
const fromIso = (s: string) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};

/** Status glyph of the step: the old 20 px circle next to the step code. */
const STATUS_GLYPH: Record<StepStatus, { cls: string; Icon: typeof Check; label: string }> = {
  Completed: { cls: "bg-ok text-surface", Icon: Check, label: "Done" },
  Waiting: {
    cls: "bg-accent text-surface",
    Icon: ArrowRight,
    label: "Waiting on the client",
  },
  "In progress": {
    cls: "bg-btn text-white",
    Icon: Clock,
    label: "In progress",
  },
  "Sent back": {
    cls: "bg-bad text-surface",
    Icon: ArrowRight,
    label: "Sent back",
  },
  Upcoming: { cls: "bg-faint text-surface", Icon: Clock, label: "Upcoming" },
};

/** Row glyph of a form field: green tick, blue arrow, red "!" for a review with a problem. */
function FieldGlyph({ f }: { f: FormField }) {
  if (f.state === "Not asked") return <span className="h-5 w-5 rounded-sm border-[1.5px] border-dashed border-faint" aria-label="Not asked" />;
  const bad = f.state === "Review" && !!f.note;
  const cls = f.state === "Accepted" ? "bg-ok" : bad ? "bg-bad" : f.state === "Review" ? "bg-warn" : "bg-accent";
  return (
    <span className={cn("grid h-5 w-5 place-items-center rounded-sm text-11 font-bold text-surface", cls)} aria-label={f.state}>
      {f.state === "Accepted" ? <Check size={11} strokeWidth={3} /> : bad ? "!" : <ArrowRight size={11} strokeWidth={3} />}
    </span>
  );
}

/** "rent-agreement-2026.pdf · 2.1 MB": file name in mono (R-28), the rest in the interface font. */
function FileLine({ value }: { value: string }) {
  const [head, ...rest] = value.split(" · ");
  const isFile = /\.[a-z0-9]{2,4}$/i.test(head);
  return (
    <>
      <span className={cn(isFile && "font-mono")}>{head}</span>
      {rest.length > 0 && ` · ${rest.join(" · ")}`}
    </>
  );
}

function DropZone({ onFile }: { onFile: (name: string) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  return (
    <span
      className={cn("mt-1.5 flex h-10 items-center gap-1 rounded-md border border-dashed px-3 text-12", over ? "border-accent bg-accent-soft" : "border-faint bg-raised")}
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
      <button type="button" className="font-semibold text-accent hover:underline" onClick={() => ref.current?.click()}>
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

/** One form row: glyph, name and detail, 120 px chip column, action column (old .fr grid). */
function FieldRow({ f, onChange, onState, onRemind }: { f: FormField; onChange: (v: string) => void; onState: (s: FieldState, note?: string) => void; onRemind: () => void }) {
  const days = f.note?.match(/\d+/)?.[0];
  return (
    <div className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-t border-line px-4 py-[11px] sm:grid-cols-[28px_minmax(0,1fr)_120px_150px] md:px-[18px]">
      <FieldGlyph f={f} />
      <span className="min-w-0">
        <b className="block font-semibold">
          {f.label}
          {f.required && f.state === "Asked" && <span className="text-bad"> *</span>}
        </b>
        {f.state === "Accepted" ? (
          <span className="block text-11.5 text-muted">
            <FileLine value={f.value} />
          </span>
        ) : f.kind === "text" && f.state !== "Not asked" ? (
          <Input value={f.value} onChange={(e) => onChange(e.target.value)} aria-label={f.label} className="mt-1.5 h-8 text-13" />
        ) : f.state === "Review" ? (
          <span className="block text-11.5 text-muted">
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
        <Chip tone={fieldTone[f.state]} fixed>
          {f.state === "Asked" && days ? `Asked · ${days}d` : f.state}
        </Chip>
        <span className="flex items-center gap-1">
          {f.state === "Accepted" && <span className="font-mono text-11.5 text-muted">{f.date ? fmt(f.date) : ""}</span>}
          {f.state === "Asked" && (
            <Button size="sm" variant="outline" className="h-7 text-11.5" onClick={onRemind}>
              Send reminder
            </Button>
          )}
          {f.state === "Review" && (
            <>
              <Button size="sm" variant="outline" className="h-7 px-2 text-11.5" onClick={() => onState("Accepted")}>
                Accept
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2 text-11.5 text-bad" onClick={() => onState("Asked", "Sent back")}>
                Reject
              </Button>
            </>
          )}
        </span>
      </span>
    </div>
  );
}

const groupHead = "bg-raised px-4 py-2 font-mono text-11 tracking-[.06em] text-faint md:px-[18px]";

export function StepView({ portal, id, n }: { portal: StepPortal; id: string; n: number }) {
  const c = clientById(id);
  const step = STEPS.find((s) => s.n === n);
  const base = c && step ? stepState(c, n) : undefined;
  const toast = useUndoToast();
  const me = PORTALS[portal].person;
  const [status, setStatus] = React.useState<StepStatus>(base?.status ?? "Upcoming");
  const [win, setWin] = React.useState({ from: base?.from, to: base?.to });
  const [editWin, setEditWin] = React.useState<{
    from: string;
    to: string;
  } | null>(null);
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
  const glyph = STATUS_GLYPH[status];

  const patch = (fid: string, p: Partial<FormField>) => setFields((fs) => fs.map((x) => (x.id === fid ? { ...x, ...p } : x)));
  const log = (title: string, owner?: ThreadStep["owner"]) =>
    setHistory((h) => {
      const doneRows = h.filter((x) => x.state === "done");
      const rest = h.filter((x) => x.state !== "done");
      return [
        ...doneRows,
        {
          id: `l${Date.now()}`,
          title,
          state: "done",
          date: TODAY,
          by: me,
          owner,
        },
        ...rest,
      ];
    });

  return (
    <div className="grid grid-cols-1 gap-3.5">
      {/* Compact head: step code, status glyph, "What's this?" */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Tag tone="idle" className="font-mono">
          Step {step.n}
        </Tag>
        <span className={cn("grid h-5 w-5 place-items-center rounded-sm", glyph.cls)} title={glyph.label} role="img" aria-label={glyph.label}>
          <glyph.Icon size={11} strokeWidth={3} />
        </span>
        <Button size="sm" variant="outline" className="h-7 border-brand bg-warn-soft text-warn hover:bg-warn-soft hover:brightness-95" onClick={() => setAbout(true)}>
          What&apos;s this?
        </Button>
      </div>

      {/* Window bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
        <Calendar size={15} strokeWidth={1.6} className="text-muted" aria-hidden />
        <span className="text-12 text-muted">Window</span>
        <span className="font-mono text-12 font-semibold">From {win.from ? fmt(win.from) : ""}</span>
        <span className="text-muted" aria-hidden>
          →
        </span>
        <span className="font-mono text-12 font-semibold">To {win.to ? fmt(win.to) : ""}</span>
        {!done && (
          <Button size="sm" variant="outline" className="h-[26px] text-11.5" onClick={() => setEditWin({ from: iso(win.from), to: iso(win.to) })}>
            Edit
          </Button>
        )}
        <span className="hidden h-[18px] w-px bg-line sm:block" aria-hidden />
        <Link href={packHref(portal)} className="text-12 font-bold text-accent hover:underline">
          Open in document pack →
        </Link>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto h-[26px] text-11.5"
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
          <header className="flex min-h-head items-center border-b border-line px-4 py-2 md:px-[18px]">
            <Tabs
              items={[
                { key: "forms", label: "Forms", count: fields.length },
                { key: "activity", label: "Activity", count: history.length },
              ]}
              value={tab}
              onChange={setTab}
            />
          </header>
          {tab === "forms" ? (
            <>
              {fields.length === 0 && <Empty />}
              {filed.length > 0 && <h3 className={groupHead}>FILED · {filed.length}</h3>}
              {filed.map((f) => (
                <FieldRow key={f.id} f={f} onChange={(v) => patch(f.id, { value: v })} onState={(st, note) => patch(f.id, { state: st, note, date: TODAY })} onRemind={() => toast.show(`Reminder sent for ${f.label}`)} />
              ))}
              {toFile.length > 0 && <h3 className={cn(groupHead, "border-t border-line")}>TO FILE · {toFile.length}</h3>}
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
              <footer className="flex flex-wrap items-center gap-2 border-t border-line bg-raised px-4 py-3 md:px-[18px]">
                <span className="inline-flex items-center gap-1.5 text-12 text-muted">
                  <i className="h-[7px] w-[7px] rounded-md bg-ok" aria-hidden />
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
                        setFields(
                          fields.map((f) =>
                            f.state === "Accepted"
                              ? f
                              : {
                                  ...f,
                                  state: "Accepted",
                                  date: TODAY,
                                  note: undefined,
                                },
                          ),
                        );
                        setStatus("Completed");
                        setHistory((h) => [
                          ...h.filter((x) => x.state === "done"),
                          {
                            id: "fin",
                            title: "Step complete",
                            state: "done",
                            date: TODAY,
                            by: me,
                          },
                        ]);
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
            <div className="px-4 py-4 md:px-[18px]">
              <Thread steps={history} />
            </div>
          )}
        </section>

        <div className="grid min-w-0 grid-cols-1 gap-3.5">
          <SectionCard title={step.phase === 2 ? "SPICe+ Part B" : phase.name} meta={`${states.filter((x) => x === "Completed").length} of ${phaseSteps.length}`} bodyClassName="px-4 py-3">
            <div className="relative">
              <span className="absolute bottom-3.5 left-[11px] top-3.5 w-0.5 bg-line" aria-hidden />
              {phaseSteps.map((s, i) => {
                const st = states[i];
                const cur = s.n === n;
                const who = s.owner === "client" ? "Client" : s.owner === "mca" ? "MCA" : "Project lead";
                return (
                  <Link
                    key={s.n}
                    href={stepHref(portal, c.id, s.n)}
                    aria-current={cur ? "step" : undefined}
                    className={cn("relative grid grid-cols-[24px_minmax(0,1fr)_16px] items-center gap-2.5 py-1.5 text-12.5 hover:underline", cur && "-mx-1.5 rounded-md bg-warn-soft px-1.5")}
                  >
                    <span
                      className={cn(
                        "relative z-[1] grid h-[22px] w-[22px] place-items-center rounded-sm text-[10px] font-extrabold",
                        st === "Completed" ? "bg-ok text-surface" : cur ? "bg-btn text-white ring-[3px] ring-warn-mid" : "border-[1.5px] border-dashed border-faint bg-surface text-faint",
                      )}
                    >
                      {st === "Completed" ? <Check size={11} strokeWidth={3} /> : s.n}
                    </span>
                    <span className={cn("min-w-0 truncate", cur && "font-bold")}>{s.title}</span>
                    <User size={14} strokeWidth={1.6} className={s.owner === "client" ? "text-faint" : "text-ink"} role="img" aria-label={who} />
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title={step.phase === 3 ? "Post-incorporation documents" : "Pre-incorporation documents"} bodyClassName="px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              <Tag tone="ok">{docs.ready} ready</Tag>
              <Tag tone="warn">{docs.need} need inputs</Tag>
              <Tag tone="idle">{docs.waiting} waiting</Tag>
            </div>
            <Link href={packHref(portal)} className="mt-2.5 inline-block text-12 font-bold text-accent hover:underline">
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
                  setWin({
                    from: editWin.from ? fromIso(editWin.from) : win.from,
                    to: editWin.to ? fromIso(editWin.to) : win.to,
                  });
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
