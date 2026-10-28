import { d } from "@/lib/dates";
import type { Area } from "@/data/compliance";

// Super admin filings list. Ported from reference/old-screens/s/super/Filings.dc.html (same page as the old admin Filings).
// The old page lists one company's filings for Sep to Oct 2026. Labels ("1 day late", "Proof pending") are the old ones.

export type SuperFilingStatus = "Filed" | "Overdue" | "Due soon" | "Upcoming";

export interface SuperFiling {
  id: string;
  due: Date;
  area: Area;
  /** Old area code in the grid: IT, PAY, GST, MCA, FEMA. */
  code: string;
  name: string;
  period: string;
  frequency: "Monthly" | "Quarterly" | "Half-yearly" | "Annual";
  /** Filed date, or the old text: "1 day late", "Not filed yet". */
  filedOn: Date | string;
  status: SuperFilingStatus;
  /** "file": Proof and Download. "pending": SBC still uploads the challan. */
  proof?: "file" | "pending";
}

const CODE: Record<string, string> = { "Income tax": "IT", Payroll: "PAY", GST: "GST", MCA: "MCA", FEMA: "FEMA" };

const row = (id: string, due: Date, area: Area, name: string, period: string, frequency: SuperFiling["frequency"], filedOn: Date | string, status: SuperFilingStatus, proof?: SuperFiling["proof"]): SuperFiling => ({
  id,
  due,
  area,
  code: CODE[area],
  name,
  period,
  frequency,
  filedOn,
  status,
  proof,
});

export const SUPER_FILINGS: SuperFiling[] = [
  row("s2", d(2026, 9, 11), "GST", "GSTR-1", "Aug 2026", "Monthly", d(2026, 9, 10), "Filed", "file"),
  row("s4", d(2026, 9, 15), "Income tax", "Advance tax Q2", "Jul-Sep 2026", "Quarterly", d(2026, 9, 14), "Filed", "file"),
  row("s5", d(2026, 9, 15), "Payroll", "PF & ESI payment", "Aug 2026", "Monthly", d(2026, 9, 12), "Filed", "file"),
  row("s1", d(2026, 9, 20), "GST", "GSTR-3B", "Aug 2026", "Monthly", d(2026, 9, 18), "Filed", "file"),
  row("s3", d(2026, 9, 30), "MCA", "AGM held (Sec 96)", "FY 2025-26", "Annual", d(2026, 9, 26), "Filed", "file"),
  row("o0", d(2026, 10, 7), "Income tax", "TDS/TCS challan", "Sep 2026", "Monthly", d(2026, 10, 6), "Filed", "pending"),
  row("o1", d(2026, 10, 7), "FEMA", "ECB-2 return", "Jul-Sep 2026", "Quarterly", "1 day late", "Overdue"),
  row("o2", d(2026, 10, 10), "Payroll", "Professional tax payment", "Sep 2026", "Monthly", "Not filed yet", "Due soon"),
  row("o3", d(2026, 10, 11), "GST", "GSTR-1", "Sep 2026", "Monthly", "Not filed yet", "Due soon"),
  row("o4", d(2026, 10, 15), "Payroll", "PF & ESI payment", "Sep 2026", "Monthly", "Not filed yet", "Due soon"),
  row("o5", d(2026, 10, 15), "Income tax", "TCS return Q2", "Jul-Sep 2026", "Quarterly", "Not filed yet", "Due soon"),
  row("o6", d(2026, 10, 20), "GST", "GSTR-3B", "Sep 2026", "Monthly", "Not filed yet", "Upcoming"),
  row("o7", d(2026, 10, 25), "GST", "ITC-04", "Apr-Sep 2026", "Half-yearly", "Not filed yet", "Upcoming"),
  row("o8", d(2026, 10, 29), "MCA", "AOC-4 (financial statements)", "FY 2025-26", "Annual", "Not filed yet", "Upcoming"),
  row("o9", d(2026, 10, 30), "MCA", "MSME-1", "Apr-Sep 2026", "Half-yearly", "Not filed yet", "Upcoming"),
  row("o10", d(2026, 10, 30), "FEMA", "Softex filing", "Sep 2026", "Monthly", "Not filed yet", "Upcoming"),
  row("o11", d(2026, 10, 31), "Income tax", "TDS return Q2", "Jul-Sep 2026", "Quarterly", "Not filed yet", "Upcoming"),
  row("o12", d(2026, 10, 31), "Income tax", "Income tax return (ITR-6)", "FY 2025-26", "Annual", "Not filed yet", "Upcoming"),
];

/** Areas in the old order of the "By area" card and the area tabs. */
export const SUPER_FILING_AREAS: Area[] = ["MCA", "GST", "Income tax", "Payroll", "FEMA"];
