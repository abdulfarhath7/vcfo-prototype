"use client";
import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TODAY, fmt, relative, urgency } from "@/lib/dates";
import { clientById, clientsFor, incDone, overdueFilings } from "@/data/staff-clients";
import { queueFor, tasksFor, INBOX, APPROVALS, type StaffTask } from "@/data/staff-tasks";
import { managerRows } from "@/data/staff-team";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Bar } from "@/components/ui/Bar";
import { Select } from "@/components/ui/Select";
import { GreetingCard } from "@/components/cards/GreetingCard";
import { SectionCard, ListRow, HeadLink, Empty } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { ClientDot, ClientName, TaskChip, base, clientHref, personOf, practiceStats, taskHref, type StaffPortal } from "./parts";
import { ApprovalsCard, ClientsGrid, ManagersGrid } from "./grids";

type Stage = "all" | "incorporating" | "compliance";

function stageOf(t: StaffTask) {
  return clientById(t.client)?.stage ?? "compliance";
}

function ActionQueue({ portal }: { portal: StaffPortal }) {
  const [stage, setStage] = React.useState<Stage>("all");
  const all = queueFor(portal);
  const rows = all.filter((t) => stage === "all" || stageOf(t) === stage);
  const cols: Column<StaffTask>[] = [
    { key: "client", label: "Client", width: 190, render: (t) => <ClientName id={t.client} short /> },
    { key: "title", label: "Task", render: (t) => <span className="font-semibold">{t.title}</span> },
    { key: "code", label: "Step", width: 90, render: (t) => t.code ?? "" },
    { key: "owner", label: "Owner", width: 120 },
    { key: "due", label: "Due", width: 80, render: (t) => <span className={urgency(t.due) === "bad" && t.status !== "Done" ? "font-semibold text-bad" : undefined}>{fmt(t.due)}</span> },
    { key: "status", label: "Status", width: 130, render: (t) => <TaskChip status={t.status} /> },
  ];
  return (
    <DataGrid
      title="Action queue"
      meta={`${rows.length} open`}
      columns={cols}
      rows={rows}
      rowKey={(t) => t.id}
      rowHref={(t) => taskHref(portal, t)}
      pageSize={8}
      filters={
        <Tabs
          items={[
            { key: "all", label: "All", count: all.length },
            { key: "incorporating", label: "Incorporating", count: all.filter((t) => stageOf(t) === "incorporating").length },
            { key: "compliance", label: "Compliance", count: all.filter((t) => stageOf(t) === "compliance").length },
          ]}
          value={stage}
          onChange={(k) => setStage(k as Stage)}
        />
      }
    />
  );
}

function TeamTasks({ portal }: { portal: StaffPortal }) {
  const all = tasksFor(portal).filter((t) => t.status !== "Done");
  const [lead, setLead] = React.useState("");
  const [status, setStatus] = React.useState("");
  const leads = [...new Set(all.map((t) => t.owner))];
  const rows = all.filter((t) => (!lead || t.owner === lead) && (!status || t.status === status)).sort((a, b) => a.due.getTime() - b.due.getTime());
  // C-0031: one status mark per row, no checkbox.
  const cols: Column<StaffTask>[] = [
    { key: "title", label: "Task", render: (t) => <span className="font-semibold">{t.title}</span> },
    { key: "client", label: "Client", width: 170, render: (t) => <ClientName id={t.client} short /> },
    { key: "owner", label: "Project lead", width: 130 },
    { key: "due", label: "Due", width: 80, render: (t) => fmt(t.due) },
    { key: "status", label: "Status", width: 130, render: (t) => <TaskChip status={t.status} /> },
  ];
  return (
    <DataGrid
      title="Team tasks"
      columns={cols}
      rows={rows}
      rowKey={(t) => t.id}
      rowHref={(t) => taskHref(portal, t)}
      pageSize={8}
      filters={
        <>
          <Select value={lead} onChange={(e) => setLead(e.target.value)} options={[{ value: "", label: "All leads" }, ...leads.map((l) => ({ value: l, label: l }))]} aria-label="Project lead" />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[{ value: "", label: "All statuses" }, ...["Overdue", "Due this week", "In progress", "With client", "Not started"].map((s) => ({ value: s, label: s }))]}
            aria-label="Status"
          />
        </>
      }
    />
  );
}

