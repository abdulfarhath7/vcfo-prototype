import { STAFF_TODAY, TODAY, d, daysFrom, fmt } from "@/lib/dates";
import type { Area } from "./compliance";
import { REMINDERS, WORKFLOW, activity, type Activity, type TaskUrgency, type Visibility, type WorkflowStage } from "./activity-master";

// Occurrences for the statutory / non-statutory split (docs/COMPLIANCE-MODEL.md sections 3.2 to 3.4 and 5).
// SAMPLE DATA. Staff portals sit on Fri 16 Oct 2026; the client portal sits on Tue 6 Oct 2026.
// Non-statutory tasks are typed rows below. Statutory occurrences keep the existing obligation rows;
// `statDetail` adds the client inputs, the SBC values, the reminders, the progress and the history from the row's status.

export type { TaskUrgency, Visibility, WorkflowStage };
export type Category = "statutory" | "non-statutory";

/* ---------- Activity ids of the existing statutory rows ---------- */

/** Staff OB_TYPES ids (staff-regs-table.ts) and client OBLIGATIONS ids (compliance.ts) to the activity master. Rows without a master entry have no id. */
export const STAT_ACTIVITY: Record<string, string> = {
  // staff OB_TYPES
  gstr1: "ACT-001-1",
  gstr3b: "ACT-001-3B",
  tdsp: "ACT-002",
  tdsr: "ACT-012",
  adv: "ACT-011",
  ecr: "ACT-024",
  esim: "ACT-027",
  ptm: "ACT-025",
  pty: "ACT-025",
  lwf: "ACT-026",
  aoc4: "ACT-015-AOC4",
  mgt7: "ACT-015-MGT7",
  dir3: "ACT-M08",
  dpt3: "ACT-M07",
  msme1: "ACT-014",
  fla: "ACT-017",
  softex: "ACT-M02",
  posh: "ACT-021",
  tlren: "ACT-M10",
  seren: "ACT-M09",
  lutren: "ACT-M05",
  iecup: "ACT-M06",
  tax3cd: "ACT-029",
  // client OBLIGATIONS (ids not listed above)
  "tds-pay": "ACT-002",
  "pf-esi": "ACT-024",
  dir3kyc: "ACT-M08",
  "tds-26q": "ACT-012",
  "tds-24q": "ACT-012",
  ecb2: "ACT-M01",
  "adv-tax": "ACT-011",
};

export const activityOf = (obId: string): Activity | undefined => (STAT_ACTIVITY[obId] ? activity(STAT_ACTIVITY[obId]) : undefined);

/* ---------- Status words (COMPLIANCE-MODEL.md 3.3) ---------- */

export type StatusWord = "Not started" | "In progress" | "Waiting" | "Due soon" | "Overdue" | "Done";

const STAGE_WORD: Record<WorkflowStage, StatusWord> = {
  "not-started": "Not started",
  ready: "Not started",
  "in-progress": "In progress",
  review: "In progress",
  rework: "In progress",
  waiting: "Waiting",
  completed: "Done",
  "not-applicable": "Not started",
};

export const stageLabel = (s: WorkflowStage) => WORKFLOW.find((w) => w.stage === s)!.label;

/** The chip word: Overdue and Due soon come from the due date; the rest from the stage. */
export function statusWord(stage: WorkflowStage, due: Date, notifyDays: number, today: Date): StatusWord {
  if (stage === "completed") return "Done";
  const n = daysFrom(due, today);
  if (n < 0) return "Overdue";
  if (n <= notifyDays && (stage === "not-started" || stage === "ready")) return "Due soon";
  return STAGE_WORD[stage];
}

/* ---------- People ---------- */

export interface Step {
  label: string;
  state: "done" | "now" | "next";
  who?: string;
  when?: string;
  evidence?: string;
}

export interface HistoryEntry {
  when: string;
  who: string;
  what: string;
}

