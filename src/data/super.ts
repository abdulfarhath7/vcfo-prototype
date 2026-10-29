import { STAFF_TODAY, d, daysFrom } from "@/lib/dates";
import { CLIENTS, CLIENT_PEOPLE, type Client } from "@/data/people";
import { CONTACTS } from "@/data/staff-clients";
import type { ChipTone, Owner } from "@/components/ui/Chip";

// Sample data for the super admin portal. Ported from reference/old-screens/s/super/data.js.
// The super admin portal is frozen on Fri 16 Oct 2026 (STAFF_TODAY), as in the old prototype.
// No money here (R-37): fees, dues and late-fee amounts live in super-firm.ts for the reports and the record only.

export type Area = "Incorporation" | "Registrations" | "Compliances";
export const AREAS: Area[] = ["Incorporation", "Registrations", "Compliances"];

/* ---------- Team ---------- */

export interface Manager {
  id: string;
  name: string;
  ini: string;
  admin: string;
  leads: string[];
  /** Filings and steps on time this year, in percent. */
  onTime: number;
  /** Average days to the certificate of incorporation this year (old DAYS). */
  daysToCoi: number;
}

/** Clients one manager can run well (old data.js CAP). */
export const CAP = 10;

export const MANAGERS: Manager[] = [
  { id: "pranay", name: "Pranay", ini: "PN", admin: "Krishna", leads: ["Bharath", "Sneha Kulkarni", "Meera Nair"], onTime: 91, daysToCoi: 31 },
  { id: "priya", name: "Priya Raman", ini: "PR", admin: "Krishna", leads: ["Aditi Rao", "Kabir Sethi"], onTime: 86, daysToCoi: 36 },
  { id: "arjun", name: "Arjun Mehta", ini: "AM", admin: "Krishna", leads: ["Nikhil Jain", "Tara Menon"], onTime: 79, daysToCoi: 41 },
  { id: "vikram", name: "Vikram Shah", ini: "VS", admin: "Ritu Agarwal", leads: ["Rahul Menon", "Isha Kapoor"], onTime: 88, daysToCoi: 29 },
];

export type StaffRole = "Admin" | "Manager" | "Project lead";

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  reportsTo: string;
  clients: number;
  open: number;
  overdue: number;
  /** Load in percent of capacity. */
  load: number;
  lastActive: string;
}

// Open and overdue counts come from the old ALLTASKS list (open = not done, overdue = "bad").
export const STAFF: Staff[] = [
  { id: "krishna", name: "Krishna", role: "Admin", reportsTo: "Mithilesh", clients: 14, open: 2, overdue: 0, load: 47, lastActive: "Today 11:20" },
  { id: "ritu", name: "Ritu Agarwal", role: "Admin", reportsTo: "Mithilesh", clients: 3, open: 1, overdue: 0, load: 30, lastActive: "Today 09:40" },
  { id: "pranay", name: "Pranay", role: "Manager", reportsTo: "Krishna", clients: 8, open: 15, overdue: 2, load: 80, lastActive: "Today 10:05" },
  { id: "priya", name: "Priya Raman", role: "Manager", reportsTo: "Krishna", clients: 3, open: 4, overdue: 1, load: 30, lastActive: "Today 08:55" },
  { id: "arjun", name: "Arjun Mehta", role: "Manager", reportsTo: "Krishna", clients: 3, open: 4, overdue: 1, load: 30, lastActive: "Yesterday" },
  { id: "vikram", name: "Vikram Shah", role: "Manager", reportsTo: "Ritu Agarwal", clients: 3, open: 4, overdue: 1, load: 30, lastActive: "Today 09:15" },
  { id: "bharath", name: "Bharath", role: "Project lead", reportsTo: "Pranay", clients: 3, open: 6, overdue: 0, load: 60, lastActive: "Today 11:02" },
  { id: "sneha", name: "Sneha Kulkarni", role: "Project lead", reportsTo: "Pranay", clients: 3, open: 5, overdue: 2, load: 60, lastActive: "Today 10:40" },
  { id: "meera", name: "Meera Nair", role: "Project lead", reportsTo: "Pranay", clients: 2, open: 4, overdue: 0, load: 40, lastActive: "Today 10:18" },
  { id: "aditi", name: "Aditi Rao", role: "Project lead", reportsTo: "Priya Raman", clients: 2, open: 3, overdue: 0, load: 40, lastActive: "Today 09:58" },
  { id: "kabir", name: "Kabir Sethi", role: "Project lead", reportsTo: "Priya Raman", clients: 1, open: 1, overdue: 1, load: 20, lastActive: "Yesterday" },
  { id: "nikhil", name: "Nikhil Jain", role: "Project lead", reportsTo: "Arjun Mehta", clients: 2, open: 2, overdue: 1, load: 40, lastActive: "Today 08:30" },
  { id: "tara", name: "Tara Menon", role: "Project lead", reportsTo: "Arjun Mehta", clients: 1, open: 2, overdue: 0, load: 20, lastActive: "Yesterday" },
  { id: "rahul", name: "Rahul Menon", role: "Project lead", reportsTo: "Vikram Shah", clients: 2, open: 3, overdue: 1, load: 40, lastActive: "Today 10:12" },
  { id: "isha", name: "Isha Kapoor", role: "Project lead", reportsTo: "Vikram Shah", clients: 1, open: 1, overdue: 0, load: 20, lastActive: "Today 09:05" },
];

