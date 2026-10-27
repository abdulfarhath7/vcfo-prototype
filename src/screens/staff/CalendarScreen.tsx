"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, d, daysFrom, fmt, relative, urgency } from "@/lib/dates";
import { AREAS, AREA_TONE, CALENDAR_MONTHS, FILING_STATUSES, FILING_STATUS_BAR, FILING_STATUS_TONE, type Area, type FilingStatus } from "@/data/compliance";
import { clientById } from "@/data/staff-clients";
import { calendarFor, complianceClients, staffObHref, yearEventsFor, type StaffEvent } from "@/data/staff-compliance";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { barFill } from "@/components/ui/Bar";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { Donut } from "@/components/cards/Donut";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { ClientDot, ClientName, type StaffPortal } from "./parts";
import { ClientSelect } from "./filters";
import { PortalLink } from "./comp-parts";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Worst first: the day badge takes the tint of the worst status. */
const WORST: FilingStatus[] = ["Overdue", "Due soon", "In progress", "Upcoming", "Filed"];
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const worst = (evs: StaffEvent[]) => WORST.find((s) => evs.some((e) => e.status === s)) ?? "Upcoming";
/** FY 2026-27: April 2026 to March 2027. */
const FY_MONTHS = Array.from({ length: 12 }, (_, i) => ({ year: i < 9 ? 2026 : 2027, month: (i + 3) % 12 }));
/** Days to prepare before the due date, by frequency (old timeline windows). */
const PREP: Record<string, number> = { Monthly: 5, Quarterly: 10, "Half-yearly": 12, Annual: 20, Event: 5 };

function gridDays(year: number, month: number) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: Math.ceil((lead + count) / 7) * 7 }, (_, i) => new Date(year, month, 1 - lead + i));
}

/** Events of one day, one badge per client. */
function byClient(list: StaffEvent[]) {
  const map = new Map<string, StaffEvent[]>();
  for (const e of list) map.set(e.client, [...(map.get(e.client) ?? []), e]);
  return [...map.entries()].map(([client, evs]) => ({ client, evs, status: worst(evs) }));
}

