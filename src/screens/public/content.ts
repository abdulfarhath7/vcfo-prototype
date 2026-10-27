// Copy and links for the public landing page and sign-in.
// Copy is ported word for word from the old v6 landing (reference/), except "nudge" (K-17).

export const NAV = [
  { href: "#journey", label: "How it works" },
  { href: "#incorporate", label: "Incorporation" },
  { href: "#comply", label: "Compliance" },
  { href: "#portals", label: "Portals" },
  { href: "#faq", label: "FAQ" },
];

export const FACTS = [
  { n: 25, href: "/client/incorporation", text: "steps in every incorporation, from the name application to the post-incorporation filings. Registrations have their own page." },
  { n: 23, href: "/client/registrations", text: "registrations and RBI reportings after the certificate, from PAN and GST to FC-GPR." },
  { n: 6, href: "/client/calendar", text: "regulators on one statutory calendar: MCA, GST, Income tax, Payroll, FEMA and Labour." },
  { n: 1, href: "/client/audit", text: "record that the client, the parent entity and the firm all read, with the same status words." },
];

export type NodeKind = "num" | "coi" | "loop";
export interface JourneyNode {
  kind: NodeKind;
  n?: number;
  x: number;
  up: boolean;
  title: string;
  sub: string;
  who: string;
  list: string;
  href: string;
}

/** The six nodes of the stage line. `up` nodes sit on the upper curve with labels above. */
export const JOURNEY: JourneyNode[] = [
  { kind: "num", n: 1, x: 60, up: false, title: "Name and papers", sub: "5 steps, about 2 weeks", who: "CLIENT + FIRM", list: "5 steps, about 2 weeks. Client and firm.", href: "/client/incorporation/phase/1" },
  { kind: "num", n: 2, x: 264, up: true, title: "Incorporation", sub: "11 steps, SPICe+ with MCA", who: "FIRM + MCA", list: "11 steps, SPICe+ with MCA. Firm and MCA.", href: "/client/incorporation/phase/2" },
  { kind: "coi", x: 468, up: false, title: "Certificate of Incorporation", sub: "CIN, PAN and TAN arrive", who: "DAY 0", list: "Day 0. CIN, PAN and TAN arrive.", href: "/client/incorporation/step/14" },
  { kind: "num", n: 3, x: 672, up: true, title: "The first 180 days", sub: "11 steps with statutory clocks", who: "FIRM", list: "11 steps with statutory clocks. The firm.", href: "/client/incorporation/phase/3" },
  { kind: "num", n: 4, x: 876, up: false, title: "Registrations", sub: "23 items, only the ones that apply", who: "FIRM", list: "23 items, only the ones that apply. The firm.", href: "/client/registrations" },
  { kind: "loop", x: 1080, up: true, title: "Compliance, every year", sub: "monthly, quarterly, annual", who: "FIRM + CLIENT", list: "Monthly, quarterly and annual filings. Firm and client.", href: "/client/calendar" },
];

export type Who = "client" | "firm" | "mca";
export const STORY: { title: string; body: string; whos: [Who, string][]; step: number }[] = [
  {
    title: "The client tells you about the company",
    body: "Names they like, the directors, the share capital, the registered office and the parent company. One questionnaire, answered once. Every document after this is generated from it.",
    whos: [["client", "Client"], ["firm", "Firm reviews"]],
    step: 1,
  },
  {
    title: "A board resolution, drafted and signed",
    body: "You draft the resolution from their answers. The client prints it on the parent letterhead, signs, and uploads. The project lead checks it the same day.",
    whos: [["firm", "Firm drafts"], ["client", "Client signs"]],
    step: 2,
  },
  {
    title: "The name is reserved with MCA",
    body: "You file the name application. MCA usually answers within a week, and the approved name is held for 20 days while the rest is prepared.",
    whos: [["firm", "Firm files"], ["mca", "MCA approves"]],
    step: 4,
  },
  {
    title: "Documents generated, signed with a digital signature",
    body: "The memorandum, the articles, each director's consent (DIR-2) and declaration (INC-9), the subscriber sheets: all generated, not retyped. Directors get a digital signature and sign.",
    whos: [["firm", "Firm generates"], ["client", "Directors sign"]],
    step: 10,
  },
  {
    title: "SPICe+ filed, certificate issued",
    body: "You file SPICe+ Part B with AGILE-PRO-S. If MCA raises remarks, you answer them. Then the Certificate of Incorporation arrives with the CIN, PAN and TAN, and the clock for stage 3 starts.",
    whos: [["firm", "Firm files"], ["mca", "MCA issues"]],
    step: 12,
  },
];

