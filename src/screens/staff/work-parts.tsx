"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock, Pause, Play, Repeat, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { STAFF_TODAY as TODAY, d, fmt, fmtYear } from "@/lib/dates";
import { clientById } from "@/data/staff-clients";
import type { StaffTask } from "@/data/staff-tasks";
import { BOARD_COLS, CAL_ALLDAY, type TimelineRow, DAY_SHORT, ESTIMATE, MGR_DELEGATED, NEXT_WEEK, PLAN_BLOCKS, RECURRING, SPAN, SPAN_DAYS, WEEK, boardColOf, extraFor, isToday, sameDay, type CalBlock, type Todo } from "@/data/staff-work";
import { HourWeek, spanOf, useBlockMoves, type Slot } from "./HourWeek";
import { Button } from "@/components/ui/Button";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { initials } from "@/components/ui/Avatar";
import { LEADS } from "@/data/staff-team";
import { Chip, Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { barFill, type BarTone } from "@/components/ui/Bar";
import { Select } from "@/components/ui/Select";
import { Input, Field, Checkbox } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SidePanel, PanelSection } from "@/components/ui/SidePanel";
import { FileBadge, fileType } from "@/components/ui/FileBadge";
import { KeyValue } from "@/components/cards/KeyValue";
import { SectionCard, Empty } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { ClientDot, TaskChip, taskHref, type StaffPortal } from "./parts";

// Work page parts. Ported from reference/old-screens/s/lead/Work.dc.html (planner: to-dos, timeline, calendar, status),
// WorkPlan.dc.html (plan my week), WorkBoard.dc.html (board and list), WorkDrawer.dc.html (task drawer, request change)
// and WorkPhone.dc.html. Same files under s/mgr and s/admin.

export type Notify = (text: string, onUndo?: () => void) => void;
/** The old clock: Fri 16 Oct 2026 · 12:31 PM. */
const NOW_HOUR = 12.5;
const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const hoursOf = (t: StaffTask) => ESTIMATE[t.area];
const isFiling = (t: StaffTask) => !t.code;
const dayLabel = (x: Date) => (isToday(x) ? `Today ${x.getDate()}` : `${DAY_SHORT[x.getDay()]} ${x.getDate()}`);

