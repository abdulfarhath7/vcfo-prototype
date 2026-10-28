import { d, daysFrom } from "@/lib/dates";
import type { Area, CalendarEvent, FilingStatus, Frequency } from "./compliance";

// Ported from reference/old-screens/s/comp/index.html (OCT, status, portalOf) and cal-views.js (YEAR).
// The old calendar is frozen on Thu 8 Oct 2026. October holds the 13 old filings.
// The other months of FY 2026-27 follow the statutory pattern: past dates are filed 2 days early.

/** The calendar's own "today" (old index.html: TODAY = '2026-10-08'). */
export const CAL_TODAY = d(2026, 10, 8);

/** A calendar entry with the facts the day pop-over and the detail dialog need. */
export interface YearEvent extends CalendarEvent {
  /** "GSTR-1" */
  name: string;
  /** "Sep 2026" */
  period: string;
  frequency: Frequency;
  authority: string;
  filed?: Date;
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const AUTHORITY: Record<Area, string> = {
  GST: "GSTN",
  "Income tax": "Income Tax Dept",
  MCA: "MCA",
  Payroll: "EPFO · ESIC",
  FEMA: "RBI",
  Labour: "Labour Dept",
};

/** Old AREA_SHORT: the mono tag on each calendar row. */
export const AREA_SHORT: Record<Area, string> = { MCA: "MCA", GST: "GST", "Income tax": "IT", Payroll: "PAY", FEMA: "FEMA", Labour: "LAB" };

/** Government portal for a filing (old prototype rule 15: a portal link on each filing). */
export function portalOf(area: Area, name: string): { label: string; url: string } {
  if (area === "GST") return { label: "GST portal", url: "https://www.gst.gov.in/" };
  if (area === "MCA") return { label: "MCA portal", url: "https://www.mca.gov.in/" };
  if (area === "Income tax") return /TDS|TCS/.test(name) ? { label: "TRACES", url: "https://www.tdscpc.gov.in/" } : { label: "Income-tax portal", url: "https://www.incometax.gov.in/" };
  if (area === "Payroll") return /PF|ESI|EPF|ECR/.test(name) ? { label: "EPFO portal", url: "https://unifiedportal-emp.epfindia.gov.in/" } : { label: "State PT portal", url: "https://pt.kar.nic.in/" };
  if (area === "FEMA") return /softex/i.test(name) ? { label: "STPI portal", url: "https://www.stpi.in/" } : { label: "RBI FIRMS", url: "https://firms.rbi.org.in/" };
  return { label: "Labour portal", url: "https://labour.karnataka.gov.in/" };
}

/** Old status(): filed, else overdue, else due within 7 days, else upcoming. */
export function calStatus(due: Date, filed?: Date, from = CAL_TODAY): FilingStatus {
  if (filed) return "Filed";
  const n = daysFrom(due, from);
  if (n < 0) return "Overdue";
  if (n <= 7) return "Due soon";
  return "Upcoming";
}

/** Obligation behind a filing name, for the "Open obligation" link. */
const OB_OF: Record<string, string> = {
  "TDS/TCS challan": "tds-pay",
  "GSTR-1": "gstr1",
  "GSTR-3B": "gstr3b",
  "PF & ESI payment": "pf-esi",
  "Softex filing": "softex",
  "ECB-2 return": "ecb2",
  "ITC-04": "itc04",
  "AOC-4 (financial statements)": "aoc4",
  "MSME-1": "msme1",
  "TDS return Q2": "tds-26q",
  "TDS return Q1": "tds-26q",
  "TDS return Q3": "tds-26q",
  "Advance tax Q1": "adv-tax",
  "Advance tax Q2": "adv-tax",
  "Advance tax Q3": "adv-tax",
  "Advance tax Q4": "adv-tax",
  "MGT-7 (annual return)": "mgt7",
  "DPT-3": "dpt3",
  "FLA return": "fla",
  "DIR-3 KYC": "dir3kyc",
};

type Raw = [due: Date, area: Area, name: string, period: string, filed: Date | null, frequency: Frequency, authority: string];

/** Old OCT: the 13 October filings of Northwind. */
const OCT: Raw[] = [
  [d(2026, 10, 7), "Income tax", "TDS/TCS challan", "Sep 2026", d(2026, 10, 6), "Monthly", "Income Tax Dept"],
  [d(2026, 10, 7), "FEMA", "ECB-2 return", "Jul-Sep 2026", null, "Quarterly", "RBI"],
  [d(2026, 10, 10), "Payroll", "Professional tax payment", "Sep 2026", null, "Monthly", "State PT Dept"],
  [d(2026, 10, 11), "GST", "GSTR-1", "Sep 2026", null, "Monthly", "GSTN"],
  [d(2026, 10, 15), "Payroll", "PF & ESI payment", "Sep 2026", null, "Monthly", "EPFO · ESIC"],
  [d(2026, 10, 15), "Income tax", "TCS return Q2", "Jul-Sep 2026", null, "Quarterly", "Income Tax Dept"],
  [d(2026, 10, 20), "GST", "GSTR-3B", "Sep 2026", null, "Monthly", "GSTN"],
  [d(2026, 10, 25), "GST", "ITC-04", "Apr-Sep 2026", null, "Half-yearly", "GSTN"],
  [d(2026, 10, 29), "MCA", "AOC-4 (financial statements)", "FY 2025-26", null, "Annual", "MCA"],
  [d(2026, 10, 30), "MCA", "MSME-1", "Apr-Sep 2026", null, "Half-yearly", "MCA"],
  [d(2026, 10, 30), "FEMA", "Softex filing", "Sep 2026", null, "Monthly", "STPI"],
  [d(2026, 10, 31), "Income tax", "TDS return Q2", "Jul-Sep 2026", null, "Quarterly", "Income Tax Dept"],
  [d(2026, 10, 31), "Income tax", "Income tax return (ITR-6)", "FY 2025-26", null, "Annual", "Income Tax Dept"],
];

const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

const rows: Raw[] = [...OCT];

/** cal-views.js add(): skip October, a past date is filed 2 days before it is due. */
function add(y: number, m: number, day: number, area: Area, name: string, frequency: Frequency, authority: string, period?: string) {
  const last = new Date(y, m + 1, 0).getDate();
  const due = new Date(y, m, Math.min(day, last));
  if (due.getFullYear() === 2026 && due.getMonth() === 9) return;
  const filed = due < CAL_TODAY ? addDays(due, -2) : null;
  rows.push([due, area, name, period ?? `${MON[(m + 11) % 12]} ${m === 0 ? y - 1 : y}`, filed, frequency, authority]);
}

for (let k = 0; k < 12; k++) {
  const m = (3 + k) % 12;
  const y = 2026 + (3 + k >= 12 ? 1 : 0);
  add(y, m, 7, "Income tax", "TDS/TCS challan", "Monthly", "Income Tax Dept");
  add(y, m, 10, "Payroll", "Professional tax payment", "Monthly", "State PT Dept");
  add(y, m, 11, "GST", "GSTR-1", "Monthly", "GSTN");
  add(y, m, 15, "Payroll", "PF & ESI payment", "Monthly", "EPFO · ESIC");
  add(y, m, 20, "GST", "GSTR-3B", "Monthly", "GSTN");
  add(y, m, 30, "FEMA", "Softex filing", "Monthly", "STPI");
}

const SPECIAL: Array<[number, number, number, Area, string, Frequency]> = [
  [2026, 5, 15, "Income tax", "Advance tax Q1", "Quarterly"],
  [2026, 8, 15, "Income tax", "Advance tax Q2", "Quarterly"],
  [2026, 11, 15, "Income tax", "Advance tax Q3", "Quarterly"],
  [2027, 2, 15, "Income tax", "Advance tax Q4", "Quarterly"],
  [2026, 6, 31, "Income tax", "TDS return Q1", "Quarterly"],
  [2027, 0, 31, "Income tax", "TDS return Q3", "Quarterly"],
  [2026, 3, 30, "MCA", "MSME-1", "Half-yearly"],
  [2026, 5, 30, "MCA", "DPT-3", "Annual"],
  [2026, 6, 15, "FEMA", "FLA return", "Annual"],
  [2026, 8, 30, "MCA", "DIR-3 KYC", "Annual"],
  [2026, 10, 28, "MCA", "MGT-7 (annual return)", "Annual"],
  [2027, 0, 7, "FEMA", "ECB-2 return", "Quarterly"],
  [2026, 3, 25, "GST", "ITC-04", "Half-yearly"],
];
for (const [y, m, day, area, name, freq] of SPECIAL) {
  const auth = area === "MCA" ? "MCA" : area === "FEMA" ? "RBI" : area === "GST" ? "GSTN" : "Income Tax Dept";
  add(y, m, day, area, name, freq, auth, / Q\d/.test(name) ? "FY 2026-27" : "FY 2025-26");
}

/** Every deadline of FY 2026-27, in date order. */
export const YEAR_EVENTS: YearEvent[] = rows
  .map(([due, area, name, period, filed, frequency, authority], i): YearEvent => ({
    id: `cal-${i}`,
    date: due,
    title: name,
    name,
    period,
    kind: area,
    status: calStatus(due, filed ?? undefined),
    filed: filed ?? undefined,
    obligationId: OB_OF[name],
    frequency,
    authority,
  }))
  .sort((a, b) => a.date.getTime() - b.date.getTime() || a.id.localeCompare(b.id, undefined, { numeric: true }));

/** The old Next deadline card shows GSTR-1 · Sep 2026, with its sales data received on 3 Oct. */
export const CAL_FOCUS = YEAR_EVENTS.find((e) => e.name === "GSTR-1" && e.period === "Sep 2026")!;

/** FY 2026-27 months, April first. */
export const FY_MONTHS = Array.from({ length: 12 }, (_, k) => {
  const month = (3 + k) % 12;
  const year = 2026 + (3 + k >= 12 ? 1 : 0);
  const long = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month];
  return { key: `${year}-${String(month + 1).padStart(2, "0")}`, year, month, label: `${long} ${year}`, short: `${MON[month]} ${year}` };
});

export const NOW_KEY = `${CAL_TODAY.getFullYear()}-${String(CAL_TODAY.getMonth() + 1).padStart(2, "0")}`;

/** Days of preparation before the due date, for the Timeline view (cal-views.js PREP). */
export const PREP_DAYS: Record<Frequency, number> = { Monthly: 5, Quarterly: 10, "Half-yearly": 10, Annual: 21, Event: 7 };

/** Calendar areas in filter order (old area pill: All, MCA, GST, Income tax, Payroll, FEMA). */
export const CAL_AREAS: Area[] = ["MCA", "GST", "Income tax", "Payroll", "FEMA"];
