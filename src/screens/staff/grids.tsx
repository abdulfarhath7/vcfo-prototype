"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { STAFF_TODAY as TODAY, fmt } from "@/lib/dates";
import { progressPct, healthTone, incDone, PHASE_TOTALS, CONTACTS, HEALTH_ORDER, type StaffClient } from "@/data/staff-clients";
import { MANAGERS, type ManagerRow } from "@/data/staff-team";
import { Chip } from "@/components/ui/Chip";
import { Bar } from "@/components/ui/Bar";
import { Select } from "@/components/ui/Select";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { clientHref, type StaffPortal } from "./parts";
import { identityTag } from "./filters";
import { managerOf, leadOf, useAssignments } from "./record-parts";
import { waitWord } from "@/data/status-words";

const PHASE_NAMES = ["Name", "Incorporation", "Post-incorporation", "Registrations"];

/**
 * ST5 compact form (R-22): four bars sized by step count. Done phases green, the current phase blurple with a soft ring
 * (red when stuck), the next phases grey. 3 px corners. A bar opens that phase on the client record.
 */
/** `plain` drops the links, for use inside a row that is itself a link. */
export function PhaseBar({ c, portal, className, stuck: stuckIn, plain }: { c: StaffClient; portal: StaffPortal; className?: string; stuck?: boolean; plain?: boolean }) {
  const stuck = stuckIn ?? (c.health === "Stuck" || c.health === "Overdue");
  const cur = c.phases.findIndex((n, i) => n < PHASE_TOTALS[i]);
  return (
    <span className={cn("flex w-full min-w-[96px] items-center gap-1", className)}>
      {PHASE_TOTALS.map((t, i) => {
        const done = c.phases[i];
        const pct = Math.round((done / t) * 100);
        const isCur = i === cur && (i < 3 || c.stage === "compliance");
        const full = done >= t;
        const tip = `${PHASE_NAMES[i]} · ${done} of ${t}${isCur && stuck ? " · stuck" : ""}`;
        const inner = (
          <span className={cn("relative block h-2 overflow-hidden rounded-bar bg-raised", isCur && "ring-[1.5px] ring-accent-line")}>
            {(full || isCur || pct > 0) && <i className={cn("absolute inset-y-0 left-0 rounded-bar", full ? "bg-ok-mid" : isCur && stuck ? "bg-bad-mid" : isCur ? "bg-primary" : "bg-faint")} style={{ width: full ? "100%" : `max(${pct}%, 6px)` }} />}
          </span>
        );
        return i < 3 && !plain ? (
          <Link key={i} href={`${clientHref(portal, c.id)}?phase=${i + 1}`} title={tip} aria-label={tip} style={{ flex: t }} className="block py-1 hover:opacity-80">
            {inner}
          </Link>
        ) : (
          <span key={i} title={tip} aria-label={tip} style={{ flex: t }} className="block py-1">
            {inner}
          </span>
        );
      })}
    </span>
  );
}

/** Square for who holds the current step (R-14 owner colours: client amber, SBC info blue, MCA violet). */
const holderDot: Record<StaffClient["pendingWith"], string> = { Client: "bg-warn-mid", SBC: "bg-info-mid", MCA: "bg-violet-mid" };

export function HolderDot({ c }: { c: StaffClient }) {
  const label = c.pendingWith === "Client" ? "Waiting on the client" : c.pendingWith === "MCA" ? "With MCA" : "SBC step";
  return <i className={cn("inline-block h-2 w-2 flex-none rounded-[2px]", holderDot[c.pendingWith])} title={label} aria-label={label} />;
}

