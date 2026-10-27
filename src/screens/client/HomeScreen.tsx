"use client";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Award, Building2, CalendarCheck, Clock, FileText, ShieldCheck, Upload, User } from "lucide-react";
import { TODAY, fmt, relative, urgency } from "@/lib/dates";
import { NORTHWIND } from "@/data/people";
import { PHASES, MCA_REVIEW, COI_EXPECTED, TIMELINE, TIMELINE_TICKS, stepsOf, doneCount, stepTone, stepHref, phaseHref } from "@/data/incorporation";
import { ALERTS_15, ALERTS_30, NEEDS, SBC_DOING, DOCS, ACTIVITY, AFTER_ALERTS, AFTER_SBC_DOING, AFTER_NEEDS, type NeedRow } from "@/data/client-home";
import { useClientState } from "@/components/shell/ClientState";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { GreetingCard, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, HeadLink, ListRow, Empty } from "@/components/cards/SectionCard";
import { GanttTimeline, type GanttRow } from "@/components/cards/GanttTimeline";
import { PhaseRows, type Phase } from "@/components/cards/PhaseRows";
import { AttentionList } from "@/components/cards/AttentionList";
import { ProgressList } from "@/components/cards/ProgressList";
import { DocList } from "@/components/cards/DocList";
import { ActivityList } from "@/components/cards/ActivityList";
import { StackedBar } from "@/components/cards/StackedBar";
import { DateTile } from "@/components/cards/AttentionList";

function TimelineCard() {
  const rows: GanttRow[] = [
    { id: "p1", name: PHASES[0].short, status: "done", bars: [{ from: PHASES[0].start, to: PHASES[0].end, kind: "done" }], count: "5/5", note: { text: `Done ${fmt(PHASES[0].end)}` } },
    {
      id: "p2",
      name: PHASES[1].short,
      status: "current",
      bars: [
        { from: PHASES[1].start, to: TODAY, kind: "cur" },
        { from: TODAY, to: PHASES[1].end, kind: "rest" },
      ],
      count: "1/9",
      note: { text: "22%" },
    },
    { id: "mca", name: "MCA review", status: "planned", bars: [{ from: MCA_REVIEW.start, to: MCA_REVIEW.end, kind: "plan" }], milestone: COI_EXPECTED, note: { text: `COI ${fmt(COI_EXPECTED)}` } },
    { id: "p3", name: PHASES[2].short, status: "planned", bars: [{ from: PHASES[2].start, to: PHASES[2].end, kind: "plan" }], count: "0/11" },
  ];
  return (
    <SectionCard title="Timeline" flush right={<Button size="sm">Edit</Button>}>
      <GanttTimeline start={TIMELINE.start} end={TIMELINE.end} ticks={TIMELINE_TICKS} rows={rows} />
    </SectionCard>
  );
}

function StepsCard() {
  const phases: Phase[] = PHASES.map((p) => ({
    id: p.id,
    name: p.name,
    done: doneCount(p.n),
    total: stepsOf(p.n).length,
    status: p.status,
    tone: p.status === "Done" ? "ok" : p.status === "In progress" ? "prog" : "idle",
    href: phaseHref("client", p.n),
    steps: stepsOf(p.n).map((s) => ({ n: s.n, title: s.title, owner: s.owner, ownerLabel: s.owner === "client" ? "Northwind" : undefined, status: s.status, tone: stepTone[s.status], time: s.time, href: stepHref("client", s.n) })),
  }));
  return (
    <SectionCard title="Steps" flush right={<HeadLink href="/client/incorporation">Open incorporation ›</HeadLink>}>
      <PhaseRows phases={phases} openId="phase-2" />
    </SectionCard>
  );
}

function NeedsCard({ rows, title }: { rows: NeedRow[]; title: string }) {
  const [tab, setTab] = React.useState("all");
  const kinds = [
    { key: "all", label: "All", count: rows.length },
    { key: "upload", label: "Upload", count: rows.filter((r) => r.kind === "upload").length },
    { key: "sign", label: "Sign", count: rows.filter((r) => r.kind === "sign").length },
    { key: "approve", label: "Review", count: rows.filter((r) => r.kind === "approve").length },
  ].filter((k) => k.key === "all" || k.count > 0);
  const shown = rows.filter((r) => tab === "all" || r.kind === tab);
  return (
    <SectionCard title={title} flush right={<Tabs items={kinds} value={tab} onChange={setTab} />}>
      {shown.length === 0 ? (
        <Empty />
      ) : (
        shown.map((r) => {
          const u = urgency(r.due);
          return (
            <ListRow key={r.id}>
              <DateTile date={r.due} />
              <span className="min-w-0 flex-1 truncate font-semibold">{r.title}</span>
              <Chip tone={u === "bad" ? "bad" : u === "warn" ? "warn" : "idle"}>{relative(r.due)}</Chip>
              <Button asChild size="sm" variant={u === "bad" ? "primary" : "outline"}>
                <Link href={r.step ? `/client/incorporation/step/${r.step}` : "/client/documents"}>{r.action}</Link>
              </Button>
            </ListRow>
          );
        })
      )}
    </SectionCard>
  );
}

