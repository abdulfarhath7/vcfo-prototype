import { d, TODAY } from "@/lib/dates";
import { STEPS, type Step } from "@/data/incorporation";
import type { BarTone } from "@/components/ui/Bar";

// Ported from reference/old-screens/s/inc/*.html (shared script: STEPS[].i, SUBS, X, DOCS_B, WEEK_B)
// and reference/refresh/incorporation.html (needs rows, "Who holds it now" rows).

/** What each step captures: label and an optional hint (old STEPS[].i). */
export const STEP_CAPTURES: Record<number, Array<[label: string, hint?: string]>> = {
  1: [
    ["Details of the parent entity", "Name, registration number, complete address; trademark yes or no"],
    ["Proof of the parent entity", "Certificate of Incorporation"],
    ["Authorised signatory", "First name, middle name, last name, designation, gender"],
    ["KYC of the authorised signatory", "Passport, driving licence, utility bill under 2 months"],
    ["Proposed company names", "2 names ending in \"India Private Limited\""],
    ["Company email"],
    ["Company mobile number", "With country code"],
    ["Business description", "Up to 100 words"],
    ["Proposed directors", "Minimum 2; at least one resident in India"],
    ["Share capital", "Authorised and initial paid-up, nominal value per share"],
    ["Date of the Board resolution"],
  ],
  2: [["Draft Board resolution from the client details"], ["Project lead review and edits"], ["Final draft released to the client portal"]],
  3: [["Download the final Board resolution"], ["Sign on company letterhead"], ["Upload the signed copy"]],
  4: [["Signed Board resolution reviewed"], ["Name application (RUN) filed with ROC"], ["Filing acknowledgement"]],
  5: [["Approved name"], ["Approval date and expiry date", "20 days validity"], ["MCA approval letter"]],
  6: [["Share classes"], ["Number of shares"], ["Nominal value per share"]],
  7: [["Registered office address"], ["NOC from owner"], ["Utility bill", "Not older than 2 months"]],
  8: [["Director details", "Name, residency, DIN and DSC status"], ["Director KYC documents", "Identity, address, contact, photograph"]],
  9: [["Subscribers and shares"], ["INC-35 nominee"]],
  10: [["KYC review notes and correction requests"], ["DSC proof for each director"], ["Signing date and place, and the subscription-sheet witness"]],
  11: [["Review of the SPICe+ Part B application"], ["Confirmation or changes"]],
  12: [["SPICe+ Part B and AGILE-PRO-S filed on the MCA portal"]],
  13: [["MCA remarks"], ["Information or documents asked from Northwind"], ["Clarification letter"], ["Resubmission notes"]],
  14: [["Company name, date of incorporation, CIN, PAN, TAN, PF and ESI codes"], ["Certificate of Incorporation, PAN card and TAN card"]],
  15: [["Agenda of the meeting"], ["Minutes"], ["Resolutions"]],
  16: [["Letterhead with name, CIN, registered office, email, phone"]],
  17: [["Self-attested COI, PAN, rent deed"], ["Board resolution for the bank account"], ["KYC of the authorised signatories"]],
  18: [["Bank statement with the capital from the shareholders"]],
  19: [["Details of the allottees"]],
  20: [["Declaration of commencement of business"], ["Bank statement evidence"]],
  21: [["Board resolution for the auditor"], ["Offer letter to the auditor"], ["Eligibility and consent letters"], ["Intimation of the first auditor"]],
  22: [["Foreign inward remittance details"], ["FIRC copies"], ["FIRMS portal registration"], ["Foreign investor details"], ["Remittance: AD bank, mode, date, amount, FIRC number"], ["Board resolution for allotment and list of allottees"], ["Share certificates"]],
  23: [["Nominee shareholder declaration"], ["Beneficial owner details"], ["ROC filing acknowledgements"]],
  24: [["Updated registered office address"], ["Proof of address"], ["Proof of occupancy"], ["Board resolution for a change of office"]],
  25: [["Name board with company name, CIN, registered office"], ["Photo of the board at the office"]],
};

/** Sub-steps shown in the journey card (old SUBS). */
export const SUB_STEPS: Record<number, Array<{ label: string; state: "done" | "now" | "todo" }>> = {
  7: [
    { label: "Office address", state: "done" },
    { label: "State", state: "done" },
    { label: "NOC", state: "now" },
    { label: "Utility bill", state: "now" },
  ],
  8: [
    { label: "Directors", state: "done" },
    { label: "DIN · DSC", state: "done" },
    { label: "ID proofs", state: "now" },
    { label: "Address proofs", state: "todo" },
    { label: "Interests", state: "todo" },
  ],
  9: [
    { label: "Subscribers", state: "done" },
    { label: "Shares", state: "now" },
    { label: "INC-35", state: "todo" },
  ],
  10: [
    { label: "KYC data", state: "done" },
    { label: "KYC review", state: "now" },
    { label: "DSC", state: "todo" },
  ],
};

