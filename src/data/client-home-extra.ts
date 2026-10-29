import { d } from "@/lib/dates";
import type { ChipTone, Owner } from "@/components/ui/Chip";
import type { AttentionRow } from "@/components/cards/AttentionList";
import type { ActivityRow } from "@/components/cards/ActivityList";
import type { Doc } from "@/components/cards/DocList";
import type { ProgressItem } from "@/components/cards/ProgressList";
import type { DrillSpec } from "@/components/cards/DrillDialog";

/* Sample data ported from reference/old-screens/s/home/v7c_*.dc.html and mobile.html. */

/** The after state is frozen on 8 Nov 2026 (v7c_greet_a). COI is 28 Oct, as in incorporation.ts. */
export const AFTER_TODAY = d(2026, 11, 8);
export const INCORPORATED_ON = d(2026, 10, 28);

/* ---------- Needs from Northwind: Upload, Fill, Correct, Sign (v7c_needs_b, v7c_needs_a) ---------- */

export type NeedKind = "upload" | "fill" | "correct" | "sign";

export interface Need {
  id: string;
  title: string;
  sub: string;
  kind: NeedKind;
  due: Date;
  /** Date tile tint. */
  tint: "bad" | "warn" | "prog" | "idle";
  /** Chip text: "In 3 days", "Overdue 3d". */
  when: string;
  href: string;
}

export const NEED_TABS: Array<{ key: NeedKind; label: string }> = [
  { key: "upload", label: "Upload" },
  { key: "fill", label: "Fill" },
  { key: "correct", label: "Correct" },
  { key: "sign", label: "Sign" },
];

export const NEED_ACTION: Record<NeedKind, string> = { upload: "Upload", fill: "Fill", correct: "Fix", sign: "Sign" };

export const NEEDS_BEFORE: Need[] = [
  { id: "nb1", title: "Utility bill · office", sub: "Registered office address · step 7 · asked by Bharath", kind: "upload", due: d(2026, 10, 9), tint: "warn", when: "In 3 days", href: "/client/incorporation/step/7" },
  { id: "nb2", title: "NOC from the owner", sub: "Registered office address · step 7 · asked by Bharath", kind: "upload", due: d(2026, 10, 9), tint: "warn", when: "In 3 days", href: "/client/incorporation/step/7" },
  { id: "nb3", title: "Director 2 · nationality and ID", sub: "Proposed directors · step 8", kind: "fill", due: d(2026, 10, 11), tint: "prog", when: "In 5 days", href: "/client/incorporation/step/8" },
  { id: "nb4", title: "Passport copy · page 2", sub: "Proposed directors · sent back · blurred scan", kind: "correct", due: d(2026, 10, 3), tint: "bad", when: "Overdue 3d", href: "/client/incorporation/step/8" },
];

export const NEEDS_AFTER: Need[] = [
  { id: "na1", title: "October salary register", sub: "EPF return · Oct 2026 · asked by Pranay", kind: "upload", due: d(2026, 11, 13), tint: "warn", when: "In 5 days", href: "/client/obligations" },
  { id: "na2", title: "Bank FIRC and KYC letter", sub: "FC-GPR filing · asked by Bharath", kind: "upload", due: d(2026, 11, 20), tint: "prog", when: "In 12 days", href: "/client/obligations" },
  { id: "na3", title: "TDS challan details", sub: "TDS payment · Oct 2026", kind: "fill", due: d(2026, 11, 7), tint: "bad", when: "Overdue 1d", href: "/client/obligations" },
  { id: "na4", title: "FC-GPR declaration", sub: "FC-GPR filing · sign with DSC", kind: "sign", due: d(2026, 11, 28), tint: "prog", when: "In 20 days", href: "/client/obligations" },
];

/* ---------- Who holds it now (v7c_current) ---------- */

export interface Holding {
  step: number;
  title: string;
  meta: string;
  status: string;
  tone: ChipTone;
  action: string;
  /** Main (navy) action: the one row Northwind must act on first. */
  main?: boolean;
}

