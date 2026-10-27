import { d, fmt } from "@/lib/dates";
import type { ChipTone, Owner } from "@/components/ui/Chip";
import type { FileType } from "@/components/ui/FileBadge";
import type { ThreadStep } from "@/components/cards/Thread";

// Ported from reference/old-patch/shared/regcat.js (REG and CLIENT). Dates moved to sit around TODAY (6 Oct 2026).

export type Regulator = "GST" | "MCA" | "IT" | "Labour" | "IP" | "FEMA" | "Other";

export const REGULATOR_LABEL: Record<Regulator, string> = {
  GST: "GST",
  MCA: "MCA",
  IT: "Income tax",
  Labour: "Labour",
  IP: "IP",
  FEMA: "FEMA",
  Other: "Other",
};

/** Category tag tone (RULES.md: teal GST, violet MCA). */
export const REGULATOR_TONE: Record<Regulator, ChipTone> = {
  GST: "teal",
  MCA: "violet",
  IT: "prog",
  Labour: "warn",
  IP: "violet",
  FEMA: "ok",
  Other: "idle",
};

export type RegStatus = "Granted" | "In progress" | "Waiting on client" | "Not started" | "Not needed";

export const REG_STATUS_TONE: Record<RegStatus, ChipTone> = {
  Granted: "ok",
  "In progress": "prog",
  "Waiting on client": "warn",
  "Not started": "idle",
  "Not needed": "idle",
};

export type DocStatus = "Accepted" | "To review" | "Asked" | "Sent back" | "Pending" | "Not asked yet";

export const DOC_STATUS_TONE: Record<DocStatus, ChipTone> = {
  Accepted: "ok",
  "To review": "prog",
  Asked: "warn",
  "Sent back": "bad",
  Pending: "idle",
  "Not asked yet": "idle",
};

/** A document on a registration, obligation or step page. */
export interface ItemDoc {
  id: string;
  name: string;
  type: FileType;
  from: Owner;
  fromLabel?: string;
  status: DocStatus;
  date?: Date;
  note?: string;
}

export interface Registration {
  id: string;
  name: string;
  regulator: Regulator;
  /** Issuing body: GSTN, EPFO, DGFT. */
  authority: string;
  form: string;
  team: string;
  about: string;
  /** When the law asks for it. */
  rule: string;
  /** Why it applies to Northwind. */
  why: string;
  status: RegStatus;
  started?: Date;
  /** The next date that matters: expected grant, documents due, renewal or start. */
  next?: Date;
  /** "Expected 12 Oct", "Granted 24 Sep", "Starts 1 Dec". */
  nextLabel?: string;
  granted?: Date;
  owner: Owner;
  idLabel?: string;
  idValue?: string;
  steps: ThreadStep[];
  docs: ItemDoc[];
  renewal: string;
  /** Obligation ids in src/data/compliance.ts that this registration starts. */
  obligations: string[];
  /** SBC person on it. */
  by: string;
  typical: string;
}

type Side = "s" | "a";

interface Raw {
  id: string;
  name: string;
  regulator: Regulator;
  authority: string;
  form: string;
  team: string;
  about: string;
  rule: string;
  why: string;
  docs: string[];
  steps: Array<[Side, string]>;
  renewal: string;
  obligations: string[];
  status: RegStatus;
  done: number;
  started?: Date;
  next?: Date;
  granted?: Date;
  idLabel?: string;
  idValue?: string;
  by?: string;
  typical: string;
}

