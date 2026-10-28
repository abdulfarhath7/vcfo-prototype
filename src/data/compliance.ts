import { d, TODAY, daysFrom } from "@/lib/dates";
import type { ChipTone, Owner } from "@/components/ui/Chip";
import type { BarTone } from "@/components/ui/Bar";
import type { ThreadStep } from "@/components/cards/Thread";
import { docType, type ItemDoc, type Regulator } from "./registrations";

// Ported from reference/old-patch/shared/regcat.js (OB), reference/old-screens/s/comp/index.html (OCT, FIL)
// and cal-views.js (YEAR). Dates sit around TODAY (6 Oct 2026). Counts match the client home (14 of 24 filed).

/** Compliance area: one colour per area on every chart and tag. */
export type Area = "GST" | "Income tax" | "MCA" | "Payroll" | "FEMA" | "Labour";

export const AREAS: Area[] = ["GST", "Income tax", "MCA", "Payroll", "FEMA", "Labour"];

/** RULES.md: teal GST, violet MCA. */
export const AREA_TONE: Record<Area, ChipTone> = {
  GST: "teal",
  "Income tax": "prog",
  MCA: "violet",
  Payroll: "warn",
  FEMA: "ok",
  Labour: "idle",
};

export const AREA_BAR: Record<Area, BarTone> = {
  GST: "teal",
  "Income tax": "accent",
  MCA: "violet",
  Payroll: "warn",
  FEMA: "ok",
  Labour: "idle",
};

export const AREA_REGULATOR: Record<Area, Regulator> = {
  GST: "GST",
  "Income tax": "IT",
  MCA: "MCA",
  Payroll: "Labour",
  FEMA: "FEMA",
  Labour: "Labour",
};

export type Frequency = "Monthly" | "Quarterly" | "Half-yearly" | "Annual" | "Event";

export const FREQUENCIES: Frequency[] = ["Monthly", "Quarterly", "Half-yearly", "Annual", "Event"];

/* ---------- Obligations ---------- */

export type ObStatus = "Filed" | "In progress" | "Waiting on client" | "Upcoming" | "Overdue";

export const OB_STATUS_TONE: Record<ObStatus, ChipTone> = {
  Filed: "ok",
  "In progress": "prog",
  "Waiting on client": "teal",
  Upcoming: "idle",
  Overdue: "bad",
};

export const OB_STATUS_BAR: Record<ObStatus, BarTone> = {
  Filed: "ok",
  "In progress": "accent",
  "Waiting on client": "teal",
  Upcoming: "idle",
  Overdue: "bad",
};

export interface Obligation {
  id: string;
  name: string;
  /** The law: "GST", "Companies Act", "EPF Act and ESI Act". */
  law: string;
  area: Area;
  frequency: Frequency;
  regulator: Regulator;
  /** Due date of the current period. */
  due: Date;
  status: ObStatus;
  owner: Owner;
  form: string;
  /** "Sep 2026", "Q2 2026-27", "FY 2025-26". */
  period: string;
  dueRule: string;
  penalty: string;
  /** Registration id in src/data/registrations.ts that started it. */
  startedBy?: string;
  /** What SBC needs from the client. */
  needs: string[];
  filed?: Date;
  lastFiled?: Date;
  idLabel?: string;
  idValue?: string;
  steps: ThreadStep[];
  docs: ItemDoc[];
  /** SBC person on it. */
  by: string;
}

type Side = "s" | "a";

interface RawOb {
  id: string;
  name: string;
  law: string;
  area: Area;
  frequency: Frequency;
  due: Date;
  status: ObStatus;
  form: string;
  period: string;
  dueRule: string;
  penalty: string;
  startedBy?: string;
  needs: string[];
  steps: Array<[Side, string]>;
  authority: string;
  filed?: Date;
  lastFiled?: Date;
  idLabel?: string;
  idValue?: string;
  by?: string;
}

