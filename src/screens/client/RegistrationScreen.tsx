"use client";
import { List } from "lucide-react";
import { fmt, relative, urgency } from "@/lib/dates";
import { REGULATOR_LABEL, REGULATOR_TONE, REG_STATUS_TONE, registration } from "@/data/registrations";
import { obligation, obHref } from "@/data/compliance";
import { SBC } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { SectionCard } from "@/components/cards/SectionCard";
import { Thread } from "@/components/cards/Thread";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { RecordHead, ItemDocsCard, HoldsCard } from "./parts";

export function RegistrationScreen({ id }: { id: string }) {
  const r = registration(id)!;
  const done = r.steps.filter((s) => s.state === "done").length;
  const person = SBC.find((p) => p.name === r.by);

  const coming: AttentionRow[] = [
    ...(r.next ? [{ id: "next", date: r.next, title: r.nextLabel ?? r.name, sub: r.authority, chip: { label: relative(r.next), tone: urgency(r.next) } }] : []),
    ...r.obligations
      .map((oid) => obligation(oid))
      .filter((o) => !!o)
      .map((o) => ({ id: o.id, date: o.due, title: `${o.name} · ${o.period}`, sub: o.frequency, chip: { label: o.status, tone: o.status === "Filed" ? ("ok" as const) : urgency(o.due) }, href: obHref("client", o.id) })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="grid grid-cols-1 gap-5">
      <RecordHead
        eyebrow={`${r.authority} · ${r.form}`}
        title={r.name}
        chips={
          <>
            <Tag tone={REGULATOR_TONE[r.regulator]}>{REGULATOR_LABEL[r.regulator]}</Tag>
            <Chip tone={REG_STATUS_TONE[r.status]}>{r.status}</Chip>
            {r.nextLabel && <span className="text-12.5 text-muted">{r.nextLabel}</span>}
          </>
        }
        facts={[
          { k: r.idLabel ?? "Number", v: r.idValue ?? "-", mono: true },
          { k: r.status === "Granted" ? "Granted" : "Started", v: r.granted ? fmt(r.granted) : r.started ? fmt(r.started) : "-" },
          { k: "Renewal", v: r.renewal },
        ]}
      />
      <Cols>
        <Col>
          <SectionCard title="Thread" meta={`${done} of ${r.steps.length} done`} icon={{ Icon: List, tone: "blue" }}>
            <Thread steps={r.steps} />
          </SectionCard>
          <ItemDocsCard docs={r.docs} canUpload={r.status === "Waiting on client"} />
        </Col>
        <Col>
          <HoldsCard
            rows={[
              { k: "Owner", v: <OwnerChip owner={r.owner} label={r.owner === "client" ? "Northwind" : undefined} /> },
              { k: "SBC person", v: person ? `${person.name} · ${person.role}` : r.by },
              { k: "Team", v: r.team },
              { k: "Typical time", v: r.typical },
            ]}
          />
          <SectionCard title="Coming up" flush>
            <AttentionList rows={coming} />
          </SectionCard>
        </Col>
      </Cols>
    </div>
  );
}
