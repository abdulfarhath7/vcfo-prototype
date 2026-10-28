import { fmt } from "@/lib/dates";
import { obligation, type Filing, type Obligation } from "./compliance";
import { registration, type Registration } from "./registrations";
import { portalOf } from "./compliance-year";

// Ported from reference/old-patch/shared/regcat.js (REG.details, REG.sbc, OB.sbc) and
// reference/old-screens/s/home/Item.dc.html (client fields, SBC fields, VCFO Assist steps).

export type Pair = [k: string, v: string];

/** Fields the client fills, and fields SBC fills, for each registration. */
export const REG_FIELDS: Record<string, { client: Pair[]; sbc: Pair[] }> = {
  gst: {
    client: [["Principal place of business", "No. 42, 4th floor, 100 Ft Road, Indiranagar, Bengaluru 560038"], ["Business activities", "Software development and IT services"], ["Top HSN or SAC codes", "998314, 998313"], ["Signatory mobile for OTP", "+91 98450 12345"], ["Signatory email", "rohan@northwind.example"]],
    sbc: [["TRN", "272600000123TRN"], ["ARN", "AA291025012345X"], ["Jurisdiction", "State · Bengaluru Ward 12"], ["GSTIN", "29AAKCN4821M1Z5"]],
  },
  lut: { client: [["Financial year", "2026-27"], ["Witness 1", "Mei Tanaka, Bengaluru"], ["Witness 2", "Arvind Rao, Bengaluru"]], sbc: [["ARN", "AD291125004471L"], ["Acknowledged", "3 Nov 2026"]] },
  pt: { client: [["Employees by salary band", "12 above ₹25,000"], ["First salary month", "November 2026"]], sbc: [["PTRC number", "Applied 4 Nov"], ["PTEC number", "Applied 4 Nov"]] },
  icegate: { client: [["Port of business", "Bengaluru ICD"]], sbc: [["ICEGATE ID", "-"]] },
  epf: { client: [["Date the first employee joined", "3 Nov 2026"], ["Employees", "12"], ["Wage structure", "Basic 50% of CTC"]], sbc: [["Establishment code", "KNBNG2954118000"], ["Coverage date", "2 Nov 2026"]] },
  esi: { client: [["Employees", "12"], ["Employees up to ₹21,000 a month", "3"]], sbc: [["Employer code", "53001234560001001"]] },
  se: { client: [["Manager", "Rohan Kumar"], ["Category", "Commercial establishment · IT"], ["Employees", "9 men, 3 women"], ["Working hours", "9:30 am to 6:30 pm, Mon to Fri"]], sbc: [["Registration number", "Applied 5 Nov"]] },
  clra: { client: [["Contract workers", "0"]], sbc: [["Registration number", "-"]] },
  posh: { client: [["Presiding officer", "Mei Tanaka"], ["Employee members", "2"]], sbc: [["Committee constituted", "-"]] },
  lwf: { client: [["Employees", "12"]], sbc: [["Registration number", "-"]] },
  msme: { client: [["NIC codes", "62011, 62013"], ["Employees", "12"]], sbc: [["Udyam number", "UDYAM-KR-03-0123456"]] },
  iec: { client: [["Preferred sector", "IT services"]], sbc: [["IEC number", "Applied 6 Nov"]] },
  lei: { client: [["Bank asking", "HDFC Bank, for the parent remittance"]], sbc: [["LEI", "-"]] },
  tl: { client: [["Trade", "Software office"]], sbc: [["Licence number", "-"]] },
  nonstpi: { client: [["Export services", "Software development for the parent"]], sbc: [["Registration number", "-"]] },
  tm: { client: [["Mark", "NORTHWIND"], ["Classes", "9 and 42"], ["First use", "Proposed to be used"]], sbc: [["Application number", "-"]] },
  patent: { client: [["Invention", "-"]], sbc: [["Application number", "-"]] },
  fcgpr: { client: [["Investor", "Northwind KK, Japan"], ["Shares allotted", "60,000"], ["Allotment date", "2 Nov 2026"]], sbc: [["Entity master number", "EM-2026-118822"], ["SRN", "-"]] },
  fla: { client: [["As on", "31 Mar 2027"]], sbc: [["Acknowledgement", "-"]] },
  fctrs: { client: [["Transfer", "-"]], sbc: [["SRN", "-"]] },
  odi: { client: [["Overseas entity", "-"]], sbc: [["UIN", "-"]] },
};

