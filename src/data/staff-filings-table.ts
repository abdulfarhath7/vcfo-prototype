import { d } from "@/lib/dates";
import type { Area } from "@/data/compliance";

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
