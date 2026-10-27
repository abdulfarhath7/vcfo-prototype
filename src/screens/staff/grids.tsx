"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { clientById, progressPct, healthTone, incDone, PHASE_TOTALS, CONTACTS, type StaffClient } from "@/data/staff-clients";
import type { Approval } from "@/data/staff-tasks";
import type { ManagerRow } from "@/data/staff-team";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Bar } from "@/components/ui/Bar";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ClientDot, clientHref, type StaffPortal } from "./parts";
import { identityTag } from "./filters";
import { managerOf, leadOf, useAssignments } from "./record-parts";

export function ApprovalsCard({ items, portal }: { items: Approval[]; portal: StaffPortal }) {
  const [done, setDone] = React.useState<Record<string, "Approved" | "Returned">>({});
  return (
    <SectionCard title="Approvals" meta={`${items.filter((a) => !done[a.id]).length} waiting`} flush>
      {items.map((a) => {
        const c = clientById(a.client);
        const state = done[a.id];
        return (
          <ListRow key={a.id}>
            {c && <ClientDot tone={c.tone} />}
            <span className="min-w-0 flex-1">
              <Link href={clientHref(portal, a.client)} className="block truncate font-semibold hover:underline">
                {a.title}
              </Link>
              <span className="block truncate text-12.5 text-muted">
                {c?.short} · {a.by} · {fmt(a.sent)}
              </span>
            </span>
            {state ? (
              <Chip tone={state === "Approved" ? "ok" : "bad"}>{state}</Chip>
            ) : (
              <span className="flex flex-none gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setDone({ ...done, [a.id]: "Returned" })}>
                  Return
                </Button>
                <Button size="sm" variant="soft" onClick={() => setDone({ ...done, [a.id]: "Approved" })}>
                  Approve
                </Button>
              </span>
            )}
          </ListRow>
        );
      })}
    </SectionCard>
  );
}

const PHASE_NAMES = ["Name", "Incorporation", "Post-incorporation", "Registrations"];

/** Four segments sized by step count, filled by steps done. A segment opens that phase on the client record. */
export function PhaseBar({ c, portal, className }: { c: StaffClient; portal: StaffPortal; className?: string }) {
  const stuck = c.health === "Stuck" || c.health === "Overdue";
  const cur = c.phases.findIndex((n, i) => n < PHASE_TOTALS[i]);
  return (
    <span className={cn("flex w-full min-w-[120px] items-center gap-[3px]", className)}>
      {PHASE_TOTALS.map((t, i) => {
        const pct = Math.round((c.phases[i] / t) * 100);
        const isCur = i === cur && (i < 3 || c.stage === "compliance");
        const tip = `${PHASE_NAMES[i]} · ${c.phases[i]} of ${t}${isCur && stuck ? " · stuck" : ""}`;
        const inner = (
          <span className={cn("relative block h-2.5 overflow-hidden rounded-[3px] bg-line-soft", isCur && "ring-1 ring-accent-line")}>
            <i className="absolute inset-y-0 left-0 bg-ok-mid" style={{ width: `${pct}%` }} />
            {isCur && <i className={cn("absolute inset-y-0", stuck ? "bg-bad-mid" : "bg-btn")} style={{ left: `${pct}%`, width: `${Math.max(4, 100 / t)}%` }} />}
          </span>
        );
        return i < 3 ? (
          <Link key={i} href={`${clientHref(portal, c.id)}?phase=${i + 1}`} title={tip} aria-label={tip} style={{ flex: t }} className="block hover:opacity-80">
            {inner}
          </Link>
        ) : (
          <span key={i} title={tip} aria-label={tip} style={{ flex: t }} className="block">
            {inner}
          </span>
        );
      })}
    </span>
  );
}

/** Dot for who holds the current step (R-14 colours: client amber, SBC blue, MCA violet). */
const holderDot: Record<StaffClient["pendingWith"], string> = { Client: "bg-warn-mid", SBC: "bg-accent", MCA: "bg-violet" };

export function HolderDot({ c }: { c: StaffClient }) {
  const label = c.pendingWith === "Client" ? "Waiting on the client" : c.pendingWith === "MCA" ? "With MCA" : "SBC step";
  return <i className={cn("inline-block h-2.5 w-2.5 flex-none rounded-full", holderDot[c.pendingWith])} title={label} aria-label={label} />;
}

/** Client identity tile: initials in the client colour (R-35). */
export function ClientTile({ c, size = 30 }: { c: StaffClient; size?: 30 | 36 | 44 }) {
  const tone = identityTag[c.tone];
  const cls = { prog: "bg-accent-soft text-accent", violet: "bg-violet-soft text-violet", teal: "bg-teal-soft text-teal", warn: "bg-warn-soft text-warn", ok: "bg-ok-soft text-ok", idle: "bg-idle-soft text-idle", bad: "bg-bad-soft text-bad" }[tone];
  const ini = c.short.slice(0, 2).toUpperCase();
  return (
    <span className={cn("inline-grid flex-none place-items-center rounded-md font-bold", size === 30 ? "text-11" : "text-12.5", cls)} style={{ width: size, height: size }} aria-hidden>
      {ini}
    </span>
  );
}