function AlertsCard({ before }: { before: boolean }) {
  const [tab, setTab] = React.useState("15");
  const a15 = before ? ALERTS_15 : AFTER_ALERTS.filter((a) => a.date.getTime() - TODAY.getTime() < 15 * 86400000);
  const a30 = before ? ALERTS_30 : AFTER_ALERTS;
  return (
    <SectionCard
      title="Important alerts"
      flush
      right={
        <Tabs
          items={[
            { key: "15", label: "15 days", count: a15.length },
            { key: "30", label: "30 days", count: a30.length },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      <AttentionList rows={tab === "15" ? a15 : a30} />
    </SectionCard>
  );
}

function ActivityCard() {
  const [tab, setTab] = React.useState("all");
  const rows = ACTIVITY.filter((r) => tab === "all" || (tab === "sbc" ? r.who !== "Rohan Kumar" : r.who === "Rohan Kumar"));
  return (
    <SectionCard
      title="Recent activity"
      flush
      right={
        <Tabs
          items={[
            { key: "all", label: "All", count: ACTIVITY.length },
            { key: "sbc", label: "SBC" },
            { key: "us", label: "Northwind" },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      <ActivityList rows={rows} />
    </SectionCard>
  );
}

function ComplianceStatusCard() {
  return (
    <SectionCard title="Compliance status" meta="FY 2026-27">
      <StackedBar
        total={24}
        segments={[
          { label: "Filed", value: 14, tone: "ok" },
          { label: "In progress", value: 4, tone: "accent" },
          { label: "Due in 15 days", value: 4, tone: "warn" },
          { label: "Overdue", value: 1, tone: "bad" },
          { label: "Upcoming", value: 1, tone: "idle" },
        ]}
      />
    </SectionCard>
  );
}

function AreaCard() {
  const areas = [
    { name: "GST", done: 6, total: 8, tone: "teal" as const },
    { name: "Income tax and TDS", done: 4, total: 6, tone: "accent" as const },
    { name: "MCA", done: 2, total: 5, tone: "violet" as const },
    { name: "Payroll (PF, ESI, PT)", done: 2, total: 5, tone: "warn" as const },
  ];
  return (
    <SectionCard title="Compliance by area" flush right={<HeadLink href="/client/obligations">Obligations ›</HeadLink>}>
      <ProgressList items={areas.map((a) => ({ id: a.name, name: a.name, pct: Math.round((a.done / a.total) * 100), sub: `${a.done} of ${a.total} filed`, tone: a.tone, href: "/client/obligations" }))} />
    </SectionCard>
  );
}

export function HomeScreen() {
  const { incorporated } = useClientState();

  const statsBefore: StatItem[] = [
    { label: "Waiting on Northwind", value: 4, Icon: User, tone: "amber", href: "#needs" },
    { label: "With SBC", value: 1, Icon: Building2, tone: "blue" },
    { label: "Overdue", value: 1, Icon: AlertTriangle, tone: "red", bad: true },
    { label: "Documents in", value: 4, of: "/ 6", Icon: FileText, tone: "teal", href: "/client/documents" },
    { label: "Expected COI", value: fmt(COI_EXPECTED), Icon: Award, tone: "green" },
  ];
  const statsAfter: StatItem[] = [
    { label: "Due in 15 days", value: 4, Icon: CalendarCheck, tone: "amber", href: "/client/obligations" },
    { label: "Waiting on Northwind", value: 3, Icon: User, tone: "amber", href: "#needs" },
    { label: "Overdue", value: 1, Icon: AlertTriangle, tone: "red", bad: true, href: "/client/obligations" },
    { label: "Filed this year", value: 14, of: "/ 24", Icon: ShieldCheck, tone: "green", href: "/client/filings" },
    { label: "Registrations", value: 3, of: "/ 5", Icon: Clock, tone: "violet", href: "/client/registrations" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <GreetingCard
        date={TODAY}
        name={NORTHWIND.name}
        tag={incorporated ? <Chip tone="ok" className="bg-white/[.12] text-white">Incorporated 28 Oct</Chip> : <Chip tone="prog" className="bg-white/[.12] text-white">SPICe+ · 6 of 25 steps</Chip>}
        actions={
          <>
            <Button variant="onNavy">Report</Button>
            <Button variant="onNavyPrimary">
              <Upload size={16} strokeWidth={1.5} /> Upload documents
            </Button>
          </>
        }
        stats={incorporated ? statsAfter : statsBefore}
      />

      {incorporated ? (
        <Cols>
          <Col>
            <ComplianceStatusCard />
            <div id="needs">
              <NeedsCard rows={AFTER_NEEDS} title="Needs from Northwind" />
            </div>
            <SectionCard title="Recent documents" flush right={<HeadLink href="/client/documents">Documents ›</HeadLink>}>
              <DocList groups={[{ label: "Last week", docs: DOCS.slice(0, 1) }, { label: "Earlier", docs: DOCS.slice(1) }]} />
            </SectionCard>
            <ActivityCard />
          </Col>
          <Col>
            <AlertsCard before={false} />
            <SectionCard title="What SBC is doing" flush>
              <ProgressList items={AFTER_SBC_DOING} />
            </SectionCard>
            <AreaCard />
          </Col>
        </Cols>
      ) : (
        <>
          <TimelineCard />
          <StepsCard />
          <Cols>
            <Col>
              <div id="needs">
                <NeedsCard rows={NEEDS} title="Needs from Northwind" />
              </div>
              <SectionCard title="Recent documents" flush right={<HeadLink href="/client/documents">Documents ›</HeadLink>}>
                <DocList groups={[{ label: "Last week", docs: DOCS.slice(0, 1) }, { label: "Earlier", docs: DOCS.slice(1) }]} />
              </SectionCard>
              <ActivityCard />
            </Col>
            <Col>
              <AlertsCard before />
              <SectionCard title="What SBC is doing" flush>
                <ProgressList items={SBC_DOING} />
              </SectionCard>
            </Col>
          </Cols>
        </>
      )}
    </div>
  );
}