const RAW_OB: RawOb[] = [
  {
    id: "tds-pay", name: "TDS payment", law: "Income tax", area: "Income tax", frequency: "Monthly", due: d(2026, 10, 7), status: "In progress",
    form: "Challan 281", period: "Sep 2026", dueRule: "7th of next month", penalty: "1.5% interest a month", authority: "Income Tax Dept",
    needs: ["Vendor and salary payments with TDS for September"], steps: [["s", "Payments received"], ["s", "TDS computed"], ["s", "Paid"], ["a", "Challan confirmed"]],
    lastFiled: d(2026, 9, 5), idLabel: "Challan CIN",
  },
  {
    id: "gstr1", name: "GSTR-1", law: "GST", area: "GST", frequency: "Monthly", due: d(2026, 10, 11), status: "In progress", startedBy: "gst",
    form: "GSTR-1", period: "Sep 2026", dueRule: "11th of next month", penalty: "₹50 a day, up to ₹10,000", authority: "GSTN",
    needs: ["Sales register for September", "Credit and debit notes", "Export invoices"], steps: [["s", "Sales data received"], ["s", "Reconciled"], ["s", "Filed · ARN"], ["a", "Acknowledged"]],
    lastFiled: d(2026, 9, 10), idLabel: "ARN",
  },
  {
    id: "gstr3b", name: "GSTR-3B", law: "GST", area: "GST", frequency: "Monthly", due: d(2026, 10, 20), status: "Waiting on client", startedBy: "gst",
    form: "GSTR-3B", period: "Sep 2026", dueRule: "20th of next month", penalty: "18% interest on the tax due, plus ₹50 a day", authority: "GSTN",
    needs: ["Purchase register for September", "Approval to pay the tax"], steps: [["s", "Purchase data received"], ["s", "Matched with GSTR-2B"], ["s", "Tax paid"], ["s", "Filed"], ["a", "Acknowledged"]],
    lastFiled: d(2026, 9, 18), idLabel: "ARN",
  },
  {
    id: "pf-esi", name: "PF and ESI", law: "EPF Act and ESI Act", area: "Payroll", frequency: "Monthly", due: d(2026, 10, 15), status: "Waiting on client", startedBy: "epf",
    form: "ECR and ESI challan", period: "Sep 2026", dueRule: "15th of next month", penalty: "5% to 15% a year by delay, 12% interest on ESI", authority: "EPFO · ESIC",
    needs: ["Salary register for September"], steps: [["s", "Payroll received"], ["s", "ECR filed"], ["s", "Paid"], ["a", "Confirmed"]],
    lastFiled: d(2026, 9, 12), idLabel: "TRRN",
  },
  {
    id: "dir3kyc", name: "DIR-3 KYC · Director 2", law: "Companies Act", area: "MCA", frequency: "Annual", due: d(2026, 9, 30), status: "Overdue",
    form: "DIR-3 KYC web", period: "FY 2026-27", dueRule: "30 Sep each year", penalty: "₹5,000 to reactivate the DIN", authority: "MCA",
    needs: ["OTP on the mobile and email of Director 2"], steps: [["s", "OTP received"], ["s", "Filed"], ["a", "Approved"]], idLabel: "SRN",
  },
  {
    id: "tds-26q", name: "TDS return 26Q · Q2", law: "Income tax", area: "Income tax", frequency: "Quarterly", due: d(2026, 10, 31), status: "In progress",
    form: "26Q", period: "Q2 2026-27", dueRule: "31 Jul, 31 Oct, 31 Jan, 31 May", penalty: "₹200 a day", authority: "TRACES",
    needs: ["Deductee details for the quarter"], steps: [["s", "Data received"], ["s", "Prepared"], ["s", "Filed"], ["a", "Accepted"], ["s", "Certificates issued"]],
    lastFiled: d(2026, 7, 29), idLabel: "Token number",
  },
  {
    id: "tds-24q", name: "TDS return 24Q · Q2", law: "Income tax", area: "Income tax", frequency: "Quarterly", due: d(2026, 10, 31), status: "Filed",
    form: "24Q", period: "Q2 2026-27", dueRule: "31 Jul, 31 Oct, 31 Jan, 31 May", penalty: "₹200 a day", authority: "TRACES",
    needs: ["Salary TDS details for the quarter"], steps: [["s", "Data received"], ["s", "Prepared"], ["s", "Filed"], ["a", "Accepted"]],
    filed: d(2026, 10, 3), lastFiled: d(2026, 10, 3), idLabel: "Token number", idValue: "482910773",
  },
  {
    id: "adt1", name: "ADT-1 auditor appointment", law: "Companies Act", area: "MCA", frequency: "Event", due: d(2026, 10, 27), status: "Waiting on client",
    form: "ADT-1", period: "First auditor", dueRule: "15 days after the board meeting", penalty: "₹100 a day", authority: "MCA",
    needs: ["Board minutes of the first meeting", "Auditor consent and certificate"], steps: [["s", "Consent received"], ["s", "Filed"], ["a", "Approved by ROC"]],
    idLabel: "SRN", by: "Pranay",
  },
  {
    id: "itc04", name: "ITC-04", law: "GST", area: "GST", frequency: "Half-yearly", due: d(2026, 10, 25), status: "Upcoming", startedBy: "gst",
    form: "ITC-04", period: "Apr–Sep 2026", dueRule: "25 Oct and 25 Apr", penalty: "₹50 a day", authority: "GSTN",
    needs: ["Goods sent to job workers (or none)"], steps: [["s", "Data received"], ["s", "Filed"], ["a", "Acknowledged"]], idLabel: "ARN",
  },
  {
    id: "aoc4", name: "AOC-4 financial statements", law: "Companies Act", area: "MCA", frequency: "Annual", due: d(2026, 10, 29), status: "Upcoming",
    form: "AOC-4", period: "FY 2025-26", dueRule: "30 days after the AGM", penalty: "₹100 a day", authority: "MCA",
    needs: ["Audited financial statements", "Board report"], steps: [["s", "Statements received"], ["s", "Prepared"], ["s", "Filed · SRN"], ["a", "Approved by ROC"]],
    idLabel: "SRN", by: "Pranay",
  },
  {
    id: "msme1", name: "MSME-1", law: "Companies Act", area: "MCA", frequency: "Half-yearly", due: d(2026, 10, 30), status: "Upcoming", startedBy: "msme",
    form: "MSME-1", period: "Apr–Sep 2026", dueRule: "30 Apr and 31 Oct", penalty: "Fine up to ₹20,000, then ₹1,000 a day", authority: "MCA",
    needs: ["MSME vendor dues over 45 days"], steps: [["s", "Vendor dues received"], ["s", "Filed"]], idLabel: "SRN",
  },
  {
    id: "softex", name: "Softex form", law: "FEMA", area: "FEMA", frequency: "Monthly", due: d(2026, 10, 30), status: "Upcoming", startedBy: "nonstpi",
    form: "Softex", period: "Sep 2026", dueRule: "30 days after the last invoice of the month", penalty: "The bank may freeze the account", authority: "STPI",
    needs: ["Export invoices for the month"], steps: [["s", "Invoices received"], ["s", "Filed"], ["a", "Certified by STPI"]], idLabel: "Softex number",
  },
  {
    id: "ecb2", name: "ECB-2 return", law: "FEMA", area: "FEMA", frequency: "Monthly", due: d(2026, 10, 7), status: "Filed",
    form: "ECB-2", period: "Sep 2026", dueRule: "7th of next month", penalty: "Late submission fee by RBI", authority: "RBI · AD bank",
    needs: ["Loan drawdown and repayment for the month"], steps: [["s", "Data received"], ["s", "Filed through the bank"], ["a", "Acknowledged"]],
    filed: d(2026, 10, 5), lastFiled: d(2026, 10, 5), idLabel: "Acknowledgement", idValue: "ECB2-0926-55120",
  },
  {
    id: "mgt14", name: "MGT-14 board resolutions", law: "Companies Act", area: "MCA", frequency: "Event", due: d(2026, 9, 18), status: "Filed",
    form: "MGT-14", period: "Board meeting 3 Sep", dueRule: "30 days after the resolution", penalty: "₹100 a day", authority: "MCA",
    needs: ["Certified copies of the resolutions"], steps: [["s", "Resolutions received"], ["s", "Filed · SRN"], ["a", "Approved by ROC"]],
    filed: d(2026, 9, 15), lastFiled: d(2026, 9, 15), idLabel: "SRN", idValue: "AB4410927", by: "Pranay",
  },
  {
    id: "adv-tax", name: "Advance tax · Q3", law: "Income tax", area: "Income tax", frequency: "Quarterly", due: d(2026, 12, 15), status: "Upcoming",
    form: "Challan 280", period: "Q3 2026-27", dueRule: "15 Jun, 15 Sep, 15 Dec, 15 Mar", penalty: "1% interest a month (234B and 234C)", authority: "Income Tax Dept",
    needs: ["Estimated income for the year"], steps: [["s", "Estimate received"], ["s", "Computed"], ["s", "Paid"]], lastFiled: d(2026, 9, 14), idLabel: "Challan CIN",
  },
  {
    id: "mgt7", name: "MGT-7 annual return", law: "Companies Act", area: "MCA", frequency: "Annual", due: d(2026, 11, 28), status: "Upcoming",
    form: "MGT-7", period: "FY 2025-26", dueRule: "60 days after the AGM", penalty: "₹100 a day", authority: "MCA",
    needs: ["Shareholder list", "Meeting dates"], steps: [["s", "Data received"], ["s", "Prepared"], ["s", "Filed"], ["a", "Approved by ROC"]], idLabel: "SRN", by: "Pranay",
  },
  {
    id: "seren", name: "Shops and Establishment renewal", law: "Shops Act", area: "Labour", frequency: "Annual", due: d(2026, 12, 1), status: "Upcoming", startedBy: "se",
    form: "Form A renewal", period: "2027", dueRule: "Before 1 Dec", penalty: "25% in December, 50% after", authority: "Karnataka Labour Dept",
    needs: ["Employee count"], steps: [["s", "Renewal filed"], ["a", "Renewed"]], idLabel: "Certificate",
  },
  {
    id: "posh", name: "POSH annual report", law: "POSH Act", area: "Labour", frequency: "Annual", due: d(2027, 1, 31), status: "Upcoming", startedBy: "posh",
    form: "Annual report", period: "2026", dueRule: "Before 31 Jan", penalty: "₹50,000", authority: "District officer",
    needs: ["Complaints received in the year (or none)"], steps: [["s", "Data received"], ["s", "Report filed"], ["a", "Acknowledged"]],
  },
  {
    id: "lutren", name: "LUT renewal", law: "GST", area: "GST", frequency: "Annual", due: d(2027, 3, 31), status: "Upcoming", startedBy: "lut",
    form: "GST RFD-11", period: "FY 2027-28", dueRule: "31 Mar", penalty: "Tax on exports, refund later", authority: "GSTN",
    needs: ["Witness details"], steps: [["s", "Filed"], ["a", "Acknowledged"]], lastFiled: d(2026, 9, 28), idLabel: "ARN",
  },
  {
    id: "dpt3", name: "DPT-3 return of deposits", law: "Companies Act", area: "MCA", frequency: "Annual", due: d(2027, 6, 30), status: "Upcoming",
    form: "DPT-3", period: "FY 2026-27", dueRule: "30 Jun", penalty: "2 to 12 times the normal fee", authority: "MCA",
    needs: ["Loans and deposits on 31 Mar"], steps: [["s", "Data received"], ["s", "Filed"], ["a", "Approved"]], idLabel: "SRN",
  },
  {
    id: "fla", name: "FLA return", law: "FEMA", area: "FEMA", frequency: "Annual", due: d(2027, 7, 15), status: "Upcoming", startedBy: "fcgpr",
    form: "FLA", period: "FY 2026-27", dueRule: "15 Jul", penalty: "Up to 300% of the amount, or ₹2 lakh", authority: "RBI · FLAIR",
    needs: ["Foreign liabilities and assets on 31 Mar"], steps: [["s", "Data received"], ["s", "Filed"], ["a", "Acknowledged"]], idLabel: "Acknowledgement",
  },
  {
    id: "gstr9", name: "GSTR-9 annual return", law: "GST", area: "GST", frequency: "Annual", due: d(2027, 12, 31), status: "Upcoming", startedBy: "gst",
    form: "GSTR-9", period: "FY 2026-27", dueRule: "31 Dec after the year", penalty: "₹200 a day, up to 0.5% of turnover", authority: "GSTN",
    needs: ["Year-end books"], steps: [["s", "Books received"], ["s", "Prepared"], ["s", "Filed"], ["a", "Acknowledged"]], idLabel: "ARN",
  },
];