/** Old day pop-over: each filing of the day with its client and status. */
function DayList({ evs, portal }: { evs: StaffEvent[]; portal: StaffPortal }) {
  return (
    <ul>
      {evs.map((e) => {
        const c = clientById(e.client);
        const inner = (
          <>
            {c && <ClientDot tone={c.tone} />}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-13 font-semibold">{e.title}</span>
              <span className="block truncate text-12 text-muted">
                {c?.short} · {e.kind}
              </span>
            </span>
            <Chip tone={FILING_STATUS_TONE[e.status]}>{e.status}</Chip>
          </>
        );
        return (
          <li key={e.id} className="border-t border-line-soft first:border-t-0">
            {e.obKey ? (
              <Link href={staffObHref(portal, e.obKey)} className="flex items-center gap-2.5 px-4 py-2 hover:bg-raised">
                {inner}
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-2">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MonthGrid({ year, month, events, portal }: { year: number; month: number; events: StaffEvent[]; portal: StaffPortal }) {
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
        const evs = inMonth ? events.filter((e) => sameDay(e.date, day)) : [];
        const groups = byClient(evs);
        const cell = (
          <>
            <span className={cn("inline-grid h-6 min-w-6 place-items-center rounded-sm px-1 text-12 font-semibold", today ? "bg-accent-soft text-accent" : inMonth ? "text-ink-2" : "text-faint")} aria-current={today ? "date" : undefined}>
              {day.getDate()}
            </span>
            {groups.length > 0 && (
              <>
                <ul className="mt-1 hidden gap-1 md:grid">
                  {groups.slice(0, 3).map((g) => {
                    const c = clientById(g.client);
                    return (
                      <li key={g.client} className="min-w-0">
                        <Tag tone={FILING_STATUS_TONE[g.status]} className="flex w-full min-w-0 gap-1.5">
                          {c && <ClientDot tone={c.tone} />}
                          <span className="min-w-0 flex-1 truncate text-left">{c?.short}</span>
                          {g.evs.length > 1 && <span className="flex-none">{g.evs.length}</span>}
                        </Tag>
                      </li>
                    );
                  })}
                  {groups.length > 3 && <li className="text-11.5 font-semibold text-muted">+{groups.length - 3} more</li>}
                </ul>
                <span className="mt-1 flex flex-wrap gap-0.5 md:hidden" aria-hidden>
                  {groups.map((g) => (
                    <i key={g.client} className={cn("h-1.5 w-1.5 rounded-full", barFill[FILING_STATUS_BAR[g.status]])} />
                  ))}
                </span>
              </>
            )}
          </>
        );
        const cls = cn("block min-h-[64px] min-w-0 border-b border-line-soft p-1 text-left md:min-h-[92px] md:p-1.5", i % 7 !== 0 && "border-l", !inMonth && "bg-raised");
        if (evs.length === 0) return <div key={day.getTime()} className={cls}>{cell}</div>;
        return (
          <PopoverCard
            key={day.getTime()}
            width={320}
            title={`${fmt(day)} · ${evs.length} filing${evs.length > 1 ? "s" : ""}`}
            trigger={
              <button type="button" className={cn(cls, "hover:bg-raised")} aria-label={`${fmt(day)}, ${evs.length} filings`}>
                {cell}
              </button>
            }
          >
            <DayList evs={evs} portal={portal} />
          </PopoverCard>
        );
      })}
    </div>
  );
}

/** Old Year view: twelve small months. A day with filings takes the colour of its worst status. */
function YearGrid({ events, onPick }: { events: StaffEvent[]; onPick: (key: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 border-t border-line-soft px-4 py-4 sm:grid-cols-2 md:px-5 xl:grid-cols-3">
      {FY_MONTHS.map(({ year, month }) => {
        const mine = events.filter((e) => e.date.getFullYear() === year && e.date.getMonth() === month);
        const key = `${year}-${String(month + 1).padStart(2, "0")}`;
        const canOpen = CALENDAR_MONTHS.some((m) => m.key === key);
        const counts = (["Overdue", "Due soon", "Filed", "Upcoming"] as FilingStatus[]).map((s) => [s, mine.filter((e) => e.status === s).length] as const).filter(([, n]) => n > 0);
        return (
          <div key={key} className="rounded-md border border-line p-3">
            <div className="mb-2 flex items-center gap-2">
              {canOpen ? (
                <button type="button" onClick={() => onPick(key)} className="text-13 font-semibold hover:text-accent hover:underline">
                  {MON[month]} {year}
                </button>
              ) : (
                <b className="text-13 font-semibold">
                  {MON[month]} {year}
                </b>
              )}
              <span className="ml-auto text-12 text-faint">{mine.length}</span>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-11 leading-5">
              {gridDays(year, month).map((day) => {
                if (day.getMonth() !== month) return <span key={day.getTime()} />;
                const evs = mine.filter((e) => sameDay(e.date, day));
                const w = evs.length ? worst(evs) : undefined;
                return (
                  <span
                    key={day.getTime()}
                    title={evs.length ? `${fmt(day)} · ${evs.slice(0, 3).map((e) => e.title).join(", ")}${evs.length > 3 ? ` +${evs.length - 3}` : ""}` : undefined}
                    className={cn("rounded-[3px]", w ? cn(barFill[FILING_STATUS_BAR[w]], "font-semibold text-white") : "text-muted", sameDay(day, TODAY) && "ring-1 ring-accent")}
                  >
                    {day.getDate()}
                  </span>
                );
              })}
            </div>
            {counts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2.5 text-11.5 text-muted">
                {counts.map(([s, n]) => (
                  <span key={s} className="inline-flex items-center gap-1">
                    <i className={cn("h-[7px] w-[7px] rounded-[2px]", barFill[FILING_STATUS_BAR[s]])} aria-hidden />
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const TL_START = d(2026, 9, 1);
const TL_END = d(2027, 3, 31);
const TL_DAYS = daysFrom(TL_END, TL_START);

/** Old Timeline view: each filing as a window that ends on its due date, Sep to Mar. Grouped by area. */
function Timeline({ events }: { events: StaffEvent[] }) {
  const inRange = events.filter((e) => e.date >= TL_START && e.date <= TL_END);
  const lanes = AREAS.flatMap((a) => {
    const names = [...new Set(inRange.filter((e) => e.kind === a).map((e) => e.title.split(" · ")[0]))];
    return names.length ? [{ area: a, names }] : [];
  });
  const x = (date: Date) => `${(Math.max(0, daysFrom(date, TL_START)) / TL_DAYS) * 100}%`;
  const months = Array.from({ length: 7 }, (_, i) => d(2026, 9 + i, 1));
  return (
    <div className="overflow-x-auto border-t border-line-soft">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[180px_minmax(0,1fr)] border-b border-line-soft">
          <span />
          <div className="relative h-7">
            {months.map((m) => (
              <span key={m.getTime()} className="absolute top-1.5 border-l border-line-soft pl-1.5 text-11.5 font-semibold text-faint" style={{ left: x(m) }}>
                {MON[m.getMonth()]} {m.getFullYear()}
              </span>
            ))}
          </div>
        </div>
        {lanes.map((l) => (
          <React.Fragment key={l.area}>
            <div className="bg-raised px-4 py-1 text-11.5 font-semibold text-faint">{l.area}</div>
            {l.names.map((n) => {
              const evs = inRange.filter((e) => e.kind === l.area && e.title.split(" · ")[0] === n);
              const freq = evs.length > 4 ? "Monthly" : evs.length > 1 ? "Quarterly" : "Annual";
              const days = [...new Set(evs.map((e) => e.date.getTime()))].map((t) => new Date(t));
              return (
                <div key={n} className="grid h-8 grid-cols-[180px_minmax(0,1fr)] items-center border-b border-line-soft">
                  <span className="truncate px-4 text-12.5">{n}</span>
                  <div className="relative h-full">
                    <span className="absolute inset-y-0 w-px bg-brand" style={{ left: x(TODAY) }} aria-hidden />
                    {days.map((day) => {
                      const st = worst(evs.filter((e) => sameDay(e.date, day)));
                      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate() - PREP[freq]);
                      return (
                        <span
                          key={day.getTime()}
                          title={`${n} · ${fmt(start)} to ${fmt(day)} · ${st}`}
                          className={cn("absolute top-1/2 h-3 -translate-y-1/2 rounded-[3px]", barFill[FILING_STATUS_BAR[st]])}
                          style={{ left: x(start), width: `max(6px, ${(PREP[freq] / TL_DAYS) * 100}%)` }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/** Old "Next deadline" card: days left, the filing, its area, Open and Remind me. The worst late item shows under it. */
function NextDeadline({ events, portal }: { events: StaffEvent[]; portal: StaffPortal }) {
  const [remind, setRemind] = React.useState<Record<string, true>>({});
  const next = events.find((e) => e.status !== "Filed" && e.date >= TODAY);
  const late = events.filter((e) => e.status === "Overdue").sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  if (!next) return null;
  const c = clientById(next.client);
  const n = daysFrom(next.date);
  return (
    <SectionCard title="Next deadline" icon={{ Icon: Clock, tone: "teal" }} flush>
      <div className="flex items-start gap-4 px-4 py-4 md:px-5">
        <span className={cn("grid w-14 flex-none place-items-center rounded-md py-1.5 leading-none", n <= 7 ? "bg-warn-soft text-warn" : "bg-accent-soft text-accent")}>
          <b className="text-22 font-semibold">{n}</b>
          <span className="mt-1 text-[10.5px] font-semibold tracking-wider">{n === 1 ? "DAY" : "DAYS"}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            <b className="truncate text-14 font-semibold">{next.title}</b>
            <PortalLink area={next.kind} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-12.5 text-muted">
            {c && <ClientName id={c.id} short />}
            <Tag tone={AREA_TONE[next.kind]}>{next.kind}</Tag>
            <Chip tone={FILING_STATUS_TONE[next.status]}>{next.status === "In progress" ? "Data received" : next.status}</Chip>
          </div>
          <p className="mt-1 text-12.5 text-muted">Due {fmt(next.date)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line-soft px-4 py-3 md:px-5">
        {next.obKey && (
          <Button size="sm" variant="primary" asChild>
            <Link href={staffObHref(portal, next.obKey)}>Open filing</Link>
          </Button>
        )}
        {remind[next.id] ? (
          <Chip tone="ok">Reminder set</Chip>
        ) : (
          <Button size="sm" onClick={() => setRemind({ ...remind, [next.id]: true })}>
            Remind me
          </Button>
        )}
      </div>
      {late && (
        <ListRow href={late.obKey ? staffObHref(portal, late.obKey) : undefined} className="bg-bad-soft hover:bg-bad-soft">
          <i className="h-2 w-2 flex-none rounded-full bg-bad" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-semibold">
            {late.title} · {clientById(late.client)?.short}
          </span>
          <span className="flex-none text-12.5 font-semibold text-bad">{-daysFrom(late.date)} days late</span>
        </ListRow>
      )}
    </SectionCard>
  );
}

const listColumns: Column<StaffEvent>[] = [
  { key: "date", label: "Due", width: 84, render: (e) => fmt(e.date) },
  { key: "client", label: "Client", width: 150, render: (e) => <ClientName id={e.client} short /> },
  {
    key: "title",
    label: "Filing",
    render: (e) => (
      <span className="flex items-center gap-1 font-semibold">
        {e.title}
        <PortalLink area={e.kind} />
      </span>
    ),
  },
  { key: "kind", label: "Area", width: 110, render: (e) => <Tag tone={AREA_TONE[e.kind]}>{e.kind}</Tag> },
  { key: "status", label: "Status", width: 132, render: (e) => <Chip tone={FILING_STATUS_TONE[e.status]} fixed>{e.status}</Chip> },
];

export function CalendarScreen({ portal }: { portal: StaffPortal }) {
  const [key, setKey] = React.useState("2026-10");
  const [view, setView] = React.useState("month");
  const [client, setClient] = React.useState("");
  const [area, setArea] = React.useState<"" | Area>("");
  const [status, setStatus] = React.useState<"" | FilingStatus>("");
  const mi = Math.max(0, CALENDAR_MONTHS.findIndex((x) => x.key === key));
  const m = CALENDAR_MONTHS[mi];
  const keep = (e: StaffEvent) => (!area || e.kind === area) && (!status || e.status === status);
  const all = calendarFor(portal, client);
  const monthAll = all.filter((e) => e.date.getFullYear() === m.year && e.date.getMonth() === m.month);
  const events = monthAll.filter(keep);
  const year = yearEventsFor(portal, client).filter(keep);
  const href = (e: StaffEvent) => (e.obKey ? staffObHref(portal, e.obKey) : undefined);

  const coming: AttentionRow[] = all
    .filter((e) => e.status !== "Filed" && daysFrom(e.date) <= 15)
    .slice(0, 10)
    .map((e) => ({ id: e.id, date: e.date, title: e.title, sub: `${clientById(e.client)?.short} · ${e.kind}`, chip: { label: relative(e.date), tone: urgency(e.date) }, urgent: e.date < TODAY, href: href(e) }));

  const views = [
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
    { key: "timeline", label: "Timeline" },
    { key: "list", label: "List" },
  ];
  const areaOpts = [{ value: "", label: `All areas · ${monthAll.length}` }, ...AREAS.map((a) => ({ value: a, label: `${a} · ${monthAll.filter((e) => e.kind === a).length}` }))];

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Deadlines"
          meta="FY 2026-27"
          flush
          right={
            <>
              <ClientSelect clients={complianceClients(portal)} value={client} onChange={setClient} />
              <Tabs items={views} value={view} onChange={setView} className="hidden md:inline-flex" />
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-4 px-4 py-4 md:px-5">
            <Donut total={events.length} title={m.label} segments={FILING_STATUSES.map((s) => ({ label: s, value: events.filter((e) => e.status === s).length, tone: FILING_STATUS_BAR[s] }))} />
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <span className="inline-flex items-center gap-1">
                <Button size="iconSm" variant="ghost" disabled={mi === 0} onClick={() => setKey(CALENDAR_MONTHS[mi - 1].key)} aria-label="Previous month">
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </Button>
                <Select aria-label="Month" value={key} onChange={(e) => setKey(e.target.value)} options={CALENDAR_MONTHS.map((x) => ({ value: x.key, label: x.short }))} />
                <Button size="iconSm" variant="ghost" disabled={mi === CALENDAR_MONTHS.length - 1} onClick={() => setKey(CALENDAR_MONTHS[mi + 1].key)} aria-label="Next month">
                  <ChevronRight size={16} strokeWidth={1.5} />
                </Button>
              </span>
              <Select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value as "" | Area)} options={areaOpts} />
              <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as "" | FilingStatus)} options={[{ value: "", label: "All statuses" }, ...FILING_STATUSES.map((s) => ({ value: s, label: s }))]} />
              <Button size="sm" asChild>
                <Link href={`/${portal}/compliances/filings`}>Filings</Link>
              </Button>
              <Tabs items={views} value={view} onChange={setView} className="md:hidden" />
            </div>
          </div>
          {view === "month" && <MonthGrid year={m.year} month={m.month} events={events} portal={portal} />}
          {view === "year" && (
            <YearGrid
              events={year}
              onPick={(k) => {
                setKey(k);
                setView("month");
              }}
            />
          )}
          {view === "timeline" && <Timeline events={year} />}
          {view === "list" && (
            <div className="border-t border-line-soft">
              <DataGrid inset columns={listColumns} rows={events} rowKey={(e) => e.id} rowHref={href} rowLate={(e) => e.status === "Overdue"} pageSize={12} />
            </div>
          )}
        </SectionCard>
      </Col>
      <Col>
        <NextDeadline events={all} portal={portal} />
        <SectionCard title="Coming up" meta={coming.length || undefined} flush>
          <AttentionList rows={coming} />
        </SectionCard>
      </Col>
    </Cols>
  );
}
