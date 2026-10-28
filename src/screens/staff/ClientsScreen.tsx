"use client";
import * as React from "react";
import { clientsFor, HEALTH_ORDER, type Health } from "@/data/staff-clients";
import { MANAGERS } from "@/data/staff-team";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { ClientsGrid } from "./grids";
import { AssignDialog, managerOf, useAssignments } from "./record-parts";
import type { StaffPortal } from "./parts";
import { waitWord } from "@/data/status-words";

const OLD_ORDER = ["brightwave", "tidewater", "kestrel", "halcyon", "northwind", "orchid", "larkspur", "juniper"];
const HEALTHS: Health[] = ["Stuck", "Overdue", "Due this week", "With client", "In progress", "Not started"];

/** Ported from reference/old-screens/s/lead/Clients.dc.html (stage tabs) and reference/old-patch/admin/Clients.dc.html (manager, stage, health, Assign client). */
export function ClientsScreen({ portal }: { portal: StaffPortal }) {
  const s = useAssignments();
  const [stage, setStage] = React.useState("");
  const [manager, setManager] = React.useState("");
  const [health, setHealth] = React.useState("");
  const [assign, setAssign] = React.useState(false);
  const toast = useUndoToast();

  const all = clientsFor(portal);
  const rows = all
    .filter((c) => (!stage || c.stage === stage) && (!manager || managerOf(c, s) === manager) && (!health || c.health === health))
    // Admin: worst health first (old admin Clients). Lead and manager: compliance clients first, in the old order.
    .sort((a, b) => (portal === "admin" ? HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health] || a.name.localeCompare(b.name) : OLD_ORDER.indexOf(a.id) - OLD_ORDER.indexOf(b.id)));
  const any = !!(manager || health || (portal === "admin" && stage));

  const stageCount = (k: string) => all.filter((c) => c.stage === k).length;
  // Old lead and manager Clients: stage tabs only. Old admin Clients: manager, stage and health dropdowns, then Assign client.
  const filters = (
    <>
      {portal !== "admin" && (
        <Tabs
          items={[
            { key: "", label: "All", count: all.length },
            { key: "incorporating", label: "Incorporating", count: stageCount("incorporating") },
            { key: "compliance", label: "Compliance", count: stageCount("compliance") },
          ]}
          value={stage}
          onChange={setStage}
        />
      )}
      {portal === "admin" && (
        <>
          <Select value={manager} onChange={(e) => setManager(e.target.value)} options={[{ value: "", label: "All managers" }, ...MANAGERS.map((m) => ({ value: m.name, label: m.name }))]} aria-label="Manager" />
          <Select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            options={[
              { value: "", label: "All stages" },
              { value: "incorporating", label: `Incorporating (${stageCount("incorporating")})` },
              { value: "compliance", label: `Compliance (${stageCount("compliance")})` },
            ]}
            aria-label="Stage"
          />
          <Select value={health} onChange={(e) => setHealth(e.target.value)} options={[{ value: "", label: "Any health" }, ...HEALTHS.map((h) => ({ value: h, label: waitWord(h) }))]} aria-label="Health" />
        </>
      )}
      {portal === "admin" && any && (
        <Button
          size="sm"
          variant="link"
          onClick={() => {
            setStage("");
            setManager("");
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
      <ClientsGrid portal={portal} rows={rows} pageSize={14} meta={`${rows.length} of ${all.length}`} filters={filters} showLead />
      {portal === "admin" && <AssignDialog open={assign} onOpenChange={setAssign} mode="client" onDone={(t) => toast.show(t)} />}
      {toast.node}
    </>
  );
}
