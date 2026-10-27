"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { FIRM_CLIENTS, type FirmClient } from "@/data/super";
import { MANAGER_ROWS } from "@/data/super-firm";

// The admin's one action: assign a client to a manager (old reference/old-screens/s/super/assign.js).
// Prototype only: an assignment lives for the browser tab and every super screen reads it.

const KEY = "vcfo.super.assign";
const EVENT = "vcfo:super-assign";

function read(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

/** Manager overrides by client id, kept in sessionStorage. */
export function useAssignments() {
  const [map, setMap] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    setMap(read());
    const on = () => setMap(read());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  const assign = React.useCallback((clientId: string, manager: string) => {
    const next = { ...read(), [clientId]: manager };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: keep it for this render only */
    }
    setMap(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const managerOf = React.useCallback((c: FirmClient) => map[c.id] ?? c.manager, [map]);
  return { map, assign, managerOf };
}

export interface AssignDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Client picked when the dialog opens. */
  clientId?: string;
  /** A won prospect that is not a client yet, for example "Lotus Dental". */
  newClient?: string;
  /** "client" assigns the whole engagement. "task" assigns one piece of work. */
  mode?: "client" | "task";
  onDone?: (message: string) => void;
}

const NEW = "__new";

export function AssignDialog({ open, onOpenChange, clientId, newClient, mode = "client", onDone }: AssignDialogProps) {
  const { assign, managerOf } = useAssignments();
  const [client, setClient] = React.useState(clientId ?? (newClient ? NEW : FIRM_CLIENTS[0].id));
  const [manager, setManager] = React.useState("");
  const [task, setTask] = React.useState("");
  const [due, setDue] = React.useState("2026-10-13");

  React.useEffect(() => {
    if (!open) return;
    const id = clientId ?? (newClient ? NEW : FIRM_CLIENTS[0].id);
    setClient(id);
    const c = FIRM_CLIENTS.find((x) => x.id === id);
    setManager(c ? managerOf(c) : "");
    setTask("");
  }, [open, clientId, newClient, managerOf]);

  const pick = (id: string) => {
    setClient(id);
    const c = FIRM_CLIENTS.find((x) => x.id === id);
    setManager(c ? managerOf(c) : "");
  };

  const name = client === NEW ? newClient ?? "New client" : FIRM_CLIENTS.find((c) => c.id === client)?.name ?? "";
  const options = [
    ...(newClient ? [{ value: NEW, label: `${newClient} · no manager` }] : []),
    ...FIRM_CLIENTS.map((c) => ({ value: c.id, label: `${c.short} · ${managerOf(c)}` })),
  ];

  function confirm() {
    if (!manager) return;
    if (mode === "client") {
      if (client !== NEW) assign(client, manager);
      onDone?.(`${name} is now with ${manager}`);
    } else {
      onDone?.(`Assigned to ${manager}: ${task.trim() || "New task"} · ${name}`);
    }
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "client" ? "Assign a client to a manager" : "Assign a task to a manager"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirm} disabled={!manager}>
            Assign
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Client">
          <Select aria-label="Client" size="md" value={client} onChange={(e) => pick(e.target.value)} options={options} className="w-full [&>select]:w-full" />
        </Field>
        {mode === "task" && (
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <Field label="Task">
              <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Review the FC-GPR draft" />
            </Field>
            <Field label="Due">
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
        )}
        <fieldset>
          <legend className="mb-1.5 text-12 text-muted">Manager</legend>
          <div role="radiogroup" aria-label="Manager" className="grid gap-2 sm:grid-cols-2">
            {MANAGER_ROWS.map((m) => {
              const on = manager === m.name;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setManager(m.name)}
                  className={cn("flex min-w-0 items-center gap-2.5 rounded-md border px-3 py-2.5 text-left", on ? "border-accent bg-accent-soft" : "border-line hover:bg-raised")}
                >
                  <Avatar name={m.name} size={30} />
                  <span className="min-w-0">
                    <span className="block truncate text-13.5 font-semibold">{m.name}</span>
                    <span className="block truncate text-12 text-muted">
                      {m.clients} clients · {m.open} open · {m.late} late
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}
