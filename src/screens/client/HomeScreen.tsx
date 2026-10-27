"use client";
import * as React from "react";
import { AlertTriangle, Award, Building2, CalendarCheck, FileText, IdCard, ShieldCheck, Upload, User } from "lucide-react";
import { TODAY, fmt } from "@/lib/dates";
import { NORTHWIND } from "@/data/people";
import { COI_EXPECTED } from "@/data/incorporation";
import { ALERTS_30, SBC_DOING, DOCS, ACTIVITY } from "@/data/client-home";
import {
  AFTER_ACTIVITY,
  AFTER_ALERTS_NOV,
  AFTER_DOCS,
  AFTER_SBC,
  AFTER_TODAY,
  DOCS_DRILL,
  DUE_DRILL_AFTER,
  INCORPORATED_ON,
  NEEDS_AFTER,
  NEEDS_BEFORE,
  NEEDS_DRILL_AFTER,
  OVERDUE_DRILL_BEFORE,
  POST_DONE,
  POST_DRILL,
  POST_OPEN,
  REG_DRILL,
  HOME_REGS,
} from "@/data/client-home-extra";
import { useClientState } from "@/components/shell/ClientState";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { GreetingCard, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, HeadLink } from "@/components/cards/SectionCard";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { ProgressList, type ProgressItem } from "@/components/cards/ProgressList";
import { DocList, type Doc } from "@/components/cards/DocList";
import { ActivityList, type ActivityRow } from "@/components/cards/ActivityList";
import { UploadDialog } from "@/components/cards/UploadDialog";
import { useDrill, type DrillSpec } from "@/components/cards/DrillDialog";
import { IncTimelineCard } from "./parts";
import { AreaCard, CompStatusCard, HoldsCard, HomeRegsCard, HomeStepsCard, IdsCard, NeedsCard, PostIncCard, WhatNextCard, stepsDrill } from "./home-parts";

/*
 * Client home (v7_before, v7_after, mobile.html).
 * Kept out: the "Your next action" bar v7c_today (R-38), the bot figure (R-04), info icons and their pop-overs (R-06).
 * Phone (390 px): the columns dissolve (max-lg:contents) and `order` sets the mobile.html card order.
 */

const DAY = 86400000;

