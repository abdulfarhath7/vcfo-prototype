import { d } from "@/lib/dates";
import type { FileType } from "@/components/ui/FileBadge";
import type { ChipTone } from "@/components/ui/Chip";

/* ---------- Announcements ---------- */

export interface Announcement {
  id: string;
  date: Date;
  kind: "Deadline" | "Portal" | "SBC" | "Law change";
  title: string;
  body: string;
  by: string;
  link?: { label: string; host: string };
}

export const ANNOUNCEMENTS: Announcement[] = [
  { id: "an1", date: d(2026, 10, 20), kind: "Deadline", title: "GSTR-3B for September is due 20 Oct", body: "Summary return and payment for September. SBC files it once the sales register is in.", by: "SBC", link: { label: "GST portal", host: "gst.gov.in" } },
  { id: "an2", date: d(2026, 10, 5), kind: "Portal", title: "MCA V3 portal maintenance on 11 Oct", body: "MCA forms are offline from 20:00 to 06:00. SPICe+ filings move to the next working day.", by: "SBC", link: { label: "MCA notice", host: "mca.gov.in" } },
  { id: "an3", date: d(2026, 10, 1), kind: "Law change", title: "DIR-3 KYC window extended to 15 Oct", body: "Directors who missed 30 Sep can file without the late fee until 15 Oct.", by: "Pranay" },
  { id: "an4", date: d(2026, 9, 28), kind: "SBC", title: "Office closed on 2 Oct", body: "Gandhi Jayanti. Reminders still go out; replies resume on 3 Oct.", by: "Krishna" },
  { id: "an5", date: d(2026, 9, 15), kind: "Deadline", title: "Advance tax second instalment · 15 Sep", body: "45% of the estimated tax for FY 2026-27 was due today.", by: "SBC", link: { label: "e-Filing", host: "incometax.gov.in" } },
  { id: "an6", date: d(2026, 9, 10), kind: "Portal", title: "e-Filing portal: new AIS view", body: "The Annual Information Statement now shows SFT entries by quarter.", by: "SBC", link: { label: "e-Filing", host: "incometax.gov.in" } },
];

export const PORTALS_LIST = [
  { group: "Setup", items: ["MCA V3 (mca.gov.in)", "GST (gst.gov.in)", "Income tax e-Filing (incometax.gov.in)", "EPFO unified portal", "ESIC portal", "Trademark (ipindia.gov.in)", "DGFT (IEC)", "Shops and Establishments (Telangana)"] },
  { group: "Recurring", items: ["GST returns", "TDS (TRACES)", "PF ECR", "ESI challan"] },
];

/* ---------- Notifications ---------- */

export interface Notification {
  id: string;
  date: Date;
  time: string;
  kind: "Action" | "Update" | "Reminder" | "Done";
  title: string;
  who: string;
  read: boolean;
  href?: string;
}

export const NOTIFICATIONS: Notification[] = [
  { id: "nt1", date: d(2026, 10, 6), time: "09:12", kind: "Action", title: "Passport copy for Director 1 sent back: scan not legible", who: "Bharath", read: false, href: "/client/incorporation/step/8" },
  { id: "nt2", date: d(2026, 10, 6), time: "08:30", kind: "Reminder", title: "Registered office documents due 9 Oct", who: "VCFO", read: false, href: "/client/incorporation/step/7" },
  { id: "nt3", date: d(2026, 10, 5), time: "17:45", kind: "Update", title: "MOA and AOA drafts reach you on 10 Oct", who: "Bharath", read: false, href: "/client/incorporation/step/11" },
  { id: "nt4", date: d(2026, 10, 3), time: "11:05", kind: "Action", title: "Subscriber sheet shared for signature", who: "Bharath", read: true, href: "/client/incorporation/step/9" },
  { id: "nt5", date: d(2026, 10, 2), time: "09:31", kind: "Done", title: "Director 1 passport received", who: "VCFO", read: true },
  { id: "nt6", date: d(2026, 9, 26), time: "15:12", kind: "Done", title: "Capital structure confirmed", who: "VCFO", read: true },
  { id: "nt7", date: d(2026, 9, 24), time: "17:50", kind: "Update", title: "Name approved: Northwind Technologies India Pvt Ltd", who: "Pranay", read: true },
  { id: "nt8", date: d(2026, 9, 19), time: "10:20", kind: "Update", title: "Name application filed with MCA", who: "Bharath", read: true },
];

