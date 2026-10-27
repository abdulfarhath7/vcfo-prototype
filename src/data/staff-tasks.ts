import { d } from "@/lib/dates";
import { STAFF_CLIENTS, type StaffPortal } from "@/data/staff-clients";

// Tasks, inbox and approvals for the staff portals.
// Ported from reference/old-screens/s/admin/data.js (TASKS, MTASKS) and s/lead/Main.dc.html (TRI, TODO).
// Dates move back 10 days: the old "today" was 16 Oct, ours is 6 Oct.

export type TaskStatus = "Overdue" | "Due this week" | "In progress" | "With client" | "Not started" | "Done";

export const taskTone = {
  Overdue: "bad",
  "Due this week": "warn",
  "In progress": "prog",
  "With client": "warn",
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

/** Project leads' tasks (Pranay's team and the other managers' teams). */
export const TASKS: StaffTask[] = [
  { id: "t01", title: "Passport copy sent back", client: "northwind", step: 8, code: "Step 8", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 2), status: "Overdue", area: "MCA", notes: "Director 1 scan is not legible. Rohan sends a fresh colour scan.", checklist: ck("t01", [["Director 1 passport", false], ["Director 2 passport", true], ["Address proof for both", true]]) },
  { id: "t02", title: "Registered office NOC and utility bill", client: "northwind", step: 7, code: "Step 7", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 9), status: "With client", area: "MCA", notes: "Rent agreement accepted. NOC came back without the owner's signature. Utility bill not sent yet.", checklist: ck("t02", [["Address details", true], ["Rent agreement", true], ["NOC from owner", false], ["Utility bill under 2 months", false]]) },
  { id: "t03", title: "Subscriber details", client: "northwind", step: 9, code: "Step 9", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 8), status: "With client", area: "MCA" },
  { id: "t04", title: "KYC review and DSC", client: "northwind", step: 10, code: "Step 10", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 13), status: "In progress", area: "MCA", checklist: ck("t04", [["KYC of directors", true], ["DSC application", false], ["DSC tokens to client", false]]) },
  { id: "t05", title: "INC-20A commencement prep", client: "northwind", code: "Step 20", owner: "Bharath", due: d(2026, 10, 20), status: "Not started", area: "MCA" },
  { id: "t06", title: "GST registration", client: "zenith", code: "Reg-1", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 10), status: "In progress", area: "GST", notes: "ARN generated. Officer asked for a clearer rent agreement.", checklist: ck("t06", [["Application filed", true], ["ARN received", true], ["Reply to officer query", false], ["Certificate to client", false]]) },
  { id: "t07", title: "TDS challan · September", client: "zenith", owner: "Bharath", due: d(2026, 10, 7), status: "Due this week", area: "Income tax" },
  { id: "t08", title: "AOC-4 financial statements", client: "zenith", owner: "Meera Nair", due: d(2026, 10, 19), status: "In progress", area: "MCA" },
  { id: "t09", title: "Professional tax · September", client: "zenith", owner: "Bharath", due: d(2026, 9, 30), status: "Done", area: "Payroll" },
  { id: "t10", title: "KYC review and DSC", client: "bluefin", code: "Step 10", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 9), status: "In progress", area: "MCA", notes: "Client submitted KYC. Review and apply for DSC." },
  { id: "t11", title: "Trademark registration", client: "arcadia", code: "Reg-15", owner: "Bharath", due: d(2026, 10, 15), status: "With client", area: "MCA", notes: "Logo file in SVG asked on 3 Oct." },
  { id: "t12", title: "ADT-1 auditor appointment", client: "arcadia", code: "Step 21", owner: "Bharath", due: d(2026, 10, 2), status: "Done", area: "MCA" },
  { id: "t13", title: "FC-GPR filing", client: "corvid", code: "Step 22", owner: "Bharath", setBy: "Pranay", due: d(2026, 10, 6), status: "Due this week", area: "FEMA", notes: "FIRMS login received from the client. Form waits for Pranay's approval.", checklist: ck("t13", [["FIRMS login", true], ["KYC of foreign investor", true], ["FIRC and bank certificate", true], ["Manager approval", false]]) },
  { id: "t14", title: "TDS 24Q · Q2 return", client: "corvid", owner: "Meera Nair", due: d(2026, 10, 21), status: "In progress", area: "Income tax" },
  { id: "t15", title: "GSTR-1 · September", client: "corvid", owner: "Meera Nair", due: d(2026, 10, 1), status: "Done", area: "GST" },
  { id: "t16", title: "Bank account opening", client: "delta", code: "Step 17", owner: "Divya", setBy: "Pranay", due: d(2026, 10, 5), status: "Overdue", area: "MCA", notes: "Bank needs a fresh Board resolution with the new signatory. Client signs Monday.", checklist: ck("t16", [["KYC of directors", true], ["Board resolution for bank", true], ["Address proof", true], ["Signatory list signed again", false], ["Account number to client", false]]) },
  { id: "t17", title: "PF and ESI · August", client: "delta", owner: "Divya", due: d(2026, 9, 15), status: "Overdue", area: "Payroll" },
  { id: "t18", title: "GSTR-3B · September", client: "delta", owner: "Divya", due: d(2026, 10, 10), status: "Due this week", area: "GST" },
  { id: "t19", title: "Draft Board resolution", client: "ember", step: 2, code: "Step 2", owner: "Divya", setBy: "Pranay", due: d(2026, 10, 11), status: "In progress", area: "MCA" },
  { id: "t20", title: "MOA and AOA drafting", client: "ember", code: "Step 11", owner: "Divya", due: d(2026, 10, 14), status: "Not started", area: "MCA" },
  { id: "t21", title: "ADT-1 auditor appointment", client: "fjord", code: "Step 21", owner: "Divya", due: d(2026, 10, 12), status: "With client", area: "MCA" },
  { id: "t22", title: "Share certificates (SH-1)", client: "saffron", code: "Step 19", owner: "Aditi Rao", due: d(2026, 10, 8), status: "In progress", area: "MCA" },
  { id: "t23", title: "GSTR-1 · September", client: "saffron", owner: "Aditi Rao", due: d(2026, 10, 1), status: "Done", area: "GST" },
  { id: "t24", title: "PF registration", client: "indigo", code: "Reg-6", owner: "Aditi Rao", due: d(2026, 10, 7), status: "Due this week", area: "Payroll" },
  { id: "t25", title: "ESI registration", client: "indigo", code: "Reg-4", owner: "Aditi Rao", due: d(2026, 10, 18), status: "Not started", area: "Payroll" },
  { id: "t26", title: "Reply to MCA remarks on SPICe+", client: "monsoon", code: "Step 13", owner: "Kabir Sethi", due: d(2026, 10, 3), status: "Overdue", area: "MCA" },
  { id: "t27", title: "DSC for two directors", client: "monsoon", code: "Step 10", owner: "Kabir Sethi", due: d(2026, 9, 29), status: "Done", area: "MCA" },
  { id: "t28", title: "Name resubmission after RUN rejection", client: "banyan", code: "Step 4", owner: "Nikhil Jain", due: d(2026, 10, 4), status: "Overdue", area: "MCA" },
  { id: "t29", title: "Subscriber details", client: "quartz", code: "Step 9", owner: "Nikhil Jain", due: d(2026, 10, 12), status: "With client", area: "MCA" },
  { id: "t30", title: "ADT-1 auditor appointment", client: "coral", code: "Step 21", owner: "Tara Menon", due: d(2026, 10, 13), status: "With client", area: "MCA" },
  { id: "t31", title: "TDS challan · September", client: "coral", owner: "Tara Menon", due: d(2026, 10, 7), status: "Due this week", area: "Income tax" },
  { id: "t32", title: "GSTR-3B · August", client: "coral", owner: "Tara Menon", due: d(2026, 9, 20), status: "Done", area: "GST" },
];