export interface Pin {
  left: string;
  up: boolean;
  edge?: "first" | "last";
  coi?: boolean;
  when: string;
  title: string;
  body?: string;
  items?: string[];
  step: number;
  /** Phone list text. */
  shortWhen: string;
  shortTitle: string;
  shortBody?: string;
}

export const PINS: Pin[] = [
  { left: "0%", up: true, edge: "first", coi: true, when: "Day 0", title: "Certificate of Incorporation", body: "The company exists. Every clock below starts today.", step: 14, shortWhen: "Day 0", shortTitle: "Certificate of Incorporation", shortBody: "Every clock starts today." },
  {
    left: "16.7%",
    up: false,
    when: "Within 30 days",
    title: "Five things at once",
    items: ["First board meeting", "Auditor appointed (ADT-1)", "Registered office confirmed (INC-22)", "Letterhead and name board", "Nominee shareholder forms"],
    step: 15,
    shortWhen: "Within 30 days",
    shortTitle: "First board meeting, auditor (ADT-1), registered office (INC-22), letterhead and name board, nominee shareholder forms",
  },
  { left: "33.3%", up: true, when: "Within 60 days", title: "Share certificates (SH-1)", body: "Issued to every subscriber once the capital is in.", step: 19, shortWhen: "Within 60 days", shortTitle: "Share certificates (SH-1)", shortBody: "Issued once the capital is in." },
  { left: "56%", up: false, when: "No statutory clock", title: "Bank account, then capital", body: "The account opens when the bank clears KYC. The subscription money comes in from the parent.", step: 17, shortWhen: "No statutory clock", shortTitle: "Bank account, then capital", shortBody: "Opens when the bank clears KYC." },
  { left: "78%", up: true, when: "30 days after shares are allotted", title: "FC-GPR to the RBI", body: "For foreign capital. Reported through the FIRMS portal.", step: 22, shortWhen: "30 days after allotment", shortTitle: "FC-GPR to the RBI", shortBody: "For foreign capital." },
  { left: "100%", up: false, edge: "last", when: "Within 180 days", title: "Capital in, commencement filed (INC-20A)", body: "The company may start business. Stage 4 begins.", step: 20, shortWhen: "Within 180 days", shortTitle: "Commencement filed (INC-20A)", shortBody: "The company may start business." },
];

export const TICKS = [
  ["0%", "DAY 0"],
  ["16.7%", "30"],
  ["33.3%", "60"],
  ["50%", "90"],
  ["66.7%", "120"],
  ["83.3%", "150"],
  ["100%", "180"],
] as const;

export type ClusterKey = "tax" | "lab" | "trade" | "rbi" | "ip";
export const CLUSTERS: { key: ClusterKey; title: string; chips: string[] }[] = [
  { key: "tax", title: "Tax", chips: ["PAN and TAN", "GST", "LUT for exports", "Professional tax"] },
  { key: "lab", title: "Labour", chips: ["PF", "ESI", "Shops and Establishment", "CLRA", "POSH committee"] },
  { key: "trade", title: "Trade", chips: ["IEC", "ICEGATE", "Trade licence", "MSME", "LEI", "STPI"] },
  { key: "rbi", title: "RBI and FEMA", chips: ["FC-GPR", "FDI reporting", "ODI reporting", "FLA return", "FC-TRS"] },
  { key: "ip", title: "Intellectual property", chips: ["Trademark", "Trademark renewal", "Patent"] },
];

