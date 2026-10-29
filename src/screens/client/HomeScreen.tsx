"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { AlertTriangle, Award, Building2, CalendarCheck, Check, Download, FileText, IdCard, ShieldCheck, Upload, User } from "lucide-react";
import { TODAY, daysFrom, fmt } from "@/lib/dates";
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
  HOLDS,
  HOME_TRENDS,
} from "@/data/client-home-extra";
import { useClientState } from "@/components/shell/ClientState";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { GreetingCard, trail, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard, HeadLink } from "@/components/cards/SectionCard";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { ProgressList, type ProgressItem } from "@/components/cards/ProgressList";
import { DocList, type Doc } from "@/components/cards/DocList";
import { ActivityList, type ActivityRow } from "@/components/cards/ActivityList";
import { UploadDialog } from "@/components/cards/UploadDialog";
import { useDrill, type DrillSpec } from "@/components/cards/DrillDialog";
import { IncTimelineCard } from "./parts";
import { AreaCard, CompStatusCard, HoldsCard, HomeRegsCard, IdsCard, NeedsCard, PostIncCard, WhatNextCard, stepsDrill } from "./home-parts";
import { St5Card } from "./st5";

/*
 * Client home (v7_before, v7_after, mobile.html).
 * Spectrum board ClientHome: H3 home card, ST5 incorporation card, needs, who holds it, timeline.
 * Kept out: the "Your next action" bar v7c_today and the board (R-38), the bot figure (R-04), info icons and their pop-overs (R-06).
 * Phone (390 px): the columns dissolve (max-lg:contents) and `order` sets the mobile.html card order.
 */

const DAY = 86400000;
/** Tile sub lines, read from the sample data: the step with SBC and the overdue request. */
const SBC_STEP = HOLDS.find((h) => h.key === "sbc")?.rows[0];

