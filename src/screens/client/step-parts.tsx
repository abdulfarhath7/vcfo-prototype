"use client";
import * as React from "react";
import Link from "next/link";
import { Check, Download, Eye, MessageSquare, PenLine, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt, fmtYear } from "@/lib/dates";
import { STEPS, stepHref, type Step } from "@/data/incorporation";
import { STEP_PREFILL, type NeedItem } from "@/data/incorporation-detail";
import { DOC_STATUS_TONE, type ItemDoc } from "@/data/registrations";
import { FILES } from "@/data/shared";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
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

export function AnswersCard({ step, about, rows, notify, onChange, onMessage }: { step: Step; about: string; rows: AnswerRow[]; notify: Notify; onChange: () => void; onMessage: () => void }) {
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
          <b className={cn("block text-13.5 font-semibold", st.bad && "text-bad")}>{st.title}</b>
          <span className="block text-12.5 text-muted">{st.sub}</span>
        </span>
      </div>
      {about && <p className="border-b border-line-soft px-4 py-3 text-13.5 text-ink-2 md:px-5">{about}</p>}
      {STEP_PREFILL[step.n] && (k === "done" || k === "you") && (
        <div className="flex items-center gap-2 border-b border-line-soft bg-raised px-4 py-2 text-12.5 text-muted md:px-5">
          <RefreshCw size={14} strokeWidth={1.5} className="flex-none" />
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
                  <Input value={v} onChange={(e) => setVals((x) => ({ ...x, [r.k]: e.target.value }))} aria-label={r.k} className="h-[30px]" />
                ) : r.fileId ? (
                  <Link href={`/client/documents/view/${r.fileId}`} className="font-mono text-13 text-accent hover:underline">
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
      {k !== "you" && (
      <footer className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
        {k === "done" && (
          <Button onClick={onChange} className="ml-auto">
            <MessageSquare size={16} strokeWidth={1.5} /> Request a change
          </Button>
        )}
        {k === "with" && (
          <Button onClick={onMessage} className="ml-auto">
            <MessageSquare size={16} strokeWidth={1.5} /> Message {step.by ?? "Bharath"}
          </Button>
        )}
        {k === "prog" && (
          <Button onClick={() => notify("Draft saved", () => setVals({}))} className="ml-auto">
            <PenLine size={16} strokeWidth={1.5} /> Save draft
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

export function StepDocsCard({ docs, canUpload, uploaded, onUpload, notify }: { docs: ItemDoc[]; canUpload: boolean; uploaded: Record<string, string>; onUpload: (id: string, file: string | null) => void; notify: Notify }) {
  if (docs.length === 0) return null;
  const isAsk = (x: ItemDoc) => (x.status === "Asked" || x.status === "Sent back") && !uploaded[x.id];
  const ok = docs.filter((x) => !isAsk(x) && (x.status === "Accepted" || uploaded[x.id])).length;
  return (
    <SectionCard title="Documents" flush right={<Chip tone={ok === docs.length ? "ok" : "warn"}>{`${ok} of ${docs.length}`}</Chip>}>
      {docs.map((x) => {
        if (isAsk(x) && canUpload && x.from === "client")
          return (
            <div key={x.id} className="border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
              <DropZone
                label={x.name}
                hint={x.note}
                chip={<Chip tone={x.status === "Sent back" ? "bad" : "warn"} className="hidden sm:inline-flex">{x.status === "Sent back" ? "Sent back" : "Asked"}</Chip>}
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
              <span className="block truncate font-semibold">{x.name}</span>
              <span className="block truncate text-12.5 text-muted">
                {up ? <span className="font-mono">{up}</span> : (x.fromLabel ?? (x.from === "client" ? "Northwind" : "SBC"))}
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
            <Chip tone={up ? "prog" : DOC_STATUS_TONE[x.status]} className="hidden sm:inline-flex">
              {status}
            </Chip>
            {file ? (
              <Button asChild size="iconSm" variant="ghost" aria-label={`Preview ${x.name}`}>
                <Link href={`/client/documents/view/${file.id}`}>
                  <Eye size={16} strokeWidth={1.5} />
                </Link>
              </Button>
            ) : (
              <span className="w-[30px] flex-none" />
            )}
            {x.status === "Accepted" || x.status === "To review" || up ? (
              <Button size="iconSm" variant="ghost" aria-label={`Download ${x.name}`} onClick={() => notify(`Download started · ${file?.name ?? x.name}`)}>
                <Download size={16} strokeWidth={1.5} />
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

/* ---------- Needed from Northwind: checklist, progress, Request a change and Approve ---------- */

export function StepNeedsCard({
  step,
  items,
  blocked,
  notify,
  onChange,
}: {
  step: Step;
  items: NeedItem[];
  /** Approve needs a file first: the name of the missing file. */
  blocked?: string;
  notify: Notify;
  onChange: () => void;
}) {
  const [on, setOn] = React.useState<Record<string, boolean>>(() => Object.fromEntries(items.map((i) => [i.id, i.done])));
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
          <label key={i.id} className="flex cursor-pointer items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13.5 first:border-t-0 hover:bg-raised md:px-5">
            <Checkbox checked={!!on[i.id]} onChange={(v) => setOn((x) => ({ ...x, [i.id]: v }))} label={i.label} />
            <span className={cn("min-w-0 flex-1", on[i.id] && "text-muted line-through")}>{i.label}</span>
            <span className={cn("flex-none text-12.5", i.due < TODAY && !on[i.id] ? "font-semibold text-bad" : "text-muted")}>{fmt(i.due)}</span>
          </label>
        ))
      )}
      <div className="grid gap-3 border-t border-line-soft px-4 py-3 md:px-5">
        <div className="flex items-center gap-3 text-12.5 text-muted">
          <span className="flex-none font-semibold text-ink">{waiting ? "Awaiting Northwind's approval" : "Answers to submit"}</span>
          <Bar pct={Math.max(pct, 6)} tone={left ? "warn" : "ok"} className="flex-1" />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onChange}>
            <MessageSquare size={16} strokeWidth={1.5} /> Request a change
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
              notify(waiting ? "Approved and submitted · Bharath files it next" : "Submitted for review · Bharath checks it", () => setSent(false));
            }}
          >
            <Check size={16} strokeWidth={1.5} /> {sent ? "Submitted" : waiting ? "Approve" : "Submit for review"}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
