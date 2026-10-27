import { TODAY, d, daysFrom } from "@/lib/dates";
import type { ChipTone } from "@/components/ui/Chip";
import type { ActivityRow } from "@/components/cards/ActivityList";
import { CAP, FILINGS, FIRM_CLIENTS, MANAGERS, RISKS, STAFF, type FirmClient, type Risk } from "@/data/super";

// More super admin data, ported from reference/old-screens/s/super/data.js and reference/old-patch/super/*.
// Dates move back 10 days (old today 16 Oct, new TODAY 6 Oct).
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
  { id: "f1", date: TODAY, time: "11:20", text: "Approved the board resolution for Ember Studios", who: "Krishna" },
  { id: "f2", date: TODAY, time: "10:05", text: "Escalated the PF ECR delay at Corvid Logistics to Pranay", who: "Krishna" },
  { id: "f3", date: TODAY, time: "09:40", text: "Assigned Elm Textiles INC-20A review to Vikram Shah", who: "Ritu Agarwal" },
  { id: "f4", date: d(2026, 10, 5), time: "17:10", text: "Reassigned Bluefin Analytics onboarding within Pranay's team", who: "Krishna" },
  { id: "f5", date: d(2026, 10, 5), time: "12:30", text: "Approved ESI registration filing for Pinecrest Hotels", who: "Ritu Agarwal" },
  { id: "f6", date: d(2026, 10, 4), time: "15:00", text: "Assigned Quartz Mobility to Arjun Mehta", who: "Krishna" },
  { id: "f7", date: d(2026, 10, 3), time: "11:45", text: "Resolved the MCA query escalation at Bluefin Analytics", who: "Krishna" },
  { id: "f8", date: d(2026, 10, 2), time: "16:20", text: "Won Aurora Paints: monthly compliance from November", who: "Ritu Agarwal" },
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

export const PHASES_DONE: Record<string, [number, number, number, number]> = {
  northwind: [5, 1, 0, 0],
  bluefin: [5, 4, 0, 0],
  ember: [1, 0, 0, 0],
  zenith: [5, 9, 11, 19],
  arcadia: [5, 9, 11, 14],
  corvid: [5, 9, 11, 6],
  delta: [5, 9, 11, 20],
  fjord: [5, 9, 11, 21],
  saffron: [5, 9, 5, 0],
  monsoon: [5, 8, 0, 0],
  indigo: [5, 9, 11, 6],
  banyan: [3, 0, 0, 0],
  coral: [5, 9, 8, 0],
  quartz: [5, 3, 0, 0],
  pinecrest: [5, 9, 11, 4],
  saltmarsh: [5, 6, 0, 0],
  elm: [5, 9, 6, 0],
};

export const phasesOf = (c: FirmClient) => PHASES_DONE[c.id] ?? [0, 0, 0, 0];
export const progressOf = (c: FirmClient) => Math.round((phasesOf(c).reduce((a, b) => a + b, 0) / 48) * 100);

/** Step code as the old grid showed it: "Step 7", or the registration or form. */
export const codeOf = (c: FirmClient) => (c.stepNo ? `Step ${c.stepNo}` : c.pipe === "reg" ? "Registration" : "Filing");

/** Who holds the work and for how long: "Client · 5d". */
export const holderOf = (c: FirmClient) => `${c.owner === "client" ? "Client" : c.owner === "mca" ? "MCA" : "SBC"} · ${c.daysInStep}d`;

/** Health order for the clients grid: worst first (old SO). */
export const HEALTH_ORDER: Record<FirmClient["health"], number> = { Stuck: 0, Overdue: 1, "Due soon": 2, "With client": 3, "In progress": 4, "Not started": 5 };

/** Notes on a client record (old record tab "Notes 3"). */
export function notesOf(c: FirmClient) {
  if (c.id === "northwind")
    return [
      { id: "n1", who: "Pranay", date: d(2026, 10, 5), text: "Rohan prefers WhatsApp for document reminders." },
      { id: "n2", who: "Bharath", date: d(2026, 10, 2), text: "Utility bill must show the same address as the rent agreement." },
      { id: "n3", who: "Krishna", date: d(2026, 9, 14), text: "Parent company signs in London. Courier time is 5 working days." },
    ];
  return [{ id: "n1", who: c.lead, date: d(2026, 10, 1), text: `Next date ${c.next.getDate()} Oct: ${c.step}.` }];
}

/* ---------- Risks ---------- */

export type RiskKind = "filing" | "notice" | "kyc" | "owner" | "unassigned";

export const RISK_KIND_LABEL: Record<RiskKind, string> = {
  filing: "Overdue filing",
  notice: "MCA notice",
  kyc: "DSC or KYC",
  owner: "No manager",
  unassigned: "No one assigned",
};

export const RISK_KIND_TONE: Record<RiskKind, ChipTone> = { filing: "bad", notice: "violet", kyc: "warn", owner: "prog", unassigned: "prog" };

const KIND: Record<string, RiskKind> = {
  rk1: "filing",
  rk2: "filing",
  rk3: "filing",
  rk4: "notice",
  rk5: "notice",
  rk6: "filing",
  rk7: "kyc",
  rk8: "owner",
  rk9: "unassigned",
  rk10: "kyc",
  rk11: "notice",
  rk12: "notice",
};