const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

function obSteps(o: RawOb): ThreadStep[] {
  const lead = o.by ?? "Bharath";
  const total = o.steps.length;
  const done = o.status === "Filed" ? total : o.status === "In progress" ? Math.min(2, total - 1) : 0;
  const start = addDays(o.due, -12);
  return o.steps.map(([side, label], i): ThreadStep => {
    const id = `${o.id}-s${i + 1}`;
    if (i < done) {
      const date = o.status === "Filed" && o.filed && i >= total - 2 ? o.filed : addDays(start, i * 3);
      return { id, title: label, state: "done", date, by: side === "a" ? o.authority : i === 0 ? `Checked by ${lead}` : `Done by ${lead}` };
    }
    if (i === done && (o.status === "Waiting on client" || o.status === "Overdue")) {
      return { id, title: label, state: "current", owner: "client", date: start, by: "Waiting on Northwind", note: o.needs[0] };
    }
    if (i === done && o.status === "In progress") {
      return { id, title: label, state: "current", owner: side === "a" ? undefined : "sbc", by: side === "a" ? `With ${o.authority}` : lead };
    }
    return { id, title: label, state: "upcoming", owner: side === "a" ? undefined : "sbc" };
  });
}

function obDocs(o: RawOb): ItemDoc[] {
  const start = addDays(o.due, -12);
  const docs = o.needs.map((name, i): ItemDoc => {
    const status = o.status === "Filed" || o.status === "In progress" ? "Accepted" : o.status === "Upcoming" ? "Not asked yet" : "Asked";
    return { id: `${o.id}-d${i + 1}`, name, type: docType(name), from: "client", fromLabel: "Northwind", status, date: status === "Accepted" ? addDays(start, i) : undefined };
  });
  if (o.status === "Filed" && o.filed) docs.unshift({ id: `${o.id}-ack`, name: `${o.form} acknowledgement`, type: "PDF", from: "sbc", fromLabel: o.authority, status: "Accepted", date: o.filed });
  return docs;
}

