"use client";
import * as React from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Download, FileCheck2, Layers } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { AreaPill, Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { Donut } from "@/components/cards/Donut";
import { SectionCard } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { PortalLink } from "@/screens/client/comp-parts";
import { SUPER_FILINGS, SUPER_FILING_AREAS, type SuperFiling, type SuperFilingStatus } from "@/data/super-filings";

// Super admin · Compliances · Filings. Ported from reference/old-screens/s/super/Filings.dc.html.
// Order as old: FY switch with period tabs, Export and Calendar; the status donut (R-25: donut at the head of Filings) and
// "By area · Sep-Oct"; area tabs and status tabs; the Sep to Oct grid with Full year. Each row: date tile, area code,
// filing with a portal link and the period, frequency, filed on, status, proof.

const STATUSES: SuperFilingStatus[] = ["Overdue", "Due soon", "Upcoming", "Filed"];
const TONE: Record<SuperFilingStatus, "ok" | "warn" | "bad" | "idle"> = { Filed: "ok", "Due soon": "warn", Overdue: "bad", Upcoming: "idle" };
const TILE: Record<SuperFilingStatus, string> = {
  Filed: "border-ok-soft bg-ok-soft text-ok",
  "Due soon": "border-warn-soft bg-warn-soft text-warn",
  Overdue: "border-bad-soft bg-bad-soft text-bad",
  Upcoming: "border-line bg-raised text-ink",
};
const PERIODS = ["Monthly", "Quarterly", "Annual"] as const;

function inPeriod(f: SuperFiling, p: string) {
  if (p === "Monthly") return true;
  if (p === "Quarterly") return f.frequency !== "Monthly";
  return f.frequency === "Annual";
}

function DueTile({ f }: { f: SuperFiling }) {
  return (
    <span className={cn("grid w-10 flex-none place-items-center rounded-md border-1.5 py-1 leading-none", TILE[f.status])} aria-hidden>
      <b className="text-15 font-medium">{f.due.getDate()}</b>
      <span className="text-11 font-medium opacity-80">{fmt(f.due).split(" ")[1]}</span>
    </span>
  );
}

export function FilingsScreen() {
  const toast = useUndoToast();
  const [period, setPeriod] = React.useState<string>("Monthly");
  const [area, setArea] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [full, setFull] = React.useState(false);

  const all = SUPER_FILINGS.filter((f) => inPeriod(f, period));
  const n = (s: SuperFilingStatus, list = all) => list.filter((f) => f.status === s).length;
  const rows = all.filter((f) => (area === "all" || f.area === area) && (status === "all" || f.status === status));

  const columns: Column<SuperFiling>[] = [
    { key: "due", label: "Due", width: 64, render: (f) => <DueTile f={f} /> },
    { key: "area", label: "Area", width: 124, render: (f) => <AreaPill area={f.area} /> },
    {
      key: "name",
      label: "Filing",
      render: (f) => (
        <span className="block min-w-0">
          <span className="flex items-center gap-1 font-medium">
            {f.name}
            <PortalLink area={f.area} name={f.name} />
          </span>
          <span className="block text-12 text-muted">{f.period}</span>
        </span>
      ),
    },
    { key: "frequency", label: "Frequency", width: 110 },
    {
      key: "filedOn",
      label: "Filed on",
      width: 120,
      render: (f) =>
        typeof f.filedOn === "string" ? <span className={cn(f.status === "Overdue" ? "font-medium text-bad" : "text-muted")}>{f.filedOn}</span> : <span className="font-medium">{fmt(f.filedOn)}</span>,
    },
    { key: "status", label: "Status", width: 124, render: (f) => <Chip fixed tone={TONE[f.status]}>{f.status}</Chip> },
    {
      key: "proof",
      label: "Proof",
      width: 140,
      align: "right",
      render: (f) =>
        f.proof === "file" ? (
          <span className="inline-flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => toast.show(`Proof · ${f.name} · ${f.period}`)}>
              <FileCheck2 size={14} strokeWidth={1.6} /> Proof
            </Button>
            <Button size="iconSm" variant="outline" aria-label="Download proof" onClick={() => toast.show(`Downloaded ${f.name} proof`)}>
              <Download size={14} strokeWidth={1.6} />
            </Button>
          </span>
        ) : f.proof === "pending" ? (
          <Chip fixed tone="warn" dot={false} title="SBC will upload the challan">
            Proof pending
          </Chip>
        ) : (
          <span className="text-faint">-</span>
        ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-9 items-center gap-1 rounded-md border-1.5 border-line bg-surface px-1">
          <Button size="iconSm" variant="ghost" aria-label="Previous year" onClick={() => toast.show("FY 2025-26 is closed")}>
            <ChevronLeft size={16} strokeWidth={1.6} />
          </Button>
          <b className="px-1 text-13 font-medium">FY 2026-27</b>
          <Button size="iconSm" variant="ghost" aria-label="Next year" onClick={() => toast.show("FY 2027-28 opens on 1 Apr 2027")}>
            <ChevronRight size={16} strokeWidth={1.6} />
          </Button>
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <Tabs items={PERIODS.map((p) => ({ key: p, label: p }))} value={period} onChange={setPeriod} />
          <Button size="sm" variant="outline" onClick={() => toast.show("Exported SBC-filings-FY-2026-27.xlsx")}>
            <Download size={14} strokeWidth={1.6} /> Export
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/super/practice/compliances">
              <Calendar size={14} strokeWidth={1.6} /> Calendar
            </Link>
          </Button>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <SectionCard title="Filings by status" meta={period}>
          <Donut
            size={96}
            total={
              <span className="grid place-items-center">
                {all.length}
                <small className="text-11 font-medium text-muted">filings</small>
              </span>
            }
            segments={[
              { label: "Filed", value: n("Filed"), tone: "ok" },
              { label: "Due soon", value: n("Due soon"), tone: "warn" },
              { label: "Overdue", value: n("Overdue"), tone: "bad" },
              { label: "Upcoming", value: n("Upcoming"), tone: "idle" },
            ]}
          />
        </SectionCard>
        <SectionCard title="By area · Sep-Oct" icon={{ Icon: Layers, tone: "violet" }}>
          <ul className="grid gap-2.5">
            {SUPER_FILING_AREAS.map((a) => {
              const list = all.filter((f) => f.area === a);
              return (
                <li key={a}>
                  <button type="button" onClick={() => setArea(area === a ? "all" : a)} className="grid w-full grid-cols-[80px_minmax(0,1fr)_32px] items-center gap-3 rounded-sm text-left text-13 font-medium text-ink-2 aria-pressed:text-accent" aria-pressed={area === a}>
                    <span className="truncate">{a}</span>
                    <StackedBar
                      height={8}
                      className="[&_ul]:hidden"
                      segments={[
                        { label: "Filed", value: n("Filed", list), tone: "ok" },
                        { label: "Overdue", value: n("Overdue", list), tone: "bad" },
                        { label: "Due soon", value: n("Due soon", list), tone: "warn" },
                        { label: "Upcoming", value: n("Upcoming", list), tone: "idle" },
                      ]}
                    />
                    <span className="text-right text-12.5 text-muted">
                      {n("Filed", list)}/{list.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs items={[{ key: "all", label: "All", count: all.length }, ...SUPER_FILING_AREAS.map((a) => ({ key: a, label: a, count: all.filter((f) => f.area === a).length }))]} value={area} onChange={setArea} />
        <Tabs items={[{ key: "all", label: "All" }, ...STATUSES.map((s) => ({ key: s, label: s }))]} value={status} onChange={setStatus} />
      </div>

      <DataGrid
        title={full ? "FY 2026-27" : "Sep to Oct 2026"}
        meta={`${rows.length} filings`}
        columns={columns}
        rows={rows}
        rowKey={(f) => f.id}
        pageSize={20}
        empty="No filings"
        filters={
          <>
            <Button size="iconSm" variant="ghost" aria-label="Previous period" onClick={() => toast.show("Jul to Aug 2026")}>
              <ChevronLeft size={16} strokeWidth={1.6} />
            </Button>
            <Button size="iconSm" variant="ghost" aria-label="Next period" onClick={() => toast.show("Nov to Dec 2026")}>
              <ChevronRight size={16} strokeWidth={1.6} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFull((v) => !v)}>
              {full ? "Sep to Oct" : "Full year"}
            </Button>
          </>
        }
      />
      {toast.node}
    </div>
  );
}