/* ---------- Audit ---------- */

export interface AuditEvent {
  id: string;
  date: Date;
  time: string;
  who: string;
  role: string;
  action: string;
  target: string;
  kind: "Document" | "Step" | "Sign-in" | "Setting" | "Message";
  result: "Done" | "Sent back" | "Failed";
}

export const AUDIT: AuditEvent[] = [
  { id: "au1", date: d(2026, 10, 6), time: "09:12", who: "Bharath", role: "Project lead", action: "Sent back document", target: "Director 1 - passport.jpg", kind: "Document", result: "Sent back" },
  { id: "au2", date: d(2026, 10, 6), time: "08:30", who: "VCFO", role: "System", action: "Sent reminder", target: "Step 7 · Registered office address", kind: "Message", result: "Done" },
  { id: "au3", date: d(2026, 10, 5), time: "17:45", who: "Bharath", role: "Project lead", action: "Updated step", target: "Step 11 · SPICe+ confirmation", kind: "Step", result: "Done" },
  { id: "au4", date: d(2026, 10, 5), time: "09:02", who: "Rohan Kumar", role: "Client", action: "Signed in", target: "Chrome on Windows · Hyderabad", kind: "Sign-in", result: "Done" },
  { id: "au5", date: d(2026, 10, 3), time: "11:05", who: "Bharath", role: "Project lead", action: "Shared document", target: "Subscriber sheet.pdf", kind: "Document", result: "Done" },
  { id: "au6", date: d(2026, 10, 2), time: "09:30", who: "Rohan Kumar", role: "Client", action: "Uploaded document", target: "Director 1 - passport.jpg", kind: "Document", result: "Done" },
  { id: "au7", date: d(2026, 10, 1), time: "14:20", who: "Rohan Kumar", role: "Client", action: "Changed setting", target: "WhatsApp reminders · on", kind: "Setting", result: "Done" },
  { id: "au8", date: d(2026, 9, 30), time: "18:10", who: "Pranay", role: "Manager", action: "Edited timeline", target: "Phase 2 · end 20 Oct", kind: "Step", result: "Done" },
  { id: "au9", date: d(2026, 9, 26), time: "15:12", who: "Rohan Kumar", role: "Client", action: "Completed step", target: "Step 6 · Capital structure", kind: "Step", result: "Done" },
  { id: "au10", date: d(2026, 9, 24), time: "17:50", who: "Pranay", role: "Manager", action: "Completed step", target: "Step 5 · Name approval", kind: "Step", result: "Done" },
  { id: "au11", date: d(2026, 9, 22), time: "10:00", who: "Meera Iyer", role: "Client", action: "Sign-in failed", target: "Wrong password · 3 tries", kind: "Sign-in", result: "Failed" },
  { id: "au12", date: d(2026, 9, 19), time: "10:20", who: "Bharath", role: "Project lead", action: "Filed form", target: "RUN · name application", kind: "Step", result: "Done" },
  { id: "au13", date: d(2026, 9, 18), time: "16:40", who: "Rohan Kumar", role: "Client", action: "Uploaded document", target: "Signed Board resolution.pdf", kind: "Document", result: "Done" },
  { id: "au14", date: d(2026, 9, 14), time: "12:15", who: "Bharath", role: "Project lead", action: "Shared document", target: "Draft Board resolution.docx", kind: "Document", result: "Done" },
  { id: "au15", date: d(2026, 9, 12), time: "09:00", who: "Rohan Kumar", role: "Client", action: "Completed step", target: "Step 1 · Client details", kind: "Step", result: "Done" },
];

/* ---------- Documents explorer ---------- */

export interface DocFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  date: Date;
  from: "client" | "sbc" | "mca";
  status: "Verified" | "Received" | "Requested" | "Sent back";
  step?: number;
  folder: string;
}

export interface Folder {
  id: string;
  name: string;
  kids?: Folder[];
}

export const FOLDERS: Folder[] = [
  {
    id: "inc",
    name: "Incorporation",
    kids: [
      { id: "inc-1", name: "Phase 1 · Name application" },
      { id: "inc-2", name: "Phase 2 · Incorporation" },
      { id: "inc-3", name: "Phase 3 · Post-incorporation" },
    ],
  },
  { id: "kyc", name: "Director KYC" },
  { id: "office", name: "Registered office" },
  { id: "reg", name: "Registrations", kids: [{ id: "reg-gst", name: "GST" }, { id: "reg-tm", name: "Trademark" }] },
  { id: "comp", name: "Compliances", kids: [{ id: "comp-gst", name: "GST returns" }, { id: "comp-tds", name: "TDS" }, { id: "comp-mca", name: "MCA" }] },
];

