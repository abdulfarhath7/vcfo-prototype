"use client";
import * as React from "react";
import { clientsFor } from "@/data/staff-clients";
import { MANAGERS } from "@/data/staff-team";
import { Select } from "@/components/ui/Select";
import { ClientsGrid } from "./grids";
import type { StaffPortal } from "./parts";

export function ClientsScreen({ portal }: { portal: StaffPortal }) {
  const [stage, setStage] = React.useState("");
  const [manager, setManager] = React.useState("");
  const rows = clientsFor(portal).filter((c) => (!stage || c.stage === stage) && (!manager || c.manager === manager));
  return (
    <ClientsGrid
      portal={portal}
      rows={rows}
      pageSize={12}
      filters={
        <>
          <Select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            options={[
              { value: "", label: "All stages" },
              { value: "incorporating", label: "Incorporating" },
              { value: "compliance", label: "Compliance" },
            ]}
            aria-label="Stage"
          />
          {portal === "admin" && (
            <Select value={manager} onChange={(e) => setManager(e.target.value)} options={[{ value: "", label: "All managers" }, ...MANAGERS.map((m) => ({ value: m.name, label: m.name }))]} aria-label="Manager" />
          )}
        </>
      }
    />
  );
}
