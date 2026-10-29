"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { daysFrom, fmt } from "@/lib/dates";
import type { BarTone } from "@/components/ui/Bar";
import { useRouter } from "next/navigation";
import { Chip, toneFor } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { ListRow } from "@/components/cards/SectionCard";
import { YearGrid } from "@/components/cards/YearGrid";
import { FilingWindows, type WindowLane } from "@/components/cards/FilingWindows";
import { MonthCalendar, AreaShort, CalDateTile, CalStatusChip, CAL_STATUSES, worstStatus, type CalItem, type CalStatus } from "@/components/cards/MonthCalendar";
import { CalendarBar, parseKey } from "@/components/cards/CalendarBar";
import { CalDonutCard, ComingUpCard, NextDeadlineCard } from "@/components/cards/CalendarRail";
import { AREA_SHORT, CAL_AREAS, CAL_FOCUS, CAL_TODAY, FY_MONTHS, NOW_KEY, PREP_DAYS, YEAR_EVENTS, type YearEvent } from "@/data/compliance-year";
import { filingProofs } from "@/data/compliance-detail";
import { CLIENT_TASKS, clientVisible, taskHref, type NsTask } from "@/data/compliance-tasks";
import { catTabs, showStat, showTasks, taskCal, taskChip, taskHint, type CatFilter } from "@/data/compliance-tasks-views";
import { ComplianceDrill, EventDialog, PortalLink, eventFiling, type DrillRow } from "./comp-parts";

// Old client calendar (reference/old-screens/s/comp/index.html calRedesign, cal-views.js).
// Filter bar above the grid; month grid on the left; donut, next deadline and coming up on the right.

const LONG_DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LONG_MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const AREA_FULL: Record<string, string> = {
  MCA: "Ministry of Corporate Affairs",
  GST: "Goods and Services Tax",
  "Income tax": "Income tax",
  Payroll: "Payroll · PF, ESI, PT",
  FEMA: "FEMA · RBI and STPI",
};
/** Status colours in the Year and Timeline views (R-25): upcoming is grey, not navy. */
const STC: Record<CalStatus, BarTone> = { Overdue: "bad", "Due soon": "warn", Filed: "ok", Upcoming: "idle" };
const st = (e: YearEvent) => e.status as CalStatus;
const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const inMonth = (e: { date: Date }, key: string) => {
  const { year, month } = parseKey(key);
  return e.date.getFullYear() === year && e.date.getMonth() === month;
};

/** Old dayRow: area, filing with its portal link, period, proof and status. */
function DayRow({ e, onOpen }: { e: YearEvent; onOpen: () => void }) {
  const f = eventFiling(e);
  const proof =
    f.status === "Filed" ? (
      filingProofs(f).length ? (
        <Chip tone="ok" dot={false}>
          Proof
        </Chip>
      ) : (
        <Chip tone="warn">Proof pending</Chip>
      )
    ) : null;
  return (
    <ListRow onClick={onOpen} className="gap-2 px-4 py-2.5 md:px-4">
      <AreaShort title={AREA_FULL[e.kind]}>{AREA_SHORT[e.kind]}</AreaShort>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-13 font-medium">
          <span className="truncate">{e.name}</span>
          <PortalLink area={e.kind} name={e.name} />
        </span>
        <span className="block truncate text-12 text-muted">{e.period}</span>
      </span>
      {proof}
      <CalStatusChip status={st(e)} />
    </ListRow>
  );
}

/** C-3: a non-statutory task on its end date. Hover shows the start and the urgency. */
function TaskDayRow({ t }: { t: NsTask }) {
  const w = taskChip(t, CAL_TODAY);
  return (
    <ListRow href={taskHref("client", t.id)} className="gap-2 px-4 py-2.5 md:px-4">
      <AreaShort task>Task</AreaShort>
      <span className="min-w-0 flex-1" title={taskHint(t)}>
        <span className="block truncate text-13 font-medium">{t.name}</span>
        <span className="block truncate text-12 text-muted">{taskHint(t)}</span>
      </span>
      <Chip tone={toneFor(w)} fixed>
        {w}
      </Chip>
    </ListRow>
  );
}