export interface ReminderRow {
  key: string;
  label: string;
  to: string;
  date: Date;
  state: "sent" | "acknowledged" | "scheduled" | "skipped";
  /** Escalations are internal; the client view hides them (D-4). */
  internal: boolean;
}

/** The six reminders of COMPLIANCE-MODEL.md 3.4, dated from the due date. */
export function remindersFor(a: Pick<Activity, "notifyDays"> | undefined, due: Date, done: boolean, today: Date, notifyDays?: number): ReminderRow[] {
  const days = notifyDays ?? a?.notifyDays ?? 5;
  const fake = { notifyDays: days } as Activity;
  return REMINDERS.map((r) => {
    const date = new Date(due.getFullYear(), due.getMonth(), due.getDate() + r.offset(fake));
    const past = date.getTime() <= today.getTime();
    const afterDue = r.offset(fake) > 0;
    const state: ReminderRow["state"] = done && afterDue ? "skipped" : !past ? "scheduled" : r.key === "initial" ? "acknowledged" : "sent";
    return { key: r.key, label: r.label, to: r.to, date, state, internal: r.key.startsWith("escalate") };
  });
}

/* ---------- Non-statutory tasks (sample, COMPLIANCE-MODEL.md 5) ---------- */

export type Repeats = "One-time" | "Weekly" | "Bi-weekly" | "Monthly" | "Quarterly" | "Yearly";

export interface NsTask {
  id: string;
  activityId: string;
  name: string;
  client: string;
  start: Date;
  end: Date;
  urgency: TaskUrgency;
  visibility: Visibility;
  owner: string;
  reviewer: string;
  stage: WorkflowStage;
  repeats: Repeats;
  notifyDays: number;
  checklist: Array<{ label: string; done: boolean; by?: string; when?: string }>;
  attachments: Array<{ name: string; by: string; when: string }>;
  comments: Array<{ by: string; when: string; text: string; internal?: boolean }>;
  history: HistoryEntry[];
  /** The file a completed task delivers (Filings F-2). */
  deliverable?: string;
  /** Who created the task. */
  createdBy: string;
}

/** Subtasks per activity. ACT-004 follows the master's checklist. */
const CHECKLIST: Record<string, string[]> = {
  "ACT-003": ["Collect bank balances", "Update the payables forecast", "Draft the funds request", "Send to the client for approval"],
  "ACT-004": ["Vendor bills and payroll entries", "Sales and expense entries", "Reimbursements and TDS receivables", "Month-end closure"],
  "ACT-005": ["Close the books", "Cost-plus working", "Manager review"],
  "ACT-006": ["Collect attendance and changes", "Validate the inputs", "Manual workings", "Share the payroll register"],
  "ACT-007": ["Update the asset register", "Insurance renewals list", "Depreciation working"],
  "ACT-008": ["Collect approved bills", "Prepare the payment batch", "Client releases the payment"],
  "ACT-009": ["Pull the month's figures", "Draft the MPR", "Manager review", "Send to the client"],
  "ACT-010": ["Update the tracker", "Prepare the deck", "Hold the call", "Send the minutes"],
  "ACT-031": ["Pull the ageing report", "Follow up overdue invoices", "Send the update"],
  "ACT-013": ["Agree the scope", "Do the work", "Review and close"],
};

const ACT_REPEATS: Record<string, Repeats> = {
  Weekly: "Weekly",
  "Bi-weekly": "Bi-weekly",
  Monthly: "Monthly",
  Quarterly: "Quarterly",
  Yearly: "Yearly",
  "One-time": "One-time",
} as Record<string, Repeats>;

type RawTask = [client: string, act: string, name: string, start: Date, end: Date, urgency: TaskUrgency, vis: Visibility, stage: WorkflowStage, deliverable?: string];

const OCT = (day: number) => d(2026, 10, day);
const NOV = (day: number) => d(2026, 11, day);