export const OBLIGATIONS: Obligation[] = RAW_OB.map((o) => ({
  id: o.id,
  name: o.name,
  law: o.law,
  area: o.area,
  frequency: o.frequency,
  regulator: AREA_REGULATOR[o.area],
  due: o.due,
  status: o.status,
  owner: o.status === "Waiting on client" || o.status === "Overdue" ? "client" : "sbc",
  form: o.form,
  period: o.period,
  dueRule: o.dueRule,
  penalty: o.penalty,
  startedBy: o.startedBy,
  needs: o.needs,
  filed: o.filed,
  lastFiled: o.lastFiled,
  idLabel: o.idLabel,
  idValue: o.idValue,
  steps: obSteps(o),
  docs: obDocs(o),
  by: o.by ?? "Bharath",
}));

export function obligation(id: string) {
  return OBLIGATIONS.find((o) => o.id === id);
}

export const obHref = (portal: string, id: string) => (portal === "client" ? `/client/obligations/${id}` : `/${portal}/obligations/${id}`);

/** Not filed and due within `days` (overdue included). */
export function dueWithin(days: number, from = TODAY) {
  return OBLIGATIONS.filter((o) => o.status !== "Filed" && daysFrom(o.due, from) <= days).sort((a, b) => a.due.getTime() - b.due.getTime());
}

