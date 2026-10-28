import { STAFF_TODAY as TODAY, d } from "@/lib/dates";
import type { StaffPortal } from "@/data/staff-clients";
import type { StaffTask } from "@/data/staff-tasks";

// Work page data: to-dos, recurring work, planning estimates, work sessions, files and activity per task.
// Ported from reference/old-screens/s/lead/Work.dc.html, WorkPlan.dc.html, WorkDrawer.dc.html and WorkPhone.dc.html.
// Dates as in the old prototype: staff "today" is Fri 16 Oct 2026 (STAFF_TODAY).

/** The planning week: Mon 12 Oct to Sun 18 Oct. Staff today is Fri 16 Oct. */
export const WEEK: Date[] = Array.from({ length: 7 }, (_, i) => d(2026, 10, 12 + i));
/** The next week, for the "Plan my week" dialog: Mon 19 Oct to Fri 23 Oct. */
export const NEXT_WEEK: Date[] = Array.from({ length: 5 }, (_, i) => d(2026, 10, 19 + i));
/** The timeline span: Mon 12 Oct to Sun 25 Oct (14 days). */
export const SPAN: Date[] = Array.from({ length: 14 }, (_, i) => d(2026, 10, 12 + i));
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const isToday = (x: Date) => x.getTime() === TODAY.getTime();
export const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime();

export interface Todo {
  id: string;
  text: string;
  /** Client id (staff-clients.ts). Blank for firm to-dos. */
  client?: string;
  done?: boolean;
  /** Pinned from the action queue. */
  pinned?: boolean;
  /** "planned Tue 10 AM", "done 9:40". */
  meta?: string;
  due?: Date;
}

/** My to-dos (Today inbox and Work to-do list). From Main.dc.html TODO and Work.dc.html "My to-dos". */
export const TODOS: Record<StaffPortal, Todo[]> = {
  lead: [
    { id: "td1", text: "Call Northwind about NOC", client: "northwind", done: true, meta: "done 9:40" },
    { id: "td2", text: "FC-GPR · check FIRMS login", client: "tidewater", pinned: true, meta: "planned Fri 10 AM", due: d(2026, 10, 16) },
    { id: "td3", text: "Bank KYC pack for Brightwave", client: "brightwave", pinned: true, due: d(2026, 10, 16) },
    { id: "td4", text: "Ask Pranay about Halcyon PT", client: "halcyon" },
    { id: "td5", text: "Proofread Larkspur BR", client: "larkspur", due: d(2026, 10, 19) },
  ],
  // The old manager Work and Today inbox show the same to-dos as the lead (s/mgr/Work.dc.html, s/mgr/Main.dc.html).
  manager: [
    { id: "td1", text: "Call Northwind about NOC", client: "northwind", done: true, meta: "done 9:40" },
    { id: "td2", text: "FC-GPR · check FIRMS login", client: "tidewater", pinned: true, meta: "planned Fri 10 AM", due: d(2026, 10, 16) },
    { id: "td3", text: "Bank KYC pack for Brightwave", client: "brightwave", pinned: true, due: d(2026, 10, 16) },
    { id: "td4", text: "Ask Pranay about Halcyon PT", client: "halcyon" },
    { id: "td5", text: "Proofread Larkspur BR", client: "larkspur", due: d(2026, 10, 19) },
  ],
  admin: [
    { id: "td1", text: "Decide on the Brightwave bank escalation", client: "brightwave", pinned: true, due: d(2026, 10, 16) },
    { id: "td2", text: "Call Priya Raman about Monsoon MCA remarks", client: "monsoon", due: d(2026, 10, 16) },
    { id: "td3", text: "Review new Banyan name options", client: "banyan", due: d(2026, 10, 19) },
    { id: "td4", text: "Assign a manager to Lotus Dental", pinned: true },
    { id: "td5", text: "Approve the Larkspur Board resolution", client: "larkspur", done: true, meta: "done 11:20" },
  ],
};

/** Manager Work: rows the manager handed to a project lead (s/mgr/Work.dc.html "3 with project leads"). Key: task, to-do or recurring id. */
export const MGR_DELEGATED: Record<string, string> = { t13: "Sneha Kulkarni", t06: "Meera Nair", r1: "Bharath" };

