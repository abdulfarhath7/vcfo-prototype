"use client";
import * as React from "react";
import Link from "next/link";
import { GripVertical, Lock, Pause, Play, Repeat } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, d, fmt, fmtYear } from "@/lib/dates";
import { clientById } from "@/data/staff-clients";
import type { StaffTask } from "@/data/staff-tasks";
import { BOARD_COLS, DAY_SHORT, ESTIMATE, RECURRING, SPAN, SPAN_DAYS, WEEK, boardColOf, extraFor, isToday, sameDay, type Todo } from "@/data/staff-work";
import { Button } from "@/components/ui/Button";
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
        {running ? <Pause size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
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
                    {locked && <Lock size={11} strokeWidth={1.5} className="flex-none" />}
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
  return (
    <SectionCard title="To-do" meta={String(n)} flush>
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
          <Lock size={13} strokeWidth={1.5} className="flex-none text-muted" aria-label="Due date set by manager" />
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
          <Repeat size={14} strokeWidth={1.5} className="flex-none text-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            <b className="block truncate font-semibold">{r.text}</b>
            <span className="block truncate text-12 text-muted">
              {clientById(r.client)?.short} · {r.rule}
            </span>
          </span>
          <Chip tone={isToday(r.next) ? "warn" : "idle"}>{isToday(r.next) ? "Today" : fmt(r.next)}</Chip>
        </Row>
      ))}
    </SectionCard>
  );
}

/** One draggable task chip on the planner. Keyboard: the "Move to" select. */
function PlanChip({ t, day, onMove, onOpen }: { t: StaffTask; day: number | null; onMove: (id: string, day: number | null) => void; onOpen: (t: StaffTask) => void }) {
  const c = clientById(t.client);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", t.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn("grid gap-1.5 rounded-md border bg-surface px-2 py-2 text-12.5", t.status === "Overdue" ? "border-bad-mid" : "border-line", "cursor-grab active:cursor-grabbing")}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        <GripVertical size={14} strokeWidth={1.5} className="mt-0.5 flex-none text-faint" aria-hidden />
        {c && <ClientDot tone={c.tone} className="mt-1" />}
        <button type="button" onClick={() => onOpen(t)} className="min-w-0 flex-1 text-left">
          <b className="block truncate font-semibold hover:underline">{t.title}</b>
          <span className="block truncate text-11.5 text-muted">
            {c?.short} · {hoursOf(t)} h{t.status === "Overdue" ? " · overdue" : ""}
          </span>
        </button>
      </div>
      <Select
        aria-label={`Move ${t.title} to`}
        value={day === null ? "none" : String(day)}
        onChange={(e) => onMove(t.id, e.target.value === "none" ? null : Number(e.target.value))}
        options={[{ value: "none", label: "Not planned" }, ...WEEK.map((w, i) => ({ value: String(i), label: `Move to ${dayLabel(w)}` }))]}
        className="w-full [&>select]:w-full"
      />
    </div>
  );
}

function DropZone({ onDrop, children, className, label }: { onDrop: (id: string) => void; children: React.ReactNode; className?: string; label: string }) {
  const [over, setOver] = React.useState(false);
  return (
    <div
      aria-label={label}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id);
      }}
      className={cn("min-w-0 rounded-md transition-colors", over && "bg-accent-soft ring-2 ring-accent", className)}
    >
      {children}
    </div>
  );
}

