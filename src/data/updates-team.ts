import { d } from "@/lib/dates";
import type { ChipTone } from "@/components/ui/Chip";
import type { Portal } from "@/data/nav";

/*
 * Data for Announcements, Notifications, Audit and Profile (Team, Settings).
 * Ported from reference/old-screens/s/team/*_redesign.dc.html and old-patch/shared/Profile.dc.html.
 * Old dates are 2 days later than here: the old "today" was 8 Oct, the new TODAY is 6 Oct.
 */

/* ---------- Links between portals ---------- */

/** Map a client href to the same place on a staff portal. */
export function portalHref(portal: Portal, href?: string): string | undefined {
  if (!href || portal === "client") return href;
  const p = `/${portal}`;
  if (href.startsWith("http")) return href;
  if (href.startsWith("/client/incorporation/step/")) return href.replace("/client/incorporation/step/", `${p}/clients/northwind/step/`);
  if (href.startsWith("/client/incorporation")) return `${p}/clients/northwind`;
  if (href.startsWith("/client/documents")) return href.replace("/client", p);
  if (href.startsWith("/client/filings")) return `${p}/compliances/filings`;
  if (href.startsWith("/client/announcements")) return `${p}/updates/announcements`;
  if (href.startsWith("/client/notifications")) return `${p}/updates/notifications`;
  if (href.startsWith("/client/profile?tab=settings")) return `${p}/profile?tab=settings`;
  if (href.startsWith("/client/profile")) return `${p}/profile`;
  if (href.startsWith("/client/home")) return portal === "lead" || portal === "manager" || portal === "admin" ? `${p}/today` : `${p}/overview`;
  return href.replace("/client", p);
}

/* ---------- Announcements (ann_redesign, ann_detail) ---------- */

export type AnnKind = "Deadline" | "MCA" | "Compliance" | "Tax" | "GST" | "Post-incorporation";

export interface Ann {
  id: string;
  date: Date;
  time: string;
  kind: AnnKind;
  title: string;
  body: string;
  /** SBC author, or the official feed. */
  by: { name: string; role: string; ini: string; phone?: string; email?: string } | "feed";
  /** Official feed source host. */
  host?: string;
  unread?: boolean;
  /** Where the item leads in the tool. */
  href?: string;
}

export const ANN_TONE: Record<AnnKind, ChipTone> = { Deadline: "warn", MCA: "violet", Compliance: "prog", Tax: "idle", GST: "teal", "Post-incorporation": "idle" };
export const isImportant = (a: Ann) => a.kind === "Deadline" || a.kind === "Compliance";

const PRANAY = { name: "Pranay", role: "Manager", ini: "PN", phone: "+91 98480 11223", email: "pranay@sbcllp.in" };
const BHARATH = { name: "Bharath", role: "Project lead", ini: "BH", phone: "+91 98480 33445", email: "bharath@sbcllp.in" };

export const ANNS: Ann[] = [
  { id: "a1", date: d(2026, 10, 6), time: "09:05", kind: "Deadline", title: "GSTR-3B for September is due on 20 Oct", body: "Share the September sales and purchase invoices by 15 Oct so SBC can file on time. Late filing costs ₹50 a day.", by: PRANAY, unread: true, href: "/client/filings" },
  { id: "a2", date: d(2026, 10, 5), time: "18:30", kind: "MCA", title: "MCA V3 portal down 11-12 Oct for an upgrade", body: "MCA forms are offline from 20:00 on 11 Oct to 06:00 on 12 Oct. Filings due in that window move to the next working day.", by: "feed", host: "mca.gov.in", unread: true },
  { id: "a3", date: d(2026, 10, 1), time: "11:40", kind: "Compliance", title: "DIR-3 KYC window is open for all directors", body: "Each director files DIR-3 KYC once a year. Rohan Kumar and Meera Iyer file by 15 Oct without a late fee.", by: PRANAY, href: "/client/obligations" },
  { id: "a4", date: d(2026, 9, 29), time: "10:00", kind: "Tax", title: "Advance tax: third instalment due 15 Dec", body: "75% of the estimated tax for FY 2026-27 is due by 15 Dec.", by: "feed", host: "incometax.gov.in" },
  { id: "a5", date: d(2026, 9, 27), time: "16:15", kind: "GST", title: "GST invoice management system changes from 1 Nov", body: "Buyers accept, reject or keep each supplier invoice in the IMS before GSTR-3B. Unactioned invoices count as accepted.", by: "feed", host: "gst.gov.in" },
  { id: "a6", date: d(2026, 9, 22), time: "12:20", kind: "Post-incorporation", title: "After COI: open the current account within 30 days", body: "The bank needs the COI, MOA, AOA, PAN and the board resolution. SBC sends the bank pack on the day the COI arrives.", by: BHARATH, href: "/client/incorporation/phase/3" },
];

