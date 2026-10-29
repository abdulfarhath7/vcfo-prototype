"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { MoreHorizontal, Plus, Sparkles } from "lucide-react";
import { STAFF_TODAY, d, fmt, urgency } from "@/lib/dates";
import { clientById, clientsFor } from "@/data/staff-clients";
import { LEAD_WORK, PREVIOUS_VISIT, taskChanged, tasksFor, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { LEADS } from "@/data/staff-team";
import { CAL_BLOCKS, TIMELINE_ROWS, TODOS, type CalBlock, type Todo } from "@/data/staff-work";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { AreaPill } from "@/components/ui/Chip";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import type { SavedView, ViewFilters } from "@/components/cards/SavedViews";
import { ClientName, TaskChip, personOf, taskHref, type StaffPortal } from "./parts";
import { FilterChip } from "./today-parts";
import { AdminWorkItems } from "./AdminWorkItems";
import { NewTodoDialog, PlanCalendar, PlanWeekDialog, RequestChangeDialog, SessionButton, PlanTimeline, TodoCard, WorkBoard, WorkDrawer, WorkStatus, WorkTimeline, useTaskEdits, type Timer } from "./work-parts";

// Staff Work. Old sources: reference/old-screens/s/lead/Work.dc.html (Planner, List, Board), WorkPlan.dc.html,
// WorkBoard.dc.html, WorkDrawer.dc.html, WorkPhone.dc.html; the same under s/mgr; s/admin/Work.dc.html and
// reference/old-patch/admin/Work.dc.html (firm-wide work with an owner filter).

type View = "planner" | "list" | "board";
type Show = "all" | "steps" | "filings";

/** Status filter: the six words (R-13) as task statuses. */
const STATUS_OPTS: Array<{ value: TaskStatus; label: string }> = [
  { value: "Overdue", label: "Overdue" },
  { value: "Due this week", label: "Due soon" },
  { value: "In progress", label: "In progress" },
  { value: "With client", label: "Waiting" },
  { value: "Not started", label: "Not started" },
  { value: "Done", label: "Done" },
];
/** Due filter: the staff week of Fri 16 Oct runs Mon 12 to Sun 18 Oct. */
const WEEKS: Record<string, [Date, Date]> = { week: [d(2026, 10, 12), d(2026, 10, 18)], next: [d(2026, 10, 19), d(2026, 10, 25)] };
const inWeek = (t: StaffTask, w: string) => !w || (t.due >= WEEKS[w][0] && t.due <= WEEKS[w][1]);

/** E-06: the default views. A view is a set of filters; "+ Save view" adds the user's own. */
const VIEWS: SavedView[] = [
  { key: "all", label: "All", filters: {} },
  { key: "overdue", label: "My overdue", filters: { status: "Overdue" } },
  { key: "week", label: "This week", filters: { when: "week" } },
  { key: "waiting", label: "Waiting on clients", filters: { status: "With client" } },
];

export function WorkScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState<View>("planner");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [doneIds, setDoneIds] = React.useState<Set<string>>(new Set());
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});
  const [owner, setOwner] = React.useState("");
  const [client, setClient] = React.useState("");
  const [show, setShow] = React.useState<Show>("all");
  const [status, setStatus] = React.useState("");
  const [when, setWhen] = React.useState("");
  const [viewTick, setViewTick] = React.useState(0);
  const [nextBlocks, setNextBlocks] = React.useState<CalBlock[]>([]);
  const [todos, setTodos] = React.useState<Todo[]>(TODOS[portal]);
  const [timers, setTimers] = React.useState<Record<string, Timer>>({});
  const [now, setNow] = React.useState(0);
  const [requested, setRequested] = React.useState<Record<string, { date: string; reason: string }>>({});
  const [reqTask, setReqTask] = React.useState<StaffTask | null>(null);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [adminTab, setAdminTab] = React.useState<"managers" | "leads">("managers");
  const toast = useUndoToast();

  const running = Object.values(timers).some((t) => t.start);
  React.useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const h = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(h);
  }, [running]);

  const toggleTimer = (id: string) =>
    setTimers((all) => {
      const t = all[id] ?? { start: null, ms: 0 };
      const at = Date.now();
      setNow(at);
      return {
        ...all,
        [id]: t.start ? { start: null, ms: t.ms + (at - t.start) } : { start: at, ms: t.ms },
      };
    });

  // Lead and manager Work show Bharath's planner, as in the old s/lead and s/mgr Work.dc.html. Admin's Project leads tab shows the firm.
  const me = personOf(portal);
  // E-01, E-02, E-03: status picks and reassignments from the list last for the session.
  const edits = useTaskEdits({
    base: (portal === "admin" ? tasksFor("admin") : LEAD_WORK).map((t) => (doneIds.has(t.id) ? { ...t, status: "Done" as TaskStatus } : t)),
    portal,
    people: LEADS.filter((l) => portal === "admin" || l.manager === "Pranay").map((l) => l.name),
    file: "Work.xlsx",
  });
  const all = edits.tasks;
  const owners = [...new Set(all.map((t) => t.owner))];
  const myClients = clientsFor(portal).filter((c) => all.some((t) => t.client === c.id));
  const tasks = all
    .filter((t) => (!owner || t.owner === owner) && (!client || t.client === client) && (show === "all" || (show === "filings") === !t.code) && (!status || t.status === status) && inWeek(t, when))
    .sort((a, b) => a.due.getTime() - b.due.getTime());
  const current: ViewFilters = { owner, client, show: show === "all" ? "" : show, status, when };
  const applyView = (f: ViewFilters) => {
    setOwner(f.owner ?? "");
    setClient(f.client ?? "");
    setShow((f.show || "all") as Show);
    setStatus(f.status ?? "");
    setWhen(f.when ?? "");
    setViewTick((n) => n + 1);
  };
  // E-05: a home card tile opens Work on the list with one saved view ("?view=overdue").
  React.useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("view");
    const v = VIEWS.find((x) => x.key === key);
    if (!v) return;
    setView("list");
    applyView(v.filters);
  }, []);
  const open = all.find((t) => t.id === openId) ?? null;
  const openCount = tasks.filter((t) => t.status !== "Done").length;
  const clientCount = new Set(tasks.filter((t) => t.status !== "Done").map((t) => t.client)).size;
  const any = owner || client || show !== "all" || status || when;

  // List view keys (WorkBoard.dc.html): J and K move, Enter opens.
  React.useEffect(() => {
    if (view !== "list" || openId) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) return;
      const i = tasks.findIndex((t) => t.id === cursor);
      if (e.key === "j" || e.key === "J") setCursor(tasks[Math.min(tasks.length - 1, i + 1)]?.id);
      else if (e.key === "k" || e.key === "K") setCursor(tasks[Math.max(0, i - 1)]?.id);
      else if (e.key === "Enter" && cursor) {
        // Without this, the Enter keypress lands on the drawer's close button and shuts it at once.
        e.preventDefault();
        setOpenId(cursor);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, openId, tasks, cursor]);

  const cols: Column<StaffTask>[] = [
    {
      key: "title",
      label: "Step or filing",
      render: (t) => (
        <button type="button" onClick={() => setOpenId(t.id)} className="text-left font-medium text-ink hover:underline">
          {t.title}
        </button>
      ),
    },
    {
      key: "client",
      label: "Client",
      width: 170,
      render: (t) => <ClientName id={t.client} short />,
    },
    {
      key: "code",
      label: "Step",
      width: 90,
      render: (t) => (t.code ? <span className="font-mono text-13">{t.code}</span> : "Filing"),
    },
    {
      key: "area",
      label: "Area",
      width: 128,
      skeleton: "chip",
      render: (t) => <AreaPill area={t.area} />,
    },
    ...(portal !== "admin" ? [] : [{ key: "owner", label: "Owner", width: 120 } as Column<StaffTask>]),
    {
      key: "due",
      label: "Due",
      width: 80,
      render: (t) => <span className={cn("whitespace-nowrap", urgency(t.due, STAFF_TODAY) === "bad" && t.status !== "Done" && "font-medium text-bad")}>{fmt(t.due)}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: 130,
      skeleton: "chip",
      render: (t) => <TaskChip status={t.status} />,
    },
    {
      key: "session",
      label: "Session",
      width: 120,
      render: (t) => (t.status === "Done" ? "" : <SessionButton timer={timers[t.id]} now={now} onToggle={() => toggleTimer(t.id)} label={t.title} />),
    },
  ];

  const viewTabs = (
    <Tabs
      size="md"
      items={[
        { key: "planner", label: "Planner" },
        { key: "list", label: "List" },
        { key: "board", label: "Board" },
      ]}
      value={view}
      onChange={(k) => setView(k as View)}
    />
  );

  // R-10: filter chips. Set chips are soft blurple with an ×; unset chips are dashed "+ Label".
  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      {portal === "admin" && <FilterChip label="Owner" value={owner} onChange={setOwner} options={owners.map((o) => ({ value: o, label: o }))} />}
      <FilterChip label="Company" value={client} onChange={setClient} options={myClients.map((c) => ({ value: c.id, label: c.short }))} />
      <FilterChip
        label="Show"
        value={show === "all" ? "" : show}
        onChange={(v) => setShow((v || "all") as Show)}
        options={[
          { value: "steps", label: "Steps only" },
          { value: "filings", label: "Filings only" },
        ]}
      />
      <FilterChip label="Status" value={status} onChange={setStatus} options={STATUS_OPTS} />
      <FilterChip
        label="Due"
        value={when}
        onChange={setWhen}
        options={[
          { value: "week", label: "This week" },
          { value: "next", label: "Next week" },
        ]}
      />
      {any && (
        <Button variant="link" size="sm" onClick={() => applyView({})}>
          Clear
        </Button>
      )}
    </div>
  );

  const actions = (
    <>
      <Button variant="secondary" onClick={() => setPlanOpen(true)}>
        <Sparkles size={16} strokeWidth={1.6} /> Plan my week
      </Button>
      <Button variant="primary" onClick={() => setNewOpen(true)}>
        <Plus size={16} strokeWidth={1.6} /> New to-do
      </Button>
      <PopoverCard
        open={moreOpen}
        onOpenChange={setMoreOpen}
        align="end"
        width={200}
        trigger={
          <Button variant="secondary" size="icon" aria-label="More actions" title="More actions">
            <MoreHorizontal size={16} strokeWidth={1.6} />
          </Button>
        }
      >
        <div className="grid p-1" role="menu">
          {[
            ["Templates", "Templates open in the next release"],
            ["Export", `Exported ${tasks.length} tasks to Work.xlsx`],
          ].map(([label, msg]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              className="h-[34px] rounded-sm px-2.5 text-left text-14 hover:bg-hover"
              onClick={() => {
                setMoreOpen(false);
                toast.show(msg);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </PopoverCard>
    </>
  );

  const openTask = (t: StaffTask) => setOpenId(t.id);

  // Admin Work (s/admin/Work.dc.html): Managers tab with the manager items; Project leads tab with the planner.
  const adminTabs =
    portal === "admin" ? (
      <Tabs
        items={[
          { key: "managers", label: "Managers" },
          { key: "leads", label: "Project leads" },
        ]}
        value={adminTab}
        onChange={(k) => setAdminTab(k as "managers" | "leads")}
      />
    ) : null;
  if (portal === "admin" && adminTab === "managers") return <AdminWorkItems tabs={adminTabs} />;

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Plain page head (R-02): 28 px title, muted meta, views and actions on the right; filter chips under it (R-10). */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-[1_1_240px]">
          <h1 className="text-28 font-medium leading-9 tracking-[-0.01em]">Work</h1>
          <p className="text-13.5 text-muted">
            {openCount} open · {clientCount} companies
          </p>
        </div>
        {adminTabs}
        {viewTabs}
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
      {filters}

      {view === "planner" && (
        <>
          <Cols>
            <Col>
              {portal === "admin" ? (
                <WorkTimeline tasks={tasks} onOpen={openTask} onLocked={(t) => (requested[t.id] ? openTask(t) : setReqTask(t))} />
              ) : (
                <PlanTimeline rows={TIMELINE_ROWS.filter((r) => !client || r.client === client)} tasks={all} onOpen={openTask} onLocked={(t) => (requested[t.id] ? openTask(t) : setReqTask(t))} />
              )}
              <PlanCalendar tasks={all} blocks={CAL_BLOCKS} nextBlocks={nextBlocks} onOpen={openTask} notify={toast.show} />
            </Col>
            <Col>
              <TodoCard portal={portal} tasks={tasks} todos={todos} setTodos={setTodos} client={client} onOpen={openTask} notify={toast.show} />
            </Col>
          </Cols>
          {portal !== "manager" && <WorkStatus tasks={tasks} mine={portal === "lead"} />}
        </>
      )}

      {view === "list" && (
        <DataGrid
          title="Tasks"
          meta={`${openCount} open`}
          columns={cols}
          rows={tasks}
          rowKey={(t) => t.id}
          rowLate={(t) => t.status === "Overdue"}
          pageSize={12}
          onRowClick={(t) => setCursor(t.id)}
          selectedKey={cursor}
          views={{ storageKey: `${portal}:work`, views: VIEWS, current, onApply: applyView }}
          selectable
          quickActions
          actions={{ ...edits.actions, open: openTask, edit: openTask, link: (t) => taskHref(portal, t) }}
          statusMenu={edits.statusMenu}
          user={me}
          density
          changedAt={taskChanged}
          visitKey={`${portal}:work`}
          visitSeed={PREVIOUS_VISIT}
          empty="No tasks match these filters"
          emptyAction={
            <Button size="sm" variant="secondary" onClick={() => applyView({})}>
              Clear filters
            </Button>
          }
          loadKey={viewTick}
          notify={toast.show}
        />
      )}

      {view === "board" && <WorkBoard portal={portal} tasks={tasks} onOpen={openTask} notify={toast.show} />}

      <WorkDrawer
        portal={portal}
        task={open}
        onClose={() => setOpenId(null)}
        checks={checks}
        onCheck={(id, v) => setChecks({ ...checks, [id]: v })}
        timer={open ? timers[open.id] : undefined}
        now={now}
        onTimer={() => open && toggleTimer(open.id)}
        requested={open ? requested[open.id] : undefined}
        onRequest={() => open && setReqTask(open)}
        onDone={() => {
          if (!open) return;
          const id = open.id;
          setDoneIds(new Set([...doneIds, id]));
          setOpenId(null);
          toast.show(`Marked done · ${open.title}`, () => setDoneIds((s) => new Set([...s].filter((x) => x !== id))));
        }}
        notify={toast.show}
      />
      <RequestChangeDialog
        task={reqTask}
        onClose={() => setReqTask(null)}
        onSend={(t, date, reason) => {
          setRequested({ ...requested, [t.id]: { date, reason } });
          setReqTask(null);
          toast.show(`Request sent to ${t.setBy ?? "your manager"} · ${t.title} · ${clientById(t.client)?.short ?? ""}`);
        }}
      />
      <PlanWeekDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        onApply={(blocks) => {
          const before = nextBlocks;
          setNextBlocks(blocks);
          toast.show(`${blocks.filter((b) => !b.own).length} blocks added to the calendar · week of 19 Oct`, () => setNextBlocks(before));
        }}
      />
      <NewTodoDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        clients={myClients}
        onAdd={(t) => {
          setTodos((l) => [t, ...l]);
          setView("planner");
          toast.show(`To-do added · ${t.text}`);
        }}
      />
      {toast.node}
    </div>
  );
}
