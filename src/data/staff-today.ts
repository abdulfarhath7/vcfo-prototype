import { STAFF_TODAY, d } from "@/lib/dates";
import { PHASE_TOTALS, REG_CODES, REG_NAMES, clientsFor, obligationsOf, type StaffClient, type StaffPortal } from "@/data/staff-clients";
import { queueFor, tasksFor, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { WEEK, sameDay } from "@/data/staff-work";

// Today page data for the staff portals. Staff "today" is Fri 16 Oct 2026 (STAFF_TODAY), as in the old prototype. Ported from reference/old-screens/s/lead/Main.dc.html,
// s/mgr/Main.dc.html, reference/old-patch/admin/Main.dc.html and reference/old-patch/shared/Practice.dc.html.

/** Days left in the COI window per incorporating client (Main.dc.html PH, admin Main EXPD). */
export const DAYS_TO_COI: Record<string, number> = { northwind: 24, orchid: 19, larkspur: 41, juniper: 58, monsoon: 6, banyan: 47, quartz: 27 };

/** Clients stuck in a phase (red cell in Phase progress). */
export const isStuck = (c: StaffClient) => c.health === "Stuck" || c.health === "Overdue";

export type PhaseCell = "done" | "current" | "stuck" | "next";
// Old column heads (lead Main.dc.html phase grid).
export const PHASE_LABELS = ["Part A", "Part B", "Post-inc."] as const;

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
  { key: "due", label: "Due today", status: "Due this week", tone: "warn" },
  { key: "mine", label: "My step", status: "In progress", tone: "accent" },
  { key: "wait", label: "Waiting", status: "With client", tone: "idle" },
  { key: "up", label: "Upcoming", status: "Not started", tone: "faint" },
];

/** Clients × filings grid (Main.dc.html FR). Columns are the October filings. */
export const FILING_COLS = ["GSTR-1", "GSTR-3B", "TDS", "PF ECR", "ESI", "PT", "FC-GPR", "DIR-3", "ADT-1"] as const;
/** Due day in October per column (Main.dc.html due). */
const FILING_DUE = [11, 20, 7, 15, 15, 25, 22, 30, 30];
export type FilingCell = { kind: "filed" | "due" | "overdue" | "upcoming" | "na"; due?: Date; period?: string };

/** Old grid codes per client: f filed, d due soon, o overdue, u upcoming, x not applicable (Main.dc.html FR). */
const FR: Record<string, string> = { brightwave: "ffdfuuxux", tidewater: "ffffuuoxu", kestrel: "xxdxxxxux", halcyon: "dfdouuxfx" };
const FR_KIND = { f: "filed", d: "due", o: "overdue", u: "upcoming", x: "na" } as const;
/** Obligation names behind each column, for clients without old codes (admin view). */
const OB_NAME: Record<(typeof FILING_COLS)[number], string> = { "GSTR-1": "GSTR-1", "GSTR-3B": "GSTR-3B", TDS: "TDS challan", "PF ECR": "PF ECR", ESI: "ESI challan", PT: "Professional tax", "FC-GPR": "FC-GPR", "DIR-3": "DIR-3 KYC", "ADT-1": "ADT-1" };

/** A filing does not apply when the client has no matching registration (REG_CODES: x not needed, n before COI). */
const REG_FOR: Partial<Record<(typeof FILING_COLS)[number], (typeof REG_NAMES)[number]>> = { "GSTR-1": "GST", "GSTR-3B": "GST", "PF ECR": "PF", ESI: "ESI", PT: "PT" };