/** Staff sample: Pranay's 8 clients, 3 to 5 tasks each, dates around Fri 16 Oct 2026. */
const STAFF_RAW: RawTask[] = [
  ["northwind", "ACT-010", "Weekly client call and deck", OCT(12), OCT(19), "Medium", "both", "in-progress"],
  ["northwind", "ACT-004", "Month-end close · September", OCT(1), OCT(10), "High", "firm", "completed", "Close-checklist-Sep-2026.xlsx"],
  ["northwind", "ACT-009", "MPR · September", OCT(5), OCT(15), "High", "both", "completed", "MPR-Sep-2026.pdf"],
  ["northwind", "ACT-003", "Cash flow budget · November", OCT(19), OCT(28), "Medium", "both", "not-started"],
  ["northwind", "ACT-006", "Payroll inputs · October", OCT(14), OCT(23), "Critical", "both", "waiting"],
  ["orchid", "ACT-013", "Bank account opening papers", OCT(12), OCT(20), "High", "both", "waiting"],
  ["orchid", "ACT-010", "Weekly client call and deck", OCT(12), OCT(19), "Low", "both", "in-progress"],
  ["orchid", "ACT-008", "Vendor payments · week 42", OCT(13), OCT(16), "Medium", "client", "review"],
  ["larkspur", "ACT-004", "Month-end close · September", OCT(1), OCT(14), "High", "firm", "rework"],
  ["larkspur", "ACT-031", "Receivables update", OCT(12), OCT(19), "Low", "both", "in-progress"],
  ["larkspur", "ACT-007", "Insurance and depreciation · September", OCT(20), OCT(30), "Low", "firm", "not-started"],
  ["juniper", "ACT-003", "Cash flow budget · October", OCT(5), OCT(12), "Medium", "both", "completed", "Cash-flow-Oct-2026.xlsx"],
  ["juniper", "ACT-013", "Investor data room index", OCT(15), NOV(6), "Medium", "firm", "ready"],
  ["juniper", "ACT-010", "Weekly client call and deck", OCT(12), OCT(19), "Low", "both", "in-progress"],
  ["brightwave", "ACT-006", "Payroll inputs · October", OCT(14), OCT(23), "Critical", "both", "waiting"],
  ["brightwave", "ACT-005", "Books closure and cost-plus · September", OCT(2), OCT(14), "High", "firm", "in-progress"],
  ["brightwave", "ACT-009", "MPR · September", OCT(5), OCT(15), "Medium", "both", "completed", "MPR-Sep-2026.pdf"],
  ["brightwave", "ACT-008", "Vendor payments · week 43", OCT(19), OCT(23), "Medium", "both", "not-started"],
  ["tidewater", "ACT-031", "Receivables update", OCT(12), OCT(19), "Low", "both", "in-progress"],
  ["tidewater", "ACT-004", "Month-end close · September", OCT(1), OCT(10), "High", "firm", "completed", "Close-checklist-Sep-2026.xlsx"],
  ["tidewater", "ACT-007", "Insurance and depreciation · September", OCT(1), OCT(9), "Low", "firm", "completed", "Depreciation-Sep-2026.xlsx"],
  ["tidewater", "ACT-013", "Fixed asset tagging", OCT(21), NOV(13), "Low", "firm", "not-started"],
  ["kestrel", "ACT-010", "Weekly client call and deck", OCT(12), OCT(19), "Medium", "both", "review"],
  ["kestrel", "ACT-009", "MPR · September", OCT(5), OCT(15), "High", "both", "completed", "MPR-Sep-2026.pdf"],
  ["kestrel", "ACT-003", "Cash flow budget · November", OCT(19), OCT(30), "Medium", "both", "not-started"],
  ["kestrel", "ACT-006", "Payroll inputs · October", OCT(14), OCT(24), "Critical", "both", "in-progress"],
  ["halcyon", "ACT-008", "Vendor payments · week 42", OCT(13), OCT(16), "High", "client", "waiting"],
  ["halcyon", "ACT-005", "Books closure and cost-plus · September", OCT(2), OCT(14), "High", "firm", "completed", "Cost-plus-Sep-2026.xlsx"],
  ["halcyon", "ACT-013", "Board pack for the Q2 meeting", OCT(16), OCT(27), "High", "both", "in-progress"],
];

