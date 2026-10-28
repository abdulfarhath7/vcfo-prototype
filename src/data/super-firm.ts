import { STAFF_TODAY, d, daysFrom } from "@/lib/dates";
import type { ChipTone } from "@/components/ui/Chip";
import type { ActivityRow } from "@/components/cards/ActivityList";
import { CAP, FILINGS, FIRM_CLIENTS, MANAGERS, RISKS, STAFF, type FirmClient, type Risk, type RiskKind } from "@/data/super";

// More super admin data, ported from reference/old-screens/s/super/data.js and reference/old-patch/super/*.
// Dates are the old ones: the super admin portal is frozen on Fri 16 Oct 2026 (STAFF_TODAY).
// Money (FEES, DUES, LATE_FEES) is used only by the "Fees and late fees" report and the client record (R-37).

/* ---------- Admins ---------- */

export interface Admin {
  id: string;
  name: string;
  ini: string;
  managers: string[];
  assigned: number;
  reassigned: number;
  approvals: number;
  resolved: number;
  open: number;
  response: string;
}

export const ADMINS: Admin[] = [
  { id: "krishna", name: "Krishna", ini: "KR", managers: ["Pranay", "Priya Raman", "Arjun Mehta"], assigned: 3, reassigned: 1, approvals: 12, resolved: 4, open: 2, response: "3.2 h" },
  { id: "ritu", name: "Ritu Agarwal", ini: "RA", managers: ["Vikram Shah"], assigned: 1, reassigned: 0, approvals: 5, resolved: 2, open: 1, response: "5.5 h" },
];

export const adminOf = (manager: string) => ADMINS.find((a) => a.managers.includes(manager))?.name ?? "";
export const clientsOfAdmin = (a: Admin) => FIRM_CLIENTS.filter((c) => a.managers.includes(c.manager)).length;

/** What admins did this week (old FEED). */
export const ADMIN_FEED: ActivityRow[] = [
  { id: "f1", date: STAFF_TODAY, time: "11:20", text: "Approved the board resolution for Larkspur Analytics", who: "Krishna" },
  { id: "f2", date: STAFF_TODAY, time: "10:05", text: "Escalated the bank account delay at Brightwave Robotics to Pranay", who: "Krishna" },
  { id: "f3", date: STAFF_TODAY, time: "09:40", text: "Assigned Ember Textiles INC-20A review to Vikram Shah", who: "Ritu Agarwal" },
  { id: "f4", date: d(2026, 10, 15), time: "17:10", text: "Reassigned Juniper Bio onboarding within Pranay's team", who: "Krishna" },
  { id: "f5", date: d(2026, 10, 15), time: "12:30", text: "Approved ESI registration filing for Pinecrest Hotels", who: "Ritu Agarwal" },
  { id: "f6", date: d(2026, 10, 14), time: "15:00", text: "Assigned Quartz Mobility to Arjun Mehta", who: "Krishna" },
  { id: "f7", date: d(2026, 10, 13), time: "11:45", text: "Resolved the MCA query escalation at Orchid Lane Foods", who: "Krishna" },
  { id: "f8", date: d(2026, 10, 12), time: "16:20", text: "Won Aurora Paints: monthly compliance from November", who: "Ritu Agarwal" },
];

/* ---------- Managers ---------- */

export interface ManagerRow {
  id: string;
  name: string;
  admin: string;
  leads: number;
  clients: number;
  open: number;
  late: number;
  onTime: number;
  daysToCoi: number;
  room: number;
  load: number;
}

export const MANAGER_ROWS: ManagerRow[] = MANAGERS.map((m) => {
  const s = STAFF.find((x) => x.id === m.id)!;
  const n = FIRM_CLIENTS.filter((c) => c.manager === m.name).length;
  return {
    id: m.id,
    name: m.name,
    admin: m.admin,
    leads: m.leads.length,
    clients: n,
    open: s.open,
    late: s.overdue,
    onTime: m.onTime,
    daysToCoi: m.daysToCoi,
    room: Math.max(0, CAP - n),
    load: Math.round((n / CAP) * 100),
  };
});

/* ---------- Client progress ---------- */

