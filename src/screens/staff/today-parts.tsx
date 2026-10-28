"use client";
import * as React from "react";
import Link from "next/link";
import * as DM from "@radix-ui/react-dropdown-menu";
import { AlertTriangle, Building2, CalendarDays, Check, CheckCheck, Clock, ListChecks, Plus, Rocket, ShieldCheck, User, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { STAFF_TODAY as TODAY, fmt, relative } from "@/lib/dates";
import { clientById, clientsFor, PHASE_TOTALS, type StaffClient } from "@/data/staff-clients";
import { INBOX, queueFor, tasksFor, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { LEAD_STATS, MANAGERS, leadOpen, managerRows, UNASSIGNED } from "@/data/staff-team";
import { APPROVALS } from "@/data/staff-tasks";
import { TODOS, sameDay, type Todo } from "@/data/staff-work";
import {
  DAYS_TO_COI,
  DONE_TODAY,
  FILING_COLS,
  HEAT_COLS,
  PHASE_LABELS,
  WAIT_MCA,
  STUCK_STEPS,
  ADMIN_FILINGS,
  MGR_DAYS_TO_COI,
  PIPE_STAGES,
  pipeOf,
  filingCounts,
  filingRow,
  phaseCells,
  practiceNumbers,
  waitingOnClient,
  weekItems,
  type FilingCell,
} from "@/data/staff-today";
import { Row } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Bar, barFill, type BarTone } from "@/components/ui/Bar";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Checkbox } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, ListRow, HeadLink, Empty } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { Donut } from "@/components/cards/Donut";
import { ClientDot, ClientName, TaskChip, base, clientHref, plainName, taskHref, type StaffPortal } from "./parts";

// Today cards for the staff portals. Ported from reference/old-screens/s/lead/Main.dc.html (lead and manager),
// TodayPhone.dc.html, reference/old-patch/admin/Main.dc.html and reference/old-patch/shared/Practice.dc.html.

export type Scope = "all" | "incorporating" | "compliance";
export type Notify = (text: string, onUndo?: () => void) => void;

export const inScope = (scope: Scope, clientId?: string) => {
  if (scope === "all" || !clientId) return true;
  return clientById(clientId)?.stage === scope;
};

/** Greeting scope switch (N5 segmented): All, Incorporating, Compliance with counts (Main.dc.html scopes). */
export function ScopeTabs({ portal, value, onChange }: { portal: StaffPortal; value: Scope; onChange: (s: Scope) => void }) {
  const cl = clientsFor(portal);
  const inc = cl.filter((c) => c.stage === "incorporating").length;
  const items: Array<[Scope, string, number]> = [
    ["all", "All", cl.length],
    ["incorporating", "Incorporating", inc],
    ["compliance", "Compliance", cl.length - inc],
  ];
  return <Tabs size="md" items={items.map(([key, label, n]) => ({ key, label, count: n }))} value={value} onChange={(k) => onChange(k as Scope)} />;
}

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * R-10 filter chip. Set: soft blurple fill, "Label Value" and an ×. Not set: dashed edge, "+ Label".
 * A click opens a light menu (34 px rows) with the options.
 */
