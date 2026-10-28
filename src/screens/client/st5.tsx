"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ListChecks } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { NORTHWIND } from "@/data/people";
import { PHASES, STEPS, stepTone, stepHref, type Step, type StepStatus } from "@/data/incorporation";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { PhaseBar } from "@/components/ui/PhaseBar";
import { StepMark, type StepTone } from "@/components/ui/StepMark";
import { SectionCard, HeadLink } from "@/components/cards/SectionCard";

/*
 * ST5 (R-22): a phase track and the step list of the current phase in one card.
 * Phase track: one bar per phase, sized by step count. Done green, current blurple with a soft ring, next grey.
 * Step list: done = green square with a tick; live = ring with a status square and a halo, row tinted; upcoming = dashed square.
 * Phone (under 640 px): the compact bars (PhaseBar), the phase line, and the live steps only.
 */

/** Steps after the certificate (sample): these post-incorporation steps are done. */
const POST_DONE_STEPS = [15, 16, 17, 18, 21, 24, 25];

export interface St5Step extends Step {
  /** Status in the state shown (before or after the certificate). */
  shown: StepStatus;
}

/** Steps in the state the prototype shows. After the certificate, phases 1 and 2 are done and phase 3 is part done. */
export function stepsInState(after: boolean): St5Step[] {
  return STEPS.map((s) => ({ ...s, shown: !after ? s.status : s.phase < 3 || POST_DONE_STEPS.includes(s.n) ? "Completed" : "In progress" }));
}

const holder = (s: Step) => (s.owner === "client" ? "Northwind" : s.owner === "sbc" ? "SBC" : "MCA");
const isLive = (s: St5Step) => s.shown !== "Completed" && s.shown !== "Upcoming";
const isLate = (s: St5Step, today: Date) => isLive(s) && !!s.due && s.due < today;

function markTone(s: St5Step, today: Date): StepTone {
  if (isLate(s, today) || s.shown === "Sent back") return "bad";
  if (s.shown === "Waiting") return "teal";
  return "prog";
}

function chipOf(s: St5Step, today: Date): { tone: ChipTone; label: string } {
  if (s.shown === "Upcoming") return { tone: "idle", label: "Not started" };
  if (isLate(s, today)) return { tone: "bad", label: "Overdue" };
  return { tone: stepTone[s.shown], label: s.shown };
}

/** Line under a step title: "Done 26 Sep", "With Northwind · due 9 Oct", "Starts after step 10". */
function subOf(s: St5Step, prev: St5Step | undefined, today: Date, after: boolean): { text: string; cls: string } {
  if (s.shown === "Completed") return { text: s.done && !after ? `Done ${fmt(s.done)}` : "Done", cls: "text-muted" };
  if (s.shown === "Upcoming") return { text: prev ? `Starts after step ${prev.n}` : "Opens later", cls: "text-muted" };
  const late = isLate(s, today);
  const due = s.due ? ` · due ${fmt(s.due)}` : "";
  const tone = late ? "text-bad" : s.shown === "Waiting" ? "text-teal" : "text-accent";
  return { text: `With ${holder(s)}${due}`, cls: tone };
}