/** "1:05:09" */
export function clock(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export interface Timer {
  start: number | null;
  ms: number;
}
export const elapsed = (t: Timer | undefined, now: number) => (t ? t.ms + (t.start ? now - t.start : 0) : 0);

/** Start or stop a work session on a task; elapsed time shows next to it. */
export function SessionButton({ timer, now, onToggle, label }: { timer?: Timer; now: number; onToggle: () => void; label: string }) {
  const running = !!timer?.start;
  const ms = elapsed(timer, now);
  return (
    <span className="inline-flex flex-none items-center gap-1.5">
      {ms > 0 && <span className={cn("font-mono text-12", running ? "font-semibold text-accent" : "text-muted")}>{clock(ms)}</span>}
      <Button size="iconSm" variant={running ? "outline" : "ghost"} onClick={onToggle} aria-label={running ? `Stop session on ${label}` : `Start session on ${label}`} title={running ? "Stop session" : "Start session"}>
        {running ? <Pause size={14} strokeWidth={1.6} /> : <Play size={14} strokeWidth={1.6} />}
      </Button>
    </span>
  );
}

/** Timeline: 14 days. Manager-set dates are locked: click the bar to ask for a change. Filings show a diamond on the due day. */
export function WorkTimeline({ tasks, onOpen, onLocked }: { tasks: StaffTask[]; onOpen: (t: StaffTask) => void; onLocked: (t: StaffTask) => void }) {
  const rows = tasks.filter((t) => t.status !== "Done" && t.due >= SPAN[0] && t.due <= SPAN[13]).slice(0, 12);
  const idx = (x: Date) => Math.max(0, Math.min(13, Math.round((x.getTime() - SPAN[0].getTime()) / 86400000)));
  const todayCol = idx(TODAY);
  const grid = { gridTemplateColumns: "minmax(140px,190px) repeat(14, minmax(30px, 1fr))" };
  return (
    <SectionCard
      title="Timeline"
      meta={`${fmt(SPAN[0])} to ${fmt(SPAN[13])}`}
      flush
      right={
        <span className="hidden flex-wrap items-center gap-3 text-12 text-muted xl:flex">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-3 rounded-[2px] bg-accent" aria-hidden />
            Manager date
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-3 rounded-[2px] border border-dashed border-accent bg-accent-soft" aria-hidden />
            Mine
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-3 rounded-[2px] bg-line" aria-hidden />
            Waiting on client
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rotate-45 rounded-[1px] bg-bad-mid" aria-hidden />
            Filing due
          </span>
        </span>
      }
    >
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid border-b border-line-soft py-2 text-11.5 font-semibold text-muted" style={grid}>
            <span className="px-4 md:px-5">Task</span>
            {SPAN.map((x, i) => (
              <span key={i} className={cn("text-center", i === todayCol && "font-bold text-brand", (x.getDay() === 0 || x.getDay() === 6) && i !== todayCol && "text-faint")}>
                {DAY_SHORT[x.getDay()][0]} {x.getDate()}
              </span>
            ))}
          </div>
          {rows.length === 0 && <Empty />}
          {rows.map((t) => {
            const end = idx(t.due);
            const start = isFiling(t) ? end : Math.max(0, end - (SPAN_DAYS[t.id] ?? 3) + 1);
            const locked = !!t.setBy;
            const late = t.status === "Overdue";
            const kind = isFiling(t) ? "filing" : t.status === "With client" ? "wait" : locked ? "locked" : "mine";
            const c = clientById(t.client);
            const bar = cn(
              "relative z-[1] flex h-5 min-w-0 items-center gap-1 self-center overflow-hidden whitespace-nowrap rounded-[6px] px-1.5 text-11 font-semibold",
              kind === "locked" && (late ? "cursor-pointer bg-bad-mid text-white" : "cursor-pointer bg-accent text-white"),
              kind === "mine" && "border border-dashed border-accent bg-accent-soft text-accent",
              kind === "wait" && "bg-line text-ink-2",
            );
            return (
              <div key={t.id} className="relative grid border-b border-line-soft py-2 last:border-b-0" style={grid}>
                <button type="button" onClick={() => onOpen(t)} className="flex min-w-0 items-center gap-2 px-4 text-left md:px-5" style={{ gridColumn: 1, gridRow: 1 }}>
                  {c && <ClientDot tone={c.tone} />}
                  <span className="min-w-0">
                    <b className="block truncate text-12.5 font-semibold hover:underline">{t.title}</b>
                    <span className="block truncate text-11.5 text-muted">
                      {c?.short}
                      {t.code ? ` · ${t.code}` : " · Filing"}
                    </span>
                  </span>
                </button>
                <span aria-hidden className="pointer-events-none -my-2 flex justify-center" style={{ gridColumn: `${todayCol + 2} / span 1`, gridRow: 1 }}>
                  <i className="block h-full w-0.5 bg-brand" />
                </span>
                {kind === "filing" ? (
                  <span className="grid place-items-center self-center" style={{ gridColumn: `${end + 2} / span 1`, gridRow: 1 }} title={`${t.title} · due ${fmt(t.due)}`}>
                    <i className={cn("h-3 w-3 rotate-45 rounded-[2px]", late ? "bg-bad-mid" : "bg-btn")} aria-hidden />
                  </span>
                ) : (
                  <button
                    type="button"
                    className={bar}
                    style={{ gridColumn: `${start + 2} / ${end + 3}`, gridRow: 1 }}
                    title={`${t.title} · ${fmt(SPAN[start])} to ${fmt(t.due)} · ${locked ? `dates set by ${t.setBy}` : "your dates"}`}
                    onClick={() => (locked ? onLocked(t) : onOpen(t))}
                  >
                    {locked && <Lock size={11} strokeWidth={1.6} className="flex-none" />}
                    <span className="truncate">{kind === "wait" ? "Waiting on client" : kind === "mine" ? "Mine" : `${fmt(SPAN[start])} to ${fmt(t.due)}`}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

/** Old planner timeline (Work.dc.html T): fixed rows with bars by kind, filing diamonds and the today line. */
export function PlanTimeline({ rows, tasks, onOpen, onLocked }: { rows: TimelineRow[]; tasks: StaffTask[]; onOpen: (t: StaffTask) => void; onLocked: (t: StaffTask) => void }) {
  const todayCol = SPAN.findIndex(isToday);
  const grid = { gridTemplateColumns: "minmax(150px,190px) repeat(14, minmax(30px, 1fr))" };
  const legend: Array<[string, string]> = [
    ["In progress", "bg-accent"],
    ["Overdue", "bg-bad-mid"],
    ["Waiting on client", "bg-line"],
    ["Manager date", "bg-btn"],
    ["My to-do", "border border-dashed border-accent bg-accent-soft"],
  ];
  return (
    <SectionCard
      title="Timeline"
      meta={`${SPAN[0].getDate()} to ${fmt(SPAN[13])}`}
      flush
      right={
        <span className="hidden flex-wrap items-center gap-3 text-12 text-muted xl:flex">
          {legend.map(([l, c]) => (
            <span key={l} className="flex items-center gap-1.5">
              <i className={cn("h-2 w-3 rounded-[2px]", c)} aria-hidden />
              {l}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rotate-45 rounded-[1px] bg-bad-mid" aria-hidden />
            Filing due
          </span>
        </span>
      }
    >
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid border-b border-line-soft py-2 text-11.5 font-semibold text-muted" style={grid}>
            <span className="px-4 md:px-5">Task</span>
            {SPAN.map((x, i) => (
              <span key={i} className={cn("text-center", i === todayCol && "font-bold text-brand", (x.getDay() === 0 || x.getDay() === 6) && i !== todayCol && "text-faint")}>
                {DAY_SHORT[x.getDay()][0]} {x.getDate()}
              </span>
            ))}
          </div>
          {rows.map((r) => {
            const c = clientById(r.client);
            const t = r.task ? tasks.find((x) => x.id === r.task) : undefined;
            const click = () => (t ? (r.kind === "locked" ? onLocked(t) : onOpen(t)) : undefined);
            const bar = cn(
              "relative z-[1] flex h-5 min-w-0 items-center gap-1 self-center overflow-hidden whitespace-nowrap rounded-[6px] px-1.5 text-11 font-semibold",
              r.kind === "locked" && (r.late ? "bg-bad-soft text-bad" : "bg-accent-soft text-accent"),
              r.kind === "mine" && "border border-dashed border-accent bg-accent-soft text-accent",
              r.kind === "wait" && "bg-line text-ink-2",
              r.kind === "repeat" && "border border-navy bg-surface text-ink",
              t && "cursor-pointer",
            );
            return (
              <div key={r.id} className="relative grid border-b border-line-soft py-1.5 last:border-b-0" style={grid}>
                {/* A row without a task (a to-do or a recurring item) has no drawer: show it as plain text. */}
                {(() => {
                  const El = t ? "button" : "span";
                  return (
                    <El {...(t ? { type: "button" as const, onClick: () => onOpen(t) } : {})} className="flex min-w-0 items-center gap-2 px-4 text-left md:px-5" style={{ gridColumn: 1, gridRow: 1 }}>
                      {c && <ClientDot tone={c.tone} />}
                      <span className="min-w-0">
                        <b className={cn("block truncate text-12.5 font-semibold", t && "hover:underline")}>{r.title}</b>
                        <span className="block truncate text-11.5 text-muted">
                          {c?.short} · {r.sub}
                        </span>
                      </span>
                    </El>
                  );
                })()}
                <span aria-hidden className="pointer-events-none -my-1.5 flex justify-center" style={{ gridColumn: `${todayCol + 2} / span 1`, gridRow: 1 }}>
                  <i className="block h-full w-0.5 bg-brand" />
                </span>
                {r.kind !== "filing" &&
                  (() => {
                    const El = t ? "button" : "span";
                    return (
                      <El {...(t ? { type: "button" as const, onClick: click } : {})} className={bar} style={{ gridColumn: `${r.from + 2} / ${r.to + 2}`, gridRow: 1 }} title={`${r.title} · ${fmt(SPAN[r.from])} to ${fmt(SPAN[r.to - 1])}${r.kind === "locked" ? " · dates set by manager" : ""}`}>
                        {r.kind === "locked" && <Lock size={11} strokeWidth={1.6} className="flex-none" />}
                        {r.kind === "repeat" && <Repeat size={11} strokeWidth={1.6} className="flex-none" />}
                        <span className="truncate">{r.kind === "wait" ? "Waiting on client" : r.kind === "mine" ? "Mine" : r.kind === "repeat" ? "repeats" : ""}</span>
                      </El>
                    );
                  })()}
                {r.due && (
                  <span className="z-[2] grid place-items-center self-center" style={{ gridColumn: `${r.due.day + 2} / span 1`, gridRow: 1 }} title={r.due.tip}>
                    <i className={cn("h-3 w-3 rotate-45 rounded-[2px]", r.kind === "filing" ? "bg-bad-mid" : "bg-btn")} aria-hidden />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

/** Locked date pop-over content: ask the manager to move it. */
export function RequestChangeDialog({ task, onClose, onSend }: { task: StaffTask | null; onClose: () => void; onSend: (t: StaffTask, date: string, reason: string) => void }) {
  const [date, setDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  React.useEffect(() => {
    if (!task) return;
    const next = d(task.due.getFullYear(), task.due.getMonth() + 1, task.due.getDate() + 4);
    setDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`);
    setReason(task.notes ?? "");
  }, [task]);
  const c = task ? clientById(task.client) : undefined;
  const to = task?.setBy ?? "your manager";
  return (
    <Modal
      open={!!task}
      onOpenChange={(v) => !v && onClose()}
      title="Request change"
      sub={task && <span>{`${task.title} · ${c?.short ?? ""} · set by ${to}`}</span>}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!date || !reason.trim()} onClick={() => task && onSend(task, date, reason.trim())}>
            Send to {to}
          </Button>
        </>
      }
    >
      {task && (
        <div className="grid gap-3">
          <Field label="Current due">
            <Input value={fmtYear(task.due)} disabled />
          </Field>
          <Field label="Ask for">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Reason">
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-13.5 text-ink outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent-line"
            />
          </Field>
        </div>
      )}
    </Modal>
  );
}

function Head({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 bg-raised px-4 py-1.5 text-11.5 font-semibold text-muted md:px-5">
      {label}
      <span className="font-mono text-faint">{count}</span>
    </div>
  );
}

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-2.5 border-t border-line-soft px-4 py-2.5 text-13 md:px-5", className)}>{children}</div>;
}

/** Manager only: who the row is handed to, or a dashed button to hand it to a project lead (s/mgr/Work.dc.html). */
function DelegateButton({ id, label, value, onPick }: { id: string; label: string; value?: string; onPick: (id: string, lead: string) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <PopoverCard
      open={open}
      onOpenChange={setOpen}
      align="end"
      width={200}
      trigger={
        value ? (
          <button type="button" title={`With ${value}`} aria-label={`${label}: with ${value}`} className="grid h-6 w-6 flex-none place-items-center rounded-md bg-btn text-[10px] font-bold text-white">
            {initials(value)}
          </button>
        ) : (
          <button type="button" title="Hand to a project lead" aria-label={`Hand ${label} to a project lead`} className="grid h-6 w-6 flex-none place-items-center rounded-md border border-dashed border-line text-muted hover:bg-raised">
            <UserPlus size={13} strokeWidth={1.6} />
          </button>
        )
      }
    >
      <div className="grid py-1" role="menu">
        {LEADS.filter((l) => l.manager === "Pranay").map((l) => (
          <button
            key={l.name}
            type="button"
            role="menuitem"
            className={cn("flex h-9 items-center gap-2 px-3 text-left text-13 hover:bg-raised", l.name === value && "font-semibold")}
            onClick={() => {
              setOpen(false);
              onPick(id, l.name);
            }}
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-raised text-[10px] font-bold">{initials(l.name)}</span>
            {l.name}
          </button>
        ))}
      </div>
    </PopoverCard>
  );
}

/** To-do list: assigned by manager (locked dates), my to-dos, waiting on client, recurring (Work.dc.html, WorkPhone.dc.html). */
export function TodoCard({
  portal,
  tasks,
  todos,
  setTodos,
  client,
  onOpen,
  notify,
}: {
  portal: StaffPortal;
  tasks: StaffTask[];
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  client: string;
  onOpen: (t: StaffTask) => void;
  notify: Notify;
}) {
  const [text, setText] = React.useState("");
  const [sent, setSent] = React.useState<Set<string>>(new Set());
  const assigned = tasks.filter((t) => t.setBy && t.status !== "Done" && t.status !== "With client");
  const waiting = tasks.filter((t) => t.status === "With client");
  const mine = todos.filter((t) => !client || t.client === client);
  const rec = RECURRING[portal].filter((r) => !client || r.client === client);
  const n = assigned.length + mine.filter((t) => !t.done).length + waiting.length + rec.length;
  const [delegated, setDelegated] = React.useState<Record<string, string>>(portal === "manager" ? MGR_DELEGATED : {});
  const withLeads = Object.keys(delegated).length;
  const pick = (id: string, lead: string) => {
    setDelegated((m) => ({ ...m, [id]: lead }));
    notify(`Handed to ${lead}`);
  };
  const dg = (id: string, label: string) => (portal === "manager" ? <DelegateButton id={id} label={label} value={delegated[id]} onPick={pick} /> : null);
  return (
    <SectionCard
      title="To-do"
      meta={
        <>
          {n}
          {portal === "manager" && withLeads > 0 && <span className="ml-2 rounded-sm bg-accent-soft px-1.5 py-0.5 text-11.5 font-semibold text-accent">{withLeads} with project leads</span>}
        </>
      }
      flush
    >
      <form
        className="px-4 py-3 md:px-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setTodos((l) => [{ id: `q${Date.now()}`, text: text.trim(), client: client || undefined, due: TODAY }, ...l]);
          setText("");
        }}
      >
        <label htmlFor={`qa-${portal}`} className="sr-only">
          Quick add
        </label>
        <Input id={`qa-${portal}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a to-do" className="h-[30px] text-13" />
      </form>
      <Head label="Assigned by manager" count={assigned.length} />
      {assigned.map((t) => (
        <Row key={t.id}>
          <ClientDot tone={clientById(t.client)?.tone ?? "idle"} />
          <button type="button" onClick={() => onOpen(t)} className="min-w-0 flex-1 text-left">
            <b className="block truncate font-semibold hover:underline">{t.title}</b>
            <span className="block truncate text-12 text-muted">
              {clientById(t.client)?.short} · {t.code} · {t.setBy}
            </span>
          </button>
          <Lock size={13} strokeWidth={1.6} className="flex-none text-muted" aria-label="Due date set by manager" />
          {dg(t.id, t.title)}
          <Chip tone={t.status === "Overdue" ? "bad" : t.due.getTime() === TODAY.getTime() ? "warn" : "idle"}>{t.status === "Overdue" ? "Overdue" : dayLabel(t.due)}</Chip>
        </Row>
      ))}
      <Head label="My to-dos" count={mine.filter((t) => !t.done).length} />
      {mine.map((t) => {
        const c = t.client ? clientById(t.client) : undefined;
        return (
          <Row key={t.id}>
            <Checkbox checked={!!t.done} label={t.text} onChange={(v) => setTodos((l) => l.map((x) => (x.id === t.id ? { ...x, done: v } : x)))} />
            {c && <ClientDot tone={c.tone} />}
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate font-semibold", t.done && "font-normal text-muted line-through")}>{t.text}</span>
              {(c || t.meta) && <span className="block truncate text-12 text-muted">{[c?.short, t.meta].filter(Boolean).join(" · ")}</span>}
            </span>
            {dg(t.id, t.text)}
            {t.done ? <Chip tone="ok">Done</Chip> : t.due ? <Chip tone={isToday(t.due) ? "warn" : "idle"}>{dayLabel(t.due)}</Chip> : null}
          </Row>
        );
      })}
      <Head label="Waiting on client" count={waiting.length} />
      {waiting.map((t) => (
        <Row key={t.id}>
          <ClientDot tone={clientById(t.client)?.tone ?? "idle"} />
          <button type="button" onClick={() => onOpen(t)} className="min-w-0 flex-1 text-left">
            <b className="block truncate font-semibold hover:underline">{t.title}</b>
            <span className="block truncate text-12 text-muted">
              {clientById(t.client)?.short} · due {fmt(t.due)}
            </span>
          </button>
          {sent.has(t.id) ? (
            <Chip tone="ok">Sent</Chip>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSent(new Set([...sent, t.id]));
                notify(`Reminder sent to ${clientById(t.client)?.short} · ${t.title}`);
              }}
            >
              Remind
            </Button>
          )}
        </Row>
      ))}
      <Head label="Recurring this month" count={rec.length} />
      {rec.map((r) => (
        <Row key={r.id}>
          <Repeat size={14} strokeWidth={1.6} className="flex-none text-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            <b className="block truncate font-semibold">{r.text}</b>
            <span className="block truncate text-12 text-muted">
              {clientById(r.client)?.short} · {r.rule}
            </span>
          </span>
          {dg(r.id, r.text)}
          <Chip tone={isToday(r.next) ? "warn" : "idle"}>{isToday(r.next) ? "Today" : fmt(r.next)}</Chip>
        </Row>
      ))}
    </SectionCard>
  );
}

/** Calendar with Day, Week and Month (Work.dc.html). Week and Day: hours 9 AM to 6 PM with timed blocks. */
export function PlanCalendar({
  tasks,
  blocks,
  nextBlocks,
  onOpen,
  notify,
  action,
}: {
  tasks: StaffTask[];
  /** Blocks for this week (Mon 12 to Sun 18 Oct). */
  blocks: CalBlock[];
  /** Blocks added for next week by "Plan my week". */
  nextBlocks: CalBlock[];
  onOpen: (t: StaffTask) => void;
  /** Toast with Undo after a block is moved. */
  notify?: (text: string, undo?: () => void) => void;
  action?: React.ReactNode;
}) {
  const [cal, setCal] = React.useState("week");
  const [wk, setWk] = React.useState(0);
  const [moved, move] = useBlockMoves();
  const open = tasks.filter((t) => t.status !== "Done");
  const todayIdx = WEEK.findIndex(isToday);
  const di = wk === 0 ? todayIdx : 0;
  const days = wk === 0 ? WEEK : WEEK.map((x) => d(x.getFullYear(), x.getMonth() + 1, x.getDate() + 7));
  // A moved block is late when it now sits after its task's due date.
  const shown = (wk === 0 ? blocks : nextBlocks).map((b) => {
    const m = moved[`${wk}:${b.id}`];
    if (!m) return b;
    const due = b.task ? tasks.find((t) => t.id === b.task)?.due : undefined;
    return { ...b, ...m, late: due ? days[m.day] > due : b.late };
  });
  const moveBlock = (b: CalBlock, to: Slot) => {
    const at = cal === "day" ? { ...to, day: di } : to;
    const undo = move(`${wk}:${b.id}`, at);
    const x = days[at.day];
    notify?.(`${b.title} · ${DAY_SHORT[x.getDay()]} ${fmt(x)} · ${spanOf({ ...b, ...at })}`, undo);
  };
  const openBlock = (b: CalBlock) => {
    const t = b.task ? tasks.find((x) => x.id === b.task) : undefined;
    if (t) onOpen(t);
  };
  // Own blocks and blocks without a task have no drawer.
  const canOpen = (b: CalBlock) => !!b.task && tasks.some((x) => x.id === b.task);
  const tabs = (
    <>
      {cal !== "month" && (
        <span className="flex items-center gap-1">
          <Button variant="outline" size="iconSm" aria-label="Previous week" disabled={wk === 0} onClick={() => setWk(0)}>
            <ChevronLeft size={16} strokeWidth={1.6} />
          </Button>
          <Button variant="outline" size="iconSm" aria-label="Next week" disabled={wk === 1} onClick={() => setWk(1)}>
            <ChevronRight size={16} strokeWidth={1.6} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWk(0)}>
            Today
          </Button>
        </span>
      )}
      <Tabs
        items={[
          { key: "day", label: "Day" },
          { key: "week", label: "Week" },
          { key: "month", label: "Month" },
        ]}
        value={cal}
        onChange={setCal}
      />
      {action}
    </>
  );

  if (cal === "month") {
    // October 2026 starts on a Thursday. Mon-first grid.
    const first = d(2026, 10, 1);
    const lead = (first.getDay() + 6) % 7;
    const cells = Array.from({ length: 35 }, (_, i) => d(2026, 10, 1 - lead + i));
    return (
      <SectionCard title="Calendar" meta="October 2026" right={tabs} flush>
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-7 border-t border-line-soft text-12">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
              <span key={w} className="border-b border-r border-line-soft bg-raised px-2 py-1.5 text-11.5 font-semibold text-muted last:border-r-0">
                {w}
              </span>
            ))}
            {cells.map((x, i) => {
              const due = open.filter((t) => sameDay(t.due, x));
              const late = due.some((t) => t.status === "Overdue");
              return (
                <div key={i} className={cn("min-h-[72px] border-b border-r border-line-soft px-2 py-1.5 [&:nth-child(7n)]:border-r-0", x.getMonth() !== 9 && "text-faint", isToday(x) && "bg-accent-soft")}>
                  <span className="flex items-center gap-1">
                    <b className={cn("font-semibold", isToday(x) && "text-accent")}>{x.getDate()}</b>
                    {due.length > 0 && <span className={cn("ml-auto rounded-sm px-1 font-mono text-11 font-bold text-white", late ? "bg-bad-mid" : "bg-btn")}>{due.length}</span>}
                  </span>
                  {due.slice(0, 2).map((t) => (
                    <button key={t.id} type="button" onClick={() => onOpen(t)} className="mt-1 block w-full truncate rounded-sm bg-raised px-1 text-left text-11 hover:underline">
                      {t.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>
    );
  }

  if (cal === "day") {
    return (
      <SectionCard title="Calendar" meta={`${DAY_SHORT[days[di].getDay()]} ${fmt(days[di])}`} right={tabs}>
        <HourWeek days={[days[di]]} blocks={shown.filter((b) => b.day === di).map((b) => ({ ...b, day: 0 }))} allDay={wk === 0 ? CAL_ALLDAY.filter((a) => a.day === di).map((a) => ({ ...a, day: 0 })) : []} today={TODAY} now={NOW_HOUR} onBlock={openBlock} canOpen={canOpen} onMove={moveBlock} />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Calendar" meta={`${days[0].getDate()} to ${fmt(days[6])}`} right={tabs}>
      <HourWeek days={days} blocks={shown} allDay={wk === 0 ? CAL_ALLDAY : []} today={TODAY} now={NOW_HOUR} onBlock={openBlock} canOpen={canOpen} onMove={moveBlock} />
    </SectionCard>
  );
}

/** Plan my week dialog (WorkPlan.dc.html): an hour grid for next week with suggested blocks, options, Reshuffle, add the blocks. */
export function PlanWeekDialog({ open, onOpenChange, onApply }: { open: boolean; onOpenChange: (v: boolean) => void; onApply: (blocks: CalBlock[]) => void }) {
  const [opts, setOpts] = React.useState({ deep: true, lateFirst: true, byClient: false });
  const [seed, setSeed] = React.useState(0);
  const [skip, setSkip] = React.useState<Set<string>>(new Set());
  const [view, setView] = React.useState("week");
  const [dayIdx, setDayIdx] = React.useState(0);
  const blocks = React.useMemo(() => {
    // Reshuffle moves the afternoon blocks one day on. Morning deep-work blocks stay.
    let out = PLAN_BLOCKS.map((b) => (b.start >= 12 && !b.own ? { ...b, day: (b.day + seed) % 5 } : b));
    if (!opts.deep) out = out.map((b) => (b.start < 11 && !b.own ? { ...b, start: b.start + 1, end: b.end + 1 } : b));
    if (opts.byClient) out = [...out].sort((a, b) => a.client.localeCompare(b.client));
    return out;
  }, [seed, opts.deep, opts.byClient]);
  const picked = blocks.filter((b) => !skip.has(b.id) && !b.own);
  const total = blocks.filter((b) => !skip.has(b.id)).reduce((a, b) => a + (b.end - b.start), 0);
  const load = (i: number) => blocks.filter((b) => b.day === i && !skip.has(b.id)).reduce((a, b) => a + (b.end - b.start), 0);
  const heavy = [0, 1, 2, 3, 4].find((i) => load(i) > 6);
  const toggle = (b: CalBlock) => {
    const s = new Set(skip);
    if (s.has(b.id)) s.delete(b.id);
    else s.add(b.id);
    setSkip(s);
  };
  const dayList = view === "day" ? [NEXT_WEEK[dayIdx]] : NEXT_WEEK;
  const dayBlocks = view === "day" ? blocks.filter((b) => b.day === dayIdx).map((b) => ({ ...b, day: 0 })) : blocks;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Planning my week"
      sub={<span>{`${NEXT_WEEK[0].getDate()} to ${fmt(NEXT_WEEK[4])} · ${blocks.length} to-dos · ${total} h`}</span>}
      size="lg"
      flush
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => setSeed((s) => (s + 1) % 5)}>
            Reshuffle
          </Button>
          <Button
            variant="primary"
            disabled={!picked.length}
            onClick={() => {
              onApply(blocks.filter((b) => !skip.has(b.id)));
              onOpenChange(false);
            }}
          >
            Add {picked.length} blocks to calendar
          </Button>
        </>
      }
    >
      <div className="grid gap-3 p-4 md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            items={[
              { key: "day", label: "Day" },
              { key: "week", label: "Week" },
            ]}
            value={view}
            onChange={setView}
          />
          <span className="text-12 text-muted">{view === "day" ? `${DAY_SHORT[NEXT_WEEK[dayIdx].getDay()]} ${fmt(NEXT_WEEK[dayIdx])} · ${load(dayIdx)} h` : `${NEXT_WEEK[0].getDate()} to ${fmt(NEXT_WEEK[4])} · ${total} h`}</span>
          {view === "day" && (
            <span className="ml-auto flex items-center gap-1">
              <Button variant="outline" size="iconSm" aria-label="Previous day" disabled={dayIdx === 0} onClick={() => setDayIdx(dayIdx - 1)}>
                <ChevronLeft size={16} strokeWidth={1.6} />
              </Button>
              <Button variant="outline" size="iconSm" aria-label="Next day" disabled={dayIdx === 4} onClick={() => setDayIdx(dayIdx + 1)}>
                <ChevronRight size={16} strokeWidth={1.6} />
              </Button>
            </span>
          )}
        </div>
        <HourWeek days={dayList} blocks={dayBlocks} solidBlocks showLoad skipped={skip} onBlock={toggle} />
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-13">
          {(
            [
              ["deep", "Keep 9-11 AM for deep work"],
              ["lateFirst", "Overdue and filing-related first"],
              ["byClient", "Group work by client"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2">
              <Checkbox checked={opts[k]} onChange={(v) => setOpts({ ...opts, [k]: v })} label={label} />
              {label}
            </label>
          ))}
        </div>
        {(heavy !== undefined || seed === 0) && (
          <p className="rounded-md border border-accent-line bg-accent-soft px-3 py-2 text-12.5 text-ink-2">
            {heavy !== undefined ? (
              <>
                <b className="block font-semibold text-ink">{DAY_LONG[NEXT_WEEK[heavy].getDay()]} is over 6 h.</b>
                Move a block to a lighter day before you add the plan.
              </>
            ) : (
              <>
                <b className="block font-semibold text-ink">Tuesday was over 6 h.</b>
                The GST recon moved to Thursday. Its due date is still met.
              </>
            )}
          </p>
        )}
      </div>
    </Modal>
  );
}

/** Today's planned work with session timers (WorkPhone.dc.html "Fri 16 · Today"). */
export function TodayAgenda({ tasks, plan, onOpen, timers, now, onTimer }: { tasks: StaffTask[]; plan: Record<string, number | null>; onOpen: (t: StaffTask) => void; timers: Record<string, Timer>; now: number; onTimer: (id: string) => void }) {
  const todayIdx = WEEK.findIndex(isToday);
  const items = tasks.filter((t) => t.status !== "Done" && plan[t.id] === todayIdx);
  const late = tasks.filter((t) => t.status === "Overdue").slice(0, 2);
  const load = items.reduce((a, t) => a + hoursOf(t), 0);
  const total = Object.values(timers).reduce((a, t) => a + elapsed(t, now), 0);
  return (
    <SectionCard title={`Today · ${fmt(TODAY)}`} icon={{ Icon: Play, tone: "teal" }} meta={`${load} h planned${total ? ` · ${clock(total)} logged` : ""}`} flush>
      {late.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3 md:px-5">
          {late.map((t) => (
            <Chip key={t.id} tone="bad">
              {t.title} · {clientById(t.client)?.short}
            </Chip>
          ))}
        </div>
      )}
      <div className="mt-2">
        {items.length === 0 && <Empty />}
        {items.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 border-t border-line-soft px-4 py-2.5 text-13 first:border-t-0 md:px-5">
            <ClientDot tone={clientById(t.client)?.tone ?? "idle"} />
            <button type="button" onClick={() => onOpen(t)} className="min-w-0 flex-1 text-left">
              <b className="block truncate font-semibold hover:underline">{t.title}</b>
              <span className="block truncate text-12 text-muted">
                {clientById(t.client)?.short} · {hoursOf(t)} h{t.due < TODAY ? " · after due date" : ""}
              </span>
            </button>
            <SessionButton timer={timers[t.id]} now={now} onToggle={() => onTimer(t.id)} label={t.title} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

const STATUS_SEG: Array<{ label: string; tone: BarTone; test: (t: StaffTask) => boolean }> = [
  { label: "Done", tone: "ok", test: (t) => t.status === "Done" },
  { label: "In progress", tone: "accent", test: (t) => t.status === "In progress" || t.status === "With client" },
  { label: "Due soon", tone: "warn", test: (t) => t.status === "Due this week" },
  { label: "Overdue", tone: "bad", test: (t) => t.status === "Overdue" },
  { label: "Not started", tone: "idle", test: (t) => t.status === "Not started" },
];

/** My work · status (R-25: stacked bar, not the old donut) and By area (Work.dc.html). */
export function WorkStatus({ tasks, mine }: { tasks: StaffTask[]; mine: boolean }) {
  const areas = [...new Set(tasks.map((t) => t.area))];
  return (
    <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
      <SectionCard title={mine ? "My work · status" : "Team work · status"}>
        <StackedBar total={tasks.length} title="Tasks" segments={STATUS_SEG.map((s) => ({ label: s.label, tone: s.tone, value: tasks.filter(s.test).length }))} />
      </SectionCard>
      <SectionCard title="By area" meta="Sep to Oct">
        <ul className="grid gap-3">
          {areas.map((a) => {
            const mineA = tasks.filter((t) => t.area === a);
            const done = mineA.filter((t) => t.status === "Done").length;
            const late = mineA.filter((t) => t.status === "Overdue").length;
            const pend = mineA.length - done - late - mineA.filter((t) => t.status === "Not started").length;
            const seg = (n: number) => `${(n / mineA.length) * 100}%`;
            return (
              <li key={a} className="grid grid-cols-[84px_minmax(0,1fr)_40px] items-center gap-3 text-12.5" title={`${a}: ${done} done, ${pend} pending, ${late} overdue`}>
                <span className="text-ink-2">{a}</span>
                <span className="flex h-2 overflow-hidden rounded-bar bg-line-soft" aria-hidden>
                  <i className={barFill.ok} style={{ width: seg(done) }} />
                  <i className={barFill.accent} style={{ width: seg(pend) }} />
                  <i className={barFill.bad} style={{ width: seg(late) }} />
                </span>
                <span className="text-right font-mono text-12 text-muted">
                  {done}/{mineA.length}
                </span>
              </li>
            );
          })}
        </ul>
        <ul className="mt-3 flex flex-wrap gap-3 text-12 text-muted">
          {(
            [
              ["Done", "ok"],
              ["Pending", "accent"],
              ["Overdue", "bad"],
              ["Not started", "idle"],
            ] as const
          ).map(([l, t]) => (
            <li key={l} className="flex items-center gap-1.5">
              <i className={cn("h-2 w-2 rounded-[2px]", t === "idle" ? "bg-line-soft" : barFill[t])} aria-hidden />
              {l}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

const ctaFor = (t: StaffTask) => (t.status === "Done" ? "Open" : t.status === "With client" ? "Send reminder" : t.status === "In progress" ? "Continue" : t.step ? "Open step" : "Open");

/** Board: four columns with counts; each card shows client, step, status chip and its next action (WorkBoard.dc.html). */
export function WorkBoard({ portal, tasks, onOpen, notify }: { portal: StaffPortal; tasks: StaffTask[]; onOpen: (t: StaffTask) => void; notify: Notify }) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      {BOARD_COLS.map((col) => {
        const items = tasks.filter((t) => boardColOf(t) === col.key);
        return (
          <section key={col.key} className="min-w-0 rounded-lg border border-line bg-raised" aria-label={col.label}>
            <header className="flex h-11 items-center gap-2 border-b border-line-soft px-4">
              <h2 className="text-13.5 font-semibold">{col.label}</h2>
              <Tag tone={col.key === "action" ? "warn" : col.key === "doing" ? "prog" : col.key === "done" ? "ok" : "idle"}>{items.length}</Tag>
            </header>
            <div className="grid gap-2 p-3">
              {items.length === 0 && <Empty />}
              {items.map((t) => {
                const c = clientById(t.client);
                const late = t.status === "Overdue";
                return (
                  <article key={t.id} className={cn("grid gap-2 rounded-md border bg-surface px-3 py-2.5", late ? "border-bad-mid" : "border-line")}>
                    <div className="flex min-w-0 items-center gap-2 text-12 text-muted">
                      {c && <ClientDot tone={c.tone} />}
                      <span className="truncate">{c?.short}</span>
                      {t.code && <span className="ml-auto flex-none font-mono">{t.code}</span>}
                    </div>
                    <button type="button" onClick={() => onOpen(t)} className="text-left text-13.5 font-semibold leading-snug hover:underline">
                      {t.title}
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <TaskChip status={t.status} fixed={false} />
                      <span className={cn("text-12", late ? "font-semibold text-bad" : "text-muted")}>{fmt(t.due)}</span>
                      {portal !== "lead" && <span className="text-12 text-muted">· {t.owner}</span>}
                    </div>
                    {t.status === "With client" ? (
                      <Button size="sm" variant="outline" onClick={() => notify(`Reminder sent to ${c?.short} · ${t.title}`)}>
                        Send reminder
                      </Button>
                    ) : t.step ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={taskHref(portal, t)}>{ctaFor(t)}</Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => onOpen(t)}>
                        {ctaFor(t)}
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Task drawer (WorkDrawer.dc.html): span and Request change, work sessions with a timer, checklist, files, activity. */
export function WorkDrawer({
  portal,
  task,
  onClose,
  checks,
  onCheck,
  timer,
  now,
  onTimer,
  requested,
  onRequest,
  onDone,
  notify,
}: {
  portal: StaffPortal;
  task: StaffTask | null;
  onClose: () => void;
  checks: Record<string, boolean>;
  onCheck: (id: string, v: boolean) => void;
  timer?: Timer;
  now: number;
  onTimer: () => void;
  requested?: { date: string; reason: string };
  onRequest: () => void;
  onDone: () => void;
  notify: Notify;
}) {
  const c = task ? clientById(task.client) : undefined;
  const x = task ? extraFor(task) : null;
  const list = task?.checklist?.map((k) => ({ ...k, done: checks[k.id] ?? k.done })) ?? [];
  const start = task ? d(task.due.getFullYear(), task.due.getMonth() + 1, task.due.getDate() - (SPAN_DAYS[task.id] ?? 3) + 1) : TODAY;
  return (
    <SidePanel
      open={!!task}
      onOpenChange={(v) => !v && onClose()}
      width={480}
      eyebrow={
        c && (
          <>
            <ClientDot tone={c.tone} />
            <span className="truncate">{c.name}</span>
            {task?.code && <span className="font-mono">· {task.code}</span>}
          </>
        )
      }
      title={task?.title ?? ""}
      sub={
        task && (
          <>
            <TaskChip status={task.status} fixed={false} />
            <Chip tone="prog">{task.owner === "Bharath" || task.owner === "Pranay" ? "Pending with me" : `With ${task.owner}`}</Chip>
            {task.setBy && <Chip tone="idle">Assigned by {task.setBy}</Chip>}
            {requested && <Chip tone="warn">Change requested</Chip>}
          </>
        )
      }
      footer={
        task && (
          <>
            {task.step && (
              <Button variant="outline" asChild>
                <Link href={taskHref(portal, task)}>Open step</Link>
              </Button>
            )}
            {task.status !== "Done" && (
              <Button variant="outline" onClick={() => notify(`Reminder sent to ${c?.short ?? "the client"} · ${task.title}`)}>
                Send reminder
              </Button>
            )}
            {task.status !== "Done" && (
              <Button variant="primary" onClick={onDone}>
                Mark done
              </Button>
            )}
          </>
        )
      }
    >
      {task && x && (
        <>
          <PanelSection>
            <KeyValue
              rows={[
                { k: "Client", v: c?.short ?? "" },
                { k: "Step", v: task.code ?? "Filing" },
                { k: "Due", v: fmt(task.due) },
                { k: "Owner", v: task.owner },
                { k: "Area", v: task.area },
                { k: "Dates set by", v: task.setBy ?? task.owner },
              ]}
            />
          </PanelSection>
          <PanelSection title="Span">
            <div className="flex flex-wrap items-center gap-2 text-13">
              <span className="font-mono">
                {fmt(start)} to {fmt(task.due)}
              </span>
              <span className="text-12.5 text-muted">{task.setBy ? "manager dates" : "your dates"}</span>
              {task.setBy && task.status !== "Done" && (
                <Button size="sm" variant="outline" className="ml-auto" onClick={onRequest} disabled={!!requested}>
                  Request change
                </Button>
              )}
            </div>
            {requested && (
              <p className="mt-2 text-12.5 text-muted">
                Asked for {fmt(new Date(`${requested.date}T00:00:00`))} · {requested.reason}
              </p>
            )}
          </PanelSection>
          {task.notes && (
            <PanelSection title="Notes">
              <p className="text-13.5">{task.notes}</p>
            </PanelSection>
          )}
          <PanelSection title="Work sessions" flush>
            <div className="flex items-center gap-2 px-5 pb-2 text-13">
              <span className="min-w-0 flex-1 text-12.5 text-muted">{timer?.start ? "Session running" : elapsed(timer, now) ? "Session stopped" : "No session yet"}</span>
              <SessionButton timer={timer} now={now} onToggle={onTimer} label={task.title} />
            </div>
            <ul>
              {x.sessions.map((s) => (
                <li key={s.when} className="flex items-center gap-3 border-t border-line-soft px-5 py-2 text-13">
                  <span className="w-[150px] flex-none font-mono text-12 text-muted">{s.when}</span>
                  <span className="min-w-0 flex-1 truncate">{s.text}</span>
                  {s.late && <Chip tone="warn">After span</Chip>}
                </li>
              ))}
            </ul>
          </PanelSection>
          {list.length > 0 && (
            <PanelSection title={`Checklist · ${list.filter((k) => k.done).length} of ${list.length}`} flush>
              <ul>
                {list.map((k) => (
                  <li key={k.id} className="flex items-center gap-3 border-t border-line-soft px-5 py-2.5 text-13.5 first:border-t-0">
                    <Checkbox checked={k.done} onChange={(v) => onCheck(k.id, v)} label={k.label} />
                    <span className={cn("min-w-0 flex-1 truncate", k.done && "text-muted line-through")}>{k.label}</span>
                  </li>
                ))}
              </ul>
            </PanelSection>
          )}
          {x.files.length > 0 && (
            <PanelSection title="Files">
              <ul className="grid gap-2">
                {x.files.map((f) => (
                  <li key={f.name} className="flex items-center gap-2.5 text-13">
                    <FileBadge type={fileType(f.name)} />
                    <span className="min-w-0 truncate font-mono text-12.5">{f.name}</span>
                  </li>
                ))}
              </ul>
            </PanelSection>
          )}
          <PanelSection title="Activity">
            <ul className="grid gap-2 text-13">
              {x.activity.map((a, i) => (
                <li key={i}>
                  <b className="font-semibold">{a.who}</b> {a.text} <span className="font-mono text-12 text-muted">· {a.when}</span>
                </li>
              ))}
            </ul>
          </PanelSection>
        </>
      )}
    </SidePanel>
  );
}

/** New to-do dialog. */
export function NewTodoDialog({ open, onOpenChange, clients, onAdd, title = "New to-do" }: { open: boolean; onOpenChange: (v: boolean) => void; clients: Array<{ id: string; short: string }>; onAdd: (t: Todo) => void; title?: string }) {
  const [text, setText] = React.useState("");
  const [client, setClient] = React.useState("");
  // Staff today is Fri 16 Oct (STAFF_TODAY).
  const [due, setDue] = React.useState("2026-10-16");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!text.trim()}
            onClick={() => {
              const [y, m, dd] = due.split("-").map(Number);
              onAdd({ id: `n${Date.now()}`, text: text.trim(), client: client || undefined, due: y ? d(y, m, dd) : undefined });
              setText("");
              onOpenChange(false);
            }}
          >
            Add
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field label="To-do">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Call Mei on Friday at 3 PM" autoFocus />
        </Field>
        <Field label="Client">
          <Select size="md" value={client} onChange={(e) => setClient(e.target.value)} options={[{ value: "", label: "No client" }, ...clients.map((c) => ({ value: c.id, label: c.short }))]} className="w-full [&>select]:w-full" />
        </Field>
        <Field label="Due">
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

