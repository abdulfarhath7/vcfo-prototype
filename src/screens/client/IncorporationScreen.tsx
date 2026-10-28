"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { daysFrom, fmt } from "@/lib/dates";
import { NORTHWIND } from "@/data/people";
import { PHASES, STEPS, COI_EXPECTED, stepsOf, doneCount } from "@/data/incorporation";
import { WEEK_RANGE, DOCS_FROM_CLIENT, DOCS_BY_SBC, whoSegments, planSegments } from "@/data/incorporation-detail";
import { useClientState } from "@/components/shell/ClientState";
import { Row } from "@/components/shell/Page";
import { Chip } from "@/components/ui/Chip";
import { barFill } from "@/components/ui/Bar";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { WeekList, type WeekRow } from "@/components/cards/WeekList";
import { IncPhaseTimelineCard } from "./inc-timeline";
import { DrillModal, StatCard, statusGroups, type DrillSpec } from "./inc-parts";

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

/** Navy COI card (old coiTile): days to the expected COI, the "At risk" chip and one phase split bar. */
function CoiCard({ incorporated, onDrill }: { incorporated: boolean; onDrill: (d: DrillSpec) => void }) {
  const counts = PHASES.map((p) => {
    const total = stepsOf(p.n).length;
    const done = incorporated && p.n < 3 ? total : doneCount(p.n);
    return { p, total, done, cur: incorporated ? p.n === 3 : p.status === "In progress" };
  });
  const done = counts.reduce((a, c) => a + c.done, 0);
  const total = STEPS.length;
  // Old coiTile: "At risk" names the first step that waits on Northwind.
  const risk = STEPS.find((s) => s.owner === "client" && s.status === "Waiting");
  const spice = STEPS.filter((s) => s.phase <= 2);
  const drillSpice = () =>
    onDrill({ title: "SPICe+ progress", sub: `Phases 1 and 2 · ${spice.filter((s) => s.status === "Completed").length} of ${spice.length} steps done`, groups: statusGroups(spice), link: { text: "Open Phase 2", href: "/client/incorporation/phase/2" } });
  const drillAll = () => onDrill({ title: `All ${total} steps`, sub: `${done} done · ${total - done} to go`, groups: statusGroups(STEPS) });
  return (
    <section className="grid min-w-0 grid-cols-1 gap-4 overflow-hidden rounded-lg border border-navy bg-navy px-5 py-5 text-white md:px-6" aria-label="Certificate of Incorporation">
      <div className="flex flex-wrap items-start gap-3">
        <button type="button" onClick={drillSpice} className="min-w-0 rounded-md text-left hover:bg-white/[.06]" aria-label={incorporated ? `Incorporated ${fmt(COI_EXPECTED)}` : `${daysFrom(COI_EXPECTED)} days to COI`}>
          {incorporated ? (
            <>
              <div className="text-[28px] font-bold leading-none tracking-tight">Incorporated {fmt(COI_EXPECTED)}</div>
              <div className="mt-2 truncate font-mono text-13 text-navy-ink">{NORTHWIND_CIN}</div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <b className="text-44 font-bold tracking-tight">{daysFrom(COI_EXPECTED)}</b>
                <span className="text-14 font-semibold text-navy-ink">days to COI</span>
              </div>
              <div className="mt-1.5 text-13 text-navy-ink">
                {NORTHWIND.name} · expected {DAYS[COI_EXPECTED.getDay()]} {fmt(COI_EXPECTED)}
              </div>
            </>
          )}
        </button>
        {!incorporated && risk && (
            <Link href={`/client/incorporation/step/${risk.n}`} className="ml-auto">
              <Chip tone="warn" className="bg-white/[.12] text-warn-mid">
                At risk · step {risk.n}
              </Chip>
            </Link>
          )}
      </div>
      {incorporated && (
        <div className="-mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-12.5 text-navy-faint">
          <span>CIN, PAN and TAN issued</span>
          <Link href="/client/documents" className="font-semibold text-white hover:underline">
            Open certificate
          </Link>
        </div>
      )}
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-13">
          <button type="button" onClick={drillAll} className="font-semibold hover:underline">
            {done} / {total} steps
          </button>
          <span className="text-navy-faint">{Math.round((done / total) * 100)}%</span>
        </div>
        <button type="button" onClick={drillAll} className="flex w-full gap-1 text-left" aria-label="All steps by status">
          {counts.map((c) => (
            <div key={c.p.id} className="min-w-0" style={{ flex: c.total }}>
              <span className="block h-2 overflow-hidden rounded-full bg-white/[.12]" aria-hidden>
                <i className={cn("block h-full rounded-full", c.done === c.total ? barFill.ok : barFill.accent)} style={{ width: `${(c.done / c.total) * 100}%` }} />
              </span>
              <small className={cn("mt-1.5 block truncate text-11.5", c.cur ? "font-semibold text-navy-ink" : "text-navy-faint")}>
                {c.p.short} · {c.done}/{c.total}
              </small>
            </div>
          ))}
        </button>
      </div>
    </section>
  );
}

export function IncorporationScreen() {
  const { incorporated } = useClientState();
  const toast = useUndoToast();
  const [drill, setDrill] = React.useState<DrillSpec | null>(null);
  const who = whoSegments();
  const plan = planSegments();
  return (
    <div className="grid grid-cols-1 gap-5">
      <Row>
        <CoiCard incorporated={incorporated} onDrill={setDrill} />
        <SectionCard title="This week" meta={WEEK_RANGE} flush>
          <WeekList rows={incorporated ? WEEK_AFTER : WEEK} />
        </SectionCard>
      </Row>
      <IncPhaseTimelineCard after={incorporated} />
      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Documents from Northwind" unit="documents" segs={DOCS_FROM_CLIENT} onOpen={() => setDrill({ title: "Documents from Northwind", sub: `${DOCS_FROM_CLIENT.reduce((a, g) => a + g.items.length, 0)} documents`, groups: DOCS_FROM_CLIENT, docFrom: "From Northwind", link: { text: "Open documents", href: "/client/documents" } })} />
        <StatCard title="Documents SBC prepares" unit="documents" segs={DOCS_BY_SBC} onOpen={() => setDrill({ title: "Documents SBC prepares", sub: `${DOCS_BY_SBC.reduce((a, g) => a + g.items.length, 0)} documents`, groups: DOCS_BY_SBC, docFrom: "Prepared by SBC", link: { text: "Open documents", href: "/client/documents" } })} />
        <StatCard title="Who is working on what" unit="steps" segs={who} onOpen={() => setDrill({ title: "Who is working on what", sub: `${who.reduce((a, g) => a + g.items.length, 0)} open steps`, groups: who })} />
        <StatCard title="On plan or overdue" unit="steps" segs={plan} onOpen={() => setDrill({ title: "On plan or overdue", sub: `${plan.reduce((a, g) => a + g.items.length, 0)} active steps`, groups: plan })} />
      </div>
      <DrillModal spec={drill} onClose={() => setDrill(null)} />
      {toast.node}
    </div>
  );
}
