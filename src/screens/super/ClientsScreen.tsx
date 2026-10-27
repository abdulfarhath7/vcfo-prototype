"use client";
import * as React from "react";
import { fmt, urgency } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AREAS, FIRM_CLIENTS, HEALTH_TONE, MANAGERS, stageLabel, stageTone, type FirmClient } from "@/data/super";
import { ClientName, clientHref, opts } from "./parts";

const columns: Column<FirmClient>[] = [
  { key: "client", label: "Client", render: (c) => <ClientName client={c} sub={c.step} className="max-w-[300px]" /> },
  {
    key: "stage",
    label: "Stage",
    width: 124,
    render: (c) => (
      <Chip fixed tone={stageTone(c)}>
        {stageLabel(c)}
      </Chip>
    ),
  },
  { key: "area", label: "Area" },
  { key: "manager", label: "Manager", className: "whitespace-nowrap" },
  { key: "lead", label: "Project lead", className: "whitespace-nowrap" },
  { key: "next", label: "Next date", width: 96, render: (c) => <span className={cn("whitespace-nowrap", urgency(c.next) === "bad" && "font-semibold text-bad")}>{fmt(c.next)}</span> },
  { key: "overdue", label: "Overdue", align: "right", width: 84, render: (c) => <span className={c.overdue ? "font-semibold text-bad" : "text-faint"}>{c.overdue}</span> },
  {
    key: "health",
    label: "Health",
    width: 124,
    render: (c) => (
      <Chip fixed tone={HEALTH_TONE[c.health]}>
        {c.health}
      </Chip>
    ),
  },
];

export function ClientsScreen() {
  const [stage, setStage] = React.useState("");
  const [manager, setManager] = React.useState("");
  const [area, setArea] = React.useState("");
  const rows = FIRM_CLIENTS.filter((c) => (!stage || stageLabel(c) === stage) && (!manager || c.manager === manager) && (!area || c.area === area));

  return (
    <DataGrid
      title="All clients"
      columns={columns}
      rows={rows}
      rowKey={(c) => c.id}
      rowHref={(c) => clientHref(c.id)}
      filters={
        <>
          <Select aria-label="Stage" value={stage} onChange={(e) => setStage(e.target.value)} options={opts("All stages", ["Incorporating", "Compliance"])} />
          <Select
            aria-label="Manager"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            options={opts(
              "All managers",
              MANAGERS.map((m) => m.name),
            )}
          />
          <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)} options={opts("All areas", AREAS)} />
        </>
      }
    />
  );
}