/** Official portals card: Setup and Recurring tabs, each with groups. */
export const OFFICIAL_PORTALS: Record<"setup" | "recurring", Array<{ group: string; rows: Array<{ name: string; host: string }> }>> = {
  setup: [
    { group: "Incorporation", rows: [{ name: "Pre-incorporation", host: "mca.gov.in" }, { name: "Post-incorporation", host: "mca.gov.in" }] },
    { group: "Registrations", rows: [{ name: "GST Registration", host: "gst.gov.in" }, { name: "PF Registration", host: "unifiedportal-emp.epfindia.gov.in" }, { name: "ESI Registration", host: "esic.gov.in" }, { name: "PT Registration", host: "tgct.gov.in" }] },
    { group: "FEMA", rows: [{ name: "FCGPR Filing", host: "firms.rbi.org.in" }, { name: "FLA Return", host: "flair.rbi.org.in" }] },
  ],
  recurring: [
    { group: "Monthly", rows: [{ name: "GSTR-1 and GSTR-3B", host: "gst.gov.in" }, { name: "TDS payment", host: "incometax.gov.in" }] },
    { group: "Quarterly", rows: [{ name: "TDS returns", host: "tdscpc.gov.in" }, { name: "Advance tax", host: "incometax.gov.in" }] },
  ],
};

/* ---------- Notifications (notif_redesign, notif_drill, notif_empty) ---------- */

export type NotifType = "doc" | "back" | "step" | "time" | "deadline" | "mail" | "ann" | "team";
export type NotifGroup = "Documents" | "Steps" | "Deadlines" | "Messages";

export const NOTIF_TYPE: Record<NotifType, { group: NotifGroup; chip: string; tone: ChipTone; tip: string }> = {
  doc: { group: "Documents", chip: "Request", tone: "warn", tip: "Document request" },
  back: { group: "Documents", chip: "Sent back", tone: "bad", tip: "Document sent back" },
  step: { group: "Steps", chip: "Step", tone: "ok", tip: "Step done" },
  time: { group: "Steps", chip: "Timeline", tone: "prog", tip: "Timeline changed" },
  deadline: { group: "Deadlines", chip: "Deadline", tone: "warn", tip: "Deadline coming up" },
  mail: { group: "Messages", chip: "Email", tone: "teal", tip: "Email sent to Northwind" },
  ann: { group: "Messages", chip: "Announcement", tone: "violet", tip: "Announcement" },
  team: { group: "Messages", chip: "Team", tone: "idle", tip: "Team change" },
};

/** Where each group lives, for the drill pop-up link. */
export const NOTIF_GROUP_HOME: Record<NotifGroup, { label: string; href: string }> = {
  Documents: { label: "Open Documents", href: "/client/documents" },
  Steps: { label: "Open Incorporation", href: "/client/incorporation" },
  Deadlines: { label: "Open Filings", href: "/client/filings" },
  Messages: { label: "Open Announcements", href: "/client/announcements" },
};

