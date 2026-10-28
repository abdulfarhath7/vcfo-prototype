"use client";
import * as React from "react";
import { UserPlus } from "lucide-react";
import { STAFF_TODAY, fmt, urgency } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { AreaPill, Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { PhaseBar } from "@/components/ui/PhaseBar";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AREAS, FIRM_CLIENTS, HEALTH_TONE, HEALTH_WORD, MANAGERS, stageLabel, type FirmClient } from "@/data/super";
import { ADMINS, HEALTH_ORDER, PHASE_NAMES, PHASE_TOTALS, adminOf, phasesOf, progressOf } from "@/data/super-firm";
import { ClientTile, FilterChips, clientHref } from "./parts";
import { AssignDialog, useAssignments } from "./assign";

// Ported from reference/old-screens/s/super/Clients.dc.html: every column, the Admin, Manager and Stage filters,
// the row count, Clear, the empty state and "Assign client". Rows: client code tile, "Now at" with the old step code and lead,
// the manager with an initials tile, and the old health words ("Due this week", "Waiting on client").

const short = (n: string) => n.replace(/ (Pvt Ltd|LLP)$/, "");

export function ClientsScreen() {
  const { managerOf } = useAssignments();
  const [admin, setAdmin] = React.useState("");
  const [manager, setManager] = React.useState("");
  const [stage, setStage] = React.useState("");
  const [area, setArea] = React.useState("");
  const [assignOpen, setAssignOpen] = React.useState(false);
  const toast = useUndoToast();

  const adminRow = ADMINS.find((a) => a.name === admin);
  const managers = MANAGERS.map((m) => m.name).filter((m) => !adminRow || adminRow.managers.includes(m));
  const rows = FIRM_CLIENTS.filter((c) => {
    const m = managerOf(c);
    return (!admin || adminOf(m) === admin) && (!manager || m === manager) && (!stage || stageLabel(c) === stage) && (!area || c.area === area);
  }).sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health] || a.name.localeCompare(b.name));

  const columns: Column<FirmClient>[] = [
    {
      key: "client",
      label: "Client",
      width: 200,
      render: (c) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <ClientTile client={c} />
          <span className="min-w-0 font-medium leading-snug">{short(c.name)}</span>
        </span>
      ),
    },
    {
      key: "now",
      label: "Now at",
      render: (c) => (
        <span className="block min-w-[160px]">
          <span className="line-clamp-2 font-medium leading-snug">{c.step}</span>
          <span className="block truncate text-12 text-muted">
            {c.code} · {c.lead}
          </span>
        </span>
      ),
    },
    {
      key: "progress",
      label: "Progress",
      width: 150,
      render: (c) => (
        <span className="flex items-center gap-2">
          <PhaseBar done={phasesOf(c)} totals={PHASE_TOTALS} names={PHASE_NAMES} className="w-24" />
          <span className="text-12.5 text-muted">{progressOf(c)}%</span>
        </span>
      ),
    },
    { key: "admin", label: "Admin", width: 110, className: "whitespace-nowrap", render: (c) => adminOf(managerOf(c)) },
    {
      key: "manager",
      label: "Manager",
      width: 150,
      className: "whitespace-nowrap",
      render: (c) => (
        <span className="flex items-center gap-2">
          <Avatar name={managerOf(c)} size={24} />
          <span className="min-w-0 leading-snug">{managerOf(c)}</span>
        </span>
      ),
    },
    {
      key: "stage",
      label: "Stage",
      width: 120,
      render: (c) => (
        <AreaPill area={stageLabel(c)} reg={c.stage === "incorporating" ? "mca" : undefined} className="gap-1 px-[7px]" />
      ),
    },
    { key: "next", label: "Next", width: 64, render: (c) => <span className={cn("whitespace-nowrap", urgency(c.next, STAFF_TODAY) === "bad" && "font-medium text-bad")}>{fmt(c.next)}</span> },
    {
      key: "health",
      label: "Health",
      width: 124,
      render: (c) => <Chip fixed tone={HEALTH_TONE[c.health]}>{HEALTH_WORD[c.health]}</Chip>,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      <FilterChips
        onClear={() => {
          setAdmin("");
          setManager("");
          setStage("");
          setArea("");
        }}
        filters={[
          {
            key: "admin",
            label: "Admin",
            value: admin,
            options: ADMINS.map((a) => a.name),
            onChange: (v) => {
              setAdmin(v);
              setManager("");
            },
          },
          { key: "manager", label: "Manager", value: manager, options: managers, onChange: setManager },
          { key: "stage", label: "Stage", value: stage, options: ["Incorporating", "Compliance"], onChange: setStage },
          { key: "area", label: "Area", value: area, options: AREAS, onChange: setArea },
        ]}
      />
      <DataGrid
        title="All clients"
        meta={`${rows.length} of ${FIRM_CLIENTS.length}`}
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        rowHref={(c) => clientHref(c.id)}
        pageSize={17}
        empty="No client matches these filters"
        filters={
          <Button size="sm" variant="primary" onClick={() => setAssignOpen(true)}>
            <UserPlus size={14} strokeWidth={1.6} /> Assign client
          </Button>
        }
      />
      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} onDone={(m) => toast.show(m)} />
      {toast.node}
    </div>
  );
}