const RAW: Raw[] = [
  {
    id: "gst", name: "GST registration", regulator: "GST", authority: "GSTN", form: "GST REG-01", team: "Indirect Tax Team",
    about: "A tax identity for the business. Once registered, it can charge GST, claim input tax credit and file GST returns.",
    rule: "Turnover above ₹40 lakh (goods) or ₹20 lakh (services), or exports", why: "Exports services to the parent",
    docs: ["Company PAN", "Certificate of incorporation", "MOA and AOA", "Board resolution naming the signatory", "Signatory PAN, Aadhaar and photo", "Office electricity bill", "Rent agreement", "Owner's NOC", "Cancelled cheque"],
    steps: [["s", "Documents received"], ["s", "Part A filed · TRN"], ["s", "Part B filed · ARN"], ["a", "Clarification asked (REG-03)"], ["s", "Reply filed (REG-04)"], ["a", "Approved · certificate (REG-06)"]],
    renewal: "None", obligations: ["gstr1", "gstr3b", "gstr9", "itc04"], status: "Granted", done: 6, started: d(2026, 9, 12), granted: d(2026, 9, 24),
    idLabel: "GSTIN", idValue: "29AAKCN4821M1Z5", typical: "7–10 working days",
  },
  {
    id: "lut", name: "Letter of undertaking (LUT)", regulator: "GST", authority: "GSTN", form: "GST RFD-11", team: "Indirect Tax Team",
    about: "Lets an exporter export without paying IGST first, so working capital is not blocked.",
    rule: "Exports of goods or services", why: "Exports services",
    docs: ["GST registration certificate", "Signatory authorisation"],
    steps: [["s", "Details received"], ["s", "Filed on the GST portal"], ["a", "Acknowledged"]],
    renewal: "Every year by 31 Mar", obligations: ["lutren"], status: "Granted", done: 3, started: d(2026, 9, 25), granted: d(2026, 9, 28), next: d(2027, 3, 31),
    idLabel: "ARN", idValue: "AD290926004471L", typical: "1–2 working days",
  },
  {
    id: "pt", name: "Professional tax", regulator: "Other", authority: "Karnataka CTD", form: "PTRC and PTEC", team: "Payroll and Compliance Team",
    about: "A state tax on salaries. The employer registers, deducts it every month and pays it to the state.",
    rule: "Any employee in Karnataka", why: "12 employees in Karnataka",
    docs: ["Company PAN", "Certificate of incorporation", "Office address proof", "Director ID"],
    steps: [["s", "Documents received"], ["s", "Applied on the state portal"], ["a", "Numbers allotted"], ["a", "Certificates issued"]],
    renewal: "PTEC payment every year by 30 Apr", obligations: [], status: "In progress", done: 2, started: d(2026, 9, 28), next: d(2026, 10, 12),
    idLabel: "PTRC number", typical: "5–7 working days",
  },
  {
    id: "icegate", name: "ICEGATE", regulator: "Other", authority: "CBIC", form: "ICEGATE sign-up", team: "Finance and Compliance Team",
    about: "The customs portal account an importer or exporter of goods needs to file shipping documents.",
    rule: "Imports or exports of goods", why: "No goods imported or exported",
    docs: ["IEC certificate", "DSC of the signatory"], steps: [["s", "Documents received"], ["s", "Applied"], ["a", "ID issued"]],
    renewal: "None", obligations: [], status: "Not needed", done: 0, typical: "3–5 working days",
  },
  {
    id: "epf", name: "EPF registration", regulator: "Labour", authority: "EPFO", form: "Shram Suvidha", team: "Payroll and Compliance Team",
    about: "Retirement savings for employees. Employer and employee each pay 12% of basic salary every month.",
    rule: "20 or more employees (voluntary below 20)", why: "Voluntary at 12 employees",
    docs: ["Company PAN", "Certificate of incorporation", "Cancelled cheque", "Office address proof", "Director KYC", "Employer DSC (class III)"],
    steps: [["s", "Documents received"], ["s", "Applied on Shram Suvidha"], ["s", "DSC registered"], ["a", "Code allotted"], ["a", "Certificate issued"]],
    renewal: "None", obligations: ["pf-esi"], status: "Granted", done: 5, started: d(2026, 9, 16), granted: d(2026, 9, 25),
    idLabel: "Establishment code", idValue: "KNBNG2954118000", typical: "5–7 working days",
  },
  {
    id: "esi", name: "ESI registration", regulator: "Labour", authority: "ESIC", form: "ESIC employer form", team: "Payroll and Compliance Team",
    about: "Medical, sickness and maternity cover for employees earning up to ₹21,000 a month.",
    rule: "10 or more employees", why: "12 employees (from 10)",
    docs: ["Company PAN", "Certificate of incorporation", "Cancelled cheque", "Office address proof", "Signatory PAN and Aadhaar"],
    steps: [["s", "Documents received"], ["s", "Applied on the ESIC portal"], ["a", "Code allotted"], ["a", "Certificate (C-11)"]],
    renewal: "None", obligations: ["pf-esi"], status: "Granted", done: 4, started: d(2026, 9, 18), granted: d(2026, 9, 28),
    idLabel: "Employer code", idValue: "53001234560001001", typical: "3–5 working days",
  },
  {
    id: "se", name: "Shops and Establishment", regulator: "Labour", authority: "Karnataka Labour Dept", form: "Form A", team: "HR and Compliance Team",
    about: "The first labour registration for an office. It gives the establishment legal recognition in the state.",
    rule: "Every office or shop with employees", why: "Office with employees",
    docs: ["Office address proof", "Rent agreement", "Photo of the premises", "Employer ID"],
    steps: [["s", "Documents received"], ["s", "Applied on the labour portal"], ["a", "Inspection (if any)"], ["a", "Certificate issued"]],
    renewal: "Before 1 Dec each year", obligations: ["seren"], status: "Waiting on client", done: 0, started: d(2026, 9, 30), next: d(2026, 10, 9),
    idLabel: "Registration number", typical: "7–10 working days",
  },
  {
    id: "clra", name: "CLRA registration", regulator: "Labour", authority: "Labour Dept", form: "Form I", team: "HR, Legal and Compliance Team",
    about: "For principal employers that use contract labour. The employer stays responsible for the contractors' workers.",
    rule: "50 or more contract workers", why: "No contract labour",
    docs: ["Company PAN", "GST certificate", "Shops registration", "Contractor agreement"], steps: [["s", "Applicability checked"], ["s", "Applied"], ["a", "Certificate issued"]],
    renewal: "As applicable", obligations: [], status: "Not needed", done: 0, typical: "10–15 working days",
  },
  {
    id: "posh", name: "POSH compliance", regulator: "Labour", authority: "District officer", form: "Annual report", team: "HR and Legal Team",
    about: "A safe workplace for women: a policy, an Internal Committee with an external member, and a yearly report.",
    rule: "10 or more employees", why: "12 employees (from 10)",
    docs: ["POSH policy (signed)", "Internal Committee order", "External member consent"],
    steps: [["s", "Policy drafted"], ["s", "Committee constituted"], ["s", "Awareness session held"], ["a", "Annual report filed"]],
    renewal: "Annual report before 31 Jan", obligations: ["posh"], status: "In progress", done: 1, started: d(2026, 10, 1), next: d(2026, 10, 20),
    typical: "2–3 weeks",
  },
  {
    id: "lwf", name: "Labour Welfare Fund", regulator: "Labour", authority: "Karnataka LWF Board", form: "Form D", team: "HR and Payroll Team",
    about: "A small state welfare contribution from employer and employee. In Karnataka it is paid once a year.",
    rule: "Employees in a state with LWF", why: "Employees in Karnataka",
    docs: ["Company PAN", "Shops registration", "Employee list"], steps: [["s", "Applicability checked"], ["s", "Registered"], ["a", "Confirmed"]],
    renewal: "Yearly by 15 Jan", obligations: [], status: "Not started", done: 0, next: d(2026, 12, 1), typical: "3–5 working days",
  },
  {
    id: "msme", name: "MSME (Udyam)", regulator: "Other", authority: "Ministry of MSME", form: "Udyam", team: "Finance and Compliance Team",
    about: "A free registration that gives the company MSME benefits, such as protection against late payment by buyers.",
    rule: "Not yet Udyam registered", why: "Not yet Udyam registered",
    docs: ["Director Aadhaar", "Company PAN"], steps: [["s", "Details received"], ["s", "Filed"], ["a", "Certificate issued"]],
    renewal: "Update every year", obligations: ["msme1"], status: "Granted", done: 3, started: d(2026, 9, 21), granted: d(2026, 9, 22),
    idLabel: "Udyam number", idValue: "UDYAM-KR-03-0123456", typical: "1 working day",
  },
  {
    id: "iec", name: "Import Export Code (IEC)", regulator: "Other", authority: "DGFT", form: "ANF-2A", team: "Finance and Compliance Team",
    about: "A one-time 10-digit code from DGFT. A company needs it to import or export goods and services.",
    rule: "Imports or exports", why: "Exports services",
    docs: ["Company PAN", "Office address proof", "Bank certificate or cancelled cheque"],
    steps: [["s", "Documents received"], ["s", "Applied on DGFT"], ["a", "Verification"], ["a", "IEC allotted"]],
    renewal: "Update every year (April to June)", obligations: [], status: "In progress", done: 2, started: d(2026, 9, 30), next: d(2026, 10, 14),
    idLabel: "IEC number", typical: "3–5 working days",
  },
  {
    id: "lei", name: "Legal Entity Identifier (LEI)", regulator: "Other", authority: "LEIL", form: "LEI application", team: "Finance and Treasury Team",
    about: "A 20-character global ID that banks ask for on large or cross-border transactions.",
    rule: "Large-value bank transactions", why: "Parent remittances through HDFC",
    docs: ["Company PAN", "Certificate of incorporation", "Board resolution"], steps: [["s", "Documents received"], ["s", "Applied"], ["a", "Validated"], ["a", "LEI issued"]],
    renewal: "Every year by 30 Jun", obligations: [], status: "Not started", done: 0, next: d(2026, 12, 1), typical: "3–5 working days",
  },
  {
    id: "tl", name: "Trade licence", regulator: "Other", authority: "BBMP", form: "Trade licence", team: "Legal and Compliance Team",
    about: "Municipal permission to run the business from this address.",
    rule: "Every business premises (local rule)", why: "Office in Bengaluru",
    docs: ["Company PAN", "GST certificate", "Shops registration", "Rent agreement", "Electricity bill"],
    steps: [["s", "Documents received"], ["s", "Applied on the BBMP portal"], ["a", "Inspection (if any)"], ["a", "Licence issued"]],
    renewal: "Before 31 Dec each year", obligations: [], status: "Not started", done: 0, next: d(2026, 12, 1), typical: "10–15 working days",
  },
  {
    id: "nonstpi", name: "Non-STPI registration", regulator: "Other", authority: "STPI", form: "Non-STPI form", team: "Finance and Compliance Team",
    about: "For IT and ITES exporters outside an STPI park. The bank and RBI use it to track software export receipts.",
    rule: "IT or ITES exports outside STPI", why: "IT exports outside STPI",
    docs: ["Certificate of incorporation", "IEC", "GST certificate", "Board resolution"],
    steps: [["s", "Documents received"], ["s", "Application filed"], ["a", "Verification"], ["a", "Approved"]],
    renewal: "None", obligations: ["softex"], status: "Not started", done: 0, next: d(2026, 12, 1), typical: "7–10 working days",
  },
  {
    id: "tm", name: "Trademark registration", regulator: "IP", authority: "IP India", form: "TM-A", team: "Legal and Secretarial Team",
    about: "Protects the brand name or logo, so no one else can use it for the same goods or services.",
    rule: "A brand name to protect", why: "Brand NORTHWIND, classes 9 and 42",
    docs: ["Logo file", "User affidavit (if used before)", "Power of attorney (TM-48)"],
    steps: [["s", "Search and class check"], ["s", "Application filed"], ["a", "Examination report"], ["s", "Reply to objection"], ["a", "Published in journal"], ["a", "Registered"]],
    renewal: "Every 10 years", obligations: [], status: "In progress", done: 3, started: d(2026, 9, 8), next: d(2026, 10, 20),
    idLabel: "Application number", idValue: "7184420", by: "Pranay", typical: "12–18 months",
  },
  {
    id: "patent", name: "Patent", regulator: "IP", authority: "IP India", form: "Form 1", team: "Legal and Secretarial Team",
    about: "Protects an invention for 20 years.", rule: "An invention to protect", why: "No invention to protect",
    docs: ["Invention disclosure"], steps: [["s", "Disclosure received"], ["s", "Filed"], ["a", "Examination"], ["a", "Granted"]],
    renewal: "Yearly fee", obligations: [], status: "Not needed", done: 0, typical: "2–4 years",
  },
  {
    id: "fcgpr", name: "FC-GPR", regulator: "FEMA", authority: "RBI · FIRMS", form: "FC-GPR", team: "Legal and Secretarial Team",
    about: "Reports shares issued to a foreign investor to RBI, within 30 days of allotment.",
    rule: "Foreign investment received", why: "Shares allotted to Northwind KK",
    docs: ["FIRC and bank KYC for each investor", "Allotment board resolution", "Valuation certificate", "CS certificate"],
    steps: [["s", "Documents received"], ["s", "Filed on FIRMS"], ["a", "RBI review"], ["a", "Acknowledged"]],
    renewal: "Each allotment", obligations: ["fla"], status: "Waiting on client", done: 0, started: d(2026, 10, 2), next: d(2026, 10, 21),
    idLabel: "Entity master number", idValue: "EM-2026-118822", by: "Pranay", typical: "5–7 working days",
  },
  {
    id: "fla", name: "FLA return", regulator: "FEMA", authority: "RBI · FLAIR", form: "FLA", team: "Finance and Compliance Team",
    about: "A yearly report to RBI of foreign liabilities and assets.", rule: "Foreign assets or liabilities", why: "Foreign investment",
    docs: ["Audited balance sheet (or provisional)"], steps: [["s", "Data received"], ["s", "Filed"], ["a", "Acknowledged"]],
    renewal: "Every year by 15 Jul", obligations: ["fla"], status: "Not started", done: 0, next: d(2027, 7, 15), typical: "2–3 working days",
  },
  {
    id: "fctrs", name: "FC-TRS", regulator: "FEMA", authority: "RBI · FIRMS", form: "FC-TRS", team: "Legal and Secretarial Team",
    about: "Reports a share transfer between a resident and a non-resident.", rule: "Share transfer with a non-resident", why: "No share transfer",
    docs: ["Share transfer deed", "Valuation certificate"], steps: [["s", "Documents received"], ["s", "Filed"], ["a", "Acknowledged"]],
    renewal: "Each transfer", obligations: [], status: "Not needed", done: 0, typical: "5–7 working days",
  },
  {
    id: "odi", name: "ODI", regulator: "FEMA", authority: "RBI · AD bank", form: "Form ODI", team: "Legal and Secretarial Team",
    about: "Approval to invest outside India.", rule: "Investment outside India", why: "No overseas investment",
    docs: ["Board resolution", "Valuation report"], steps: [["s", "Documents received"], ["s", "Filed through the bank"], ["a", "UIN allotted"]],
    renewal: "Annual performance report", obligations: [], status: "Not needed", done: 0, typical: "7–10 working days",
  },
];

