import { fmt } from "@/lib/dates";
import { navFor, type NavItem, type Portal } from "@/data/nav";
import { STEPS } from "@/data/incorporation";
import { OBLIGATIONS, FILINGS } from "@/data/compliance";
import { REGISTRATIONS } from "@/data/registrations";
import { BOOKS, FILES } from "@/data/shared";
import { NORTHWIND } from "@/data/people";
import { STAFF_CLIENTS, clientsFor, type StaffClient, type StaffPortal } from "@/data/staff-clients";
import { TASKS } from "@/data/staff-tasks";
import { filingsFor, obligationsFor, registrationsFor, staffObHref, staffRegHref } from "@/data/staff-compliance";

// Search records for the palette (Ctrl K) on every portal.
// Ported from reference/old-screens/s/lead/Palette.dc.html: result groups Projects (clients), Documents, Knowledge bank, workbench pages.
// The staff palette adds Steps and Filings. The shared Palette (src/components/shell/Palette.tsx) reads `searchIndex(portal)` and `searchRecords`.

export type SearchGroup = "Clients" | "Steps" | "Filings" | "Obligations" | "Registrations" | "Documents" | "Knowledge bank" | "Pages";

/** Order of the result groups in the palette. */
export const GROUP_ORDER: SearchGroup[] = ["Clients", "Steps", "Filings", "Obligations", "Registrations", "Documents", "Knowledge bank", "Pages"];

export interface SearchRecord {
  id: string;
  group: SearchGroup;
  /** Main line. */
  title: string;
  /** Muted line: stage, client, period. */
  sub?: string;
  href: string;
  /** Extra words the query also matches: CIN, PAN, step code, form. */
  keywords?: string;
  /** Client identity colour (R-35), for the 8 px dot. */
  tone?: StaffClient["tone"];
  /** Identifier in IBM Plex Mono (R-28). */
  mono?: string;
}

const isStaff = (p: Portal): p is StaffPortal => p === "lead" || p === "manager" || p === "admin";

function pages(portal: Portal): SearchRecord[] {
  const walk = (items: NavItem[], trail: string[] = []): SearchRecord[] =>
    items.flatMap((it) => {
      const t = [...trail, it.label];
      if (it.kids) return walk(it.kids, t);
      return it.href ? [{ id: `page:${it.href}`, group: "Pages" as const, title: t.join(" · "), href: it.href }] : [];
    });
  const profile = `/${portal}/profile`;
  return [...walk(navFor(portal, false)), { id: `page:${profile}`, group: "Pages", title: "Profile", href: profile }, ...(portal === "client" ? [] : [{ id: `page:${profile}?tab=settings`, group: "Pages" as const, title: "Profile · Settings", href: `${profile}?tab=settings` }])];
}

function staffRecords(portal: StaffPortal): SearchRecord[] {
  const b = `/${portal}`;
  const cl = clientsFor(portal);
  const clients: SearchRecord[] = cl.map((c) => ({
    id: `client:${c.id}`,
    group: "Clients",
    title: c.name,
    sub: `${c.stage === "incorporating" ? "Incorporating" : "Compliance"} · ${c.code} ${c.step}`,
    href: `${b}/clients/${c.id}`,
    keywords: [c.short, c.cin, c.pan, c.gstin, c.lead, c.manager].filter(Boolean).join(" "),
    tone: c.tone,
    mono: c.cin,
  }));
  // Steps: every incorporation step for each incorporating client, plus the open step tasks of compliance clients.
  const steps: SearchRecord[] = cl
    .filter((c) => c.stage === "incorporating")
    .flatMap((c) =>
      STEPS.map((s) => ({
        id: `step:${c.id}:${s.n}`,
        group: "Steps" as const,
        title: `Step ${s.n} · ${s.title}`,
        sub: c.short,
        href: `${b}/clients/${c.id}/step/${s.n}`,
        keywords: `${c.name} pre-${s.n}`,
        tone: c.tone,
      })),
    );
  const ids = new Set(cl.map((c) => c.id));
  const tasks: SearchRecord[] = TASKS.filter((t) => ids.has(t.client) && t.code && !t.step && t.status !== "Done").map((t) => {
    const c = STAFF_CLIENTS.find((x) => x.id === t.client)!;
    return { id: `task:${t.id}`, group: "Steps", title: `${t.code} · ${t.title}`, sub: `${c.short} · due ${fmt(t.due)} · ${t.owner}`, href: `${b}/clients/${c.id}`, tone: c.tone };
  });
  const filings: SearchRecord[] = filingsFor(portal).map((f) => {
    const c = STAFF_CLIENTS.find((x) => x.id === f.client)!;
    return { id: `filing:${f.id}`, group: "Filings", title: `${f.form} · ${f.period}`, sub: `${c.short} · ${f.status} · due ${fmt(f.due)}`, href: `${b}/compliances/filings?client=${c.id}`, keywords: `${f.area} ${f.arn ?? ""}`, tone: c.tone, mono: f.arn };
  });
  const obligations: SearchRecord[] = obligationsFor(portal).map((o) => {
    const c = STAFF_CLIENTS.find((x) => x.id === o.client);
    return { id: `ob:${o.id}`, group: "Obligations", title: o.name, sub: `${c?.short ?? ""} · ${o.law} · due ${fmt(o.due)}`, href: staffObHref(portal, o.id), keywords: `${o.form} ${o.area}`, tone: c?.tone };
  });
  const regs: SearchRecord[] = registrationsFor(portal).map((r) => {
    const c = STAFF_CLIENTS.find((x) => x.id === r.client);
    return { id: `reg:${r.id}`, group: "Registrations", title: r.name, sub: `${c?.short ?? ""} · ${r.status}`, href: staffRegHref(portal, r.id), keywords: `${r.authority} ${r.form}`, tone: c?.tone };
  });
  const nw = cl.find((c) => c.id === "northwind");
  const docs: SearchRecord[] = FILES.map((f) => ({ id: `doc:${f.id}`, group: "Documents", title: f.name, sub: `Northwind${f.step ? ` · Step ${f.step}` : ""} · ${f.status}`, href: `${b}/documents/view/${f.id}`, tone: nw?.tone, mono: f.name }));
  const books: SearchRecord[] = BOOKS.map((k) => ({ id: `kb:${k.id}`, group: "Knowledge bank", title: k.title, sub: `${k.shelf} · ${k.pages} pages`, href: `${b}/docs/knowledge/${k.id}`, keywords: k.short }));
  return [...clients, ...steps, ...tasks, ...filings, ...obligations, ...regs, ...docs, ...books];
}

