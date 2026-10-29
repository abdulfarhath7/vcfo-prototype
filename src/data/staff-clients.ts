import { STAFF_TODAY, d } from "@/lib/dates";
import { CLIENTS, type Client } from "@/data/people";

// Staff view of each client: stage, current step, progress and health.
// Pranay's eight clients come from people.ts. Six more belong to Priya Raman and Arjun Mehta (admin view).
// Ported from reference/old-screens/s/admin/data.js. Dates as in the old prototype: staff "today" is Fri 16 Oct 2026 (STAFF_TODAY).

export type Health = "In progress" | "With client" | "Due this week" | "Overdue" | "Stuck" | "Not started";
export type StaffPortal = "lead" | "manager" | "admin";

export interface StaffClient extends Client {
  /** Current step. */
  step: string;
  /** "Step 7", "Reg-1". */
  code: string;
  /** Steps done in Name, Incorporation, Post-incorporation, Registrations (5, 9, 11, 23). */
  phases: [number, number, number, number];
  pendingWith: "Client" | "SBC" | "MCA";
  /** Days with the party that holds it. */
  days: number;
  next: Date;
  health: Health;
}

export const PHASE_TOTALS = [5, 9, 11, 23] as const;
export const ALL_STEPS = PHASE_TOTALS.reduce((a, b) => a + b, 0);

const base = (id: string) => CLIENTS.find((c) => c.id === id)!;

const EXTRA: Client[] = [
  { id: "saffron", name: "Saffron Retail Pvt Ltd", short: "Saffron", stage: "compliance", tone: "warn", lead: "Aditi Rao", manager: "Priya Raman", cin: "U52100TG2023PTC171234", pan: "AAKCS5521P", gstin: "36AAKCS5521P1ZT" },
  { id: "monsoon", name: "Monsoon Labs Pvt Ltd", short: "Monsoon", stage: "incorporating", tone: "teal", lead: "Kabir Sethi", manager: "Priya Raman" },
  { id: "indigo", name: "Indigo Freight Pvt Ltd", short: "Indigo", stage: "compliance", tone: "accent", lead: "Aditi Rao", manager: "Priya Raman", cin: "U60200TG2022PTC165432", pan: "AAGCI8812D", gstin: "36AAGCI8812D1ZQ" },
  { id: "banyan", name: "Banyan Wellness Pvt Ltd", short: "Banyan", stage: "incorporating", tone: "ok", lead: "Nikhil Jain", manager: "Arjun Mehta" },
  { id: "coral", name: "Coral Studios Pvt Ltd", short: "Coral", stage: "compliance", tone: "violet", lead: "Tara Menon", manager: "Arjun Mehta", cin: "U92100TG2024PTC183311", pan: "AAJCC3390H", gstin: "36AAJCC3390H1Z6" },
  { id: "quartz", name: "Quartz Mobility Pvt Ltd", short: "Quartz", stage: "incorporating", tone: "warn", lead: "Nikhil Jain", manager: "Arjun Mehta" },
];

const row = (c: Client, r: Omit<StaffClient, keyof Client>): StaffClient => ({ ...c, ...r });

