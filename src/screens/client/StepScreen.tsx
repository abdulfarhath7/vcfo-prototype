"use client";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { PHASES, stepTone } from "@/data/incorporation";
import { SBC } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { List } from "lucide-react";
import { SectionCard } from "@/components/cards/SectionCard";
import { Thread } from "@/components/cards/Thread";
import { KeyValue } from "@/components/cards/KeyValue";
import { stepDetail } from "./step-detail";
import { RecordHead, ItemDocsCard, HoldsCard } from "./parts";

export function StepScreen({ n }: { n: number }) {
  const sd = stepDetail(n)!;
  const s = sd.step;
  const phase = PHASES[s.phase - 1];
  const late = s.status !== "Completed" && !!s.due && s.due < TODAY;
  const person = SBC.find((p) => p.name === (s.by ?? "Bharath"));
  const clientOwned = s.owner === "client" && s.status !== "Completed";

  return (
    <div className="grid grid-cols-1 gap-5">
      <RecordHead
        eyebrow={`Step ${s.n} · ${phase.short}`}
        title={s.title}
        chips={
          <>
            <OwnerChip owner={s.owner} label={s.owner === "client" ? "Northwind" : undefined} />
            <Chip tone={stepTone[s.status]}>{s.status}</Chip>
            {s.done && <span className="text-12.5 text-muted">Done {fmt(s.done)}</span>}
            {!s.done && s.due && <span className={cn("text-12.5", late ? "font-semibold text-bad" : "text-muted")}>Due {fmt(s.due)}</span>}
            {sd.forms.map((f) => (
              <Tag key={f} tone="violet">
                {f}
              </Tag>
            ))}
          </>
        }
      />
      <Cols>
        <Col>
          <SectionCard title="Thread" icon={{ Icon: List, tone: "blue" }}>
            <Thread steps={sd.thread} />
          </SectionCard>
          <ItemDocsCard docs={sd.docs} canUpload={clientOwned} />
        </Col>
        <Col>
          <HoldsCard
            rows={[
              { k: "Owner", v: <OwnerChip owner={s.owner} label={s.owner === "client" ? "Northwind" : undefined} /> },
              { k: "SBC person", v: person ? `${person.name} · ${person.role}` : "Bharath · Project lead" },
              { k: "Typical time", v: s.time },
              { k: s.done ? "Done" : "Due", v: s.done ? fmt(s.done) : s.due ? <span className={cn(late && "font-semibold text-bad")}>{fmt(s.due)}</span> : "-" },
            ]}
          />
          {sd.details.length > 0 && (
            <SectionCard title="What was provided">
              <KeyValue rows={sd.details} cols={1} />
            </SectionCard>
          )}
        </Col>
      </Cols>
    </div>
  );
}
