"use client";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Award, Building2, CalendarCheck, Check, CheckCircle2, ChevronRight, Clock, FileCheck2, User } from "lucide-react";
import { fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { PhaseBar } from "@/components/ui/PhaseBar";
import { Tabs } from "@/components/ui/Tabs";
import { NumberStrip, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { StackedBar, type Segment } from "@/components/cards/StackedBar";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { FIRM_CLIENTS, HEALTH_TONE, HEALTH_WORD, INC_STAGES, MANAGERS, REGS, REG_DONE, WORK, WORK_TONE, clientById, pipeLabel, type Area, type FirmClient, type Work, type WorkStatus } from "@/data/super";
import { AVG_DAYS_TO_COI, EXPECTED_COI, INC_PIPELINE, PHASE_NAMES, PHASE_TOTALS, REG_CELL, STAGE_DAYS, phasesOf, type RegCode, type StageDays } from "@/data/super-firm";
import { ClientName, ClientTile, FilterChips, clientHref } from "./parts";
import { PracticeCalendar } from "./PracticeCalendar";

// Practice areas. Ported from reference/old-patch/super/Incorporation, Registrations and Compliances .dc.html
// plus the work-item grids of the first build. Views switch in the card head (R-11).

const ITEM_LABEL: Record<Area, string> = { Incorporation: "Step", Registrations: "Registration", Compliances: "Form" };

function columns(area: Area): Column<Work>[] {
  return [
    {
      key: "client",
      label: "Client",
      render: (w) => {
        const c = clientById(w.clientId)!;
        return <ClientName client={c} sub={c.manager} className="max-w-[240px]" />;
      },
    },
    { key: "item", label: ITEM_LABEL[area], render: (w) => <span className="block max-w-[280px] truncate">{w.item}</span> },
    ...(area === "Compliances" ? [{ key: "group", label: "Statute", className: "whitespace-nowrap" } as Column<Work>] : []),
    { key: "owner", label: "With", width: 112, render: (w) => <OwnerChip owner={w.owner} /> },
    { key: "due", label: "Due", width: 76, render: (w) => <span className={cn("whitespace-nowrap", (w.status === "Overdue" || w.status === "Stuck") && "font-medium text-bad")}>{fmt(w.due)}</span> },
    { key: "days", label: area === "Compliances" ? "Days open" : "Days in step", align: "right", width: 104, render: (w) => (w.days === null ? <span className="text-faint">–</span> : w.days) },
    { key: "status", label: "Status", width: 124, render: (w) => <Chip fixed tone={WORK_TONE[w.status]}>{w.status}</Chip> },
  ];
}

function stats(area: Area, rows: Work[]): StatItem[] {
  const n = (s: WorkStatus) => rows.filter((w) => w.status === s).length;
  const clients = new Set(rows.map((w) => w.clientId)).size;
  if (area === "Incorporation")
    return [
      { label: "Clients", value: clients, Icon: Building2, tone: "blue" },
      { label: "Waiting on client", value: n("With client"), Icon: User, tone: "amber" },
      { label: "Stuck", value: n("Stuck") + n("Overdue"), Icon: AlertTriangle, tone: "red", bad: n("Stuck") + n("Overdue") > 0 },
      { label: "Days to COI · average", value: AVG_DAYS_TO_COI, of: "/ 30", Icon: Award, tone: "green" },
    ];
  if (area === "Registrations")
    return [
      { label: "Open registrations", value: rows.length, Icon: FileCheck2, tone: "violet" },
      { label: "Waiting on client", value: n("With client"), Icon: User, tone: "amber" },
      { label: "Overdue", value: n("Overdue"), Icon: AlertTriangle, tone: "red", bad: n("Overdue") > 0 },
      { label: "Done to date", value: REG_DONE, Icon: CheckCircle2, tone: "green" },
    ];
  const due = rows.filter((w) => w.status !== "Filed" && w.status !== "Overdue").length;
  return [
    { label: "Filings in October", value: rows.length, Icon: CalendarCheck, tone: "teal" },
    { label: "Filed", value: n("Filed"), Icon: CheckCircle2, tone: "green" },
    { label: "Overdue", value: n("Overdue"), Icon: AlertTriangle, tone: "red", bad: n("Overdue") > 0 },
    { label: "Still to file", value: due, Icon: Clock, tone: "blue" },
  ];
}

function stages(area: Area, rows: Work[]): Segment[] {
  if (area === "Incorporation") {
    const tones = ["violet", "accent", "teal", "ok"] as const;
    return INC_STAGES.map((p, i) => ({ label: pipeLabel(p), value: rows.filter((w) => w.group === pipeLabel(p)).length, tone: tones[i] }));
  }
  const n = (s: WorkStatus) => rows.filter((w) => w.status === s).length;
  if (area === "Registrations")
    return [
      { label: "In progress", value: n("In progress"), tone: "accent" },
      { label: "Due in 7 days", value: n("Due soon"), tone: "warn" },
      { label: "Waiting on client", value: n("With client"), tone: "teal" },
      { label: "Overdue", value: n("Overdue"), tone: "bad" },
    ];
  return [
    { label: "Filed", value: n("Filed"), tone: "ok" },
    { label: "In progress", value: n("In progress"), tone: "accent" },
    { label: "Waiting on client", value: n("With client"), tone: "teal" },
    { label: "Due in 7 days", value: n("Due soon"), tone: "warn" },
    { label: "Overdue", value: n("Overdue"), tone: "bad" },
    { label: "Upcoming", value: n("Upcoming"), tone: "idle" },
  ];
}

const managerNames = MANAGERS.map((m) => m.name).filter((m) => FIRM_CLIENTS.some((c) => c.manager === m));

/* ---------- Incorporation ---------- */

function IncPipeline() {
  const inc = FIRM_CLIENTS.filter((c) => c.stage === "incorporating");
  return (
    <SectionCard title="Incorporation pipeline" meta={String(inc.length)}>
      <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {INC_PIPELINE.map((p, i) => {
          const list = inc.filter((c) => c.pipe === p.key);
          return (
            <li key={p.key} className="relative min-h-[150px] min-w-0 rounded-md border-1.5 border-line px-4 py-3.5">
              <span className="block truncate text-13 font-medium text-ink-2">{p.label}</span>
              <b className="mt-1.5 block text-26 font-medium leading-none">{list.length}</b>
              <ul className="mt-3 grid gap-2">
                {list.map((c) => (
                  <li key={c.id}>
                    <Link href={clientHref(c.id)} className="flex min-w-0 items-center gap-2 text-13 hover:underline">
                      <ClientTile client={c} className="h-[22px] w-[22px] text-[9.5px]" />
                      <span className="truncate">{c.name.replace(/( India)? Pvt Ltd$/, "")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {i < INC_PIPELINE.length - 1 && <ChevronRight size={16} strokeWidth={1.6} className="absolute -right-[19px] top-1/2 hidden -translate-y-1/2 text-faint xl:block" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}

const stageDayCols: Column<StageDays>[] = [
  { key: "stage", label: "Stage", render: (r) => <span className="font-medium">{r.stage}</span> },
  { key: "target", label: "Target", align: "right", width: 84, render: (r) => `${r.target} days` },
  { key: "avg", label: "Average", align: "right", width: 90, render: (r) => <span className={cn("font-medium", r.avg > r.target ? "text-bad" : "text-ok")}>{r.avg} days</span> },
  { key: "slowest", label: "Slowest now", render: (r) => <span className="whitespace-nowrap">{r.slowest}</span> },
];

function ExpectedCoi() {
  const list = FIRM_CLIENTS.filter((c) => EXPECTED_COI[c.id]).sort((a, b) => EXPECTED_COI[a.id].getTime() - EXPECTED_COI[b.id].getTime());
  return (
    <SectionCard title="Expected certificates" flush>
      {list.map((c: FirmClient) => (
        <ListRow key={c.id} href={clientHref(c.id)}>
          <ClientTile client={c} />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{c.name.replace(/( India)? Pvt Ltd$/, "")}</span>
            <span className="line-clamp-2 text-12 text-muted">
              {c.code} {c.step} · {c.manager}
            </span>
          </span>
          <PhaseBar done={phasesOf(c)} totals={PHASE_TOTALS} names={PHASE_NAMES} className="hidden w-24 flex-none sm:flex" />
          <b className="w-14 flex-none text-right text-13 font-medium">{fmt(EXPECTED_COI[c.id])}</b>
          <Chip fixed tone={HEALTH_TONE[c.health]} className="hidden flex-none sm:inline-flex">
            {HEALTH_WORD[c.health]}
          </Chip>
        </ListRow>
      ))}
    </SectionCard>
  );
}

/* ---------- Registrations matrix ---------- */

// Soft cells in status colours (R-13: no white text on solid colour). Pending on documents is waiting: teal.
const CELL: Record<RegCode, string> = {
  d: "bg-ok-soft text-ok",
  p: "bg-accent-soft text-accent",
  w: "bg-teal-soft text-teal",
  n: "text-faint",
  x: "border-1.5 border-dashed border-line",
};
const MARK: Record<RegCode, React.ReactNode> = {
  d: <Check size={14} strokeWidth={2} />,
  p: <i className="h-[7px] w-[7px] rounded-[2px] bg-accent-mid" />,
  w: <i className="h-[7px] w-[7px] rounded-[2px] bg-teal-mid" />,
  n: "–",
  x: null,
};

interface MatrixRow {
  c: FirmClient;
}

function RegMatrix({ view }: { view: React.ReactNode }) {
  const [manager, setManager] = React.useState("");
  const [show, setShow] = React.useState("all");
  const rows: MatrixRow[] = FIRM_CLIENTS.filter((c) => (!manager || c.manager === manager) && (show === "all" || /[pw]/.test(c.reg)))
    .sort((a, b) => (a.stage === b.stage ? a.name.localeCompare(b.name) : a.stage === "compliance" ? -1 : 1))
    .map((c) => ({ c }));
  let p = 0;
  let w = 0;
  FIRM_CLIENTS.forEach((c) => c.reg.split("").forEach((v) => (v === "p" ? p++ : v === "w" ? w++ : 0)));

  const cols: Column<MatrixRow>[] = [
    {
      key: "client",
      label: "Client",
      width: 220,
      render: (r) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <ClientTile client={r.c} />
          <span className="min-w-0">
            <span className="block truncate font-medium">{r.c.name.replace(/( India)? Pvt Ltd$/, "")}</span>
            <span className="block truncate text-12 text-muted">{r.c.manager}</span>
          </span>
        </span>
      ),
    },
    ...REGS.map((t, i): Column<MatrixRow> => {
      const done = FIRM_CLIENTS.filter((c) => c.reg[i] === "d").length;
      const need = FIRM_CLIENTS.filter((c) => /[dpw]/.test(c.reg[i])).length;
      return {
        key: t,
        align: "center",
        width: 104,
        label: (
          <span className="block leading-tight" title={`${t}: ${done} done of ${need} needed`}>
            {t}
            <span className="block text-11.5 font-medium opacity-70">
              {done}/{need}
            </span>
          </span>
        ),
        render: (r) => {
          const code = (r.c.reg[i] ?? "n") as RegCode;
          const cell = REG_CELL[code];
          return (
            <span title={`${t} · ${cell.label}`} aria-label={`${t}: ${cell.label}`} className={cn("grid h-6 w-full min-w-[44px] place-items-center rounded-sm text-12 font-medium", CELL[code])}>
              {MARK[code]}
            </span>
          );
        },
      };
    }),
  ];

  return (
    <DataGrid
      title="Registrations · clients by type"
      meta={`${p} in progress · ${w} pending on documents`}
      columns={cols}
      rows={rows}
      rowKey={(r) => r.c.id}
      rowHref={(r) => clientHref(r.c.id)}
      pageSize={17}
      filters={
        <>
          <FilterChips
            filters={[
              { key: "manager", label: "Manager", value: manager, options: managerNames, onChange: setManager },
              { key: "show", label: "Clients", value: show === "open" ? "With open work" : "", options: ["With open work"], onChange: (v) => setShow(v ? "open" : "all") },
            ]}
          />
          {view}
        </>
      }
      footer={
        <span className="hidden flex-wrap items-center gap-x-3 gap-y-1 sm:flex">
          {(["d", "p", "w", "n", "x"] as RegCode[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={cn("grid h-3 w-3 place-items-center rounded-[3px] text-11", CELL[k])} aria-hidden>
                {k === "n" ? "–" : null}
              </span>
              {REG_CELL[k].label}
            </span>
          ))}
        </span>
      }
    />
  );
}

/* ---------- Screen ---------- */

const VIEWS: Record<Area, Array<{ key: string; label: string }>> = {
  Incorporation: [
    { key: "pipeline", label: "Pipeline" },
    { key: "items", label: "Work items" },
  ],
  Registrations: [
    { key: "matrix", label: "Matrix" },
    { key: "items", label: "Work items" },
  ],
  Compliances: [{ key: "calendar", label: "Calendar" }],
};

export function PracticeScreen({ area }: { area: Area }) {
  const all = WORK[area];
  const [view, setView] = React.useState(VIEWS[area][0].key);
  const [manager, setManager] = React.useState("");
  const [status, setStatus] = React.useState("");
  const statuses = Array.from(new Set(all.map((w) => w.status)));
  const rows = all.filter((w) => (!manager || clientById(w.clientId)?.manager === manager) && (!status || w.status === status));

  const stuck: AttentionRow[] = all
    .filter((w) => w.status === "Stuck" || w.status === "Overdue")
    .map((w) => {
      const c = clientById(w.clientId)!;
      return { id: w.id, date: w.due, title: c.name, sub: `${w.item} · ${c.lead}`, chip: { label: w.status, tone: WORK_TONE[w.status] }, href: clientHref(c.id) };
    });

  const title = area === "Incorporation" ? "Clients in incorporation" : area === "Registrations" ? "Open registrations" : "Filings · October";
  const viewTabs = <Tabs items={VIEWS[area]} value={view} onChange={setView} />;

  const itemsGrid = (
    <DataGrid
      title={title}
      columns={columns(area)}
      rows={rows}
      rowKey={(w) => w.id}
      rowHref={(w) => clientHref(w.clientId)}
      rowLate={(w) => w.status === "Overdue"}
      filters={
        <>
          <FilterChips
            filters={[
              { key: "manager", label: "Manager", value: manager, options: managerNames, onChange: setManager },
              { key: "status", label: "Status", value: status, options: statuses, onChange: setStatus },
            ]}
          />
          {viewTabs}
        </>
      }
    />
  );

  let main: React.ReactNode = itemsGrid;
  if (area === "Registrations" && view === "matrix") main = <RegMatrix view={viewTabs} />;
  // Old CompCal.dc.html: the client-style calendar fills the page. Its toolbar ends with "Filings", which opens the filings list.
  if (area === "Compliances") return <PracticeCalendar />;

  // Old Incorporation.dc.html: the pipeline across the page, then days in each stage beside the expected certificates.
  if (area === "Incorporation")
    return (
      <div className="grid grid-cols-1 gap-5">
        <IncPipeline />
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <DataGrid title="Days in each stage · this year" columns={stageDayCols} rows={STAGE_DAYS} rowKey={(r) => r.stage} icon={{ Icon: Clock, tone: "violet" }} />
          <ExpectedCoi />
        </div>
      </div>
    );

  // Old Registrations.dc.html: the matrix alone, full page width.
  if (area === "Registrations" && view === "matrix") return main;

  return (
    <div className="grid grid-cols-1 gap-5">
      <NumberStrip items={stats(area, all)} />
      <Cols>
        <Col>{main}</Col>
        <Col>
          <SectionCard title="Registrations by status">
            <StackedBar total={all.length} segments={stages(area, all)} />
          </SectionCard>
          <SectionCard title="Stuck" meta={String(stuck.length)} flush>
            {stuck.length ? <AttentionList rows={stuck} /> : <Empty />}
          </SectionCard>
        </Col>
      </Cols>
    </div>
  );
}
