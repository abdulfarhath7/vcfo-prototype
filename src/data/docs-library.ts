import { d } from "@/lib/dates";
import { FILES, BOOKS, type DocFile } from "@/data/shared";

/* ---------- Documents explorer (docs_a_refined) ---------- */

export type DocCategory = "kyc" | "office" | "records" | "certs" | "capital";

export const DOC_CATEGORIES: Array<{ id: DocCategory; name: string }> = [
  { id: "kyc", name: "Identity and KYC" },
  { id: "office", name: "Office address" },
  { id: "records", name: "Company records" },
  { id: "certs", name: "Certificates" },
  { id: "capital", name: "Banking and capital" },
];

export interface DocItem extends DocFile {
  /** Name without the extension: "Director 1 - passport". */
  label: string;
  /** File name on disk, IBM Plex Mono (R-28). */
  fileName: string;
  category: DocCategory;
  /** Who sent it or who asked for it. */
  by?: string;
  /** A newer file replaced this one. Hidden unless "Replaced" is on. */
  replaced?: boolean;
  /** Address proof older than 2 months. */
  stale?: boolean;
  /** SBC note on a file it sent back. */
  note?: string;
  /** Government portal that can verify the file. */
  portal?: { label: string; href: string };
  /** Only after incorporation. */
  after?: boolean;
  /** Pages in the sample preview. */
  pages?: number;
}

const META: Record<string, Omit<DocItem, keyof DocFile | "label">> = {
  f1: { fileName: "director1-passport.jpg", category: "kyc", by: "Rohan Kumar", note: "Scan is not legible. Send a clear colour scan of both pages." },
  f2: { fileName: "director2-passport.jpg", category: "kyc", by: "Meera Iyer" },
  f3: { fileName: "director1-pan.pdf", category: "kyc", by: "Rohan Kumar", portal: { label: "Income-tax e-Filing", href: "https://www.incometax.gov.in" } },
  f4: { fileName: "director2-pan.pdf", category: "kyc", by: "Meera Iyer", portal: { label: "Income-tax e-Filing", href: "https://www.incometax.gov.in" } },
  f5: { fileName: "director-kyc-bundle.zip", category: "kyc", by: "Rohan Kumar" },
  f6: { fileName: "draft-board-resolution-v2.docx", category: "records", by: "Bharath" },
  f7: { fileName: "board-resolution-signed.pdf", category: "records", by: "Rohan Kumar", pages: 2 },
  f8: { fileName: "name-approval-letter.pdf", category: "certs", by: "MCA", portal: { label: "MCA portal", href: "https://www.mca.gov.in" } },
  f9: { fileName: "capital-structure.xlsx", category: "capital", by: "Bharath" },
  f10: { fileName: "subscriber-sheet.pdf", category: "records", by: "Bharath" },
  f11: { fileName: "-", category: "office", by: "Asked by Bharath" },
  f12: { fileName: "-", category: "office", by: "Asked by Bharath" },
  f13: { fileName: "-", category: "office", by: "Asked by Bharath" },
  f14: { fileName: "-", category: "records", by: "Bharath drafts it" },
  f15: { fileName: "office-front.png", category: "office", by: "Rohan Kumar" },
};

const BASE: DocItem[] = FILES.map((f) => ({ ...f, label: f.name.replace(/\.[a-z0-9]+$/i, ""), ...META[f.id] }));