/** Reassign suggestions (old assign.js: the admin's one action is to assign a client to a manager). */
export interface Reassign {
  id: string;
  client: string;
  from: string;
  to: string;
  why: string;
  action: "Assign" | "Reassign";
}

export const REASSIGN: Reassign[] = [
  { id: "ra1", client: "Lotus Dental", from: "No manager", to: "Arjun Mehta", why: "Won 14 Oct · room for 7", action: "Assign" },
  { id: "ra2", client: "Orchid Lane Foods", from: "Pranay", to: "Priya Raman", why: "Pranay at 80% · Priya at 30%", action: "Reassign" },
  { id: "ra3", client: "Ember Textiles · INC-20A", from: "No project lead", to: "Rahul Menon", why: "Due 18 Oct", action: "Assign" },
  { id: "ra4", client: "Kestrel Health", from: "Bharath", to: "Meera Nair", why: "Bharath at 60% · Meera at 40%", action: "Reassign" },
];

/* ---------- Clients ---------- */

export type Health = "In progress" | "With client" | "Due soon" | "Overdue" | "Stuck" | "Not started";

export const HEALTH_TONE: Record<Health, ChipTone> = {
  "In progress": "prog",
  "With client": "teal",
  "Due soon": "warn",
  Overdue: "bad",
  Stuck: "bad",
  "Not started": "idle",
};

/** Old health words on the clients grid and the practice pages (data.js HEALTH). */
export const HEALTH_WORD: Record<Health, string> = {
  Stuck: "Stuck",
  Overdue: "Overdue",
  "Due soon": "Due this week",
  "With client": "Waiting on client",
  "In progress": "In progress",
  "Not started": "Not started",
};

/** Incorporation pipeline stage (old PIPE). */
export type Pipe = "name" | "spice" | "mca" | "post" | "reg" | "filing";

export interface Contact {
  name: string;
  role: string;
  email: string;
}

export interface FirmClient extends Client {
  /** Practice area of the current work. */
  area: Area;
  step: string;
  /** Old step code: "Pre-7", "Post-3", "Reg-1". */
  code: string;
  /** Step number in the 25-step incorporation list, when the work is a step. */
  stepNo?: number;
  owner: Owner;
  daysInStep: number;
  next: Date;
  overdue: number;
  health: Health;
  pipe: Pipe;
  since: Date;
  contacts: Contact[];
  /** Steps done in Name (5), Incorporation (9), Post-incorporation (11), Registrations (23). */
  phases: [number, number, number, number];
  /** Registrations, in the order of REGS: d done, p in progress, w waiting on documents, n after COI, x not needed. */
  reg: string;
}

type Extra = Omit<FirmClient, keyof Client>;

const OWNER: Record<string, Owner> = { Client: "client", SBC: "sbc", MCA: "mca" };
const HEALTH: Record<string, Health> = { run: "In progress", wait: "With client", due: "Due soon", over: "Overdue", stuck: "Stuck", none: "Not started" };

// Old CLIENTS row: [id, project lead, code, step, phases done, pending with, days, next (Oct day), health, pipe, overdue tasks, since, reg]
type Row = [string, string, string, string, [number, number, number, number], string, number, number, string, Pipe, number, Date, string];

