import { TODAY, d, daysFrom } from "@/lib/dates";
import { CLIENTS, CLIENT_PEOPLE, type Client } from "@/data/people";
import type { ChipTone, Owner } from "@/components/ui/Chip";
import type { ThreadStep } from "@/components/cards/Thread";

// Sample data for the super admin portal. Ported from reference/old-screens/s/super/data.js.
// The old file is frozen on 16 Oct 2026; this file uses TODAY (6 Oct 2026), so dates move back 10 days.
// No money here (R-37): fees, dues and late-fee amounts from the old file are not ported.

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
  /** Average days to the certificate of incorporation this year. */
  daysToCoi: number;
}

/** Clients one manager can run well (old data.js CAP). */
export const CAP = 10;

export const MANAGERS: Manager[] = [
  { id: "pranay", name: "Pranay", ini: "PN", admin: "Krishna", leads: ["Bharath", "Divya"], onTime: 91, daysToCoi: 31 },
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

export const STAFF: Staff[] = [
  { id: "krishna", name: "Krishna", role: "Admin", reportsTo: "Mithilesh", clients: 14, open: 6, overdue: 0, load: 60, lastActive: "Today 11:20" },
  { id: "ritu", name: "Ritu Agarwal", role: "Admin", reportsTo: "Mithilesh", clients: 3, open: 3, overdue: 0, load: 30, lastActive: "Today 09:40" },
  { id: "pranay", name: "Pranay", role: "Manager", reportsTo: "Krishna", clients: 8, open: 21, overdue: 2, load: 80, lastActive: "Today 10:05" },
  { id: "priya", name: "Priya Raman", role: "Manager", reportsTo: "Krishna", clients: 3, open: 8, overdue: 1, load: 30, lastActive: "Today 08:55" },
  { id: "arjun", name: "Arjun Mehta", role: "Manager", reportsTo: "Krishna", clients: 3, open: 7, overdue: 2, load: 30, lastActive: "Yesterday" },
  { id: "vikram", name: "Vikram Shah", role: "Manager", reportsTo: "Ritu Agarwal", clients: 3, open: 6, overdue: 1, load: 30, lastActive: "Today 09:15" },
  { id: "bharath", name: "Bharath", role: "Project lead", reportsTo: "Pranay", clients: 5, open: 12, overdue: 1, load: 100, lastActive: "Today 11:02" },
  { id: "divya", name: "Divya", role: "Project lead", reportsTo: "Pranay", clients: 3, open: 7, overdue: 1, load: 60, lastActive: "Today 10:40" },
  { id: "aditi", name: "Aditi Rao", role: "Project lead", reportsTo: "Priya Raman", clients: 2, open: 4, overdue: 0, load: 40, lastActive: "Today 09:58" },
  { id: "kabir", name: "Kabir Sethi", role: "Project lead", reportsTo: "Priya Raman", clients: 1, open: 2, overdue: 1, load: 20, lastActive: "Yesterday" },
  { id: "nikhil", name: "Nikhil Jain", role: "Project lead", reportsTo: "Arjun Mehta", clients: 2, open: 3, overdue: 1, load: 40, lastActive: "Today 08:30" },
  { id: "tara", name: "Tara Menon", role: "Project lead", reportsTo: "Arjun Mehta", clients: 1, open: 3, overdue: 1, load: 20, lastActive: "Mon 5 Oct" },
  { id: "rahul", name: "Rahul Menon", role: "Project lead", reportsTo: "Vikram Shah", clients: 2, open: 4, overdue: 1, load: 40, lastActive: "Today 10:12" },
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
  { id: "ra1", client: "Lotus Dental", from: "No manager", to: "Arjun Mehta", why: "Won 4 Oct · room for 7", action: "Assign" },
  { id: "ra2", client: "Bluefin Analytics", from: "Pranay", to: "Priya Raman", why: "Pranay at 80% · Priya at 30%", action: "Reassign" },
  { id: "ra3", client: "Elm Textiles · INC-20A", from: "No project lead", to: "Rahul Menon", why: "Due 8 Oct", action: "Assign" },
  { id: "ra4", client: "Corvid Logistics", from: "Bharath", to: "Divya", why: "Bharath at 100%", action: "Reassign" },
];

/* ---------- Clients ---------- */

export type Health = "In progress" | "With client" | "Due soon" | "Overdue" | "Stuck" | "Not started";

export const HEALTH_TONE: Record<Health, ChipTone> = {
  "In progress": "prog",
  "With client": "warn",
  "Due soon": "warn",
  Overdue: "bad",
  Stuck: "bad",
  "Not started": "idle",
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
  /** Registrations, in the order of REGS: d done, p in progress, w waiting on documents, n after COI, x not needed. */
  reg: string;
}

type Extra = Omit<FirmClient, keyof Client>;

const people = (rows: Array<[string, string, string]>): Contact[] => rows.map(([name, role, email]) => ({ name, role, email }));

const EXTRA: Record<string, Extra> = {
  northwind: {
    area: "Incorporation",
    step: "Registered office address",
    stepNo: 7,
    owner: "client",
    daysInStep: 5,
    next: d(2026, 10, 9),
    overdue: 1,
    health: "With client",
    pipe: "spice",
    since: d(2026, 9, 10),
    contacts: CLIENT_PEOPLE.map((p) => ({ name: p.name, role: p.role, email: p.email })),
    reg: "nnnnnnnnn",
  },
  bluefin: {
    area: "Incorporation",
    step: "KYC review and DSC",
    stepNo: 10,
    owner: "sbc",
    daysInStep: 2,
    next: d(2026, 10, 9),
    overdue: 0,
    health: "In progress",
    pipe: "spice",
    since: d(2026, 9, 2),
    contacts: people([
      ["Kavya Reddy", "Director · primary contact", "kavya@bluefin.ai"],
      ["Sameer Joshi", "Director", "sameer@bluefin.ai"],
    ]),
    reg: "nnnnnnnnn",
  },
  ember: {
    area: "Incorporation",
    step: "Draft Board resolution",
    stepNo: 2,
    owner: "sbc",
    daysInStep: 1,
    next: d(2026, 10, 11),
    overdue: 0,
    health: "In progress",
    pipe: "name",
    since: d(2026, 10, 1),
    contacts: people([["Ananya Bose", "Director · primary contact", "ananya@emberstudios.in"]]),
    reg: "nnnnnnnnn",
  },
  zenith: {
    area: "Registrations",
    step: "Trademark registration",
    owner: "client",
    daysInStep: 3,
    next: d(2026, 10, 15),
    overdue: 0,
    health: "With client",
    pipe: "reg",
    since: d(2024, 3, 18),
    contacts: people([
      ["Ravi Teja", "Director · primary contact", "ravi@zenithfoods.in"],
      ["Lakshmi Rao", "Finance", "accounts@zenithfoods.in"],
    ]),
    reg: "ddddddddw",
  },
  arcadia: {
    area: "Registrations",
    step: "Shops and establishments",
    owner: "sbc",
    daysInStep: 2,
    next: d(2026, 10, 10),
    overdue: 0,
    health: "In progress",
    pipe: "reg",
    since: d(2023, 11, 6),
    contacts: people([["Vivek Nair", "Designated partner · primary contact", "vivek@arcadiarealty.in"]]),
    reg: "dddddpxxx",
  },
  corvid: {
    area: "Compliances",
    step: "PF ECR · August",
    owner: "sbc",
    daysInStep: 21,
    next: d(2026, 9, 15),
    overdue: 1,
    health: "Overdue",
    pipe: "filing",
    since: d(2023, 6, 12),
    contacts: people([
      ["Harish Kumar", "Director · primary contact", "harish@corvidlogistics.in"],
      ["Neha Gupta", "HR and payroll", "hr@corvidlogistics.in"],
    ]),
    reg: "dxpwdpdxx",
  },
  delta: {
    area: "Compliances",
    step: "FC-GPR filing",
    owner: "sbc",
    daysInStep: 3,
    next: d(2026, 10, 6),
    overdue: 0,
    health: "Due soon",
    pipe: "filing",
    since: d(2022, 8, 22),
    contacts: people([["Suresh Pillai", "Director · primary contact", "suresh@deltaedutech.in"]]),
    reg: "dddddddxw",
  },
  fjord: {
    area: "Compliances",
    step: "Professional tax · August",
    owner: "sbc",
    daysInStep: 6,
    next: d(2026, 9, 30),
    overdue: 1,
    health: "Overdue",
    pipe: "filing",
    since: d(2021, 5, 4),
    contacts: people([
      ["Thomas Mathew", "Director · primary contact", "thomas@fjordmarine.in"],
      ["Asha Varghese", "Finance", "finance@fjordmarine.in"],
    ]),
    reg: "ddddddddx",
  },
};

const MORE: FirmClient[] = [
  {
    id: "saffron",
    name: "Saffron Retail Pvt Ltd",
    short: "Saffron",
    stage: "compliance",
    tone: "teal",
    lead: "Aditi Rao",
    manager: "Priya Raman",
    cin: "U52100TG2026PTC201145",
    pan: "ABACS3321F",
    gstin: "36ABACS3321F1Z6",
    area: "Incorporation",
    step: "Share certificates (SH-1)",
    stepNo: 19,
    owner: "sbc",
    daysInStep: 2,
    next: d(2026, 10, 8),
    overdue: 0,
    health: "In progress",
    pipe: "post",
    since: d(2026, 7, 14),
    contacts: people([["Pooja Agarwal", "Director · primary contact", "pooja@saffronretail.in"]]),
    reg: "dxddwdxxx",
  },
  {
    id: "monsoon",
    name: "Monsoon Labs Pvt Ltd",
    short: "Monsoon",
    stage: "incorporating",
    tone: "accent",
    lead: "Kabir Sethi",
    manager: "Priya Raman",
    area: "Incorporation",
    step: "MCA remarks",
    stepNo: 13,
    owner: "mca",
    daysInStep: 6,
    next: d(2026, 10, 9),
    overdue: 1,
    health: "Stuck",
    pipe: "mca",
    since: d(2026, 8, 24),
    contacts: people([
      ["Karthik Iyer", "Director · primary contact", "karthik@monsoonlabs.io"],
      ["Divya Menon", "Director", "divya@monsoonlabs.io"],
    ]),
    reg: "nnnnnnnnn",
  },
  {
    id: "indigo",
    name: "Indigo Freight Pvt Ltd",
    short: "Indigo",
    stage: "compliance",
    tone: "accent",
    lead: "Aditi Rao",
    manager: "Priya Raman",
    cin: "U60200TG2026PTC199870",
    pan: "ABBCI7710D",
    gstin: "36ABBCI7710D1ZQ",
    area: "Registrations",
    step: "PF registration",
    owner: "sbc",
    daysInStep: 1,
    next: d(2026, 10, 7),
    overdue: 0,
    health: "Due soon",
    pipe: "reg",
    since: d(2026, 5, 20),
    contacts: people([["Imran Khan", "Director · primary contact", "imran@indigofreight.in"]]),
    reg: "ddppddxdx",
  },
  {
    id: "banyan",
    name: "Banyan Wellness Pvt Ltd",
    short: "Banyan",
    stage: "incorporating",
    tone: "ok",
    lead: "Nikhil Jain",
    manager: "Arjun Mehta",
    area: "Incorporation",
    step: "Name application",
    stepNo: 4,
    owner: "mca",
    daysInStep: 8,
    next: d(2026, 10, 11),
    overdue: 1,
    health: "Stuck",
    pipe: "name",
    since: d(2026, 9, 3),
    contacts: people([["Shalini Rao", "Director · primary contact", "shalini@banyanwellness.in"]]),
    reg: "nnnnnnnnn",
  },
  {
    id: "coral",
    name: "Coral Studios Pvt Ltd",
    short: "Coral",
    stage: "compliance",
    tone: "warn",
    lead: "Tara Menon",
    manager: "Arjun Mehta",
    cin: "U92100TG2026PTC198034",
    pan: "ABDCC4410P",
    gstin: "36ABDCC4410P1Z1",
    area: "Incorporation",
    step: "Auditor appointment (ADT-1)",
    stepNo: 21,
    owner: "client",
    daysInStep: 4,
    next: d(2026, 10, 13),
    overdue: 1,
    health: "With client",
    pipe: "post",
    since: d(2026, 4, 9),
    contacts: people([["Rhea Kapoor", "Director · primary contact", "rhea@coralstudios.in"]]),
    reg: "dxdddddxw",
  },
  {
    id: "quartz",
    name: "Quartz Mobility Pvt Ltd",
    short: "Quartz",
    stage: "incorporating",
    tone: "warn",
    lead: "Nikhil Jain",
    manager: "Arjun Mehta",
    area: "Incorporation",
    step: "Subscriber details",
    stepNo: 9,
    owner: "client",
    daysInStep: 1,
    next: d(2026, 10, 12),
    overdue: 0,
    health: "In progress",
    pipe: "spice",
    since: d(2026, 9, 21),
    contacts: people([["Aman Verma", "Director · primary contact", "aman@quartzmobility.in"]]),
    reg: "nnnnnnnnn",
  },
  {
    id: "pinecrest",
    name: "Pinecrest Hotels Pvt Ltd",
    short: "Pinecrest",
    stage: "compliance",
    tone: "violet",
    lead: "Rahul Menon",
    manager: "Vikram Shah",
    cin: "U55101TG2026PTC197702",
    pan: "ABECP9921H",
    gstin: "36ABECP9921H1ZT",
    area: "Registrations",
    step: "ESI registration",
    owner: "sbc",
    daysInStep: 2,
    next: d(2026, 10, 11),
    overdue: 0,
    health: "In progress",
    pipe: "reg",
    since: d(2026, 3, 30),
    contacts: people([["George Fernandes", "Director · primary contact", "george@pinecresthotels.in"]]),
    reg: "dxdpddwxx",
  },
  {
    id: "saltmarsh",
    name: "Saltmarsh Ventures Pvt Ltd",
    short: "Saltmarsh",
    stage: "incorporating",
    tone: "idle",
    lead: "Isha Kapoor",
    manager: "Vikram Shah",
    area: "Incorporation",
    step: "SPICe+ confirmation",
    stepNo: 11,
    owner: "client",
    daysInStep: 3,
    next: d(2026, 10, 10),
    overdue: 0,
    health: "With client",
    pipe: "spice",
    since: d(2026, 9, 8),
    contacts: people([["Nitin Desai", "Director · primary contact", "nitin@saltmarsh.vc"]]),
    reg: "nnnnnnnnn",
  },
  {
    id: "elm",
    name: "Elm Textiles Pvt Ltd",
    short: "Elm",
    stage: "compliance",
    tone: "warn",
    lead: "Rahul Menon",
    manager: "Vikram Shah",
    cin: "U17110TG2026PTC196611",
    pan: "ABFCE2287K",
    gstin: "36ABFCE2287K1ZE",
    area: "Incorporation",
    step: "Commencement (INC-20A)",
    stepNo: 20,
    owner: "sbc",
    daysInStep: 1,
    next: d(2026, 10, 8),
    overdue: 1,
    health: "Due soon",
    pipe: "post",
    since: d(2026, 4, 2),
    contacts: people([["Farida Sheikh", "Director · primary contact", "farida@elmtextiles.in"]]),
    reg: "ddwwdpxdx",
  },
];

/** All 17 firm clients: the 8 shared clients from people.ts, then 9 more run by the other managers. */
export const FIRM_CLIENTS: FirmClient[] = [...CLIENTS.map((c) => ({ ...c, ...EXTRA[c.id] })), ...MORE];

export const clientById = (id: string) => FIRM_CLIENTS.find((c) => c.id === id);

export const stageLabel = (c: Client) => (c.stage === "incorporating" ? "Incorporating" : "Compliance");
export const stageTone = (c: Client): ChipTone => (c.stage === "incorporating" ? "prog" : "ok");

/* ---------- Registrations ---------- */

export const REGS = ["GST", "LUT", "PF", "ESI", "PT", "Shops", "MSME", "IEC", "Trademark"];

export type WorkStatus = "In progress" | "With client" | "Due soon" | "Overdue" | "Stuck" | "Filed" | "Upcoming" | "Not started";

export const WORK_TONE: Record<WorkStatus, ChipTone> = {
  "In progress": "prog",
  "With client": "warn",
  "Due soon": "warn",
  Overdue: "bad",
  Stuck: "bad",
  Filed: "ok",
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

const healthToWork = (h: Health): WorkStatus => (h === "Not started" ? "Not started" : h);

const INC_WORK: Work[] = FIRM_CLIENTS.filter((c) => c.area === "Incorporation").map((c) => ({
  id: `inc-${c.id}`,
  clientId: c.id,
  area: "Incorporation",
  item: `Step ${c.stepNo} · ${c.step}`,
  group: PIPE_LABEL[c.pipe],
  owner: c.owner,
  due: c.next,
  days: c.daysInStep,
  status: healthToWork(c.health),
}));

// [client, registration, status, owner, due, days]
const REG_ROWS: Array<[string, string, WorkStatus, Owner, Date, number]> = [
  ["corvid", "PF", "In progress", "sbc", d(2026, 10, 9), 3],
  ["corvid", "ESI", "With client", "client", d(2026, 10, 12), 6],
  ["corvid", "Shops", "In progress", "sbc", d(2026, 10, 14), 2],
  ["delta", "Trademark", "With client", "client", d(2026, 10, 20), 9],
  ["zenith", "Trademark", "With client", "client", d(2026, 10, 15), 3],
  ["saffron", "PT", "With client", "client", d(2026, 10, 8), 4],
  ["indigo", "PF", "Due soon", "sbc", d(2026, 10, 7), 1],
  ["indigo", "ESI", "In progress", "sbc", d(2026, 10, 18), 1],
  ["coral", "Trademark", "With client", "client", d(2026, 10, 22), 12],
  ["pinecrest", "ESI", "In progress", "sbc", d(2026, 10, 11), 2],
  ["pinecrest", "MSME", "With client", "client", d(2026, 10, 16), 5],
  ["elm", "PF", "Overdue", "client", d(2026, 10, 2), 8],
  ["elm", "ESI", "With client", "client", d(2026, 10, 9), 8],
  ["elm", "MSME", "In progress", "sbc", d(2026, 10, 13), 1],
  ["arcadia", "Shops", "In progress", "sbc", d(2026, 10, 10), 2],
];

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

const REG_WORK: Work[] = REG_ROWS.map(([clientId, reg, status, owner, due, days], i) => ({
  id: `reg-${i}`,
  clientId,
  area: "Registrations",
  item: REG_NAME[reg],
  group: reg,
  owner,
  due,
  days,
  status,
}));

/* ---------- Filings (October) ---------- */

export const STATUTES = ["GST", "TDS", "Income tax", "ROC", "PF and ESI", "PT"];

// October plan for every client in compliance: [due, form, statute]
const PLAN: Array<[Date, string, string]> = [
  [d(2026, 10, 7), "TDS challan · September", "TDS"],
  [d(2026, 10, 10), "Professional tax · September", "PT"],
  [d(2026, 10, 11), "GSTR-1 · September", "GST"],
  [d(2026, 10, 15), "PF ECR · September", "PF and ESI"],
  [d(2026, 10, 15), "ESI challan · September", "PF and ESI"],
  [d(2026, 10, 20), "GSTR-3B · September", "GST"],
  [d(2026, 10, 30), "AOC-4 financial statements", "ROC"],
  [d(2026, 10, 31), "TDS return · Q2", "TDS"],
];

// Exceptions: "client|form" -> [status, owner, days]
const EXC: Record<string, [WorkStatus, Owner, number]> = {
  "zenith|GSTR-1 · September": ["Filed", "sbc", 0],
  "saffron|GSTR-1 · September": ["Filed", "sbc", 0],
  "delta|TDS challan · September": ["Filed", "sbc", 0],
  "arcadia|TDS challan · September": ["Filed", "sbc", 0],
  "indigo|TDS challan · September": ["Filed", "sbc", 0],
  "pinecrest|Professional tax · September": ["Filed", "sbc", 0],
  "corvid|TDS challan · September": ["In progress", "sbc", 2],
  "fjord|GSTR-1 · September": ["With client", "client", 4],
  "coral|GSTR-1 · September": ["With client", "client", 3],
};

// Carried from September: not filed yet.
const CARRY: Array<[string, Date, string, string, Owner]> = [
  ["corvid", d(2026, 9, 15), "PF ECR · August", "PF and ESI", "sbc"],
  ["coral", d(2026, 9, 30), "Tax audit report (3CD)", "Income tax", "client"],
  ["elm", d(2026, 9, 7), "TDS challan · August", "TDS", "sbc"],
  ["fjord", d(2026, 9, 30), "Professional tax · August", "PT", "sbc"],
];

const NO_AOC = ["arcadia", "fjord", "pinecrest"];

function planStatus(due: Date): WorkStatus {
  return daysFrom(due) <= 7 ? "Due soon" : "Upcoming";
}

export const FILINGS: Work[] = [
  ...CARRY.map(([clientId, due, item, group, owner], i) => ({
    id: `carry-${i}`,
    clientId,
    area: "Compliances" as Area,
    item,
    group,
    owner,
    due,
    days: -daysFrom(due),
    status: "Overdue" as WorkStatus,
  })),
  ...FIRM_CLIENTS.filter((c) => c.stage === "compliance").flatMap((c) =>
    PLAN.filter(([, form]) => !(form.startsWith("AOC-4") && NO_AOC.includes(c.id))).map(([due, item, group], i) => {
      const e = EXC[`${c.id}|${item}`];
      const status = e ? e[0] : planStatus(due);
      return {
        id: `fil-${c.id}-${i}`,
        clientId: c.id,
        area: "Compliances" as Area,
        item,
        group,
        owner: e ? e[1] : ("sbc" as Owner),
        due,
        days: e ? e[2] : status === "Upcoming" ? null : daysFrom(TODAY, d(2026, 10, 1)),
        status,
      };
    }),
  ),
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
    active: FIRM_CLIENTS.filter((c) => c.stage === "compliance").length,
    doneThisMonth: FILINGS.filter((w) => w.status === "Filed").length,
    overdue: FILINGS.filter((w) => w.status === "Overdue").length,
    health: "At risk",
    lead: "Vikram Shah",
    href: "/super/practice/compliances",
  },
];

export const AREA_HEALTH_TONE: Record<AreaRow["health"], ChipTone> = { "On track": "ok", Watch: "warn", "At risk": "bad" };

/* ---------- Risks ---------- */

export type Severity = "High" | "Medium" | "Low";
export type RiskStatus = "Open" | "Watching" | "Closed";

export const SEVERITY_TONE: Record<Severity, ChipTone> = { High: "bad", Medium: "warn", Low: "idle" };
export const RISK_STATUS_TONE: Record<RiskStatus, ChipTone> = { Open: "bad", Watching: "warn", Closed: "ok" };

export interface Risk {
  id: string;
  title: string;
  /** Null for a prospect that is not a client yet. */
  clientId: string | null;
  clientName: string;
  area: Area;
  owner: string;
  since: Date;
  severity: Severity;
  status: RiskStatus;
  action: string;
  what: string;
  why: string;
  next: string;
  thread: ThreadStep[];
}

export const RISKS: Risk[] = [
  {
    id: "rk1",
    title: "PF ECR · August not filed",
    clientId: "corvid",
    clientName: "Corvid Logistics",
    area: "Compliances",
    owner: "Pranay",
    since: d(2026, 9, 15),
    severity: "High",
    status: "Open",
    action: "Escalate",
    what: "The PF return for August is 21 days late.",
    why: "Corvid sent the August salary register on 3 Oct. The EPFO portal rejected the first upload.",
    next: "Bharath files the corrected ECR on 7 Oct.",
    thread: [
      { id: "t1", title: "Due date passed", state: "done", date: d(2026, 9, 15), by: "VCFO" },
      { id: "t2", title: "Salary register received", state: "done", date: d(2026, 10, 3), by: "Neha Gupta", owner: "client" },
      { id: "t3", title: "Upload rejected by EPFO", state: "done", date: d(2026, 10, 5), by: "Bharath" },
      { id: "t4", title: "File corrected ECR", state: "current", date: d(2026, 10, 6), by: "Bharath", owner: "sbc" },
      { id: "t5", title: "Close risk", state: "upcoming" },
    ],
  },
  {
    id: "rk2",
    title: "Tax audit report (3CD) not filed",
    clientId: "coral",
    clientName: "Coral Studios",
    area: "Compliances",
    owner: "Arjun Mehta",
    since: d(2026, 9, 30),
    severity: "High",
    status: "Open",
    action: "Escalate",
    what: "The tax audit report for FY 2025-26 is 6 days late.",
    why: "The auditor has not signed. Coral has not sent the fixed asset register.",
    next: "Tara calls Rhea Kapoor on 7 Oct for the register.",
    thread: [
      { id: "t1", title: "Due date passed", state: "done", date: d(2026, 9, 30), by: "VCFO" },
      { id: "t2", title: "Reminder to client", state: "done", date: d(2026, 10, 2), by: "Tara Menon", owner: "client" },
      { id: "t3", title: "Fixed asset register from client", state: "current", date: d(2026, 10, 6), owner: "client" },
      { id: "t4", title: "Auditor signs and files", state: "upcoming" },
    ],
  },
  {
    id: "rk3",
    title: "TDS challan · August not paid",
    clientId: "elm",
    clientName: "Elm Textiles",
    area: "Compliances",
    owner: "Vikram Shah",
    since: d(2026, 9, 7),
    severity: "High",
    status: "Open",
    action: "Escalate",
    what: "The TDS for August is 29 days late. Interest grows each month.",
    why: "The client's bank mandate for the TDS account expired.",
    next: "Rahul pays by net banking once the mandate is renewed.",
    thread: [
      { id: "t1", title: "Due date passed", state: "done", date: d(2026, 9, 7), by: "VCFO" },
      { id: "t2", title: "Mandate expiry found", state: "done", date: d(2026, 9, 12), by: "Rahul Menon" },
      { id: "t3", title: "Escalated to Vikram Shah", state: "done", date: d(2026, 9, 28), by: "Ritu Agarwal" },
      { id: "t4", title: "Client renews mandate", state: "current", date: d(2026, 10, 6), owner: "client" },
      { id: "t5", title: "Pay challan", state: "upcoming" },
    ],
  },
  {
    id: "rk4",
    title: "MCA remarks on SPICe+ unanswered",
    clientId: "monsoon",
    clientName: "Monsoon Labs",
    area: "Incorporation",
    owner: "Priya Raman",
    since: d(2026, 9, 30),
    severity: "High",
    status: "Open",
    action: "Escalate",
    what: "MCA sent remarks on the SPICe+ form 6 days ago.",
    why: "The remarks ask for a new NOC from the office owner. The owner is abroad.",
    next: "Kabir files the reply with the NOC by 9 Oct. MCA rejects the form after 15 days.",
    thread: [
      { id: "t1", title: "SPICe+ filed", state: "done", date: d(2026, 9, 22), by: "Kabir Sethi", owner: "sbc" },
      { id: "t2", title: "MCA remarks", state: "done", date: d(2026, 9, 30), owner: "mca" },
      { id: "t3", title: "NOC from office owner", state: "current", date: d(2026, 10, 6), owner: "client" },
      { id: "t4", title: "Reply to MCA", state: "upcoming" },
    ],
  },
  {
    id: "rk5",
    title: "Name rejected under RUN · resubmission pending",
    clientId: "banyan",
    clientName: "Banyan Wellness",
    area: "Incorporation",
    owner: "Arjun Mehta",
    since: d(2026, 9, 28),
    severity: "Medium",
    status: "Watching",
    action: "Remind",
    what: "MCA rejected both names in the RUN application.",
    why: "Both names match existing trademarks.",
    next: "Nikhil sends two new names to the client on 7 Oct.",
    thread: [
      { id: "t1", title: "RUN filed", state: "done", date: d(2026, 9, 21), by: "Nikhil Jain", owner: "sbc" },
      { id: "t2", title: "Names rejected", state: "done", date: d(2026, 9, 28), owner: "mca" },
      { id: "t3", title: "New names from client", state: "current", date: d(2026, 10, 6), owner: "client" },
      { id: "t4", title: "Resubmit RUN", state: "upcoming" },
    ],
  },
  {
    id: "rk6",
    title: "Professional tax · August not paid",
    clientId: "fjord",
    clientName: "Fjord Marine Exports",
    area: "Compliances",
    owner: "Pranay",
    since: d(2026, 9, 30),
    severity: "Medium",
    status: "Watching",
    action: "Remind",
    what: "Professional tax for August is 6 days late.",
    why: "The PT portal was down from 28 to 30 Sep.",
    next: "Divya pays it with the September PT on 10 Oct.",
    thread: [
      { id: "t1", title: "Due date passed", state: "done", date: d(2026, 9, 30), by: "VCFO" },
      { id: "t2", title: "Pay with September PT", state: "current", date: d(2026, 10, 6), owner: "sbc" },
    ],
  },
  {
    id: "rk7",
    title: "Director DSC expires 28 Oct",
    clientId: "bluefin",
    clientName: "Bluefin Analytics",
    area: "Incorporation",
    owner: "Pranay",
    since: d(2026, 9, 24),
    severity: "Medium",
    status: "Watching",
    action: "Remind",
    what: "The DSC of Sameer Joshi expires before the SPICe+ filing date.",
    why: "The DSC was issued in 2024 for two years.",
    next: "Bharath renews the DSC with the KYC review this week.",
    thread: [
      { id: "t1", title: "Expiry found in KYC review", state: "done", date: d(2026, 9, 24), by: "Bharath" },
      { id: "t2", title: "Renew DSC", state: "current", date: d(2026, 10, 6), owner: "sbc" },
    ],
  },
  {
    id: "rk8",
    title: "New client has no manager",
    clientId: null,
    clientName: "Lotus Dental",
    area: "Incorporation",
    owner: "Krishna",
    since: d(2026, 10, 4),
    severity: "Medium",
    status: "Watching",
    action: "Assign",
    what: "Lotus Dental signed for incorporation on 4 Oct.",
    why: "No manager is assigned yet.",
    next: "Krishna assigns a manager. Arjun Mehta has the most room.",
    thread: [
      { id: "t1", title: "Engagement signed", state: "done", date: d(2026, 10, 4), by: "Krishna" },
      { id: "t2", title: "Assign a manager", state: "current", date: d(2026, 10, 6), owner: "sbc" },
    ],
  },
  {
    id: "rk9",
    title: "INC-20A has no project lead",
    clientId: "elm",
    clientName: "Elm Textiles",
    area: "Incorporation",
    owner: "Vikram Shah",
    since: d(2026, 10, 6),
    severity: "Low",
    status: "Watching",
    action: "Assign",
    what: "The INC-20A filing is due 8 Oct.",
    why: "Rahul Menon took over Elm on 5 Oct. The task still has no one.",
    next: "Vikram assigns the task to Rahul.",
    thread: [{ id: "t1", title: "Assign the task", state: "current", date: d(2026, 10, 6), owner: "sbc" }],
  },
  {
    id: "rk10",
    title: "DIR-3 KYC for one partner due 15 Oct",
    clientId: "arcadia",
    clientName: "Arcadia Realty",
    area: "Compliances",
    owner: "Pranay",
    since: d(2026, 10, 1),
    severity: "Low",
    status: "Watching",
    action: "Remind",
    what: "One designated partner has not filed DIR-3 KYC.",
    why: "The partner changed the mobile number on Aadhaar.",
    next: "Bharath files after the OTP check on 8 Oct.",
    thread: [
      { id: "t1", title: "KYC window extended", state: "done", date: d(2026, 10, 1), by: "MCA", owner: "mca" },
      { id: "t2", title: "File DIR-3 KYC", state: "current", date: d(2026, 10, 6), owner: "sbc" },
    ],
  },
  {
    id: "rk11",
    title: "MCA query on KYC answered",
    clientId: "bluefin",
    clientName: "Bluefin Analytics",
    area: "Incorporation",
    owner: "Pranay",
    since: d(2026, 9, 18),
    severity: "Medium",
    status: "Closed",
    action: "Reopen",
    what: "MCA asked for a clearer address proof.",
    why: "The utility bill was older than two months.",
    next: "None.",
    thread: [
      { id: "t1", title: "MCA query", state: "done", date: d(2026, 9, 18), owner: "mca" },
      { id: "t2", title: "Reply filed", state: "done", date: d(2026, 9, 22), by: "Bharath", owner: "sbc" },
      { id: "t3", title: "Closed", state: "done", date: d(2026, 9, 25), by: "Krishna" },
    ],
  },
  {
    id: "rk12",
    title: "GST notice ASMT-10 replied",
    clientId: "zenith",
    clientName: "Zenith Foods",
    area: "Compliances",
    owner: "Pranay",
    since: d(2026, 9, 2),
    severity: "High",
    status: "Closed",
    action: "Reopen",
    what: "The GST officer asked about a mismatch in GSTR-3B and GSTR-1.",
    why: "Two invoices were in the wrong month.",
    next: "None.",
    thread: [
      { id: "t1", title: "Notice received", state: "done", date: d(2026, 9, 2), owner: "mca" },
      { id: "t2", title: "Reply filed", state: "done", date: d(2026, 9, 12), by: "Pranay", owner: "sbc" },
      { id: "t3", title: "Officer accepted", state: "done", date: d(2026, 9, 29), by: "VCFO" },
    ],
  },
];

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
  { id: "p1", name: "Northstar Clinics", area: "Incorporation", service: "Incorporation", stage: "Enquiry", owner: "Krishna", next: "Call on 8 Oct", since: d(2026, 10, 4), source: "Referral" },
  {
    id: "p2",
    name: "Blue Lotus Exports",
    area: "Registrations",
    service: "IEC and GST",
    stage: "Enquiry",
    owner: "Ritu Agarwal",
    next: "Send document list",
    since: d(2026, 10, 1),
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
    since: d(2026, 10, 5),
    source: "Existing client",
  },
  { id: "p4", name: "Redwood Labs", area: "Incorporation", service: "Incorporation", stage: "Enquiry", owner: "Ritu Agarwal", next: "Follow up", since: d(2026, 9, 28), source: "Website" },
  {
    id: "p5",
    name: "Meridian Health",
    area: "Incorporation",
    service: "Incorporation and registrations",
    stage: "Proposal",
    owner: "Krishna",
    next: "Proposal review on 7 Oct",
    since: d(2026, 9, 30),
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
    since: d(2026, 10, 3),
    source: "Partner CA",
  },
  { id: "p7", name: "Sunbeam Foods", area: "Compliances", service: "FEMA advisory", stage: "Proposal", owner: "Krishna", next: "Follow up", since: d(2026, 9, 25), source: "Referral" },
  { id: "p8", name: "Lotus Dental", area: "Incorporation", service: "Incorporation", stage: "Won", owner: "Krishna", next: "Assign a manager", since: d(2026, 10, 4), source: "Referral" },
  {
    id: "p9",
    name: "Aurora Paints",
    area: "Compliances",
    service: "Monthly compliance",
    stage: "Won",
    owner: "Ritu Agarwal",
    next: "Onboarding on 1 Nov",
    since: d(2026, 9, 27),
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
  { id: "r2", name: "Client health", area: "Firm", period: "Oct 2026", lastRun: d(2026, 10, 6), schedule: "Daily" },
  { id: "r3", name: "Team load", area: "Firm", period: "Oct 2026", lastRun: d(2026, 10, 5), schedule: "Every Monday" },
  { id: "r4", name: "Incorporation pipeline", area: "Incorporation", period: "Oct 2026", lastRun: d(2026, 10, 5), schedule: "Every Monday" },
  { id: "r5", name: "Days to COI by manager", area: "Incorporation", period: "Q2 FY 2026-27", lastRun: d(2026, 10, 1), schedule: "Quarterly" },
  { id: "r6", name: "Registrations pending", area: "Registrations", period: "Oct 2026", lastRun: d(2026, 10, 6), schedule: "Daily" },
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

export const SERVICE_TONE: Record<Service["status"], ChipTone> = { Active: "ok", "In progress": "prog", "With client": "warn", Done: "ok" };

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
  if (c.id !== "arcadia") out.push({ id: "roc", name: "Annual ROC filings", area: "Compliances", started: c.since, status: "Active", owner: c.manager });
  if (c.id === "delta" || c.id === "fjord") out.push({ id: "fema", name: "FEMA advisory", area: "Compliances", started: c.since, status: "Active", owner: c.manager });
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
    { id: "a1", date: TODAY, time: "09:10", text: `Reminder sent: ${c.step}`, who: "VCFO" },
    { id: "a2", date: d(2026, 10, 5), time: "17:20", text: `Updated ${c.step}`, who: c.lead },
    { id: "a3", date: d(2026, 10, 3), time: "11:05", text: "Uploaded documents", who: contact },
    { id: "a4", date: d(2026, 10, 1), time: "14:30", text: "Reviewed open items", who: c.manager },
    { id: "a5", date: d(2026, 9, 28), time: "10:00", text: "Signed in", who: contact },
    { id: "a6", date: c.since, time: "12:00", text: "Client added to VCFO Suite", who: MANAGERS.find((m) => m.name === c.manager)?.admin ?? "Krishna" },
  ];
}