export function FilterChip({ label, value, options, onChange }: { label: string; value: string; options: FilterOption[]; onChange: (v: string) => void }) {
  const picked = options.find((o) => o.value === value);
  const menu = (
    <DM.Portal>
      <DM.Content align="start" sideOffset={4} collisionPadding={12} className="z-50 max-h-[320px] min-w-[180px] overflow-y-auto rounded-md border border-line bg-surface p-1 text-14 text-ink shadow-float">
        {options.map((o) => (
          <DM.Item key={o.value} onSelect={() => onChange(o.value)} className="flex h-[34px] cursor-pointer select-none items-center gap-2 rounded-sm px-2.5 outline-none data-[highlighted]:bg-hover">
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            {o.value === value && <Check size={14} strokeWidth={1.6} className="text-accent" aria-hidden />}
          </DM.Item>
        ))}
      </DM.Content>
    </DM.Portal>
  );
  if (picked)
    return (
      <span className="inline-flex h-7 max-w-full flex-none items-center gap-1.5 rounded-md border-1.5 border-accent-line bg-accent-soft pl-2.5 pr-1.5 text-13 text-accent">
        <DM.Root modal={false}>
          <DM.Trigger asChild>
            <button type="button" className="inline-flex min-w-0 items-center gap-1.5">
              <span className="text-ink-2">{label}</span>
              <b className="truncate font-medium">{picked.label}</b>
            </button>
          </DM.Trigger>
          {menu}
        </DM.Root>
        <button type="button" aria-label={`Remove ${label} filter`} onClick={() => onChange("")} className="grid h-[18px] w-[18px] flex-none place-items-center rounded-sm text-accent hover:bg-surface">
          <X size={13} strokeWidth={1.6} />
        </button>
      </span>
    );
  return (
    <DM.Root modal={false}>
      <DM.Trigger asChild>
        <button type="button" className="inline-flex h-7 flex-none items-center gap-1.5 rounded-md border-1.5 border-dashed border-line-2 px-2.5 text-13 font-medium text-ink-2 hover:bg-hover data-[state=open]:bg-hover">
          <Plus size={14} strokeWidth={1.6} aria-hidden />
          {label}
        </button>
      </DM.Trigger>
      {menu}
    </DM.Root>
  );
}

/** Client identity colour, as the company tile uses it. */
const codeTone: Record<StaffClient["tone"], string> = {
  accent: "bg-accent-soft text-accent",
  violet: "bg-violet-soft text-violet",
  teal: "bg-teal-soft text-teal",
  warn: "bg-warn-soft text-warn",
  ok: "bg-ok-soft text-ok",
  idle: "bg-idle-soft text-idle",
};
export function ClientCode({ c, href }: { c: StaffClient; href?: string }) {
  const name = plainName(c);
  const code = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const inner = (
    <>
      <span className={cn("grid h-[26px] w-[26px] flex-none place-items-center rounded-md text-11 font-medium tracking-[.02em]", codeTone[c.tone])} aria-hidden>
        {code}
      </span>
      <b className="min-w-0 truncate font-medium text-ink">{name}</b>
    </>
  );
  return href ? (
    <Link href={href} className="inline-flex min-w-0 max-w-full items-center gap-2.5 hover:underline">
      {inner}
    </Link>
  ) : (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2.5">{inner}</span>
  );
}

/** Greeting numbers. Lead and manager: Action, Overdue, Waiting, This week, Done today (Main.dc.html). Admin: the firm (admin Main). */
export function todayStats(portal: StaffPortal, scope: Scope): StatItem[] {
  const b = base(portal);
  if (portal === "admin") {
    const cl = clientsFor(portal).filter((c) => inScope(scope, c.id));
    const open = tasksFor(portal).filter((t) => t.status !== "Done" && inScope(scope, t.client));
    return [
      {
        label: "Clients",
        value: cl.length,
        Icon: Building2,
        tone: "blue",
        href: `${b}/clients`,
      },
      {
        label: "Incorporating",
        value: cl.filter((c) => c.stage === "incorporating").length,
        Icon: Rocket,
        tone: "violet",
        href: `${b}/clients`,
      },
      {
        label: "In compliance",
        value: cl.filter((c) => c.stage === "compliance").length,
        Icon: ShieldCheck,
        tone: "green",
        href: `${b}/clients`,
      },
      {
        label: "Overdue",
        value: open.filter((t) => t.status === "Overdue").length,
        Icon: AlertTriangle,
        tone: "red",
        bad: true,
        href: `${b}/work`,
      },
      {
        label: "Stuck",
        value: cl.filter((c) => c.health === "Stuck").length,
        Icon: Clock,
        tone: "amber",
        bad: true,
        href: `${b}/clients`,
      },
      {
        label: "Due this week",
        value: open.filter((t) => t.status === "Due this week").length,
        Icon: CalendarDays,
        tone: "teal",
        href: `${b}/work`,
      },
    ];
  }
  const queue = queueFor(portal).filter((t) => inScope(scope, t.client));
  const late = queue.filter((t) => t.status === "Overdue").length + filingCounts(clientsFor(portal).filter((c) => inScope(scope, c.id))).overdue;
  const week = weekItems(portal).filter((w) => w.kind !== "done" && inScope(scope, w.client)).length;
  return [
    {
      label: "Needs action",
      value: queue.length,
      Icon: ListChecks,
      tone: "blue",
      href: `${b}/work`,
    },
    {
      label: "Overdue",
      value: late,
      Icon: AlertTriangle,
      tone: "red",
      bad: late > 0,
      href: `${b}/work`,
    },
    {
      label: "Waiting on clients",
      value: waitingOnClient(portal).filter((t) => inScope(scope, t.client)).length + WAIT_MCA.filter((w) => inScope(scope, w.client)).length,
      Icon: User,
      tone: "amber",
      href: `${b}/work`,
    },
    {
      label: "Due this week",
      value: week,
      Icon: CalendarDays,
      tone: "teal",
      href: `${b}/work`,
    },
    {
      label: "Done today",
      value: DONE_TODAY[portal],
      Icon: CheckCheck,
      tone: "green",
      good: DONE_TODAY[portal] > 0,
    },
  ];
}