/** Steps done in Name (5), Incorporation (9), Post-incorporation (11), Registrations (23). Old data.js CLIENTS[6]. */
export const PHASE_TOTALS = [5, 9, 11, 23] as const;
export const PHASE_NAMES = ["Name", "Incorporation", "Post-incorporation", "Registrations"];

export const phasesOf = (c: FirmClient) => c.phases;
export const progressOf = (c: FirmClient) => Math.round((phasesOf(c).reduce((a, b) => a + b, 0) / 48) * 100);

/** Step code: "Step 7" for one of the 25 incorporation steps, else the old code ("Reg-1"). */
export const codeOf = (c: FirmClient) => (c.stepNo ? `Step ${c.stepNo}` : c.code);

/** Who holds the work and for how long: "Client · 5d". */
export const holderOf = (c: FirmClient) => `${c.owner === "client" ? "Client" : c.owner === "mca" ? "MCA" : "SBC"} · ${c.daysInStep}d`;

/** Health order for the clients grid: worst first (old SO). */
export const HEALTH_ORDER: Record<FirmClient["health"], number> = { Stuck: 0, Overdue: 1, "Due soon": 2, "With client": 3, "In progress": 4, "Not started": 5 };

/** Notes on a client record (old record tab "Notes 3"). */
export function notesOf(c: FirmClient) {
  if (c.id === "northwind")
    return [
      { id: "n1", who: "Pranay", date: d(2026, 10, 15), text: "Rohan prefers WhatsApp for document reminders." },
      { id: "n2", who: "Bharath", date: d(2026, 10, 12), text: "Utility bill must show the same address as the rent agreement." },
      { id: "n3", who: "Krishna", date: d(2026, 9, 24), text: "Parent company signs in London. Courier time is 5 working days." },
    ];
  return [{ id: "n1", who: c.lead, date: d(2026, 10, 12), text: `Next date ${c.next.getDate()} Oct: ${c.step}.` }];
}

/* ---------- Risks ---------- */

export type { RiskKind };

/** Kind chips (old RK). */
export const RISK_KIND_LABEL: Record<RiskKind, string> = {
  filing: "Overdue filing",
  notice: "MCA notice",
  kyc: "DSC or KYC",
  owner: "No manager",
  unassigned: "No one assigned",
};

export const RISK_KIND_TONE: Record<RiskKind, ChipTone> = { filing: "bad", notice: "violet", kyc: "warn", owner: "prog", unassigned: "prog" };

export const kindOf = (r: Risk): RiskKind => r.kind;
export const ageOf = (r: Risk) => (r.age === 0 ? "Today" : r.age === 1 ? "1 day" : `${r.age} days`);

/** Top risks for the overview and the partner report (old sort: severity, then rupee impact). */
export const TOP_RISKS = [...RISKS].sort((a, b) => b.sev - a.sev || b.impact - a.impact);

/* ---------- Incorporation ---------- */

export const INC_PIPELINE: Array<{ key: FirmClient["pipe"] | "coi"; label: string }> = [
  { key: "name", label: "Name approval" },
  { key: "spice", label: "SPICe+ forms" },
  { key: "mca", label: "MCA review" },
  { key: "coi", label: "Certificate (COI)" },
];

export interface StageDays {
  stage: string;
  target: number;
  avg: number;
  slowest: string;
}

export const STAGE_DAYS: StageDays[] = [
  { stage: "Name approval", target: 5, avg: 6, slowest: "Banyan Wellness, 24 days" },
  { stage: "SPICe+ forms", target: 10, avg: 9, slowest: "Saltmarsh Ventures, 14 days" },
  { stage: "MCA review", target: 7, avg: 12, slowest: "Monsoon Labs, 15 days" },
  { stage: "Certificate (COI)", target: 3, avg: 2, slowest: "None waiting" },
];

/** Expected certificate dates for clients in incorporation. */
export const EXPECTED_COI: Record<string, Date> = {
  monsoon: d(2026, 10, 30),
  orchid: d(2026, 11, 4),
  saltmarsh: d(2026, 11, 6),
  northwind: d(2026, 11, 9),
  quartz: d(2026, 11, 12),
  larkspur: d(2026, 11, 26),
  banyan: d(2026, 12, 2),
  juniper: d(2026, 12, 9),
};

export const AVG_DAYS_TO_COI = Math.round(MANAGERS.reduce((a, m) => a + m.daysToCoi, 0) / MANAGERS.length);