export const HOLDS: Array<{ key: Owner; label: string; rows: Holding[] }> = [
  {
    key: "client",
    label: "Northwind",
    rows: [
      { step: 7, title: "Registered office address", meta: "Step 7 · due 9 Oct · 2 files missing", status: "Waiting", tone: "warn", action: "Continue", main: true },
      { step: 8, title: "Proposed directors", meta: "Step 8 · Director 2 details · Northwind fills this", status: "In progress", tone: "prog", action: "Continue" },
      { step: 9, title: "Subscriber details", meta: "Step 9 · 3 fields left · Northwind fills this", status: "In progress", tone: "prog", action: "Continue" },
    ],
  },
  { key: "sbc", label: "SBC", rows: [{ step: 10, title: "KYC review and DSC", meta: "Step 10 · Bharath · 30% · ready 13 Oct", status: "In progress", tone: "prog", action: "Open" }] },
  { key: "mca", label: "MCA", rows: [] },
];

/* ---------- After incorporation (v7c_*_a, v7c_next, v7c_postinc, v7c_reg, v7c_ids) ---------- */

export const AFTER_ALERTS_NOV: AttentionRow[] = [
  { id: "x1", date: d(2026, 11, 7), title: "TDS payment overdue 1 day", sub: "Interest runs until paid · waiting on Northwind", chip: { label: "Overdue", tone: "bad" }, urgent: true, tint: "bad", action: { label: "Fill details", href: "/client/obligations" } },
  { id: "x2", date: d(2026, 11, 15), title: "3 payroll dues", sub: "EPF, ESI and PT · October", chip: { label: "In 7 days", tone: "warn" }, tint: "warn", href: "/client/obligations" },
  { id: "x3", date: d(2026, 12, 2), title: "FC-GPR due", sub: "FEMA · 30 days from share allotment", chip: { label: "In 24 days", tone: "prog" }, tint: "prog", href: "/client/obligations" },
  { id: "x4", date: d(2026, 12, 27), title: "Share certificates (SH-1)", sub: "MCA · 60 days from incorporation", chip: { label: "In 49 days", tone: "idle" }, tint: "idle", href: "/client/obligations" },
];

export interface NextItem {
  id: string;
  date: Date;
  title: string;
  period: string;
  area: string;
  owner: Owner;
  when: string;
  tint: "bad" | "warn" | "prog" | "idle";
  /** SBC prepares it by this date. */
  sbcBy: string;
  days: number;
  portal: string;
  overdue?: boolean;
}

export const WHAT_NEXT: NextItem[] = [
  { id: "w1", date: d(2026, 11, 7), title: "TDS payment", period: "Oct 2026", area: "Income tax", owner: "client", when: "Overdue 1 day", tint: "bad", sbcBy: "6 Nov", days: -1, portal: "https://www.incometax.gov.in", overdue: true },
  { id: "w2", date: d(2026, 11, 15), title: "EPF return and payment", period: "Oct 2026", area: "Payroll", owner: "client", when: "In 7 days", tint: "warn", sbcBy: "13 Nov", days: 7, portal: "https://unifiedportal-emp.epfindia.gov.in" },
  { id: "w3", date: d(2026, 11, 15), title: "ESI payment", period: "Oct 2026", area: "Payroll", owner: "sbc", when: "In 7 days", tint: "warn", sbcBy: "13 Nov", days: 7, portal: "https://www.esic.gov.in" },
  { id: "w4", date: d(2026, 11, 20), title: "PT payment", period: "Oct 2026", area: "Payroll", owner: "sbc", when: "In 12 days", tint: "prog", sbcBy: "18 Nov", days: 12, portal: "https://pt.kar.nic.in" },
  { id: "w5", date: d(2026, 12, 2), title: "FC-GPR filing", period: "Share allotment", area: "FEMA", owner: "client", when: "In 24 days", tint: "prog", sbcBy: "28 Nov", days: 24, portal: "https://firms.rbi.org.in" },
  { id: "w6", date: d(2026, 12, 7), title: "TDS payment", period: "Nov 2026", area: "Income tax", owner: "sbc", when: "In 29 days", tint: "prog", sbcBy: "5 Dec", days: 29, portal: "https://www.incometax.gov.in" },
];

export interface PostItem {
  id: string;
  title: string;
  owner: Owner;
  due: string;
  day: number;
  of: number;
  pct: number;
  rule: string;
}