export const FILES: DocFile[] = [
  { id: "f1", name: "Director 1 - passport.jpg", type: "JPG", size: "1.2 MB", date: d(2026, 10, 2), from: "client", status: "Sent back", step: 8, folder: "kyc" },
  { id: "f2", name: "Director 2 - passport.jpg", type: "JPG", size: "980 KB", date: d(2026, 9, 11), from: "client", status: "Verified", step: 8, folder: "kyc" },
  { id: "f3", name: "Director 1 - PAN.pdf", type: "PDF", size: "210 KB", date: d(2026, 9, 11), from: "client", status: "Verified", step: 1, folder: "kyc" },
  { id: "f4", name: "Director 2 - PAN.pdf", type: "PDF", size: "198 KB", date: d(2026, 9, 11), from: "client", status: "Verified", step: 1, folder: "kyc" },
  { id: "f5", name: "Director KYC bundle.zip", type: "ZIP", size: "4.8 MB", date: d(2026, 9, 11), from: "client", status: "Received", step: 1, folder: "kyc" },
  { id: "f6", name: "Draft Board resolution.docx", type: "DOCX", size: "52 KB", date: d(2026, 9, 14), from: "sbc", status: "Verified", step: 2, folder: "inc-1" },
  { id: "f7", name: "Signed Board resolution.pdf", type: "PDF", size: "640 KB", date: d(2026, 9, 18), from: "client", status: "Verified", step: 3, folder: "inc-1" },
  { id: "f8", name: "Name approval letter.pdf", type: "PDF", size: "184 KB", date: d(2026, 9, 24), from: "mca", status: "Verified", step: 5, folder: "inc-1" },
  { id: "f9", name: "Capital structure sheet.xlsx", type: "XLSX", size: "31 KB", date: d(2026, 9, 26), from: "sbc", status: "Verified", step: 6, folder: "inc-2" },
  { id: "f10", name: "Subscriber sheet.pdf", type: "PDF", size: "120 KB", date: d(2026, 10, 3), from: "sbc", status: "Received", step: 9, folder: "inc-2" },
  { id: "f11", name: "Rent agreement.pdf", type: "PDF", size: "", date: d(2026, 10, 9), from: "client", status: "Requested", step: 7, folder: "office" },
  { id: "f12", name: "Utility bill.pdf", type: "PDF", size: "", date: d(2026, 10, 9), from: "client", status: "Requested", step: 7, folder: "office" },
  { id: "f13", name: "NOC from owner.pdf", type: "PDF", size: "", date: d(2026, 10, 9), from: "client", status: "Requested", step: 7, folder: "office" },
  { id: "f14", name: "MOA draft.docx", type: "DOCX", size: "88 KB", date: d(2026, 10, 10), from: "sbc", status: "Requested", step: 11, folder: "inc-2" },
  { id: "f15", name: "Office photo.png", type: "PNG", size: "2.1 MB", date: d(2026, 9, 29), from: "client", status: "Verified", step: 7, folder: "office" },
];

export const docStatusTone: Record<DocFile["status"], ChipTone> = { Verified: "ok", Received: "prog", Requested: "warn", "Sent back": "bad" };

/* ---------- Library ---------- */

export interface Book {
  id: string;
  title: string;
  short: string;
  shelf: "Incorporation" | "GST" | "Income tax" | "MCA filings" | "Payroll" | "Briefs";
  pages: number;
  updated: Date;
  body: string[];
}

