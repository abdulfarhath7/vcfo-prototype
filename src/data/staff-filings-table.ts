import { d } from "@/lib/dates";
import type { Area } from "@/data/compliance";
import { complianceClients } from "@/data/staff-compliance";
import { clientById, type StaffPortal } from "@/data/staff-clients";

// Staff Filings page, as in the old prototype (lead, manager and admin are the same file).
// Ported from the static table in reference/old-screens/s/lead/Filings.dc.html.
// The old donut and area bars count 18 filings (Filed 6, GST 5 with 2 filed). The old table lists 17.
// The 18th row is the filed GSTR-1 for August, so the counts and the table agree.

export type OldFilingStatus = "Filed" | "Due soon" | "Overdue" | "Upcoming";

export interface OldFiling {
  id: string;
  due: Date;
  area: Area;
  /** Short area code on the grid: IT, PAY, GST, MCA, FEMA. */
  code: string;
  form: string;
  period: string;
  frequency: string;
  /** "14 Sep", "1 day late", "Not filed yet". */
  filedOn: string;
  status: OldFilingStatus;
  /** Filed with proof on file, filed with proof pending, or not filed. */
  proof: "file" | "pending" | "none";
}

const r = (id: string, due: Date, area: Area, code: string, form: string, period: string, frequency: string, filedOn: string, status: OldFilingStatus, proof: OldFiling["proof"] = "none"): OldFiling => ({ id, due, area, code, form, period, frequency, filedOn, status, proof });

export const OLD_FILINGS: OldFiling[] = [
  r("s0", d(2026, 9, 11), "GST", "GST", "GSTR-1", "Aug 2026", "Monthly", "10 Sep", "Filed", "file"),
  r("s4", d(2026, 9, 15), "Income tax", "IT", "Advance tax Q2", "Jul-Sep 2026", "Quarterly", "14 Sep", "Filed", "file"),
  r("s5", d(2026, 9, 15), "Payroll", "PAY", "PF & ESI payment", "Aug 2026", "Monthly", "12 Sep", "Filed", "file"),
  r("s1", d(2026, 9, 20), "GST", "GST", "GSTR-3B", "Aug 2026", "Monthly", "18 Sep", "Filed", "file"),
  r("s3", d(2026, 9, 30), "MCA", "MCA", "AGM held (Sec 96)", "FY 2025-26", "Annual", "26 Sep", "Filed", "file"),
  r("o0", d(2026, 10, 7), "Income tax", "IT", "TDS/TCS challan", "Sep 2026", "Monthly", "6 Oct", "Filed", "pending"),
  r("o1", d(2026, 10, 7), "FEMA", "FEMA", "ECB-2 return", "Jul-Sep 2026", "Quarterly", "1 day late", "Overdue"),
  r("o2", d(2026, 10, 10), "Payroll", "PAY", "Professional tax payment", "Sep 2026", "Monthly", "Not filed yet", "Due soon"),
  r("o3", d(2026, 10, 11), "GST", "GST", "GSTR-1", "Sep 2026", "Monthly", "Not filed yet", "Due soon"),
  r("o4", d(2026, 10, 15), "Payroll", "PAY", "PF & ESI payment", "Sep 2026", "Monthly", "Not filed yet", "Due soon"),
  r("o5", d(2026, 10, 15), "Income tax", "IT", "TCS return Q2", "Jul-Sep 2026", "Quarterly", "Not filed yet", "Due soon"),
  r("o6", d(2026, 10, 20), "GST", "GST", "GSTR-3B", "Sep 2026", "Monthly", "Not filed yet", "Upcoming"),
  r("o7", d(2026, 10, 25), "GST", "GST", "ITC-04", "Apr-Sep 2026", "Half-yearly", "Not filed yet", "Upcoming"),
  r("o8", d(2026, 10, 29), "MCA", "MCA", "AOC-4 (financial statements)", "FY 2025-26", "Annual", "Not filed yet", "Upcoming"),
  r("o9", d(2026, 10, 30), "MCA", "MCA", "MSME-1", "Apr-Sep 2026", "Half-yearly", "Not filed yet", "Upcoming"),
  r("o10", d(2026, 10, 30), "FEMA", "FEMA", "Softex filing", "Sep 2026", "Monthly", "Not filed yet", "Upcoming"),
  r("o11", d(2026, 10, 31), "Income tax", "IT", "TDS return Q2", "Jul-Sep 2026", "Quarterly", "Not filed yet", "Upcoming"),
  r("o12", d(2026, 10, 31), "Income tax", "IT", "Income tax return (ITR-6)", "FY 2025-26", "Annual", "Not filed yet", "Upcoming"),
];

/** Area order on the bars and the area tabs. */
export const OLD_FILING_AREAS: Area[] = ["MCA", "GST", "Income tax", "Payroll", "FEMA"];
/** Spectrum "By regulator" bars: all six regulators, Labour included (C-07). */
export const FILING_REGULATORS: Area[] = ["MCA", "GST", "Income tax", "Payroll", "FEMA", "Labour"];

/* ---------- Clients under each filing (Spectrum "By filing", C-05) ---------- */

/** The day these rows describe: ECB-2 was due 7 Oct and is "1 day late". */
export const FILINGS_TODAY = d(2026, 10, 8);

/** Client state on one filing. The filing status above is the roll-up: a filed filing has every client filed. */
export type ClientFilingState = "done" | "run" | "wait" | "soon" | "bad" | "none";

