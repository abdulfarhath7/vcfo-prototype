import { d } from "@/lib/dates";
import type { StaffPortal } from "@/data/staff-clients";

// Staff email: Outlook mail shown in VCFO Suite. Ported from reference/old-screens/s/lead/Email.dc.html (templates, compose)
// and the inbox items in staff-tasks.ts. Messages are about Northwind, Kestrel and Halcyon steps and filings.

export type MailFolder = "inbox" | "sent" | "drafts";

export interface Mail {
  id: string;
  folder: MailFolder;
  /** Sender name (inbox) or recipient name (sent, drafts). */
  from: string;
  address: string;
  subject: string;
  client: string;
  date: Date;
  time: string;
  unread?: boolean;
  body: string[];
  attachments?: string[];
}

export const MAIL: Mail[] = [
  {
    id: "m01", folder: "inbox", from: "Rohan Kumar", address: "rohan@northwind.example", client: "northwind", date: d(2026, 10, 6), time: "09:12", unread: true,
    subject: "Re: Registered office NOC and utility bill",
    body: ["Hi Bharath,", "The owner signed the NOC this morning. I attach the signed copy.", "The electricity bill for September comes on Thursday. I will upload it the same day.", "Rohan"],
    attachments: ["NOC_MG_Road_signed.pdf"],
  },
  {
    id: "m02", folder: "inbox", from: "Anita Shah", address: "anita@kestrelhealth.example", client: "kestrel", date: d(2026, 10, 6), time: "08:40", unread: true,
    subject: "Purchase register for September",
    body: ["Hello,", "The purchase register for September is attached. Two invoices from Metro Cash are still with our accounts team.", "We send them by Wednesday.", "Anita"],
    attachments: ["Kestrel_purchases_Sep26.xlsx"],
  },
  {
    id: "m03", folder: "inbox", from: "GST portal", address: "noreply@gst.gov.in", client: "kestrel", date: d(2026, 10, 5), time: "17:05", unread: true,
    subject: "Notice in Form GST REG-03 · ARN AA3609261847215",
    body: ["A clarification is required for your application for registration.", "Reason: the rent agreement is not legible. Upload a clear copy within 7 working days.", "This is a system-generated message."],
    attachments: ["REG-03_notice.pdf"],
  },
  {
    id: "m04", folder: "inbox", from: "Vikram Iyer", address: "vikram@halcyonfintech.example", client: "halcyon", date: d(2026, 10, 5), time: "14:22",
    subject: "Trademark logo file",
    body: ["Bharath,", "Our designer sends the logo in SVG tomorrow. Do you also need the colour codes for the application?", "Vikram"],
  },
  {
    id: "m05", folder: "inbox", from: "Pranay", address: "pranay@sbc.example", client: "northwind", date: d(2026, 10, 5), time: "11:48",
    subject: "Northwind · passport copy sent back",
    body: ["The Director 1 passport scan is not legible. Ask Rohan for a fresh colour scan today.", "SPICe+ Part B waits on it.", "Pranay"],
  },
  {
    id: "m06", folder: "inbox", from: "Anita Shah", address: "anita@kestrelhealth.example", client: "kestrel", date: d(2026, 10, 3), time: "16:30",
    subject: "Approval to pay GSTR-3B tax",
    body: ["Approved. Pay the GST for September from the HDFC current account.", "Anita"],
  },
  {
    id: "m07", folder: "inbox", from: "MCA21", address: "noreply@mca.gov.in", client: "halcyon", date: d(2026, 10, 2), time: "10:02",
    subject: "SRN AB4410927 · ADT-1 approved",
    body: ["The form ADT-1 filed under SRN AB4410927 is approved.", "The challan and the approval letter are attached."],
    attachments: ["ADT-1_approval.pdf"],
  },
  {
    id: "m08", folder: "sent", from: "Rohan Kumar", address: "rohan@northwind.example", client: "northwind", date: d(2026, 10, 5), time: "12:10",
    subject: "Northwind · utility bill and NOC for your registered office",
    body: ["Hi Rohan,", "To file SPICe+ Part B we still need two papers for the office at MG Road:", "1. A utility bill dated after 15 September.", "2. The owner's NOC, signed and dated.", "Upload them on your Incorporation page.", "Thanks,", "Bharath"],
  },
  {
    id: "m09", folder: "sent", from: "Anita Shah", address: "anita@kestrelhealth.example", client: "kestrel", date: d(2026, 10, 4), time: "09:30",
    subject: "Kestrel · GSTR-1 for September filed",
    body: ["Hi Anita,", "GSTR-1 for September is filed. The ARN is AA290926010811K.", "GSTR-3B is due on 20 Oct. Send the purchase register by 10 Oct.", "Bharath"],
  },
  {
    id: "m10", folder: "sent", from: "Vikram Iyer", address: "vikram@halcyonfintech.example", client: "halcyon", date: d(2026, 10, 3), time: "15:45",
    subject: "Halcyon · trademark application needs your logo",
    body: ["Hi Vikram,", "The TM-A application is ready. We need the logo as an SVG or a high-resolution PNG.", "Upload it on the Registrations page.", "Bharath"],
  },
  {
    id: "m11", folder: "drafts", from: "Vikram Iyer", address: "vikram@halcyonfintech.example", client: "halcyon", date: d(2026, 10, 6), time: "10:05",
    subject: "Halcyon · GSTR-3B for August is overdue",
    body: ["Hi Vikram,", "GSTR-3B for August was due on 20 Sep. Late fee and interest grow each day.", "Send the purchase register today so we can file it."],
  },
  {
    id: "m12", folder: "drafts", from: "Rohan Kumar", address: "rohan@northwind.example", client: "northwind", date: d(2026, 10, 6), time: "09:40",
    subject: "Northwind · subscriber details for SPICe+",
    body: ["Hi Rohan,", "Step 9 needs the subscriber details: name, address, shares and the PAN of each subscriber."],
  },
];

