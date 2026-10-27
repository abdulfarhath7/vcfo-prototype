"use client";
import { AlertTriangle, Award, Building2, Gauge, ShieldCheck, ShieldAlert, Users } from "lucide-react";
import { TODAY, fmt } from "@/lib/dates";
import { Cols, Col } from "@/components/shell/Page";
import { Chip } from "@/components/ui/Chip";
import { GreetingCard, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, HeadLink, ListRow } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { ProgressList } from "@/components/cards/ProgressList";
import { StackedBar } from "@/components/cards/StackedBar";
import { AREA_HEALTH_TONE, AREA_ROWS, CAP, FILINGS, FIRM_CLIENTS, HEALTH_TONE, MANAGERS, RISKS, SEVERITY_TONE, STAFF, type AreaRow } from "@/data/super";
import { clientHref } from "./parts";

const areaCols: Column<AreaRow>[] = [
  { key: "area", label: "Area", render: (r) => <span className="font-semibold">{r.area}</span> },
  { key: "active", label: "Active clients", align: "right", width: 120 },
  { key: "done", label: "Done this month", align: "right", width: 130, render: (r) => r.doneThisMonth },
  { key: "overdue", label: "Overdue", align: "right", width: 90, render: (r) => <span className={r.overdue ? "font-semibold text-bad" : undefined}>{r.overdue}</span> },
  {
    key: "health",
    label: "Health",
    width: 130,
    render: (r) => (
      <Chip fixed tone={AREA_HEALTH_TONE[r.health]}>
        {r.health}
      </Chip>
    ),
  },
  { key: "lead", label: "Lead manager", width: 140 },
];

export function OverviewScreen() {
  const incorporating = FIRM_CLIENTS.filter((c) => c.stage === "incorporating").length;
  const overdueFilings = FILINGS.filter((f) => f.status === "Overdue").length;
  const openRisks = RISKS.filter((r) => r.status === "Open");
  const used = MANAGERS.reduce((a, m) => a + FIRM_CLIENTS.filter((c) => c.manager === m.name).length, 0);
  const utilisation = Math.round((used / (MANAGERS.length * CAP)) * 100);

  const stats: StatItem[] = [
    { label: "Clients", value: FIRM_CLIENTS.length, Icon: Building2, tone: "blue", href: "/super/clients" },
    { label: "Incorporating", value: incorporating, Icon: Award, tone: "violet", href: "/super/practice/incorporation" },
    { label: "In compliance", value: FIRM_CLIENTS.length - incorporating, Icon: ShieldCheck, tone: "green", href: "/super/practice/compliances" },
    { label: "Overdue filings", value: overdueFilings, Icon: AlertTriangle, tone: "red", bad: overdueFilings > 0, href: "/super/practice/compliances" },
    { label: "Risks open", value: openRisks.length, Icon: ShieldAlert, tone: "amber", href: "/super/risks" },
    { label: "Team utilisation", value: `${utilisation}%`, Icon: Gauge, tone: "teal", href: "/super/team" },
  ];

  const attention: AttentionRow[] = FIRM_CLIENTS.filter((c) => c.health === "Stuck" || c.health === "Overdue" || c.health === "With client")
    .sort((a, b) => a.next.getTime() - b.next.getTime())
    .slice(0, 6)
    .map((c) => {
      const urgent = c.health === "Stuck" || c.health === "Overdue";
      return {
        id: c.id,
        date: c.next,
        title: c.name,
        sub: `${c.step} · ${c.manager}`,
        chip: { label: c.health, tone: HEALTH_TONE[c.health] },
        urgent,
        action: urgent ? { label: "Open", href: clientHref(c.id) } : undefined,
        href: urgent ? undefined : clientHref(c.id),
      };
    });

  const load = MANAGERS.map((m) => {
    const s = STAFF.find((x) => x.id === m.id)!;
    const n = FIRM_CLIENTS.filter((c) => c.manager === m.name).length;
    const pct = Math.round((n / CAP) * 100);
    return {
      id: m.id,
      name: m.name,
      pct,
      sub: `${n} clients · ${s.open} open · ${s.overdue} overdue`,
      tone: pct > 80 ? ("bad" as const) : pct >= 70 ? ("warn" as const) : ("accent" as const),
      href: "/super/team",
    };
  });

  const count = (s: string) => FILINGS.filter((f) => f.status === s).length;

  return (
    <div className="grid grid-cols-1 gap-5">
      <GreetingCard date={TODAY} name="SBC · firm overview" stats={stats} />
      <Cols>
        <Col>
          <DataGrid title="Practice areas" columns={areaCols} rows={AREA_ROWS} rowKey={(r) => r.area} rowHref={(r) => r.href} />
          <SectionCard title="Clients needing attention" flush right={<HeadLink href="/super/clients">Clients ›</HeadLink>}>
            <AttentionList rows={attention} />
          </SectionCard>
        </Col>
        <Col>
          <SectionCard title="Risks" meta={`${openRisks.length} open`} flush right={<HeadLink href="/super/risks">All risks ›</HeadLink>}>
            {openRisks.map((r) => (
              <ListRow key={r.id} href="/super/risks">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.title}</span>
                  <span className="block truncate text-12.5 text-muted">
                    {r.clientName} · since {fmt(r.since)}
                  </span>
                </span>
                <Chip tone={SEVERITY_TONE[r.severity]}>{r.severity}</Chip>
              </ListRow>
            ))}
          </SectionCard>
          <SectionCard title="Team load" flush icon={{ Icon: Users, tone: "violet" }}>
            <ProgressList items={load} />
          </SectionCard>
          <SectionCard title="Filings this month" meta="October">
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
          </SectionCard>
        </Col>
      </Cols>
    </div>
  );
}