export interface ClientFiling {
  /** "<client>-<filing id>". */
  key: string;
  filing: OldFiling;
  client: string;
  state: ClientFilingState;
  /** Short note: "Filed 10 Sep", "Draft ready", "Late 1 day". */
  note: string;
  /** Obligation id of the record page, when the filing has one. */
  ob?: string;
  /** Date filed, on filed rows. */
  filed?: Date;
}

/** Record page of each filing (staff obligation id). AGM, TCS return and ITR-6 have no record page. */
const OB_OF: Record<string, string> = { s0: "gstr1", s4: "adv-tax", s5: "pf-esi", s1: "gstr3b", o0: "tds-pay", o1: "ecb2", o2: "ptm", o3: "gstr1", o4: "pf-esi", o6: "gstr3b", o7: "itc04", o8: "aoc4", o9: "msme1", o10: "softex", o11: "tds-24q" };

/** Word before the date on a filed row. */
const FILED_VERB: Record<string, string> = { s4: "Paid", s5: "Paid", s3: "Held", o0: "Paid" };

// The seven compliance clients (staff-compliance.ts). Who files what follows their obligation sets:
// GST and TDS for all, PF and ESI and PT for the payroll clients, ECB-2 for Tidewater, Softex for Halcyon (LUT exporter).
const ALL7 = ["kestrel", "halcyon", "tidewater", "brightwave", "saffron", "indigo", "coral"];
const PAYROLL = ["kestrel", "tidewater", "brightwave", "saffron", "coral"];
const COMPANIES = ["kestrel", "tidewater", "brightwave", "saffron", "indigo", "coral"];

type Raw = [client: string, state: ClientFilingState, note?: string];
const filedBy = (clients: string[]): Raw[] => clients.map((c) => [c, "done"]);

const RAW: Record<string, Raw[]> = {
  s0: filedBy(ALL7),
  s4: filedBy(["kestrel", "halcyon"]),
  s5: filedBy(PAYROLL),
  s1: filedBy(ALL7),
  s3: filedBy(COMPANIES),
  o0: filedBy(ALL7),
  o1: [["tidewater", "bad", "Late 1 day"]],
  o2: [["kestrel", "run", "Challan ready"], ["tidewater", "soon"], ["brightwave", "wait", "Salary sheet asked"], ["saffron", "soon"], ["coral", "run", "Challan ready"]],
  o3: [["kestrel", "run", "Draft ready"], ["halcyon", "run", "Draft ready"], ["tidewater", "wait", "Sales register asked"], ["brightwave", "soon"], ["saffron", "run", "Invoices matched"], ["indigo", "wait", "E-invoices asked"], ["coral", "soon"]],
  o4: [["kestrel", "soon"], ["tidewater", "run", "ECR prepared"], ["brightwave", "wait", "Attendance asked"], ["saffron", "soon"], ["coral", "run", "ECR prepared"]],
  o5: [["saffron", "run", "Draft ready"], ["tidewater", "soon"]],
  o6: [["kestrel", "none", "After GSTR-1"], ["halcyon", "wait", "Purchase bills asked"], ["tidewater", "none", "After GSTR-1"], ["brightwave", "none", "After GSTR-1"], ["saffron", "none", "After GSTR-1"], ["indigo", "none", "After GSTR-1"], ["coral", "none", "After GSTR-1"]],
  o7: [["brightwave", "wait", "Job-work challans asked"]],
  o8: [["kestrel", "run", "Accounts audited"], ["tidewater", "none"], ["brightwave", "wait", "Audit report asked"], ["saffron", "none"], ["indigo", "run", "Accounts audited"], ["coral", "none"]],
  o9: [["brightwave", "none"], ["tidewater", "none"]],
  o10: [["halcyon", "run", "Invoices listed"]],
  o11: [["kestrel", "none"], ["halcyon", "none"], ["tidewater", "none"], ["brightwave", "none"], ["indigo", "none"]],
  o12: [["kestrel", "run", "Tax audit done"], ["halcyon", "none"], ["tidewater", "none"], ["brightwave", "none"], ["saffron", "none"], ["indigo", "none"], ["coral", "run", "Computation ready"]],
};

const DAY = 86_400_000;
/** Clients file on or a day or two before the last date in "Filed on" (same month and year as the due date). */
function filedDate(f: OldFiling, i: number) {
  const day = Number(f.filedOn.split(" ")[0]);
  return new Date(f.due.getFullYear(), f.due.getMonth(), Math.max(1, day - (i % 3)));
}
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CLIENT_FILINGS: ClientFiling[] = OLD_FILINGS.flatMap((f) =>
  (RAW[f.id] ?? []).map(([client, state, note], i): ClientFiling => {
    const days = Math.round((f.due.getTime() - FILINGS_TODAY.getTime()) / DAY);
    const filed = state === "done" ? filedDate(f, i) : undefined;
    const auto = filed ? `${FILED_VERB[f.id] ?? "Filed"} ${filed.getDate()} ${MON[filed.getMonth()]}` : state === "soon" ? `Due in ${days} day${days === 1 ? "" : "s"}` : "";
    return { key: `${client}-${f.id}`, filing: f, client, state, note: note ?? auto, ob: OB_OF[f.id], filed };
  }),
);

/** Client rows a portal sees: the project lead sees only his own compliance clients. */
export function clientFilingsFor(portal: StaffPortal): ClientFiling[] {
  const ids = new Set(complianceClients(portal).map((c) => c.id));
  return CLIENT_FILINGS.filter((r) => ids.has(r.client));
}

export const leadOfFiling = (r: ClientFiling) => clientById(r.client)?.lead ?? "";
