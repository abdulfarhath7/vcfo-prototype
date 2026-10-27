"use client";
import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Plus, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, d, fmt } from "@/lib/dates";
import { TASKS, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { leadRows, type LeadRow } from "@/data/staff-team";
import { STAFF_CLIENTS, clientById } from "@/data/staff-clients";
import { Row } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Bar } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Chevron } from "@/components/ui/Chevron";
import { Checkbox, Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty, HeadLink } from "@/components/cards/SectionCard";
import { StackedBar, type Segment } from "@/components/cards/StackedBar";
import { GanttTimeline, type GanttRow } from "@/components/cards/GanttTimeline";
import { WeekList, type WeekRow } from "@/components/cards/WeekList";
import { ClientDot, TaskChip, taskHref, clientHref, base, type StaffPortal } from "./parts";
import { ReassignDialog, reassignTask, taskOwner, useAssignments, leadOf } from "./record-parts";

// Manager portal: Pranay's project leads. Ported from reference/old-screens/s/mgr/Leads.dc.html:
// picked lead with status and area split, to-do with assign, timeline, week calendar; every lead expands to clients and open tasks.

const ORDER: TaskStatus[] = ["Overdue", "Due this week", "In progress", "With client", "Not started", "Done"];
const SEG_TONE = { Overdue: "bad", "Due this week": "warn", "In progress": "accent", "With client": "violet", "Not started": "idle", Done: "ok" } as const;

/** R-25: the old status donut becomes one stacked bar with a legend. */
export function statusSegments(tasks: StaffTask[]): Segment[] {
  return ORDER.map((s) => ({ label: s, value: tasks.filter((t) => t.status === s).length, tone: SEG_TONE[s] }));
}

