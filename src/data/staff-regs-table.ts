import type { ChipTone } from "@/components/ui/Chip";
import { AREA_TONE, type Area } from "@/data/compliance";

// Staff Registrations and Obligations tables, as in the old prototype.
// Ported from reference/old-screens/s/lead/regcat.js (STAFF, GRID, SST, OB, RENEW)
// and the staff branch of reference/old-screens/s/lead/Register.dc.html.
// Lead, manager and admin show the same eight clients, as in the old screens.

export type RowState = "done" | "run" | "wait" | "none" | "na" | "bad";

/** The eight clients of the old staff register, in the old order. */
export const REG_CLIENTS: Array<{ id: string; name: string }> = [
  { id: "northwind", name: "Northwind Technologies" },
  { id: "orchid", name: "Orchid Lane Foods" },
  { id: "larkspur", name: "Larkspur Analytics" },
  { id: "juniper", name: "Juniper Bio" },
  { id: "brightwave", name: "Brightwave Robotics" },
  { id: "tidewater", name: "Tidewater Logistics" },
  { id: "kestrel", name: "Kestrel Health" },
  { id: "halcyon", name: "Halcyon Fintech" },
];

/* ---------- Registrations ---------- */

export const REG_CATS: Array<{ id: string; label: string }> = [
  { id: "tax", label: "Tax" },
  { id: "labour", label: "Labour" },
  { id: "business", label: "Business" },
  { id: "ip", label: "IP" },
  { id: "fema", label: "FEMA" },
];

export interface RegType {
  id: string;
  name: string;
  short: string;
  cat: string;
  auth: string;
  form: string;
}

/** The ten registration types of the old staff grid. */
export const REG_TYPES: RegType[] = [
  { id: "gst", name: "GST registration", short: "GST", cat: "tax", auth: "GSTN", form: "GST REG-01" },
  { id: "lut", name: "Letter of undertaking (LUT)", short: "LUT", cat: "tax", auth: "GSTN", form: "GST RFD-11" },
  { id: "epf", name: "EPF registration", short: "EPF", cat: "labour", auth: "EPFO", form: "Shram Suvidha" },
  { id: "esi", name: "ESI registration", short: "ESI", cat: "labour", auth: "ESIC", form: "ESIC employer form" },
  { id: "pt", name: "Professional tax", short: "PT", cat: "tax", auth: "Karnataka CTD", form: "PTRC and PTEC" },
  { id: "se", name: "Shops and Establishment", short: "Shops", cat: "labour", auth: "Karnataka Labour Dept", form: "Form A" },
  { id: "msme", name: "MSME (Udyam)", short: "MSME", cat: "business", auth: "Ministry of MSME", form: "Udyam" },
  { id: "iec", name: "Import Export Code (IEC)", short: "IEC", cat: "business", auth: "DGFT", form: "ANF-2A" },
  { id: "tm", name: "Trademark registration", short: "Trademark", cat: "ip", auth: "IP India", form: "TM-A" },
  { id: "fcgpr", name: "FC-GPR", short: "FC-GPR", cat: "fema", auth: "RBI · FIRMS", form: "FC-GPR" },
];

/** One letter per registration type, in REG_TYPES order: d granted, r in progress, w waiting, n not started, a not needed. */
const SST: Record<string, string> = {
  northwind: "nnnnnnnnnw",
  orchid: "nnnnnnnnnn",
  larkspur: "nnnnnnnnna",
  juniper: "nnnnnnnnaa",
  brightwave: "ddddrrdaaw",
  tidewater: "dddddddrar",
  kestrel: "rawdwddaad",
  halcyon: "ddddwdrdra",
};
const SC: Record<string, RowState> = { d: "done", r: "run", w: "wait", n: "none", a: "na" };

export const REG_STATE: Record<Exclude<RowState, "bad">, { label: string; tone: ChipTone }> = {
  done: { label: "Granted", tone: "ok" },
  run: { label: "In progress", tone: "prog" },
  wait: { label: "Waiting on client", tone: "warn" },
  none: { label: "Not started", tone: "idle" },
  na: { label: "Not needed", tone: "idle" },
};

export const regState = (client: string, reg: string): RowState => SC[(SST[client] ?? "")[REG_TYPES.findIndex((r) => r.id === reg)]] ?? "none";

export interface RegRow {
  key: string;
  client: string;
  clientName: string;
  reg: RegType;
  state: RowState;
  /** "Granted", "Waiting 4 days", "Applied", "Not started". */
  date: string;
  /** Number when granted, else empty. */
  num: string;
}

const CODE: Record<string, string> = { northwind: "NT", orchid: "OL", larkspur: "LA", juniper: "JB", brightwave: "BR", tidewater: "TL", kestrel: "KH", halcyon: "HF" };

