"use client";
import * as React from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { fmt, urgency } from "@/lib/dates";
import { clientById, clientsFor } from "@/data/staff-clients";
import { tasksFor, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { PLANNED, TODOS, type Todo } from "@/data/staff-work";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ClientName, TaskChip, type StaffPortal } from "./parts";
import { ClientSelect } from "./filters";
import {
  NewTodoDialog,
  PlanCalendar,
  PlanWeekDialog,
  RequestChangeDialog,
  SessionButton,
  TodayAgenda,
  TodoCard,
  WorkBoard,
  WorkDrawer,
  WorkStatus,
  WorkTimeline,
  type Timer,
} from "./work-parts";

// Staff Work. Old sources: reference/old-screens/s/lead/Work.dc.html (Planner, List, Board), WorkPlan.dc.html,
// WorkBoard.dc.html, WorkDrawer.dc.html, WorkPhone.dc.html; the same under s/mgr; s/admin/Work.dc.html and
// reference/old-patch/admin/Work.dc.html (firm-wide work with an owner filter).

type View = "planner" | "list" | "board";
type Show = "all" | "steps" | "filings";

export function WorkScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState<View>("planner");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [doneIds, setDoneIds] = React.useState<Set<string>>(new Set());
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});
  const [owner, setOwner] = React.useState("");
  const [client, setClient] = React.useState("");
  const [show, setShow] = React.useState<Show>("all");
  const [plan, setPlan] = React.useState<Record<string, number | null>>(PLANNED);
  const [todos, setTodos] = React.useState<Todo[]>(TODOS[portal]);
  const [timers, setTimers] = React.useState<Record<string, Timer>>({});
  const [now, setNow] = React.useState(0);
  const [requested, setRequested] = React.useState<Record<string, { date: string; reason: string }>>({});
  const [reqTask, setReqTask] = React.useState<StaffTask | null>(null);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
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
      return { ...all, [id]: t.start ? { start: null, ms: t.ms + (at - t.start) } : { start: at, ms: t.ms } };
    });

  const all = tasksFor(portal).map((t) => (doneIds.has(t.id) ? { ...t, status: "Done" as TaskStatus } : t));
  const owners = [...new Set(all.map((t) => t.owner))];
  const myClients = clientsFor(portal).filter((c) => all.some((t) => t.client === c.id));
  const tasks = all
    .filter((t) => (!owner || t.owner === owner) && (!client || t.client === client) && (show === "all" || (show === "filings") === !t.code))
    .sort((a, b) => a.due.getTime() - b.due.getTime());
  const open = all.find((t) => t.id === openId) ?? null;
  const openCount = tasks.filter((t) => t.status !== "Done").length;
  const clientCount = new Set(tasks.filter((t) => t.status !== "Done").map((t) => t.client)).size;
  const any = owner || client || show !== "all";

  // List view keys (WorkBoard.dc.html): J and K move, Enter opens.
  React.useEffect(() => {
    if (view !== "list" || openId) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) return;
      const i = tasks.findIndex((t) => t.id === cursor);
      if (e.key === "j" || e.key === "J") setCursor(tasks[Math.min(tasks.length - 1, i + 1)]?.id);
      else if (e.key === "k" || e.key === "K") setCursor(tasks[Math.max(0, i - 1)]?.id);
      else if (e.key === "Enter" && cursor) setOpenId(cursor);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, openId, tasks, cursor]);

  const cols: Column<StaffTask>[] = [
    {
      key: "title",
      label: "Step or filing",
      render: (t) => (
        <button type="button" onClick={() => setOpenId(t.id)} className="text-left font-semibold hover:underline">
          {t.title}
        </button>
      ),
    },
    { key: "client", label: "Client", width: 170, render: (t) => <ClientName id={t.client} short /> },
    { key: "code", label: "Step", width: 90, mono: true, render: (t) => t.code ?? "Filing" },
    { key: "area", label: "Area", width: 100 },
    ...(portal === "lead" ? [] : [{ key: "owner", label: "Owner", width: 120 } as Column<StaffTask>]),
    { key: "due", label: "Due", width: 80, render: (t) => <span className={urgency(t.due) === "bad" && t.status !== "Done" ? "font-semibold text-bad" : undefined}>{fmt(t.due)}</span> },
    { key: "status", label: "Status", width: 130, render: (t) => <TaskChip status={t.status} /> },
    { key: "session", label: "Session", width: 120, render: (t) => (t.status === "Done" ? "" : <SessionButton timer={timers[t.id]} now={now} onToggle={() => toggleTimer(t.id)} label={t.title} />) },
  ];

  const filters = (
    <>
      {portal !== "lead" && <Select value={owner} onChange={(e) => setOwner(e.target.value)} options={[{ value: "", label: "All owners" }, ...owners.map((o) => ({ value: o, label: o }))]} aria-label="Owner" />}
      <ClientSelect clients={myClients} value={client} onChange={setClient} />
      <Select
        value={show}
        onChange={(e) => setShow(e.target.value as Show)}
        options={[
          { value: "all", label: "Steps and filings" },
          { value: "steps", label: "Steps only" },
          { value: "filings", label: "Filings only" },
        ]}
        aria-label="Show"
      />
      {any && (
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            setOwner("");
            setClient("");
            setShow("all");
          }}
        >
          Clear
        </Button>
      )}
      <Tabs
        items={[
          { key: "planner", label: "Planner" },
          { key: "list", label: "List" },
          { key: "board", label: "Board" },
        ]}
        value={view}
        onChange={(k) => setView(k as View)}
      />
    </>
  );

  const actions = (
    <>
      <Button variant="outline" size="sm" onClick={() => setPlanOpen(true)}>
        Plan my week
      </Button>
      <Button variant="primary" size="sm" onClick={() => setNewOpen(true)}>
        <Plus size={14} strokeWidth={1.5} /> New to-do
      </Button>
      <PopoverCard
        open={moreOpen}
        onOpenChange={setMoreOpen}
        align="end"
        width={200}
        trigger={
          <Button variant="outline" size="iconSm" aria-label="More actions" title="More actions">
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </Button>
        }
      >
        <div className="grid py-1" role="menu">
          {[
            ["Templates", "Templates open in the next release"],
            ["Export", `Exported ${tasks.length} tasks to Work.xlsx`],
          ].map(([label, msg]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              className="h-9 px-4 text-left text-13.5 hover:bg-raised"
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
  const move = (id: string, day: number | null) => setPlan((p) => ({ ...p, [id]: day }));

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard
        title="Work"
        meta={`${openCount} open · ${clientCount} clients`}
        right={<div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
        bodyClassName="flex flex-wrap items-center gap-2 py-2.5"
      >
        {filters}
      </SectionCard>

      {view === "planner" && (
        <>
          <Cols>
            <Col>
              <WorkTimeline tasks={tasks} onOpen={openTask} onLocked={(t) => (requested[t.id] ? openTask(t) : setReqTask(t))} />
              <PlanCalendar tasks={tasks} plan={plan} onMove={move} onOpen={openTask} timers={timers} now={now} onTimer={toggleTimer} />
            </Col>
            <Col>
              <TodayAgenda tasks={tasks} plan={plan} onOpen={openTask} timers={timers} now={now} onTimer={toggleTimer} />
              <TodoCard portal={portal} tasks={tasks} todos={todos} setTodos={setTodos} client={client} onOpen={openTask} notify={toast.show} />
            </Col>
          </Cols>
          <WorkStatus tasks={tasks} mine={portal === "lead"} />
        </>
      )}

      {view === "list" && (
        <DataGrid
          title="List view"
          meta={`${openCount} open`}
          columns={cols}
          rows={tasks}
          rowKey={(t) => t.id}
          rowLate={(t) => t.status === "Overdue"}
          pageSize={12}
          onRowClick={(t) => setCursor(t.id)}
          selectedKey={cursor}
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
        tasks={tasks}
        plan={plan}
        onApply={(moves) => {
          const before = plan;
          setPlan({ ...plan, ...moves });
          toast.show(`${Object.keys(moves).length} blocks added to the calendar`, () => setPlan(before));
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
