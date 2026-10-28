"use client";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Building2, CircleCheck, User } from "lucide-react";
import type { BarTone } from "@/components/ui/Bar";
import { clientsFor, type Health } from "@/data/staff-clients";
import { leadRows } from "@/data/staff-team";
import { ANALYTICS, DELAY_BENCHMARK, RATE_TARGET, type StepTime } from "@/data/staff-analytics";
import { Cols, Col, Row } from "@/components/shell/Page";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Chip";
import { NumberStrip, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { ProgressList } from "@/components/cards/ProgressList";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import type { StaffPortal } from "./parts";
import { waitWord } from "@/data/status-words";

const HEALTH: Array<[Health, BarTone]> = [
  ["In progress", "accent"],
  ["Due this week", "teal"],
  ["With client", "teal"],
  ["Overdue", "bad"],
  ["Stuck", "violet"],
  ["Not started", "idle"],
];

const TOOLTIP = {
  cursor: { fill: "var(--raised)" },
  contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12.5, color: "var(--ink)" },
  labelStyle: { color: "var(--ink)", fontWeight: 600 },
};
const AXIS_X = { tickLine: false, axisLine: { stroke: "var(--line)" }, tick: { fill: "var(--muted)", fontSize: 11.5 }, interval: 0 } as const;
const AXIS_Y = { allowDecimals: false, tickLine: false, axisLine: false, tick: { fill: "var(--faint)", fontSize: 11.5 } } as const;

function FilingsOnTime({ portal, span }: { portal: StaffPortal; span: number }) {
  const data = ANALYTICS[portal].filings.slice(-span).map((f) => ({ m: f.m, "On time": f.onTime, Late: f.late }));
  const onTime = data.reduce((a, f) => a + f["On time"], 0);
  const total = data.reduce((a, f) => a + f["On time"] + f.Late, 0);
  return (
    <SectionCard title="Filings on time" meta={`${Math.round((onTime / total) * 100)}%`}>
      <div className="h-[232px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--line-soft)" />
            <XAxis dataKey="m" {...AXIS_X} />
            <YAxis {...AXIS_Y} />
            <Tooltip {...TOOLTIP} />
            <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 12.5, color: "var(--ink-2)" }} />
            <Bar dataKey="On time" stackId="a" fill="var(--ok-mid)" isAnimationActive={false} maxBarSize={28} />
            <Bar dataKey="Late" stackId="a" fill="var(--bad-mid)" isAnimationActive={false} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

