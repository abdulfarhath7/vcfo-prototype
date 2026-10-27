"use client";
import * as React from "react";
import { Download, Upload } from "lucide-react";
import { TODAY, fmt } from "@/lib/dates";
import { PHASES, MCA_REVIEW, COI_EXPECTED, TIMELINE, TIMELINE_TICKS, stepsOf, doneCount, stepTone, stepHref, phaseHref } from "@/data/incorporation";
import { DOC_STATUS_TONE, type ItemDoc } from "@/data/registrations";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FileBadge } from "@/components/ui/FileBadge";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { GanttTimeline, type GanttRow } from "@/components/cards/GanttTimeline";
import { PhaseRows, type Phase } from "@/components/cards/PhaseRows";
import { KeyValue, type KV } from "@/components/cards/KeyValue";
import { cn } from "@/lib/cn";

/** Same rows as the client home timeline. */
export function IncTimelineCard() {
  const rows: GanttRow[] = [
    { id: "p1", name: PHASES[0].short, status: "done", bars: [{ from: PHASES[0].start, to: PHASES[0].end, kind: "done" }], count: `${doneCount(1)}/${stepsOf(1).length}`, note: { text: `Done ${fmt(PHASES[0].end)}` } },
    {
      id: "p2",
      name: PHASES[1].short,
      status: "current",
      bars: [
        { from: PHASES[1].start, to: TODAY, kind: "cur" },
        { from: TODAY, to: PHASES[1].end, kind: "rest" },
      ],
      count: `${doneCount(2)}/${stepsOf(2).length}`,
      note: { text: "22%" },
    },
    { id: "mca", name: "MCA review", status: "planned", bars: [{ from: MCA_REVIEW.start, to: MCA_REVIEW.end, kind: "plan" }], milestone: COI_EXPECTED, note: { text: `COI ${fmt(COI_EXPECTED)}` } },
    { id: "p3", name: PHASES[2].short, status: "planned", bars: [{ from: PHASES[2].start, to: PHASES[2].end, kind: "plan" }], count: `${doneCount(3)}/${stepsOf(3).length}` },
  ];
  return (
    <SectionCard title="Timeline" flush right={<Button size="sm">Edit</Button>}>
      <GanttTimeline start={TIMELINE.start} end={TIMELINE.end} ticks={TIMELINE_TICKS} rows={rows} />
    </SectionCard>
  );
}

/** All three phases, each expands to its step table. */
export function incPhases(): Phase[] {
  return PHASES.map((p) => ({
    id: p.id,
    name: p.name,
    done: doneCount(p.n),
    total: stepsOf(p.n).length,
    status: p.status,
    tone: p.status === "Done" ? "ok" : p.status === "In progress" ? "prog" : "idle",
    href: phaseHref("client", p.n),
    steps: stepsOf(p.n).map((s) => ({ n: s.n, title: s.title, owner: s.owner, ownerLabel: s.owner === "client" ? "Northwind" : undefined, status: s.status, tone: stepTone[s.status], time: s.time, href: stepHref("client", s.n) })),
  }));
}

export function PhasesCard() {
  return (
    <SectionCard title="Phases" flush>
      <PhaseRows phases={incPhases()} openId="phase-2" />
    </SectionCard>
  );
}

/** Head card of a record page: eyebrow, name, chips, then key facts. */
export function RecordHead({ eyebrow, title, chips, facts, action }: { eyebrow?: React.ReactNode; title: string; chips?: React.ReactNode; facts?: KV[]; action?: React.ReactNode }) {
  return (
    <SectionCard title={title} bare>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow && <div className="text-12.5 text-muted">{eyebrow}</div>}
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight md:text-22">{title}</h1>
          {chips && <div className="mt-2 flex flex-wrap items-center gap-2">{chips}</div>}
        </div>
        {action && <div className="flex flex-none items-center gap-2">{action}</div>}
      </div>
      {facts && facts.length > 0 && <KeyValue rows={facts} cols={3} className="mt-4 border-t border-line-soft pt-4" />}
    </SectionCard>
  );
}

/** Documents with a type badge and a status chip. Client-owned items get upload buttons. */
export function ItemDocsCard({ docs, canUpload, title = "Documents" }: { docs: ItemDoc[]; canUpload?: boolean; title?: string }) {
  const open = docs.filter((x) => x.status === "Asked" || x.status === "Sent back").length;
  return (
    <SectionCard
      title={title}
      meta={docs.length ? `${docs.filter((x) => x.status === "Accepted").length} of ${docs.length} accepted` : undefined}
      flush
      right={
        canUpload && open > 0 ? (
          <Button variant="primary" size="sm">
            <Upload size={16} strokeWidth={1.5} /> Upload
          </Button>
        ) : undefined
      }
    >
      {docs.length === 0 ? (
        <Empty />
      ) : (
        docs.map((x) => {
          const ask = x.status === "Asked" || x.status === "Sent back";
          return (
            <ListRow key={x.id}>
              <FileBadge type={x.type} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{x.name}</span>
                <span className="block truncate text-12.5 text-muted">
                  <span className={cn(x.from === "client" && "text-warn", x.from === "mca" && "text-violet")}>{x.fromLabel ?? (x.from === "client" ? "Client" : x.from === "sbc" ? "SBC" : "MCA")}</span>
                  {x.date && (
                    <>
                      <span className="mx-1.5 text-faint">·</span>
                      {fmt(x.date)}
                    </>
                  )}
                  {x.note && (
                    <>
                      <span className="mx-1.5 text-faint">·</span>
                      <span className={cn(x.status === "Sent back" && "text-bad")}>{x.note}</span>
                    </>
                  )}
                </span>
              </span>
              <Chip tone={DOC_STATUS_TONE[x.status]} className="hidden sm:inline-flex">
                {x.status}
              </Chip>
              {ask && canUpload ? (
                <Button size="sm">Upload</Button>
              ) : x.status === "Accepted" || x.status === "To review" ? (
                <Button size="iconSm" variant="ghost" aria-label={`Download ${x.name}`}>
                  <Download size={16} strokeWidth={1.5} />
                </Button>
              ) : (
                <span className="w-[30px] flex-none" />
              )}
            </ListRow>
          );
        })
      )}
    </SectionCard>
  );
}

/** "Who holds it now": owner, SBC person, typical time. */
export function HoldsCard({ rows }: { rows: KV[] }) {
  return (
    <SectionCard title="Who holds it now">
      <KeyValue rows={rows} cols={1} />
    </SectionCard>
  );
}