/** Files the explorer adds to the shared sample: replaced, stale, and after-incorporation files. */
const EXTRA: DocItem[] = [
  { id: "f16", name: "Director 1 - address proof.pdf", label: "Director 1 - address proof", fileName: "electricity-bill-aug.pdf", type: "PDF", size: "340 KB", date: d(2026, 9, 15), from: "client", status: "Verified", step: 8, folder: "kyc", category: "kyc", by: "Rohan Kumar", stale: true },
  { id: "f17", name: "Director 1 - address proof (June bill).pdf", label: "Director 1 - address proof (June bill)", fileName: "electricity-bill-jun.pdf", type: "PDF", size: "310 KB", date: d(2026, 9, 2), from: "client", status: "Verified", step: 8, folder: "kyc", category: "kyc", by: "Rohan Kumar", replaced: true },
  { id: "f18", name: "Draft Board resolution (v1).docx", label: "Draft Board resolution (v1)", fileName: "draft-board-resolution-v1.docx", type: "DOCX", size: "49 KB", date: d(2026, 9, 12), from: "sbc", status: "Verified", step: 2, folder: "inc-1", category: "records", by: "Bharath", replaced: true },
  { id: "a1", name: "Certificate of Incorporation.pdf", label: "Certificate of Incorporation", fileName: "COI-Northwind.pdf", type: "PDF", size: "220 KB", date: d(2026, 10, 28), from: "mca", status: "Verified", step: 14, folder: "inc-2", category: "certs", by: "MCA", portal: { label: "MCA portal", href: "https://www.mca.gov.in" }, after: true, pages: 2 },
  { id: "a2", name: "MoA and AoA (stamped).pdf", label: "MoA and AoA (stamped)", fileName: "moa-aoa-northwind.pdf", type: "PDF", size: "1.1 MB", date: d(2026, 10, 28), from: "mca", status: "Verified", step: 14, folder: "inc-2", category: "records", by: "MCA", portal: { label: "MCA portal", href: "https://www.mca.gov.in" }, after: true, pages: 14 },
  { id: "a3", name: "First Board meeting minutes.pdf", label: "First Board meeting minutes", fileName: "board-minutes-01.pdf", type: "PDF", size: "180 KB", date: d(2026, 10, 30), from: "sbc", status: "Received", step: 15, folder: "inc-3", category: "records", by: "Bharath", after: true, pages: 3 },
  { id: "a4", name: "FIRC from the bank.pdf", label: "FIRC from the bank", fileName: "-", type: "PDF", size: "", date: d(2026, 11, 20), from: "client", status: "Requested", step: 18, folder: "inc-3", category: "capital", by: "Asked by Bharath", after: true },
];

/**
 * Documents for one client state. After incorporation, the open requests of phases 1 and 2 are verified,
 * and the phase 3 files appear.
 */
export function docsFor(incorporated: boolean): DocItem[] {
  if (!incorporated) return [...BASE, ...EXTRA.filter((x) => !x.after)];
  return [...BASE.map((x) => (x.status === "Requested" || x.status === "Sent back" ? { ...x, status: "Verified" as const, fileName: x.fileName === "-" ? x.name.toLowerCase().replace(/\s+/g, "-") : x.fileName, size: x.size || "240 KB" } : x)), ...EXTRA];
}

/** Every file id the viewer can open, in both states. */
export const ALL_DOCS: DocItem[] = [...BASE, ...EXTRA];

/** Home cards link to /documents/view/d1 … d6. */
export const DOC_ALIAS: Record<string, string> = { d1: "f1", d2: "f8", d3: "f7", d4: "f6", d5: "f9", d6: "f5" };

export function findDoc(id: string): DocItem {
  const key = DOC_ALIAS[id] ?? id;
  return ALL_DOCS.find((x) => x.id === key) ?? ALL_DOCS[0];
}

/** Types the viewer can draw. Others show "Preview not available". */
export const PREVIEWABLE = new Set(["PDF", "JPG", "PNG"]);

/* ---------- Library (lib_shelf_a, lib_reader) ---------- */

export type LibCategory = "Incorporation" | "Foreign investment" | "Tax" | "Compliance" | "Northwind’s project" | "SBC SOPs";

export const LIB_CATEGORIES: Array<{ id: LibCategory; short: string; tone: "blue" | "violet" | "amber" | "green" | "teal" }> = [
  { id: "Incorporation", short: "Incorporation", tone: "blue" },
  { id: "Foreign investment", short: "Foreign inv.", tone: "violet" },
  { id: "Tax", short: "Tax", tone: "amber" },
  { id: "Compliance", short: "Compliance", tone: "green" },
  { id: "Northwind’s project", short: "Northwind", tone: "blue" },
  { id: "SBC SOPs", short: "SBC SOPs", tone: "teal" },
];