const ROWS: Row[] = [
  ["northwind", "Bharath", "Pre-7", "Registered office address", [5, 1, 0, 0], "Client", 5, 20, "wait", "spice", 0, d(2026, 9, 10), "nnnnnnnnn"],
  ["orchid", "Sneha Kulkarni", "Pre-10", "KYC review and DSC", [5, 4, 0, 0], "SBC", 2, 19, "run", "spice", 0, d(2026, 9, 2), "nnnnnnnnn"],
  ["larkspur", "Meera Nair", "Pre-2", "Draft board resolution", [1, 0, 0, 0], "SBC", 1, 21, "run", "name", 0, d(2026, 10, 1), "nnnnnnnnn"],
  ["juniper", "Bharath", "Pre-1", "Client details", [0, 0, 0, 0], "Client", 2, 22, "none", "name", 0, d(2026, 10, 9), "nnnnnnnnn"],
  ["brightwave", "Sneha Kulkarni", "Post-3", "Bank account opening", [5, 9, 2, 0], "SBC", 4, 15, "over", "post", 2, d(2026, 7, 22), "dxpwdpdxx"],
  ["tidewater", "Meera Nair", "Post-8", "FC-GPR filing", [5, 9, 7, 0], "SBC", 3, 16, "due", "post", 0, d(2026, 6, 12), "dddddddxw"],
  ["kestrel", "Bharath", "Reg-1", "GST registration", [5, 9, 11, 3], "MCA", 2, 20, "run", "reg", 0, d(2026, 3, 18), "pxwwwwwxx"],
  ["halcyon", "Sneha Kulkarni", "Reg-15", "Trademark registration", [5, 9, 11, 19], "Client", 3, 25, "wait", "reg", 0, d(2025, 11, 6), "ddddddddp"],
  ["saffron", "Aditi Rao", "Post-5", "Share certificates", [5, 9, 4, 0], "SBC", 2, 18, "run", "post", 0, d(2026, 7, 14), "dxddwdxxx"],
  ["monsoon", "Kabir Sethi", "Pre-13", "MCA remarks on SPICe+", [5, 7, 0, 0], "MCA", 6, 19, "stuck", "mca", 1, d(2026, 8, 24), "nnnnnnnnn"],
  ["indigo", "Aditi Rao", "Reg-6", "PF registration", [5, 9, 11, 6], "SBC", 1, 17, "due", "reg", 0, d(2026, 5, 20), "ddppddxdx"],
  ["banyan", "Nikhil Jain", "Pre-4", "Name resubmission after RUN rejection", [3, 0, 0, 0], "MCA", 8, 21, "stuck", "name", 1, d(2026, 9, 3), "nnnnnnnnn"],
  ["coral", "Tara Menon", "Post-9", "Auditor appointment (ADT-1)", [5, 9, 6, 0], "Client", 4, 23, "wait", "post", 0, d(2026, 4, 9), "dxdddddxw"],
  ["quartz", "Nikhil Jain", "Pre-9", "Subscriber details", [5, 3, 0, 0], "Client", 1, 22, "run", "spice", 0, d(2026, 9, 21), "nnnnnnnnn"],
  ["pinecrest", "Rahul Menon", "Reg-4", "ESI registration", [5, 9, 11, 4], "SBC", 2, 21, "run", "reg", 0, d(2026, 3, 30), "dxdpddwxx"],
  ["saltmarsh", "Isha Kapoor", "Pre-11", "SPICe+ confirmation", [5, 5, 0, 0], "Client", 3, 20, "wait", "spice", 0, d(2026, 9, 8), "nnnnnnnnn"],
  ["ember", "Rahul Menon", "Post-6", "Commencement of business (INC-20A)", [5, 9, 5, 0], "SBC", 1, 18, "due", "post", 1, d(2026, 4, 2), "ddwwdpxdx"],
];

/** Step in the 25-step list for an old code: Pre-n is step n; post steps match by form. */
const POST_STEP: Record<string, number> = { "Post-3": 17, "Post-5": 19, "Post-6": 20, "Post-8": 22, "Post-9": 21 };
const stepNoOf = (code: string) => (code.startsWith("Pre-") ? Number(code.slice(4)) : POST_STEP[code]);

const MORE_BASE: Client[] = [
  { id: "saffron", name: "Saffron Retail Pvt Ltd", short: "Saffron", stage: "compliance", tone: "teal", lead: "Aditi Rao", manager: "Priya Raman", cin: "U52100TG2026PTC201145", pan: "ABACS3321F", gstin: "36ABACS3321F1Z6" },
  { id: "monsoon", name: "Monsoon Labs Pvt Ltd", short: "Monsoon", stage: "incorporating", tone: "violet", lead: "Kabir Sethi", manager: "Priya Raman" },
  { id: "indigo", name: "Indigo Freight Pvt Ltd", short: "Indigo", stage: "compliance", tone: "accent", lead: "Aditi Rao", manager: "Priya Raman", cin: "U60200TG2026PTC199870", pan: "ABBCI7710D", gstin: "36ABBCI7710D1ZQ" },
  { id: "banyan", name: "Banyan Wellness Pvt Ltd", short: "Banyan", stage: "incorporating", tone: "ok", lead: "Nikhil Jain", manager: "Arjun Mehta" },
  { id: "coral", name: "Coral Studios Pvt Ltd", short: "Coral", stage: "compliance", tone: "warn", lead: "Tara Menon", manager: "Arjun Mehta", cin: "U92100TG2026PTC198034", pan: "ABDCC4410P", gstin: "36ABDCC4410P1Z1" },
  { id: "quartz", name: "Quartz Mobility Pvt Ltd", short: "Quartz", stage: "incorporating", tone: "warn", lead: "Nikhil Jain", manager: "Arjun Mehta" },
  { id: "pinecrest", name: "Pinecrest Hotels Pvt Ltd", short: "Pinecrest", stage: "compliance", tone: "violet", lead: "Rahul Menon", manager: "Vikram Shah", cin: "U55101TG2026PTC197702", pan: "ABECP9921H", gstin: "36ABECP9921H1ZT" },
  { id: "saltmarsh", name: "Saltmarsh Ventures Pvt Ltd", short: "Saltmarsh", stage: "incorporating", tone: "idle", lead: "Isha Kapoor", manager: "Vikram Shah" },
  { id: "ember", name: "Ember Textiles Pvt Ltd", short: "Ember", stage: "compliance", tone: "warn", lead: "Rahul Menon", manager: "Vikram Shah", cin: "U17110TG2026PTC196611", pan: "ABFCE2287K", gstin: "36ABFCE2287K1ZE" },
];