function PhaseProgress({ portal }: { portal: StaffPortal }) {
  const inc = clientsFor(portal).filter((c) => c.stage === "incorporating");
  return (
    <SectionCard title="Phase progress" meta={`${inc.length} incorporating`} flush>
      {inc.length === 0 ? (
        <Empty />
      ) : (
        inc.map((c) => {
          const done = incDone(c);
          return (
            <ListRow key={c.id} href={clientHref(portal, c.id)} className="grid grid-cols-[minmax(0,1fr)_64px] gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_56px]">
              <span className="flex min-w-0 items-center gap-2 font-semibold">
                <ClientDot tone={c.tone} />
                <span className="truncate">{c.short}</span>
                <span className="hidden truncate text-12.5 font-normal text-muted md:inline">{c.step}</span>
              </span>
              <Bar pct={Math.round((done / 25) * 100)} tone={c.health === "Stuck" || c.health === "Overdue" ? "bad" : "accent"} className="hidden md:block" />
              <span className="text-right text-12.5 text-muted">
                <b className="font-semibold text-ink">{done}</b>/25
              </span>
            </ListRow>
          );
        })
      )}
    </SectionCard>
  );
}

function Inbox({ portal }: { portal: StaffPortal }) {
  const rows = INBOX[portal];
  return (
    <SectionCard title="Inbox" meta={`${rows.filter((r) => r.unread).length} new`} flush right={<HeadLink href={`${base(portal)}/email`}>Email ›</HeadLink>}>
      {rows.map((r) => {
        const c = clientById(r.client);
        return (
          <ListRow key={r.id} href={clientHref(portal, r.client)} className="items-start">
            {c && <ClientDot tone={c.tone} className="mt-1.5" />}
            <span className="min-w-0 flex-1">
              <span className={r.unread ? "block truncate font-semibold" : "block truncate"}>{r.text}</span>
              <span className="block truncate text-12.5 text-muted">
                {c?.short} · {r.from}
              </span>
            </span>
            <span className="flex-none font-mono text-12 text-muted">{r.time}</span>
          </ListRow>
        );
      })}
    </SectionCard>
  );
}

function OverdueFilings({ portal }: { portal: StaffPortal }) {
  const rows: AttentionRow[] = overdueFilings(clientsFor(portal)).map((o, i) => ({
    id: o.id,
    date: o.due,
    title: `${o.name} · ${o.period}`,
    sub: `${o.client.short} · ${o.area}`,
    chip: { label: relative(o.due), tone: "bad" },
    urgent: i === 0,
    action: i === 0 ? { label: "Open", href: clientHref(portal, o.client.id) } : undefined,
    href: i === 0 ? undefined : clientHref(portal, o.client.id),
  }));
  return (
    <SectionCard title="Overdue filings" meta={String(rows.length)} flush right={<HeadLink href={`${base(portal)}/compliances/filings`}>Filings ›</HeadLink>}>
      <AttentionList rows={rows} />
    </SectionCard>
  );
}

export function TodayScreen({ portal }: { portal: StaffPortal }) {
  return (
    <div className="grid grid-cols-1 gap-5">
      <GreetingCard
        date={TODAY}
        eyebrow="Good morning"
        name={personOf(portal)}
        actions={
          <Button variant="onNavyPrimary" asChild>
            <Link href={`${base(portal)}/work`}>
              <Plus size={16} strokeWidth={1.5} /> New task
            </Link>
          </Button>
        }
        stats={practiceStats(portal)}
      />
      <Cols>
        <Col>
          <ActionQueue portal={portal} />
          {portal === "manager" && <TeamTasks portal={portal} />}
          {portal === "admin" && <ClientsGrid portal={portal} rows={clientsFor(portal)} />}
          {portal === "admin" && <ManagersGrid rows={managerRows()} />}
          <PhaseProgress portal={portal} />
        </Col>
        <Col>
          {portal !== "lead" && <ApprovalsCard items={APPROVALS[portal]} portal={portal} />}
          <Inbox portal={portal} />
          <OverdueFilings portal={portal} />
        </Col>
      </Cols>
    </div>
  );
}
