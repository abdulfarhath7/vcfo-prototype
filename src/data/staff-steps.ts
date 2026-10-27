import { TODAY, d } from "@/lib/dates";
import { STEPS, type Step, type StepStatus } from "@/data/incorporation";
import { PHASE_TOTALS, type StaffClient } from "@/data/staff-clients";
import type { ThreadStep } from "@/components/cards/Thread";

// Step page data for every client: status, window, history, form fields, explainer and VCFO Assist profile.
// Ported from reference/old-screens/s/lead/Step.dc.html and Overview.dc.html. Northwind keeps the plan in incorporation.ts.
// Other clients get dates built from their phase counts, the days with the holder and the next date.

const DAY = 86400000;
const add = (date: Date, n: number) => new Date(date.getTime() + n * DAY);

/** Index 0..24 of the current step, or 25 when all incorporation steps are done. */
export function currentIndex(c: StaffClient): number {
  if (c.id === "northwind") return STEPS.findIndex((s) => s.status !== "Completed");
  let k = 0;
  for (const p of [0, 1, 2] as const) {
    if (c.phases[p] < PHASE_TOTALS[p]) return k + c.phases[p];
    k += PHASE_TOTALS[p];
  }
  return 25;
}

/** Step number of the current incorporation step, or undefined when incorporation is done. */
export function currentStepN(c: StaffClient): number | undefined {
  const k = currentIndex(c);
  return k < 25 ? k + 1 : undefined;
}

export interface StepState {
  status: StepStatus;
  /** Start of the work window. */
  from?: Date;
  /** End of the work window (due date). */
  to?: Date;
  done?: Date;
}

/** Status and dates of step n for client c. */
export function stepState(c: StaffClient, n: number): StepState {
  const s = STEPS[n - 1];
  if (c.id === "northwind") {
    const from = s.done ? add(s.done, -2) : s.due ? add(s.due, -7) : undefined;
    return { status: s.status, from, to: s.due ?? s.done, done: s.done };
  }
  const k = n - 1;
  const cur = currentIndex(c);
  if (k < cur) {
    const done = add(TODAY, -(c.days + (cur - k) * 3 + (cur === 25 ? 60 : 0)));
    return { status: "Completed", from: add(done, -3), to: done, done };
  }
  if (k === cur) {
    const status: StepStatus = c.health === "Overdue" || c.health === "Stuck" ? "Sent back" : c.pendingWith === "Client" ? "Waiting" : "In progress";
    return { status, from: add(TODAY, -c.days), to: c.next };
  }
  const from = add(c.next, (k - cur - 1) * 3 + 1);
  return { status: "Upcoming", from, to: add(from, 3) };
}

const ownerOf = (s: Step): ThreadStep["owner"] => s.owner;

