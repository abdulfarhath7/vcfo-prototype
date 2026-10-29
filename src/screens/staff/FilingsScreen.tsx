"use client";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, Clock, Download, FileCheck, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { type Area } from "@/data/compliance";
import { staffObHref, complianceClients } from "@/data/staff-compliance";
import { itemExists } from "@/data/staff-item";
import { clientById } from "@/data/staff-clients";
import { ANALYTICS } from "@/data/staff-analytics";
import { FILINGS_TODAY, FILING_REGULATORS, OLD_FILINGS, clientFilingsFor, leadOfFiling, type ClientFiling, type ClientFilingState, type OldFiling, type OldFilingStatus } from "@/data/staff-filings-table";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { AreaPill, Chip, type ChipTone } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { FilterChip } from "@/components/ui/FilterChip";
import { useUndoToast } from "@/components/ui/UndoToast";
import { type BarTone } from "@/components/ui/Bar";
import { Donut } from "@/components/cards/Donut";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataGrid, type Column, type GridActions } from "@/components/cards/DataGrid";
import { DateTile, FiledBar, FilingBand, type DateTone } from "@/components/cards/FilingBand";
import { OnTimeColumns } from "@/components/cards/OnTimeColumns";
import { type StaffPortal } from "./parts";
import { ClientTile } from "./grids";
import { FilterStrip, GroupedGrid, type GridGroup, type StripItem } from "./register-parts";
import { FilingAction, KeyHint, PortalLink, ProofDialog, portalUrl, useListKeys, type Proof } from "./comp-parts";

// Staff Filings (lead, manager and admin are the same file).
// Spectrum (Compliances.dc.html, C-05 to C-07): underline tabs By filing / By client / All filings, four KPI tiles,
// R-10 filter chips, rows grouped by filing with each client under its band and a File now / Open action.
// The rail has C4 (on time vs late), the six regulators and the status donut. "All filings" is the old flat grid.

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fyIndex = (date: Date) => (date.getMonth() + 9) % 12;
const yearOf = (i: number) => (i >= 9 ? 2027 : 2026);
const dm = (date: Date) => `${date.getDate()} ${MONTHS[fyIndex(date)]}`;
const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

type Period = "monthly" | "quarterly" | "annual";
/** Monthly shows two months, as the old "Sep to Oct 2026" head. Quarterly shows three. Annual shows the year. */
const SPAN: Record<Period, number> = { monthly: 2, quarterly: 3, annual: 12 };
const STEP: Record<Period, number> = { monthly: 1, quarterly: 3, annual: 12 };
/** The window that holds today: Sep to Oct. */
const HOME_FROM = 5;
const TODAY_I = fyIndex(FILINGS_TODAY);

type View = "filing" | "client" | "all";
type Tile = "" | "month" | "filed" | "week" | "late";
type StatusPick = "" | "open" | ClientFilingState;

const F_STATUSES: OldFilingStatus[] = ["Filed", "Due soon", "Overdue", "Upcoming"];
const F_TONE: Record<OldFilingStatus, ChipTone> = { Filed: "ok", "Due soon": "warn", Overdue: "bad", Upcoming: "idle" };
const F_BAR: Record<OldFilingStatus, BarTone> = { Filed: "ok", "Due soon": "warn", Overdue: "bad", Upcoming: "idle" };
/** B-06: the same tints as the Obligations bands. */
const F_DATE: Record<OldFilingStatus, DateTone> = { Filed: "ok", "Due soon": "warn", Overdue: "bad", Upcoming: "accent" };

/** Client state words. Chip collapses them to the six (A-06); waiting is teal (R-13). */
const STATE: Record<ClientFilingState, { label: string; tone: ChipTone }> = {
  done: { label: "Filed", tone: "ok" },
  run: { label: "In progress", tone: "prog" },
  wait: { label: "Waiting on client", tone: "teal" },
  soon: { label: "Due soon", tone: "warn" },
  bad: { label: "Overdue", tone: "bad" },
  none: { label: "Upcoming", tone: "idle" },
};
const STATUS_OPTIONS: Array<{ value: StatusPick; label: string }> = [
  { value: "open", label: "Not done" },
  { value: "bad", label: "Overdue" },
  { value: "soon", label: "Due soon" },
  { value: "run", label: "In progress" },
  { value: "wait", label: "Waiting" },
  { value: "none", label: "Not started" },
  { value: "done", label: "Done" },
];
/** R-43 regulator colours for the "By regulator" bars. */
const REG_FILL: Record<Area, string> = { GST: "bg-reg-gst", "Income tax": "bg-reg-it", MCA: "bg-reg-mca", Payroll: "bg-reg-payroll", FEMA: "bg-reg-fema", Labour: "bg-reg-labour" };