export interface Notif {
  id: string;
  /** 0 today, 1 earlier this week, 2 earlier. */
  g: 0 | 1 | 2;
  type: NotifType;
  title: string;
  /** Parts of the second line; a part with an href is a link. */
  parts: Array<{ text: string; href?: string }>;
  who: string;
  /** A person opens the Team section. */
  person?: boolean;
  when: string;
  unread: boolean;
  /** Main link: the linked step, document or page. */
  href: string;
  /** Label of the main button in the detail panel. */
  cta: string;
  /** Linked step, for the detail panel. */
  step?: { n: number; title: string; status: string };
}

export const NOTIFS: Notif[] = [
  { id: "n1", g: 0, type: "doc", title: "2 documents requested", parts: [{ text: "Utility bill for the office", href: "/client/incorporation/step/7" }, { text: "Board resolution", href: "/client/incorporation/board-resolution" }], who: "Bharath", person: true, when: "10:42", unread: true, href: "/client/documents", cta: "Open Documents", step: { n: 7, title: "Registered office address", status: "Waiting" } },
  { id: "n2", g: 0, type: "back", title: "Passport copy sent back", parts: [{ text: "Photo page is blurred. Upload it again." }, { text: "Open the document", href: "/client/documents/view/d1" }], who: "Bharath", person: true, when: "09:15", unread: true, href: "/client/incorporation/step/8", cta: "Open step 8", step: { n: 8, title: "Proposed directors", status: "Sent back" } },
  { id: "n3", g: 0, type: "deadline", title: "GSTR-1 due 11 Oct", parts: [{ text: "Sun 11 Oct · GST", href: "/client/filings" }, { text: "GST portal", href: "https://www.gst.gov.in" }], who: "VCFO Suite", when: "09:00", unread: false, href: "/client/filings", cta: "Open Filings" },
  { id: "n4", g: 0, type: "time", title: "Phase 2 end date moved to 28 Oct", parts: [{ text: "Approved by Pranay", href: "/client/profile?tab=team" }, { text: "See the timeline", href: "/client/home" }], who: "Pranay", person: true, when: "08:30", unread: true, href: "/client/incorporation/phase/2", cta: "Open phase 2" },
  { id: "n5", g: 2, type: "step", title: "Capital structure accepted", parts: [{ text: "Step 6 of 25 is complete", href: "/client/incorporation/step/6" }], who: "Pranay", person: true, when: "26 Sep", unread: false, href: "/client/incorporation/step/6", cta: "Open step 6", step: { n: 6, title: "Capital structure", status: "Completed" } },
  { id: "n6", g: 2, type: "step", title: "Name approved by MCA", parts: [{ text: "NORTHWIND TECHNOLOGIES INDIA PRIVATE LIMITED" }, { text: "Name approval letter", href: "/client/documents/view/d2" }], who: "Bharath", person: true, when: "24 Sep", unread: false, href: "/client/incorporation/step/5", cta: "Open step 5", step: { n: 5, title: "Name approval", status: "Completed" } },
  { id: "n7", g: 1, type: "ann", title: "MCA V3 portal down 11-12 Oct", parts: [{ text: "Official feed", href: "/client/announcements" }, { text: "mca.gov.in", href: "https://www.mca.gov.in" }], who: "SBC", when: "Mon 5 Oct", unread: false, href: "/client/announcements", cta: "Open Announcements" },
  { id: "n8", g: 1, type: "mail", title: "Email sent: Documents requested", parts: [{ text: "To rohan@northwind.in" }, { text: "Email settings", href: "/client/profile?tab=settings" }], who: "VCFO Suite", when: "Sun 4 Oct", unread: false, href: "/client/documents", cta: "Open Documents" },
  { id: "n9", g: 2, type: "team", title: "Meera Iyer joined the project", parts: [{ text: "Director · invited by Northwind", href: "/client/profile?tab=team" }], who: "Meera Iyer", person: true, when: "30 Sep", unread: false, href: "/client/profile?tab=team", cta: "Open Team" },
  { id: "n10", g: 2, type: "step", title: "DIN allotted to both directors", parts: [{ text: "Rohan Kumar · Meera Iyer" }, { text: "Step 8 · Proposed directors", href: "/client/incorporation/step/8" }], who: "Bharath", person: true, when: "27 Sep", unread: false, href: "/client/incorporation/step/8", cta: "Open step 8", step: { n: 8, title: "Proposed directors", status: "In progress" } },
  { id: "n11", g: 2, type: "mail", title: "Email sent: Welcome to VCFO Suite", parts: [{ text: "To rohan@northwind.in" }, { text: "Open Home", href: "/client/home" }], who: "VCFO Suite", when: "31 Aug", unread: false, href: "/client/home", cta: "Open Home" },
];

