import { d } from "@/lib/dates";
import type { Owner, ChipTone } from "@/components/ui/Chip";

export type StepStatus = "Completed" | "Waiting" | "In progress" | "Upcoming" | "Sent back";

export interface Step {
  n: number;
  phase: 1 | 2 | 3;
  title: string;
  owner: Owner;
  status: StepStatus;
  time: string;
  /** Who works it at SBC. */
  by?: string;
  done?: Date;
  due?: Date;
  docs?: string[];
}

export const stepTone: Record<StepStatus, ChipTone> = {
  Completed: "ok",
  Waiting: "teal",
  "In progress": "prog",
  Upcoming: "idle",
  "Sent back": "bad",
};

// K-27: 25 steps in three phases.
export const STEPS: Step[] = [
  { n: 1, phase: 1, title: "Client details", owner: "client", status: "Completed", time: "2–3 working days", done: d(2026, 9, 12), docs: ["Director PAN", "Director Aadhaar"] },
  { n: 2, phase: 1, title: "Draft Board resolution", owner: "sbc", status: "Completed", time: "1–2 working days", by: "Bharath", done: d(2026, 9, 14), docs: ["Draft Board resolution.docx"] },
  { n: 3, phase: 1, title: "Signed Board resolution", owner: "client", status: "Completed", time: "3–4 working days", done: d(2026, 9, 18), docs: ["Signed Board resolution.pdf"] },
  { n: 4, phase: 1, title: "Name application", owner: "sbc", status: "Completed", time: "1–2 working days", by: "Bharath", done: d(2026, 9, 19) },
  { n: 5, phase: 1, title: "Name approval", owner: "sbc", status: "Completed", time: "5–7 working days", by: "Pranay", done: d(2026, 9, 24), docs: ["Name approval letter.pdf"] },
  { n: 6, phase: 2, title: "Capital structure", owner: "client", status: "Completed", time: "1 working day", done: d(2026, 9, 26) },
  { n: 7, phase: 2, title: "Registered office address", owner: "client", status: "Waiting", time: "1 working day", due: d(2026, 10, 9), docs: ["Rent agreement", "Utility bill", "NOC from owner"] },
  { n: 8, phase: 2, title: "Proposed directors", owner: "client", status: "In progress", time: "4–5 working days", due: d(2026, 10, 2), docs: ["Director 1 - passport.jpg", "Director 2 - passport"] },
  { n: 9, phase: 2, title: "Subscriber details", owner: "client", status: "In progress", time: "1 working day", due: d(2026, 10, 8) },
  { n: 10, phase: 2, title: "KYC review and DSC", owner: "sbc", status: "In progress", time: "2–3 working days", by: "Bharath", due: d(2026, 10, 13) },
  { n: 11, phase: 2, title: "SPICe+ confirmation", owner: "client", status: "Upcoming", time: "2–3 working days", due: d(2026, 10, 15), docs: ["MOA draft", "AOA draft"] },
  { n: 12, phase: 2, title: "SPICe+ filing", owner: "sbc", status: "Upcoming", time: "1–2 working days", by: "Pranay", due: d(2026, 10, 20) },
  { n: 13, phase: 2, title: "MCA remarks", owner: "mca", status: "Upcoming", time: "5–7 working days", due: d(2026, 10, 27) },
  { n: 14, phase: 2, title: "Certificate of Incorporation", owner: "mca", status: "Upcoming", time: "14–15 working days from filing", due: d(2026, 10, 28) },
  { n: 15, phase: 3, title: "First Board meeting", owner: "sbc", status: "Upcoming", time: "Within 30 days of incorporation" },
  { n: 16, phase: 3, title: "Company letterhead", owner: "sbc", status: "Upcoming", time: "Within 30 days of incorporation" },
  { n: 17, phase: 3, title: "Bank account opening", owner: "client", status: "Upcoming", time: "No statutory time limit" },
  { n: 18, phase: 3, title: "Share capital infusion", owner: "client", status: "Upcoming", time: "Within 180 days of incorporation" },
  { n: 19, phase: 3, title: "Share certificates (SH-1)", owner: "sbc", status: "Upcoming", time: "Within 60 days of incorporation" },
  { n: 20, phase: 3, title: "Commencement (INC-20A)", owner: "sbc", status: "Upcoming", time: "Within 180 days of incorporation" },
  { n: 21, phase: 3, title: "Auditor appointment (ADT-1)", owner: "sbc", status: "Upcoming", time: "Within 30 days of incorporation" },
  { n: 22, phase: 3, title: "FC-GPR filing", owner: "sbc", status: "Upcoming", time: "Within 30 days of incorporation" },
  { n: 23, phase: 3, title: "Nominee shareholder (MGT-4/5/6)", owner: "sbc", status: "Upcoming", time: "Within 30 days of incorporation" },
  { n: 24, phase: 3, title: "Registered office (INC-22)", owner: "sbc", status: "Upcoming", time: "Within 30 days of incorporation" },
  { n: 25, phase: 3, title: "Name board", owner: "client", status: "Upcoming", time: "Within 30 days of incorporation" },
];

export interface PhaseInfo {
  n: 1 | 2 | 3;
  id: string;
  name: string;
  short: string;
  start: Date;
  end: Date;
  status: "Done" | "In progress" | "Upcoming";
}

export const PHASES: PhaseInfo[] = [
  { n: 1, id: "phase-1", name: "Phase 1 · Name application", short: "Name application", start: d(2026, 9, 12), end: d(2026, 9, 24), status: "Done" },
  { n: 2, id: "phase-2", name: "Phase 2 · Incorporation", short: "Incorporation", start: d(2026, 9, 25), end: d(2026, 10, 20), status: "In progress" },
  { n: 3, id: "phase-3", name: "Phase 3 · Post-incorporation", short: "Post-incorporation", start: d(2026, 10, 28), end: d(2026, 11, 27), status: "Upcoming" },
];

export const MCA_REVIEW = { start: d(2026, 10, 20), end: d(2026, 10, 28) };
export const COI_EXPECTED = d(2026, 10, 28);
export const TIMELINE = { start: d(2026, 9, 12), end: d(2026, 12, 4) };
export const TIMELINE_TICKS = [d(2026, 9, 15), d(2026, 9, 29), d(2026, 10, 13), d(2026, 10, 27), d(2026, 11, 10), d(2026, 11, 24)];

export function stepsOf(phase: 1 | 2 | 3) {
  return STEPS.filter((s) => s.phase === phase);
}

export function doneCount(phase: 1 | 2 | 3) {
  return stepsOf(phase).filter((s) => s.status === "Completed").length;
}

export const stepHref = (portal: string, n: number) => (portal === "client" ? `/client/incorporation/step/${n}` : `/${portal}/clients/northwind/step/${n}`);
export const phaseHref = (portal: string, n: number) => (portal === "client" ? `/client/incorporation/phase/${n}` : `/${portal}/clients/northwind?phase=${n}`);
