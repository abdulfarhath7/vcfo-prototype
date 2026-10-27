"use client";
import * as React from "react";
import { managerRows, leadRows, MANAGERS, UNASSIGNED, type LeadRow } from "@/data/staff-team";
import { Cols, Col } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Bar } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ManagersGrid } from "./grids";

/** Admin portal: managers and their load, plus clients to assign. From reference/old-screens/s/admin/Managers.dc.html and assign.js. */
export function ManagersScreen() {
  const [pick, setPick] = React.useState<Record<string, string>>({});
  const [assigned, setAssigned] = React.useState<Record<string, string>>({});
  const [mgr, setMgr] = React.useState("");
  const leads = leadRows().filter((l) => !mgr || l.manager === mgr);
  const open = UNASSIGNED.filter((u) => !assigned[u.id]);

  const leadCols: Column<LeadRow>[] = [
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
    { key: "manager", label: "Manager", width: 120 },
    { key: "clients", label: "Clients", width: 80, align: "right" },
    { key: "open", label: "Open", width: 80, align: "right" },
    { key: "overdue", label: "Overdue", width: 90, align: "right", render: (l) => <span className={l.overdue ? "font-semibold text-bad" : undefined}>{l.overdue || ""}</span> },
    {
      key: "load",
      label: "Load",
      width: 150,
      render: (l) => (
        <span className="flex items-center gap-2">
          <Bar pct={l.load} tone={l.load > 95 ? "bad" : l.load > 80 ? "warn" : "accent"} className="w-[80px]" />
          <span className="text-12.5 text-muted">{l.load}%</span>
        </span>
      ),
    },
  ];

  return (
    <Cols>
      <Col>
        <ManagersGrid rows={managerRows()} />
        <DataGrid
          title="Project leads"
          columns={leadCols}
          rows={leads}
          rowKey={(l) => l.name}
          filters={<Select value={mgr} onChange={(e) => setMgr(e.target.value)} options={[{ value: "", label: "All managers" }, ...MANAGERS.map((m) => ({ value: m.name, label: m.name }))]} aria-label="Manager" />}
        />
      </Col>
      <Col>
        <SectionCard title="Assign" meta={`${open.length} without a manager`} flush>
          {UNASSIGNED.length === 0 ? (
            <Empty />
          ) : (
            UNASSIGNED.map((u) => (
              <ListRow key={u.id} className="flex-wrap">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{u.name}</span>
                  <span className="block truncate text-12.5 text-muted">
                    {u.service} · {u.won}
                  </span>
                </span>
                {assigned[u.id] ? (
                  <Chip tone="ok">{assigned[u.id]}</Chip>
                ) : (
                  <span className="flex flex-none items-center gap-1.5">
                    <Select
                      value={pick[u.id] ?? ""}
                      onChange={(e) => setPick({ ...pick, [u.id]: e.target.value })}
                      options={[{ value: "", label: "Manager" }, ...MANAGERS.map((m) => ({ value: m.name, label: m.name }))]}
                      aria-label={`Manager for ${u.name}`}
                    />
                    <Button size="sm" variant="outline" disabled={!pick[u.id]} onClick={() => setAssigned({ ...assigned, [u.id]: pick[u.id] })}>
                      Assign
                    </Button>
                  </span>
                )}
              </ListRow>
            ))
          )}
        </SectionCard>
      </Col>
    </Cols>
  );
}