export type Series = "gst" | "it" | "mca" | "lab" | "rbi";
export const LEGEND: { s: Series; name: string; text: string }[] = [
  { s: "gst", name: "GST.", text: "GSTR-1 by the 11th and GSTR-3B by the 20th, every month. GSTR-9 once a year." },
  { s: "it", name: "Income tax.", text: "TDS paid by the 7th each month, TDS returns each quarter, advance tax in June, September, December and March, Form 16 in June." },
  { s: "mca", name: "MCA.", text: "MBP-1 and DIR-8 in April, MSME-1 twice a year, DPT-3 in June, DIR-3 KYC in September, AOC-4 and MGT-7 after the annual general meeting." },
  { s: "lab", name: "Labour.", text: "Professional tax by the 10th, PF and ESI by the 15th, every month." },
  { s: "rbi", name: "RBI.", text: "The FLA return by 15 July for every company with foreign capital." },
];

/** Every statutory date on the year ring. m = month index from April (0) to March (11). */
export function ringItems() {
  const items: { m: number; d: number; s: Series; t: string }[] = [];
  for (let m = 0; m < 12; m++) {
    items.push({ m, d: 11, s: "gst", t: "GSTR-1" }, { m, d: 20, s: "gst", t: "GSTR-3B" });
    items.push({ m, d: 7, s: "it", t: "TDS payment" });
    items.push({ m, d: 10, s: "lab", t: "Professional tax" }, { m, d: 15, s: "lab", t: "PF and ESI" });
  }
  (
    [
      [2, 15, "Advance tax Q1"],
      [5, 15, "Advance tax Q2"],
      [8, 15, "Advance tax Q3"],
      [11, 15, "Advance tax Q4"],
      [3, 31, "TDS return Q4"],
      [6, 31, "TDS return Q1"],
      [9, 31, "TDS return Q2"],
      [1, 31, "TDS return Q3"],
      [2, 15, "Form 16"],
      [6, 31, "Income tax return"],
    ] as const
  ).forEach(([m, d, t]) => items.push({ m, d, s: "it", t }));
  (
    [
      [0, 1, "MBP-1 and DIR-8"],
      [0, 30, "MSME-1"],
      [2, 30, "DPT-3"],
      [5, 30, "DIR-3 KYC"],
      [6, 30, "AOC-4"],
      [6, 31, "MSME-1"],
      [7, 29, "MGT-7"],
    ] as const
  ).forEach(([m, d, t]) => items.push({ m, d, s: "mca", t }));
  items.push({ m: 8, d: 31, s: "gst", t: "GSTR-9" });
  items.push({ m: 3, d: 15, s: "rbi", t: "FLA return" });
  return items;
}

export const RECORD_FACTS = [
  ["Owner", 'The client, the firm or MCA. Never "someone".'],
  ["Due date", "Statutory where the law sets one, agreed where it does not."],
  ["Document", "The upload, the generated form or the filed acknowledgement."],
  ["Audit entry", "Who changed what, and when. Clients can read their own trail."],
] as const;

export const LANES: { kind: string; title: string; out: string; tone: "prog" | "ok" | "warn" | "brand" }[] = [
  { kind: "Step", title: "KYC review and DSC", out: "In progress", tone: "prog" },
  { kind: "Filing", title: "GSTR-3B, Sept", out: "Filed 20 Oct", tone: "ok" },
  { kind: "Document", title: "Proof of address", out: "Needs you", tone: "brand" },
  { kind: "Filing", title: "ADT-1 appointment", out: "Due 14 Nov", tone: "warn" },
  { kind: "Step", title: "Subscriber details", out: "Completed", tone: "ok" },
];

