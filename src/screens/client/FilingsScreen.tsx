"use client";
import * as React from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/cn";
import { daysFrom, fmt } from "@/lib/dates";
import { AREAS, FILINGS, FILING_STATUSES, FILING_STATUS_BAR, FILING_STATUS_TONE, isLate, type Area, type Filing, type FilingStatus } from "@/data/compliance";
import { filingAssist, filingProofs } from "@/data/compliance-detail";
import { Row } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { AreaPill, Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ComplianceDrill, FilterChip, FilingPanel, PortalLink, type DrillRow } from "./comp-parts";

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const FILL: Record<FilingStatus, string> = {
  Filed: "var(--ok-mid)",
  "In progress": "var(--accent-mid)",
  "Due soon": "var(--warn-mid)",
  Overdue: "var(--bad-mid)",
  Upcoming: "var(--idle-mid)",
};
const BAR_AREAS: Area[] = ["GST", "Income tax", "MCA", "Payroll"];

/** Old filRow date tile: tinted by status (index.html dtile). Soft tokens only (RESTORE-BRIEF rule 4). */
const TILE_TONE: Record<FilingStatus, string> = {
  Filed: "bg-ok-soft text-ok",
  "In progress": "bg-accent-soft text-accent",
  "Due soon": "bg-warn-soft text-warn",
  Overdue: "bg-bad-soft text-bad",
  Upcoming: "bg-idle-soft text-idle",
};

function FilingTile({ f }: { f: Filing }) {
  return (
    <span className={cn("grid h-9 w-9 place-content-center rounded-md text-center leading-none", TILE_TONE[f.status])} aria-label={`Due ${fmt(f.due)}`}>
      <b className="text-14 font-medium">{f.due.getDate()}</b>
      <span className="mt-0.5 text-11 font-medium">{MONTH_SHORT[f.due.getMonth()]}</span>
    </span>
  );
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Two-month windows of the FY: index 0 is Apr to May, 5 is Sep to Oct (old "Sep to Oct 2026"). */
const WINDOWS = 11;
const DEFAULT_WINDOW = 5;

function windowOf(fy: string, i: number) {
  const y0 = Number(fy.slice(0, 4));
  const start = new Date(y0, 3 + i, 1);
  const end = new Date(y0, 3 + i + 2, 0);
  const a = MONTH_SHORT[start.getMonth()];
  const b = MONTH_SHORT[end.getMonth()];
  const label = start.getFullYear() === end.getFullYear() ? `${a} to ${b} ${end.getFullYear()}` : `${a} ${start.getFullYear()} to ${b} ${end.getFullYear()}`;
  return { start, end, label };
}

/** Old filings head: "‹ Sep to Oct 2026 ›" and "Full year". */
function PeriodSwitch({ fy, value, onChange }: { fy: string; value: number; onChange: (i: number) => void }) {
  const full = value < 0;
  const cur = full ? DEFAULT_WINDOW : value;
  return (
    <span className="inline-flex h-[30px] items-center overflow-hidden rounded-md border-1.5 border-line-2 bg-surface">
      <button type="button" className="grid h-7 w-7 place-items-center rounded-sm text-muted hover:bg-raised hover:text-ink disabled:opacity-40" aria-label="Previous period" disabled={!full && cur === 0} onClick={() => onChange(full ? DEFAULT_WINDOW - 1 : cur - 1)}>
        <ChevronLeft size={15} strokeWidth={1.6} />
      </button>
      <b className="whitespace-nowrap px-1 text-center text-13 font-medium" aria-live="polite">
        {full ? `FY ${fy}` : windowOf(fy, cur).label}
      </b>
      <button type="button" className="grid h-7 w-7 place-items-center rounded-sm text-muted hover:bg-raised hover:text-ink disabled:opacity-40" aria-label="Next period" disabled={!full && cur === WINDOWS - 1} onClick={() => onChange(full ? DEFAULT_WINDOW + 1 : cur + 1)}>
        <ChevronRight size={15} strokeWidth={1.6} />
      </button>
      <button
        type="button"
        aria-pressed={full}
        onClick={() => onChange(full ? DEFAULT_WINDOW : -1)}
        className={cn("h-full whitespace-nowrap border-l-1.5 border-line-2 px-2.5 text-13 font-medium", full ? "bg-accent-soft text-accent" : "text-ink-2 hover:bg-hover")}
      >
        Full year
      </button>
    </span>
  );
}

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
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6, fontSize: 12.5, color: "var(--ink)" }}
              labelStyle={{ color: "var(--ink)", fontWeight: 500 }}
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
    return <span className={cn("whitespace-nowrap", late > 0 && "font-medium text-bad")}>{fmt(f.filed)}</span>;
  }
  if (f.status === "Overdue") {
    const n = -daysFrom(f.due);
    return <span className="whitespace-nowrap font-medium text-bad">{n === 1 ? "1 day late" : `${n} days late`}</span>;
  }
  return <span className="whitespace-nowrap text-muted">Not filed yet</span>;
}

/** The screen's toast, for the Download button inside a grid cell. */
const NotifyCtx = React.createContext<(text: string) => void>(() => {});

