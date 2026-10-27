import { TODAY, d, fmt } from "@/lib/dates";
import type { ThreadStep } from "@/components/cards/Thread";
import { CALENDAR, FILINGS, OBLIGATIONS, type Area, type CalendarEvent, type Filing, type FilingStatus, type ObStatus, type Obligation } from "@/data/compliance";
import { REGISTRATIONS, type DocStatus, type ItemDoc, type Registration, type RegStatus } from "@/data/registrations";
import { REG_CODES, clientById, clientsFor, type StaffClient, type StaffPortal } from "@/data/staff-clients";

// Staff view of compliances and registrations across clients.
// Every row is built from the shared Northwind data in compliance.ts and registrations.ts.
// Each client takes a subset of the obligations, and a few rows get their own status (late PF, filed KYC).

const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const earlier = (a: Date, b: Date) => (a.getTime() < b.getTime() ? a : b);

/** Clients a portal sees. The project lead sees only Bharath's clients. */
export function myClients(portal: StaffPortal): StaffClient[] {
  const all = clientsFor(portal);
  return portal === "lead" ? all.filter((c) => c.lead === "Bharath") : all;
}

/** Clients in the compliance stage: they have obligations and filings. */
export const complianceClients = (portal: StaffPortal) => myClients(portal).filter((c) => c.stage === "compliance");

/** Composite row id: "<client>-<item>". Client ids have no hyphen. */
export const splitKey = (key: string) => {
  const i = key.indexOf("-");
  return i < 0 ? null : { client: key.slice(0, i), item: key.slice(i + 1) };
};

export const staffObHref = (portal: StaffPortal, key: string) => `/${portal}/compliances/obligations/${key}`;
export const staffRegHref = (portal: StaffPortal, key: string) => `/${portal}/registrations/${key}`;

type StepKind = "done" | "sbc" | "client" | "none";

/** Rebuild a thread for a new status. Done steps get dates from `start`, three days apart, never after today. */
function restate(steps: ThreadStep[], kind: StepKind, short: string, start: Date, lead: string, baseBy: string, note?: string): ThreadStep[] {
  const n = steps.length;
  const done = kind === "done" ? n : kind === "none" ? 0 : kind === "sbc" ? Math.min(2, n - 1) : 0;
  return steps.map((s, i): ThreadStep => {
    if (i < done) {
      const kept = s.state === "done";
      return { id: s.id, title: s.title, state: "done", date: earlier(addDays(start, i * 3), TODAY), by: kept && s.by ? s.by.replaceAll(baseBy, lead) : `Done by ${lead}` };
    }
    if (i === done && kind === "client") return { id: s.id, title: s.title, state: "current", owner: "client", date: earlier(start, TODAY), by: `Waiting on ${short}`, note };
    if (i === done && kind === "sbc") return { id: s.id, title: s.title, state: "current", owner: s.owner === "client" ? "sbc" : s.owner, by: s.owner ? lead : s.by };
    return { id: s.id, title: s.title, state: "upcoming", owner: s.owner === "client" ? "sbc" : s.owner };
  });
}

function redoc(docs: ItemDoc[], status: DocStatus, short: string, end: Date): ItemDoc[] {
  return docs.map((x, i) => {
    if (x.from !== "client") return x;
    return { ...x, fromLabel: short, status, date: status === "Accepted" ? x.date ?? addDays(end, -12 + i) : undefined };
  });
}

/* ---------- Obligations ---------- */

/** Obligation ids each compliance client has. */
const OB_SET: Record<string, string[]> = {
  zenith: ["tds-pay", "gstr1", "gstr3b", "pf-esi", "dir3kyc", "tds-26q", "tds-24q", "aoc4", "adv-tax", "mgt7", "gstr9"],
  arcadia: ["tds-pay", "gstr1", "gstr3b", "tds-26q", "adv-tax", "lutren", "gstr9"],
  corvid: ["tds-pay", "gstr1", "gstr3b", "pf-esi", "tds-24q", "ecb2", "aoc4", "mgt7", "dpt3", "fla"],
  delta: ["tds-pay", "gstr1", "gstr3b", "pf-esi", "tds-26q", "aoc4", "mgt7", "seren", "posh"],
  fjord: ["tds-pay", "gstr1", "gstr3b", "pf-esi", "itc04", "softex", "msme1", "aoc4", "mgt7", "lutren"],
  saffron: ["tds-pay", "gstr1", "gstr3b", "pf-esi", "aoc4", "mgt7", "seren"],
  indigo: ["tds-pay", "gstr1", "gstr3b", "tds-26q", "mgt14", "aoc4", "mgt7"],
  coral: ["tds-pay", "gstr1", "gstr3b", "pf-esi", "adt1", "aoc4", "mgt7", "posh"],
};

