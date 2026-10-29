"use client";
import * as React from "react";
import { d } from "@/lib/dates";
import { CONTACTS, clientChanged, clientsFor, HEALTH_ORDER, type Health, type StaffClient } from "@/data/staff-clients";
import { PREVIOUS_VISIT } from "@/data/staff-tasks";
import { LEADS, MANAGERS } from "@/data/staff-team";
import type { GridActions } from "@/components/cards/DataGrid";
import type { SavedView, ViewFilters } from "@/components/cards/SavedViews";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { ClientsGrid } from "./grids";
import { FilterChip } from "./today-parts";
import { AssignDialog, assignLead, assignManager, leadOf, managerOf, useAssignments } from "./record-parts";
import { personOf, type StaffPortal } from "./parts";
import { waitWord } from "@/data/status-words";

const OLD_ORDER = ["brightwave", "tidewater", "kestrel", "halcyon", "northwind", "orchid", "larkspur", "juniper"];
const HEALTHS: Health[] = ["Stuck", "Overdue", "Due this week", "With client", "In progress", "Not started"];

/** Due filter on the next date: the staff week of Fri 16 Oct runs Mon 12 to Sun 18 Oct. */
const WEEKS: Record<string, [Date, Date]> = { week: [d(2026, 10, 12), d(2026, 10, 18)], next: [d(2026, 10, 19), d(2026, 10, 25)] };
const WHEN_OPTS = [
  { value: "week", label: "This week" },
  { value: "next", label: "Next week" },
];

/** E-06: the default views. "+ Save view" adds the user's own. */
const VIEWS: SavedView[] = [
  { key: "all", label: "All", filters: {} },
  { key: "overdue", label: "My overdue", filters: { health: "Overdue" } },
  { key: "week", label: "This week", filters: { when: "week" } },
  { key: "waiting", label: "Waiting on clients", filters: { health: "With client" } },
];

const many = (n: number, one: string, more: string) => `${n} ${n === 1 ? one : more}`;

/** Ported from reference/old-screens/s/lead/Clients.dc.html (stage tabs) and reference/old-patch/admin/Clients.dc.html (manager, stage, health, Assign client). */
export function ClientsScreen({ portal }: { portal: StaffPortal }) {
  const s = useAssignments();
  const [stage, setStage] = React.useState("");
  const [manager, setManager] = React.useState("");
  const [health, setHealth] = React.useState("");
  const [when, setWhen] = React.useState("");
  const [viewTick, setViewTick] = React.useState(0);
  const [assign, setAssign] = React.useState(false);
  const toast = useUndoToast();

  const all = clientsFor(portal);
  const rows = all
    .filter((c) => (!stage || c.stage === stage) && (!manager || managerOf(c, s) === manager) && (!health || c.health === health) && (!when || (c.next >= WEEKS[when][0] && c.next <= WEEKS[when][1])))
    // Admin: worst health first (old admin Clients). Lead and manager: compliance clients first, in the old order.
    .sort((a, b) => (portal === "admin" ? HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health] || a.name.localeCompare(b.name) : OLD_ORDER.indexOf(a.id) - OLD_ORDER.indexOf(b.id)));
  const any = !!(manager || health || when || (portal === "admin" && stage));
  const current: ViewFilters = { stage, manager, health, when };
  const applyView = (f: ViewFilters) => {
    setStage(f.stage ?? "");
    setManager(f.manager ?? "");
    setHealth(f.health ?? "");
    setWhen(f.when ?? "");
    setViewTick((n) => n + 1);
  };

  // E-01, E-02: admin assigns a manager, a manager assigns a project lead, a lead reminds and exports.
  const me = personOf(portal);
  const actions: GridActions<StaffClient> = {
    noun: ["client", "clients"],
    ...(portal === "admin"
      ? { people: MANAGERS.map((m) => m.name), peopleLabel: "Manager", ownerOf: (c: StaffClient) => managerOf(c, s) }
      : portal === "manager"
        ? { people: LEADS.filter((l) => l.manager === me).map((l) => l.name), peopleLabel: "Project lead", ownerOf: (c: StaffClient) => leadOf(c, s) }
        : {}),
    assign:
      portal === "lead"
        ? undefined
        : (list, person) => {
            const set = portal === "admin" ? assignManager : assignLead;
            const before = list.map((c) => [c.id, portal === "admin" ? managerOf(c, s) : leadOf(c, s)] as const);
            list.forEach((c) => set(c.id, person));
            return { text: list.length === 1 ? `${list[0].short} assigned to ${person}` : `${many(list.length, "client", "clients")} assigned to ${person}`, undo: () => before.forEach(([id, p]) => set(id, p)) };
          },
    remind: (list) => ({ text: list.length === 1 ? `Reminder sent to ${CONTACTS[list[0].id]?.name ?? list[0].short} · ${list[0].short}` : `Reminders sent to ${many(list.length, "client", "clients")}`, undo: () => undefined }),
    export: (list) => ({ text: `Exported ${many(list.length, "client", "clients")} to Clients.xlsx` }),
  };

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
      {portal !== "admin" && (
        <>
          <FilterChip label="Health" value={health} onChange={setHealth} options={HEALTHS.map((h) => ({ value: h, label: waitWord(h) }))} />
          <FilterChip label="Next" value={when} onChange={setWhen} options={WHEN_OPTS} />
        </>
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
          <Select value={when} onChange={(e) => setWhen(e.target.value)} options={[{ value: "", label: "Any next date" }, ...WHEN_OPTS.map((o) => ({ value: o.value, label: `Next ${o.label.toLowerCase()}` }))]} aria-label="Next date" />
        </>
      )}
      {portal === "admin" && any && (
        <Button
          size="sm"
          variant="link"
          onClick={() => applyView({})}
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
      <ClientsGrid
        portal={portal}
        rows={rows}
        pageSize={14}
        meta={`${rows.length} of ${all.length}`}
        filters={filters}
        showLead
        grid={{
          views: { storageKey: `${portal}:clients`, views: VIEWS, current, onApply: applyView },
          selectable: true,
          quickActions: true,
          actionsColumn: "step",
          actions,
          user: me,
          density: true,
          changedAt: clientChanged,
          visitKey: `${portal}:clients`,
          visitSeed: PREVIOUS_VISIT,
          empty: "No clients match these filters",
          emptyAction: (
            <Button size="sm" variant="secondary" onClick={() => applyView({})}>
              Clear filters
            </Button>
          ),
          loadKey: viewTick,
          notify: toast.show,
        }}
      />
      {portal === "admin" && <AssignDialog open={assign} onOpenChange={setAssign} mode="client" onDone={(t) => toast.show(t)} />}
      {toast.node}
    </>
  );
}