/** Phase track: one column per phase, flex sized by step count. */
export function PhaseTrack({ steps, current, className }: { steps: St5Step[]; current: number; className?: string }) {
  return (
    <div className={cn("flex gap-2", className)} role="list" aria-label="Phases">
      {PHASES.map((p) => {
        const list = steps.filter((s) => s.phase === p.n);
        const done = list.filter((s) => s.shown === "Completed").length;
        const all = done === list.length;
        const cur = p.n === current && !all;
        const pct = Math.round((done / list.length) * 100);
        const first = list[0].n;
        const last = list[list.length - 1].n;
        return (
          <div key={p.id} role="listitem" className="flex min-w-0 flex-col gap-[7px]" style={{ flex: `${list.length} 1 0` }}>
            <span className={cn("truncate text-13 font-medium", all || cur ? "text-ink" : "text-muted")}>{p.short}</span>
            <span className={cn("relative block h-2.5 overflow-hidden rounded-bar bg-raised", cur && "ring-[1.5px] ring-accent-line")} aria-hidden>
              <i className={cn("block h-full rounded-bar", all ? "bg-ok-mid" : "bg-primary")} style={{ width: pct > 0 ? `max(${pct}%, 6px)` : 0 }} />
            </span>
            <span className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className={cn("text-12 font-medium", all ? "text-ok" : cur ? "text-accent" : "text-muted")}>
                {done}/{list.length}
              </span>
              <span className={cn("truncate font-mono text-11.5", cur || all ? "text-muted" : "text-faint")}>
                Step {first}–{last}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** One row of the ST5 step list. `focus` tints the row (the step the page is about); `below` sits under the row text. */
export function StepRow({ s, prev, today, after, lastRow, focus, below, compact }: { s: St5Step; prev?: St5Step; today: Date; after: boolean; lastRow: boolean; focus?: boolean; below?: React.ReactNode; compact?: boolean }) {
  const live = isLive(s);
  const tint = focus ?? live;
  const sub = subOf(s, prev, today, after);
  const chip = chipOf(s, today);
  const lead = s.by ?? NORTHWIND.lead;
  return (
    <li className={cn("relative", focus === undefined && !live && "max-sm:hidden")}>
      {!lastRow && <span className={cn("absolute bottom-[-6px] left-[20.25px] top-[30px] w-[1.5px] max-sm:hidden", s.shown === "Completed" ? "bg-ok-mid" : "bg-line")} aria-hidden />}
      <Link href={stepHref("client", s.n)} aria-current={focus ? "step" : undefined} className={cn("relative -mx-2.5 flex items-center gap-3 rounded-md px-2.5 py-2 hover:bg-hover", tint && "bg-hover")}>
        <StepMark state={s.shown === "Completed" ? "done" : live ? "now" : "next"} tone={markTone(s, today)} className="relative z-[1]" label={chip.label} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="flex-none font-mono text-12 text-muted">Step {s.n}</span>
            <span className={cn("truncate text-14", live ? "font-medium text-ink" : "text-ink")}>{s.title}</span>
          </span>
          <span className={cn("truncate text-12.5", sub.cls)}>{sub.text}</span>
          {below}
        </span>
        {live && !compact && (
          <span className="hidden flex-none items-center gap-1.5 text-12.5 text-muted md:inline-flex">
            <Avatar name={lead} size={24} />
            {lead}
          </span>
        )}
        {!compact && (live || s.shown === "Completed") && (
          <Chip tone={chip.tone} fixed className="hidden sm:inline-flex">
            {chip.label}
          </Chip>
        )}
      </Link>
    </li>
  );
}

/**
 * The ST5 card. `after`: the prototype's incorporated state. `link`: the head link.
 * Shows the last done step, every live step and the next two upcoming steps; the rest fold under "n more in this phase".
 */
export function St5Card({ after, today = TODAY, link, className, title = "Incorporation" }: { after: boolean; today?: Date; link?: { href: string; label: string }; className?: string; title?: string }) {
  const steps = stepsInState(after);
  const done = steps.filter((s) => s.shown === "Completed").length;
  const current = (PHASES.find((p) => steps.some((s) => s.phase === p.n && s.shown !== "Completed")) ?? PHASES[PHASES.length - 1]).n;
  const phase = PHASES[current - 1];
  const list = steps.filter((s) => s.phase === current);
  const [all, setAll] = React.useState(false);
  const lastDone = [...list].reverse().find((s) => s.shown === "Completed");
  const upcoming = list.filter((s) => s.shown === "Upcoming");
  const keep = (s: St5Step) => isLive(s) || s === lastDone || upcoming.indexOf(s) > -1 && upcoming.indexOf(s) < 2;
  const shown = all ? list : list.filter(keep);
  const hidden = list.filter((s) => !shown.includes(s));
  const phaseDone = list.filter((s) => s.shown === "Completed").length;
  return (
    <SectionCard
      title={title}
      icon={{ Icon: ListChecks, tone: "blue" }}
      meta={
        <span className="rounded-sm bg-raised px-[7px] py-px text-12 font-medium text-ink-2">
          {done} of {steps.length}
        </span>
      }
      className={className}
      right={
        link && (
          <HeadLink href={link.href}>
            {link.label} <ArrowRight size={14} strokeWidth={1.6} />
          </HeadLink>
        )
      }
    >
      <PhaseTrack steps={steps} current={current} className="max-sm:hidden" />
      <div className="sm:hidden">
        <PhaseBar done={PHASES.map((p) => steps.filter((s) => s.phase === p.n && s.shown === "Completed").length)} totals={PHASES.map((p) => steps.filter((s) => s.phase === p.n).length)} names={PHASES.map((p) => p.short)} className="w-full" />
        <div className="mt-3 flex items-baseline gap-1 text-12.5 text-muted">
          Phase {current} of {PHASES.length} · <b className="font-medium text-ink">{phase.short}</b>
          <span className="ml-auto">
            {phaseDone}/{list.length}
          </span>
        </div>
      </div>
      <ol className="mt-5 flex flex-col border-t border-line-soft pt-3 max-sm:mt-3">
        {shown.map((s, i) => (
          <StepRow key={s.n} s={s} prev={steps[s.n - 2]} today={today} after={after} lastRow={i === shown.length - 1} />
        ))}
      </ol>
      {hidden.length > 0 && (
        <button type="button" onClick={() => setAll(true)} className="mt-2 inline-flex items-center gap-1.5 text-13 font-medium text-accent hover:underline max-sm:hidden">
          <ChevronDown size={14} strokeWidth={1.6} />
          {hidden.length} more in this phase
          {hidden[hidden.length - 1].n - hidden[0].n === hidden.length - 1 && ` · Step ${hidden[0].n} to Step ${hidden[hidden.length - 1].n}`}
        </button>
      )}
    </SectionCard>
  );
}