/* ---------- Registrations matrix ---------- */

export type RegCode = "d" | "p" | "w" | "n" | "x";

/** Old matrix cells: solid green, blue and amber; a framed cell after COI; a hatched cell when not needed. */
export const REG_CELL: Record<RegCode, { label: string; mark: string; cls: string }> = {
  d: { label: "Done", mark: "✓", cls: "bg-ok text-white dark:bg-ok-mid" },
  p: { label: "In progress", mark: "", cls: "bg-accent text-white" },
  w: { label: "Pending", mark: "!", cls: "bg-warn text-white dark:bg-warn-mid dark:text-navy" },
  n: { label: "After COI", mark: "", cls: "bg-raised ring-1 ring-inset ring-line" },
  x: { label: "Not needed", mark: "", cls: "bg-[repeating-linear-gradient(135deg,var(--line)_0_1px,transparent_1px_6px)] ring-1 ring-inset ring-line-soft" },
};

/* ---------- Compliances ---------- */

export const STATUTE_ORDER = ["GST", "TDS", "Income tax", "ROC", "FEMA", "PF and ESI", "PT"];

export function statuteRows() {
  return STATUTE_ORDER.map((t) => {
    const l = FILINGS.filter((f) => f.group === t);
    const filed = l.filter((f) => f.status === "Filed").length;
    const late = l.filter((f) => f.status === "Filed late").length;
    const overdue = l.filter((f) => f.status === "Overdue").length;
    const left = l.length - filed - late - overdue;
    const pct = filed + late + overdue ? Math.round((filed / (filed + late + overdue)) * 100) : 100;
    return { statute: t, total: l.length, filed, late, overdue, left, pct };
  }).filter((r) => r.total > 0);
}

/* ---------- Settings ---------- */

export const SERVICE_TARGETS = [
  { k: "Days to certificate (COI)", v: "30 days" },
  { k: "File statutory returns before the due date", v: "2 days ahead" },
  { k: "Reply to a client", v: "Within 4 working hours" },
  { k: "Escalate a stuck step to the admin", v: "After 3 days" },
  { k: "Monthly partner report", v: "1st of the month" },
];

export const BRAND_COLOURS: Array<{ name: string; cls: string }> = [
  { name: "Brand blue", cls: "bg-accent" },
  { name: "Navy", cls: "bg-navy" },
  { name: "Orange", cls: "bg-brand" },
];

export interface Person {
  id: string;
  name: string;
  role: "Super admin" | "Admin" | "Manager" | "Project lead";
  reportsTo: string;
  email: string;
}

const mail = (n: string) => `${n.split(" ")[0].toLowerCase()}@sbcllp.in`;

const PEOPLE_FLAT: Person[] = [
  { id: "mithilesh", name: "Mithilesh", role: "Super admin", reportsTo: "", email: mail("Mithilesh") },
  ...STAFF.map((s) => ({ id: s.id, name: s.name, role: s.role, reportsTo: s.reportsTo, email: mail(s.name) })),
];

/** Old Settings order: each person, then the people who report to them (Krishna, Pranay, Bharath ...). */
function treeOrder(list: Person[], boss = ""): Person[] {
  return list.filter((p) => p.reportsTo === boss).flatMap((p) => [p, ...treeOrder(list, p.name)]);
}

export const PEOPLE: Person[] = (() => {
  const ordered = treeOrder(PEOPLE_FLAT);
  return [...ordered, ...PEOPLE_FLAT.filter((p) => !ordered.includes(p))];
})();

export const ROLE_TONE: Record<Person["role"], ChipTone> = { "Super admin": "violet", Admin: "prog", Manager: "teal", "Project lead": "idle" };

/* ---------- Money: reports and record pages only (R-37) ---------- */

