"use client";
import * as React from "react";
import { CalendarDays } from "lucide-react";
import { fmt, fmtYear, daysFrom } from "@/lib/dates";
import { NON_STATUTORY, activity } from "@/data/activity-master";
import { REPEATS, URGENCIES, WEEK_GROUPS, taskWord, weekOf, type NsTask, type Repeats, type TaskUrgency, type Visibility } from "@/data/compliance-tasks";
import { REG_CLIENTS } from "@/data/staff-regs-table";
import { LEADS, MANAGERS } from "@/data/staff-team";
import { PORTALS } from "@/data/nav";
import { type Column } from "@/components/cards/DataGrid";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip, toneFor } from "@/components/ui/Chip";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { UrgencyPill, VisibilityTag } from "@/components/ui/TaskMarks";
import { type GridGroup } from "./register-parts";

// Non-statutory parts of the Obligations pages (docs/COMPLIANCE-MODEL.md S-1, S-3 to S-5, S-8 and K-1).
// The staff screen and the client screen share the table; only staff managers and admins see the New task dialog.

/* ---------- Category switch (S-1, K-1) ---------- */

export type Cat = "stat" | "ns" | "all";

export function CategoryTabs({ value, onChange, stat, ns }: { value: Cat; onChange: (c: Cat) => void; stat: number; ns: number }) {
  return (
    <Tabs
      items={[
        { key: "stat", label: "Statutory", count: stat },
        { key: "ns", label: "Non-statutory", count: ns },
        { key: "all", label: "All", count: stat + ns },
      ]}
      value={value}
      onChange={(k) => onChange(k as Cat)}
    />
  );
}

/* ---------- Filters (S-8) ---------- */

/** The number strip keys. Statutory rows use the same keys, so a picked tile stays picked across categories. */
export type Fil = "" | "bad" | "soon" | "wait" | "done" | "none";

export function nsMatch(t: NsTask, f: Fil, today: Date) {
  const w = taskWord(t, today);
  if (f === "bad") return w === "Overdue";
  if (f === "soon") return w !== "Overdue" && w !== "Done" && weekOf(t, today) === "This week";
  if (f === "wait") return w === "Waiting";
  if (f === "done") return w === "Done";
  if (f === "none") return (t.stage === "not-started" || t.stage === "ready") && w !== "Overdue";
  return true;
}

/* ---------- Table (S-3) ---------- */

export const clientLabel = (id: string) => REG_CLIENTS.find((c) => c.id === id)?.name ?? id;

/** Rows group by end-date week: This week, Next week, Later, Done. */
export function nsGroups(tasks: NsTask[], today: Date): GridGroup<NsTask>[] {
  const sorted = [...tasks].sort((a, b) => a.end.getTime() - b.end.getTime());
  return WEEK_GROUPS.map((g) => ({
    id: g,
    label: g,
    dot: g === "Done" ? "bg-ok-mid" : g === "This week" ? "bg-warn-mid" : "bg-accent-mid",
    rows: g === "Done" ? sorted.filter((t) => weekOf(t, today) === g).reverse() : sorted.filter((t) => weekOf(t, today) === g),
  }));
}

