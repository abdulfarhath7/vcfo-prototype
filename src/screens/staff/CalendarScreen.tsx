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
import { Chip, Tag, toneFor } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { YearGrid } from "@/components/cards/YearGrid";
import { FilingWindows, type WindowLane } from "@/components/cards/FilingWindows";
import { MonthCalendar, AreaShort, CalDateTile, CalStatusChip, CAL_STATUSES, worstStatus, type CalItem, type CalStatus } from "@/components/cards/MonthCalendar";
import { CalendarBar, monthKey, parseKey } from "@/components/cards/CalendarBar";
import { CalDonutCard, ComingUpCard, NextDeadlineCard, type NextDeadline } from "@/components/cards/CalendarRail";
import { STAFF_TASKS, taskHref, type NsTask } from "@/data/compliance-tasks";
import { catTabs, showStat, showTasks, taskCal, taskChip, taskHint, type CatFilter } from "@/data/compliance-tasks-views";
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
  /** Link for a non-statutory task (C-3). */
  taskHrefFor: (t: NsTask) => string;
  filingsHref?: string;
  today?: Date;
}

/** One row of the rail's "Coming up": a filing or a task, with what a click opens. */
interface Coming {
  id: string;
  date: Date;
  kind: string;
  name: string;
  cal: CalStatus;
  task?: boolean;
  hint?: string;
  open: () => void;
  match: (name: string, date: Date) => boolean;
}

