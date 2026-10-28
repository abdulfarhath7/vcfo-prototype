"use client";
import { CircleAlert, Gauge, KeyRound, MessageSquareWarning, Plug, Server } from "lucide-react";
import { STAFF_TODAY, fmt, urgency } from "@/lib/dates";
import {
  API_KEYS,
  CHANNEL_TEMPLATES,
  CONNECTIONS,
  CONN_TONE,
  COSTS,
  COST_TOTAL,
  DEPLOYS,
  DEPLOY_TONE,
  ENVIRONMENTS,
  ENV_TONE,
  INCIDENTS,
  JOBS,
  MESSAGES,
  SERVICES,
  SVC_TONE,
  rupees,
  stamp,
  type Environment,
  type Incident,
  type Service,
} from "@/data/dev";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, Tag } from "@/components/ui/Chip";
import { GreetingCard, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, HeadLink, ListRow } from "@/components/cards/SectionCard";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { StackedBar, type Segment } from "@/components/cards/StackedBar";
import { StatusChip } from "./parts";

const DAY = 86400000;

function attentionRows(): AttentionRow[] {
  const rows: AttentionRow[] = [];
  for (const j of JOBS.filter((x) => x.status === "Failed"))
    rows.push({ id: `job-${j.id}`, date: j.lastRun ?? STAFF_TODAY, tint: "bad", title: `${j.name} failed`, sub: `Last run ${stamp(j.lastRun ?? STAFF_TODAY)} · ${j.failures7d} failures in 7 days`, chip: { label: "Failed", tone: "bad" }, urgent: true, action: { label: "Open", href: "/dev/jobs" } });
  for (const k of API_KEYS.filter((x) => x.missing))
    rows.push({ id: `key-${k.id}`, date: STAFF_TODAY, tint: "bad", title: `${k.name} is not set`, sub: `${k.scope} fail to decrypt in production. Set the key, then redeploy.`, chip: { label: "Missing", tone: "bad" }, urgent: true, action: { label: "Open", href: "/dev/access" } });
  for (const c of CONNECTIONS.filter((x) => x.status === "Offline" || x.status === "Needs re-auth"))
    rows.push({ id: `conn-${c.id}`, date: c.status === "Offline" ? c.lastSync : (c.authExpires ?? STAFF_TODAY), title: c.name, sub: c.status === "Offline" ? `Offline since ${fmt(c.lastSync)} · 6 invoices waiting` : `Token expires ${fmt(c.authExpires ?? STAFF_TODAY)} · digests and escalations stop after that`, chip: { label: c.status, tone: CONN_TONE[c.status] }, href: `/dev/connections?c=${c.id}` });
  const waiting = CHANNEL_TEMPLATES.filter((t) => t.status === "Waiting");
  if (waiting.length)
    rows.push({ id: "wa-tpl", date: waiting[0].since ?? STAFF_TODAY, title: `${waiting.length} WhatsApp templates wait for Meta approval`, sub: "Deadline reminders and payment links on WhatsApp are blocked", chip: { label: "Waiting", tone: "teal" }, href: "/dev/connections?c=wa" });
  for (const k of API_KEYS.filter((x) => x.purge))
    rows.push({ id: `purge-${k.id}`, date: STAFF_TODAY, title: `${k.name} still work on production`, sub: "Purge them before real users sign in", chip: { label: "Before launch", tone: "warn" }, href: "/dev/access" });
  for (const k of API_KEYS.filter((x) => x.expires && !x.missing && x.expires.getTime() - STAFF_TODAY.getTime() < 60 * DAY && !CONNECTIONS.some((c) => c.status !== "Connected" && c.authExpires?.getTime() === x.expires?.getTime())))
    rows.push({ id: `exp-${k.id}`, date: k.expires as Date, title: `${k.name} expires`, sub: k.scope, chip: { label: `In ${Math.round(((k.expires as Date).getTime() - STAFF_TODAY.getTime()) / DAY)} days`, tone: "idle" }, href: "/dev/access" });
  // Tint each date tile against the console day (STAFF_TODAY), not the client day.
  return rows.map((r) => ({ ...r, tint: r.tint ?? urgency(r.date, STAFF_TODAY) }));
}

const serviceColumns: Column<Service>[] = [
  {
    key: "name",
    label: "Service",
    render: (s) => (
      <span className="block min-w-[180px]">
        <b className="font-medium">{s.name}</b>
        <span className="block text-12 text-muted">{s.what}</span>
      </span>
    ),
  },
  { key: "status", label: "Status", width: 124, render: (s) => <StatusChip wide tone={SVC_TONE[s.status]}>{s.status}</StatusChip> },
  { key: "up", label: "Uptime, 30 days", align: "right", render: (s) => <span className={s.uptime < 99.5 ? "font-medium text-warn" : undefined}>{`${s.uptime}%`}</span> },
  { key: "p95", label: "p95", align: "right", render: (s) => <span className="whitespace-nowrap">{s.p95 ? `${s.p95.toLocaleString("en-IN")} ms` : "-"}</span> },
  { key: "note", label: "Note", render: (s) => <span className="block min-w-[200px] text-12.5 text-ink-2">{s.note}</span> },
];

const incidentColumns: Column<Incident>[] = [
  { key: "date", label: "Date", render: (i) => <span className="whitespace-nowrap">{fmt(i.date)}</span> },
  {
    key: "what",
    label: "What happened",
    render: (i) => (
      <span className="block min-w-[220px]">
        {i.what}
        <span className="block text-12 text-muted">
          {i.where} · {i.length}
        </span>
      </span>
    ),
  },
  { key: "status", label: "Status", width: 124, render: (i) => <StatusChip tone={i.status === "Resolved" ? "ok" : "warn"}>{i.status}</StatusChip> },
];

