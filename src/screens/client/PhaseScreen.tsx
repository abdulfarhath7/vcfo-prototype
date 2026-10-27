"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt, fmtYear } from "@/lib/dates";
import { PHASES, COI_EXPECTED, stepsOf, doneCount, stepHref, phaseHref, type Step } from "@/data/incorporation";
import { useClientState } from "@/components/shell/ClientState";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { Bar } from "@/components/ui/Bar";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { StatusCircle } from "@/components/cards/GanttTimeline";
import { RecordHead } from "./parts";
import { DrillModal, JourneyCard, Pager, PortalProof, StatCard, stepDate, stepWord, statusGroups, type DrillSpec } from "./inc-parts";
import { stepDetail } from "./step-detail";

const phaseTone = { Done: "ok", "In progress": "prog", Upcoming: "idle" } as const;
const circle = (s: Step) => (s.status === "Completed" ? "done" : s.status === "Upcoming" ? "planned" : "current");

export function PhaseScreen({ n }: { n: 1 | 2 | 3 }) {
  const { incorporated } = useClientState();
  const toast = useUndoToast();
  const [drill, setDrill] = React.useState<DrillSpec | null>(null);
  const p = PHASES[n - 1];
  const steps = stepsOf(n);
  const done = doneCount(n);
  const pct = Math.round((done / steps.length) * 100);
  // Focus: the first step waiting on Northwind, else the first open step, else the last (old renderPhase).
  const focus = (steps.find((s) => s.owner === "client" && s.status === "Waiting") ?? steps.find((s) => s.status !== "Completed") ?? steps[steps.length - 1]).n;
  const cur = steps.find((s) => s.n === focus)!;
  const owners = [
    { label: "Northwind", tone: "warn" as const, items: steps.filter((s) => s.owner === "client").map((s) => s.n) },
    { label: "SBC", tone: "accent" as const, items: steps.filter((s) => s.owner === "sbc").map((s) => s.n) },
    { label: "MCA", tone: "violet" as const, items: steps.filter((s) => s.owner === "mca").map((s) => s.n) },
  ].filter((o) => o.items.length > 0);
  const drillPhase = () => setDrill({ title: `Phase ${p.n} · ${p.short}`, sub: `${done} of ${steps.length} steps done`, groups: statusGroups(steps) });

  const columns: Column<Step>[] = [
    { key: "st", label: "", width: 40, align: "center", render: (s) => <StatusCircle status={circle(s)} className="mx-auto" /> },
    { key: "n", label: "#", width: 44, align: "right", render: (s) => <span className="font-mono text-faint">{s.n}</span> },
    {
      key: "title",
      label: "Step",
      render: (s) => (
        <span className="flex min-w-[180px] items-center gap-2">
          <span className="truncate font-semibold">{s.title}</span>
          {s.owner === "client" && s.due && s.due < TODAY && s.status !== "Completed" && <Tag tone="bad">Urgent</Tag>}
        </span>
      ),
    },
    { key: "owner", label: "Owner", width: 112, render: (s) => <OwnerChip owner={s.owner} label={s.owner === "client" ? "Northwind" : undefined} /> },
    {
      key: "status",
      label: "Status",
      width: 124,
      render: (s) => {
        const w = stepWord(s);
        return (
          <Chip tone={w.tone} fixed>
            {w.label}
          </Chip>
        );
      },
    },
    {
      key: "date",
      label: "Date",
      width: 128,
      render: (s) => {
        const dt = stepDate(s);
        return <span className={cn("whitespace-nowrap", dt.late ? "font-semibold text-bad" : "text-muted")}>{dt.text}</span>;
      },
    },
    { key: "proof", label: "Portal · proof", width: 120, render: (s) => <PortalProof step={s} forms={stepDetail(s.n)?.forms ?? []} notify={toast.show} /> },
    {
      key: "open",
      label: "",
      width: 44,
      align: "center",
      render: (s) => (
        <Link href={stepHref("client", s.n)} aria-label={`Open step ${s.n} · ${s.title}`} className="inline-grid text-faint hover:text-ink">
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <RecordHead
        eyebrow={`Incorporation · phase ${p.n} of 3`}
        title={p.short}
        chips={
          <>
            <Chip tone={phaseTone[p.status]}>{p.status}</Chip>
            <span className="text-12.5 text-muted">
              {done}/{steps.length} · {fmt(p.start)} to {fmt(p.end)} · {p.status === "Done" ? "finished" : "ends"} {fmtYear(p.end)}
            </span>
          </>
        }
        action={
          <button type="button" onClick={drillPhase} className="w-40 rounded-md p-1 text-right text-12.5 text-muted hover:bg-raised" aria-label={`Phase ${p.n} · ${pct}% · ${done} of ${steps.length} steps done`}>
            <b className="text-14 font-semibold text-ink">{pct}%</b> · {done} of {steps.length}
            <Bar pct={pct} tone={pct === 100 ? "ok" : "accent"} className="mt-1.5" />
          </button>
        }
      />
      <SectionCard title="Phase progress" meta={`${done} of ${steps.length} steps`}>
        <button type="button" onClick={drillPhase} className="block w-full text-left" aria-label="Steps of this phase by status">
          <span className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-line-soft" aria-hidden>
            {steps.map((s) => (
              <i key={s.n} className={cn("block h-full flex-1", s.status === "Completed" ? "bg-ok-mid" : s.status === "Upcoming" ? "bg-line" : s.owner === "client" && s.due && s.due < TODAY ? "bg-bad-mid" : "bg-accent")} />
            ))}
          </span>
        </button>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-12.5 text-muted">
          <div>
            Starts <b className="font-semibold text-ink">{fmt(p.start)}</b>
          </div>
          <div>
            {p.status === "Done" ? "Finished" : "Ends"} <b className="font-semibold text-ink">{fmt(p.end)}</b>
          </div>
          {p.status !== "Done" && (
            <div>
              Now{" "}
              <Link href={stepHref("client", cur.n)} className="font-semibold text-accent hover:underline">
                Step {cur.n} · {cur.title}
              </Link>
            </div>
          )}
          {p.n === 2 && (
            <div>
              COI <b className="font-semibold text-ink">{fmt(COI_EXPECTED)}</b>
              {incorporated ? "" : " (expected)"}
            </div>
          )}
          <div>
            Reviewer <b className="font-semibold text-ink">Bharath</b>
          </div>
        </dl>
      </SectionCard>
      <Cols>
        <Col>
          <DataGrid title="Steps" meta={`${steps.length} steps`} columns={columns} rows={steps} rowKey={(s) => String(s.n)} selectedKey={String(focus)} pageSize={14} rowLate={(s) => s.owner === "client" && !!s.due && s.due < TODAY && s.status !== "Completed"} />
        </Col>
        <Col>
          <JourneyCard phase={n} focus={focus} />
          <StatCard
            title="Who is doing it"
            unit="steps"
            segs={owners}
            onOpen={() => setDrill({ title: `Who is doing it · Phase ${p.n}`, sub: `${p.short} · ${steps.length} steps`, groups: owners })}
          />
        </Col>
      </Cols>
      <Pager
        prev={n > 1 ? { href: phaseHref("client", n - 1), label: `Phase ${n - 1} · ${PHASES[n - 2].short}` } : { href: "/client/incorporation", label: "All phases" }}
        next={n < 3 ? { href: phaseHref("client", n + 1), label: `Phase ${n + 1} · ${PHASES[n].short}` } : { href: "/client/incorporation", label: "All phases" }}
      />
      <DrillModal spec={drill} onClose={() => setDrill(null)} />
      {toast.node}
    </div>
  );
}