function AlertsCard({ rows, today, className }: { rows: AttentionRow[]; today: Date; className?: string }) {
  const [tab, setTab] = React.useState("15");
  const in15 = rows.filter((a) => a.date.getTime() - today.getTime() < 15 * DAY);
  return (
    <SectionCard
      title="Important alerts"
      flush
      className={className}
      right={
        <Tabs
          items={[
            { key: "15", label: "15 days", count: in15.length },
            { key: "30", label: "30 days", count: rows.length },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      <AttentionList rows={tab === "15" ? in15 : rows} />
    </SectionCard>
  );
}

function ActivityCard({ rows, className }: { rows: ActivityRow[]; className?: string }) {
  const [tab, setTab] = React.useState("all");
  const isUs = (r: ActivityRow) => r.who === "Rohan Kumar" || r.who === "Northwind";
  const shown = rows.filter((r) => tab === "all" || (tab === "sbc" ? !isUs(r) : isUs(r)));
  return (
    <SectionCard
      title="Recent activity"
      flush
      className={className}
      right={
        <Tabs
          items={[
            { key: "all", label: "All", count: rows.length },
            { key: "sbc", label: "SBC", count: rows.filter((r) => !isUs(r)).length },
            { key: "us", label: "Northwind", count: rows.filter(isUs).length },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      <ActivityList rows={shown} />
    </SectionCard>
  );
}

function DocsCard({ docs, today, className }: { docs: Doc[]; today: Date; className?: string }) {
  const age = (x: Doc) => (today.getTime() - x.date.getTime()) / DAY;
  const groups = [
    { label: "This week", docs: docs.filter((x) => age(x) < 7) },
    { label: "Last week", docs: docs.filter((x) => age(x) >= 7 && age(x) < 14) },
    { label: "Earlier", docs: docs.filter((x) => age(x) >= 14) },
  ].filter((g) => g.docs.length > 0);
  return (
    <SectionCard title="Recent documents" flush className={className} right={<HeadLink href="/client/documents">Documents ›</HeadLink>}>
      <DocList groups={groups} />
    </SectionCard>
  );
}

function SbcCard({ items, className }: { items: ProgressItem[]; className?: string }) {
  return (
    <SectionCard title="What SBC is doing" flush className={className}>
      <ProgressList items={items} />
    </SectionCard>
  );
}

/** Opens a drill when a number-strip link with href "#dd-<key>" is clicked. NumberStrip only takes href (gap noted). */
function useDrillLinks(map: Record<string, () => void>) {
  return (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a[href^='#dd-']");
    if (!a) return;
    const key = a.getAttribute("href")!.slice(4);
    const fn = map[key];
    if (!fn) return;
    e.preventDefault();
    fn();
  };
}

export function HomeScreen() {
  const { incorporated: after } = useClientState();
  const drill = useDrill();
  const toast = useUndoToast();
  const [upload, setUpload] = React.useState(false);
  const today = after ? AFTER_TODAY : TODAY;
  const open = (spec: DrillSpec, tab = 0) => drill.open(spec, tab);

  const statsBefore: StatItem[] = [
    { label: "Waiting on Northwind", value: 4, Icon: User, tone: "amber", href: "#dd-you" },
    { label: "With SBC", value: 1, Icon: Building2, tone: "blue", href: "#dd-sbc" },
    { label: "Overdue", value: 1, Icon: AlertTriangle, tone: "red", bad: true, href: "#dd-late" },
    { label: "Documents in", value: 4, of: "/ 6", Icon: FileText, tone: "teal", href: "#dd-docs" },
    { label: "Expected COI", value: fmt(COI_EXPECTED), Icon: Award, tone: "green", href: "/client/incorporation" },
  ];
  const statsAfter: StatItem[] = [
    { label: "Waiting on Northwind", value: NEEDS_AFTER.length, Icon: User, tone: "amber", href: "#dd-needs" },
    { label: "Overdue", value: 1, Icon: AlertTriangle, tone: "red", bad: true, href: "#dd-late" },
    { label: "Due soon", value: 3, Icon: CalendarCheck, tone: "amber", href: "#dd-due" },
    { label: "Registrations", value: HOME_REGS.filter((r) => r.status === "Registered").length, of: `/ ${HOME_REGS.length}`, Icon: IdCard, tone: "violet", href: "#dd-reg" },
    { label: "Incorporated", value: fmt(INCORPORATED_ON), Icon: ShieldCheck, tone: "green", href: "/client/incorporation" },
  ];

  const onStrip = useDrillLinks({
    you: () => open(stepsDrill(), 2),
    sbc: () => open(stepsDrill(), 3),
    late: () => (after ? open(DUE_DRILL_AFTER, 0) : open(OVERDUE_DRILL_BEFORE, 0)),
    due: () => open(DUE_DRILL_AFTER, 1),
    docs: () => open(DOCS_DRILL, 0),
    needs: () => open(NEEDS_DRILL_AFTER, 0),
    reg: () => open(REG_DRILL, 0),
  });

  const report = () => {
    toast.show("Preparing Northwind’s progress report (PDF)");
    window.setTimeout(() => toast.show(`Report downloaded · Northwind-progress-${fmt(today).replace(" ", "-")}.pdf`), 1400);
  };

  const done = after ? POST_DONE.length : 6;
  const total = after ? POST_DONE.length + POST_OPEN.length : 25;
  const progress = (
    <button
      type="button"
      onClick={() => (after ? open(POST_DRILL, 2) : open(stepsDrill(), 1))}
      className="inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-sm bg-white/[.12] px-2 text-12 font-semibold text-white hover:bg-white/[.2]"
    >
      <i className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {after ? `Setup · ${done} of ${total} done` : `SPICe+ · ${done} of ${total} steps`} · {Math.round((done / total) * 100)}%
    </button>
  );

  const uploads = (after ? NEEDS_AFTER : NEEDS_BEFORE).filter((n) => n.kind === "upload" || n.kind === "correct");

  return (
    <div className="grid grid-cols-1 gap-5">
      <div onClickCapture={onStrip}>
        <GreetingCard
          date={today}
          name={NORTHWIND.name}
          tag={progress}
          actions={
            <>
              <Button variant="onNavy" onClick={report}>
                Report
              </Button>
              <Button variant="onNavyPrimary" onClick={() => setUpload(true)}>
                <Upload size={16} strokeWidth={1.5} /> Upload documents
              </Button>
            </>
          }
          stats={after ? statsAfter : statsBefore}
        />
      </div>

      {after ? (
        <>
          <IncTimelineCard after className="max-lg:order-9" />
          <HomeStepsCard after className="max-lg:order-[13]" />
          <Cols className="max-lg:contents">
            <Col className="max-lg:contents">
              <NeedsCard rows={NEEDS_AFTER} className="max-lg:order-1" />
              <WhatNextCard onDrill={open} className="max-lg:order-2" />
              <AreaCard onDrill={open} className="max-lg:order-[12]" />
              <PostIncCard onDrill={open} className="max-lg:order-6" />
              <HomeRegsCard className="max-lg:order-5" />
            </Col>
            <Col className="max-lg:contents">
              <AlertsCard rows={AFTER_ALERTS_NOV} today={AFTER_TODAY} className="max-lg:order-[11]" />
              <SbcCard items={AFTER_SBC} className="max-lg:order-7" />
              <CompStatusCard onDrill={open} className="max-lg:order-3" />
              <IdsCard className="max-lg:order-4" />
              <DocsCard docs={AFTER_DOCS} today={AFTER_TODAY} className="max-lg:order-[10]" />
              <ActivityCard rows={AFTER_ACTIVITY} className="max-lg:order-[10]" />
            </Col>
          </Cols>
        </>
      ) : (
        <>
          <IncTimelineCard className="max-lg:order-3" />
          <HomeStepsCard after={false} className="max-lg:order-[9]" />
          <Cols className="max-lg:contents">
            <Col className="max-lg:contents">
              <NeedsCard rows={NEEDS_BEFORE} className="max-lg:order-1" />
              <DocsCard docs={DOCS} today={TODAY} className="max-lg:order-6" />
              <ActivityCard rows={ACTIVITY} className="max-lg:order-7" />
            </Col>
            <Col className="max-lg:contents">
              <HoldsCard onDrill={open} className="max-lg:order-2" />
              <AlertsCard rows={ALERTS_30} today={TODAY} className="max-lg:order-4" />
              <SbcCard items={SBC_DOING} className="max-lg:order-5" />
            </Col>
          </Cols>
        </>
      )}

      <UploadDialog
        key={`${after}-${upload}`}
        open={upload}
        onOpenChange={setUpload}
        requests={uploads.map((r) => ({ id: r.id, name: r.title, due: r.due, sentBack: r.kind === "correct" }))}
        onUpload={(_, files) => {
          setUpload(false);
          toast.show(`Uploaded · ${files.length} ${files.length === 1 ? "file" : "files"}`);
        }}
      />
      {drill.node}
      {toast.node}
    </div>
  );
}