export type PortalKey = "client" | "lead" | "manager" | "admin" | "super" | "dev";
export const PORTAL_TABS: { key: PortalKey; label: string; desc: string; points: string[]; href: string; open: string; person: string }[] = [
  {
    key: "client",
    label: "Client",
    desc: "What is waiting on the client, what the firm holds, and when the certificate is expected.",
    points: ["Upload and approve in place", "Timeline with the expected date", "Ask VCFO for the next step"],
    href: "/client/home",
    open: "Open the client portal",
    person: "Rohan Kumar",
  },
  {
    key: "lead",
    label: "Project lead",
    desc: "Today's action queue across every company the lead runs.",
    points: ["This week's statutory filings", "Compliance health ring per company", "Who each step is waiting on"],
    href: "/lead/today",
    open: "Open the project lead portal",
    person: "Bharath",
  },
  {
    key: "manager",
    label: "Manager",
    desc: "Every task your team owns, by project lead, company and status, and each lead's workload side by side.",
    points: ["Team tasks with a live status breakdown", "Each project lead's work, by area and by status", "Assign a to-do to a project lead in one click"],
    href: "/manager/today",
    open: "Open the manager portal",
    person: "Pranay",
  },
  {
    key: "admin",
    label: "Admin",
    desc: "Every client, every manager, and where things are stuck, on one screen.",
    points: ["Each client's stage, owner and next date", "Managers' load and on-time rate", "Assign a client to a manager"],
    href: "/admin/today",
    open: "Open the admin portal",
    person: "Krishna",
  },
  {
    key: "super",
    label: "Super admin",
    desc: "The whole firm at one place: clients, admins, managers, money and risk.",
    points: ["Incorporations, registrations and filings side by side", "Fees collected and late-fee exposure", "A monthly partner report in one click"],
    href: "/super/overview",
    open: "Open the super admin portal",
    person: "Mithilesh",
  },
  {
    key: "dev",
    label: "Developer",
    desc: "The platform behind every portal: connections, jobs, logs, deploys and access.",
    points: ["Connections to the government portals", "Jobs, logs and deploys", "Service costs by month"],
    href: "/dev/overview",
    open: "Open the developer portal",
    person: "Farhath",
  },
];

export const ASK_QUESTIONS = ["What is my next step?", "Where is my incorporation now?", "Which documents are missing?"];

export const TRUST = [
  { icon: "server", title: "Hosted in India", body: "AWS Mumbai region, encrypted storage. Client data does not leave the country." },
  { icon: "lock", title: "Credentials stay sealed", body: "Portal and registration logins are stored encrypted and shown only to the people on the engagement.", href: "/client/credentials" },
  { icon: "history", title: "An audit trail you can read", body: "Every change is logged with who and when. Clients see their own trail in the portal.", href: "/client/audit" },
  { icon: "mail", title: "Email is the record", body: "Every notice goes by email. WhatsApp is a reminder on top, never the only copy." },
] as const;

export const FAQ = [
  {
    q: "Who is VCFO Suite for?",
    a: "Firms that incorporate and keep companies compliant in India, and their clients: Indian founders, and foreign parents setting up a subsidiary or a global capability centre. The firm, the Indian team and the parent entity all log in to the same record.",
  },
  {
    q: "Is it only for SBC?",
    a: "No. SBC built it and runs its engagements on it, which is why every screen on this page is a real one. Another firm gets its own workspace, with its own people, clients and calendar.",
  },
  {
    q: "What does the client actually do in the portal?",
    a: "Answer the questionnaire, upload the documents each step asks for, approve board resolutions, sign with a DSC, and watch the timeline. Questions go to Ask VCFO or to the people named on the engagement.",
  },
  {
    q: "Which filings does the calendar cover?",
    a: "MCA, GST, Income tax, Payroll, FEMA and Labour obligations for the financial year, generated from the certificate date and the registrations the company holds. Each one carries its statutory due date.",
  },
  {
    q: "How are we reminded?",
    a: "Every due date emails the owner of the step. With consent, a WhatsApp reminder goes out as well. The email is always the record; WhatsApp never replaces it.",
  },
  {
    q: "Where is our data hosted, and who can see it?",
    a: "On AWS in the Mumbai region, with encrypted storage. Access is scoped by role, so a client sees only their own companies and the firm's people assigned to them.",
  },
];

