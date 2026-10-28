"use client";
import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { clientById, clientsFor } from "@/data/staff-clients";
import { MANAGER_TASKS, type ItemKind, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { MANAGERS } from "@/data/staff-team";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { barFill, type BarTone } from "@/components/ui/Bar";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { Donut } from "@/components/cards/Donut";
import { Col } from "@/components/shell/Page";
import { TaskChip, clientHref } from "./parts";
import { ClientCode, FilterChip } from "./today-parts";
import { AssignClientDialog } from "./today-parts";

// Admin Work: the managers' items (escalations, approvals, reviews, client calls, assignments), Status, Open by manager, By kind.
// Old source: reference/old-screens/s/admin/Work.dc.html and old-admin-work.png. Data: s/admin/data.js MTASKS.
// R-07: the items are an e-Filing grid. C-0031: one status mark per row. Status is a donut, as in the old screen (owner exception to R-25, 28 Oct 2026).

type Item = StaffTask & { kind: ItemKind };

const STATUS: Array<{ s: TaskStatus; label: string; tone: BarTone }> = [
  { s: "Overdue", label: "Overdue", tone: "bad" },
  { s: "Due this week", label: "Due soon", tone: "warn" },
  { s: "In progress", label: "In progress", tone: "accent" },
  { s: "With client", label: "Waiting", tone: "teal" },
  { s: "Not started", label: "Not started", tone: "idle" },
  { s: "Done", label: "Done", tone: "ok" },
];
const KINDS: ItemKind[] = ["Approval", "Review", "Escalation", "Client", "Assignment"];

function Seg({ n, total, tone }: { n: number; total: number; tone: BarTone }) {
  return n ? <i className={cn("block h-full rounded-[2px]", barFill[tone])} style={{ width: `${(n / total) * 100}%` }} /> : null;
}

function Legend({ items }: { items: Array<[string, BarTone]> }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-3 text-12 text-muted">
      {items.map(([l, t]) => (
        <li key={l} className="flex items-center gap-1.5">
          <i className={cn("h-2 w-2 rounded-[2px]", barFill[t])} aria-hidden />
          {l}
        </li>
      ))}
    </ul>
  );
}