/* ---------- Filings (FY 2026-27) ---------- */

export type FilingStatus = "Filed" | "In progress" | "Due soon" | "Overdue" | "Upcoming";

export const FILING_STATUS_TONE: Record<FilingStatus, ChipTone> = {
  Filed: "ok",
  "In progress": "prog",
  "Due soon": "warn",
  Overdue: "bad",
  Upcoming: "idle",
};

export const FILING_STATUS_BAR: Record<FilingStatus, BarTone> = {
  Filed: "ok",
  "In progress": "accent",
  "Due soon": "warn",
  Overdue: "bad",
  Upcoming: "idle",
};

export const FILING_STATUSES: FilingStatus[] = ["Filed", "In progress", "Due soon", "Overdue", "Upcoming"];

export interface Filing {
  id: string;
  form: string;
  period: string;
  due: Date;
  filed?: Date;
  status: FilingStatus;
  arn?: string;
  /** Number of proof documents (acknowledgement, challan). */
  docs: number;
  area: Area;
  frequency: Frequency;
  /** Financial year: "2026-27". */
  fy: string;
  obligationId?: string;
}

type RawFiling = [form: string, period: string, due: Date, filed: Date | null, status: FilingStatus, arn: string | null, area: Area, frequency: Frequency, obligationId?: string];

