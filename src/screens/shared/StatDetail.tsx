"use client";
import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import {
  dueText,
  remindersFor,
  stageLabel,
  statDetail,
  statusWord,
  type ClientInput,
  type HistoryEntry,
  type InputStatus,
  type StatInput,
  type Step,
  type WorkflowStage,
} from "@/data/compliance-tasks";
import { AreaPill, Chip, Tag } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { FileBadge, fileType } from "@/components/ui/FileBadge";
import { Input } from "@/components/ui/Input";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { AssistCard, ReviewCard } from "@/screens/staff/comp-parts";
import { ACTOR, ActivityCard, DetailCols, DetailHeader, KV, ProgressCard, RemindersCard, isId, type DetailRole } from "./detail-parts";

// Statutory detail page, staff and client (docs/COMPLIANCE-MODEL.md 4.2, D-1 to D-4).
// Fed by statDetail() in src/data/compliance-tasks.ts. Every action changes page state only.

export interface StatRule {
  dueRule: string;
  applies?: string;
  penalty: string;
  frequency: string;
  /** Owner must confirm (DR-19). Admin and super admin only. */
  confirm?: string;
}

export interface StatDetailProps {
  role: DetailRole;
  /** "GSTR-1". */
  name: string;
  client: string;
  area: string;
  input: StatInput;
  rule: StatRule;
  /** Staff only: VCFO Assist filing card. */
  assist?: { portalName: string; form: string };
  /** Staff only: the "Before filing" checklist. */
  review?: { items: string[]; initial: number };
}

/** The input statuses as the six chip words. "Sent back" collapses to Overdue with the grey note (R-13). */
const INPUT_WORD: Record<InputStatus, string> = { Asked: "Waiting", Received: "In progress", Accepted: "Done", "Sent back": "Sent back" };

/** Steps 0 Data from client · 1 Prepared · 2 Submitted for review · 3 Approved · 4 Filed or paid · 5 Acknowledged. */
function doneThrough(steps: Step[], last: number, who: string, today: Date): Step[] {
  return steps.map((s, i) =>
    i <= last ? (s.state === "done" ? s : { ...s, state: "done", when: fmt(today), who: i === 0 ? s.who : i === last ? who : s.who }) : i === last + 1 ? { ...s, state: "now" } : s,
  );
}

const fileName = (label: string) => `${label.replace(/\W+/g, "-")}.pdf`;

