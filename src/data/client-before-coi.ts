import type { ThreadStep } from "@/components/cards/Thread";
import {
  ACTIVE_REGISTRATIONS,
  type ItemDoc,
  type Registration,
} from "./registrations";
import {
  AREA_REGULATOR,
  type Area,
  type Frequency,
  type Obligation,
} from "./compliance";

// Client portal before the certificate of incorporation (old Item.dc.html, state "none").
// Nothing is granted or filed yet. SBC starts each item the day the certificate arrives.

export const AFTER_COI = "After the certificate";

/** Sub line of the next step in the thread (old Item.dc.html: first step date 24 Oct, or 1 Nov for an obligation). */
export const REG_NEXT_BEFORE = "Expected 24 Oct";
export const OB_NEXT_BEFORE = "Expected 1 Nov";

/** "Prepared from" detail of an obligation before the certificate (old Item.dc.html). */
export const OB_PREPARED_BEFORE = "Tally export uploaded 3 Nov";

/** Past periods of an obligation as the old Item.dc.html shows them: period, filed on, reference, late. */
export const OB_PAST_BEFORE: Array<[string, string, string, boolean]> = [
  ["Sep 2026", "11 Oct 2026", "AA2910250913X", false],
  ["Aug 2026", "10 Sep 2026", "AA2909250811K", false],
  ["Jul 2026", "14 Aug 2026", "AA2908250722P", true],
];

const NOT_ASKED = "SBC will ask when this starts";

function upcomingSteps(steps: ThreadStep[]): ThreadStep[] {
  return steps.map((s) => ({
    id: s.id,
    title: s.title,
    state: "upcoming",
    // SBC does the step (right side of the thread) unless the authority does it.
    owner: s.owner === "client" || /^(Checked|Done|Filed) by /.test(s.by ?? "") ? "sbc" : s.owner,
  }));
}

function notAskedDocs(docs: ItemDoc[]): ItemDoc[] {
  return docs
    .filter((x) => x.from === "client")
    .map((x) => ({
      ...x,
      status: "Not asked yet",
      date: undefined,
      note: NOT_ASKED,
    }));
}

/** A registration as the client sees it before the certificate: "Not started", no number, no dates. */
export function regBefore(r: Registration): Registration {
  if (r.status === "Not needed") return r;
  return {
    ...r,
    status: "Not started",
    started: undefined,
    next: undefined,
    nextLabel: AFTER_COI,
    granted: undefined,
    owner: "sbc",
    idValue: undefined,
    steps: upcomingSteps(r.steps),
    docs: notAskedDocs(r.docs),
  };
}

/** An obligation as the client sees it before the certificate: "Upcoming", nothing filed. */
export function obBefore(o: Obligation): Obligation {
  // The first period after the certificate is October 2026 (old Item.dc.html).
  const monthly = o.frequency === "Monthly";
  const docs = notAskedDocs(o.docs).map((x) =>
    monthly ? { ...x, name: x.name.replace("September", "October") } : x,
  );
  return {
    ...o,
    period: monthly ? "Oct 2026" : o.period,
    needs: monthly
      ? o.needs.map((n) => n.replace("September", "October"))
      : o.needs,
    status: "Upcoming",
    owner: "sbc",
    filed: undefined,
    lastFiled: undefined,
    idValue: undefined,
    steps: upcomingSteps(o.steps),
    docs,
  };
}

export const REGISTRATIONS_BEFORE: Registration[] =
  ACTIVE_REGISTRATIONS.map(regBefore);

/* ---------- The old obligation list (reference/old-patch/shared/regcat.js, OB): 25 items ---------- */

type F = "m" | "q" | "h" | "a";
const FR: Record<F, Frequency> = {
  m: "Monthly",
  q: "Quarterly",
  h: "Half-yearly",
  a: "Annual",
};

/** Law to area (regcat.js LAWCAT). */
const LAW_AREA: Record<string, Area> = {
  GST: "GST",
  "Income tax": "Income tax",
  "EPF Act": "Payroll",
  "ESI Act": "Payroll",
  "Karnataka PT": "Payroll",
  "Karnataka LWF": "Payroll",
  "Companies Act": "MCA",
  FEMA: "FEMA",
  "Foreign trade": "FEMA",
  "POSH Act": "Labour",
  Municipal: "Labour",
  "Shops Act": "Labour",
};