/** Manager-level items (Action queue for managers and admin). */
export const MANAGER_TASKS: StaffTask[] = [
  { id: "m01", title: "Escalate bank account delay", client: "delta", code: "Step 17", owner: "Pranay", due: d(2026, 10, 5), status: "Overdue", area: "MCA" },
  { id: "m02", title: "Review FC-GPR before filing", client: "corvid", code: "Step 22", owner: "Pranay", due: d(2026, 10, 6), status: "Due this week", area: "FEMA" },
  { id: "m03", title: "Approve Board resolution", client: "ember", step: 2, code: "Step 2", owner: "Pranay", due: d(2026, 10, 9), status: "Due this week", area: "MCA" },
  { id: "m04", title: "Client call on office NOC", client: "northwind", step: 7, code: "Step 7", owner: "Pranay", due: d(2026, 10, 10), status: "With client", area: "MCA" },
  { id: "m05", title: "Approve GST registration", client: "zenith", code: "Reg-1", owner: "Pranay", due: d(2026, 10, 10), status: "In progress", area: "GST" },
  { id: "m06", title: "Answer MCA remarks with Kabir", client: "monsoon", code: "Step 13", owner: "Priya Raman", due: d(2026, 10, 3), status: "Overdue", area: "MCA" },
  { id: "m07", title: "Approve share certificates", client: "saffron", code: "Step 19", owner: "Priya Raman", due: d(2026, 10, 8), status: "In progress", area: "MCA" },
  { id: "m08", title: "Review PF registration", client: "indigo", code: "Reg-6", owner: "Priya Raman", due: d(2026, 10, 7), status: "Due this week", area: "Payroll" },
  { id: "m09", title: "New name options after RUN rejection", client: "banyan", code: "Step 4", owner: "Arjun Mehta", due: d(2026, 10, 4), status: "Overdue", area: "MCA" },
  { id: "m10", title: "Client call on auditor", client: "coral", code: "Step 21", owner: "Arjun Mehta", due: d(2026, 10, 13), status: "With client", area: "MCA" },
  { id: "m11", title: "Approve subscriber sheet", client: "quartz", code: "Step 9", owner: "Arjun Mehta", due: d(2026, 10, 12), status: "In progress", area: "MCA" },
];