export function StatDetail({ role, name, client, area, input, rule, assist, review }: StatDetailProps) {
  const base = React.useMemo(() => statDetail(input), [input]);
  const today = input.today;
  const isClient = role === "client";
  const me = ACTOR[role];
  const { show, node } = useUndoToast();

  const [inputs, setInputs] = React.useState<ClientInput[]>(base.clientInputs);
  const [steps, setSteps] = React.useState<Step[]>(base.steps);
  const [stage, setStage] = React.useState<WorkflowStage>(base.stage);
  const [days, setDays] = React.useState(base.activity?.notifyDays ?? 5);
  const [log, setLog] = React.useState<HistoryEntry[]>([]);
  const [asking, setAsking] = React.useState<number | null>(null);
  const [reason, setReason] = React.useState("");

  const done = stage === "completed";
  const word = statusWord(stage, base.due, days, today);
  const reminders = React.useMemo(() => remindersFor(base.activity, base.due, done, today, days), [base, done, today, days]);
  // D-4: the client does not see why SBC sent a file back.
  const history = [...log, ...base.history].map((h) => (isClient ? { ...h, what: h.what.replace(/^Sent back (.+?): .*$/, "Asked for $1 again") } : h));
  const note = (what: string) => setLog((l) => [{ when: fmt(today), who: me, what }, ...l]);

  const setInput = (i: number, patch: Partial<ClientInput>) => {
    const next = inputs.map((c, j) => (j === i ? { ...c, ...patch } : c));
    setInputs(next);
    // Every input accepted: the first step is done.
    if (next.every((c) => c.status === "Accepted") && steps[0].state !== "done") setSteps(doneThrough(steps, 0, me, today));
    return next;
  };

  const upload = (i: number) => {
    setInput(i, { status: "Received", file: fileName(inputs[i].label), date: fmt(today), by: me, note: undefined, planned: undefined });
    note(`Uploaded ${fileName(inputs[i].label)}`);
    if (stage === "not-started") setStage("waiting");
    show("1 file uploaded", { kind: "uploaded", sub: `${inputs[i].label} · SBC reviews it next.` });
  };

  // D-1: the main action by role.
  const pending = inputs.findIndex((c) => c.status === "Asked" || c.status === "Sent back");
  const target = role === "lead" ? 2 : 3;
  const passed = steps[target]?.state === "done";
  const action = isClient ? (
    <Button variant="primary" disabled={pending < 0 || done} onClick={() => upload(pending)}>
      <Upload size={16} strokeWidth={1.6} aria-hidden />
      Upload
    </Button>
  ) : (
    <Button
      variant="primary"
      disabled={passed || done}
      onClick={() => {
        setSteps(doneThrough(steps, target, me, today));
        if (role === "lead") {
          setStage("review");
          note("Submitted for review");
          show("Submitted for review", { kind: "saved", sub: `${input.reviewer} reviews ${name} next.` });
        } else {
          setStage("in-progress");
          note("Approved");
          show("Approved", { kind: "saved", sub: `${input.owner} files ${name} next.` });
        }
      }}
    >
      {role === "lead" ? (passed ? "Submitted" : "Submit for review") : passed ? "Approved" : "Approve"}
    </Button>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      <DetailHeader
        date={base.due}
        done={done}
        today={today}
        title={`${name} · ${base.period}`}
        client={client}
        marks={
          <>
            <AreaPill area={area} />
            <Tag>Statutory</Tag>
          </>
        }
        word={word}
        due={dueText(base.due, today, done)}
        late={word === "Overdue"}
        action={action}
      />
      <DetailCols
        left={
          <>
            <SectionCard title="From the client" meta={`${inputs.filter((c) => c.status === "Accepted").length} of ${inputs.length} accepted`} flush>
              <ul>
                {inputs.map((c, i) => (
                  <li key={c.label} className="border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      {c.file ? <FileBadge type={fileType(c.file)} /> : <span className="h-6 w-11 flex-none rounded-sm border-1.5 border-dashed border-line-2" aria-hidden />}
                      <span className="min-w-0 flex-[1_1_220px]">
                        <b className="block text-14 font-medium">
                          {c.label} <span className="text-12.5 font-normal text-muted">· {c.required ? "Required" : "Optional"}</span>
                        </b>
                        <span className="block truncate text-12.5 text-muted">
                          {c.file ? `${c.file} · ${c.date} · ${c.by}` : c.planned ? `VCFO asks on ${c.planned}` : `Asked on ${c.date}`}
                        </span>
                        {c.status === "Sent back" && <span className="block text-12.5 text-bad">{isClient ? "Please upload again" : c.note}</span>}
                      </span>
                      <span className="ml-auto flex flex-none flex-wrap items-center justify-end gap-2">
                        {isClient && (c.status === "Asked" || c.status === "Sent back") && !c.planned && (
                          <Button size="sm" onClick={() => upload(i)}>
                            <Upload size={14} strokeWidth={1.6} aria-hidden />
                            Upload
                          </Button>
                        )}
                        {!isClient && c.status === "Received" && asking !== i && (
                          <>
                            <Button
                              size="sm"
                              variant="soft"
                              onClick={() => {
                                setInput(i, { status: "Accepted" });
                                note(`Accepted ${c.label}`);
                                show(`Accepted: ${c.label}`, { kind: "saved", sub: `${input.clientShort} is told.` });
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setAsking(i);
                                setReason("");
                              }}
                            >
                              Send back
                            </Button>
                          </>
                        )}
                        <Chip fixed>{INPUT_WORD[c.status]}</Chip>
                      </span>
                    </div>
                    {asking === i && (
                      <form
                        className="mt-2.5 flex flex-wrap items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const why = reason.trim() || "Please upload a clearer copy.";
                          setInput(i, { status: "Sent back", note: why });
                          setAsking(null);
                          note(`Sent back ${c.label}: ${why}`);
                          show(`Sent back: ${c.label}`, { kind: "saved", sub: `${input.clientShort} is asked to upload again.` });
                        }}
                      >
                        <Input
                          aria-label="Reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="What should the client fix?"
                          className="min-w-[200px] flex-1"
                          autoFocus
                        />
                        <Button size="sm" type="submit">
                          Send
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAsking(null)}>
                          Cancel
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Filled by SBC" meta={done ? "Read only" : undefined} flush>
              {base.filledBySbc.map((f) => (
                <KV key={f.label} k={f.label} sub={f.who ? `${f.who} · ${f.when}` : undefined}>
                  <b className={cn("font-medium", f.value === "-" && "font-normal text-faint", isId(f.value) && "font-mono text-13.5")}>{f.value}</b>
                </KV>
              ))}
            </SectionCard>

            <RemindersCard
              rows={reminders}
              days={days}
              canEdit={role === "admin" || role === "manager"}
              client={isClient}
              onDays={(n) => {
                setDays(n);
                note(`Changed the first reminder to ${n} days before`);
                show("Reminder days changed", { kind: "saved", sub: `First reminder ${n} days before the due date.` });
              }}
            />

            <SectionCard title="Rule" flush>
              <KV k="Due rule">{rule.dueRule}</KV>
              {rule.applies && <KV k="Applies to">{rule.applies}</KV>}
              <KV k="Penalty">{rule.penalty || "-"}</KV>
              <KV k="Frequency">{rule.frequency}</KV>
              {role === "admin" && rule.confirm && (
                <p className="m-4 mt-1 rounded-md border-1.5 border-caution-line bg-caution-soft px-3 py-2.5 text-13 leading-relaxed text-caution md:mx-5">
                  <b className="font-medium">To confirm: </b>
                  {rule.confirm}
                </p>
              )}
            </SectionCard>

            <ActivityCard rows={history} />

            {!isClient && assist && !done && (
              <AssistCard portalName={assist.portalName} form={assist.form} onFiled={() => show(`${name} filed by VCFO Assist`, { kind: "filed", sub: "Replay kept in Audit." })} />
            )}
            {!isClient && review && <ReviewCard items={review.items} initial={done ? review.items.length : review.initial} />}
          </>
        }
        right={
          <>
            <ProgressCard
              steps={steps}
              stage={stageLabel(stage)}
              owner={input.owner}
              reviewer={input.reviewer}
              note={isClient ? undefined : stage === "review" ? (base.reviewNote ?? undefined) : undefined}
            />
            <DataGrid
              title="Previous periods"
              rows={base.past}
              rowKey={(p) => `${p.period}-${p.due}`}
              columns={[
                { key: "period", label: "Period", render: (p) => <span className="whitespace-nowrap font-medium text-ink">{p.period}</span> },
                {
                  key: "filed",
                  label: "Filed",
                  render: (p) => (
                    <span className="block whitespace-nowrap leading-tight">
                      {p.filed.replace(/ \d{4}$/, "")}
                      <span className={cn("block text-12", p.late ? "font-medium text-bad" : "text-muted")}>{p.late ? "Late" : "On time"}</span>
                    </span>
                  ),
                },
                { key: "ref", label: "Ref", mono: true, render: (p) => <span className="font-mono text-13">{p.ref}</span> },
              ]}
            />
          </>
        }
      />
      {node}
    </div>
  );
}