const RAW_FIL: RawFiling[] = [
  // GST: 6 of 8 filed
  ["GSTR-1", "Jun 2026", d(2026, 7, 11), d(2026, 7, 9), "Filed", "AA290726011842K", "GST", "Monthly", "gstr1"],
  ["GSTR-3B", "Jun 2026", d(2026, 7, 20), d(2026, 7, 19), "Filed", "AA290726020917P", "GST", "Monthly", "gstr3b"],
  ["GSTR-1", "Jul 2026", d(2026, 8, 11), d(2026, 8, 10), "Filed", "AA290826011305M", "GST", "Monthly", "gstr1"],
  ["GSTR-3B", "Jul 2026", d(2026, 8, 20), d(2026, 8, 22), "Filed", "AA290826022741Q", "GST", "Monthly", "gstr3b"],
  ["GSTR-1", "Aug 2026", d(2026, 9, 11), d(2026, 9, 10), "Filed", "AA290926010811K", "GST", "Monthly", "gstr1"],
  ["GSTR-3B", "Aug 2026", d(2026, 9, 20), d(2026, 9, 18), "Filed", "AA3609261847215", "GST", "Monthly", "gstr3b"],
  ["GSTR-1", "Sep 2026", d(2026, 10, 11), null, "In progress", null, "GST", "Monthly", "gstr1"],
  ["GSTR-3B", "Sep 2026", d(2026, 10, 20), null, "Due soon", null, "GST", "Monthly", "gstr3b"],
  // Income tax: 4 of 6 filed
  ["TDS return 26Q", "Q1 2026-27", d(2026, 7, 31), d(2026, 7, 29), "Filed", "QT2607291184", "Income tax", "Quarterly", "tds-26q"],
  ["TDS payment", "Jul 2026", d(2026, 8, 7), d(2026, 8, 6), "Filed", "0510308-06082026-00412", "Income tax", "Monthly", "tds-pay"],
  ["TDS payment", "Aug 2026", d(2026, 9, 7), d(2026, 9, 5), "Filed", "0510308-05092026-00388", "Income tax", "Monthly", "tds-pay"],
  ["Advance tax Q2", "Q2 2026-27", d(2026, 9, 15), d(2026, 9, 14), "Filed", "0510308-14092026-01127", "Income tax", "Quarterly", "adv-tax"],
  ["TDS payment", "Sep 2026", d(2026, 10, 7), null, "Due soon", null, "Income tax", "Monthly", "tds-pay"],
  ["TDS return 26Q", "Q2 2026-27", d(2026, 10, 31), null, "In progress", null, "Income tax", "Quarterly", "tds-26q"],
  // MCA: 2 of 5 filed
  ["MGT-14", "Board meeting 3 Sep", d(2026, 9, 18), d(2026, 9, 15), "Filed", "AB4410927", "MCA", "Event", "mgt14"],
  ["DIR-3 KYC · Director 1", "FY 2026-27", d(2026, 9, 30), d(2026, 9, 26), "Filed", "AB4518302", "MCA", "Annual"],
  ["DIR-3 KYC · Director 2", "FY 2026-27", d(2026, 9, 30), null, "Overdue", null, "MCA", "Annual", "dir3kyc"],
  ["ADT-1", "First auditor", d(2026, 10, 27), null, "In progress", null, "MCA", "Event", "adt1"],
  ["AOC-4", "FY 2025-26", d(2026, 10, 29), null, "Upcoming", null, "MCA", "Annual", "aoc4"],
  // Payroll: 2 of 5 filed
  ["EPF ECR", "Aug 2026", d(2026, 9, 15), d(2026, 9, 12), "Filed", "1012609001234", "Payroll", "Monthly", "pf-esi"],
  ["ESI contribution", "Aug 2026", d(2026, 9, 15), d(2026, 9, 12), "Filed", "53001234560901", "Payroll", "Monthly", "pf-esi"],
  ["Professional tax", "Sep 2026", d(2026, 10, 10), null, "In progress", null, "Payroll", "Monthly"],
  ["EPF ECR", "Sep 2026", d(2026, 10, 15), null, "Due soon", null, "Payroll", "Monthly", "pf-esi"],
  ["ESI contribution", "Sep 2026", d(2026, 10, 15), null, "Due soon", null, "Payroll", "Monthly", "pf-esi"],
];