/** Proof document of a done step, for the viewer (ids from src/data/shared.ts FILES). */
export const STEP_PROOF: Record<number, string> = { 2: "f6", 3: "f7", 5: "f8", 6: "f9" };

/** Official portal for a step's first form. */
export function portalFor(s: Step) {
  if (s.phase === 3 && s.n === 22) return "FIRMS (RBI)";
  if (s.n === 10) return "eMudhra";
  return "MCA portal";
}

/* ---------- Landing ---------- */

export const WEEK_RANGE = "6 to 12 Oct";

export type IncNeedKind = "upload" | "fill" | "correct" | "sign";
export interface IncNeed {
  id: string;
  kind: IncNeedKind;
  title: string;
  due: Date;
  step: number;
}

/** Needs from Northwind on the landing (refresh "req" rows). */
export const INC_NEEDS: IncNeed[] = [
  { id: "q1", kind: "upload", title: "Utility bill · office", due: d(2026, 10, 9), step: 7 },
  { id: "q2", kind: "upload", title: "NOC from owner", due: d(2026, 10, 9), step: 7 },
  { id: "q3", kind: "fill", title: "Subscriber details", due: d(2026, 10, 8), step: 9 },
  { id: "q4", kind: "correct", title: "Director 1 passport · clear scan", due: d(2026, 10, 2), step: 8 },
  { id: "q5", kind: "sign", title: "Subscriber sheet", due: d(2026, 10, 8), step: 9 },
];

export const NEED_ACTION: Record<IncNeedKind, string> = { upload: "Upload", fill: "Fill", correct: "Fix", sign: "Sign" };

export interface StatSeg {
  label: string;
  tone: BarTone;
  /** Documents by name, or step numbers. */
  items: string[] | number[];
}

/** Documents from Northwind and documents SBC prepares (old DOCS_B, names aligned to the new sample data). */
export const DOCS_FROM_CLIENT: StatSeg[] = [
  { label: "Submitted", tone: "ok", items: ["PAN · Director 1", "PAN · Director 2", "Aadhaar · Director 1", "Address proof · Director 1", "Photo · Director 1", "Photo · Director 2", "Signed Board resolution", "Rent agreement"] },
  { label: "Under review", tone: "accent", items: ["Subscriber sheet"] },
  { label: "Pending", tone: "warn", items: ["Utility bill for the office", "NOC from property owner", "Passport · Director 2"] },
  { label: "Sent back", tone: "bad", items: ["Passport · Director 1 · scan not legible"] },
];

export const DOCS_BY_SBC: StatSeg[] = [
  { label: "Generated", tone: "accent", items: ["Draft Board resolution", "Name application (RUN)", "Name approval letter", "Capital structure sheet", "KYC review notes"] },
  { label: "Pending", tone: "idle", items: ["MOA", "AOA", "INC-9", "DIR-8", "INC-22", "AGILE-PRO-S", "SPICe+ Part B"] },
  { label: "Signed by Northwind", tone: "ok", items: ["Signed Board resolution"] },
];

const open = (s: Step) => s.status !== "Completed";
const active = (s: Step) => s.status === "Waiting" || s.status === "In progress" || s.status === "Sent back";

export function whoSegments(): StatSeg[] {
  const left = STEPS.filter(open);
  return [
    { label: "Northwind", tone: "warn", items: left.filter((s) => s.owner === "client").map((s) => s.n) },
    { label: "SBC", tone: "accent", items: left.filter((s) => s.owner === "sbc").map((s) => s.n) },
    { label: "MCA", tone: "violet", items: left.filter((s) => s.owner === "mca").map((s) => s.n) },
  ];
}

export function planSegments(): StatSeg[] {
  const act = STEPS.filter(active);
  const late = act.filter((s) => s.due && s.due < TODAY);
  const risk = act.filter((s) => !late.includes(s) && s.owner === "client" && s.status === "Waiting");
  const ok = act.filter((s) => !late.includes(s) && !risk.includes(s));
  return [
    { label: "On time", tone: "ok", items: ok.map((s) => s.n) },
    { label: "At risk", tone: "warn", items: risk.map((s) => s.n) },
    { label: "Overdue", tone: "bad", items: late.map((s) => s.n) },
  ];
}

/* ---------- Step page ---------- */

export interface NeedItem {
  id: string;
  label: string;
  due: Date;
  done: boolean;
  /** Ticking it needs a file. */
  upload?: boolean;
}

