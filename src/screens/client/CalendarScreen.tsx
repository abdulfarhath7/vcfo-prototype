"use client";
import * as React from "react";
import Link from "next/link";
import { CalendarPlus, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, daysFrom, fmt, relative, tile, urgency } from "@/lib/dates";
import { AREA_TONE, FILING_STATUSES, FILING_STATUS_BAR, FILING_STATUS_TONE, type FilingStatus } from "@/data/compliance";
import { CAL_AREAS, FY_MONTHS, NOW_KEY, PREP_DAYS, YEAR_EVENTS, type YearEvent } from "@/data/compliance-year";
import { filingProofs, filingTrack } from "@/data/compliance-detail";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { barFill } from "@/components/ui/Bar";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { Donut } from "@/components/cards/Donut";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { DateTile } from "@/components/cards/AttentionList";
import { YearGrid } from "@/components/cards/YearGrid";
import { FilingWindows, type WindowLane } from "@/components/cards/FilingWindows";
import { EventDialog, PortalLink, eventFiling } from "./comp-parts";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LONG_MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const RANK: FilingStatus[] = ["Overdue", "Due soon", "In progress", "Upcoming", "Filed"];
const worst = (list: YearEvent[]) => list.reduce<FilingStatus>((w, e) => (RANK.indexOf(e.status) < RANK.indexOf(w) ? e.status : w), "Filed");

/** Days of a month grid, Monday first, padded with days of the months around it. */
function gridDays(year: number, month: number) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: Math.ceil((lead + count) / 7) * 7 }, (_, i) => new Date(year, month, 1 - lead + i));
}

/** One filing row in the day pop-over (index.html dayRow). */
function DayRow({ e, onOpen }: { e: YearEvent; onOpen: (e: YearEvent) => void }) {
  const f = eventFiling(e);
  const proof = f.status === "Filed" ? (filingProofs(f).length ? <Chip tone="ok" dot={false}>Proof</Chip> : <Chip tone="warn">Proof pending</Chip>) : null;
  return (
    <ListRow onClick={() => onOpen(e)} className="gap-2 px-4 py-2.5 md:px-4">
      <Tag tone={AREA_TONE[e.kind]}>{e.kind}</Tag>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 truncate text-13 font-semibold">
          <span className="truncate">{e.name}</span>
          <PortalLink area={e.kind} name={e.name} />
        </span>
        <span className="block truncate text-12 text-muted">{e.period}</span>
      </span>
      {proof}
      <Chip tone={FILING_STATUS_TONE[e.status]}>{e.status}</Chip>
    </ListRow>
  );
}

function DayHead({ day, list }: { day: Date; list: YearEvent[] }) {
  const s = worst(list);
  const n = daysFrom(day);
  const when = n < 0 ? (s === "Filed" ? "done" : "overdue") : n <= 7 ? "due this week" : n <= 15 ? "due in 15 days" : "later";
  return (
    <span className="flex items-center gap-2.5">
      <DateTile date={day} />
      <span className="min-w-0">
        <b className="block text-13.5">
          {LONG_DOW[day.getDay()]} {day.getDate()} {LONG_MON[day.getMonth()]}
        </b>
        <span className={cn("block text-12 font-semibold", s === "Overdue" ? "text-bad" : s === "Due soon" ? "text-warn" : "text-muted")}>
          {list.length === 1 ? "1 filing" : `${list.length} filings`} · {when}
        </span>
      </span>
    </span>
  );
}

