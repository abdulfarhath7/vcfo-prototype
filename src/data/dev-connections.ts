// Every setting of every connection. Ported from reference/old-patch/dev/detail.js.
// Dates moved 10 days back so "today" is 6 Oct 2026. Secrets are always masked. Demo values only.
import type { ChipTone } from "@/components/ui/Chip";
import type { AuditAction, Channel } from "@/data/dev";

/** A button in a row or a cell. With `ask`, it asks first and shows the change (R-40). */
export interface SpecButton {
  label: string;
  /** Question for the inline confirm. Omit for a plain action. */
  ask?: string;
  before?: string;
  after?: string;
  action: AuditAction;
  /** Text that replaces the button after it runs. */
  done: string;
}

export interface RowExtras {
  chip?: [string, ChipTone];
  mono?: boolean;
  list?: string[];
  /** Switch: saved as it changes. */
  sw?: { key: string; on: boolean };
  /** Segmented choice: saved as it changes. */
  seg?: { key: string; opts: string[]; sel: number };
  btn?: SpecButton;
  /** Copy the value. */
  copy?: boolean;
}

export interface SpecRow {
  label: string;
  hint?: string;
  value?: string;
  x?: RowExtras;
}

export type SpecCell = string | { t?: string; mono?: boolean; tone?: ChipTone; sub?: string; btn?: SpecButton };

export type Section =
  | { kind: "rows"; title: string; meta?: string; rows: SpecRow[] }
  | { kind: "table"; title: string; meta?: string; head: string[]; rows: SpecCell[][] }
  /** SPF, DKIM, DMARC and return path, with Verify. */
  | { kind: "domain" }
  /** Message routes that use this channel. */
  | { kind: "used"; channel: Channel }
  | { kind: "test"; to: string; via: string }
  | { kind: "events" }
  | { kind: "disconnect"; effect: string };

const rotate = (what: string, before: string, after: string): SpecButton => ({ label: "Rotate", ask: `Rotate the ${what}?`, before, after, action: "Rotate key", done: "Rotated" });