/** Status, due date and period that differ from the Northwind base. */
const OB_OVR: Record<string, Record<string, [ObStatus, Date?, string?]>> = {
  zenith: { gstr3b: ["In progress"], dir3kyc: ["Filed"] },
  arcadia: { gstr3b: ["Overdue", d(2026, 9, 20), "Aug 2026"] },
  corvid: { gstr1: ["Filed"], "pf-esi": ["In progress"] },
  delta: { "pf-esi": ["Overdue", d(2026, 9, 15), "Aug 2026"] },
  fjord: { "pf-esi": ["Overdue", d(2026, 9, 15), "Aug 2026"], softex: ["In progress"] },
  saffron: { gstr3b: ["In progress"] },
  indigo: { "tds-pay": ["Filed"] },
  coral: { "pf-esi": ["In progress"] },
};

export interface StaffObligation extends Obligation {
  /** Base obligation id in compliance.ts. */
  obId: string;
  client: string;
}

const OB_KIND: Record<ObStatus, StepKind> = { Filed: "done", "In progress": "sbc", "Waiting on client": "client", Overdue: "client", Upcoming: "none" };
const OB_DOC: Record<ObStatus, DocStatus> = { Filed: "Accepted", "In progress": "Accepted", "Waiting on client": "Asked", Overdue: "Asked", Upcoming: "Not asked yet" };

function staffOb(c: StaffClient, o: Obligation): StaffObligation {
  const [status, due, period] = OB_OVR[c.id]?.[o.id] ?? [o.status];
  const dueAt = due ?? o.due;
  const changed = status !== o.status || !!due;
  const filed = status === "Filed" ? o.filed ?? earlier(addDays(dueAt, -2), addDays(TODAY, -1)) : undefined;
  return {
    ...o,
    id: `${c.id}-${o.id}`,
    obId: o.id,
    client: c.id,
    status,
    due: dueAt,
    period: period ?? o.period,
    filed,
    lastFiled: filed ?? o.lastFiled,
    owner: status === "Waiting on client" || status === "Overdue" ? "client" : "sbc",
    by: c.lead,
    steps: changed
      ? restate(o.steps, OB_KIND[status], c.short, addDays(dueAt, -12), c.lead, o.by, o.needs[0])
      : o.steps.map((x) => ({ ...x, by: x.by?.replace("Northwind", c.short).replaceAll(o.by, c.lead) })),
    docs: redoc(o.docs, OB_DOC[status], c.short, dueAt).filter((x) => status === "Filed" || !x.id.endsWith("-ack")),
  };
}

export const STAFF_OBLIGATIONS: StaffObligation[] = Object.entries(OB_SET).flatMap(([cid, ids]) => {
  const c = clientById(cid)!;
  return ids.map((id) => staffOb(c, OBLIGATIONS.find((o) => o.id === id)!));
});

export function obligationsFor(portal: StaffPortal, client = ""): StaffObligation[] {
  const ids = new Set(complianceClients(portal).map((c) => c.id));
  return STAFF_OBLIGATIONS.filter((o) => ids.has(o.client) && (!client || o.client === client));
}

export const staffObligation = (key: string) => STAFF_OBLIGATIONS.find((o) => o.id === key);

/* ---------- Filings ---------- */

/** Filings with a status that differs from the Northwind base. Key: "form|period". */
const FIL_OVR: Record<string, Record<string, FilingStatus>> = {
  zenith: { "DIR-3 KYC · Director 2|FY 2026-27": "Filed" },
  arcadia: { "GSTR-3B|Aug 2026": "Overdue" },
  corvid: { "GSTR-1|Sep 2026": "Filed" },
  delta: { "EPF ECR|Aug 2026": "Overdue", "ESI contribution|Aug 2026": "Overdue" },
  fjord: { "EPF ECR|Aug 2026": "Overdue" },
  indigo: { "TDS payment|Sep 2026": "Filed" },
};

/** Filings without an obligation id belong to the client that has this obligation. */
const FIL_PARENT: Record<string, string> = { "DIR-3 KYC · Director 1": "dir3kyc", "Professional tax": "pf-esi" };

export interface StaffFiling extends Filing {
  /** Base filing id in compliance.ts. */
  baseId: string;
  client: string;
  /** SBC person on it: the client's project lead. */
  owner: string;
}

const vary = (arn: string, k: number) => arn.slice(0, -3) + String(100 + ((Number(arn.slice(-3).replace(/\D/g, "")) || 0) + k * 137) % 900).padStart(3, "0");

export const STAFF_FILINGS: StaffFiling[] = Object.entries(OB_SET).flatMap(([cid, ids], k) => {
  const c = clientById(cid)!;
  return FILINGS.filter((f) => ids.includes(f.obligationId ?? FIL_PARENT[f.form] ?? "")).map((f): StaffFiling => {
    const status = FIL_OVR[cid]?.[`${f.form}|${f.period}`] ?? f.status;
    const filed = status === "Filed" ? f.filed ?? earlier(addDays(f.due, -2), addDays(TODAY, -1)) : undefined;
    const arn = status === "Filed" ? vary(f.arn ?? `AA36${String(k + 1).padStart(2, "0")}1026${f.id.slice(1)}0412`, k) : undefined;
    return { ...f, id: `${cid}-${f.id}`, baseId: f.id, client: cid, owner: c.lead, status, filed, arn, docs: status === "Filed" ? f.docs || 1 : 0 };
  });
});

