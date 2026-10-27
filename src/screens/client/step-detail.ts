import { d } from "@/lib/dates";
import { STEPS, type Step } from "@/data/incorporation";
import { docType, type ItemDoc } from "@/data/registrations";
import { fileType } from "@/components/ui/FileBadge";
import type { ThreadStep } from "@/components/cards/Thread";

// Step page content. Steps 7, 8 and 10 are ported from reference/old-screens/s/home/v7p_step.dc.html and
// s/inc/step.html. Other steps use a generic thread built from src/data/incorporation.ts.
// Candidate to move to src/data/client-incorporation.ts when the lead agent allows it.

export interface StepDetail {
  step: Step;
  about: string;
  forms: string[];
  thread: ThreadStep[];
  docs: ItemDoc[];
  /** What was provided: label and value. */
  details: Array<{ k: string; v: string }>;
}

const ABOUT: Record<number, [about: string, forms: string[]]> = {
  1: ["Northwind gives the parent details, KYC, proposed names, directors, share capital and the board resolution date.", ["RUN", "SPICe+ Part A"]],
  2: ["SBC drafts the board resolution from the client details and shares the final draft.", ["Board resolution"]],
  3: ["Northwind signs the board resolution on letterhead and uploads the signed copy.", ["Signed Board resolution"]],
  4: ["SBC files the name application with ROC and shares the acknowledgement.", ["RUN"]],
  5: ["MCA approves the name. The approval is valid for 20 days.", ["Name approval letter"]],
  6: ["Share classes at incorporation, with the number of shares and the nominal value per share.", ["SPICe+ Part B"]],
  7: ["Office address for the company, with proof of address and the owner's NOC.", ["SPICe+ Part B", "INC-22"]],
  8: ["One entry per proposed director: name, residency, DIN and DSC status, and KYC.", ["SPICe+ Part B", "DIR-2", "DIR-8", "INC-9"]],
  9: ["Every subscriber to the memorandum, with the shares each takes.", ["SPICe+ Part B", "INC-33", "INC-34", "INC-35"]],
  10: ["SBC reviews the KYC data and applies for the DSC of each director with eMudhra.", ["DSC workflow"]],
  11: ["Northwind reviews the SPICe+ Part B application and confirms it for filing.", ["SPICe+ Part B"]],
  12: ["SBC fills and submits SPICe+ Part B and AGILE-PRO-S on the MCA portal.", ["SPICe+ Part B", "AGILE-PRO-S"]],
  13: ["SBC reads the MCA remarks, asks for any missing items and resubmits.", ["Clarification letter"]],
  14: ["MCA issues the certificate with the CIN, PAN and TAN.", ["Certificate of Incorporation"]],
  15: ["The first board meeting: agenda, minutes and resolutions.", []],
  16: ["Letterhead with the name, CIN, registered office, email and phone.", []],
  17: ["The company bank account, opened with the COI, PAN and the board resolution.", []],
  18: ["Shareholders pay in the share capital. The bank statement is the proof.", []],
  19: ["Share certificates for each allottee.", ["SH-1"]],
  20: ["Declaration of commencement of business, with bank evidence.", ["INC-20A"]],
  21: ["Appointment of the first auditor, with consent and eligibility letters.", ["ADT-1"]],
  22: ["Report of the foreign investment to RBI on FIRMS.", ["FC-GPR"]],
  23: ["Declarations for the nominee shareholder and the beneficial owner.", ["MGT-4", "MGT-5", "MGT-6"]],
  24: ["Confirmation of the registered office with proof of occupancy.", ["INC-22"]],
  25: ["Name board at the registered office, with a photo as proof.", []],
};

const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

function genericThread(s: Step): ThreadStep[] {
  const client = s.owner === "client";
  const doer = client ? "Rohan Kumar" : s.by ?? "Bharath";
  const t = client ? ["Started", "Submitted", "Reviewed", "Completed"] : ["Started", "Prepared", "Reviewed", "Completed"];
  const id = (i: number) => `st${s.n}-${i}`;
  if (s.status === "Completed" && s.done) {
    return [
      { id: id(0), title: t[0], state: "done", date: addDays(s.done, -2), by: doer },
      { id: id(1), title: t[1], state: "done", date: addDays(s.done, -1), by: doer, owner: s.owner },
      { id: id(2), title: t[2], state: "done", date: s.done, by: "Bharath · Project lead" },
      { id: id(3), title: t[3], state: "done", date: s.done, by: "Pranay · Manager" },
    ];
  }
  if (s.status === "Upcoming") {
    return t.map((title, i) => ({ id: id(i), title, state: "upcoming", owner: i === 1 ? s.owner : undefined }));
  }
  const start = s.due ? addDays(s.due, -4) : undefined;
  return [
    { id: id(0), title: t[0], state: "done", date: start, by: doer },
    { id: id(1), title: t[1], state: "current", owner: s.owner, by: client ? "Waiting on Northwind" : doer },
    { id: id(2), title: t[2], state: "upcoming" },
    { id: id(3), title: t[3], state: "upcoming" },
  ];
}

function genericDocs(s: Step): ItemDoc[] {
  return (s.docs ?? []).map((name, i): ItemDoc => {
    const clean = name.replace(/\.(pdf|docx|jpg|png|xlsx)$/i, "");
    const hasFile = clean !== name;
    const from = s.owner === "client" ? "client" : "sbc";
    let status: ItemDoc["status"] = "Not asked yet";
    if (s.status === "Completed") status = "Accepted";
    else if (s.status !== "Upcoming") status = hasFile ? "Accepted" : from === "client" ? "Asked" : "Pending";
    else if (from === "sbc") status = "Pending";
    return {
      id: `sd${s.n}-${i}`,
      name: clean,
      type: hasFile ? fileType(name) : docType(clean),
      from,
      fromLabel: from === "client" ? "Northwind" : "SBC",
      status,
      date: status === "Accepted" ? s.done ?? (s.due ? addDays(s.due, -3) : undefined) : undefined,
    };
  });
}

