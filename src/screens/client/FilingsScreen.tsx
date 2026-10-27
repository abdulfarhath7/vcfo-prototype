"use client";
import * as React from "react";
import Link from "next/link";
import { Calendar, Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/cn";
import { daysFrom, fmt } from "@/lib/dates";
import { AREAS, AREA_TONE, FILINGS, FILING_STATUSES, FILING_STATUS_BAR, FILING_STATUS_TONE, isLate, type Area, type Filing, type FilingStatus } from "@/data/compliance";
import { filingAssist, filingProofs } from "@/data/compliance-detail";
import { Row } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ComplianceDrill, FilingPanel, PortalLink, type DrillRow } from "./comp-parts";

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const FILL: Record<FilingStatus, string> = {
  Filed: "var(--ok-mid)",
  "In progress": "var(--accent)",
  "Due soon": "var(--warn-mid)",
  Overdue: "var(--bad-mid)",
  Upcoming: "var(--faint)",
};
const BAR_AREAS: Area[] = ["GST", "Income tax", "MCA", "Payroll"];

const toDrill = (f: Filing): DrillRow => ({ id: f.id, name: f.form, period: f.period, area: f.area, due: f.due, filed: f.filed, status: f.status });

/** Filings per month of FY 2026-27, stacked by status. Click a bar to see its rows (old rule 14). */
function MonthChart({ rows, onDrill }: { rows: Filing[]; onDrill: (title: string, list: Filing[]) => void }) {
  const data = MONTHS.map((m, i) => {
    const month = (i + 3) % 12;
    const row: Record<string, string | number> = { m, month };
    for (const s of FILING_STATUSES) row[s] = rows.filter((f) => f.due.getMonth() === month && f.status === s).length;
    return row;
  });
  return (
    <SectionCard title="Filings by month" meta="FY 2026-27">
      <div className="h-[232px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
            barCategoryGap="28%"
            onClick={(e) => {
              const i = typeof e?.activeTooltipIndex === "number" ? e.activeTooltipIndex : Number(e?.activeTooltipIndex);
              if (Number.isNaN(i) || i < 0) return;
              const month = (i + 3) % 12;
              onDrill(`Filings · ${MONTHS[i]}`, rows.filter((f) => f.due.getMonth() === month));
            }}
            className="cursor-pointer"
          >
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

function AreaCard({ rows, onDrill }: { rows: Filing[]; onDrill: (title: string, list: Filing[]) => void }) {
  return (
    <SectionCard title="Progress by area">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {BAR_AREAS.map((a) => {
          const list = rows.filter((f) => f.area === a);
          const filed = list.filter((f) => f.status === "Filed").length;
          return (
            <button key={a} type="button" onClick={() => onDrill(`${a} filings`, list)} className="-m-1.5 rounded-md p-1.5 text-left hover:bg-raised" aria-label={`${a}: ${filed} of ${list.length} filed. Show the rows`}>
              <StackedBar
                title={`${a} · ${filed} of ${list.length} filed`}
                height={6}
                segments={FILING_STATUSES.map((s) => ({ label: s, value: list.filter((f) => f.status === s).length, tone: FILING_STATUS_BAR[s] })).filter((s) => s.value > 0)}
              />
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

function FiledCell({ f }: { f: Filing }) {
  if (f.filed) {
    const late = daysFrom(f.filed, f.due);
    return <span className={cn("font-semibold", late > 0 && "text-bad")}>{fmt(f.filed)}</span>;
  }
  if (f.status === "Overdue") {
    const n = -daysFrom(f.due);
    return <span className="font-semibold text-bad">{n === 1 ? "1 day late" : `${n} days late`}</span>;
  }
  return <span className="text-muted">Not filed yet</span>;
}

function ProofCell({ f }: { f: Filing }) {
  if (f.status !== "Filed") return <span className="text-faint">-</span>;
  const files = filingProofs(f);
  if (files.length === 0) return <Chip tone="warn">Proof pending</Chip>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Chip tone="ok" dot={false}>
        {files.length === 1 ? "1 file" : `${files.length} files`}
      </Chip>
      <Button size="iconSm" variant="ghost" aria-label={`Download proof for ${f.form} ${f.period}`} onClick={(e) => e.stopPropagation()}>
        <Download size={16} strokeWidth={1.5} />
      </Button>
    </span>
  );
}

const columns: Column<Filing>[] = [
  { key: "due", label: "Due", width: 72, render: (f) => <span className={cn(f.status === "Overdue" && "font-semibold")}>{fmt(f.due)}</span> },
  { key: "area", label: "Area", width: 104, render: (f) => <Tag tone={AREA_TONE[f.area]}>{f.area}</Tag> },
  {
    key: "form",
    label: "Filing",
    render: (f) => (
      <span className="flex min-w-[150px] items-center gap-1">
        <span className="min-w-0">
          <span className="block font-semibold">{f.form}</span>
          <span className="block text-12 text-muted">{f.period}</span>
        </span>
        <PortalLink area={f.area} name={f.form} />
      </span>
    ),
  },
  { key: "frequency", label: "Frequency", width: 104, render: (f) => <span className="text-muted">{f.frequency}</span> },
  { key: "filed", label: "Filed on", width: 110, render: (f) => <FiledCell f={f} /> },
  { key: "status", label: "Status", width: 132, render: (f) => <Chip tone={FILING_STATUS_TONE[f.status]} fixed>{f.status}</Chip> },
  {
    key: "assist",
    label: "VCFO Assist",
    width: 140,
    render: (f) => {
      const a = filingAssist(f);
      return <Chip tone={a.tone}>{a.label}</Chip>;
    },
  },
  { key: "arn", label: "Reference", mono: true, width: 180, render: (f) => f.arn ?? "-" },
  { key: "proof", label: "Proof", width: 120, align: "right", render: (f) => <ProofCell f={f} /> },
];

/** Monthly, Quarterly (with half-yearly), Annual (with event-based). */
function inPeriod(f: Filing, p: string) {
  if (p === "all") return true;
  if (p === "Annual") return f.frequency === "Annual" || f.frequency === "Event";
  if (p === "Quarterly") return f.frequency === "Quarterly" || f.frequency === "Half-yearly";
  return f.frequency === p;
}

export function FilingsScreen() {
  const toast = useUndoToast();
  const [period, setPeriod] = React.useState("all");
  const [fy, setFy] = React.useState("2026-27");
  const [area, setArea] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [pick, setPick] = React.useState<Filing | null>(null);
  const [drill, setDrill] = React.useState<{ title: string; rows: DrillRow[] } | null>(null);

  // Calendar "Open in filings" links here with ?f=<id>.
  React.useEffect(() => {
    try {
      const id = new URLSearchParams(window.location.search).get("f");
      const f = id ? FILINGS.find((x) => x.id === id || `c-${x.id}` === id) : undefined;
      if (f) setPick(f);
    } catch {}
  }, []);

  const fyRows = FILINGS.filter((f) => f.fy === fy);
  const rows = fyRows.filter((f) => inPeriod(f, period) && (area === "all" || f.area === area) && (status === "all" || f.status === status));
  const count = (p: string) => fyRows.filter((f) => inPeriod(f, p)).length;
  const onDrill = (title: string, list: Filing[]) => setDrill({ title, rows: list.map(toDrill) });

  return (
    <div className="grid grid-cols-1 gap-5">
      <Row>
        <MonthChart rows={fyRows} onDrill={onDrill} />
        <AreaCard rows={fyRows} onDrill={onDrill} />
      </Row>
      <DataGrid
        title="Filings"
        meta={`FY ${fy}`}
        columns={columns}
        rows={rows}
        rowKey={(f) => f.id}
        rowLate={isLate}
        onRowClick={setPick}
        selectedKey={pick?.id}
        pageSize={10}
        empty="None"
        footer={
          (area !== "all" || status !== "all") && (
            <button
              type="button"
              className="font-semibold text-accent hover:underline"
              onClick={() => {
                setArea("all");
                setStatus("all");
              }}
            >
              Clear filters
            </button>
          )
        }
        filters={
          <>
            <Tabs items={["all", "Monthly", "Quarterly", "Annual"].map((p) => ({ key: p, label: p === "all" ? "All" : p, count: count(p) }))} value={period} onChange={setPeriod} />
            <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)} options={[{ value: "all", label: "All areas" }, ...AREAS.map((a) => ({ value: a, label: a }))]} />
            <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: "all", label: "Any status" }, ...FILING_STATUSES.map((s) => ({ value: s, label: s }))]} />
            <Select
              aria-label="Financial year"
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              options={[
                { value: "2026-27", label: "FY 2026-27" },
                { value: "2025-26", label: "FY 2025-26" },
              ]}
            />
            <Button size="sm" onClick={() => toast.show(`Filings FY ${fy}.xlsx downloaded`)}>
              <Download size={16} strokeWidth={1.5} /> Export
            </Button>
            <Button asChild size="sm">
              <Link href="/client/calendar">
                <Calendar size={16} strokeWidth={1.5} /> Calendar
              </Link>
            </Button>
          </>
        }
      />
      <FilingPanel filing={pick} onClose={() => setPick(null)} />
      <ComplianceDrill
        open={!!drill}
        onOpenChange={(v) => !v && setDrill(null)}
        title={drill?.title ?? ""}
        rows={drill?.rows ?? []}
        onPick={(r) => {
          setDrill(null);
          setPick(FILINGS.find((f) => f.id === r.id) ?? null);
        }}
      />
      {toast.node}
    </div>
  );
}
