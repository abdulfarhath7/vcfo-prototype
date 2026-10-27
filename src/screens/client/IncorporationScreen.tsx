"use client";
import * as React from "react";
import Link from "next/link";
import { Check, Download, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, daysFrom, fmt } from "@/lib/dates";
import { PHASES, STEPS, COI_EXPECTED, stepsOf, doneCount } from "@/data/incorporation";
import { INC_NEEDS, WEEK_RANGE, DOCS_FROM_CLIENT, DOCS_BY_SBC, whoSegments, planSegments } from "@/data/incorporation-detail";
import { useClientState } from "@/components/shell/ClientState";
import { Row } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { barFill } from "@/components/ui/Bar";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { WeekList, type WeekRow } from "@/components/cards/WeekList";
import { IncTimelineCard, PhasesCard } from "./parts";
import { DrillModal, IncNeedsCard, StatCard, StatusBrief, WhoHoldsCard, statusGroups, type DrillSpec } from "./inc-parts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** CIN after the certificate (sample). */
export const NORTHWIND_CIN = "U62011KA2026PTC198765";

const WEEK: WeekRow[] = [
  { id: "w1", when: "Since 2 Oct", owner: "client", ownerLabel: "Northwind", text: "Clear passport scan for Director 1", href: "/client/incorporation/step/8" },
  { id: "w2", when: "Now", now: true, owner: "sbc", text: "KYC review and DSC", href: "/client/incorporation/step/10" },
  { id: "w3", when: "Thu 8 Oct", owner: "client", ownerLabel: "Northwind", text: "Sign the subscriber sheet", href: "/client/incorporation/step/9" },
  { id: "w4", when: "Fri 9 Oct", owner: "client", ownerLabel: "Northwind", text: "Upload utility bill and NOC", href: "/client/incorporation/step/7" },
  { id: "w5", when: "Sat 10 Oct", owner: "sbc", text: "Share MOA and AOA drafts", href: "/client/incorporation/step/11" },
];

const WEEK_AFTER: WeekRow[] = [
  { id: "x1", when: "Now", now: true, owner: "sbc", text: "First Board meeting", href: "/client/incorporation/step/15" },
  { id: "x2", when: "Wed 7 Oct", owner: "client", ownerLabel: "Northwind", text: "Open the bank account", href: "/client/incorporation/step/17" },
  { id: "x3", when: "Fri 9 Oct", owner: "sbc", text: "Company letterhead", href: "/client/incorporation/step/16" },
  { id: "x4", when: "Sat 10 Oct", owner: "sbc", text: "Auditor appointment (ADT-1)", href: "/client/incorporation/step/21" },
];

/** Navy COI card: days to the expected COI and one phase split bar. No ring. */
function CoiCard({ incorporated, onDrill, onBrief }: { incorporated: boolean; onDrill: (d: DrillSpec) => void; onBrief: () => void }) {
  const counts = PHASES.map((p) => {
    const total = stepsOf(p.n).length;
    const done = incorporated && p.n < 3 ? total : doneCount(p.n);
    return { p, total, done, cur: incorporated ? p.n === 3 : p.status === "In progress" };
  });
  const done = counts.reduce((a, c) => a + c.done, 0);
  const total = STEPS.length;
  const late = STEPS.find((s) => s.owner === "client" && s.status !== "Completed" && s.due && s.due < TODAY);
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
              <div className="mt-1.5 whitespace-nowrap text-13 text-navy-faint">
                Expected {DAYS[COI_EXPECTED.getDay()]} {fmt(COI_EXPECTED)}
              </div>
            </>
          )}
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="onNavy" size="sm" onClick={onBrief} aria-haspopup="dialog">
            <Download size={15} strokeWidth={1.5} /> Status brief
          </Button>
          <Button asChild variant="onNavy" size="sm">
            <Link href="/client/incorporation/board-resolution">
              <FileText size={15} strokeWidth={1.5} /> Board resolution
              <span className="inline-flex items-center gap-1 text-ok-mid">
                <Check size={13} strokeWidth={2} /> Ready
              </span>
            </Link>
          </Button>
        </div>
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
          {!incorporated && (late ?? risk) && (
            <Link href={`/client/incorporation/step/${(late ?? risk)!.n}`} className="ml-auto">
              <Chip tone={late ? "bad" : "warn"} className={cn("bg-white/[.12]", late ? "text-bad-mid" : "text-warn-mid")}>
                {late ? "Overdue" : "At risk"} · step {(late ?? risk)!.n}
              </Chip>
            </Link>
          )}
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
  const [brief, setBrief] = React.useState(false);
  const who = whoSegments();
  const plan = planSegments();
  return (
    <div className="grid grid-cols-1 gap-5">
      <Row>
        <CoiCard incorporated={incorporated} onDrill={setDrill} onBrief={() => setBrief(true)} />
        <SectionCard title="This week" meta={WEEK_RANGE} flush>
          <WeekList rows={incorporated ? WEEK_AFTER : WEEK} />
        </SectionCard>
      </Row>
      <IncTimelineCard />
      <PhasesCard />
      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Documents from Northwind" unit="documents" segs={DOCS_FROM_CLIENT} onOpen={() => setDrill({ title: "Documents from Northwind", sub: `${DOCS_FROM_CLIENT.reduce((a, g) => a + g.items.length, 0)} documents`, groups: DOCS_FROM_CLIENT, docFrom: "From Northwind", link: { text: "Open documents", href: "/client/documents" } })} />
        <StatCard title="Documents SBC prepares" unit="documents" segs={DOCS_BY_SBC} onOpen={() => setDrill({ title: "Documents SBC prepares", sub: `${DOCS_BY_SBC.reduce((a, g) => a + g.items.length, 0)} documents`, groups: DOCS_BY_SBC, docFrom: "Prepared by SBC", link: { text: "Open documents", href: "/client/documents" } })} />
        <StatCard title="Who is working on what" unit="steps" segs={who} onOpen={() => setDrill({ title: "Who is working on what", sub: `${who.reduce((a, g) => a + g.items.length, 0)} open steps`, groups: who })} />
        <StatCard title="On plan or overdue" unit="steps" segs={plan} onOpen={() => setDrill({ title: "On plan or overdue", sub: `${plan.reduce((a, g) => a + g.items.length, 0)} active steps`, groups: plan })} />
      </div>
      <Row>
        <IncNeedsCard rows={incorporated ? [] : INC_NEEDS} notify={toast.show} />
        <WhoHoldsCard phase={incorporated ? 3 : 2} />
      </Row>
      <DrillModal spec={drill} onClose={() => setDrill(null)} />
      <StatusBrief open={brief} onOpenChange={setBrief} incorporated={incorporated} notify={toast.show} />
      {toast.node}
    </div>
  );
}