/** Step history for any client (R-23: upcoming entries are faded and carry no date). */
export function stepHistory(c: StaffClient, n: number): ThreadStep[] {
  const s = STEPS[n - 1];
  const st = stepState(c, n);
  if (c.id === "northwind" && n === 7) return NORTHWIND_7_HISTORY;
  const from = st.from ?? TODAY;
  const sbcWorker = s.by ?? c.lead;
  const work = s.owner === "client" ? "Client uploads the documents" : s.owner === "mca" ? "MCA reviews the filing" : `${sbcWorker} prepares the form`;
  if (st.status === "Upcoming")
    return [
      { id: "h1", title: `Step opens after Step ${n - 1}`, state: "upcoming" },
      { id: "h2", title: "Documents asked", state: "upcoming", owner: "sbc" },
      { id: "h3", title: work, state: "upcoming", owner: ownerOf(s) },
      { id: "h4", title: "SBC review", state: "upcoming", owner: "sbc" },
      { id: "h5", title: "Step complete", state: "upcoming" },
    ];
  if (st.status === "Completed") {
    const done = st.done ?? TODAY;
    return [
      { id: "h1", title: "Step opened", state: "done", date: from, by: c.lead },
      { id: "h2", title: "Documents asked", state: "done", date: add(from, 0), by: c.lead },
      { id: "h3", title: work.replace("uploads", "uploaded").replace("reviews", "reviewed").replace("prepares", "prepared"), state: "done", date: add(done, -1), owner: ownerOf(s), by: s.owner === "client" ? c.short : undefined },
      { id: "h4", title: "SBC review", state: "done", date: done, by: c.lead, owner: "sbc" },
      { id: "h5", title: "Step complete", state: "done", date: done, by: c.manager },
    ];
  }
  const rows: ThreadStep[] = [
    { id: "h1", title: "Step opened", state: "done", date: from, by: c.lead },
    { id: "h2", title: "Documents asked", state: "done", date: from, by: c.lead },
  ];
  if (st.status === "Sent back") {
    rows.push({ id: "h3", title: s.owner === "mca" ? "MCA sent remarks" : "First upload sent back", state: "done", date: add(TODAY, -Math.max(1, c.days - 1)), owner: s.owner === "mca" ? "mca" : "sbc", note: c.step });
    rows.push({ id: "h4", title: s.owner === "mca" ? "Reply to MCA remarks" : "Fresh upload", state: "current", date: TODAY, owner: s.owner === "mca" ? "sbc" : ownerOf(s), note: `${c.health} · ${c.days} days` });
  } else if (st.status === "Waiting") {
    rows.push({ id: "h3", title: "Reminder sent", state: "done", date: add(TODAY, -Math.max(1, Math.floor(c.days / 2))), by: c.lead });
    rows.push({ id: "h4", title: work, state: "current", date: TODAY, owner: "client", note: `Asked ${c.days} days ago` });
  } else {
    rows.push({ id: "h3", title: work, state: "current", date: TODAY, owner: c.pendingWith === "MCA" ? "mca" : ownerOf(s), note: `${c.pendingWith} · ${c.days} days` });
  }
  rows.push({ id: "h5", title: "SBC review", state: "upcoming", owner: "sbc" });
  rows.push({ id: "h6", title: n === 2 || n === 12 || n === 22 ? "Manager approval" : "Step complete", state: "upcoming" });
  return rows;
}

const NORTHWIND_7_HISTORY: ThreadStep[] = [
  { id: "th1", title: "Documents asked from the client", state: "done", date: d(2026, 9, 29), by: "Bharath" },
  { id: "th2", title: "Address details and rent agreement accepted", state: "done", date: d(2026, 9, 30), by: "Bharath" },
  { id: "th3", title: "NOC uploaded without signature", state: "done", date: d(2026, 10, 4), by: "Rohan Kumar", owner: "client" },
  { id: "th4", title: "Utility bill and signed NOC", state: "current", date: TODAY, owner: "client", note: "Asked 5 days ago" },
  { id: "th5", title: "SBC review", state: "upcoming", owner: "sbc" },
  { id: "th6", title: "Step complete", state: "upcoming" },
];

// ---- Form fields per step ----

export type FieldState = "Accepted" | "Review" | "Asked" | "Not asked";
export const fieldTone = { Accepted: "ok", Review: "prog", Asked: "warn", "Not asked": "idle" } as const satisfies Record<FieldState, string>;

export interface FieldDef {
  id: string;
  label: string;
  kind: "text" | "file";
  required?: boolean;
  /** Sample value. {client} and {short} are replaced. */
  sample: string;
}

export interface FormField extends FieldDef {
  value: string;
  state: FieldState;
  date?: Date;
  note?: string;
}

const f = (id: string, label: string, kind: FieldDef["kind"], sample: string, required = true): FieldDef => ({ id, label, kind, sample, required });