export const NOTIF_GROUPS = ["Today", "Earlier this week", "Earlier"] as const;

/* ---------- Audit (audit_redesign, audit_drill, audit_filtered) ---------- */

export type AuditCat = "Documents" | "Milestones" | "Team" | "Email" | "Credentials" | "Sign-in";
export type AuditType = "req" | "back" | "up" | "ok" | "time" | "mail" | "team" | "key" | "sign";

export const AUDIT_TYPE: Record<AuditType, { tip: string; tone: ChipTone }> = {
  req: { tip: "Waiting on Northwind", tone: "warn" },
  back: { tip: "Sent back", tone: "bad" },
  up: { tip: "With SBC · to review", tone: "prog" },
  ok: { tip: "Done", tone: "ok" },
  time: { tip: "Timeline", tone: "prog" },
  mail: { tip: "Email", tone: "teal" },
  team: { tip: "Team change", tone: "idle" },
  key: { tip: "Credentials", tone: "violet" },
  sign: { tip: "Sign-in", tone: "idle" },
};

export interface AuditRow {
  id: string;
  date: Date;
  time: string;
  type: AuditType;
  cat: AuditCat;
  action: string;
  target: string;
  who: string;
  role: string;
  /** SBC or Northwind, for the "who" filter. */
  side: "sbc" | "client";
  result: "Done" | "Sent back" | "Failed";
  /** Detail fields. A "Before" and "After" pair shows as a change. */
  facts: Array<{ k: string; v: string }>;
  cta?: { label: string; href: string };
}

const sbc = (who: string, role: string) => ({ who, role, side: "sbc" as const });
const nw = (who: string) => ({ who, role: "Client", side: "client" as const });

