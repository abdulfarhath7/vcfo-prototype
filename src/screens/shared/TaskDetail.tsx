"use client";
import * as React from "react";
import { Lock, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { activity } from "@/data/activity-master";
import { dueText, remindersFor, stageLabel, taskSteps, taskWord, type NsTask, type WorkflowStage } from "@/data/compliance-tasks";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { FileBadge, fileType } from "@/components/ui/FileBadge";
import { Checkbox, Input } from "@/components/ui/Input";
import { StepMark } from "@/components/ui/StepMark";
import { UrgencyPill, VisibilityTag } from "@/components/ui/TaskMarks";
import { useUndoToast } from "@/components/ui/UndoToast";
import { Empty, SectionCard } from "@/components/cards/SectionCard";
import { ACTOR, ActivityCard, DetailCols, DetailHeader, ProgressCard, RemindersCard, type DetailRole } from "./detail-parts";

// Non-statutory detail page (docs/COMPLIANCE-MODEL.md 4.3): the 4.2 layout with Start, End, Urgency and Visibility in the head;
// Checklist, Attachments, Comments, Reminders and Activity on the left; progress, owner and reviewer on the right.
// The client sees shared tasks only (K-1), cannot tick the checklist, and does not see internal comments or escalations.

type Comment = NsTask["comments"][number];

export function TaskDetail({ role, task, today }: { role: DetailRole; task: NsTask; today: Date }) {
  const isClient = role === "client";
  const me = ACTOR[role];
  const a = activity(task.activityId);
  const { show, node } = useUndoToast();

  const [stage, setStage] = React.useState<WorkflowStage>(task.stage);
  const [checklist, setChecklist] = React.useState(task.checklist);
  const [files, setFiles] = React.useState(task.attachments);
  const [comments, setComments] = React.useState<Comment[]>(task.comments);
  const [draft, setDraft] = React.useState("");
  const [internal, setInternal] = React.useState(false);
  const [days, setDays] = React.useState(task.notifyDays);
  const [log, setLog] = React.useState(task.history);

  const t = { ...task, stage, checklist, attachments: files };
  const done = stage === "completed";
  const word = taskWord(t, today);
  const steps = taskSteps(t, today);
  const reminders = remindersFor(a, task.end, done, today, days);
  const note = (what: string) => setLog((l) => [{ when: fmt(today), who: me, what }, ...l]);
  const shownComments = isClient ? comments.filter((c) => !c.internal) : comments;

  const uploadFile = () => {
    const name = `${task.name.split(" · ")[0].replace(/\W+/g, "-")}-${files.length + 1}.pdf`;
    setFiles([...files, { name, by: me, when: fmt(today) }]);
    note(`Uploaded ${name}`);
    if (stage === "waiting") setStage("in-progress");
    show("1 file uploaded", { kind: "uploaded", sub: `${name} · SBC reviews it next.` });
  };

  const action = isClient ? (
    <Button variant="primary" disabled={done} onClick={uploadFile}>
      <Upload size={16} strokeWidth={1.6} aria-hidden />
      Upload
    </Button>
  ) : role === "lead" ? (
    <Button
      variant="primary"
      disabled={done || stage === "review"}
      onClick={() => {
        setStage("review");
        note("Submitted for review");
        show("Submitted for review", { kind: "saved", sub: `${task.reviewer} reviews it next.` });
      }}
    >
      {stage === "review" ? "Submitted" : "Submit for review"}
    </Button>
  ) : (
    <Button
      variant="primary"
      disabled={done}
      onClick={() => {
        setStage("completed");
        setChecklist(checklist.map((c) => (c.done ? c : { ...c, done: true, by: me, when: fmt(today) })));
        note("Approved and closed");
        show("Approved", { kind: "saved", sub: `${task.name} is closed.` });
      }}
    >
      {done ? "Approved" : "Approve"}
    </Button>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      <DetailHeader
        date={task.end}
        done={done}
        today={today}
        title={task.name}
        client={task.client}
        marks={
          <>
            <UrgencyPill urgency={task.urgency} />
            <VisibilityTag visibility={task.visibility} />
            <Tag>Non-statutory</Tag>
          </>
        }
        word={word}
        due={
          <>
            Start {fmt(task.start)} · End {fmt(task.end)}
            {!done && ` · ${dueText(task.end, today, false)}`}
          </>
        }
        late={word === "Overdue"}
        action={action}
      />
      <DetailCols
        left={
          <>
            <SectionCard title="Checklist" meta={`${checklist.filter((c) => c.done).length} of ${checklist.length}`} flush>
              <ul>
                {checklist.map((c, i) => (
                  <li key={c.label} className="border-t border-line-soft first:border-t-0">
                    {isClient ? (
                      <div className="flex items-center gap-3 px-4 py-2.5 md:px-5">
                        <StepMark state={c.done ? "done" : "next"} size={18} label={c.done ? "Done" : "Not done"} />
                        <span className="min-w-0 flex-1 text-14">{c.label}</span>
                        {c.done && <span className="flex-none text-12.5 text-muted">{c.when}</span>}
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 md:px-5">
                        <Checkbox
                          checked={c.done}
                          label={c.label}
                          onChange={(on) => {
                            setChecklist(checklist.map((x, j) => (j === i ? (on ? { ...x, done: true, by: me, when: fmt(today) } : { label: x.label, done: false }) : x)));
                            note(`${on ? "Ticked" : "Unticked"} "${c.label}"`);
                            if (on && (stage === "not-started" || stage === "ready")) setStage("in-progress");
                          }}
                        />
                        <span className={cn("min-w-0 flex-1 text-14", c.done && "text-muted line-through")}>{c.label}</span>
                        {c.done && (
                          <span className="flex-none text-12.5 text-muted">
                            {c.by} · {c.when}
                          </span>
                        )}
                      </label>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              title="Attachments"
              flush
              right={
                !isClient && (
                  <Button size="sm" onClick={uploadFile}>
                    <Upload size={14} strokeWidth={1.6} aria-hidden />
                    Upload
                  </Button>
                )
              }
            >
              {files.length === 0 ? (
                <Empty />
              ) : (
                <ul>
                  {files.map((f) => (
                    <li key={f.name} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 first:border-t-0 md:px-5">
                      <FileBadge type={fileType(f.name)} />
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-14 font-medium">{f.name}</b>
                        <span className="block truncate text-12.5 text-muted">
                          {f.by} · {f.when}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Comments" flush>
              {shownComments.length > 0 && (
                <ul>
                  {shownComments.map((c, i) => (
                    <li key={i} className="flex items-start gap-3 border-b border-line-soft px-4 py-3 md:px-5">
                      <Avatar name={c.by} size={24} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 text-13">
                          <b className="font-medium">{c.by}</b>
                          <span className="text-muted">{c.when}</span>
                          {c.internal && (
                            <span className="inline-flex items-center gap-1 text-12 text-muted">
                              <Lock size={12} strokeWidth={1.6} aria-hidden />
                              Internal
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-14 text-ink-2">{c.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  setComments([...comments, { by: me, when: fmt(today), text: draft.trim(), internal: !isClient && internal }]);
                  note(!isClient && internal ? "Added an internal comment" : "Added a comment");
                  setDraft("");
                  show("Comment added", { kind: "saved", sub: !isClient && internal ? "Only the firm sees it." : isClient ? "SBC is told." : "The client sees it." });
                }}
              >
                <Input aria-label="Comment" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a comment" className="min-w-[200px] flex-1" />
                {!isClient && (
                  <label className="inline-flex cursor-pointer items-center gap-2 text-13 text-ink-2">
                    <Checkbox checked={internal} onChange={setInternal} label="Internal" />
                    Internal
                  </label>
                )}
                <Button size="sm" type="submit" disabled={!draft.trim()}>
                  Comment
                </Button>
              </form>
            </SectionCard>

            <RemindersCard
              rows={reminders}
              days={days}
              canEdit={role === "admin" || role === "manager"}
              client={isClient}
              onDays={(n) => {
                setDays(n);
                note(`Changed the first reminder to ${n} days before`);
                show("Reminder days changed", { kind: "saved", sub: `First reminder ${n} days before the end date.` });
              }}
            />

            <ActivityCard rows={isClient ? log.filter((h) => !/internal/i.test(h.what)) : log} />
          </>
        }
        right={<ProgressCard steps={steps} stage={stageLabel(stage)} owner={task.owner} reviewer={task.reviewer} />}
      />
      {node}
    </div>
  );
}
