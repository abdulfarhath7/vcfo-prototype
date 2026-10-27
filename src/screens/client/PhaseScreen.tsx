"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { fmt } from "@/lib/dates";
import { PHASES, stepsOf, doneCount, stepTone, stepHref, type Step } from "@/data/incorporation";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { Bar } from "@/components/ui/Bar";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { StackedBar } from "@/components/cards/StackedBar";
import { RecordHead } from "./parts";

const phaseTone = { Done: "ok", "In progress": "prog", Upcoming: "idle" } as const;

export function PhaseScreen({ n }: { n: 1 | 2 | 3 }) {
  const p = PHASES[n - 1];
  const steps = stepsOf(n);
  const done = doneCount(n);
  const pct = Math.round((done / steps.length) * 100);

  const columns: Column<Step>[] = [
    { key: "n", label: "#", width: 48, align: "right", render: (s) => <span className="font-mono text-faint">{s.n}</span> },
    { key: "title", label: "Step", render: (s) => <span className="font-semibold">{s.title}</span> },
    { key: "owner", label: "Owner", width: 120, render: (s) => <OwnerChip owner={s.owner} label={s.owner === "client" ? "Northwind" : undefined} /> },
    { key: "status", label: "Status", width: 132, render: (s) => <Chip tone={stepTone[s.status]} fixed>{s.status}</Chip> },
    { key: "time", label: "Typical time", width: 200, render: (s) => <span className="text-muted">{s.time}</span> },
    {
      key: "open",
      label: "",
      width: 44,
      align: "center",
      render: (s) => (
        <Link href={stepHref("client", s.n)} aria-label={`Open step ${s.n}`} className="inline-grid text-faint hover:text-ink">
          <ChevronRight size={16} strokeWidth={1.5} />
        </Link>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <RecordHead
        eyebrow={`Phase ${p.n} of 3`}
        title={p.short}
        chips={
          <>
            <Chip tone={phaseTone[p.status]}>{p.status}</Chip>
            <span className="text-12.5 text-muted">
              {fmt(p.start)} – {fmt(p.end)}
            </span>
          </>
        }
        action={
          <span className="w-40 text-right text-12.5 text-muted">
            <b className="text-14 font-semibold text-ink">
              {done}/{steps.length}
            </b>{" "}
            steps · {pct}%
            <Bar pct={pct} tone={pct === 100 ? "ok" : "accent"} className="mt-1.5" />
          </span>
        }
      />
      <Cols>
        <Col>
          <DataGrid title="Steps" meta={`${done} of ${steps.length} done`} columns={columns} rows={steps} rowKey={(s) => String(s.n)} rowHref={(s) => stepHref("client", s.n)} pageSize={12} />
        </Col>
        <Col>
          <SectionCard title="Who holds it now">
            <StackedBar
              total={steps.length - done}
              title="Open steps"
              segments={[
                { label: "Northwind", value: steps.filter((s) => s.owner === "client" && s.status !== "Completed").length, tone: "warn" },
                { label: "SBC", value: steps.filter((s) => s.owner === "sbc" && s.status !== "Completed").length, tone: "accent" },
                { label: "MCA", value: steps.filter((s) => s.owner === "mca" && s.status !== "Completed").length, tone: "violet" },
              ]}
            />
          </SectionCard>
        </Col>
      </Cols>
    </div>
  );
}