export function regRows(client = ""): RegRow[] {
  return REG_CLIENTS.filter((c) => !client || c.id === client).flatMap((c) =>
    REG_TYPES.map((reg) => {
      const state = regState(c.id, reg.id);
      const date = state === "done" ? "Granted" : state === "wait" ? "Waiting 4 days" : state === "run" ? "Applied" : state === "na" ? "-" : "Not started";
      const num = state === "done" ? (reg.id === "gst" ? `29AAKC${CODE[c.id]}…` : "On file") : "";
      return { key: `${c.id}-${reg.id}`, client: c.id, clientName: c.name, reg, state, date, num };
    }),
  );
}

/** Renewals in date order. Old RENEW list. */
export const REG_RENEWALS: Array<{ id: string; title: string; auth: string; date: string; soon?: boolean }> = [
  { id: "lut", title: "LUT for FY 2027-28", auth: "GSTN", date: "31 Mar 2027" },
  { id: "se", title: "Shops and Establishment", auth: "Karnataka Labour Dept", date: "1 Dec 2026", soon: true },
  { id: "tl", title: "Trade licence", auth: "BBMP", date: "31 Dec 2026", soon: true },
  { id: "lei", title: "LEI", auth: "LEIL", date: "30 Jun 2027" },
  { id: "iec", title: "IEC profile update", auth: "DGFT", date: "30 Jun 2027" },
];

/* ---------- Obligations ---------- */

export type Freq = "m" | "q" | "h" | "a";
export const FREQ_LABEL: Record<Freq, string> = { m: "Monthly", q: "Quarterly", h: "Half-yearly", a: "Annual" };

export interface ObType {
  id: string;
  name: string;
  law: string;
  fr: Freq;
  next: string;
  last: string;
  pen: string;
  /** Obligation id in compliance.ts, for the detail page. */
  ref?: string;
}

export const OB_TYPES: ObType[] = [
  { id: "gstr1", name: "GSTR-1", law: "GST", fr: "m", next: "11 Nov 2026", last: "Not filed yet", pen: "₹50 a day, up to ₹10,000", ref: "gstr1" },
  { id: "gstr3b", name: "GSTR-3B", law: "GST", fr: "m", next: "20 Nov 2026", last: "Not filed yet", pen: "18% interest on the tax due, plus ₹50 a day", ref: "gstr3b" },
  { id: "gstr9", name: "GSTR-9 annual return", law: "GST", fr: "a", next: "31 Dec 2027", last: "-", pen: "₹200 a day, up to 0.5% of turnover", ref: "gstr9" },
  { id: "tdsp", name: "TDS deposit", law: "Income tax", fr: "m", next: "7 Nov 2026", last: "7 Oct 2026", pen: "1.5% interest a month", ref: "tds-pay" },
  { id: "tdsr", name: "TDS return 24Q and 26Q", law: "Income tax", fr: "q", next: "31 Jan 2027", last: "30 Oct 2026", pen: "₹200 a day", ref: "tds-24q" },
  { id: "adv", name: "Advance tax", law: "Income tax", fr: "q", next: "15 Dec 2026", last: "-", pen: "1% interest a month (234B and 234C)", ref: "adv-tax" },
  { id: "ecr", name: "EPF ECR", law: "EPF Act", fr: "m", next: "15 Nov 2026", last: "Not filed yet", pen: "5% to 15% a year by delay", ref: "pf-esi" },
  { id: "esim", name: "ESI contribution", law: "ESI Act", fr: "m", next: "15 Nov 2026", last: "Not filed yet", pen: "12% interest a year", ref: "pf-esi" },
  { id: "ptm", name: "Professional tax · monthly", law: "Karnataka PT", fr: "m", next: "10 Dec 2026", last: "-", pen: "1.5% a month" },
  { id: "pty", name: "Professional tax · yearly", law: "Karnataka PT", fr: "a", next: "30 Apr 2027", last: "-", pen: "1.5% a month" },
  { id: "lwf", name: "Labour Welfare Fund", law: "Karnataka LWF", fr: "a", next: "15 Jan 2027", last: "-", pen: "State penalty" },
  { id: "aoc4", name: "AOC-4 financial statements", law: "Companies Act", fr: "a", next: "29 Oct 2027", last: "-", pen: "₹100 a day", ref: "aoc4" },
  { id: "mgt7", name: "MGT-7 annual return", law: "Companies Act", fr: "a", next: "28 Nov 2027", last: "-", pen: "₹100 a day", ref: "mgt7" },
  { id: "adt1", name: "ADT-1 auditor appointment", law: "Companies Act", fr: "a", next: "10 Nov 2026", last: "-", pen: "₹100 a day", ref: "adt1" },
  { id: "dir3", name: "DIR-3 KYC", law: "Companies Act", fr: "a", next: "30 Sep 2029", last: "-", pen: "₹5,000 to reactivate the DIN", ref: "dir3kyc" },
  { id: "dpt3", name: "DPT-3 return of deposits", law: "Companies Act", fr: "a", next: "30 Jun 2027", last: "-", pen: "2 to 12 times the normal fee", ref: "dpt3" },
  { id: "msme1", name: "MSME-1", law: "Companies Act", fr: "h", next: "30 Apr 2027", last: "-", pen: "Fine up to ₹20,000, then ₹1,000 a day", ref: "msme1" },
  { id: "fla", name: "FLA return", law: "FEMA", fr: "a", next: "15 Jul 2027", last: "-", pen: "Up to 300% of the amount, or ₹2 lakh", ref: "fla" },
  { id: "softex", name: "Softex form", law: "FEMA", fr: "m", next: "30 Nov 2026", last: "-", pen: "The bank may freeze the account", ref: "softex" },
  { id: "posh", name: "POSH annual report", law: "POSH Act", fr: "a", next: "31 Jan 2027", last: "-", pen: "₹50,000", ref: "posh" },
  { id: "tlren", name: "Trade licence renewal", law: "Municipal", fr: "a", next: "31 Dec 2026", last: "-", pen: "25% of the fee within 3 months, 50% after" },
  { id: "seren", name: "Shops and Establishment renewal", law: "Shops Act", fr: "a", next: "1 Dec 2026", last: "-", pen: "25% in December, 50% after", ref: "seren" },
  { id: "lutren", name: "LUT renewal", law: "GST", fr: "a", next: "31 Mar 2027", last: "3 Nov 2026", pen: "Tax on exports, refund later", ref: "lutren" },
  { id: "iecup", name: "IEC profile update", law: "Foreign trade", fr: "a", next: "30 Jun 2027", last: "-", pen: "₹200" },
  { id: "tax3cd", name: "Tax audit (3CD)", law: "Income tax", fr: "a", next: "31 Oct 2027", last: "-", pen: "0.5% of turnover, up to ₹1,50,000" },
];