export const STEP_FIELDS: Record<number, FieldDef[]> = {
  1: [f("pan", "Director PAN", "file", "director-pan.pdf"), f("aadhaar", "Director Aadhaar", "file", "director-aadhaar.pdf"), f("email", "Contact email", "text", "accounts@{short}.in")],
  2: [f("holding", "Holding company name", "text", "{client} Holdings Ltd"), f("meeting", "Board meeting date", "text", "29 Sep 2026"), f("draft", "Draft Board resolution", "file", "board-resolution-draft.docx")],
  3: [f("signed", "Signed Board resolution", "file", "board-resolution-signed.pdf"), f("apostille", "Apostille or notary", "file", "apostille.pdf", false)],
  4: [f("name1", "First name choice", "text", "{short} India Private Limited"), f("name2", "Second name choice", "text", "{short} Technologies India Private Limited"), f("objects", "Main objects", "text", "Software services and products")],
  5: [f("letter", "Name approval letter", "file", "name-approval.pdf"), f("srn", "SRN of RUN form", "text", "AB1234567")],
  6: [f("auth", "Authorised capital", "text", "₹10,00,000"), f("paid", "Paid-up capital", "text", "₹1,00,000"), f("split", "Shareholding split", "text", "99.99% holding · 0.01% nominee")],
  7: [f("address", "Address details", "text", "4th floor, Prestige Meridian, MG Road, Bengaluru 560001"), f("rent", "Rent agreement", "file", "rent-agreement-2026.pdf"), f("bill", "Utility bill (under 2 months)", "file", "utility-bill-sep.pdf"), f("noc", "NOC from owner", "file", "noc-signed.pdf")],
  8: [f("d1", "Director 1 passport", "file", "director-1-passport.jpg"), f("d2", "Director 2 passport", "file", "director-2-passport.jpg"), f("proof", "Address proof for both", "file", "address-proofs.pdf")],
  9: [f("sub1", "Subscriber 1", "text", "{client} Holdings Ltd · 9,999 shares"), f("sub2", "Subscriber 2 (nominee)", "text", "Nominee director · 1 share"), f("sheet", "Subscriber sheet", "file", "subscriber-sheet.pdf")],
  10: [f("kyc", "KYC of directors", "file", "director-kyc.zip"), f("dsc", "DSC application", "file", "dsc-application.pdf"), f("token", "DSC token sent to", "text", "Registered office address")],
  11: [f("moa", "MOA draft", "file", "moa-draft.docx"), f("aoa", "AOA draft", "file", "aoa-draft.docx"), f("ok", "Client confirmation", "text", "Confirmed by email")],
  12: [f("spice", "SPICe+ Part B", "file", "spice-part-b.pdf"), f("agilepro", "AGILE-PRO-S", "file", "agile-pro-s.pdf"), f("srn", "Filing SRN", "text", "AB9876543")],
  13: [f("remarks", "MCA remarks", "text", "Clarify the object clause"), f("reply", "Reply to remarks", "file", "reply-to-remarks.pdf")],
  14: [f("coi", "Certificate of Incorporation", "file", "certificate-of-incorporation.pdf"), f("cin", "CIN", "text", "U72900KA2026PTC123456")],
  15: [f("minutes", "Minutes of the first Board meeting", "file", "first-board-minutes.docx"), f("date", "Meeting date", "text", "12 Nov 2026")],
  16: [f("letterhead", "Letterhead", "file", "letterhead.docx")],
  17: [f("bank", "Bank", "text", "HDFC Bank, MG Road"), f("kyc", "Bank KYC pack", "file", "bank-kyc-pack.zip"), f("acct", "Account number", "text", "50200012345678")],
  18: [f("firc", "FIRC", "file", "firc.pdf"), f("amount", "Amount received", "text", "₹1,00,000")],
  19: [f("sh1", "Share certificates (SH-1)", "file", "share-certificates.pdf"), f("stamp", "Stamp duty paid", "text", "₹50")],
  20: [f("inc20a", "INC-20A form", "file", "inc-20a.pdf"), f("proof", "Proof of capital", "file", "bank-statement.pdf")],
  21: [f("consent", "Auditor consent", "file", "auditor-consent.pdf"), f("adt1", "ADT-1 form", "file", "adt-1.pdf"), f("firm", "Audit firm", "text", "Rao and Associates")],
  22: [f("firms", "FIRMS login", "text", "Received"), f("kyc", "KYC of foreign investor", "file", "investor-kyc.pdf"), f("fcgpr", "FC-GPR form", "file", "fc-gpr.pdf")],
  23: [f("mgt4", "MGT-4 declaration", "file", "mgt-4.pdf"), f("mgt5", "MGT-5 declaration", "file", "mgt-5.pdf")],
  24: [f("inc22", "INC-22 form", "file", "inc-22.pdf"), f("photo", "Office photo", "file", "office-photo.jpg")],
  25: [f("board", "Name board photo", "file", "name-board.jpg")],
};

