"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STAFF_TODAY, daysFrom, fmt } from "@/lib/dates";
import type { FilingStatus } from "@/data/compliance";
import { AREA_SHORT, CAL_AREAS, CAL_FOCUS, CAL_TODAY, FY_MONTHS, PREP_DAYS, YEAR_EVENTS } from "@/data/compliance-year";
import { clientById, type StaffClient } from "@/data/staff-clients";
import { complianceClients, staffObHref, yearEventsFor, type StaffEvent } from "@/data/staff-compliance";
import type { BarTone } from "@/components/ui/Bar";
import { Select } from "@/components/ui/Select";
import { Tag } from "@/components/ui/Chip";
import { useUndoToast } from "@/components/ui/UndoToast";
import { YearGrid } from "@/components/cards/YearGrid";
import { FilingWindows, type WindowLane } from "@/components/cards/FilingWindows";
import { MonthCalendar, AreaShort, CalDateTile, CalStatusChip, CAL_STATUSES, worstStatus, type CalItem, type CalStatus } from "@/components/cards/MonthCalendar";
import { CalendarBar, monthKey, parseKey } from "@/components/cards/CalendarBar";
import { CalDonutCard, ComingUpCard, NextDeadlineCard } from "@/components/cards/CalendarRail";
import { ClientDot, type StaffPortal } from "./parts";
import { identityTag } from "./filters";
import { PortalLink } from "./comp-parts";

// Old staff calendar (reference/old-screens/s/lead/CompCal.dc.html): the client calendar with an
// "All companies" filter in front. Each day shows filing names, not client names.
// "All companies" is a copy of the client month (13 October filings, 8 Oct framed, the old rail), as in the old.
// One company shows its own staff data, as of 16 Oct.

const LONG_DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LONG_MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STC: Record<CalStatus, BarTone> = { Overdue: "bad", "Due soon": "warn", Filed: "ok", Upcoming: "idle" };
const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const nameOf = (e: StaffEvent) => e.title.split(" · ")[0];

/** The four old statuses on the staff day. A past date that is not overdue was filed by then. */
export function staffCalStatus(status: FilingStatus, date: Date, today = STAFF_TODAY): CalStatus {
  if (status === "Filed") return "Filed";
  if (status === "Overdue") return "Overdue";
  const n = daysFrom(date, today);
  if (n < 0) return "Filed";
  if (n <= 7) return "Due soon";
  return "Upcoming";
}

export interface StaffCalProps {
  /** Every event of FY 2026-27 for the clients this person sees. */
  events: StaffEvent[];
  clients: StaffClient[];
  client: string;
  onClient: (id: string) => void;
  /** Link for a filing; undefined when the filing has no record page. */
  hrefFor: (e: StaffEvent) => string | undefined;
  filingsHref?: string;
  today?: Date;
}