export interface Recurring {
  id: string;
  text: string;
  client: string;
  rule: string;
  next: Date;
}

/** Recurring this month (Work.dc.html). */
export const RECURRING: Record<StaffPortal, Recurring[]> = {
  lead: [
    { id: "r1", text: "Monthly GST reconciliation", client: "halcyon", rule: "every 10th", next: d(2026, 11, 10) },
    { id: "r2", text: "TDS working papers", client: "kestrel", rule: "every 5th", next: d(2026, 11, 5) },
    { id: "r3", text: "Weekly client status email", client: "northwind", rule: "every Fri", next: TODAY },
  ],
  manager: [
    { id: "r1", text: "Monthly GST reconciliation", client: "halcyon", rule: "every 10th", next: d(2026, 11, 10) },
    { id: "r2", text: "TDS working papers", client: "kestrel", rule: "every 5th", next: d(2026, 11, 5) },
    { id: "r3", text: "Weekly client status email", client: "northwind", rule: "every Fri", next: TODAY },
  ],
  admin: [
    { id: "r1", text: "Monthly firm review with managers", client: "brightwave", rule: "first Mon", next: d(2026, 11, 2) },
    { id: "r2", text: "Escalation sweep", client: "monsoon", rule: "every Fri", next: TODAY },
  ],
};

/** Planning estimate in hours, by area (WorkPlan.dc.html blocks are 1 to 3 h). */
export const ESTIMATE: Record<StaffTask["area"], number> = { MCA: 2, GST: 1.5, "Income tax": 1, Payroll: 1, FEMA: 2 };

/** Tasks already planned on a day of the week (index into WEEK). */
export const PLANNED: Record<string, number> = { t16: 0, t13: 1, t06: 2, t02: 2, t10: 3, t19: 4, p16: 1, p04: 2, p08: 3, p14: 4, p09: 0 };

/** Days a task runs before its due date on the timeline. Manager-set tasks are locked. */
export const SPAN_DAYS: Record<string, number> = { t02: 9, t05: 4, t06: 7, t10: 5, t11: 8, t13: 4, t16: 4, t19: 6, t20: 3, t21: 3 };

export interface Session {
  when: string;
  text: string;
  /** Planned after the task's due date. */
  late?: boolean;
}

export interface TaskFile {
  name: string;
}

export interface Activity {
  who: string;
  text: string;
  when: string;
}

export interface TaskExtra {
  sessions?: Session[];
  files?: TaskFile[];
  activity?: Activity[];
}

/** Drawer detail per task (WorkDrawer.dc.html). */
export const TASK_EXTRA: Record<string, TaskExtra> = {
  t16: {
    sessions: [
      { when: "Mon 12 · 10:00 to 12:00", text: "Bank visit prep" },
      { when: "Thu 15 · 4:00 to 5:30", text: "Signatory list" },
      { when: "Fri 16 · 2:30 to 4:00", text: "Resubmit to bank", late: true },
    ],
    files: [{ name: "Board resolution · bank.docx" }, { name: "KYC · Daniel Ortiz.pdf" }],
    activity: [
      { who: "Bank", text: "rejected the signatory list", when: "15 Oct 4:10 PM" },
      { who: "Sneha Kulkarni", text: "uploaded the KYC pack", when: "14 Oct" },
      { who: "Pranay", text: "set due 15 Oct", when: "11 Oct" },
    ],
  },
  t02: {
    sessions: [{ when: "Wed 14 · 3:00 to 4:00", text: "Remind Northwind" }],
    files: [{ name: "Rent agreement · stamped.pdf" }, { name: "NOC · unsigned.pdf" }],
    activity: [
      { who: "Rohan Kumar", text: "uploaded the stamped rent agreement", when: "16 Oct 10:40 AM" },
      { who: "Bharath", text: "sent back the NOC without signature", when: "13 Oct" },
      { who: "Pranay", text: "set due 20 Oct", when: "9 Oct" },
    ],
  },
  t13: {
    sessions: [{ when: "Tue 13 · 9:30 to 11:00", text: "FIRMS login and form check" }],
    files: [{ name: "FIRC · Tidewater.pdf" }, { name: "FC-GPR form · draft.pdf" }],
    activity: [
      { who: "Mei Tanaka", text: "sent the FIRMS login", when: "16 Oct 10:12 AM" },
      { who: "Pranay", text: "set due 16 Oct", when: "11 Oct" },
    ],
  },
  t06: {
    sessions: [{ when: "Wed 14 · 11:00 to 12:30", text: "Reply to officer query" }],
    files: [{ name: "GST REG-03 notice.pdf" }, { name: "Rent agreement · Kestrel.pdf" }],
    activity: [
      { who: "GST officer", text: "asked for a clearer rent agreement", when: "15 Oct" },
      { who: "Bharath", text: "filed the application · ARN received", when: "11 Oct" },
    ],
  },
  t10: {
    sessions: [{ when: "Thu 15 · 10:00 to 12:00", text: "KYC review" }],
    files: [{ name: "KYC · Amara Okafor.pdf" }],
    activity: [{ who: "Amara Okafor", text: "submitted the KYC forms", when: "15 Oct" }],
  },
};