export const rupees = (n: number) => {
  const s = String(Math.round(n));
  const last = s.slice(-3);
  const rest = s.slice(0, -3);
  return `₹${rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},` : ""}${last}`;
};

/** Fees for October by service line: billed and collected. */
export const FEES = [
  { line: "Incorporation", billed: 480000, collected: 310000 },
  { line: "Registrations", billed: 220000, collected: 190000 },
  { line: "Monthly compliance", billed: 640000, collected: 520000 },
  { line: "Advisory", billed: 150000, collected: 60000 },
];

/** Outstanding fees by client: amount and days outstanding. */
export const DUES: Array<{ clientId: string; amount: number; days: number }> = [
  { clientId: "banyan", amount: 85000, days: 72 },
  { clientId: "monsoon", amount: 60000, days: 41 },
  { clientId: "northwind", amount: 45000, days: 18 },
  { clientId: "coral", amount: 38000, days: 64 },
  { clientId: "quartz", amount: 30000, days: 12 },
  { clientId: "saltmarsh", amount: 42000, days: 33 },
  { clientId: "halcyon", amount: 26000, days: 8 },
  { clientId: "ember", amount: 24000, days: 51 },
  { clientId: "orchid", amount: 20000, days: 22 },
];

export const ageBucket = (days: number) => (days <= 30 ? "Up to 30 days" : days <= 60 ? "31 to 60 days" : "Over 60 days");

/** Late fee so far and per day for each overdue filing (old EXC). */
const LATE: Record<string, [number, number]> = { brightwave: [1500, 150], coral: [1800, 200], ember: [1800, 200], kestrel: [1200, 200] };

export const LATE_FEES = FILINGS.filter((f) => f.status === "Overdue")
  .map((f) => {
    const late = -daysFrom(f.due, STAFF_TODAY);
    const [soFar, perDay] = LATE[f.clientId] ?? [late * 100, 100];
    return { id: f.id, clientId: f.clientId, form: f.item, statute: f.group, due: f.due, late, perDay, soFar };
  })
  .sort((a, b) => b.soFar - a.soFar);

/** Rates per service (old Settings catalogue). */
const RATE: Record<string, { fee: number; per?: string }> = {
  inc: { fee: 65000 },
  post: { fee: 35000 },
  reg: { fee: 25000 },
  mc: { fee: 18000, per: "a month" },
  roc: { fee: 30000 },
  fema: { fee: 40000 },
};

export const rateOf = (serviceId: string) => RATE[serviceId] ?? { fee: 0 };
export const dueOf = (clientId: string) => DUES.find((x) => x.clientId === clientId);

/* ---------- Reports ---------- */

export const SCHEDULES = ["Manual", "Daily", "Every Monday", "1st of the month", "Quarterly"];

export const PARTNER_NUMBERS = (month: "Oct" | "Sep") =>
  month === "Oct"
    ? [
        { k: "Active clients", v: String(FIRM_CLIENTS.length) },
        { k: "Client movement", v: "2 won · 0 lost" },
        { k: "Certificates (COI) issued", v: "3" },
        { k: "Average days to COI · target 30", v: `${AVG_DAYS_TO_COI} days` },
        { k: `Filings on time (${FILINGS.filter((f) => f.status === "Filed late").length} late)`, v: `${filedOnTimePct()}%` },
        { k: "Registrations completed", v: "6" },
      ]
    : [
        { k: "Active clients", v: "15" },
        { k: "Client movement", v: "3 won · 1 lost" },
        { k: "Certificates (COI) issued", v: "2" },
        { k: "Average days to COI · target 30", v: "36 days" },
        { k: "Filings on time (6 late)", v: "88%" },
        { k: "Registrations completed", v: "9" },
      ];

/** Old Reports: filed on time over every filing due before 16 Oct. */
function filedOnTimePct() {
  const past = FILINGS.filter((f) => f.due < STAFF_TODAY);
  return Math.round((past.filter((f) => f.status === "Filed").length / Math.max(1, past.length)) * 100);
}

export const PARTNER_CLIENTS_LINE = {
  Oct: "Lotus Dental (incorporation) and Aurora Paints (monthly compliance) signed this month. No client left. Monsoon Labs and Banyan Wellness are stuck at MCA and need partner attention.",
  Sep: "Quartz Mobility, Saltmarsh Ventures and Ember Textiles signed. Harbor Foods left after the FY close. Brightwave PF returns ran late.",
};

/** Manager targets used by assignment: name, clients, open, late (old assign.js mgrStats). */
export const assignCandidates = () => MANAGER_ROWS.map((m) => ({ name: m.name, sub: `${m.clients} clients · ${m.open} open · ${m.late} late` }));