function ProofCell({ f }: { f: Filing }) {
  const notify = React.useContext(NotifyCtx);
  if (f.status !== "Filed") return <span className="text-faint">-</span>;
  const files = filingProofs(f);
  if (files.length === 0) return <Chip tone="warn" fixed>Proof pending</Chip>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-13 text-ink-2">{files.length === 1 ? "1 file" : `${files.length} files`}</span>
      <Button
        size="iconSm"
        variant="ghost"
        aria-label={`Download proof for ${f.form} ${f.period}`}
        onClick={(e) => {
          e.stopPropagation();
          notify(files.length === 1 ? `Downloaded ${files[0].name}` : `Downloaded ${f.form} ${f.period} proof · ${files.length} files`);
        }}
      >
        <Download size={16} strokeWidth={1.6} />
      </Button>
    </span>
  );
}

const columns: Column<Filing>[] = [
  { key: "due", label: "Due", width: 56, render: (f) => <FilingTile f={f} /> },
  { key: "area", label: "Area", width: 124, render: (f) => <AreaPill area={f.area} /> },
  {
    key: "form",
    label: "Filing",
    render: (f) => (
      <span className="flex items-center gap-1 whitespace-nowrap">
        <span className="min-w-0">
          <span className="block font-medium leading-tight">{f.form}</span>
          <span className="block text-12.5 leading-tight text-muted">{f.period}</span>
        </span>
        <PortalLink area={f.area} name={f.form} />
      </span>
    ),
  },
  { key: "frequency", label: "Frequency", width: 104, render: (f) => <span className="text-muted">{f.frequency}</span> },
  { key: "filed", label: "Filed on", width: 116, render: (f) => <FiledCell f={f} /> },
  { key: "status", label: "Status", width: 124, render: (f) => <Chip tone={FILING_STATUS_TONE[f.status]} fixed>{f.status}</Chip> },
  {
    key: "assist",
    label: "VCFO Assist",
    width: 140,
    render: (f) => {
      const a = filingAssist(f);
      return <Chip tone={a.tone}>{a.label}</Chip>;
    },
  },
  { key: "arn", label: "Reference", width: 190, render: (f) => (f.arn ? <span className="whitespace-nowrap font-mono text-12.5">{f.arn}</span> : <span className="text-faint">-</span>) },
  { key: "proof", label: "Proof", width: 128, align: "right", render: (f) => <ProofCell f={f} /> },
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
  const [win, setWin] = React.useState(DEFAULT_WINDOW);
  const [area, setArea] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
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
  const w = win < 0 ? null : windowOf(fy, win);
  const winRows = w ? fyRows.filter((f) => f.due >= w.start && f.due <= w.end) : fyRows;
  const rows = winRows.filter((f) => inPeriod(f, period) && (!area || f.area === area) && (!status || f.status === status));
  const count = (p: string) => winRows.filter((f) => inPeriod(f, p)).length;
  const onDrill = (title: string, list: Filing[]) => setDrill({ title, rows: list.map(toDrill) });

  return (
    <NotifyCtx.Provider value={toast.show}>
      <div className="grid grid-cols-1 gap-5">
        <Row>
          <MonthChart rows={fyRows} onDrill={onDrill} />
          <AreaCard rows={fyRows} onDrill={onDrill} />
        </Row>
        <DataGrid
          title="Filings"
          columns={columns}
          rows={rows}
          rowKey={(f) => f.id}
          rowLate={isLate}
          onRowClick={setPick}
          selectedKey={pick?.id}
          pageSize={10}
          empty="None"
          footer={
            (area || status) && (
              <button
                type="button"
                className="font-medium text-accent hover:underline"
                onClick={() => {
                  setArea(null);
                  setStatus(null);
                }}
              >
                Clear filters
              </button>
            )
          }
          filters={
            <>
              <PeriodSwitch fy={fy} value={win} onChange={setWin} />
              <Tabs items={["all", "Monthly", "Quarterly", "Annual"].map((p) => ({ key: p, label: p === "all" ? "All" : p, count: count(p) }))} value={period} onChange={setPeriod} />
              <FilterChip label="Area" value={area} onChange={setArea} options={AREAS.map((a) => ({ value: a, label: a }))} />
              <FilterChip label="Status" value={status} onChange={setStatus} options={FILING_STATUSES.map((s) => ({ value: s, label: s }))} />
              <Select
                aria-label="Financial year"
                value={fy}
                onChange={(e) => setFy(e.target.value)}
                options={[
                  { value: "2026-27", label: "FY 2026-27" },
                  { value: "2025-26", label: "FY 2025-26" },
                ]}
              />
              <Button size="iconSm" variant="secondary" aria-label={`Export filings FY ${fy}`} title="Export" onClick={() => toast.show(`Filings FY ${fy}.xlsx downloaded`)}>
                <Download size={16} strokeWidth={1.6} />
              </Button>
              <Button asChild size="iconSm" variant="secondary" aria-label="Open the calendar" title="Calendar">
                <Link href="/client/calendar">
                  <Calendar size={16} strokeWidth={1.6} />
                </Link>
              </Button>

            </>
          }
        />
        <FilingPanel filing={pick} onClose={() => setPick(null)} onNotify={toast.show} />
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
    </NotifyCtx.Provider>
  );
}
