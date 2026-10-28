import { d } from "@/lib/dates";
import type { AttentionRow } from "@/components/cards/AttentionList";
import type { Doc } from "@/components/cards/DocList";
import type { ActivityRow } from "@/components/cards/ActivityList";
import type { ProgressItem } from "@/components/cards/ProgressList";

/** Important alerts: 15 days and 30 days. */
export const ALERTS_15: AttentionRow[] = [
  { id: "a1", date: d(2026, 10, 2), title: "Passport copy sent back", sub: "Proposed directors · Director 1", chip: { label: "Overdue", tone: "bad" }, urgent: true, alert: true, action: { label: "Fix", href: "/client/incorporation/step/8" } },
  { id: "a2", date: d(2026, 10, 9), title: "2 office documents", sub: "Registered office address", chip: { label: "In 3 days", tone: "warn" }, href: "/client/incorporation/step/7" },
  { id: "a3", date: d(2026, 10, 10), title: "MOA and AOA drafts", sub: "SPICe+ confirmation", chip: { label: "In 4 days", tone: "warn" }, href: "/client/incorporation/step/11" },
  { id: "a4", date: d(2026, 10, 14), title: "Approved name expires", sub: "Name approval · 20 days left", chip: { label: "In 8 days", tone: "idle" }, href: "/client/incorporation/step/5" },
];

export const ALERTS_30: AttentionRow[] = [
  ...ALERTS_15,
  { id: "a5", date: d(2026, 10, 20), title: "SPICe+ filing", sub: "SBC files with MCA", chip: { label: "In 14 days", tone: "idle" }, href: "/client/incorporation/step/12" },
  { id: "a6", date: d(2026, 10, 28), title: "Expected COI", sub: "MCA issues the certificate", chip: { label: "In 22 days", tone: "idle" }, href: "/client/incorporation/step/14" },
];

export interface NeedRow {
  id: string;
  title: string;
  kind: "sign" | "upload" | "approve" | "pay";
  due: Date;
  step: number;
  action: string;
}

export const NEEDS: NeedRow[] = [
  { id: "n1", title: "Director 1 passport copy (clear scan)", kind: "upload", due: d(2026, 10, 2), step: 8, action: "Upload" },
  { id: "n2", title: "Rent agreement for the registered office", kind: "upload", due: d(2026, 10, 9), step: 7, action: "Upload" },
  { id: "n3", title: "Utility bill, not older than 2 months", kind: "upload", due: d(2026, 10, 9), step: 7, action: "Upload" },
  { id: "n4", title: "Subscriber sheet", kind: "sign", due: d(2026, 10, 8), step: 9, action: "Sign" },
  { id: "n5", title: "MOA and AOA drafts", kind: "approve", due: d(2026, 10, 10), step: 11, action: "Review" },
];

export const SBC_DOING: ProgressItem[] = [
  { id: "s1", name: "KYC review and DSC", sub: "Bharath · Step 10 · ready 13 Oct", pct: 30, tone: "accent", href: "/client/incorporation/step/10" },
  { id: "s2", name: "MOA and AOA drafts", sub: "Bharath · Step 11 · drafts reach Northwind 10 Oct", pct: 0, tone: "violet", href: "/client/incorporation/step/11" },
  { id: "s3", name: "DSC for both directors", sub: "Bharath · Step 10 · ready 13 Oct", pct: 0, tone: "teal", href: "/client/incorporation/step/10" },
  { id: "s4", name: "File SPICe+ Part B", sub: "Pranay · Step 12 · ready 20 Oct", pct: 0, tone: "idle", href: "/client/incorporation/step/12" },
];

