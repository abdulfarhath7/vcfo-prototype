import { d } from "@/lib/dates";
import type { StaffPortal } from "@/data/staff-clients";

// Tasks, inbox and approvals for the staff portals.
// Ported from reference/old-screens/s/admin/data.js (TASKS, MTASKS), s/lead/Main.dc.html (Q, TRI, TODO) and s/lead/Work.dc.html.
// Dates as in the old prototype: staff "today" is Fri 16 Oct 2026 (STAFF_TODAY).

export type TaskStatus = "Overdue" | "Due this week" | "In progress" | "With client" | "Not started" | "Done";

export const taskTone = {
  Overdue: "bad",
  "Due this week": "warn",
  "In progress": "prog",
  "With client": "teal",
  "Not started": "idle",
  Done: "ok",
} as const satisfies Record<TaskStatus, string>;

export interface CheckItem {
  id: string;
  label: string;
  done: boolean;
}

export interface StaffTask {
  id: string;
  title: string;
  /** Client id (staff-clients.ts). */
  client: string;
  /** Incorporation step number, when the task is a step. */
  step?: number;
  /** "Step 7", "Reg-1". Blank for filings and to-dos. */
  code?: string;
  owner: string;
  /** Who set the dates. */
  setBy?: string;
  due: Date;
  status: TaskStatus;
  area: "MCA" | "GST" | "Income tax" | "Payroll" | "FEMA";
  notes?: string;
  checklist?: CheckItem[];
}

const ck = (id: string, items: Array<[string, boolean]>): CheckItem[] => items.map(([label, done], i) => ({ id: `${id}-${i}`, label, done }));

/** Manager item kinds (admin Work "By kind"). */
export type ItemKind = "Approval" | "Review" | "Escalation" | "Client" | "Assignment";