const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

/** Guess a file type from a document name. */
export function docType(name: string): FileType {
  const n = name.toLowerCase();
  if (/(photo|logo|picture)/.test(n)) return "PNG";
  if (/(register|list|sheet|employees)/.test(n)) return "XLSX";
  if (/(policy|draft|resolution|order|affidavit)/.test(n)) return "DOCX";
  return "PDF";
}

function buildSteps(r: Raw): ThreadStep[] {
  const lead = r.by ?? "Bharath";
  const start = r.started ?? r.next;
  const total = r.steps.length;
  const done = r.status === "Granted" ? total : r.done;
  const span = r.granted && r.started ? Math.max(1, Math.round((r.granted.getTime() - r.started.getTime()) / 86400000)) : 3 * total;
  return r.steps.map(([side, label], i): ThreadStep => {
    const id = `${r.id}-s${i + 1}`;
    if (i < done) {
      const date = start ? (i === total - 1 && r.granted ? r.granted : addDays(start, Math.round((span / total) * i))) : undefined;
      return { id, title: label, state: "done", date, by: side === "a" ? r.authority : i === 0 ? `Checked by ${lead}` : `Filed by ${lead}` };
    }
    if (i === done && r.status === "Waiting on client") {
      return { id, title: label, state: "current", owner: "client", date: start, by: "Waiting on Northwind", note: start ? `Documents asked on ${fmt(start)}` : undefined };
    }
    if (i === done && r.status === "In progress") {
      return { id, title: label, state: "current", owner: side === "a" ? undefined : "sbc", by: side === "a" ? `With ${r.authority}` : lead };
    }
    return { id, title: label, state: "upcoming", owner: side === "a" ? undefined : "sbc" };
  });
}

