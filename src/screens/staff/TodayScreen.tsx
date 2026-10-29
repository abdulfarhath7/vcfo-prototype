"use client";
import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { STAFF_TODAY as TODAY, fmt } from "@/lib/dates";
import { clientById, clientsFor } from "@/data/staff-clients";
import { PREVIOUS_VISIT, taskChanged, tasksFor, type StaffTask } from "@/data/staff-tasks";
import { LEADS, managerRows } from "@/data/staff-team";
import { Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { AreaPill } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { barFill } from "@/components/ui/Bar";
import { SectionCard } from "@/components/cards/SectionCard";
import { useUndoToast } from "@/components/ui/UndoToast";
import { GreetingCard } from "@/components/cards/GreetingCard";
import { DataGrid, GRID_SUB, type Column } from "@/components/cards/DataGrid";
import { TaskChip, personOf, plainName, taskHref, type StaffPortal } from "./parts";
import { FirmClientsGrid, ManagersGrid } from "./grids";
import { NewTodoDialog, useTaskEdits } from "./work-parts";
import {
  ActionQueue,
  ApprovalsWaiting,
  ClientCodeTile,
  ClientsFilings,
  DecisionsCard,
  FilterChip,
  STATUS_ORDER,
  InboxCard,
  PhaseProgress,
  PracticeAreas,
  ScopeTabs,
  TaskStatusCard,
  WaitingOnClient,
  WorkloadByLead,
  inScope,
  todayStats,
  type Scope,
} from "./today-parts";

// Staff Today. Old sources: reference/old-screens/s/lead/Main.dc.html (and TodayBefore, TodayAfter: the same page with
// every client incorporating or every client in compliance; here the scope select shows each variant), TodayPhone.dc.html,
// s/mgr/Main.dc.html (Team tasks, Task status, Approvals), reference/old-patch/admin/Main.dc.html.

/** ManagerToday.dc.html grid: main column and a rail, on every staff Today. */
const GRID = "grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,2.4fr)_minmax(300px,1fr)]";

/** Status filter words: the six (R-13), plus "Open" for everything not done. */
const STATUS_FILTER: Array<{
  value: string;
  label: string;
  test: (t: StaffTask) => boolean;
}> = [
  { value: "open", label: "Open", test: (t) => t.status !== "Done" },
  ...STATUS_ORDER.map((x) => ({
    value: x.s,
    label: x.label,
    test: (t: StaffTask) => t.status === x.s,
  })),
];

/** Lead cell: face and first name (ManagerToday.dc.html). */
function LeadCell({ name }: { name: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2" title={name}>
      <Avatar name={name} size={24} />
      <span className="truncate">{name.split(" ")[0]}</span>
    </span>
  );
}

/** Task cell: company tile, task, company under it. */
function TaskCell({ t, portal, link }: { t: StaffTask; portal: StaffPortal; link?: boolean }) {
  const c = clientById(t.client);
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {c && <ClientCodeTile c={c} />}
      <span className="flex min-w-0 flex-col">
        {link ? (
          <Link href={taskHref(portal, t)} className="truncate font-medium text-ink hover:underline">
            {t.title}
          </Link>
        ) : (
          <span className="truncate font-medium text-ink">{t.title}</span>
        )}
        <span className={cn("truncate text-12.5 text-muted", GRID_SUB)}>{c ? plainName(c) : ""}</span>
      </span>
    </span>
  );
}

const dueClass = (t: StaffTask) => (t.status === "Done" ? undefined : t.due < TODAY || t.status === "Overdue" ? "font-medium text-bad" : t.status === "Due this week" ? "font-medium text-warn" : undefined);