/** Old id to the id of the same obligation in src/data/compliance.ts. Items without a match have no detail page. */
const LINK: Record<string, string> = {
  gstr1: "gstr1",
  gstr3b: "gstr3b",
  gstr9: "gstr9",
  tdsp: "tds-pay",
  tdsr: "tds-26q",
  adv: "adv-tax",
  ecr: "pf-esi",
  esim: "pf-esi",
  aoc4: "aoc4",
  mgt7: "mgt7",
  adt1: "adt1",
  dir3: "dir3kyc",
  dpt3: "dpt3",
  msme1: "msme1",
  fla: "fla",
  softex: "softex",
  posh: "posh",
  seren: "seren",
  lutren: "lutren",
};

// id, name, law, frequency, due rule, started by (registration id), penalty, from the client, steps.
type RawOld = [
  id: string,
  name: string,
  law: string,
  fr: F,
  due: string,
  by: string,
  pen: string,
  from: string[],
  steps: string[],
];

const OLD_OB: RawOld[] = [
  [
    "gstr1",
    "GSTR-1",
    "GST",
    "m",
    "11th of next month",
    "gst",
    "₹50 a day, up to ₹10,000",
    ["Sales register for October", "Credit and debit notes", "Export invoices"],
    ["Sales data received", "Reconciled", "Filed · ARN", "Acknowledged"],
  ],
  [
    "gstr3b",
    "GSTR-3B",
    "GST",
    "m",
    "20th of next month",
    "gst",
    "18% interest on the tax due, plus ₹50 a day",
    ["Purchase register for October", "Approval to pay the tax"],
    [
      "Purchase data received",
      "Matched with GSTR-2B",
      "Tax paid",
      "Filed",
      "Acknowledged",
    ],
  ],
  [
    "gstr9",
    "GSTR-9 annual return",
    "GST",
    "a",
    "31 Dec after the year",
    "gst",
    "₹200 a day, up to 0.5% of turnover",
    ["Year-end books"],
    ["Books received", "Prepared", "Filed", "Acknowledged"],
  ],
  [
    "tdsp",
    "TDS deposit",
    "Income tax",
    "m",
    "7th of next month",
    "",
    "1.5% interest a month",
    ["Vendor and salary payments with TDS for October"],
    ["Payments received", "TDS computed", "Paid", "Challan confirmed"],
  ],
  [
    "tdsr",
    "TDS return 24Q and 26Q",
    "Income tax",
    "q",
    "31 Jul, 31 Oct, 31 Jan, 31 May",
    "",
    "₹200 a day",
    ["Deductee details for the quarter"],
    ["Data received", "Prepared", "Filed", "Accepted", "Certificates issued"],
  ],
  [
    "adv",
    "Advance tax",
    "Income tax",
    "q",
    "15 Jun, 15 Sep, 15 Dec, 15 Mar",
    "",
    "1% interest a month (234B and 234C)",
    ["Estimated income for the year"],
    ["Estimate received", "Computed", "Paid"],
  ],
  [
    "ecr",
    "EPF ECR",
    "EPF Act",
    "m",
    "15th of next month",
    "epf",
    "5% to 15% a year by delay",
    ["Salary register for October"],
    ["Payroll received", "ECR filed", "Paid", "Confirmed"],
  ],
  [
    "esim",
    "ESI contribution",
    "ESI Act",
    "m",
    "15th of next month",
    "esi",
    "12% interest a year",
    ["Salary register for October"],
    ["Payroll received", "Contribution filed", "Paid"],
  ],
  [
    "ptm",
    "Professional tax · monthly",
    "Karnataka PT",
    "m",
    "10th of next month",
    "pt",
    "1.5% a month",
    ["Salary register by band"],
    ["Payroll received", "Paid", "Return filed"],
  ],
  [
    "pty",
    "Professional tax · yearly",
    "Karnataka PT",
    "a",
    "30 Apr",
    "pt",
    "1.5% a month",
    ["Company PT enrolment details"],
    ["Paid", "Receipt"],
  ],
  [
    "lwf",
    "Labour Welfare Fund",
    "Karnataka LWF",
    "a",
    "15 Jan",
    "lwf",
    "State penalty",
    ["Employee count on 31 Dec"],
    ["Count received", "Paid", "Receipt"],
  ],
  [
    "aoc4",
    "AOC-4 financial statements",
    "Companies Act",
    "a",
    "30 days after the AGM",
    "",
    "₹100 a day",
    ["Audited financial statements", "Board report"],
    ["Statements received", "Prepared", "Filed · SRN", "Approved by ROC"],
  ],
  [
    "mgt7",
    "MGT-7 annual return",
    "Companies Act",
    "a",
    "60 days after the AGM",
    "",
    "₹100 a day",
    ["Shareholder list", "Meeting dates"],
    ["Data received", "Prepared", "Filed", "Approved by ROC"],
  ],
  [
    "adt1",
    "ADT-1 auditor appointment",
    "Companies Act",
    "a",
    "15 days after the AGM",
    "",
    "₹100 a day",
    ["Auditor consent and certificate"],
    ["Consent received", "Filed", "Approved by ROC"],
  ],
  [
    "dir3",
    "DIR-3 KYC",
    "Companies Act",
    "a",
    "30 Sep, every 3 years",
    "",
    "₹5,000 to reactivate the DIN",
    ["Each director's mobile and email for OTP"],
    ["OTP received", "Filed", "Approved"],
  ],
  [
    "dpt3",
    "DPT-3 return of deposits",
    "Companies Act",
    "a",
    "30 Jun",
    "",
    "2 to 12 times the normal fee",
    ["Loans and deposits on 31 Mar"],
    ["Data received", "Filed", "Approved"],
  ],
  [
    "msme1",
    "MSME-1",
    "Companies Act",
    "h",
    "30 Apr and 31 Oct",
    "",
    "Fine up to ₹20,000, then ₹1,000 a day",
    ["MSME vendor dues over 45 days"],
    ["Vendor dues received", "Filed"],
  ],
  [
    "fla",
    "FLA return",
    "FEMA",
    "a",
    "15 Jul",
    "fcgpr",
    "Up to 300% of the amount, or ₹2 lakh",
    ["Foreign liabilities and assets on 31 Mar"],
    ["Data received", "Filed", "Acknowledged"],
  ],
  [
    "softex",
    "Softex form",
    "FEMA",
    "m",
    "30 days after the last invoice of the month",
    "nonstpi",
    "The bank may freeze the account",
    ["Export invoices for the month"],
    ["Invoices received", "Filed", "Certified by STPI"],
  ],
  [
    "posh",
    "POSH annual report",
    "POSH Act",
    "a",
    "Before 31 Jan",
    "posh",
    "₹50,000",
    ["Complaints received in the year (or none)"],
    ["Data received", "Report filed", "Acknowledged"],
  ],
  [
    "tlren",
    "Trade licence renewal",
    "Municipal",
    "a",
    "Before 31 Dec",
    "tl",
    "25% of the fee within 3 months, 50% after",
    ["Last licence"],
    ["Renewal filed", "Renewed"],
  ],
  [
    "seren",
    "Shops and Establishment renewal",
    "Shops Act",
    "a",
    "Before 1 Dec",
    "se",
    "25% in December, 50% after",
    ["Employee count"],
    ["Renewal filed", "Renewed"],
  ],
  [
    "lutren",
    "LUT renewal",
    "GST",
    "a",
    "31 Mar",
    "lut",
    "Tax on exports, refund later",
    ["Witness details"],
    ["Filed", "Acknowledged"],
  ],
  [
    "iecup",
    "IEC profile update",
    "Foreign trade",
    "a",
    "30 Jun",
    "iec",
    "₹200",
    ["Changes to company details"],
    ["Updated on DGFT"],
  ],
  [
    "tax3cd",
    "Tax audit (3CD)",
    "Income tax",
    "a",
    "31 Oct",
    "",
    "0.5% of turnover, up to ₹1,50,000",
    ["Audited books"],
    ["Books received", "Audit done", "Filed"],
  ],
];

