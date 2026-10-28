// Developer console sample data. Ported from reference/old-patch/dev/data.js and detail.js.
// The console sits on STAFF_TODAY (Fri 16 Oct 2026) with the old release names (2026.10.21 is live), as in devdata.js.
// Secrets are always masked. Demo values only.
import type { ChipTone } from "@/components/ui/Chip";

/** A moment on a given day: at(10, 16, 12, 30) is 16 Oct 2026 12:30. */
export function at(m: number, day: number, h = 0, min = 0, s = 0, y = 2026) {
  return new Date(y, m - 1, day, h, min, s);
}

const pad = (n: number) => String(n).padStart(2, "0");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "6 Oct 12:30" */
export function stamp(t: Date) {
  return `${t.getDate()} ${MONTHS[t.getMonth()]} ${pad(t.getHours())}:${pad(t.getMinutes())}`;
}

/** "6 Oct 12:30:08" */
export function stampSec(t: Date) {
  return `${stamp(t)}:${pad(t.getSeconds())}`;
}

/** "₹9,200" */
export function rupees(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

// ---------- Connections ----------

export type ConnStatus = "Connected" | "Needs re-auth" | "Offline" | "Not connected";
export const CONN_TONE: Record<ConnStatus, ChipTone> = { Connected: "ok", "Needs re-auth": "warn", Offline: "bad", "Not connected": "idle" };

export interface ConnEvent {
  at: Date;
  text: string;
  tone?: ChipTone;
  chip?: string;
}

export interface Connection {
  id: string;
  name: string;
  provider: string;
  kind: string;
  status: ConnStatus;
  account: string;
  lastSync: Date;
  /** Key, secret or token expiry. Null: no expiry (IAM role or a key without one). */
  authExpires: Date | null;
  /** False when the service signs with an IAM role and no key is stored. */
  hasKey: boolean;
  /** Masked secret, shown in the detail. */
  secret?: string;
  endpoint: string;
  scopes: string[];
  webhook?: string;
  events: ConnEvent[];
  /** Settings and health lines for a connection without a full detail spec (dev-connections.ts). */
  lines?: string[];
}

const HOOK = "https://app.sbctrack.in/api/webhooks";

export const CONNECTIONS: Connection[] = [
  {
    id: "ses",
    name: "Email",
    provider: "Amazon SES",
    kind: "Messaging",
    status: "Connected",
    account: "sbcllp.in · 4 sending addresses",
    lastSync: at(10, 16, 12, 20),
    authExpires: null,
    hasKey: false,
    endpoint: "email.ap-south-1.amazonaws.com",
    scopes: ["ses:SendEmail", "ses:SendRawEmail", "sns:Publish"],
    webhook: `${HOOK}/ses`,
    events: [
      { at: at(10, 16, 12, 20), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 16, 11, 30), text: "Soft bounce from accounts@halcyonfin.example", chip: "Bounce", tone: "warn" },
      { at: at(10, 16, 8, 0), text: "61 deadline reminders accepted", chip: "OK", tone: "ok" },
      { at: at(10, 15, 17, 10), text: "DMARC report received: 0 failures", chip: "OK", tone: "ok" },
      { at: at(10, 15, 9, 0), text: "Suppression list: 1 address added", chip: "Info", tone: "idle" },
    ],
  },
  {
    id: "wa",
    name: "WhatsApp Business",
    provider: "AWS End User Messaging",
    kind: "Messaging",
    status: "Connected",
    account: "+91 80 4718 2290 · SBC LLP",
    lastSync: at(10, 16, 12, 5),
    authExpires: null,
    hasKey: false,
    endpoint: "social-messaging.ap-south-1.amazonaws.com",
    scopes: ["social-messaging:SendWhatsAppMessage", "social-messaging:GetLinkedWhatsAppBusinessAccount"],
    webhook: `${HOOK}/whatsapp`,
    events: [
      { at: at(10, 16, 12, 5), text: "Message delivered to Northwind", chip: "OK", tone: "ok" },
      { at: at(10, 16, 12, 0), text: "Template deadline_1d rejected: not approved yet", chip: "Failed", tone: "bad" },
      { at: at(10, 16, 10, 0), text: "Template deadline_1d rejected: not approved yet", chip: "Failed", tone: "bad" },
      { at: at(10, 15, 16, 2), text: "Quality rating: High", chip: "OK", tone: "ok" },
      { at: at(10, 14, 11, 20), text: "Template registration_granted submitted to Meta", chip: "Waiting", tone: "warn" },
    ],
  },
  {
    id: "sms",
    name: "SMS",
    provider: "MSG91 · DLT registered",
    kind: "Messaging",
    status: "Connected",
    account: "Sender ID SBCLLP",
    lastSync: at(10, 16, 11, 50),
    authExpires: at(6, 23, 0, 0, 0, 2027),
    hasKey: true,
    endpoint: "control.msg91.com/api/v5",
    scopes: ["flow:send", "otp:send", "balance:read"],
    webhook: `${HOOK}/msg91`,
    events: [
      { at: at(10, 16, 11, 50), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 16, 9, 30), text: "4 overdue alerts sent", chip: "OK", tone: "ok" },
      { at: at(10, 16, 9, 12), text: "Sign-in code sent to Farhath", chip: "OK", tone: "ok" },
      { at: at(10, 15, 18, 0), text: "Balance 18,400 messages", chip: "Info", tone: "idle" },
      { at: at(10, 13, 10, 4), text: "DLT template payment_sms registered", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "outlook",
    name: "Outlook mailbox and calendar",
    provider: "Microsoft Graph",
    kind: "Microsoft 365",
    status: "Connected",
    account: "updates@sbcllp.in · 18 staff calendars",
    lastSync: at(10, 16, 12, 15),
    authExpires: at(2, 4, 0, 0, 0, 2027),
    hasKey: true,
    endpoint: "graph.microsoft.com/v1.0",
    scopes: ["Mail.Send", "Mail.ReadWrite", "Calendars.ReadWrite", "User.Read.All", "offline_access"],
    webhook: `${HOOK}/graph`,
    events: [
      { at: at(10, 16, 12, 30), text: "Calendar sync: 18 calendars, 4 changes", chip: "OK", tone: "ok" },
      { at: at(10, 16, 12, 15), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 16, 11, 2), text: "Client reply from Kestrel filed to the client page", chip: "OK", tone: "ok" },
      { at: at(10, 16, 9, 45), text: "Subscription renewed for updates@sbcllp.in", chip: "OK", tone: "ok" },
      { at: at(10, 15, 16, 30), text: "Calendar sync: 18 calendars, 11 changes", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "teams",
    name: "Teams channels and bot",
    provider: "Microsoft Teams",
    kind: "Microsoft 365",
    status: "Needs re-auth",
    account: "3 channels · VCFO bot",
    lastSync: at(10, 16, 12, 15),
    authExpires: at(10, 25),
    hasKey: true,
    endpoint: "sbcllp.webhook.office.com/webhookb2/7c2e…41b0",
    scopes: ["ChannelMessage.Send", "Team.ReadBasic.All"],
    webhook: `${HOOK}/teams`,
    events: [
      { at: at(10, 16, 12, 15), text: "Webhook token expires on 25 Oct", chip: "Re-auth", tone: "warn" },
      { at: at(10, 16, 9, 0), text: "Staff daily digest posted to Compliance alerts", chip: "OK", tone: "ok" },
      { at: at(10, 15, 18, 12), text: "Webhook token expires in 10 days", chip: "Re-auth", tone: "warn" },
      { at: at(10, 15, 14, 40), text: "Escalation card posted to Incorporations", chip: "OK", tone: "ok" },
      { at: at(10, 15, 9, 0), text: "Staff daily digest posted to Compliance alerts", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "ext",
    name: "VCFO Assist extension",
    provider: "Chrome extension · MCA V3 and GST",
    kind: "Government portals",
    status: "Connected",
    account: "6 browsers · version 1.4.2",
    lastSync: at(10, 16, 12, 24),
    authExpires: at(3, 1, 0, 0, 0, 2027),
    hasKey: true,
    endpoint: "app.sbctrack.in/api/ext/v1",
    scopes: ["mca:read", "gst:read", "challan:read"],
    events: [
      { at: at(10, 16, 12, 24), text: "Portal sync: 31 forms tracked", chip: "OK", tone: "ok" },
      { at: at(10, 16, 11, 54), text: "Portal sync: 31 forms tracked", chip: "OK", tone: "ok" },
      { at: at(10, 16, 10, 24), text: "MCA V3 timed out once, retried", chip: "Retry", tone: "warn" },
      { at: at(10, 16, 9, 2), text: "Pranay's browser is on 1.4.1", chip: "Update", tone: "warn" },
      { at: at(10, 15, 17, 40), text: "SRN F12345678 status read for Orchid Lane", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "esign",
    name: "e-Sign",
    provider: "Leegality · Aadhaar eSign and DSC",
    kind: "Signing",
    status: "Connected",
    account: "40 signatures left",
    lastSync: at(10, 15, 17, 2),
    authExpires: at(3, 31, 0, 0, 0, 2027),
    hasKey: true,
    endpoint: "app.leegality.com/api/v3.1",
    secret: "lgl_live_•••• 7e20",
    lines: ["Board resolutions and engagement letters", "DSC signing through the extension for MCA forms", "Signature pack: 40 left"],
    scopes: ["document:create", "document:sign", "document:read"],
    webhook: `${HOOK}/leegality`,
    events: [
      { at: at(10, 15, 17, 2), text: "Board resolution signed for Kestrel", chip: "OK", tone: "ok" },
      { at: at(10, 15, 11, 15), text: "Engagement letter sent to Orchid Lane", chip: "OK", tone: "ok" },
      { at: at(10, 13, 15, 30), text: "Signature pack: 40 left", chip: "Info", tone: "idle" },
      { at: at(10, 12, 12, 0), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 11, 10, 10), text: "DSC signing through the extension: 3 forms", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "pay",
    name: "Payments",
    provider: "Razorpay",
    kind: "Money",
    status: "Connected",
    account: "Fee links and UPI · live mode",
    lastSync: at(10, 16, 10, 2),
    authExpires: null,
    hasKey: true,
    endpoint: "api.razorpay.com/v1",
    scopes: ["payments", "invoices", "refunds", "settlements:read"],
    webhook: `${HOOK}/razorpay`,
    events: [
      { at: at(10, 16, 10, 2), text: "invoice.paid: INV-2026-0418 by UPI", chip: "OK", tone: "ok" },
      { at: at(10, 16, 9, 0), text: "Settlement to SBC LLP current account", chip: "OK", tone: "ok" },
      { at: at(10, 15, 15, 20), text: "payment.captured: INV-2026-0416", chip: "OK", tone: "ok" },
      { at: at(10, 15, 11, 2), text: "Webhook signature checked", chip: "OK", tone: "ok" },
      { at: at(10, 14, 18, 0), text: "refund.processed: INV-2026-0397", chip: "Info", tone: "idle" },
    ],
  },
  {
    id: "acct",
    name: "Accounting sync",
    provider: "Tally Prime",
    kind: "Money",
    status: "Offline",
    account: "Tally connector on the office PC",
    lastSync: at(10, 13, 23, 0),
    authExpires: at(2, 20, 0, 0, 0, 2027),
    hasKey: true,
    endpoint: "http://tally-pc.local:9000",
    secret: "vk_live_tc81 ••••",
    lines: ["Tally Prime and Zoho Books", "Pushes invoices and receipts nightly at 23:00", "The office PC was offline on 13 Oct; 6 invoices are waiting"],
    scopes: ["invoices:write", "receipts:write"],
    events: [
      { at: at(10, 15, 23, 0), text: "Tally push skipped: connector offline", chip: "Offline", tone: "bad" },
      { at: at(10, 14, 23, 0), text: "Tally push skipped: connector offline", chip: "Offline", tone: "bad" },
      { at: at(10, 13, 23, 0), text: "Tally push: 4 invoices, 2 receipts", chip: "OK", tone: "ok" },
      { at: at(10, 12, 23, 0), text: "Tally push: 3 invoices", chip: "OK", tone: "ok" },
      { at: at(10, 11, 23, 0), text: "Tally push: 5 invoices, 1 receipt", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "ai",
    name: "Ask VCFO",
    provider: "Anthropic Claude API",
    kind: "AI",
    status: "Connected",
    account: "Model claude-sonnet-5-5",
    lastSync: at(10, 16, 12, 30),
    authExpires: null,
    hasKey: true,
    endpoint: "api.anthropic.com/v1/messages",
    scopes: ["messages:create"],
    events: [
      { at: at(10, 16, 12, 30), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 16, 12, 12), text: "Answer for Northwind: 2.1 s", chip: "OK", tone: "ok" },
      { at: at(10, 16, 11, 40), text: "Rate limit reached once, retried", chip: "Retry", tone: "warn" },
      { at: at(10, 16, 9, 0), text: "Question log: 312 entries over 30 days deleted", chip: "Info", tone: "idle" },
      { at: at(10, 15, 17, 55), text: "Answer for Kestrel: 1.8 s", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "s3",
    name: "Storage",
    provider: "Amazon S3",
    kind: "Platform",
    status: "Connected",
    account: "sbc-vcfo-prod · versioning on",
    lastSync: at(10, 16, 12, 30),
    authExpires: null,
    hasKey: false,
    endpoint: "s3.ap-south-1.amazonaws.com/sbc-vcfo-prod",
    scopes: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
    events: [
      { at: at(10, 16, 12, 30), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 16, 11, 48), text: "14 files uploaded by Northwind", chip: "OK", tone: "ok" },
      { at: at(10, 16, 2, 10), text: "Lifecycle: 212 old versions moved to Glacier", chip: "Info", tone: "idle" },
      { at: at(10, 15, 16, 5), text: "Presigned URL expired before use", chip: "Info", tone: "idle" },
      { at: at(10, 15, 2, 9), text: "Lifecycle: 188 old versions moved to Glacier", chip: "Info", tone: "idle" },
    ],
  },
  {
    id: "mon",
    name: "Error tracking",
    provider: "Sentry",
    kind: "Platform",
    status: "Connected",
    account: "vcfo-suite-web",
    lastSync: at(10, 16, 12, 31),
    authExpires: null,
    hasKey: true,
    endpoint: "o4508.ingest.sentry.io",
    scopes: ["event:write", "project:read"],
    webhook: `${HOOK}/sentry`,
    events: [
      { at: at(10, 16, 11, 42), text: "New issue: portal credentials failed to decrypt", chip: "New", tone: "bad" },
      { at: at(10, 16, 11, 42), text: "Alert posted to Compliance alerts", chip: "OK", tone: "ok" },
      { at: at(10, 16, 10, 15), text: "Issue resolved: calendar sync timeout", chip: "OK", tone: "ok" },
      { at: at(10, 15, 20, 1), text: "New issue: PDF preview out of memory", chip: "New", tone: "bad" },
      { at: at(10, 15, 16, 41), text: "Release 2026.10.21 created", chip: "Info", tone: "idle" },
    ],
  },
  {
    id: "hooks",
    name: "Webhooks and API keys",
    provider: "For other systems",
    kind: "Platform",
    status: "Connected",
    account: "2 keys · 3 webhooks",
    lastSync: at(10, 16, 9, 0),
    authExpires: null,
    hasKey: true,
    endpoint: "app.sbctrack.in/api/v1",
    scopes: ["filing.filed", "step.completed", "invoice.paid"],
    events: [
      { at: at(10, 16, 9, 0), text: "Partner dashboard key used: read clients", chip: "OK", tone: "ok" },
      { at: at(10, 16, 2, 10), text: "invoice.paid to tally-pc.local failed 3 times", chip: "Failed", tone: "bad" },
      { at: at(10, 15, 17, 2), text: "step.completed delivered to partners.sbcllp.in", chip: "OK", tone: "ok" },
      { at: at(10, 15, 16, 40), text: "filing.filed delivered to partners.sbcllp.in", chip: "OK", tone: "ok" },
      { at: at(10, 13, 23, 0), text: "Tally connector key used: 4 invoices", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "google",
    name: "Google Workspace",
    provider: "Gmail, Calendar, Drive",
    kind: "Workspace",
    status: "Not connected",
    account: "Not connected",
    lastSync: at(10, 16, 0, 0),
    authExpires: null,
    hasKey: false,
    endpoint: "www.googleapis.com",
    scopes: ["gmail.send", "calendar.events", "drive.readonly"],
    events: [],
    lines: ["Optional: for clients and staff on Google", "Calendar sync and Drive import of documents"],
  },
  {
    id: "gsp",
    name: "GST API",
    provider: "GST Suvidha Provider (GSP)",
    kind: "Government portals",
    status: "Not connected",
    account: "Not connected",
    lastSync: at(10, 16, 0, 0),
    authExpires: null,
    hasKey: false,
    endpoint: "gsp.example.in/gst/v1.1",
    scopes: ["gstr1:file", "gstr3b:file", "gstr2b:read"],
    events: [],
    lines: ["Would file GSTR-1 and 3B and pull 2B without the portal", "Needs a GSP contract and each client's consent"],
  },
  {
    id: "eri",
    name: "Income-tax ERI API",
    provider: "e-Return Intermediary",
    kind: "Government portals",
    status: "Not connected",
    account: "Application in progress",
    lastSync: at(10, 16, 0, 0),
    authExpires: null,
    hasKey: false,
    endpoint: "eportal.incometax.gov.in/iec/eri",
    scopes: ["itr:prefill", "itr:file", "itr:status"],
    events: [],
    lines: ["SBC holds the ERI documentation", "Would prefill and file ITRs for consenting clients"],
  },
  {
    id: "digi",
    name: "DigiLocker",
    provider: "Issued documents",
    kind: "Government portals",
    status: "Not connected",
    account: "Not connected",
    lastSync: at(10, 16, 0, 0),
    authExpires: null,
    hasKey: false,
    endpoint: "api.digitallocker.gov.in/public/oauth2",
    scopes: ["pan:read", "aadhaar:read", "driving_licence:read"],
    events: [],
    lines: ["Pull PAN, Aadhaar and driving licence with consent", "Cuts KYC uploads at onboarding"],
  },
];

/** Connect steps for a service that is not connected yet. */
export interface ConnectStep {
  label: string;
  kind: "signin" | "input" | "consent";
  /** Input: field label. Sign-in: button label. */
  field?: string;
  placeholder?: string;
  /** Consent: one checkbox each. */
  items?: string[];
}

export const CONNECT_STEPS: Record<string, ConnectStep[]> = {
  google: [
    { label: "Sign in as a Google Workspace admin", kind: "signin", field: "Sign in with Google" },
    { label: "Grant access", kind: "consent", items: ["Send mail as staff (gmail.send)", "Read and write calendars (calendar.events)", "Read Drive files picked by staff (drive.readonly)"] },
  ],
  gsp: [
    { label: "Enter the GSP contract", kind: "input", field: "GSP API user", placeholder: "sbcllp_gsp_01" },
    { label: "Enter the API key", kind: "input", field: "API key", placeholder: "Paste the key" },
    { label: "Confirm client consent", kind: "consent", items: ["Each client signs the GSP consent before filing", "OTP from the GST portal on each first use"] },
  ],
  eri: [
    { label: "Enter the ERI user ID", kind: "input", field: "ERI user ID", placeholder: "ERIP012345" },
    { label: "Upload the signed ERI agreement", kind: "signin", field: "Pick the PDF" },
    { label: "Confirm client consent", kind: "consent", items: ["Each client adds SBC as ERI on the e-Filing portal", "Prefill and filing only after the client approves"] },
  ],
  digi: [
    { label: "Enter the partner client ID", kind: "input", field: "Client ID", placeholder: "SBC-DL-0001" },
    { label: "Sign in to the DigiLocker partner portal", kind: "signin", field: "Sign in to DigiLocker" },
    { label: "Pick documents", kind: "consent", items: ["PAN card", "Aadhaar", "Driving licence"] },
  ],
};

// ---------- Services and incidents (overview) ----------

export type SvcStatus = "Working" | "Needs attention" | "Down";
export const SVC_TONE: Record<SvcStatus, ChipTone> = { Working: "ok", "Needs attention": "warn", Down: "bad" };

export interface Service {
  id: string;
  name: string;
  what: string;
  status: SvcStatus;
  /** Uptime over 30 days, percent. */
  uptime: number;
  /** p95 response time in ms. 0: not measured. */
  p95: number;
  note: string;
}

export const SERVICES: Service[] = [
  { id: "web", name: "Web app", what: "AWS App Runner · ap-south-1", status: "Working", uptime: 99.98, p95: 210, note: "Version 2026.10.21 · 2 instances" },
  { id: "db", name: "Database", what: "Amazon RDS Postgres 16", status: "Working", uptime: 99.99, p95: 12, note: "4.2 GB of 20 GB" },
  { id: "store", name: "File storage", what: "Amazon S3", status: "Working", uptime: 100, p95: 48, note: "38 GB · 21,406 files" },
  { id: "jobs", name: "Background jobs", what: "Inngest", status: "Needs attention", uptime: 99.7, p95: 0, note: "1 job failed in 24 hours" },
  { id: "email", name: "Email", what: "Amazon SES", status: "Working", uptime: 99.95, p95: 340, note: "98.6% delivered this week" },
  { id: "wa", name: "WhatsApp", what: "AWS End User Messaging", status: "Needs attention", uptime: 99.4, p95: 900, note: "3 templates waiting for Meta approval" },
  { id: "m365", name: "Microsoft 365", what: "Outlook and Teams", status: "Needs attention", uptime: 99.9, p95: 420, note: "Teams webhook token expires in 9 days" },
  { id: "ai", name: "Ask VCFO", what: "Claude API", status: "Working", uptime: 99.9, p95: 2100, note: "1,842 answers this month" },
  { id: "ext", name: "Portal extension", what: "VCFO Assist (MCA and GST)", status: "Working", uptime: 99.5, p95: 0, note: "6 browsers active" },
];

export interface Incident {
  id: string;
  date: Date;
  what: string;
  where: string;
  length: string;
  status: "Resolved" | "Open";
}

export const INCIDENTS: Incident[] = [
  { id: "i1", date: at(10, 14), what: "MCA portal timed out for VCFO Assist", where: "Portal extension", length: "38 minutes", status: "Resolved" },
  { id: "i2", date: at(10, 12), what: "3 WhatsApp templates waiting for Meta approval", where: "WhatsApp", length: "open 4 days", status: "Open" },
  { id: "i3", date: at(10, 9), what: "Amazon SES throttled sending", where: "Email", length: "12 minutes", status: "Resolved" },
  { id: "i4", date: at(10, 4), what: "Deploy 2026.10.12 rolled back", where: "Web app", length: "4 minutes", status: "Resolved" },
];

export interface Environment {
  id: string;
  name: string;
  address: string;
  version: string;
  commit: string;
  deployed: Date | null;
  by: string;
}

export const ENVIRONMENTS: Environment[] = [
  { id: "prod", name: "Production", address: "app.sbctrack.in", version: "2026.10.21", commit: "6c26d7e", deployed: at(10, 15, 16, 40), by: "Farhath" },
  { id: "stg", name: "Staging", address: "staging.sbctrack.in", version: "2026.10.22-rc1", commit: "a41be09", deployed: at(10, 16, 11, 20), by: "Farhath" },
  { id: "local", name: "Local", address: "localhost:3000", version: "design/design-system", commit: "uncommitted", deployed: null, by: "Farhath" },
];

// ---------- Jobs ----------

export type JobStatus = "Succeeded" | "Failed" | "Running" | "Skipped";
export const JOB_TONE: Record<JobStatus, ChipTone> = { Succeeded: "ok", Failed: "bad", Running: "prog", Skipped: "warn" };

export interface LogLine {
  at: Date;
  level: "info" | "warn" | "error";
  text: string;
}

export interface Job {
  id: string;
  name: string;
  cron: string;
  lastRun: Date | null;
  duration: string;
  status: JobStatus;
  nextRun: Date;
  failures7d: number;
  log: LogLine[];
}

export const JOBS: Job[] = [
  {
    id: "deadline",
    name: "Deadline reminders",
    cron: "0 8 * * *",
    lastRun: at(10, 16, 8, 0),
    duration: "41 s",
    status: "Succeeded",
    nextRun: at(10, 17, 8, 0),
    failures7d: 0,
    log: [
      { at: at(10, 6, 8, 0, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 16, 8, 0, 3), level: "info", text: "Found 61 reminders due: 7-day 22, 3-day 18, 1-day 21" },
      { at: at(10, 16, 8, 0, 38), level: "info", text: "Email: 61 accepted by SES, 0 failed" },
      { at: at(10, 16, 8, 0, 41), level: "info", text: "Finished in 41 s" },
    ],
  },
  {
    id: "overdue",
    name: "Overdue sweep",
    cron: "30 9 * * *",
    lastRun: at(10, 16, 9, 30),
    duration: "12 s",
    status: "Succeeded",
    nextRun: at(10, 17, 9, 30),
    failures7d: 0,
    log: [
      { at: at(10, 6, 9, 30, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 16, 9, 30, 4), level: "info", text: "4 items passed their date overnight" },
      { at: at(10, 16, 9, 30, 10), level: "info", text: "SMS to Tidewater, Larkspur, Brightwave and Orchid Lane" },
      { at: at(10, 16, 9, 30, 12), level: "info", text: "Finished in 12 s: 4 alerts sent" },
    ],
  },
  {
    id: "wa-nudges",
    name: "WhatsApp reminders",
    cron: "0 */2 * * *",
    lastRun: at(10, 16, 12, 0),
    duration: "8 s",
    status: "Failed",
    nextRun: at(10, 16, 14, 0),
    failures7d: 3,
    log: [
      { at: at(10, 6, 12, 0, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 16, 12, 0, 2), level: "info", text: "Found 14 document reminders and 14 deadline reminders" },
      { at: at(10, 16, 12, 0, 5), level: "info", text: "doc_nudge_hi_en: 14 sent" },
      { at: at(10, 16, 12, 0, 7), level: "error", text: "deadline_1d: template not approved by Meta (132001)" },
      { at: at(10, 16, 12, 0, 7), level: "warn", text: "SMS fallback is off for deadline_1d: 14 recipients skipped" },
      { at: at(10, 16, 12, 0, 8), level: "error", text: "Finished with errors in 8 s" },
    ],
  },
  {
    id: "outlook-sync",
    name: "Outlook calendar sync",
    cron: "*/15 * * * *",
    lastRun: at(10, 16, 12, 30),
    duration: "5 s",
    status: "Running",
    nextRun: at(10, 16, 12, 45),
    failures7d: 0,
    log: [
      { at: at(10, 6, 12, 30, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 16, 12, 30, 2), level: "info", text: "Reading 18 staff calendars" },
      { at: at(10, 16, 12, 30, 5), level: "info", text: "12 of 18 calendars read, 4 changes so far" },
    ],
  },
  {
    id: "portal-sync",
    name: "Portal status sync",
    cron: "*/30 * * * *",
    lastRun: at(10, 16, 12, 24),
    duration: "19 s",
    status: "Succeeded",
    nextRun: at(10, 16, 12, 54),
    failures7d: 1,
    log: [
      { at: at(10, 6, 12, 24, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 16, 12, 24, 6), level: "info", text: "MCA V3: 24 forms read" },
      { at: at(10, 16, 12, 24, 15), level: "info", text: "GST portal: 7 returns read" },
      { at: at(10, 16, 12, 24, 19), level: "info", text: "Finished in 19 s: 31 forms tracked, 2 status changes" },
    ],
  },
  {
    id: "tally",
    name: "Tally push",
    cron: "0 23 * * *",
    lastRun: at(10, 15, 23, 0),
    duration: "-",
    status: "Skipped",
    nextRun: at(10, 16, 23, 0),
    failures7d: 2,
    log: [
      { at: at(10, 5, 23, 0, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 15, 23, 0, 30), level: "warn", text: "No answer from http://tally-pc.local:9000 after 30 s" },
      { at: at(10, 15, 23, 0, 30), level: "warn", text: "Skipped: 6 invoices wait for the next run" },
    ],
  },
  {
    id: "monthly-reports",
    name: "Monthly client reports",
    cron: "0 8 1 * *",
    lastRun: at(10, 1, 8, 0),
    duration: "6 min 12 s",
    status: "Succeeded",
    nextRun: at(11, 1, 8, 0),
    failures7d: 0,
    log: [
      { at: at(10, 1, 8, 0, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 1, 8, 5, 40), level: "info", text: "48 reports built as PDF" },
      { at: at(10, 1, 8, 6, 12), level: "info", text: "Finished in 6 min 12 s: 48 emails accepted by SES" },
    ],
  },
  {
    id: "partner-report",
    name: "Partner report",
    cron: "0 7 1 * *",
    lastRun: at(10, 1, 7, 0),
    duration: "48 s",
    status: "Succeeded",
    nextRun: at(11, 1, 7, 0),
    failures7d: 0,
    log: [
      { at: at(10, 1, 7, 0, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 1, 7, 0, 48), level: "info", text: "Finished in 48 s: sent to Mithilesh and 2 partners" },
    ],
  },
  {
    id: "backup",
    name: "Database backup",
    cron: "0 2 * * *",
    lastRun: at(10, 16, 2, 0),
    duration: "3 min 40 s",
    status: "Succeeded",
    nextRun: at(10, 17, 2, 0),
    failures7d: 0,
    log: [
      { at: at(10, 6, 2, 0, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 16, 2, 3, 31), level: "info", text: "Snapshot vcfo-prod-2026-10-16 created: 4.2 GB" },
      { at: at(10, 16, 2, 3, 40), level: "info", text: "Finished in 3 min 40 s. Snapshots older than 35 days deleted: 1" },
    ],
  },
];

/** Plain schedule for each job, times in IST. */
export const JOB_RUNS: Record<string, string> = {
  deadline: "Daily 08:00",
  overdue: "Daily 09:30",
  "wa-nudges": "Every 2 hours",
  "outlook-sync": "Every 15 minutes",
  "portal-sync": "Every 30 minutes",
  tally: "Nightly 23:00",
  "monthly-reports": "1st of the month 08:00",
  "partner-report": "1st of the month 07:00",
  backup: "Daily 02:00",
};

export interface JobFailure {
  id: string;
  job: string;
  at: Date;
  cause: string;
  status: "Failed" | "Skipped";
}

export const JOB_FAILURES: JobFailure[] = [
  { id: "f1", job: "wa-nudges", at: at(10, 16, 12, 0), cause: "Template deadline_1d not approved; 14 messages not sent", status: "Failed" },
  { id: "f2", job: "tally", at: at(10, 15, 23, 0), cause: "Connector on the office PC did not answer", status: "Skipped" },
  { id: "f3", job: "portal-sync", at: at(10, 14, 10, 30), cause: "MCA V3 portal timed out; next run succeeded", status: "Failed" },
];

export const QUEUE_FACTS = [
  { k: "App", v: "vcfo-suite-prod on Inngest Cloud", mono: true },
  { k: "Waiting", v: "0" },
  { k: "Retries", v: "3 times, up to 1 hour apart" },
];

// ---------- Logs ----------

export type LogLevel = "Error" | "Warn" | "Info";
export const LEVEL_TONE: Record<LogLevel, ChipTone> = { Error: "bad", Warn: "warn", Info: "idle" };

export interface LogRow {
  id: string;
  at: Date;
  level: LogLevel;
  service: string;
  message: string;
  requestId: string;
  /** Expanded text of the log line. */
  detail: string;
}

const LOG_SEED: Array<[LogLevel, string, string, string]> = [
  ["Error", "WhatsApp", "Template deadline_1d rejected: not approved yet", "Send blocked for 14 recipients. The template waits for Meta approval (submitted 14 Oct)."],
  ["Error", "Web app", "Portal credentials failed to decrypt: CREDENTIALS_ENCRYPTION_KEY not set", "CREDENTIALS_ENCRYPTION_KEY is not set on App Runner. Every portal credential read throws in production."],
  ["Info", "Microsoft 365", "Calendar sync: 18 calendars, 4 changes", "2 filing dates moved, 2 client meetings added. No conflicts."],
  ["Warn", "Email", "Soft bounce: accounts@halcyonfin.example (mailbox full)", "Mailbox full. SES retries for 12 hours."],
  ["Info", "Ask VCFO", "Answer for Northwind in 2.1 s", "Question about the GSTR-3B due date. 1,240 tokens. Client data only."],
  ["Info", "Portal extension", "Portal sync: 31 forms tracked", "MCA V3: 24 forms. GST portal: 7 returns. 2 status changes."],
  ["Info", "Payments", "Webhook invoice.paid received: INV-2026-0418", "Aurora Paints paid INV-2026-0418 (₹52,500) by UPI."],
  ["Info", "Web app", "GET /client/home 200 in 184 ms", "Signed-in client Rohan Kumar. Cache hit for the incorporation timeline."],
  ["Warn", "Ask VCFO", "Rate limit reached, retried after 2 s", "429 from api.anthropic.com. The retry succeeded."],
  ["Info", "Jobs", "Overdue sweep finished: 4 alerts sent", "SMS to Coral Studios, Ember Textiles, Kestrel Health and Brightwave Robotics."],
  ["Info", "Web app", "POST /api/documents 201 in 412 ms", "14 files from Northwind. Stored in sbc-vcfo-prod."],
  ["Warn", "Portal extension", "MCA V3 timed out, retried", "No answer from MCA V3 after 30 s. The second try worked."],
  ["Info", "Jobs", "Deadline reminders: 61 sent, 0 failed", "7-day: 22, 3-day: 18, 1-day: 21."],
  ["Error", "Web app", "PDF preview out of memory: AOC-4 draft, 48 MB", "The preview worker stopped at 512 MB. The file still downloads."],
  ["Info", "Email", "Delivery: 61 of 61 reminders delivered", "Configuration set vcfo-prod. 0 complaints."],
  ["Warn", "Accounting", "Tally push skipped: connector offline", "The office PC running the Tally connector did not answer. 6 invoices are waiting."],
  ["Warn", "Microsoft 365", "Teams webhook token expires on 25 Oct", "Renew it in the Teams channel settings and paste the new URL here."],
  ["Info", "Deploys", "Version 2026.10.21 is live", "Deployed by Farhath from main (commit 6c26d7e). No migrations."],
];

function hex(seed: number) {
  let x = (seed * 2654435761) >>> 0;
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += (x & 15).toString(16);
    x = ((x >>> 4) ^ (x * 7 + i * 13)) >>> 0;
  }
  return out;
}

/** 50 rows, newest first, from 6 Oct 12:31 backwards. */
export const LOGS: LogRow[] = Array.from({ length: 50 }, (_, i) => {
  const [level, service, message, detail] = LOG_SEED[i % LOG_SEED.length];
  const t = new Date(at(10, 16, 12, 31, 8).getTime() - i * (11 * 60 + 37) * 1000);
  return { id: `l${i}`, at: t, level, service, message, detail, requestId: `req_${hex(i + 101)}` };
});

export const LOG_SERVICES = Array.from(new Set(LOG_SEED.map((s) => s[1]))).sort();

// ---------- Messages ----------

export type Channel = "Email" | "WhatsApp" | "SMS" | "Teams";
export const CHANNEL_TONE: Record<Channel, ChipTone> = { Email: "prog", WhatsApp: "ok", SMS: "teal", Teams: "violet" };

export type MsgStatus = "Delivered" | "Read" | "Sent" | "Queued" | "Failed";
export const MSG_TONE: Record<MsgStatus, ChipTone> = { Delivered: "ok", Read: "ok", Sent: "prog", Queued: "idle", Failed: "bad" };

export interface Template {
  id: string;
  channel: Channel;
  from: string;
  subject?: string;
  body: string;
}

export const TEMPLATES: Record<string, Template> = {
  doc_request_v3: {
    id: "doc_request_v3",
    channel: "Email",
    from: "updates@sbcllp.in",
    subject: "Documents needed for step 7: Director KYC",
    body: "Dear Rohan,\n\nWe need these documents to file step 7 (Director KYC):\n· PAN card of each director\n· Address proof dated in the last 2 months\n\nUpload them on the portal under Documents.\n\nSBC LLP",
  },
  doc_nudge_hi_en: {
    id: "doc_nudge_hi_en",
    channel: "WhatsApp",
    from: "+91 80 4718 2290",
    body: "SBC LLP: 2 documents for step 7 are still missing. Upload them here: app.sbctrack.in/d/7Hk2. Reply STOP to opt out.",
  },
  step_due_v2: {
    id: "step_due_v2",
    channel: "Email",
    from: "updates@sbcllp.in",
    subject: "Step 9 is due tomorrow",
    body: "Dear Priya,\n\nStep 9 (MOA and AOA review) is due on 17 Oct. Review the drafts on the portal and approve them.\n\nSBC LLP",
  },
  deadline_v4: {
    id: "deadline_v4",
    channel: "Email",
    from: "reminders@sbcllp.in",
    subject: "GSTR-3B for September is due in 3 days",
    body: "Dear accounts team,\n\nGSTR-3B for September 2026 is due on 20 Oct. Send the purchase register by 15 Oct so we can file on time.\n\nSBC LLP",
  },
  deadline_1d: {
    id: "deadline_1d",
    channel: "WhatsApp",
    from: "+91 80 4718 2290",
    body: "SBC LLP: {{filing}} is due tomorrow, {{date}}. Reply STOP to opt out.",
  },
  filed_ack_v2: {
    id: "filed_ack_v2",
    channel: "Email",
    from: "updates@sbcllp.in",
    subject: "GSTR-1 for September filed",
    body: "Dear accounts team,\n\nWe filed GSTR-1 for September 2026 on 11 Oct. ARN AA3610260012345. The acknowledgement is in Documents.\n\nSBC LLP",
  },
  digest_card: {
    id: "digest_card",
    channel: "Teams",
    from: "VCFO bot",
    body: "Daily digest, 16 Oct\n· 4 items due in 3 days\n· 1 overdue: Tidewater PF return\n· 3 documents waiting on clients",
  },
  escalation_card: {
    id: "escalation_card",
    channel: "Teams",
    from: "VCFO bot",
    body: "Escalation: Orchid Lane step 4 (Name approval) has been stuck for 3 days. Owner: Bharath.",
  },
  otp_login: {
    id: "otp_login",
    channel: "SMS",
    from: "SBCLLP",
    body: "481 205 is your VCFO Suite sign-in code. It works for 10 minutes. Do not share it. - SBC LLP",
  },
  overdue_alert: {
    id: "overdue_alert",
    channel: "SMS",
    from: "SBCLLP",
    body: "SBC LLP: PF return for September was due on 15 Oct and is not filed. Open app.sbctrack.in to act. - SBC LLP",
  },
  invoice_link: {
    id: "invoice_link",
    channel: "WhatsApp",
    from: "+91 80 4718 2290",
    body: "SBC LLP: invoice INV-2026-0421 for ₹35,400 is ready. Pay here: rzp.io/i/9Kd2. Reply STOP to opt out.",
  },
};

export interface Message {
  id: string;
  at: Date;
  channel: Channel;
  to: string;
  template: string;
  status: MsgStatus;
  retries: number;
  error?: string;
}

const M: Array<[number, number, Channel, string, string, MsgStatus, number, string?]> = [
  [12, 31, "WhatsApp", "+91 98450 •••• 12 · Northwind", "invoice_link", "Queued", 0],
  [12, 30, "WhatsApp", "+91 99001 •••• 48 · Kestrel", "invoice_link", "Queued", 0],
  [12, 0, "WhatsApp", "+91 98450 •••• 12 · Northwind", "deadline_1d", "Failed", 2, "132001: template not approved by Meta"],
  [12, 0, "WhatsApp", "+91 90080 •••• 31 · Tidewater", "deadline_1d", "Failed", 2, "132001: template not approved by Meta"],
  [12, 0, "WhatsApp", "+91 97400 •••• 77 · Brightwave", "doc_nudge_hi_en", "Read", 0],
  [12, 0, "WhatsApp", "+91 98450 •••• 12 · Northwind", "doc_nudge_hi_en", "Delivered", 0],
  [11, 30, "Email", "accounts@halcyonfin.example", "deadline_v4", "Queued", 1, "Soft bounce: mailbox full. SES retries for 12 hours."],
  [11, 2, "Email", "rohan@northwind.example", "filed_ack_v2", "Delivered", 0],
  [10, 0, "WhatsApp", "+91 91234 •••• 05 · Juniper", "deadline_1d", "Failed", 2, "132001: template not approved by Meta"],
  [10, 0, "WhatsApp", "+91 91234 •••• 05 · Juniper", "doc_nudge_hi_en", "Delivered", 0],
  [9, 31, "Teams", "#incorporations", "escalation_card", "Delivered", 0],
  [9, 0, "Teams", "#compliance-alerts", "digest_card", "Delivered", 0],
  [8, 1, "Email", "accounts@kestrelhealth.example", "deadline_v4", "Delivered", 0],
  [8, 1, "Email", "finance@tidewater.example", "deadline_v4", "Delivered", 0],
  [8, 0, "Email", "priya@northwind.example", "step_due_v2", "Read", 0],
  [8, 0, "Email", "accounts@halcyon.example", "deadline_v4", "Delivered", 0],
  [8, 0, "Email", "ops@juniperbio.example", "deadline_v4", "Sent", 0],
  [7, 45, "Email", "rohan@northwind.example", "doc_request_v3", "Read", 0],
  [7, 40, "Email", "founders@orchid.example", "doc_request_v3", "Delivered", 0],
  [7, 12, "Email", "admin@emberstudios.example", "doc_request_v3", "Failed", 3, "Hard bounce: address does not exist"],
  [9, 30, "SMS", "+91 98860 •••• 20 · Coral", "overdue_alert", "Delivered", 0],
  [9, 30, "SMS", "+91 94480 •••• 63 · Larkspur", "overdue_alert", "Delivered", 0],
  [9, 12, "SMS", "+91 99860 •••• 07 · Farhath", "otp_login", "Delivered", 0],
  [9, 2, "SMS", "+91 90360 •••• 88 · Kestrel", "otp_login", "Failed", 1, "DND number: promotional block. Sign-in codes go on the transactional route."],
];

export const MESSAGES: Message[] = M.map(([h, min, channel, to, template, status, retries, error], i) => ({
  id: `m${i}`,
  at: at(10, 16, h, min),
  channel,
  to,
  template,
  status,
  retries,
  error,
}));

/** Which channel each event goes on. */
export interface Route {
  id: string;
  message: string;
  when: string;
  channel: Channel;
  from: string;
  template: string;
  status: "Approved" | "Waiting for approval";
  to: string;
  sent7d: number;
  /** Delivered, percent. 0 when nothing was sent. */
  delivered: number;
}

const R: Array<[string, string, Channel, string, string, Route["status"], string, number, number]> = [
  ["Document request", "When a step needs a client file", "Email", "updates@sbcllp.in", "doc_request_v3", "Approved", "Client contact", 142, 99.3],
  ["Document request reminder", "2 days after the request, if still missing", "WhatsApp", "+91 80 4718 2290", "doc_nudge_hi_en", "Approved", "Client contact", 61, 97.8],
  ["Step reminder", "Day before a step is due", "Email", "updates@sbcllp.in", "step_due_v2", "Approved", "Client and project lead", 88, 99.0],
  ["Deadline reminder", "7, 3 and 1 days before a filing", "Email", "reminders@sbcllp.in", "deadline_v4", "Approved", "Client contact", 214, 98.4],
  ["Deadline reminder (WhatsApp)", "1 day before a filing", "WhatsApp", "+91 80 4718 2290", "deadline_1d", "Waiting for approval", "Client contact", 0, 0],
  ["Overdue alert", "The morning after a missed date", "SMS", "SBCLLP", "overdue_alert", "Approved", "Client and manager", 9, 100],
  ["Filing confirmation", "When a return is filed", "Email", "updates@sbcllp.in", "filed_ack_v2", "Approved", "Client contact", 57, 99.6],
  ["Monthly client report", "1st of the month, 08:00", "Email", "reports@sbcllp.in", "monthly_report", "Approved", "Client directors", 0, 0],
  ["Sign-in code", "When someone signs in", "SMS", "SBCLLP", "otp_login", "Approved", "The person signing in", 412, 99.8],
  ["Staff daily digest", "Every working day, 09:00", "Teams", "#compliance-alerts", "digest_card", "Approved", "Project leads and managers", 5, 100],
  ["Escalation to admin", "A step stuck for 3 days", "Teams", "#incorporations", "escalation_card", "Approved", "Admin and manager", 7, 100],
  ["Partner report", "1st of the month, 07:00", "Email", "reports@sbcllp.in", "partner_report", "Approved", "Mithilesh and partners", 0, 0],
  ["Payment link", "With each invoice", "WhatsApp", "+91 80 4718 2290", "invoice_link", "Waiting for approval", "Client accounts contact", 0, 0],
];

export const ROUTES: Route[] = R.map(([message, when, channel, from, template, status, to, sent7d, delivered], i) => ({ id: `r${i}`, message, when, channel, from, template, status, to, sent7d, delivered }));

/** Addresses a route can send from, per channel. */
export const SENDERS: Record<Channel, string[]> = {
  Email: ["updates@sbcllp.in", "reminders@sbcllp.in", "reports@sbcllp.in", "noreply@sbcllp.in"],
  WhatsApp: ["+91 80 4718 2290"],
  SMS: ["SBCLLP"],
  Teams: ["#compliance-alerts", "#incorporations", "#partners"],
};

export interface DomainRecord {
  id: string;
  record: string;
  status: "Passing" | "Needs a change";
  value: string;
}

export const DOMAIN: DomainRecord[] = [
  { id: "spf", record: "SPF", status: "Passing", value: "v=spf1 include:amazonses.com ~all" },
  { id: "dkim", record: "DKIM", status: "Passing", value: "3 CNAME records verified" },
  { id: "dmarc", record: "DMARC", status: "Needs a change", value: "p=none · move to quarantine" },
  { id: "rp", record: "Return path", status: "Passing", value: "bounce.sbcllp.in" },
];

export type TplStatus = "Approved" | "Waiting" | "Registered" | "In the app";
export const TPL_TONE: Record<TplStatus, ChipTone> = { Approved: "ok", Waiting: "warn", Registered: "ok", "In the app": "idle" };

export interface ChannelTemplate {
  id: string;
  name: string;
  channel: "WhatsApp" | "SMS" | "Email";
  language: string;
  category: string;
  status: TplStatus;
  /** Waiting since, for a template Meta has not approved yet. */
  since?: Date;
  lastUsed: Date | null;
  sent7d: number;
  usedFor: string;
  body: string;
}

const T: Array<[string, ChannelTemplate["channel"], string, string, TplStatus, Date | null, number, string, string, Date?]> = [
  ["doc_nudge_hi_en", "WhatsApp", "en, hi", "Utility", "Approved", at(10, 16, 12, 0), 61, "Document request reminder", "SBC LLP: {{count}} documents for step {{step}} are still missing. Upload them here: {{link}}. Reply STOP to opt out."],
  ["step_due_wa", "WhatsApp", "en", "Utility", "Approved", at(10, 16, 9, 0), 38, "Step reminder", "SBC LLP: step {{step}} ({{name}}) is due on {{date}}. Open {{link}} to act."],
  ["filed_ack_wa", "WhatsApp", "en", "Utility", "Approved", at(10, 15, 15, 0), 22, "Filing confirmation", "SBC LLP: we filed {{form}} for {{period}}. ARN {{arn}}. The acknowledgement is in Documents."],
  ["welcome_client", "WhatsApp", "en", "Utility", "Approved", at(10, 12, 11, 0), 3, "Onboarding", "Welcome to SBC LLP. Your portal is ready at {{link}}. Reply STOP to opt out."],
  ["deadline_1d", "WhatsApp", "en", "Utility", "Waiting", null, 0, "Deadline reminder (WhatsApp)", "SBC LLP: {{form}} for {{period}} is due tomorrow, {{date}}. Reply STOP to opt out.", at(10, 14)],
  ["invoice_link", "WhatsApp", "en", "Utility", "Waiting", null, 0, "Payment link", "SBC LLP: invoice {{invoice}} for {{amount}} is ready. Pay here: {{link}}. Reply STOP to opt out.", at(10, 14)],
  ["registration_granted", "WhatsApp", "en", "Utility", "Waiting", null, 0, "Registration granted", "SBC LLP: {{registration}} for {{company}} is granted. The certificate is in Documents.", at(10, 15)],
  ["otp_login", "SMS", "en", "Transactional", "Registered", at(10, 16, 9, 12), 412, "Sign-in codes", "{{code}} is your VCFO Suite sign-in code. It works for 10 minutes. Do not share it. - SBC LLP"],
  ["overdue_alert", "SMS", "en", "Transactional", "Registered", at(10, 16, 9, 30), 9, "The morning after a missed date", "SBC LLP: {{form}} for {{period}} was due on {{date}} and is not filed. Open app.sbctrack.in to act. - SBC LLP"],
  ["wa_fallback_doc", "SMS", "en", "Transactional", "Registered", at(10, 15, 12, 0), 8, "WhatsApp document reminder, when WhatsApp fails", "SBC LLP: {{count}} documents for step {{step}} are still missing. Upload at {{link}} - SBC LLP"],
  ["wa_fallback_due", "SMS", "en", "Transactional", "Registered", at(10, 15, 9, 0), 6, "WhatsApp step reminder, when WhatsApp fails", "SBC LLP: step {{step}} is due on {{date}}. Open {{link}} - SBC LLP"],
  ["filed_sms", "SMS", "en", "Transactional", "Registered", null, 0, "Filing confirmation", "SBC LLP: {{form}} for {{period}} is filed. ARN {{arn}} - SBC LLP"],
  ["payment_sms", "SMS", "en", "Transactional", "Registered", null, 0, "Payment received", "SBC LLP: we received {{amount}} for {{invoice}}. Thank you. - SBC LLP"],
  ["doc_request_v3", "Email", "en", "System", "In the app", at(10, 16, 7, 45), 142, "Document request", "Dear {{name}},\n\nWe need these documents to file step {{step}} ({{step_name}}):\n{{list}}\n\nUpload them on the portal under Documents.\n\nSBC LLP"],
  ["step_due_v2", "Email", "en", "System", "In the app", at(10, 16, 8, 0), 88, "Step reminder", "Dear {{name}},\n\nStep {{step}} ({{step_name}}) is due on {{date}}. Review it on the portal.\n\nSBC LLP"],
  ["deadline_v4", "Email", "en", "System", "In the app", at(10, 16, 8, 1), 214, "Deadline reminder", "Dear {{name}},\n\n{{form}} for {{period}} is due on {{date}}. Send the documents by {{cutoff}} so we can file on time.\n\nSBC LLP"],
  ["filed_ack_v2", "Email", "en", "System", "In the app", at(10, 16, 11, 2), 57, "Filing confirmation", "Dear {{name}},\n\nWe filed {{form}} for {{period}} on {{date}}. ARN {{arn}}. The acknowledgement is in Documents.\n\nSBC LLP"],
  ["monthly_report", "Email", "en", "System", "In the app", at(10, 1, 8, 0), 0, "Monthly client report", "Dear {{name}},\n\nYour report for {{month}} is attached: filings, open items and what is next.\n\nSBC LLP"],
  ["partner_report", "Email", "en", "System", "In the app", at(10, 1, 7, 0), 0, "Partner report", "Partner report for {{month}}: clients, filings, overdue items and fees."],
];

export const CHANNEL_TEMPLATES: ChannelTemplate[] = T.map(([name, channel, language, category, status, lastUsed, sent7d, usedFor, body, since]) => ({ id: name, name, channel, language, category, status, lastUsed, sent7d, usedFor, body, since }));

/** Failed in the last 24 hours, by cause. */
export const MSG_FAILS = [
  { id: "mf1", what: "WhatsApp · deadline_1d", cause: "Template waiting for Meta approval", n: 14 },
  { id: "mf2", what: "Email · soft bounce", cause: "accounts@halcyonfin.example mailbox full (retrying)", n: 1 },
  { id: "mf3", what: "SMS · DND number", cause: "Promotional block on one number; sign-in codes still go", n: 0 },
];

// ---------- Deploys ----------

export type Env = "Production" | "Staging";
export const ENV_TONE: Record<Env, ChipTone> = { Production: "violet", Staging: "teal" };

export type DeployStatus = "Live" | "Succeeded" | "Failed" | "Rolled back";
export const DEPLOY_TONE: Record<DeployStatus, ChipTone> = { Live: "ok", Succeeded: "idle", Failed: "bad", "Rolled back": "warn" };

export interface Deploy {
  id: string;
  version: string;
  commit: string;
  env: Env;
  at: Date;
  by: string;
  duration: string;
  status: DeployStatus;
  note: string;
}

export const DEPLOYS: Deploy[] = [
  { id: "d9", version: "2026.10.22-rc1", commit: "a41be09", env: "Staging", at: at(10, 16, 11, 20), by: "Farhath", duration: "3 min 52 s", status: "Live", note: "Developer console redesign" },
  { id: "d8", version: "2026.10.21", commit: "6c26d7e", env: "Production", at: at(10, 15, 16, 40), by: "Farhath", duration: "4 min 10 s", status: "Live", note: "Large-file splits; settings account page" },
  { id: "d7", version: "2026.10.21", commit: "6c26d7e", env: "Staging", at: at(10, 15, 14, 5), by: "Farhath", duration: "3 min 41 s", status: "Succeeded", note: "Large-file splits; settings account page" },
  { id: "d6", version: "2026.10.18", commit: "c0c15f0", env: "Production", at: at(10, 12, 18, 15), by: "Farhath", duration: "4 min 2 s", status: "Succeeded", note: "Client portal home split" },
  { id: "d5", version: "2026.10.16", commit: "b77e1a4", env: "Production", at: at(10, 11, 17, 30), by: "Deploy bot", duration: "2 min 11 s", status: "Failed", note: "Migration 0041 timed out" },
  { id: "d4", version: "2026.10.14", commit: "98c2004", env: "Production", at: at(10, 8, 16, 0), by: "Farhath", duration: "3 min 58 s", status: "Succeeded", note: "Firm people, admin forms" },
  { id: "d3", version: "2026.10.12", commit: "5d0a3be", env: "Production", at: at(10, 4, 15, 10), by: "Farhath", duration: "4 min 5 s", status: "Rolled back", note: "Calendar sync rewrite" },
  { id: "d2", version: "2026.10.09", commit: "7919a5b", env: "Production", at: at(10, 3, 12, 40), by: "Farhath", duration: "3 min 49 s", status: "Succeeded", note: "WhatsApp reminders (outbound only)" },
];

export interface Migration {
  id: string;
  status: "Applied" | "Pending";
  at?: Date;
  what: string;
}

export const MIGRATIONS: Migration[] = [
  { id: "0041_firm_people", status: "Applied", at: at(10, 12, 18, 17), what: "Firm people and roles" },
  { id: "0042_client_practice_areas", status: "Pending", what: "Registration status per client" },
  { id: "0043_message_routes", status: "Pending", what: "Message routing in the database" },
];

/** Release notes per version. */
export const RELEASE_NOTES: Record<string, string[]> = {
  "2026.10.22-rc1": ["Developer console redesign in the e-Filing style", "Connection detail with every setting", "Feature flags table"],
  "2026.10.21": ["Large-file splits for uploads over 25 MB", "Settings: account page for staff", "Fix: calendar sync skipped all-day events"],
  "2026.10.18": ["Client portal home split into cards", "Faster document list (412 ms to 180 ms)"],
  "2026.10.16": ["Migration 0041 firm people and roles", "Deploy stopped: the migration timed out after 120 s"],
  "2026.10.14": ["Firm people page", "Admin forms for managers and leads"],
  "2026.10.12": ["Calendar sync rewrite", "Rolled back: sync wrote duplicate events for 2 staff"],
  "2026.10.09": ["WhatsApp reminders, outbound only", "Opt-out word STOP"],
};

export interface Flag {
  id: string;
  name: string;
  env: Env;
  on: boolean;
  who: string;
  by: string;
  at: Date;
}

export const FLAGS: Flag[] = [
  { id: "ask_vcfo", name: "Ask VCFO in the client portal", env: "Production", on: true, who: "Everyone", by: "Farhath", at: at(10, 3, 12, 45) },
  { id: "wa_nudges", name: "WhatsApp reminders", env: "Production", on: true, who: "Clients who opted in", by: "Farhath", at: at(10, 3, 12, 50) },
  { id: "wa_deadline", name: "WhatsApp deadline reminders", env: "Production", on: false, who: "Waiting for template approval", by: "Farhath", at: at(10, 9, 10, 0) },
  { id: "pay_links", name: "Payment links on invoices", env: "Production", on: true, who: "Everyone", by: "Mithilesh", at: at(9, 25, 11, 30) },
  { id: "super_admin", name: "Super admin portal", env: "Production", on: true, who: "Mithilesh", by: "Farhath", at: at(10, 13, 10, 12) },
  { id: "gsp_filing", name: "GST filing through a GSP", env: "Production", on: false, who: "Not connected yet", by: "Farhath", at: at(9, 12, 9, 0) },
  { id: "dev_console_v2", name: "New developer console", env: "Staging", on: true, who: "Developers", by: "Farhath", at: at(10, 16, 11, 22) },
];

// ---------- Access ----------

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scope: string;
  created: Date | null;
  expires: Date | null;
  lastUsed: Date | null;
  /** Our own key: it can be revoked. A provider key can only be rotated. */
  own: boolean;
  missing?: boolean;
  /** Where the value is kept. */
  where: string;
  /** Seed data that must be removed before launch: the action is Purge. */
  purge?: boolean;
}

export const API_KEYS: ApiKey[] = [
  { id: "k-enc", name: "CREDENTIALS_ENCRYPTION_KEY", prefix: "Not set", scope: "Portal credentials", created: null, expires: null, lastUsed: null, where: "App Runner", own: false, missing: true },
  { id: "k-teams", name: "Teams webhook URL", prefix: "webhookb2/7c2e", scope: "Teams channel", created: at(7, 15), expires: at(10, 25), lastUsed: at(10, 16, 12, 15), where: "Secrets Manager", own: false },
  { id: "k-pd", name: "Partner dashboard", prefix: "vk_live_pd3a", scope: "Read", created: at(9, 2), expires: at(3, 2, 0, 0, 0, 2027), lastUsed: at(10, 16, 9, 0), where: "Database", own: true },
  { id: "k-tally", name: "Tally connector", prefix: "vk_live_tc81", scope: "Write invoices", created: at(8, 20), expires: at(2, 20, 0, 0, 0, 2027), lastUsed: at(10, 13, 23, 0), where: "Database", own: true },
  { id: "k-ext", name: "VCFO Assist extension", prefix: "vk_live_ex42", scope: "Read portals", created: at(9, 1), expires: at(3, 1, 0, 0, 0, 2027), lastUsed: at(10, 16, 12, 24), where: "Database", own: true },
  { id: "k-ai", name: "ANTHROPIC_API_KEY", prefix: "sk-ant-…9c1d", scope: "Ask VCFO", created: at(10, 1), expires: null, lastUsed: at(10, 16, 12, 30), where: "Secrets Manager", own: false },
  { id: "k-rzp", name: "Razorpay key secret", prefix: "rzp_live_…3KfQ", scope: "Payments", created: at(8, 20), expires: null, lastUsed: at(10, 16, 10, 2), where: "Secrets Manager", own: false },
  { id: "k-msg91", name: "MSG91 auth key", prefix: "…91ae", scope: "SMS", created: at(7, 2), expires: at(6, 23, 0, 0, 0, 2027), lastUsed: at(10, 16, 11, 50), where: "Secrets Manager", own: false },
  { id: "k-graph", name: "Microsoft Graph client secret", prefix: "…8Q~d", scope: "Mail and calendars", created: at(8, 14), expires: at(2, 4, 0, 0, 0, 2027), lastUsed: at(10, 16, 12, 15), where: "Secrets Manager", own: false },
  { id: "k-auth", name: "AUTH_SECRET", prefix: "••••b3e1", scope: "Sign-in sessions", created: at(9, 2), expires: null, lastUsed: at(10, 16, 12, 31), where: "Secrets Manager", own: false },
  { id: "k-resend", name: "RESEND_API_KEY (fallback)", prefix: "re_…4f2a", scope: "Email fallback", created: at(6, 12), expires: null, lastUsed: at(10, 9, 14, 2), where: "Secrets Manager", own: false },
  { id: "k-demo", name: "Demo user passwords", prefix: "Seed data", scope: "6 demo accounts", created: null, expires: null, lastUsed: at(10, 14, 16, 0), where: "Database", own: false, purge: true },
  { id: "k-rds", name: "RDS master password", prefix: "Secrets Manager", scope: "Database", created: at(9, 1), expires: at(12, 1), lastUsed: at(10, 16, 2, 0), where: "Secrets Manager", own: false },
];

export interface ConsoleUser {
  id: string;
  name: string;
  role: string;
  twoFactor: "On" | "Off" | "Not used";
  lastSignIn: Date;
}

export const CONSOLE_USERS: ConsoleUser[] = [
  { id: "u-farhath", name: "Farhath", role: "Developer", twoFactor: "On", lastSignIn: at(10, 16, 9, 12) },
  { id: "u-mithilesh", name: "Mithilesh", role: "Super admin", twoFactor: "On", lastSignIn: at(10, 15, 18, 40) },
  { id: "u-krishna", name: "Krishna", role: "Admin, read only", twoFactor: "Off", lastSignIn: at(10, 12, 11, 5) },
  { id: "u-bot", name: "Deploy bot", role: "Service account", twoFactor: "Not used", lastSignIn: at(10, 15, 16, 36) },
];

/** Sign-in methods: people who used each in the last 30 days. */
export const SIGNIN = [
  { id: "pw", label: "Email and password", n: 22, who: "Clients and staff" },
  { id: "ms", label: "Microsoft 365", n: 14, who: "Staff on sbcllp.in" },
  { id: "otp", label: "OTP by SMS", n: 31, who: "Required for staff, optional for clients" },
];

export interface Session {
  id: string;
  person: string;
  role: string;
  device: string;
  browser: string;
  place: string;
  since: Date;
  active: string;
  you?: boolean;
}

export const SESSIONS: Session[] = [
  { id: "s1", person: "Farhath", role: "Developer", device: "Linux laptop", browser: "Firefox 131", place: "Bengaluru", since: at(10, 16, 9, 12), active: "Now", you: true },
  { id: "s2", person: "Mithilesh", role: "Super admin", device: "Mac", browser: "Chrome 129", place: "Bengaluru", since: at(10, 16, 8, 40), active: "Now" },
  { id: "s3", person: "Krishna", role: "Admin", device: "Windows PC", browser: "Edge 129", place: "Bengaluru", since: at(10, 16, 9, 5), active: "4 min ago" },
  { id: "s4", person: "Pranay", role: "Manager", device: "Windows PC", browser: "Chrome 129", place: "Bengaluru", since: at(10, 16, 9, 30), active: "12 min ago" },
  { id: "s5", person: "Bharath", role: "Project lead", device: "Android phone", browser: "Chrome 129", place: "Bengaluru", since: at(10, 16, 10, 2), active: "31 min ago" },
  { id: "s6", person: "Rohan Kumar", role: "Client", device: "iPhone", browser: "Safari 18", place: "Pune", since: at(10, 16, 11, 20), active: "1 h ago" },
  { id: "s7", person: "Pranay", role: "Manager", device: "Android phone", browser: "Chrome 129", place: "Bengaluru", since: at(10, 15, 19, 10), active: "Yesterday" },
];

export const ROLES = [
  { id: "super", role: "Super admin", people: 1, can: "Everything, firm settings, every client" },
  { id: "admin", role: "Admin", people: 1, can: "Every client, managers, firm settings" },
  { id: "manager", role: "Manager", people: 3, can: "Their leads' clients, approvals" },
  { id: "lead", role: "Project lead", people: 6, can: "Their own clients and work" },
  { id: "client", role: "Client", people: 14, can: "Their own company only" },
  { id: "dev", role: "Developer", people: 1, can: "This console; no client data" },
];

export interface ServiceAccount {
  id: string;
  name: string;
  kind: string;
  can: string;
  lastUsed: Date;
}

export const SERVICE_ACCOUNTS: ServiceAccount[] = [
  { id: "sa-bot", name: "Deploy bot", kind: "GitHub Actions", can: "Deploy staging and production", lastUsed: at(10, 15, 16, 36) },
  { id: "sa-ar", name: "vcfo-apprunner", kind: "IAM role", can: "SES, S3, WhatsApp, Secrets Manager", lastUsed: at(10, 16, 12, 31) },
  { id: "sa-inngest", name: "vcfo-suite-prod", kind: "Inngest signing key", can: "Run scheduled jobs", lastUsed: at(10, 16, 12, 30) },
  { id: "sa-tally", name: "Tally connector", kind: "API key", can: "Write invoices and receipts", lastUsed: at(10, 13, 23, 0) },
  { id: "sa-ext", name: "VCFO Assist extension", kind: "API key", can: "Read portal status", lastUsed: at(10, 16, 12, 24) },
];

export interface ConsoleSetting {
  id: string;
  label: string;
  on: boolean;
}

export const CONSOLE_SETTINGS: ConsoleSetting[] = [
  { id: "2fa", label: "Require two-step sign-in for the console", on: true },
  { id: "mask", label: "Mask secrets in logs", on: true },
  { id: "teams-fail", label: "Post failed jobs to Teams", on: true },
  { id: "admin-logs", label: "Admins can read logs", on: false },
  { id: "wa-fallback", label: "Send SMS when WhatsApp fails", on: false },
];

// ---------- Data and costs ----------

export const DATA_FACTS = [
  { k: "Database size", v: "4.2 GB of 20 GB" },
  { k: "Backups", v: "Daily 02:00 · kept 35 days" },
  { k: "Last backup", v: "16 Oct 02:00 · 3 min 40 s" },
  { k: "Point-in-time recovery", v: "Any second in the last 7 days" },
  { k: "Last restore test", v: "1 Oct · 11 minutes" },
  { k: "Retention", v: "8 years for filings" },
];

export interface ServiceCost {
  service: string;
  /** 1 to 6 Oct. */
  thisMonth: number;
  /** 1 to 6 Sep, the same days. */
  lastMonth: number;
  group: "Claude API" | "App Runner" | "Database" | "Messaging" | "Other";
  /** Monthly budget in rupees. */
  budget: number;
}

export const COSTS: ServiceCost[] = [
  { service: "Claude API (Ask VCFO)", thisMonth: 3790, lastMonth: 3120, group: "Claude API", budget: 40000 },
  { service: "App Runner", thisMonth: 1960, lastMonth: 1900, group: "App Runner", budget: 12000 },
  { service: "RDS Postgres", thisMonth: 1480, lastMonth: 1480, group: "Database", budget: 8000 },
  { service: "WhatsApp messages", thisMonth: 640, lastMonth: 510, group: "Messaging", budget: 4000 },
  { service: "Error tracking (Sentry)", thisMonth: 440, lastMonth: 440, group: "Other", budget: 2500 },
  { service: "SMS (MSG91)", thisMonth: 420, lastMonth: 430, group: "Messaging", budget: 2500 },
  { service: "S3 storage", thisMonth: 380, lastMonth: 350, group: "Other", budget: 3000 },
  { service: "Email (SES)", thisMonth: 90, lastMonth: 85, group: "Messaging", budget: 1000 },
];

export const COST_TOTAL = COSTS.reduce((a, c) => a + c.thisMonth, 0);

/** Full months, in rupees. */
export const COST_MONTHS = [
  { month: "Apr", total: 34100 },
  { month: "May", total: 36900 },
  { month: "Jun", total: 38200 },
  { month: "Jul", total: 40600 },
  { month: "Aug", total: 42800 },
  { month: "Sep", total: 44700 },
];

export const COST_BUDGET = COSTS.reduce((a, c) => a + c.budget, 0);

/** Volumes this month. */
export const VOLUME = [
  { k: "Emails sent", v: "1,408", sub: "This month" },
  { k: "WhatsApp messages", v: "612", sub: "This month" },
  { k: "SMS", v: "1,290", sub: "Mostly sign-in codes" },
  { k: "Ask VCFO answers", v: "1,842", sub: "3.1 M tokens" },
];

export interface DbTable {
  id: string;
  name: string;
  rows: number;
  size: string;
  growth: string;
  vacuumed: Date;
}

export const DB_TABLES: DbTable[] = [
  { id: "t1", name: "audit_log", rows: 1284112, size: "1.4 GB", growth: "+38,200 a week", vacuumed: at(10, 16, 2, 30) },
  { id: "t2", name: "messages", rows: 412880, size: "620 MB", growth: "+4,100 a week", vacuumed: at(10, 16, 2, 30) },
  { id: "t3", name: "documents", rows: 21406, size: "410 MB", growth: "+620 a week", vacuumed: at(10, 15, 2, 30) },
  { id: "t4", name: "log_events", rows: 980214, size: "880 MB", growth: "+52,000 a week", vacuumed: at(10, 16, 2, 30) },
  { id: "t5", name: "steps", rows: 18240, size: "96 MB", growth: "+310 a week", vacuumed: at(10, 14, 2, 30) },
  { id: "t6", name: "filings", rows: 9812, size: "74 MB", growth: "+140 a week", vacuumed: at(10, 14, 2, 30) },
  { id: "t7", name: "obligations", rows: 6230, size: "38 MB", growth: "+60 a week", vacuumed: at(10, 13, 2, 30) },
  { id: "t8", name: "invoices", rows: 4188, size: "22 MB", growth: "+45 a week", vacuumed: at(10, 13, 2, 30) },
  { id: "t9", name: "clients", rows: 48, size: "2 MB", growth: "+1 a week", vacuumed: at(10, 11, 2, 30) },
  { id: "t10", name: "users", rows: 112, size: "1 MB", growth: "+2 a week", vacuumed: at(10, 11, 2, 30) },
];

export interface Backup {
  id: string;
  name: string;
  at: Date;
  size: string;
  kind: "Daily" | "Before deploy" | "Manual";
  status: "Available" | "Restore tested";
}

export const BACKUPS: Backup[] = [
  { id: "bk1", name: "vcfo-prod-2026-10-16", at: at(10, 16, 2, 3), size: "4.2 GB", kind: "Daily", status: "Available" },
  { id: "bk2", name: "vcfo-prod-pre-2026.10.21", at: at(10, 15, 16, 36), size: "4.2 GB", kind: "Before deploy", status: "Available" },
  { id: "bk3", name: "vcfo-prod-2026-10-15", at: at(10, 15, 2, 3), size: "4.1 GB", kind: "Daily", status: "Available" },
  { id: "bk4", name: "vcfo-prod-2026-10-14", at: at(10, 14, 2, 3), size: "4.1 GB", kind: "Daily", status: "Available" },
  { id: "bk5", name: "vcfo-prod-2026-10-13", at: at(10, 13, 2, 3), size: "4.1 GB", kind: "Daily", status: "Available" },
  { id: "bk6", name: "vcfo-prod-pre-2026.10.18", at: at(10, 12, 18, 10), size: "4.0 GB", kind: "Before deploy", status: "Available" },
  { id: "bk7", name: "vcfo-prod-2026-10-01", at: at(10, 1, 2, 3), size: "4.0 GB", kind: "Daily", status: "Restore tested" },
];

export interface DataExport {
  id: string;
  name: string;
  format: string;
  size: string;
  by: string;
  at: Date;
}

export const EXPORTS: DataExport[] = [
  { id: "x1", name: "Audit log, September", format: "CSV", size: "18 MB", by: "Mithilesh", at: at(10, 11, 9, 10) },
  { id: "x2", name: "Northwind documents", format: "ZIP", size: "1.2 GB", by: "Krishna", at: at(10, 8, 15, 0) },
  { id: "x3", name: "Filings register FY 2025-26", format: "XLSX", size: "2 MB", by: "Farhath", at: at(9, 30, 11, 30) },
  { id: "x4", name: "Full database dump", format: "SQL", size: "3.9 GB", by: "Farhath", at: at(9, 11, 2, 0) },
];

export interface Bucket {
  id: string;
  name: string;
  region: string;
  size: string;
  objects: string;
  versioning: "On" | "Off";
  lifecycle: string;
}

export const BUCKETS: Bucket[] = [
  { id: "b1", name: "sbc-vcfo-prod", region: "ap-south-1", size: "38 GB", objects: "21,406", versioning: "On", lifecycle: "Old versions to Glacier after 90 days" },
  { id: "b2", name: "sbc-vcfo-backups", region: "ap-south-1", size: "112 GB", objects: "412", versioning: "On", lifecycle: "Delete after 35 days" },
  { id: "b3", name: "sbc-vcfo-logs", region: "ap-south-1", size: "9.8 GB", objects: "18,240", versioning: "Off", lifecycle: "Delete after 90 days" },
  { id: "b4", name: "sbc-vcfo-staging", region: "ap-south-1", size: "6.4 GB", objects: "3,118", versioning: "Off", lifecycle: "Delete after 30 days" },
];

// ---------- Audit ----------

export type AuditAction =
  | "Deploy"
  | "Roll back"
  | "Rotate key"
  | "Revoke key"
  | "Set key"
  | "Purge"
  | "Change setting"
  | "Change flag"
  | "Run job"
  | "Retry job"
  | "Run migrations"
  | "Reconnect"
  | "Connect"
  | "Disconnect"
  | "Test"
  | "Send test"
  | "Verify domain"
  | "Edit route"
  | "Sign in"
  | "Sign out"
  | "Retry message"
  | "Restore"
  | "Export"
  | "Submit template";
export type AuditResult = "Done" | "Failed";
export const RESULT_TONE: Record<AuditResult, ChipTone> = { Done: "ok", Failed: "bad" };

export interface AuditEntry {
  id: string;
  at: Date;
  actor: string;
  action: AuditAction;
  target: string;
  result: AuditResult;
  before?: string;
  after?: string;
}

export const AUDIT: AuditEntry[] = [
  { id: "a1", at: at(10, 16, 11, 20), actor: "Farhath", action: "Deploy", target: "Staging 2026.10.22-rc1", result: "Done", before: "2026.10.21", after: "2026.10.22-rc1" },
  { id: "a2", at: at(10, 16, 9, 12), actor: "Farhath", action: "Sign in", target: "Developer console", result: "Done" },
  { id: "a3", at: at(10, 15, 18, 40), actor: "Mithilesh", action: "Sign in", target: "Developer console", result: "Done" },
  { id: "a4", at: at(10, 15, 16, 40), actor: "Farhath", action: "Deploy", target: "Production 2026.10.21", result: "Done", before: "2026.10.18", after: "2026.10.21" },
  { id: "a4b", at: at(10, 14, 11, 20), actor: "Farhath", action: "Submit template", target: "WhatsApp template deadline_1d for approval", result: "Done", before: "-", after: "Pending" },
  { id: "a5", at: at(10, 15, 16, 36), actor: "Deploy bot", action: "Deploy", target: "Staging 2026.10.21", result: "Done" },
  { id: "a6", at: at(10, 14, 10, 2), actor: "Farhath", action: "Change setting", target: "Mask secrets in logs", result: "Done", before: "Off", after: "On" },
  { id: "a6b", at: at(10, 13, 10, 12), actor: "Farhath", action: "Change flag", target: "Super admin portal", result: "Done", before: "Off", after: "On" },
  { id: "a6c", at: at(10, 12, 16, 0), actor: "Farhath", action: "Change setting", target: "Monthly report sender", result: "Done", before: "updates@sbcllp.in", after: "reports@sbcllp.in" },
  { id: "a7", at: at(10, 13, 12, 30), actor: "Farhath", action: "Test", target: "Accounting sync", result: "Failed" },
  { id: "a8", at: at(10, 13, 9, 15), actor: "Farhath", action: "Rotate key", target: "ANTHROPIC_API_KEY", result: "Done" },
  { id: "a9", at: at(10, 12, 18, 15), actor: "Farhath", action: "Deploy", target: "Production 2026.10.18", result: "Done" },
  { id: "a10", at: at(10, 12, 11, 5), actor: "Krishna", action: "Sign in", target: "Developer console", result: "Done" },
  { id: "a11", at: at(10, 11, 17, 30), actor: "Deploy bot", action: "Deploy", target: "Production 2026.10.16", result: "Failed" },
  { id: "a12", at: at(10, 11, 8, 20), actor: "Farhath", action: "Run job", target: "Portal status sync", result: "Done" },
  { id: "a13", at: at(10, 9, 14, 0), actor: "Farhath", action: "Reconnect", target: "Outlook mailbox and calendar", result: "Done" },
  { id: "a14", at: at(10, 8, 16, 0), actor: "Farhath", action: "Deploy", target: "Production 2026.10.14", result: "Done" },
  { id: "a15", at: at(10, 5, 10, 5), actor: "Farhath", action: "Roll back", target: "Production to 2026.10.09", result: "Done", before: "2026.10.12", after: "2026.10.09" },
  { id: "a16", at: at(10, 2, 12, 0), actor: "Mithilesh", action: "Change setting", target: "Admins can read logs", result: "Done", before: "On", after: "Off" },
  { id: "a17", at: at(9, 28, 11, 40), actor: "Farhath", action: "Revoke key", target: "Old partner key vk_live_pd19", result: "Done" },
  { id: "a18", at: at(9, 20, 15, 0), actor: "Farhath", action: "Rotate key", target: "RDS master password", result: "Done" },
];