export const CONNECTION_DETAIL: Record<string, Section[]> = {
  wa: [
    {
      kind: "rows",
      title: "Connection",
      rows: [
        { label: "Status", hint: "Checked every 5 minutes", value: "3 templates are waiting for Meta approval", x: { chip: ["Needs attention", "warn"] } },
        { label: "Provider", hint: "Outbound only. A WhatsApp failure never blocks email.", value: "AWS End User Messaging Social · ap-south-1" },
        { label: "Business account", hint: "WhatsApp Business Account (WABA) linked through Meta", value: "SBC LLP · WABA 1048 •••• 2290", x: { mono: true, chip: ["Verified by Meta", "ok"] } },
        { label: "Phone number", hint: "The number clients see. Display name approved by Meta.", value: "+91 80 4718 2290 · SBC LLP", x: { mono: true } },
        { label: "Phone number ID", hint: "Used by the app to send", value: "phone-number-id-6c1e •••• a91f", x: { mono: true, copy: true } },
        { label: "Quality rating", hint: "Meta lowers the limit if clients block or report messages", x: { chip: ["High", "ok"] } },
        { label: "Messaging limit", hint: "Business-started conversations in 24 hours. Tier 1.", value: "1,000 a day · 612 used this month" },
        { label: "Throughput", hint: "Messages a second at most", value: "80 a second" },
      ],
    },
    {
      kind: "rows",
      title: "Credentials and events",
      rows: [
        { label: "Access", hint: "App Runner signs requests with its IAM role. No key is stored.", value: "IAM role vcfo-apprunner-wa", x: { mono: true, chip: ["Working", "ok"] } },
        { label: "Event destination", hint: "Delivery, read and failure events come back here", value: "SNS topic vcfo-wa-events → /api/webhooks/whatsapp", x: { mono: true } },
        { label: "Event signature", hint: "Every event is checked before it is stored", value: "Checked on every event", x: { chip: ["On", "ok"] } },
        { label: "Last event", value: "6 Oct 12:05 · message delivered to Northwind" },
      ],
    },
    {
      kind: "table",
      title: "Templates",
      meta: "11 approved · 3 waiting",
      head: ["Template", "Category", "Language", "Status", "Last sent", "Sent, 7 days"],
      rows: [
        [{ t: "doc_nudge_hi_en", mono: true }, "Utility", "en, hi", { t: "Approved", tone: "ok" }, "6 Oct 12:00", "61"],
        [{ t: "step_due_wa", mono: true }, "Utility", "en", { t: "Approved", tone: "ok" }, "6 Oct 09:00", "38"],
        [{ t: "filed_ack_wa", mono: true }, "Utility", "en", { t: "Approved", tone: "ok" }, "5 Oct", "22"],
        [{ t: "welcome_client", mono: true }, "Utility", "en", { t: "Approved", tone: "ok" }, "2 Oct", "3"],
        [{ t: "deadline_1d", mono: true }, "Utility", "en", { t: "Waiting since 4 Oct", tone: "warn" }, "-", "0"],
        [{ t: "invoice_link", mono: true }, "Utility", "en", { t: "Waiting since 4 Oct", tone: "warn" }, "-", "0"],
        [{ t: "registration_granted", mono: true }, "Utility", "en", { t: "Waiting since 5 Oct", tone: "warn" }, "-", "0"],
      ],
    },
    {
      kind: "rows",
      title: "Delivery, last 7 days",
      rows: [
        { label: "Sent", value: "612" },
        { label: "Delivered", hint: "Reached the phone", value: "97.8%", x: { chip: ["Normal", "ok"] } },
        { label: "Read", hint: "Blue ticks, where the client allows them", value: "71%" },
        { label: "Failed", hint: "Each failure falls back to SMS when the rule is on", value: "14", x: { list: ["131047 · the 24-hour window had closed (8)", "131026 · the number is not on WhatsApp (4)", "132001 · the template is not approved yet (2)"] } },
      ],
    },
    {
      kind: "rows",
      title: "Rules",
      rows: [
        { label: "Opt-in", hint: "Clients opt in on the portal or at onboarding", value: "214 contacts opted in" },
        { label: "Opt-out word", hint: "A client who replies with it gets no more WhatsApp messages", value: "STOP · 4 opted out this month", x: { mono: true } },
        { label: "Quiet hours", hint: "Nothing is sent in this window; it waits for the morning", x: { seg: { key: "wa-quiet", opts: ["Off", "21:00 to 09:00", "20:00 to 10:00"], sel: 1 } } },
        { label: "If WhatsApp fails", hint: "Send the same message by SMS from SBCLLP", x: { sw: { key: "wa-fallback", on: false } } },
        { label: "Email first", hint: "Email is the record; WhatsApp is a reminder sent after it", x: { chip: ["Always on", "prog"] } },
      ],
    },
    { kind: "used", channel: "WhatsApp" },
    { kind: "test", to: "+91 98450 •••• 12", via: "WhatsApp" },
    { kind: "events" },
    { kind: "disconnect", effect: "Reminders on WhatsApp stop; email and SMS carry on." },
  ],
  ses: [
    {
      kind: "rows",
      title: "Connection",
      rows: [
        { label: "Status", hint: "Checked every 5 minutes", value: "Sending normally", x: { chip: ["Connected", "ok"] } },
        { label: "Provider", hint: "The system of record for client mail", value: "Amazon SES · ap-south-1 · production access" },
        { label: "Sending quota", hint: "Per day and per second", value: "50,000 a day · 14 a second · 1,408 used this month" },
        { label: "Configuration set", hint: "Opens, bounces and complaints go to SNS", value: "vcfo-prod", x: { mono: true } },
        { label: "Fallback", hint: "Used only when SES fails to accept a message", value: "Resend · key ending 4f2a", x: { mono: true, sw: { key: "ses-fallback", on: true } } },
      ],
    },
    { kind: "domain" },
    {
      kind: "table",
      title: "Sending addresses",
      head: ["Address", "Used for", "Status"],
      rows: [
        [{ t: "updates@sbcllp.in", mono: true }, "Document requests, step reminders, filing confirmations", { t: "Verified", tone: "ok" }],
        [{ t: "reminders@sbcllp.in", mono: true }, "Deadline reminders 7, 3 and 1 days before", { t: "Verified", tone: "ok" }],
        [{ t: "reports@sbcllp.in", mono: true }, "Monthly client report, partner report", { t: "Verified", tone: "ok" }],
        [{ t: "noreply@sbcllp.in", mono: true }, "Sign-in links", { t: "Verified", tone: "ok" }],
      ],
    },
    {
      kind: "rows",
      title: "Reputation",
      rows: [
        { label: "Bounce rate", hint: "AWS reviews the account above 5%", value: "0.6%", x: { chip: ["Healthy", "ok"] } },
        { label: "Complaint rate", hint: "AWS reviews the account above 0.1%", value: "0.02%", x: { chip: ["Healthy", "ok"] } },
        {
          label: "Suppression list",
          hint: "Addresses SES will not send to again",
          value: "12 addresses",
          x: { btn: { label: "Clear 1 address", ask: "Remove accounts@halcyonfin.example from the suppression list?", before: "12 addresses", after: "11 addresses", action: "Change setting", done: "11 addresses" } },
        },
        { label: "DMARC policy", hint: "Move from none to quarantine once reports are clean", value: "p=none", x: { mono: true, chip: ["Change suggested", "warn"] } },
      ],
    },
    {
      kind: "rows",
      title: "Signatures and letterhead",
      rows: [
        { label: "Staff mail", hint: "Sent as the person through Outlook", value: "The server-side signature tool adds each person's Outlook signature", x: { chip: ["On", "ok"] } },
        { label: "System mail", hint: "Reminders, confirmations and reports", value: "SBC letterhead from email-layout.ts", x: { mono: false } },
      ],
    },
    { kind: "used", channel: "Email" },
    { kind: "test", to: "farhath@sbcllp.in", via: "Email" },
    { kind: "events" },
    { kind: "disconnect", effect: "Every client email stops. Do not do this in production." },
  ],
  sms: [
    {
      kind: "rows",
      title: "Connection",
      rows: [
        { label: "Status", value: "Sending normally", x: { chip: ["Connected", "ok"] } },
        { label: "Provider", hint: "DLT registered with TRAI, transactional route", value: "MSG91" },
        { label: "Sender ID", hint: "The six letters shown on the phone", value: "SBCLLP", x: { mono: true } },
        { label: "DLT entity ID", value: "1101 •••• 7781", x: { mono: true } },
        { label: "Auth key", hint: "Stored in Secrets Manager. Rotated every 12 months.", value: "•••• •••• 91ae", x: { mono: true, btn: rotate("MSG91 auth key", "Key ending 91ae", "New key") } },
        { label: "Balance", hint: "A warning goes to Teams below 2,000", value: "18,400 messages" },
      ],
    },
    {
      kind: "table",
      title: "DLT templates",
      meta: "6 registered",
      head: ["Template", "Used for", "Status", "Sent, 7 days"],
      rows: [
        [{ t: "otp_login", mono: true }, "Sign-in codes", { t: "Registered", tone: "ok" }, "412"],
        [{ t: "overdue_alert", mono: true }, "The morning after a missed date", { t: "Registered", tone: "ok" }, "9"],
        [{ t: "wa_fallback_doc", mono: true }, "WhatsApp document reminder, when WhatsApp fails", { t: "Registered", tone: "ok" }, "8"],
        [{ t: "wa_fallback_due", mono: true }, "WhatsApp step reminder, when WhatsApp fails", { t: "Registered", tone: "ok" }, "6"],
        [{ t: "filed_sms", mono: true }, "Filing confirmation", { t: "Registered", tone: "ok" }, "0"],
        [{ t: "payment_sms", mono: true }, "Payment received", { t: "Registered", tone: "ok" }, "0"],
      ],
    },
    { kind: "used", channel: "SMS" },
    { kind: "test", to: "+91 98450 •••• 12", via: "SMS" },
    { kind: "events" },
    { kind: "disconnect", effect: "Sign-in codes stop, so two-step sign-in fails for everyone." },
  ],
  outlook: [
    {
      kind: "rows",
      title: "Connection",
      rows: [
        { label: "Status", value: "Mail and calendars syncing", x: { chip: ["Connected", "ok"] } },
        { label: "Tenant", hint: "SBC's Microsoft 365", value: "sbcllp.in · tenant 7c2e •••• 41b0", x: { mono: true } },
        { label: "App registration", hint: "Registered in Entra ID by Farhath", value: "VCFO Suite · client ID 3f2a •••• c81d", x: { mono: true, copy: true } },
        { label: "Permissions", hint: "Admin consent granted 14 Aug 2026", x: { mono: true, list: ["Mail.Send", "Mail.ReadWrite (shared mailbox only)", "Calendars.ReadWrite", "User.Read.All", "offline_access"] } },
        { label: "Client secret", hint: "Expires 4 Feb 2027", value: "•••• •••• •••• 8Q~d", x: { mono: true, chip: ["121 days left", "ok"], btn: rotate("Microsoft Graph client secret", "Expires 4 Feb 2027", "New secret, 24 months") } },
      ],
    },
    {
      kind: "rows",
      title: "Mailboxes and calendars",
      rows: [
        { label: "Shared mailbox", hint: "Client replies land here and on the client page", value: "updates@sbcllp.in", x: { mono: true } },
        { label: "Staff calendars", hint: "Filing dates and meetings sync both ways", value: "18 calendars" },
        { label: "Calendar sync", hint: "Every 15 minutes", value: "Last sync 6 Oct 12:30", x: { sw: { key: "m365-cal", on: true } } },
        { label: "Signatures", hint: "Microsoft Graph has no signature API; the server-side tool adds them", value: "Server-side signature tool", x: { chip: ["On", "ok"] } },
      ],
    },
    { kind: "events" },
    { kind: "disconnect", effect: "Mail sent as staff and calendar sync stop." },
  ],
  teams: [
    {
      kind: "rows",
      title: "Connection",
      rows: [
        { label: "Status", value: "The webhook token expires on 15 Oct", x: { chip: ["Needs attention", "warn"] } },
        { label: "Bot", hint: "Sends digests and escalation cards", value: "VCFO bot · installed for 18 staff" },
      ],
    },
    {
      kind: "table",
      title: "Channels",
      head: ["Channel", "What goes there", "Token", ""],
      rows: [
        [
          "Compliance alerts",
          "Staff daily digest at 09:00, errors from Sentry",
          { t: "Expires 15 Oct", tone: "warn" },
          { btn: { label: "Renew", ask: "Paste a new incoming webhook URL for Compliance alerts?", before: "Expires 15 Oct", after: "New URL, 90 days", action: "Rotate key", done: "Renewed" } },
        ],
        ["Incorporations", "Steps stuck for 3 days, escalations", { t: "Bot", tone: "ok" }, ""],
        ["Partners", "Monthly partner report", { t: "Bot", tone: "ok" }, ""],
      ],
    },
    { kind: "used", channel: "Teams" },
    { kind: "events" },
    { kind: "disconnect", effect: "Digests and escalations stop; email still goes." },
  ],
  ext: [
    {
      kind: "rows",
      title: "Connection",
      rows: [
        { label: "Status", value: "6 browsers active", x: { chip: ["Connected", "ok"] } },
        { label: "Version", hint: "Published to the Chrome Web Store, unlisted. Auto-update.", value: "1.4.2", x: { mono: true, sw: { key: "ext-auto", on: true } } },
        { label: "Portals", hint: "Read only. Staff sign in on the portal themselves.", x: { list: ["MCA V3 · filing status, SRNs, challans", "GST portal · return status, ARNs"] } },
        { label: "Passwords", x: { chip: ["None stored", "ok"] } },
        { label: "Forms tracked", value: "31 forms · last sync 12:24" },
      ],
    },
    {
      kind: "table",
      title: "Browsers per person",
      head: ["Person", "Browser", "Version", "Last seen"],
      rows: [
        ["Bharath", "Chrome on Windows", { t: "1.4.2", mono: true }, "6 Oct 12:24"],
        ["Sneha Kulkarni", "Chrome on Windows", { t: "1.4.2", mono: true }, "6 Oct 11:58"],
        ["Meera Nair", "Edge on Windows", { t: "1.4.2", mono: true }, "6 Oct 11:10"],
        ["Pranay", "Chrome on Mac", { t: "1.4.1", mono: true }, { t: "Update due", tone: "warn" }],
        ["Priya Raman", "Chrome on Windows", { t: "1.4.2", mono: true }, "5 Oct"],
        ["Farhath", "Chrome on Linux", { t: "1.4.2", mono: true }, "6 Oct 12:30"],
      ],
    },
    { kind: "events" },
  ],
  pay: [
    {
      kind: "rows",
      title: "Connection",
      rows: [
        { label: "Status", value: "Live mode", x: { chip: ["Connected", "ok"] } },
        { label: "Provider", hint: "Fee links and UPI on invoices", value: "Razorpay" },
        { label: "Key ID", value: "rzp_live_•••• 3KfQ", x: { mono: true, copy: true } },
        { label: "Key secret", hint: "Stored in Secrets Manager", value: "•••• •••• •••• x9Lp", x: { mono: true, btn: rotate("Razorpay key secret", "Secret ending x9Lp", "New secret") } },
        { label: "Webhook", hint: "Events: payment.captured, invoice.paid, refund.processed", value: "/api/webhooks/razorpay · last received 10:02", x: { mono: true } },
        { label: "Settlements", value: "SBC LLP current account •••• 4410", x: { mono: true } },
      ],
    },
    { kind: "events" },
    { kind: "disconnect", effect: "Payment links on invoices stop working." },
  ],
  ai: [
    {
      kind: "rows",
      title: "Connection",
      rows: [
        { label: "Status", value: "Answering normally", x: { chip: ["Connected", "ok"] } },
        { label: "Model", hint: "Used by Ask VCFO in every portal", x: { mono: true, seg: { key: "ai-model", opts: ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"], sel: 1 } } },
        { label: "API key", hint: "Stored in Secrets Manager", value: "sk-ant-•••• 9c1d", x: { mono: true, btn: rotate("Anthropic API key", "Key ending 9c1d", "New key") } },
        { label: "Data rule", hint: "Each answer uses only the asking client's own data", value: "Per-client scope", x: { chip: ["Enforced", "ok"] } },
        { label: "Question log", hint: "Kept for review, then deleted", x: { seg: { key: "ai-keep", opts: ["7 days", "30 days", "90 days"], sel: 1 } } },
        { label: "Budget", value: "₹40,000 a month · ₹3,790 used" },
        { label: "Usage this month", value: "1,842 answers · 3.1 M tokens" },
      ],
    },
    { kind: "events" },
    { kind: "disconnect", effect: "The Ask VCFO panel shows \"not available\" in every portal." },
  ],
  s3: [
    {
      kind: "rows",
      title: "Connection",
      rows: [
        { label: "Status", value: "Working", x: { chip: ["Connected", "ok"] } },
        { label: "Bucket", value: "sbc-vcfo-prod · ap-south-1", x: { mono: true, copy: true } },
        { label: "Encryption", value: "SSE-S3 at rest · TLS in transit", x: { chip: ["On", "ok"] } },
        { label: "Versioning", hint: "A replaced file keeps its old version", value: "On", x: { sw: { key: "s3-ver", on: true } } },
        { label: "Lifecycle", value: "Old versions move to Glacier after 90 days" },
        { label: "Size", value: "38 GB · 21,406 files" },
      ],
    },
    { kind: "events" },
  ],
  mon: [
    {
      kind: "rows",
      title: "Connection",
      rows: [
        { label: "Status", value: "14 errors in 24 hours, 2 new", x: { chip: ["Connected", "ok"] } },
        { label: "Project", value: "vcfo-suite-web", x: { mono: true } },
        { label: "Alerts", hint: "New errors post to Teams", value: "Compliance alerts channel", x: { sw: { key: "mon-alert", on: true } } },
        { label: "Sample rate", hint: "Share of page loads traced", x: { seg: { key: "mon-rate", opts: ["5%", "10%", "25%"], sel: 1 } } },
      ],
    },
    { kind: "events" },
  ],
  hooks: [
    {
      kind: "table",
      title: "API keys",
      head: ["Key", "Access", "Created", "Last used", ""],
      rows: [
        ["Partner dashboard", "Read", "2 Sep 2026", "6 Oct 09:00", { btn: { label: "Revoke", ask: "Revoke the Partner dashboard key?", before: "Active", after: "Revoked", action: "Revoke key", done: "Revoked" } }],
        ["Tally connector", "Write invoices", "20 Aug 2026", "3 Oct 23:00", { btn: { label: "Revoke", ask: "Revoke the Tally connector key?", before: "Active", after: "Revoked", action: "Revoke key", done: "Revoked" } }],
      ],
    },
    {
      kind: "table",
      title: "Webhooks",
      head: ["Event", "Sent to", "Last delivery"],
      rows: [
        [{ t: "filing.filed", mono: true }, { t: "https://partners.sbcllp.in/hooks", mono: true }, { t: "Delivered", tone: "ok" }],
        [{ t: "step.completed", mono: true }, { t: "https://partners.sbcllp.in/hooks", mono: true }, { t: "Delivered", tone: "ok" }],
        [{ t: "invoice.paid", mono: true }, { t: "http://tally-pc.local:9000", mono: true }, { t: "Failed 3 times", tone: "bad" }],
      ],
    },
    { kind: "events" },
  ],
};

/** Detail for a connection with no spec: its lines, then events, then disconnect. */
export function detailFor(id: string, lines: string[] | undefined, name: string, notConnected: boolean): Section[] {
  const spec = CONNECTION_DETAIL[id];
  if (spec) return spec;
  const rows: SpecRow[] = (lines ?? []).map((l, i) => ({ label: i === 0 ? "Settings and health" : "", value: l }));
  const out: Section[] = [{ kind: "rows", title: "Connection", rows }];
  if (!notConnected) out.push({ kind: "events" }, { kind: "disconnect", effect: `Anything that uses ${name} stops until it is connected again.` });
  return out;
}