/** Law to area: sets the law tag colour (AREA_TONE) and the "By law" groups. */
export const LAW_AREA: Record<string, Area> = {
  GST: "GST",
  "Income tax": "Income tax",
  "EPF Act": "Payroll",
  "ESI Act": "Payroll",
  "Karnataka PT": "Payroll",
  "Karnataka LWF": "Payroll",
  "Companies Act": "MCA",
  FEMA: "FEMA",
  "Foreign trade": "FEMA",
  "POSH Act": "Labour",
  Municipal: "Labour",
  "Shops Act": "Labour",
};
export const LAW_GROUPS: Array<{ area: Area; label: string }> = [
  { area: "GST", label: "GST" },
  { area: "Income tax", label: "Income tax" },
  { area: "Payroll", label: "Payroll" },
  { area: "MCA", label: "MCA / ROC" },
  { area: "FEMA", label: "FEMA" },
  { area: "Labour", label: "Labour" },
];
export const lawTone = (law: string): ChipTone => AREA_TONE[LAW_AREA[law] ?? "GST"];

export const OB_STATE: Record<Exclude<RowState, "na">, { label: string; tone: ChipTone }> = {
  done: { label: "Filed", tone: "ok" },
  run: { label: "In progress", tone: "prog" },
  wait: { label: "Waiting on client", tone: "warn" },
  none: { label: "Upcoming", tone: "idle" },
  bad: { label: "Overdue", tone: "bad" },
};

export interface ObRow {
  key: string;
  client: string;
  clientName: string;
  ob: ObType;
  state: Exclude<RowState, "na">;
  /** Next due without the year: "11 Nov". */
  due: string;
}

const OB_STS: Array<ObRow["state"]> = ["done", "run", "wait", "none", "bad"];

/** Old staff rule: each client skips some obligations; the state comes from the client index and the id length. */
export function obRows(client = ""): ObRow[] {
  return OB_TYPES.flatMap((ob) =>
    REG_CLIENTS.flatMap((c, ci): ObRow[] => {
      if (client && client !== c.id) return [];
      if ((ci + ob.id.length) % 3 === 1) return [];
      const state = OB_STS[(ci * 7 + ob.id.length) % 5];
      return [{ key: `${c.id}-${ob.id}`, client: c.id, clientName: c.name, ob, state, due: ob.next.replace("2026", "").replace("2027", "").trim() }];
    }),
  );
}

/** Old "Due in 15 days": due in November and not filed. */
export const dueSoon = (r: ObRow) => /^\d+ Nov$/.test(r.due) && r.state !== "done";
