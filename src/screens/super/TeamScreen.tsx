"use client";
import * as React from "react";
import { Gauge, Repeat, UserCog, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Bar, barFill } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { CAP, FIRM_CLIENTS, MANAGERS, REASSIGN, STAFF, type Staff } from "@/data/super";
import { ADMINS, ADMIN_FEED, MANAGER_ROWS, clientsOfAdmin, type Admin, type ManagerRow } from "@/data/super-firm";
import { AssignDialog } from "./assign";
import { AdminFeedList } from "./parts";

// Ported from reference/old-patch/super/Team.dc.html: "Admins · this month", "Managers" with days to COI and load,
// "What admins did" (tile, full sentence, who and when). The staff grid, capacity and reassign cards stay from the first build.

const loadTone = (pct: number) => (pct > 80 ? "bad" : pct >= 70 ? "warn" : "accent");

const person = (name: string, sub: string) => (
  <span className="flex min-w-0 items-center gap-2.5">
    <Avatar name={name} size={24} />
    <span className="min-w-0">
      <span className="block truncate font-medium">{name}</span>
      <span className="block truncate text-12 text-muted">{sub}</span>
    </span>
  </span>
);

const loadCell = (pct: number) => (
  <span className="flex items-center gap-2">
    <Bar pct={pct} tone={loadTone(pct)} className="w-20" />
    <span className={cn("text-12.5", pct > 80 ? "font-medium text-bad" : "text-muted")}>{pct}%</span>
  </span>
);

const columns: Column<Staff>[] = [
  { key: "name", label: "Name", render: (s) => person(s.name, `Reports to ${s.reportsTo}`) },
  { key: "role", label: "Role", className: "whitespace-nowrap" },
  { key: "clients", label: "Clients", align: "right", width: 80 },
  { key: "open", label: "Open tasks", align: "right", width: 96 },
  { key: "overdue", label: "Overdue", align: "right", width: 84, render: (s) => <span className={s.overdue ? "font-medium text-bad" : "text-faint"}>{s.overdue}</span> },
  { key: "load", label: "Load", width: 160, render: (s) => loadCell(s.load) },
  { key: "lastActive", label: "Last active", className: "whitespace-nowrap", width: 110 },
];

const adminCols: Column<Admin>[] = [
  { key: "name", label: "Admin", render: (a) => person(a.name, "Admin") },
  { key: "managers", label: "Managers", width: 120, render: (a) => <AvatarStack names={a.managers} label={`Managers: ${a.managers.join(", ")}`} /> },
  { key: "clients", label: "Clients", align: "right", width: 76, render: (a) => clientsOfAdmin(a) },
  { key: "assigned", label: "Assigned", align: "right", width: 84 },
  { key: "reassigned", label: "Reassigned", align: "right", width: 96 },
  { key: "approvals", label: "Approvals", align: "right", width: 90 },
  { key: "resolved", label: "Escalations resolved", align: "right", width: 150 },
  { key: "open", label: "Open", align: "right", width: 64, render: (a) => <span className={cn(a.open && "font-medium text-bad")}>{a.open}</span> },
  { key: "response", label: "Median response", align: "right", width: 130 },
];

const managerCols: Column<ManagerRow>[] = [
  { key: "name", label: "Manager", render: (m) => person(m.name, `${m.leads} project leads`) },
  { key: "admin", label: "Admin", className: "whitespace-nowrap" },
  { key: "clients", label: "Clients", align: "right", width: 76 },
  { key: "open", label: "Open", align: "right", width: 64 },
  { key: "late", label: "Late", align: "right", width: 60, render: (m) => <span className={cn(m.late && "font-medium text-bad")}>{m.late}</span> },
  { key: "onTime", label: "On time", align: "right", width: 80, render: (m) => `${m.onTime}%` },
  { key: "days", label: "Days to COI", align: "right", width: 104, render: (m) => <span className={cn(m.daysToCoi > 35 && "font-medium text-warn")}>{m.daysToCoi} days</span> },
  { key: "load", label: "Load", width: 150, render: (m) => loadCell(m.load) },
];

export function TeamScreen() {
  const [tab, setTab] = React.useState("managers");
  const [done, setDone] = React.useState<Record<string, boolean>>({});
  const [assign, setAssign] = React.useState<{ open: boolean; mode: "client" | "task" }>({ open: false, mode: "client" });
  const toast = useUndoToast();
  const rows = STAFF.filter((s) => tab === "all" || (tab === "managers" ? s.role === "Manager" : tab === "admins" ? s.role === "Admin" : s.role === "Project lead"));

  const per = MANAGERS.map((m) => ({ label: m.name, value: FIRM_CLIENTS.filter((c) => c.manager === m.name).length }));
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
              <UserPlus size={14} strokeWidth={1.6} /> Assign client
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
          <SectionCard title="What admins did" flush>
            <AdminFeedList rows={ADMIN_FEED} />
          </SectionCard>
          <SectionCard title="Capacity" meta={`${used} / ${total} · ${CAP} clients per manager`} icon={{ Icon: Gauge, tone: "blue" }} flush>
            <ul>
              {per.map((p) => (
                <li key={p.label} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
                  <Avatar name={p.label} size={24} />
                  <span className="truncate text-13.5 font-medium">{p.label}</span>
                  <span className="text-12.5 text-muted">
                    {p.value} of {CAP}
                  </span>
                  <Bar pct={(p.value / CAP) * 100} tone={loadTone((p.value / CAP) * 100)} height={8} className="col-span-2 col-start-2" />
                </li>
              ))}
            </ul>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-soft px-4 py-2.5 text-12.5 text-muted md:px-5">
              {(["accent", "warn", "bad"] as const).map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <i className={cn("h-2 w-2 rounded-[2px]", barFill[t])} aria-hidden />
                  {t === "accent" ? "Under 70%" : t === "warn" ? "70 to 80%" : "Over 80%"}
                </span>
              ))}
            </p>
          </SectionCard>
          <SectionCard title="Reassign" flush icon={{ Icon: Repeat, tone: "violet" }}>
            {REASSIGN.map((r) => (
              <ListRow key={r.id}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.client}</span>
                  <span className="block truncate text-12.5 text-muted">
                    {r.from} to {r.to} · {r.why}
                  </span>
                </span>
                {done[r.id] ? (
                  <Chip fixed tone="ok">Done</Chip>
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