/** Bharath's own work on the lead portal (reference/old-screens/s/lead/Work.dc.html, WorkPlan.dc.html, WorkDrawer.dc.html). */
export const LEAD_WORK: StaffTask[] = [
  { id: "t16", title: "Bank account opening", client: "brightwave", step: 17, code: "Step 17", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 15), status: "Overdue", area: "MCA", notes: "Bank needs a fresh Board resolution with the new signatory. Client signs Monday.", checklist: ck("t16", [["KYC of directors", true], ["Board resolution for bank", true], ["Address proof", true], ["Signatory list signed again", false], ["Account number to client", false]]) },
  { id: "t31", title: "PF ECR · September", client: "halcyon", owner: "Bharath", due: d(2026, 10, 15), status: "Overdue", area: "Payroll" },
  { id: "t13", title: "FC-GPR filing", client: "tidewater", step: 22, code: "Step 22", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 16), status: "Due this week", area: "FEMA", notes: "FIRMS login received from the client. Form waits for Pranay's approval.", checklist: ck("t13", [["FIRMS login", true], ["KYC of foreign investor", true], ["FIRC and bank certificate", true], ["Manager approval", false]]) },
  { id: "t07", title: "TDS challan · September", client: "kestrel", owner: "Bharath", due: d(2026, 10, 20), status: "Due this week", area: "Income tax" },
  { id: "t32", title: "GSTR-1 · September", client: "halcyon", owner: "Bharath", due: d(2026, 10, 20), status: "Due this week", area: "GST" },
  { id: "t14", title: "TDS 24Q · Q2 return", client: "tidewater", owner: "Bharath", due: d(2026, 10, 23), status: "Due this week", area: "Income tax" },
  { id: "t10", title: "KYC review and DSC", client: "orchid", step: 10, code: "Step 10", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 19), status: "In progress", area: "MCA", notes: "Client submitted KYC. Review and apply for DSC.", checklist: ck("t10", [["KYC of directors", true], ["DSC application", false], ["DSC tokens to client", false]]) },
  { id: "t06", title: "GST registration", client: "kestrel", code: "Reg-1", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 20), status: "In progress", area: "GST", notes: "ARN generated. Officer asked for a clearer rent agreement.", checklist: ck("t06", [["Application filed", true], ["ARN received", true], ["Reply to officer query", false], ["Certificate to client", false]]) },
  { id: "t19", title: "Draft Board resolution", client: "larkspur", step: 2, code: "Step 2", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 21), status: "In progress", area: "MCA" },
  { id: "t02", title: "Registered office NOC and utility bill", client: "northwind", step: 7, code: "Step 7", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 20), status: "With client", area: "MCA", notes: "Rent agreement accepted. NOC came back without the owner's signature. Utility bill not sent yet.", checklist: ck("t02", [["Address details", true], ["Rent agreement", true], ["NOC from owner", false], ["Utility bill under 2 months", false]]) },
  { id: "t11", title: "Trademark registration", client: "halcyon", code: "Reg-15", owner: "Bharath", due: d(2026, 10, 25), status: "With client", area: "MCA", notes: "Logo file in SVG asked on 13 Oct." },
  { id: "t21", title: "Client details", client: "juniper", step: 1, code: "Step 1", owner: "Bharath", due: d(2026, 10, 22), status: "Not started", area: "MCA" },
  { id: "t20", title: "MOA and AOA drafting", client: "larkspur", code: "Step 11", owner: "Bharath", due: d(2026, 10, 24), status: "Not started", area: "MCA" },
  { id: "t05", title: "INC-20A commencement prep", client: "northwind", code: "Step 20", owner: "Bharath", due: d(2026, 10, 30), status: "Not started", area: "MCA" },
  { id: "t33", title: "TDS challan · September", client: "brightwave", owner: "Bharath", due: d(2026, 10, 7), status: "Done", area: "Income tax" },
  { id: "t09", title: "Professional tax · September", client: "kestrel", owner: "Bharath", due: d(2026, 10, 10), status: "Done", area: "Payroll" },
  { id: "t15", title: "GSTR-1 · September", client: "tidewater", owner: "Bharath", due: d(2026, 10, 11), status: "Done", area: "GST" },
  { id: "t34", title: "GSTR-1 · September", client: "brightwave", owner: "Bharath", due: d(2026, 10, 11), status: "Done", area: "GST" },
  { id: "t12", title: "ADT-1 auditor appointment", client: "halcyon", code: "Step 21", owner: "Bharath", due: d(2026, 10, 12), status: "Done", area: "MCA" },
  { id: "t35", title: "Name approval", client: "orchid", step: 5, code: "Step 5", owner: "Bharath", due: d(2026, 10, 12), status: "Done", area: "MCA" },
  { id: "t36", title: "INC-20A commencement filing", client: "kestrel", code: "Step 20", owner: "Bharath", due: d(2026, 10, 13), status: "Done", area: "MCA" },
  { id: "t37", title: "PF ECR · September", client: "kestrel", owner: "Bharath", due: d(2026, 10, 15), status: "Done", area: "Payroll" },
  { id: "t38", title: "ESI challan · September", client: "tidewater", owner: "Bharath", due: d(2026, 10, 15), status: "Done", area: "Payroll" },
  { id: "t39", title: "FC-GPR form check", client: "tidewater", code: "Step 22", owner: "Bharath", due: d(2026, 10, 14), status: "Done", area: "FEMA" },
];

type Raw = [string, string, string, "bad" | "due" | "run" | "wait" | "none" | "done", number, StaffTask["area"], string?];
const ST: Record<Raw[3], TaskStatus> = { bad: "Overdue", due: "Due this week", run: "In progress", wait: "With client", none: "Not started", done: "Done" };
const day = (n: number) => (n > 31 ? d(2026, 11, n - 31) : d(2026, 10, n));
const stepNo = (code?: string) => (code && code.startsWith("Step ") ? Number(code.slice(5)) : undefined);
const raw = (prefix: string, rows: Raw[]): StaffTask[] =>
  rows.map(([title, client, owner, st, due, area, code], i) => ({ id: `${prefix}${String(i + 1).padStart(2, "0")}`, title, client, owner, status: ST[st], due: day(due), area, code, step: stepNo(code) }));

