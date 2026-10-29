import { daysFrom, fmt } from "@/lib/dates";
import { activity } from "@/data/activity-master";
import type { Area, Filing, Frequency } from "@/data/compliance";
import type { OldFiling } from "@/data/staff-filings-table";
import { taskWord, type NsTask } from "@/data/compliance-tasks";

// Calendar (C-1 to C-4) and Filings (F-1 to F-3) views of non-statutory tasks.
// A task shows on the calendar on its end date. A completed task is a Filings row with its deliverable.

/** The segmented filter on the calendar and on Filings. */
export type CatFilter = "all" | "statutory" | "non-statutory";

export function catTabs(stat: number, ns: number) {
  return [
    { key: "all", label: "All", count: stat + ns },
    { key: "statutory", label: "Statutory", count: stat },
    { key: "non-statutory", label: "Non-statutory", count: ns },
  ];
}

export const showStat = (c: CatFilter) => c !== "non-statutory";
export const showTasks = (c: CatFilter) => c !== "statutory";

/** C-3 hover text: "Starts 12 Oct · High". */
export const taskHint = (t: NsTask) => `Starts ${fmt(t.start)} · ${t.urgency}`;

/** The four calendar statuses for a task, by the same rule as a staff filing: done, late, within 7 days, later. */
export type TaskCal = "Filed" | "Due soon" | "Overdue" | "Upcoming";
export function taskCal(t: NsTask, today: Date): TaskCal {
  if (t.stage === "completed") return "Filed";
  const n = daysFrom(t.end, today);
  if (n < 0) return "Overdue";
  if (n <= 7) return "Due soon";
  return "Upcoming";
}

/** The task's chip word (one of the six). */
export const taskChip = taskWord;

/** The area word for a non-statutory row. It has no regulator. */
export const INTERNAL = "Internal";
/** Filing rows type their area as a regulator. A task row carries "Internal" in that field; check it with `isTaskFiling`. */
const INTERNAL_AREA = INTERNAL as Area;

export const isTaskId = (id: string) => id.startsWith("ns:");

/** F-2: completed tasks with a deliverable, as filing rows. */
export const doneTasks = (list: NsTask[]) => list.filter((t) => t.stage === "completed");

/** One filing per task name and end date: "MPR · September" for three clients is one band. */
export interface TaskFiling extends OldFiling {
  tasks: NsTask[];
}

export function taskFilings(list: NsTask[]): TaskFiling[] {
  const out: TaskFiling[] = [];
  for (const t of doneTasks(list)) {
    const id = `ns:${t.name}:${t.end.getTime()}`;
    const hit = out.find((f) => f.id === id);
    if (hit) {
      hit.tasks.push(t);
      continue;
    }
    const [form, period = ""] = t.name.split(" · ");
    out.push({
      id,
      due: t.end,
      area: INTERNAL_AREA,
      code: "INT",
      form: t.name,
      period: period || form,
      frequency: activity(t.activityId)?.frequency ?? "One-time",
      filedOn: fmt(t.end),
      status: "Filed",
      proof: t.deliverable ? "file" : "none",
      tasks: [t],
    });
  }
  return out.sort((a, b) => a.due.getTime() - b.due.getTime());
}

export const isTaskFiling = (f: { id: string }): f is TaskFiling => isTaskId(f.id);

/** F-2 on the client portal: one Filings row per completed task shared with the client. */
export interface TaskRow extends Filing {
  task: NsTask;
}

export function clientTaskRows(list: NsTask[]): TaskRow[] {
  return doneTasks(list).map((t) => {
    const [form, period = ""] = t.name.split(" · ");
    return {
      id: `ns:${t.id}`,
      form,
      period: period || fmt(t.end),
      due: t.end,
      filed: t.end,
      status: "Filed",
      docs: t.deliverable ? 1 : 0,
      area: INTERNAL_AREA,
      frequency: (activity(t.activityId)?.frequency ?? "Event") as Frequency,
      fy: "2026-27",
      task: t,
    };
  });
}

export const isTaskRow = (f: { id: string }): f is TaskRow => isTaskId(f.id);