/** Managers tab: the grid of manager items with the three summary cards on the right. */
export function AdminWorkItems({ tabs }: { tabs: React.ReactNode }) {
  const [mgr, setMgr] = React.useState("");
  const [client, setClient] = React.useState("");
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const toast = useUndoToast();
  const all: Item[] = MANAGER_TASKS;
  const rows = all.filter((t) => (!mgr || t.owner === mgr) && (!client || t.client === client));
  const order: Record<TaskStatus, number> = {
    Overdue: 0,
    "Due this week": 1,
    "In progress": 2,
    "With client": 3,
    "Not started": 4,
    Done: 5,
  };
  const sorted = [...rows].sort((a, b) => order[a.status] - order[b.status] || a.due.getTime() - b.due.getTime());
  const clients = clientsFor("admin").filter((c) => all.some((t) => t.client === c.id));

  const cols: Column<Item>[] = [
    {
      key: "title",
      label: "Item",
      render: (t) => (
        <span className="block min-w-0 max-w-[230px]">
          <b className="block truncate font-medium text-ink">{t.title}</b>
          <span className="block truncate text-12 text-muted">{t.kind}</span>
        </span>
      ),
    },
    {
      key: "client",
      label: "Company",
      width: 160,
      render: (t) => {
        const c = clientById(t.client);
        return c ? <ClientCode c={c} href={clientHref("admin", t.client)} /> : null;
      },
    },
    {
      key: "owner",
      label: "Manager",
      width: 124,
      render: (t) => (
        <span className="inline-flex min-w-0 items-center gap-2">
          <Avatar name={t.owner} size={24} />
          <span className="truncate">{t.owner}</span>
        </span>
      ),
    },
    {
      key: "due",
      label: "Due",
      width: 72,
      render: (t) => <span className={cn("whitespace-nowrap", t.status === "Overdue" && "font-medium text-bad")}>{fmt(t.due)}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: 128,
      render: (t) => <TaskChip status={t.status} />,
    },
  ];

  const mgrRows = MANAGERS.map((m) => {
    const mine = rows.filter((t) => t.owner === m.name && t.status !== "Done");
    return {
      name: m.name,
      open: mine.length,
      late: mine.filter((t) => t.status === "Overdue").length,
    };
  });
  const maxOpen = Math.max(1, ...mgrRows.map((m) => m.open));

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Plain page head (R-02) with the tabs and actions on the right; filter chips under it (R-10). */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-[1_1_240px]">
          <h1 className="text-28 font-medium leading-9 tracking-[-0.01em]">Work</h1>
          <p className="text-13.5 text-muted">
            {rows.filter((t) => t.status !== "Done").length} open · {MANAGERS.length} managers
          </p>
        </div>
        {tabs}
        <span className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setAssignOpen(true)}>
            Assign client
          </Button>
          <PopoverCard
            open={moreOpen}
            onOpenChange={setMoreOpen}
            align="end"
            width={200}
            trigger={
              <Button variant="secondary" size="icon" aria-label="More actions" title="More actions">
                <MoreHorizontal size={16} strokeWidth={1.6} />
              </Button>
            }
          >
            <div className="grid p-1" role="menu">
              <button
                type="button"
                role="menuitem"
                className="h-[34px] rounded-sm px-2.5 text-left text-14 hover:bg-hover"
                onClick={() => {
                  setMoreOpen(false);
                  toast.show(`Exported ${sorted.length} manager items to Work.xlsx`);
                }}
              >
                Export
              </button>
            </div>
          </PopoverCard>
        </span>
      </div>
      <section className="flex flex-wrap items-center gap-2" aria-label="Work filters">
        <FilterChip label="Manager" value={mgr} onChange={setMgr} options={MANAGERS.map((m) => ({ value: m.name, label: m.name }))} />
        <FilterChip label="Company" value={client} onChange={setClient} options={clients.map((c) => ({ value: c.id, label: c.short }))} />
        {(mgr || client) && (
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setMgr("");
              setClient("");
            }}
          >
            Clear
          </Button>
        )}
      </section>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,2.4fr)_minmax(300px,1fr)]">
        <Col>
          <DataGrid title="Manager items" meta={String(sorted.length)} columns={cols} rows={sorted} rowKey={(t) => t.id} rowLate={(t) => t.status === "Overdue"} pageSize={13} empty="No items match these filters" />
        </Col>
        <Col>
          <SectionCard title="Status">
            <Donut
              size={96}
              total={
                <span className="grid justify-items-center gap-0.5">
                  {rows.length}
                  <small className="text-11 font-normal text-muted">items</small>
                </span>
              }
              segments={STATUS.map((x) => ({
                label: x.label,
                value: rows.filter((t) => t.status === x.s).length,
                tone: x.tone,
              }))}
            />
          </SectionCard>
          <SectionCard title="Open by manager">
            <ul className="grid gap-3.5">
              {mgrRows.map((m) => (
                <li key={m.name} className="grid gap-[7px]" title={`${m.name}: ${m.open} open, ${m.late} overdue`}>
                  <span className="flex items-center gap-2">
                    <Avatar name={m.name} size={24} />
                    <span className="min-w-0 flex-1 truncate text-13.5 font-medium text-ink">{m.name}</span>
                    <span className="text-12.5 text-muted">{m.open} open</span>
                  </span>
                  <span className="flex h-2.5 gap-0.5" style={{ width: `${(m.open / maxOpen) * 100}%` }} aria-hidden>
                    <Seg n={m.late} total={m.open || 1} tone="bad" />
                    <Seg n={m.open - m.late} total={m.open || 1} tone="accent" />
                  </span>
                </li>
              ))}
            </ul>
            <Legend
              items={[
                ["Overdue", "bad"],
                ["Other open", "accent"],
              ]}
            />
          </SectionCard>
          <SectionCard title="By kind">
            <ul className="grid gap-3">
              {KINDS.map((k) => {
                const mine = rows.filter((t) => t.kind === k);
                const done = mine.filter((t) => t.status === "Done").length;
                const late = mine.filter((t) => t.status === "Overdue").length;
                const total = mine.length || 1;
                return (
                  <li key={k} className="grid grid-cols-[96px_minmax(0,1fr)_36px] items-center gap-3 text-12.5" title={`${k}: ${done} done, ${mine.length - done - late} pending, ${late} overdue`}>
                    <span className="truncate text-13 text-ink-2">{k}</span>
                    <span className="flex h-2 overflow-hidden rounded-bar bg-line-soft" aria-hidden>
                      <Seg n={done} total={total} tone="ok" />
                      <Seg n={mine.length - done - late} total={total} tone="warn" />
                      <Seg n={late} total={total} tone="bad" />
                    </span>
                    <span className="text-right text-12.5 text-muted">
                      {done}/{mine.length}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Legend
              items={[
                ["Done", "ok"],
                ["Pending", "warn"],
                ["Overdue", "bad"],
              ]}
            />
          </SectionCard>
        </Col>
      </div>
      <AssignClientDialog open={assignOpen} onOpenChange={setAssignOpen} clientName="Lotus Dental Pvt Ltd" onAssign={(m) => toast.show(`Lotus Dental assigned to ${m}`)} />
      {toast.node}
    </div>
  );
}
