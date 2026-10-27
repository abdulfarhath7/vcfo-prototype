"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { TODAY, daysFrom, fmt, relative, urgency } from "@/lib/dates";
import { AREA_TONE, CALENDAR_MONTHS, FILING_STATUSES, FILING_STATUS_BAR, FILING_STATUS_TONE, type FilingStatus } from "@/data/compliance";
import { clientById } from "@/data/staff-clients";
import { calendarFor, complianceClients, staffObHref, type StaffEvent } from "@/data/staff-compliance";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, Tag } from "@/components/ui/Chip";
import { barFill } from "@/components/ui/Bar";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard } from "@/components/cards/SectionCard";
import { Donut } from "@/components/cards/Donut";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { ClientDot, ClientName, type StaffPortal } from "./parts";
import { ClientSelect } from "./filters";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Worst first: the day badge takes the tint of the worst status. */
const WORST: FilingStatus[] = ["Overdue", "Due soon", "In progress", "Upcoming", "Filed"];
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function gridDays(year: number, month: number) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: Math.ceil((lead + count) / 7) * 7 }, (_, i) => new Date(year, month, 1 - lead + i));
}

/** Events of one day, one badge per client. */
function byClient(list: StaffEvent[]) {
  const map = new Map<string, StaffEvent[]>();
  for (const e of list) map.set(e.client, [...(map.get(e.client) ?? []), e]);
  return [...map.entries()].map(([client, evs]) => ({ client, evs, status: WORST.find((s) => evs.some((e) => e.status === s)) ?? "Upcoming" }));
}

function MonthGrid({ year, month, events, onPick }: { year: number; month: number; events: StaffEvent[]; onPick: (client: string) => void }) {
  return (
    <div className="grid grid-cols-7 border-t border-line-soft">
      {WEEKDAYS.map((w) => (
        <div key={w} className="border-b border-l border-line-soft px-1.5 py-1.5 text-11.5 font-semibold text-faint first:border-l-0 md:px-2.5">
          {w}
        </div>
      ))}
      {gridDays(year, month).map((day, i) => {
        const inMonth = day.getMonth() === month;
        const today = sameDay(day, TODAY);
        const groups = inMonth ? byClient(events.filter((e) => sameDay(e.date, day))) : [];
        return (
          <div key={day.getTime()} className={cn("min-h-[64px] min-w-0 border-b border-line-soft p-1 md:min-h-[92px] md:p-1.5", i % 7 !== 0 && "border-l", !inMonth && "bg-raised")}>
            <span className={cn("inline-grid h-6 min-w-6 place-items-center rounded-sm px-1 text-12 font-semibold", today ? "bg-accent-soft text-accent" : inMonth ? "text-ink-2" : "text-faint")} aria-current={today ? "date" : undefined}>
              {day.getDate()}
            </span>
            {groups.length > 0 && (
              <>
                <ul className="mt-1 hidden gap-1 md:grid">
                  {groups.map((g) => {
                    const c = clientById(g.client);
                    return (
                      <li key={g.client} className="min-w-0">
                        <button type="button" onClick={() => onPick(g.client)} title={g.evs.map((e) => `${c?.short} · ${e.title} · ${e.status}`).join("\n")} className="block w-full hover:opacity-80">
                          <Tag tone={FILING_STATUS_TONE[g.status]} className="flex w-full min-w-0 gap-1.5">
                            {c && <ClientDot tone={c.tone} />}
                            <span className="min-w-0 flex-1 truncate text-left">{c?.short}</span>
                            {g.evs.length > 1 && <span className="flex-none">{g.evs.length}</span>}
                          </Tag>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <span className="mt-1 flex flex-wrap gap-0.5 md:hidden" aria-label={`${groups.length} clients due`}>
                  {groups.map((g) => (
                    <i key={g.client} className={cn("h-1.5 w-1.5 rounded-full", barFill[FILING_STATUS_BAR[g.status]])} />
                  ))}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

const listColumns: Column<StaffEvent>[] = [
  { key: "date", label: "Due", width: 84, render: (e) => fmt(e.date) },
  { key: "client", label: "Client", width: 150, render: (e) => <ClientName id={e.client} short /> },
  { key: "title", label: "Filing", render: (e) => <span className="font-semibold">{e.title}</span> },
  { key: "kind", label: "Area", width: 110, render: (e) => <Tag tone={AREA_TONE[e.kind]}>{e.kind}</Tag> },
  { key: "status", label: "Status", width: 132, render: (e) => <Chip tone={FILING_STATUS_TONE[e.status]} fixed>{e.status}</Chip> },
];

export function CalendarScreen({ portal }: { portal: StaffPortal }) {
  const [key, setKey] = React.useState("2026-10");
  const [view, setView] = React.useState("month");
  const [client, setClient] = React.useState("");
  const m = CALENDAR_MONTHS.find((x) => x.key === key) ?? CALENDAR_MONTHS[1];
  const all = calendarFor(portal, client);
  const events = all.filter((e) => e.date.getFullYear() === m.year && e.date.getMonth() === m.month);
  const href = (e: StaffEvent) => (e.obKey ? staffObHref(portal, e.obKey) : undefined);

  const coming: AttentionRow[] = all
    .filter((e) => e.status !== "Filed" && daysFrom(e.date) <= 15)
    .slice(0, 10)
    .map((e) => ({ id: e.id, date: e.date, title: e.title, sub: `${clientById(e.client)?.short} · ${e.kind}`, chip: { label: relative(e.date), tone: urgency(e.date) }, urgent: e.date < TODAY, href: href(e) }));

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Deadlines"
          flush
          right={
            <>
              <ClientSelect clients={complianceClients(portal)} value={client} onChange={setClient} />
              <Select aria-label="Month" value={key} onChange={(e) => setKey(e.target.value)} options={CALENDAR_MONTHS.map((x) => ({ value: x.key, label: x.short }))} />
              <Tabs
                items={[
                  { key: "month", label: "Month" },
                  { key: "list", label: "List" },
                ]}
                value={view}
                onChange={setView}
                className="hidden sm:inline-flex"
              />
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-4 px-4 py-4 md:px-5">
            <Donut total={events.length} title={m.label} segments={FILING_STATUSES.map((s) => ({ label: s, value: events.filter((e) => e.status === s).length, tone: FILING_STATUS_BAR[s] }))} />
            <Tabs
              items={[
                { key: "month", label: "Month" },
                { key: "list", label: "List" },
              ]}
              value={view}
              onChange={setView}
              className="sm:hidden"
            />
          </div>
          {view === "month" ? (
            <MonthGrid
              year={m.year}
              month={m.month}
              events={events}
              onPick={(c) => {
                setClient(c);
                setView("list");
              }}
            />
          ) : (
            <div className="border-t border-line-soft">
              <DataGrid inset columns={listColumns} rows={events} rowKey={(e) => e.id} rowHref={href} rowLate={(e) => e.status === "Overdue"} pageSize={12} />
            </div>
          )}
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="Coming up" flush>
          <AttentionList rows={coming} />
        </SectionCard>
      </Col>
    </Cols>
  );
}