export const FILINGS: Filing[] = RAW_FIL.map(([form, period, due, filed, status, arn, area, frequency, obligationId], i) => ({
  id: `f${String(i + 1).padStart(2, "0")}`,
  form,
  period,
  due,
  filed: filed ?? undefined,
  status,
  arn: arn ?? undefined,
  docs: status === "Filed" ? (area === "GST" || area === "Income tax" ? 2 : 1) : 0,
  area,
  frequency,
  fy: "2026-27",
  obligationId,
})).sort((a, b) => a.due.getTime() - b.due.getTime());

/** Filed after the due date, or not filed and past due. */
export const isLate = (f: Filing) => f.status === "Overdue" || (!!f.filed && f.filed.getTime() > f.due.getTime());

/* ---------- Calendar (Sep to Nov 2026) ---------- */

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  kind: Area;
  status: FilingStatus;
  obligationId?: string;
}

type RawEvent = [date: Date, title: string, kind: Area, status: FilingStatus, obligationId?: string];

// Events that are not in FILINGS: other October dates (refresh calendar) and November.
const EXTRA_EVENTS: RawEvent[] = [
  [d(2026, 9, 10), "Professional tax · Aug", "Payroll", "Filed"],
  [d(2026, 9, 30), "Softex · Aug", "FEMA", "Filed", "softex"],
  [d(2026, 10, 7), "ECB-2 return · Sep", "FEMA", "Filed", "ecb2"],
  [d(2026, 10, 25), "ITC-04 · Apr–Sep", "GST", "Upcoming", "itc04"],
  [d(2026, 10, 30), "MSME-1 · Apr–Sep", "MCA", "Upcoming", "msme1"],
  [d(2026, 10, 30), "Softex · Sep", "FEMA", "Upcoming", "softex"],
  [d(2026, 10, 31), "TDS return 24Q · Q2", "Income tax", "Filed", "tds-24q"],
  [d(2026, 11, 7), "TDS payment · Oct", "Income tax", "Upcoming", "tds-pay"],
  [d(2026, 11, 7), "ECB-2 return · Oct", "FEMA", "Upcoming", "ecb2"],
  [d(2026, 11, 10), "Professional tax · Oct", "Payroll", "Upcoming"],
  [d(2026, 11, 11), "GSTR-1 · Oct", "GST", "Upcoming", "gstr1"],
  [d(2026, 11, 15), "EPF ECR · Oct", "Payroll", "Upcoming", "pf-esi"],
  [d(2026, 11, 15), "ESI contribution · Oct", "Payroll", "Upcoming", "pf-esi"],
  [d(2026, 11, 20), "GSTR-3B · Oct", "GST", "Upcoming", "gstr3b"],
  [d(2026, 11, 28), "MGT-7 annual return", "MCA", "Upcoming", "mgt7"],
  [d(2026, 11, 30), "Softex · Oct", "FEMA", "Upcoming", "softex"],
];

const shortPeriod = (p: string) => p.replace(/ 2026$/, "").replace(/ 2026-27$/, "");

export const CALENDAR: CalendarEvent[] = [
  ...FILINGS.filter((f) => f.due >= d(2026, 9, 1) && f.due <= d(2026, 11, 30)).map((f) => ({
    id: `c-${f.id}`,
    date: f.due,
    title: `${f.form} · ${shortPeriod(f.period)}`,
    kind: f.area,
    status: f.status,
    obligationId: f.obligationId,
  })),
  ...EXTRA_EVENTS.map(([date, title, kind, status, obligationId], i) => ({ id: `c-x${i + 1}`, date, title, kind, status, obligationId })),
].sort((a, b) => a.date.getTime() - b.date.getTime());

export const CALENDAR_MONTHS = [
  { key: "2026-09", label: "September 2026", short: "Sep 2026", year: 2026, month: 8 },
  { key: "2026-10", label: "October 2026", short: "Oct 2026", year: 2026, month: 9 },
  { key: "2026-11", label: "November 2026", short: "Nov 2026", year: 2026, month: 10 },
];
