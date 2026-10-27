"use client";
import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TODAY, fmt, relative } from "@/lib/dates";
import { clientsFor, overdueFilings } from "@/data/staff-clients";
import { tasksFor, APPROVALS, type StaffTask } from "@/data/staff-tasks";
import { managerRows } from "@/data/staff-team";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useUndoToast } from "@/components/ui/UndoToast";
import { GreetingCard } from "@/components/cards/GreetingCard";
import { SectionCard, HeadLink } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { ClientName, TaskChip, base, clientHref, personOf, taskHref, type StaffPortal } from "./parts";
import { ApprovalsCard, ClientsGrid, ManagersGrid } from "./grids";
import { ClientSelect } from "./filters";
import {
  ActionQueue,
  ClientsFilings,
  ComplianceHealth,
  DecisionsCard,
  InboxCard,
  PhaseProgress,
  PracticeAreas,
  PracticeStrip,
  ScopeSelect,
  TaskStatusCard,
  ThisWeek,
  WaitingOnClient,
  inScope,
  todayStats,
  type Scope,
} from "./today-parts";

// Staff Today. Old sources: reference/old-screens/s/lead/Main.dc.html (and TodayBefore, TodayAfter: the same page with
// every client incorporating or every client in compliance; here the scope select shows each variant), TodayPhone.dc.html,
// s/mgr/Main.dc.html (Team tasks, Task status, Approvals), reference/old-patch/admin/Main.dc.html.

function TeamTasks({ portal, scope }: { portal: StaffPortal; scope: Scope }) {
  const all = tasksFor(portal).filter((t) => t.status !== "Done" && inScope(scope, t.client));
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
            options={[{ value: "", label: "All statuses" }, ...["Overdue", "Due this week", "In progress", "With client", "Not started"].map((s) => ({ value: s, label: s }))]}
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

function OverdueFilings({ portal, scope }: { portal: StaffPortal; scope: Scope }) {
  const rows: AttentionRow[] = overdueFilings(clientsFor(portal).filter((c) => inScope(scope, c.id))).map((o, i) => ({
    id: o.id,
    date: o.due,
    title: `${o.name} · ${o.period}`,
    sub: `${o.client.short} · ${o.area}`,
    chip: { label: relative(o.due), tone: "bad" },
    urgent: i === 0,
    action: i === 0 ? { label: "Open", href: clientHref(portal, o.client.id) } : undefined,
    href: i === 0 ? undefined : clientHref(portal, o.client.id),
  }));
  if (rows.length === 0) return null;
  return (
    <SectionCard title="Overdue filings" meta={String(rows.length)} flush right={<HeadLink href={`${base(portal)}/compliances/filings`}>Filings ›</HeadLink>}>
      <AttentionList rows={rows} />
    </SectionCard>
  );
}

export function TodayScreen({ portal }: { portal: StaffPortal }) {
  const [scope, setScope] = React.useState<Scope>("all");
  const toast = useUndoToast();
  const cl = clientsFor(portal);
  const showInc = scope !== "compliance" && cl.some((c) => c.stage === "incorporating");
  const showCmp = scope !== "incorporating" && cl.some((c) => c.stage === "compliance");

  return (
    <div className="grid grid-cols-1 gap-5">
      <GreetingCard
        date={TODAY}
        eyebrow="Good morning"
        name={personOf(portal)}
        actions={
          <>
            <ScopeSelect portal={portal} value={scope} onChange={setScope} />
            <Button variant="onNavyPrimary" asChild>
              <Link href={`${base(portal)}/work`}>
                <Plus size={16} strokeWidth={1.5} /> New task
              </Link>
            </Button>
          </>
        }
        stats={todayStats(portal, scope)}
      />
      {portal === "admin" ? <PracticeAreas portal={portal} /> : <PracticeStrip portal={portal} />}
      <Cols>
        <Col>
          <ThisWeek portal={portal} scope={scope} />
          <ActionQueue portal={portal} scope={scope} />
          {portal === "manager" && <TeamTasks portal={portal} scope={scope} />}
          {portal === "admin" && <ClientsGrid portal={portal} title="Clients · where each one is" rows={cl.filter((c) => inScope(scope, c.id))} />}
          {showInc && <PhaseProgress portal={portal} scope={scope} />}
          {showCmp && <ClientsFilings portal={portal} scope={scope} />}
          {portal === "admin" && <ManagersGrid rows={managerRows()} />}
        </Col>
        <Col>
          {portal === "manager" && <ApprovalsCard items={APPROVALS.manager} portal={portal} />}
          {portal === "admin" && <DecisionsCard portal={portal} notify={toast.show} />}
          {portal !== "lead" && <TaskStatusCard portal={portal} scope={scope} />}
          <InboxCard portal={portal} scope={scope} notify={toast.show} />
          <WaitingOnClient portal={portal} scope={scope} notify={toast.show} />
          {showCmp && <ComplianceHealth portal={portal} scope={scope} />}
          {showCmp && <OverdueFilings portal={portal} scope={scope} />}
        </Col>
      </Cols>
      {toast.node}
    </div>
  );
}
