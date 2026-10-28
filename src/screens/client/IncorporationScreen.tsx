"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { daysFrom, fmt } from "@/lib/dates";
import { NORTHWIND } from "@/data/people";
import { STEPS, COI_EXPECTED } from "@/data/incorporation";
import { WEEK_RANGE, DOCS_FROM_CLIENT, DOCS_BY_SBC, whoSegments, planSegments, type StatSeg } from "@/data/incorporation-detail";
import { useClientState } from "@/components/shell/ClientState";
import { Row, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { barFill } from "@/components/ui/Bar";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { WeekList, type WeekRow } from "@/components/cards/WeekList";
import { IncPhaseTimelineCard } from "./inc-timeline";
import { DrillModal, statusGroups, type DrillSpec } from "./inc-parts";
import { PageHead, Dot } from "./navy-head";
import { St5Card } from "./st5";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** CIN after the certificate (sample). */
export const NORTHWIND_CIN = "U62011KA2026PTC198765";

// Old WEEK_B: owner, task, date.
const WEEK: WeekRow[] = [
  { id: "w1", when: "9 Oct", owner: "client", ownerLabel: "Northwind", text: "Upload NOC · requested by Bharath", href: "/client/incorporation/step/7" },
  { id: "w2", when: "9 Oct", owner: "client", ownerLabel: "Northwind", text: "Check and approve step 7", href: "/client/incorporation/step/7" },
  { id: "w3", when: "Now", now: true, owner: "sbc", text: "KYC review and DSC", href: "/client/incorporation/step/10" },
  { id: "w4", when: "12 Oct", owner: "sbc", text: "Draft MOA and AOA", href: "/client/incorporation/step/11" },
];

const WEEK_AFTER: WeekRow[] = [
  { id: "x1", when: "Now", now: true, owner: "sbc", text: "First Board meeting", href: "/client/incorporation/step/15" },
  { id: "x2", when: "Wed 7 Oct", owner: "client", ownerLabel: "Northwind", text: "Open the bank account", href: "/client/incorporation/step/17" },
  { id: "x3", when: "Fri 9 Oct", owner: "sbc", text: "Company letterhead", href: "/client/incorporation/step/16" },
  { id: "x4", when: "Sat 10 Oct", owner: "sbc", text: "Auditor appointment (ADT-1)", href: "/client/incorporation/step/21" },
];

/** Plain head (R-02): days to the COI or the incorporation date, the company, the step count, the "At risk" chip. Was the navy COI card. */
function IncHead({ incorporated, onDrill }: { incorporated: boolean; onDrill: (d: DrillSpec) => void }) {
  const done = incorporated ? 21 : STEPS.filter((s) => s.status === "Completed").length;
  const total = STEPS.length;
  // Old coiTile: "At risk" names the first step that waits on Northwind.
  const risk = STEPS.find((s) => s.owner === "client" && s.status === "Waiting");
  const drillAll = () => onDrill({ title: `All ${total} steps`, sub: `${done} done · ${total - done} to go`, groups: statusGroups(STEPS) });
  return (
    <PageHead
      label="Certificate of Incorporation"
      title={incorporated ? `Incorporated ${fmt(COI_EXPECTED)}` : `${daysFrom(COI_EXPECTED)} days to COI`}
      meta={
        incorporated ? (
          <>
            <span className="font-mono text-13 text-ink-2">{NORTHWIND_CIN}</span>
            <Dot />
            <span>CIN, PAN and TAN issued</span>
          </>
        ) : (
          <>
            <span>{NORTHWIND.name}</span>
            <Dot />
            <span>
              expected {DAYS[COI_EXPECTED.getDay()]} {fmt(COI_EXPECTED)}
            </span>
            <Dot />
            <button type="button" onClick={drillAll} className="text-accent hover:underline">
              {done} / {total} steps · {Math.round((done / total) * 100)}%
            </button>
          </>
        )
      }
      actions={
        incorporated ? (
          <Button asChild variant="secondary">
            <Link href="/client/documents">Open certificate</Link>
          </Button>
        ) : (
          risk && (
            <Link href={`/client/incorporation/step/${risk.n}`} aria-label={`At risk · step ${risk.n}`}>
              <Chip tone="warn">At risk · step {risk.n}</Chip>
            </Link>
          )
        )
      }
    />
  );
}

/** R-25 (C2): one card, one stacked bar per question, in status colours. Replaces the four donut cards. */
function SplitCard({ rows, onDrill }: { rows: Array<{ title: string; unit: string; segs: StatSeg[]; spec: (active?: number) => DrillSpec }>; onDrill: (d: DrillSpec) => void }) {
  return (
    <SectionCard title="Incorporation status" bodyClassName="grid gap-5 px-4 py-4 sm:grid-cols-2 sm:gap-x-8 md:px-5">
      {rows.map((r) => {
        const total = r.segs.reduce((a, s) => a + s.items.length, 0);
        return (
          <div key={r.title} className="grid min-w-0 gap-2">
            <button type="button" onClick={() => onDrill(r.spec())} className="flex items-baseline gap-2 text-left hover:underline" aria-label={`${r.title} · ${total} ${r.unit}`}>
              <span className="min-w-0 truncate text-13 font-medium text-ink-2">{r.title}</span>
              <b className="ml-auto text-14 font-medium">{total}</b>
            </button>
            <span className="flex h-2 w-full gap-0.5 overflow-hidden rounded-bar" aria-hidden>
              {r.segs
                .filter((s) => s.items.length > 0)
                .map((s) => (
                  <i key={s.label} className={cn("block h-full rounded-[2px]", barFill[s.tone])} style={{ width: `${(s.items.length / (total || 1)) * 100}%` }} />
                ))}
            </span>
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              {r.segs.map((s, i) => (
                <button key={s.label} type="button" onClick={() => onDrill(r.spec(i))} className="inline-flex items-center gap-1.5 text-12.5 text-muted hover:text-ink">
                  <i className={cn("h-2 w-2 flex-none rounded-[2px]", barFill[s.tone])} aria-hidden />
                  {s.label}
                  <b className="font-medium text-ink">{s.items.length}</b>
                </button>
              ))}
            </span>
          </div>
        );
      })}
    </SectionCard>
  );
}

export function IncorporationScreen() {
  const { incorporated } = useClientState();
  const toast = useUndoToast();
  const [drill, setDrill] = React.useState<DrillSpec | null>(null);
  const who = whoSegments();
  const plan = planSegments();
  const count = (g: StatSeg[]) => g.reduce((a, x) => a + x.items.length, 0);
  const split = [
    { title: "Documents from Northwind", unit: "documents", segs: DOCS_FROM_CLIENT, spec: (active?: number): DrillSpec => ({ title: "Documents from Northwind", sub: `${count(DOCS_FROM_CLIENT)} documents`, groups: DOCS_FROM_CLIENT, active, docFrom: "From Northwind", link: { text: "Open documents", href: "/client/documents" } }) },
    { title: "Documents SBC prepares", unit: "documents", segs: DOCS_BY_SBC, spec: (active?: number): DrillSpec => ({ title: "Documents SBC prepares", sub: `${count(DOCS_BY_SBC)} documents`, groups: DOCS_BY_SBC, active, docFrom: "Prepared by SBC", link: { text: "Open documents", href: "/client/documents" } }) },
    { title: "Who is working on what", unit: "steps", segs: who, spec: (active?: number): DrillSpec => ({ title: "Who is working on what", sub: `${count(who)} open steps`, groups: who, active }) },
    { title: "On plan or overdue", unit: "steps", segs: plan, spec: (active?: number): DrillSpec => ({ title: "On plan or overdue", sub: `${count(plan)} active steps`, groups: plan, active }) },
  ];
  const cur = incorporated ? 3 : 2;
  return (
    <div className="grid grid-cols-1 gap-5">
      <IncHead incorporated={incorporated} onDrill={setDrill} />
      <Row>
        <St5Card after={incorporated} link={{ href: `/client/incorporation/phase/${cur}`, label: `Open phase ${cur}` }} />
        <Col>
          <SectionCard title="This week" meta={WEEK_RANGE} flush>
            <WeekList rows={incorporated ? WEEK_AFTER : WEEK} />
          </SectionCard>
          <SplitCard rows={split} onDrill={setDrill} />
        </Col>
      </Row>
      <IncPhaseTimelineCard after={incorporated} />
      <DrillModal spec={drill} onClose={() => setDrill(null)} />
      {toast.node}
    </div>
  );
}