const fill = (s: string, c: StaffClient) => s.replace("{client}", c.short).replace("{short}", c.short.toLowerCase());

/** Form fields with values and states for client c at step n. */
export function stepForm(c: StaffClient, n: number): FormField[] {
  const defs = STEP_FIELDS[n] ?? [];
  const st = stepState(c, n);
  if (c.id === "northwind" && n === 7)
    return [
      { ...defs[0], value: defs[0].sample, state: "Accepted", date: d(2026, 9, 30) },
      { ...defs[1], value: "rent-agreement-2026.pdf · 2.1 MB", state: "Accepted", date: d(2026, 9, 30) },
      { ...defs[2], value: "", state: "Asked", date: d(2026, 10, 1), note: "Asked 5 days ago" },
      { ...defs[3], value: "noc-unsigned.pdf", state: "Review", date: d(2026, 10, 4), note: "Signature missing" },
    ];
  return defs.map((x, i): FormField => {
    const v = fill(x.sample, c);
    if (st.status === "Completed") return { ...x, value: v, state: "Accepted", date: st.done };
    if (st.status === "Upcoming") return { ...x, value: "", state: "Not asked" };
    const half = Math.ceil(defs.length / 2) - 1;
    if (i < half) return { ...x, value: v, state: "Accepted", date: st.from };
    if (i === half) return { ...x, value: v, state: "Review", date: add(TODAY, -1), note: st.status === "Sent back" ? "Sent back once" : undefined };
    return { ...x, value: "", state: "Asked", date: st.from, note: `Asked ${c.days} days ago` };
  });
}

// ---- Explainer and VCFO Assist profile (the "About this step" panel) ----

export interface StepAbout {
  what: string;
  points: string[];
  rule: string;
  /** VCFO Assist profile. */
  missing: string[];
  cannot: string[];
  notes: string;
}

const A = (what: string, points: string[], rule: string, missing: string[], cannot: string[], notes: string): StepAbout => ({ what, points, rule, missing, cannot, notes });