/** Project leads' tasks for the 14 clients of Krishna's three managers (reference/old-screens/s/admin/data.js TASKS). */
export const TASKS: StaffTask[] = raw("p", [
  ["Registered office NOC and utility bill", "northwind", "Bharath", "wait", 20, "MCA", "Step 7"],
  ["INC-20A commencement prep", "northwind", "Bharath", "none", 30, "MCA", "Step 20"],
  ["Client details form", "juniper", "Bharath", "wait", 22, "MCA", "Step 1"],
  ["GST registration", "kestrel", "Bharath", "run", 20, "GST", "Reg-1"],
  ["TDS challan · October", "kestrel", "Bharath", "due", 17, "Income tax"],
  ["AOC-4 financial statements", "kestrel", "Bharath", "run", 29, "MCA"],
  ["Professional tax · October", "kestrel", "Bharath", "done", 10, "Payroll"],
  ["KYC review and DSC", "orchid", "Sneha Kulkarni", "run", 19, "MCA", "Step 10"],
  ["Bank account opening", "brightwave", "Sneha Kulkarni", "bad", 15, "MCA", "Step 17"],
  ["PF and ESI · September", "brightwave", "Sneha Kulkarni", "bad", 15, "Payroll"],
  ["GSTR-3B · September", "brightwave", "Sneha Kulkarni", "due", 20, "GST"],
  ["Trademark registration", "halcyon", "Sneha Kulkarni", "wait", 25, "MCA", "Reg-15"],
  ["ADT-1 auditor appointment", "halcyon", "Sneha Kulkarni", "done", 12, "MCA", "Step 21"],
  ["Draft Board resolution", "larkspur", "Meera Nair", "run", 21, "MCA", "Step 2"],
  ["MOA and AOA drafting", "larkspur", "Meera Nair", "none", 24, "MCA", "Step 11"],
  ["FC-GPR filing", "tidewater", "Meera Nair", "due", 16, "FEMA", "Step 22"],
  ["TDS 24Q · Q2 return", "tidewater", "Meera Nair", "run", 31, "Income tax"],
  ["GSTR-1 · September", "tidewater", "Meera Nair", "done", 11, "GST"],
  ["Share certificates (SH-1)", "saffron", "Aditi Rao", "run", 18, "MCA", "Step 19"],
  ["GSTR-1 · September", "saffron", "Aditi Rao", "done", 11, "GST"],
  ["PF registration", "indigo", "Aditi Rao", "due", 17, "Payroll", "Reg-6"],
  ["ESI registration", "indigo", "Aditi Rao", "none", 28, "Payroll", "Reg-4"],
  ["Reply to MCA remarks on SPICe+", "monsoon", "Kabir Sethi", "bad", 13, "MCA", "Step 13"],
  ["DSC for two directors", "monsoon", "Kabir Sethi", "done", 9, "MCA", "Step 10"],
  ["Name resubmission after RUN rejection", "banyan", "Nikhil Jain", "bad", 14, "MCA", "Step 4"],
  ["Subscriber details", "quartz", "Nikhil Jain", "wait", 22, "MCA", "Step 9"],
  ["ADT-1 auditor appointment", "coral", "Tara Menon", "wait", 23, "MCA", "Step 21"],
  ["TDS challan · October", "coral", "Tara Menon", "due", 17, "Income tax"],
  ["GSTR-3B · September", "coral", "Tara Menon", "done", 14, "GST"],
]);