export const POST_OPEN: PostItem[] = [
  { id: "p1", title: "FC-GPR filing", owner: "client", due: "2 Dec 2026", day: 6, of: 30, pct: 20, rule: "Within 30 days of share allotment (2 Nov) · bank FIRC and KYC letter needed" },
  { id: "p2", title: "Nominee shareholder (MGT-4/5/6)", owner: "sbc", due: "27 Nov 2026", day: 11, of: 30, pct: 50, rule: "Within 30 days of incorporation" },
  { id: "p3", title: "Share certificates (SH-1)", owner: "sbc", due: "27 Dec 2026", day: 11, of: 60, pct: 60, rule: "Within 60 days of incorporation" },
  { id: "p4", title: "Commencement (INC-20A)", owner: "sbc", due: "26 Apr 2027", day: 11, of: 180, pct: 40, rule: "Within 180 days of incorporation" },
];

export const POST_DONE: Array<{ title: string; date: string }> = [
  { title: "Registered office (INC-22)", date: "29 Oct" },
  { title: "First Board meeting", date: "30 Oct" },
  { title: "Company letterhead", date: "31 Oct" },
  { title: "Bank account opening", date: "2 Nov" },
  { title: "Name board", date: "3 Nov" },
  { title: "Share capital infusion", date: "2 Nov" },
  { title: "Auditor appointment (ADT-1)", date: "5 Nov" },
];

export type RegCat = "Tax" | "Labour" | "Business" | "IP" | "FEMA";

export interface HomeReg {
  id: string;
  name: string;
  cat: RegCat;
  status: "Registered" | "In progress" | "Upcoming";
  number?: string;
  date: string;
  authority: string;
  /** Proof: true uploaded, false filed but proof pending. */
  proof?: boolean;
  portal: string;
  /** Registration record id in registrations.ts, when one exists. */
  href?: string;
}

export const HOME_REGS: HomeReg[] = [
  { id: "r1", name: "GST registration", cat: "Tax", status: "Registered", number: "29AAKCN4821M1Z5", date: "1 Nov 2026", authority: "GSTN", proof: true, portal: "https://www.gst.gov.in", href: "/client/registrations" },
  { id: "r2", name: "LUT filing", cat: "Tax", status: "Registered", number: "AD291126001234X", date: "3 Nov 2026", authority: "GSTN", proof: true, portal: "https://www.gst.gov.in" },
  { id: "r3", name: "PF registration", cat: "Labour", status: "Registered", number: "KNBNG2954118000", date: "2 Nov 2026", authority: "EPFO", proof: true, portal: "https://unifiedportal-emp.epfindia.gov.in" },
  { id: "r4", name: "ESI registration", cat: "Labour", status: "Registered", number: "53001234560001001", date: "3 Nov 2026", authority: "ESIC", proof: false, portal: "https://www.esic.gov.in" },
  { id: "r5", name: "PT registration", cat: "Labour", status: "In progress", date: "Est. 12 Nov 2026", authority: "Karnataka CTD", portal: "https://pt.kar.nic.in" },
  { id: "r6", name: "Shops and establishment", cat: "Labour", status: "In progress", date: "Est. 15 Nov 2026", authority: "Karnataka Labour Dept", portal: "https://labour.karnataka.gov.in" },
  { id: "r7", name: "MSME registration", cat: "Business", status: "Registered", number: "UDYAM-KR-03-0123456", date: "30 Oct 2026", authority: "Ministry of MSME", proof: true, portal: "https://udyamregistration.gov.in" },
  { id: "r8", name: "IEC registration", cat: "Business", status: "In progress", date: "Est. 14 Nov 2026", authority: "DGFT", portal: "https://www.dgft.gov.in" },
  { id: "r9", name: "Trade licence", cat: "Business", status: "Upcoming", date: "Dec 2026", authority: "BBMP", portal: "https://bbmp.gov.in" },
  { id: "r10", name: "LEI registration", cat: "Business", status: "Upcoming", date: "Dec 2026", authority: "LEIL", portal: "https://www.leilindia.in" },
  { id: "r11", name: "Trademark registration", cat: "IP", status: "Upcoming", date: "Jan 2027", authority: "IP India", portal: "https://ipindia.gov.in" },
  { id: "r12", name: "FC-GPR filing", cat: "FEMA", status: "Upcoming", date: "By 2 Dec 2026", authority: "RBI · FIRMS", portal: "https://firms.rbi.org.in" },
  { id: "r13", name: "FLA return", cat: "FEMA", status: "Upcoming", date: "By 15 Jul 2027", authority: "RBI", portal: "https://flair.rbi.org.in" },
];

