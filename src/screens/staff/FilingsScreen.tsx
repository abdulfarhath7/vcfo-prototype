"use client";
import * as React from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Download, FileCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { type Area } from "@/data/compliance";
import { OLD_FILINGS, OLD_FILING_AREAS, type OldFiling, type OldFilingStatus } from "@/data/staff-filings-table";
import { Button } from "@/components/ui/Button";
import { AreaPill, Chip, type ChipTone } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { barFill, type BarTone } from "@/components/ui/Bar";
import { Donut } from "@/components/cards/Donut";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { type StaffPortal } from "./parts";
import { PortalLink, ProofDialog, type Proof } from "./comp-parts";

// Staff Filings, as in reference/old-screens/s/lead/Filings.dc.html (lead, manager and admin are the same):
// a donut and area bars at the head, area tabs and status tabs, then the filings with date tiles.
// C-0016 changed only the client page. R-07 makes the table an e-Filing grid; R-08 puts year, period and export in its head.

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const fyIndex = (date: Date) => (date.getMonth() + 9) % 12;
const yearOf = (i: number) => (i >= 9 ? 2027 : 2026);

type Period = "monthly" | "quarterly" | "annual";
/** Monthly shows two months, as the old "Sep to Oct 2026" head. Quarterly shows three. Annual shows the year. */
const SPAN: Record<Period, number> = { monthly: 2, quarterly: 3, annual: 12 };
const STEP: Record<Period, number> = { monthly: 1, quarterly: 3, annual: 12 };

const STATUSES: OldFilingStatus[] = ["Filed", "Due soon", "Overdue", "Upcoming"];
const S_TONE: Record<OldFilingStatus, ChipTone> = { Filed: "ok", "Due soon": "warn", Overdue: "bad", Upcoming: "idle" };
const S_BAR: Record<OldFilingStatus, BarTone> = { Filed: "ok", "Due soon": "warn", Overdue: "bad", Upcoming: "idle" };
const TILE: Record<OldFilingStatus, string> = { Filed: "bg-ok-soft text-ok", "Due soon": "bg-warn-soft text-warn", Overdue: "bg-bad-soft text-bad", Upcoming: "bg-raised text-ink-2" };
const AREA_LABEL: Record<Area, string> = { GST: "GST", "Income tax": "Income tax", MCA: "MCA", Payroll: "Payroll", FEMA: "FEMA", Labour: "Labour" };
/** R-43 regulator swatches. */
const REG_SWATCH: Record<Area, string> = { GST: "bg-reg-gst", "Income tax": "bg-reg-it", MCA: "bg-reg-mca", Payroll: "bg-reg-payroll", FEMA: "bg-reg-fema", Labour: "bg-reg-labour" };

function DueTile({ f }: { f: OldFiling }) {
  return (
    <span className={cn("inline-flex h-11 w-11 flex-col items-center justify-center rounded-md leading-none", TILE[f.status])} aria-label={`Due ${f.due.getDate()} ${MONTHS[fyIndex(f.due)]}`}>
      <b className="text-16 font-medium">{f.due.getDate()}</b>
      <span className="mt-[3px] text-[10.5px] font-medium uppercase tracking-[.06em]">{MONTHS[fyIndex(f.due)]}</span>
    </span>
  );
}