export function filingRow(c: StaffClient): FilingCell[] {
  const code = FR[c.id];
  if (code) return FILING_COLS.map((_, i) => ({ kind: FR_KIND[code[i] as keyof typeof FR_KIND], due: d(2026, 10, FILING_DUE[i]), period: "Sep 2026" }));
  const obs = obligationsOf(c);
  const codes = REG_CODES[c.id] ?? "";
  return FILING_COLS.map((col) => {
    const reg = REG_FOR[col];
    if (reg) {
      const rc = codes[REG_NAMES.indexOf(reg)];
      if (rc === "x" || rc === "n") return { kind: "na" };
    }
    const name = OB_NAME[col];
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

/** Lead and manager week strip, Mon 12 to Sun 18 Oct (Main.dc.html W, the mixed view). */
const W: Array<[number, WeekKind, string, string]> = [
  [0, "done", "Name approval", "larkspur"],
  [0, "done", "MSME", "halcyon"],
  [1, "step", "Subscriber", "orchid"],
  [1, "done", "INC-20A", "kestrel"],
  [2, "reminder", "Reminder · NOC", "northwind"],
  [3, "filing", "PF ECR", "halcyon"],
  [4, "filing", "TDS challan", "kestrel"],
  [4, "step", "Bank A/c", "brightwave"],
  [4, "filing", "GSTR-1", "halcyon"],
  [4, "step", "FC-GPR", "tidewater"],
  [4, "step", "GST Reg", "kestrel"],
  [4, "step", "Draft BR", "larkspur"],
  [4, "reminder", "Logo file", "halcyon"],
  [4, "reminder", "KYC docs", "juniper"],
  [4, "reminder", "Utility bill", "northwind"],
];

/** Items on each day of the week strip: step deadlines, client reminders, filings and done items. */
export function weekItems(portal: StaffPortal): WeekItem[] {
  if (portal !== "admin") return W.map(([i, kind, text, client], k) => ({ id: `w${k}`, text, client, kind, day: WEEK[i] }));
  const tasks = [...queueFor(portal), ...tasksFor(portal).filter((t) => t.status === "With client" || t.status === "Done")];
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

/** Waiting on client (Main.dc.html WT, the mixed view). Lead and manager. */
const WT: Array<StaffTask & { days: number }> = [
  { id: "wt1", title: "Utility bill + NOC", client: "northwind", code: "Step 7", step: 7, owner: "Bharath", due: d(2026, 10, 20), status: "With client", area: "MCA", days: 5 },
  { id: "wt2", title: "FIRMS login", client: "tidewater", code: "Step 22", step: 22, owner: "Meera Nair", due: d(2026, 10, 16), status: "With client", area: "FEMA", days: 3 },
  { id: "wt3", title: "Logo file (SVG)", client: "halcyon", code: "Reg-15", owner: "Sneha Kulkarni", due: d(2026, 10, 25), status: "With client", area: "MCA", days: 3 },
  { id: "wt4", title: "KYC docs", client: "juniper", code: "Step 1", step: 1, owner: "Bharath", due: d(2026, 10, 22), status: "With client", area: "MCA", days: 1 },
];
/** Stuck steps for the action queue badge (Main.dc.html STK, the mixed view). */
export const STUCK_STEPS: Array<{ text: string; client: string }> = [{ text: "MCA query on SPICe+", client: "orchid" }];

/** Items with MCA or a portal (Main.dc.html BALL "MCA / portal"): part of the Waiting number. */
export const WAIT_MCA: Array<{ text: string; client: string }> = [
  { text: "SPICe+ SRN", client: "orchid" },
  { text: "INC-22 SRN", client: "tidewater" },
];

/** Days a task has waited on the client (admin view, from the old "asked" dates). */
export const WAIT_DAYS: Record<string, number> = { p01: 5, p03: 2, p12: 3, p26: 1, p27: 4 };

export function waitingOnClient(portal: StaffPortal): Array<StaffTask & { days: number }> {
  if (portal !== "admin") return WT;
  return tasksFor(portal)
    .filter((t) => t.status === "With client")
    .map((t) => ({ ...t, days: WAIT_DAYS[t.id] ?? 2 }));
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
  // Per registration: done, in progress, pending (waiting on documents). Sorted by open count.
  const regSplit = REG_NAMES.map((name, i) => {
    const col = cl.map((c) => (REG_CODES[c.id] ?? "")[i] ?? "");
    const r = { name, d: col.filter((x) => x === "d").length, p: col.filter((x) => x === "p").length, w: col.filter((x) => x === "w").length, total: 0, mostPending: "" };
    r.total = Math.max(1, r.d + r.p + r.w);
    return r;
  })
    .filter((r) => r.p + r.w > 0)
    .sort((a, b) => b.p + b.w - (a.p + a.w));
  const most = [...regSplit].sort((a, b) => b.w - a.w)[0];
  if (regSplit[0] && most) regSplit[0].mostPending = most.name;
  return {
    inc: inc.length,
    regOpen,
    regWait,
    regDone,
    filings: f,
    stages,
    pendingByReg,
    regSplit,
    avgCoi: coi.length ? Math.round(coi.reduce((a, b) => a + b, 0) / coi.length) : 0,
  };
}

/** Done today count for the greeting (Main.dc.html KPIs). */
export const DONE_TODAY: Record<StaffPortal, number> = { lead: 2, manager: 2, admin: 6 };

/** Week strip default: today. */
export const WEEK_TODAY = WEEK.findIndex((w) => sameDay(w, STAFF_TODAY));

/** Admin practice cards (reference/old-patch/shared/Practice.dc.html with s/admin/data.js). */
export type PipeStage = "Name approval" | "SPICe+ forms" | "MCA review" | "Certificate";
export const PIPE_STAGES: PipeStage[] = ["Name approval", "SPICe+ forms", "MCA review", "Certificate"];
export function pipeOf(c: StaffClient): PipeStage {
  if (c.phases[0] < 5) return "Name approval";
  if (c.pendingWith === "MCA" && c.phases[1] >= 7) return "MCA review";
  if (c.phases[1] < 9) return "SPICe+ forms";
  return "Certificate";
}
/** Average days to COI this year per manager (data.js DAYS). The card shows their mean. */
export const MGR_DAYS_TO_COI: Record<string, number> = { Pranay: 31, "Priya Raman": 36, "Arjun Mehta": 41 };
/** October filings for Krishna's seven compliance clients (data.js FIL). */
export const ADMIN_FILINGS = { overdue: 3, late: 3, due: 8, upcoming: 15, onTime: 29, worst: "PF and ESI" };