export interface CompanyId {
  key: string;
  label: string;
  /** Full value. Private IDs show masked until the password check. */
  value: string;
  masked?: string;
  portal: string;
  tone: "violet" | "accent" | "teal";
}

export const COMPANY_IDS: CompanyId[] = [
  { key: "cin", label: "CIN", value: "U72900KA2026FTC198431", portal: "https://www.mca.gov.in", tone: "violet" },
  { key: "pan", label: "PAN", value: "AAKCN4821M", masked: "AAKC••••1M", portal: "https://www.incometax.gov.in", tone: "accent" },
  { key: "tan", label: "TAN", value: "BLRN04392D", masked: "BLRN••••2D", portal: "https://www.tin-nsdl.com", tone: "accent" },
  { key: "gstin", label: "GSTIN", value: "29AAKCN4821M1Z5", portal: "https://www.gst.gov.in", tone: "teal" },
];

/** DINs of the directors (v7c_ids drill, Credentials · Directors KYC). */
export const DINS: Array<{ name: string; din: string }> = [
  { name: "Rohan Kumar", din: "01234567" },
  { name: "Meera Iyer", din: "01234568" },
  { name: "Neha Kapoor", din: "01234569" },
  { name: "David Clarke", din: "01234570" },
];

export const AFTER_SBC: ProgressItem[] = [
  { id: "sa1", name: "PT registration", sub: "Bharath · Registrations · ready 12 Nov", pct: 70, tone: "accent", href: "/client/registrations" },
  { id: "sa2", name: "IEC registration", sub: "Bharath · Registrations · ready 14 Nov", pct: 50, tone: "violet", href: "/client/registrations" },
];

export const AFTER_DOCS: Doc[] = [
  { id: "ad1", name: "Share capital FIRC", type: "PDF", from: "client", fromLabel: "Northwind", date: d(2026, 11, 2), href: "/client/documents/view/d2", size: "212 KB" },
  { id: "ad2", name: "GST certificate", type: "PDF", from: "sbc", date: d(2026, 11, 1), href: "/client/documents/view/d2", size: "96 KB" },
  { id: "ad3", name: "Board meeting minutes", type: "PDF", from: "sbc", date: d(2026, 10, 30), href: "/client/documents/view/d3", size: "380 KB" },
  { id: "ad4", name: "Certificate of Incorporation", type: "PDF", from: "mca", fromLabel: "MCA", date: d(2026, 10, 28), href: "/client/documents/view/d2", size: "148 KB" },
];

export const AFTER_ACTIVITY: ActivityRow[] = [
  { id: "aa1", date: d(2026, 11, 8), time: "09:00", text: "TDS payment overdue", who: "VCFO Suite" },
  { id: "aa2", date: d(2026, 11, 5), time: "14:20", text: "TDS details requested", who: "Pranay" },
  { id: "aa3", date: d(2026, 11, 3), time: "12:05", text: "ESI registration done", who: "Bharath" },
  { id: "aa4", date: d(2026, 11, 2), time: "10:40", text: "Share capital received", who: "Rohan Kumar" },
  { id: "aa5", date: d(2026, 11, 1), time: "17:15", text: "GST certificate delivered", who: "Bharath" },
];

/** v7c_area: FY 2026-27 filings by area, as of 8 Nov 2026. */
export interface AreaRow {
  id: string;
  name: string;
  total: number;
  filed: number;
  due: number;
  overdue: number;
  rows: Array<{ name: string; meta: string; status: string; tone: ChipTone }>;
}