/** Old "Compliance completion rate": monthly actuals against the 95% target. */
function CompletionRate({ portal, span }: { portal: StaffPortal; span: number }) {
  const data = ANALYTICS[portal].rates.slice(-span);
  const last = data[data.length - 1];
  return (
    <SectionCard title="Compliance completion rate" meta={`${last.rate}% in ${last.m} · target ${RATE_TARGET}%`}>
      <div className="h-[232px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 4, bottom: 0, left: -10 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--line-soft)" />
            <XAxis dataKey="m" {...AXIS_X} />
            <YAxis {...AXIS_Y} domain={[70, 100]} unit="%" />
            <Tooltip {...TOOLTIP} formatter={(v) => [`${v}% on time`, "Rate"]} />
            <ReferenceLine y={RATE_TARGET} stroke="var(--warn-mid)" strokeDasharray="6 5" label={{ value: `${RATE_TARGET}% target`, position: "insideTopRight", fill: "var(--warn)", fontSize: 11 }} />
            <Bar dataKey="rate" isAnimationActive={false} maxBarSize={36} radius={[3, 3, 0, 0]}>
              {data.map((r) => (
                <Cell key={r.m} fill={r.rate >= RATE_TARGET ? "var(--ok-mid)" : "var(--accent)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

/** Old "Average filing delay": days past the statutory due date, benchmark 2 days. */
function FilingDelay({ portal, span }: { portal: StaffPortal; span: number }) {
  const data = ANALYTICS[portal].rates.slice(-span);
  return (
    <SectionCard title="Average filing delay" meta={`Days past due date · benchmark ${DELAY_BENCHMARK} days`}>
      <div className="h-[232px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--line-soft)" />
            <XAxis dataKey="m" {...AXIS_X} />
            <YAxis {...AXIS_Y} allowDecimals />
            <Tooltip {...TOOLTIP} formatter={(v) => [`${v} days`, "Delay"]} />
            <ReferenceLine y={DELAY_BENCHMARK} stroke="var(--warn-mid)" strokeDasharray="6 5" label={{ value: `${DELAY_BENCHMARK}d benchmark`, position: "insideTopRight", fill: "var(--warn)", fontSize: 11 }} />
            <Line dataKey="delay" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--surface)", strokeWidth: 2 }} isAnimationActive={false} label={{ position: "top", fill: "var(--ink)", fontSize: 11 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

const KPI_ICON = [
  { Icon: Building2, tone: "blue" },
  { Icon: CircleCheck, tone: "green" },
  { Icon: User, tone: "amber" },
  { Icon: AlertTriangle, tone: "red" },
] as const;

/** KPI strip: counts only, no money (R-37). */
function KpiStrip({ portal, span, setSpan }: { portal: StaffPortal; span: string; setSpan: (s: string) => void }) {
  const items: StatItem[] = ANALYTICS[portal].kpis.map((k, i) => ({
    label: k.label,
    Icon: KPI_ICON[i].Icon,
    tone: KPI_ICON[i].tone,
    bad: i === 3 && k.value > 0,
    value: (
      <span className="inline-flex items-baseline gap-2">
        {k.value}
        <Tag tone={k.good ? "ok" : "warn"} className="h-[20px] px-1.5 align-middle">
          {k.delta}
        </Tag>
      </span>
    ),
  }));
  return (
    <SectionCard
      title="Practice"
      meta={span === "6" ? "Last 6 months" : "Last 12 months"}
      flush
      right={
        <Tabs
          items={[
            { key: "6", label: "Last 6 months" },
            { key: "12", label: "Last 12 months" },
          ]}
          value={span}
          onChange={setSpan}
        />
      }
    >
      <NumberStrip items={items} />
    </SectionCard>
  );
}

function StepsPerWeek({ portal }: { portal: StaffPortal }) {
  const data = ANALYTICS[portal].steps.map((s) => ({ w: s.w, Steps: s.steps }));
  return (
    <SectionCard title="Steps completed per week" meta={`${data.reduce((a, s) => a + s.Steps, 0)} in 8 weeks`}>
      <div className="h-[232px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--line-soft)" />
            <XAxis dataKey="w" {...AXIS_X} interval="preserveStartEnd" />
            <YAxis {...AXIS_Y} />
            <Tooltip {...TOOLTIP} />
            <Bar dataKey="Steps" fill="var(--accent)" isAnimationActive={false} maxBarSize={28} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

const stepCols: Column<StepTime>[] = [
  { key: "step", label: "Step", render: (s) => <span className="font-semibold">{s.step}</span> },
  { key: "median", label: "Median days", width: 110, align: "right" },
  { key: "longest", label: "Longest", width: 90, align: "right", render: (s) => <span className={s.longest > 7 ? "font-semibold text-bad" : undefined}>{s.longest}</span> },
  { key: "longestClient", label: "Longest client", width: 140 },
];

export function AnalyticsScreen({ portal }: { portal: StaffPortal }) {
  // Same scope as the Clients list and the "Projects 8" number.
  const clients = clientsFor(portal);
  const leads = portal === "lead" ? [] : leadRows(portal === "manager" ? "Pranay" : undefined);
  const [span, setSpan] = React.useState("6");
  const n = Number(span);
  return (
    <div className="grid grid-cols-1 gap-5">
      <KpiStrip portal={portal} span={span} setSpan={setSpan} />
      <Row>
        <CompletionRate portal={portal} span={n} />
        <FilingDelay portal={portal} span={n} />
      </Row>
      <Row>
        <FilingsOnTime portal={portal} span={n} />
        <StepsPerWeek portal={portal} />
      </Row>
      <Cols>
        <Col>
          <DataGrid title="Time in step" meta="Open steps" columns={stepCols} rows={ANALYTICS[portal].stepTime} rowKey={(s) => s.id} pageSize={8} />
        </Col>
        <Col>
          <SectionCard title="Client health" meta={`${clients.length} clients`}>
            <StackedBar segments={HEALTH.map(([h, tone]) => ({ label: waitWord(h), value: clients.filter((c) => c.health === h).length, tone })).filter((s) => s.value > 0)} />
          </SectionCard>
          {leads.length > 0 && (
            <SectionCard title="Workload" meta="Hours planned this week" flush>
              <ProgressList items={leads.map((l) => ({ id: l.name, name: l.name, sub: `${l.clients} clients · ${l.open} open · ${l.overdue} overdue`, pct: l.load, tone: l.load > 95 ? "bad" : l.load > 80 ? "warn" : "accent" }))} />
            </SectionCard>
          )}
        </Col>
      </Cols>
    </div>
  );
}
