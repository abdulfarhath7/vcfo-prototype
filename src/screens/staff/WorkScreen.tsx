"use client";
import * as React from "react";
import Link from "next/link";
import { TODAY, d, fmt, urgency } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { clientById } from "@/data/staff-clients";
import { tasksFor, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { Row } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { SectionCard, Empty } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { WeekList, type WeekRow } from "@/components/cards/WeekList";
import { TaskDrawer } from "@/components/cards/TaskDrawer";
import { ClientDot, ClientName, TaskChip, clientHref, taskHref, type StaffPortal } from "./parts";

type View = "list" | "board" | "plan";
type ColKey = "todo" | "doing" | "done";

const colOf = (s: TaskStatus): ColKey => (s === "Done" ? "done" : s === "Not started" ? "todo" : "doing");
const COLS: Array<{ key: ColKey; label: string }> = [
  { key: "todo", label: "To do" },
  { key: "doing", label: "Doing" },
  { key: "done", label: "Done" },
];

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// The week of 5 Oct (Mon) to 11 Oct (Sun). TODAY is Tue 6 Oct.
const WEEK = Array.from({ length: 7 }, (_, i) => d(2026, 10, 5 + i));

function BoardCard({ t, onOpen }: { t: StaffTask; onOpen: () => void }) {
  const late = t.status === "Overdue";
  return (
    <button type="button" onClick={onOpen} className={cn("block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-left hover:bg-raised", late && "border-transparent bg-bad-soft")}>
      <span className="block truncate text-13.5 font-semibold">{t.title}</span>
      <span className="mt-1 flex items-center gap-2 text-12.5 text-muted">
        <ClientName id={t.client} short />
        {t.code && <span className="truncate">· {t.code}</span>}
        <span className={cn("ml-auto flex-none", late && "font-semibold text-bad")}>{fmt(t.due)}</span>
      </span>
    </button>
  );
}

export function WorkScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState<View>("list");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [doneIds, setDoneIds] = React.useState<Set<string>>(new Set());
  const [checks, setChecks] = React.useState<Record<string, boolean>>({});
  const [owner, setOwner] = React.useState("");

  const all = tasksFor(portal).map((t) => (doneIds.has(t.id) ? { ...t, status: "Done" as TaskStatus } : t));
  const owners = [...new Set(all.map((t) => t.owner))];
  const tasks = all.filter((t) => !owner || t.owner === owner).sort((a, b) => a.due.getTime() - b.due.getTime());
  const open = all.find((t) => t.id === openId) ?? null;
  const openClient = open ? clientById(open.client) : undefined;

  const cols: Column<StaffTask>[] = [
    {
      key: "title",
      label: "Task",
      render: (t) => (
        <button type="button" onClick={() => setOpenId(t.id)} className="text-left font-semibold hover:underline">
          {t.title}
        </button>
      ),
    },
    { key: "client", label: "Client", width: 170, render: (t) => <ClientName id={t.client} short /> },
    { key: "code", label: "Step", width: 90, render: (t) => t.code ?? "" },
    { key: "area", label: "Area", width: 100 },
    ...(portal === "lead" ? [] : [{ key: "owner", label: "Owner", width: 120 } as Column<StaffTask>]),
    { key: "due", label: "Due", width: 80, render: (t) => <span className={urgency(t.due) === "bad" && t.status !== "Done" ? "font-semibold text-bad" : undefined}>{fmt(t.due)}</span> },
    { key: "status", label: "Status", width: 130, render: (t) => <TaskChip status={t.status} /> },
  ];

  const filters = (
    <>
      {portal !== "lead" && <Select value={owner} onChange={(e) => setOwner(e.target.value)} options={[{ value: "", label: "All owners" }, ...owners.map((o) => ({ value: o, label: o }))]} aria-label="Owner" />}
      <Tabs
        items={[
          { key: "list", label: "List" },
          { key: "board", label: "Board" },
          { key: "plan", label: "Plan my week" },
        ]}
        value={view}
        onChange={(k) => setView(k as View)}
      />
    </>
  );

  const weekRows: WeekRow[] = WEEK.flatMap((day) =>
    tasks
      .filter((t) => t.due.getTime() === day.getTime() && t.status !== "Done" && t.status !== "Overdue")
      .map((t) => ({
        id: t.id,
        when: day.getTime() === TODAY.getTime() ? "Today" : `${DAY[day.getDay()]} ${fmt(day)}`,
        now: day.getTime() === TODAY.getTime(),
        owner: t.status === "With client" ? ("client" as const) : ("sbc" as const),
        ownerLabel: t.status === "With client" ? clientById(t.client)?.short : t.owner,
        text: `${t.title} · ${clientById(t.client)?.short ?? ""}`,
        href: taskHref(portal, t),
      })),
  );
  const lateRows = tasks.filter((t) => t.status === "Overdue");

  return (
    <div className="grid grid-cols-1 gap-5">
      {view === "list" && <DataGrid title="Work" meta={`${tasks.filter((t) => t.status !== "Done").length} open`} columns={cols} rows={tasks} rowKey={(t) => t.id} rowLate={(t) => t.status === "Overdue"} filters={filters} pageSize={12} />}

      {view === "board" && (
        <>
          <SectionCard title="Work" meta={`${tasks.filter((t) => t.status !== "Done").length} open`} right={<div className="flex flex-wrap items-center gap-2">{filters}</div>} bodyClassName="hidden" />
          <Row cols={3}>
            {COLS.map((c) => {
              const items = tasks.filter((t) => colOf(t.status) === c.key);
              return (
                <section key={c.key} className="min-w-0 rounded-lg border border-line bg-raised" aria-label={c.label}>
                  <header className="flex h-11 items-center gap-2 border-b border-line-soft px-4">
                    <h2 className="text-13.5 font-semibold">{c.label}</h2>
                    <span className="text-12.5 text-faint">{items.length}</span>
                  </header>
                  <div className="grid gap-2 p-3">
                    {items.length === 0 ? <Empty /> : items.map((t) => <BoardCard key={t.id} t={t} onOpen={() => setOpenId(t.id)} />)}
                  </div>
                </section>
              );
            })}
          </Row>
        </>
      )}

      {view === "plan" && (
        <>
          <SectionCard title="Plan my week" meta={`${fmt(WEEK[0])} to ${fmt(WEEK[6])}`} flush right={<div className="flex flex-wrap items-center gap-2">{filters}</div>}>
            <WeekList rows={weekRows} />
          </SectionCard>
          {lateRows.length > 0 && (
            <SectionCard title="Overdue" meta={String(lateRows.length)} flush>
              <ul>
                {lateRows.map((t) => {
                  const c = clientById(t.client);
                  return (
                    <li key={t.id} className="flex items-center gap-3 border-t border-line-soft px-4 py-3 text-13.5 first:border-t-0 md:px-5">
                      <span className="w-[84px] flex-none text-12.5 font-semibold text-bad">{fmt(t.due)}</span>
                      {c && <ClientDot tone={c.tone} />}
                      <button type="button" onClick={() => setOpenId(t.id)} className="min-w-0 flex-1 truncate text-left font-semibold hover:underline">
                        {t.title}
                      </button>
                      <span className="hidden truncate text-12.5 text-muted md:inline">
                        {c?.short} · {t.owner}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}
        </>
      )}

      <TaskDrawer
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.title ?? ""}
        eyebrow={
          openClient && (
            <>
              <ClientDot tone={openClient.tone} />
              <span className="truncate">{openClient.name}</span>
            </>
          )
        }
        status={open && <TaskChip status={open.status} fixed={false} />}
        facts={
          open
            ? [
                { k: "Client", v: openClient?.short ?? "" },
                { k: "Step", v: open.code ?? "" },
                { k: "Due", v: fmt(open.due) },
                { k: "Owner", v: open.owner },
                { k: "Area", v: open.area },
                { k: "Dates set by", v: open.setBy ?? open.owner },
              ]
            : []
        }
        notes={open?.notes}
        checklist={open?.checklist?.map((c) => ({ ...c, done: checks[c.id] ?? c.done }))}
        onToggle={(id) => {
          const item = open?.checklist?.find((c) => c.id === id);
          if (item) setChecks({ ...checks, [id]: !(checks[id] ?? item.done) });
        }}
        done={open?.status === "Done"}
        onDone={() => {
          if (!open) return;
          setDoneIds(new Set([...doneIds, open.id]));
          setOpenId(null);
        }}
        actions={
          open && (
            <Button asChild variant="outline">
              <Link href={open.step ? taskHref(portal, open) : clientHref(portal, open.client)}>{open.step ? "Open step" : "Open client"}</Link>
            </Button>
          )
        }
      />
    </div>
  );
}