export const AREA_ROWS: AreaRow[] = [
  { id: "mca", name: "MCA / ROC", total: 2, filed: 1, due: 0, overdue: 0, rows: [{ name: "ADT-1 (auditor appointment)", meta: "Filed 5 Nov", status: "Filed", tone: "ok" }, { name: "Commencement (INC-20A)", meta: "26 Apr 2027", status: "Upcoming", tone: "idle" }] },
  { id: "gst", name: "GST", total: 10, filed: 0, due: 0, overdue: 0, rows: [{ name: "GSTR-1 · Nov", meta: "11 Dec", status: "Upcoming", tone: "idle" }, { name: "GSTR-3B · Nov", meta: "20 Dec", status: "Upcoming", tone: "idle" }] },
  { id: "it", name: "Income tax / TDS", total: 7, filed: 0, due: 0, overdue: 1, rows: [{ name: "TDS payment · Oct", meta: "7 Nov", status: "Overdue", tone: "bad" }, { name: "TDS payment · Nov", meta: "7 Dec", status: "Upcoming", tone: "idle" }] },
  { id: "pay", name: "Payroll (PF / ESI / PT)", total: 18, filed: 0, due: 3, overdue: 0, rows: [{ name: "EPF return and payment · Oct", meta: "15 Nov", status: "Due soon", tone: "warn" }, { name: "ESI payment · Oct", meta: "15 Nov", status: "Due soon", tone: "warn" }, { name: "PT payment · Oct", meta: "20 Nov", status: "Due soon", tone: "warn" }] },
  { id: "fema", name: "FEMA / RBI", total: 1, filed: 0, due: 0, overdue: 0, rows: [{ name: "FC-GPR filing", meta: "2 Dec", status: "Upcoming", tone: "idle" }] },
];

/** v7c_comp: every filing this FY by status. */
export const COMP_SPLIT = { filed: 1, due: 3, overdue: 1, upcoming: 33 };

export const COMP_DRILL: DrillSpec = {
  title: "Compliance status · FY 2026-27",
  tabs: [
    { label: "Filed", count: 1 },
    { label: "Due soon", count: 3 },
    { label: "Overdue", count: 1 },
    { label: "Upcoming", count: 33 },
  ],
  rows: [
    { name: "ADT-1 (auditor appointment)", meta: "Filed 5 Nov", status: "Filed", tone: "ok", tab: 0, href: "/client/filings" },
    { name: "EPF return and payment · Oct", meta: "15 Nov · Northwind", status: "Due soon", tone: "warn", tab: 1, href: "/client/obligations" },
    { name: "ESI payment · Oct", meta: "15 Nov · SBC", status: "Due soon", tone: "warn", tab: 1, href: "/client/obligations" },
    { name: "PT payment · Oct", meta: "20 Nov · SBC", status: "Due soon", tone: "warn", tab: 1, href: "/client/obligations" },
    { name: "TDS payment · Oct 2026", meta: "Overdue 1 day · Northwind", status: "Overdue", tone: "bad", tab: 2, href: "/client/obligations" },
    { name: "GSTR-1 · Nov", meta: "11 Dec", status: "Upcoming", tone: "idle", tab: 3, href: "/client/filings" },
    { name: "GSTR-3B · Nov", meta: "20 Dec", status: "Upcoming", tone: "idle", tab: 3, href: "/client/filings" },
    { name: "FC-GPR filing", meta: "2 Dec", status: "Upcoming", tone: "idle", tab: 3, href: "/client/filings" },
  ],
  link: { name: "Filings", href: "/client/filings" },
};

/* ---------- Before: drills for the greeting numbers (v7c_greet_b, mobile.html) ---------- */

export const DOCS_DRILL: DrillSpec = {
  title: "Documents",
  tabs: [
    { label: "In", count: 4 },
    { label: "Missing", count: 2 },
  ],
  rows: [
    { name: "Director 1 · passport", meta: "2 Oct", status: "Received", tone: "ok", tab: 0, href: "/client/documents/view/d1" },
    { name: "Name approval letter", meta: "24 Sep", status: "Received", tone: "ok", tab: 0, href: "/client/documents/view/d2" },
    { name: "Signed Board resolution", meta: "18 Sep", status: "Received", tone: "ok", tab: 0, href: "/client/documents/view/d3" },
    { name: "Capital structure sheet", meta: "26 Sep", status: "Received", tone: "ok", tab: 0, href: "/client/documents/view/d5" },
    { name: "Utility bill · office", meta: "Due 9 Oct", status: "Missing", tone: "warn", tab: 1, href: "/client/incorporation/step/7" },
    { name: "NOC from the owner", meta: "Due 9 Oct", status: "Missing", tone: "warn", tab: 1, href: "/client/incorporation/step/7" },
  ],
  link: { name: "Documents", href: "/client/documents" },
};