export function filingsFor(portal: StaffPortal, client = ""): StaffFiling[] {
  const ids = new Set(complianceClients(portal).map((c) => c.id));
  return STAFF_FILINGS.filter((f) => ids.has(f.client) && (!client || f.client === client)).sort((a, b) => a.due.getTime() - b.due.getTime());
}

/* ---------- Calendar ---------- */

export interface StaffEvent extends CalendarEvent {
  client: string;
  /** Staff obligation key, for the link. */
  obKey?: string;
}

const AREAS_OF = (ids: string[]): Set<Area> => new Set(OBLIGATIONS.filter((o) => ids.includes(o.id)).map((o) => o.area));

export const STAFF_CALENDAR: StaffEvent[] = Object.entries(OB_SET)
  .flatMap(([cid, ids]) => {
    const areas = AREAS_OF(ids);
    return CALENDAR.filter((e) => (e.obligationId ? ids.includes(e.obligationId) : areas.has(e.kind))).map((e): StaffEvent => {
      const fil = e.id.startsWith("c-f") ? STAFF_FILINGS.find((f) => f.id === `${cid}-${e.id.slice(2)}`) : undefined;
      return { ...e, id: `${cid}-${e.id}`, client: cid, status: fil?.status ?? e.status, obKey: e.obligationId ? `${cid}-${e.obligationId}` : undefined };
    });
  })
  .sort((a, b) => a.date.getTime() - b.date.getTime());

export function calendarFor(portal: StaffPortal, client = ""): StaffEvent[] {
  const ids = new Set(complianceClients(portal).map((c) => c.id));
  return STAFF_CALENDAR.filter((e) => ids.has(e.client) && (!client || e.client === client));
}

/* ---------- Registrations ---------- */

/** Column order of REG_CODES in staff-clients.ts, as registration ids. */
const REG_IDS = ["gst", "lut", "epf", "esi", "pt", "se", "msme", "iec", "tm"];

const CODE_STATUS: Record<string, RegStatus | undefined> = { d: "Granted", p: "In progress", w: "Waiting on client" };
const REG_KIND: Record<RegStatus, StepKind> = { Granted: "done", "In progress": "sbc", "Waiting on client": "client", "Not started": "none", "Not needed": "none" };
const REG_DOC: Record<RegStatus, DocStatus> = { Granted: "Accepted", "In progress": "Accepted", "Waiting on client": "Asked", "Not started": "Not asked yet", "Not needed": "Not asked yet" };

export interface StaffRegistration extends Registration {
  /** Base registration id in registrations.ts. */
  regId: string;
  client: string;
}

export const STAFF_REGISTRATIONS: StaffRegistration[] = Object.entries(REG_CODES).flatMap(([cid, codes], k) => {
  const c = clientById(cid)!;
  return [...codes].flatMap((code, i): StaffRegistration[] => {
    const status = CODE_STATUS[code];
    const r = REGISTRATIONS.find((x) => x.id === REG_IDS[i]);
    if (!status || !r) return [];
    const granted = status === "Granted" ? r.granted ?? d(2026, 6 + ((k + i) % 3), 4 + ((k * 5 + i * 3) % 22)) : undefined;
    const next = status === "Granted" ? r.next : addDays(c.next, i % 3);
    const end = granted ?? next ?? TODAY;
    const nextLabel = status === "Granted" ? `Granted ${fmt(granted!)}` : status === "Waiting on client" ? `Documents due ${fmt(next!)}` : `Expected ${fmt(next!)}`;
    const asked = r.docs.filter((x) => x.from === "client").slice(0, 2).map((x) => x.name);
    return [
      {
        ...r,
        id: `${cid}-${r.id}`,
        regId: r.id,
        client: cid,
        status,
        granted,
        next,
        nextLabel,
        started: addDays(end, -14),
        owner: status === "Waiting on client" ? "client" : "sbc",
        idValue: status === "Granted" ? (r.id === "gst" ? c.gstin : r.idValue) : undefined,
        by: c.lead,
        steps: restate(r.steps, REG_KIND[status], c.short, addDays(end, -14), c.lead, r.by, asked.join(", ") || undefined),
        docs: redoc(r.docs, REG_DOC[status], c.short, end).map((x) => (status === "Waiting on client" && !asked.includes(x.name) && x.from === "client" ? { ...x, status: "Accepted", date: addDays(end, -12) } : x)),
      },
    ];
  });
});

export function registrationsFor(portal: StaffPortal, client = ""): StaffRegistration[] {
  const ids = new Set(myClients(portal).map((c) => c.id));
  return STAFF_REGISTRATIONS.filter((r) => ids.has(r.client) && (!client || r.client === client));
}

export const staffRegistration = (key: string) => STAFF_REGISTRATIONS.find((r) => r.id === key);
