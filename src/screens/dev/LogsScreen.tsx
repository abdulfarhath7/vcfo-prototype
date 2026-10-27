"use client";
import * as React from "react";
import { LEVEL_TONE, LOGS, LOG_SERVICES, stampSec, type LogLevel, type LogRow } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { ChoiceRow, CloseButton, SwitchRow, useRevealRef } from "./parts";

const LEVELS: LogLevel[] = ["Error", "Warn", "Info"];

export function LogsScreen() {
  const [level, setLevel] = React.useState("all");
  const [service, setService] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [picked, setPicked] = React.useState<string | null>(null);
  const reveal = useRevealRef<HTMLDivElement>(picked);

  const needle = q.trim().toLowerCase();
  const rows = LOGS.filter(
    (r) =>
      (level === "all" || r.level === level) &&
      (service === "all" || r.service === service) &&
      (!needle || r.message.toLowerCase().includes(needle) || r.detail.toLowerCase().includes(needle) || r.requestId.includes(needle)),
  );
  const any = level !== "all" || service !== "all" || !!needle;
  const cur = LOGS.find((r) => r.id === picked) ?? null;

  const columns: Column<LogRow>[] = [
    { key: "time", label: "Time", mono: true, render: (r) => <span className="whitespace-nowrap">{stampSec(r.at)}</span> },
    { key: "level", label: "Level", width: 124, render: (r) => <Chip fixed tone={LEVEL_TONE[r.level]}>{r.level}</Chip> },
    { key: "service", label: "Source", render: (r) => <span className="whitespace-nowrap">{r.service}</span> },
    { key: "message", label: "Message", render: (r) => <span className="block min-w-[260px]">{r.message}</span> },
    { key: "req", label: "Request ID", mono: true, render: (r) => <span className="whitespace-nowrap text-muted">{r.requestId}</span> },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <DataGrid
        title="Log lines"
        meta="Last 10 hours · newest first"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        pageSize={15}
        empty="No log lines match"
        onRowClick={(r) => setPicked((p) => (p === r.id ? null : r.id))}
        selectedKey={picked ?? undefined}
        filters={
          <>
            <Select
              aria-label="Level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              options={[{ value: "all", label: `All levels (${LOGS.length})` }, ...LEVELS.map((l) => ({ value: l, label: `${l} (${LOGS.filter((r) => r.level === l).length})` }))]}
            />
            <Select aria-label="Source" value={service} onChange={(e) => setService(e.target.value)} options={[{ value: "all", label: "All sources" }, ...LOG_SERVICES.map((s) => ({ value: s, label: s }))]} />
            <Input aria-label="Search" type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="h-[30px] w-[160px] text-12.5" />
            {any && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setLevel("all");
                  setService("all");
                  setQ("");
                }}
              >
                Clear
              </Button>
            )}
          </>
        }
      />
      {cur && (
        <div ref={reveal}>
          <SectionCard title="Log line" meta={stampSec(cur.at)} flush right={<CloseButton onClick={() => setPicked(null)} />}>
            <div className="px-4 py-4 md:px-5">
              <KeyValue
                cols={3}
                rows={[
                  { k: "Level", v: <Chip tone={LEVEL_TONE[cur.level]}>{cur.level}</Chip> },
                  { k: "Source", v: cur.service },
                  { k: "Request ID", v: cur.requestId, mono: true },
                ]}
              />
              <p className="mt-3 text-13.5 font-semibold">{cur.message}</p>
              <p className="mt-1 text-13.5 text-ink-2">{cur.detail}</p>
            </div>
          </SectionCard>
        </div>
      )}
      <SectionCard title="Keeping logs" flush>
        <ChoiceRow k="log-keep" opts={["14 days", "30 days", "90 days"]} initial={1} label="Keep logs for" hint="CloudWatch, then deleted" />
        <SwitchRow k="log-teams" initial={true} label="Errors to Teams" hint="Each new error posts to Compliance alerts" />
      </SectionCard>
    </div>
  );
}
