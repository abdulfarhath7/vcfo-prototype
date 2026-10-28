"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { STEPS } from "@/data/incorporation";
import { stepState } from "@/data/staff-steps";
import { PHASE_TOTALS, STAFF_CLIENTS, type StaffClient } from "@/data/staff-clients";
import { Chip } from "@/components/ui/Chip";
import { StepMark, type StepTone } from "@/components/ui/StepMark";
import { LEADS, MANAGERS, UNASSIGNED, managerRows } from "@/data/staff-team";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";

// Session-only assignment store shared by the staff screens (Clients, Managers, client record, Leads).
// Ported from reference/old-patch/admin/assign.js: an assignment is kept for the session and every screen re-renders.

type Store = { managers: Record<string, string>; leads: Record<string, string>; tasks: Record<string, string> };
let store: Store = { managers: {}, leads: {}, tasks: {} };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};
const snap = () => store;
const EMPTY: Store = { managers: {}, leads: {}, tasks: {} };

export function useAssignments() {
  return React.useSyncExternalStore(subscribe, snap, () => EMPTY);
}

export function assignManager(clientId: string, manager: string) {
  store = { ...store, managers: { ...store.managers, [clientId]: manager } };
  emit();
}

export function assignLead(clientId: string, lead: string) {
  store = { ...store, leads: { ...store.leads, [clientId]: lead } };
  emit();
}

/** Reassign one task to another project lead. */
export function reassignTask(taskId: string, lead: string) {
  store = { ...store, tasks: { ...store.tasks, [taskId]: lead } };
  emit();
}

export const managerOf = (c: StaffClient, s: Store) => s.managers[c.id] ?? c.manager;
export const leadOf = (c: StaffClient, s: Store) => s.leads[c.id] ?? c.lead;
export const taskOwner = (t: { id: string; owner: string }, s: Store) => s.tasks[t.id] ?? t.owner;

