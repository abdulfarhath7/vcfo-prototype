"use client";
import * as React from "react";
import Link from "next/link";
import { TODAY, fmt } from "@/lib/dates";
import { clientById, progressPct, healthTone, type StaffClient } from "@/data/staff-clients";
import type { Approval } from "@/data/staff-tasks";
import type { ManagerRow } from "@/data/staff-team";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Bar } from "@/components/ui/Bar";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ClientDot, ClientName, clientHref, type StaffPortal } from "./parts";

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

export function ClientsGrid({ portal, title = "Clients", rows, filters, pageSize = 8 }: { portal: StaffPortal; title?: string; rows: StaffClient[]; filters?: React.ReactNode; pageSize?: number }) {
  const cols: Column<StaffClient>[] = [
    { key: "name", label: "Client", render: (c) => <ClientName id={c.id} /> },
    { key: "stage", label: "Stage", width: 130, render: (c) => <Chip tone={c.stage === "incorporating" ? "violet" : "teal"} fixed>{c.stage === "incorporating" ? "Incorporating" : "Compliance"}</Chip> },
    { key: "step", label: "Current step", render: (c) => <span className="block max-w-[220px] truncate">{c.step}</span> },
    {
      key: "progress",
      label: "Progress",
      width: 140,
      render: (c) => (
        <span className="flex items-center gap-2">
          <Bar pct={progressPct(c)} tone={progressPct(c) === 100 ? "ok" : "accent"} className="w-[72px]" />
          <span className="text-12.5 text-muted">{progressPct(c)}%</span>
        </span>
      ),
    },
    { key: "lead", label: "Project lead", width: 120 },
    { key: "manager", label: "Manager", width: 120 },
    { key: "next", label: "Next date", width: 90, render: (c) => <span className={c.next < TODAY ? "font-semibold text-bad" : undefined}>{fmt(c.next)}</span> },
    { key: "health", label: "Health", width: 130, render: (c) => <Chip tone={healthTone[c.health]} fixed>{c.health}</Chip> },
  ];
  return <DataGrid title={title} meta={`${rows.length}`} columns={cols} rows={rows} rowKey={(c) => c.id} rowHref={(c) => clientHref(portal, c.id)} filters={filters} pageSize={pageSize} />;
}

export function ManagersGrid({ title = "Managers", rows }: { title?: string; rows: ManagerRow[] }) {
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
  ];
  return <DataGrid title={title} columns={cols} rows={rows} rowKey={(m) => m.name} />;
}