function buildDocs(r: Raw): ItemDoc[] {
  const docs = r.docs.map((name, i): ItemDoc => {
    let status: DocStatus = "Not asked yet";
    if (r.status === "Granted" || r.status === "In progress") status = "Accepted";
    if (r.status === "Waiting on client") status = i < 2 ? "Accepted" : i === 2 ? "To review" : "Asked";
    const date = status === "Not asked yet" || status === "Asked" ? undefined : r.started ? addDays(r.started, Math.min(i, 2)) : undefined;
    return { id: `${r.id}-d${i + 1}`, name, type: docType(name), from: "client", fromLabel: "Northwind", status, date };
  });
  if (r.status === "Granted" && r.granted) {
    docs.unshift({ id: `${r.id}-cert`, name: `${r.name} certificate`, type: "PDF", from: "sbc", fromLabel: r.authority, status: "Accepted", date: r.granted });
  }
  return docs;
}

function nextLabel(r: Raw): string | undefined {
  if (r.status === "Granted") return r.next ? `Renews ${fmt(r.next)}` : r.granted ? `Granted ${fmt(r.granted)}` : undefined;
  if (!r.next) return undefined;
  if (r.status === "In progress") return `Expected ${fmt(r.next)}`;
  if (r.status === "Waiting on client") return `Documents by ${fmt(r.next)}`;
  if (r.status === "Not started") return `Starts ${fmt(r.next)}`;
  return undefined;
}

export const REGISTRATIONS: Registration[] = RAW.map((r) => ({
  id: r.id,
  name: r.name,
  regulator: r.regulator,
  authority: r.authority,
  form: r.form,
  team: r.team,
  about: r.about,
  rule: r.rule,
  why: r.why,
  status: r.status,
  started: r.started,
  next: r.next,
  nextLabel: nextLabel(r),
  granted: r.granted,
  owner: r.status === "Waiting on client" ? "client" : "sbc",
  idLabel: r.idLabel,
  idValue: r.idValue,
  steps: buildSteps(r),
  docs: buildDocs(r),
  renewal: r.renewal,
  obligations: r.obligations,
  by: r.by ?? "Bharath",
  typical: r.typical,
}));

/** Registrations that apply to Northwind (not "Not needed"). */
export const ACTIVE_REGISTRATIONS = REGISTRATIONS.filter((r) => r.status !== "Not needed");

export function registration(id: string) {
  return REGISTRATIONS.find((r) => r.id === id);
}

export const regHref = (portal: string, id: string) => (portal === "client" ? `/client/registrations/${id}` : `/${portal}/registrations/${id}`);
