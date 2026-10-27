"use client";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Building2, CalendarDays, CheckCheck, Clock, IdCard, ListChecks, Rocket, ShieldCheck, User, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt, relative } from "@/lib/dates";
import { clientById, clientsFor, PHASE_TOTALS, type StaffClient } from "@/data/staff-clients";
import { INBOX, queueFor, tasksFor, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { MANAGERS, managerRows, UNASSIGNED } from "@/data/staff-team";
import { APPROVALS } from "@/data/staff-tasks";
import { DAY_SHORT, TODOS, WEEK, isToday, sameDay, type Todo } from "@/data/staff-work";
import {
  DAYS_TO_COI,
  DONE_TODAY,
  FILING_COLS,
  HEAT_COLS,
  PHASE_LABELS,
  WEEK_TODAY,
  filingCounts,
  filingRow,
  phaseCells,
  practiceNumbers,
  waitingOnClient,
  weekItems,
  type FilingCell,
  type WeekKind,
} from "@/data/staff-today";
import { Row } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Bar, barFill, type BarTone } from "@/components/ui/Bar";
import { Input, Checkbox } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectOnNavy } from "@/components/ui/Select";
import { NumberStrip, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, ListRow, HeadLink, Empty } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { StackedBar } from "@/components/cards/StackedBar";
import { WeekStrip, type WeekStripDay } from "@/components/cards/WeekStrip";
import { ClientDot, ClientName, TaskChip, base, clientHref, taskHref, type StaffPortal } from "./parts";

// Today cards for the staff portals. Ported from reference/old-screens/s/lead/Main.dc.html (lead and manager),
// TodayPhone.dc.html, reference/old-patch/admin/Main.dc.html and reference/old-patch/shared/Practice.dc.html.

export type Scope = "all" | "incorporating" | "compliance";
export type Notify = (text: string, onUndo?: () => void) => void;

export const inScope = (scope: Scope, clientId?: string) => {
  if (scope === "all" || !clientId) return true;
  return clientById(clientId)?.stage === scope;
};

/** Old greeting scope switch (All, Incorporating, Compliance), on the navy band. */
export function ScopeSelect({ portal, value, onChange }: { portal: StaffPortal; value: Scope; onChange: (s: Scope) => void }) {
  const cl = clientsFor(portal);
  const inc = cl.filter((c) => c.stage === "incorporating").length;
  return (
    <SelectOnNavy
      aria-label="Client scope"
      value={value}
      onChange={(e) => onChange(e.target.value as Scope)}
      options={[
        { value: "all", label: `All clients · ${cl.length}` },
        { value: "incorporating", label: `Incorporating · ${inc}` },
        { value: "compliance", label: `Compliance · ${cl.length - inc}` },
      ]}
    />
  );
}

/** Greeting numbers. Lead and manager: Action, Overdue, Waiting, This week, Done today (Main.dc.html). Admin: the firm (admin Main). */
export function todayStats(portal: StaffPortal, scope: Scope): StatItem[] {
  const b = base(portal);
  if (portal === "admin") {
    const cl = clientsFor(portal).filter((c) => inScope(scope, c.id));
    const open = tasksFor(portal).filter((t) => t.status !== "Done" && inScope(scope, t.client));
    return [
      { label: "Clients", value: cl.length, Icon: Building2, tone: "blue", href: `${b}/clients` },
      { label: "Incorporating", value: cl.filter((c) => c.stage === "incorporating").length, Icon: Rocket, tone: "violet", href: `${b}/clients` },
      { label: "In compliance", value: cl.filter((c) => c.stage === "compliance").length, Icon: ShieldCheck, tone: "green", href: `${b}/clients` },
      { label: "Overdue", value: open.filter((t) => t.status === "Overdue").length, Icon: AlertTriangle, tone: "red", bad: true, href: `${b}/work` },
      { label: "Stuck", value: cl.filter((c) => c.health === "Stuck").length, Icon: Clock, tone: "amber", bad: true, href: `${b}/clients` },
      { label: "Due this week", value: open.filter((t) => t.status === "Due this week").length, Icon: CalendarDays, tone: "teal", href: `${b}/work` },
    ];
  }
  const queue = queueFor(portal).filter((t) => inScope(scope, t.client));
  const team = tasksFor(portal).filter((t) => t.status !== "Done" && inScope(scope, t.client));
  const late = team.filter((t) => t.status === "Overdue").length + filingCounts(clientsFor(portal).filter((c) => inScope(scope, c.id))).overdue;
  const week = weekItems(portal).filter((w) => w.kind !== "done" && inScope(scope, w.client)).length;
  return [
    { label: "Action", value: queue.length, Icon: ListChecks, tone: "blue", href: `${b}/work` },
    { label: "Overdue", value: late, Icon: AlertTriangle, tone: "red", bad: late > 0, href: `${b}/work` },
    { label: "Waiting", value: team.filter((t) => t.status === "With client").length, Icon: User, tone: "amber", href: `${b}/work` },
    { label: "This week", value: week, Icon: CalendarDays, tone: "teal", href: `${b}/work` },
    { label: "Done today", value: DONE_TODAY[portal], Icon: CheckCheck, tone: "green" },
  ];
}