/** Client sample: Northwind on Tue 6 Oct 2026. The firm-only row stays hidden on the client portal (K-1). */
const CLIENT_RAW: RawTask[] = [
  ["northwind", "ACT-010", "Weekly client call and deck", d(2026, 10, 5), d(2026, 10, 12), "Medium", "both", "in-progress"],
  ["northwind", "ACT-006", "Payroll inputs · October", d(2026, 10, 1), d(2026, 10, 8), "Critical", "both", "waiting"],
  ["northwind", "ACT-008", "Vendor payments · week 41", d(2026, 10, 5), d(2026, 10, 9), "Low", "both", "in-progress"],
  ["northwind", "ACT-003", "Cash flow budget · November", d(2026, 10, 12), d(2026, 10, 22), "Medium", "client", "not-started"],
  ["northwind", "ACT-009", "MPR · August", d(2026, 9, 25), d(2026, 10, 5), "High", "both", "completed", "MPR-Aug-2026.pdf"],
  ["northwind", "ACT-004", "Month-end close · September", d(2026, 10, 1), d(2026, 10, 10), "High", "firm", "in-progress"],
];

/** Owner (the lead) and reviewer (the manager) of each staff client. Kept here so this file has no cycle with staff-clients.ts. */
const TEAM: Record<string, [string, string]> = {
  northwind: ["Bharath", "Pranay"],
  orchid: ["Sneha Kulkarni", "Pranay"],
  larkspur: ["Meera Nair", "Pranay"],
  juniper: ["Bharath", "Pranay"],
  brightwave: ["Sneha Kulkarni", "Pranay"],
  tidewater: ["Meera Nair", "Pranay"],
  kestrel: ["Bharath", "Pranay"],
  halcyon: ["Sneha Kulkarni", "Pranay"],
};

const CONTACT: Record<string, string> = {
  northwind: "Rohan Kumar",
  orchid: "Orchid Lane",
  larkspur: "Larkspur",
  juniper: "Juniper",
  brightwave: "Brightwave",
  tidewater: "Tidewater",
  kestrel: "Kestrel",
  halcyon: "Halcyon",
};

const DONE_AT: Record<WorkflowStage, number> = { "not-started": 0, ready: 0, waiting: 1, "in-progress": 1, rework: 2, review: 3, completed: 99, "not-applicable": 0 };

const plus = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const before = (a: Date, b: Date) => (a.getTime() < b.getTime() ? a : b);

function buildTask(r: RawTask, i: number, prefix: string, today: Date): NsTask {
  const [client, act, name, start, end, urgency, visibility, stage, deliverable] = r;
  const a = activity(act)!;
  const [owner, reviewer] = TEAM[client] ?? ["Bharath", "Pranay"];
  const list = CHECKLIST[act] ?? CHECKLIST["ACT-013"];
  const doneN = Math.min(list.length, DONE_AT[stage]);
  const checklist = list.map((label, k) => (k < doneN ? { label, done: true, by: owner, when: fmt(before(plus(start, k + 1), today)) } : { label, done: false }));
  const created = plus(start, -2);
  const history: HistoryEntry[] = [
    {
      when: fmt(created),
      who: reviewer,
      what: `Created the task · ${urgency} · ${visibility === "firm" ? "Firm only" : visibility === "client" ? "Client only" : "Firm and client"}`,
    },
  ];
  checklist.forEach((c) => c.done && history.push({ when: c.when!, who: owner, what: `Ticked "${c.label}"` }));
  if (stage === "waiting") history.push({ when: fmt(before(plus(start, 1), today)), who: owner, what: `Asked ${CONTACT[client]} for the inputs` });
  if (stage === "review") history.push({ when: fmt(before(plus(end, -1), today)), who: owner, what: "Submitted for review" });
  if (stage === "rework") history.push({ when: fmt(before(plus(end, -1), today)), who: reviewer, what: "Sent back for rework" });
  if (stage === "completed") history.push({ when: fmt(before(end, today)), who: reviewer, what: "Approved and closed" });
  const attachments = deliverable
    ? [{ name: deliverable, by: owner, when: fmt(before(end, today)) }]
    : stage === "waiting"
      ? []
      : doneN > 0
        ? [{ name: `${name.split(" · ")[0].replace(/\W+/g, "-")}-working.xlsx`, by: owner, when: checklist[0].when! }]
        : [];
  const comments =
    stage === "waiting"
      ? [{ by: owner, when: fmt(before(plus(start, 1), today)), text: "Please share the inputs by the end date." }]
      : stage === "rework"
        ? [{ by: reviewer, when: fmt(before(plus(end, -1), today)), text: "Reimbursement entries do not tie to the bank. Please recheck.", internal: true }]
        : [];
  return {
    id: `${prefix}${i + 1}`,
    activityId: act,
    name,
    client,
    start,
    end,
    urgency,
    visibility,
    owner,
    reviewer,
    stage,
    repeats: ACT_REPEATS[a.frequency] ?? "One-time",
    notifyDays: a.notifyDays,
    checklist,
    attachments,
    comments,
    history: history.reverse(),
    deliverable,
    createdBy: reviewer,
  };
}

