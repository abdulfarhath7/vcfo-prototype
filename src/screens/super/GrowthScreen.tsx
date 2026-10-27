"use client";
import * as React from "react";
import { BarChart, Bar as RBar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Building2, Gauge, Target, TrendingUp } from "lucide-react";
import { fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { barFill, type BarTone } from "@/components/ui/Bar";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { NumberStrip, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { StackedBar } from "@/components/cards/StackedBar";
import { AREAS, CAP, FIRM_CLIENTS, GROWTH_MONTHS, MANAGERS, PIPELINE, PIPE_STAGE_TONE, type Area, type Prospect } from "@/data/super";
import { opts } from "./parts";

const AREA_TONE: Record<Area, BarTone> = { Incorporation: "accent", Registrations: "violet", Compliances: "teal" };
const AREA_FILL: Record<Area, string> = { Incorporation: "var(--accent)", Registrations: "var(--violet)", Compliances: "var(--teal)" };

const columns: Column<Prospect>[] = [
  {
    key: "name",
    label: "Prospect",
    render: (p) => (
      <span className="min-w-0">
        <span className="block truncate font-semibold">{p.name}</span>
        <span className="block truncate text-12 text-muted">{p.service}</span>
      </span>
    ),
  },
  { key: "area", label: "Area" },
  {
    key: "stage",
    label: "Stage",
    width: 124,
    render: (p) => (
      <Chip fixed tone={PIPE_STAGE_TONE[p.stage]}>
        {p.stage}
      </Chip>
    ),
  },
  { key: "owner", label: "Owner", className: "whitespace-nowrap" },
  { key: "next", label: "Next step", render: (p) => <span className="block max-w-[220px] truncate">{p.next}</span> },
  { key: "since", label: "Since", width: 80, className: "whitespace-nowrap", render: (p) => fmt(p.since) },
];

function MonthChart() {
  return (
    <div>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={GROWTH_MONTHS} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barCategoryGap="32%">
            <CartesianGrid vertical={false} stroke="var(--line-soft)" />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "var(--line)" }} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "var(--raised)" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12.5, color: "var(--ink)" }}
              labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
              itemStyle={{ color: "var(--ink-2)" }}
            />
            {AREAS.map((a, i) => (
              <RBar key={a} dataKey={a} stackId="n" fill={AREA_FILL[a]} radius={i === AREAS.length - 1 ? [3, 3, 0, 0] : 0} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {AREAS.map((a) => (
          <li key={a} className="flex items-center gap-2 text-12.5 text-ink-2">
            <i className={cn("h-[7px] w-[7px] flex-none rounded-[2px]", barFill[AREA_TONE[a]])} aria-hidden />
            {a}
            <b className="font-semibold text-ink">{GROWTH_MONTHS.reduce((s, m) => s + m[a], 0)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GrowthScreen() {
  const [stage, setStage] = React.useState("");
  const rows = PIPELINE.filter((p) => !stage || p.stage === stage);
  const open = PIPELINE.filter((p) => p.stage !== "Won").length;
  const room = MANAGERS.length * CAP - FIRM_CLIENTS.length;
  const oct = GROWTH_MONTHS[GROWTH_MONTHS.length - 1];
  const sep = GROWTH_MONTHS[GROWTH_MONTHS.length - 2];
  const sum = (m: (typeof GROWTH_MONTHS)[number]) => m.Incorporation + m.Registrations + m.Compliances;

  const stats: StatItem[] = [
    { label: "New clients in October", value: sum(oct), of: `/ ${sum(sep)} in Sep`, Icon: TrendingUp, tone: "blue" },
    { label: "Prospects open", value: open, Icon: Building2, tone: "violet" },
    { label: "Proposals won · this quarter", value: "40%", Icon: Target, tone: "green" },
    { label: "Room across managers", value: room, of: "clients", Icon: Gauge, tone: "teal" },
  ];

  const sources = ["Referral", "Website", "Existing client", "Partner CA"] as const;
  const srcTone: BarTone[] = ["accent", "teal", "violet", "warn"];

  return (
    <div className="grid grid-cols-1 gap-5">
      <section className="overflow-hidden rounded-lg border border-line bg-surface" aria-label="Summary">
        <NumberStrip items={stats} />
      </section>
      <Cols>
        <Col>
          <SectionCard title="New clients by month" meta="May to Oct" icon={{ Icon: BarChart3, tone: "blue" }}>
            <MonthChart />
          </SectionCard>
          <DataGrid
            title="Pipeline"
            icon={{ Icon: TrendingUp, tone: "blue" }}
            columns={columns}
            rows={rows}
            rowKey={(p) => p.id}
            filters={<Select aria-label="Stage" value={stage} onChange={(e) => setStage(e.target.value)} options={opts("All stages", ["Enquiry", "Proposal", "Won"])} />}
          />
        </Col>
        <Col>
          <SectionCard title="By source" meta="Pipeline" icon={{ Icon: BarChart3, tone: "blue" }}>
            <StackedBar total={PIPELINE.length} segments={sources.map((s, i) => ({ label: s, value: PIPELINE.filter((p) => p.source === s).length, tone: srcTone[i] }))} />
          </SectionCard>
          <SectionCard title="By area" meta="Pipeline" icon={{ Icon: BarChart3, tone: "blue" }}>
            <StackedBar total={PIPELINE.length} segments={AREAS.map((a) => ({ label: a, value: PIPELINE.filter((p) => p.area === a).length, tone: AREA_TONE[a] }))} />
          </SectionCard>
        </Col>
      </Cols>
    </div>
  );
}