/** Manager-level items (reference/old-screens/s/admin/data.js MTASKS). Admin Work and the manager and admin action queues. */
export const MANAGER_TASKS: Array<StaffTask & { kind: ItemKind }> = (
  [
    ["Approve Board resolution", "larkspur", "Pranay", "due", 19, "MCA", "Step 2", "Approval"],
    ["Review FC-GPR before filing", "tidewater", "Pranay", "due", 16, "FEMA", "Step 22", "Review"],
    ["Escalate bank account delay", "brightwave", "Pranay", "bad", 15, "MCA", "Step 17", "Escalation"],
    ["Client call on office NOC", "northwind", "Pranay", "wait", 20, "MCA", "Step 7", "Client"],
    ["Assign a project lead to Juniper Bio", "juniper", "Pranay", "done", 9, "MCA", undefined, "Assignment"],
    ["Approve GST registration", "kestrel", "Pranay", "run", 20, "GST", "Reg-1", "Approval"],
    ["Answer MCA remarks with Kabir", "monsoon", "Priya Raman", "bad", 13, "MCA", "Step 13", "Escalation"],
    ["Approve share certificates", "saffron", "Priya Raman", "run", 18, "MCA", "Step 19", "Approval"],
    ["Review PF registration", "indigo", "Priya Raman", "due", 17, "Payroll", "Reg-6", "Review"],
    ["New name options after RUN rejection", "banyan", "Arjun Mehta", "bad", 14, "MCA", "Step 4", "Escalation"],
    ["Client call on auditor", "coral", "Arjun Mehta", "wait", 23, "MCA", "Step 21", "Client"],
    ["Approve subscriber sheet", "quartz", "Arjun Mehta", "run", 22, "MCA", "Step 9", "Approval"],
    ["Assign a project lead to Quartz Mobility", "quartz", "Arjun Mehta", "done", 8, "MCA", undefined, "Assignment"],
  ] as Array<[...Raw, ItemKind]>
).map(([title, client, owner, st, due, area, code, kind], i) => ({ id: `m${String(i + 1).padStart(2, "0")}`, title, client, owner, status: ST[st], due: day(due), area, code, step: stepNo(code), kind }));

/** Action queue on the lead and manager Today (reference/old-screens/s/lead/Main.dc.html Q, the mixed view).
 * Status maps to the old columns: Overdue, Due today ("Due this week"), My step ("In progress"), Waiting ("With client"). */
export const LEAD_QUEUE: StaffTask[] = [
  { id: "q01", title: "Registered office address", client: "northwind", step: 7, code: "Step 7", owner: "Bharath", due: d(2026, 10, 20), status: "With client", area: "MCA", notes: "Waiting client · utility bill" },
  { id: "q02", title: "KYC review and DSC", client: "orchid", step: 10, code: "Step 10", owner: "Bharath", due: d(2026, 10, 19), status: "In progress", area: "MCA", notes: "Client submitted · review" },
  { id: "q03", title: "Draft Board resolution", client: "larkspur", step: 2, code: "Step 2", owner: "Bharath", due: d(2026, 10, 21), status: "In progress", area: "MCA", notes: "Accepted · deliver" },
  { id: "q04", title: "Client details", client: "juniper", step: 1, code: "Step 1", owner: "Bharath", due: d(2026, 10, 22), status: "With client", area: "MCA", notes: "Document request" },
  { id: "q05", title: "Bank account opening", client: "brightwave", step: 17, code: "Step 17", owner: "Bharath", due: d(2026, 10, 14), status: "Overdue", area: "MCA", notes: "Rejected · fix" },
  { id: "q06", title: "Board minutes", client: "brightwave", step: 18, code: "Step 18", owner: "Bharath", due: d(2026, 10, 19), status: "In progress", area: "MCA", notes: "Client submitted · review" },
  { id: "q07", title: "FC-GPR filing", client: "tidewater", step: 22, code: "Step 22", owner: "Bharath", due: d(2026, 10, 15), status: "Overdue", area: "FEMA", notes: "Overdue" },
  { id: "q08", title: "FC-GPR form approval", client: "tidewater", step: 22, code: "Step 22", owner: "Bharath", due: d(2026, 10, 19), status: "With client", area: "FEMA", notes: "Waiting manager · 3d" },
  { id: "q09", title: "GST registration", client: "kestrel", code: "Reg-1", owner: "Bharath", due: d(2026, 10, 16), status: "Due this week", area: "GST", notes: "In progress" },
  { id: "q10", title: "Registration doc pack", client: "kestrel", owner: "Bharath", due: d(2026, 10, 19), status: "In progress", area: "GST", notes: "Accepted · deliver" },
  { id: "q11", title: "GSTR-1 · September", client: "halcyon", owner: "Bharath", due: d(2026, 10, 20), status: "Due this week", area: "GST", notes: "Filing" },
];

