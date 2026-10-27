import { d, TODAY, daysFrom } from "@/lib/dates";
import { CALENDAR, FILINGS, obligation, type Area, type CalendarEvent, type FilingStatus, type Frequency } from "./compliance";

// Ported from reference/old-screens/s/comp/cal-views.js (YEAR) and index.html (OCT, portalOf, PREP).
// Sep to Nov come from CALENDAR. The other months of FY 2026-27 follow the statutory pattern.

/** A calendar entry with the facts the day pop-over and the detail dialog need. */
export interface YearEvent extends CalendarEvent {
  /** "GSTR-1" */
  name: string;
  /** "Sep 2026" */
  period: string;
  frequency: Frequency;
  authority: string;
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

function authorityOf(area: Area, name: string) {
  if (area === "Payroll" && /professional/i.test(name)) return "State PT Dept";
  if (area === "FEMA" && /softex/i.test(name)) return "STPI";
  return AUTHORITY[area];
}

/** Government portal for a filing (old prototype rule 15: a portal link on each filing). */
export function portalOf(area: Area, name: string): { label: string; url: string } {
  if (area === "GST") return { label: "GST portal", url: "https://www.gst.gov.in/" };
  if (area === "MCA") return { label: "MCA portal", url: "https://www.mca.gov.in/" };
  if (area === "Income tax") return /TDS|TCS/.test(name) ? { label: "TRACES", url: "https://www.tdscpc.gov.in/" } : { label: "Income-tax portal", url: "https://www.incometax.gov.in/" };
  if (area === "Payroll") return /PF|ESI|EPF|ECR/.test(name) ? { label: "EPFO portal", url: "https://unifiedportal-emp.epfindia.gov.in/" } : { label: "State PT portal", url: "https://pt.kar.nic.in/" };
  if (area === "FEMA") return /softex/i.test(name) ? { label: "STPI portal", url: "https://www.stpi.in/" } : { label: "RBI FIRMS", url: "https://firms.rbi.org.in/" };
  return { label: "Labour portal", url: "https://labour.karnataka.gov.in/" };
}

function statusFor(due: Date): FilingStatus {
  const n = daysFrom(due);
  if (n < 0) return "Filed";
  if (n <= 7) return "Due soon";
  return "Upcoming";
}

function guessFrequency(name: string, obligationId?: string): Frequency {
  const o = obligationId ? obligation(obligationId) : undefined;
  if (o) return o.frequency;
  const f = FILINGS.find((x) => x.form === name);
  if (f) return f.frequency;
  if (/Q\d|quarter/i.test(name)) return "Quarterly";
  if (/annual|MGT-7|AOC-4|DIR-3|DPT-3|FLA/i.test(name)) return "Annual";
  if (/ITC-04|MSME-1/i.test(name)) return "Half-yearly";
  return "Monthly";
}

const fromCalendar: YearEvent[] = CALENDAR.map((e) => {
  const [name, rest] = e.title.split(" · ");
  const period = rest ? (/\d{4}/.test(rest) ? rest : `${rest} ${e.date.getMonth() === 0 ? e.date.getFullYear() - 1 : e.date.getFullYear()}`) : "FY 2026-27";
  return { ...e, name, period, frequency: guessFrequency(name, e.obligationId), authority: authorityOf(e.kind, name) };
});

type Pattern = [day: number, area: Area, name: string, obligationId?: string];

const MONTHLY: Pattern[] = [
  [7, "Income tax", "TDS payment", "tds-pay"],
  [10, "Payroll", "Professional tax"],
  [11, "GST", "GSTR-1", "gstr1"],
  [15, "Payroll", "EPF ECR", "pf-esi"],
  [15, "Payroll", "ESI contribution", "pf-esi"],
  [20, "GST", "GSTR-3B", "gstr3b"],
  [30, "FEMA", "Softex", "softex"],
];

type Special = [y: number, m: number, day: number, area: Area, name: string, frequency: Frequency, period: string, obligationId?: string];

const SPECIAL: Special[] = [
  [2026, 6, 15, "Income tax", "Advance tax Q1", "Quarterly", "Q1 2026-27", "adv-tax"],
  [2026, 12, 15, "Income tax", "Advance tax Q3", "Quarterly", "Q3 2026-27", "adv-tax"],
  [2027, 3, 15, "Income tax", "Advance tax Q4", "Quarterly", "Q4 2026-27", "adv-tax"],
  [2027, 1, 31, "Income tax", "TDS return 26Q", "Quarterly", "Q3 2026-27", "tds-26q"],
  [2026, 4, 30, "MCA", "MSME-1", "Half-yearly", "Oct–Mar 2026", "msme1"],
  [2026, 6, 30, "MCA", "DPT-3", "Annual", "FY 2025-26", "dpt3"],
  [2026, 7, 15, "FEMA", "FLA return", "Annual", "FY 2025-26", "fla"],
  [2027, 1, 7, "FEMA", "ECB-2 return", "Monthly", "Dec 2026", "ecb2"],
  [2026, 4, 25, "GST", "ITC-04", "Half-yearly", "Oct–Mar 2026", "itc04"],
  [2026, 12, 1, "Labour", "Shops and Establishment renewal", "Annual", "2027", "seren"],
  [2027, 1, 31, "Labour", "POSH annual report", "Annual", "2026", "posh"],
  [2027, 3, 31, "GST", "LUT renewal", "Annual", "FY 2027-28", "lutren"],
];

const generated: YearEvent[] = [];
// FY months outside Sep to Nov: Apr to Aug 2026 and Dec 2026 to Mar 2027.
for (let k = 0; k < 12; k++) {
  const m = (3 + k) % 12;
  const y = 2026 + (3 + k >= 12 ? 1 : 0);
  if (y === 2026 && m >= 8 && m <= 10) continue;
  for (const [day, area, name, obligationId] of MONTHLY) {
    const last = new Date(y, m + 1, 0).getDate();
    const due = d(y, m + 1, Math.min(day, last));
    const pm = (m + 11) % 12;
    const period = `${MON[pm]} ${m === 0 ? y - 1 : y}`;
    generated.push({ id: `y-${y}-${m + 1}-${name}`, date: due, title: `${name} · ${MON[pm]}`, name, period, kind: area, status: statusFor(due), obligationId, frequency: "Monthly", authority: authorityOf(area, name) });
  }
}
for (const [y, m, day, area, name, frequency, period, obligationId] of SPECIAL) {
  if (y === 2026 && m >= 9 && m <= 11) continue;
  const due = d(y, m, day);
  generated.push({ id: `y-${y}-${m}-${name}`, date: due, title: name, name, period, kind: area, status: statusFor(due), obligationId, frequency, authority: authorityOf(area, name) });
}

/** Every deadline of FY 2026-27, in date order. */
export const YEAR_EVENTS: YearEvent[] = [...fromCalendar, ...generated].sort((a, b) => a.date.getTime() - b.date.getTime() || a.name.localeCompare(b.name));

/** FY 2026-27 months, April first. */
export const FY_MONTHS = Array.from({ length: 12 }, (_, k) => {
  const month = (3 + k) % 12;
  const year = 2026 + (3 + k >= 12 ? 1 : 0);
  const long = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month];
  return { key: `${year}-${String(month + 1).padStart(2, "0")}`, year, month, label: `${long} ${year}`, short: `${MON[month]} ${year}` };
});

export const NOW_KEY = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;

/** Days of preparation before the due date, for the Timeline view (cal-views.js PREP). */
export const PREP_DAYS: Record<Frequency, number> = { Monthly: 5, Quarterly: 10, "Half-yearly": 10, Annual: 21, Event: 7 };

/** Calendar areas in filter order (old area pill: All, MCA, GST, Income tax, Payroll, FEMA). */
export const CAL_AREAS: Area[] = ["MCA", "GST", "Income tax", "Payroll", "FEMA", "Labour"];