/** Contacts for the clients that staff-clients.ts does not list. */
const OWN_CONTACTS: Record<string, Contact> = {
  pinecrest: { name: "George Fernandes", role: "Director · primary contact", email: "george@pinecrest.in" },
  saltmarsh: { name: "Nitin Desai", role: "Director · primary contact", email: "nitin@saltmarsh.in" },
  ember: { name: "Farida Sheikh", role: "Director · primary contact", email: "farida@ember.in" },
};

function contactsOf(id: string): Contact[] {
  if (id === "northwind") return CLIENT_PEOPLE.map((p) => ({ name: p.name, role: p.role, email: p.email }));
  const c = CONTACTS[id];
  if (c) return [{ name: c.name, role: "Director · primary contact", email: c.email }];
  return OWN_CONTACTS[id] ? [OWN_CONTACTS[id]] : [];
}

function extraOf(r: Row): Extra {
  const [id, , code, step, phases, ball, days, next, health, pipe, overdue, since, reg] = r;
  return {
    area: pipe === "reg" ? "Registrations" : "Incorporation",
    step,
    code,
    stepNo: stepNoOf(code),
    owner: OWNER[ball],
    daysInStep: days,
    next: d(2026, 10, next),
    overdue,
    health: HEALTH[health],
    pipe,
    since,
    contacts: contactsOf(id),
    phases,
    reg,
  };
}

const BASES: Client[] = [...CLIENTS, ...MORE_BASE];

/** All 17 firm clients in the old order (data.js CLIENTS): Pranay's 8, then Priya Raman, Arjun Mehta and Vikram Shah. */
export const FIRM_CLIENTS: FirmClient[] = ROWS.map((r) => {
  const base = BASES.find((c) => c.id === r[0])!;
  return { ...base, lead: r[1], ...extraOf(r) };
});

export const clientById = (id: string) => FIRM_CLIENTS.find((c) => c.id === id);

export const stageLabel = (c: Client) => (c.stage === "incorporating" ? "Incorporating" : "Compliance");
export const stageTone = (c: Client): ChipTone => (c.stage === "incorporating" ? "warn" : "ok");

/* ---------- Registrations ---------- */

export const REGS = ["GST", "LUT", "PF", "ESI", "PT", "Shops", "MSME", "IEC", "Trademark"];

export type WorkStatus = "In progress" | "With client" | "Due soon" | "Overdue" | "Stuck" | "Filed" | "Filed late" | "Upcoming" | "Not started";

export const WORK_TONE: Record<WorkStatus, ChipTone> = {
  "In progress": "prog",
  "With client": "teal",
  "Due soon": "warn",
  Overdue: "bad",
  Stuck: "bad",
  Filed: "ok",
  "Filed late": "warn",
  Upcoming: "idle",
  "Not started": "idle",
};

/** One work item in a practice area: a step, a registration or a filing. */
export interface Work {
  id: string;
  clientId: string;
  area: Area;
  item: string;
  /** Statute or group: "GST", "SPICe+ forms", "PF". */
  group: string;
  owner: Owner;
  due: Date;
  /** Days at the current state. Null for work not started. */
  days: number | null;
  status: WorkStatus;
}

const PIPE_LABEL: Record<Pipe, string> = { name: "Name approval", spice: "SPICe+ forms", mca: "MCA review", post: "Post-incorporation", reg: "Registrations", filing: "Filings" };
export const INC_STAGES: Pipe[] = ["name", "spice", "mca", "post"];
export const pipeLabel = (p: Pipe) => PIPE_LABEL[p];

const healthToWork = (h: Health): WorkStatus => h;

const INC_WORK: Work[] = FIRM_CLIENTS.filter((c) => c.area === "Incorporation").map((c) => ({
  id: `inc-${c.id}`,
  clientId: c.id,
  area: "Incorporation",
  item: `Step ${c.stepNo} · ${c.step}`,
  group: PIPE_LABEL[c.pipe],
  owner: c.owner,
  due: c.next,
  days: c.health === "Not started" ? null : c.daysInStep,
  status: healthToWork(c.health),
}));

const REG_NAME: Record<string, string> = {
  GST: "GST registration",
  LUT: "LUT filing",
  PF: "PF registration",
  ESI: "ESI registration",
  PT: "Professional tax registration",
  Shops: "Shops and establishments",
  MSME: "MSME (Udyam) registration",
  IEC: "Import export code (IEC)",
  Trademark: "Trademark registration",
};

// One work item for each open cell of the old REG matrix: p in progress (SBC), w pending on documents (client).
const REG_WORK: Work[] = FIRM_CLIENTS.flatMap((c) =>
  c.reg.split("").flatMap((v, i) => {
    if (v !== "p" && v !== "w") return [];
    const reg = REGS[i];
    const current = REG_NAME[reg] === c.step;
    const status: WorkStatus = v === "w" ? "With client" : current && c.health === "Due soon" ? "Due soon" : "In progress";
    return [
      {
        id: `reg-${c.id}-${reg}`,
        clientId: c.id,
        area: "Registrations" as Area,
        item: REG_NAME[reg],
        group: reg,
        owner: (v === "w" ? "client" : current ? c.owner : "sbc") as Owner,
        due: current ? c.next : d(2026, 10, 30),
        days: current ? c.daysInStep : null,
        status,
      },
    ];
  }),
);