function AlertsCard({ rows: all, today, className }: { rows: AttentionRow[]; today: Date; className?: string }) {
  // C-02: the sent-back passport already leads "Needs from Northwind" and the Overdue tile. Do not repeat it here.
  const rows = all.filter((a) => !a.alert);
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
      <AttentionList rows={tab === "15" ? in15 : rows} today={today} />
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

/** A file the person uploads from the home card. pct runs to 100, then the row shows Uploaded (U1). */
interface UploadRow {
  id: string;
  name: string;
  size: string;
  pct: number;
}

function DocsCard({ docs, today, uploads = [], className }: { docs: Doc[]; today: Date; uploads?: UploadRow[]; className?: string }) {
  const age = (x: Doc) => (today.getTime() - x.date.getTime()) / DAY;
  const groups = [
    { label: "This week", docs: docs.filter((x) => age(x) < 7) },
    { label: "Last week", docs: docs.filter((x) => age(x) >= 7 && age(x) < 14) },
    { label: "Earlier", docs: docs.filter((x) => age(x) >= 14) },
  ].filter((g) => g.docs.length > 0);
  return (
    <SectionCard title="Recent documents" flush className={className} right={<HeadLink href="/client/documents">Documents ›</HeadLink>}>
      {uploads.length > 0 && (
        <ul aria-label="Recent uploads" className="border-b border-line-soft">
          {uploads.map((u) => {
            const done = u.pct >= 100;
            return (
              <li key={u.id} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 first:border-t-0 md:px-5">
                <FileText size={16} strokeWidth={1.6} className="flex-none text-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <b className="min-w-0 truncate text-13.5 font-medium">{u.name}</b>
                    <span className="flex-none text-12 text-muted">{u.size}</span>
                  </span>
                  {done ? (
                    <span className="mt-0.5 flex items-center gap-1 text-12.5 text-ok">
                      <Check size={13} strokeWidth={2} aria-hidden /> Uploaded
                    </span>
                  ) : (
                    <span className="mt-1.5 flex items-center gap-2" role="progressbar" aria-label={`Uploading ${u.name}`} aria-valuenow={u.pct} aria-valuemin={0} aria-valuemax={100}>
                      <span className="block h-1.5 flex-1 overflow-hidden rounded-bar bg-raised">
                        <i className="block h-full rounded-bar bg-primary transition-[width] duration-200" style={{ width: `${u.pct}%` }} />
                      </span>
                      <span className="w-9 flex-none text-right text-12 tabular-nums text-muted">{u.pct}%</span>
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
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
  const [fileRows, setFileRows] = React.useState<UploadRow[]>([]);
  // B-20 (U1): each new file shows a progress row, then a tick.
  React.useEffect(() => {
    if (!fileRows.some((u) => u.pct < 100)) return;
    const h = window.setTimeout(() => setFileRows((l) => l.map((u) => (u.pct < 100 ? { ...u, pct: Math.min(100, u.pct + 20) } : u))), 220);
    return () => window.clearTimeout(h);
  }, [fileRows]);
  const today = after ? AFTER_TODAY : TODAY;
  const open = (spec: DrillSpec, tab = 0) => drill.open(spec, tab);

  const statsBefore: StatItem[] = [
    { label: "Waiting on Northwind", value: 4, note: "oldest 5 days", how: "Uploads, details and approvals that SBC needs from Northwind.", spark: trail(HOME_TRENDS.waiting, 4), sparkTone: "teal", Icon: User, tone: "amber", href: "#dd-you" },
    { label: "With SBC", value: 1, note: SBC_STEP?.title, how: "Steps that SBC is working on now.", spark: trail(HOME_TRENDS.sbc, 1), Icon: Building2, tone: "blue", href: "#dd-sbc" },
    { label: "Overdue", value: 1, note: "passport copy", how: "Items from Northwind past their due date.", Icon: AlertTriangle, tone: "red", bad: true, href: "#dd-late" },
    { label: "Documents in", value: "4/6", note: "2 to go", spark: trail(HOME_TRENDS.docs, 4), sparkTone: "ok", how: "Documents received out of the six this phase needs.", Icon: FileText, tone: "teal", href: "#dd-docs" },
    { label: "Expected COI", value: fmt(COI_EXPECTED), how: "The date MCA is expected to issue the certificate, from the current plan.", note: `in ${daysFrom(COI_EXPECTED)} days`, Icon: Award, tone: "green", href: "/client/incorporation" },
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
      className="whitespace-nowrap text-accent underline-offset-2 hover:underline"
    >
      {after ? `${done} of ${total} done` : `${done} of ${total} steps`}
    </button>
  );

  const uploads = (after ? NEEDS_AFTER : NEEDS_BEFORE).filter((n) => n.kind === "upload" || n.kind === "correct");

  return (
    <div className="grid grid-cols-1 gap-5">
      <div onClickCapture={onStrip}>
        <GreetingCard
          date={today}
          name={NORTHWIND.name}
          lead={
            <span className="grid h-9 w-9 flex-none place-items-center rounded-md bg-accent-soft text-13 font-display text-accent" aria-hidden>
              NT
            </span>
          }
          tag={
            <span className={cn("inline-flex h-5 items-center rounded-sm px-[7px] text-11.5 font-medium", after ? "bg-ok-soft text-ok" : "bg-accent-soft text-accent")}>
              {after ? "Incorporated" : "Incorporating"}
            </span>
          }
          sub={progress}
          actions={
            <>
              <Button variant="secondary" onClick={report}>
                <Download size={16} strokeWidth={1.6} aria-hidden /> Report
              </Button>
              <Button variant="primary" onClick={() => setUpload(true)}>
                <Upload size={16} strokeWidth={1.6} aria-hidden /> Upload document
              </Button>
            </>
          }
          stats={after ? statsAfter : statsBefore}
        />
      </div>

      {after ? (
        <>
          <Cols className="max-lg:contents">
            <Col className="max-lg:contents">
              <St5Card after today={AFTER_TODAY} link={{ href: "/client/incorporation", label: "All steps" }} className="max-lg:order-3" />
              <IncTimelineCard after className="max-lg:order-[9]" />
              <AreaCard onDrill={open} className="max-lg:order-[8]" />
              <PostIncCard onDrill={open} className="max-lg:order-6" />
              <DocsCard docs={AFTER_DOCS} today={AFTER_TODAY} uploads={fileRows} className="max-lg:order-[11]" />
              <ActivityCard rows={AFTER_ACTIVITY} className="max-lg:order-[13]" />
            </Col>
            <Col className="max-lg:contents">
              <NeedsCard rows={NEEDS_AFTER} className="max-lg:order-1" />
              <WhatNextCard onDrill={open} className="max-lg:order-2" />
              <CompStatusCard onDrill={open} className="max-lg:order-4" />
              <IdsCard className="max-lg:order-5" />
              <AlertsCard rows={AFTER_ALERTS_NOV} today={AFTER_TODAY} className="max-lg:order-[10]" />
              <SbcCard items={AFTER_SBC} className="max-lg:order-[12]" />
            </Col>
          </Cols>
          <HomeRegsCard className="max-lg:order-7" />
        </>
      ) : (
        <Cols className="max-lg:contents">
          <Col className="max-lg:contents">
            <St5Card after={false} link={{ href: "/client/incorporation", label: "All steps" }} className="max-lg:order-2" />
            <IncTimelineCard className="max-lg:order-5" />
            <DocsCard docs={DOCS} today={TODAY} uploads={fileRows} className="max-lg:order-6" />
            <ActivityCard rows={ACTIVITY} className="max-lg:order-8" />
          </Col>
          <Col className="max-lg:contents">
            <NeedsCard rows={NEEDS_BEFORE} className="max-lg:order-1" />
            <HoldsCard onDrill={open} className="max-lg:order-3" />
            <AlertsCard rows={ALERTS_30} today={TODAY} className="max-lg:order-4" />
            <SbcCard items={SBC_DOING} className="max-lg:order-7" />
          </Col>
        </Cols>
      )}

      <UploadDialog
        key={`${after}-${upload}`}
        open={upload}
        onOpenChange={setUpload}
        requests={uploads.map((r) => ({ id: r.id, name: r.title, due: r.due, sentBack: r.kind === "correct" }))}
        onUpload={(_, files) => {
          setUpload(false);
          const now = Date.now();
          setFileRows((l) => [...files.map((f, k) => ({ id: `${now}-${k}`, name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB`, pct: 0 })), ...l]);
          toast.show(`Uploading · ${files.length} ${files.length === 1 ? "file" : "files"}`);
        }}
      />
      {drill.node}
      {toast.node}
    </div>
  );
}
