"use client";
import * as React from "react";
import { STAFF_TODAY } from "@/lib/dates";
import { RESULT_TONE, stamp, type AuditEntry } from "@/data/dev";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { useAudit } from "./parts";

const columns: Column<AuditEntry>[] = [
  { key: "time", label: "Time", mono: true, render: (a) => <span className="whitespace-nowrap">{stamp(a.at)}</span> },
  { key: "actor", label: "Actor", render: (a) => <span className="whitespace-nowrap font-semibold">{a.actor}</span> },
  { key: "action", label: "Action", render: (a) => <span className="whitespace-nowrap">{a.action}</span> },
  { key: "target", label: "Change", render: (a) => <span className="block min-w-[220px]">{a.target}</span> },
  { key: "before", label: "Before", mono: true, render: (a) => <span className="block min-w-[90px] break-words text-muted">{a.before ?? "-"}</span> },
  { key: "after", label: "After", mono: true, render: (a) => <span className="block min-w-[90px] break-words">{a.after ?? "-"}</span> },
  { key: "result", label: "Result", width: 124, render: (a) => <Chip fixed tone={RESULT_TONE[a.result]}>{a.result}</Chip> },
];

const RANGES = [
  { value: "all", label: "All dates" },
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export function AuditScreen() {
  const all = useAudit();
  const [actor, setActor] = React.useState("all");
  const [action, setAction] = React.useState("all");
  const [range, setRange] = React.useState("all");

  const actors = Array.from(new Set(all.map((a) => a.actor))).sort();
  const actions = Array.from(new Set(all.map((a) => a.action))).sort();
  const end = new Date(STAFF_TODAY.getTime() + 86400000);
  const rows = all.filter((a) => {
    if (actor !== "all" && a.actor !== actor) return false;
    if (action !== "all" && a.action !== action) return false;
    if (range !== "all" && a.at.getTime() < end.getTime() - Number(range) * 86400000) return false;
    return true;
  });

  return (
    <DataGrid
      title="Audit log"
      meta="Newest first · kept 8 years"
      columns={columns}
      rows={rows}
      rowKey={(a) => a.id}
      pageSize={15}
      empty="No entries match"
      filters={
        <>
          <Select aria-label="Actor" value={actor} onChange={(e) => setActor(e.target.value)} options={[{ value: "all", label: "All actors" }, ...actors.map((a) => ({ value: a, label: a }))]} />
          <Select aria-label="Action" value={action} onChange={(e) => setAction(e.target.value)} options={[{ value: "all", label: "All actions" }, ...actions.map((a) => ({ value: a, label: a }))]} />
          <Select aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value)} options={RANGES} />
        </>
      }
    />
  );
}
