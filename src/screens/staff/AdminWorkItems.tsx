"use client";
import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { clientById, clientsFor } from "@/data/staff-clients";
import { MANAGER_TASKS, type ItemKind, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { MANAGERS } from "@/data/staff-team";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { barFill, type BarTone } from "@/components/ui/Bar";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { Donut } from "@/components/cards/Donut";
import { Cols, Col } from "@/components/shell/Page";
import { TaskChip, clientHref } from "./parts";
import { ClientCode } from "./today-parts";
import { ClientSelect } from "./filters";
import { AssignClientDialog } from "./today-parts";

// Admin Work: the managers' items (escalations, approvals, reviews, client calls, assignments), Status, Open by manager, By kind.
// Old source: reference/old-screens/s/admin/Work.dc.html and old-admin-work.png. Data: s/admin/data.js MTASKS.
// R-07: the items are an e-Filing grid. C-0031: one status mark per row. Status is a donut, as in the old screen (owner exception to R-25, 28 Oct 2026).

type Item = StaffTask & { kind: ItemKind };

const STATUS: Array<{ s: TaskStatus; label: string; tone: BarTone }> = [
  { s: "Overdue", label: "Overdue", tone: "bad" },
  { s: "Due this week", label: "Due this week", tone: "warn" },
  { s: "In progress", label: "In progress", tone: "accent" },
  { s: "With client", label: "Waiting on client", tone: "idle" },
  { s: "Not started", label: "Not started", tone: "idle" },
  { s: "Done", label: "Done", tone: "ok" },
];
const KINDS: ItemKind[] = ["Approval", "Review", "Escalation", "Client", "Assignment"];

function Seg({ n, total, tone }: { n: number; total: number; tone: BarTone }) {
  return n ? <i className={cn("block h-full", barFill[tone])} style={{ width: `${(n / total) * 100}%` }} /> : null;
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
  const order: Record<TaskStatus, number> = { Overdue: 0, "Due this week": 1, "In progress": 2, "With client": 3, "Not started": 4, Done: 5 };
  const sorted = [...rows].sort((a, b) => order[a.status] - order[b.status] || a.due.getTime() - b.due.getTime());
  const clients = clientsFor("admin").filter((c) => all.some((t) => t.client === c.id));

  const cols: Column<Item>[] = [
    {
      key: "title",
      label: "Item",
      render: (t) => (
        <span className="block min-w-0">
          <b className="block truncate font-semibold">{t.title}</b>
          <span className="block truncate text-12 text-muted">{t.kind}</span>
        </span>
      ),
    },
    { key: "client", label: "Company", width: 210, render: (t) => { const c = clientById(t.client); return c ? <ClientCode c={c} href={clientHref("admin", t.client)} /> : null; } },
    { key: "owner", label: "Manager", width: 110 },
    { key: "due", label: "Due", width: 72, render: (t) => <span className={cn("whitespace-nowrap", t.status === "Overdue" && "font-semibold text-bad")}>{fmt(t.due)}</span> },
    { key: "status", label: "Status", width: 130, render: (t) => <TaskChip status={t.status} /> },
  ];

  const mgrRows = MANAGERS.map((m) => {
    const mine = rows.filter((t) => t.owner === m.name && t.status !== "Done");
    return { name: m.name, open: mine.length, late: mine.filter((t) => t.status === "Overdue").length };
  });
  const maxOpen = Math.max(1, ...mgrRows.map((m) => m.open));

  return (
    <div className="grid grid-cols-1 gap-5">
      <section className="flex flex-wrap items-center gap-2" aria-label="Work filters">
        {tabs}
        <Select value={mgr} onChange={(e) => setMgr(e.target.value)} options={[{ value: "", label: "All managers" }, ...MANAGERS.map((m) => ({ value: m.name, label: m.name }))]} aria-label="Manager" />
        <ClientSelect clients={clients} value={client} onChange={setClient} />
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
        <span className="ml-auto flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setAssignOpen(true)}>
            Assign client
          </Button>
          <PopoverCard
            open={moreOpen}
            onOpenChange={setMoreOpen}
            align="end"
            width={200}
            trigger={
              <Button variant="outline" size="iconSm" aria-label="More actions" title="More actions">
                <MoreHorizontal size={16} strokeWidth={1.5} />
              </Button>
            }
          >
            <div className="grid py-1" role="menu">
              <button
                type="button"
                role="menuitem"
                className="h-9 px-4 text-left text-13.5 hover:bg-raised"
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
      </section>
      <Cols>
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
              segments={STATUS.map((x) => ({ label: x.label, value: rows.filter((t) => t.status === x.s).length, tone: x.tone }))}
            />
          </SectionCard>
          <SectionCard title="Open by manager">
            <ul className="grid gap-3">
              {mgrRows.map((m) => (
                <li key={m.name} className="grid grid-cols-[96px_minmax(0,1fr)_28px] items-center gap-3 text-12.5" title={`${m.name}: ${m.open} open, ${m.late} overdue`}>
                  <span className="truncate font-semibold">{m.name}</span>
                  <span className="flex h-2 overflow-hidden rounded-full bg-line-soft" aria-hidden>
                    <span className="flex h-full" style={{ width: `${(m.open / maxOpen) * 100}%` }}>
                      <Seg n={m.late} total={m.open || 1} tone="bad" />
                      <Seg n={m.open - m.late} total={m.open || 1} tone="accent" />
                    </span>
                  </span>
                  <span className="text-right font-mono text-12 font-semibold">{m.open}</span>
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
                    <span className="truncate font-semibold">{k}</span>
                    <span className="flex h-2 overflow-hidden rounded-full bg-line-soft" aria-hidden>
                      <Seg n={done} total={total} tone="ok" />
                      <Seg n={mine.length - done - late} total={total} tone="warn" />
                      <Seg n={late} total={total} tone="bad" />
                    </span>
                    <span className="text-right font-mono text-12 text-muted">
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
      </Cols>
      <AssignClientDialog open={assignOpen} onOpenChange={setAssignOpen} clientName="Lotus Dental Pvt Ltd" onAssign={(m) => toast.show(`Lotus Dental assigned to ${m}`)} />
      {toast.node}
    </div>
  );
}

