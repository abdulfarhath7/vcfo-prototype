"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TODAY, fmt } from "@/lib/dates";
import { AREAS, AREA_TONE, FILING_STATUSES, FILING_STATUS_BAR, FILING_STATUS_TONE, isLate, type Area, type FilingStatus } from "@/data/compliance";
import { complianceClients, filingsFor, staffObHref, type StaffFiling } from "@/data/staff-compliance";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { Donut } from "@/components/cards/Donut";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ClientName, type StaffPortal } from "./parts";
import { ClientSelect } from "./filters";
import { PortalLink, ProofDialog, type Proof } from "./comp-parts";

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const FILL: Record<FilingStatus, string> = {
  Filed: "var(--ok-mid)",
  "In progress": "var(--accent)",
  "Due soon": "var(--warn-mid)",
  Overdue: "var(--bad-mid)",
  Upcoming: "var(--faint)",
};
const BAR_AREAS: Area[] = ["GST", "Income tax", "MCA", "Payroll", "FEMA"];
/** Two-month windows of FY 2026-27, as in the old "Sep to Oct 2026" head. Month index from April. */
const WINDOWS = Array.from({ length: 11 }, (_, i) => ({ from: i, label: `${MONTHS[i]} to ${MONTHS[i + 1]} ${i >= 9 ? 2027 : 2026}` }));
const fyIndex = (date: Date) => (date.getMonth() + 9) % 12;
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

function StatusCard({ rows, label }: { rows: StaffFiling[]; label: string }) {
  return (
    <SectionCard title="Filing status" meta={label}>
      <Donut total={rows.length} segments={FILING_STATUSES.map((s) => ({ label: s, value: rows.filter((f) => f.status === s).length, tone: FILING_STATUS_BAR[s] }))} />
    </SectionCard>
  );
}

function AreaCard({ rows, label }: { rows: StaffFiling[]; label: string }) {
  return (
    <SectionCard title="Progress by area" meta={label}>
      <div className="grid grid-cols-1 gap-y-4">
        {BAR_AREAS.map((a) => {
          const list = rows.filter((f) => f.area === a);
          const filed = list.filter((f) => f.status === "Filed").length;
          if (list.length === 0) return null;
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
  const [area, setArea] = React.useState<"" | Area>("");
  const [status, setStatus] = React.useState<"" | FilingStatus>("");
  // Window: two months at a time (Sep to Oct holds today), or the full year.
  const [win, setWin] = React.useState(5);
  const [full, setFull] = React.useState(false);
  const [proof, setProof] = React.useState<Proof | null>(null);

  // "Mark filed" turns a row to Filed in place.
  const all = filingsFor(portal, client).map((f): StaffFiling => (marked[f.id] ? { ...f, status: "Filed", filed: TODAY } : f));
  const fyRows = all.filter((f) => f.fy === fy && inPeriod(f, period));
  const w = WINDOWS[win];
  const inWin = (f: StaffFiling) => full || fy !== "2026-27" || (fyIndex(f.due) >= w.from && fyIndex(f.due) <= w.from + 1);
  const winRows = fyRows.filter(inWin);
  const rows = winRows.filter((f) => (!area || f.area === area) && (!status || f.status === status));
  const winLabel = full || fy !== "2026-27" ? `FY ${fy}` : w.label;

  const columns: Column<StaffFiling>[] = [
    { key: "client", label: "Client", width: 150, render: (f) => <ClientName id={f.client} short /> },
    {
      key: "form",
      label: "Form",
      render: (f) => (
        <span className="flex items-center gap-1 whitespace-nowrap font-semibold">
          {f.form}
          <PortalLink area={f.area} />
        </span>
      ),
    },
    { key: "area", label: "Area", width: 100, render: (f) => <Tag tone={AREA_TONE[f.area]}>{f.area}</Tag> },
    { key: "period", label: "Period", width: 140, className: "whitespace-nowrap" },
    { key: "frequency", label: "Frequency", width: 100 },
    { key: "due", label: "Due", width: 76, className: "whitespace-nowrap", render: (f) => fmt(f.due) },
    { key: "filed", label: "Filed", width: 76, className: "whitespace-nowrap", render: (f) => (f.filed ? fmt(f.filed) : "-") },
    { key: "status", label: "Status", width: 132, render: (f) => <Chip tone={FILING_STATUS_TONE[f.status]} fixed>{f.status}</Chip> },
    { key: "arn", label: "ARN", mono: true, width: 190, className: "whitespace-nowrap", render: (f) => f.arn ?? "-" },
    {
      key: "proof",
      label: "Proof",
      width: 110,
      render: (f) =>
        f.status === "Filed" ? (
          <span className="flex items-center gap-0.5">
            <button type="button" onClick={() => setProof({ title: f.form, period: f.period, filed: f.filed, arn: f.arn, client: f.client, area: f.area })} className="rounded-sm hover:opacity-80">
              <Chip tone="prog" dot={false}>
                Proof
              </Chip>
            </button>
            <Button size="iconSm" variant="ghost" className="h-6 w-6" aria-label={`Download proof for ${f.form}`}>
              <Download size={14} strokeWidth={1.5} />
            </Button>
          </span>
        ) : (
          "-"
        ),
    },
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

  const areaOpts = [{ value: "", label: `All areas · ${winRows.length}` }, ...AREAS.filter((a) => winRows.some((f) => f.area === a)).map((a) => ({ value: a, label: `${a} · ${winRows.filter((f) => f.area === a).length}` }))];

  return (
    <div className="grid grid-cols-1 gap-5">
      <Cols>
        <Col>
          <MonthChart rows={all} />
        </Col>
        <Col>
          <StatusCard rows={winRows} label={winLabel} />
          <AreaCard rows={winRows} label={winLabel} />
        </Col>
      </Cols>
      <DataGrid
        title="Filings"
        meta={`${winLabel} · ${rows.length} filings`}
        columns={columns}
        rows={rows}
        rowKey={(f) => f.id}
        rowHref={(f) => (f.obligationId ? staffObHref(portal, `${f.client}-${f.obligationId}`) : undefined)}
        rowLate={isLate}
        pageSize={10}
        filters={
          <>
            {fy === "2026-27" && (
              <span className="inline-flex items-center gap-1">
                <Button size="iconSm" variant="ghost" disabled={full || win === 0} onClick={() => setWin(win - 1)} aria-label="Previous months">
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </Button>
                <Button size="sm" variant={full ? "primary" : "outline"} onClick={() => setFull(!full)} aria-pressed={full}>
                  Full year
                </Button>
                <Button size="iconSm" variant="ghost" disabled={full || win === WINDOWS.length - 1} onClick={() => setWin(win + 1)} aria-label="Next months">
                  <ChevronRight size={16} strokeWidth={1.5} />
                </Button>
              </span>
            )}
            <ClientSelect clients={complianceClients(portal)} value={client} onChange={setClient} />
            <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value as "" | Area)} options={areaOpts} />
            <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as "" | FilingStatus)} options={[{ value: "", label: "All statuses" }, ...FILING_STATUSES.map((st) => ({ value: st, label: st }))]} />
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
            <Button size="sm" asChild>
              <Link href={`/${portal}/compliances/calendar`}>Calendar</Link>
            </Button>
          </>
        }
      />
      <ProofDialog proof={proof} onOpenChange={(v) => !v && setProof(null)} />
    </div>
  );
}