/** T1 columns. The client view shows the activity under the name in place of the client, and no reviewer. Phones keep Task, End and Status. */
export function nsColumns(today: Date, who: "staff" | "client"): Column<NsTask>[] {
  return [
    {
      key: "task",
      label: "Task",
      // max-width 0 lets the name truncate instead of pushing Status out of the card.
      className: "w-full max-w-0",
      render: (t) => (
        <span className="block min-w-0">
          <b className="block truncate text-14 font-medium text-ink" title={t.name}>
            {t.name}
          </b>
          <span className="block truncate text-12.5 text-muted">{who === "staff" ? clientLabel(t.client) : (activity(t.activityId)?.module ?? "")}</span>
        </span>
      ),
    },
    { key: "start", label: "Start", width: 68, className: "hidden md:table-cell", render: (t) => <span className="whitespace-nowrap text-muted">{fmt(t.start)}</span> },
    {
      key: "end",
      label: "End",
      width: 68,
      render: (t) => {
        const late = taskWord(t, today) === "Overdue";
        return (
          <span className={late ? "whitespace-nowrap font-medium text-bad" : "whitespace-nowrap text-ink-2"} title={late ? `${-daysFrom(t.end, today)} days late` : undefined}>
            {fmt(t.end)}
          </span>
        );
      },
    },
    { key: "urgency", label: "Urgency", width: 108, className: "hidden md:table-cell", render: (t) => <UrgencyPill urgency={t.urgency} /> },
    ...(who === "staff"
      ? [{ key: "vis", label: "Visibility", width: 96, className: "hidden lg:table-cell", render: (t: NsTask) => <VisibilityTag visibility={t.visibility} /> }]
      : []),
    {
      key: "owner",
      label: who === "staff" ? "Owner" : "With",
      width: 112,
      className: "hidden md:table-cell",
      // First name only: the table is tight beside the rail. The full name is the tooltip.
      render: (t) => (
        <span className="inline-flex min-w-0 max-w-full items-center gap-2" title={t.owner}>
          <Avatar name={t.owner} size={24} />
          <span className="truncate">{t.owner.split(" ")[0]}</span>
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: 124,
      render: (t) => {
        const w = taskWord(t, today);
        return (
          <Chip tone={toneFor(w)} fixed>
            {w}
          </Chip>
        );
      },
    },
  ];
}

/* ---------- New task dialog (S-4, S-5) ---------- */

const OTHER = "other";
const VIS_OPTIONS: Array<{ value: Visibility; label: string }> = [
  { value: "firm", label: "Firm only" },
  { value: "client", label: "Client only" },
  { value: "both", label: "Both" },
];
const OWNERS = [...LEADS.map((l) => l.name), ...MANAGERS.map((m) => m.name)];
const REVIEWERS = [...MANAGERS.map((m) => m.name), PORTALS.admin.person];

/** "2026-10-16" for a date input. */
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const plain = (s: string) => (s ? fmtYear(fromIso(s)) : "");
/** "16 Oct 2026", "16 october" (this year) or "16/10/2026" to "2026-10-16". */
function parsePlain(t: string): string | undefined {
  const m = t.trim().match(/^(\d{1,2})[\s/-]+([a-z]{3,}|\d{1,2})[\s/-]*(\d{4})?$/i);
  if (!m) return undefined;
  const mi = /^\d+$/.test(m[2]) ? Number(m[2]) - 1 : MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
  const dt = new Date(m[3] ? Number(m[3]) : 2026, mi, Number(m[1]));
  return mi < 0 || mi > 11 || dt.getMonth() !== mi ? undefined : iso(dt);
}

/** R-29: the field shows "16 Oct 2026". Typing a date works; the button opens the browser's picker. */
function DateField({ label, value, onChange, min, invalid }: { label: string; value: string; onChange: (v: string) => void; min?: string; invalid?: boolean }) {
  const pick = React.useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState(plain(value));
  React.useEffect(() => setText(plain(value)), [value]);
  return (
    <span className="relative block">
      <Input
        aria-label={label}
        value={text}
        placeholder="16 Oct 2026"
        aria-invalid={invalid}
        className="pr-10"
        onChange={(ev) => {
          setText(ev.target.value);
          const v = parsePlain(ev.target.value);
          if (v) onChange(v);
          else if (!ev.target.value.trim()) onChange("");
        }}
        onBlur={() => setText(plain(value))}
      />
      <button
        type="button"
        aria-label={`Pick the ${label.toLowerCase()}`}
        onClick={() => {
          try {
            pick.current?.showPicker();
          } catch {
            pick.current?.focus();
          }
        }}
        className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
      >
        <CalendarDays size={16} strokeWidth={1.6} aria-hidden />
      </button>
      <input
        ref={pick}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={value}
        min={min}
        onChange={(ev) => onChange(ev.target.value)}
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
      />
    </span>
  );
}

interface Form {
  act: string;
  name: string;
  client: string;
  start: string;
  end: string;
  urgency: TaskUrgency;
  vis: Visibility;
  owner: string;
  reviewer: string;
  repeats: Repeats;
  notify: string;
}

const REPEAT_OF: Record<string, Repeats> = { Weekly: "Weekly", "Bi-weekly": "Bi-weekly", Monthly: "Monthly", Quarterly: "Quarterly", Yearly: "Yearly" };

/** M2 short form. Esc closes (Radix). Enter in a field saves. */
export function NewTaskDialog({
  open,
  onOpenChange,
  today,
  defaultClient,
  ownerOf,
  onCreate,
  by,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  today: Date;
  defaultClient: string;
  /** Default owner and reviewer of a client: its lead and manager. */
  ownerOf: (client: string) => [string, string];
  onCreate: (t: NsTask) => void;
  by: string;
}) {
  const blank = React.useCallback((): Form => {
    const [owner, reviewer] = defaultClient ? ownerOf(defaultClient) : ["", "Pranay"];
    return {
      act: "",
      name: "",
      client: defaultClient,
      start: iso(today),
      end: "",
      urgency: "Medium",
      vis: "both",
      owner,
      reviewer,
      repeats: "One-time",
      notify: "5",
    };
  }, [defaultClient, ownerOf, today]);
  const [f, setF] = React.useState<Form>(blank);
  const [tried, setTried] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setF(blank());
      setTried(false);
    }
  }, [open, blank]);
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));

  const pickAct = (id: string) => {
    if (!id) return set({ act: "" });
    const a = activity(id === OTHER ? "ACT-013" : id)!;
    set({ act: id, vis: a.visibility, repeats: id === OTHER ? "One-time" : (REPEAT_OF[a.frequency] ?? "One-time"), notify: String(a.notifyDays) });
  };
  const pickClient = (id: string) => {
    const [owner, reviewer] = id ? ownerOf(id) : ["", f.reviewer];
    set({ client: id, owner: owner || f.owner, reviewer: reviewer || f.reviewer });
  };

  const err = {
    act: !f.act ? "Pick an activity" : undefined,
    name: f.act === OTHER && !f.name.trim() ? "Give the task a name" : undefined,
    client: !f.client ? "Pick a client" : undefined,
    start: !f.start ? "Pick a start date" : undefined,
    end: !f.end ? "Pick an end date" : f.start && f.end < f.start ? "End on or after the start" : undefined,
    owner: !f.owner ? "Pick an owner" : undefined,
  };
  const ok = !Object.values(err).some(Boolean);

  const save = () => {
    setTried(true);
    if (!ok) return;
    const a = activity(f.act === OTHER ? "ACT-013" : f.act)!;
    const name = f.act === OTHER ? f.name.trim() : f.name.trim() || a.name;
    const start = fromIso(f.start);
    onCreate({
      id: `ns-new-${Date.now()}`,
      activityId: a.id,
      name,
      client: f.client,
      start,
      end: fromIso(f.end),
      urgency: f.urgency,
      visibility: f.vis,
      owner: f.owner,
      reviewer: f.reviewer,
      stage: "not-started",
      repeats: f.repeats,
      notifyDays: Math.max(0, Number(f.notify) || a.notifyDays),
      checklist: [],
      attachments: [],
      comments: [],
      history: [{ when: fmt(today), who: by, what: `Created the task · ${f.urgency}` }],
      createdBy: by,
    });
    onOpenChange(false);
  };

  const e = (k: keyof typeof err) => (tried ? err[k] : undefined);
  const opts = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New task"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="new-task">
            Create task
          </Button>
        </>
      }
    >
      <form
        id="new-task"
        noValidate
        onSubmit={(ev) => {
          ev.preventDefault();
          save();
        }}
        onKeyDown={(ev) => {
          // Enter in a select does not submit natively.
          if (ev.key === "Enter" && (ev.target as HTMLElement).tagName === "SELECT") {
            ev.preventDefault();
            save();
          }
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Field label="Activity" className="sm:col-span-2" error={e("act")}>
          <Select
            aria-label="Activity"
            size="md"
            className="w-full [&>select]:w-full"
            value={f.act}
            onChange={(ev) => pickAct(ev.target.value)}
            aria-invalid={!!e("act")}
            options={[
              { value: "", label: "Pick an activity" },
              ...NON_STATUTORY.filter((a) => a.kind === "Non-statutory").map((a) => ({ value: a.id, label: a.name })),
              { value: "divider", label: "──────────", disabled: true },
              ...NON_STATUTORY.filter((a) => a.kind !== "Non-statutory").map((a) => ({ value: a.id, label: a.name })),
              { value: OTHER, label: "Other…" },
            ]}
          />
        </Field>
        {f.act === OTHER ? (
          <Field label="Task name" className="sm:col-span-2" error={e("name")}>
            <Input
              aria-label="Task name"
              value={f.name}
              onChange={(ev) => set({ name: ev.target.value })}
              aria-invalid={!!e("name")}
              placeholder="Board pack for the Q3 meeting"
              autoFocus
            />
          </Field>
        ) : (
          <Field label="Task name" className="sm:col-span-2">
            <Input aria-label="Task name" value={f.name} onChange={(ev) => set({ name: ev.target.value })} placeholder={activity(f.act)?.name} />
          </Field>
        )}
        <Field label="Client" className="sm:col-span-2" error={e("client")}>
          <Select
            aria-label="Client"
            size="md"
            className="w-full [&>select]:w-full"
            aria-invalid={!!e("client")}
            value={f.client}
            onChange={(ev) => pickClient(ev.target.value)}
            options={[{ value: "", label: "Pick a client" }, ...REG_CLIENTS.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </Field>
        <Field label="Start date" error={e("start")}>
          <DateField label="Start date" value={f.start} onChange={(v) => set({ start: v })} invalid={!!e("start")} />
        </Field>
        <Field label="End date" error={e("end")}>
          <DateField label="End date" value={f.end} min={f.start || undefined} onChange={(v) => set({ end: v })} invalid={!!e("end")} />
        </Field>
        <Field label="Urgency">
          <Select
            aria-label="Urgency"
            size="md"
            className="w-full [&>select]:w-full"
            value={f.urgency}
            onChange={(ev) => set({ urgency: ev.target.value as TaskUrgency })}
            options={opts(URGENCIES)}
          />
        </Field>
        <Field label="Visible to">
          <Select
            aria-label="Visible to"
            size="md"
            className="w-full [&>select]:w-full"
            value={f.vis}
            onChange={(ev) => set({ vis: ev.target.value as Visibility })}
            options={VIS_OPTIONS}
          />
        </Field>
        <Field label="Owner" error={e("owner")}>
          <Select
            aria-label="Owner"
            size="md"
            className="w-full [&>select]:w-full"
            value={f.owner}
            onChange={(ev) => set({ owner: ev.target.value })}
            options={[{ value: "", label: "Pick an owner" }, ...opts(OWNERS)]}
          />
        </Field>
        <Field label="Reviewer">
          <Select
            aria-label="Reviewer"
            size="md"
            className="w-full [&>select]:w-full"
            value={f.reviewer}
            onChange={(ev) => set({ reviewer: ev.target.value })}
            options={opts(REVIEWERS)}
          />
        </Field>
        <Field label="Repeats">
          <Select
            aria-label="Repeats"
            size="md"
            className="w-full [&>select]:w-full"
            value={f.repeats}
            onChange={(ev) => set({ repeats: ev.target.value as Repeats })}
            options={opts(REPEATS)}
          />
        </Field>
        <Field label="Remind before (days)">
          <Input aria-label="Remind before (days)" type="number" min={0} max={60} inputMode="numeric" value={f.notify} onChange={(ev) => set({ notify: ev.target.value })} />
        </Field>
      </form>
    </Modal>
  );
}