/** Pranay's team tasks on the manager Today (reference/old-screens/s/mgr/Main.dc.html MT_ROWS, week of 16 Oct). */
export const MGR_TEAM: StaffTask[] = raw("mt", [
  ["PAN and TAN application", "northwind", "Sneha Kulkarni", "bad", 14, "Income tax"],
  ["PF and ESI · September", "brightwave", "Sneha Kulkarni", "bad", 15, "Payroll"],
  ["DSC for 2 directors", "juniper", "Meera Nair", "due", 18, "MCA"],
  ["GSTR-3B · September", "brightwave", "Sneha Kulkarni", "due", 20, "GST"],
  ["MOA and AOA drafting", "larkspur", "Meera Nair", "run", 22, "MCA", "Step 11"],
  ["INC-20A · commencement filing", "northwind", "Sneha Kulkarni", "run", 24, "MCA", "Step 20"],
  ["AOC-4 · financial statements", "kestrel", "Meera Nair", "run", 29, "MCA"],
  ["TDS 24Q · Q2 return", "tidewater", "Bharath", "run", 31, "Income tax"],
  ["ADT-1 · auditor appointment", "halcyon", "Sneha Kulkarni", "wait", 19, "MCA", "Step 21"],
  ["Name approval · RUN resubmission", "orchid", "Bharath", "wait", 21, "MCA", "Step 5"],
  ["Professional tax · October", "kestrel", "Meera Nair", "none", 31, "Payroll"],
  ["MGT-7 annual return", "halcyon", "Sneha Kulkarni", "none", 59, "MCA"],
  ["GSTR-1 · September", "tidewater", "Bharath", "done", 11, "GST"],
  ["Board resolution · bank account", "orchid", "Bharath", "done", 12, "MCA"],
]);


/** Tasks a portal works on: Bharath's own work, Pranay's team (old manager Today), the whole firm for admin. */
export function tasksFor(portal: StaffPortal): StaffTask[] {
  if (portal === "lead") return LEAD_WORK;
  if (portal === "manager") return MGR_TEAM;
  return TASKS;
}

/** Action queue: open items for the person signed in. Lead and manager share the old Main.dc.html queue. */
export function queueFor(portal: StaffPortal): StaffTask[] {
  const open = (t: StaffTask) => t.status !== "Done";
  const byDue = (a: StaffTask, b: StaffTask) => a.due.getTime() - b.due.getTime();
  if (portal === "lead" || portal === "manager") return LEAD_QUEUE;
  return MANAGER_TASKS.filter(open).sort(byDue);
}

export interface InboxItem {
  id: string;
  client: string;
  text: string;
  from: string;
  time: string;
  unread?: boolean;
}