/** Client-style calendar for staff portals and the super admin. */
export function StaffCalendar({ events, clients, client, onClient, hrefFor, filingsHref, today: staffToday = STAFF_TODAY }: StaffCalProps) {
  const router = useRouter();
  const allMode = !client;
  const today = allMode ? CAL_TODAY : staffToday;
  const toast = useUndoToast();
  const nowKey = monthKey(today.getFullYear(), today.getMonth());
  const [key, setKey] = React.useState(nowKey);
  const [view, setView] = React.useState("month");
  const [area, setArea] = React.useState("all");
  const [reminded, setReminded] = React.useState(false);
  const [win, setWin] = React.useState<Record<string, { s: Date; e: Date }>>({});
  const hist = React.useRef<Array<Record<string, { s: Date; e: Date }>>>([]);

  const all = allMode
    ? YEAR_EVENTS.map((e) => ({ id: e.id, date: e.date, title: e.name, kind: e.kind, status: e.status, obligationId: e.obligationId, client: "", obKey: undefined as string | undefined, period: e.period as string | undefined, cal: e.status as CalStatus }))
    : events.map((e) => ({ ...e, period: undefined as string | undefined, cal: staffCalStatus(e.status, e.date, today) }));
  type Ev = (typeof all)[number];
  const { year, month } = parseKey(key);
  const inKey = (e: Ev, k: string) => {
    const p = parseKey(k);
    return e.date.getFullYear() === p.year && e.date.getMonth() === p.month;
  };
  const areaEvents = all.filter((e) => area === "all" || e.kind === area);
  const monthAll = all.filter((e) => inKey(e, key));
  const shown = areaEvents.filter((e) => inKey(e, key));
  const nowMonth = all.filter((e) => inKey(e, nowKey));
  const counted = view === "month" ? monthAll : all;
  const areas = [{ key: "all", label: "All", count: counted.length }, ...CAL_AREAS.map((a) => ({ key: a, label: a, count: counted.filter((e) => e.kind === a).length }))];

  /** One tag per filing name a day, with the worst status of its clients. */
  const items: CalItem[] = [];
  for (const e of shown) {
    const n = nameOf(e);
    const hit = items.find((x) => x.label === n && sameDay(x.date, e.date));
    if (hit) hit.status = worstStatus([hit, { status: e.cal }]);
    else items.push({ id: `${e.date.getTime()}-${n}`, date: e.date, label: n, status: e.cal });
  }

  const counts = Object.fromEntries(CAL_STATUSES.map((s) => [s, nowMonth.filter((e) => e.cal === s).length])) as Record<CalStatus, number>;
  const next = allMode ? all.find((e) => e.id === CAL_FOCUS.id) : all.find((e) => e.cal !== "Filed" && e.date >= today);
  const late = all.filter((e) => e.cal === "Overdue").sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  /** Coming up: one row per filing a day. Several clients on one filing show as a count. */
  const coming: Array<{ id: string; date: Date; kind: Ev["kind"]; name: string; cal: CalStatus; first: Ev }> = [];
  for (const e of allMode ? [] : all.filter((x) => x.date >= today)) {
    const n = nameOf(e);
    const hit = coming.find((x) => x.first && nameOf(x.first) === n && sameDay(x.date, e.date));
    if (hit) {
      hit.cal = worstStatus([{ status: hit.cal }, { status: e.cal }]);
      const k = all.filter((x) => nameOf(x) === n && sameDay(x.date, e.date)).length;
      hit.name = `${n} · ${k} clients`;
    } else coming.push({ id: e.id, date: e.date, kind: e.kind, name: `${n} · ${clientById(e.client)?.short ?? ""}`, cal: e.cal, first: e });
  }
  if (allMode) for (const e of all.filter((x) => x.date >= addDays(today, -1)).slice(0, 7)) coming.push({ id: e.id, date: e.date, kind: e.kind, name: nameOf(e), cal: e.cal, first: e });
  coming.splice(7);
  /** "All companies" rows have no client: they open the filings list. So does a filing without a record page. */
  const go = (e?: Ev) => {
    const h = e && ((e.client ? hrefFor(e) : undefined) ?? filingsHref);
    if (h) router.push(h);
  };

  /* Timeline: one lane per filing name, one window per due date. */
  const lanes: WindowLane[] = [];
  for (const a of CAL_AREAS) {
    const inArea = areaEvents.filter((e) => e.kind === a);
    if (!inArea.length) continue;
    lanes.push({ id: `g-${a}`, label: a, group: true });
    for (const n of Array.from(new Set(inArea.map(nameOf)))) {
      const dates = Array.from(new Set(inArea.filter((e) => nameOf(e) === n).map((e) => e.date.getTime())));
      lanes.push({
        id: `l-${a}-${n}`,
        label: n,
        items: dates.map((t) => {
          const due = new Date(t);
          const list = inArea.filter((e) => nameOf(e) === n && e.date.getTime() === t);
          const s = worstStatus(list.map((e) => ({ status: e.cal })));
          const id = `${a}-${n}-${t}`;
          const prep = PREP_DAYS[/Q\d|quarter/i.test(n) ? "Quarterly" : "Monthly"];
          return { id, title: `${n} · ${fmt(due)}`, due, start: win[id]?.s ?? addDays(due, -prep), end: win[id]?.e ?? due, tone: STC[s], locked: s === "Filed" };
        }),
      });
    }
  }

  const lead = <Select aria-label="Company" value={client} onChange={(e) => onClient(e.target.value)} className="flex-none" options={[{ value: "", label: "All companies" }, ...clients.map((c) => ({ value: c.id, label: c.short }))]} />;

  return (
    <div className="grid grid-cols-1 gap-4">
      <CalendarBar lead={lead} month={key} onMonth={setKey} now={nowKey} areas={areas} area={area} onArea={setArea} view={view} onView={setView} filingsHref={filingsHref} />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-md border-1.5 border-line bg-surface p-3">
          {view === "month" && (
            <MonthCalendar
              year={year}
              month={month}
              today={today}
              items={items}
              dayTitle={(day) => {
                const list = shown.filter((e) => sameDay(e.date, day));
                return (
                  <span className="flex items-center gap-2.5">
                    <CalDateTile date={day} status={worstStatus(list.map((e) => ({ status: e.cal })))} className="h-11 w-10" />
                    <span className="min-w-0">
                      <b className="block text-14 font-medium">
                        {LONG_DOW[day.getDay()]} {day.getDate()} {LONG_MON[day.getMonth()]}
                      </b>
                      <span className="block text-12 text-muted">{list.length === 1 ? "1 filing" : `${list.length} filings`}</span>
                    </span>
                  </span>
                );
              }}
              dayBody={(day) => (
                <ul>
                  {shown
                    .filter((e) => sameDay(e.date, day))
                    .map((e) => {
                      const c = clientById(e.client);
                      const h = e.client ? hrefFor(e) : filingsHref;
                      const inner = (
                        <>
                          <AreaShort>{AREA_SHORT[e.kind]}</AreaShort>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-13.5 font-medium">{e.title}</span>
                            <span className="flex min-w-0 items-center gap-1.5 text-12 text-muted">
                              {c && <ClientDot tone={c.tone} />}
                              <span className="truncate">{c?.short ?? e.period}</span>
                            </span>
                          </span>
                          <CalStatusChip status={e.cal} />
                        </>
                      );
                      return (
                        <li key={e.id} className="border-t border-line-soft first:border-t-0">
                          {h ? (
                            <Link href={h} className="flex items-center gap-2 px-4 py-2 hover:bg-hover">
                              {inner}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2">{inner}</div>
                          )}
                        </li>
                      );
                    })}
                </ul>
              )}
            />
          )}
          {view === "year" && (
            <YearGrid
              months={FY_MONTHS}
              today={today}
              marks={areaEvents.map((e) => ({ date: e.date, tone: STC[e.cal], title: nameOf(e) }))}
              legend={(["Overdue", "Due soon", "Filed", "Upcoming"] as CalStatus[]).map((s) => ({ tone: STC[s], label: s }))}
              onPick={(k) => {
                setKey(k);
                setView("month");
              }}
            />
          )}
          {view === "timeline" && (
            <FilingWindows
              start={new Date(2026, 8, 1)}
              end={new Date(2027, 2, 31)}
              lanes={lanes}
              focus={new Date(2026, 9, 1)}
              today={today}
              onChange={(id, s, e) => {
                hist.current.push(win);
                setWin((w) => ({ ...w, [id]: { s, e } }));
                toast.show(`Window · ${fmt(s)} to ${fmt(e)}`, () => {
                  const prev = hist.current.pop();
                  if (prev) setWin(prev);
                });
              }}
              onLocked={(it) => toast.show(`${it.title} is already filed, so its window is locked`)}
            />
          )}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
          <CalDonutCard counts={counts} label={LONG_MON[today.getMonth()]} />
          {next && (
            <NextDeadlineCard
              next={{
                days: daysFrom(next.date, today),
                title: allMode ? `${CAL_FOCUS.name} · ${CAL_FOCUS.period}` : next.title,
                link: <PortalLink area={next.kind} />,
                area: AREA_SHORT[next.kind],
                areaTitle: next.kind,
                state: allMode || next.status === "In progress" ? { label: "Data received", tone: "ok" } : { label: `Data from ${clientById(next.client)?.short ?? "client"}`, tone: "warn" },
                extra: clientById(next.client) && <Tag tone={identityTag[clientById(next.client)!.tone]} className="h-5 px-1.5 text-11.5">{clientById(next.client)!.short}</Tag>,
                late: late
                  ? {
                      name: allMode ? late.title : `${late.title} · ${clientById(late.client)?.short ?? ""}`,
                      text: `${-daysFrom(late.date, today)} day${-daysFrom(late.date, today) === 1 ? "" : "s"} late`,
                      onClick: () => go(late),
                    }
                  : undefined,
              }}
              onOpen={() => go(next)}
              onTile={() => go(next)}
              onRemind={() => {
                setReminded(true);
                toast.show(`Reminder set for ${next.title} · due ${fmt(next.date)}`);
              }}
              reminded={reminded}
            />
          )}
          <div className="md:col-span-2 lg:col-span-1">
            <ComingUpCard
              items={coming.map((e) => ({ id: e.id, date: e.date, area: AREA_SHORT[e.kind], areaTitle: e.kind, name: e.name, status: e.cal }))}
              onPick={(id) => go(coming.find((e) => e.id === id)?.first)}
            />
          </div>
        </div>
      </div>
      {toast.node}
    </div>
  );
}

export function CalendarScreen({ portal }: { portal: StaffPortal }) {
  const [client, setClient] = React.useState("");
  const clients = complianceClients(portal);
  return (
    <StaffCalendar
      events={yearEventsFor(portal, client)}
      clients={clients}
      client={client}
      onClient={setClient}
      hrefFor={(e) => (e.obKey ? staffObHref(portal, e.obKey) : undefined)}
      filingsHref={`/${portal}/compliances/filings`}
    />
  );
}