export const STAFF_CLIENTS: StaffClient[] = [
  row(base("northwind"), { step: "Registered office address", code: "Step 7", phases: [5, 1, 0, 0], pendingWith: "Client", days: 5, next: d(2026, 10, 20), health: "With client" }),
  row(base("kestrel"), { step: "GST registration", code: "Reg-1", phases: [5, 9, 11, 3], pendingWith: "MCA", days: 2, next: d(2026, 10, 20), health: "In progress" }),
  row(base("halcyon"), { step: "Trademark registration", code: "Reg-15", phases: [5, 9, 11, 19], pendingWith: "Client", days: 3, next: d(2026, 10, 25), health: "With client" }),
  row(base("orchid"), { step: "KYC review and DSC", code: "Step 10", phases: [5, 4, 0, 0], pendingWith: "SBC", days: 2, next: d(2026, 10, 19), health: "In progress" }),
  row(base("tidewater"), { step: "FC-GPR filing", code: "Step 22", phases: [5, 9, 7, 0], pendingWith: "SBC", days: 3, next: d(2026, 10, 16), health: "Due this week" }),
  row(base("brightwave"), { step: "Bank account opening", code: "Step 17", phases: [5, 9, 2, 0], pendingWith: "SBC", days: 4, next: d(2026, 10, 15), health: "Overdue" }),
  row(base("larkspur"), { step: "Draft Board resolution", code: "Step 2", phases: [1, 0, 0, 0], pendingWith: "SBC", days: 1, next: d(2026, 10, 21), health: "In progress" }),
  row(base("juniper"), { step: "Client details", code: "Step 1", phases: [0, 0, 0, 0], pendingWith: "Client", days: 2, next: d(2026, 10, 22), health: "Not started" }),
  row(EXTRA[0], { step: "Share certificates (SH-1)", code: "Step 19", phases: [5, 9, 4, 0], pendingWith: "SBC", days: 2, next: d(2026, 10, 18), health: "In progress" }),
  row(EXTRA[1], { step: "MCA remarks on SPICe+", code: "Step 13", phases: [5, 7, 0, 0], pendingWith: "MCA", days: 6, next: d(2026, 10, 19), health: "Stuck" }),
  row(EXTRA[2], { step: "PF registration", code: "Reg-6", phases: [5, 9, 11, 6], pendingWith: "SBC", days: 1, next: d(2026, 10, 17), health: "Due this week" }),
  row(EXTRA[3], { step: "Name resubmission after RUN rejection", code: "Step 4", phases: [3, 0, 0, 0], pendingWith: "MCA", days: 8, next: d(2026, 10, 21), health: "Stuck" }),
  row(EXTRA[4], { step: "Auditor appointment (ADT-1)", code: "Step 21", phases: [5, 9, 6, 0], pendingWith: "Client", days: 4, next: d(2026, 10, 23), health: "With client" }),
  row(EXTRA[5], { step: "Subscriber details", code: "Step 9", phases: [5, 3, 0, 0], pendingWith: "Client", days: 1, next: d(2026, 10, 22), health: "In progress" }),
];

/** Krishna (admin) sees all 14. Pranay (manager) and his project leads see Pranay's 8. */
export function clientsFor(portal: StaffPortal): StaffClient[] {
  return portal === "admin" ? STAFF_CLIENTS : STAFF_CLIENTS.filter((c) => c.manager === "Pranay");
}

export function clientById(id: string): StaffClient | undefined {
  return STAFF_CLIENTS.find((c) => c.id === id);
}

export const doneSteps = (c: StaffClient) => c.phases.reduce((a, b) => a + b, 0);
export const progressPct = (c: StaffClient) => Math.round((doneSteps(c) / ALL_STEPS) * 100);
/** Incorporation steps done, out of 25. */
export const incDone = (c: StaffClient) => c.phases[0] + c.phases[1] + c.phases[2];

export const healthTone = {
  "In progress": "prog",
  "With client": "teal",
  "Due this week": "warn",
  Overdue: "bad",
  Stuck: "bad",
  "Not started": "idle",
} as const satisfies Record<Health, string>;

/** Registrations per client: d done, p in progress, w waiting on documents, n not yet (before COI), x not needed. */
export const REG_NAMES = ["GST", "LUT", "PF", "ESI", "PT", "Shops", "MSME", "IEC", "Trademark"] as const;
export const REG_CODES: Record<string, string> = {
  northwind: "nnnnnnnnn",
  orchid: "nnnnnnnnn",
  larkspur: "nnnnnnnnn",
  monsoon: "nnnnnnnnn",
  banyan: "nnnnnnnnn",
  quartz: "nnnnnnnnn",
  kestrel: "pxwwwwwxx",
  halcyon: "ddddddddp",
  tidewater: "dddddddxw",
  brightwave: "dxpwdpdxx",
  juniper: "nnnnnnnnn",
  saffron: "dxddwdxxx",
  indigo: "ddppddxdx",
  coral: "dxdddddxw",
};

export const REG_STATUS = {
  d: { label: "Granted", tone: "ok" },
  p: { label: "In progress", tone: "prog" },
  w: { label: "With client", tone: "teal" },
  n: { label: "After COI", tone: "idle" },
  x: { label: "Not needed", tone: "idle" },
} as const;

/** Obligations for a client in compliance (FY 2026-27, September period). */
export interface ObligationRow {
  id: string;
  name: string;
  area: string;
  period: string;
  due: Date;
  status: "Filed" | "Due this week" | "Upcoming" | "Overdue";
}

const OB_BASE: Array<[string, string, string, Date]> = [
  ["GSTR-1", "GST", "Sep 2026", d(2026, 10, 11)],
  ["GSTR-3B", "GST", "Sep 2026", d(2026, 10, 20)],
  ["TDS challan", "Income tax", "Sep 2026", d(2026, 10, 7)],
  ["PF ECR", "Payroll", "Sep 2026", d(2026, 10, 15)],
  ["ESI challan", "Payroll", "Sep 2026", d(2026, 10, 15)],
  ["Professional tax", "Payroll", "Sep 2026", d(2026, 10, 10)],
  ["DIR-3 KYC", "MCA", "FY 2026-27", d(2026, 10, 30)],
];