export function AreaRows({ tasks }: { tasks: StaffTask[] }) {
  const areas = [...new Set(tasks.map((t) => t.area))];
  if (areas.length === 0) return <Empty />;
  return (
    <ul className="grid gap-3">
      {areas.map((a) => {
        const l = tasks.filter((t) => t.area === a);
        const done = l.filter((t) => t.status === "Done").length;
        const late = l.filter((t) => t.status === "Overdue").length;
        const pend = l.length - done - late;
        const w = (n: number) => `${(n / l.length) * 100}%`;
        return (
          <li key={a} className="grid grid-cols-[96px_minmax(0,1fr)_40px] items-center gap-3 text-13" title={`${a}: ${done} done, ${pend} pending, ${late} overdue`}>
            <span className="truncate">{a}</span>
            <span className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-line-soft">
              {done > 0 && <i className="block bg-ok-mid" style={{ width: w(done) }} />}
              {pend > 0 && <i className="block bg-warn-mid" style={{ width: w(pend) }} />}
              {late > 0 && <i className="block bg-bad-mid" style={{ width: w(late) }} />}
            </span>
            <span className="text-right font-mono text-12 text-muted">
              {done}/{l.length}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function AreaLegend() {
  const sw = (cls: string, t: string) => (
    <span className="inline-flex items-center gap-1.5">
      <i className={cn("h-[7px] w-[7px] rounded-[2px]", cls)} aria-hidden />
      {t}
    </span>
  );
  return (
    <span className="hidden items-center gap-3 text-12 text-muted sm:flex">
      {sw("bg-ok-mid", "Done")}
      {sw("bg-warn-mid", "Pending")}
      {sw("bg-bad-mid", "Overdue")}
    </span>
  );
}

const loadTone = (n: number) => (n > 95 ? "bad" : n > 80 ? "warn" : "accent");

/** Leads that expand to their clients and open tasks. Each task can move to another lead. */
export function LeadExpandList({ portal, leads, manager, title = "Project leads" }: { portal: StaffPortal; leads: LeadRow[]; manager: string; title?: string }) {
  const s = useAssignments();
  const [open, setOpen] = React.useState<string | null>(null);
  const [move, setMove] = React.useState<StaffTask | null>(null);
  const toast = useUndoToast();
  const maxOpen = Math.max(1, ...leads.map((l) => TASKS.filter((t) => taskOwner(t, s) === l.name && t.status !== "Done").length));
  return (
    <SectionCard title={title} meta={String(leads.length)} flush>
      <div className="hidden grid-cols-[minmax(0,1fr)_64px_64px_140px_16px] gap-3 bg-raised px-5 py-1.5 text-12 font-semibold text-muted md:grid">
        <span>Project lead</span>
        <span className="text-right">Open</span>
        <span className="text-right">Late</span>
        <span>Load</span>
        <span />
      </div>
      {leads.map((l) => {
        const mine = TASKS.filter((t) => taskOwner(t, s) === l.name);
        const openTasks = mine.filter((t) => t.status !== "Done").sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.due.getTime() - b.due.getTime());
        const late = openTasks.filter((t) => t.status === "Overdue").length;
        const clients = STAFF_CLIENTS.filter((c) => leadOf(c, s) === l.name || mine.some((t) => t.client === c.id));
        const isOpen = open === l.name;
        return (
          <div key={l.name} className="border-t border-line-soft first:border-t-0">
            <button type="button" onClick={() => setOpen(isOpen ? null : l.name)} aria-expanded={isOpen} className="grid w-full grid-cols-[minmax(0,1fr)_48px_16px] items-center gap-3 px-4 py-3 text-left text-13.5 hover:bg-raised md:grid-cols-[minmax(0,1fr)_64px_64px_140px_16px] md:px-5">
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={l.name} size={30} />
                <span className="min-w-0">
                  <b className="block truncate font-semibold">{l.name}</b>
                  <span className="block truncate text-12.5 text-muted">{clients.length ? clients.map((c) => c.short).join(", ") : "No client yet"}</span>
                </span>
              </span>
              <span className="text-right font-semibold">{openTasks.length}</span>
              <span className={cn("hidden text-right md:block", late ? "font-semibold text-bad" : "text-muted")}>{late}</span>
              <span className="hidden h-2 overflow-hidden rounded-full bg-line-soft md:flex">
                <i className="block bg-bad-mid" style={{ width: `${(late / maxOpen) * 100}%` }} />
                <i className="block bg-accent" style={{ width: `${((openTasks.length - late) / maxOpen) * 100}%` }} />
              </span>
              <Chevron open={isOpen} />
            </button>
            {isOpen && (
              <div className="border-t border-line-soft bg-raised/50">
                <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 md:px-5">
                  <span className="text-12 font-semibold text-muted">Clients</span>
                  {clients.map((c) => (
                    <Link key={c.id} href={clientHref(portal, c.id)} className="inline-flex h-[22px] items-center gap-1.5 rounded-sm border border-line bg-surface px-2 text-12 font-semibold hover:bg-raised">
                      <ClientDot tone={c.tone} />
                      {c.short}
                    </Link>
                  ))}
                  <span className="ml-auto text-12 text-muted">
                    {l.hours} h planned · <Bar pct={l.load} tone={loadTone(l.load)} className="inline-block w-[60px] align-middle" />
                  </span>
                </div>
                {openTasks.length === 0 ? (
                  <Empty />
                ) : (
                  openTasks.map((t) => {
                    const c = clientById(t.client);
                    return (
                      <ListRow key={t.id} className="flex-wrap md:flex-nowrap">
                        {c && <ClientDot tone={c.tone} />}
                        <Link href={taskHref(portal, t)} className="min-w-0 flex-1 hover:underline">
                          <span className="block truncate font-semibold">{t.title}</span>
                          <span className="block truncate text-12.5 text-muted">
                            {c?.short}
                            {t.code ? ` · ${t.code}` : ""}
                          </span>
                        </Link>
                        <TaskChip status={t.status} />
                        <span className={cn("w-[52px] text-right text-12.5", t.status === "Overdue" ? "font-semibold text-bad" : "text-muted")}>{fmt(t.due)}</span>
                        <Button size="sm" variant="outline" onClick={() => setMove(t)}>
                          Reassign
                        </Button>
                      </ListRow>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
      <ReassignDialog
        open={!!move}
        onOpenChange={(v) => !v && setMove(null)}
        title={move?.title ?? ""}
        from={move ? taskOwner(move, s) : ""}
        manager={manager}
        onConfirm={(to) => {
          if (!move) return;
          const from = taskOwner(move, s);
          reassignTask(move.id, to);
          toast.show(`${move.title} moved to ${to}`, () => reassignTask(move.id, from));
        }}
      />
      {toast.node}
    </SectionCard>
  );
}

interface Todo {
  id: string;
  title: string;
  client: string;
  due: Date;
  done: boolean;
}

export function LeadsScreen({ portal }: { portal: StaffPortal }) {
  const s = useAssignments();
  const rows = leadRows("Pranay");
  const [pick, setPick] = React.useState(rows[0].name);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [quick, setQuick] = React.useState("");
  const [form, setForm] = React.useState({ title: "", client: "", due: "2026-10-09", lead: "" });
  const [reminded, setReminded] = React.useState<Set<string>>(new Set());
  const [show, setShow] = React.useState("open");
  const [clientF, setClientF] = React.useState("");
  const toast = useUndoToast();

  const lead = rows.find((l) => l.name === pick)!;
  const mine = TASKS.filter((t) => taskOwner(t, s) === pick);
  const open = mine.filter((t) => t.status !== "Done");
  const clients = STAFF_CLIENTS.filter((c) => leadOf(c, s) === pick || mine.some((t) => t.client === c.id));
  const list = mine
    .filter((t) => (show === "all" || (show === "open" ? t.status !== "Done" : t.status === "Overdue")) && (!clientF || t.client === clientF))
    .sort((a, b) => a.due.getTime() - b.due.getTime());
  const myTodos = todos.filter((t) => t.id.startsWith(`${pick}:`));

  const tlStart = d(2026, 9, 30);
  const tlEnd = d(2026, 10, 20);
  const tlRows: GanttRow[] = open
    .filter((t) => t.due >= d(2026, 9, 25))
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, 9)
    .map((t) => {
      const from = new Date(t.due.getTime() - 4 * 86400000);
      const late = t.status === "Overdue";
      return {
        id: t.id,
        name: t.title,
        sub: clientById(t.client)?.short,
        status: late || from <= TODAY ? "current" : "planned",
        bars: late ? [{ from, to: t.due, kind: "late" }] : from <= TODAY ? [{ from, to: TODAY, kind: "cur" }, { from: TODAY, to: t.due, kind: "rest" }] : [{ from, to: t.due, kind: "plan" }],
        count: fmt(t.due),
        note: t.setBy ? { text: `Date set by ${t.setBy}` } : undefined,
      } satisfies GanttRow;
    });
  const week = Array.from({ length: 7 }, (_, i) => d(2026, 10, 5 + i));
  const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekRows: WeekRow[] = week.flatMap((day) =>
    [...open.map((t) => ({ id: t.id, title: t.title, client: t.client, due: t.due, with: t.status === "With client", href: taskHref(portal, t) })), ...myTodos.filter((t) => !t.done).map((t) => ({ id: t.id, title: t.title, client: t.client, due: t.due, with: false, href: undefined }))]
      .filter((t) => t.due.getTime() === day.getTime())
      .map((t) => ({
        id: t.id,
        when: day.getTime() === TODAY.getTime() ? "Today" : `${DAY[day.getDay()]} ${fmt(day)}`,
        now: day.getTime() === TODAY.getTime(),
        owner: t.with ? ("client" as const) : ("sbc" as const),
        ownerLabel: t.with ? clientById(t.client)?.short : pick,
        text: `${t.title} · ${clientById(t.client)?.short ?? ""}`,
        href: t.href,
      })),
  );

  const addTodo = (title: string, client: string, due: Date, to = pick) => {
    setTodos((ts) => [{ id: `${to}:${Date.now()}`, title, client, due, done: false }, ...ts]);
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard
        title={lead.name}
        icon={{ Icon: User, tone: "violet" }}
        meta={`Project lead · ${clients.length} clients · ${open.length} open · ${open.filter((t) => t.status === "Overdue").length} overdue`}
        right={
          <Tabs items={rows.map((l) => ({ key: l.name, label: l.name.split(" ")[0], count: l.open }))} value={pick} onChange={setPick} />
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name={lead.name} size={44} />
          <span className="min-w-0 flex-1 text-13 text-muted">
            {lead.hours} h planned this week of 40 · last active {lead.lastActive}
            <Bar pct={lead.load} tone={loadTone(lead.load)} className="mt-1.5 max-w-[240px]" />
          </span>
          <Button size="sm" variant="outline" asChild>
            <Link href={`${base(portal)}/work`}>Plan the week</Link>
          </Button>
          <PopoverCard
            align="end"
            width={200}
            trigger={
              <Button size="iconSm" variant="outline" aria-label="More actions">
                <MoreHorizontal size={16} strokeWidth={1.5} />
              </Button>
            }
          >
            <div role="menu" className="py-1">
              <button type="button" role="menuitem" className="flex h-9 w-full items-center px-4 text-13.5 hover:bg-raised" onClick={() => toast.show(`To-do templates for ${lead.name}`)}>
                Templates
              </button>
              <button type="button" role="menuitem" className="flex h-9 w-full items-center px-4 text-13.5 hover:bg-raised" onClick={() => toast.show(`Exported ${lead.name}'s work`)}>
                Export
              </button>
            </div>
          </PopoverCard>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setForm({ title: "", client: clients[0]?.id ?? "", due: "2026-10-09", lead: pick });
              setAssignOpen(true);
            }}
          >
            <Plus size={14} strokeWidth={1.5} /> Assign to-do
          </Button>
        </div>
      </SectionCard>

      <Row cols={2}>
        <SectionCard title={`${lead.name.split(" ")[0]} · status`} meta="Sep to Oct" right={<HeadLink href={`${base(portal)}/work`}>Open Work ›</HeadLink>}>
          <StackedBar segments={statusSegments(mine)} total={mine.length} title="Tasks" />
        </SectionCard>
        <SectionCard title="By area · Sep to Oct" right={<AreaLegend />}>
          <AreaRows tasks={mine} />
        </SectionCard>
      </Row>

      <Row cols={2}>
        <SectionCard
          title="To-do"
          meta={`${list.length + myTodos.length}`}
          flush
          right={
            <>
              <Select value={clientF} onChange={(e) => setClientF(e.target.value)} options={[{ value: "", label: "All clients" }, ...clients.map((c) => ({ value: c.id, label: c.short }))]} aria-label="Clients" />
              <Select
                value={show}
                onChange={(e) => setShow(e.target.value)}
                options={[
                  { value: "open", label: "Open" },
                  { value: "late", label: "Overdue" },
                  { value: "all", label: "All" },
                ]}
                aria-label="Show"
              />
            </>
          }
        >
          <form
            className="flex items-center gap-2 border-b border-line-soft px-4 py-2.5 md:px-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!quick.trim()) return;
              addTodo(quick.trim(), clients[0]?.id ?? "northwind", TODAY);
              setQuick("");
            }}
          >
            <Input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Add a to-do: Call Mei Fri 3 pm" aria-label="Quick add" className="h-8" />
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
          {myTodos.map((t) => (
            <ListRow key={t.id}>
              <Checkbox checked={t.done} onChange={() => setTodos((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} label={t.title} />
              <span className={cn("min-w-0 flex-1 truncate", t.done && "text-muted line-through")}>{t.title}</span>
              <Chip tone="prog">New</Chip>
              <span className="w-[52px] text-right text-12.5 text-muted">{fmt(t.due)}</span>
            </ListRow>
          ))}
          {list.length === 0 && myTodos.length === 0 ? (
            <Empty />
          ) : (
            list.map((t) => {
              const c = clientById(t.client);
              const isDone = t.status === "Done" || checked.has(t.id);
              return (
                <ListRow key={t.id} className="flex-wrap md:flex-nowrap">
                  <Checkbox checked={isDone} onChange={() => setChecked((x) => (x.has(t.id) ? new Set([...x].filter((y) => y !== t.id)) : new Set([...x, t.id])))} label={t.title} />
                  <Link href={taskHref(portal, t)} className="min-w-0 flex-1 hover:underline">
                    <span className={cn("block truncate font-semibold", isDone && "text-muted line-through")}>{t.title}</span>
                    <span className="flex items-center gap-1.5 truncate text-12.5 text-muted">
                      {c && <ClientDot tone={c.tone} />}
                      {c?.short}
                      {t.setBy && <span>· date set by {t.setBy}</span>}
                    </span>
                  </Link>
                  {t.status === "With client" &&
                    (reminded.has(t.id) ? (
                      <Chip tone="ok">Reminded</Chip>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setReminded(new Set([...reminded, t.id]))}>
                        Remind
                      </Button>
                    ))}
                  <Chip tone={t.status === "Overdue" ? "bad" : t.due.getTime() === TODAY.getTime() ? "warn" : "idle"} dot={false}>
                    {fmt(t.due)}
                  </Chip>
                </ListRow>
              );
            })
          )}
        </SectionCard>
        <SectionCard title="This week" meta={`${fmt(week[0])} to ${fmt(week[6])}`} flush>
          <WeekList rows={weekRows} />
        </SectionCard>
      </Row>

      <SectionCard title="Timeline" meta={`${fmt(tlStart)} to ${fmt(tlEnd)}`} flush>
        {tlRows.length === 0 ? <Empty /> : <GanttTimeline start={tlStart} end={tlEnd} ticks={[d(2026, 10, 1), d(2026, 10, 6), d(2026, 10, 11), d(2026, 10, 16)]} rows={tlRows} />}
      </SectionCard>

      <LeadExpandList portal={portal} leads={rows} manager="Pranay" />

      <Modal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        title="Assign a to-do"
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!form.title.trim()}
              onClick={() => {
                const [y, m, dd] = form.due.split("-").map(Number);
                addTodo(form.title.trim(), form.client, new Date(y, m - 1, dd), form.lead || pick);
                setAssignOpen(false);
                toast.show(`Assigned to ${form.lead || pick}: ${form.title.trim()}`);
              }}
            >
              Assign
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="To-do">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Call Mei about the FIRMS login" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Project lead">
              <Select size="md" className="[&>select]:w-full" value={form.lead} onChange={(e) => setForm({ ...form, lead: e.target.value })} options={rows.map((l) => ({ value: l.name, label: l.name }))} aria-label="Project lead" />
            </Field>
            <Field label="Client">
              <Select size="md" className="[&>select]:w-full" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} options={STAFF_CLIENTS.filter((c) => c.manager === "Pranay").map((c) => ({ value: c.id, label: c.short }))} aria-label="Client" />
            </Field>
            <Field label="Due">
              <Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
            </Field>
          </div>
        </div>
      </Modal>
      {toast.node}
    </div>
  );
}
