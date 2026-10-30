import { d } from "@/lib/dates";
import type { StatusWord } from "@/data/compliance-tasks";

// Board resolution (NOC), docs/BOARD-RESOLUTION-NOC.md and R-52.
// The NOC is the parent's board resolution (Pre-2): one document in three variants.

export type OwnershipType = "independent" | "subsidiary";
export type CompanyType = "foreign" | "domestic";
export type ParentRole = "name_only" | "investing";
export type NocVariant = "foreign-parent" | "indian-name-only" | "indian-investing";

/** The three project answers (Create project, Entity section). The client does not answer them (F4). */
export interface NocAnswers {
  ownershipType: OwnershipType | null;
  companyType: CompanyType | null;
  parentIndianRelationship: ParentRole | null;
}

/** Same logic as VCFO Suite src/lib/noc/variant.ts. Null: standalone, or an Indian parent with no role chosen yet. */
export function resolveNocVariant(e: NocAnswers): NocVariant | null {
  if (e.ownershipType === "independent") return null;
  if (e.companyType === "foreign") return "foreign-parent";
  if (e.companyType !== "domestic") return null;
  if (e.parentIndianRelationship === "name_only") return "indian-name-only";
  if (e.parentIndianRelationship === "investing") return "indian-investing";
  return null;
}

/** F2: the variant names and the internal file names (staff only, P5). */
export const NOC_VARIANT: Record<NocVariant, { label: string; file: string }> = {
  "foreign-parent": { label: "NOC — Foreign subsidiary", file: "noc-foreign-parent.docx" },
  "indian-name-only": { label: "NOC — Indian subsidiary (name use)", file: "noc-indian-name-only.docx" },
  "indian-investing": { label: "NOC — Indian subsidiary (investing)", file: "noc-indian-investing.docx" },
};
export const NOC_VARIANTS = Object.keys(NOC_VARIANT) as NocVariant[];

/* ---------- Sample cases: one for each path of the tree ---------- */

export type NocCase = "foreign" | "name" | "investing" | "unset";
export const NOC_CASES: Array<{ key: NocCase; label: string }> = [
  { key: "foreign", label: "Foreign" },
  { key: "name", label: "Name use" },
  { key: "investing", label: "Investing" },
  { key: "unset", label: "Not chosen" },
];

export interface NocParent {
  name: string;
  address: string;
  city: string;
  /** D3: the parent's directors. One of them certifies the true copy. */
  directors: string[];
}

export interface NocSample {
  answers: NocAnswers;
  parent: NocParent;
  /** Pre-1 gave a letterhead. Without it the draft is a plain page with the parent's name. */
  letterhead: boolean;
  /** Text on the parent's side of the decision table. */
  answerText: [string, string, string];
}

const NORTHWIND_INC: NocParent = {
  name: "Northwind Inc.",
  address: "548 Market Street, San Francisco, CA 94104, USA",
  city: "San Francisco",
  directors: ["J. Carter", "Emma Hale"],
};
const NORTHWIND_HOLD: NocParent = {
  name: "Northwind Holdings Pvt Ltd",
  address: "14 Residency Road, Bengaluru 560025",
  city: "Bengaluru",
  directors: ["Rohan Kumar", "Meera Iyer"],
};

export const NOC_SAMPLES: Record<NocCase, NocSample> = {
  foreign: {
    answers: { ownershipType: "subsidiary", companyType: "foreign", parentIndianRelationship: null },
    parent: NORTHWIND_INC,
    letterhead: true,
    answerText: ["Subsidiary", "Foreign", "Not asked for a foreign parent"],
  },
  name: {
    answers: { ownershipType: "subsidiary", companyType: "domestic", parentIndianRelationship: "name_only" },
    parent: NORTHWIND_HOLD,
    letterhead: false,
    answerText: ["Subsidiary", "Indian", "Name use only"],
  },
  investing: {
    answers: { ownershipType: "subsidiary", companyType: "domestic", parentIndianRelationship: "investing" },
    parent: NORTHWIND_HOLD,
    letterhead: true,
    answerText: ["Subsidiary", "Indian", "Investing"],
  },
  unset: {
    answers: { ownershipType: "subsidiary", companyType: "domestic", parentIndianRelationship: null },
    parent: NORTHWIND_HOLD,
    letterhead: false,
    answerText: ["Subsidiary", "Indian", "Not chosen yet"],
  },
};

