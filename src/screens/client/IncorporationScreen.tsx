"use client";
import { cn } from "@/lib/cn";
import { TODAY, daysFrom, fmt } from "@/lib/dates";
import { PHASES, STEPS, COI_EXPECTED, stepsOf, doneCount } from "@/data/incorporation";
import { useClientState } from "@/components/shell/ClientState";
import { Row } from "@/components/shell/Page";
import { Chip } from "@/components/ui/Chip";
import { barFill } from "@/components/ui/Bar";
import { SectionCard } from "@/components/cards/SectionCard";
import { WeekList, type WeekRow } from "@/components/cards/WeekList";
import { IncTimelineCard, PhasesCard } from "./parts";

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

/** Navy COI card: days to the expected COI and one phase split bar. No ring. */
function CoiCard({ incorporated }: { incorporated: boolean }) {
  const counts = PHASES.map((p) => {
    const total = stepsOf(p.n).length;
    const done = incorporated && p.n < 3 ? total : doneCount(p.n);
    return { p, total, done, cur: incorporated ? p.n === 3 : p.status === "In progress" };
  });
  const done = counts.reduce((a, c) => a + c.done, 0);
  const total = STEPS.length;
  const late = STEPS.find((s) => s.owner === "client" && s.status !== "Completed" && s.due && s.due < TODAY);
  return (
    <section className="grid min-w-0 grid-cols-1 items-center gap-5 overflow-hidden rounded-lg border border-navy bg-navy px-5 py-5 text-white sm:grid-cols-[auto_minmax(0,1fr)] md:px-6" aria-label="Certificate of Incorporation">
      <div className="min-w-0">
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
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-13">
          <b className="font-semibold">
            {done} / {total} steps
          </b>
          <span className="text-navy-faint">{Math.round((done / total) * 100)}%</span>
          {!incorporated && late && (
            <Chip tone="bad" className="ml-auto bg-white/[.12] text-bad-mid">
              Overdue · step {late.n}
            </Chip>
          )}
        </div>
        <div className="flex gap-1">
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
        </div>
      </div>
    </section>
  );
}

export function IncorporationScreen() {
  const { incorporated } = useClientState();
  return (
    <div className="grid grid-cols-1 gap-5">
      <Row>
        <CoiCard incorporated={incorporated} />
        <SectionCard title="This week" flush>
          <WeekList rows={WEEK} />
        </SectionCard>
      </Row>
      <IncTimelineCard />
      <PhasesCard />
    </div>
  );
}