function MonthGrid({ year, month, events, onOpen }: { year: number; month: number; events: YearEvent[]; onOpen: (e: YearEvent) => void }) {
  const [openDay, setOpenDay] = React.useState<number | null>(null);
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
        const list = inMonth ? events.filter((e) => sameDay(e.date, day)) : [];
        const num = (
          <span className={cn("inline-grid h-6 min-w-6 place-items-center rounded-sm px-1 text-12 font-semibold", today ? "bg-accent-soft text-accent" : inMonth ? "text-ink-2" : "text-faint")} aria-current={today ? "date" : undefined}>
            {day.getDate()}
          </span>
        );
        const cell = cn("block h-full min-h-[64px] w-full min-w-0 border-b border-line-soft p-1 text-left md:min-h-[92px] md:p-1.5", i % 7 !== 0 && "border-l", !inMonth && "bg-raised");
        if (list.length === 0)
          return (
            <div key={day.getTime()} className={cell}>
              {num}
            </div>
          );
        const t = day.getTime();
        return (
          <PopoverCard
            key={t}
            open={openDay === t}
            onOpenChange={(v) => setOpenDay(v ? t : null)}
            width={340}
            align={i % 7 > 3 ? "end" : "start"}
            title={<DayHead day={day} list={list} />}
            trigger={
              <button type="button" className={cn(cell, "hover:bg-raised", openDay === t && "bg-accent-soft/60")} aria-label={`${fmt(day)} · ${list.length} filings`}>
                {num}
                <ul className="mt-1 hidden gap-1 md:grid">
                  {list.slice(0, 3).map((e) => (
                    <li key={e.id} className="min-w-0">
                      <Tag tone={FILING_STATUS_TONE[e.status]} className="flex w-full min-w-0">
                        <span className="min-w-0 truncate">{e.title}</span>
                      </Tag>
                    </li>
                  ))}
                  {list.length > 3 && <li className="text-11.5 font-semibold text-muted">+{list.length - 3} more</li>}
                </ul>
                <span className="mt-1 flex flex-wrap gap-0.5 md:hidden" aria-hidden>
                  {list.map((e) => (
                    <i key={e.id} className={cn("h-1.5 w-1.5 rounded-full", barFill[FILING_STATUS_BAR[e.status]])} />
                  ))}
                </span>
              </button>
            }
          >
            {list.map((e) => (
              <DayRow
                key={e.id}
                e={e}
                onOpen={(x) => {
                  setOpenDay(null);
                  onOpen(x);
                }}
              />
            ))}
          </PopoverCard>
        );
      })}
    </div>
  );
}

const listColumns: Column<YearEvent>[] = [
  { key: "date", label: "Due", width: 84, render: (e) => fmt(e.date) },
  {
    key: "title",
    label: "Filing",
    render: (e) => (
      <span className="inline-flex items-center gap-1 font-semibold">
        {e.title}
        <PortalLink area={e.kind} name={e.name} />
      </span>
    ),
  },
  { key: "kind", label: "Area", width: 110, render: (e) => <Tag tone={AREA_TONE[e.kind]}>{e.kind}</Tag> },
  { key: "authority", label: "Authority", width: 140, render: (e) => <span className="text-muted">{e.authority}</span> },
  { key: "status", label: "Status", width: 132, render: (e) => <Chip tone={FILING_STATUS_TONE[e.status]} fixed>{e.status}</Chip> },
];

/** Filing windows for the Timeline view: one lane per filing, grouped by area. */
function useWindows(events: YearEvent[]) {
  const [win, setWin] = React.useState<Record<string, { s: Date; e: Date }>>({});
  const hist = React.useRef<Array<Record<string, { s: Date; e: Date }>>>([]);
  const lanes: WindowLane[] = [];
  for (const a of CAL_AREAS) {
    const inArea = events.filter((e) => e.kind === a);
    if (!inArea.length) continue;
    lanes.push({ id: `g-${a}`, label: a, group: true });
    const names = Array.from(new Set(inArea.map((e) => e.name)));
    for (const n of names) {
      lanes.push({
        id: `l-${a}-${n}`,
        label: n,
        items: inArea
          .filter((e) => e.name === n)
          .map((e) => {
            const w = win[e.id];
            return { id: e.id, title: `${e.name} · ${e.period}`, due: e.date, start: w?.s ?? addDays(e.date, -PREP_DAYS[e.frequency]), end: w?.e ?? e.date, tone: FILING_STATUS_BAR[e.status], locked: e.status === "Filed" };
          }),
      });
    }
  }
  const change = (id: string, s: Date, e: Date) => {
    hist.current.push(win);
    setWin((w) => ({ ...w, [id]: { s, e } }));
  };
  const undo = () => {
    const prev = hist.current.pop();
    if (prev) setWin(prev);
  };
  return { lanes, change, undo };
}

