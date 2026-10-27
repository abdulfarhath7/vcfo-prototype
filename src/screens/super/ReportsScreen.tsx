"use client";
import * as React from "react";
import { Download, Play } from "lucide-react";
import { TODAY, fmt } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AREAS, REPORTS, REPORT_PERIODS, type SavedReport } from "@/data/super";
import { opts } from "./parts";

export function ReportsScreen() {
  const [reports, setReports] = React.useState(REPORTS);
  const [period, setPeriod] = React.useState("");
  const [area, setArea] = React.useState("");
  const rows = reports.filter((r) => (!period || r.period === period) && (!area || r.area === area));

  const run = (id: string) => setReports((all) => all.map((r) => (r.id === id ? { ...r, lastRun: TODAY } : r)));

  const columns: Column<SavedReport>[] = [
    { key: "name", label: "Report", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "area", label: "Area", className: "whitespace-nowrap" },
    { key: "period", label: "Period", className: "whitespace-nowrap" },
    { key: "lastRun", label: "Last run", width: 96, className: "whitespace-nowrap", render: (r) => (r.lastRun.getTime() === TODAY.getTime() ? "Today" : fmt(r.lastRun)) },
    { key: "schedule", label: "Schedule", className: "whitespace-nowrap" },
    {
      key: "act",
      label: "",
      width: 200,
      render: (r) => (
        <span className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => run(r.id)}>
            <Play size={14} strokeWidth={1.5} /> Run
          </Button>
          <Button size="sm" variant="outline">
            <Download size={14} strokeWidth={1.5} /> Download
          </Button>
        </span>
      ),
    },
  ];

  return (
    <DataGrid
      title="Saved reports"
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      pageSize={12}
      filters={
        <>
          <Select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} options={opts("All periods", REPORT_PERIODS)} />
          <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)} options={opts("All areas", ["Firm", ...AREAS])} />
        </>
      }
    />
  );
}
