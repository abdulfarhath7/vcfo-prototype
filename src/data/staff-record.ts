import { d } from "@/lib/dates";
import { DOCS, ACTIVITY } from "@/data/client-home";
import type { Doc } from "@/components/cards/DocList";
import type { ActivityRow } from "@/components/cards/ActivityList";
import type { GanttRow } from "@/components/cards/GanttTimeline";
import { PHASE_TOTALS, type StaffClient } from "@/data/staff-clients";
import { REG_TYPES, type RegType } from "@/data/staff-regs-table";

// Client record data for staff: documents, audit rows and the timeline.
// Northwind reuses the client portal data. Other clients get rows built from their phase counts.

export function docsOf(c: StaffClient): Doc[] {
  if (c.id === "northwind") return DOCS.map((x) => ({ ...x, href: undefined }));
  if (c.stage === "incorporating")
    return [
      { id: `${c.id}-d1`, name: "Director KYC bundle", type: "ZIP", from: "client", fromLabel: c.short, date: d(2026, 10, 8), size: "3.9 MB" },
      { id: `${c.id}-d2`, name: "Draft Board resolution", type: "DOCX", from: "sbc", date: d(2026, 10, 12), size: "48 KB" },
      { id: `${c.id}-d3`, name: "Name reservation (RUN) receipt", type: "PDF", from: "mca", date: d(2026, 10, 4), size: "96 KB" },
    ];
  return [
    { id: `${c.id}-d1`, name: "GSTR-3B August acknowledgement", type: "PDF", from: "sbc", date: d(2026, 9, 30), size: "120 KB" },
    { id: `${c.id}-d2`, name: "Payroll sheet September", type: "XLSX", from: "client", fromLabel: c.short, date: d(2026, 10, 12), size: "64 KB" },
    { id: `${c.id}-d3`, name: "Certificate of Incorporation", type: "PDF", from: "mca", date: d(2026, 6, 28), size: "210 KB" },
    { id: `${c.id}-d4`, name: "Office photos for GST", type: "JPG", from: "client", fromLabel: c.short, date: d(2026, 9, 22), size: "2.4 MB" },
  ];
}

export function auditOf(c: StaffClient): ActivityRow[] {
  if (c.id === "northwind") return ACTIVITY;
  return [
    { id: `${c.id}-a1`, date: d(2026, 10, 15), time: "16:10", text: `${c.step}: status changed to ${c.health.toLowerCase()}`, who: c.lead },
    { id: `${c.id}-a2`, date: d(2026, 10, 13), time: "11:45", text: "Reminder sent to the client", who: c.lead },
    { id: `${c.id}-a3`, date: d(2026, 10, 11), time: "09:20", text: "Due dates set for the month", who: c.manager },
    { id: `${c.id}-a4`, date: d(2026, 10, 6), time: "14:05", text: "Documents uploaded", who: c.short },
  ];
}

/** Staff timeline axis for incorporating clients (old lead Overview): 14 Sep to 30 Nov, one tick a week. */
const AXIS_START = d(2026, 9, 14);
export const RECORD_TIMELINE = { start: AXIS_START, end: d(2026, 11, 30), ticks: Array.from({ length: 12 }, (_, i) => d(2026, 9, 14 + i * 7)) };

/** Old lead Overview plan: Phase 1 14 to 28 Sep, Phase 2 29 Sep to 30 Oct, MCA review 31 Oct to 8 Nov, COI 9 Nov, Phase 3 10 to 30 Nov. */
const PLAN = { p1: [d(2026, 9, 14), d(2026, 9, 28)], p2: [d(2026, 9, 29), d(2026, 10, 30)], mca: [d(2026, 10, 31), d(2026, 11, 8)], coi: d(2026, 11, 9), p3: [d(2026, 11, 10), d(2026, 11, 30)] } as const;
const STAFF_DAY = d(2026, 10, 16);

/**
 * Registrations that apply to Northwind after the certificate: the 21 in reference/old-screens/s/lead/regcat.js
 * less the 5 marked "not needed" (ICEGATE, CLRA, Patent, FC-TRS, ODI). The old record tab shows 16.
 */