export function extraFor(t: StaffTask): Required<TaskExtra> {
  const x = TASK_EXTRA[t.id] ?? {};
  return {
    sessions: x.sessions ?? [],
    files: x.files ?? [],
    activity: x.activity ?? [{ who: t.setBy ?? t.owner, text: `set due ${t.due.getDate()} Oct`, when: "11 Oct" }],
  };
}

/** Old Work board columns (WorkBoard.dc.html). */
export type BoardCol = "action" | "doing" | "waiting" | "done";
export const BOARD_COLS: Array<{ key: BoardCol; label: string }> = [
  { key: "action", label: "Needs action" },
  { key: "doing", label: "In progress" },
  { key: "waiting", label: "Waiting" },
  { key: "done", label: "Done" },
];
export function boardColOf(t: StaffTask): BoardCol {
  if (t.status === "Done") return "done";
  if (t.status === "With client") return "waiting";
  if (t.status === "In progress") return "doing";
  return "action";
}

/** One block on the hour calendar (Work.dc.html B, WorkPlan.dc.html). Hours are decimal: 9.5 is 9:30 AM. */
export interface CalBlock {
  id: string;
  /** Index into the week shown. */
  day: number;
  start: number;
  end: number;
  title: string;
  client: string;
  /** Task id, when the block opens a task. */
  task?: string;
  /** My own to-do: dashed outline. */
  own?: boolean;
  /** Planned after the due date: amber outline. */
  late?: boolean;
  /** Small line under the time: "Orchid Lane · due Mon 19". */
  note?: string;
}

/** All-day items on the week calendar (filings and locked manager dates). */
export interface AllDayItem {
  day: number;
  text: string;
  client: string;
  kind: "filing" | "locked";
}

/** Bharath's week, Mon 12 to Sun 18 Oct (Work.dc.html, the mixed view). */
export const CAL_BLOCKS: CalBlock[] = [
  { id: "b1", day: 0, start: 10, end: 12, title: "Bank account opening", client: "brightwave", task: "t16" },
  { id: "b2", day: 1, start: 9.5, end: 11, title: "FC-GPR filing", client: "tidewater", task: "t13" },
  { id: "b3", day: 1, start: 14, end: 15, title: "Subscriber details", client: "orchid" },
  { id: "b4", day: 2, start: 11, end: 12.5, title: "GST registration", client: "kestrel", task: "t06" },
  { id: "b5", day: 2, start: 15, end: 16, title: "Remind Northwind", client: "northwind", task: "t02" },
  { id: "b6", day: 3, start: 10, end: 12, title: "KYC review and DSC", client: "orchid", task: "t10" },
  { id: "b7", day: 3, start: 16, end: 17.5, title: "Bank account opening", client: "brightwave", task: "t16" },
  { id: "b8", day: 4, start: 10, end: 11, title: "FC-GPR · FIRMS login", client: "tidewater", own: true },
  { id: "b9", day: 4, start: 12, end: 13.5, title: "Draft Board resolution", client: "larkspur", task: "t19" },
  { id: "b10", day: 4, start: 14.5, end: 16, title: "Bank account opening", client: "brightwave", task: "t16", late: true },
];