/** Client identity tile: initials in the client colour on a 6 px rounded square (R-35, R-44). */
export function ClientTile({ c, size = 30 }: { c: StaffClient; size?: 26 | 30 | 36 | 44 }) {
  const tone = identityTag[c.tone];
  const cls = { prog: "bg-accent-soft text-accent", violet: "bg-violet-soft text-violet", teal: "bg-teal-soft text-teal", warn: "bg-warn-soft text-warn", ok: "bg-ok-soft text-ok", idle: "bg-idle-soft text-idle", bad: "bg-bad-soft text-bad" }[tone];
  const ini = c.name
    .replace(/( India)? Pvt Ltd$/, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className={cn("inline-grid flex-none place-items-center rounded-md font-medium tracking-[.02em]", size <= 30 ? "text-11" : "text-12.5", cls)} style={{ width: size, height: size }} aria-hidden>
      {ini}
    </span>
  );
}

function Legend() {
  const sw = (cls: string, label: string) => (
    <span className="inline-flex items-center gap-1.5">
      <i className={cn("inline-block h-2 w-2 rounded-[2px]", cls)} aria-hidden />
      {label}
    </span>
  );
  return (
    <span className="hidden flex-wrap items-center gap-x-4 gap-y-1 text-12.5 lg:flex">
      {sw("bg-ok-mid", "Done")}
      {sw("bg-primary", "Current phase")}
      {sw("bg-bad-mid", "Stuck")}
      {sw("bg-raised shadow-[inset_0_0_0_1px_var(--line-2)]", "Not started")}
      {sw("bg-info-mid", "SBC step")}
      {sw("bg-warn-mid", "Waiting on the client")}
      {sw("bg-violet-mid", "With MCA")}
    </span>
  );
}

/** Old lead Clients status: Stuck, Not started or In progress (Clients.dc.html r.status). */
const STUCK_CLIENTS = new Set(["brightwave", "tidewater", "monsoon", "banyan"]);
export const clientStatus = (c: StaffClient) => (STUCK_CLIENTS.has(c.id) ? "Stuck" : c.phases.every((n) => n === 0) ? "Not started" : "In progress");
const statusTone = { Stuck: "bad", "Not started": "idle", "In progress": "prog" } as const;

/** Admin Today "Clients · where each one is" (old admin Main.dc.html, K-37): every client, worst health first, manager and stage filters in the head, no paging. */
export function FirmClientsGrid({ title, rows }: { title: string; rows: StaffClient[] }) {
  const s = useAssignments();
  const [manager, setManager] = React.useState("");
  const [stage, setStage] = React.useState("");
  const shown = rows.filter((c) => (!manager || managerOf(c, s) === manager) && (!stage || c.stage === stage)).sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health] || a.name.localeCompare(b.name));
  const filters = (
    <>
      <Select value={manager} onChange={(e) => setManager(e.target.value)} options={[{ value: "", label: "All managers" }, ...MANAGERS.map((m) => ({ value: m.name, label: m.name }))]} aria-label="Manager" />
      <Select
        value={stage}
        onChange={(e) => setStage(e.target.value)}
        options={[
          { value: "", label: "All stages" },
          { value: "incorporating", label: "Incorporating" },
          { value: "compliance", label: "Compliance" },
        ]}
        aria-label="Stage"
      />
    </>
  );
  return <ClientsGrid portal="admin" title={title} rows={shown} filters={filters} pageSize={Math.max(1, rows.length)} meta={String(shown.length)} />;
}