/** Practice strip (Practice.dc.html slim): incorporating, registrations pending, filings overdue. */
export function PracticeStrip({ portal }: { portal: StaffPortal }) {
  const p = practiceNumbers(portal);
  const b = base(portal);
  return (
    <section className="overflow-hidden rounded-lg border border-line" aria-label="Practice areas">
      <NumberStrip
        className="xl:grid-cols-3"
        items={[
          { label: "Incorporating", value: p.inc, Icon: Rocket, tone: "violet", href: `${b}/clients` },
          { label: "Registrations pending", value: p.regOpen, Icon: IdCard, tone: "violet", href: `${b}/registrations` },
          { label: "Filings overdue", value: p.filings.overdue, Icon: ShieldCheck, tone: "red", bad: p.filings.overdue > 0, href: `${b}/compliances/filings` },
        ]}
      />
    </section>
  );
}

/** Practice areas (Practice.dc.html full, admin): incorporation stages, registrations, compliances. Counts only (R-37). */
export function PracticeAreas({ portal }: { portal: StaffPortal }) {
  const p = practiceNumbers(portal);
  const b = base(portal);
  const max = Math.max(1, ...p.stages.map((s) => s.n));
  const regMax = Math.max(1, ...p.pendingByReg.map((r) => r.n));
  return (
    <Row cols={3}>
      <SectionCard title="Incorporation" meta={String(p.inc)} icon={{ Icon: Rocket, tone: "violet" }} right={<HeadLink href={`${b}/clients`}>Clients ›</HeadLink>}>
        <ul className="grid gap-2.5">
          {p.stages.map((s) => (
            <li key={s.label} className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)_24px] items-center gap-3 text-12.5">
              <span className="truncate text-ink-2">{s.label}</span>
              <Bar pct={(s.n / max) * 100} tone="violet" />
              <b className="text-right font-semibold">{s.n}</b>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-line-soft pt-3 text-12.5 text-muted">
          Average <b className="font-semibold text-ink">{p.avgCoi} days</b> to COI · target 30
        </p>
      </SectionCard>
      <SectionCard title="Registrations" meta={String(p.regOpen)} right={<HeadLink href={`${b}/registrations`}>Registrations ›</HeadLink>}>
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: p.regDone, label: "Granted" },
            { n: p.regOpen - p.regWait, label: "In progress" },
            { n: p.regWait, label: "With client" },
          ].map((x) => (
            <div key={x.label} className="rounded-md bg-raised px-3 py-2">
              <b className="block text-22 font-semibold leading-tight">{x.n}</b>
              <span className="text-12 text-muted">{x.label}</span>
            </div>
          ))}
        </div>
        <ul className="mt-3 grid gap-2">
          {p.pendingByReg.slice(0, 3).map((r) => (
            <li key={r.name} className="grid grid-cols-[72px_minmax(0,1fr)_24px] items-center gap-3 text-12.5">
              <span className="text-ink-2">{r.name}</span>
              <Bar pct={(r.n / regMax) * 100} tone="warn" />
              <b className="text-right font-semibold">{r.n}</b>
            </li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Compliances · October" right={<HeadLink href={`${b}/compliances/filings`}>Filings ›</HeadLink>}>
        <StackedBar
          total={p.filings.filed + p.filings.due + p.filings.overdue + p.filings.upcoming}
          title="Filings"
          segments={[
            { label: "Filed", value: p.filings.filed, tone: "ok" },
            { label: "Due soon", value: p.filings.due, tone: "warn" },
            { label: "Overdue", value: p.filings.overdue, tone: "bad" },
            { label: "Upcoming", value: p.filings.upcoming, tone: "idle" },
          ]}
        />
      </SectionCard>
    </Row>
  );
}

const heatCell: Record<(typeof HEAT_COLS)[number]["tone"], string> = {
  bad: "bg-bad-mid text-white",
  warn: "bg-warn-mid text-white",
  accent: "bg-accent text-white",
  idle: "bg-idle-soft text-idle",
  faint: "bg-raised text-ink-2 border border-line",
};

interface HeatRow {
  client: StaffClient;
  tasks: StaffTask[];
}

/** Action queue: a clients × status heatmap (Main.dc.html) or the e-Filing list. Click a count to list its tasks. */
export function ActionQueue({ portal, scope }: { portal: StaffPortal; scope: Scope }) {
  const [view, setView] = React.useState<"map" | "list">("map");
  const [pick, setPick] = React.useState<string | null>(null);
  const all = queueFor(portal).filter((t) => inScope(scope, t.client));
  const rows: HeatRow[] = [...new Set(all.map((t) => t.client))]
    .map((id) => ({ client: clientById(id)!, tasks: all.filter((t) => t.client === id) }))
    .filter((r) => r.client)
    .sort((a, b) => b.tasks.filter((t) => t.status === "Overdue").length - a.tasks.filter((t) => t.status === "Overdue").length);
  const picked = pick ? all.filter((t) => `${t.client}|${t.status}` === pick) : [];
  const pickedCol = pick ? HEAT_COLS.find((h) => h.status === pick.split("|")[1]) : undefined;
  const stuck = clientsFor(portal).filter((c) => c.health === "Stuck" && inScope(scope, c.id));

  const mapCols: Column<HeatRow>[] = [
    { key: "client", label: "Client", render: (r) => <ClientName id={r.client.id} href={clientHref(portal, r.client.id)} /> },
    ...HEAT_COLS.map(
      (h): Column<HeatRow> => ({
        key: h.key,
        label: h.label,
        width: 96,
        align: "center",
        render: (r) => {
          const n = r.tasks.filter((t) => t.status === h.status).length;
          const key = `${r.client.id}|${h.status}`;
          if (!n) return <span className="mx-auto block h-[28px] w-[56px] rounded-sm bg-raised" aria-hidden />;
          return (
            <button
              type="button"
              onClick={() => setPick(pick === key ? null : key)}
              aria-pressed={pick === key}
              aria-label={`${r.client.short} · ${h.label} · ${n}`}
              title={r.tasks
                .filter((t) => t.status === h.status)
                .map((t) => `${t.code ?? ""} ${t.title}`.trim())
                .join("\n")}
              className={cn("mx-auto grid h-[28px] w-[56px] place-items-center rounded-sm text-13 font-bold", heatCell[h.tone], pick === key && "ring-2 ring-navy ring-offset-1 ring-offset-surface")}
            >
              {n}
            </button>
          );
        },
      }),
    ),
    { key: "total", label: "Total", width: 70, align: "right", render: (r) => <b className="font-semibold">{r.tasks.length}</b> },
  ];

  const listCols: Column<StaffTask>[] = [
    { key: "client", label: "Client", width: 170, render: (t) => <ClientName id={t.client} short /> },
    { key: "title", label: "Task", render: (t) => <span className="font-semibold">{t.title}</span> },
    { key: "code", label: "Step", width: 90, render: (t) => t.code ?? "" },
    { key: "owner", label: "Owner", width: 120 },
    { key: "due", label: "Due", width: 80, render: (t) => <span className={t.due < TODAY ? "font-semibold text-bad" : undefined}>{fmt(t.due)}</span> },
    { key: "status", label: "Status", width: 130, render: (t) => <TaskChip status={t.status} /> },
  ];

  const head = (
    <>
      {stuck.length > 0 && (
        <Link href={clientHref(portal, stuck[0].id)} className="hidden items-center gap-1.5 rounded-sm bg-bad-soft px-2 py-0.5 text-12 font-semibold text-bad hover:underline md:inline-flex">
          {stuck.length} stuck · {stuck[0].short}
        </Link>
      )}
      <Tabs
        items={[
          { key: "map", label: "By client" },
          { key: "list", label: "List" },
        ]}
        value={view}
        onChange={(k) => setView(k as "map" | "list")}
      />
      <HeadLink href={`${base(portal)}/work`}>Work ›</HeadLink>
    </>
  );

  if (view === "list") return <DataGrid title="Action queue" meta={`${all.length} open`} columns={listCols} rows={all} rowKey={(t) => t.id} rowHref={(t) => taskHref(portal, t)} pageSize={8} filters={head} />;

  return (
    <div className="grid gap-0 overflow-hidden rounded-lg border border-line bg-surface">
      <DataGrid inset title="Action queue" meta={`${all.length} open`} columns={mapCols} rows={rows} rowKey={(r) => r.client.id} pageSize={8} filters={head} />
      {pick && pickedCol && (
        <div className="border-t border-line">
          <div className="flex items-center gap-2 px-4 py-2.5 md:px-5">
            <b className="text-13.5 font-semibold">
              {pickedCol.label} · {clientById(pick.split("|")[0])?.short}
            </b>
            <Chip tone="idle" dot={false}>
              {picked.length}
            </Chip>
            <Button variant="ghost" size="iconSm" className="ml-auto" aria-label="Close the task list" onClick={() => setPick(null)}>
              <X size={16} strokeWidth={1.5} />
            </Button>
          </div>
          {picked.map((t) => (
            <ListRow key={t.id} className="flex-wrap md:flex-nowrap">
              <span className="w-[64px] flex-none font-mono text-12 text-muted">{t.code ?? "To-do"}</span>
              <span className="min-w-0 flex-1">
                <b className="block truncate font-semibold">{t.title}</b>
                <span className="block truncate text-12.5 text-muted">
                  {clientById(t.client)?.short} · {t.owner} · due {fmt(t.due)}
                </span>
              </span>
              <TaskChip status={t.status} />
              <Button size="sm" variant="outline" asChild>
                <Link href={taskHref(portal, t)}>{t.status === "With client" ? "Send reminder" : t.step ? "Open step" : "Open"}</Link>
              </Button>
            </ListRow>
          ))}
        </div>
      )}
    </div>
  );
}

const weekTone: Record<WeekKind, BarTone> = { filing: "bad", step: "navy", reminder: "warn", done: "ok" };

/** This week: seven day boxes, then the picked day's agenda (Main.dc.html week strip, TodayPhone.dc.html). */
export function ThisWeek({ portal, scope }: { portal: StaffPortal; scope: Scope }) {
  const [day, setDay] = React.useState(WEEK_TODAY);
  const items = weekItems(portal).filter((w) => inScope(scope, w.client));
  const hasCmp = items.some((w) => w.kind === "filing");
  const days: WeekStripDay[] = WEEK.map((w) => ({
    key: String(w.getTime()),
    dow: DAY_SHORT[w.getDay()],
    day: String(w.getDate()),
    today: isToday(w),
    items: items
      .filter((x) => sameDay(x.day, w))
      .map((x) => ({ id: x.id, text: `${x.text} · ${clientById(x.client)?.short ?? ""}`, tone: weekTone[x.kind], strong: x.kind === "filing" })),
  }));
  const agenda = day >= 0 ? items.filter((x) => sameDay(x.day, WEEK[day])) : items.filter((x) => x.kind !== "done");
  const open = items.filter((x) => x.kind !== "done").length;
  return (
    <SectionCard title="This week" meta={`${fmt(WEEK[0])} to ${fmt(WEEK[6])} · ${open} open`}>
      <WeekStrip
        days={days}
        value={day}
        onChange={setDay}
        legend={[
          ...(hasCmp ? [{ label: "Statutory filing", tone: "bad" as const }] : []),
          { label: "Step deadline", tone: "navy" },
          { label: "Reminder due", tone: "warn" },
          { label: "Done", tone: "ok" },
        ]}
      />
      <div className="-mx-4 mt-3 border-t border-line-soft md:-mx-5">
        <div className="flex items-center gap-2 px-4 pt-3 text-12.5 font-semibold text-muted md:px-5">
          {day >= 0 ? (isToday(WEEK[day]) ? `Today · ${fmt(WEEK[day])}` : `${DAY_SHORT[WEEK[day].getDay()]} ${fmt(WEEK[day])}`) : "Whole week"}
          {day >= 0 && (
            <button type="button" className="ml-auto text-12.5 font-semibold text-accent hover:underline" onClick={() => setDay(-1)}>
              Whole week
            </button>
          )}
        </div>
        {agenda.length === 0 ? (
          <Empty />
        ) : (
          <ul className="mt-1">
            {agenda.slice(0, 8).map((x) => {
              const c = clientById(x.client);
              return (
                <li key={x.id} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13 first:border-t-0 md:px-5">
                  <i className={cn("h-2 w-2 flex-none rounded-[2px]", barFill[weekTone[x.kind]])} aria-hidden />
                  <span className={cn("min-w-0 flex-1 truncate", x.kind === "filing" && "font-semibold text-bad", x.kind === "done" && "text-muted line-through")}>{x.text}</span>
                  {c && (
                    <span className="hidden flex-none items-center gap-1.5 text-12.5 text-muted md:flex">
                      <ClientDot tone={c.tone} />
                      {c.short}
                    </span>
                  )}
                  {day < 0 && <span className="w-[52px] flex-none text-right text-12 text-muted">{DAY_SHORT[x.day.getDay()]} {x.day.getDate()}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}

const phaseCellClass = {
  done: "bg-ok-mid text-white",
  current: "bg-accent text-white",
  stuck: "bg-bad-mid text-white",
  next: "border border-dashed border-line text-faint",
} as const;

/** Phase progress: one row per incorporating client, a cell per phase, days to COI (Main.dc.html, admin Main). */
export function PhaseProgress({ portal, scope }: { portal: StaffPortal; scope: Scope }) {
  const rows = clientsFor(portal)
    .filter((c) => c.stage === "incorporating" && inScope(scope, c.id))
    .sort((a, b) => (DAYS_TO_COI[a.id] ?? 99) - (DAYS_TO_COI[b.id] ?? 99));
  const cols: Column<StaffClient>[] = [
    { key: "name", label: "Client", render: (c) => <ClientName id={c.id} /> },
    ...PHASE_LABELS.map(
      (label, i): Column<StaffClient> => ({
        key: `p${i}`,
        label,
        width: 120,
        align: "center",
        render: (c) => {
          const cell = phaseCells(c)[i];
          return (
            <span title={`${label} · ${cell.done} of ${cell.total}${cell.kind === "stuck" ? " · stuck" : ""}`} className={cn("mx-auto grid h-[26px] w-[84px] place-items-center rounded-sm text-12 font-semibold", phaseCellClass[cell.kind])}>
              {cell.kind === "done" ? "✓" : `${cell.done}/${PHASE_TOTALS[i]}`}
            </span>
          );
        },
      }),
    ),
    {
      key: "coi",
      label: "Days to COI",
      width: 100,
      align: "right",
      render: (c) => {
        const n = DAYS_TO_COI[c.id];
        return <span className={cn("font-semibold", n !== undefined && n < 10 && "text-bad")}>{n !== undefined ? `${n} days` : ""}</span>;
      },
    },
    ...(portal === "admin" ? [{ key: "manager", label: "Manager", width: 110 } as Column<StaffClient>] : []),
  ];
  return (
    <DataGrid
      title="Phase progress"
      meta={`${rows.length} incorporating`}
      columns={cols}
      rows={rows}
      rowKey={(c) => c.id}
      rowHref={(c) => clientHref(portal, c.id)}
      footer={
        <span className="hidden flex-wrap items-center gap-3 md:flex">
          {(["done", "current", "stuck", "next"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <i className={cn("h-2.5 w-2.5 rounded-[3px]", phaseCellClass[k])} aria-hidden />
              {{ done: "Done", current: "Current", stuck: "Stuck", next: "Next" }[k]}
            </span>
          ))}
        </span>
      }
    />
  );
}

const filingCellClass: Record<FilingCell["kind"], string> = {
  filed: "bg-ok-mid text-white",
  due: "bg-warn-mid text-white",
  overdue: "bg-bad-mid text-white",
  upcoming: "bg-raised text-muted",
  na: "border border-dashed border-line-soft",
};
const filingLabel: Record<FilingCell["kind"], string> = { filed: "Filed", due: "Due soon", overdue: "Overdue", upcoming: "Upcoming", na: "Not applicable" };

/** Clients × filings · October (Main.dc.html filing grid). Only clients with a filing due or overdue show. */
export function ClientsFilings({ portal, scope }: { portal: StaffPortal; scope: Scope }) {
  const [onlyOpen, setOnlyOpen] = React.useState("open");
  const rows = clientsFor(portal)
    .filter((c) => c.stage === "compliance" && inScope(scope, c.id))
    .map((c) => ({ c, cells: filingRow(c) }))
    .filter((r) => onlyOpen === "all" || r.cells.some((x) => x.kind === "due" || x.kind === "overdue"));
  const cols: Column<(typeof rows)[number]>[] = [
    { key: "client", label: "Client", render: (r) => <ClientName id={r.c.id} short href={clientHref(portal, r.c.id)} /> },
    ...FILING_COLS.map(
      (f, i): Column<(typeof rows)[number]> => ({
        key: f,
        label: f.replace(" challan", "").replace("Professional tax", "PT").replace(" KYC", ""),
        width: 64,
        align: "center",
        render: (r) => {
          const x = r.cells[i];
          return (
            <span title={`${r.c.short} · ${f} · ${filingLabel[x.kind]}${x.due ? ` · ${fmt(x.due)}` : ""}`} className={cn("mx-auto grid h-[24px] w-[40px] place-items-center rounded-sm text-12 font-bold", filingCellClass[x.kind])}>
              {x.kind === "filed" ? "✓" : x.kind === "overdue" ? "!" : x.kind === "due" && x.due ? x.due.getDate() : ""}
            </span>
          );
        },
      }),
    ),
  ];
  return (
    <DataGrid
      title="Clients × filings · October"
      meta={String(rows.length)}
      columns={cols}
      rows={rows}
      rowKey={(r) => r.c.id}
      filters={
        <Tabs
          items={[
            { key: "open", label: "Due or late" },
            { key: "all", label: "All" },
          ]}
          value={onlyOpen}
          onChange={setOnlyOpen}
        />
      }
      footer={
        <span className="hidden flex-wrap items-center gap-3 md:flex">
          {(["filed", "due", "overdue", "upcoming", "na"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <i className={cn("h-2.5 w-2.5 rounded-[3px]", filingCellClass[k])} aria-hidden />
              {filingLabel[k]}
            </span>
          ))}
        </span>
      }
    />
  );
}

/** Compliance health (TodayPhone.dc.html, Main.dc.html donut). R-25: a stacked bar, not a donut, outside Calendar and Filings. */
export function ComplianceHealth({ portal, scope }: { portal: StaffPortal; scope: Scope }) {
  const cl = clientsFor(portal).filter((c) => inScope(scope, c.id));
  const n = filingCounts(cl);
  const total = n.filed + n.due + n.overdue + n.upcoming;
  if (!total) return null;
  return (
    <SectionCard title="Compliance health" meta="October" right={<HeadLink href={`${base(portal)}/compliances/filings`}>Filings ›</HeadLink>}>
      <StackedBar
        total={total}
        title={`Filings across ${cl.filter((c) => c.stage === "compliance").length} clients`}
        segments={[
          { label: "Filed", value: n.filed, tone: "ok" },
          { label: "Due soon", value: n.due, tone: "warn" },
          { label: "Overdue", value: n.overdue, tone: "bad" },
          { label: "Upcoming", value: n.upcoming, tone: "idle" },
        ]}
      />
    </SectionCard>
  );
}

/** Inbox: Triage and My to-dos in one card (Main.dc.html cards 12 and 13). */
export function InboxCard({ portal, scope, notify }: { portal: StaffPortal; scope: Scope; notify: Notify }) {
  const [tab, setTab] = React.useState("triage");
  const [gone, setGone] = React.useState<Set<string>>(new Set());
  const [todos, setTodos] = React.useState<Todo[]>(TODOS[portal]);
  const [show, setShow] = React.useState("open");
  const [text, setText] = React.useState("");
  const tri = INBOX[portal].filter((r) => !gone.has(r.id) && inScope(scope, r.client));
  const mine = todos.filter((t) => inScope(scope, t.client));
  const shown = mine.filter((t) => show === "all" || (show === "done" ? t.done : !t.done));
  const hide = (id: string, msg: string) => {
    setGone(new Set([...gone, id]));
    notify(msg, () => setGone((g) => new Set([...g].filter((x) => x !== id))));
  };
  const add = (t: Todo) => setTodos((list) => [t, ...list]);
  const fromQueue = () => {
    const q = queueFor(portal).find((t) => !todos.some((x) => x.text === t.title));
    if (q) {
      add({ id: `q${q.id}`, text: q.title, client: q.client, pinned: true, due: q.due });
      notify(`Pinned from the action queue · ${q.title}`);
    }
  };
  return (
    <SectionCard
      title="Inbox"
      flush
      right={
        <Tabs
          items={[
            { key: "triage", label: "Triage", count: tri.length },
            { key: "todos", label: "My to-dos", count: mine.filter((t) => !t.done).length },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      {tab === "triage" && (
        <>
          {tri.length === 0 && <Empty />}
          {tri.map((r) => {
            const c = clientById(r.client);
            return (
              <div key={r.id} className="border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
                <div className="flex items-start gap-2.5">
                  {c && <ClientDot tone={c.tone} className="mt-1.5" />}
                  <Link href={clientHref(portal, r.client)} className={cn("min-w-0 flex-1 text-13.5 hover:underline", r.unread && "font-semibold")}>
                    {r.text}
                  </Link>
                  <span className="flex-none font-mono text-12 text-muted">{r.time}</span>
                </div>
                <div className="mt-0.5 pl-[18px] text-12.5 text-muted">
                  {c?.short} · {r.from}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 pl-[18px]">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      add({ id: `tri-${r.id}`, text: r.text, client: r.client, due: TODAY });
                      hide(r.id, "Added to My to-dos");
                    }}
                  >
                    Make task
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => hide(r.id, "Marked done")}>
                    Done
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => hide(r.id, "Snoozed to tomorrow")}>
                    Snooze
                  </Button>
                </div>
              </div>
            );
          })}
        </>
      )}
      {tab === "todos" && (
        <>
          <div className="flex items-center gap-2 px-4 pt-3 md:px-5">
            <Tabs
              items={[
                { key: "open", label: "Open" },
                { key: "done", label: "Done" },
                { key: "all", label: "All" },
              ]}
              value={show}
              onChange={setShow}
            />
          </div>
          <ul className="mt-2">
            {shown.length === 0 && <Empty />}
            {shown.map((t) => {
              const c = t.client ? clientById(t.client) : undefined;
              return (
                <li key={t.id} className="flex items-center gap-2.5 border-t border-line-soft px-4 py-2.5 text-13 first:border-t-0 md:px-5">
                  <Checkbox checked={!!t.done} label={t.text} onChange={(v) => setTodos((list) => list.map((x) => (x.id === t.id ? { ...x, done: v } : x)))} />
                  {c && <ClientDot tone={c.tone} />}
                  <span className={cn("min-w-0 flex-1 truncate", t.done && "text-muted line-through")}>{t.text}</span>
                  {t.done && <Chip tone="ok">Done</Chip>}
                  {t.pinned && !t.done && <Tag tone="prog">Pinned</Tag>}
                  <button
                    type="button"
                    className="grid h-7 w-7 flex-none place-items-center rounded-sm text-muted hover:bg-raised hover:text-ink"
                    aria-label={`Remove ${t.text}`}
                    title="Remove"
                    onClick={() => {
                      const before = todos;
                      setTodos(todos.filter((x) => x.id !== t.id));
                      notify("To-do removed", () => setTodos(before));
                    }}
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </li>
              );
            })}
          </ul>
          <form
            className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              add({ id: `n${Date.now()}`, text: text.trim() });
              setText("");
            }}
          >
            <label htmlFor={`nt-${portal}`} className="sr-only">
              New to-do
            </label>
            <Input id={`nt-${portal}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="New to-do" className="h-[30px] min-w-0 flex-1 text-13" />
            <Button size="sm" variant="outline" onClick={fromQueue}>
              From queue
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={!text.trim()}>
              Add
            </Button>
          </form>
        </>
      )}
    </SectionCard>
  );
}

/** Waiting on client: what the client owes, with a reminder (Main.dc.html rail; K-17 "Remind"). */
export function WaitingOnClient({ portal, scope, notify }: { portal: StaffPortal; scope: Scope; notify: Notify }) {
  const [sent, setSent] = React.useState<Set<string>>(new Set());
  const rows = waitingOnClient(portal).filter((t) => inScope(scope, t.client));
  return (
    <SectionCard title="Waiting on client" meta={String(rows.length)} flush>
      {rows.length === 0 && <Empty />}
      {rows.map((t) => {
        const c = clientById(t.client);
        return (
          <ListRow key={t.id}>
            {c && <ClientDot tone={c.tone} />}
            <span className="min-w-0 flex-1">
              <Link href={taskHref(portal, t)} className="block truncate font-semibold hover:underline">
                {t.title}
              </Link>
              <span className="block truncate text-12.5 text-muted">
                {c?.short}
                {t.code ? ` · ${t.code}` : ""} · {t.days}d waiting
              </span>
            </span>
            {sent.has(t.id) ? (
              <Chip tone="ok">Sent</Chip>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSent(new Set([...sent, t.id]));
                  notify(`Reminder sent to ${c?.short ?? "the client"} · ${t.title}`);
                }}
              >
                Remind
              </Button>
            )}
          </ListRow>
        );
      })}
    </SectionCard>
  );
}

const STATUS_ORDER: Array<{ s: TaskStatus; label: string; tone: BarTone }> = [
  { s: "Overdue", label: "Overdue", tone: "bad" },
  { s: "Due this week", label: "Due this week", tone: "warn" },
  { s: "In progress", label: "In progress", tone: "accent" },
  { s: "With client", label: "Waiting on client", tone: "teal" },
  { s: "Not started", label: "Not started", tone: "idle" },
  { s: "Done", label: "Done", tone: "ok" },
];

/** Task status (mgr Main.dc.html "Task status" donut). R-25: a stacked bar here. Plus open tasks by project lead. */
export function TaskStatusCard({ portal, scope, title = "Task status", tasks }: { portal: StaffPortal; scope: Scope; title?: string; tasks?: StaffTask[] }) {
  const all = (tasks ?? tasksFor(portal)).filter((t) => inScope(scope, t.client));
  const open = all.filter((t) => t.status !== "Done");
  const owners = [...new Set(open.map((t) => t.owner))].map((o) => ({ o, n: open.filter((t) => t.owner === o).length })).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...owners.map((x) => x.n));
  return (
    <SectionCard title={title}>
      <StackedBar total={all.length} title="Tasks" segments={STATUS_ORDER.map((x) => ({ label: x.label, value: all.filter((t) => t.status === x.s).length, tone: x.tone }))} />
      {portal !== "lead" && owners.length > 1 && (
        <div className="mt-4 border-t border-line-soft pt-3">
          <h3 className="mb-2 text-12 font-semibold text-muted">Open tasks by project lead</h3>
          <ul className="grid gap-2">
            {owners.map((x) => (
              <li key={x.o} className="grid grid-cols-[minmax(0,110px)_minmax(0,1fr)_24px] items-center gap-3 text-12.5">
                <span className="truncate text-ink-2">{x.o}</span>
                <Bar pct={(x.n / max) * 100} tone="navy" />
                <b className="text-right font-mono text-12">{x.n}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

/** Assign a client to a manager (reference/old-screens/s/admin/assign.js). */
export function AssignClientDialog({ open, onOpenChange, clientName, onAssign }: { open: boolean; onOpenChange: (v: boolean) => void; clientName: string; onAssign: (manager: string) => void }) {
  const [mgr, setMgr] = React.useState("");
  const stats = managerRows();
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Assign a client to a manager"
      sub={<span>{clientName}</span>}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!mgr}
            onClick={() => {
              onAssign(mgr);
              onOpenChange(false);
            }}
          >
            Assign
          </Button>
        </>
      }
    >
      <div role="radiogroup" aria-label="Manager" className="grid gap-2">
        {MANAGERS.map((m) => {
          const s = stats.find((x) => x.name === m.name);
          const on = mgr === m.name;
          return (
            <label key={m.name} className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5", on ? "border-navy bg-raised" : "border-line hover:bg-raised")}>
              <input type="radio" name="assign-mgr" value={m.name} checked={on} onChange={() => setMgr(m.name)} className="accent-[var(--navy)]" />
              <span className="min-w-0">
                <b className="block text-13.5 font-semibold">{m.name}</b>
                <span className="block text-12.5 text-muted">
                  {s?.clients ?? 0} clients · {s?.open ?? 0} open · {s?.overdue ?? 0} late
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </Modal>
  );
}

/** Needs your decision (admin Main.dc.html): new clients without a manager, then escalations from managers. */
export function DecisionsCard({ portal, notify }: { portal: StaffPortal; notify: Notify }) {
  const [assigned, setAssigned] = React.useState<Record<string, string>>({});
  const [decided, setDecided] = React.useState<Set<string>>(new Set());
  const [dlg, setDlg] = React.useState<string | null>(null);
  const fresh = UNASSIGNED.filter((u) => !assigned[u.id]);
  const esc = APPROVALS.admin.filter((a) => !decided.has(a.id));
  const cur = UNASSIGNED.find((u) => u.id === dlg);
  return (
    <SectionCard title="Needs your decision" meta={String(fresh.length + esc.length)} flush>
      {fresh.length + esc.length === 0 && <Empty />}
      {fresh.map((u) => (
        <ListRow key={u.id}>
          <span className="min-w-0 flex-1">
            <b className="block truncate font-semibold">{u.name} has no manager</b>
            <span className="block truncate text-12.5 text-muted">
              {u.service} · {u.won}
            </span>
          </span>
          <Button size="sm" variant="outline" onClick={() => setDlg(u.id)}>
            Assign
          </Button>
        </ListRow>
      ))}
      {esc.map((a) => {
        const c = clientById(a.client);
        return (
          <ListRow key={a.id}>
            {c && <ClientDot tone={c.tone} />}
            <span className="min-w-0 flex-1">
              <Link href={clientHref(portal, a.client)} className="block truncate font-semibold hover:underline">
                {a.title.replace("Escalation: ", "")}
              </Link>
              <span className="block truncate text-12.5 text-muted">
                {c?.short} · {a.by} · {relative(a.sent) === "Overdue" ? fmt(a.sent) : relative(a.sent)}
              </span>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDecided(new Set([...decided, a.id]));
                notify(`Decision sent to ${a.by} · ${c?.short ?? ""}`, () => setDecided((s) => new Set([...s].filter((x) => x !== a.id))));
              }}
            >
              Decide
            </Button>
          </ListRow>
        );
      })}
      {cur && (
        <AssignClientDialog
          open={!!dlg}
          onOpenChange={(v) => !v && setDlg(null)}
          clientName={`${cur.name} · ${cur.service}`}
          onAssign={(m) => {
            setAssigned({ ...assigned, [cur.id]: m });
            notify(`${cur.name} assigned to ${m}`);
          }}
        />
      )}
    </SectionCard>
  );
}