/** One dialog for the admin's assign actions: a whole client to a manager, or one task to a manager. */
export function AssignDialog({
  open,
  onOpenChange,
  mode,
  clientId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "client" | "task";
  clientId?: string;
  onDone?: (text: string) => void;
}) {
  const s = useAssignments();
  const options = [
    ...UNASSIGNED.map((u) => ({ value: u.id, label: `${u.name} · no manager` })),
    ...STAFF_CLIENTS.map((c) => ({ value: c.id, label: `${c.short} · ${managerOf(c, s)}` })),
  ];
  const [cid, setCid] = React.useState(clientId ?? options[0].value);
  const cur = STAFF_CLIENTS.find((c) => c.id === cid);
  const [mgr, setMgr] = React.useState("");
  const [task, setTask] = React.useState("");
  const [due, setDue] = React.useState("2026-10-19");
  React.useEffect(() => {
    if (!open) return;
    const id = clientId ?? options[0].value;
    setCid(id);
    const c = STAFF_CLIENTS.find((x) => x.id === id);
    setMgr(c ? managerOf(c, s) : "");
    setTask("");
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId]);
  const rows = managerRows();
  const name = cur?.short ?? UNASSIGNED.find((u) => u.id === cid)?.name ?? "";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={mode === "client" ? "Assign a client to a manager" : "Assign a task to a manager"}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!mgr}
            onClick={() => {
              if (mode === "client") {
                assignManager(cid, mgr);
                onDone?.(`${name} is now with ${mgr}`);
              } else onDone?.(`Assigned to ${mgr}: ${task.trim() || "New task"} · ${name}`);
              onOpenChange(false);
            }}
          >
            Assign
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Client">
          <Select
            size="md"
            className="w-full [&>select]:w-full"
            value={cid}
            onChange={(e) => {
              setCid(e.target.value);
              const c = STAFF_CLIENTS.find((x) => x.id === e.target.value);
              setMgr(c ? managerOf(c, s) : "");
            }}
            options={options}
            aria-label="Client"
          />
        </Field>
        {mode === "client" ? (
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-12.5 font-medium text-muted">Manager</legend>
            <div role="radiogroup" aria-label="Manager" className="grid gap-2">
              {rows.map((m) => (
                <label key={m.name} className={cn("flex cursor-pointer items-center gap-3 rounded-md border-1.5 px-3 py-2.5", mgr === m.name ? "border-accent-mid bg-accent-soft" : "border-line hover:bg-hover")}>
                  <input type="radio" name="assign-manager" value={m.name} checked={mgr === m.name} onChange={() => setMgr(m.name)} className="accent-[var(--primary)]" />
                  <Avatar name={m.name} size={30} />
                  <span className="min-w-0 flex-1">
                    <b className="block text-14 font-medium">{m.name}</b>
                    <span className="block text-12.5 text-muted">
                      {m.clients} clients · {m.open} open · {m.overdue} late
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <>
            <Field label="Task">
              <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Review the FC-GPR draft" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Manager">
                <Select size="md" className="w-full [&>select]:w-full" value={mgr} onChange={(e) => setMgr(e.target.value)} options={[{ value: "", label: "Pick a manager" }, ...MANAGERS.map((m) => ({ value: m.name, label: m.name }))]} aria-label="Manager" />
              </Field>
              <Field label="Due">
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </Field>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/** Reassign a task or a client to another project lead (manager portal). */
export function ReassignDialog({
  open,
  onOpenChange,
  title,
  from,
  manager = "Pranay",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  from: string;
  manager?: string;
  onConfirm: (lead: string, note: string) => void;
}) {
  const leads = LEADS.filter((l) => l.manager === manager && l.name !== from);
  const [to, setTo] = React.useState("");
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setTo("");
      setNote("");
    }
  }, [open]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="Reassign"
      sub={
        <span className="truncate">
          {title} · now with {from}
        </span>
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!to}
            onClick={() => {
              onConfirm(to, note);
              onOpenChange(false);
            }}
          >
            Reassign
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <fieldset>
          <legend className="mb-1.5 text-12.5 font-medium text-muted">Project lead</legend>
          <div role="radiogroup" aria-label="Project lead" className="grid gap-2">
            {leads.map((l) => (
              <label key={l.name} className={cn("flex cursor-pointer items-center gap-3 rounded-md border-1.5 px-3 py-2", to === l.name ? "border-accent-mid bg-accent-soft" : "border-line hover:bg-hover")}>
                <input type="radio" name="reassign-lead" checked={to === l.name} onChange={() => setTo(l.name)} className="accent-[var(--primary)]" />
                <Avatar name={l.name} size={24} />
                <span className="min-w-0 flex-1 text-14 font-medium">{l.name}</span>
                <span className="text-12.5 text-muted">{l.hours} h this week</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Note to the project lead">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sneha Kulkarni is on leave Thursday" />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------- ST5: phase track and step list (R-22, Steps.dc.html) ---------- */

const PHASE_LABEL = ["Name application", "Incorporation", "Post-incorporation", "Registrations"];
/** Step range of each phase. K-27: step codes are "Step 7", registrations "Reg-1". */
const PHASE_RANGE = ["Steps 1–5", "Steps 6–14", "Steps 15–25", "Reg-1–23"];

/** Index of the current phase: the first one with steps left. */
export const curPhaseOf = (c: StaffClient) => {
  const i = c.phases.findIndex((n, k) => n < PHASE_TOTALS[k]);
  return i < 0 ? 3 : i;
};

/**
 * ST5 phase track: four bars sized by step count. Done green, current blurple with a soft ring, next grey.
 * Name above, "5/5 · Steps 1–5" below. A bar picks the phase the step list shows.
 */
export function PhaseTrack({ c, picked, onPick }: { c: StaffClient; picked: number; onPick: (i: number) => void }) {
  const cur = curPhaseOf(c);
  return (
    <div className="grid gap-2">
      <div className="flex gap-2" role="group" aria-label="Phases">
        {PHASE_TOTALS.map((t, i) => {
          const done = c.phases[i];
          const full = done >= t;
          const isCur = i === cur && !full;
          const pct = Math.round((done / t) * 100);
          return (
            <button
              key={i}
              type="button"
              aria-pressed={picked === i}
              aria-label={`${PHASE_LABEL[i]} · ${done} of ${t}`}
              onClick={() => onPick(i)}
              style={{ flex: `${t} 1 0` }}
              className={cn("-m-1 flex min-w-0 flex-col gap-[7px] rounded-md p-1 text-left hover:bg-hover", picked === i && "bg-hover")}
            >
              <span className={cn("hidden truncate text-13 font-medium md:block", full || isCur ? "text-ink" : "text-muted")}>{PHASE_LABEL[i]}</span>
              <span className={cn("relative block h-2.5 overflow-hidden rounded-bar bg-raised", isCur && "shadow-[0_0_0_1.5px_var(--accent-line)]")}>
                {(full || isCur || pct > 0) && <i className={cn("absolute inset-y-0 left-0 rounded-bar", full ? "bg-ok-mid" : isCur ? "bg-primary" : "bg-faint")} style={{ width: full ? "100%" : `max(${pct}%, 6px)` }} />}
              </span>
              <span className="hidden min-w-0 items-baseline gap-1.5 whitespace-nowrap md:flex">
                <span className={cn("text-12 font-medium", full ? "text-ok" : isCur ? "text-accent" : "text-muted")}>
                  {done}/{t}
                </span>
                <span className="truncate text-11.5 text-muted">{PHASE_RANGE[i]}</span>
              </span>
            </button>
          );
        })}
      </div>
      {/* Phone: the picked phase under the four bars. */}
      <p className="text-13 md:hidden">
        <b className="font-medium">{PHASE_LABEL[picked]}</b>
        <span className="text-muted">
          {" "}
          · {c.phases[picked]}/{PHASE_TOTALS[picked]} · {PHASE_RANGE[picked]}
        </span>
      </p>
    </div>
  );
}

const LIVE_TONE: Record<string, StepTone> = { Waiting: "teal", "Sent back": "bad", "In progress": "prog" };
const SUB_TONE: Record<string, string> = { Waiting: "text-teal", "Sent back": "text-bad" };

/**
 * ST5 step list of one phase. Done: green square with a tick. Live: a ring with a status square and a soft halo, the row tinted;
 * it says who holds it, shows the lead's face and the 104 px status chip. Upcoming: a dashed square.
 */
export function StepList({ c, phase, hrefFor, onAbout }: { c: StaffClient; phase: 1 | 2 | 3; hrefFor: (n: number) => string; onAbout?: (n: number) => void }) {
  const s = useAssignments();
  const lead = leadOf(c, s);
  const steps = STEPS.filter((x) => x.phase === phase);
  return (
    <ol className="flex flex-col">
      {steps.map((x, k) => {
        const st = stepState(c, x.n);
        const state = st.status === "Completed" ? "done" : st.status === "Upcoming" ? "next" : "now";
        const holder = x.owner === "client" ? c.short : x.owner === "mca" ? "MCA" : "SBC";
        const sub = state === "done" ? (st.done ? `Done ${fmt(st.done)}` : "Done") : state === "now" ? (st.status === "Waiting" ? `With ${holder} · ${c.days} days` : st.to ? `Due ${fmt(st.to)}` : x.time) : x.time;
        return (
          <li key={x.n} className={cn("relative -mx-2.5 flex items-center gap-3 rounded-md px-2.5 py-2", state === "now" && "bg-hover")}>
            {k < steps.length - 1 && <span className={cn("absolute bottom-[-6px] left-[20.25px] top-[30px] w-[1.5px]", state === "done" ? "bg-ok-mid" : "bg-line")} aria-hidden />}
            <StepMark state={state} tone={LIVE_TONE[st.status] ?? "prog"} className="relative z-[1]" label={st.status} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="flex-none font-mono text-12 text-muted">Step {x.n}</span>
                <Link href={hrefFor(x.n)} className={cn("min-w-0 truncate text-14 after:absolute after:inset-0 hover:underline", state === "now" ? "font-medium text-ink" : state === "done" ? "text-ink" : "text-ink-2")}>
                  {x.title}
                </Link>
                {onAbout && (
                  <button type="button" onClick={() => onAbout(x.n)} className="relative z-[1] hidden flex-none whitespace-nowrap text-12 font-medium text-accent hover:underline sm:inline">
                    What&apos;s this?
                  </button>
                )}
              </span>
              <span className={cn("truncate text-12.5", (state === "now" && SUB_TONE[st.status]) || "text-muted")}>{sub}</span>
            </span>
            <span className="flex flex-none items-center gap-3">
              {state === "now" && (
                <span className="hidden items-center gap-1.5 text-12.5 text-muted md:inline-flex">
                  <Avatar name={lead} size={24} />
                  {lead}
                </span>
              )}
              {state === "next" ? (
                <span className="hidden w-[104px] sm:block" aria-hidden />
              ) : (
                <Chip tone={state === "done" ? "ok" : undefined} fixed>
                  {st.status}
                </Chip>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