function Legend() {
  const sw = (cls: string, label: string) => (
    <span className="inline-flex items-center gap-1.5">
      <i className={cn("inline-block h-2.5 w-2.5 rounded-[3px]", cls)} aria-hidden />
      {label}
    </span>
  );
  return (
    <span className="hidden flex-wrap items-center gap-x-4 gap-y-1 text-12 lg:flex">
      {sw("bg-ok-mid", "Done")}
      {sw("bg-btn", "Current step")}
      {sw("bg-bad-mid", "Stuck")}
      {sw("bg-line-soft", "Not started")}
      {sw("rounded-full bg-accent", "SBC step")}
      {sw("rounded-full bg-warn-mid", "Waiting on the client")}
      {sw("rounded-full bg-violet", "With MCA")}
    </span>
  );
}

export function ClientsGrid({ portal, title = "Clients", rows, filters, pageSize = 8, meta }: { portal: StaffPortal; title?: string; rows: StaffClient[]; filters?: React.ReactNode; pageSize?: number; meta?: React.ReactNode }) {
  const s = useAssignments();
  const cols: Column<StaffClient>[] = [
    {
      key: "name",
      label: "Client",
      width: 240,
      render: (c) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <ClientTile c={c} />
          <span className="min-w-0">
            <b className="block truncate font-semibold">{c.name}</b>
            <span className="block truncate text-12 text-muted">{CONTACTS[c.id]?.name}</span>
          </span>
        </span>
      ),
    },
    { key: "stage", label: "Stage", width: 130, render: (c) => <Chip tone={c.stage === "incorporating" ? "violet" : "teal"} fixed>{c.stage === "incorporating" ? "Incorporating" : "Compliance"}</Chip> },
    {
      key: "progress",
      label: "Progress",
      width: 220,
      render: (c) => (
        <span className="flex items-center gap-2">
          <PhaseBar c={c} portal={portal} />
          <span className="w-9 flex-none text-right text-12.5 text-muted">{progressPct(c)}%</span>
        </span>
      ),
    },
    {
      key: "step",
      label: "Now at",
      render: (c) => (
        <span className="flex min-w-0 items-center gap-2">
          <HolderDot c={c} />
          <span className="min-w-0 truncate">
            <span className="font-mono text-12 text-muted">{c.code}</span> · {c.step}
          </span>
        </span>
      ),
    },
    { key: "steps", label: "Steps", width: 70, align: "right", render: (c) => <span className="font-mono text-12.5 text-muted">{incDone(c)}/25</span> },
    { key: "with", label: "With", width: 100, render: (c) => `${c.pendingWith} · ${c.days}d` },
    ...(portal === "admin" ? [{ key: "manager", label: "Manager", width: 120, render: (c: StaffClient) => managerOf(c, s) } as Column<StaffClient>] : []),
    ...(portal !== "lead" ? [{ key: "lead", label: "Project lead", width: 120, render: (c: StaffClient) => leadOf(c, s) } as Column<StaffClient>] : []),
    { key: "next", label: "Next date", width: 90, render: (c) => <span className={c.next < TODAY ? "font-semibold text-bad" : undefined}>{fmt(c.next)}</span> },
    { key: "health", label: "Health", width: 130, render: (c) => <Chip tone={healthTone[c.health]} fixed>{c.health}</Chip> },
  ];
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
                    <b className="min-w-0 truncate font-semibold">{c.short}</b>
                    <Chip tone={healthTone[c.health]} className="ml-auto flex-none">
                      {c.health}
                    </Chip>
                  </span>
                  <span className="flex min-w-0 items-center gap-2 text-12.5 text-muted">
                    <HolderDot c={c} />
                    <span className="truncate">
                      {c.code} · {c.step}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Bar pct={progressPct(c)} tone={progressPct(c) === 100 ? "ok" : "accent"} />
                    <span className="flex-none text-12 text-muted">{incDone(c)}/25</span>
                  </span>
                  <span className="truncate text-12 text-muted">
                    {c.stage === "incorporating" ? "Incorporating" : "Compliance"} · {portal === "lead" ? `Next ${fmt(c.next)}` : `${leadOf(c, s)} · Next ${fmt(c.next)}`}
                  </span>
                </span>
                <ChevronRight size={16} strokeWidth={1.5} className="mt-1 flex-none text-faint" aria-hidden />
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
    { key: "name", label: "Manager", render: (m) => <span className="font-semibold">{m.name}</span> },
    { key: "leads", label: "Project leads", width: 110, align: "right" },
    { key: "clients", label: "Clients", width: 90, align: "right" },
    { key: "open", label: "Open tasks", width: 100, align: "right" },
    { key: "overdue", label: "Overdue", width: 90, align: "right", render: (m) => <span className={m.overdue ? "font-semibold text-bad" : undefined}>{m.overdue || ""}</span> },
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
