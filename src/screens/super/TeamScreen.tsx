"use client";
import * as React from "react";
import { Gauge, Repeat } from "lucide-react";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Bar } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { CAP, FIRM_CLIENTS, MANAGERS, REASSIGN, STAFF, type Staff } from "@/data/super";

const loadTone = (pct: number) => (pct > 80 ? "bad" : pct >= 70 ? "warn" : "accent");

const columns: Column<Staff>[] = [
  {
    key: "name",
    label: "Name",
    render: (s) => (
      <span className="flex min-w-0 items-center gap-2.5">
        <Avatar name={s.name} size={24} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{s.name}</span>
          <span className="block truncate text-12 text-muted">Reports to {s.reportsTo}</span>
        </span>
      </span>
    ),
  },
  { key: "role", label: "Role", className: "whitespace-nowrap" },
  { key: "clients", label: "Clients", align: "right", width: 80 },
  { key: "open", label: "Open tasks", align: "right", width: 96 },
  { key: "overdue", label: "Overdue", align: "right", width: 84, render: (s) => <span className={s.overdue ? "font-semibold text-bad" : "text-faint"}>{s.overdue}</span> },
  {
    key: "load",
    label: "Load",
    width: 160,
    render: (s) => (
      <span className="flex items-center gap-2">
        <Bar pct={s.load} tone={loadTone(s.load)} className="w-20" />
        <span className={cn("text-12.5", s.load > 80 ? "font-semibold text-bad" : "text-muted")}>{s.load}%</span>
      </span>
    ),
  },
  { key: "lastActive", label: "Last active", className: "whitespace-nowrap", width: 110 },
];

export function TeamScreen() {
  const [tab, setTab] = React.useState("managers");
  const [done, setDone] = React.useState<Record<string, boolean>>({});
  const rows = STAFF.filter((s) => tab === "all" || (tab === "managers" ? s.role === "Manager" : s.role === "Project lead"));

  const tones = ["accent", "violet", "teal", "warn"] as const;
  const per = MANAGERS.map((m, i) => ({ label: m.name, value: FIRM_CLIENTS.filter((c) => c.manager === m.name).length, tone: tones[i] }));
  const used = per.reduce((a, s) => a + s.value, 0);
  const total = MANAGERS.length * CAP;

  return (
    <Cols>
      <Col>
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
                { key: "all", label: "All", count: STAFF.length },
              ]}
              value={tab}
              onChange={setTab}
            />
          }
        />
      </Col>
      <Col>
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
                <Button size="sm" variant="outline" onClick={() => setDone((d) => ({ ...d, [r.id]: true }))}>
                  {r.action}
                </Button>
              )}
            </ListRow>
          ))}
        </SectionCard>
      </Col>
    </Cols>
  );
}
