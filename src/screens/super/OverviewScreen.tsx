"use client";
import { AlertTriangle, Award, Building2, Gauge, IdCard, ShieldCheck, ShieldAlert, UserCog, Users } from "lucide-react";
import { TODAY } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col, Row } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Bar } from "@/components/ui/Bar";
import { Chip, Tag } from "@/components/ui/Chip";
import { GreetingCard, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, HeadLink, ListRow } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { ActivityList } from "@/components/cards/ActivityList";
import { StackedBar } from "@/components/cards/StackedBar";
import { AREA_HEALTH_TONE, AREA_ROWS, CAP, FILINGS, FIRM_CLIENTS, HEALTH_TONE, MANAGERS, REGS, SEVERITY_TONE, type AreaRow } from "@/data/super";
import {
  ADMINS,
  ADMIN_FEED,
  AVG_DAYS_TO_COI,
  INC_PIPELINE,
  MANAGER_ROWS,
  RISK_KIND_LABEL,
  RISK_KIND_TONE,
  TOP_RISKS,
  ageOf,
  clientsOfAdmin,
  codeOf,
  holderOf,
  kindOf,
  statuteRows,
  type Admin,
  type ManagerRow,
} from "@/data/super-firm";
import { clientHref } from "./parts";

// Ported from reference/old-patch/super/Main.dc.html: greeting with change against September, the three practice cards,
// "Admins · this month", "Managers", "Top risks", clients needing attention, plus the admin activity feed from Team.

const areaCols: Column<AreaRow>[] = [
  { key: "area", label: "Area", render: (r) => <span className="font-semibold">{r.area}</span> },
  { key: "active", label: "Active clients", align: "right", width: 120 },
  { key: "done", label: "Done this month", align: "right", width: 130, render: (r) => r.doneThisMonth },
  { key: "overdue", label: "Overdue", align: "right", width: 90, render: (r) => <span className={r.overdue ? "font-semibold text-bad" : undefined}>{r.overdue}</span> },
  { key: "health", label: "Health", width: 130, render: (r) => <Chip fixed tone={AREA_HEALTH_TONE[r.health]}>{r.health}</Chip> },
  { key: "lead", label: "Lead manager", width: 140 },
];

const nameCell = (name: string, sub: string) => (
  <span className="flex min-w-0 items-center gap-2.5">
    <Avatar name={name} size={24} />
    <span className="min-w-0">
      <span className="block truncate font-semibold">{name}</span>
      <span className="block truncate text-12 text-muted">{sub}</span>
    </span>
  </span>
);

export const adminCols: Column<Admin>[] = [
  { key: "name", label: "Admin", render: (a) => nameCell(a.name, a.managers.join(", ")) },
  { key: "clients", label: "Clients", align: "right", width: 80, render: (a) => clientsOfAdmin(a) },
  { key: "assigned", label: "Assigned", align: "right", width: 90 },
  { key: "approvals", label: "Approvals", align: "right", width: 96 },
  { key: "open", label: "Open esc.", align: "right", width: 90, render: (a) => <span className={cn(a.open && "font-semibold text-bad")}>{a.open}</span> },
  { key: "response", label: "Response", align: "right", width: 96 },
];

const managerCols: Column<ManagerRow>[] = [
  { key: "name", label: "Manager", render: (m) => nameCell(m.name, `under ${m.admin}`) },
  { key: "clients", label: "Clients", align: "right", width: 76 },
  { key: "open", label: "Open", align: "right", width: 70 },
  { key: "late", label: "Late", align: "right", width: 64, render: (m) => <span className={cn(m.late && "font-semibold text-bad")}>{m.late}</span> },
  { key: "onTime", label: "On time", align: "right", width: 80, render: (m) => `${m.onTime}%` },
  { key: "load", label: "Load", width: 110, render: (m) => <Bar pct={m.load} tone={m.load > 80 ? "bad" : m.load >= 70 ? "warn" : "accent"} className="w-20" /> },
];