export interface MailTemplate {
  id: string;
  name: string;
  /** "SBC branded" or "Plain". */
  style: string;
  subject: string;
  body: string;
}

export const TEMPLATES: MailTemplate[] = [
  { id: "doc", name: "Document reminder", style: "SBC branded", subject: "{client} · documents we still need", body: "Hi {name},\n\nTo finish the {step} step we still need:\n\n- \n\nUpload them on your VCFO Suite page.\n\nThanks," },
  { id: "step", name: "Step done · next step", style: "SBC branded", subject: "{client} · {step} done", body: "Hi {name},\n\nThe {step} step is done. The next step starts this week.\n\nThanks," },
  { id: "week", name: "Weekly status", style: "Plain", subject: "{client} · weekly status", body: "Hi {name},\n\nThis week:\n\n- \n\nNext week:\n\n- \n\nThanks," },
  { id: "due", name: "Filing due soon", style: "SBC branded", subject: "{client} · filing due soon", body: "Hi {name},\n\nA filing for {client} is due soon. Send the data three days before the due date.\n\nThanks," },
  { id: "welcome", name: "Welcome to VCFO Suite", style: "SBC branded", subject: "Welcome to VCFO Suite", body: "Hi {name},\n\nYour VCFO Suite account is ready. Sign in to see your steps, documents and filings.\n\nThanks," },
];

export const MAIL_ADDRESS: Record<StaffPortal, string> = {
  lead: "bharath@sbc.example",
  manager: "pranay@sbc.example",
  admin: "krishna@sbc.example",
};

/* ---------- Recipients for the "To" picker ---------- */
// From reference/old-screens/s/lead/Email.dc.html: client contacts, SBC team members and two groups.

export interface Recipient {
  id: string;
  name: string;
  email: string;
  /** "client" people carry a client id; "team" people are SBC staff. */
  kind: "client" | "team";
  client?: string;
  /** Second line in the picker: client short name or the SBC role. */
  org: string;
}

export const RECIPIENTS: Recipient[] = [
  { id: "rohan", name: "Rohan Kumar", email: "rohan@northwind.example", kind: "client", client: "northwind", org: "Northwind" },
  { id: "meera-i", name: "Meera Iyer", email: "meera@northwind.example", kind: "client", client: "northwind", org: "Northwind" },
  { id: "anita", name: "Anita Shah", email: "anita@kestrelhealth.example", kind: "client", client: "kestrel", org: "Kestrel" },
  { id: "vikram", name: "Vikram Iyer", email: "vikram@halcyonfintech.example", kind: "client", client: "halcyon", org: "Halcyon" },
  { id: "mei", name: "Mei Tanaka", email: "mei@tidewater.example", kind: "client", client: "tidewater", org: "Tidewater" },
  { id: "sana", name: "Sana Qureshi", email: "sana@orchid.example", kind: "client", client: "orchid", org: "Orchid Lane" },
  { id: "kiran", name: "Kiran Rao", email: "kiran@deltaedu.example", kind: "client", client: "brightwave", org: "Brightwave" },
  { id: "isha", name: "Isha Menon", email: "isha@emberstudios.example", kind: "client", client: "larkspur", org: "Larkspur" },
  { id: "omar", name: "Omar Khan", email: "omar@juniperbio.example", kind: "client", client: "juniper", org: "Juniper" },
  { id: "pranay", name: "Pranay", email: "pranay@sbc.example", kind: "team", org: "Manager" },
  { id: "bharath", name: "Bharath", email: "bharath@sbc.example", kind: "team", org: "Project lead" },
  { id: "sneha", name: "Sneha Kulkarni", email: "sneha@sbc.example", kind: "team", org: "Project lead" },
  { id: "meera-n", name: "Meera Nair", email: "meera.nair@sbc.example", kind: "team", org: "Project lead" },
  { id: "krishna", name: "Krishna", email: "krishna@sbc.example", kind: "team", org: "Admin" },
];

export interface RecipientGroup {
  id: string;
  name: string;
  /** Who the group sends to, for the chip title. */
  members: string;
}

export const GROUPS: RecipientGroup[] = [
  { id: "all-teams", name: "All teams", members: "Every SBC project lead and manager" },
  { id: "all-clients", name: "All clients", members: "The primary contact of each client" },
  { id: "my-team", name: "My team", members: "Pranay, Bharath, Sneha Kulkarni, Meera Nair" },
];