/* ---------- Filings (October) ---------- */

export const STATUTES = ["GST", "TDS", "Income tax", "ROC", "FEMA", "PF and ESI", "PT"];

// October plan for every client in compliance (old PLAN): [day, form, statute]
const PLAN: Array<[number, string, string]> = [
  [7, "TDS challan · September", "TDS"],
  [10, "Professional tax", "PT"],
  [11, "GSTR-1 · September", "GST"],
  [15, "PF ECR · September", "PF and ESI"],
  [15, "ESI · September", "PF and ESI"],
  [20, "GSTR-3B · September", "GST"],
  [29, "AOC-4 financial statements", "ROC"],
  [31, "TDS return · Q2", "TDS"],
];

// Exceptions (old EXC): "client|day|form" -> o overdue, l filed late.
const EXC: Record<string, "o" | "l"> = {
  "brightwave|15|PF ECR · September": "o",
  "coral|7|TDS challan · September": "o",
  "ember|7|TDS challan · September": "o",
  "halcyon|11|GSTR-1 · September": "l",
  "indigo|15|ESI · September": "l",
  "kestrel|10|Professional tax": "o",
  "saffron|11|GSTR-1 · September": "l",
};

/** Clients in compliance, in the old CMP order. */
const CMP = ["brightwave", "tidewater", "kestrel", "halcyon", "saffron", "indigo", "coral", "pinecrest", "ember"];

function planStatus(day: number, e?: "o" | "l"): WorkStatus {
  if (e === "o") return "Overdue";
  if (e === "l") return "Filed late";
  return day < 16 ? "Filed" : day <= 22 ? "Due soon" : "Upcoming";
}

const filing = (clientId: string, day: number, item: string, group: string, status: WorkStatus, i: number): Work => ({
  id: `fil-${clientId}-${i}`,
  clientId,
  area: "Compliances",
  item,
  group,
  owner: "sbc",
  due: d(2026, 10, day),
  days: status === "Overdue" ? daysFrom(STAFF_TODAY, d(2026, 10, day)) : null,
  status,
});

/** October filings (old FIL): 75 rows. */
export const FILINGS: Work[] = [
  ...CMP.flatMap((k) => PLAN.map(([day, item, group], i) => filing(k, day, item, group, planStatus(day, EXC[`${k}|${day}|${item}`]), i))),
  filing("tidewater", 22, "FC-GPR", "FEMA", "Due soon", 8),
  filing("ember", 18, "INC-20A commencement", "ROC", "Due soon", 8),
  filing("saffron", 30, "MSME-1 return", "ROC", "Upcoming", 8),
].sort((a, b) => a.due.getTime() - b.due.getTime());

export const WORK: Record<Area, Work[]> = {
  Incorporation: INC_WORK,
  Registrations: REG_WORK,
  Compliances: FILINGS,
};

export function countBy<T extends string>(rows: Work[], key: (w: Work) => T) {
  const out = {} as Record<T, number>;
  rows.forEach((r) => {
    const k = key(r);
    out[k] = (out[k] ?? 0) + 1;
  });
  return out;
}

/** Registrations done across the firm (from the reg strings). */
export const REG_DONE = FIRM_CLIENTS.reduce((a, c) => a + c.reg.split("").filter((v) => v === "d").length, 0);

/* ---------- Practice areas (overview) ---------- */

export interface AreaRow {
  area: Area;
  active: number;
  doneThisMonth: number;
  overdue: number;
  health: "On track" | "Watch" | "At risk";
  lead: string;
  href: string;
}

export const AREA_ROWS: AreaRow[] = [
  {
    area: "Incorporation",
    active: INC_WORK.length,
    doneThisMonth: 3,
    overdue: INC_WORK.filter((w) => w.status === "Stuck" || w.status === "Overdue").length,
    health: "At risk",
    lead: "Pranay",
    href: "/super/practice/incorporation",
  },
  {
    area: "Registrations",
    active: new Set(REG_WORK.map((w) => w.clientId)).size,
    doneThisMonth: 6,
    overdue: REG_WORK.filter((w) => w.status === "Overdue").length,
    health: "Watch",
    lead: "Priya Raman",
    href: "/super/practice/registrations",
  },
  {
    area: "Compliances",
    active: CMP.length,
    doneThisMonth: FILINGS.filter((w) => w.status === "Filed" || w.status === "Filed late").length,
    overdue: FILINGS.filter((w) => w.status === "Overdue").length,
    health: "At risk",
    lead: "Vikram Shah",
    href: "/super/practice/compliances",
  },
];

export const AREA_HEALTH_TONE: Record<AreaRow["health"], ChipTone> = { "On track": "ok", Watch: "warn", "At risk": "bad" };

/* ---------- Risks ---------- */

export type Severity = "High" | "Medium" | "Low";
export const SEVERITY_TONE: Record<Severity, ChipTone> = { High: "bad", Medium: "warn", Low: "idle" };
/** Old severity 1-3 as a word. */
export const SEVERITY_OF: Record<1 | 2 | 3, Severity> = { 3: "High", 2: "Medium", 1: "Low" };