export const OVERDUE_DRILL_BEFORE: DrillSpec = {
  title: "Due and overdue",
  tabs: [
    { label: "Overdue", count: 1 },
    { label: "Due soon", count: 3 },
  ],
  rows: [
    { name: "Passport copy · page 2", meta: "Sent back 3 Oct", status: "Overdue", tone: "bad", tab: 0, href: "/client/incorporation/step/8" },
    { name: "2 office documents", meta: "9 Oct", status: "In 3 days", tone: "warn", tab: 1, href: "/client/incorporation/step/7" },
    { name: "MOA and AOA drafts", meta: "10 Oct", status: "In 4 days", tone: "warn", tab: 1, href: "/client/incorporation/step/11" },
    { name: "Approved name expires", meta: "14 Oct", status: "In 8 days", tone: "warn", tab: 1, href: "/client/incorporation/step/5" },
  ],
  link: { name: "Incorporation", href: "/client/incorporation" },
};

export const DUE_DRILL_AFTER: DrillSpec = {
  title: "Due and overdue",
  tabs: [
    { label: "Overdue", count: 1 },
    { label: "Due soon", count: 3 },
  ],
  rows: [
    { name: "TDS payment · Oct 2026", meta: "Overdue 1 day · Northwind", status: "Overdue", tone: "bad", tab: 0, href: "/client/obligations" },
    { name: "EPF return and payment", meta: "15 Nov · Northwind", status: "In 7 days", tone: "warn", tab: 1, href: "/client/obligations" },
    { name: "ESI payment", meta: "15 Nov · SBC", status: "In 7 days", tone: "warn", tab: 1, href: "/client/obligations" },
    { name: "PT payment", meta: "20 Nov · SBC", status: "In 12 days", tone: "prog", tab: 1, href: "/client/obligations" },
  ],
  link: { name: "Obligations", href: "/client/obligations" },
};

export const POST_DRILL: DrillSpec = {
  title: "Post-incorporation setup",
  tabs: [
    { label: "All", count: POST_OPEN.length + POST_DONE.length },
    { label: "Open", count: POST_OPEN.length },
    { label: "Completed", count: POST_DONE.length },
  ],
  rows: [
    ...POST_OPEN.map((p) => ({ name: p.title, meta: `day ${p.day} of ${p.of} · ${p.due.replace(/ 20\d\d$/, "")}`, status: "Open", tone: (p.owner === "client" ? "warn" : "prog") as ChipTone, tab: 1, href: "/client/incorporation/phase/3" })),
    ...POST_DONE.map((p) => ({ name: p.title, meta: p.date, status: "Completed", tone: "ok" as ChipTone, tab: 2, href: "/client/incorporation/phase/3" })),
  ],
  link: { name: "Incorporation", href: "/client/incorporation" },
};

export const REG_DRILL: DrillSpec = {
  title: "Registrations",
  tabs: [
    { label: "Done", count: HOME_REGS.filter((r) => r.status === "Registered").length },
    { label: "With SBC", count: HOME_REGS.filter((r) => r.status === "In progress").length },
    { label: "Upcoming", count: HOME_REGS.filter((r) => r.status === "Upcoming").length },
  ],
  rows: HOME_REGS.map((r) => ({
    name: r.name,
    meta: `${r.authority} · ${r.date}`,
    status: r.status,
    tone: (r.status === "Registered" ? "ok" : r.status === "In progress" ? "prog" : "idle") as ChipTone,
    tab: r.status === "Registered" ? 0 : r.status === "In progress" ? 1 : 2,
    href: "/client/registrations",
  })),
  link: { name: "Registrations", href: "/client/registrations" },
};

export const NEEDS_DRILL_AFTER: DrillSpec = {
  title: "Waiting on Northwind",
  tabs: [{ label: "All", count: NEEDS_AFTER.length }, ...NEED_TABS.map((t) => ({ label: t.label, count: NEEDS_AFTER.filter((n) => n.kind === t.key).length }))],
  rows: NEEDS_AFTER.map((n) => ({ name: n.title, meta: n.when, status: NEED_ACTION[n.kind], tone: (n.tint === "bad" ? "bad" : "warn") as ChipTone, tab: NEED_TABS.findIndex((t) => t.key === n.kind) + 1, href: n.href })),
  link: { name: "Obligations", href: "/client/obligations" },
};

/** Home card trend lines (R-18): counts at the end of 2 to 5 Oct. The screen adds today's count (6 Oct). */
export const HOME_TRENDS = {
  waiting: [5, 6, 4, 4],
  sbc: [2, 1, 1, 1],
  docs: [1, 2, 3, 3],
};
