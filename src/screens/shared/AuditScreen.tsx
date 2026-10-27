"use client";
import * as React from "react";
import { Download } from "lucide-react";
import { fmt } from "@/lib/dates";
import { AUDIT, type AuditEvent } from "@/data/shared";
import { Button } from "@/components/ui/Button";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import type { Portal } from "@/data/nav";

const resultTone: Record<AuditEvent["result"], ChipTone> = { Done: "ok", "Sent back": "warn", Failed: "bad" };

/** C-0029: no bar chart. Events in an e-Filing grid with filters in the head bar. */
export function AuditScreen({ portal }: { portal: Portal }) {
  const [kind, setKind] = React.useState("all");
  const [who, setWho] = React.useState("all");
  const [range, setRange] = React.useState("30");
  const people = Array.from(new Set(AUDIT.map((e) => e.who)));
  const rows = AUDIT.filter((e) => (kind === "all" || e.kind === kind) && (who === "all" || e.who === who));

  const columns: Column<AuditEvent>[] = [
    { key: "when", label: "When", width: 130, mono: true, render: (e) => `${fmt(e.date)} ${e.time}` },
    { key: "who", label: "Who", width: 160, render: (e) => (
        <span>
          <span className="font-semibold">{e.who}</span>
          <span className="block text-12 text-muted">{e.role}</span>
        </span>
      ) },
    { key: "action", label: "Action", width: 170 },
    { key: "target", label: "Target", render: (e) => <span className="font-mono text-12.5">{e.target}</span> },
    { key: "kind", label: "Kind", width: 110 },
    { key: "result", label: "Result", width: 132, render: (e) => <Chip tone={resultTone[e.result]} fixed>{e.result}</Chip> },
  ];

  return (
    <DataGrid
      title={portal === "client" ? "Audit" : "Audit log"}
      meta={`${rows.length} events`}
      columns={columns}
      rows={rows}
      rowKey={(e) => e.id}
      pageSize={10}
      filters={
        <>
          <Select aria-label="Kind" value={kind} onChange={(e) => setKind(e.target.value)} options={[{ value: "all", label: "All kinds" }, ...["Document", "Step", "Sign-in", "Setting", "Message"].map((k) => ({ value: k, label: k }))]} />
          <Select aria-label="Who" value={who} onChange={(e) => setWho(e.target.value)} options={[{ value: "all", label: "Everyone" }, ...people.map((p) => ({ value: p, label: p }))]} />
          <Select aria-label="Range" value={range} onChange={(e) => setRange(e.target.value)} options={[{ value: "14", label: "Last 14 days" }, { value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }]} />
          <Button size="sm">
            <Download size={15} strokeWidth={1.5} /> Export
          </Button>
        </>
      }
    />
  );
}
