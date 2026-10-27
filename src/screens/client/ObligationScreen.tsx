"use client";
import Link from "next/link";
import { List } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt, relative, urgency } from "@/lib/dates";
import { AREA_TONE, FILINGS, FILING_STATUS_TONE, OB_STATUS_TONE, isLate, obligation, type Filing, type Frequency } from "@/data/compliance";
import { registration, regHref } from "@/data/registrations";
import { SBC } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { SectionCard } from "@/components/cards/SectionCard";
import { Thread } from "@/components/cards/Thread";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { RecordHead, ItemDocsCard, HoldsCard } from "./parts";

const STEP_MONTHS: Partial<Record<Frequency, number>> = { Monthly: 1, Quarterly: 3, "Half-yearly": 6, Annual: 12 };
const addMonths = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth() + n, date.getDate());

const pastColumns: Column<Filing>[] = [
  { key: "period", label: "Period", render: (f) => <span className="font-semibold">{f.period}</span> },
  { key: "due", label: "Due", width: 84, render: (f) => fmt(f.due) },
  { key: "filed", label: "Filed", width: 84, render: (f) => (f.filed ? fmt(f.filed) : "-") },
  { key: "status", label: "Status", width: 132, render: (f) => <Chip tone={FILING_STATUS_TONE[f.status]} fixed>{f.status}</Chip> },
  { key: "arn", label: "ARN", mono: true, render: (f) => f.arn ?? "-" },
];

export function ObligationScreen({ id }: { id: string }) {
  const o = obligation(id)!;
  const done = o.steps.filter((s) => s.state === "done").length;
  const person = SBC.find((p) => p.name === o.by);
  const reg = o.startedBy ? registration(o.startedBy) : undefined;
  const late = o.status === "Overdue";
  const past = FILINGS.filter((f) => f.obligationId === o.id);

  const step = STEP_MONTHS[o.frequency];
  const coming: AttentionRow[] = step
    ? [1, 2, 3].map((k) => {
        const date = addMonths(o.due, step * k);
        return { id: `n${k}`, date, title: o.name, sub: o.dueRule, chip: { label: relative(date), tone: urgency(date) } };
      })
    : [];

  return (
    <div className="grid grid-cols-1 gap-5">
      <RecordHead
        eyebrow={`${o.law} · ${o.frequency}`}
        title={o.name}
        chips={
          <>
            <Tag tone={AREA_TONE[o.area]}>{o.area}</Tag>
            <Chip tone={OB_STATUS_TONE[o.status]}>{o.status}</Chip>
            <span className={cn("text-12.5", late ? "font-semibold text-bad" : "text-muted")}>{o.filed ? `Filed ${fmt(o.filed)}` : `Due ${fmt(o.due)}`}</span>
          </>
        }
        facts={[
          { k: "Period", v: o.period },
          { k: "Form", v: o.form },
          { k: o.idLabel ?? "Reference", v: o.idValue ?? "-", mono: true },
          { k: "Due rule", v: o.dueRule },
          { k: "Late fee", v: o.penalty },
          {
            k: "Started by",
            v: reg ? (
              <Link href={regHref("client", reg.id)} className="text-accent hover:underline">
                {reg.name}
              </Link>
            ) : (
              "Every company"
            ),
          },
        ]}
      />
      <Cols>
        <Col>
          <SectionCard title="Thread" meta={`${o.period} · ${done} of ${o.steps.length} done`} icon={{ Icon: List, tone: "blue" }}>
            <Thread steps={o.steps} />
          </SectionCard>
          <ItemDocsCard docs={o.docs} canUpload={o.owner === "client" && o.status !== "Filed"} />
          {past.length > 0 && <DataGrid title="Past filings" columns={pastColumns} rows={past} rowKey={(f) => f.id} rowLate={isLate} pageSize={6} />}
        </Col>
        <Col>
          <HoldsCard
            rows={[
              { k: "Owner", v: <OwnerChip owner={o.owner} label={o.owner === "client" ? "Northwind" : undefined} /> },
              { k: "SBC person", v: person ? `${person.name} · ${person.role}` : o.by },
              { k: "Last filed", v: o.lastFiled ? fmt(o.lastFiled) : "-" },
              { k: "Due", v: <span className={cn(late && "font-semibold text-bad")}>{fmt(o.due)}</span> },
            ]}
          />
          {coming.length > 0 && (
            <SectionCard title="Coming up" flush>
              <AttentionList rows={coming} />
            </SectionCard>
          )}
        </Col>
      </Cols>
    </div>
  );
}