/** Newest first. The first 30 days show; "Load older" adds the rest. */
export const AUDIT_LOG: AuditRow[] = [
  { id: "e1", date: d(2026, 10, 6), time: "10:42", type: "req", cat: "Documents", action: "Documents requested", target: "Utility bill, Board resolution", ...sbc("Bharath", "Project lead"), result: "Done", facts: [{ k: "Items", v: "2" }, { k: "Due", v: "9 Oct" }, { k: "Step", v: "7 · Registered office" }], cta: { label: "Open request", href: "/client/incorporation/step/7" } },
  { id: "e2", date: d(2026, 10, 6), time: "09:15", type: "back", cat: "Documents", action: "Document sent back", target: "Passport copy", ...sbc("Bharath", "Project lead"), result: "Sent back", facts: [{ k: "Reason", v: "Photo page is blurred" }, { k: "Uploaded by", v: "Rohan Kumar" }, { k: "File", v: "Director 1 - passport.jpg" }], cta: { label: "Upload again", href: "/client/incorporation/step/8" } },
  { id: "e3", date: d(2026, 10, 6), time: "08:30", type: "time", cat: "Milestones", action: "Timeline change approved", target: "Phase 2 ends 28 Oct", ...sbc("Pranay", "Manager"), result: "Done", facts: [{ k: "Before", v: "24 Oct" }, { k: "After", v: "28 Oct" }, { k: "Slipped", v: "4 days" }], cta: { label: "View timeline", href: "/client/home" } },
  { id: "e4", date: d(2026, 10, 5), time: "18:20", type: "up", cat: "Documents", action: "Document uploaded", target: "Passport copy", ...nw("Rohan Kumar"), result: "Done", facts: [{ k: "File", v: "Director 1 - passport.jpg" }, { k: "Size", v: "1.2 MB" }, { k: "Step", v: "8 · Proposed directors" }], cta: { label: "Preview file", href: "/client/documents/view/d1" } },
  { id: "e5", date: d(2026, 10, 5), time: "16:05", type: "time", cat: "Milestones", action: "Change request sent", target: "Phase 2 +4 days", ...nw("Rohan Kumar"), result: "Done", facts: [{ k: "Reason", v: "Directors travelling" }, { k: "Before", v: "24 Oct" }, { k: "After", v: "28 Oct" }, { k: "Status", v: "Approved" }], cta: { label: "View timeline", href: "/client/home" } },
  { id: "e6", date: d(2026, 10, 5), time: "11:30", type: "mail", cat: "Email", action: "Email sent", target: "Documents requested", ...sbc("VCFO Suite", "System"), result: "Done", facts: [{ k: "To", v: "rohan@northwind.in" }, { k: "Status", v: "Delivered" }, { k: "Also sent", v: "WhatsApp reminder" }] },
  { id: "e7", date: d(2026, 10, 5), time: "09:02", type: "sign", cat: "Sign-in", action: "Signed in", target: "Chrome on Windows · Hyderabad", ...nw("Rohan Kumar"), result: "Done", facts: [{ k: "Device", v: "Chrome on Windows" }, { k: "Place", v: "Hyderabad" }, { k: "Method", v: "Password and code" }] },
  { id: "e8", date: d(2026, 9, 26), time: "15:10", type: "ok", cat: "Milestones", action: "Step accepted", target: "Capital structure", ...sbc("Pranay", "Manager"), result: "Done", facts: [{ k: "Step", v: "6 of 25" }, { k: "Submitted", v: "24 Sep" }, { k: "Turnaround", v: "2 days" }], cta: { label: "Open step", href: "/client/incorporation/step/6" } },
  { id: "e9", date: d(2026, 10, 4), time: "12:00", type: "team", cat: "Team", action: "Colleague invited", target: "Ananya Rao", ...nw("Rohan Kumar"), result: "Done", facts: [{ k: "Invited", v: "Ananya Rao" }, { k: "Access", v: "Member" }, { k: "Status", v: "Invite sent" }], cta: { label: "Open Team", href: "/client/profile?tab=team" } },
  { id: "e10", date: d(2026, 10, 3), time: "17:40", type: "up", cat: "Documents", action: "Document uploaded", target: "Board resolution draft", ...nw("Rohan Kumar"), result: "Done", facts: [{ k: "File", v: "Draft Board resolution.docx" }, { k: "Size", v: "52 KB" }], cta: { label: "Preview file", href: "/client/documents/view/d4" } },
  { id: "e11", date: d(2026, 10, 3), time: "10:05", type: "up", cat: "Milestones", action: "Step updated", target: "Registered office", ...sbc("Bharath", "Project lead"), result: "Done", facts: [{ k: "Step", v: "7 of 25" }, { k: "Before", v: "Not started" }, { k: "After", v: "Waiting on Northwind" }] },
  { id: "e12", date: d(2026, 10, 1), time: "14:20", type: "key", cat: "Credentials", action: "Password viewed", target: "GST portal login", ...nw("Rohan Kumar"), result: "Done", facts: [{ k: "Credential", v: "GST portal" }, { k: "Reason", v: "File GSTR-1" }, { k: "Hidden again", v: "After 30 s" }], cta: { label: "Open Credentials", href: "/client/credentials" } },
  { id: "e13", date: d(2026, 9, 30), time: "14:30", type: "req", cat: "Documents", action: "Documents requested", target: "Director PAN, Aadhaar", ...sbc("Bharath", "Project lead"), result: "Done", facts: [{ k: "Items", v: "2" }, { k: "Due", v: "2 Oct" }, { k: "Step", v: "10 · KYC review and DSC" }] },
  { id: "e14", date: d(2026, 9, 30), time: "16:10", type: "up", cat: "Documents", action: "Document uploaded", target: "PAN card", ...nw("Rohan Kumar"), result: "Done", facts: [{ k: "File", v: "PAN - Rohan Kumar.pdf" }, { k: "Size", v: "180 KB" }] },
  { id: "e15", date: d(2026, 9, 30), time: "11:20", type: "mail", cat: "Email", action: "Email sent", target: "Step 5 accepted", ...sbc("VCFO Suite", "System"), result: "Done", facts: [{ k: "To", v: "rohan@northwind.in" }, { k: "Status", v: "Delivered" }] },
  { id: "e16", date: d(2026, 9, 29), time: "18:00", type: "ok", cat: "Milestones", action: "KYC checked", target: "Director PAN and Aadhaar", ...sbc("Pranay", "Manager"), result: "Done", facts: [{ k: "Step", v: "10 of 25" }] },
  { id: "e17", date: d(2026, 9, 29), time: "15:45", type: "up", cat: "Documents", action: "Document uploaded", target: "Aadhaar card", ...nw("Meera Iyer"), result: "Done", facts: [{ k: "File", v: "Aadhaar - Meera Iyer.pdf" }, { k: "Size", v: "210 KB" }] },
  { id: "e18", date: d(2026, 9, 29), time: "09:30", type: "team", cat: "Team", action: "Colleague added", target: "Dev Sharma", ...nw("Rohan Kumar"), result: "Done", facts: [{ k: "Added", v: "Dev Sharma" }, { k: "Access", v: "Member" }] },
  { id: "e19", date: d(2026, 9, 22), time: "10:00", type: "sign", cat: "Sign-in", action: "Sign-in failed", target: "Wrong password · 3 tries", ...nw("Meera Iyer"), result: "Failed", facts: [{ k: "Device", v: "Safari on iPhone" }, { k: "Tries", v: "3" }, { k: "Locked for", v: "15 minutes" }] },
  { id: "e20", date: d(2026, 9, 24), time: "17:50", type: "ok", cat: "Milestones", action: "Name approved", target: "MCA RUN", ...sbc("Bharath", "Project lead"), result: "Done", facts: [{ k: "Name", v: "Northwind Technologies India Pvt Ltd" }, { k: "SRN", v: "AA1234567" }], cta: { label: "Open step", href: "/client/incorporation/step/5" } },
  { id: "e21", date: d(2026, 9, 21), time: "16:50", type: "time", cat: "Milestones", action: "Timeline set", target: "Phase 2 ends 24 Oct", ...sbc("Pranay", "Manager"), result: "Done", facts: [{ k: "Before", v: "Not set" }, { k: "After", v: "24 Oct" }] },
  { id: "e22", date: d(2026, 9, 21), time: "10:00", type: "mail", cat: "Email", action: "Email sent", target: "Welcome to Phase 2", ...sbc("VCFO Suite", "System"), result: "Done", facts: [{ k: "To", v: "rohan@northwind.in" }, { k: "Status", v: "Delivered" }] },
  // Older than 30 days: shown after "Load older".
  { id: "e23", date: d(2026, 9, 2), time: "11:00", type: "req", cat: "Documents", action: "Documents requested", target: "Proof of address", ...sbc("Bharath", "Project lead"), result: "Done", facts: [{ k: "Items", v: "1" }, { k: "Due", v: "9 Sep" }] },
  { id: "e24", date: d(2026, 9, 2), time: "09:40", type: "team", cat: "Team", action: "Primary contact set", target: "Rohan Kumar", ...sbc("Krishna", "Admin"), result: "Done", facts: [{ k: "Before", v: "None" }, { k: "After", v: "Rohan Kumar" }] },
  { id: "e25", date: d(2026, 8, 31), time: "17:20", type: "mail", cat: "Email", action: "Email sent", target: "Welcome to VCFO Suite", ...sbc("VCFO Suite", "System"), result: "Done", facts: [{ k: "To", v: "rohan@northwind.in" }, { k: "Status", v: "Delivered" }] },
];

