"use client";
import * as React from "react";
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BACKUPS, BUCKETS, COSTS, COST_BUDGET, COST_MONTHS, COST_TOTAL, DATA_FACTS, DB_TABLES, EXPORTS, VOLUME, rupees, stamp, type Backup, type Bucket, type DataExport, type DbTable, type ServiceCost } from "@/data/dev";
import { TODAY } from "@/lib/dates";
import { Chip, Tag } from "@/components/ui/Chip";
import { Bar } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { ChangeConfirm } from "@/components/cards/ChangeConfirm";
import { Cols, Col } from "@/components/shell/Page";
import { logAudit } from "./parts";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";

function change(c: ServiceCost) {
  const diff = c.thisMonth - c.lastMonth;
  const pct = c.lastMonth ? Math.round((diff / c.lastMonth) * 100) : 0;
  return { diff, pct };
}

const costColumns: Column<ServiceCost>[] = [
  { key: "service", label: "Service", render: (c) => <span className="whitespace-nowrap font-semibold">{c.service}</span> },
  { key: "this", label: "This month", align: "right", render: (c) => <span className="whitespace-nowrap">{rupees(c.thisMonth)}</span> },
  { key: "budget", label: "Budget", align: "right", render: (c) => <span className="whitespace-nowrap text-muted">{rupees(c.budget)}</span> },
  {
    key: "used",
    label: "Used",
    render: (c) => {
      const p = Math.round((c.thisMonth / c.budget) * 100);
      return (
        <span className="flex min-w-[120px] items-center gap-2">
          <Bar pct={p} tone={p > 90 ? "warn" : "accent"} className="flex-1" />
          <span className={`w-[36px] text-right text-12.5 ${p > 90 ? "font-semibold text-warn" : ""}`}>{`${p}%`}</span>
        </span>
      );
    },
  },
  { key: "last", label: "Last month", align: "right", render: (c) => <span className="whitespace-nowrap text-muted">{rupees(c.lastMonth)}</span> },
  {
    key: "change",
    label: "Change",
    align: "right",
    render: (c) => {
      const { diff } = change(c);
      return <span className="whitespace-nowrap">{diff === 0 ? "₹0" : `${diff > 0 ? "+" : "−"}${rupees(Math.abs(diff))}`}</span>;
    },
  },
  {
    key: "tone",
    label: "Trend",
    width: 124,
    render: (c) => {
      const { pct } = change(c);
      if (Math.abs(pct) < 3) return <Chip fixed tone="idle">Same</Chip>;
      return pct > 0 ? (
        <Chip fixed tone={pct >= 10 ? "warn" : "idle"}>{`Up ${pct}%`}</Chip>
      ) : (
        <Chip fixed tone="ok">{`Down ${Math.abs(pct)}%`}</Chip>
      );
    },
  },
];

const bucketColumns: Column<Bucket>[] = [
  { key: "name", label: "Bucket", mono: true, render: (b) => <span className="whitespace-nowrap font-semibold">{b.name}</span> },
  { key: "region", label: "Region", mono: true },
  { key: "size", label: "Size", align: "right" },
  { key: "objects", label: "Objects", align: "right" },
  { key: "ver", label: "Versioning", width: 124, render: (b) => <Chip fixed tone={b.versioning === "On" ? "ok" : "idle"}>{b.versioning}</Chip> },
  { key: "life", label: "Lifecycle", render: (b) => <span className="whitespace-nowrap">{b.lifecycle}</span> },
];

const k = (n: number) => `₹${Math.round(n / 1000)}k`;

function CostChart() {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={COST_MONTHS} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line-soft)" />
          <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "var(--line)" }} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis tickFormatter={k} tickLine={false} axisLine={false} width={44} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "var(--raised)" }}
            formatter={(v) => [rupees(Number(v)), "Total"]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12.5, color: "var(--ink)" }}
            labelStyle={{ color: "var(--muted)" }}
          />
          <RBar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const tableColumns: Column<DbTable>[] = [
  { key: "name", label: "Table", mono: true, render: (t) => <span className="whitespace-nowrap font-semibold">{t.name}</span> },
  { key: "rows", label: "Rows", align: "right", render: (t) => t.rows.toLocaleString("en-IN") },
  { key: "size", label: "Size", align: "right", render: (t) => <span className="whitespace-nowrap">{t.size}</span> },
  { key: "growth", label: "Growth", render: (t) => <span className="whitespace-nowrap text-muted">{t.growth}</span> },
  { key: "vac", label: "Last vacuum", mono: true, render: (t) => <span className="whitespace-nowrap">{stamp(t.vacuumed)}</span> },
];

const DAYS_LEFT = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate() - TODAY.getDate();