const RICH: Record<number, Omit<StepDetail, "step" | "about" | "forms">> = {
  7: {
    thread: [
      { id: "s7-1", title: "Started", state: "done", date: d(2026, 10, 2), by: "Rohan Kumar" },
      { id: "s7-2", title: "Address and rent agreement", state: "done", date: d(2026, 10, 2), by: "Rohan Kumar", owner: "client" },
      { id: "s7-3", title: "Utility bill and NOC", state: "current", owner: "client", by: "Waiting on Northwind", note: "Due 9 Oct" },
      { id: "s7-4", title: "Reviewed", state: "upcoming", by: "Bharath" },
      { id: "s7-5", title: "Completed", state: "upcoming", by: "Pranay" },
    ],
    docs: [
      { id: "s7d1", name: "Rent agreement", type: "PDF", from: "client", fromLabel: "Northwind", status: "Accepted", date: d(2026, 10, 2) },
      { id: "s7d2", name: "Utility bill for the office", type: "PDF", from: "client", fromLabel: "Northwind", status: "Asked", note: "Electricity or water, not older than 2 months" },
      { id: "s7d3", name: "NOC from property owner", type: "PDF", from: "client", fromLabel: "Northwind", status: "Asked", note: "Signed, on plain paper" },
    ],
    details: [
      { k: "Address", v: "4th Floor, Prestige Tech Park, Outer Ring Road, Bengaluru 560103" },
      { k: "State", v: "Karnataka" },
      { k: "Premises", v: "Leased" },
      { k: "Owner", v: "-" },
      { k: "Proof of address", v: "-" },
    ],
  },
  8: {
    thread: [
      { id: "s8-1", title: "Director details pre-filled", state: "done", date: d(2026, 9, 26), by: "Bharath", note: "From project setup" },
      { id: "s8-2", title: "Director 1 passport uploaded", state: "done", date: d(2026, 10, 2), by: "Rohan Kumar", owner: "client" },
      { id: "s8-3", title: "Passport sent back", state: "done", date: d(2026, 10, 5), by: "Bharath", note: "Scan not legible" },
      { id: "s8-4", title: "Clear passport scan · Director 1", state: "current", owner: "client", by: "Waiting on Northwind", note: "Due 2 Oct" },
      { id: "s8-5", title: "KYC · Director 2", state: "upcoming", owner: "client" },
      { id: "s8-6", title: "Reviewed", state: "upcoming", by: "Bharath" },
      { id: "s8-7", title: "Completed", state: "upcoming", by: "Pranay" },
    ],
    docs: [
      { id: "s8d1", name: "Director 1 - passport", type: "JPG", from: "client", fromLabel: "Northwind", status: "Sent back", date: d(2026, 10, 2), note: "Scan not legible" },
      { id: "s8d2", name: "Director 1 - address proof", type: "PDF", from: "client", fromLabel: "Northwind", status: "Accepted", date: d(2026, 10, 2) },
      { id: "s8d3", name: "Director 2 - passport", type: "PDF", from: "client", fromLabel: "Northwind", status: "Asked" },
      { id: "s8d4", name: "Director 2 - PAN", type: "PDF", from: "client", fromLabel: "Northwind", status: "Accepted", date: d(2026, 10, 1) },
      { id: "s8d5", name: "DIR-2 consent letters", type: "DOCX", from: "sbc", fromLabel: "SBC", status: "Pending" },
    ],
    details: [
      { k: "Directors", v: "Meera Iyer · Rohan Kumar" },
      { k: "Residency", v: "Both resident" },
      { k: "DIN and DSC", v: "Applying through SPICe+ (DIR-3)" },
      { k: "ID proofs", v: "2 of 4 accepted" },
      { k: "Other company interests", v: "-" },
    ],
  },
  10: {
    thread: [
      { id: "s10-1", title: "KYC data received", state: "done", date: d(2026, 10, 1), by: "Northwind" },
      { id: "s10-2", title: "KYC review", state: "current", owner: "sbc", by: "Bharath", note: "1 correction asked: Director 1 passport" },
      { id: "s10-3", title: "DSC applied with eMudhra", state: "upcoming", owner: "sbc" },
      { id: "s10-4", title: "DSC issued for both directors", state: "upcoming" },
      { id: "s10-5", title: "Completed", state: "upcoming", by: "Pranay" },
    ],
    docs: [
      { id: "s10d1", name: "KYC review notes", type: "DOCX", from: "sbc", fromLabel: "SBC", status: "To review", date: d(2026, 10, 5) },
      { id: "s10d2", name: "DSC proof - Director 1", type: "PDF", from: "sbc", fromLabel: "SBC", status: "Pending" },
      { id: "s10d3", name: "DSC proof - Director 2", type: "PDF", from: "sbc", fromLabel: "SBC", status: "Pending" },
    ],
    details: [
      { k: "DSC provider", v: "eMudhra" },
      { k: "DSC class", v: "Class 3" },
      { k: "Signing place", v: "Bengaluru" },
      { k: "Subscription-sheet witness", v: "-" },
    ],
  },
};

export function stepDetail(n: number): StepDetail | undefined {
  const step = STEPS.find((s) => s.n === n);
  if (!step) return undefined;
  const [about, forms] = ABOUT[n] ?? ["", []];
  const rich = RICH[n];
  return { step, about, forms, thread: rich?.thread ?? genericThread(step), docs: rich?.docs ?? genericDocs(step), details: rich?.details ?? [] };
}
