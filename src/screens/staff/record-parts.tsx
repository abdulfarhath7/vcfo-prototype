"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { STAFF_CLIENTS, type StaffClient } from "@/data/staff-clients";
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
            <legend className="mb-1.5 text-12.5 font-semibold text-muted">Manager</legend>
            <div role="radiogroup" aria-label="Manager" className="grid gap-2">
              {rows.map((m) => (
                <label key={m.name} className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5", mgr === m.name ? "border-navy bg-raised" : "border-line hover:bg-raised")}>
                  <input type="radio" name="assign-manager" value={m.name} checked={mgr === m.name} onChange={() => setMgr(m.name)} className="accent-[var(--navy)]" />
                  <Avatar name={m.name} size={30} />
                  <span className="min-w-0 flex-1">
                    <b className="block text-13.5 font-semibold">{m.name}</b>
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
          <legend className="mb-1.5 text-12.5 font-semibold text-muted">Project lead</legend>
          <div role="radiogroup" aria-label="Project lead" className="grid gap-2">
            {leads.map((l) => (
              <label key={l.name} className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2", to === l.name ? "border-navy bg-raised" : "border-line hover:bg-raised")}>
                <input type="radio" name="reassign-lead" checked={to === l.name} onChange={() => setTo(l.name)} className="accent-[var(--navy)]" />
                <Avatar name={l.name} size={24} />
                <span className="min-w-0 flex-1 text-13.5 font-semibold">{l.name}</span>
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