export interface LibBook {
  id: string;
  title: string;
  cat: LibCategory;
  short: string;
  /** Updated since the client last read it. */
  updated?: boolean;
  minutes: number;
  date: Date;
  body: string[];
}

const fromShared = (id: string) => BOOKS.find((b) => b.id === id);

const RAW_LIB: Array<[string, LibCategory, string, string, number, string[]?, boolean?]> = [
  ["b1", "Incorporation", "What is SPICe+?", "The one MCA form that incorporates a company", 3],
  ["l2", "Incorporation", "Why the board resolution needs an apostille", "Foreign parent company documents", 2, ["A board resolution signed abroad must carry an apostille from the country where it was signed.", "SBC checks the apostille number before it files SPICe+."]],
  ["l3", "Incorporation", "DSC and DIN for foreign directors", "Signatures and director numbers", 3, ["A foreign director needs a Class 3 DSC and a DIN.", "The DIN comes with SPICe+ Part B. The DSC needs a video KYC."]],
  ["l4", "Incorporation", "Rules for the company name", "What MCA accepts and refuses", 2, ["The name must not match an existing company or trademark.", "It must end with Private Limited and describe the business."]],
  ["b3", "Foreign investment", "FC-GPR after share allotment", "When a foreign investor subscribes", 3, undefined, true],
  ["l6", "Foreign investment", "FDI: automatic or approval route", "Which route applies to Northwind", 3, ["Software services fall under the automatic route up to 100%.", "No government approval is needed before the investment."]],
  ["l7", "Foreign investment", "What a FIRC proves", "The bank's proof of foreign money", 2, ["The FIRC shows that the share money came from abroad through banking channels.", "The AD bank issues it. SBC needs it for FC-GPR."]],
  ["b4", "Tax", "When do I need GST registration?", "Thresholds and exports", 3, ["Register for GST when turnover passes ₹20 lakh, or before the first export of services.", "SBC applies on the GST portal. The GSTIN comes in 3 to 7 working days."]],
  ["b5", "Tax", "TDS basics for a new company", "Sections, rates and dates", 4],
  ["l10", "Tax", "LUT for export of services", "Export without paying IGST", 2, ["A Letter of Undertaking lets Northwind export services without paying IGST.", "File it on the GST portal before the first export invoice, once a year."]],
  ["l11", "Compliance", "Commencement of business (INC-20A)", "Due within 180 days of incorporation", 2, ["INC-20A declares that the subscribers paid for their shares.", "File it within 180 days of incorporation. The company cannot start business before it."]],
  ["l12", "Compliance", "Auditor appointment (ADT-1)", "The first auditor", 2, ["The board appoints the first auditor within 30 days of incorporation.", "SBC files ADT-1 within 15 days of the appointment."]],
  ["l13", "Compliance", "Northwind’s first-year filing calendar", "Every due date for FY 2026-27", 3, ["The calendar lists every monthly, quarterly and annual filing for the first year.", "Compliances shows the same dates with their status."]],
  ["b2", "Northwind’s project", "What happens after the COI?", "The 11 post-incorporation steps", 4],
  ["b8", "Northwind’s project", "Reading Northwind’s monthly status brief", "September 2026", 2],
  ["b9", "SBC SOPs", "Trademark registration", "Classes 9, 35 and 42", 3],
  ["b6", "SBC SOPs", "EPF registration", "PF from the first employee", 2, ["Register with EPFO when the company employs 20 people, or earlier by choice.", "SBC files ECR and payment by the 15th of each month."]],
  ["l18", "SBC SOPs", "ESI registration", "Health cover for employees", 2, ["Register for ESI when 10 or more people earn up to ₹21,000 a month.", "Payment is due by the 15th of the next month."]],
  ["l19", "SBC SOPs", "GST registration", "Documents and steps", 3, ["SBC needs the PAN, the COI, the office proof and a director photo.", "The application goes on the GST portal with Aadhaar authentication."]],
  ["l20", "SBC SOPs", "CLRA registration", "Contract labour", 2, ["Register under CLRA when 20 or more contract workers work on site."]],
  ["l21", "SBC SOPs", "IEC registration", "Import Export Code", 2, ["The DGFT issues the IEC online against the company PAN.", "Software exporters need it for STPI and SEZ benefits."]],
  ["l22", "SBC SOPs", "Labour Welfare Fund", "Telangana contribution", 1, ["Employer and employee pay a small yearly amount to the welfare board by 31 January."]],
  ["l23", "SBC SOPs", "Legal Entity Identifier", "The LEI code for bank transfers", 1, ["Banks ask for an LEI for large foreign transfers. It renews every year."]],
  ["l24", "SBC SOPs", "Letter of undertaking", "Yearly LUT filing", 1, ["File the LUT on the GST portal before 31 March for the next year."]],
  ["l25", "SBC SOPs", "Non-STPI registration", "Software exports outside STPI", 2, ["A software exporter outside STPI reports its exports through SOFTEX forms."]],
  ["l26", "SBC SOPs", "POSH compliance", "Internal committee and annual report", 2, ["A company with 10 or more employees sets up an internal committee.", "It files a yearly report with the district officer."]],
  ["l27", "SBC SOPs", "Professional tax", "State tax on salaries", 1, ["Deduct professional tax from salaries and pay it by the 10th of the next month."]],
  ["l28", "SBC SOPs", "Shops and Establishment", "Registration for the office", 1, ["Register the office under the Telangana Shops and Establishments Act within 30 days of opening."]],
  ["l29", "SBC SOPs", "Trade licence", "Municipal licence", 1, ["The GHMC issues the trade licence for the office premises. It renews every year."]],
  ["b7", "SBC SOPs", "Due dates: monthly, quarterly, annual", "The compliance calendar in one page", 2, ["Monthly: TDS by the 7th, GSTR-1 by the 11th, PF and ESI by the 15th, GSTR-3B by the 20th.", "Quarterly: TDS returns by the end of the next month. Annual: AOC-4, MGT-7 and the income tax return."]],
];