/** Practice areas (Practice.dc.html full, admin): incorporation stages, registrations, October filings. Counts only (R-37). */
export function PracticeAreas({ portal }: { portal: StaffPortal }) {
  const p = practiceNumbers(portal);
  const b = base(portal);
  const inc = clientsFor(portal).filter((c) => c.stage === "incorporating");
  const stages = PIPE_STAGES.map((label) => ({
    label,
    n: inc.filter((c) => pipeOf(c) === label).length,
  }));
  const max = Math.max(1, ...stages.map((x) => x.n));
  const avg = Math.round(Object.values(MGR_DAYS_TO_COI).reduce((a, n) => a + n, 0) / Object.values(MGR_DAYS_TO_COI).length);
  const f = ADMIN_FILINGS;
  const fSegs = [
    { label: "Overdue", value: f.overdue, tone: "bad" as const },
    { label: "Filed late", value: f.late, tone: "warn" as const },
    { label: "Due this week", value: f.due, tone: "accent" as const },
    { label: "Upcoming", value: f.upcoming, tone: "idle" as const },
    { label: "Filed on time", value: f.onTime, tone: "ok" as const },
  ];
  const fTotal = fSegs.reduce((a, x) => a + x.value, 0);
  const foot = (left: React.ReactNode, href: string, label: string) => (
    <div className="-mx-4 -mb-4 mt-auto flex items-center gap-2 border-t border-line-soft px-4 py-3 text-12.5 text-muted md:-mx-5 md:px-5">
      <span className="min-w-0 flex-1 truncate">{left}</span>
      <Link href={href} className="font-medium text-accent hover:underline">
        {label}
      </Link>
    </div>
  );
  // Old Practice.dc.html: three cards of one height, footers on one line, so the Clients grid sits right under them.
  const card = "flex flex-col";
  const body = "flex flex-1 flex-col gap-4";
  return (
    <Row cols={3} className="md:items-stretch">
      <SectionCard title="Incorporation" meta={String(p.inc)} icon={{ Icon: Rocket, tone: "violet" }} className={card} bodyClassName={body}>
        <ul className="grid gap-2.5">
          {stages.map((x) => (
            <li key={x.label} className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)_24px] items-center gap-3 text-12.5">
              <span className="truncate font-medium">{x.label}</span>
              <Bar pct={(x.n / max) * 100} tone="accent" />
              <b className="text-right font-medium">{x.n}</b>
            </li>
          ))}
        </ul>
        {foot(
          <>
            Average <b className="font-medium text-ink">{avg} days</b> to COI · target 30
          </>,
          `${b}/clients`,
          "Open clients",
        )}
      </SectionCard>
      <SectionCard title="Registrations" className={card} bodyClassName={body}>
        <div className="flex flex-wrap gap-6">
          {[
            { n: p.regDone, label: "Done", cls: "text-ok" },
            {
              n: p.regOpen - p.regWait,
              label: "In progress",
              cls: "text-accent",
            },
            { n: p.regWait, label: "Pending", cls: "text-warn" },
          ].map((x) => (
            <div key={x.label}>
              <b className={cn("block text-24 font-medium leading-tight", x.cls)}>{x.n}</b>
              <span className="text-12 text-muted">{x.label}</span>
            </div>
          ))}
        </div>
        <ul className="-mt-1 grid gap-2">
          {p.regSplit.slice(0, 3).map((r) => (
            <li key={r.name} className="grid grid-cols-[84px_minmax(0,1fr)_24px] items-center gap-3 text-12.5" title={`${r.name}: ${r.d} done, ${r.p} in progress, ${r.w} pending`}>
              <span className="font-medium">{r.name}</span>
              <span className="flex h-2 overflow-hidden rounded-bar bg-line-soft" aria-hidden>
                <i className={barFill.ok} style={{ width: `${(r.d / r.total) * 100}%` }} />
                <i className={barFill.accent} style={{ width: `${(r.p / r.total) * 100}%` }} />
                <i className={barFill.warn} style={{ width: `${(r.w / r.total) * 100}%` }} />
              </span>
              <b className="text-right font-medium">{r.p + r.w}</b>
            </li>
          ))}
        </ul>
        {foot(
          <>
            Most pending: <b className="font-medium text-ink">{p.regSplit[0]?.mostPending ?? ""}</b>
          </>,
          `${b}/registrations`,
          "Open clients",
        )}
      </SectionCard>
      <SectionCard title="Compliances · October" className={card} bodyClassName={body}>
        <div>
          <p className="flex items-baseline gap-1.5">
            <b className="text-24 font-medium leading-tight">{fTotal}</b>
            <span className="text-12.5 text-muted">filings</span>
          </p>
          <span className="mt-2 flex h-2 gap-[2px] overflow-hidden rounded-bar" aria-hidden>
            {fSegs.map((x) => (
              <i key={x.label} className={barFill[x.tone]} style={{ width: `${(x.value / fTotal) * 100}%` }} />
            ))}
          </span>
          <ul className="mt-2.5 grid gap-1">
            {fSegs.map((x) => (
              <li key={x.label} className="flex items-center gap-2 text-12.5">
                <i className={cn("h-2 w-2 flex-none rounded-[2px]", barFill[x.tone])} aria-hidden />
                <span className="flex-1 font-medium">{x.label}</span>
                <b className="font-medium">{x.value}</b>
              </li>
            ))}
          </ul>
        </div>
        {foot(
          <>
            Worst statute: <b className="font-medium text-ink">{f.worst}</b>
          </>,
          `${b}/compliances/calendar`,
          "Open calendar",
        )}
      </SectionCard>
    </Row>
  );
}