export const BOOKS: Book[] = [
  { id: "b1", title: "What is SPICe+?", short: "The one MCA form that incorporates a company", shelf: "Incorporation", pages: 6, updated: d(2026, 8, 2), body: ["SPICe+ is the MCA web form for company incorporation. Part A reserves the name. Part B files the incorporation, PAN, TAN, EPFO, ESIC, and GSTIN applications together.", "SBC prepares both parts. The client signs the subscriber sheet and the director declarations with a DSC.", "MCA usually approves within 5 to 7 working days after Part B. Remarks come back as a resubmission request."] },
  { id: "b2", title: "What happens after the COI?", short: "The 11 post-incorporation steps", shelf: "Incorporation", pages: 9, updated: d(2026, 8, 2), body: ["The Certificate of Incorporation starts a 30-day clock for the first board meeting, the auditor appointment (ADT-1) and the registered office confirmation (INC-22).", "The commencement declaration (INC-20A) is due within 180 days. Share certificates (SH-1) within 60 days.", "SBC schedules every step on the timeline and reminds the client before each due date."] },
  { id: "b3", title: "FC-GPR after share allotment", short: "When a foreign investor subscribes", shelf: "MCA filings", pages: 4, updated: d(2026, 7, 18), body: ["Form FC-GPR reports a share allotment to a non-resident. It is due within 30 days of allotment on the RBI FIRMS portal.", "SBC needs the FIRC, the KYC of the investor and the valuation certificate."] },
  { id: "b4", title: "GSTR-1 and GSTR-3B", short: "Monthly GST returns", shelf: "GST", pages: 7, updated: d(2026, 9, 1), body: ["GSTR-1 lists outward supplies and is due on the 11th. GSTR-3B is the summary return with payment, due on the 20th.", "Send the sales register by the 8th so SBC can reconcile before filing."] },
  { id: "b5", title: "TDS: deduct, pay, file", short: "Sections, rates and dates", shelf: "Income tax", pages: 8, updated: d(2026, 9, 1), body: ["Deduct TDS on salary, rent, contractor and professional payments. Pay by the 7th of the next month with challan 281.", "File the quarterly return (24Q, 26Q) by the end of the month after the quarter."] },
  { id: "b6", title: "PF and ESI monthly", short: "ECR and challan", shelf: "Payroll", pages: 5, updated: d(2026, 9, 1), body: ["PF ECR and payment are due on the 15th. ESI payment is due on the 15th too.", "SBC needs the payroll register by the 10th."] },
  { id: "b7", title: "DIR-3 KYC", short: "Yearly director KYC", shelf: "MCA filings", pages: 3, updated: d(2026, 8, 20), body: ["Every director with a DIN files DIR-3 KYC by 30 September. The OTP goes to the director's mobile and email."] },
  { id: "b8", title: "Monthly status brief · September", short: "PDF brief", shelf: "Briefs", pages: 2, updated: d(2026, 10, 1), body: ["Name approved on 24 Sep. Phase 2 started 25 Sep. Four items wait on Northwind. Expected COI 28 Oct."] },
  { id: "b9", title: "Trademark classes explained", short: "Picking classes 9, 35 and 42", shelf: "Incorporation", pages: 5, updated: d(2026, 6, 10), body: ["Class 9 covers software products, 35 covers business services, 42 covers software as a service."] },
];

/* ---------- Credentials ---------- */

export interface Credential {
  id: string;
  portal: string;
  host: string;
  user: string;
  holder: "client" | "sbc";
  status: "Active" | "Expiring" | "Needs reset";
  lastUsed: Date;
  twoFa: "OTP to Rohan" | "OTP to SBC" | "None";
}

export const CREDENTIALS: Credential[] = [
  { id: "c1", portal: "MCA V3", host: "mca.gov.in", user: "rohan@northwind.in", holder: "client", status: "Active", lastUsed: d(2026, 10, 3), twoFa: "OTP to Rohan" },
  { id: "c2", portal: "Income tax e-Filing", host: "incometax.gov.in", user: "AAHCN4821K", holder: "sbc", status: "Active", lastUsed: d(2026, 9, 30), twoFa: "OTP to SBC" },
  { id: "c3", portal: "GST", host: "gst.gov.in", user: "northwind.gst", holder: "sbc", status: "Needs reset", lastUsed: d(2026, 8, 12), twoFa: "OTP to Rohan" },
  { id: "c4", portal: "EPFO unified portal", host: "unifiedportal-emp.epfindia.gov.in", user: "TSHYD0012345", holder: "sbc", status: "Expiring", lastUsed: d(2026, 9, 15), twoFa: "None" },
  { id: "c5", portal: "ESIC", host: "esic.gov.in", user: "52000123450000", holder: "sbc", status: "Active", lastUsed: d(2026, 9, 15), twoFa: "None" },
  { id: "c6", portal: "Trademark (IP India)", host: "ipindiaonline.gov.in", user: "northwind.tm", holder: "sbc", status: "Active", lastUsed: d(2026, 9, 2), twoFa: "OTP to SBC" },
];
