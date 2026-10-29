"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { fmt, urgency } from "@/lib/dates";
import { clientById } from "@/data/staff-clients";
import { clientNameOf } from "@/data/staff-item";
import type { HistoryEntry, ReminderRow, Step, StatusWord } from "@/data/compliance-tasks";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { StepMark } from "@/components/ui/StepMark";
import { DateTile } from "@/components/cards/AttentionList";
import { SectionCard, Empty } from "@/components/cards/SectionCard";
import { ClientTile } from "@/screens/staff/grids";

// Shared parts of the statutory (4.2) and non-statutory (4.3) detail pages in docs/COMPLIANCE-MODEL.md.
// One header card, then two columns. The client view drops the internal parts (D-4).

export type DetailRole = "lead" | "manager" | "admin" | "client";

/** The person acting in each portal (nav.ts PORTALS). */
export const ACTOR: Record<DetailRole, string> = { lead: "Bharath", manager: "Pranay", admin: "Krishna", client: "Rohan Kumar" };

/** R-13: the six words, each with its tone. */
export const WORD_TONE: Record<StatusWord, ChipTone> = { "Not started": "idle", "In progress": "prog", Waiting: "teal", "Due soon": "warn", Overdue: "bad", Done: "ok" };

/** R-28: mono only for identifiers (ARN, CPIN, SRN, TRRN): runs of capitals and digits. */
export const isId = (v: string) => /^[A-Z0-9][A-Z0-9 ·-]{5,}$/.test(v.trim()) && /[A-Z0-9]{6,}/.test(v);

/** D-1 and 4.3 header card: date tile, name, client, marks, the due line and the one main button. */
export function DetailHeader({
  date,
  done,
  today,
  title,
  client,
  marks,
  word,
  due,
  late,
  action,
}: {
  date: Date;
  done: boolean;
  today: Date;
  title: string;
  client: string;
  marks: React.ReactNode;
  word: StatusWord;
  due: React.ReactNode;
  late: boolean;
  action: React.ReactNode;
}) {
  const c = clientById(client);
  return (
    <section aria-label="Header" className="rounded-md border-1.5 border-line bg-surface px-4 py-4 md:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <DateTile date={date} tint={done ? "idle" : urgency(date, today)} />
        <div className="min-w-0 flex-[1_1_300px]">
          <h1 className="text-24 font-medium leading-8 tracking-[-0.01em]">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <span className="inline-flex min-w-0 items-center gap-2 text-14 font-medium">
              {c && <ClientTile c={c} size={26} />}
              <span className="truncate">{clientNameOf(client)}</span>
            </span>
            {marks}
            <Chip tone={WORD_TONE[word]} fixed>
              {word}
            </Chip>
            <span className={cn("whitespace-nowrap text-13", late ? "font-medium text-bad" : "text-muted")}>{due}</span>
          </div>
        </div>
        <div className="flex-none">{action}</div>
      </div>
    </section>
  );
}

/** Two-column body: main column and a 360 px rail; stacks below 1024 px. */
export function DetailCols({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid min-w-0 grid-cols-1 gap-5">{left}</div>
      <div className="grid min-w-0 grid-cols-1 gap-5">{right}</div>
    </div>
  );
}

/** Label and value row inside a flush card. */
export function KV({ k, children, sub }: { k: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-line-soft px-4 py-2.5 first:border-t-0 sm:grid-cols-[170px_minmax(0,1fr)_auto] sm:items-center sm:gap-3 md:px-5">
      <span className="text-13 text-muted">{k}</span>
      <div className="min-w-0 text-14">{children}</div>
      {sub ? <span className="text-12.5 text-muted">{sub}</span> : <span className="hidden sm:block" />}
    </div>
  );
}

const REMINDER_STATE: Record<ReminderRow["state"], string> = { sent: "Sent", acknowledged: "Acknowledged", scheduled: "Scheduled", skipped: "Skipped" };
const DAY_OPTIONS = [1, 2, 3, 5, 7, 10, 15, 20, 30].map((n) => ({ value: String(n), label: `${n} day${n === 1 ? "" : "s"} before` }));

