"use client";
import * as React from "react";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TODAY, fmt } from "@/lib/dates";
import { FILING_STATUSES, FILING_STATUS_BAR, FILING_STATUS_TONE, isLate, type Area, type FilingStatus } from "@/data/compliance";
import { complianceClients, filingsFor, staffObHref, type StaffFiling } from "@/data/staff-compliance";
import { Row } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ClientName, type StaffPortal } from "./parts";
import { ClientSelect } from "./filters";

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const FILL: Record<FilingStatus, string> = {
  Filed: "var(--ok-mid)",
  "In progress": "var(--accent)",
  "Due soon": "var(--warn-mid)",
  Overdue: "var(--bad-mid)",
  Upcoming: "var(--faint)",
};
const BAR_AREAS: Area[] = ["GST", "Income tax", "MCA", "Payroll"];
/** Rows that wait for the filing: "Mark filed" shows on them. */
const PENDING: FilingStatus[] = ["In progress", "Due soon", "Overdue"];

function MonthChart({ rows }: { rows: StaffFiling[] }) {
  const data = MONTHS.map((m, i) => {
    const month = (i + 3) % 12;
    const row: Record<string, string | number> = { m };
    for (const s of FILING_STATUSES) row[s] = rows.filter((f) => f.due.getMonth() === month && f.status === s).length;
    return row;
  });
  return (
    <SectionCard title="Filings by month" meta="FY 2026-27">
      <div className="h-[232px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--line-soft)" />
            <XAxis dataKey="m" tickLine={false} axisLine={{ stroke: "var(--line)" }} tick={{ fill: "var(--muted)", fontSize: 11.5 }} interval={0} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--faint)", fontSize: 11.5 }} />
            <Tooltip
              cursor={{ fill: "var(--raised)" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12.5, color: "var(--ink)" }}
              labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
            />
            {FILING_STATUSES.map((s) => (
              <Bar key={s} dataKey={s} stackId="a" fill={FILL[s]} isAnimationActive={false} maxBarSize={28} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

function AreaCard({ rows }: { rows: StaffFiling[] }) {
  return (
    <SectionCard title="Progress by area">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {BAR_AREAS.map((a) => {
          const list = rows.filter((f) => f.area === a);
          const filed = list.filter((f) => f.status === "Filed").length;
          return (
            <StackedBar
              key={a}
              title={`${a} · ${filed} of ${list.length} filed`}
              height={6}
              segments={FILING_STATUSES.map((s) => ({ label: s, value: list.filter((f) => f.status === s).length, tone: FILING_STATUS_BAR[s] })).filter((s) => s.value > 0)}
            />
          );
        })}
      </div>
    </SectionCard>
  );
}

function inPeriod(f: StaffFiling, p: string) {
  if (p === "all") return true;
  if (p === "Annual") return f.frequency === "Annual" || f.frequency === "Event";
  if (p === "Quarterly") return f.frequency === "Quarterly" || f.frequency === "Half-yearly";
  return f.frequency === p;
}

export function FilingsScreen({ portal }: { portal: StaffPortal }) {
  const [client, setClient] = React.useState("");
  const [period, setPeriod] = React.useState("all");
  const [fy, setFy] = React.useState("2026-27");
  const [marked, setMarked] = React.useState<Record<string, true>>({});

  // "Mark filed" turns a row to Filed in place.
  const all = filingsFor(portal, client).map((f): StaffFiling => (marked[f.id] ? { ...f, status: "Filed", filed: TODAY } : f));
  const rows = all.filter((f) => f.fy === fy && inPeriod(f, period));

  const columns: Column<StaffFiling>[] = [
    { key: "client", label: "Client", width: 150, render: (f) => <ClientName id={f.client} short /> },
    { key: "form", label: "Form", render: (f) => <span className="whitespace-nowrap font-semibold">{f.form}</span> },
    { key: "period", label: "Period", width: 140, className: "whitespace-nowrap" },
    { key: "due", label: "Due", width: 76, className: "whitespace-nowrap", render: (f) => fmt(f.due) },
    { key: "filed", label: "Filed", width: 76, className: "whitespace-nowrap", render: (f) => (f.filed ? fmt(f.filed) : "-") },
    { key: "status", label: "Status", width: 132, render: (f) => <Chip tone={FILING_STATUS_TONE[f.status]} fixed>{f.status}</Chip> },
    { key: "arn", label: "ARN", mono: true, width: 190, className: "whitespace-nowrap", render: (f) => f.arn ?? "-" },
    { key: "owner", label: "Owner", width: 100 },
    {
      key: "act",
      label: "",
      width: 108,
      render: (f) =>
        PENDING.includes(f.status) ? (
          <Button size="sm" variant="outline" onClick={() => setMarked({ ...marked, [f.id]: true })}>
            Mark filed
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <Row>
        <MonthChart rows={all} />
        <AreaCard rows={all} />
      </Row>
      <DataGrid
        title="Filings"
        meta={`FY ${fy}`}
        columns={columns}
        rows={rows}
        rowKey={(f) => f.id}
        rowHref={(f) => (f.obligationId ? staffObHref(portal, `${f.client}-${f.obligationId}`) : undefined)}
        rowLate={isLate}
        pageSize={10}
        filters={
          <>
            <ClientSelect clients={complianceClients(portal)} value={client} onChange={setClient} />
            <Tabs items={["all", "Monthly", "Quarterly", "Annual"].map((p) => ({ key: p, label: p === "all" ? "All" : p }))} value={period} onChange={setPeriod} />
            <Select
              aria-label="Financial year"
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              options={[
                { value: "2026-27", label: "FY 2026-27" },
                { value: "2025-26", label: "FY 2025-26" },
              ]}
            />
            <Button size="sm">
              <Download size={16} strokeWidth={1.5} /> Export
            </Button>
          </>
        }
      />
    </div>
  );
}
