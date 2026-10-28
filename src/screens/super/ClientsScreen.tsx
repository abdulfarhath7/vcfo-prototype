"use client";
import * as React from "react";
import { UserPlus } from "lucide-react";
import { STAFF_TODAY, fmt, urgency } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { PhaseBar } from "@/components/ui/PhaseBar";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AREAS, FIRM_CLIENTS, HEALTH_TONE, HEALTH_WORD, MANAGERS, stageLabel, stageTone, type FirmClient } from "@/data/super";
import { initials } from "@/components/ui/Avatar";
import { ADMINS, HEALTH_ORDER, PHASE_NAMES, PHASE_TOTALS, adminOf, phasesOf, progressOf } from "@/data/super-firm";
import { ClientTile, clientHref, opts } from "./parts";
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
  const any = !!(admin || manager || stage || area);

  const columns: Column<FirmClient>[] = [
    {
      key: "client",
      label: "Client",
      width: 200,
      render: (c) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <ClientTile client={c} />
          <span className="min-w-0 font-semibold leading-snug">{short(c.name)}</span>
        </span>
      ),
    },
    {
      key: "now",
      label: "Now at",
      render: (c) => (
        <span className="block min-w-[160px]">
          <span className="line-clamp-2 font-semibold leading-snug">{c.step}</span>
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
    { key: "admin", label: "Admin", width: 96, render: (c) => adminOf(managerOf(c)) },
    {
      key: "manager",
      label: "Manager",
      width: 130,
      render: (c) => (
        <span className="flex items-center gap-2">
          <span className="inline-grid h-6 w-6 flex-none place-items-center rounded-md bg-raised text-[10px] font-semibold text-ink-2" aria-hidden>
            {initials(managerOf(c))}
          </span>
          <span className="min-w-0 leading-snug">{managerOf(c)}</span>
        </span>
      ),
    },
    {
      key: "stage",
      label: "Stage",
      width: 120,
      render: (c) => (
        <Chip fixed tone={stageTone(c)}>
          {stageLabel(c)}
        </Chip>
      ),
    },
    { key: "next", label: "Next", width: 64, render: (c) => <span className={cn("whitespace-nowrap", urgency(c.next, STAFF_TODAY) === "bad" && "font-semibold text-bad")}>{fmt(c.next)}</span> },
    {
      key: "health",
      label: "Health",
      width: 150,
      render: (c) => <Chip tone={HEALTH_TONE[c.health]}>{HEALTH_WORD[c.health]}</Chip>,
    },
  ];

  return (
    <>
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
          <>
            <Select
              aria-label="Admin"
              value={admin}
              onChange={(e) => {
                setAdmin(e.target.value);
                setManager("");
              }}
              options={opts(
                "All admins",
                ADMINS.map((a) => a.name),
              )}
            />
            <Select aria-label="Manager" value={manager} onChange={(e) => setManager(e.target.value)} options={opts("All managers", managers)} />
            <Select aria-label="Stage" value={stage} onChange={(e) => setStage(e.target.value)} options={opts("All stages", ["Incorporating", "Compliance"])} />
            <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)} options={opts("All areas", AREAS)} />
            {any && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdmin("");
                  setManager("");
                  setStage("");
                  setArea("");
                }}
              >
                Clear
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={() => setAssignOpen(true)}>
              <UserPlus size={14} strokeWidth={1.5} /> Assign client
            </Button>
          </>
        }
      />
      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} onDone={(m) => toast.show(m)} />
      {toast.node}
    </>
  );
}