/** Quick answers for the fixed Ask VCFO panel. `sec` is the section the "Show me" button scrolls to. */
export const GUIDE: { q: string; a: string; sec: string; href?: string; sales?: boolean }[] = [
  { q: "What does VCFO Suite cover?", a: "Four stages, then the yearly calendar: name and papers, incorporation, the first 180 days and registrations, then every statutory filing after. Each step carries an owner, a due date and the document that proves it.", sec: "journey", href: "/client/incorporation" },
  { q: "How does incorporation work?", a: "The client answers one questionnaire, the firm drafts and files, and MCA approves. The board resolution, MOA, AOA, DIR-2 and INC-9 are generated from the answers, not retyped.", sec: "incorporate", href: "/client/incorporation/phase/2" },
  { q: "What happens after the certificate?", a: "Eleven steps start the day the certificate arrives, most with a statutory clock: the first board meeting and ADT-1 within 30 days, share certificates within 60, and INC-20A within 180.", sec: "after", href: "/client/incorporation/phase/3" },
  { q: "Which registrations does it track?", a: "Twenty-three registrations and reportings across tax, labour, trade, RBI and intellectual property. Only the ones that apply to the company are switched on.", sec: "register", href: "/client/registrations" },
  { q: "What does the compliance calendar look like?", a: "Every statutory date of the financial year by regulator, each with a status word and a reminder before it is due. Email is the record; WhatsApp is the reminder.", sec: "comply", href: "/client/calendar" },
  { q: "What does my client see?", a: "What is waiting on them, what the firm holds, and when the certificate is expected. They upload, approve and ask from one screen instead of an email thread.", sec: "portals", href: "/client/home" },
  { q: "What does the project lead see?", a: "Today's action queue across every company they run, this week's statutory filings, and who each step is waiting on.", sec: "portals", href: "/lead/today" },
  { q: "What does the manager see?", a: "Every task the team owns, filtered by project lead, company or status, and each lead's workload by area. A to-do goes to a project lead in one click.", sec: "portals", href: "/manager/today" },
  { q: "What does the admin see?", a: "Every client with its stage, manager, who it is pending with and the next date; each manager's load and on-time rate; and where work is stuck. The admin assigns whole clients to managers.", sec: "portals", href: "/admin/today" },
  { q: "What does the super admin see?", a: "The whole firm on one screen: every client, what each admin and manager is doing, incorporations, registrations and filings side by side, fees and late-fee exposure, risks, growth, and a monthly partner report.", sec: "portals", href: "/super/overview" },
  { q: "Where is the data hosted?", a: "On AWS in the Mumbai region, with encrypted storage. Access is scoped by role, so a client sees only their own companies.", sec: "trust" },
  { q: "Is it only for SBC?", a: "No. SBC built it and runs its own engagements on it. Your firm gets its own workspace with its own people, clients and calendar.", sec: "faq", sales: true },
];

export const GUIDE_HELLO = "Hello. Ask me what VCFO Suite does, or pick a question below. Every answer can show you the real screen.";

/** Demo accounts on sign-in. Each opens that portal's home. */
export const DEMO_ACCOUNTS = [
  { label: "Client", email: "rohan@northwind.in", href: "/client/home" },
  { label: "Lead", email: "bharath@sbc.example", href: "/lead/today" },
  { label: "Manager", email: "pranay@sbc.example", href: "/manager/today" },
  { label: "Admin", email: "krishna@sbc.example", href: "/admin/today" },
  { label: "Super admin", email: "mithilesh@sbc.example", href: "/super/overview" },
  { label: "Developer", email: "farhath@sbc.example", href: "/dev/overview" },
];
