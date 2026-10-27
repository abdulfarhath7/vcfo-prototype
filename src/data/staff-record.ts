import { d } from "@/lib/dates";
import { DOCS, ACTIVITY } from "@/data/client-home";
import { PHASES, TIMELINE, TIMELINE_TICKS, MCA_REVIEW, COI_EXPECTED } from "@/data/incorporation";
import type { Doc } from "@/components/cards/DocList";
import type { ActivityRow } from "@/components/cards/ActivityList";
import type { GanttRow } from "@/components/cards/GanttTimeline";
import { PHASE_TOTALS, type StaffClient } from "@/data/staff-clients";

// Client record data for staff: documents, audit rows and the timeline.
// Northwind reuses the client portal data. Other clients get rows built from their phase counts.

export function docsOf(c: StaffClient): Doc[] {
  if (c.id === "northwind") return DOCS.map((x) => ({ ...x, href: undefined }));
  if (c.stage === "incorporating")
    return [
      { id: `${c.id}-d1`, name: "Director KYC bundle", type: "ZIP", from: "client", fromLabel: c.short, date: d(2026, 9, 28), size: "3.9 MB" },
      { id: `${c.id}-d2`, name: "Draft Board resolution", type: "DOCX", from: "sbc", date: d(2026, 10, 2), size: "48 KB" },
      { id: `${c.id}-d3`, name: "Name reservation (RUN) receipt", type: "PDF", from: "mca", date: d(2026, 9, 24), size: "96 KB" },
    ];
  return [
    { id: `${c.id}-d1`, name: "GSTR-3B August acknowledgement", type: "PDF", from: "sbc", date: d(2026, 9, 20), size: "120 KB" },
    { id: `${c.id}-d2`, name: "Payroll sheet September", type: "XLSX", from: "client", fromLabel: c.short, date: d(2026, 10, 2), size: "64 KB" },
    { id: `${c.id}-d3`, name: "Certificate of Incorporation", type: "PDF", from: "mca", date: d(2026, 6, 18), size: "210 KB" },
    { id: `${c.id}-d4`, name: "Office photos for GST", type: "JPG", from: "client", fromLabel: c.short, date: d(2026, 9, 12), size: "2.4 MB" },
  ];
}

export function auditOf(c: StaffClient): ActivityRow[] {
  if (c.id === "northwind") return ACTIVITY;
  return [
    { id: `${c.id}-a1`, date: d(2026, 10, 5), time: "16:10", text: `${c.step}: status changed to ${c.health.toLowerCase()}`, who: c.lead },
    { id: `${c.id}-a2`, date: d(2026, 10, 3), time: "11:45", text: "Reminder sent to the client", who: c.lead },
    { id: `${c.id}-a3`, date: d(2026, 10, 1), time: "09:20", text: "Due dates set for the month", who: c.manager },
    { id: `${c.id}-a4`, date: d(2026, 9, 26), time: "14:05", text: "Documents uploaded", who: c.short },
  ];
}

export const RECORD_TIMELINE = { start: TIMELINE.start, end: TIMELINE.end, ticks: TIMELINE_TICKS };

/** Gantt rows. Incorporating clients follow the incorporation plan; compliance clients show done phases and the current one. */
export function ganttOf(c: StaffClient): { start: Date; end: Date; ticks: Date[]; rows: GanttRow[] } {
  const [p1, p2, p3, reg] = c.phases;
  if (c.stage === "incorporating") {
    const rows: GanttRow[] = [
      { id: "p1", name: PHASES[0].short, status: p1 === 5 ? "done" : "current", bars: [{ from: PHASES[0].start, to: PHASES[0].end, kind: p1 === 5 ? "done" : "cur" }], count: `${p1}/5` },
      {
        id: "p2",
        name: PHASES[1].short,
        status: p1 < 5 ? "planned" : "current",
        bars: p1 < 5 ? [{ from: PHASES[1].start, to: PHASES[1].end, kind: "plan" }] : [{ from: PHASES[1].start, to: d(2026, 10, 6), kind: "cur" }, { from: d(2026, 10, 6), to: PHASES[1].end, kind: "rest" }],
        count: `${p2}/9`,
        note: c.health === "Stuck" ? { text: "Stuck", bad: true } : undefined,
      },
      { id: "mca", name: "MCA review", status: "planned", bars: [{ from: MCA_REVIEW.start, to: MCA_REVIEW.end, kind: "plan" }], milestone: COI_EXPECTED },
      { id: "p3", name: PHASES[2].short, status: "planned", bars: [{ from: PHASES[2].start, to: PHASES[2].end, kind: "plan" }], count: `${p3}/11` },
    ];
    return { ...RECORD_TIMELINE, rows };
  }
  const start = d(2026, 5, 1);
  const end = d(2026, 12, 31);
  const ticks = [d(2026, 5, 15), d(2026, 6, 15), d(2026, 7, 15), d(2026, 8, 15), d(2026, 9, 15), d(2026, 10, 15), d(2026, 11, 15), d(2026, 12, 15)];
  const p3done = p3 === PHASE_TOTALS[2];
  const late = c.health === "Overdue" || c.health === "Stuck";
  const rows: GanttRow[] = [
    { id: "p1", name: "Name application", status: "done", bars: [{ from: d(2026, 5, 4), to: d(2026, 5, 22), kind: "done" }], count: "5/5" },
    { id: "p2", name: "Incorporation", status: "done", bars: [{ from: d(2026, 5, 25), to: d(2026, 6, 18), kind: "done" }], milestone: d(2026, 6, 18), count: "9/9" },
    {
      id: "p3",
      name: "Post-incorporation",
      status: p3done ? "done" : "current",
      bars: p3done ? [{ from: d(2026, 6, 19), to: d(2026, 8, 14), kind: "done" }] : [{ from: d(2026, 6, 19), to: d(2026, 10, 6), kind: late ? "late" : "cur" }, { from: d(2026, 10, 6), to: d(2026, 11, 6), kind: "rest" }],
      count: `${p3}/11`,
      note: late ? { text: c.health, bad: true } : undefined,
    },
    {
      id: "reg",
      name: "Registrations",
      status: !p3done ? "planned" : reg === PHASE_TOTALS[3] ? "done" : "current",
      bars: p3done ? [{ from: d(2026, 8, 15), to: d(2026, 10, 6), kind: "cur" }, { from: d(2026, 10, 6), to: d(2026, 12, 15), kind: "rest" }] : [{ from: d(2026, 11, 6), to: d(2026, 12, 31), kind: "plan" }],
      count: `${reg}/23`,
    },
  ];
  return { start, end, ticks, rows };
}