function clientRecords(): SearchRecord[] {
  return [
    ...STEPS.map((s) => ({ id: `step:${s.n}`, group: "Steps" as const, title: `Step ${s.n} · ${s.title}`, sub: s.status, href: `/client/incorporation/step/${s.n}` })),
    ...FILINGS.map((f) => ({ id: `filing:${f.id}`, group: "Filings" as const, title: `${f.form} · ${f.period}`, sub: `${f.status} · due ${fmt(f.due)}`, href: "/client/filings", mono: f.arn })),
    ...OBLIGATIONS.map((o) => ({ id: `ob:${o.id}`, group: "Obligations" as const, title: o.name, sub: `${o.law} · due ${fmt(o.due)}`, href: `/client/obligations/${o.id}`, keywords: o.form })),
    ...REGISTRATIONS.map((r) => ({ id: `reg:${r.id}`, group: "Registrations" as const, title: r.name, sub: r.authority, href: `/client/registrations/${r.id}`, keywords: r.form })),
    ...FILES.map((f) => ({ id: `doc:${f.id}`, group: "Documents" as const, title: f.name, sub: `${NORTHWIND.short}${f.step ? ` · Step ${f.step}` : ""} · ${f.status}`, href: `/client/documents/view/${f.id}`, mono: f.name })),
    ...BOOKS.map((k) => ({ id: `kb:${k.id}`, group: "Knowledge bank" as const, title: k.title, sub: k.shelf, href: `/client/library/${k.id}`, keywords: k.short })),
  ];
}

function superRecords(): SearchRecord[] {
  return STAFF_CLIENTS.map((c) => ({ id: `client:${c.id}`, group: "Clients" as const, title: c.name, sub: `${c.stage === "incorporating" ? "Incorporating" : "Compliance"} · ${c.manager}`, href: `/super/clients/${c.id}`, keywords: [c.short, c.cin, c.pan].filter(Boolean).join(" "), tone: c.tone, mono: c.cin }));
}

const cache = new Map<Portal, SearchRecord[]>();

/** Every searchable record of a portal. */
export function searchIndex(portal: Portal): SearchRecord[] {
  const hit = cache.get(portal);
  if (hit) return hit;
  const extra = isStaff(portal) ? staffRecords(portal) : portal === "client" ? clientRecords() : portal === "super" ? superRecords() : [];
  const all = [...extra, ...pages(portal)];
  cache.set(portal, all);
  return all;
}

/** Query the index: every word must match title, sub or keywords. Results stay in group order, `perGroup` each. */
export function searchRecords(portal: Portal, query: string, perGroup = 4): Array<{ group: SearchGroup; hits: SearchRecord[] }> {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const all = searchIndex(portal);
  const match = (r: SearchRecord) => {
    const hay = `${r.title} ${r.sub ?? ""} ${r.keywords ?? ""}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  };
  const rows = words.length ? all.filter(match) : all.filter((r) => r.group === "Pages");
  return GROUP_ORDER.map((group) => ({ group, hits: rows.filter((r) => r.group === group).slice(0, words.length ? perGroup : 12) })).filter((g) => g.hits.length > 0);
}