export const DOCS: Doc[] = [
  { id: "d1", name: "Director 1 - passport", type: "JPG", from: "client", fromLabel: "Northwind", date: d(2026, 10, 2), href: "/client/documents/view/d1", size: "1.2 MB" },
  { id: "d2", name: "Name approval letter", type: "PDF", from: "sbc", date: d(2026, 9, 24), href: "/client/documents/view/d2", size: "184 KB" },
  { id: "d3", name: "Signed Board resolution", type: "PDF", from: "client", fromLabel: "Northwind", date: d(2026, 9, 18), href: "/client/documents/view/d3", size: "640 KB" },
  { id: "d4", name: "Draft Board resolution", type: "DOCX", from: "sbc", date: d(2026, 9, 14), href: "/client/documents/view/d4", size: "52 KB" },
  { id: "d5", name: "Capital structure sheet", type: "XLSX", from: "sbc", date: d(2026, 9, 26), href: "/client/documents/view/d5", size: "31 KB" },
  { id: "d6", name: "Director KYC bundle", type: "ZIP", from: "client", fromLabel: "Northwind", date: d(2026, 9, 11), href: "/client/documents/view/d6", size: "4.8 MB" },
];

export const ACTIVITY: ActivityRow[] = [
  { id: "ac1", date: d(2026, 10, 5), time: "16:40", text: "Passport copy for Director 1 sent back: scan not legible", who: "Bharath" },
  { id: "ac2", date: d(2026, 10, 3), time: "11:05", text: "Subscriber sheet shared for signature", who: "Bharath" },
  { id: "ac3", date: d(2026, 10, 2), time: "09:30", text: "Director 1 passport uploaded", who: "Rohan Kumar" },
  { id: "ac4", date: d(2026, 9, 26), time: "15:12", text: "Capital structure confirmed: ₹10,00,000 authorised", who: "Rohan Kumar" },
  { id: "ac5", date: d(2026, 9, 24), time: "17:50", text: "Name approved by MCA: Northwind Technologies India Pvt Ltd", who: "Pranay" },
  { id: "ac6", date: d(2026, 9, 19), time: "10:20", text: "Name application filed (RUN)", who: "Bharath" },
];

/* ---------- After incorporation ---------- */

export const AFTER_ALERTS: AttentionRow[] = ([
  { id: "b1", date: d(2026, 10, 7), title: "TDS payment · September", sub: "Income tax · challan 281", chip: { label: "Tomorrow", tone: "warn" }, href: "/client/obligations/tds-pay" },
  { id: "b2", date: d(2026, 10, 11), title: "GSTR-1 · September", sub: "GST · outward supplies", chip: { label: "In 5 days", tone: "warn" }, href: "/client/obligations/gstr1" },
  { id: "b3", date: d(2026, 10, 15), title: "PF and ESI · September", sub: "Payroll · ECR and challan", chip: { label: "In 9 days", tone: "idle" }, href: "/client/obligations/pf-esi" },
  { id: "b4", date: d(2026, 10, 20), title: "GSTR-3B · September", sub: "GST · summary return and payment", chip: { label: "In 14 days", tone: "idle" }, href: "/client/obligations/gstr3b" },
  { id: "b5", date: d(2026, 9, 30), title: "DIR-3 KYC · Director 2", sub: "MCA · yearly KYC", chip: { label: "Overdue", tone: "bad" }, urgent: true, action: { label: "Fix", href: "/client/obligations/dir3kyc" } },
] as AttentionRow[]).sort((a, b) => a.date.getTime() - b.date.getTime());

export const AFTER_SBC_DOING: ProgressItem[] = [
  { id: "t1", name: "GSTR-1 · September", sub: "Bharath · invoices reconciled", pct: 70, tone: "teal", href: "/client/obligations/gstr1" },
  { id: "t2", name: "TDS return 26Q · Q2", sub: "Bharath · due 31 Oct", pct: 40, tone: "violet", href: "/client/obligations/tds-26q" },
  { id: "t3", name: "ADT-1 auditor appointment", sub: "Pranay · board minutes awaited", pct: 20, tone: "accent", href: "/client/obligations/adt1" },
  { id: "t4", name: "Trademark · class 42", sub: "Pranay · examination report", pct: 55, tone: "warn", href: "/client/registrations/tm" },
];

export const AFTER_NEEDS: NeedRow[] = [
  { id: "m1", title: "Sales register · September", kind: "upload", due: d(2026, 10, 8), step: 0, action: "Upload" },
  { id: "m2", title: "Board minutes · first meeting", kind: "sign", due: d(2026, 10, 10), step: 0, action: "Sign" },
  { id: "m3", title: "DIR-3 KYC OTP · Director 2", kind: "approve", due: d(2026, 9, 30), step: 0, action: "Approve" },
];
