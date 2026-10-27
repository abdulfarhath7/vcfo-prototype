"use client";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BarTone } from "@/components/ui/Bar";
import type { Health } from "@/data/staff-clients";
import { leadRows } from "@/data/staff-team";
import { ANALYTICS, type StepTime } from "@/data/staff-analytics";
import { myClients } from "@/data/staff-compliance";
import { Cols, Col, Row } from "@/components/shell/Page";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { ProgressList } from "@/components/cards/ProgressList";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import type { StaffPortal } from "./parts";

const HEALTH: Array<[Health, BarTone]> = [
  ["In progress", "accent"],
  ["Due this week", "teal"],
  ["With client", "warn"],
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

function FilingsOnTime({ portal }: { portal: StaffPortal }) {
  const [span, setSpan] = React.useState("6");
  const data = ANALYTICS[portal].filings.slice(-Number(span)).map((f) => ({ m: f.m, "On time": f.onTime, Late: f.late }));
  const onTime = data.reduce((a, f) => a + f["On time"], 0);
  const total = data.reduce((a, f) => a + f["On time"] + f.Late, 0);
  return (
    <SectionCard
      title="Filings on time"
      meta={`${Math.round((onTime / total) * 100)}%`}
      right={
        <Tabs
          items={[
            { key: "6", label: "6 months" },
            { key: "12", label: "12 months" },
          ]}
          value={span}
          onChange={setSpan}
        />
      }
    >
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
  const clients = myClients(portal);
  const leads = portal === "lead" ? [] : leadRows(portal === "manager" ? "Pranay" : undefined);
  return (
    <div className="grid grid-cols-1 gap-5">
      <Row>
        <FilingsOnTime portal={portal} />
        <StepsPerWeek portal={portal} />
      </Row>
      <Cols>
        <Col>
          <DataGrid title="Time in step" meta="Open steps" columns={stepCols} rows={ANALYTICS[portal].stepTime} rowKey={(s) => s.id} pageSize={8} />
        </Col>
        <Col>
          <SectionCard title="Client health" meta={`${clients.length} clients`}>
            <StackedBar segments={HEALTH.map(([h, tone]) => ({ label: h, value: clients.filter((c) => c.health === h).length, tone })).filter((s) => s.value > 0)} />
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