/** Old heatmap counts: soft tinted boxes (Main.dc.html, old-lead-home.png). */
const heatCell: Record<(typeof HEAT_COLS)[number]["tone"], string> = {
  bad: "bg-bad-soft text-bad",
  warn: "bg-warn-soft text-warn",
  accent: "bg-accent-soft text-accent",
  idle: "bg-raised text-muted",
  faint: "bg-raised text-faint",
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
    .map((id) => ({
      client: clientById(id)!,
      tasks: all.filter((t) => t.client === id),
    }))
    .filter((r) => r.client)
    .sort((a, b) => (portal === "admin" ? b.tasks.filter((t) => t.status === "Overdue").length - a.tasks.filter((t) => t.status === "Overdue").length : 0));
  const picked = pick ? all.filter((t) => `${t.client}|${t.status}` === pick) : [];
  const pickedCol = pick ? HEAT_COLS.find((h) => h.status === pick.split("|")[1]) : undefined;
  const stuck =
    portal === "admin"
      ? clientsFor(portal)
          .filter((c) => c.health === "Stuck" && inScope(scope, c.id))
          .map((c) => ({ client: c.id, text: c.short }))
      : STUCK_STEPS.filter((x) => inScope(scope, x.client));

  const mapCols: Column<HeatRow>[] = [
    {
      key: "client",
      label: "Client",
      render: (r) => <ClientCode c={r.client} href={clientHref(portal, r.client.id)} />,
    },
    ...HEAT_COLS.map((h): Column<HeatRow> => ({
      key: h.key,
      label: h.label,
      width: 96,
      align: "center",
      render: (r) => {
        const n = r.tasks.filter((t) => t.status === h.status).length;
        const key = `${r.client.id}|${h.status}`;
        if (!n)
          return (
            <span className="mx-auto block w-[56px] text-center text-faint" aria-hidden>
              –
            </span>
          );
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
            className={cn("mx-auto grid h-[28px] w-[56px] place-items-center rounded-sm text-13 font-medium", heatCell[h.tone], pick === key && "ring-2 ring-accent ring-offset-1 ring-offset-surface")}
          >
            {n}
          </button>
        );
      },
    })),
    {
      key: "total",
      label: "Total",
      width: 96,
      align: "center",
      render: (r) => (
        <span className="whitespace-nowrap text-12 text-muted">
          <b className="text-13.5 font-medium text-ink">{r.tasks.length}</b> {r.tasks.length > 1 ? "tasks" : "task"}
        </span>
      ),
    },
  ];

  const listCols: Column<StaffTask>[] = [
    {
      key: "client",
      label: "Client",
      width: 170,
      render: (t) => <ClientName id={t.client} short />,
    },
    {
      key: "title",
      label: "Task",
      render: (t) => <span className="font-medium">{t.title}</span>,
    },
    { key: "code", label: "Step", width: 90, render: (t) => t.code ?? "" },
    { key: "owner", label: "Owner", width: 120 },
    {
      key: "due",
      label: "Due",
      width: 80,
      render: (t) => <span className={t.due < TODAY ? "font-medium text-bad" : undefined}>{fmt(t.due)}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: 130,
      render: (t) => <TaskChip status={t.status} />,
    },
  ];

  const head = (
    <>
      {stuck.length > 0 && (
        <Link href={clientHref(portal, stuck[0].client)} className="hidden items-center gap-1.5 rounded-sm bg-bad-soft px-2 py-0.5 text-12 font-medium text-bad hover:underline md:inline-flex">
          <i className="h-[7px] w-[7px] rounded-[2px] bg-bad-mid" aria-hidden />
          {stuck.length} stuck · {stuck[0].text}
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
    <div className="grid gap-0 overflow-hidden rounded-md border-1.5 border-line bg-surface">
      <DataGrid inset title="Action queue" meta={`${all.length} open`} columns={mapCols} rows={rows} rowKey={(r) => r.client.id} pageSize={8} filters={head} />
      {pick && pickedCol && (
        <div className="border-t border-line">
          <div className="flex items-center gap-2 px-4 py-2.5 md:px-5">
            <b className="text-13.5 font-medium">
              {pickedCol.label} · {clientById(pick.split("|")[0])?.short}
            </b>
            <Chip tone="idle" dot={false}>
              {picked.length}
            </Chip>
            <Button variant="ghost" size="iconSm" className="ml-auto" aria-label="Close the task list" onClick={() => setPick(null)}>
              <X size={16} strokeWidth={1.6} />
            </Button>
          </div>
          {picked.map((t) => (
            <ListRow key={t.id} className="flex-wrap md:flex-nowrap">
              <span className={cn("w-[64px] flex-none text-12 text-muted", t.code && "font-mono")}>{t.code ?? "To-do"}</span>
              <span className="min-w-0 flex-1">
                <b className="block truncate font-medium">{t.title}</b>
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

const phaseBarTone = {
  done: "ok",
  current: "accent",
  stuck: "bad",
  next: "idle",
} as const;

/** Phase progress: one row per incorporating client, a cell per phase, days to COI (Main.dc.html, admin Main). */
export function PhaseProgress({ portal, scope }: { portal: StaffPortal; scope: Scope }) {
  const rows = clientsFor(portal)
    .filter((c) => c.stage === "incorporating" && inScope(scope, c.id))
    .sort((a, b) => (portal === "admin" ? (DAYS_TO_COI[a.id] ?? 99) - (DAYS_TO_COI[b.id] ?? 99) : 0));
  const cols: Column<StaffClient>[] = [
    {
      key: "name",
      label: "Client",
      render: (c) => <ClientName id={c.id} plain className="font-medium" />,
    },
    ...PHASE_LABELS.map((label, i): Column<StaffClient> => ({
      key: `p${i}`,
      label,
      width: 140,
      render: (c) => {
        const cell = phaseCells(c)[i];
        // K-33: a 6 px bar per phase with the count under it.
        return (
          <span title={`${label} · ${cell.done} of ${cell.total}${cell.kind === "stuck" ? " · stuck" : ""}`} className="grid gap-1 text-left">
            <Bar pct={(cell.done / cell.total) * 100} tone={phaseBarTone[cell.kind]} />
            <span className={cn("text-12", cell.kind === "done" ? "text-ok" : cell.kind === "stuck" ? "font-medium text-bad" : "text-ink-2")}>{cell.kind === "done" ? "✓" : `${cell.done}/${PHASE_TOTALS[i]}`}</span>
          </span>
        );
      },
    })),
    {
      key: "coi",
      label: "Days to COI",
      width: 100,
      align: "right",
      render: (c) => {
        const n = DAYS_TO_COI[c.id];
        return <span className={cn("font-medium", n !== undefined && n < 10 && "text-bad")}>{n !== undefined ? `${n} days` : ""}</span>;
      },
    },
    ...(portal === "admin"
      ? [
          {
            key: "manager",
            label: "Manager",
            width: 110,
          } as Column<StaffClient>,
        ]
      : []),
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
              <i className={cn("h-2 w-2 rounded-[2px]", barFill[phaseBarTone[k]])} aria-hidden />
              {
                {
                  done: "Done",
                  current: "Current",
                  stuck: "Stuck",
                  next: "Next",
                }[k]
              }
            </span>
          ))}
        </span>
      }
    />
  );
}

const filingCellClass: Record<FilingCell["kind"], string> = {
  filed: "bg-ok-soft text-ok",
  due: "bg-warn-soft text-warn",
  overdue: "bg-bad-soft text-bad",
  upcoming: "bg-raised text-muted",
  na: "border-1.5 border-dashed border-line",
};
const filingDot: Record<FilingCell["kind"], string> = {
  filed: "bg-ok-mid",
  due: "bg-warn-mid",
  overdue: "bg-bad-mid",
  upcoming: "bg-idle-mid",
  na: "border-1.5 border-dashed border-line-2",
};
const filingLabel: Record<FilingCell["kind"], string> = {
  filed: "Filed",
  due: "Due soon",
  overdue: "Overdue",
  upcoming: "Upcoming",
  na: "Not applicable",
};

/** Clients × filings · October (Main.dc.html filing grid). Only clients with a filing due or overdue show. */
export function ClientsFilings({ portal, scope }: { portal: StaffPortal; scope: Scope }) {
  // Old row order (lead Main.dc.html grid): Brightwave, Tidewater, Kestrel, Halcyon.
  const ORDER = ["brightwave", "tidewater", "kestrel", "halcyon"];
  const rank = (id: string) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length);
  const rows = clientsFor(portal)
    .filter((c) => c.stage === "compliance" && inScope(scope, c.id))
    .sort((a, b) => rank(a.id) - rank(b.id))
    .map((c) => ({ c, cells: filingRow(c) }));
  const cols: Column<(typeof rows)[number]>[] = [
    {
      key: "client",
      label: "Client",
      render: (r) => <ClientName id={r.c.id} plain href={clientHref(portal, r.c.id)} className="font-medium" />,
    },
    ...FILING_COLS.map((f, i): Column<(typeof rows)[number]> => ({
      key: f,
      label: f.replace(" challan", "").replace("Professional tax", "PT").replace(" KYC", ""),
      width: 58,
      align: "center",
      className: "!px-1",
      render: (r) => {
        const x = r.cells[i];
        return (
          <span title={`${r.c.short} · ${f} · ${filingLabel[x.kind]}${x.due ? ` · ${fmt(x.due)}` : ""}`} className={cn("mx-auto grid h-[24px] w-[40px] place-items-center rounded-sm text-12 font-medium", filingCellClass[x.kind])}>
            {x.kind === "filed" ? "✓" : x.kind === "overdue" ? "!" : x.kind === "due" && x.due ? x.due.getDate() : ""}
          </span>
        );
      },
    })),
  ];
  return (
    <DataGrid
      title="Clients × filings · October"
      meta={String(rows.length)}
      columns={cols}
      rows={rows}
      rowKey={(r) => r.c.id}
      footer={
        <span className="hidden flex-wrap items-center gap-3 md:flex">
          {(["filed", "due", "overdue", "upcoming", "na"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <i className={cn("h-2 w-2 rounded-[2px]", filingDot[k])} aria-hidden />
              {filingLabel[k]}
            </span>
          ))}
        </span>
      }
    />
  );
}

/** Inbox: Triage and My to-dos in one card (Main.dc.html cards 12 and 13). */
export function InboxCard({ portal, scope, notify }: { portal: StaffPortal; scope: Scope; notify: Notify }) {
  const [tab, setTab] = React.useState("triage");
  const [gone] = React.useState<Set<string>>(new Set());
  const [todos, setTodos] = React.useState<Todo[]>(TODOS[portal]);
  const [show, setShow] = React.useState("open");
  const [text, setText] = React.useState("");
  const tri = INBOX[portal].filter((r) => !gone.has(r.id) && inScope(scope, r.client));
  const mine = todos.filter((t) => inScope(scope, t.client));
  const shown = mine.filter((t) => show === "all" || (show === "done" ? t.done : !t.done));
  const add = (t: Todo) => setTodos((list) => [t, ...list]);
  const fromQueue = () => {
    const q = queueFor(portal).find((t) => !todos.some((x) => x.text === t.title));
    if (q) {
      add({
        id: `q${q.id}`,
        text: q.title,
        client: q.client,
        pinned: true,
        due: q.due,
      });
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
            {
              key: "todos",
              label: "My to-dos",
              count: mine.filter((t) => !t.done).length,
            },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      {tab === "triage" && (
        <>
          {tri.length === 0 && <Empty />}
          {tri.slice(0, 3).map((r) => {
            const c = clientById(r.client);
            return (
              <div key={r.id} className="border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
                <div className="flex items-start gap-2.5">
                  {c && <ClientDot tone={c.tone} className="mt-1.5" />}
                  <Link href={clientHref(portal, r.client)} className={cn("min-w-0 flex-1 text-13.5 hover:underline", r.unread && "font-medium")}>
                    {r.text}
                  </Link>
                  <span className="flex-none text-12 text-muted">{r.time}</span>
                </div>
                <div className="mt-0.5 pl-[18px] text-12.5 text-muted">
                  {c?.short} · {r.from}
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
                    <X size={14} strokeWidth={1.6} />
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

/** Approvals (ManagerToday.dc.html): company tile, task, client · due date · lead, a navy button on each row (D-13, exception to R-12). */
export function ApprovalsWaiting({ portal, notify }: { portal: StaffPortal; notify: Notify }) {
  const [gone, setGone] = React.useState<Set<string>>(new Set());
  const rows = APPROVALS.manager.filter((a) => !gone.has(a.id)).sort((a, b) => a.sent.getTime() - b.sent.getTime());
  return (
    <SectionCard title="Approvals" meta={String(rows.length)} flush>
      {rows.length === 0 && <Empty />}
      {rows.map((a) => {
        const c = clientById(a.client);
        const review = a.title.startsWith("Review");
        const today = sameDay(a.sent, TODAY);
        return (
          <ListRow key={a.id}>
            {c && <ClientCodeTile c={c} size={30} />}
            <span className="min-w-0 flex-1">
              <Link href={clientHref(portal, a.client)} className="block font-medium leading-snug text-ink hover:underline">
                {a.title}
              </Link>
              <span className="block truncate text-12.5 text-muted">
                {c?.short} · <span className={today ? "text-warn" : "text-accent"}>{today ? "Due today" : `Due ${fmt(a.sent)}`}</span> · {a.by.split(" ")[0]}
              </span>
            </span>
            <Button
              size="sm"
              variant="strong"
              onClick={() => {
                setGone(new Set([...gone, a.id]));
                notify(`${review ? "Opened for review" : "Approved"}: ${a.title.replace(/^(Approve|Review) /, "")} · ${c?.short ?? ""}`, () => setGone((s) => new Set([...s].filter((x) => x !== a.id))));
              }}
            >
              {review ? "Review" : "Approve"}
            </Button>
          </ListRow>
        );
      })}
    </SectionCard>
  );
}

/** The two-letter company tile on its own: a 6 px square in the client colour (R-44). */
export function ClientCodeTile({ c, size = 26 }: { c: StaffClient; size?: 26 | 30 }) {
  const code = plainName(c)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className={cn("grid flex-none place-items-center rounded-md font-medium tracking-[.02em]", size === 30 ? "h-[30px] w-[30px] text-13" : "h-[26px] w-[26px] text-11", codeTone[c.tone])} title={c.name} aria-hidden>
      {code}
    </span>
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
              <Link href={taskHref(portal, t)} className="block truncate font-medium hover:underline">
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

/** The six status words in chart order, with their status colours (R-25). */
export const STATUS_ORDER: Array<{
  s: TaskStatus;
  label: string;
  tone: BarTone;
}> = [
  { s: "Overdue", label: "Overdue", tone: "bad" },
  { s: "Due this week", label: "Due soon", tone: "warn" },
  { s: "In progress", label: "In progress", tone: "accent" },
  { s: "With client", label: "Waiting", tone: "teal" },
  { s: "Not started", label: "Not started", tone: "idle" },
  { s: "Done", label: "Done", tone: "ok" },
];

/** Task status (ManagerToday.dc.html): C1 donut with the total in the centre and a legend beside it (R-25). */
export function TaskStatusCard({ portal, scope, title = "Task status", tasks }: { portal: StaffPortal; scope: Scope; title?: string; tasks?: StaffTask[] }) {
  const all = (tasks ?? tasksFor(portal)).filter((t) => inScope(scope, t.client));
  return (
    <SectionCard title={title}>
      <Donut
        size={120}
        total={all.length}
        unit="tasks"
        segments={STATUS_ORDER.map((x) => ({
          label: x.label,
          value: all.filter((t) => t.status === x.s).length,
          tone: x.tone,
        }))}
        className="gap-6 [&>div:last-child]:flex-1"
      />
    </SectionCard>
  );
}

/** Workload by lead (ManagerToday.dc.html): C2, one stacked bar per person in status colours, scaled to the busiest lead (R-25). */
export function WorkloadByLead({ portal }: { portal: StaffPortal }) {
  const rows = Object.entries(LEAD_STATS).map(([name, x]) => ({
    name,
    open: leadOpen(name) ?? 0,
    segs: [
      { label: "Overdue", value: x.st[3], tone: "bad" as const },
      { label: "Due soon", value: x.st[2], tone: "warn" as const },
      { label: "In progress", value: x.st[1], tone: "accent" as const },
      { label: "Not started", value: x.st[4], tone: "idle" as const },
    ],
  }));
  const max = Math.max(1, ...rows.map((r) => r.open));
  return (
    <SectionCard
      title="Workload by lead"
      right={
        <Button size="sm" variant="secondary" asChild>
          <Link href={`${base(portal)}/leads`}>Rebalance</Link>
        </Button>
      }
    >
      <ul className="grid gap-3.5">
        {rows.map((r) => (
          <li key={r.name} className="grid gap-[7px]" title={r.segs.map((s) => `${s.label} ${s.value}`).join(" · ")}>
            <div className="flex items-center gap-2">
              <Avatar name={r.name} size={24} />
              <span className="min-w-0 flex-1 truncate text-13.5 font-medium text-ink">{r.name}</span>
              <span className="text-12.5 text-muted">{r.open} open</span>
            </div>
            <span className="flex h-2.5 gap-0.5" style={{ width: `${(r.open / max) * 100}%` }} aria-hidden>
              {r.segs
                .filter((s) => s.value > 0)
                .map((s) => (
                  <i key={s.label} className={cn("block h-full rounded-[2px]", barFill[s.tone])} style={{ flex: `${s.value} 1 0` }} />
                ))}
            </span>
          </li>
        ))}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-12.5 text-muted">
        {rows[0]?.segs.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <i className={cn("h-2 w-2 rounded-[2px]", barFill[s.tone])} aria-hidden />
            {s.label}
          </li>
        ))}
      </ul>
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
            <label key={m.name} className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5", on ? "border-accent-line bg-accent-soft" : "border-line hover:bg-hover")}>
              <input type="radio" name="assign-mgr" value={m.name} checked={on} onChange={() => setMgr(m.name)} className="accent-[var(--primary)]" />
              <span className="min-w-0">
                <b className="block text-13.5 font-medium">{m.name}</b>
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
            <b className="block truncate font-medium">{u.name} has no manager</b>
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
              <Link href={clientHref(portal, a.client)} className="block truncate font-medium hover:underline">
                {a.title.replace("Escalation: ", "")}
              </Link>
              <span className="block truncate text-12.5 text-muted">
                {c?.short} · {a.by} · {relative(a.sent, TODAY) === "Overdue" ? fmt(a.sent) : relative(a.sent, TODAY)}
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