/** SBC-filled fields for each obligation (regcat.js OB.sbc, keyed to src/data/compliance.ts ids). */
const OB_SBC: Record<string, Pair[]> = {
  "tds-pay": [["Challan 281 (CIN)", "-"]],
  gstr1: [["Period", "Sep 2026"], ["ARN", "-"], ["B2B invoices", "14"]],
  gstr3b: [["Challan (PMT-06)", "-"]],
  "pf-esi": [["TRRN", "-"], ["ESI challan", "-"]],
  dir3kyc: [["SRN", "-"]],
  "tds-26q": [["Token number", "-"], ["Form 16A", "-"]],
  "tds-24q": [["Token number", "Q2 · 482910773"], ["Form 16", "Issued 4 Oct"]],
  adt1: [["SRN", "-"]],
  itc04: [["ARN", "-"]],
  aoc4: [["SRN", "-"]],
  msme1: [["SRN", "-"]],
  softex: [["Softex number", "-"]],
  ecb2: [["LRN", "ECB-26-004812"]],
  mgt14: [["SRN", "AB4410927"]],
  "adv-tax": [["Challan", "-"]],
  mgt7: [["SRN", "-"]],
  seren: [["Certificate", "-"]],
  posh: [["Report", "-"]],
  lutren: [["ARN", "-"]],
  dpt3: [["SRN", "-"]],
  fla: [["Acknowledgement", "-"]],
  gstr9: [["Year", "FY 2026-27"]],
};

/** Client fields of a registration. SBC fields show "-" until the work starts (Item.dc.html). */
export function regFields(r: Registration): { client: Pair[]; sbc: Pair[] } {
  const f = REG_FIELDS[r.id] ?? { client: [], sbc: [] };
  const sbc = f.sbc.map(([k, v]): Pair => [k, r.status === "Not started" || r.status === "Not needed" ? "-" : v]);
  if (r.idLabel && !sbc.some(([k]) => k === r.idLabel)) sbc.push([r.idLabel, r.idValue ?? "-"]);
  return { client: f.client, sbc };
}

export function obFields(o: Obligation): { client: Pair[]; sbc: Pair[] } {
  const client: Pair[] = [
    ["Period", o.period],
    ["Prepared from", o.status === "Upcoming" ? "-" : "Tally export uploaded 3 Oct"],
  ];
  const sbc = [...(OB_SBC[o.id] ?? [])];
  if (o.idLabel && !sbc.some(([k]) => k === o.idLabel)) sbc.push([o.idLabel, o.idValue ?? "-"]);
  return { client, sbc };
}

/* ---------- VCFO Assist: the extension files on the government portal and keeps a screenshot of each page ---------- */

export type AssistState = "done" | "run" | "wait";

export interface AssistStep {
  title: string;
  state: AssistState;
  /** "Done · 10:02 am" */
  note: string;
  /** Screenshot label: "GST · p1" */
  shot?: string;
}

const PERIOD_MONTH: Record<string, string> = { Jan: "January", Feb: "February", Mar: "March", Apr: "April", May: "May", Jun: "June", Jul: "July", Aug: "August", Sep: "September", Oct: "October", Nov: "November", Dec: "December" };

/** Five steps. `done` steps are complete; the next one runs when `running` is set. */
export function assistSteps(portal: string, form: string, period: string, done: number, running = false): AssistStep[] {
  const month = PERIOD_MONTH[period.slice(0, 3)] ?? period;
  const titles = [`Sign in to the ${portal}`, `Open ${form} for ${month}`, "Fill the details from VCFO", "Attach the accepted documents", "Submit and read back the reference"];
  const short = portal.split(" ")[0];
  return titles.map((title, i) => ({
    title,
    state: i < done ? "done" : i === done && running ? "run" : "wait",
    note: i < done ? `Done · ${10 + i}:0${2 + i} am` : i === done && running ? "Working on it" : "Waiting",
    shot: i < done ? `${short} · p${i + 1}` : undefined,
  }));
}

