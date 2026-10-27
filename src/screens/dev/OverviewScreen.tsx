"use client";
import { CircleAlert, Gauge, IndianRupee, Plug, Rocket } from "lucide-react";
import { TODAY, fmt } from "@/lib/dates";
import { API_KEYS, CONNECTIONS, CONN_TONE, COSTS, COST_TOTAL, DEPLOYS, DEPLOY_TONE, ENV_TONE, JOBS, rupees, stamp } from "@/data/dev";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, Tag } from "@/components/ui/Chip";
import { GreetingCard, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, HeadLink, ListRow } from "@/components/cards/SectionCard";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { StackedBar, type Segment } from "@/components/cards/StackedBar";

const DAY = 86400000;

function attentionRows(): AttentionRow[] {
  const rows: AttentionRow[] = [];
  for (const j of JOBS.filter((x) => x.status === "Failed"))
    rows.push({ id: `job-${j.id}`, date: j.lastRun ?? TODAY, tint: "bad", title: `${j.name} failed`, sub: `Last run ${stamp(j.lastRun ?? TODAY)} · ${j.failures7d} failures in 7 days`, chip: { label: "Failed", tone: "bad" }, urgent: true, action: { label: "Open", href: "/dev/jobs" } });
  for (const k of API_KEYS.filter((x) => x.missing))
    rows.push({ id: `key-${k.id}`, date: TODAY, tint: "bad", title: `${k.name} is not set`, sub: k.scope, chip: { label: "Missing", tone: "bad" }, urgent: true, action: { label: "Open", href: "/dev/access" } });
  for (const c of CONNECTIONS.filter((x) => x.status !== "Connected"))
    rows.push({ id: `conn-${c.id}`, date: c.status === "Offline" ? c.lastSync : (c.authExpires ?? TODAY), title: c.name, sub: c.status === "Offline" ? `Last sync ${stamp(c.lastSync)}` : `Token expires ${fmt(c.authExpires ?? TODAY)}`, chip: { label: c.status, tone: CONN_TONE[c.status] }, href: "/dev/connections" });
  for (const k of API_KEYS.filter((x) => x.expires && !x.missing && x.expires.getTime() - TODAY.getTime() < 60 * DAY && !CONNECTIONS.some((c) => c.status !== "Connected" && c.authExpires?.getTime() === x.expires?.getTime())))
    rows.push({ id: `exp-${k.id}`, date: k.expires as Date, title: `${k.name} expires`, sub: k.scope, chip: { label: `In ${Math.round(((k.expires as Date).getTime() - TODAY.getTime()) / DAY)} days`, tone: "idle" }, href: "/dev/access" });
  return rows;
}

export function OverviewScreen() {
  const healthy = CONNECTIONS.filter((c) => c.status === "Connected").length;
  const failed = JOBS.filter((j) => j.status === "Failed" && j.lastRun && j.lastRun.toDateString() === TODAY.toDateString()).length;
  const weekStart = new Date(TODAY.getTime() - ((TODAY.getDay() + 6) % 7) * DAY);
  const deploysWeek = DEPLOYS.filter((d) => d.at >= weekStart).length;

  const stats: StatItem[] = [
    { label: "Connections healthy", value: healthy, of: `/ ${CONNECTIONS.length}`, Icon: Plug, tone: "green", href: "/dev/connections" },
    { label: "Jobs failed today", value: failed, Icon: CircleAlert, tone: "red", bad: failed > 0, href: "/dev/jobs" },
    { label: "Deploys this week", value: deploysWeek, Icon: Rocket, tone: "blue", href: "/dev/deploys" },
    { label: "Error rate, 24 hours", value: "0.4%", Icon: Gauge, tone: "amber", href: "/dev/logs" },
    { label: "Cost this month", value: rupees(COST_TOTAL), Icon: IndianRupee, tone: "violet", href: "/dev/data" },
  ];

  const groups: Array<[Segment["label"], Segment["tone"]]> = [
    ["Claude API", "violet"],
    ["App Runner", "navy"],
    ["Database", "accent"],
    ["Messaging", "teal"],
    ["Other", "idle"],
  ];
  const segments: Segment[] = groups.map(([label, tone]) => ({ label, tone, value: COSTS.filter((c) => c.group === label).reduce((a, c) => a + c.thisMonth, 0) }));

  const conns = [...CONNECTIONS].sort((a, b) => Number(a.status === "Connected") - Number(b.status === "Connected"));

  return (
    <div className="grid grid-cols-1 gap-5">
      <GreetingCard date={TODAY} name="Developer console" tag={<Chip tone="ok" className="bg-white/[.12] text-white">Production 2026.10.05</Chip>} stats={stats} />
      <Cols>
        <Col>
          <SectionCard title="Needs attention" flush>
            <AttentionList rows={attentionRows()} />
          </SectionCard>
          <SectionCard title="Recent deploys" flush right={<HeadLink href="/dev/deploys">Deploys ›</HeadLink>}>
            {DEPLOYS.slice(0, 5).map((d) => (
              <ListRow key={d.id} href="/dev/deploys">
                <span className="w-[120px] flex-none truncate font-mono text-12.5 font-semibold">{d.version}</span>
                <Tag tone={ENV_TONE[d.env]} className="hidden sm:inline-flex">
                  {d.env}
                </Tag>
                <span className="min-w-0 flex-1 truncate text-12.5 text-muted">
                  {stamp(d.at)} · {d.by}
                </span>
                <Chip tone={DEPLOY_TONE[d.status]}>{d.status}</Chip>
              </ListRow>
            ))}
          </SectionCard>
        </Col>
        <Col>
          <SectionCard title="Connections" meta={`${healthy} of ${CONNECTIONS.length} healthy`} flush right={<HeadLink href="/dev/connections">All ›</HeadLink>}>
            {conns.map((c) => (
              <ListRow key={c.id} href="/dev/connections">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.name}</span>
                  <span className="block truncate text-12.5 text-muted">Last sync {stamp(c.lastSync)}</span>
                </span>
                <Chip tone={CONN_TONE[c.status]}>{c.status}</Chip>
              </ListRow>
            ))}
          </SectionCard>
          <SectionCard title="Costs this month" meta="1 to 6 Oct">
            <StackedBar total={rupees(COST_TOTAL)} segments={segments} />
          </SectionCard>
        </Col>
      </Cols>
    </div>
  );
}