/** Next deadline (index.html focusCard, variant A). */
function NextDeadline({ events, onOpen, onAdd }: { events: YearEvent[]; onOpen: (e: YearEvent) => void; onAdd: (e: YearEvent) => void }) {
  const next = events.find((e) => e.status !== "Filed" && e.date >= TODAY);
  if (!next) return null;
  const n = daysFrom(next.date);
  const f = eventFiling(next);
  const first = filingTrack(f)[0];
  const t = tile(next.date);
  return (
    <SectionCard title="Next deadline">
      <div className="flex items-center gap-3">
        <span className="grid h-[52px] w-12 flex-none place-content-center rounded-md bg-navy text-center text-white">
          <b className="text-[18px] leading-none">{t.day}</b>
          <small className="mt-0.5 text-11 font-semibold text-navy-ink">{DOW[next.date.getDay()]}</small>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-14 font-semibold">
            <span className="truncate">
              {next.name} · {next.period}
            </span>
            <PortalLink area={next.kind} name={next.name} />
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <Tag tone={AREA_TONE[next.kind]}>{next.kind}</Tag>
            <Chip tone={first.state === "done" ? "ok" : "warn"}>{first.state === "done" ? "Data received" : "Data from Northwind"}</Chip>
          </span>
        </span>
        <span className="flex-none text-right">
          <b className="block text-22 leading-none">{n}</b>
          <span className="text-11.5 font-semibold text-muted">{n === 1 ? "day left" : "days left"}</span>
        </span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="primary" size="sm" onClick={() => onOpen(next)}>
          Open
        </Button>
        <Button size="sm" onClick={() => onAdd(next)}>
          <CalendarPlus size={14} strokeWidth={1.5} /> Add to my calendar
        </Button>
      </div>
    </SectionCard>
  );
}