export const CAL_ALLDAY: AllDayItem[] = [
  { day: 3, text: "PF ECR · Halcyon", client: "halcyon", kind: "filing" },
  { day: 4, text: "FC-GPR due", client: "tidewater", kind: "locked" },
];

/** "Plan my week" suggestion for Mon 19 to Fri 23 Oct (WorkPlan.dc.html). */
export const PLAN_BLOCKS: CalBlock[] = [
  { id: "w1", day: 0, start: 9, end: 11, title: "KYC review and DSC", client: "orchid", task: "t10", note: "Orchid Lane · due Mon 19" },
  { id: "w2", day: 0, start: 14, end: 15.5, title: "GST registration · ARN follow-up", client: "kestrel", task: "t06", note: "Kestrel · span 14-20" },
  { id: "w3", day: 1, start: 9, end: 11, title: "TDS challan · September", client: "kestrel", task: "t07", note: "Kestrel · filing 20 Oct" },
  { id: "w4", day: 1, start: 14, end: 17, title: "GSTR-1 working", client: "halcyon", task: "t32", note: "Halcyon · filing 20 Oct" },
  { id: "w5", day: 2, start: 9, end: 11.5, title: "Draft Board resolution", client: "larkspur", task: "t19", note: "Larkspur · due Wed 21" },
  { id: "w6", day: 3, start: 10, end: 11, title: "FC-GPR resubmission", client: "tidewater", task: "t13", note: "Tidewater" },
  { id: "w7", day: 3, start: 14, end: 15.5, title: "Monthly GST recon", client: "halcyon", note: "Halcyon · moved from Tue" },
  { id: "w8", day: 4, start: 16, end: 17, title: "Bank KYC pack", client: "brightwave", own: true, note: "Brightwave · my to-do" },
];

/** One row of the old planner timeline (Work.dc.html T, the mixed view). Days index SPAN; `to` is exclusive. */
export interface TimelineRow {
  id: string;
  title: string;
  client: string;
  sub: string;
  from: number;
  to: number;
  kind: "locked" | "mine" | "wait" | "filing" | "repeat";
  late?: boolean;
  /** Task that opens on click. */
  task?: string;
  /** Diamond on this day index, with its tooltip. */
  due?: { day: number; tip: string };
}

export const TIMELINE_ROWS: TimelineRow[] = [
  { id: "tl1", title: "Bank account opening", client: "brightwave", sub: "Step 17 · overdue 1d", from: 0, to: 4, kind: "locked", late: true, task: "t16" },
  { id: "tl2", title: "Bank KYC pack", client: "brightwave", sub: "My to-do", from: 3, to: 5, kind: "mine" },
  { id: "tl3", title: "FC-GPR filing", client: "tidewater", sub: "Step 22", from: 1, to: 5, kind: "locked", task: "t13" },
  { id: "tl4", title: "GST registration", client: "kestrel", sub: "Reg-1", from: 2, to: 9, kind: "locked", task: "t06", due: { day: 8, tip: "TDS challan due 20 Oct" } },
  { id: "tl5", title: "KYC review and DSC", client: "orchid", sub: "Step 10", from: 3, to: 8, kind: "locked", task: "t10" },
  { id: "tl6", title: "Draft Board resolution", client: "larkspur", sub: "Step 2", from: 4, to: 10, kind: "locked", task: "t19" },
  { id: "tl7", title: "Registered office address", client: "northwind", sub: "Step 7 · waiting client", from: 0, to: 9, kind: "wait", task: "t02" },
  { id: "tl8", title: "PF ECR · Sep", client: "halcyon", sub: "Filing", from: 3, to: 4, kind: "filing", task: "t31", late: true, due: { day: 3, tip: "PF ECR due 15 Oct · overdue" } },
  { id: "tl9", title: "Monthly GST recon", client: "halcyon", sub: "Recurring · 10th", from: 9, to: 11, kind: "repeat" },
];