export type RiskKind = "filing" | "notice" | "kyc" | "owner" | "unassigned";

export interface Risk {
  id: string;
  kind: RiskKind;
  title: string;
  /** Null for a prospect that is not a client yet. */
  clientId: string | null;
  clientName: string;
  /** Days open on 16 Oct. */
  age: number;
  /** Late fee or penalty so far, in rupees (sorts the list only, R-37). */
  impact: number;
  /** 1 low, 2 medium, 3 high (old severity). */
  sev: 1 | 2 | 3;
  severity: Severity;
  area: Area;
  /** Manager who owns the client, and the admin above. */
  owner: string;
  admin: string;
}

// Old RISKS: [kind, title, client, age in days, rupee impact, severity 1-3]
const RISK_ROWS: Array<[RiskKind, string, string | null, number, number, 1 | 2 | 3]> = [
  ["filing", "TDS challan not paid", "coral", 9, 1800, 3],
  ["filing", "TDS challan not paid", "ember", 9, 1800, 3],
  ["filing", "Professional tax not paid", "kestrel", 6, 1200, 2],
  ["filing", "PF ECR not filed", "brightwave", 1, 1500, 2],
  ["notice", "MCA remarks on SPICe+ unanswered", "monsoon", 6, 0, 3],
  ["notice", "RUN name rejected; resubmission pending", "banyan", 8, 0, 2],
  ["kyc", "Director DSC expires 28 Oct", "orchid", 12, 0, 2],
  ["kyc", "DIN KYC for one director not filed", "halcyon", 16, 5000, 2],
  ["owner", "New client Lotus Dental has no manager", null, 2, 0, 2],
  ["unassigned", "INC-20A due 18 Oct has no project lead assigned", "ember", 0, 0, 1],
];

const shortName = (n: string) => n.replace(/ (Pvt Ltd|LLP)$/, "");

export const RISKS: Risk[] = RISK_ROWS.map(([kind, title, clientId, age, impact, sev], i) => ({
  id: `rk${i + 1}`,
  kind,
  title,
  clientId,
  clientName: clientId ? shortName(clientById(clientId)!.name) : "New client",
  age,
  impact,
  sev,
  severity: SEVERITY_OF[sev],
  owner: clientId ? clientById(clientId)!.manager : "No manager",
  admin: clientId ? (MANAGERS.find((m) => m.name === clientById(clientId)!.manager)?.admin ?? "") : "Krishna (to assign)",
  area: kind === "filing" ? "Compliances" : kind === "notice" || kind === "unassigned" ? "Incorporation" : clientId && clientById(clientId)!.stage === "compliance" ? "Compliances" : "Incorporation",
}));

/* ---------- Growth (counts only, R-37) ---------- */

export const GROWTH_MONTHS: Array<{ month: string; Incorporation: number; Registrations: number; Compliances: number }> = [
  { month: "May", Incorporation: 2, Registrations: 1, Compliances: 1 },
  { month: "Jun", Incorporation: 3, Registrations: 2, Compliances: 0 },
  { month: "Jul", Incorporation: 1, Registrations: 1, Compliances: 2 },
  { month: "Aug", Incorporation: 2, Registrations: 0, Compliances: 1 },
  { month: "Sep", Incorporation: 2, Registrations: 1, Compliances: 0 },
  { month: "Oct", Incorporation: 1, Registrations: 0, Compliances: 1 },
];

export type PipeStage = "Enquiry" | "Proposal" | "Won";
export const PIPE_STAGE_TONE: Record<PipeStage, ChipTone> = { Enquiry: "idle", Proposal: "prog", Won: "ok" };

export interface Prospect {
  id: string;
  name: string;
  area: Area;
  service: string;
  stage: PipeStage;
  owner: string;
  next: string;
  since: Date;
  source: "Referral" | "Website" | "Existing client" | "Partner CA";
}

export const PIPELINE: Prospect[] = [
  { id: "p1", name: "Northstar Clinics", area: "Incorporation", service: "Incorporation", stage: "Enquiry", owner: "Krishna", next: "Call on 8 Oct", since: d(2026, 10, 14), source: "Referral" },
  {
    id: "p2",
    name: "Blue Lotus Exports",
    area: "Registrations",
    service: "IEC and GST",
    stage: "Enquiry",
    owner: "Ritu Agarwal",
    next: "Send document list",
    since: d(2026, 10, 11),
    source: "Website",
  },
  {
    id: "p3",
    name: "Arcadia Learning",
    area: "Compliances",
    service: "Monthly compliance",
    stage: "Enquiry",
    owner: "Krishna",
    next: "Meeting on 9 Oct",
    since: d(2026, 10, 15),
    source: "Existing client",
  },
  { id: "p4", name: "Redwood Labs", area: "Incorporation", service: "Incorporation", stage: "Enquiry", owner: "Ritu Agarwal", next: "Follow up", since: d(2026, 10, 8), source: "Website" },
  {
    id: "p5",
    name: "Meridian Health",
    area: "Incorporation",
    service: "Incorporation and registrations",
    stage: "Proposal",
    owner: "Krishna",
    next: "Proposal review on 7 Oct",
    since: d(2026, 10, 10),
    source: "Referral",
  },
  {
    id: "p6",
    name: "Kite Logistics",
    area: "Compliances",
    service: "Monthly compliance",
    stage: "Proposal",
    owner: "Ritu Agarwal",
    next: "Answer scope questions",
    since: d(2026, 10, 13),
    source: "Partner CA",
  },
  { id: "p7", name: "Sunbeam Foods", area: "Compliances", service: "FEMA advisory", stage: "Proposal", owner: "Krishna", next: "Follow up", since: d(2026, 10, 5), source: "Referral" },
  { id: "p8", name: "Lotus Dental", area: "Incorporation", service: "Incorporation", stage: "Won", owner: "Krishna", next: "Assign a manager", since: d(2026, 10, 14), source: "Referral" },
  {
    id: "p9",
    name: "Aurora Paints",
    area: "Compliances",
    service: "Monthly compliance",
    stage: "Won",
    owner: "Ritu Agarwal",
    next: "Onboarding on 1 Nov",
    since: d(2026, 10, 7),
    source: "Existing client",
  },
];