const NORTHWIND_REGS: RegType[] = [
  { id: "gst", name: "GST registration", short: "GST registration", cat: "tax", auth: "GSTN", form: "GST REG-01" },
  { id: "lut", name: "Letter of undertaking (LUT)", short: "Letter of undertaking (LUT)", cat: "tax", auth: "GSTN", form: "GST RFD-11" },
  { id: "pt", name: "Professional tax", short: "Professional tax", cat: "tax", auth: "Karnataka CTD", form: "PTRC and PTEC" },
  { id: "epf", name: "EPF registration", short: "EPF registration", cat: "labour", auth: "EPFO", form: "Shram Suvidha" },
  { id: "esi", name: "ESI registration", short: "ESI registration", cat: "labour", auth: "ESIC", form: "ESIC employer form" },
  { id: "se", name: "Shops and Establishment", short: "Shops and Establishment", cat: "labour", auth: "Karnataka Labour Dept", form: "Form A" },
  { id: "posh", name: "POSH compliance", short: "POSH compliance", cat: "labour", auth: "District officer", form: "Annual report" },
  { id: "lwf", name: "Labour Welfare Fund", short: "Labour Welfare Fund", cat: "labour", auth: "Karnataka LWF Board", form: "Form D" },
  { id: "msme", name: "MSME (Udyam)", short: "MSME (Udyam)", cat: "business", auth: "Ministry of MSME", form: "Udyam" },
  { id: "iec", name: "Import Export Code (IEC)", short: "Import Export Code (IEC)", cat: "business", auth: "DGFT", form: "ANF-2A" },
  { id: "lei", name: "Legal Entity Identifier (LEI)", short: "Legal Entity Identifier (LEI)", cat: "business", auth: "LEIL", form: "LEI application" },
  { id: "tl", name: "Trade licence", short: "Trade licence", cat: "business", auth: "BBMP", form: "Trade licence" },
  { id: "nonstpi", name: "Non-STPI registration", short: "Non-STPI registration", cat: "business", auth: "STPI", form: "Non-STPI form" },
  { id: "tm", name: "Trademark registration", short: "Trademark registration", cat: "ip", auth: "IP India", form: "TM-A" },
  { id: "fcgpr", name: "FC-GPR", short: "FC-GPR", cat: "fema", auth: "RBI · FIRMS", form: "FC-GPR" },
  { id: "fla", name: "FLA return", short: "FLA return", cat: "fema", auth: "RBI · FLAIR", form: "FLA" },
];

/** Registrations listed on the record before the certificate. */
export const preCoiRegsOf = (c: StaffClient): RegType[] => (c.id === "northwind" ? NORTHWIND_REGS : REG_TYPES);

/** Documents expected so far (old "Documents 6/11": Phase 1 3 of 3, Phase 2 3 of 8). */
export const DOCS_EXPECTED: Record<string, number> = { northwind: 11 };

/** Documents tab count. The old lead Overview hard-codes 18 for Northwind; the owner kept it on 28 Oct 2026 (C-0085). Other clients count their files. */
export const DOCS_TAB: Record<string, number> = { northwind: 18 };
export const docsTabCount = (id: string, files: number) => DOCS_TAB[id] ?? files;