const plain = (name: string) => name.replace(/( India)? Pvt Ltd$/, "");
const initials = (name: string) =>
  plain(name)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const clientName = (id: string) => plain(clientById(id)?.name ?? id);

function download(name: string, head: string[], lines: string[][]) {
  const body = lines.map((l) => l.map((v) => `"${v.replaceAll('"', '""')}"`).join(","));
  const url = URL.createObjectURL(new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function FilingsScreen({ portal }: { portal: StaffPortal }) {
  const [period, setPeriod] = React.useState<Period>("monthly");
  const [from, setFrom] = React.useState(HOME_FROM);
  const [view, setView] = React.useState<View>("filing");
  const [area, setArea] = React.useState<"" | Area>("");
  const [status, setStatus] = React.useState<StatusPick>("");
  const [lead, setLead] = React.useState("");
  const [client, setClient] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [tile, setTile] = React.useState<Tile>("");
  const [proof, setProof] = React.useState<Proof | null>(null);
  const toast = useUndoToast();
  const listRef = React.useRef<HTMLElement>(null);
  const searchRef = React.useRef<HTMLSpanElement>(null);
  useListKeys(listRef, searchRef);

  const span = SPAN[period];
  const start = period === "annual" ? 0 : Math.min(from, 12 - span);
  const end = start + span - 1;
  const label = period === "annual" ? "FY 2026-27" : `${MONTHS[start]} to ${MONTHS[end]} ${yearOf(end)}`;
  const short = period === "annual" ? "FY 2026-27" : `${MONTHS[start]}-${MONTHS[end]}`;
  const inWin = (date: Date) => fyIndex(date) >= start && fyIndex(date) <= end;

  const move = (dir: 1 | -1) => setFrom(Math.max(0, Math.min(12 - span, start + dir * STEP[period])));
  const pickPeriod = (p: Period) => {
    setPeriod(p);
    if (p === "quarterly") setFrom(Math.floor(start / 3) * 3);
  };

  /* ---------- Rows ---------- */

  const scope = clientFilingsFor(portal);
  const clients = complianceClients(portal);
  const leads = [...new Set(clients.map((c) => c.lead))].sort();
  const isMonth = (r: ClientFiling) => fyIndex(r.filing.due) === TODAY_I;
  const weekEnd = addDays(FILINGS_TODAY, 7);
  const isWeek = (r: ClientFiling) => r.state !== "done" && r.filing.due >= FILINGS_TODAY && r.filing.due <= weekEnd;
  const tileMatch: Record<Exclude<Tile, "">, (r: ClientFiling) => boolean> = {
    month: isMonth,
    filed: (r) => isMonth(r) && r.state === "done",
    week: isWeek,
    late: (r) => r.state === "bad",
  };
  const q = query.trim().toLowerCase();
  const match = (r: ClientFiling) =>
    (!area || r.filing.area === area) &&
    (!status || (status === "open" ? r.state !== "done" : r.state === status)) &&
    (!lead || leadOfFiling(r) === lead) &&
    (!client || r.client === client) &&
    (!tile || tileMatch[tile](r)) &&
    (!q || r.filing.form.toLowerCase().includes(q) || clientName(r.client).toLowerCase().includes(q));

  const winRows = scope.filter((r) => inWin(r.filing.due));
  const shown = winRows.filter(match);
  const shownIds = new Set(shown.map((r) => r.filing.id));
  // A filing shows when at least one of its clients passes the filters, so the three views agree.
  const winFilings = OLD_FILINGS.filter((f) => inWin(f.due) && winRows.some((r) => r.filing.id === f.id));
  const [filedNow, setFiledNow] = React.useState<Set<string>>(new Set());
  const flat = winFilings.filter((f) => shownIds.has(f.id)).map((f) => (filedNow.has(f.id) ? { ...f, status: "Filed" as const, filedOn: "Today" } : f));
  const many = (n: number) => `${n} ${n === 1 ? "filing" : "filings"}`;
  // E-01: bulk actions on the flat list. Filings have no single owner, so there is no Assign.
  const flatActions: GridActions<OldFiling> = {
    noun: ["filing", "filings"],
    remind: (rows) => ({ text: rows.length === 1 ? `Reminder sent · ${rows[0].form} · ${rows[0].period}` : `Reminders sent · ${many(rows.length)}` }),
    done: (rows) => {
      const open = rows.filter((r) => r.status !== "Filed");
      if (open.length === 0) return { text: rows.length === 1 ? "Already filed" : "These filings are already filed" };
      const before = filedNow;
      setFiledNow(new Set([...filedNow, ...open.map((r) => r.id)]));
      return { text: open.length === 1 ? `Marked filed · ${open[0].form}` : `${many(open.length)} marked filed`, undo: () => setFiledNow(before) };
    },
    export: (rows) => ({ text: `Exported ${many(rows.length)} to filings.csv` }),
  };
  const anyFilter = !!(area || status || lead || client || q || tile);

  /* ---------- KPI tiles (C-06): this month, as of 8 Oct ---------- */

  const month = scope.filter(isMonth);
  const monthDone = month.filter((r) => r.state === "done").length;
  const week = scope.filter(isWeek);
  const late = scope.filter((r) => r.state === "bad");
  const strip: StripItem[] = [
    { key: "month", label: "Due this month", value: month.length, Icon: CalendarDays, tone: "blue", sub: `${plural(new Set(month.map((r) => r.filing.id)).size, "filing")} · ${plural(new Set(month.map((r) => r.client)).size, "client")}` },
    { key: "filed", label: "Filed", value: monthDone, Icon: CircleCheck, tone: "green", valueClass: "text-ok", sub: month.length ? `${Math.round((monthDone / month.length) * 100)}%` : "-" },
    { key: "week", label: "Due in 7 days", value: week.length, Icon: Clock, tone: "amber", valueClass: "text-warn", sub: `by ${DOW[weekEnd.getDay()]} ${dm(weekEnd)}` },
    { key: "late", label: "Overdue", value: late.length, Icon: AlertTriangle, tone: "red", valueClass: "text-bad", sub: late.length ? late.map((r) => `${r.filing.form} · ${initials(clientName(r.client))}`).join(", ") : "None" },
  ];
  const pickTile = (k: string) => {
    setTile(k as Tile);
    // The tiles count this month: bring the window back to it.
    if (k && (start > TODAY_I || end < TODAY_I)) {
      setPeriod("monthly");
      setFrom(HOME_FROM);
    }
  };

  const clearAll = () => {
    setArea("");
    setStatus("");
    setLead("");
    setClient("");
    setQuery("");
    setTile("");
  };

  /* ---------- Row parts ---------- */

  const recordHref = (r: ClientFiling) => (r.ob && itemExists("ob", `${r.client}-${r.ob}`) ? staffObHref(portal, `${r.client}-${r.ob}`) : undefined);
  const openProof = (f: OldFiling, clientId = "", filed?: Date) => setProof({ title: f.form, period: f.period, client: clientId, area: f.area, filed });

  const actionCol: Column<ClientFiling> = {
    key: "action",
    label: "",
    width: 104,
    align: "right",
    className: "hidden md:table-cell",
    render: (r) => {
      const href = recordHref(r);
      const ctx = `${r.filing.form} ${r.filing.period}, ${clientName(r.client)}`;
      if (r.state === "done") return href ? <FilingAction label="Open" href={href} context={ctx} /> : <FilingAction label="Open" onClick={() => openProof(r.filing, r.client, r.filed)} context={ctx} />;
      const urgent = r.state === "bad";
      if (href) return <FilingAction label={r.state === "wait" || r.state === "none" ? "Open" : "File now"} urgent={urgent} href={href} context={ctx} />;
      // No record page (TCS return, ITR-6): file on the government portal.
      return <FilingAction label="File now" urgent={urgent} href={portalUrl(r.filing.area)} external context={ctx} />;
    },
  };
  const statusCol: Column<ClientFiling> = {
    key: "status",
    label: "Status",
    width: 128,
    render: (r) => (
      <Chip tone={STATE[r.state].tone} fixed>
        {STATE[r.state].label}
      </Chip>
    ),
  };
  const noteCol: Column<ClientFiling> = {
    key: "note",
    label: "Note",
    width: 140,
    className: "hidden md:table-cell",
    render: (r) => (r.note ? <span className={cn("block max-w-[130px] truncate", r.state === "bad" ? "font-medium text-bad" : r.state === "soon" ? "text-warn" : "text-ink-2")}>{r.note}</span> : <span className="text-faint">-</span>),
  };

  const filingCols: Column<ClientFiling>[] = [
    {
      key: "client",
      label: "Filing · client",
      render: (r) => {
        const c = clientById(r.client);
        return (
          <span className="flex min-w-0 items-center gap-2.5 md:pl-[56px]">
            {c && <ClientTile c={c} size={26} />}
            <span className="min-w-0 truncate font-medium text-ink">{clientName(r.client)}</span>
          </span>
        );
      },
    },
    {
      key: "lead",
      label: "Lead",
      width: 160,
      className: "hidden md:table-cell",
      render: (r) => {
        const name = leadOfFiling(r);
        return name ? (
          <span className="inline-flex min-w-0 max-w-[150px] items-center gap-2">
            <Avatar name={name} size={24} />
            <span className="min-w-0 truncate">{name}</span>
          </span>
        ) : null;
      },
    },
    noteCol,
    statusCol,
    actionCol,
  ];

  const clientCols: Column<ClientFiling>[] = [
    {
      key: "filing",
      label: "Client · filing",
      render: (r) => (
        <span className="block min-w-0 md:pl-[42px]">
          <b className="block truncate text-14 font-medium text-ink">{r.filing.form}</b>
          <span className="block truncate text-12.5 text-muted">
            {r.filing.period} · due {dm(r.filing.due)}
          </span>
        </span>
      ),
    },
    { key: "area", label: "Area", width: 124, className: "hidden md:table-cell", render: (r) => <AreaPill area={r.filing.area} /> },
    noteCol,
    statusCol,
    actionCol,
  ];

  const byFiling: GridGroup<ClientFiling>[] = winFilings.map((f) => {
    const all = winRows.filter((r) => r.filing.id === f.id);
    return {
      id: f.id,
      label: f.form,
      dot: "",
      rows: shown.filter((r) => r.filing.id === f.id),
      head: <FilingBand day={f.due.getDate()} month={MONTHS[fyIndex(f.due)]} tone={F_DATE[f.status]} name={f.form} sub={`${f.period} · due ${dm(f.due)}`} area={f.area} filed={all.filter((r) => r.state === "done").length} total={all.length} />,
    };
  });
  const byClient: GridGroup<ClientFiling>[] = clients.map((c) => {
    const all = winRows.filter((r) => r.client === c.id);
    return {
      id: c.id,
      label: plain(c.name),
      dot: "",
      rows: shown.filter((r) => r.client === c.id),
      head: (
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3.5 gap-y-2">
          <ClientTile c={c} size={30} />
          <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
            <span className="truncate text-14.5 font-medium text-ink">{plain(c.name)}</span>
            <span className="text-12.5 text-muted">Lead {c.lead}</span>
          </span>
          <FiledBar filed={all.filter((r) => r.state === "done").length} total={all.length} />
        </span>
      ),
    };
  });

  const flatCols: Column<OldFiling>[] = [
    { key: "due", label: "Due", width: 68, render: (f) => <DateTile day={f.due.getDate()} month={MONTHS[fyIndex(f.due)]} tone={F_DATE[f.status]} /> },
    { key: "area", label: "Area", width: 124, render: (f) => <AreaPill area={f.area} /> },
    {
      key: "filing",
      label: "Filing",
      render: (f) => (
        <span className="block min-w-0">
          <span className="flex min-w-0 items-center gap-1">
            <b className="truncate text-14 font-medium text-ink">{f.form}</b>
            <PortalLink area={f.area} />
          </span>
          <span className="block truncate text-12.5 text-muted">
            {f.period} · {f.frequency}
          </span>
        </span>
      ),
    },
    { key: "filed", label: "Filed on", width: 112, render: (f) => <span className={f.status === "Overdue" ? "font-medium text-bad" : f.status === "Filed" ? "text-ink" : "text-muted"}>{f.filedOn}</span> },
    {
      key: "status",
      label: "Status",
      width: 128,
      render: (f) => (
        <Chip tone={F_TONE[f.status]} fixed>
          {f.status}
        </Chip>
      ),
    },
    {
      key: "proof",
      label: "Proof",
      width: 124,
      align: "right",
      render: (f) =>
        f.proof === "file" ? (
          <span className="inline-flex items-center gap-1.5">
            <Button size="sm" variant="soft" onClick={() => openProof(f)}>
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

  const exportCsv = () => {
    if (view === "all") return download("filings.csv", ["Due", "Area", "Filing", "Period", "Frequency", "Filed on", "Status"], flat.map((f) => [dm(f.due), f.area, f.form, f.period, f.frequency, f.filedOn, f.status]));
    download("filings-by-client.csv", ["Due", "Area", "Filing", "Period", "Client", "Lead", "Note", "Status"], shown.map((r) => [dm(r.filing.due), r.filing.area, r.filing.form, r.filing.period, clientName(r.client), leadOfFiling(r), r.note, STATE[r.state].label]));
  };

  /* ---------- Rail ---------- */

  const onTime = ANALYTICS[portal].filings.slice(-5);
  const onTimePct = Math.round((onTime.reduce((a, m) => a + m.onTime, 0) / Math.max(1, onTime.reduce((a, m) => a + m.onTime + m.late, 0))) * 100);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      {/* Plain page head (R-02): 28 px title, muted meta, the period controls on the right. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-[1_1_240px]">
          <h1 className="text-28 font-medium leading-9 tracking-[-0.01em]">{label}</h1>
          <p className="text-13.5 text-muted">
            FY 2026-27 · {plural(winFilings.length, "filing")} · {plural(new Set(winRows.map((r) => r.client)).size, "client")}
          </p>
        </div>
        <span className="inline-flex gap-1.5">
          <Button size="icon" variant="outline" onClick={() => move(-1)} disabled={period === "annual" || start === 0} aria-label="Previous period">
            <ChevronLeft size={16} strokeWidth={1.6} />
          </Button>
          <Button size="icon" variant="outline" onClick={() => move(1)} disabled={period === "annual" || end === 11} aria-label="Next period">
            <ChevronRight size={16} strokeWidth={1.6} />
          </Button>
        </span>
        <Tabs
          size="md"
          items={[
            { key: "monthly", label: "Monthly" },
            { key: "quarterly", label: "Quarterly" },
            { key: "annual", label: "Annual" },
          ]}
          value={period}
          onChange={(k) => pickPeriod(k as Period)}
        />
        <Button variant="outline" onClick={() => pickPeriod("annual")} disabled={period === "annual"}>
          Full year
        </Button>
        <Button variant="outline" onClick={exportCsv}>
          <Download size={16} strokeWidth={1.6} /> Export
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/${portal}/compliances/calendar`}>
            <Calendar size={16} strokeWidth={1.6} /> Calendar
          </Link>
        </Button>
      </div>

      <Tabs
        variant="underline"
        items={[
          { key: "filing", label: "By filing", count: byFiling.filter((g) => g.rows.length).length },
          { key: "client", label: "By client", count: byClient.filter((g) => g.rows.length).length },
          { key: "all", label: "All filings", count: flat.length },
        ]}
        value={view}
        onChange={(k) => setView(k as View)}
      />

      <FilterStrip items={strip} value={tile} onChange={pickTile} />

      {/* Board rail is narrower than the default 360 px, so the grouped grid keeps its five columns at 1440. */}
      <Cols className="lg:grid-cols-[minmax(0,1fr)_300px]">
        <Col className="gap-3.5">
          {/* R-10 filter chips. Set chips are soft blurple with an ×; unset chips are dashed "+ Label". */}
          <div className="flex flex-wrap items-center gap-2">
            <span ref={searchRef} className="relative w-full sm:w-[260px]">
              <Search size={16} strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search filings or clients" aria-label="Search filings or clients" className="h-9 pl-9" />
            </span>
            <FilterChip label="Regulator" value={area} onChange={(v) => setArea(v as "" | Area)} options={FILING_REGULATORS.map((a) => ({ value: a, label: a }))} />
            <FilterChip label="Status" value={status} onChange={(v) => setStatus(v as StatusPick)} options={STATUS_OPTIONS} />
            {portal !== "lead" && <FilterChip label="Lead" value={lead} onChange={setLead} options={leads.map((l) => ({ value: l, label: l }))} />}
            <FilterChip label="Client" value={client} onChange={setClient} options={clients.map((c) => ({ value: c.id, label: c.short }))} />
            {anyFilter && (
              <Button size="sm" variant="outline" onClick={clearAll}>
                Clear all
              </Button>
            )}
          </div>

          <section ref={listRef} className="min-w-0">
            {view === "all" ? (
              <DataGrid title="Filings" meta={`${label} · ${flat.length} filings`} icon={{ Icon: Calendar, tone: "teal" }} columns={flatCols} rows={flat} rowKey={(f) => f.id} pageSize={20} empty="No filings match" selectable actions={flatActions} notify={toast.show} />
            ) : (
              <GroupedGrid
                title={view === "filing" ? "Filings" : "Clients"}
                columns={view === "filing" ? filingCols : clientCols}
                groups={view === "filing" ? byFiling : byClient}
                phoneFit
                rowKey={(r) => r.key}
                rowHref={recordHref}
                pageSize={60}
                empty="No filings match"
                footer={
                  <span className="ml-auto flex items-center gap-3">
                    <KeyHint />
                  </span>
                }
              />
            )}
          </section>
        </Col>

        <Col>
          <SectionCard title="On time vs late" meta={`${onTimePct}% on time`} icon={{ Icon: CircleCheck, tone: "green" }}>
            <OnTimeColumns data={onTime.map((m) => ({ label: m.m, onTime: m.onTime, late: m.late }))} />
          </SectionCard>
          <SectionCard title="By regulator" meta={short}>
            <div className="grid gap-1">
              {FILING_REGULATORS.map((a) => {
                const list = winRows.filter((r) => r.filing.area === a);
                const filed = list.filter((r) => r.state === "done").length;
                const pct = list.length ? Math.round((filed / list.length) * 100) : 0;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setArea(area === a ? "" : a)}
                    aria-pressed={area === a}
                    aria-label={`${a}: ${filed} of ${list.length} filed. Filter by ${a}`}
                    className={cn("-mx-1.5 flex items-center gap-2.5 rounded-sm px-1.5 py-1 text-left hover:bg-hover", area === a && "bg-accent-soft")}
                  >
                    <i className={cn("h-2 w-2 flex-none rounded-[2px]", REG_FILL[a])} aria-hidden />
                    <span className="flex-1 text-13.5 text-ink">{a}</span>
                    <span className={cn("text-13 tabular-nums", list.length ? "text-muted" : "text-faint")}>
                      {filed} / {list.length}
                    </span>
                    <span className="relative h-1.5 w-[90px] flex-none overflow-hidden rounded-bar bg-raised" aria-hidden>
                      <i className={cn("absolute inset-y-0 left-0 rounded-bar", REG_FILL[a])} style={{ width: `${pct}%` }} />
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>
          <SectionCard title="Filings by status" meta={short}>
            <Donut
              size={84}
              className="w-full [&>div:last-child]:flex-1"
              total={
                <span className="grid place-items-center leading-none">
                  {winFilings.length}
                  <small className="mt-0.5 text-11.5 font-normal text-muted">filings</small>
                </span>
              }
              segments={F_STATUSES.map((s) => ({ label: s, value: winFilings.filter((f) => f.status === s).length, tone: F_BAR[s] }))}
            />
          </SectionCard>
        </Col>
      </Cols>

      <ProofDialog proof={proof} onOpenChange={(v) => !v && setProof(null)} />
      {toast.node}
    </div>
  );
}
