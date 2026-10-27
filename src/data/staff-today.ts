import { TODAY } from "@/lib/dates";
import { PHASE_TOTALS, REG_CODES, REG_NAMES, clientsFor, obligationsOf, type StaffClient, type StaffPortal } from "@/data/staff-clients";
import { queueFor, tasksFor, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { WEEK, sameDay } from "@/data/staff-work";

// Today page data for the staff portals. Ported from reference/old-screens/s/lead/Main.dc.html,
// s/mgr/Main.dc.html, reference/old-patch/admin/Main.dc.html and reference/old-patch/shared/Practice.dc.html.

/** Days left in the COI window per incorporating client (Main.dc.html PH, admin Main EXPD). */
export const DAYS_TO_COI: Record<string, number> = { northwind: 24, bluefin: 19, ember: 41, monsoon: 6, banyan: 47, quartz: 27 };

/** Clients stuck in a phase (red cell in Phase progress). */
export const isStuck = (c: StaffClient) => c.health === "Stuck" || c.health === "Overdue";

export type PhaseCell = "done" | "current" | "stuck" | "next";
export const PHASE_LABELS = ["Name approval", "Incorporation", "Post-incorporation"] as const;

export function phaseCells(c: StaffClient): Array<{ kind: PhaseCell; done: number; total: number }> {
  const cur = c.phases.findIndex((n, i) => n < PHASE_TOTALS[i]);
  return [0, 1, 2].map((i) => {
    const done = c.phases[i];
    const total = PHASE_TOTALS[i];
    const kind: PhaseCell = done >= total ? "done" : i === cur ? (isStuck(c) ? "stuck" : "current") : "next";
    return { kind, done, total };
  });
}

/** Action queue heatmap columns (Main.dc.html HS). */
export const HEAT_COLS: Array<{ key: string; label: string; status: TaskStatus; tone: "bad" | "warn" | "accent" | "idle" | "faint" }> = [
  { key: "over", label: "Overdue", status: "Overdue", tone: "bad" },
  { key: "due", label: "Due soon", status: "Due this week", tone: "warn" },
  { key: "mine", label: "In progress", status: "In progress", tone: "accent" },
  { key: "wait", label: "Waiting", status: "With client", tone: "idle" },
  { key: "up", label: "Not started", status: "Not started", tone: "faint" },
];

/** Clients × filings grid (Main.dc.html FR). Columns are the October filings. */
export const FILING_COLS = ["GSTR-1", "GSTR-3B", "TDS challan", "PF ECR", "ESI challan", "Professional tax", "DIR-3 KYC"] as const;
export type FilingCell = { kind: "filed" | "due" | "overdue" | "upcoming" | "na"; due?: Date; period?: string };

/** A filing does not apply when the client has no matching registration (REG_CODES: x not needed, n before COI). */
const REG_FOR: Record<string, (typeof REG_NAMES)[number]> = { "GSTR-1": "GST", "GSTR-3B": "GST", "PF ECR": "PF", "ESI challan": "ESI", "Professional tax": "PT" };

export function filingRow(c: StaffClient): FilingCell[] {
  const obs = obligationsOf(c);
  const codes = REG_CODES[c.id] ?? "";
  return FILING_COLS.map((name) => {
    const reg = REG_FOR[name];
    if (reg) {
      const code = codes[REG_NAMES.indexOf(reg)];
      if (code === "x" || code === "n") return { kind: "na" };
    }
    const mine = obs.filter((o) => o.name === name || o.name.startsWith(name));
    const late = mine.find((o) => o.status === "Overdue");
    if (late) return { kind: "overdue", due: late.due, period: late.period };
    const o = mine[0];
    if (!o) return { kind: "na" };
    if (o.status === "Filed") return { kind: "filed", due: o.due, period: o.period };
    if (o.status === "Due this week") return { kind: "due", due: o.due, period: o.period };
    return { kind: "upcoming", due: o.due, period: o.period };
  });
}

/** Filing counts for the Compliance health split. */
export function filingCounts(clients: StaffClient[]) {
  const n = { filed: 0, due: 0, overdue: 0, upcoming: 0 };
  clients.filter((c) => c.stage === "compliance").forEach((c) => filingRow(c).forEach((f) => f.kind !== "na" && n[f.kind]++));
  return n;
}

export type WeekKind = "filing" | "step" | "reminder" | "done";
export interface WeekItem {
  id: string;
  text: string;
  client: string;
  kind: WeekKind;
  day: Date;
  href?: string;
}

/** Items on each day of the week strip: step deadlines, client reminders, filings and done items. */
export function weekItems(portal: StaffPortal): WeekItem[] {
  const tasks = portal === "lead" ? tasksFor("lead") : [...queueFor(portal), ...tasksFor(portal).filter((t) => t.status === "With client" || t.status === "Done")];
  const seen = new Set<string>();
  const fromTasks: WeekItem[] = tasks
    .filter((t) => WEEK.some((w) => sameDay(w, t.due)))
    .filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
    .map((t) => ({
      id: t.id,
      text: t.title,
      client: t.client,
      kind: t.status === "Done" ? "done" : t.status === "With client" ? "reminder" : "step",
      day: t.due,
    }));
  const filings: WeekItem[] = clientsFor(portal)
    .filter((c) => c.stage === "compliance")
    .flatMap((c) =>
      obligationsOf(c)
        .filter((o) => WEEK.some((w) => sameDay(w, o.due)))
        .map((o) => ({ id: o.id, text: `${o.name} · ${o.period}`, client: c.id, kind: "filing" as const, day: o.due })),
    );
  return [...fromTasks, ...filings];
}

/** Days a task has waited on the client (from the old "asked" dates). */
export const WAIT_DAYS: Record<string, number> = { t02: 5, t03: 2, t11: 3, t21: 2, t29: 1, t30: 4, m04: 5, m10: 4 };

export function waitingOnClient(portal: StaffPortal): Array<StaffTask & { days: number }> {
  const pool = portal === "lead" ? tasksFor("lead") : tasksFor(portal);
  return pool.filter((t) => t.status === "With client").map((t) => ({ ...t, days: WAIT_DAYS[t.id] ?? 2 }));
}

/** Practice strip numbers (Practice.dc.html slim). */
export function practiceNumbers(portal: StaffPortal) {
  const cl = clientsFor(portal);
  const regOpen = cl.reduce((a, c) => a + [...(REG_CODES[c.id] ?? "")].filter((x) => x === "p" || x === "w").length, 0);
  const regWait = cl.reduce((a, c) => a + [...(REG_CODES[c.id] ?? "")].filter((x) => x === "w").length, 0);
  const regDone = cl.reduce((a, c) => a + [...(REG_CODES[c.id] ?? "")].filter((x) => x === "d").length, 0);
  const f = filingCounts(cl);
  const inc = cl.filter((c) => c.stage === "incorporating");
  const stages = [0, 1, 2, 3].map((i) => ({
    label: ["Name approval", "Incorporation", "Post-incorporation", "Registrations"][i],
    n: cl.filter((c) => c.phases.findIndex((p, j) => p < PHASE_TOTALS[j]) === i).length,
  }));
  const pendingByReg = REG_NAMES.map((name, i) => ({ name, n: cl.filter((c) => /[pw]/.test((REG_CODES[c.id] ?? "")[i] ?? "")).length })).filter((r) => r.n > 0).sort((a, b) => b.n - a.n);
  const coi = inc.map((c) => DAYS_TO_COI[c.id]).filter((n): n is number => n !== undefined);
  return {
    inc: inc.length,
    regOpen,
    regWait,
    regDone,
    filings: f,
    stages,
    pendingByReg,
    avgCoi: coi.length ? Math.round(coi.reduce((a, b) => a + b, 0) / coi.length) : 0,
  };
}

/** Done today count for the greeting (Main.dc.html KPIs). */
export const DONE_TODAY: Record<StaffPortal, number> = { lead: 2, manager: 4, admin: 6 };

/** Week strip default: today. */
export const WEEK_TODAY = WEEK.findIndex((w) => sameDay(w, TODAY));