export const kindOf = (r: Risk): RiskKind => KIND[r.id] ?? "filing";
export const ageOf = (r: Risk) => {
  const n = Math.max(0, -daysFrom(r.since));
  return n === 0 ? "Today" : n === 1 ? "1 day" : `${n} days`;
};

/** Top risks for the overview and the partner report: open first, high severity first, oldest first. */
export const TOP_RISKS = [...RISKS]
  .filter((r) => r.status !== "Closed")
  .sort((a, b) => (a.status === b.status ? 0 : a.status === "Open" ? -1 : 1) || sevRank(b) - sevRank(a) || a.since.getTime() - b.since.getTime());

function sevRank(r: Risk) {
  return r.severity === "High" ? 3 : r.severity === "Medium" ? 2 : 1;
}

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
  monsoon: d(2026, 10, 20),
  bluefin: d(2026, 10, 25),
  saltmarsh: d(2026, 10, 27),
  northwind: d(2026, 10, 28),
  quartz: d(2026, 11, 2),
  ember: d(2026, 11, 16),
  banyan: d(2026, 11, 22),
};

export const AVG_DAYS_TO_COI = Math.round(MANAGERS.reduce((a, m) => a + m.daysToCoi, 0) / MANAGERS.length);

/* ---------- Registrations matrix ---------- */

export type RegCode = "d" | "p" | "w" | "n" | "x";

export const REG_CELL: Record<RegCode, { label: string; mark: string; cls: string }> = {
  d: { label: "Done", mark: "✓", cls: "bg-ok-soft text-ok" },
  p: { label: "In progress", mark: "•", cls: "bg-accent-soft text-accent" },
  w: { label: "Pending on documents", mark: "!", cls: "bg-warn-soft text-warn" },
  n: { label: "After COI", mark: "", cls: "bg-raised text-faint" },
  x: { label: "Not needed", mark: "–", cls: "text-faint" },
};

/* ---------- Compliances ---------- */

export const STATUTE_ORDER = ["GST", "TDS", "Income tax", "ROC", "PF and ESI", "PT"];

export function statuteRows() {
  return STATUTE_ORDER.map((t) => {
    const l = FILINGS.filter((f) => f.group === t);
    const filed = l.filter((f) => f.status === "Filed").length;
    const overdue = l.filter((f) => f.status === "Overdue").length;
    const left = l.length - filed - overdue;
    const pct = filed + overdue ? Math.round((filed / (filed + overdue)) * 100) : 100;
    return { statute: t, total: l.length, filed, overdue, left, pct };
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

export const PEOPLE: Person[] = [
  { id: "mithilesh", name: "Mithilesh", role: "Super admin", reportsTo: "", email: mail("Mithilesh") },
  ...STAFF.map((s) => ({ id: s.id, name: s.name, role: s.role, reportsTo: s.reportsTo, email: mail(s.name) })),
];

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
  { clientId: "zenith", amount: 26000, days: 8 },
  { clientId: "elm", amount: 24000, days: 51 },
  { clientId: "bluefin", amount: 20000, days: 22 },
];

export const ageBucket = (days: number) => (days <= 30 ? "Up to 30 days" : days <= 60 ? "31 to 60 days" : "Over 60 days");

/** Late fee per day for each overdue filing, by statute. */
const PER_DAY: Record<string, number> = { "PF and ESI": 150, TDS: 200, PT: 200, "Income tax": 100 };

export const LATE_FEES = FILINGS.filter((f) => f.status === "Overdue")
  .map((f) => {
    const late = -daysFrom(f.due);
    const perDay = PER_DAY[f.group] ?? 100;
    return { id: f.id, clientId: f.clientId, form: f.item, statute: f.group, due: f.due, late, perDay, soFar: late * perDay };
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
        { k: "Filings on time", v: `${filedOnTimePct()}% (${FILINGS.filter((f) => f.status === "Overdue").length} late)` },
        { k: "Registrations completed", v: "6" },
      ]
    : [
        { k: "Active clients", v: "15" },
        { k: "Client movement", v: "3 won · 1 lost" },
        { k: "Certificates (COI) issued", v: "2" },
        { k: "Average days to COI · target 30", v: "36 days" },
        { k: "Filings on time", v: "88% (6 late)" },
        { k: "Registrations completed", v: "9" },
      ];

function filedOnTimePct() {
  const past = FILINGS.filter((f) => f.status === "Filed" || f.status === "Overdue");
  return Math.round((FILINGS.filter((f) => f.status === "Filed").length / Math.max(1, past.length)) * 100);
}

export const PARTNER_CLIENTS_LINE = {
  Oct: "Lotus Dental (incorporation) and Aurora Paints (monthly compliance) signed this month. No client left. Monsoon Labs and Banyan Wellness are stuck at MCA.",
  Sep: "Quartz Mobility, Saltmarsh Ventures and Elm Textiles signed. Harbor Foods left after the FY close. Corvid PF returns ran late.",
};

/** Manager targets used by assignment: name, clients, open, late (old assign.js mgrStats). */
export const assignCandidates = () => MANAGER_ROWS.map((m) => ({ name: m.name, sub: `${m.clients} clients · ${m.open} open · ${m.late} late` }));