export const STEP_ABOUT: Record<number, StepAbout> = {
  1: A("SBC collects the identity and contact details of each director and shareholder.", ["PAN and Aadhaar for Indian directors.", "Passport for foreign directors."], "Companies Act 2013, section 7", ["Second contact phone"], ["Original passports"], "Check that names match on PAN and passport."),
  2: A("SBC drafts the Board resolution that lets the holding company form the Indian subsidiary.", ["Name the authorised signatory.", "State the number of shares."], "Companies Act 2013, section 179", ["Meeting place"], ["Board minutes of the parent"], "Use the latest template for foreign parents."),
  3: A("The client signs the Board resolution. Foreign copies need an apostille or a notary stamp.", ["Signature and date on every page.", "Apostille for foreign signatures."], "Companies (Incorporation) Rules 2014, rule 13", ["Apostille number"], ["Wet-ink original"], "Ask for a courier receipt."),
  4: A("SBC files the RUN form with two name choices.", ["Names must not match an existing company.", "Avoid words that need approval."], "Companies Act 2013, section 4", ["Trademark search result"], ["Client brand guide"], "Run the MCA name search before filing."),
  5: A("MCA approves or rejects the name. The approval is valid for 20 days.", ["Resubmit once if MCA rejects the name."], "Companies (Incorporation) Rules 2014, rule 9", [], ["MCA decision time"], "Diary the 20-day expiry."),
  6: A("The client fixes the authorised and paid-up capital and the shareholding.", ["Nominee holds one share."], "Companies Act 2013, section 4(5)", ["Share premium, if any"], [], "Confirm FDI pricing with the valuer."),
  7: A("MCA needs proof of where the company will sit. For a rented office that is a utility bill under 2 months old, the rent agreement and a signed NOC from the owner.", ["Bill must show the same address as the agreement.", "NOC must be signed and dated."], "Companies Act 2013, section 12", ["Owner's PAN on the NOC"], ["Original bill (client keeps it)"], "Ask for a fresh bill if it is older than 15 Aug."),
  8: A("The client sends passport and address proof for each proposed director.", ["Colour scans, all four corners visible.", "Address proof under 2 months old."], "Companies Act 2013, section 152", ["DIN, if a director has one"], ["Notarised passport copy"], "Reject scans that are not legible."),
  9: A("The client confirms who subscribes to the MOA and how many shares each takes.", ["Total must match the paid-up capital."], "Companies Act 2013, section 7(1)", ["Subscriber occupation"], [], "Match the nominee to the Board resolution."),
  10: A("SBC reviews the KYC and applies for a DSC for each director.", ["Video KYC for foreign directors.", "DSC token goes to the office."], "Information Technology Act 2000", ["Director mobile for OTP"], ["Physical token delivery"], "Book the video KYC slot early."),
  11: A("The client reads and confirms the SPICe+ forms, the MOA and the AOA.", ["Check names, addresses and capital."], "Companies Act 2013, sections 4 and 5", [], ["Client approval by signature"], "Send a single PDF for review."),
  12: A("SBC files SPICe+ Part B with AGILE-PRO-S, MOA and AOA.", ["Pay the stamp duty online."], "Companies (Incorporation) Rules 2014, rule 38", ["Bank branch for AGILE-PRO-S"], [], "Manager approval is needed before filing."),
  13: A("MCA may send remarks on the filing. SBC replies within 15 days.", ["One resubmission is free."], "Companies (Incorporation) Rules 2014, rule 9", [], ["MCA review time"], "Reply the same day where possible."),
  14: A("MCA issues the Certificate of Incorporation with the CIN, PAN and TAN.", [], "Companies Act 2013, section 7(2)", [], ["Issue date"], "Share the certificate with the client the same day."),
  15: A("The Board holds its first meeting within 30 days of incorporation.", ["Appoint the first auditor.", "Adopt the common seal, if any."], "Companies Act 2013, section 173", ["Meeting venue"], [], "Draft the minutes from the template."),
  16: A("SBC designs the company letterhead with the CIN and registered office.", [], "Companies Act 2013, section 12(3)", ["Logo file"], [], "Use the logo in SVG."),
  17: A("The client opens the current account with the Board resolution and KYC.", ["Signatory list must match the resolution."], "RBI KYC directions", ["Branch preference"], ["Bank appointment"], "Keep a fresh Board resolution ready."),
  18: A("The holding company sends the share capital to the Indian account.", ["Bank issues a FIRC."], "FEMA 1999", [], ["Remittance date"], "Ask for the SWIFT copy."),
  19: A("SBC issues share certificates within 60 days.", ["Pay stamp duty by state rate."], "Companies Act 2013, section 56", [], ["Director signatures"], "Two directors sign each certificate."),
  20: A("SBC files INC-20A after the capital arrives.", ["Attach the bank statement."], "Companies Act 2013, section 10A", [], [], "File within 180 days."),
  21: A("The Board appoints the first auditor and SBC files ADT-1.", ["Auditor consent letter is needed."], "Companies Act 2013, section 139", ["Auditor firm number"], ["Auditor signature"], "Due within 30 days of the Board meeting."),
  22: A("SBC reports the foreign investment to RBI in FC-GPR.", ["File within 30 days of share allotment."], "FEMA (Non-debt Instruments) Rules 2019", ["FIRMS login"], ["Valuation certificate"], "Manager approves before filing."),
  23: A("The nominee and the beneficial owner sign MGT-4 and MGT-5. SBC files MGT-6.", [], "Companies Act 2013, section 89", [], ["Nominee signature"], "Collect both declarations together."),
  24: A("SBC files INC-22 to confirm the registered office.", ["Attach a photo of the office."], "Companies Act 2013, section 12", [], ["Office photo"], "Photo must show the name board."),
  25: A("The client puts up the name board at the office.", ["Name, CIN and address in English and the local language."], "Companies Act 2013, section 12(3)", [], ["Physical board"], "Ask for a photo in daylight."),
};

/** Text that "Copy for Assist" puts on the clipboard. */
export function assistText(c: StaffClient, n: number) {
  const s = STEPS[n - 1];
  const a = STEP_ABOUT[n];
  const form = stepForm(c, n);
  return [`${c.name} · Step ${n} · ${s.title}`, ...form.map((x) => `${x.label}: ${x.value || x.state}`), a ? `Notes: ${a.notes}` : ""].filter(Boolean).join("\n");
}
