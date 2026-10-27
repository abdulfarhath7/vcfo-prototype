import { TODAY, d } from "@/lib/dates";
import type { StaffPortal } from "@/data/staff-clients";
import type { StaffTask } from "@/data/staff-tasks";

// Work page data: to-dos, recurring work, planning estimates, work sessions, files and activity per task.
// Ported from reference/old-screens/s/lead/Work.dc.html, WorkPlan.dc.html, WorkDrawer.dc.html and WorkPhone.dc.html.
// Old client names map to the new sample clients. Dates move back 10 days: the old "today" was 16 Oct, ours is 6 Oct.

/** The planning week: Mon 5 Oct to Sun 11 Oct. TODAY is Tue 6 Oct. */
export const WEEK: Date[] = Array.from({ length: 7 }, (_, i) => d(2026, 10, 5 + i));
/** The timeline span: Mon 5 Oct to Sun 18 Oct (14 days). */
export const SPAN: Date[] = Array.from({ length: 14 }, (_, i) => d(2026, 10, 5 + i));
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
    { id: "td2", text: "FC-GPR · check FIRMS login", client: "corvid", pinned: true, meta: "planned Tue 10 AM", due: d(2026, 10, 6) },
    { id: "td3", text: "Reply pack for GST officer query", client: "zenith", pinned: true, due: d(2026, 10, 7) },
    { id: "td4", text: "DSC tokens courier for Bluefin", client: "bluefin", due: d(2026, 10, 8) },
    { id: "td5", text: "Ask Pranay about the Arcadia trademark class", client: "arcadia" },
    { id: "td6", text: "Proofread Northwind MOA draft", client: "northwind", due: d(2026, 10, 9) },
  ],
  manager: [
    { id: "td1", text: "Call the bank about the Delta signatory list", client: "delta", pinned: true, due: d(2026, 10, 6) },
    { id: "td2", text: "Review FC-GPR form before filing", client: "corvid", pinned: true, due: d(2026, 10, 6) },
    { id: "td3", text: "Approve Ember Board resolution draft", client: "ember", due: d(2026, 10, 9) },
    { id: "td4", text: "Client call on Northwind office NOC", client: "northwind", due: d(2026, 10, 10) },
    { id: "td5", text: "Chase Fjord auditor consent letter", client: "fjord", done: true, meta: "done 9:15" },
  ],
  admin: [
    { id: "td1", text: "Decide on the Delta bank escalation", client: "delta", pinned: true, due: d(2026, 10, 6) },
    { id: "td2", text: "Call Priya Raman about Monsoon MCA remarks", client: "monsoon", due: d(2026, 10, 6) },
    { id: "td3", text: "Review new Banyan name options", client: "banyan", due: d(2026, 10, 7) },
    { id: "td4", text: "Assign a manager to Lotus Dental", pinned: true },
    { id: "td5", text: "Sign the Saffron engagement letter", client: "saffron", done: true, meta: "done 8:50" },
  ],
};

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
    { id: "r1", text: "Monthly GST reconciliation", client: "zenith", rule: "every 10th", next: d(2026, 10, 10) },
    { id: "r2", text: "TDS working papers", client: "corvid", rule: "every 5th", next: d(2026, 11, 5) },
    { id: "r3", text: "Weekly client status email", client: "northwind", rule: "every Tue", next: TODAY },
  ],
  manager: [
    { id: "r1", text: "Weekly team review", client: "delta", rule: "every Mon", next: d(2026, 10, 12) },
    { id: "r2", text: "Monthly GST reconciliation review", client: "zenith", rule: "every 10th", next: d(2026, 10, 10) },
    { id: "r3", text: "Weekly client status email", client: "northwind", rule: "every Tue", next: TODAY },
  ],
  admin: [
    { id: "r1", text: "Monthly firm review with managers", client: "delta", rule: "first Mon", next: d(2026, 11, 2) },
    { id: "r2", text: "Escalation sweep", client: "monsoon", rule: "every Tue", next: TODAY },
  ],
};

