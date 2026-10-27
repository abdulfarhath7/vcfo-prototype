"use client";
import * as React from "react";
import { LEVEL_TONE, LOGS, LOG_SERVICES, stampSec, type LogRow } from "@/data/dev";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { DataGrid, type Column } from "@/components/cards/DataGrid";

const columns: Column<LogRow>[] = [
  { key: "time", label: "Time", mono: true, render: (r) => <span className="whitespace-nowrap">{stampSec(r.at)}</span> },
  { key: "level", label: "Level", width: 124, render: (r) => <Chip fixed tone={LEVEL_TONE[r.level]}>{r.level}</Chip> },
  { key: "service", label: "Service", render: (r) => <span className="whitespace-nowrap">{r.service}</span> },
  { key: "message", label: "Message", render: (r) => <span className="block min-w-[260px]">{r.message}</span> },
  { key: "req", label: "Request ID", mono: true, render: (r) => <span className="whitespace-nowrap text-muted">{r.requestId}</span> },
];

export function LogsScreen() {
  const [level, setLevel] = React.useState("all");
  const [service, setService] = React.useState("all");
  const [q, setQ] = React.useState("");

  const needle = q.trim().toLowerCase();
  const rows = LOGS.filter(
    (r) =>
      (level === "all" || r.level === level) &&
      (service === "all" || r.service === service) &&
      (!needle || r.message.toLowerCase().includes(needle) || r.requestId.includes(needle)),
  );

  return (
    <DataGrid
      title="Log lines"
      meta="Last 10 hours"
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      pageSize={15}
      empty="No log lines match"
      filters={
        <>
          <Select
            aria-label="Level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            options={[
              { value: "all", label: "All levels" },
              { value: "Error", label: "Error" },
              { value: "Warn", label: "Warn" },
              { value: "Info", label: "Info" },
            ]}
          />
          <Select aria-label="Service" value={service} onChange={(e) => setService(e.target.value)} options={[{ value: "all", label: "All services" }, ...LOG_SERVICES.map((s) => ({ value: s, label: s }))]} />
          <Input aria-label="Search" type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="h-[30px] w-[180px] text-12.5" />
        </>
      }
    />
  );
}
