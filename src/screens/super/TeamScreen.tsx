"use client";
import * as React from "react";
import { Gauge, Repeat, UserCog, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Bar } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { ActivityList } from "@/components/cards/ActivityList";
import { CAP, FIRM_CLIENTS, MANAGERS, REASSIGN, STAFF, type Staff } from "@/data/super";
import { ADMINS, ADMIN_FEED, MANAGER_ROWS, clientsOfAdmin, type Admin, type ManagerRow } from "@/data/super-firm";
import { AssignDialog } from "./assign";

// Ported from reference/old-patch/super/Team.dc.html: "Admins · this month", "Managers" with days to COI and load,
// "What admins did". The staff grid, capacity and reassign cards stay from the first build.

const loadTone = (pct: number) => (pct > 80 ? "bad" : pct >= 70 ? "warn" : "accent");

const person = (name: string, sub: string) => (
  <span className="flex min-w-0 items-center gap-2.5">
    <Avatar name={name} size={24} />
    <span className="min-w-0">
      <span className="block truncate font-semibold">{name}</span>
      <span className="block truncate text-12 text-muted">{sub}</span>
    </span>
  </span>
);

const loadCell = (pct: number) => (
  <span className="flex items-center gap-2">
    <Bar pct={pct} tone={loadTone(pct)} className="w-20" />
    <span className={cn("text-12.5", pct > 80 ? "font-semibold text-bad" : "text-muted")}>{pct}%</span>
  </span>
);

const columns: Column<Staff>[] = [
  { key: "name", label: "Name", render: (s) => person(s.name, `Reports to ${s.reportsTo}`) },
  { key: "role", label: "Role", className: "whitespace-nowrap" },
  { key: "clients", label: "Clients", align: "right", width: 80 },
  { key: "open", label: "Open tasks", align: "right", width: 96 },
  { key: "overdue", label: "Overdue", align: "right", width: 84, render: (s) => <span className={s.overdue ? "font-semibold text-bad" : "text-faint"}>{s.overdue}</span> },
  { key: "load", label: "Load", width: 160, render: (s) => loadCell(s.load) },
  { key: "lastActive", label: "Last active", className: "whitespace-nowrap", width: 110 },
];

const adminCols: Column<Admin>[] = [
  { key: "name", label: "Admin", render: (a) => person(a.name, "Admin") },
  { key: "managers", label: "Managers", render: (a) => <span className="block max-w-[200px] truncate">{a.managers.join(", ")}</span> },
  { key: "clients", label: "Clients", align: "right", width: 76, render: (a) => clientsOfAdmin(a) },
  { key: "assigned", label: "Assigned", align: "right", width: 84 },
  { key: "reassigned", label: "Reassigned", align: "right", width: 96 },
  { key: "approvals", label: "Approvals", align: "right", width: 90 },
  { key: "resolved", label: "Escalations resolved", align: "right", width: 150 },
  { key: "open", label: "Open", align: "right", width: 64, render: (a) => <span className={cn(a.open && "font-semibold text-bad")}>{a.open}</span> },
  { key: "response", label: "Median response", align: "right", width: 130 },
];

const managerCols: Column<ManagerRow>[] = [
  { key: "name", label: "Manager", render: (m) => person(m.name, `${m.leads} project leads`) },
  { key: "admin", label: "Admin", className: "whitespace-nowrap" },
  { key: "clients", label: "Clients", align: "right", width: 76 },
  { key: "open", label: "Open", align: "right", width: 64 },
  { key: "late", label: "Late", align: "right", width: 60, render: (m) => <span className={cn(m.late && "font-semibold text-bad")}>{m.late}</span> },
  { key: "onTime", label: "On time", align: "right", width: 80, render: (m) => `${m.onTime}%` },
  { key: "days", label: "Days to COI", align: "right", width: 104, render: (m) => <span className={cn(m.daysToCoi > 35 && "font-semibold text-warn")}>{m.daysToCoi} days</span> },
  { key: "load", label: "Load", width: 150, render: (m) => loadCell(m.load) },
];

export function TeamScreen() {
  const [tab, setTab] = React.useState("managers");
  const [done, setDone] = React.useState<Record<string, boolean>>({});
  const [assign, setAssign] = React.useState<{ open: boolean; mode: "client" | "task" }>({ open: false, mode: "client" });
  const toast = useUndoToast();
  const rows = STAFF.filter((s) => tab === "all" || (tab === "managers" ? s.role === "Manager" : tab === "admins" ? s.role === "Admin" : s.role === "Project lead"));

  const tones = ["accent", "violet", "teal", "warn"] as const;
  const per = MANAGERS.map((m, i) => ({ label: m.name, value: FIRM_CLIENTS.filter((c) => c.manager === m.name).length, tone: tones[i] }));
  const used = per.reduce((a, s) => a + s.value, 0);
  const total = MANAGERS.length * CAP;

  return (
    <div className="grid grid-cols-1 gap-5">
      <DataGrid
        title="Admins · this month"
        icon={{ Icon: UserCog, tone: "violet" }}
        columns={adminCols}
        rows={ADMINS}
        rowKey={(a) => a.id}
        filters={
          <>
            <Button size="sm" variant="outline" onClick={() => setAssign({ open: true, mode: "task" })}>
              Assign task
            </Button>
            <Button size="sm" variant="primary" onClick={() => setAssign({ open: true, mode: "client" })}>
              <UserPlus size={14} strokeWidth={1.5} /> Assign client
            </Button>
          </>
        }
      />
      <Cols>
        <Col>
          <DataGrid title="Managers" columns={managerCols} rows={MANAGER_ROWS} rowKey={(m) => m.id} />
          <DataGrid
            title="Staff"
            columns={columns}
            rows={rows}
            rowKey={(s) => s.id}
            filters={
              <Tabs
                items={[
                  { key: "managers", label: "Managers", count: STAFF.filter((s) => s.role === "Manager").length },
                  { key: "leads", label: "Leads", count: STAFF.filter((s) => s.role === "Project lead").length },
                  { key: "admins", label: "Admins", count: STAFF.filter((s) => s.role === "Admin").length },
                  { key: "all", label: "All", count: STAFF.length },
                ]}
                value={tab}
                onChange={setTab}
              />
            }
          />
        </Col>
        <Col>
          <SectionCard title="What admins did" meta="This week" flush>
            <ActivityList rows={ADMIN_FEED} />
          </SectionCard>
          <SectionCard title="Capacity" meta={`${CAP} clients per manager`} icon={{ Icon: Gauge, tone: "blue" }}>
            <StackedBar total={`${used} / ${total}`} segments={[...per, { label: "Room", value: total - used, tone: "idle" }]} />
          </SectionCard>
          <SectionCard title="Reassign" flush icon={{ Icon: Repeat, tone: "violet" }}>
            {REASSIGN.map((r) => (
              <ListRow key={r.id}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.client}</span>
                  <span className="block truncate text-12.5 text-muted">
                    {r.from} to {r.to} · {r.why}
                  </span>
                </span>
                {done[r.id] ? (
                  <Chip tone="ok">Done</Chip>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDone((d) => ({ ...d, [r.id]: true }));
                      toast.show(`${r.client} is now with ${r.to}`, () => setDone((d) => ({ ...d, [r.id]: false })));
                    }}
                  >
                    {r.action}
                  </Button>
                )}
              </ListRow>
            ))}
          </SectionCard>
        </Col>
      </Cols>
      <AssignDialog open={assign.open} mode={assign.mode} onOpenChange={(v) => setAssign((a) => ({ ...a, open: v }))} onDone={(m) => toast.show(m)} />
      {toast.node}
    </div>
  );
}