/** Calendar with Day, Week and Month. Week: drag a task onto a day (WorkPlan.dc.html). Load over 6 h shows red. */
export function PlanCalendar({
  tasks,
  plan,
  onMove,
  onOpen,
  timers,
  now,
  onTimer,
  action,
}: {
  tasks: StaffTask[];
  plan: Record<string, number | null>;
  onMove: (id: string, day: number | null) => void;
  onOpen: (t: StaffTask) => void;
  timers: Record<string, Timer>;
  now: number;
  onTimer: (id: string) => void;
  action?: React.ReactNode;
}) {
  const [cal, setCal] = React.useState("week");
  const open = tasks.filter((t) => t.status !== "Done");
  const dayOf = (t: StaffTask) => plan[t.id] ?? null;
  const pool = open.filter((t) => dayOf(t) === null).sort((a, b) => Number(b.status === "Overdue") - Number(a.status === "Overdue") || a.due.getTime() - b.due.getTime());
  const todayIdx = WEEK.findIndex(isToday);
  const tabs = (
    <>
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

  if (cal === "day") {
    const items = open.filter((t) => dayOf(t) === todayIdx);
    const load = items.reduce((a, t) => a + hoursOf(t), 0);
    return (
      <SectionCard title="Calendar" meta={`Today · ${fmt(TODAY)} · ${load} h planned`} right={tabs} flush>
        <DropZone label="Today" onDrop={(id) => onMove(id, todayIdx)}>
          {items.length === 0 && <Empty />}
          {items.map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13 first:border-t-0 md:px-5">
              <ClientDot tone={clientById(t.client)?.tone ?? "idle"} />
              <button type="button" onClick={() => onOpen(t)} className="min-w-0 flex-1 text-left">
                <b className="block truncate font-semibold hover:underline">{t.title}</b>
                <span className="block truncate text-12 text-muted">
                  {clientById(t.client)?.short} · {hoursOf(t)} h{t.due < TODAY ? " · overdue" : ""}
                </span>
              </button>
              <SessionButton timer={timers[t.id]} now={now} onToggle={() => onTimer(t.id)} label={t.title} />
            </div>
          ))}
        </DropZone>
      </SectionCard>
    );
  }

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

  return (
    <SectionCard title="Plan my week" meta={`${fmt(WEEK[0])} to ${fmt(WEEK[6])} · ${pool.length} not planned`} right={tabs}>
      <div className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)]">
        <DropZone label="Not planned" onDrop={(id) => onMove(id, null)} className="border border-dashed border-line p-2">
          <h3 className="mb-2 flex items-center gap-2 text-12 font-semibold text-muted">
            Not planned <span className="font-mono text-faint">{pool.length}</span>
          </h3>
          <div className="grid max-h-[420px] gap-2 overflow-y-auto">
            {pool.length === 0 && <Empty />}
            {pool.map((t) => (
              <PlanChip key={t.id} t={t} day={null} onMove={onMove} onOpen={onOpen} />
            ))}
          </div>
        </DropZone>
        <div className="overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-7 gap-2">
            {WEEK.map((w, i) => {
              const items = open.filter((t) => dayOf(t) === i);
              const load = items.reduce((a, t) => a + hoursOf(t), 0);
              return (
                <DropZone key={i} label={dayLabel(w)} onDrop={(id) => onMove(id, i)} className={cn("border p-1.5", isToday(w) ? "border-navy bg-raised" : "border-line-soft")}>
                  <div className="mb-1.5 flex items-baseline justify-between px-0.5">
                    <b className={cn("text-12 font-semibold", isToday(w) && "text-accent")}>{dayLabel(w)}</b>
                    <span className={cn("font-mono text-11", load > 6 ? "font-semibold text-bad" : "text-faint")}>{load} h</span>
                  </div>
                  <div className="grid min-h-[120px] content-start gap-1.5">
                    {items.map((t) => (
                      <PlanChip key={t.id} t={t} day={i} onMove={onMove} onOpen={onOpen} />
                    ))}
                  </div>
                </DropZone>
              );
            })}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/** Plan my week dialog (WorkPlan.dc.html): suggested blocks, options, Reshuffle, add the picked blocks. */