/** Gantt rows. Incorporating clients follow the incorporation plan; compliance clients show done phases and the current one. */
export function ganttOf(c: StaffClient): { start: Date; end: Date; ticks: Date[]; rows: GanttRow[] } {
  const [p1, p2, p3, reg] = c.phases;
  if (c.stage === "incorporating") {
    const rows: GanttRow[] = [
      { id: "p1", name: "Phase 1 · Name application", status: p1 === 5 ? "done" : "current", bars: [{ from: PLAN.p1[0], to: PLAN.p1[1], kind: p1 === 5 ? "done" : "cur" }], label: p1 === 5 ? "Done 28 Sep" : `${p1}/5` },
      {
        id: "p2",
        name: "Phase 2 · Incorporation",
        status: p1 < 5 ? "planned" : "current",
        bars: p1 < 5 ? [{ from: PLAN.p2[0], to: PLAN.p2[1], kind: "plan" }] : [{ from: PLAN.p2[0], to: STAFF_DAY, kind: "cur" }, { from: STAFF_DAY, to: PLAN.p2[1], kind: "rest" }],
        label: p1 < 5 ? `${p2}/9` : `${Math.round((p2 / 9) * 100)}%`,
        note: c.health === "Stuck" ? { text: "Stuck", bad: true } : undefined,
      },
      { id: "mca", name: "MCA review", status: "planned", bars: [{ from: PLAN.mca[0], to: PLAN.mca[1], kind: "plan" }] },
      { id: "coi", name: "COI", status: "planned", bars: [], milestone: PLAN.coi, label: "9 Nov" },
      { id: "p3", name: "Phase 3 · Post-incorporation", status: "planned", bars: [{ from: PLAN.p3[0], to: PLAN.p3[1], kind: "plan" }] },
    ];
    return { ...RECORD_TIMELINE, rows };
  }
  const start = d(2026, 5, 1);
  const end = d(2026, 12, 31);
  const ticks = [d(2026, 5, 25), d(2026, 6, 25), d(2026, 7, 25), d(2026, 8, 25), d(2026, 9, 25), d(2026, 10, 25), d(2026, 11, 25), d(2026, 12, 25)];
  const p3done = p3 === PHASE_TOTALS[2];
  const late = c.health === "Overdue" || c.health === "Stuck";
  const rows: GanttRow[] = [
    { id: "p1", name: "Name application", status: "done", bars: [{ from: d(2026, 5, 14), to: d(2026, 6, 1), kind: "done" }], count: "5/5" },
    { id: "p2", name: "Incorporation", status: "done", bars: [{ from: d(2026, 6, 4), to: d(2026, 6, 28), kind: "done" }], milestone: d(2026, 6, 28), count: "9/9" },
    {
      id: "p3",
      name: "Post-incorporation",
      status: p3done ? "done" : "current",
      bars: p3done ? [{ from: d(2026, 6, 29), to: d(2026, 8, 24), kind: "done" }] : [{ from: d(2026, 6, 29), to: d(2026, 10, 16), kind: late ? "late" : "cur" }, { from: d(2026, 10, 16), to: d(2026, 11, 16), kind: "rest" }],
      count: `${p3}/11`,
      note: late ? { text: c.health, bad: true } : undefined,
    },
    {
      id: "reg",
      name: "Registrations",
      status: !p3done ? "planned" : reg === PHASE_TOTALS[3] ? "done" : "current",
      bars: p3done ? [{ from: d(2026, 8, 15), to: d(2026, 10, 16), kind: "cur" }, { from: d(2026, 10, 16), to: d(2026, 12, 15), kind: "rest" }] : [{ from: d(2026, 11, 6), to: d(2026, 12, 31), kind: "plan" }],
      count: `${reg}/23`,
    },
  ];
  return { start, end, ticks, rows };
}

/** Notes on the client record (old Overview "Notes 3" tab). */
export interface RecordNote {
  id: string;
  who: string;
  date: Date;
  text: string;
}

export function notesOf(c: StaffClient): RecordNote[] {
  if (c.id === "northwind")
    return [
      { id: "n1", who: "Bharath", date: d(2026, 10, 14), text: "Ask for a fresh utility bill if it is older than 15 Aug." },
      { id: "n2", who: "Pranay", date: d(2026, 10, 12), text: "Bill must show the same address as the rent agreement." },
      { id: "n3", who: "Bharath", date: d(2026, 10, 6), text: "Rohan prefers calls after 4 pm IST." },
    ];
  return [
    { id: "n1", who: c.lead, date: d(2026, 10, 15), text: `${c.step}: ${c.pendingWith === "Client" ? "client asked for one more week" : "SBC works it this week"}.` },
    { id: "n2", who: c.manager, date: d(2026, 10, 10), text: "Monthly review done. Dates set for October." },
  ];
}
