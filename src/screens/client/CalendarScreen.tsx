"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { TODAY, daysFrom, fmt, relative, urgency } from "@/lib/dates";
import { AREA_TONE, CALENDAR, CALENDAR_MONTHS, FILING_STATUSES, FILING_STATUS_BAR, FILING_STATUS_TONE, obHref, type CalendarEvent } from "@/data/compliance";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, Tag } from "@/components/ui/Chip";
import { barFill } from "@/components/ui/Bar";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard } from "@/components/cards/SectionCard";
import { Donut } from "@/components/cards/Donut";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Days of a month grid, Monday first, padded with days of the months around it. */
function gridDays(year: number, month: number) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: Math.ceil((lead + count) / 7) * 7 }, (_, i) => new Date(year, month, 1 - lead + i));
}

const hrefOf = (e: CalendarEvent) => (e.obligationId ? obHref("client", e.obligationId) : undefined);

function MonthGrid({ year, month, events }: { year: number; month: number; events: CalendarEvent[] }) {
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
          const list = events.filter((e) => sameDay(e.date, day));
          return (
            <div key={day.getTime()} className={cn("min-h-[64px] min-w-0 border-b border-line-soft p-1 md:min-h-[92px] md:p-1.5", i % 7 !== 0 && "border-l", !inMonth && "bg-raised")}>
              <span
                className={cn(
                  "inline-grid h-6 min-w-6 place-items-center rounded-sm px-1 text-12 font-semibold",
                  today ? "bg-accent-soft text-accent" : inMonth ? "text-ink-2" : "text-faint",
                )}
                aria-current={today ? "date" : undefined}
              >
                {day.getDate()}
              </span>
              {inMonth && list.length > 0 && (
                <>
                  <ul className="mt-1 hidden gap-1 md:grid">
                    {list.map((e) => {
                      const href = hrefOf(e);
                      const tag = (
                        <Tag tone={FILING_STATUS_TONE[e.status]} className="flex w-full min-w-0">
                          <span className="min-w-0 truncate">{e.title}</span>
                        </Tag>
                      );
                      return (
                        <li key={e.id} className="min-w-0" title={`${e.title} · ${e.status}`}>
                          {href ? (
                            <Link href={href} className="block hover:opacity-80">
                              {tag}
                            </Link>
                          ) : (
                            tag
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <span className="mt-1 flex flex-wrap gap-0.5 md:hidden" aria-label={`${list.length} due`}>
                    {list.map((e) => (
                      <i key={e.id} className={cn("h-1.5 w-1.5 rounded-full", barFill[FILING_STATUS_BAR[e.status]])} />
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

const listColumns: Column<CalendarEvent>[] = [
  { key: "date", label: "Due", width: 84, render: (e) => fmt(e.date) },
  { key: "title", label: "Filing", render: (e) => <span className="font-semibold">{e.title}</span> },
  { key: "kind", label: "Area", width: 110, render: (e) => <Tag tone={AREA_TONE[e.kind]}>{e.kind}</Tag> },
  { key: "status", label: "Status", width: 132, render: (e) => <Chip tone={FILING_STATUS_TONE[e.status]} fixed>{e.status}</Chip> },
];

export function CalendarScreen() {
  const [key, setKey] = React.useState("2026-10");
  const [view, setView] = React.useState("month");
  const m = CALENDAR_MONTHS.find((x) => x.key === key) ?? CALENDAR_MONTHS[1];
  const events = CALENDAR.filter((e) => e.date.getFullYear() === m.year && e.date.getMonth() === m.month);

  const coming: AttentionRow[] = CALENDAR.filter((e) => e.status !== "Filed" && daysFrom(e.date) <= 15)
    .slice(0, 8)
    .map((e) => ({ id: e.id, date: e.date, title: e.title, sub: e.kind, chip: { label: relative(e.date), tone: urgency(e.date) }, urgent: e.date < TODAY, href: hrefOf(e) }));

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Deadlines"
          flush
          right={
            <>
              <Select aria-label="Month" value={key} onChange={(e) => setKey(e.target.value)} options={CALENDAR_MONTHS.map((x) => ({ value: x.key, label: x.short }))} />
              <Tabs
                items={[
                  { key: "month", label: "Month" },
                  { key: "list", label: "List" },
                ]}
                value={view}
                onChange={setView}
              />
            </>
          }
        >
          <div className="px-4 py-4 md:px-5">
            <Donut total={events.length} title={m.label} segments={FILING_STATUSES.map((s) => ({ label: s, value: events.filter((e) => e.status === s).length, tone: FILING_STATUS_BAR[s] }))} />
          </div>
          {view === "month" ? (
            <MonthGrid year={m.year} month={m.month} events={events} />
          ) : (
            <div className="border-t border-line-soft">
              <DataGrid inset columns={listColumns} rows={events} rowKey={(e) => e.id} rowHref={hrefOf} rowLate={(e) => e.status === "Overdue"} pageSize={10} />
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
