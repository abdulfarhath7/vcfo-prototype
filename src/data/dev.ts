// Developer console sample data. Ported from reference/old-patch/dev/data.js and detail.js.
// Dates are moved so "today" is TODAY (6 Oct 2026), the day every portal uses.
// Secrets are always masked. Demo values only.
import type { ChipTone } from "@/components/ui/Chip";

/** A moment on a given day: at(10, 6, 12, 30) is 6 Oct 2026 12:30. */
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

export type ConnStatus = "Connected" | "Needs re-auth" | "Offline";
export const CONN_TONE: Record<ConnStatus, ChipTone> = { Connected: "ok", "Needs re-auth": "warn", Offline: "bad" };

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
  endpoint: string;
  scopes: string[];
  webhook?: string;
  events: ConnEvent[];
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
    lastSync: at(10, 6, 12, 20),
    authExpires: null,
    hasKey: false,
    endpoint: "email.ap-south-1.amazonaws.com",
    scopes: ["ses:SendEmail", "ses:SendRawEmail", "sns:Publish"],
    webhook: `${HOOK}/ses`,
    events: [
      { at: at(10, 6, 12, 20), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 6, 11, 30), text: "Soft bounce from accounts@halcyonfin.example", chip: "Bounce", tone: "warn" },
      { at: at(10, 6, 8, 0), text: "61 deadline reminders accepted", chip: "OK", tone: "ok" },
      { at: at(10, 5, 17, 10), text: "DMARC report received: 0 failures", chip: "OK", tone: "ok" },
      { at: at(10, 5, 9, 0), text: "Suppression list: 1 address added", chip: "Info", tone: "idle" },
    ],
  },
  {
    id: "wa",
    name: "WhatsApp Business",
    provider: "AWS End User Messaging",
    kind: "Messaging",
    status: "Connected",
    account: "+91 80 4718 2290 · SBC LLP",
    lastSync: at(10, 6, 12, 5),
    authExpires: null,
    hasKey: false,
    endpoint: "social-messaging.ap-south-1.amazonaws.com",
    scopes: ["social-messaging:SendWhatsAppMessage", "social-messaging:GetLinkedWhatsAppBusinessAccount"],
    webhook: `${HOOK}/whatsapp`,
    events: [
      { at: at(10, 6, 12, 5), text: "Message delivered to Northwind", chip: "OK", tone: "ok" },
      { at: at(10, 6, 12, 0), text: "Template deadline_1d rejected: not approved yet", chip: "Failed", tone: "bad" },
      { at: at(10, 6, 10, 0), text: "Template deadline_1d rejected: not approved yet", chip: "Failed", tone: "bad" },
      { at: at(10, 5, 16, 2), text: "Quality rating: High", chip: "OK", tone: "ok" },
      { at: at(10, 4, 11, 20), text: "Template registration_granted submitted to Meta", chip: "Waiting", tone: "warn" },
    ],
  },
  {
    id: "sms",
    name: "SMS",
    provider: "MSG91 · DLT registered",
    kind: "Messaging",
    status: "Connected",
    account: "Sender ID SBCLLP",
    lastSync: at(10, 6, 11, 50),
    authExpires: at(6, 23, 0, 0, 0, 2027),
    hasKey: true,
    endpoint: "control.msg91.com/api/v5",
    scopes: ["flow:send", "otp:send", "balance:read"],
    webhook: `${HOOK}/msg91`,
    events: [
      { at: at(10, 6, 11, 50), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 6, 9, 30), text: "4 overdue alerts sent", chip: "OK", tone: "ok" },
      { at: at(10, 6, 9, 12), text: "Sign-in code sent to Farhath", chip: "OK", tone: "ok" },
      { at: at(10, 5, 18, 0), text: "Balance 18,400 messages", chip: "Info", tone: "idle" },
      { at: at(10, 3, 10, 4), text: "DLT template payment_sms registered", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "outlook",
    name: "Outlook mailbox and calendar",
    provider: "Microsoft Graph",
    kind: "Microsoft 365",
    status: "Connected",
    account: "updates@sbcllp.in · 18 staff calendars",
    lastSync: at(10, 6, 12, 15),
    authExpires: at(2, 4, 0, 0, 0, 2027),
    hasKey: true,
    endpoint: "graph.microsoft.com/v1.0",
    scopes: ["Mail.Send", "Mail.ReadWrite", "Calendars.ReadWrite", "User.Read.All", "offline_access"],
    webhook: `${HOOK}/graph`,
    events: [
      { at: at(10, 6, 12, 30), text: "Calendar sync: 18 calendars, 4 changes", chip: "OK", tone: "ok" },
      { at: at(10, 6, 12, 15), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 6, 11, 2), text: "Client reply from Zenith filed to the client page", chip: "OK", tone: "ok" },
      { at: at(10, 6, 9, 45), text: "Subscription renewed for updates@sbcllp.in", chip: "OK", tone: "ok" },
      { at: at(10, 5, 16, 30), text: "Calendar sync: 18 calendars, 11 changes", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "teams",
    name: "Teams channels and bot",
    provider: "Microsoft Teams",
    kind: "Microsoft 365",
    status: "Needs re-auth",
    account: "3 channels · VCFO bot",
    lastSync: at(10, 6, 12, 15),
    authExpires: at(10, 15),
    hasKey: true,
    endpoint: "sbcllp.webhook.office.com/webhookb2/7c2e…41b0",
    scopes: ["ChannelMessage.Send", "Team.ReadBasic.All"],
    webhook: `${HOOK}/teams`,
    events: [
      { at: at(10, 6, 12, 15), text: "Webhook token expires on 15 Oct", chip: "Re-auth", tone: "warn" },
      { at: at(10, 6, 9, 0), text: "Staff daily digest posted to Compliance alerts", chip: "OK", tone: "ok" },
      { at: at(10, 5, 18, 12), text: "Webhook token expires in 10 days", chip: "Re-auth", tone: "warn" },
      { at: at(10, 5, 14, 40), text: "Escalation card posted to Incorporations", chip: "OK", tone: "ok" },
      { at: at(10, 5, 9, 0), text: "Staff daily digest posted to Compliance alerts", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "ext",
    name: "VCFO Assist extension",
    provider: "Chrome extension · MCA V3 and GST",
    kind: "Government portals",
    status: "Connected",
    account: "6 browsers · version 1.4.2",
    lastSync: at(10, 6, 12, 24),
    authExpires: at(3, 1, 0, 0, 0, 2027),
    hasKey: true,
    endpoint: "app.sbctrack.in/api/ext/v1",
    scopes: ["mca:read", "gst:read", "challan:read"],
    events: [
      { at: at(10, 6, 12, 24), text: "Portal sync: 31 forms tracked", chip: "OK", tone: "ok" },
      { at: at(10, 6, 11, 54), text: "Portal sync: 31 forms tracked", chip: "OK", tone: "ok" },
      { at: at(10, 6, 10, 24), text: "MCA V3 timed out once, retried", chip: "Retry", tone: "warn" },
      { at: at(10, 6, 9, 2), text: "Pranay's browser is on 1.4.1", chip: "Update", tone: "warn" },
      { at: at(10, 5, 17, 40), text: "SRN F12345678 status read for Bluefin", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "esign",
    name: "e-Sign",
    provider: "Leegality · Aadhaar eSign and DSC",
    kind: "Signing",
    status: "Connected",
    account: "40 signatures left",
    lastSync: at(10, 5, 17, 2),
    authExpires: at(3, 31, 0, 0, 0, 2027),
    hasKey: true,
    endpoint: "app.leegality.com/api/v3.1",
    scopes: ["document:create", "document:sign", "document:read"],
    webhook: `${HOOK}/leegality`,
    events: [
      { at: at(10, 5, 17, 2), text: "Board resolution signed for Zenith", chip: "OK", tone: "ok" },
      { at: at(10, 5, 11, 15), text: "Engagement letter sent to Bluefin", chip: "OK", tone: "ok" },
      { at: at(10, 3, 15, 30), text: "Signature pack: 40 left", chip: "Info", tone: "idle" },
      { at: at(10, 2, 12, 0), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 1, 10, 10), text: "DSC signing through the extension: 3 forms", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "pay",
    name: "Payments",
    provider: "Razorpay",
    kind: "Money",
    status: "Connected",
    account: "Fee links and UPI · live mode",
    lastSync: at(10, 6, 10, 2),
    authExpires: null,
    hasKey: true,
    endpoint: "api.razorpay.com/v1",
    scopes: ["payments", "invoices", "refunds", "settlements:read"],
    webhook: `${HOOK}/razorpay`,
    events: [
      { at: at(10, 6, 10, 2), text: "invoice.paid: INV-2026-0418 by UPI", chip: "OK", tone: "ok" },
      { at: at(10, 6, 9, 0), text: "Settlement to SBC LLP current account", chip: "OK", tone: "ok" },
      { at: at(10, 5, 15, 20), text: "payment.captured: INV-2026-0416", chip: "OK", tone: "ok" },
      { at: at(10, 5, 11, 2), text: "Webhook signature checked", chip: "OK", tone: "ok" },
      { at: at(10, 4, 18, 0), text: "refund.processed: INV-2026-0397", chip: "Info", tone: "idle" },
    ],
  },
  {
    id: "acct",
    name: "Accounting sync",
    provider: "Tally Prime",
    kind: "Money",
    status: "Offline",
    account: "Tally connector on the office PC",
    lastSync: at(10, 3, 23, 0),
    authExpires: at(2, 20, 0, 0, 0, 2027),
    hasKey: true,
    endpoint: "http://tally-pc.local:9000",
    scopes: ["invoices:write", "receipts:write"],
    events: [
      { at: at(10, 5, 23, 0), text: "Tally push skipped: connector offline", chip: "Offline", tone: "bad" },
      { at: at(10, 4, 23, 0), text: "Tally push skipped: connector offline", chip: "Offline", tone: "bad" },
      { at: at(10, 3, 23, 0), text: "Tally push: 4 invoices, 2 receipts", chip: "OK", tone: "ok" },
      { at: at(10, 2, 23, 0), text: "Tally push: 3 invoices", chip: "OK", tone: "ok" },
      { at: at(10, 1, 23, 0), text: "Tally push: 5 invoices, 1 receipt", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "ai",
    name: "Ask VCFO",
    provider: "Anthropic Claude API",
    kind: "AI",
    status: "Connected",
    account: "Model claude-sonnet-5-5",
    lastSync: at(10, 6, 12, 30),
    authExpires: null,
    hasKey: true,
    endpoint: "api.anthropic.com/v1/messages",
    scopes: ["messages:create"],
    events: [
      { at: at(10, 6, 12, 30), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 6, 12, 12), text: "Answer for Northwind: 2.1 s", chip: "OK", tone: "ok" },
      { at: at(10, 6, 11, 40), text: "Rate limit reached once, retried", chip: "Retry", tone: "warn" },
      { at: at(10, 6, 9, 0), text: "Question log: 312 entries over 30 days deleted", chip: "Info", tone: "idle" },
      { at: at(10, 5, 17, 55), text: "Answer for Zenith: 1.8 s", chip: "OK", tone: "ok" },
    ],
  },
  {
    id: "s3",
    name: "Storage",
    provider: "Amazon S3",
    kind: "Platform",
    status: "Connected",
    account: "sbc-vcfo-prod · versioning on",
    lastSync: at(10, 6, 12, 30),
    authExpires: null,
    hasKey: false,
    endpoint: "s3.ap-south-1.amazonaws.com/sbc-vcfo-prod",
    scopes: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
    events: [
      { at: at(10, 6, 12, 30), text: "Health check passed", chip: "OK", tone: "ok" },
      { at: at(10, 6, 11, 48), text: "14 files uploaded by Northwind", chip: "OK", tone: "ok" },
      { at: at(10, 6, 2, 10), text: "Lifecycle: 212 old versions moved to Glacier", chip: "Info", tone: "idle" },
      { at: at(10, 5, 16, 5), text: "Presigned URL expired before use", chip: "Info", tone: "idle" },
      { at: at(10, 5, 2, 9), text: "Lifecycle: 188 old versions moved to Glacier", chip: "Info", tone: "idle" },
    ],
  },
  {
    id: "mon",
    name: "Error tracking",
    provider: "Sentry",
    kind: "Platform",
    status: "Connected",
    account: "vcfo-suite-web",
    lastSync: at(10, 6, 12, 31),
    authExpires: null,
    hasKey: true,
    endpoint: "o4508.ingest.sentry.io",
    scopes: ["event:write", "project:read"],
    webhook: `${HOOK}/sentry`,
    events: [
      { at: at(10, 6, 11, 42), text: "New issue: portal credentials failed to decrypt", chip: "New", tone: "bad" },
      { at: at(10, 6, 11, 42), text: "Alert posted to Compliance alerts", chip: "OK", tone: "ok" },
      { at: at(10, 6, 10, 15), text: "Issue resolved: calendar sync timeout", chip: "OK", tone: "ok" },
      { at: at(10, 5, 20, 1), text: "New issue: PDF preview out of memory", chip: "New", tone: "bad" },
      { at: at(10, 5, 16, 41), text: "Release 2026.10.05 created", chip: "Info", tone: "idle" },
    ],
  },
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
    lastRun: at(10, 6, 8, 0),
    duration: "41 s",
    status: "Succeeded",
    nextRun: at(10, 7, 8, 0),
    failures7d: 0,
    log: [
      { at: at(10, 6, 8, 0, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 6, 8, 0, 3), level: "info", text: "Found 61 reminders due: 7-day 22, 3-day 18, 1-day 21" },
      { at: at(10, 6, 8, 0, 38), level: "info", text: "Email: 61 accepted by SES, 0 failed" },
      { at: at(10, 6, 8, 0, 41), level: "info", text: "Finished in 41 s" },
    ],
  },
  {
    id: "overdue",
    name: "Overdue sweep",
    cron: "30 9 * * *",
    lastRun: at(10, 6, 9, 30),
    duration: "12 s",
    status: "Succeeded",
    nextRun: at(10, 7, 9, 30),
    failures7d: 0,
    log: [
      { at: at(10, 6, 9, 30, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 6, 9, 30, 4), level: "info", text: "4 items passed their date overnight" },
      { at: at(10, 6, 9, 30, 10), level: "info", text: "SMS to Corvid, Ember, Delta and Bluefin" },
      { at: at(10, 6, 9, 30, 12), level: "info", text: "Finished in 12 s: 4 alerts sent" },
    ],
  },
  {
    id: "wa-nudges",
    name: "WhatsApp reminders",
    cron: "0 */2 * * *",
    lastRun: at(10, 6, 12, 0),
    duration: "8 s",
    status: "Failed",
    nextRun: at(10, 6, 14, 0),
    failures7d: 3,
    log: [
      { at: at(10, 6, 12, 0, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 6, 12, 0, 2), level: "info", text: "Found 14 document reminders and 14 deadline reminders" },
      { at: at(10, 6, 12, 0, 5), level: "info", text: "doc_nudge_hi_en: 14 sent" },
      { at: at(10, 6, 12, 0, 7), level: "error", text: "deadline_1d: template not approved by Meta (132001)" },
      { at: at(10, 6, 12, 0, 7), level: "warn", text: "SMS fallback is off for deadline_1d: 14 recipients skipped" },
      { at: at(10, 6, 12, 0, 8), level: "error", text: "Finished with errors in 8 s" },
    ],
  },
  {
    id: "outlook-sync",
    name: "Outlook calendar sync",
    cron: "*/15 * * * *",
    lastRun: at(10, 6, 12, 30),
    duration: "5 s",
    status: "Running",
    nextRun: at(10, 6, 12, 45),
    failures7d: 0,
    log: [
      { at: at(10, 6, 12, 30, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 6, 12, 30, 2), level: "info", text: "Reading 18 staff calendars" },
      { at: at(10, 6, 12, 30, 5), level: "info", text: "12 of 18 calendars read, 4 changes so far" },
    ],
  },
  {
    id: "portal-sync",
    name: "Portal status sync",
    cron: "*/30 * * * *",
    lastRun: at(10, 6, 12, 24),
    duration: "19 s",
    status: "Succeeded",
    nextRun: at(10, 6, 12, 54),
    failures7d: 1,
    log: [
      { at: at(10, 6, 12, 24, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 6, 12, 24, 6), level: "info", text: "MCA V3: 24 forms read" },
      { at: at(10, 6, 12, 24, 15), level: "info", text: "GST portal: 7 returns read" },
      { at: at(10, 6, 12, 24, 19), level: "info", text: "Finished in 19 s: 31 forms tracked, 2 status changes" },
    ],
  },
  {
    id: "tally",
    name: "Tally push",
    cron: "0 23 * * *",
    lastRun: at(10, 5, 23, 0),
    duration: "-",
    status: "Skipped",
    nextRun: at(10, 6, 23, 0),
    failures7d: 2,
    log: [
      { at: at(10, 5, 23, 0, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 5, 23, 0, 30), level: "warn", text: "No answer from http://tally-pc.local:9000 after 30 s" },
      { at: at(10, 5, 23, 0, 30), level: "warn", text: "Skipped: 6 invoices wait for the next run" },
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
    lastRun: at(10, 6, 2, 0),
    duration: "3 min 40 s",
    status: "Succeeded",
    nextRun: at(10, 7, 2, 0),
    failures7d: 0,
    log: [
      { at: at(10, 6, 2, 0, 0), level: "info", text: "Started by schedule" },
      { at: at(10, 6, 2, 3, 31), level: "info", text: "Snapshot vcfo-prod-2026-10-06 created: 4.2 GB" },
      { at: at(10, 6, 2, 3, 40), level: "info", text: "Finished in 3 min 40 s. Snapshots older than 35 days deleted: 1" },
    ],
  },
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
}

const LOG_SEED: Array<[LogLevel, string, string]> = [
  ["Error", "WhatsApp", "Template deadline_1d rejected: not approved yet"],
  ["Error", "Web app", "Portal credentials failed to decrypt: CREDENTIALS_ENCRYPTION_KEY not set"],
  ["Info", "Microsoft 365", "Calendar sync: 18 calendars, 4 changes"],
  ["Warn", "Email", "Soft bounce: accounts@halcyonfin.example (mailbox full)"],
  ["Info", "Ask VCFO", "Answer for Northwind in 2.1 s"],
  ["Info", "Portal extension", "Portal sync: 31 forms tracked"],
  ["Info", "Payments", "Webhook invoice.paid received: INV-2026-0418"],
  ["Info", "Web app", "GET /client/home 200 in 184 ms"],
  ["Warn", "Ask VCFO", "Rate limit reached, retried after 2 s"],
  ["Info", "Jobs", "Overdue sweep finished: 4 alerts sent"],
  ["Info", "Web app", "POST /api/documents 201 in 412 ms"],
  ["Warn", "Portal extension", "MCA V3 timed out, retried"],
  ["Info", "Jobs", "Deadline reminders: 61 sent, 0 failed"],
  ["Error", "Web app", "PDF preview out of memory: AOC-4 draft, 48 MB"],
  ["Info", "Email", "Delivery: 61 of 61 reminders delivered"],
  ["Warn", "Accounting", "Tally push skipped: connector offline"],
  ["Warn", "Microsoft 365", "Teams webhook token expires on 15 Oct"],
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
  const [level, service, message] = LOG_SEED[i % LOG_SEED.length];
  const t = new Date(at(10, 6, 12, 31, 8).getTime() - i * (11 * 60 + 37) * 1000);
  return { id: `l${i}`, at: t, level, service, message, requestId: `req_${hex(i + 101)}` };
});

export const LOG_SERVICES = Array.from(new Set(LOG_SEED.map((s) => s[1]))).sort();

// ---------- Messages ----------

export type Channel = "Email" | "WhatsApp" | "Teams";
export const CHANNEL_TONE: Record<Channel, ChipTone> = { Email: "prog", WhatsApp: "ok", Teams: "violet" };

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
    body: "Dear Priya,\n\nStep 9 (MOA and AOA review) is due on 7 Oct. Review the drafts on the portal and approve them.\n\nSBC LLP",
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
    body: "SBC LLP: TDS payment for September is due tomorrow, 7 Oct. Reply STOP to opt out.",
  },
  filed_ack_v2: {
    id: "filed_ack_v2",
    channel: "Email",
    from: "updates@sbcllp.in",
    subject: "GSTR-1 for September filed",
    body: "Dear accounts team,\n\nWe filed GSTR-1 for September 2026 on 6 Oct. ARN AA3610260012345. The acknowledgement is in Documents.\n\nSBC LLP",
  },
  digest_card: {
    id: "digest_card",
    channel: "Teams",
    from: "VCFO bot",
    body: "Daily digest, 6 Oct\n· 4 items due in 3 days\n· 1 overdue: Corvid PF return\n· 3 documents waiting on clients",
  },
  escalation_card: {
    id: "escalation_card",
    channel: "Teams",
    from: "VCFO bot",
    body: "Escalation: Bluefin step 4 (Name approval) has been stuck for 3 days. Owner: Bharath.",
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
  [12, 30, "WhatsApp", "+91 99001 •••• 48 · Zenith", "invoice_link", "Queued", 0],
  [12, 0, "WhatsApp", "+91 98450 •••• 12 · Northwind", "deadline_1d", "Failed", 2, "132001: template not approved by Meta"],
  [12, 0, "WhatsApp", "+91 90080 •••• 31 · Corvid", "deadline_1d", "Failed", 2, "132001: template not approved by Meta"],
  [12, 0, "WhatsApp", "+91 97400 •••• 77 · Delta", "doc_nudge_hi_en", "Read", 0],
  [12, 0, "WhatsApp", "+91 98450 •••• 12 · Northwind", "doc_nudge_hi_en", "Delivered", 0],
  [11, 30, "Email", "accounts@halcyonfin.example", "deadline_v4", "Queued", 1, "Soft bounce: mailbox full. SES retries for 12 hours."],
  [11, 2, "Email", "rohan@northwind.example", "filed_ack_v2", "Delivered", 0],
  [10, 0, "WhatsApp", "+91 91234 •••• 05 · Fjord", "deadline_1d", "Failed", 2, "132001: template not approved by Meta"],
  [10, 0, "WhatsApp", "+91 91234 •••• 05 · Fjord", "doc_nudge_hi_en", "Delivered", 0],
  [9, 31, "Teams", "#incorporations", "escalation_card", "Delivered", 0],
  [9, 0, "Teams", "#compliance-alerts", "digest_card", "Delivered", 0],
  [8, 1, "Email", "accounts@zenithfoods.example", "deadline_v4", "Delivered", 0],
  [8, 1, "Email", "finance@corvid.example", "deadline_v4", "Delivered", 0],
  [8, 0, "Email", "priya@northwind.example", "step_due_v2", "Read", 0],
  [8, 0, "Email", "accounts@arcadia.example", "deadline_v4", "Delivered", 0],
  [8, 0, "Email", "ops@fjordmarine.example", "deadline_v4", "Sent", 0],
  [7, 45, "Email", "rohan@northwind.example", "doc_request_v3", "Read", 0],
  [7, 40, "Email", "founders@bluefin.example", "doc_request_v3", "Delivered", 0],
  [7, 12, "Email", "admin@emberstudios.example", "doc_request_v3", "Failed", 3, "Hard bounce: address does not exist"],
];

export const MESSAGES: Message[] = M.map(([h, min, channel, to, template, status, retries, error], i) => ({
  id: `m${i}`,
  at: at(10, 6, h, min),
  channel,
  to,
  template,
  status,
  retries,
  error,
}));

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
  { id: "d9", version: "2026.10.06-rc1", commit: "a41be09", env: "Staging", at: at(10, 6, 11, 20), by: "Farhath", duration: "3 min 52 s", status: "Live", note: "Developer console redesign" },
  { id: "d8", version: "2026.10.05", commit: "6c26d7e", env: "Production", at: at(10, 5, 16, 40), by: "Farhath", duration: "4 min 10 s", status: "Live", note: "Large-file splits; settings account page" },
  { id: "d7", version: "2026.10.05", commit: "6c26d7e", env: "Staging", at: at(10, 5, 14, 5), by: "Farhath", duration: "3 min 41 s", status: "Succeeded", note: "Large-file splits; settings account page" },
  { id: "d6", version: "2026.10.02", commit: "c0c15f0", env: "Production", at: at(10, 2, 18, 15), by: "Farhath", duration: "4 min 2 s", status: "Succeeded", note: "Client portal home split" },
  { id: "d5", version: "2026.10.01", commit: "b77e1a4", env: "Production", at: at(10, 1, 17, 30), by: "Deploy bot", duration: "2 min 11 s", status: "Failed", note: "Migration 0041 timed out" },
  { id: "d4", version: "2026.09.28", commit: "98c2004", env: "Production", at: at(9, 28, 16, 0), by: "Farhath", duration: "3 min 58 s", status: "Succeeded", note: "Firm people, admin forms" },
  { id: "d3", version: "2026.09.24", commit: "5d0a3be", env: "Production", at: at(9, 24, 15, 10), by: "Farhath", duration: "4 min 5 s", status: "Rolled back", note: "Calendar sync rewrite" },
  { id: "d2", version: "2026.09.23", commit: "7919a5b", env: "Production", at: at(9, 23, 12, 40), by: "Farhath", duration: "3 min 49 s", status: "Succeeded", note: "WhatsApp reminders (outbound only)" },
];

export interface Migration {
  id: string;
  status: "Applied" | "Pending";
  at?: Date;
  what: string;
}

export const MIGRATIONS: Migration[] = [
  { id: "0041_firm_people", status: "Applied", at: at(10, 2, 18, 17), what: "Firm people and roles" },
  { id: "0042_client_practice_areas", status: "Pending", what: "Registration status per client" },
  { id: "0043_message_routes", status: "Pending", what: "Message routing in the database" },
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
}

export const API_KEYS: ApiKey[] = [
  { id: "k-enc", name: "CREDENTIALS_ENCRYPTION_KEY", prefix: "Not set", scope: "Portal credentials", created: null, expires: null, lastUsed: null, own: false, missing: true },
  { id: "k-teams", name: "Teams webhook URL", prefix: "webhookb2/7c2e", scope: "Teams channel", created: at(7, 15), expires: at(10, 15), lastUsed: at(10, 6, 12, 15), own: false },
  { id: "k-pd", name: "Partner dashboard", prefix: "vk_live_pd3a", scope: "Read", created: at(9, 2), expires: at(3, 2, 0, 0, 0, 2027), lastUsed: at(10, 6, 9, 0), own: true },
  { id: "k-tally", name: "Tally connector", prefix: "vk_live_tc81", scope: "Write invoices", created: at(8, 20), expires: at(2, 20, 0, 0, 0, 2027), lastUsed: at(10, 3, 23, 0), own: true },
  { id: "k-ext", name: "VCFO Assist extension", prefix: "vk_live_ex42", scope: "Read portals", created: at(9, 1), expires: at(3, 1, 0, 0, 0, 2027), lastUsed: at(10, 6, 12, 24), own: true },
  { id: "k-ai", name: "ANTHROPIC_API_KEY", prefix: "sk-ant-…9c1d", scope: "Ask VCFO", created: at(10, 1), expires: null, lastUsed: at(10, 6, 12, 30), own: false },
  { id: "k-rzp", name: "Razorpay key secret", prefix: "rzp_live_…3KfQ", scope: "Payments", created: at(8, 20), expires: null, lastUsed: at(10, 6, 10, 2), own: false },
  { id: "k-msg91", name: "MSG91 auth key", prefix: "…91ae", scope: "SMS", created: at(7, 2), expires: at(6, 23, 0, 0, 0, 2027), lastUsed: at(10, 6, 11, 50), own: false },
  { id: "k-graph", name: "Microsoft Graph client secret", prefix: "…8Q~d", scope: "Mail and calendars", created: at(8, 14), expires: at(2, 4, 0, 0, 0, 2027), lastUsed: at(10, 6, 12, 15), own: false },
  { id: "k-rds", name: "RDS master password", prefix: "Secrets Manager", scope: "Database", created: at(9, 1), expires: at(11, 11), lastUsed: at(10, 6, 2, 0), own: false },
];

export interface ConsoleUser {
  id: string;
  name: string;
  role: string;
  twoFactor: "On" | "Off" | "Not used";
  lastSignIn: Date;
}

export const CONSOLE_USERS: ConsoleUser[] = [
  { id: "u-farhath", name: "Farhath", role: "Developer", twoFactor: "On", lastSignIn: at(10, 6, 9, 12) },
  { id: "u-mithilesh", name: "Mithilesh", role: "Super admin", twoFactor: "On", lastSignIn: at(10, 5, 18, 40) },
  { id: "u-krishna", name: "Krishna", role: "Admin, read only", twoFactor: "Off", lastSignIn: at(10, 2, 11, 5) },
  { id: "u-bot", name: "Deploy bot", role: "Service account", twoFactor: "Not used", lastSignIn: at(10, 5, 16, 36) },
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
  { k: "Last backup", v: "6 Oct 02:00 · 3 min 40 s" },
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
}

export const COSTS: ServiceCost[] = [
  { service: "Claude API (Ask VCFO)", thisMonth: 3790, lastMonth: 3120, group: "Claude API" },
  { service: "App Runner", thisMonth: 1960, lastMonth: 1900, group: "App Runner" },
  { service: "RDS Postgres", thisMonth: 1480, lastMonth: 1480, group: "Database" },
  { service: "WhatsApp messages", thisMonth: 640, lastMonth: 510, group: "Messaging" },
  { service: "Error tracking (Sentry)", thisMonth: 440, lastMonth: 440, group: "Other" },
  { service: "SMS (MSG91)", thisMonth: 420, lastMonth: 430, group: "Messaging" },
  { service: "S3 storage", thisMonth: 380, lastMonth: 350, group: "Other" },
  { service: "Email (SES)", thisMonth: 90, lastMonth: 85, group: "Messaging" },
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

export type AuditAction = "Deploy" | "Roll back" | "Rotate key" | "Revoke key" | "Change setting" | "Run job" | "Reconnect" | "Disconnect" | "Test" | "Sign in" | "Retry message";
export type AuditResult = "Done" | "Failed";
export const RESULT_TONE: Record<AuditResult, ChipTone> = { Done: "ok", Failed: "bad" };

export interface AuditEntry {
  id: string;
  at: Date;
  actor: string;
  action: AuditAction;
  target: string;
  result: AuditResult;
}

export const AUDIT: AuditEntry[] = [
  { id: "a1", at: at(10, 6, 11, 20), actor: "Farhath", action: "Deploy", target: "Staging 2026.10.06-rc1", result: "Done" },
  { id: "a2", at: at(10, 6, 9, 12), actor: "Farhath", action: "Sign in", target: "Developer console", result: "Done" },
  { id: "a3", at: at(10, 5, 18, 40), actor: "Mithilesh", action: "Sign in", target: "Developer console", result: "Done" },
  { id: "a4", at: at(10, 5, 16, 40), actor: "Farhath", action: "Deploy", target: "Production 2026.10.05", result: "Done" },
  { id: "a5", at: at(10, 5, 16, 36), actor: "Deploy bot", action: "Deploy", target: "Staging 2026.10.05", result: "Done" },
  { id: "a6", at: at(10, 4, 10, 2), actor: "Farhath", action: "Change setting", target: "Mask secrets in logs: on", result: "Done" },
  { id: "a7", at: at(10, 3, 12, 30), actor: "Farhath", action: "Test", target: "Accounting sync", result: "Failed" },
  { id: "a8", at: at(10, 3, 9, 15), actor: "Farhath", action: "Rotate key", target: "ANTHROPIC_API_KEY", result: "Done" },
  { id: "a9", at: at(10, 2, 18, 15), actor: "Farhath", action: "Deploy", target: "Production 2026.10.02", result: "Done" },
  { id: "a10", at: at(10, 2, 11, 5), actor: "Krishna", action: "Sign in", target: "Developer console", result: "Done" },
  { id: "a11", at: at(10, 1, 17, 30), actor: "Deploy bot", action: "Deploy", target: "Production 2026.10.01", result: "Failed" },
  { id: "a12", at: at(10, 1, 8, 20), actor: "Farhath", action: "Run job", target: "Portal status sync", result: "Done" },
  { id: "a13", at: at(9, 29, 14, 0), actor: "Farhath", action: "Reconnect", target: "Outlook mailbox and calendar", result: "Done" },
  { id: "a14", at: at(9, 28, 16, 0), actor: "Farhath", action: "Deploy", target: "Production 2026.09.28", result: "Done" },
  { id: "a15", at: at(9, 25, 10, 5), actor: "Farhath", action: "Roll back", target: "Production to 2026.09.23", result: "Done" },
  { id: "a16", at: at(9, 22, 12, 0), actor: "Mithilesh", action: "Change setting", target: "Admins can read logs: off", result: "Done" },
  { id: "a17", at: at(9, 18, 11, 40), actor: "Farhath", action: "Revoke key", target: "Old partner key vk_live_pd19", result: "Done" },
  { id: "a18", at: at(9, 10, 15, 0), actor: "Farhath", action: "Rotate key", target: "RDS master password", result: "Done" },
];