export function OverviewScreen() {
  const incorporating = FIRM_CLIENTS.filter((c) => c.stage === "incorporating");
  const overdueFilings = FILINGS.filter((f) => f.status === "Overdue").length;
  const filed = FILINGS.filter((f) => f.status === "Filed").length;
  const onTimePct = Math.round((filed / Math.max(1, filed + overdueFilings)) * 100);
  const openRisks = TOP_RISKS.filter((r) => r.status === "Open");
  const used = MANAGERS.reduce((a, m) => a + FIRM_CLIENTS.filter((c) => c.manager === m.name).length, 0);
  const utilisation = Math.round((used / (MANAGERS.length * CAP)) * 100);

  let regDone = 0;
  let regProg = 0;
  let regWait = 0;
  FIRM_CLIENTS.forEach((c) => c.reg.split("").forEach((v) => (v === "d" ? regDone++ : v === "p" ? regProg++ : v === "w" ? regWait++ : 0)));
  const byType = REGS.map((t, i) => {
    let dn = 0;
    let p = 0;
    let w = 0;
    FIRM_CLIENTS.forEach((c) => (c.reg[i] === "d" ? dn++ : c.reg[i] === "p" ? p++ : c.reg[i] === "w" ? w++ : 0));
    return { t, d: dn, p, w, open: p + w };
  });
  const regTop = [...byType].sort((a, b) => b.open - a.open).slice(0, 4);
  const regWorst = [...byType].sort((a, b) => b.w - a.w)[0].t;
  const worstStatute = [...statuteRows()].sort((a, b) => b.overdue - a.overdue)[0];

  // Change against September (old DELTA) in the strip's small text.
  const stats: StatItem[] = [
    { label: "Clients", value: FIRM_CLIENTS.length, of: "+2 vs Sep", Icon: Building2, tone: "blue", href: "/super/clients" },
    { label: "Incorporating", value: incorporating.length, Icon: Award, tone: "violet", href: "/super/practice/incorporation" },
    { label: "Registrations open", value: regProg + regWait, of: "−3 vs Sep", Icon: IdCard, tone: "violet", href: "/super/practice/registrations" },
    { label: "Filed on time", value: `${onTimePct}%`, of: "+4 pts", Icon: ShieldCheck, tone: "green", href: "/super/practice/compliances" },
    { label: "Filings overdue", value: overdueFilings, of: "+1 vs Sep", Icon: AlertTriangle, tone: "red", bad: overdueFilings > 0, href: "/super/practice/compliances" },
    { label: "Risks open", value: openRisks.length, Icon: ShieldAlert, tone: "amber", href: "/super/risks" },
    { label: "Team utilisation", value: `${utilisation}%`, Icon: Gauge, tone: "teal", href: "/super/team" },
  ];

  const attention: AttentionRow[] = FIRM_CLIENTS.filter((c) => c.health === "Stuck" || c.health === "Overdue" || c.health === "Due soon" || c.health === "With client")
    .sort((a, b) => a.next.getTime() - b.next.getTime())
    .slice(0, 6)
    .map((c) => {
      const urgent = c.health === "Stuck" || c.health === "Overdue";
      return {
        id: c.id,
        date: c.next,
        title: c.name,
        sub: `${codeOf(c)} ${c.step} · ${c.manager}, ${holderOf(c)}`,
        chip: { label: c.health, tone: HEALTH_TONE[c.health] },
        urgent,
        action: urgent ? { label: "Open", href: clientHref(c.id) } : undefined,
        href: urgent ? undefined : clientHref(c.id),
      };
    });

  const count = (s: string) => FILINGS.filter((f) => f.status === s).length;
  const maxStage = Math.max(1, ...INC_PIPELINE.map((p) => incorporating.filter((c) => c.pipe === p.key).length));

  return (
    <div className="grid grid-cols-1 gap-5">
      <GreetingCard date={TODAY} name="SBC · firm overview" stats={stats} />

      <Row cols={3}>
        <SectionCard title="Incorporation" meta={String(incorporating.length)} icon={{ Icon: Award, tone: "violet" }} right={<HeadLink href="/super/practice/incorporation">Open ›</HeadLink>}>
          <ul className="grid gap-2.5">
            {INC_PIPELINE.map((p) => {
              const list = incorporating.filter((c) => c.pipe === p.key);
              return (
                <li key={p.key} className="grid grid-cols-[110px_1fr_24px] items-center gap-2 text-13" title={list.map((c) => c.name).join(", ") || "None"}>
                  <span className="truncate text-ink-2">{p.label}</span>
                  <Bar pct={(list.length / maxStage) * 100} tone="accent" />
                  <b className="text-right font-semibold">{list.length}</b>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 border-t border-line-soft pt-3 text-12.5 text-muted">
            Average <b className="font-semibold text-ink">{AVG_DAYS_TO_COI} days</b> to COI · target 30
          </p>
        </SectionCard>

        <SectionCard title="Registrations" icon={{ Icon: IdCard, tone: "violet" }} right={<HeadLink href="/super/practice/registrations">Open ›</HeadLink>}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { n: regDone, label: "Done", cls: "text-ok" },
              { n: regProg, label: "In progress", cls: "text-accent" },
              { n: regWait, label: "Pending", cls: "text-warn" },
            ].map((x) => (
              <div key={x.label}>
                <b className={cn("block text-[20px] font-semibold leading-none", x.cls)}>{x.n}</b>
                <span className="text-12 text-muted">{x.label}</span>
              </div>
            ))}
          </div>
          <ul className="mt-3 grid gap-2">
            {regTop.map((x) => (
              <li key={x.t} className="grid grid-cols-[70px_1fr_24px] items-center gap-2 text-13" title={`${x.t}: ${x.d} done, ${x.p} in progress, ${x.w} pending`}>
                <span className="truncate text-ink-2">{x.t}</span>
                <StackedBar
                  height={6}
                  segments={[
                    { label: "Done", value: x.d, tone: "ok" },
                    { label: "In progress", value: x.p, tone: "accent" },
                    { label: "Pending", value: x.w, tone: "warn" },
                  ]}
                  className="[&_ul]:hidden"
                />
                <b className="text-right font-semibold">{x.open}</b>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line-soft pt-3 text-12.5 text-muted">
            Most pending: <b className="font-semibold text-ink">{regWorst}</b>
          </p>
        </SectionCard>

        <SectionCard title="Compliances · October" icon={{ Icon: ShieldCheck, tone: "green" }} right={<HeadLink href="/super/practice/compliances">Open ›</HeadLink>}>
          <StackedBar
            total={FILINGS.length}
            segments={[
              { label: "Filed", value: count("Filed"), tone: "ok" },
              { label: "In progress", value: count("In progress"), tone: "accent" },
              { label: "With client", value: count("With client"), tone: "violet" },
              { label: "Due in 7 days", value: count("Due soon"), tone: "warn" },
              { label: "Overdue", value: count("Overdue"), tone: "bad" },
              { label: "Upcoming", value: count("Upcoming"), tone: "idle" },
            ]}
          />
          <p className="mt-3 border-t border-line-soft pt-3 text-12.5 text-muted">
            Worst statute: <b className="font-semibold text-ink">{worstStatute?.overdue ? worstStatute.statute : "None"}</b>
          </p>
        </SectionCard>
      </Row>

      <Cols>
        <Col>
          <DataGrid title="Admins · this month" icon={{ Icon: UserCog, tone: "violet" }} columns={adminCols} rows={ADMINS} rowKey={(a) => a.id} filters={<HeadLink href="/super/team">Open team ›</HeadLink>} />
          <DataGrid title="Managers" columns={managerCols} rows={MANAGER_ROWS} rowKey={(m) => m.id} rowHref={() => "/super/team"} />
          <DataGrid title="Practice areas" columns={areaCols} rows={AREA_ROWS} rowKey={(r) => r.area} rowHref={(r) => r.href} />
          <SectionCard title="Clients needing attention" flush right={<HeadLink href="/super/clients">Clients ›</HeadLink>}>
            <AttentionList rows={attention} />
          </SectionCard>
        </Col>
        <Col>
          <SectionCard title="Top risks" meta={String(TOP_RISKS.length)} flush right={<HeadLink href="/super/risks">All risks ›</HeadLink>}>
            {TOP_RISKS.slice(0, 5).map((r) => (
              <ListRow key={r.id} href="/super/risks">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {r.title}
                    {r.clientId ? ` · ${r.clientName}` : ""}
                  </span>
                  <span className="block truncate text-12.5 text-muted">
                    {r.owner} · {ageOf(r)}
                  </span>
                </span>
                <span className="flex flex-none flex-col items-end gap-1">
                  <Tag tone={RISK_KIND_TONE[kindOf(r)]}>{RISK_KIND_LABEL[kindOf(r)]}</Tag>
                  <Chip tone={SEVERITY_TONE[r.severity]}>{r.severity}</Chip>
                </span>
              </ListRow>
            ))}
          </SectionCard>
          <SectionCard title="What admins did" meta="This week" flush>
            <ActivityList rows={ADMIN_FEED.slice(0, 6)} />
          </SectionCard>
          <SectionCard title="Team load" flush icon={{ Icon: Users, tone: "violet" }}>
            <ul>
              {MANAGER_ROWS.map((m) => (
                <li key={m.id} className="border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
                  <span className="flex items-center gap-2 text-13.5">
                    <span className="min-w-0 flex-1 truncate font-semibold">{m.name}</span>
                    <span className="text-12.5 text-muted">
                      {m.clients} of {CAP}
                    </span>
                  </span>
                  <span className="block truncate text-12.5 text-muted">
                    {m.open} open · {m.late} overdue · room for {m.room}
                  </span>
                  <Bar pct={m.load} tone={m.load > 80 ? "bad" : m.load >= 70 ? "warn" : "accent"} className="mt-2" />
                </li>
              ))}
            </ul>
          </SectionCard>
        </Col>
      </Cols>
    </div>
  );
}