/* ---------- Reports ---------- */

export interface SavedReport {
  id: string;
  name: string;
  area: Area | "Firm";
  period: string;
  lastRun: Date;
  schedule: string;
}

export const REPORT_PERIODS = ["Oct 2026", "Sep 2026", "Q2 FY 2026-27", "FY 2026-27"];

export const REPORTS: SavedReport[] = [
  { id: "r1", name: "Partner report", area: "Firm", period: "Sep 2026", lastRun: d(2026, 10, 1), schedule: "1st of the month" },
  { id: "r2", name: "Client health", area: "Firm", period: "Oct 2026", lastRun: d(2026, 10, 16), schedule: "Daily" },
  { id: "r3", name: "Team load", area: "Firm", period: "Oct 2026", lastRun: d(2026, 10, 12), schedule: "Every Monday" },
  { id: "r4", name: "Incorporation pipeline", area: "Incorporation", period: "Oct 2026", lastRun: d(2026, 10, 12), schedule: "Every Monday" },
  { id: "r5", name: "Days to COI by manager", area: "Incorporation", period: "Q2 FY 2026-27", lastRun: d(2026, 10, 1), schedule: "Quarterly" },
  { id: "r6", name: "Registrations pending", area: "Registrations", period: "Oct 2026", lastRun: d(2026, 10, 16), schedule: "Daily" },
  { id: "r7", name: "Filings on time", area: "Compliances", period: "Sep 2026", lastRun: d(2026, 10, 1), schedule: "1st of the month" },
  { id: "r8", name: "Late filings and notices", area: "Compliances", period: "Sep 2026", lastRun: d(2026, 10, 1), schedule: "1st of the month" },
  { id: "r9", name: "DIR-3 KYC status", area: "Compliances", period: "FY 2026-27", lastRun: d(2026, 9, 28), schedule: "Manual" },
  { id: "r10", name: "Risk register", area: "Firm", period: "Q2 FY 2026-27", lastRun: d(2026, 9, 30), schedule: "Quarterly" },
  { id: "r11", name: "New clients and services", area: "Firm", period: "FY 2026-27", lastRun: d(2026, 10, 1), schedule: "1st of the month" },
];

/* ---------- Firm settings ---------- */

export const FIRM_PROFILE = [
  { k: "Firm name", v: "SBC" },
  { k: "Website", v: "sbcllp.in" },
  { k: "Portal address", v: "app.sbctrack.in", mono: true },
  { k: "Sender email", v: "updates@sbcllp.in", mono: true },
  { k: "Help desk", v: "+91 40 2345 6789" },
  { k: "Office", v: "Hyderabad, Telangana" },
];

export interface Holiday {
  id: string;
  date: Date;
  name: string;
  kind: "National" | "Festival" | "State";
  closed: boolean;
}

export const HOLIDAYS: Holiday[] = [
  { id: "h1", date: d(2026, 10, 2), name: "Gandhi Jayanti", kind: "National", closed: true },
  { id: "h2", date: d(2026, 10, 20), name: "Vijaya Dashami", kind: "Festival", closed: true },
  { id: "h3", date: d(2026, 11, 9), name: "Diwali", kind: "Festival", closed: true },
  { id: "h4", date: d(2026, 12, 25), name: "Christmas", kind: "Festival", closed: true },
  { id: "h5", date: d(2027, 1, 26), name: "Republic Day", kind: "National", closed: true },
  { id: "h6", date: d(2027, 6, 2), name: "Telangana Formation Day", kind: "State", closed: false },
];

export interface ReminderRule {
  id: string;
  label: string;
  sub: string;
  on: boolean;
}

export const REMINDER_RULES: ReminderRule[] = [
  { id: "rr1", label: "First reminder to the client", sub: "7 days before a due date", on: true },
  { id: "rr2", label: "Second reminder to the client", sub: "2 days before a due date", on: true },
  { id: "rr3", label: "WhatsApp reminders", sub: "With the email reminder", on: true },
  { id: "rr4", label: "Escalate a stuck step to the admin", sub: "After 3 days", on: true },
  { id: "rr5", label: "Daily digest to managers", sub: "09:00, working days", on: false },
  { id: "rr6", label: "Reminders on holidays", sub: "Office holidays above", on: false },
];

