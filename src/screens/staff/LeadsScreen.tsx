"use client";
import * as React from "react";
import { User } from "lucide-react";
import { fmt } from "@/lib/dates";
import { TASKS } from "@/data/staff-tasks";
import { leadRows, type LeadRow } from "@/data/staff-team";
import { Row } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Bar } from "@/components/ui/Bar";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { clientById } from "@/data/staff-clients";
import { ClientDot, TaskChip, taskHref, type StaffPortal } from "./parts";

const loadTone = (n: number) => (n > 95 ? "bad" : n > 80 ? "warn" : "accent");

/** Manager portal: Pranay's project leads. Ported from reference/old-screens/s/mgr/Leads.dc.html. */
export function LeadsScreen({ portal }: { portal: StaffPortal }) {
  const rows = leadRows("Pranay");
  const cols: Column<LeadRow>[] = [
    {
      key: "name",
      label: "Project lead",
      render: (l) => (
        <span className="flex items-center gap-2 font-semibold">
          <Avatar name={l.name} size={24} />
          {l.name}
        </span>
      ),
    },
    { key: "clients", label: "Clients", width: 90, align: "right" },
    { key: "open", label: "Open tasks", width: 100, align: "right" },
    { key: "overdue", label: "Overdue", width: 90, align: "right", render: (l) => <span className={l.overdue ? "font-semibold text-bad" : undefined}>{l.overdue || ""}</span> },
    {
      key: "load",
      label: "Load",
      width: 160,
      render: (l) => (
        <span className="flex items-center gap-2">
          <Bar pct={l.load} tone={loadTone(l.load)} className="w-[80px]" />
          <span className="text-12.5 text-muted">{l.hours} h</span>
        </span>
      ),
    },
    { key: "lastActive", label: "Last active", width: 110 },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <DataGrid title="Project leads" columns={cols} rows={rows} rowKey={(l) => l.name} />
      <Row cols={3}>
        {rows.map((l) => {
          const open = TASKS.filter((t) => t.owner === l.name && t.status !== "Done").sort((a, b) => a.due.getTime() - b.due.getTime());
          return (
            <SectionCard key={l.name} title={l.name} meta={`${l.open} open`} flush icon={{ Icon: User, tone: "violet" }}>
              {open.length === 0 ? (
                <Empty />
              ) : (
                open.slice(0, 5).map((t) => {
                  const c = clientById(t.client);
                  return (
                    <ListRow key={t.id} href={taskHref(portal, t)}>
                      {c && <ClientDot tone={c.tone} />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{t.title}</span>
                        <span className="block truncate text-12.5 text-muted">
                          {c?.short} · {fmt(t.due)}
                        </span>
                      </span>
                      <TaskChip status={t.status} />
                    </ListRow>
                  );
                })
              )}
            </SectionCard>
          );
        })}
      </Row>
    </div>
  );
}