export const envColumns: Column<Environment>[] = [
  { key: "name", label: "Environment", render: (e) => <span className="whitespace-nowrap font-medium">{e.name}</span> },
  { key: "addr", label: "Address", mono: true, render: (e) => <span className="whitespace-nowrap">{e.address}</span> },
  { key: "ver", label: "Version", mono: true, render: (e) => <span className="whitespace-nowrap">{e.version}</span> },
  { key: "sha", label: "Commit", mono: true, render: (e) => <span className="whitespace-nowrap text-muted">{e.commit}</span> },
  { key: "when", label: "Deployed", render: (e) => <span className="whitespace-nowrap">{e.deployed ? stamp(e.deployed) : "-"}</span> },
  { key: "by", label: "By", render: (e) => e.by },
];

export function OverviewScreen() {
  const live = CONNECTIONS.filter((c) => c.status !== "Not connected");
  const healthy = live.filter((c) => c.status === "Connected").length;
  const failed = JOBS.filter((j) => j.status === "Failed" && j.lastRun && j.lastRun.toDateString() === STAFF_TODAY.toDateString()).length;
  const working = SERVICES.filter((x) => x.status === "Working").length;
  const msgFailed = MESSAGES.filter((m) => m.status === "Failed").length;
  const secrets = API_KEYS.filter((k) => k.missing || k.purge || (k.expires && k.expires.getTime() - STAFF_TODAY.getTime() < 15 * DAY)).length;

  // R-17 (H3): the home card on the wash, with KP1 tiles.
  const stats: StatItem[] = [
    { label: "Services working", value: working, of: `/ ${SERVICES.length}`, Icon: Server, tone: "green" },
    { label: "Connections healthy", value: healthy, of: `/ ${live.length}`, Icon: Plug, tone: "blue", href: "/dev/connections" },
    { label: "Jobs failed today", value: failed, Icon: CircleAlert, tone: "red", bad: failed > 0, href: "/dev/jobs" },
    { label: "Messages failed today", value: msgFailed, Icon: MessageSquareWarning, tone: "amber", bad: msgFailed > 0, href: "/dev/messages" },
    { label: "Secrets to fix", value: secrets, Icon: KeyRound, tone: "violet", bad: secrets > 0, href: "/dev/access" },
    { label: "Error rate, 24 hours", value: "0.4%", Icon: Gauge, tone: "teal", href: "/dev/logs" },
  ];
  const groups: Array<[Segment["label"], Segment["tone"]]> = [
    ["Claude API", "violet"],
    ["App Runner", "navy"],
    ["Database", "accent"],
    ["Messaging", "teal"],
    ["Other", "idle"],
  ];
  const segments: Segment[] = groups.map(([label, tone]) => ({ label, tone, value: COSTS.filter((c) => c.group === label).reduce((a, c) => a + c.thisMonth, 0) }));

  const conns = [...live].sort((a, b) => Number(a.status === "Connected") - Number(b.status === "Connected"));

  return (
    <div className="grid grid-cols-1 gap-5">
      <GreetingCard date={STAFF_TODAY} time="12:31 PM" name="Developer console" tag={<Chip tone="ok">Production 2026.10.21</Chip>} stats={stats} />
      <DataGrid title="Services health" meta="Last 30 days" columns={serviceColumns} rows={SERVICES} rowKey={(s) => s.id} />
      <Cols>
        <Col>
          <SectionCard title="Needs attention" flush>
            <AttentionList rows={attentionRows()} />
          </SectionCard>
          <DataGrid title="Incidents" meta="Last 30 days" columns={incidentColumns} rows={INCIDENTS} rowKey={(i) => i.id} filters={<HeadLink href="/dev/logs">Logs ›</HeadLink>} />
          <SectionCard title="Recent deploys" flush right={<HeadLink href="/dev/deploys">Deploys ›</HeadLink>}>
            {DEPLOYS.slice(0, 5).map((d) => (
              <ListRow key={d.id} href="/dev/deploys">
                <span className="w-[120px] flex-none truncate font-mono text-13 font-medium">{d.version}</span>
                <Tag tone={ENV_TONE[d.env]} className="hidden w-[104px] sm:inline-flex">
                  {d.env}
                </Tag>
                <span className="min-w-0 flex-1 truncate text-12.5 text-muted">
                  {stamp(d.at)} · {d.by}
                </span>
                <StatusChip tone={DEPLOY_TONE[d.status]}>{d.status}</StatusChip>
              </ListRow>
            ))}
          </SectionCard>
        </Col>
        <Col>
          <SectionCard title="Connections" meta={`${healthy} of ${live.length} healthy`} flush right={<HeadLink href="/dev/connections">All ›</HeadLink>}>
            {conns.map((c) => (
              <ListRow key={c.id} href={`/dev/connections?c=${c.id}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block truncate text-12.5 text-muted">Last sync {stamp(c.lastSync)}</span>
                </span>
                <StatusChip wide tone={CONN_TONE[c.status]}>{c.status}</StatusChip>
              </ListRow>
            ))}
          </SectionCard>
          <SectionCard title="Costs this month" meta="1 to 16 Oct">
            <StackedBar total={rupees(COST_TOTAL)} segments={segments} format={rupees} />
          </SectionCard>
        </Col>
      </Cols>
      <DataGrid title="Environments" columns={envColumns} rows={ENVIRONMENTS} rowKey={(e) => e.id} />
    </div>
  );
}
