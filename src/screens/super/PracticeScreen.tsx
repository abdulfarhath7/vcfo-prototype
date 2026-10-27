"use client";
import * as React from "react";
import { AlertTriangle, Award, Building2, CalendarCheck, CheckCircle2, ChevronRight, Clock, FileCheck2, User } from "lucide-react";
import { TODAY, fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Bar, barFill } from "@/components/ui/Bar";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { PhaseBar } from "@/components/ui/PhaseBar";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { NumberStrip, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { StackedBar, type Segment } from "@/components/cards/StackedBar";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { FIRM_CLIENTS, HEALTH_TONE, INC_STAGES, MANAGERS, REGS, REG_DONE, WORK, WORK_TONE, clientById, pipeLabel, type Area, type FirmClient, type Work, type WorkStatus } from "@/data/super";
import { AVG_DAYS_TO_COI, EXPECTED_COI, INC_PIPELINE, PHASE_NAMES, PHASE_TOTALS, REG_CELL, STAGE_DAYS, codeOf, phasesOf, statuteRows, type RegCode, type StageDays } from "@/data/super-firm";
import { ClientName, clientHref, opts } from "./parts";

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
    { key: "due", label: "Due", width: 76, render: (w) => <span className={cn("whitespace-nowrap", (w.status === "Overdue" || w.status === "Stuck") && "font-semibold text-bad")}>{fmt(w.due)}</span> },
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
      { label: "With client", value: n("With client"), Icon: User, tone: "amber" },
      { label: "Stuck", value: n("Stuck") + n("Overdue"), Icon: AlertTriangle, tone: "red", bad: n("Stuck") + n("Overdue") > 0 },
      { label: "Days to COI · average", value: AVG_DAYS_TO_COI, of: "/ 30", Icon: Award, tone: "green" },
    ];
  if (area === "Registrations")
    return [
      { label: "Open registrations", value: rows.length, Icon: FileCheck2, tone: "violet" },
      { label: "With client", value: n("With client"), Icon: User, tone: "amber" },
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
      { label: "With client", value: n("With client"), tone: "violet" },
      { label: "Overdue", value: n("Overdue"), tone: "bad" },
    ];
  return [
    { label: "Filed", value: n("Filed"), tone: "ok" },
    { label: "In progress", value: n("In progress"), tone: "accent" },
    { label: "With client", value: n("With client"), tone: "violet" },
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
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {INC_PIPELINE.map((p, i) => {
          const list = inc.filter((c) => c.pipe === p.key);
          return (
            <li key={p.key} className="relative min-w-0 rounded-md border border-line px-3 py-3">
              <div className="flex items-baseline gap-2">
                <b className="text-[20px] font-semibold leading-none">{list.length}</b>
                <span className="truncate text-12.5 font-semibold text-muted">{p.label}</span>
              </div>
              <ul className="mt-2.5 grid gap-1.5">
                {list.length === 0 && <li className="text-12.5 text-faint">None</li>}
                {list.map((c) => (
                  <li key={c.id}>
                    <ClientName client={{ name: c.short, tone: c.tone }} href={clientHref(c.id)} className="text-13" />
                  </li>
                ))}
              </ul>
              {i < INC_PIPELINE.length - 1 && <ChevronRight size={16} strokeWidth={1.5} className="absolute -right-[13px] top-1/2 hidden -translate-y-1/2 text-faint xl:block" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}

const stageDayCols: Column<StageDays>[] = [
  { key: "stage", label: "Stage", render: (r) => <span className="font-semibold">{r.stage}</span> },
  { key: "target", label: "Target", align: "right", width: 84, render: (r) => `${r.target} days` },
  { key: "avg", label: "Average", align: "right", width: 90, render: (r) => <span className={cn("font-semibold", r.avg > r.target ? "text-bad" : "text-ok")}>{r.avg} days</span> },
  { key: "slowest", label: "Slowest now", render: (r) => <span className="whitespace-nowrap">{r.slowest}</span> },
];

function ExpectedCoi() {
  const list = FIRM_CLIENTS.filter((c) => EXPECTED_COI[c.id]).sort((a, b) => EXPECTED_COI[a.id].getTime() - EXPECTED_COI[b.id].getTime());
  return (
    <SectionCard title="Expected certificates" meta={String(list.length)} flush icon={{ Icon: Award, tone: "green" }}>
      {list.map((c: FirmClient) => (
        <ListRow key={c.id} href={clientHref(c.id)} className="flex-wrap sm:flex-nowrap">
          <span className="min-w-0 flex-1">
            <ClientName client={c} sub={`${codeOf(c)} · ${c.step} · ${c.manager}`} />
          </span>
          <PhaseBar done={phasesOf(c)} totals={PHASE_TOTALS} names={PHASE_NAMES} className="hidden w-24 sm:flex" />
          <b className="w-12 flex-none text-right text-13 font-semibold">{fmt(EXPECTED_COI[c.id])}</b>
          <Chip fixed tone={HEALTH_TONE[c.health]}>
            {c.health}
          </Chip>
        </ListRow>
      ))}
    </SectionCard>
  );
}

/* ---------- Registrations matrix ---------- */

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
    { key: "client", label: "Client", render: (r) => <ClientName client={r.c} sub={r.c.manager} className="max-w-[200px]" /> },
    ...REGS.map((t, i): Column<MatrixRow> => {
      const done = FIRM_CLIENTS.filter((c) => c.reg[i] === "d").length;
      const need = FIRM_CLIENTS.filter((c) => /[dpw]/.test(c.reg[i])).length;
      return {
        key: t,
        align: "center",
        width: 72,
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
            <span title={`${t} · ${cell.label}`} aria-label={`${t}: ${cell.label}`} className={cn("mx-auto grid h-6 w-6 place-items-center rounded-sm text-12 font-semibold", cell.cls)}>
              {cell.mark}
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
          {view}
          <Select aria-label="Manager" value={manager} onChange={(e) => setManager(e.target.value)} options={opts("All managers", managerNames)} />
          <Select
            aria-label="Clients shown"
            value={show}
            onChange={(e) => setShow(e.target.value)}
            options={[
              { value: "all", label: "All clients" },
              { value: "open", label: "Only with open work" },
            ]}
          />
        </>
      }
      footer={
        <span className="hidden flex-wrap items-center gap-x-3 gap-y-1 sm:flex">
          {(["d", "p", "w", "n", "x"] as RegCode[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={cn("grid h-4 w-4 place-items-center rounded-[3px] text-[10px] font-semibold", REG_CELL[k].cls, k === "x" && "shadow-[inset_0_0_0_1px_var(--line)]")}>{REG_CELL[k].mark}</span>
              {REG_CELL[k].label}
            </span>
          ))}
        </span>
      }
    />
  );
}

/* ---------- Compliances calendar ---------- */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WORST: WorkStatus[] = ["Overdue", "Stuck", "With client", "Due soon", "In progress", "Upcoming", "Filed"];
const STATUS_BAR: Record<WorkStatus, keyof typeof barFill> = {
  Overdue: "bad",
  Stuck: "bad",
  "With client": "warn",
  "Due soon": "warn",
  "In progress": "accent",
  Upcoming: "idle",
  Filed: "ok",
  "Not started": "idle",
};
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function gridDays(year: number, month: number) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: Math.ceil((lead + count) / 7) * 7 }, (_, i) => new Date(year, month, 1 - lead + i));
}

function groupByClient(list: Work[]) {
  const map = new Map<string, Work[]>();
  for (const w of list) map.set(w.clientId, [...(map.get(w.clientId) ?? []), w]);
  return [...map.entries()].map(([clientId, items]) => ({ clientId, items, status: WORST.find((s) => items.some((x) => x.status === s)) ?? "Upcoming" }));
}

function MonthCalendar({ rows, picked, onPick, view }: { rows: Work[]; picked: Date; onPick: (d: Date) => void; view: React.ReactNode }) {
  const year = 2026;
  const month = 9;
  return (
    <SectionCard title="October 2026 · filings by day" flush right={view}>
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div key={w} className="border-b border-l border-line-soft px-1.5 py-1.5 text-11.5 font-semibold text-faint first:border-l-0 md:px-2.5">
            {w}
          </div>
        ))}
        {gridDays(year, month).map((day, i) => {
          const inMonth = day.getMonth() === month;
          const today = sameDay(day, TODAY);
          const on = sameDay(day, picked);
          const groups = inMonth ? groupByClient(rows.filter((w) => sameDay(w.due, day))) : [];
          return (
            <button
              type="button"
              key={day.getTime()}
              disabled={!inMonth}
              onClick={() => onPick(day)}
              aria-pressed={on}
              aria-label={`${fmt(day)}: ${groups.reduce((a, g) => a + g.items.length, 0)} filings`}
              className={cn(
                "min-h-[60px] min-w-0 border-b border-line-soft p-1 text-left align-top md:min-h-[88px] md:p-1.5",
                i % 7 !== 0 && "border-l",
                !inMonth && "bg-raised",
                inMonth && "hover:bg-raised",
                on && "!bg-accent-soft",
              )}
            >
              <span className={cn("inline-grid h-6 min-w-6 place-items-center rounded-sm px-1 text-12 font-semibold", today ? "bg-btn text-white" : inMonth ? "text-ink-2" : "text-faint")} aria-current={today ? "date" : undefined}>
                {day.getDate()}
              </span>
              {groups.length > 0 && (
                <>
                  <span className="mt-1 hidden gap-1 md:grid">
                    {groups.slice(0, 3).map((g) => {
                      const c = clientById(g.clientId);
                      return (
                        <Tag key={g.clientId} tone={WORK_TONE[g.status]} className="flex w-full min-w-0 gap-1.5">
                          {c && <i className={cn("h-1.5 w-1.5 flex-none rounded-full", barFill[c.tone])} aria-hidden />}
                          <span className="min-w-0 flex-1 truncate">{c?.short}</span>
                          {g.items.length > 1 && <span className="flex-none">{g.items.length}</span>}
                        </Tag>
                      );
                    })}
                    {groups.length > 3 && <span className="px-1 text-11.5 font-semibold text-muted">+{groups.length - 3} more</span>}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-0.5 md:hidden" aria-hidden>
                    {groups.map((g) => (
                      <i key={g.clientId} className={cn("h-1.5 w-1.5 rounded-full", barFill[STATUS_BAR[g.status]])} />
                    ))}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-soft px-4 py-2.5 text-12.5 text-ink-2 md:px-5">
        {(["Filed", "In progress", "Due soon", "Overdue", "Upcoming"] as WorkStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <i className={cn("h-[7px] w-[7px] rounded-[2px]", barFill[STATUS_BAR[s]])} aria-hidden />
            {s === "Due soon" ? "Due in 7 days" : s}
          </span>
        ))}
      </div>
    </SectionCard>
  );
}

function DayList({ rows, day }: { rows: Work[]; day: Date }) {
  const list = rows.filter((w) => sameDay(w.due, day)).sort((a, b) => WORST.indexOf(a.status) - WORST.indexOf(b.status));
  return (
    <SectionCard title={`${sameDay(day, TODAY) ? "Today, " : ""}${fmt(day)}`} meta={String(list.length)} flush icon={{ Icon: CalendarCheck, tone: "teal" }}>
      {list.length === 0 ? (
        <Empty>No filings</Empty>
      ) : (
        list.map((w) => {
          const c = clientById(w.clientId)!;
          return (
            <ListRow key={w.id} href={clientHref(c.id)}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{w.item}</span>
                <span className="flex min-w-0 items-center gap-1.5 truncate text-12.5 text-muted">
                  <i className={cn("h-1.5 w-1.5 flex-none rounded-full", barFill[c.tone])} aria-hidden />
                  {c.short} · {c.manager}
                </span>
              </span>
              <Chip tone={WORK_TONE[w.status]}>{w.status}</Chip>
            </ListRow>
          );
        })
      )}
    </SectionCard>
  );
}

type StatRow = ReturnType<typeof statuteRows>[number];

const statCols: Column<StatRow>[] = [
  { key: "statute", label: "Statute", render: (r) => <span className="font-semibold">{r.statute}</span> },
  { key: "total", label: "Filings", align: "right", width: 80 },
  { key: "filed", label: "Filed", align: "right", width: 80 },
  { key: "overdue", label: "Overdue", align: "right", width: 84, render: (r) => <span className={cn(r.overdue && "font-semibold text-bad")}>{r.overdue}</span> },
  { key: "left", label: "Still to file", align: "right", width: 100 },
  {
    key: "pct",
    label: "On-time rate",
    width: 150,
    render: (r) => (
      <span className="flex items-center gap-2">
        <Bar pct={r.pct} tone={r.pct >= 90 ? "ok" : r.pct >= 75 ? "warn" : "bad"} className="w-16" />
        <span className="text-12.5 text-muted">{r.pct}%</span>
      </span>
    ),
  },
];

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
  Compliances: [
    { key: "calendar", label: "Calendar" },
    { key: "items", label: "Filings" },
    { key: "statute", label: "By statute" },
  ],
};

export function PracticeScreen({ area }: { area: Area }) {
  const all = WORK[area];
  const [view, setView] = React.useState(VIEWS[area][0].key);
  const [manager, setManager] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [day, setDay] = React.useState<Date>(() => {
    const overdue = all.filter((w) => w.status === "Overdue" && w.due.getMonth() === 9);
    return overdue.length ? overdue[overdue.length - 1].due : TODAY;
  });
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
          {viewTabs}
          <Select aria-label="Manager" value={manager} onChange={(e) => setManager(e.target.value)} options={opts("All managers", managerNames)} />
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={opts("All statuses", statuses)} />
        </>
      }
    />
  );

  let main: React.ReactNode = itemsGrid;
  if (area === "Incorporation" && view === "pipeline")
    main = (
      <>
        <div className="flex justify-end">{viewTabs}</div>
        <IncPipeline />
        <DataGrid title="Days in each stage · this year" columns={stageDayCols} rows={STAGE_DAYS} rowKey={(r) => r.stage} icon={{ Icon: Clock, tone: "violet" }} />
      </>
    );
  if (area === "Registrations" && view === "matrix") main = <RegMatrix view={viewTabs} />;
  if (area === "Compliances" && view === "calendar") main = <MonthCalendar rows={all} picked={day} onPick={setDay} view={viewTabs} />;
  if (area === "Compliances" && view === "statute")
    main = <DataGrid title="By statute · October" columns={statCols} rows={statuteRows()} rowKey={(r) => r.statute} filters={viewTabs} />;

  return (
    <div className="grid grid-cols-1 gap-5">
      <section className="overflow-hidden rounded-lg border border-line bg-surface" aria-label="Summary">
        <NumberStrip items={stats(area, all)} />
      </section>
      <Cols>
        <Col>{main}</Col>
        <Col>
          {area === "Compliances" && view === "calendar" && <DayList rows={all} day={day} />}
          {area === "Incorporation" && <ExpectedCoi />}
          <SectionCard title={area === "Compliances" ? "Filings by status" : area === "Registrations" ? "Registrations by status" : "Clients by stage"}>
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