export function PlanWeekDialog({ open, onOpenChange, tasks, plan, onApply }: { open: boolean; onOpenChange: (v: boolean) => void; tasks: StaffTask[]; plan: Record<string, number | null>; onApply: (moves: Record<string, number>) => void }) {
  const [opts, setOpts] = React.useState({ deep: true, lateFirst: true, byClient: false });
  const [seed, setSeed] = React.useState(0);
  const [skip, setSkip] = React.useState<Set<string>>(new Set());
  const todayIdx = WEEK.findIndex(isToday);
  const suggest = React.useMemo(() => {
    let pool = tasks.filter((t) => t.status !== "Done" && (plan[t.id] ?? null) === null);
    if (opts.lateFirst) pool = [...pool].sort((a, b) => Number(b.status === "Overdue") - Number(a.status === "Overdue") || a.due.getTime() - b.due.getTime());
    if (opts.byClient) pool = [...pool].sort((a, b) => a.client.localeCompare(b.client));
    const cap = opts.deep ? 5 : 7;
    const load = WEEK.map((_, i) => tasks.filter((t) => plan[t.id] === i).reduce((a, t) => a + hoursOf(t), 0));
    const out: Array<{ t: StaffTask; day: number }> = [];
    pool.forEach((t, k) => {
      const days = [0, 1, 2, 3, 4].filter((i) => i >= todayIdx).map((i) => (i + seed + k) % 5).filter((i) => i >= todayIdx);
      const day = (days.length ? days : [todayIdx]).reduce((best, i) => (load[i] < load[best] ? i : best), days[0] ?? todayIdx);
      if (load[day] + hoursOf(t) <= cap + 2) {
        load[day] += hoursOf(t);
        out.push({ t, day });
      }
    });
    return { out, load };
  }, [tasks, plan, opts, seed, todayIdx]);
  const picked = suggest.out.filter((x) => !skip.has(x.t.id));
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Planning my week"
      sub={<span>{`${fmt(WEEK[0])} to ${fmt(WEEK[4])} · ${suggest.out.length} blocks · ${suggest.out.reduce((a, x) => a + hoursOf(x.t), 0)} h`}</span>}
      size="lg"
      flush
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => setSeed((s) => s + 1)}>
            Reshuffle
          </Button>
          <Button
            variant="primary"
            disabled={!picked.length}
            onClick={() => {
              onApply(Object.fromEntries(picked.map((x) => [x.t.id, x.day])));
              onOpenChange(false);
            }}
          >
            Add {picked.length} blocks to calendar
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-line-soft px-4 py-3 text-13 md:px-5">
        {(
          [
            ["deep", "Keep 9 to 11 AM for deep work"],
            ["lateFirst", "Overdue and filing work first"],
            ["byClient", "Group work by client"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2">
            <Checkbox checked={opts[k]} onChange={(v) => setOpts({ ...opts, [k]: v })} label={label} />
            {label}
          </label>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-5 md:px-5">
        {WEEK.slice(0, 5).map((w, i) => {
          const items = suggest.out.filter((x) => x.day === i);
          const load = suggest.load[i];
          return (
            <div key={i} className={cn("rounded-md border p-2", isToday(w) ? "border-navy" : "border-line-soft")}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <b className="text-12 font-semibold">{dayLabel(w)}</b>
                <span className={cn("font-mono text-11", load > 6 ? "font-semibold text-bad" : "text-faint")}>{load} h</span>
              </div>
              <div className="grid gap-1.5">
                {i < todayIdx && <span className="text-11.5 text-faint">Past</span>}
                {items.map((x) => (
                  <label key={x.t.id} className={cn("flex items-start gap-1.5 rounded-sm bg-raised px-1.5 py-1.5 text-12", skip.has(x.t.id) && "opacity-50")}>
                    <Checkbox
                      checked={!skip.has(x.t.id)}
                      label={x.t.title}
                      onChange={(v) => {
                        const s = new Set(skip);
                        if (v) s.delete(x.t.id);
                        else s.add(x.t.id);
                        setSkip(s);
                      }}
                    />
                    <span className="min-w-0">
                      <b className="block truncate font-semibold">{x.t.title}</b>
                      <span className="block truncate text-11 text-muted">
                        {clientById(x.t.client)?.short} · {hoursOf(x.t)} h
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
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
                <span className="flex h-2 overflow-hidden rounded-full bg-line-soft" aria-hidden>
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
export function NewTodoDialog({ open, onOpenChange, clients, onAdd }: { open: boolean; onOpenChange: (v: boolean) => void; clients: Array<{ id: string; short: string }>; onAdd: (t: Todo) => void }) {
  const [text, setText] = React.useState("");
  const [client, setClient] = React.useState("");
  const [due, setDue] = React.useState("2026-10-06");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New to-do"
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

