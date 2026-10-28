"use client";
import * as React from "react";
import Link from "next/link";
import { Check, Download, Eye, ListChecks, MessageSquare, PenLine, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt, fmtYear } from "@/lib/dates";
import { STEPS, stepHref, type Step } from "@/data/incorporation";
import { STEP_PREFILL, type NeedItem } from "@/data/incorporation-detail";
import { DOC_STATUS_TONE, type ItemDoc } from "@/data/registrations";
import { FILES } from "@/data/shared";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StepMark } from "@/components/ui/StepMark";
import { Bar } from "@/components/ui/Bar";
import { FileBadge } from "@/components/ui/FileBadge";
import { Checkbox, Input } from "@/components/ui/Input";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { StatusCircle } from "@/components/cards/GanttTimeline";
import { DropZone, type Notify } from "./inc-parts";
import { STEP_SECTION, type AnswerRow } from "./step-detail";

type Kind = "done" | "you" | "prog" | "with" | "up";

/** Old KD(): done, waiting on Northwind, Northwind filling in, with SBC or MCA, not started. */
export function stepKind(s: Step): Kind {
  if (s.status === "Completed") return "done";
  if (s.status === "Upcoming") return "up";
  if (s.owner !== "client") return "with";
  return s.status === "Waiting" ? "you" : "prog";
}

/** Status line at the top of the answers card (old liveStatus). */
function statusLine(s: Step): { circle: "done" | "current" | "planned"; title: string; sub: string; bad?: boolean } {
  const k = stepKind(s);
  const prev = STEPS[s.n - 2];
  if (k === "done") return { circle: "done", title: s.owner === "client" ? "Approved" : "Completed", sub: `${s.owner === "client" ? "Accepted after submission on" : "Delivered by SBC on"} ${s.done ? fmtYear(s.done) : "-"}` };
  if (k === "you") return { circle: "current", title: `Waiting on Northwind · due ${s.due ? fmt(s.due) : "-"}`, sub: "Check the answers, then approve and submit", bad: !!s.due && s.due < TODAY };
  if (k === "prog") return { circle: "current", title: `In progress · due ${s.due ? fmt(s.due) : "-"}`, sub: `Fill the remaining answers and submit by ${s.due ? fmt(s.due) : "-"}`, bad: !!s.due && s.due < TODAY };
  if (k === "with") return { circle: "current", title: `With ${s.owner === "mca" ? "MCA" : "SBC"}${s.due ? ` · due ${fmt(s.due)}` : ""}`, sub: s.owner === "mca" ? "MCA reviews the filing" : `${s.by ?? "Bharath"} is working on it` };
  return { circle: "planned", title: "Not started", sub: prev ? `Opens after step ${prev.n} · ${prev.title}` : "Opens later" };
}

/* ---------- Answers: status, explainer, pre-fill note, label and value rows ---------- */