const pranayClients = new Set(STAFF_CLIENTS.filter((c) => c.manager === "Pranay").map((c) => c.id));

/** Tasks a portal works on: the lead's own, the manager's team, the whole firm for admin. */
export function tasksFor(portal: StaffPortal): StaffTask[] {
  if (portal === "lead") return TASKS.filter((t) => t.owner === "Bharath");
  if (portal === "manager") return TASKS.filter((t) => pranayClients.has(t.client));
  return TASKS;
}

/** Action queue: open items for the person signed in. */
export function queueFor(portal: StaffPortal): StaffTask[] {
  const open = (t: StaffTask) => t.status !== "Done";
  const byDue = (a: StaffTask, b: StaffTask) => a.due.getTime() - b.due.getTime();
  if (portal === "lead") return tasksFor("lead").filter(open).sort(byDue);
  if (portal === "manager") return MANAGER_TASKS.filter((t) => t.owner === "Pranay" && open(t)).sort(byDue);
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
    { id: "i1", client: "northwind", text: "Rohan uploaded the stamped rent agreement", from: "Client upload", time: "10:40", unread: true },
    { id: "i2", client: "corvid", text: "Mei Tanaka replied: FIRMS login sent", from: "Email", time: "10:12", unread: true },
    { id: "i3", client: "bluefin", text: "MCA: SRN AB1234 approved", from: "MCA mail", time: "09:40" },
    { id: "i4", client: "zenith", text: "Pranay: push Zenith GST today", from: "Manager note", time: "09:05" },
  ],
  manager: [
    { id: "i1", client: "delta", text: "Divya: bank rejected the signatory list", from: "Project lead", time: "11:02", unread: true },
    { id: "i2", client: "corvid", text: "Bharath: FC-GPR form ready for your review", from: "Project lead", time: "10:20", unread: true },
    { id: "i3", client: "northwind", text: "Rohan uploaded the stamped rent agreement", from: "Client upload", time: "10:40" },
    { id: "i4", client: "ember", text: "Draft Board resolution sent for approval", from: "Divya", time: "09:15" },
  ],
  admin: [
    { id: "i1", client: "delta", text: "Pranay: bank account delay needs your call", from: "Escalation", time: "11:10", unread: true },
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
    { id: "a1", client: "ember", title: "Draft Board resolution", by: "Divya", sent: d(2026, 10, 5) },
    { id: "a2", client: "corvid", title: "FC-GPR form", by: "Bharath", sent: d(2026, 10, 3) },
    { id: "a3", client: "zenith", title: "Reply to GST officer query", by: "Bharath", sent: d(2026, 10, 6) },
  ],
  admin: [
    { id: "a1", client: "delta", title: "Escalation: bank account delay", by: "Pranay", sent: d(2026, 10, 5) },
    { id: "a2", client: "monsoon", title: "Escalation: MCA remarks on SPICe+", by: "Priya Raman", sent: d(2026, 10, 4) },
    { id: "a3", client: "banyan", title: "Escalation: new name options after RUN rejection", by: "Arjun Mehta", sent: d(2026, 10, 4) },
  ],
};