/** Filings past due and not filed, per client id (old Main.dc.html FR "o" cells and data.js EXC). */
const OB_LATE: Record<string, Array<[string, string, string, Date]>> = {
  halcyon: [["PF ECR", "Payroll", "Sep 2026", d(2026, 10, 15)]],
  tidewater: [["FC-GPR", "FEMA", "Allotment", d(2026, 10, 15)]],
  coral: [["TDS challan", "Income tax", "Sep 2026", d(2026, 10, 7)]],
};

const OPEN_FROM = STAFF_TODAY;
const WEEK_END = d(2026, 10, 23);

export function obligationsOf(c: StaffClient): ObligationRow[] {
  if (c.stage === "incorporating") return [];
  const late = (OB_LATE[c.id] ?? []).map(([name, area, period, due], i): ObligationRow => ({ id: `${c.id}-late${i}`, name, area, period, due, status: "Overdue" }));
  const lateNames = new Set((OB_LATE[c.id] ?? []).map(([name]) => name));
  const rest = OB_BASE.filter(([name]) => !lateNames.has(name)).map(([name, area, period, due], i): ObligationRow => ({
    id: `${c.id}-ob${i}`,
    name,
    area,
    period,
    due,
    status: due < OPEN_FROM ? "Filed" : due <= WEEK_END ? "Due this week" : "Upcoming",
  }));
  return [...late, ...rest];
}

/** Overdue filings across a set of clients, oldest first. */
export function overdueFilings(clients: StaffClient[]) {
  return clients
    .flatMap((c) => obligationsOf(c).filter((o) => o.status === "Overdue").map((o) => ({ ...o, client: c })))
    .sort((a, b) => a.due.getTime() - b.due.getTime());
}

/** Client contact (login) per client. Ported from reference/old-screens/s/lead/Clients.dc.html. */
export interface ClientContact {
  name: string;
  email: string;
  phone: string;
}

export const CONTACTS: Record<string, ClientContact> = {
  northwind: { name: "Rohan Kumar", email: "rohan@northwind.in", phone: "+91 98111 22334" },
  kestrel: { name: "Lars Becker", email: "lars@kestrel.example", phone: "+49 151 2345 6789" },
  halcyon: { name: "Jonas Weber", email: "jonas@halcyon.example", phone: "+49 160 9876 5432" },
  orchid: { name: "Amara Okafor", email: "amara@orchid.example", phone: "+44 7700 900123" },
  tidewater: { name: "Mei Tanaka", email: "mei@tidewater.example", phone: "+81 90 1234 5678" },
  brightwave: { name: "Daniel Ortiz", email: "daniel@brightwave.example", phone: "+1 415 555 0142" },
  larkspur: { name: "Sofia Moreau", email: "sofia@larkspur.example", phone: "+44 7700 900456" },
  juniper: { name: "Elena Rossi", email: "elena@juniper.example", phone: "+39 333 123 4567" },
  saffron: { name: "Kavya Reddy", email: "kavya@saffron.in", phone: "+91 98480 12121" },
  monsoon: { name: "Ishaan Verma", email: "ishaan@monsoon.in", phone: "+91 98480 23232" },
  indigo: { name: "Ravi Shankar", email: "ravi@indigo.in", phone: "+91 98480 34343" },
  banyan: { name: "Ananya Das", email: "ananya@banyan.in", phone: "+91 98480 45454" },
  coral: { name: "Neha Pillai", email: "neha@coral.in", phone: "+91 98480 56565" },
  quartz: { name: "Vivek Rao", email: "vivek@quartz.in", phone: "+91 98480 67676" },
};

/** Sort order for the Clients grid: worst health first (old admin Clients). */
export const HEALTH_ORDER: Record<Health, number> = { Stuck: 0, Overdue: 1, "Due this week": 2, "With client": 3, "In progress": 4, "Not started": 5 };

/** E-08: when a client last changed (step moved, document in, holder changed). Times on Fri 16 Oct match the task changes. */
export const CLIENT_CHANGED: Record<string, Date> = {
  brightwave: new Date(2026, 9, 16, 9, 20),
  tidewater: new Date(2026, 9, 16, 9, 30),
  northwind: new Date(2026, 9, 16, 10, 48),
  monsoon: new Date(2026, 9, 16, 10, 15),
  kestrel: new Date(2026, 9, 15, 15, 40),
};
export const clientChanged = (c: { id: string }) => CLIENT_CHANGED[c.id];