function exportCsv(rows: OldFiling[]) {
  const head = ["Due", "Area", "Filing", "Period", "Frequency", "Filed on", "Status"];
  const lines = rows.map((f) => [`${f.due.getDate()} ${MONTHS[fyIndex(f.due)]}`, f.area, f.form, f.period, f.frequency, f.filedOn, f.status].map((v) => `"${v.replaceAll('"', '""')}"`).join(","));
  const url = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "filings.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function FilingsScreen({ portal }: { portal: StaffPortal }) {
  const [period, setPeriod] = React.useState<Period>("monthly");
  const [from, setFrom] = React.useState(5); // Sep
  const [area, setArea] = React.useState<"all" | Area>("all");
  const [status, setStatus] = React.useState<"all" | OldFilingStatus>("all");
  const [proof, setProof] = React.useState<Proof | null>(null);
  const toast = useUndoToast();

  const span = SPAN[period];
  const start = period === "annual" ? 0 : Math.min(from, 12 - span);
  const end = start + span - 1;
  const label = period === "annual" ? "FY 2026-27" : `${MONTHS[start]} to ${MONTHS[end]} ${yearOf(end)}`;
  const short = period === "annual" ? "FY 2026-27" : `${MONTHS[start]}-${MONTHS[end]}`;
  const inWindow = OLD_FILINGS.filter((f) => fyIndex(f.due) >= start && fyIndex(f.due) <= end);
  const byArea = inWindow.filter((f) => area === "all" || f.area === area);
  const rows = byArea.filter((f) => status === "all" || f.status === status);

  const move = (dir: 1 | -1) => setFrom(Math.max(0, Math.min(12 - span, start + dir * STEP[period])));
  const pickPeriod = (p: Period) => {
    setPeriod(p);
    if (p === "quarterly") setFrom(Math.floor(start / 3) * 3);
  };

  const cols: Column<OldFiling>[] = [
    { key: "due", label: "Due", width: 68, render: (f) => <DueTile f={f} /> },
    { key: "area", label: "Area", width: 124, render: (f) => <AreaPill area={AREA_LABEL[f.area]} /> },
    {
      key: "filing",
      label: "Filing",
      render: (f) => (
        <span className="block min-w-0">
          <span className="flex items-center gap-1">
            <b className="truncate text-14 font-medium text-ink">{f.form}</b>
            <PortalLink area={f.area} />
          </span>
          <span className="block text-12.5 text-muted">{f.period}</span>
        </span>
      ),
    },
    { key: "freq", label: "Frequency", width: 120, render: (f) => <span className="text-ink-2">{f.frequency}</span> },
    { key: "filed", label: "Filed on", width: 130, render: (f) => <span className={f.status === "Overdue" ? "font-medium text-bad" : f.status === "Filed" ? "text-ink" : "text-muted"}>{f.filedOn}</span> },
    {
      key: "status",
      label: "Status",
      width: 128,
      render: (f) => (
        <Chip tone={S_TONE[f.status]} fixed>
          {f.status}
        </Chip>
      ),
    },
    {
      key: "proof",
      label: "Proof",
      width: 140,
      align: "right",
      render: (f) =>
        f.proof === "file" ? (
          <span className="inline-flex items-center gap-1.5">
            <Button size="sm" variant="soft" onClick={() => setProof({ title: f.form, period: f.period, client: "", area: f.area })}>
              <FileCheck size={14} strokeWidth={1.6} /> Proof
            </Button>
            <Button size="iconSm" variant="outline" aria-label={`Download proof of ${f.form}`} title="Download" onClick={() => toast.show(`Downloaded ${f.form} proof · ${f.period}`)}>
              <Download size={14} strokeWidth={1.6} />
            </Button>
          </span>
        ) : f.proof === "pending" ? (
          <Chip tone="warn" fixed dot={false}>
            Proof pending
          </Chip>
        ) : (
          <span className="text-faint">-</span>
        ),
    },
  ];

  const filters = (
    <>
      <span className="inline-flex items-center">
        <Button size="iconSm" variant="ghost" onClick={() => move(-1)} disabled={period === "annual" || start === 0} aria-label="Previous period">
          <ChevronLeft size={16} strokeWidth={1.6} />
        </Button>
        <Button size="iconSm" variant="ghost" onClick={() => move(1)} disabled={period === "annual" || end === 11} aria-label="Next period">
          <ChevronRight size={16} strokeWidth={1.6} />
        </Button>
      </span>
      <Tabs
        items={[
          { key: "monthly", label: "Monthly" },
          { key: "quarterly", label: "Quarterly" },
          { key: "annual", label: "Annual" },
        ]}
        value={period}
        onChange={(k) => pickPeriod(k as Period)}
      />
      <Button size="sm" onClick={() => pickPeriod("annual")} disabled={period === "annual"}>
        Full year
      </Button>
      <Button size="sm" onClick={() => exportCsv(rows)}>
        <Download size={16} strokeWidth={1.6} /> Export
      </Button>
      <Button size="sm" asChild>
        <Link href={`/${portal}/compliances/calendar`}>
          <Calendar size={16} strokeWidth={1.6} /> Calendar
        </Link>
      </Button>
    </>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="flex items-center rounded-md border-1.5 border-line bg-surface px-5 py-4" aria-label="Filings by status">
          <Donut
            size={84}
            className="w-full [&>div:last-child]:flex-1"
            total={
              <span className="grid place-items-center leading-none">
                {inWindow.length}
                <small className="mt-0.5 text-11.5 font-normal text-muted">filings</small>
              </span>
            }
            segments={STATUSES.map((s) => ({ label: s, value: inWindow.filter((f) => f.status === s).length, tone: S_BAR[s] }))}
          />
        </section>
        <section className="rounded-md border-1.5 border-line bg-surface px-5 py-4" aria-label="By area">
          <p className="mb-3 text-15 font-medium">By area · {short}</p>
          <div className="grid gap-1.5">
            {OLD_FILING_AREAS.map((a) => {
              const list = inWindow.filter((f) => f.area === a);
              const filed = list.filter((f) => f.status === "Filed").length;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(area === a ? "all" : a)}
                  aria-pressed={area === a}
                  className={cn("-mx-1.5 grid grid-cols-[96px_minmax(0,1fr)_36px] items-center gap-3 rounded-sm px-1.5 py-0.5 text-left hover:bg-hover", area === a && "bg-accent-soft")}
                >
                  <span className="flex items-center gap-1.5 text-13 font-medium text-ink-2">
                    <i className={cn("h-2 w-2 flex-none rounded-[2px]", REG_SWATCH[a])} aria-hidden />
                    {AREA_LABEL[a]}
                  </span>
                  <span className="flex h-2 gap-0.5 overflow-hidden rounded-bar bg-raised" title={`${AREA_LABEL[a]} · ${list.length} filings`}>
                    {STATUSES.map((s) => {
                      const n = list.filter((f) => f.status === s).length;
                      return n ? <i key={s} className={cn("block h-full", barFill[S_BAR[s]])} style={{ flex: n }} title={`${AREA_LABEL[a]} · ${n} ${s.toLowerCase()}`} /> : null;
                    })}
                  </span>
                  <span className="text-right text-12.5 text-muted">
                    {filed}/{list.length}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Tabs
          items={[{ key: "all", label: "All", count: inWindow.length }, ...OLD_FILING_AREAS.map((a) => ({ key: a, label: AREA_LABEL[a], count: inWindow.filter((f) => f.area === a).length }))]}
          value={area}
          onChange={(k) => setArea(k as "all" | Area)}
        />
        <Tabs className="sm:ml-auto" items={[{ key: "all", label: "All" }, ...["Overdue", "Due soon", "Upcoming", "Filed"].map((s) => ({ key: s, label: s }))]} value={status} onChange={(k) => setStatus(k as "all" | OldFilingStatus)} />
      </div>

      <DataGrid title={label} meta={`FY 2026-27 · ${rows.length} filings`} icon={{ Icon: Calendar, tone: "teal" }} filters={filters} columns={cols} rows={rows} rowKey={(f) => f.id} pageSize={20} empty="No filings" />

      <ProofDialog proof={proof} onOpenChange={(v) => !v && setProof(null)} />
      {toast.node}
    </div>
  );
}