export const LIB_BOOKS: LibBook[] = RAW_LIB.map(([id, cat, title, short, minutes, body, updated]) => {
  const s = fromShared(id);
  return { id, cat, title, short, minutes, updated, date: s?.updated ?? d(2026, 9, 1), body: body ?? s?.body ?? [short] };
});

export const findBook = (id: string) => LIB_BOOKS.find((b) => b.id === id) ?? LIB_BOOKS[0];

/** lib_shelf_a "Recently read" and lib_recent_drill. */
export const RECENT_READS: Array<{ id: string; pct: number; note: string }> = [
  { id: "b3", pct: 70, note: "70% read · 2 of 3 sections" },
  { id: "b1", pct: 100, note: "Finished · read on 2 Oct" },
  { id: "b2", pct: 35, note: "35% read · 1 of 3 sections" },
];

export interface ReaderDetail {
  /** Category chip and the official source link. */
  official?: { label: string; href: string };
  /** One line per depth: Simpler, Normal, More detail. */
  lines: [string, string, string];
  timeline?: Array<{ label: string; when: string; state: "done" | "now" | "next" }>;
  facts?: Array<{ k: string; v: string }>;
  why?: string;
  sources?: string[];
  /** "In Northwind's project" card. */
  project?: { date: Date; title: string; chips: string[]; step?: number; obligation?: string };
  related?: string[];
  docs?: string[];
}