export function ClientsGrid({
  portal,
  title = "Clients",
  rows,
  filters,
  pageSize = 8,
  meta,
  showLead,
}: {
  portal: StaffPortal;
  title?: string;
  rows: StaffClient[];
  filters?: React.ReactNode;
  pageSize?: number;
  meta?: React.ReactNode;
  showLead?: boolean;
}) {
  const s = useAssignments();
  const nameCol: Column<StaffClient> = {
    key: "name",
    label: "Client",
    width: portal === "admin" ? (showLead ? 190 : 210) : 240,
    render: (c) => (
      <span className="flex min-w-0 items-center gap-2.5">
        <ClientTile c={c} />
        <span className="min-w-0">
          <b className={cn("block font-medium", portal !== "admin" && "truncate")}>{c.name.replace(/( India)? Pvt Ltd$/, "")}</b>
          {/* Old admin Today and Clients show no contact line. */}
          {portal !== "admin" && <span className="block truncate text-12 text-muted">{CONTACTS[c.id]?.name}</span>}
        </span>
      </span>
    ),
  };
  const nowCol: Column<StaffClient> = {
    key: "step",
    label: portal === "admin" ? "Now at" : "Now",
    render: (c) => (
      <span className="flex min-w-0 items-center gap-2">
        {portal !== "admin" && <HolderDot c={c} />}
        <span className="min-w-0">
          <span className="block truncate">
            {portal !== "admin" && <span className="font-mono text-12 text-muted">{c.code} · </span>}
            {portal === "admin" ? <b className="font-medium">{c.step}</b> : c.step}
          </span>
          {portal === "admin" && (
            <span className="block truncate text-12 text-muted">
              <span className="font-mono">{c.code}</span>
              {!showLead && <> · {leadOf(c, s)}</>}
            </span>
          )}
        </span>
      </span>
    ),
  };
  // Stage is a category, not a status: no dot, so "Incorporating" fits the 104 px chip (R-13).
  const stageCol: Column<StaffClient> = {
    key: "stage",
    label: "Stage",
    width: 130,
    render: (c) => (
      <Chip tone={c.stage === "incorporating" ? "violet" : "teal"} fixed dot={false}>
        {c.stage === "incorporating" ? "Incorporating" : "Compliance"}
      </Chip>
    ),
  };
  // Admin (reference/old-patch/admin/Clients.dc.html, K-37, K-38): client, now at, progress, manager, lead, stage, next, health. Fits the card at 1440.
  if (portal === "admin") {
    const adminCols: Column<StaffClient>[] = [
      nameCol,
      nowCol,
      {
        key: "progress",
        label: "Progress",
        width: showLead ? 160 : 170,
        render: (c) => (
          <span className="flex items-center gap-2">
            <PhaseBar c={c} portal={portal} className="min-w-[80px]" />
            <span className="w-8 flex-none text-right text-12 text-muted">{progressPct(c)}%</span>
          </span>
        ),
      },
      { key: "manager", label: "Manager", width: 92, render: (c) => managerOf(c, s) },
      ...(showLead ? [{ key: "lead", label: "Project lead", width: 100, render: (c: StaffClient) => leadOf(c, s) } as Column<StaffClient>] : []),
      { ...stageCol, width: 132 },
      { key: "next", label: "Next", width: 64, render: (c) => <span className={cn("whitespace-nowrap", c.next < TODAY && "font-medium text-bad")}>{fmt(c.next)}</span> },
      {
        key: "health",
        label: "Health",
        width: 132,
        render: (c) => (
          <Chip tone={healthTone[c.health]} fixed>
            {c.health}
          </Chip>
        ),
      },
    ];
    return <ClientsGridFrame portal={portal} title={title} meta={meta} rows={rows} filters={filters} pageSize={pageSize} cols={adminCols} />;
  }
  // Lead and manager (reference/old-screens/s/lead/Clients.dc.html): phases, now, steps, status.
  // R-22: in client lists the phases are the ST5 compact form, four bars in one column.
  const leadCols: Column<StaffClient>[] = [
    nameCol,
    { ...stageCol, width: 124 },
    { key: "phases", label: "Phases", width: 210, render: (c) => <PhaseBar c={c} portal={portal} stuck={STUCK_CLIENTS.has(c.id)} /> },
    nowCol,
    { key: "steps", label: "Steps", width: 64, align: "right", render: (c) => <span className="text-13 text-muted">{incDone(c)}/25</span> },
    {
      key: "status",
      label: "Status",
      width: 124,
      render: (c) => (
        <Chip tone={statusTone[clientStatus(c)]} fixed>
          {clientStatus(c)}
        </Chip>
      ),
    },
  ];
  return <ClientsGridFrame portal={portal} title={title} meta={meta} rows={rows} filters={filters} pageSize={pageSize} cols={leadCols} />;
}

