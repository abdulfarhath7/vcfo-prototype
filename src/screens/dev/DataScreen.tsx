"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BUCKETS, COSTS, COST_MONTHS, COST_TOTAL, DATA_FACTS, rupees, type Bucket, type ServiceCost } from "@/data/dev";
import { Chip } from "@/components/ui/Chip";
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
          <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DataScreen() {
  const last = COSTS.reduce((a, c) => a + c.lastMonth, 0);
  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard title="Database and backups">
        <KeyValue cols={3} rows={DATA_FACTS} />
      </SectionCard>
      <DataGrid title="Costs by service" meta={`1 to 6 Oct · ${rupees(COST_TOTAL)} against ${rupees(last)}`} columns={costColumns} rows={COSTS} rowKey={(c) => c.service} />
      <SectionCard title="Cost over 6 months" meta="Full months">
        <CostChart />
      </SectionCard>
      <DataGrid title="Storage buckets" columns={bucketColumns} rows={BUCKETS} rowKey={(b) => b.id} />
    </div>
  );
}