export interface RolePerm {
  role: string;
  view: boolean;
  edit: boolean;
  approve: boolean;
}

export const ROLE_PERMS: RolePerm[] = [
  { role: "Super admin", view: true, edit: true, approve: true },
  { role: "Admin", view: true, edit: true, approve: true },
  { role: "Manager", view: true, edit: true, approve: true },
  { role: "Project lead", view: true, edit: true, approve: false },
  { role: "Client", view: true, edit: false, approve: false },
  { role: "Developer", view: true, edit: false, approve: false },
];

export interface Integration {
  id: string;
  name: string;
  sub: string;
  status: "Connected" | "Needs sign-in" | "Not connected";
}

export const INTEGRATION_TONE: Record<Integration["status"], ChipTone> = { Connected: "ok", "Needs sign-in": "warn", "Not connected": "idle" };

export const INTEGRATIONS: Integration[] = [
  { id: "i1", name: "MCA V3", sub: "mca.gov.in · synced 09:40", status: "Connected" },
  { id: "i2", name: "GST portal", sub: "gst.gov.in · synced 08:15", status: "Connected" },
  { id: "i3", name: "Income tax e-Filing (ERI)", sub: "incometax.gov.in · synced 07:50", status: "Connected" },
  { id: "i4", name: "EPFO unified portal", sub: "Session expired 5 Oct", status: "Needs sign-in" },
  { id: "i5", name: "WhatsApp Business", sub: "+91 40 2345 6789", status: "Connected" },
  { id: "i6", name: "Microsoft 365 mail", sub: "updates@sbcllp.in", status: "Connected" },
  { id: "i7", name: "DigiLocker", sub: "Client documents", status: "Not connected" },
];

/* ---------- Client record ---------- */

export interface Service {
  id: string;
  name: string;
  area: Area;
  started: Date;
  status: "Active" | "In progress" | "With client" | "Done";
  owner: string;
}

export const SERVICE_TONE: Record<Service["status"], ChipTone> = { Active: "ok", "In progress": "prog", "With client": "teal", Done: "ok" };

/** Services SBC runs for one client, from its stage and registrations. */
export function servicesOf(c: FirmClient): Service[] {
  const out: Service[] = [];
  if (c.stage === "incorporating") {
    out.push({ id: "inc", name: "Private limited incorporation", area: "Incorporation", started: c.since, status: c.owner === "client" ? "With client" : "In progress", owner: c.lead });
    return out;
  }
  if (c.pipe === "post")
    out.push({ id: "post", name: "Post-incorporation pack", area: "Incorporation", started: c.since, status: c.owner === "client" ? "With client" : "In progress", owner: c.lead });
  const open = c.reg.split("").some((v) => v === "p" || v === "w");
  out.push({ id: "reg", name: "GST and payroll registrations", area: "Registrations", started: c.since, status: open ? "In progress" : "Done", owner: c.lead });
  out.push({ id: "mc", name: "Monthly compliance", area: "Compliances", started: c.since, status: "Active", owner: c.lead });
  if (c.id !== "halcyon") out.push({ id: "roc", name: "Annual ROC filings", area: "Compliances", started: c.since, status: "Active", owner: c.manager });
  if (c.id === "brightwave" || c.id === "juniper") out.push({ id: "fema", name: "FEMA advisory", area: "Compliances", started: c.since, status: "Active", owner: c.manager });
  return out;
}

export interface ClientAudit {
  id: string;
  date: Date;
  time: string;
  text: string;
  who: string;
}

/** Recent audit events for one client. */
export function auditOf(c: FirmClient): ClientAudit[] {
  const contact = c.contacts[0]?.name ?? "Client";
  return [
    { id: "a1", date: STAFF_TODAY, time: "09:10", text: `Reminder sent: ${c.step}`, who: "VCFO" },
    { id: "a2", date: d(2026, 10, 15), time: "17:20", text: `Updated ${c.step}`, who: c.lead },
    { id: "a3", date: d(2026, 10, 13), time: "11:05", text: "Uploaded documents", who: contact },
    { id: "a4", date: d(2026, 10, 9), time: "14:30", text: "Reviewed open items", who: c.manager },
    { id: "a5", date: d(2026, 10, 5), time: "10:00", text: "Signed in", who: contact },
    { id: "a6", date: c.since, time: "12:00", text: "Client added to VCFO Suite", who: MANAGERS.find((m) => m.name === c.manager)?.admin ?? "Krishna" },
  ];
}

/**
 * Home card trend lines (R-18): month-end counts for June to September. The screen adds October's live count.
 * September matches the change against September that each tile shows (+2, −3, +4 pts, +1).
 */
export const SUPER_TRENDS = {
  clients: [12, 13, 14, 15],
  registrations: [19, 21, 22, 23],
  onTime: [78, 81, 79, 80],
  overdue: [5, 4, 2, 3],
};