export const STAFF_TASKS: NsTask[] = STAFF_RAW.map((r, i) => buildTask(r, i, "ns-", STAFF_TODAY));
export const CLIENT_TASKS: NsTask[] = CLIENT_RAW.map((r, i) => buildTask(r, i, "nsc-", TODAY));

export const staffTask = (id: string) => STAFF_TASKS.find((t) => t.id === id);
export const clientTask = (id: string) => CLIENT_TASKS.find((t) => t.id === id);

/** K-1: the client sees only tasks shared with the client. */
export const clientVisible = (t: NsTask) => t.visibility !== "firm";

export const taskWord = (t: NsTask, today: Date) => statusWord(t.stage, t.end, t.notifyDays, today);

/** S-3: rows group by end-date week. Weeks start on Monday. */
export type WeekGroup = "This week" | "Next week" | "Later" | "Done";
export const WEEK_GROUPS: WeekGroup[] = ["This week", "Next week", "Later", "Done"];
export function weekOf(t: NsTask, today: Date): WeekGroup {
  if (t.stage === "completed") return "Done";
  const monday = plus(today, -((today.getDay() + 6) % 7));
  const n = daysFrom(t.end, monday);
  return n < 7 ? "This week" : n < 14 ? "Next week" : "Later";
}

export const URGENCIES: TaskUrgency[] = ["Low", "Medium", "High", "Critical"];
export const URGENCY_BARS: Record<TaskUrgency, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
export const VISIBILITY_LABEL: Record<Visibility, string> = { firm: "Firm", client: "Client", both: "Both" };
export const REPEATS: Repeats[] = ["One-time", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Yearly"];

/** The progress steps of a non-statutory task (4.3): the workflow, without the statutory filing steps. */
export function taskSteps(t: NsTask, today: Date): Step[] {
  const labels = ["Created", "Inputs ready", "Work done", "Submitted for review", "Approved"];
  const at = t.stage === "completed" ? 5 : t.stage === "review" ? 3 : t.stage === "rework" ? 2 : t.stage === "in-progress" ? 2 : t.stage === "waiting" ? 1 : 1;
  return labels.map((label, i) => ({
    label,
    state: i < at ? "done" : i === at ? "now" : "next",
    who: i === 0 ? t.createdBy : i === 1 && t.stage === "waiting" ? CONTACT[t.client] : i === 4 ? t.reviewer : t.owner,
    when: i < at ? fmt(before(i === 0 ? plus(t.start, -2) : plus(t.start, i), today)) : undefined,
    evidence: i === 2 && i < at ? t.attachments[0]?.name : undefined,
  }));
}

/* ---------- Statutory occurrence detail (D-1 to D-4) ---------- */

export type InputStatus = "Asked" | "Received" | "Accepted" | "Sent back";

export interface ClientInput {
  label: string;
  required: boolean;
  status: InputStatus;
  file?: string;
  date?: string;
  by?: string;
  /** Not asked yet: the day VCFO asks. */
  planned?: string;
  /** Why it came back (staff only). */
  note?: string;
}

export interface SbcValue {
  label: string;
  value: string;
  who?: string;
  when?: string;
}

export interface PastPeriod {
  period: string;
  due: string;
  filed: string;
  late: boolean;
  ref: string;
}

export interface StatDetail {
  activity?: Activity;
  period: string;
  due: Date;
  stage: WorkflowStage;
  word: StatusWord;
  owner: string;
  reviewer: string;
  clientInputs: ClientInput[];
  filledBySbc: SbcValue[];
  reminders: ReminderRow[];
  steps: Step[];
  history: HistoryEntry[];
  past: PastPeriod[];
  /** Reviewer note, staff only (D-4). */
  reviewNote?: string;
}

/** The row states of the staff list and the client status words, as one input. */
export type RowState = "done" | "run" | "wait" | "none" | "bad";

export interface StatInput {
  key: string;
  obId: string;
  name: string;
  area: Area | "Internal";
  frequency: string;
  due: Date;
  state: RowState;
  needs: string[];
  clientShort: string;
  owner: string;
  reviewer: string;
  today: Date;
}

const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The period a due date closes: the month before for monthly work, the quarter or half before, or the financial year. */
export function periodOf(freq: string, due: Date) {
  const m = due.getMonth();
  const y = due.getFullYear();
  const prev = new Date(y, m - 1, 1);
  if (/^m/i.test(freq)) return `${MONTH_LONG[prev.getMonth()]} ${prev.getFullYear()}`;
  if (/^q/i.test(freq)) {
    const fq = Math.floor(((prev.getMonth() + 9) % 12) / 3) + 1;
    const fy = prev.getMonth() >= 3 ? prev.getFullYear() : prev.getFullYear() - 1;
    return `Q${fq} ${fy}-${String(fy + 1).slice(2)}`;
  }
  if (/^h/i.test(freq))
    return prev.getMonth() >= 3 && prev.getMonth() <= 8 ? `Apr–Sep ${prev.getFullYear()}` : `Oct–Mar ${prev.getMonth() <= 2 ? prev.getFullYear() - 1 : prev.getFullYear()}`;
  const fy = m >= 3 ? y - 1 : y - 2;
  return `FY ${fy}-${String(fy + 1).slice(2)}`;
}

const STAGE_OF: Record<RowState, WorkflowStage> = { done: "completed", run: "in-progress", wait: "waiting", none: "not-started", bad: "waiting" };
/** Steps done for each state: 0 Data from client · 1 Prepared · 2 Submitted · 3 Approved · 4 Filed or paid · 5 Acknowledged. */
const STEPS_DONE: Record<RowState, number> = { done: 6, run: 1, wait: 0, none: 0, bad: 0 };
const STEP_LABELS = ["Data from client", "Prepared", "Submitted for review", "Approved", "Filed or paid", "Acknowledged"];

/** Sample references, stable per key. */
function code(key: string, n: number) {
  let h = 7;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % 1000003;
  return String((h * (n + 3)) % 10 ** 6).padStart(6, "0");
}

function sbcFields(area: StatInput["area"], key: string, period: string, filedOn: string | undefined, prepared: boolean, owner: string, preparedOn: string): SbcValue[] {
  const v = (label: string, value: string | undefined, when?: string): SbcValue => (value ? { label, value, who: owner, when } : { label, value: "-" });
  const n = (Number(code(key, 1)) % 900) + 100;
  const filedOnly = (x: string) => (filedOn ? x : undefined);
  const prepOnly = (x: string) => (prepared ? x : undefined);
  const rows: SbcValue[] = [{ label: "Period", value: period }];
  if (area === "GST") {
    rows.push(
      v("Taxable value", prepOnly(`₹${n},${code(key, 2).slice(0, 3)}`), preparedOn),
      v("Tax paid", prepOnly(`₹${Math.round(n * 0.18)},${code(key, 3).slice(0, 3)}`), preparedOn),
      v("Challan (CPIN)", filedOnly(`26103600${code(key, 4)}`), filedOn),
      v("ARN", filedOnly(`AA36102${code(key, 5)}Z`), filedOn),
    );
  } else if (area === "Income tax") {
    rows.push(
      v("Amount", prepOnly(`₹${n},${code(key, 2).slice(0, 3)}`), preparedOn),
      v("Challan (BSR · serial)", filedOnly(`0510308 · ${code(key, 4).slice(0, 5)}`), filedOn),
      v("Acknowledgement", filedOnly(`Q${code(key, 5)}`), filedOn),
    );
  } else if (area === "Payroll") {
    rows.push(
      v("Employees", prepOnly(String(10 + (n % 30))), preparedOn),
      v("Contribution", prepOnly(`₹${n},${code(key, 2).slice(0, 3)}`), preparedOn),
      v("TRRN", filedOnly(`3${code(key, 4)}${code(key, 5).slice(0, 4)}`), filedOn),
    );
  } else {
    rows.push(v("Form prepared", prepOnly("Yes"), preparedOn), v("SRN", filedOnly(`AB${code(key, 4)}`), filedOn));
  }
  rows.push(filedOn ? { label: "Filed on", value: filedOn, who: owner, when: filedOn } : { label: "Filed on", value: "-" });
  return rows;
}

/** Last six periods, newest first. One filed late, to show the mark. */
function pastPeriods(freq: string, due: Date, key: string): PastPeriod[] {
  const step = /^m/i.test(freq) ? 1 : /^q/i.test(freq) ? 3 : /^h/i.test(freq) ? 6 : 12;
  const lateAt = Number(code(key, 6)) % 6;
  return Array.from({ length: 6 }, (_, i) => {
    const dd = new Date(due.getFullYear(), due.getMonth() - step * (i + 1), due.getDate());
    const late = i === lateAt && i > 0;
    const filed = plus(dd, late ? 3 : -1 - (i % 3));
    return { period: periodOf(freq, dd), due: `${fmt(dd)} ${dd.getFullYear()}`, filed: `${fmt(filed)} ${filed.getFullYear()}`, late, ref: `${code(key, 10 + i)}` };
  });
}

export function statDetail(x: StatInput): StatDetail {
  const a = activityOf(x.obId);
  // An overdue row is the period before: its due date has passed.
  const step = /^m/i.test(x.frequency) ? 1 : /^q/i.test(x.frequency) ? 3 : /^h/i.test(x.frequency) ? 6 : 12;
  const due = x.state === "bad" && x.due.getTime() >= x.today.getTime() ? new Date(x.due.getFullYear(), x.due.getMonth() - step, x.due.getDate()) : x.due;
  const period = periodOf(x.frequency, due);
  const stage = x.state === "run" && Number(code(x.key, 7)) % 2 ? "review" : STAGE_OF[x.state];
  const doneN = stage === "review" ? 2 : STEPS_DONE[x.state];
  // Work opens before the reminders start; rows already under way opened at least six days ago.
  const planned = plus(due, -Math.max(8, a?.notifyDays ?? 5) - 4);
  const open = x.state === "none" ? planned : before(planned, plus(x.today, -6));
  const at = (i: number) => fmt(before(plus(open, i * 2 + 1), plus(x.today, -1)));

  const clientInputs: ClientInput[] = x.needs.map((label, i) => {
    const required = i < 2 || x.needs.length <= 2;
    if (x.state === "done" || x.state === "run") return { label, required, status: "Accepted", file: `${label.replace(/\W+/g, "-")}.pdf`, date: at(0), by: x.clientShort };
    if (x.state === "none")
      return open.getTime() > x.today.getTime() ? { label, required, status: "Asked", planned: fmt(open) } : { label, required, status: "Asked", date: fmt(open) };
    // Waiting or overdue: the first arrived, the second came back, the rest are asked.
    if (i === 0) return { label, required, status: "Received", file: `${label.replace(/\W+/g, "-")}.pdf`, date: at(1), by: x.clientShort };
    if (i === 1) return { label, required, status: "Sent back", file: `${label.replace(/\W+/g, "-")}-v1.pdf`, date: at(1), by: x.clientShort, note: "Pages 3 and 4 are missing." };
    return { label, required, status: "Asked", date: fmt(open) };
  });

  const filedOn = x.state === "done" ? at(4) : undefined;
  const filledBySbc = sbcFields(x.area, x.key, period, filedOn, doneN >= 2, x.owner, at(1));

  const steps: Step[] = STEP_LABELS.map((label, i) => {
    const state = i < doneN ? "done" : i === doneN && x.state !== "done" ? "now" : "next";
    const who =
      i === 0
        ? x.clientShort
        : i === 3
          ? x.reviewer
          : i === 5
            ? x.area === "GST"
              ? "GST portal"
              : x.area === "MCA"
                ? "MCA portal"
                : x.area === "Payroll"
                  ? "EPFO portal"
                  : "Income-tax portal"
            : x.owner;
    const evidence =
      i === 0 && i < doneN
        ? `${clientInputs.filter((c) => c.status === "Accepted").length} files accepted`
        : i === 1 && i < doneN
          ? "Working paper"
          : i === 4 && i < doneN
            ? filledBySbc.find((f) => /Challan|SRN|TRRN/.test(f.label))?.value
            : i === 5 && i < doneN
              ? filledBySbc.find((f) => /ARN|Acknowledgement|SRN|TRRN/.test(f.label))?.value
              : undefined;
    return { label, state, who, when: i < doneN ? at(i) : undefined, evidence };
  });

  const history: HistoryEntry[] = [];
  if (open.getTime() <= x.today.getTime())
    history.push({ when: fmt(open), who: x.owner, what: `Asked ${x.clientShort} for ${x.needs.length} item${x.needs.length === 1 ? "" : "s"}` });
  clientInputs.forEach((c) => c.status !== "Asked" && history.push({ when: c.date!, who: c.by!, what: `Uploaded ${c.file}` }));
  clientInputs.forEach((c) => c.status === "Sent back" && history.push({ when: c.date!, who: x.owner, what: `Sent back ${c.label}: ${c.note}` }));
  steps.slice(1).forEach((s) => s.state === "done" && history.push({ when: s.when!, who: s.who!, what: s.label }));
  const reminders = remindersFor(a, due, x.state === "done", x.today);
  reminders.forEach(
    (r) => (r.state === "sent" || r.state === "acknowledged") && history.push({ when: fmt(r.date), who: "VCFO", what: `${r.label} reminder to ${r.to.toLowerCase()}` }),
  );

  return {
    activity: a,
    period,
    due,
    stage,
    word: statusWord(stage, due, a?.notifyDays ?? 5, x.today),
    owner: x.owner,
    reviewer: x.reviewer,
    clientInputs,
    filledBySbc,
    reminders,
    steps,
    history: history.sort((p, q) => dayNum(q.when) - dayNum(p.when)),
    past: pastPeriods(x.frequency, due, x.key),
    reviewNote: stage === "review" ? `${x.reviewer}: figures tie to the books. Approve after the challan check.` : undefined,
  };
}

/** "14 Oct" as a sortable number, for the history order. */
const dayNum = (s: string) => {
  const [dd, m] = s.split(" ");
  return MON.indexOf(m) * 100 + Number(dd);
};

/** Days to due, or days overdue: "Due in 4 days", "3 days overdue". */
export function dueText(due: Date, today: Date, done: boolean) {
  if (done) return "Filed";
  const n = daysFrom(due, today);
  return n < 0 ? `${-n} day${n === -1 ? "" : "s"} overdue` : n === 0 ? "Due today" : `Due in ${n} day${n === 1 ? "" : "s"}`;
}