export function DataScreen() {
  const last = COSTS.reduce((a, c) => a + c.lastMonth, 0);
  const [askTest, setAskTest] = React.useState(false);
  const [testRun, setTestRun] = React.useState(false);
  const [restore, setRestore] = React.useState<string | null>(null);
  const [restored, setRestored] = React.useState<Record<string, boolean>>({});
  const [downloaded, setDownloaded] = React.useState<Record<string, boolean>>({});
  const target = BACKUPS.find((b) => b.id === restore) ?? null;

  const backupColumns: Column<Backup>[] = [
    { key: "name", label: "Snapshot", mono: true, render: (b) => <span className="whitespace-nowrap font-semibold">{b.name}</span> },
    { key: "at", label: "Taken", mono: true, render: (b) => <span className="whitespace-nowrap">{stamp(b.at)}</span> },
    { key: "kind", label: "Kind", render: (b) => <Tag tone={b.kind === "Daily" ? "idle" : "violet"}>{b.kind}</Tag> },
    { key: "size", label: "Size", align: "right", render: (b) => b.size },
    { key: "status", label: "Status", width: 124, render: (b) => <Chip fixed tone={restored[b.id] ? "prog" : b.status === "Restore tested" ? "ok" : "idle"}>{restored[b.id] ? "Restoring" : b.status}</Chip> },
    {
      key: "act",
      label: "",
      width: 1,
      render: (b) => (
        <Button size="sm" onClick={() => setRestore(b.id)} disabled={restored[b.id]} aria-expanded={restore === b.id}>
          Restore
        </Button>
      ),
    },
  ];

  const exportColumns: Column<DataExport>[] = [
    { key: "name", label: "Export", render: (x) => <span className="whitespace-nowrap font-semibold">{x.name}</span> },
    { key: "fmt", label: "Format", render: (x) => <Tag>{x.format}</Tag> },
    { key: "size", label: "Size", align: "right", render: (x) => x.size },
    { key: "by", label: "Made by", render: (x) => x.by },
    { key: "at", label: "When", mono: true, render: (x) => <span className="whitespace-nowrap">{stamp(x.at)}</span> },
    {
      key: "act",
      label: "",
      width: 1,
      render: (x) =>
        downloaded[x.id] ? (
          <Chip tone="ok">Downloaded</Chip>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              setDownloaded((d) => ({ ...d, [x.id]: true }));
              logAudit("Export", `${x.name} (${x.format})`);
            }}
          >
            Download
          </Button>
        ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <Cols>
        <Col>
          <SectionCard
            title="Database and backups"
            flush
            right={
              testRun ? (
                <Chip tone="prog">Restore test running</Chip>
              ) : (
                <Button size="sm" onClick={() => setAskTest(true)} aria-expanded={askTest}>
                  Test a restore
                </Button>
              )
            }
          >
            <div className="px-4 py-4 md:px-5">
              <KeyValue cols={2} rows={DATA_FACTS} />
            </div>
            {askTest && (
              <ChangeConfirm
                question="Restore last night's backup to a scratch database and check it opens?"
                confirm="Start test"
                before="Last test 1 Oct"
                after="Test running"
                onConfirm={() => {
                  setTestRun(true);
                  setAskTest(false);
                  logAudit("Restore", "Restore test to a scratch database", "Done", "Last test 1 Oct", "Test running");
                }}
                onCancel={() => setAskTest(false)}
              />
            )}
          </SectionCard>
        </Col>
        <Col>
          <SectionCard title="Volumes" meta="October">
            <KeyValue cols={2} rows={VOLUME.map((v) => ({ k: `${v.k} · ${v.sub}`, v: v.v }))} />
          </SectionCard>
        </Col>
      </Cols>
      <DataGrid
        title="Costs by service"
        meta={`1 to 6 Oct · ${rupees(COST_TOTAL)} of a ${rupees(COST_BUDGET)} budget · ${Math.round((COST_TOTAL / COST_BUDGET) * 100)}% used with ${DAYS_LEFT} days to go · ${rupees(last)} same days last month`}
        columns={costColumns}
        rows={COSTS}
        rowKey={(c) => c.service}
      />
      <SectionCard title="Cost over 6 months" meta="Full months">
        <CostChart />
      </SectionCard>
      <DataGrid title="Storage by bucket" columns={bucketColumns} rows={BUCKETS} rowKey={(b) => b.id} />
      <DataGrid title="Database tables" meta="RDS Postgres 16 · vcfo_prod" columns={tableColumns} rows={DB_TABLES} rowKey={(t) => t.id} />
      <SectionCard title="Backups" bare flush>
        <DataGrid inset title="Backups" meta="Daily 02:00 · kept 35 days" columns={backupColumns} rows={BACKUPS} rowKey={(b) => b.id} selectedKey={restore ?? undefined} />
        {target && (
          <ChangeConfirm
            question={`Restore ${target.name} to a scratch database? Production is not touched.`}
            confirm="Restore"
            before="Scratch database empty"
            after={target.name}
            onConfirm={() => {
              setRestored((r) => ({ ...r, [target.id]: true }));
              logAudit("Restore", `${target.name} to a scratch database`, "Done", "-", target.name);
              setRestore(null);
            }}
            onCancel={() => setRestore(null)}
          />
        )}
      </SectionCard>
      <DataGrid title="Exports" columns={exportColumns} rows={EXPORTS} rowKey={(x) => x.id} />
    </div>
  );
}