/** Coming up, grouped by date (index.html agendaRail). */
function Agenda({ events, onOpen }: { events: YearEvent[]; onOpen: (e: YearEvent) => void }) {
  const by = new Map<number, YearEvent[]>();
  for (const e of events) by.set(e.date.getTime(), [...(by.get(e.date.getTime()) ?? []), e]);
  const days = Array.from(by.entries()).slice(0, 7);
  return (
    <SectionCard title="Coming up" meta={events.length} flush>
      {days.length === 0 ? (
        <Empty />
      ) : (
        days.map(([t, list]) => {
          const date = new Date(t);
          const u = urgency(date);
          return (
            <div key={t} className={cn("flex gap-3 border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5", u === "bad" && "bg-bad-soft")}>
              <DateTile date={date} />
              <ul className="grid min-w-0 flex-1 gap-1.5">
                {list.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => onOpen(e)} className="flex w-full min-w-0 items-center gap-2 text-left hover:underline">
                      <Tag tone={AREA_TONE[e.kind]}>{e.kind}</Tag>
                      <span className="min-w-0 flex-1 truncate text-13 font-semibold">{e.name}</span>
                      <span className={cn("flex-none text-12", u === "bad" ? "font-semibold text-bad" : "text-muted")}>{relative(e.date)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </SectionCard>
  );
}

export function CalendarScreen() {
  const toast = useUndoToast();
  const [key, setKey] = React.useState(NOW_KEY);
  const [view, setView] = React.useState("month");
  const [area, setArea] = React.useState("all");
  const [open, setOpen] = React.useState<YearEvent | null>(null);
  const mi = Math.max(0, FY_MONTHS.findIndex((x) => x.key === key));
  const m = FY_MONTHS[mi];
  const areaEvents = YEAR_EVENTS.filter((e) => area === "all" || e.kind === area);
  const events = areaEvents.filter((e) => e.date.getFullYear() === m.year && e.date.getMonth() === m.month);
  const monthAll = YEAR_EVENTS.filter((e) => e.date.getFullYear() === m.year && e.date.getMonth() === m.month);
  const later = areaEvents.find((e) => e.date > new Date(m.year, m.month + 1, 0));
  const win = useWindows(areaEvents);
  const coming = areaEvents.filter((e) => e.status !== "Filed" && daysFrom(e.date) >= -7 && daysFrom(e.date) <= 30);
  const thisWeek = YEAR_EVENTS.filter((e) => e.status !== "Filed" && daysFrom(e.date) >= 0 && daysFrom(e.date) <= 7).length;
  const overdue = YEAR_EVENTS.filter((e) => e.status === "Overdue").length;
  const fyFiled = Math.round((YEAR_EVENTS.filter((e) => e.status === "Filed").length / YEAR_EVENTS.length) * 100);
  const add = (e: YearEvent) => toast.show(`${e.name} · ${e.period} added to your calendar`);

  const monthNav = (
    <span className="inline-flex items-center gap-0.5">
      <Button size="iconSm" variant="ghost" aria-label="Previous month" disabled={mi === 0} onClick={() => setKey(FY_MONTHS[mi - 1].key)}>
        <ChevronLeft size={16} strokeWidth={1.5} />
      </Button>
      <Select aria-label="Month" value={m.key} onChange={(e) => setKey(e.target.value)} options={FY_MONTHS.map((x) => ({ value: x.key, label: x.short }))} />
      <Button size="iconSm" variant="ghost" aria-label="Next month" disabled={mi === FY_MONTHS.length - 1} onClick={() => setKey(FY_MONTHS[mi + 1].key)}>
        <ChevronRight size={16} strokeWidth={1.5} />
      </Button>
    </span>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Phone (calMobile): three numbers above the calendar. */}
      <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-line bg-surface md:hidden">
        {[
          { v: thisWeek, l: "Due this week", c: "text-warn" },
          { v: overdue, l: "Overdue", c: "text-bad" },
          { v: `${fyFiled}%`, l: "FY filed", c: "text-ok" },
        ].map((x, i) => (
          <div key={x.l} className={cn("px-3 py-2.5", i > 0 && "border-l border-line-soft")}>
            <div className={cn("text-[20px] font-semibold leading-tight", x.c)}>{x.v}</div>
            <div className="truncate text-11.5 font-semibold text-muted">{x.l}</div>
          </div>
        ))}
      </div>
      <Cols>
        <Col>
          <SectionCard
            title="Deadlines"
            meta={<span className="hidden font-mono sm:inline">FY 2026-27</span>}
            flush
            right={
              <Tabs
                items={[
                  { key: "month", label: "Month" },
                  { key: "list", label: "List" },
                  { key: "year", label: "Year" },
                  { key: "timeline", label: "Timeline" },
                ]}
                value={view}
                onChange={setView}
              />
            }
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-4 py-2.5 md:px-5">
              {(view === "month" || view === "list") && monthNav}
              <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)} options={[{ value: "all", label: `All areas · ${YEAR_EVENTS.length}` }, ...CAL_AREAS.map((a) => ({ value: a, label: `${a} · ${YEAR_EVENTS.filter((e) => e.kind === a).length}` }))]} />
              <Button asChild size="sm" className="ml-auto">
                <Link href="/client/filings">
                  <FileText size={14} strokeWidth={1.5} /> Filings
                </Link>
              </Button>
            </div>
            {view === "month" && (
              <div className="relative">
                <MonthGrid year={m.year} month={m.month} events={events} onOpen={setOpen} />
                {events.length === 0 && area !== "all" && (
                  <div className="absolute inset-x-0 bottom-0 top-8 grid place-items-center bg-surface/80">
                    <div className="grid justify-items-center gap-2 text-center text-13">
                      <b>
                        No {area} deadlines in {LONG_MON[m.month]}
                      </b>
                      {later && (
                        <span className="text-muted">
                          Next: {later.name} on {fmt(later.date)}
                        </span>
                      )}
                      <Button size="sm" variant="primary" onClick={() => setArea("all")}>
                        Show all areas
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {view === "list" && <DataGrid inset columns={listColumns} rows={events} rowKey={(e) => e.id} onRowClick={setOpen} rowLate={(e) => e.status === "Overdue"} pageSize={10} empty="None" />}
            {view === "year" && (
              <YearGrid
                months={FY_MONTHS}
                marks={areaEvents.map((e) => ({ date: e.date, tone: FILING_STATUS_BAR[e.status], title: e.title }))}
                legend={RANK.map((s) => ({ tone: FILING_STATUS_BAR[s], label: s }))}
                onPick={(k) => {
                  setKey(k);
                  setView("month");
                }}
              />
            )}
            {view === "timeline" && (
              <FilingWindows
                start={new Date(FY_MONTHS[0].year, FY_MONTHS[0].month, 1)}
                end={new Date(FY_MONTHS[11].year, FY_MONTHS[11].month + 1, 0)}
                lanes={win.lanes}
                focus={new Date(2026, 9, 1)}
                onChange={(id, s, e) => {
                  win.change(id, s, e);
                  const ev = YEAR_EVENTS.find((x) => x.id === id);
                  toast.show(`${ev?.name ?? "Filing"} window · ${fmt(s)} to ${fmt(e)}${ev && e > ev.date ? " · ends after the due date" : ""}`, win.undo);
                }}
                onLocked={(it) => toast.show(`${it.title} is already filed, so its window is locked`)}
              />
            )}
          </SectionCard>
        </Col>
        <Col>
          <SectionCard title="Status this month" meta={m.short}>
            <Donut total={monthAll.length} title={LONG_MON[m.month]} segments={FILING_STATUSES.map((s) => ({ label: s, value: monthAll.filter((e) => e.status === s).length, tone: FILING_STATUS_BAR[s] }))} />
          </SectionCard>
          <NextDeadline events={areaEvents} onOpen={setOpen} onAdd={add} />
          <Agenda events={coming} onOpen={setOpen} />
        </Col>
      </Cols>
      <EventDialog event={open} onClose={() => setOpen(null)} onRemind={(t) => toast.show(t)} />
      {toast.node}
    </div>
  );
}
