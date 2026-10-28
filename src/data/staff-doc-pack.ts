import type { FileType } from "@/components/ui/FileBadge";

// Staff Documents: the pre-incorporation document pack of one client.
// Ported from reference/old-screens/s/lead/Documents.dc.html (lead, manager and admin are the same).

export type PackState = "ready" | "needs" | "missing" | "waiting";

export interface PackDoc {
  id: string;
  title: string;
  sub: string;
  meta: string;
  state: PackState;
  type: FileType;
  /** Incorporation step number, for "Open step". */
  step: number;
}

export interface PackPart {
  id: "a" | "b";
  label: string;
  docs: PackDoc[];
}

export const PACK_CLIENT = "northwind";

export const PACK: PackPart[] = [
  {
    id: "a",
    label: "SPICe+ Part A",
    docs: [
      { id: "run", title: "Name reservation (RUN)", sub: "Pre-1 · Attached to Pre-1", meta: "Generated now", state: "ready", type: "PDF", step: 1 },
      { id: "br", title: "Board resolution · subsidiary", sub: "Pre-2 · Finalized 9 Oct", meta: "Finalized 9 Oct", state: "ready", type: "DOCX", step: 2 },
      { id: "noc", title: "Name NOC from parent", sub: "Pre-3", meta: "Generated 8 Oct", state: "ready", type: "DOCX", step: 3 },
    ],
  },
  {
    id: "b",
    label: "SPICe+ Part B",
    docs: [
      { id: "moa", title: "Memorandum of Association", sub: "Pre-8 · 2 fields missing", meta: "Draft", state: "needs", type: "DOCX", step: 8 },
      { id: "aoa", title: "Articles of Association", sub: "Pre-8", meta: "Draft", state: "needs", type: "DOCX", step: 8 },
      { id: "inc9", title: "INC-9 declaration", sub: "Pre-10 · directors KYC missing", meta: "-", state: "missing", type: "PDF", step: 10 },
      { id: "ronoc", title: "Registered office NOC", sub: "Pre-7 · waiting client", meta: "-", state: "needs", type: "DOCX", step: 7 },
      { id: "subs", title: "Subscriber sheet", sub: "Pre-9 · released after KYC", meta: "-", state: "waiting", type: "PDF", step: 9 },
    ],
  },
];

export const PACK_STATE: Record<PackState, { label: string; tone: "ok" | "warn" | "bad" | "idle" }> = {
  ready: { label: "Ready", tone: "ok" },
  needs: { label: "Needs inputs", tone: "warn" },
  missing: { label: "Missing inputs", tone: "bad" },
  waiting: { label: "Waiting for release", tone: "idle" },
};

/** The MOA preview text, page 1 of 6. */
export const MOA_PREVIEW = {
  head: ["THE COMPANIES ACT, 2013", "MEMORANDUM OF ASSOCIATION", "OF", "NORTHWIND TECHNOLOGIES INDIA PRIVATE LIMITED"],
  body: [
    "1. The name of the Company is NORTHWIND TECHNOLOGIES INDIA PRIVATE LIMITED.",
    "2. The registered office of the Company will be situated in the State of Karnataka.",
    "3. (a) The objects to be pursued by the Company on its incorporation are: to carry on the business of software development, IT-enabled services…",
  ],
  pages: 6,
};