/** The 25 obligations of the old client list, all "Upcoming" before the certificate (old counts 7, 2, 1, 15). */
export const OBLIGATIONS_BEFORE: Obligation[] = OLD_OB.map(
  ([id, name, law, fr, due, by, pen, from, steps]) => {
    const area = LAW_AREA[law];
    return {
      id,
      name,
      law,
      area,
      frequency: FR[fr],
      regulator: AREA_REGULATOR[area],
      due: new Date(2026, 10, 1),
      status: "Upcoming",
      owner: "sbc",
      form: name,
      period: fr === "m" ? "Oct 2026" : "FY 2026-27",
      dueRule: due,
      penalty: pen,
      startedBy: by || undefined,
      needs: from,
      steps: steps.map((t, i) => ({
        id: `${id}-s${i + 1}`,
        title: t,
        state: "upcoming",
        owner: "sbc",
      })),
      docs: from.map((t, i) => ({
        id: `${id}-d${i + 1}`,
        name: t,
        type: "PDF",
        from: "client",
        fromLabel: "Northwind",
        status: "Not asked yet",
        note: NOT_ASKED,
      })),
      by: "Bharath",
    };
  },
);

/** Detail page id for an old list item, or undefined when the item has no page yet. */
export const beforeObLink = (id: string): string | undefined => LINK[id];