function DayHead({ day, list }: { day: Date; list: CalItem[] }) {
  const f = list.filter((x) => !x.task).length;
  const t = list.length - f;
  const words = [f ? (f === 1 ? "1 filing" : `${f} filings`) : "", t ? (t === 1 ? "1 task" : `${t} tasks`) : ""].filter(Boolean).join(" · ");
  return (
    <span className="flex items-center gap-2.5">
      <CalDateTile date={day} status={worstStatus(list)} className="h-11 w-10" />
      <span className="min-w-0">
        <b className="block text-14 font-medium">
          {LONG_DOW[day.getDay()]} {day.getDate()} {LONG_MON[day.getMonth()]}
        </b>
        <span className="block text-12 text-muted">{words}</span>
      </span>
    </span>
  );
}

/** Filing windows for the Timeline view: one lane per filing, grouped by area. */
function useWindows(events: YearEvent[], tasks: Array<{ t: NsTask; cal: CalStatus }>) {
  const [win, setWin] = React.useState<Record<string, { s: Date; e: Date }>>({});
  const hist = React.useRef<Array<Record<string, { s: Date; e: Date }>>>([]);
  const lanes: WindowLane[] = [];
  for (const a of CAL_AREAS) {
    const inArea = events.filter((e) => e.kind === a);
    if (!inArea.length) continue;
    lanes.push({ id: `g-${a}`, label: a, group: true });
    for (const n of Array.from(new Set(inArea.map((e) => e.name)))) {
      lanes.push({
        id: `l-${a}-${n}`,
        label: n,
        items: inArea
          .filter((e) => e.name === n)
          .map((e) => {
            const w = win[e.id];
            return {
              id: e.id,
              title: `${e.name} · ${e.period}`,
              due: e.date,
              start: w?.s ?? addDays(e.date, -PREP_DAYS[e.frequency]),
              end: w?.e ?? e.date,
              tone: STC[st(e)],
              locked: e.status === "Filed",
            };
          }),
      });
    }
  }
  if (tasks.length) {
    lanes.push({ id: "g-ns", label: "Non-statutory", group: true });
    for (const n of Array.from(new Set(tasks.map((x) => x.t.name)))) {
      lanes.push({
        id: `l-ns-${n}`,
        label: n,
        items: tasks
          .filter((x) => x.t.name === n)
          .map(({ t, cal }) => {
            const w = win[t.id];
            return { id: t.id, title: `${n} · ${taskHint(t)}`, due: t.end, start: w?.s ?? t.start, end: w?.e ?? t.end, tone: STC[cal], locked: t.stage === "completed" };
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

const drillRow = (e: YearEvent): DrillRow => ({ id: e.id, name: e.name, period: e.period, area: e.kind, due: e.date, filed: e.filed, status: e.status });

export function CalendarScreen() {
  const toast = useUndoToast();
  const [key, setKey] = React.useState(NOW_KEY);
  const [view, setView] = React.useState("month");
  const [area, setArea] = React.useState("all");
  const [open, setOpen] = React.useState<YearEvent | null>(null);
  const [drill, setDrill] = React.useState<{ title: string; rows: YearEvent[]; initial: string } | null>(null);
  const [reminded, setReminded] = React.useState(false);

  const router = useRouter();
  const [cat, setCat] = React.useState<CatFilter>("all");

  const { year, month } = parseKey(key);
  /* C-3: the tasks shared with the client, on their end date, as of the calendar day. */
  const allTasks = CLIENT_TASKS.filter(clientVisible).map((t) => ({ t, date: t.end, cal: taskCal(t, CAL_TODAY) as CalStatus }));
  /* C-4: the filter applies to every view and to the rail. Tasks have no area, so an area pick hides them. */
  const stats = showStat(cat) ? YEAR_EVENTS : [];
  const tasks = showTasks(cat) && area === "all" ? allTasks : [];
  const areaEvents = stats.filter((e) => area === "all" || e.kind === area);
  const monthAll = stats.filter((e) => inMonth(e, key));
  const events = areaEvents.filter((e) => inMonth(e, key));
  const monthTasks = tasks.filter((e) => inMonth(e, key));
  const nowMonth = stats.filter((e) => inMonth(e, NOW_KEY));
  const nowTasks = tasks.filter((e) => inMonth(e, NOW_KEY));
  const win = useWindows(areaEvents, tasks);
  /* C-1 counts: the month on screen in Month view, the whole year in Year and Timeline, as the area counts. */
  const counted = view === "month" ? monthAll : stats;
  const areas = [{ key: "all", label: "All", count: counted.length }, ...CAL_AREAS.map((a) => ({ key: a, label: a, count: counted.filter((e) => e.kind === a).length }))];
  const scope = (list: Array<{ date: Date }>) => (view === "month" ? list.filter((e) => inMonth(e, key)) : list).length;
  const cats = catTabs(scope(YEAR_EVENTS), scope(allTasks));

  const counts = Object.fromEntries(CAL_STATUSES.map((s) => [s, nowMonth.filter((e) => e.status === s).length + nowTasks.filter((e) => e.cal === s).length])) as Record<
    CalStatus,
    number
  >;
  const late = nowMonth.find((e) => e.status === "Overdue");
  const lateTask = nowTasks.find((e) => e.cal === "Overdue");
  const nextTask = tasks.filter((e) => e.t.stage !== "completed" && e.date >= CAL_TODAY).sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  /** All: the earlier of the next filing and the next task. */
  const focusStat = showStat(cat) && (!nextTask || CAL_FOCUS.date <= nextTask.date);
  const coming = [
    ...stats
      .filter((e) => e.date >= addDays(CAL_TODAY, -1))
      .map((e) => ({
        id: e.id,
        date: e.date,
        area: AREA_SHORT[e.kind],
        areaTitle: AREA_FULL[e.kind],
        name: e.name,
        status: st(e),
        task: false,
        hint: undefined as string | undefined,
      })),
    ...tasks
      .filter((e) => e.t.stage !== "completed" && e.date >= CAL_TODAY)
      .map((e) => ({ id: e.t.id, date: e.date, area: "Task", areaTitle: taskHint(e.t), name: e.t.name, status: e.cal, task: true, hint: taskHint(e.t) })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 7);
  const nowLabel = LONG_MON[CAL_TODAY.getMonth()];
  const openDrill = (initial: string) => setDrill({ title: `Compliances · ${nowLabel} ${CAL_TODAY.getFullYear()}`, rows: nowMonth, initial });
  const thisWeek = stats.filter((e) => e.status === "Due soon").length + tasks.filter((e) => e.cal === "Due soon").length;
  const fyAll = stats.length + tasks.length;
  const fyFiled = fyAll ? Math.round(((stats.filter((e) => e.status === "Filed").length + tasks.filter((e) => e.cal === "Filed").length) / fyAll) * 100) : 0;
  const goTask = (t: NsTask) => router.push(taskHref("client", t.id));
  const lateTaskLine = () => {
    if (!lateTask) return undefined;
    const n = -daysFrom(lateTask.date, CAL_TODAY);
    return { name: lateTask.t.name, text: `${n} day${n === 1 ? "" : "s"} late`, onClick: () => goTask(lateTask.t) };
  };
  const items: CalItem[] = [
    ...events.map((e) => ({ id: e.id, date: e.date, label: e.name, status: st(e) })),
    ...monthTasks.map((e) => ({ id: e.t.id, date: e.date, label: e.t.name, status: e.cal, task: true, hint: taskHint(e.t) })),
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      <Tabs
        items={cats}
        value={cat}
        onChange={(k) => {
          setCat(k as CatFilter);
          setArea("all");
        }}
        className="max-w-full justify-self-start"
      />
      <CalendarBar
        month={key}
        onMonth={setKey}
        now={NOW_KEY}
        areas={cat === "non-statutory" ? [] : areas}
        area={area}
        onArea={setArea}
        view={view}
        onView={setView}
        filingsHref="/client/filings"
      />
      {/* Phone (calMobile): three numbers above the calendar. */}
      <div className="grid grid-cols-3 overflow-hidden rounded-md border-1.5 border-line bg-surface md:hidden">
        {[
          { v: thisWeek, l: "Due this week", c: "text-warn" },
          { v: counts.Overdue, l: "Overdue", c: "text-bad" },
          { v: `${fyFiled}%`, l: "FY filed", c: "text-ok" },
        ].map((x, i) => (
          <div key={x.l} className={cn("px-3 py-2.5", i > 0 && "border-l border-line-soft")}>
            <div className="truncate text-12.5 font-medium text-muted">{x.l}</div>
            <div className={cn("mt-0.5 text-22 font-medium leading-tight", x.c)}>{x.v}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-md border-1.5 border-line bg-surface p-3">
          {view === "month" && (
            <MonthCalendar
              year={year}
              month={month}
              today={CAL_TODAY}
              items={items}
              dayTitle={(day, list) => <DayHead day={day} list={list} />}
              dayBody={(_, list, close) =>
                list.map((x) => {
                  if (x.task) return <TaskDayRow key={x.id} t={monthTasks.find((y) => y.t.id === x.id)!.t} />;
                  const e = events.find((y) => y.id === x.id)!;
                  return (
                    <DayRow
                      key={x.id}
                      e={e}
                      onOpen={() => {
                        close();
                        setOpen(e);
                      }}
                    />
                  );
                })
              }
            />
          )}
          {view === "year" && (
            <YearGrid
              months={FY_MONTHS}
              today={CAL_TODAY}
              marks={[
                ...areaEvents.map((e) => ({ date: e.date, tone: STC[st(e)], title: e.name })),
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
              lanes={win.lanes}
              focus={new Date(2026, 9, 1)}
              today={CAL_TODAY}
              onChange={(id, s, e) => {
                win.change(id, s, e);
                const ev = YEAR_EVENTS.find((x) => x.id === id) ?? allTasks.find((x) => x.t.id === id)?.t;
                const name = ev && ("name" in ev ? ev.name : "");
                toast.show(`${name || "Filing"} window · ${fmt(s)} to ${fmt(e)}${ev && "date" in ev && e > ev.date ? " · ends after the due date" : ""}`, win.undo);
              }}
              onLocked={(it) => toast.show(`${it.title.split(" · ")[0]} is already ${it.id.startsWith("nsc-") ? "done" : "filed"}, so its window is locked`)}
            />
          )}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
          <CalDonutCard counts={counts} label={nowLabel} onPick={openDrill} />
          {focusStat ? (
            <NextDeadlineCard
              next={{
                days: daysFrom(CAL_FOCUS.date, CAL_TODAY),
                title: `${CAL_FOCUS.name} · ${CAL_FOCUS.period}`,
                link: <PortalLink area={CAL_FOCUS.kind} name={CAL_FOCUS.name} />,
                area: AREA_SHORT[CAL_FOCUS.kind],
                areaTitle: AREA_FULL[CAL_FOCUS.kind],
                state: { label: "Data received", tone: "ok" },
                late: late
                  ? { name: late.name, text: `${-daysFrom(late.date, CAL_TODAY)} day${-daysFrom(late.date, CAL_TODAY) === 1 ? "" : "s"} late`, onClick: () => openDrill("Overdue") }
                  : lateTaskLine(),
              }}
              onTile={() => openDrill("Due soon")}
              onOpen={() => setOpen(CAL_FOCUS)}
              onRemind={() => {
                setReminded(true);
                toast.show(`Reminder set for ${CAL_FOCUS.name} · due ${fmt(CAL_FOCUS.date)}`);
              }}
              reminded={reminded}
            />
          ) : (
            nextTask && (
              <NextDeadlineCard
                next={{
                  days: daysFrom(nextTask.date, CAL_TODAY),
                  title: nextTask.t.name,
                  area: "Task",
                  areaTitle: taskHint(nextTask.t),
                  task: true,
                  openLabel: "Open task",
                  state: nextTask.t.stage === "waiting" ? { label: "Your inputs needed", tone: "warn" } : { label: taskChip(nextTask.t, CAL_TODAY), tone: "idle" },
                  late: lateTaskLine(),
                }}
                onTile={() => goTask(nextTask.t)}
                onOpen={() => goTask(nextTask.t)}
                onRemind={() => {
                  setReminded(true);
                  toast.show(`Reminder set for ${nextTask.t.name} · due ${fmt(nextTask.date)}`);
                }}
                reminded={reminded}
              />
            )
          )}
          <div className="md:col-span-2 lg:col-span-1">
            <ComingUpCard
              items={coming}
              onPick={(id) => {
                const t = allTasks.find((x) => x.t.id === id);
                if (t) goTask(t.t);
                else setOpen(YEAR_EVENTS.find((e) => e.id === id) ?? null);
              }}
            />
          </div>
        </div>
      </div>
      <EventDialog event={open} onClose={() => setOpen(null)} onRemind={(t) => toast.show(t)} />
      <ComplianceDrill
        open={!!drill}
        onOpenChange={(v) => !v && setDrill(null)}
        title={drill?.title ?? ""}
        rows={(drill?.rows ?? []).map(drillRow)}
        initial={drill?.initial}
        asOf={CAL_TODAY}
        statuses={CAL_STATUSES}
        onPick={(r) => {
          setDrill(null);
          setOpen(YEAR_EVENTS.find((e) => e.id === r.id) ?? null);
        }}
      />
      {toast.node}
    </div>
  );
}