/* ---------- Stages and the one date record (P2) ---------- */

export type BrStage = "released" | "signed" | "received" | "accepted";
export const BR_STAGES: Array<{ key: BrStage; label: string }> = [
  { key: "released", label: "Released" },
  { key: "signed", label: "Signed" },
  { key: "received", label: "Received" },
  { key: "accepted", label: "Accepted" },
];
export const STAGE_WORD: Record<BrStage, StatusWord> = { released: "Waiting", signed: "Waiting", received: "In progress", accepted: "Done" };

export type BrEvent = "drafted" | "released" | "signed" | "notarised" | "apostilled" | "accepted";

/** Every date on the page comes from this record. It matches steps 2 and 3 in src/data/incorporation.ts. */
export const BR_RECORD = {
  meeting: d(2026, 9, 12),
  drafted: { who: "Bharath", when: d(2026, 9, 13) },
  released: { who: "Bharath", when: d(2026, 9, 14) },
  signed: { who: "J. Carter", when: d(2026, 9, 15) },
  notarised: { who: "Notary", when: d(2026, 9, 16) },
  apostilled: { who: "Apostille office", when: d(2026, 9, 17) },
  uploaded: { who: "Rohan Kumar", when: d(2026, 9, 17) },
  accepted: { who: "Bharath", when: d(2026, 9, 18) },
};

const TRACK_LABEL: Record<BrEvent, string> = { drafted: "Drafted", released: "Released", signed: "Signed", notarised: "Notarised", apostilled: "Apostilled", accepted: "Accepted" };

/** D1, D4: a foreign parent adds Notarised and Apostilled, unless SBC turns them off for this client. */
export function trackEvents(foreign: boolean, notary: boolean): BrEvent[] {
  return foreign && notary ? ["drafted", "released", "signed", "notarised", "apostilled", "accepted"] : ["drafted", "released", "signed", "accepted"];
}
/** The events that are done at each stage. */
const DONE_AT: Record<BrStage, BrEvent[]> = {
  released: ["drafted", "released"],
  signed: ["drafted", "released", "signed", "notarised", "apostilled"],
  received: ["drafted", "released", "signed", "notarised", "apostilled"],
  accepted: ["drafted", "released", "signed", "notarised", "apostilled", "accepted"],
};
export const isDone = (stage: BrStage, e: BrEvent) => DONE_AT[stage].includes(e);
export const trackLabel = (e: BrEvent) => TRACK_LABEL[e];

/** C4: the client's list. An Indian parent drops the notary step. */
export function todoItems(foreign: boolean, notary: boolean): string[] {
  return ["Download the Word file", "Print it on the parent's letterhead", "A director signs", ...(foreign && notary ? ["Notarise, then apostille"] : []), "Upload the scan"];
}
/** Index of the current item; the list length when all are done. */
export function todoAt(stage: BrStage, count: number): number {
  return stage === "released" ? 0 : stage === "signed" ? count - 1 : count;
}

/** T5: the receive checklist. An Indian parent drops the notary stamp and the apostille. */
export function receiveChecks(foreign: boolean, notary: boolean): string[] {
  return [
    "Signature of a parent director",
    "Date and place filled",
    "On the parent's letterhead",
    ...(foreign && notary ? ["Notary stamp", "Apostille certificate"] : []),
    "Names match the draft",
  ];
}

/** C3: values from the engagement. Null shows "Not given yet". */
export const KEY_FACTS = {
  company: "Northwind Technologies India Pvt Ltd",
  capital: "₹10,00,000 · 1,00,000 shares of ₹10",
  activity: "software development and IT services",
  parentShares: "9,999",
  nominee: "J. Carter",
  signatory: "Rohan Kumar",
  filer: "SBC LLP",
};

/** T4: the values that changed between two versions. */
export const VERSION_CHANGES = [
  { field: "Nominee shareholder", from: "A. Lee", to: "J. Carter", source: "Pre-1 · Nominee shareholder" },
  { field: "Parent's city", from: "Palo Alto", to: "San Francisco", source: "Pre-1 · Parent's city" },
];