/** VCFO Assist state for a filing row. */
export function filingAssist(f: Filing): { steps: AssistStep[]; label: string; tone: "ok" | "prog" | "idle" } {
  const portal = portalOf(f.area, f.form).label;
  if (f.status === "Filed") return { steps: assistSteps(portal, f.form, f.period, 5), label: "Filed by Assist", tone: "ok" };
  if (f.status === "In progress") return { steps: assistSteps(portal, f.form, f.period, 2, true), label: "Assist running", tone: "prog" };
  return { steps: assistSteps(portal, f.form, f.period, 0), label: "Not started", tone: "idle" };
}

/* ---------- Filing record: the four-step track and the proof files ---------- */

export interface TrackStep {
  label: string;
  date?: Date;
  state: "done" | "current" | "upcoming";
  owner?: "client" | "sbc";
}

const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

/** Data, Prepared, Northwind approves, Filed (index.html filDetail and detailModal). */
export function filingTrack(f: Filing): TrackStep[] {
  const due = f.due;
  if (f.status === "Filed" && f.filed)
    return [
      { label: "Data received", date: addDays(due, -17), state: "done" },
      { label: "Prepared", date: addDays(due, -8), state: "done" },
      { label: "Northwind approved", date: addDays(due, -4), state: "done" },
      { label: "Filed", date: f.filed, state: "done" },
    ];
  if (f.status === "In progress")
    return [
      { label: "Data received", date: addDays(due, -18), state: "done" },
      { label: "SBC preparing", date: addDays(due, -16), state: "current", owner: "sbc" },
      { label: "Northwind approves", state: "upcoming", owner: "client" },
      { label: "Filed", state: "upcoming" },
    ];
  if (f.status === "Overdue" || f.status === "Due soon")
    return [
      { label: "Data from Northwind", state: "current", owner: "client" },
      { label: "Prepared", state: "upcoming" },
      { label: "Northwind approves", state: "upcoming", owner: "client" },
      { label: "Filed", state: "upcoming" },
    ];
  return [
    { label: "Data from Northwind", state: "upcoming", owner: "client" },
    { label: "Prepared", state: "upcoming" },
    { label: "Northwind approves", state: "upcoming", owner: "client" },
    { label: "Filed", state: "upcoming" },
  ];
}

export interface ProofFile {
  id: string;
  name: string;
  size: string;
  date: Date;
}

/** Acknowledgement and challan for a filed row. TDS payment for September shows "Proof pending" (index.html PROOF_PENDING). */
export function filingProofs(f: Filing): ProofFile[] {
  if (f.status !== "Filed" || !f.filed) return [];
  const ack: ProofFile = { id: `${f.id}-ack`, name: `${f.form} acknowledgement.pdf`, size: "142 KB", date: f.filed };
  if (f.docs < 2) return [ack];
  const challan = f.area === "GST" ? "Challan PMT-06 (CIN).pdf" : "Challan 281 (CIN).pdf";
  return [ack, { id: `${f.id}-ch`, name: challan, size: "88 KB", date: f.filed }];
}

/** Rows of the acknowledgement page in the preview (index.html docPreview). */
export function ackRows(f: Filing): Pair[] {
  const o = f.obligationId ? obligation(f.obligationId) : undefined;
  const id: Pair =
    f.area === "GST" ? ["GSTIN", "29AAKCN4821M1Z5"] : f.area === "Income tax" ? ["TAN", "BLRN04821E"] : f.area === "MCA" ? ["CIN", "U72900KA2026PTC184211"] : f.area === "Payroll" ? ["Establishment code", "KNBNG2954118000"] : ["PAN", "AAKCN4821M"];
  return [
    id,
    ["Legal name", "Northwind Technologies India Pvt Ltd"],
    ["Form", f.form],
    ["Return period", f.period],
    ["Financial year", f.fy],
    ["Reference", f.arn ?? "-"],
    ["Date of filing", f.filed ? `${fmt(f.filed)} ${f.filed.getFullYear()}` : "-"],
    ["Authority", o ? o.law : f.area],
    ["Status", "Filed"],
  ];
}

/** "Registration · X" or "Obligation · X" for the About card. */
export function aboutObligation(o: Obligation) {
  const reg = o.startedBy ? registration(o.startedBy) : undefined;
  return {
    about: `${o.name} is filed ${o.frequency === "Event" ? "after each event" : o.frequency.toLowerCase()}: ${o.dueRule}.`,
    why: reg ? `Started when the ${reg.name} was granted.` : "Applies to every company.",
  };
}