/* ---------- Team (team_redesign, team_invite, team_handoff) ---------- */

export type MemberKind = "primary" | "member" | "invited";

export interface Member {
  id: string;
  name: string;
  ini: string;
  email: string;
  role: string;
  kind: MemberKind;
  /** "Since 2 Sep" or "Sent 6 Oct". */
  when: string;
  you?: boolean;
}

export const MEMBERS: Member[] = [
  { id: "rohan", name: "Rohan Kumar", ini: "RK", email: "rohan@northwind.in", role: "Director", kind: "primary", when: "Since 2 Sep", you: true },
  { id: "meera", name: "Meera Iyer", ini: "MI", email: "meera@northwind.in", role: "Director", kind: "member", when: "Since 12 Sep" },
  { id: "dev", name: "Dev Sharma", ini: "DS", email: "dev.sharma@northwind.in", role: "Finance", kind: "member", when: "Since 28 Sep" },
  { id: "ananya", name: "Ananya Rao", ini: "AR", email: "ananya@northwind.in", role: "Operations", kind: "invited", when: "Sent 4 Oct" },
];

export const MEMBER_LABEL: Record<MemberKind, string> = { primary: "Primary", member: "Member", invited: "Invite sent" };
export const MEMBER_TONE: Record<MemberKind, ChipTone> = { primary: "prog", member: "idle", invited: "warn" };