function ClientsGridFrame({ portal, title, rows, filters, pageSize, meta, cols }: { portal: StaffPortal; title: string; rows: StaffClient[]; filters?: React.ReactNode; pageSize: number; meta?: React.ReactNode; cols: Column<StaffClient>[] }) {
  const s = useAssignments();
  return (
    <>
      <div className="hidden md:block">
        <DataGrid title={title} meta={meta ?? `${rows.length}`} columns={cols} rows={rows} rowKey={(c) => c.id} rowHref={(c) => clientHref(portal, c.id)} filters={filters} pageSize={pageSize} footer={<Legend />} />
      </div>
      {/* Phone: one card per client (old Clients phone list). */}
      <div className="md:hidden">
        <SectionCard title={title} meta={meta ?? `${rows.length}`} flush>
          {filters && <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-4 py-2.5">{filters}</div>}
          {rows.length === 0 ? (
            <Empty />
          ) : (
            rows.map((c) => (
              <ListRow key={c.id} href={clientHref(portal, c.id)} className="items-start">
                <ClientTile c={c} />
                <span className="grid min-w-0 flex-1 gap-1.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <b className="min-w-0 truncate font-medium">{c.short}</b>
                    <Chip tone={healthTone[c.health]} className="ml-auto flex-none">
                      {waitWord(c.health)}
                    </Chip>
                  </span>
                  <span className="flex min-w-0 items-center gap-2 text-12.5 text-muted">
                    <HolderDot c={c} />
                    <span className="truncate">
                      <span className="font-mono text-12">{c.code}</span> · {c.step}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <PhaseBar c={c} portal={portal} plain />
                    <span className="flex-none text-12 text-muted">{incDone(c)}/25</span>
                  </span>
                  <span className="truncate text-12 text-muted">
                    {c.stage === "incorporating" ? "Incorporating" : "Compliance"} · {portal === "lead" ? `Next ${fmt(c.next)}` : `${leadOf(c, s)} · Next ${fmt(c.next)}`}
                  </span>
                </span>
                <ChevronRight size={16} strokeWidth={1.6} className="mt-1 flex-none text-faint" aria-hidden />
              </ListRow>
            ))
          )}
        </SectionCard>
      </div>
    </>
  );
}

export function ManagersGrid({ title = "Managers", rows, onPick, picked }: { title?: string; rows: ManagerRow[]; onPick?: (m: ManagerRow) => void; picked?: string }) {
  // C-0034: managers in an e-Filing grid.
  const cols: Column<ManagerRow>[] = [
    { key: "name", label: "Manager", render: (m) => <span className="font-medium">{m.name}</span> },
    { key: "leads", label: "Project leads", width: 110, align: "right" },
    { key: "clients", label: "Clients", width: 90, align: "right" },
    { key: "open", label: "Open tasks", width: 100, align: "right" },
    { key: "overdue", label: "Overdue", width: 90, align: "right", render: (m) => <span className={m.overdue ? "font-medium text-bad" : undefined}>{m.overdue || ""}</span> },
    { key: "onTime", label: "On time", width: 90, align: "right", render: (m) => `${m.onTime}%` },
    {
      key: "load",
      label: "Load",
      width: 150,
      render: (m) => (
        <span className="flex items-center gap-2">
          <Bar pct={m.load} tone={m.load > 95 ? "bad" : m.load > 80 ? "warn" : "accent"} className="w-[80px]" />
          <span className="text-12.5 text-muted">{m.load}%</span>
        </span>
      ),
    },
    { key: "lastActive", label: "Last active", width: 110 },
  ];
  return <DataGrid title={title} columns={cols} rows={rows} rowKey={(m) => m.name} onRowClick={onPick} selectedKey={picked} />;
}