/** Planning estimate in hours, by area (WorkPlan.dc.html blocks are 1 to 3 h). */
export const ESTIMATE: Record<StaffTask["area"], number> = { MCA: 2, GST: 1.5, "Income tax": 1, Payroll: 1, FEMA: 2 };

/** Tasks already planned on a day of the week (index into WEEK). */
export const PLANNED: Record<string, number> = { t02: 0, t04: 1, t06: 1, t13: 1, t10: 2, t03: 3, t11: 4, t16: 0, t18: 2, t19: 3, t22: 1, t24: 1 };

/** Days a task runs before its due date on the timeline. Manager-set tasks are locked. */
export const SPAN_DAYS: Record<string, number> = { t01: 4, t02: 6, t03: 3, t04: 5, t05: 4, t06: 6, t10: 4, t11: 8, t13: 5, t16: 4, t19: 6, t20: 3 };

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
      { when: "Mon 5 · 10:00 to 12:00", text: "Bank visit prep" },
      { when: "Thu 8 · 4:00 to 5:30", text: "Signatory list", late: true },
      { when: "Fri 9 · 2:30 to 4:00", text: "Resubmit to bank", late: true },
    ],
    files: [{ name: "Board resolution · bank.docx" }, { name: "KYC · Daniel Ortiz.pdf" }],
    activity: [
      { who: "Bank", text: "rejected the signatory list", when: "5 Oct 4:10 PM" },
      { who: "Divya", text: "uploaded the KYC pack", when: "4 Oct" },
      { who: "Pranay", text: "set due 5 Oct", when: "1 Oct" },
    ],
  },
  t02: {
    sessions: [{ when: "Mon 5 · 3:00 to 4:00", text: "Check the NOC draft" }],
    files: [{ name: "Rent agreement · stamped.pdf" }, { name: "NOC · unsigned.pdf" }],
    activity: [
      { who: "Rohan Kumar", text: "uploaded the stamped rent agreement", when: "6 Oct 10:40 AM" },
      { who: "Bharath", text: "sent back the NOC without signature", when: "3 Oct" },
      { who: "Pranay", text: "set due 9 Oct", when: "29 Sep" },
    ],
  },
  t13: {
    sessions: [{ when: "Tue 6 · 10:00 to 11:00", text: "FIRMS login and form check" }],
    files: [{ name: "FIRC · Corvid.pdf" }, { name: "FC-GPR form · draft.pdf" }],
    activity: [
      { who: "Mei Tanaka", text: "sent the FIRMS login", when: "6 Oct 10:12 AM" },
      { who: "Pranay", text: "set due 6 Oct", when: "1 Oct" },
    ],
  },
  t06: {
    sessions: [{ when: "Tue 6 · 2:00 to 3:30", text: "Reply to officer query" }],
    files: [{ name: "GST REG-03 notice.pdf" }, { name: "Rent agreement · Zenith.pdf" }],
    activity: [
      { who: "GST officer", text: "asked for a clearer rent agreement", when: "5 Oct" },
      { who: "Bharath", text: "filed the application · ARN received", when: "1 Oct" },
    ],
  },
  t04: {
    sessions: [{ when: "Tue 6 · 9:00 to 11:00", text: "KYC review" }],
    files: [{ name: "KYC · Rohan Kumar.pdf" }, { name: "KYC · Anita Shah.pdf" }],
    activity: [{ who: "Rohan Kumar", text: "submitted the KYC forms", when: "5 Oct" }],
  },
};

export function extraFor(t: StaffTask): Required<TaskExtra> {
  const x = TASK_EXTRA[t.id] ?? {};
  return {
    sessions: x.sessions ?? [],
    files: x.files ?? [],
    activity: x.activity ?? [{ who: t.setBy ?? t.owner, text: `set due ${t.due.getDate()} Oct`, when: "1 Oct" }],
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