/* ---------- Profile and Settings (old-patch/shared/Profile.dc.html, settings_redesign) ---------- */

export const PROFILE_EXTRA: Record<Portal, { designation: string; membership?: string; mobile: string; since: string }> = {
  client: { designation: "Director", mobile: "+91 98111 22334", since: "2 Sep 2026" },
  lead: { designation: "Project lead", membership: "ICAI 245118", mobile: "+91 98480 33445", since: "Jun 2024" },
  manager: { designation: "Manager", membership: "ICAI 198433", mobile: "+91 98480 11223", since: "Jan 2022" },
  admin: { designation: "Admin", membership: "ICAI 102774", mobile: "+91 98480 55667", since: "Apr 2019" },
  super: { designation: "Partner", membership: "ICAI 102774", mobile: "+91 98480 77889", since: "Apr 2016" },
  dev: { designation: "Developer", mobile: "+91 98480 99001", since: "Mar 2025" },
};

/** Company facts from the questionnaire (client Profile, "Company" section). */
export const COMPANY_FACTS = { employees: "12", state: "Telangana", exports: "Yes · IT services to the parent" };

export interface NotifPref {
  key: string;
  label: string;
  /** Email stays on: email is the record for anything that needs action. */
  locked?: boolean;
  /** No WhatsApp channel for this row. */
  noWa?: boolean;
  /** Portals that see the row. Omit for all. */
  only?: Portal[];
}

export const NOTIF_PREFS: NotifPref[] = [
  { key: "docs", label: "Documents requested or sent back", locked: true },
  { key: "steps", label: "Step accepted or needs changes", locked: true },
  { key: "dead", label: "Deadlines and reminders", locked: true },
  { key: "time", label: "Timeline changes", locked: true },
  { key: "ann", label: "Announcements from SBC" },
  { key: "feed", label: "Official feed news (MCA, GST, Tax)" },
  { key: "digest", label: "Weekly summary · Monday 9 am", noWa: true, only: ["client"] },
  { key: "daily", label: "Daily digest · 8:30 am", noWa: true, only: ["lead", "manager", "admin", "super"] },
  { key: "approvals", label: "Approvals waiting", only: ["manager"] },
  { key: "esc", label: "Escalations", only: ["admin", "super"] },
  { key: "partner", label: "Monthly partner report · 1st at 7 am", noWa: true, only: ["super"] },
  { key: "incidents", label: "Incidents and failed jobs", only: ["dev"] },
];

export const DEFAULT_EMAIL: Record<string, boolean> = { ann: true, feed: false, digest: true, daily: true, approvals: true, esc: true, partner: true, incidents: true };
export const DEFAULT_WA: Record<string, boolean> = { docs: true, steps: true, dead: true, time: true, ann: false, feed: false, approvals: true, esc: true, incidents: true };

export const DEVICES = [
  { id: "this", name: "Chrome on Windows · Hyderabad", when: "Active now", current: true },
  { id: "phone", name: "Safari on iPhone · Hyderabad", when: "Yesterday 21:14" },
];
