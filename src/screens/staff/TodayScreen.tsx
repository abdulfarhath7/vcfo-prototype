"use client";
import { waitWord } from "@/data/status-words";
import * as React from "react";
import { Plus } from "lucide-react";
import { STAFF_TODAY as TODAY, fmt } from "@/lib/dates";
import { clientsFor } from "@/data/staff-clients";
import { tasksFor, type StaffTask } from "@/data/staff-tasks";
import { managerRows } from "@/data/staff-team";
import { Cols, Col, Row } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useUndoToast } from "@/components/ui/UndoToast";
import { GreetingCard } from "@/components/cards/GreetingCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ClientName, TaskChip, personOf, taskHref, type StaffPortal } from "./parts";
import { FirmClientsGrid, ManagersGrid } from "./grids";
import { ClientSelect } from "./filters";
import { NewTodoDialog } from "./work-parts";
import {
  ActionQueue,
  ApprovalsWaiting,
  ClientsFilings,
  DecisionsCard,
  InboxCard,
  PhaseProgress,
  PracticeAreas,
  ScopeTabs,
  TaskStatusCard,
  WaitingOnClient,
  inScope,
  todayStats,
  type Scope,
} from "./today-parts";

// Staff Today. Old sources: reference/old-screens/s/lead/Main.dc.html (and TodayBefore, TodayAfter: the same page with
// every client incorporating or every client in compliance; here the scope select shows each variant), TodayPhone.dc.html,
// s/mgr/Main.dc.html (Team tasks, Task status, Approvals), reference/old-patch/admin/Main.dc.html.

function TeamTasks({ portal, scope }: { portal: StaffPortal; scope: Scope }) {
  const all = tasksFor(portal).filter((t) => inScope(scope, t.client));
  const [lead, setLead] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [client, setClient] = React.useState("");
  const leads = [...new Set(all.map((t) => t.owner))];
  const rows = all.filter((t) => (!lead || t.owner === lead) && (!status || t.status === status) && (!client || t.client === client)).sort((a, b) => a.due.getTime() - b.due.getTime());
  const any = lead || status || client;
  // C-0031: one status mark per row, no checkbox.
  const cols: Column<StaffTask>[] = [
    { key: "title", label: "Task", render: (t) => <span className="font-semibold">{t.title}</span> },
    { key: "client", label: "Client", width: 170, render: (t) => <ClientName id={t.client} short /> },
    { key: "owner", label: "Project lead", width: 130 },
    { key: "due", label: "Due", width: 80, render: (t) => <span className={t.due < TODAY ? "font-semibold text-bad" : undefined}>{fmt(t.due)}</span> },
    { key: "status", label: "Status", width: 130, render: (t) => <TaskChip status={t.status} /> },
  ];
  return (
    <DataGrid
      title="Team tasks"
      meta={String(rows.length)}
      columns={cols}
      rows={rows}
      rowKey={(t) => t.id}
      rowHref={(t) => taskHref(portal, t)}
      pageSize={8}
      empty="No tasks match these filters"
      filters={
        <>
          <Select value={lead} onChange={(e) => setLead(e.target.value)} options={[{ value: "", label: "All leads" }, ...leads.map((l) => ({ value: l, label: l }))]} aria-label="Project lead" />
          <ClientSelect clients={clientsFor(portal).filter((c) => inScope(scope, c.id))} value={client} onChange={setClient} />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[{ value: "", label: "All statuses" }, ...["Overdue", "Due this week", "In progress", "With client", "Not started"].map((s) => ({ value: s, label: waitWord(s) }))]}
            aria-label="Status"
          />
          {any && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setLead("");
                setStatus("");
                setClient("");
              }}
            >
              Clear
            </Button>
          )}
        </>
      }
    />
  );
}

export function TodayScreen({ portal }: { portal: StaffPortal }) {
  const [scope, setScope] = React.useState<Scope>("all");
  const [assign, setAssign] = React.useState(false);
  const toast = useUndoToast();
  const cl = clientsFor(portal);
  const showInc = scope !== "compliance" && cl.some((c) => c.stage === "incorporating");
  const showCmp = scope !== "incorporating" && cl.some((c) => c.stage === "compliance");
  const greeting = (
    <GreetingCard
      date={TODAY}
      time="12:31 PM"
      name={`Good afternoon, ${personOf(portal)}`}
      actions={
        portal === "admin" ? undefined : (
          <>
            <ScopeTabs portal={portal} value={scope} onChange={setScope} />
            {portal === "manager" && (
              <Button variant="primary" onClick={() => setAssign(true)}>
                <Plus size={16} strokeWidth={1.6} aria-hidden /> Assign task
              </Button>
            )}
          </>
        )
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
        <Row cols={2}>
          <ManagersGrid rows={managerRows()} />
          <DecisionsCard portal={portal} notify={toast.show} />
        </Row>
        {toast.node}
      </div>
    );

  // Lead and manager Today (Main.dc.html, K-31): greeting, practice strip, action queue with the inbox, phase progress, filings.
  return (
    <div className="grid grid-cols-1 gap-5">
      {greeting}
      {portal === "manager" && (
        <Cols>
          <Col>
            <TeamTasks portal={portal} scope={scope} />
          </Col>
          <Col>
            <TaskStatusCard portal={portal} scope={scope} />
          </Col>
        </Cols>
      )}
      <Cols>
        <Col>
          <ActionQueue portal={portal} scope={scope} />
          {showInc && <PhaseProgress portal={portal} scope={scope} />}
          {showCmp && <ClientsFilings portal={portal} scope={scope} />}
        </Col>
        <Col>
          {portal === "manager" && <ApprovalsWaiting portal={portal} notify={toast.show} />}
          <InboxCard portal={portal} scope={scope} notify={toast.show} />
          <WaitingOnClient portal={portal} scope={scope} notify={toast.show} />
        </Col>
      </Cols>
      {portal === "manager" && (
        <NewTodoDialog
          open={assign}
          onOpenChange={setAssign}
          title="Assign task"
          clients={clientsFor(portal).map((c) => ({ id: c.id, short: c.short }))}
          onAdd={(t) => toast.show(`Task assigned · ${t.text}`)}
        />
      )}
      {toast.node}
    </div>
  );
}