export const INBOX: Record<StaffPortal, InboxItem[]> = {
  lead: [
    { id: "i1", client: "northwind", text: "Rohan uploaded the stamped rent agreement", from: "Client upload", time: "Now", unread: true },
    { id: "i2", client: "tidewater", text: "Mei Tanaka replied: \"FIRMS login sent\"", from: "Email", time: "10:12", unread: true },
    { id: "i3", client: "orchid", text: "MCA: SRN AB1234 approved", from: "MCA mail", time: "09:40" },
    { id: "i4", client: "kestrel", text: "Pranay: \"Push Kestrel GST today\"", from: "Manager note", time: "09:05" },
    { id: "i5", client: "northwind", text: "New upload: utility bill (blurred)", from: "Client upload", time: "Thu" },
  ],
  manager: [
    { id: "i1", client: "northwind", text: "Rohan uploaded the stamped rent agreement", from: "Client upload", time: "Now", unread: true },
    { id: "i2", client: "tidewater", text: "Mei Tanaka replied: \"FIRMS login sent\"", from: "Email", time: "10:12", unread: true },
    { id: "i3", client: "orchid", text: "MCA: SRN AB1234 approved", from: "MCA mail", time: "09:40" },
    { id: "i4", client: "kestrel", text: "Pranay: \"Push Kestrel GST today\"", from: "Manager note", time: "09:05" },
    { id: "i5", client: "northwind", text: "New upload: utility bill (blurred)", from: "Client upload", time: "Thu" },
  ],
  admin: [
    { id: "i1", client: "brightwave", text: "Pranay: bank account delay needs your call", from: "Escalation", time: "11:10", unread: true },
    { id: "i2", client: "monsoon", text: "Priya Raman: MCA remarks on SPICe+ due again", from: "Escalation", time: "10:05", unread: true },
    { id: "i3", client: "banyan", text: "Arjun Mehta: RUN rejected, new names sent", from: "Manager note", time: "09:30" },
    { id: "i4", client: "saffron", text: "Share certificates signed by both directors", from: "Client upload", time: "08:50" },
  ],
};

export interface Approval {
  id: string;
  client: string;
  title: string;
  by: string;
  sent: Date;
  href?: string;
}

export const APPROVALS: Record<"manager" | "admin", Approval[]> = {
  manager: [
    { id: "a1", client: "tidewater", title: "Review FC-GPR before filing", by: "Meera Nair", sent: d(2026, 10, 16) },
    { id: "a2", client: "larkspur", title: "Approve Board resolution", by: "Meera Nair", sent: d(2026, 10, 19) },
    { id: "a3", client: "kestrel", title: "Approve GST registration", by: "Bharath", sent: d(2026, 10, 20) },
  ],
  admin: [
    { id: "a1", client: "brightwave", title: "Escalation: bank account delay", by: "Pranay", sent: d(2026, 10, 15) },
    { id: "a2", client: "monsoon", title: "Escalation: MCA remarks on SPICe+", by: "Priya Raman", sent: d(2026, 10, 13) },
    { id: "a3", client: "banyan", title: "Escalation: new name options after RUN rejection", by: "Arjun Mehta", sent: d(2026, 10, 14) },
  ],
};

/** E-08: the staff user's previous visit, when the browser has none stored (Thu 15 Oct, end of day). */
export const PREVIOUS_VISIT = new Date(2026, 9, 15, 18, 20);

/** E-08: when a task last changed (status, owner, note or file). Only a few rows; the rest changed before the previous visit. */
const at = (day: number, h: number, m: number) => new Date(2026, 9, day, h, m);
export const TASK_CHANGED: Record<string, Date> = {
  // Pranay's team (manager Today)
  mt01: at(16, 9, 12),
  mt04: at(16, 10, 5),
  mt09: at(16, 11, 40),
  mt05: at(15, 16, 10),
  // Bharath's work (lead and manager Work)
  t13: at(16, 9, 30),
  t02: at(16, 10, 48),
  t06: at(16, 8, 55),
  t16: at(15, 17, 5),
  // The firm (admin Work)
  p09: at(16, 9, 20),
  p16: at(16, 11, 2),
  p23: at(16, 10, 15),
};
export const taskChanged = (t: { id: string }) => TASK_CHANGED[t.id];