/** "Needed from Northwind" checklist (old X[n].need). */
export function stepNeeds(s: Step): NeedItem[] | null {
  if (s.owner !== "client" || s.status === "Completed" || s.status === "Upcoming") return null;
  const due = s.due ?? TODAY;
  if (s.n === 7)
    return [
      { id: "noc", label: "Upload NOC from owner", due, done: false, upload: true },
      { id: "bill", label: "Upload utility bill", due, done: false, upload: true },
      { id: "chk", label: "Check the answers", due, done: true },
      { id: "ok", label: "Approve", due, done: false },
    ];
  if (s.n === 8)
    return [
      { id: "pp1", label: "Clear passport scan · Director 1", due, done: false, upload: true },
      { id: "pp2", label: "Passport · Director 2", due: d(2026, 10, 9), done: false, upload: true },
      { id: "sub", label: "Submit for review", due: d(2026, 10, 9), done: false },
    ];
  if (s.status === "Waiting")
    return [
      { id: "chk", label: "Check the answers", due, done: false },
      { id: "ok", label: "Approve", due, done: false },
    ];
  return [
    { id: "fill", label: "Fill the answers", due, done: false },
    { id: "sub", label: "Submit for review", due, done: false },
  ];
}

/** Pre-fill note above the answers (old X[n].pre). */
export const STEP_PREFILL: Record<number, string> = {
  6: "Filled by Bharath from Northwind's cap table",
  7: "Pre-filled from project setup",
  8: "Director details pre-filled from project setup",
};

/** Stage tracker labels and sub lines (old stages()). */
export interface Stage {
  label: string;
  sub?: string;
  state: "done" | "now" | "todo";
}

const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const f = (x: Date) => `${x.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][x.getMonth()]}`;

export function stepStages(s: Step): { stages: Stage[]; now?: { kicker: string; title: string; sub: string; tag?: string } } {
  const client = s.owner === "client";
  const names = client ? ["Started", "Submitted", "Reviewed", "Completed"] : ["Started", "Delivered to Northwind", "Northwind approves", "Completed"];
  const lead = s.by ?? "Bharath";
  const due = s.due;
  const custom: Record<number, string[]> = {
    7: ["Bharath · 2 Oct", "Northwind · due 9 Oct", "Bharath", "Pranay"],
    8: ["Bharath · 26 Sep", "Northwind · due 2 Oct", "Bharath", "Pranay"],
    10: ["Bharath · since 1 Oct", "13 Oct", "Northwind", "Pranay"],
  };
  let subs: string[];
  let cur: number;
  if (s.status === "Completed" && s.done) {
    subs = [`${lead} · ${f(addDays(s.done, -4))}`, `${lead} · ${f(addDays(s.done, -2))}`, `${client ? "Pranay" : "Northwind"} · ${f(addDays(s.done, -1))}`, f(s.done)];
    cur = 4;
  } else if (s.status === "Upcoming") {
    subs = ["", due ? `About ${f(due)}` : "", "", ""];
    cur = 0;
  } else {
    subs = custom[s.n] ?? (client ? [`Northwind · due ${due ? f(due) : "-"}`, "Northwind", "Bharath", "Pranay"] : [`${lead} · since ${due ? f(addDays(due, -5)) : "-"}`, due ? f(due) : "", "Northwind", "Pranay"]);
    cur = client && s.status === "Waiting" ? 1 : 0;
  }
  const stages = names.map((label, i): Stage => ({ label, sub: subs[i] || undefined, state: i < cur ? "done" : i === cur ? "now" : "todo" }));
  let now: { kicker: string; title: string; sub: string; tag?: string } | undefined;
  if (cur === 4) now = undefined;
  else if (s.status === "Upcoming") now = { kicker: `Opens after step ${s.n - 1}`, title: "Not started", sub: `Starts when step ${s.n - 1} is done` };
  else if (client && s.status === "Waiting") now = { kicker: "Now · 2 of 4", title: names[1], sub: subs[1], tag: "Waiting on Northwind" };
  else if (client) now = { kicker: "Now · 1 of 4", title: "Filling in", sub: subs[0] };
  else now = { kicker: "Now · with SBC", title: "SBC is working on it", sub: subs[0] };
  return { stages, now };
}

/* ---------- Board resolution ---------- */

export interface BoardVersion {
  id: string;
  v: string;
  name: string;
  file: string;
  type: "DOCX" | "PDF";
  by: string;
  from: "sbc" | "client";
  date: Date;
  status: string;
  viewId?: string;
}

export const BOARD_VERSIONS: BoardVersion[] = [
  { id: "bv1", v: "v1", name: "Draft", file: "board-resolution-v1.docx", type: "DOCX", by: "Bharath", from: "sbc", date: d(2026, 9, 13), status: "Replaced" },
  { id: "bv2", v: "v2", name: "Draft · final", file: "board-resolution-v2.docx", type: "DOCX", by: "Bharath", from: "sbc", date: d(2026, 9, 14), status: "Released", viewId: "f6" },
  { id: "bv3", v: "v3", name: "Signed copy", file: "board-resolution-signed.pdf", type: "PDF", by: "Rohan Kumar", from: "client", date: d(2026, 9, 18), status: "Received", viewId: "f7" },
];

/** Monthly status brief: as of today. */
export const BRIEF_AS_OF = TODAY;