/** Team tasks (ManagerToday.dc.html): R-10 filter chips, List or Board, a T1 table with 104 px area and status columns. */
function TeamTasks({ portal, scope, scopeTabs, notify }: { portal: StaffPortal; scope: Scope; scopeTabs?: React.ReactNode; notify: (text: string, undo?: () => void) => void }) {
  const me = personOf(portal);
  // E-01, E-02, E-03: status picks and reassignments from the table last for the session.
  const edits = useTaskEdits({ base: tasksFor(portal), portal, people: LEADS.filter((l) => l.manager === me).map((l) => l.name), file: "Team-tasks.xlsx" });
  const all = edits.tasks.filter((t) => inScope(scope, t.client));
  const [lead, setLead] = React.useState("");
  const [status, setStatus] = React.useState("open");
  const [client, setClient] = React.useState("");
  const [area, setArea] = React.useState("");
  const [view, setView] = React.useState("list");
  const leads = [...new Set(all.map((t) => t.owner))];
  const areas = [...new Set(all.map((t) => t.area))];
  const st = STATUS_FILTER.find((x) => x.value === status);
  const rows = all.filter((t) => (!lead || t.owner === lead) && (!st || st.test(t)) && (!client || t.client === client) && (!area || t.area === area)).sort((a, b) => a.due.getTime() - b.due.getTime());
  const clear = () => {
    setLead("");
    setStatus("");
    setClient("");
    setArea("");
  };
  // C-0031 removed the checkboxes because they did nothing. E-01 brings them back with the bulk bar (ManagerToday.dc.html).
  const cols: Column<StaffTask>[] = [
    {
      key: "title",
      label: "Task",
      // Takes the space left and truncates, so the checkbox and row-action columns fit the card.
      className: "max-w-0",
      render: (t) => <TaskCell t={t} portal={portal} />,
    },
    {
      key: "owner",
      label: "Lead",
      width: 128,
      hideOnPhone: true,
      render: (t) => <LeadCell name={t.owner} />,
    },
    {
      key: "area",
      label: "Area",
      width: 128,
      hideOnPhone: true,
      skeleton: "chip",
      render: (t) => <AreaPill area={t.area} />,
    },
    {
      key: "due",
      label: "Due",
      width: 76,
      render: (t) => <span className={cn("whitespace-nowrap", dueClass(t))}>{fmt(t.due)}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: 128,
      skeleton: "chip",
      render: (t) => <TaskChip status={t.status} />,
    },
  ];
  return (
    <SectionCard title="Team tasks" meta={String(rows.length)} flush className="overflow-clip">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-5">
        <FilterChip
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUS_FILTER.map((x) => ({
            value: x.value,
            label: x.label,
          }))}
        />
        <FilterChip label="Lead" value={lead} onChange={setLead} options={leads.map((l) => ({ value: l, label: l }))} />
        <FilterChip
          label="Company"
          value={client}
          onChange={setClient}
          options={clientsFor(portal)
            .filter((c) => inScope(scope, c.id))
            .map((c) => ({ value: c.id, label: c.short }))}
        />
        <FilterChip label="Area" value={area} onChange={setArea} options={areas.map((a) => ({ value: a, label: a }))} />
        <span className="ml-auto flex flex-wrap items-center gap-2">
          {scopeTabs}
        <Tabs
          items={[
            { key: "list", label: "List" },
            { key: "board", label: "Board" },
          ]}
          value={view}
          onChange={setView}
        />
        </span>
      </div>
      {view === "list" ? (
        <DataGrid
          inset
          columns={cols}
          rows={rows}
          rowKey={(t) => t.id}
          rowHref={(t) => taskHref(portal, t)}
          pageSize={10}
          empty="No tasks match these filters"
          emptyAction={
            <Button size="sm" variant="secondary" onClick={clear}>
              Clear filters
            </Button>
          }
          className="border-t border-line-soft"
          selectable
          quickActions
          actionsColumn="title"
          actions={edits.actions}
          statusMenu={edits.statusMenu}
          user={me}
          density
          changedAt={taskChanged}
          visitKey={`${portal}:today`}
          visitSeed={PREVIOUS_VISIT}
          notify={notify}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 border-t border-line-soft p-4 sm:grid-cols-2 md:p-5 xl:grid-cols-3">
          {STATUS_ORDER.map((x) => {
            const list = rows.filter((t) => t.status === x.s);
            return (
              <section key={x.s} className="min-w-0 rounded-md border-1.5 border-line bg-raised p-2.5" aria-label={x.label}>
                <h3 className="mb-2 flex items-center gap-2 px-1 text-13 font-medium text-ink-2">
                  <i className={cn("h-2 w-2 rounded-[2px]", barFill[x.tone])} aria-hidden />
                  {x.label}
                  <span className="ml-auto text-12 text-muted">{list.length}</span>
                </h3>
                <ul className="grid gap-2">
                  {list.map((t) => (
                    <li key={t.id} className="grid gap-2 rounded-md border-1.5 border-line bg-surface p-2.5">
                      <TaskCell t={t} portal={portal} link />
                      <span className="flex items-center gap-2 text-12.5 text-muted">
                        <LeadCell name={t.owner} />
                        <span className={cn("ml-auto", dueClass(t))}>{fmt(t.due)}</span>
                      </span>
                    </li>
                  ))}
                  {list.length === 0 && <li className="rounded-md border-1.5 border-dashed border-line-2 px-2 py-3 text-center text-12.5 text-muted">None</li>}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export function TodayScreen({ portal }: { portal: StaffPortal }) {
  const [scope, setScope] = React.useState<Scope>("all");
  const [assign, setAssign] = React.useState(false);
  const toast = useUndoToast();
  const cl = clientsFor(portal);
  const showInc = scope !== "compliance" && cl.some((c) => c.stage === "incorporating");
  const showCmp = scope !== "incorporating" && cl.some((c) => c.stage === "compliance");
  const scopeTabs = <ScopeTabs portal={portal} value={scope} onChange={setScope} />;
  const dialog = (
    <NewTodoDialog
      open={assign}
      onOpenChange={setAssign}
      title={portal === "lead" ? "New to-do" : "Assign task"}
      clients={cl.map((c) => ({ id: c.id, short: c.short }))}
      onAdd={(t) => toast.show(portal === "lead" ? `To-do added · ${t.text}` : `Task assigned · ${t.text}`)}
    />
  );
  const greeting = (
    <GreetingCard
      date={TODAY}
      time="12:31 PM"
      name={`Good afternoon, ${personOf(portal)}`}
      actions={
        <Button variant="primary" onClick={() => setAssign(true)}>
          <Plus size={16} strokeWidth={1.6} aria-hidden /> {portal === "lead" ? "New to-do" : "Assign task"}
        </Button>
      }
      stats={todayStats(portal, scope)}
    />
  );

  // Admin Today (reference/old-patch/admin/Main.dc.html, K-37): greeting, practice cards, clients, phase progress, managers and decisions.
  if (portal === "admin")
    return (
      <div className="grid grid-cols-1 gap-5">
        {greeting}
        <PracticeAreas portal={portal} />
        <FirmClientsGrid title="Clients · where each one is" rows={cl} />
        <PhaseProgress portal={portal} scope="all" />
        <div className={GRID}>
          <ManagersGrid rows={managerRows()} />
          <DecisionsCard portal={portal} notify={toast.show} />
        </div>
        {dialog}
        {toast.node}
      </div>
    );

  // Lead and manager Today (Main.dc.html, K-31): greeting, practice strip, action queue with the inbox, phase progress, filings.
  return (
    <div className="grid grid-cols-1 gap-5">
      {greeting}
      {portal === "manager" && (
        // ManagerToday.dc.html: Team tasks beside Approvals, Task status and Workload by lead.
        <div className={GRID}>
          <TeamTasks portal={portal} scope={scope} scopeTabs={scopeTabs} notify={toast.show} />
          <Col>
            <ApprovalsWaiting portal={portal} notify={toast.show} />
            <TaskStatusCard portal={portal} scope={scope} />
            <WorkloadByLead portal={portal} />
          </Col>
        </div>
      )}
      <div className={GRID}>
        <Col>
          <ActionQueue portal={portal} scope={scope} scopeTabs={portal === "lead" ? scopeTabs : undefined} />
          {showInc && <PhaseProgress portal={portal} scope={scope} />}
          {showCmp && <ClientsFilings portal={portal} scope={scope} />}
        </Col>
        <Col>
          <InboxCard portal={portal} scope={scope} notify={toast.show} />
          <WaitingOnClient portal={portal} scope={scope} notify={toast.show} />
        </Col>
      </div>
      {dialog}
      {toast.node}
    </div>
  );
}