export const READER: Record<string, ReaderDetail> = {
  b3: {
    official: { label: "RBI FIRMS", href: "https://firms.rbi.org.in" },
    lines: [
      "Tell the RBI about the shares Northwind gave its parent company. Do it within 30 days.",
      "After Northwind allots shares to a foreign investor, it must report them to the RBI on the FIRMS portal in form FC-GPR within 30 days of the allotment date.",
      "FC-GPR reports a fresh issue of shares to a person resident outside India. File it on RBI FIRMS within 30 days of allotment, with the FIRC, the KYC letter from the AD bank, the valuation certificate and the CS certificate.",
    ],
    timeline: [
      { label: "Shares allotted", when: "Day 0 · 2 Nov", state: "done" },
      { label: "FIRC and KYC from the bank", when: "Now", state: "now" },
      { label: "File FC-GPR on FIRMS", when: "By day 30 · 2 Dec", state: "next" },
    ],
    facts: [
      { k: "Who files", v: "SBC, for Northwind" },
      { k: "Late fee", v: "LSF, per RBI" },
      { k: "Portal", v: "RBI FIRMS" },
    ],
    why: "Northwind’s parent company sends the share money after incorporation. If FC-GPR is late, the RBI charges a late fee and the shares stay unreported.",
    sources: ["FEMA (Non-debt Instruments) Rules, 2019", "RBI Master Direction · Foreign Investment"],
    project: { date: d(2026, 12, 2), title: "FC-GPR filing", chips: ["30-day window", "SBC files"], step: 22 },
    related: ["b1", "l11", "l7"],
    docs: ["a4"],
  },
  b1: {
    official: { label: "MCA portal", href: "https://www.mca.gov.in" },
    lines: [
      "One MCA form sets up the company, its PAN, TAN and GSTIN together.",
      "SPICe+ is the MCA web form for company incorporation. Part A reserves the name. Part B files the incorporation with PAN, TAN, EPFO, ESIC and GSTIN.",
      "SPICe+ Part A reserves the name for 20 days. Part B carries the MOA, the AOA, the subscriber sheet, the office proof and the director KYC. MCA approves in 5 to 7 working days or returns remarks.",
    ],
    timeline: [
      { label: "Part A · name approved", when: "24 Sep", state: "done" },
      { label: "Part B · documents and drafts", when: "Now", state: "now" },
      { label: "Part B filed with MCA", when: "20 Oct", state: "next" },
    ],
    facts: [
      { k: "Who files", v: "SBC, for Northwind" },
      { k: "Signatures", v: "DSC of both directors" },
      { k: "Portal", v: "MCA V3" },
    ],
    why: "Northwind’s COI comes from this form. Each document still waiting on Northwind holds up Part B.",
    sources: ["Companies (Incorporation) Rules, 2014", "MCA SPICe+ instruction kit"],
    project: { date: d(2026, 10, 20), title: "SPICe+ filing", chips: ["Part B", "SBC files"], step: 12 },
    related: ["l4", "l3", "b2"],
    docs: ["f10", "f14"],
  },
  b2: {
    lines: [
      "After the COI, a few more filings finish the setup. SBC runs them.",
      "The Certificate of Incorporation starts a 30-day clock for the first board meeting, the auditor appointment (ADT-1) and the office confirmation (INC-22).",
      "The first board meeting, ADT-1 and INC-22 are due within 30 days. Share certificates (SH-1) are due within 60 days. INC-20A is due within 180 days. FC-GPR follows the share allotment within 30 days.",
    ],
    timeline: [
      { label: "COI from MCA", when: "28 Oct", state: "next" },
      { label: "First Board meeting", when: "By 27 Nov", state: "next" },
      { label: "INC-20A", when: "By 26 Apr", state: "next" },
    ],
    why: "Each post-incorporation step has a legal due date. Phase 3 on the Incorporation page tracks them.",
    project: { date: d(2026, 11, 27), title: "First Board meeting", chips: ["Within 30 days", "SBC runs it"], step: 15 },
    related: ["l11", "l12", "b3"],
    docs: ["a1"],
  },
};

/** Normal-depth detail for a book without its own entry. */
export function readerFor(book: LibBook): ReaderDetail {
  return READER[book.id] ?? { lines: [book.short, book.body[0], book.body.join(" ")] };
}