/** D-2.3 Reminders (COMPLIANCE-MODEL.md 3.4). Admin and manager change the days; the client does not see escalations. */
export function RemindersCard({ rows, days, onDays, canEdit, client }: { rows: ReminderRow[]; days: number; onDays: (n: number) => void; canEdit: boolean; client: boolean }) {
  const [editing, setEditing] = React.useState(false);
  const shown = client ? rows.filter((r) => !r.internal) : rows;
  const options = DAY_OPTIONS.some((o) => o.value === String(days)) ? DAY_OPTIONS : [...DAY_OPTIONS, { value: String(days), label: `${days} days before` }];
  return (
    <SectionCard
      title="Reminders"
      meta={`First ${days} day${days === 1 ? "" : "s"} before`}
      flush
      right={
        canEdit ? (
          editing ? (
            <>
              <Select aria-label="First reminder" value={String(days)} options={options} onChange={(e) => onDays(Number(e.target.value))} />
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Done
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit days
            </Button>
          )
        ) : undefined
      }
    >
      <ul>
        {shown.map((r) => (
          <li key={r.key} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-line-soft px-4 py-2.5 first:border-t-0 md:px-5">
            <span className="min-w-0 flex-[1_1_200px]">
              <b className="block truncate text-14 font-medium">{r.label}</b>
              <span className="block truncate text-12.5 text-muted">To {r.to.toLowerCase()}</span>
            </span>
            <span className="w-[64px] flex-none text-13 tabular-nums">{fmt(r.date)}</span>
            <span className={cn("w-[104px] flex-none text-13", r.state === "scheduled" || r.state === "skipped" ? "text-muted" : "text-ink-2")}>{REMINDER_STATE[r.state]}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/** D-2.5 Activity: the audit trail, newest first. */
export function ActivityCard({ rows }: { rows: HistoryEntry[] }) {
  return (
    <SectionCard title="Activity" flush>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ul>
          {rows.map((h, i) => (
            <li key={i} className="flex items-start gap-3 border-t border-line-soft px-4 py-2.5 first:border-t-0 md:px-5">
              <Avatar name={h.who} size={24} className={h.who === "VCFO" ? "!bg-raised !text-muted" : undefined} />
              <span className="min-w-0 flex-1 text-14">
                <b className="font-medium">{h.who}</b> <span className="text-ink-2">{h.what}</span>
              </span>
              <span className="flex-none whitespace-nowrap text-12.5 text-muted">{h.when}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/** D-3 Progress: ST5 steps with who, when and evidence, then the stage, the owner and the reviewer. */
export function ProgressCard({ steps, stage, owner, reviewer, note }: { steps: Step[]; stage: string; owner: string; reviewer: string; note?: string }) {
  return (
    <SectionCard title="Progress" meta={`${steps.filter((s) => s.state === "done").length} of ${steps.length}`} flush>
      <ol className="px-4 py-3 md:px-5">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex gap-3 pb-3.5 last:pb-0">
            {i < steps.length - 1 && <i className={cn("absolute bottom-0 left-[10px] top-[24px] w-[1.5px]", s.state === "done" ? "bg-ok-mid" : "bg-line")} aria-hidden />}
            <StepMark state={s.state} label={s.state === "done" ? "Done" : s.state === "now" ? "Current step" : "Next"} />
            <span className="min-w-0 flex-1 pt-px">
              <b className={cn("block text-14", s.state === "now" ? "font-medium text-ink" : s.state === "done" ? "font-medium" : "font-normal text-ink-2")}>{s.label}</b>
              <span className="block text-12.5 text-muted">
                {s.who}
                {s.when ? ` · ${s.when}` : s.state === "now" ? " · Now" : ""}
              </span>
              {s.evidence && <span className={cn("mt-0.5 block truncate text-12.5 text-ink-2", isId(s.evidence) && "font-mono")}>{s.evidence}</span>}
            </span>
          </li>
        ))}
      </ol>
      <div className="grid gap-2.5 border-t border-line-soft px-4 py-3 md:px-5">
        <div className="flex items-center justify-between gap-3 text-14">
          <span className="text-13 text-muted">Stage</span>
          <b className="font-medium">{stage}</b>
        </div>
        {(
          [
            ["Owner", owner],
            ["Reviewer", reviewer],
          ] as const
        ).map(([k, who]) => (
          <div key={k} className="flex items-center justify-between gap-3 text-14">
            <span className="text-13 text-muted">{k}</span>
            <span className="inline-flex min-w-0 items-center gap-2">
              <Avatar name={who} size={24} />
              <span className="truncate font-medium">{who}</span>
            </span>
          </div>
        ))}
        {note && <p className="rounded-md bg-raised px-3 py-2 text-13 leading-relaxed text-ink-2">{note}</p>}
      </div>
    </SectionCard>
  );
}
