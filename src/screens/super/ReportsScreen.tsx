"use client";
import * as React from "react";
import { CalendarClock, Download, Play, X } from "lucide-react";
import { TODAY, d, fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { AREAS, REPORTS, REPORT_PERIODS, clientById, type SavedReport } from "@/data/super";
import {
  DUES,
  FEES,
  LATE_FEES,
  MANAGER_ROWS,
  PARTNER_CLIENTS_LINE,
  PARTNER_NUMBERS,
  SCHEDULES,
  TOP_RISKS,
  ageBucket,
  rupees,
  type ManagerRow,
} from "@/data/super-firm";
import { ClientName, opts } from "./parts";

// Ported from reference/old-patch/super/Reports.dc.html (the monthly partner report: month switch, Download PDF, numbers,
// clients, managers, top risks) and reference/old-patch/super/Money.dc.html as the "Fees and late fees" report.
// Money stays off dashboards (R-37): it lives in this report only. The sidebar does not change; the report opens from this list.

const FEES_REPORT: SavedReport = { id: "r12", name: "Fees and late fees", area: "Firm", period: "Oct 2026", lastRun: d(2026, 10, 1), schedule: "1st of the month" };
const RECIPIENTS = ["Mithilesh", "Krishna", "Ritu Agarwal"];
const VIEWS = new Set(["r1", "r12"]);

const fileName = (r: SavedReport, period = r.period) => `SBC-${r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${period.toLowerCase().replace(/\s+/g, "-")}.pdf`;

/* ---------- Partner report ---------- */

const mgrCols: Column<ManagerRow>[] = [
  { key: "name", label: "Manager", render: (m) => <span className="font-semibold">{m.name}</span> },
  { key: "admin", label: "Admin" },
  { key: "clients", label: "Clients", align: "right", width: 80 },
  { key: "onTime", label: "On time", align: "right", width: 84, render: (m) => `${m.onTime}%` },
  { key: "days", label: "Days to COI", align: "right", width: 104, render: (m) => `${m.daysToCoi} days` },
];

function PartnerReport({ month }: { month: "Oct" | "Sep" }) {
  return (
    <div className="grid gap-5">
      <div className="flex items-baseline gap-3 border-b border-line-soft pb-3">
        <span className="text-12.5 text-muted">SBC · monthly partner report</span>
        <h3 className="ml-auto text-16 font-semibold">{month === "Oct" ? "October 2026" : "September 2026"}</h3>
      </div>
      <section>
        <h4 className="mb-2 text-13 font-semibold">The month in numbers</h4>
        <KeyValue cols={3} rows={PARTNER_NUMBERS(month)} />
      </section>
      <section>
        <h4 className="mb-1 text-13 font-semibold">Clients</h4>
        <p className="text-13.5 text-ink-2">{PARTNER_CLIENTS_LINE[month]}</p>
      </section>
      <section>
        <h4 className="mb-2 text-13 font-semibold">Managers</h4>
        <DataGrid columns={mgrCols} rows={MANAGER_ROWS} rowKey={(m) => m.id} className="rounded-md border border-line" inset />
      </section>
      <section>
        <h4 className="mb-1 text-13 font-semibold">Top risks for {month === "Oct" ? "November" : "October"}</h4>
        <ol className="list-decimal pl-5 text-13.5 text-ink-2">
          {TOP_RISKS.slice(0, 4).map((r) => (
            <li key={r.id}>
              {r.title}
              {r.clientId ? ` · ${r.clientName}` : ""}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/* ---------- Fees and late fees ---------- */

type FeeRow = (typeof FEES)[number];
type DueRow = (typeof DUES)[number];
type LateRow = (typeof LATE_FEES)[number];

const feeCols: Column<FeeRow>[] = [
  { key: "line", label: "Service line", render: (f) => <span className="font-semibold">{f.line}</span> },
  { key: "billed", label: "Billed", align: "right", render: (f) => rupees(f.billed) },
  { key: "collected", label: "Collected", align: "right", render: (f) => rupees(f.collected) },
  { key: "pct", label: "Collected %", align: "right", width: 110, render: (f) => `${Math.round((f.collected / f.billed) * 100)}%` },
];

const dueCols: Column<DueRow>[] = [
  { key: "client", label: "Client", render: (x) => <ClientName client={clientById(x.clientId)!} sub={clientById(x.clientId)!.manager} /> },
  { key: "amount", label: "Outstanding", align: "right", width: 120, render: (x) => rupees(x.amount) },
  { key: "days", label: "Days", align: "right", width: 70 },
  { key: "age", label: "Ageing", width: 130, render: (x) => <span className={cn(x.days > 60 ? "font-semibold text-bad" : x.days > 30 && "font-semibold text-warn")}>{ageBucket(x.days)}</span> },
];

const lateCols: Column<LateRow>[] = [
  {
    key: "form",
    label: "Filing",
    render: (x) => (
      <span>
        <span className="block font-semibold">{x.form}</span>
        <span className="block text-12 text-muted">
          {x.statute} · due {fmt(x.due)}
        </span>
      </span>
    ),
  },
  { key: "client", label: "Client", render: (x) => <ClientName client={clientById(x.clientId)!} /> },
  { key: "manager", label: "Manager", className: "whitespace-nowrap", render: (x) => clientById(x.clientId)!.manager },
  { key: "late", label: "Days late", align: "right", width: 90 },
  { key: "soFar", label: "So far", align: "right", width: 100, render: (x) => <span className="font-semibold text-bad">{rupees(x.soFar)}</span> },
  { key: "perDay", label: "Per day", align: "right", width: 90, render: (x) => rupees(x.perDay) },
];

function FeesReport() {
  const billed = FEES.reduce((a, f) => a + f.billed, 0);
  const coll = FEES.reduce((a, f) => a + f.collected, 0);
  const out = DUES.reduce((a, x) => a + x.amount, 0);
  const expo = LATE_FEES.reduce((a, x) => a + x.soFar, 0);
  return (
    <div className="grid gap-5">
      <KeyValue
        cols={2}
        rows={[
          { k: "Billed in October", v: rupees(billed) },
          { k: `Collected · ${Math.round((coll / billed) * 100)}% of billed`, v: <span className="text-ok">{rupees(coll)}</span> },
          { k: `Outstanding from ${DUES.length} clients`, v: <span className="text-warn">{rupees(out)}</span> },
          { k: "Late-fee exposure today", v: <span className="text-bad">{rupees(expo)}</span> },
        ]}
      />
      <DataGrid title="Fees collected · October" columns={feeCols} rows={FEES} rowKey={(f) => f.line} />
      <DataGrid title="Outstanding by client" columns={dueCols} rows={[...DUES].sort((a, b) => b.days - a.days)} rowKey={(x) => x.clientId} />
      <DataGrid title="Late-fee exposure by client" columns={lateCols} rows={LATE_FEES} rowKey={(x) => x.id} rowLate={() => true} />
    </div>
  );
}

/* ---------- Screen ---------- */

export function ReportsScreen() {
  const [reports, setReports] = React.useState<SavedReport[]>([...REPORTS, FEES_REPORT]);
  const [period, setPeriod] = React.useState("");
  const [area, setArea] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [month, setMonth] = React.useState<"Oct" | "Sep">("Oct");
  const [sched, setSched] = React.useState<SavedReport | null>(null);
  const [freq, setFreq] = React.useState("");
  const [to, setTo] = React.useState<string[]>(["Mithilesh"]);
  const [format, setFormat] = React.useState("PDF");
  const toast = useUndoToast();
  const viewRef = React.useRef<HTMLDivElement>(null);
  const rows = reports.filter((r) => (!period || r.period === period) && (!area || r.area === area));
  const open = reports.find((r) => r.id === openId);

  const run = (r: SavedReport) => {
    setReports((all) => all.map((x) => (x.id === r.id ? { ...x, lastRun: TODAY } : x)));
    if (VIEWS.has(r.id)) show(r.id);
    else toast.show(`${r.name} ran · ${fmt(TODAY)}`);
  };
  const show = (id: string) => {
    setOpenId(id);
    window.setTimeout(() => viewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const download = (r: SavedReport, p?: string) => toast.show(`Downloaded ${fileName(r, p)}`);

  const columns: Column<SavedReport>[] = [
    {
      key: "name",
      label: "Report",
      render: (r) =>
        VIEWS.has(r.id) ? (
          <button type="button" onClick={() => show(r.id)} className="text-left font-semibold text-accent hover:underline">
            {r.name}
          </button>
        ) : (
          <span className="font-semibold">{r.name}</span>
        ),
    },
    { key: "area", label: "Area", className: "whitespace-nowrap" },
    { key: "period", label: "Period", className: "whitespace-nowrap" },
    { key: "lastRun", label: "Last run", width: 96, className: "whitespace-nowrap", render: (r) => (r.lastRun.getTime() === TODAY.getTime() ? "Today" : fmt(r.lastRun)) },
    { key: "schedule", label: "Schedule", className: "whitespace-nowrap" },
    {
      key: "act",
      label: "",
      width: 300,
      render: (r) => (
        <span className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => run(r)}>
            <Play size={14} strokeWidth={1.5} /> Run
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSched(r);
              setFreq(r.schedule);
            }}
          >
            <CalendarClock size={14} strokeWidth={1.5} /> Schedule
          </Button>
          <Button size="sm" variant="outline" onClick={() => download(r)} aria-label={`Download ${r.name}`}>
            <Download size={14} strokeWidth={1.5} /> Download
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <DataGrid
        title="Saved reports"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        pageSize={12}
        selectedKey={openId ?? undefined}
        filters={
          <>
            <Select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} options={opts("All periods", REPORT_PERIODS)} />
            <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)} options={opts("All areas", ["Firm", ...AREAS])} />
          </>
        }
      />

      {open && (
        <div ref={viewRef} className="scroll-mt-20">
          <SectionCard
            title={open.name}
            meta={open.id === "r1" ? `Prepared ${fmt(TODAY)} · final on 1 Nov` : open.period}
            right={
              <>
                {open.id === "r1" && (
                  <Tabs
                    items={[
                      { key: "Sep", label: "September" },
                      { key: "Oct", label: "October" },
                    ]}
                    value={month}
                    onChange={(k) => setMonth(k as "Oct" | "Sep")}
                  />
                )}
                <Button size="sm" variant="primary" onClick={() => download(open, open.id === "r1" ? (month === "Oct" ? "October 2026" : "September 2026") : undefined)}>
                  <Download size={14} strokeWidth={1.5} /> Download PDF
                </Button>
                <Button size="iconSm" variant="ghost" aria-label="Close report" onClick={() => setOpenId(null)}>
                  <X size={16} strokeWidth={1.5} />
                </Button>
              </>
            }
          >
            {open.id === "r1" ? <PartnerReport month={month} /> : <FeesReport />}
          </SectionCard>
        </div>
      )}

      <Modal
        open={!!sched}
        onOpenChange={(v) => !v && setSched(null)}
        title="Schedule report"
        eyebrow={sched?.name}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSched(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={to.length === 0}
              onClick={() => {
                if (!sched) return;
                setReports((all) => all.map((x) => (x.id === sched.id ? { ...x, schedule: freq } : x)));
                toast.show(`${sched.name}: ${freq.toLowerCase()} to ${to.join(", ")} as ${format}`);
                setSched(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Repeat">
            <Select aria-label="Repeat" size="md" value={freq} onChange={(e) => setFreq(e.target.value)} options={SCHEDULES.map((s) => ({ value: s, label: s }))} className="w-full [&>select]:w-full" />
          </Field>
          <Field label="Format">
            <Select
              aria-label="Format"
              size="md"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              options={[
                { value: "PDF", label: "PDF" },
                { value: "XLSX", label: "Excel (XLSX)" },
              ]}
              className="w-full [&>select]:w-full"
            />
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-12.5 font-semibold text-muted">Send to</legend>
            <div className="grid gap-2">
              {RECIPIENTS.map((n) => (
                <label key={n} className="flex items-center gap-2.5 text-13.5">
                  <Checkbox checked={to.includes(n)} onChange={(v) => setTo((all) => (v ? [...all, n] : all.filter((x) => x !== n)))} label={n} />
                  {n}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Modal>
      {toast.node}
    </div>
  );
}
