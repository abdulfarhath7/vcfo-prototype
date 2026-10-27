"use client";
import * as React from "react";
import { TODAY } from "@/lib/dates";
import { JOBS, JOB_TONE, stamp, type Job } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { CloseButton, LogLines, PickCell, RowPicker, logAudit, pickedRow, rowTag, useRevealRef } from "./parts";

export function JobsScreen() {
  const [rows, setRows] = React.useState<Job[]>(JOBS);
  const [tab, setTab] = React.useState("all");
  const [picked, setPicked] = React.useState<string | null>("wa-nudges");
  const reveal = useRevealRef<HTMLDivElement>(picked);

  const pick = (id: string) => setPicked((p) => (p === id ? null : id));

  const runNow = (j: Job) => {
    const n = new Date();
    const t = new Date(TODAY);
    t.setHours(n.getHours(), n.getMinutes(), n.getSeconds());
    setRows((rs) => rs.map((x) => (x.id === j.id ? { ...x, status: "Running", lastRun: t, duration: "-", log: [{ at: t, level: "info", text: "Started by Farhath (Run now)" }] } : x)));
    setPicked(j.id);
    logAudit("Run job", j.name);
  };

  const counts = {
    failed: rows.filter((j) => j.status === "Failed").length,
    running: rows.filter((j) => j.status === "Running").length,
    scheduled: rows.filter((j) => j.status !== "Running" && j.status !== "Failed").length,
  };
  const shown = rows.filter((j) => (tab === "all" ? true : tab === "failed" ? j.status === "Failed" : tab === "running" ? j.status === "Running" : j.status !== "Running" && j.status !== "Failed"));
  const cur = rows.find((j) => j.id === picked) ?? null;

  const columns: Column<Job>[] = [
    {
      key: "job",
      label: "Job",
      render: (j) => (
        <span className="whitespace-nowrap">
          <PickCell on={picked === j.id} onPick={() => pick(j.id)}>
            {j.name}
          </PickCell>
        </span>
      ),
    },
    { key: "cron", label: "Schedule", mono: true, render: (j) => <span className="whitespace-nowrap">{j.cron}</span> },
    { key: "last", label: "Last run", mono: true, render: (j) => <span className="whitespace-nowrap">{j.lastRun ? stamp(j.lastRun) : "-"}</span> },
    { key: "dur", label: "Duration", render: (j) => <span className="whitespace-nowrap">{j.duration}</span> },
    { key: "status", label: "Status", width: 124, render: (j) => <Chip fixed tone={JOB_TONE[j.status]}>{j.status}</Chip> },
    { key: "next", label: "Next run", mono: true, render: (j) => <span className="whitespace-nowrap">{stamp(j.nextRun)}</span> },
    { key: "fails", label: "Failures, 7 days", align: "right", render: (j) => <span className={j.failures7d > 0 ? "font-semibold text-bad" : "text-muted"}>{j.failures7d}</span> },
    {
      key: "act",
      label: "",
      width: 1,
      render: (j) => (
        <Button size="sm" onClick={() => runNow(j)} disabled={j.status === "Running"}>
          Run now
        </Button>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <RowPicker onPick={pick}>
        <DataGrid
          title="Scheduled jobs"
          columns={columns}
          rows={shown}
          rowKey={(j) => j.id}
          rowClass={(j) => `cursor-pointer ${rowTag(j.id)} ${picked === j.id ? pickedRow : ""}`}
          filters={
            <Tabs
              items={[
                { key: "all", label: "All", count: rows.length },
                { key: "failed", label: "Failed", count: counts.failed },
                { key: "running", label: "Running", count: counts.running },
                { key: "scheduled", label: "Scheduled", count: counts.scheduled },
              ]}
              value={tab}
              onChange={setTab}
            />
          }
        />
      </RowPicker>
      {cur && (
        <div ref={reveal}>
          <SectionCard title="Run log" meta={`${cur.name} · ${cur.lastRun ? stamp(cur.lastRun) : "-"}`} flush right={<CloseButton onClick={() => setPicked(null)} />}>
            <LogLines lines={cur.log} />
          </SectionCard>
        </div>
      )}
    </div>
  );
}
