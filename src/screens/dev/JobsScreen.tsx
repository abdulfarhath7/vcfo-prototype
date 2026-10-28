"use client";
import * as React from "react";
import { JOBS, JOB_FAILURES, JOB_RUNS, JOB_TONE, QUEUE_FACTS, stamp, type Job } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { CloseButton, LogLines, PickCell, SettingRow, StatusChip, SwitchRow, logAudit, nowToday, useRevealRef, useSwitch } from "./parts";

export function JobsScreen() {
  const [rows, setRows] = React.useState<Job[]>(JOBS);
  const [tab, setTab] = React.useState("all");
  const [picked, setPicked] = React.useState<string | null>("wa-nudges");
  const reveal = useRevealRef<HTMLDivElement>(picked);

  const pick = (id: string) => setPicked((p) => (p === id ? null : id));

  const [retried, setRetried] = React.useState<Record<string, boolean>>({});
  const [paused] = useSwitch("jobs-pause", false, "Pause all jobs");

  const runNow = (j: Job) => {
    const t = nowToday();
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
    {
      key: "cron",
      label: "Schedule",
      render: (j) => (
        <span className="block whitespace-nowrap">
          {JOB_RUNS[j.id] ?? j.cron}
          <span className="block font-mono text-12 text-muted">{j.cron}</span>
        </span>
      ),
    },
    { key: "last", label: "Last run", render: (j) => <span className="whitespace-nowrap">{j.lastRun ? stamp(j.lastRun) : "-"}</span> },
    { key: "dur", label: "Duration", render: (j) => <span className="whitespace-nowrap">{j.duration}</span> },
    { key: "status", label: "Status", width: 124, render: (j) => <StatusChip tone={JOB_TONE[j.status]}>{j.status}</StatusChip> },
    { key: "next", label: "Next run", render: (j) => <span className="whitespace-nowrap">{stamp(j.nextRun)}</span> },
    { key: "fails", label: "Failures, 7 days", align: "right", render: (j) => <span className={j.failures7d > 0 ? "font-medium text-bad" : "text-muted"}>{j.failures7d}</span> },
    {
      key: "act",
      label: "",
      width: 1,
      render: (j) => (
        <Button size="sm" onClick={(e) => { e.stopPropagation(); runNow(j); }} disabled={j.status === "Running" || paused}>
          Run now
        </Button>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <DataGrid
          title="Scheduled jobs"
          meta={paused ? "Paused" : "Inngest · times in IST"}
          columns={columns}
          rows={shown}
          rowKey={(j) => j.id}
          onRowClick={(j) => pick(j.id)}
          selectedKey={picked ?? undefined}
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
      {cur && (
        <div ref={reveal}>
          <SectionCard title="Run log" meta={`${cur.name} · ${cur.lastRun ? stamp(cur.lastRun) : "-"}`} flush right={<CloseButton onClick={() => setPicked(null)} />}>
            <LogLines lines={cur.log} />
          </SectionCard>
        </div>
      )}
      <SectionCard title="Recent failures" meta="Last 7 days" flush>
        {JOB_FAILURES.map((f) => {
          const j = rows.find((x) => x.id === f.job);
          const name = j?.name ?? f.job;
          return (
            <SettingRow key={f.id} label={`${name} · ${stamp(f.at)}`} hint={f.cause}>
              <StatusChip tone={f.status === "Failed" ? "bad" : "warn"}>{f.status}</StatusChip>
              {retried[f.id] ? (
                <StatusChip tone="prog">Queued again</StatusChip>
              ) : (
                <Button
                  size="sm"
                  disabled={paused}
                  onClick={() => {
                    setRetried((r) => ({ ...r, [f.id]: true }));
                    logAudit("Retry job", `${name} from ${stamp(f.at)}`, "Done", f.status, "Queued again");
                  }}
                >
                  Retry
                </Button>
              )}
            </SettingRow>
          );
        })}
      </SectionCard>
      <SectionCard title="Queue" flush>
        <div className="px-4 py-4 md:px-5">
          <KeyValue
            cols={3}
            rows={[
              ...QUEUE_FACTS.slice(0, 1),
              { k: "Running now", v: counts.running ? `${counts.running} · ${rows.filter((j) => j.status === "Running").map((j) => j.name).join(", ")}` : "0" },
              ...QUEUE_FACTS.slice(1),
            ]}
          />
        </div>
        <SwitchRow k="jobs-pause" initial={false} label="Pause all jobs" hint="For a maintenance window. Reminders wait until resumed." confirmOn={{ question: "Pause all jobs? No reminder goes out until you resume.", confirm: "Pause" }} />
      </SectionCard>
    </div>
  );
}