/** Client-style calendar for staff portals and the super admin. */
export function StaffCalendar({ events, clients, client, onClient, hrefFor, taskHrefFor, filingsHref, today: staffToday = STAFF_TODAY }: StaffCalProps) {
  const router = useRouter();
  const allMode = !client;
  const today = allMode ? CAL_TODAY : staffToday;
  const toast = useUndoToast();
  const nowKey = monthKey(today.getFullYear(), today.getMonth());
  const [key, setKey] = React.useState(nowKey);
  const [view, setView] = React.useState("month");
  const [area, setArea] = React.useState("all");
  const [cat, setCat] = React.useState<CatFilter>("all");
  const [reminded, setReminded] = React.useState(false);
  const [win, setWin] = React.useState<Record<string, { s: Date; e: Date }>>({});
  const hist = React.useRef<Array<Record<string, { s: Date; e: Date }>>>([]);

  const all = allMode
    ? YEAR_EVENTS.map((e) => ({
        id: e.id,
        date: e.date,
        title: e.name,
        kind: e.kind,
        status: e.status,
        obligationId: e.obligationId,
        client: "",
        obKey: undefined as string | undefined,
        period: e.period as string | undefined,
        cal: e.status as CalStatus,
      }))
    : events.map((e) => ({ ...e, period: undefined as string | undefined, cal: staffCalStatus(e.status, e.date, today) }));
  type Ev = (typeof all)[number];
  /* C-3: the non-statutory tasks of the clients in scope, on their end date. Their status is as of the staff day. */
  const ids = new Set(clients.map((c) => c.id));
  const allTasks = STAFF_TASKS.filter((t) => ids.has(t.client) && (!client || t.client === client)).map((t) => ({ t, date: t.end, cal: taskCal(t, staffToday) as CalStatus }));
  type Tk = (typeof allTasks)[number];
  const { year, month } = parseKey(key);
  const inKey = (e: { date: Date }, k: string) => {
    const p = parseKey(k);
    return e.date.getFullYear() === p.year && e.date.getMonth() === p.month;
  };
  /* C-4: the filter applies to every view and to the rail. Tasks have no area, so an area pick hides them. */
  const stats = showStat(cat) ? all : [];
  const tasks = showTasks(cat) && area === "all" ? allTasks : [];
  const areaEvents = stats.filter((e) => area === "all" || e.kind === area);
  const monthAll = stats.filter((e) => inKey(e, key));
  const shown = areaEvents.filter((e) => inKey(e, key));
  const shownTasks = tasks.filter((e) => inKey(e, key));
  const nowMonth = stats.filter((e) => inKey(e, nowKey));
  const nowTasks = tasks.filter((e) => inKey(e, nowKey));
  /* C-1 counts: the month on screen in Month view, the whole year in Year and Timeline, as the area counts. */
  const counted = view === "month" ? monthAll : stats;
  const areas = [{ key: "all", label: "All", count: counted.length }, ...CAL_AREAS.map((a) => ({ key: a, label: a, count: counted.filter((e) => e.kind === a).length }))];
  const catScope = (list: Array<{ date: Date }>) => (view === "month" ? list.filter((e) => inKey(e, key)) : list).length;
  const cats = catTabs(catScope(all), catScope(allTasks));

  /** One tag per filing name a day, with the worst status of its clients. Tasks the same, with the hollow mark. */
  const items: CalItem[] = [];
  for (const e of shown) {
    const n = nameOf(e);
    const hit = items.find((x) => !x.task && x.label === n && sameDay(x.date, e.date));
    if (hit) hit.status = worstStatus([hit, { status: e.cal }]);
    else items.push({ id: `${e.date.getTime()}-${n}`, date: e.date, label: n, status: e.cal });
  }
  for (const e of shownTasks) {
    const hit = items.find((x) => x.task && x.label === e.t.name && sameDay(x.date, e.date));
    if (hit) {
      hit.status = worstStatus([hit, { status: e.cal }]);
      const list = shownTasks.filter((x) => x.t.name === e.t.name && sameDay(x.date, e.date));
      hit.hint = `Starts ${fmt(list[0].t.start)} · ${Array.from(new Set(list.map((x) => x.t.urgency))).join(", ")} · ${list.length} clients`;
    } else items.push({ id: `t-${e.date.getTime()}-${e.t.name}`, date: e.date, label: e.t.name, status: e.cal, task: true, hint: taskHint(e.t) });
  }

  const counts = Object.fromEntries(CAL_STATUSES.map((s) => [s, nowMonth.filter((e) => e.cal === s).length + nowTasks.filter((e) => e.cal === s).length])) as Record<
    CalStatus,
    number
  >;
  const nextStat = !stats.length ? undefined : allMode ? stats.find((e) => e.id === CAL_FOCUS.id) : stats.find((e) => e.cal !== "Filed" && e.date >= today);
  const nextTask = tasks.filter((e) => e.t.stage !== "completed" && e.date >= staffToday).sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  /** All: the earlier of the next filing and the next task. */
  const next: { stat: Ev } | { task: Tk } | undefined = nextStat && (!nextTask || nextStat.date <= nextTask.date) ? { stat: nextStat } : nextTask ? { task: nextTask } : undefined;
  const lateStat = stats.filter((e) => e.cal === "Overdue").sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const lateTask = tasks.filter((e) => e.cal === "Overdue").sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  /** "All companies" rows have no client: they open the filings list. So does a filing without a record page. */
  const go = (e?: Ev) => {
    const h = e && ((e.client ? hrefFor(e) : undefined) ?? filingsHref);
    if (h) router.push(h);
  };
  const goTask = (t: NsTask) => router.push(taskHrefFor(t));

  /** Coming up: one row per filing a day. Several clients on one filing show as a count. Tasks the same. */
  const coming: Coming[] = [];
  const addComing = (c: Coming, n: string) => {
    const hit = coming.find((x) => !!x.task === !!c.task && x.match(n, c.date));
    if (!hit) {
      coming.push(c);
      return;
    }
    hit.cal = worstStatus([{ status: hit.cal }, { status: c.cal }]);
    const k = (c.task ? tasks.filter((x) => x.t.name === n && sameDay(x.date, c.date)) : stats.filter((x) => nameOf(x) === n && sameDay(x.date, c.date))).length;
    hit.name = `${n} · ${k} clients`;
  };
  const same = (n: string, date: Date) => (m: string, d2: Date) => m === n && sameDay(d2, date);
  if (allMode)
    for (const e of stats.filter((x) => x.date >= addDays(today, -1)).slice(0, 7))
      coming.push({ id: e.id, date: e.date, kind: e.kind, name: nameOf(e), cal: e.cal, open: () => go(e), match: same(nameOf(e), e.date) });
  else
    for (const e of stats.filter((x) => x.date >= today))
      addComing(
        { id: e.id, date: e.date, kind: e.kind, name: `${nameOf(e)} · ${clientById(e.client)?.short ?? ""}`, cal: e.cal, open: () => go(e), match: same(nameOf(e), e.date) },
        nameOf(e),
      );
  for (const e of tasks.filter((x) => x.t.stage !== "completed" && x.date >= staffToday).sort((a, b) => a.date.getTime() - b.date.getTime()))
    addComing(
      {
        id: e.t.id,
        date: e.date,
        kind: "Task",
        name: `${e.t.name} · ${clientById(e.t.client)?.short ?? ""}`,
        cal: e.cal,
        task: true,
        hint: taskHint(e.t),
        open: () => goTask(e.t),
        match: same(e.t.name, e.date),
      },
      e.t.name,
    );
  coming.sort((a, b) => a.date.getTime() - b.date.getTime());
  coming.splice(7);

  /* Timeline: one lane per filing name, one window per due date. Tasks: one lane per task name, the start to end window. */
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
  if (tasks.length) {
    lanes.push({ id: "g-ns", label: "Non-statutory", group: true });
    for (const n of Array.from(new Set(tasks.map((e) => e.t.name)))) {
      lanes.push({
        id: `l-ns-${n}`,
        label: n,
        items: tasks
          .filter((e) => e.t.name === n)
          .map((e) => {
            const id = `ns-${e.t.id}`;
            return {
              id,
              title: `${n} · ${clientById(e.t.client)?.short ?? ""} · ${taskHint(e.t)}`,
              due: e.t.end,
              start: win[id]?.s ?? e.t.start,
              end: win[id]?.e ?? e.t.end,
              tone: STC[e.cal],
              locked: e.t.stage === "completed",
            };
          }),
      });
    }
  }

  const nextCard: NextDeadline | undefined = !next
    ? undefined
    : "task" in next
      ? {
          days: daysFrom(next.task.date, staffToday),
          title: next.task.t.name,
          area: "Task",
          areaTitle: taskHint(next.task.t),
          task: true,
          openLabel: "Open task",
          state: {
            label: next.task.t.stage === "waiting" ? `Data from ${clientById(next.task.t.client)?.short ?? "client"}` : taskChip(next.task.t, staffToday),
            tone: next.task.t.stage === "waiting" ? "warn" : "idle",
          },
          extra: clientTag(next.task.t.client),
        }
      : {
          days: daysFrom(next.stat.date, today),
          title: allMode ? `${CAL_FOCUS.name} · ${CAL_FOCUS.period}` : next.stat.title,
          link: <PortalLink area={next.stat.kind} />,
          area: AREA_SHORT[next.stat.kind],
          areaTitle: next.stat.kind,
          state:
            allMode || next.stat.status === "In progress"
              ? { label: "Data received", tone: "ok" }
              : { label: `Data from ${clientById(next.stat.client)?.short ?? "client"}`, tone: "warn" },
          extra: clientTag(next.stat.client),
        };
  if (nextCard) {
    const late = lateStat && (!lateTask || lateStat.date <= lateTask.date) ? lateStat : undefined;
    if (late) {
      const n = -daysFrom(late.date, today);
      nextCard.late = {
        name: allMode ? late.title : `${late.title} · ${clientById(late.client)?.short ?? ""}`,
        text: `${n} day${n === 1 ? "" : "s"} late`,
        onClick: () => go(late),
      };
    } else if (lateTask) {
      const n = -daysFrom(lateTask.date, staffToday);
      nextCard.late = { name: `${lateTask.t.name} · ${clientById(lateTask.t.client)?.short ?? ""}`, text: `${n} day${n === 1 ? "" : "s"} late`, onClick: () => goTask(lateTask.t) };
    }
  }
  const nextTitle = next && ("task" in next ? `${next.task.t.name} · due ${fmt(next.task.date)}` : `${next.stat.title} · due ${fmt(next.stat.date)}`);

  /* The calendar head: company and the C-1 filter on the first line, the month bar under it. */
  const head = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Select
        aria-label="Company"
        value={client}
        onChange={(e) => onClient(e.target.value)}
        className="flex-none"
        options={[{ value: "", label: "All companies" }, ...clients.map((c) => ({ value: c.id, label: c.short }))]}
      />
      <Tabs
        items={cats}
        value={cat}
        onChange={(k) => {
          setCat(k as CatFilter);
          setArea("all");
        }}
        className="max-w-full flex-none"
      />
    </div>
  );
  const dayStats = (day: Date) => shown.filter((e) => sameDay(e.date, day));
  const dayTasks = (day: Date) => shownTasks.filter((e) => sameDay(e.date, day));

  return (
    <div className="grid grid-cols-1 gap-4">
      {head}
      <CalendarBar
        month={key}
        onMonth={setKey}
        now={nowKey}
        areas={cat === "non-statutory" ? [] : areas}
        area={area}
        onArea={setArea}
        view={view}
        onView={setView}
        filingsHref={filingsHref}
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-md border-1.5 border-line bg-surface p-3">
          {view === "month" && (
            <MonthCalendar
              year={year}
              month={month}
              today={today}
              items={items}
              dayTitle={(day) => {
                const list = dayStats(day);
                const tl = dayTasks(day);
                const words = [list.length ? (list.length === 1 ? "1 filing" : `${list.length} filings`) : "", tl.length ? (tl.length === 1 ? "1 task" : `${tl.length} tasks`) : ""]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <span className="flex items-center gap-2.5">
                    <CalDateTile date={day} status={worstStatus([...list, ...tl].map((e) => ({ status: e.cal })))} className="h-11 w-10" />
                    <span className="min-w-0">
                      <b className="block text-14 font-medium">
                        {LONG_DOW[day.getDay()]} {day.getDate()} {LONG_MON[day.getMonth()]}
                      </b>
                      <span className="block text-12 text-muted">{words}</span>
                    </span>
                  </span>
                );
              }}
              dayBody={(day) => (
                <ul>
                  {dayStats(day).map((e) => {
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
                  {dayTasks(day).map(({ t }) => {
                    const c = clientById(t.client);
                    const w = taskChip(t, staffToday);
                    return (
                      <li key={t.id} className="border-t border-line-soft first:border-t-0">
                        <Link href={taskHrefFor(t)} title={taskHint(t)} className="flex items-center gap-2 px-4 py-2 hover:bg-hover">
                          <AreaShort task>Task</AreaShort>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-13.5 font-medium">{t.name}</span>
                            <span className="flex min-w-0 items-center gap-1.5 text-12 text-muted">
                              {c && <ClientDot tone={c.tone} />}
                              <span className="truncate">
                                {c?.short} · {taskHint(t)}
                              </span>
                            </span>
                          </span>
                          <Chip tone={toneFor(w)} fixed>
                            {w}
                          </Chip>
                        </Link>
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
              marks={[
                ...areaEvents.map((e) => ({ date: e.date, tone: STC[e.cal], title: nameOf(e) })),
                ...tasks.map((e) => ({ date: e.date, tone: STC[e.cal], title: `${e.t.name} (task)` })),
              ]}
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
              onLocked={(it) => toast.show(`${it.title.split(" · ")[0]} is already ${it.id.startsWith("ns-") ? "done" : "filed"}, so its window is locked`)}
            />
          )}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
          <CalDonutCard counts={counts} label={LONG_MON[today.getMonth()]} />
          {next && nextCard && (
            <NextDeadlineCard
              next={nextCard}
              onOpen={() => ("task" in next ? goTask(next.task.t) : go(next.stat))}
              onTile={() => ("task" in next ? goTask(next.task.t) : go(next.stat))}
              onRemind={() => {
                setReminded(true);
                toast.show(`Reminder set for ${nextTitle}`);
              }}
              reminded={reminded}
            />
          )}
          <div className="md:col-span-2 lg:col-span-1">
            <ComingUpCard
              items={coming.map((e) => ({
                id: e.id,
                date: e.date,
                area: e.task ? "Task" : AREA_SHORT[e.kind as keyof typeof AREA_SHORT],
                areaTitle: e.task ? e.hint : e.kind,
                name: e.name,
                status: e.cal,
                task: e.task,
                hint: e.hint,
              }))}
              onPick={(id) => coming.find((e) => e.id === id)?.open()}
            />
          </div>
        </div>
      </div>
      {toast.node}
    </div>
  );
}

function clientTag(id: string) {
  const c = clientById(id);
  return (
    c && (
      <Tag tone={identityTag[c.tone]} className="h-5 px-1.5 text-11.5">
        {c.short}
      </Tag>
    )
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
      taskHrefFor={(t) => taskHref(portal, t.id)}
      filingsHref={`/${portal}/compliances/filings`}
    />
  );
}
