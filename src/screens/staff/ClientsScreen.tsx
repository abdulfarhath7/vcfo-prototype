"use client";
import * as React from "react";
import { clientsFor, HEALTH_ORDER, type Health } from "@/data/staff-clients";
import { MANAGERS } from "@/data/staff-team";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { ClientsGrid } from "./grids";
import { AssignDialog, managerOf, leadOf, useAssignments } from "./record-parts";
import type { StaffPortal } from "./parts";

const HEALTHS: Health[] = ["Stuck", "Overdue", "Due this week", "With client", "In progress", "Not started"];

/** Ported from reference/old-screens/s/lead/Clients.dc.html (stage tabs) and reference/old-patch/admin/Clients.dc.html (manager, stage, health, Assign client). */
export function ClientsScreen({ portal }: { portal: StaffPortal }) {
  const s = useAssignments();
  const [stage, setStage] = React.useState("");
  const [manager, setManager] = React.useState("");
  const [lead, setLead] = React.useState("");
  const [health, setHealth] = React.useState("");
  const [assign, setAssign] = React.useState(false);
  const toast = useUndoToast();

  const all = clientsFor(portal);
  const rows = all
    .filter((c) => (!stage || c.stage === stage) && (!manager || managerOf(c, s) === manager) && (!lead || leadOf(c, s) === lead) && (!health || c.health === health))
    .sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health] || a.name.localeCompare(b.name));
  const any = !!(stage || manager || lead || health);
  const leads = [...new Set(all.map((c) => leadOf(c, s)))];

  const filters = (
    <>
      <Tabs
        items={[
          { key: "", label: "All", count: all.length },
          { key: "incorporating", label: "Incorporating", count: all.filter((c) => c.stage === "incorporating").length },
          { key: "compliance", label: "Compliance", count: all.filter((c) => c.stage === "compliance").length },
        ]}
        value={stage}
        onChange={setStage}
      />
      {portal === "admin" && <Select value={manager} onChange={(e) => setManager(e.target.value)} options={[{ value: "", label: "All managers" }, ...MANAGERS.map((m) => ({ value: m.name, label: m.name }))]} aria-label="Manager" />}
      {portal !== "lead" && <Select value={lead} onChange={(e) => setLead(e.target.value)} options={[{ value: "", label: "All leads" }, ...leads.map((l) => ({ value: l, label: l }))]} aria-label="Project lead" />}
      <Select value={health} onChange={(e) => setHealth(e.target.value)} options={[{ value: "", label: "Any health" }, ...HEALTHS.map((h) => ({ value: h, label: h }))]} aria-label="Health" />
      {any && (
        <Button
          size="sm"
          variant="link"
          onClick={() => {
            setStage("");
            setManager("");
            setLead("");
            setHealth("");
          }}
        >
          Clear
        </Button>
      )}
      {portal === "admin" && (
        <Button size="sm" variant="primary" onClick={() => setAssign(true)}>
          Assign client
        </Button>
      )}
    </>
  );

  return (
    <>
      <ClientsGrid portal={portal} rows={rows} pageSize={12} meta={`${rows.length} of ${all.length}`} filters={filters} />
      {portal === "admin" && <AssignDialog open={assign} onOpenChange={setAssign} mode="client" onDone={(t) => toast.show(t)} />}
      {toast.node}
    </>
  );
}