export function AnswersCard({ step, about, rows, notify, onChange, onMessage, approval }: { step: Step; about: string; rows: AnswerRow[]; notify: Notify; onChange: () => void; onMessage: () => void; approval?: React.ReactNode }) {
  const k = stepKind(step);
  const st = statusLine(step);
  const editable = k === "prog";
  const [vals, setVals] = React.useState<Record<string, string>>({});
  const prev = STEPS[step.n - 2];
  return (
    <SectionCard title={k === "done" || k === "you" ? "Answers" : "What this step captures"} meta={STEP_SECTION[step.n]} flush>
      <div className="flex items-start gap-3 border-b border-line-soft px-4 py-3 md:px-5">
        <StatusCircle status={st.circle} className="mt-0.5" />
        <span className="min-w-0 flex-1">
          <b className={cn("block text-14 font-medium", st.bad && "text-bad")}>{st.title}</b>
          <span className="block text-12.5 text-muted">{st.sub}</span>
        </span>
      </div>
      {about && <p className="border-b border-line-soft px-4 py-3 text-13.5 text-ink-2 md:px-5">{about}</p>}
      {STEP_PREFILL[step.n] && (k === "done" || k === "you") && (
        <div className="flex items-center gap-2 border-b border-line-soft bg-raised px-4 py-2 text-12.5 text-muted md:px-5">
          <RefreshCw size={14} strokeWidth={1.6} className="flex-none" />
          {STEP_PREFILL[step.n]}
        </div>
      )}
      <dl>
        {rows.map((r) => {
          const v = vals[r.k] ?? (r.v === "-" ? "" : r.v);
          return (
            <div key={r.k} className="grid gap-1 border-t border-line-soft px-4 py-2.5 first:border-t-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4 md:px-5">
              <dt className="min-w-0 text-13 text-muted">
                {r.k}
                {r.hint && <small className="block text-12 text-faint">{r.hint}</small>}
              </dt>
              <dd className="min-w-0 text-13.5 font-medium">
                {editable && !r.fileId ? (
                  <Input value={v} onChange={(e) => setVals((x) => ({ ...x, [r.k]: e.target.value }))} aria-label={r.k} />
                ) : r.fileId ? (
                  <Link href={`/client/documents/view/${r.fileId}`} className="text-accent hover:underline">
                    {r.v}
                  </Link>
                ) : r.v.startsWith("Provided") ? (
                  <span className="inline-flex items-center gap-1.5 text-ok">
                    <Check size={14} strokeWidth={2} /> {r.v}
                  </span>
                ) : (
                  <span className={cn(r.v === "-" && "text-faint")}>{r.v}</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      {k === "you" && approval}
      {k !== "you" && (
      <footer className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
        {k === "done" && (
          <Button onClick={onChange} className="ml-auto">
            <MessageSquare size={16} strokeWidth={1.6} /> Request a change
          </Button>
        )}
        {k === "with" && (
          <Button onClick={onMessage} className="ml-auto">
            <MessageSquare size={16} strokeWidth={1.6} /> Message {step.by ?? "Bharath"}
          </Button>
        )}
        {k === "prog" && (
          <Button onClick={() => notify("Draft saved", () => setVals({}))} className="ml-auto">
            <PenLine size={16} strokeWidth={1.6} /> Save draft
          </Button>
        )}
        {k === "up" && prev && (
          <Button asChild className="ml-auto">
            <Link href={stepHref("client", prev.n)}>Go to step {prev.n}</Link>
          </Button>
        )}
      </footer>
      )}
    </SectionCard>
  );
}

/* ---------- Documents: requested files get a drop zone; the rest preview and download ---------- */

const fileFor = (name: string) => FILES.find((f) => f.name.replace(/\.[a-z]+$/i, "").toLowerCase() === name.toLowerCase());

export function StepDocsCard({ docs, canUpload, uploaded, onUpload, notify, due, by = "Bharath" }: { docs: ItemDoc[]; canUpload: boolean; uploaded: Record<string, string>; onUpload: (id: string, file: string | null) => void; notify: Notify; due?: Date; by?: string }) {
  if (docs.length === 0) return null;
  const isAsk = (x: ItemDoc) => (x.status === "Asked" || x.status === "Sent back") && !uploaded[x.id];
  const ok = docs.filter((x) => !isAsk(x) && (x.status === "Accepted" || uploaded[x.id])).length;
  return (
    <SectionCard title="Documents" flush right={<Chip tone={ok === docs.length ? "ok" : "warn"}>{`${ok} of ${docs.length}`}</Chip>}>
      {docs.map((x) => {
        if (isAsk(x) && canUpload && x.from === "client")
          return (
            <div key={x.id} className="grid gap-2 border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
              <div className="flex min-w-0 items-center gap-2 text-12.5 text-muted">
                <StepMark state="now" tone="warn" size={18} />
                <span className="truncate">
                  {x.note ?? x.name} · requested by {by}
                </span>
              </div>
              <DropZone
                label={x.name}
                chip={
                  <Chip tone={x.status === "Sent back" || (due && due < TODAY) ? "bad" : "warn"} className="hidden sm:inline-flex">
                    {x.status === "Sent back" ? "Sent back" : due ? `Due ${fmt(due)}` : "Asked"}
                  </Chip>
                }
                onFile={(f) => {
                  onUpload(x.id, f);
                  notify(`${x.name} uploaded · Bharath checks it`, () => onUpload(x.id, null));
                }}
              />
            </div>
          );
        const file = fileFor(x.name);
        const up = uploaded[x.id];
        const status = up ? "Uploaded" : x.status;
        return (
          <ListRow key={x.id}>
            <FileBadge type={x.type} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{x.name}</span>
              <span className="block truncate text-12.5 text-muted">
                {up ? <span>{up}</span> : (x.fromLabel ?? (x.from === "client" ? "Northwind" : "SBC"))}
                {(up || x.date) && (
                  <>
                    <span className="mx-1.5 text-faint">·</span>
                    {up ? "just now" : fmt(x.date!)}
                  </>
                )}
                {x.note && !up && (
                  <>
                    <span className="mx-1.5 text-faint">·</span>
                    <span className={cn(x.status === "Sent back" && "text-bad")}>{x.note}</span>
                  </>
                )}
              </span>
            </span>
            <Chip tone={up ? "prog" : DOC_STATUS_TONE[x.status]} fixed className="hidden sm:inline-flex">
              {status}
            </Chip>
            {file ? (
              <Button asChild size="iconSm" variant="ghost" aria-label={`Preview ${x.name}`}>
                <Link href={`/client/documents/view/${file.id}`}>
                  <Eye size={16} strokeWidth={1.6} />
                </Link>
              </Button>
            ) : (
              <span className="w-[30px] flex-none" />
            )}
            {x.status === "Accepted" || x.status === "To review" || up ? (
              <Button size="iconSm" variant="ghost" aria-label={`Download ${x.name}`} onClick={() => notify(`Download started · ${file?.name ?? x.name}`)}>
                <Download size={16} strokeWidth={1.6} />
              </Button>
            ) : (
              <span className="w-[30px] flex-none" />
            )}
          </ListRow>
        );
      })}
    </SectionCard>
  );
}

/* ---------- Needed from Northwind: the checklist. Approve sits in the approval bar (old actBar). ---------- */

export function StepNeedsCard({
  step,
  items,
  on,
  setOn,
  blocked,
  notify,
  onChange,
}: {
  step: Step;
  items: NeedItem[];
  on: Record<string, boolean>;
  setOn: (id: string, v: boolean) => void;
  /** Submit needs a file first: the name of the missing file. */
  blocked?: string;
  notify: Notify;
  onChange: () => void;
}) {
  const [sent, setSent] = React.useState(false);
  const left = items.filter((i) => !on[i.id]).length;
  const pct = Math.round(((items.length - left) / items.length) * 100);
  const waiting = stepKind(step) === "you";
  return (
    <SectionCard title="Needed from Northwind" flush right={<Chip tone={left ? "warn" : "ok"}>{left ? `${left} left` : "All done"}</Chip>}>
      {items.length === 0 ? (
        <Empty />
      ) : (
        items.map((i) => (
          <label key={i.id} className="flex cursor-pointer items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13.5 first:border-t-0 hover:bg-hover md:px-5">
            <Checkbox checked={!!on[i.id]} onChange={(v) => setOn(i.id, v)} label={i.label} />
            <span className={cn("min-w-0 flex-1", on[i.id] && "text-muted line-through")}>{i.label}</span>
            <span className={cn("flex-none text-12.5", i.due < TODAY && !on[i.id] ? "font-medium text-bad" : "text-muted")}>{fmt(i.due)}</span>
          </label>
        ))
      )}
      {!waiting && (
        <div className="grid gap-3 border-t border-line-soft px-4 py-3 md:px-5">
          <div className="flex items-center gap-3 text-12.5 text-muted">
            <span className="flex-none font-medium text-ink">Answers to submit</span>
            <Bar pct={Math.max(pct, 6)} tone={left ? "warn" : "ok"} className="flex-1" />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={onChange}>
              <MessageSquare size={16} strokeWidth={1.6} /> Request a change
            </Button>
            <Button
              variant="primary"
              disabled={sent}
              onClick={() => {
                if (blocked) {
                  notify(`Upload the ${blocked} first`);
                  return;
                }
                setSent(true);
                notify("Submitted for review · Bharath checks it", () => setSent(false));
              }}
            >
              <Check size={16} strokeWidth={1.6} /> {sent ? "Submitted" : "Submit for review"}
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/** Approval row at the foot of the Answers card of a step that waits on Northwind (old actBar). Not sticky: nothing floats (R-02). */
export function ApprovalBar({ pct, blocked, notify, onChange }: { pct: number; blocked?: string; notify: Notify; onChange: () => void }) {
  const [sent, setSent] = React.useState(false);
  return (
    <div className="flex flex-col gap-3 border-t border-line-soft px-4 py-3 sm:flex-row sm:items-center md:px-5" role="region" aria-label="Approval">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <StepMark state={sent ? "done" : "now"} tone="teal" label={sent ? "Approved" : "Waiting"} />
        <span className="min-w-0">
          <b className="block truncate text-14 font-medium">{sent ? "Approved by Northwind" : "Awaiting Northwind’s approval"}</b>
          <span className="mt-1 block h-1.5 w-[200px] max-w-full overflow-hidden rounded-bar bg-raised" aria-hidden>
            <i className={cn("block h-full rounded-bar", sent ? "bg-ok-mid" : "bg-accent-mid")} style={{ width: `${sent ? 100 : Math.max(pct, 6)}%` }} />
          </span>
        </span>
      </div>
      <div className="flex flex-none gap-2">
        <Button onClick={onChange} className="max-sm:flex-1">
          <MessageSquare size={16} strokeWidth={1.6} /> Request a change
        </Button>
        <Button
          variant="primary"
          disabled={sent}
          className="max-sm:flex-1"
          onClick={() => {
            if (blocked) {
              notify(`Upload the ${blocked} first`);
              return;
            }
            setSent(true);
            notify("Approved and submitted · Bharath files it next", () => setSent(false));
          }}
        >
          <Check size={16} strokeWidth={1.6} /> {sent ? "Approved" : "Approve"}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Side list of the phase (old naRail): status, name, owner ---------- */

const PHASE_LABEL = ["SPICe+ Part A", "SPICe+ Part B", "Post-incorporation"] as const;
const ownerTone = { client: "text-warn", sbc: "text-accent", mca: "text-violet" } as const;
const ownerName = { client: "Northwind", sbc: "SBC", mca: "MCA" } as const;

/** ST5 mark of a step in the rail (R-22): done tick, live ring in the status colour, upcoming dashed. */
function RailMark({ step }: { step: Step }) {
  const k = stepKind(step);
  if (k === "done") return <StepMark state="done" label="Done" />;
  if (k === "up") return <StepMark state="next" label="Not started" />;
  const late = !!step.due && step.due < TODAY;
  return <StepMark state="now" tone={late ? "bad" : k === "you" ? "teal" : "prog"} label={k === "you" ? "Waiting on Northwind" : k === "with" ? `With ${ownerName[step.owner]}` : "In progress"} />;
}

export function PhaseStepsRail({ step }: { step: Step }) {
  const list = STEPS.filter((x) => x.phase === step.phase);
  return (
    <SectionCard title={PHASE_LABEL[step.phase - 1]} icon={{ Icon: ListChecks, tone: "blue" }} meta={`${list.filter((x) => x.status === "Completed").length} / ${list.length}`} bodyClassName="px-4 py-3 md:px-5">
      <ol className="flex flex-col">
        {list.map((x, i) => {
          const cur = x.n === step.n;
          return (
            <li key={x.n} className="relative">
              {i < list.length - 1 && <span className={cn("absolute bottom-[-6px] left-[20.25px] top-[30px] w-[1.5px]", stepKind(x) === "done" ? "bg-ok-mid" : "bg-line")} aria-hidden />}
              <Link
                href={stepHref("client", x.n)}
                aria-current={cur ? "page" : undefined}
                className={cn("relative -mx-2.5 flex min-h-[40px] items-center gap-3 rounded-md px-2.5 py-1.5 hover:bg-hover", cur && "bg-hover")}
              >
                <RailMark step={x} />
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="flex-none font-mono text-12 text-muted">Step {x.n}</span>
                  <span className={cn("truncate text-14", cur && "font-medium")}>{x.title}</span>
                </span>
                <span className={cn("hidden flex-none text-12 font-medium sm:inline", ownerTone[x.owner])}>{ownerName[x.owner]}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
