"use client";
import * as React from "react";
import Link from "next/link";
import { Download, List } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt, relative, urgency } from "@/lib/dates";
import { AREA_TONE, FILING_STATUS_TONE, OB_STATUS_TONE, isLate, type Frequency, type ObStatus } from "@/data/compliance";
import { clientById } from "@/data/staff-clients";
import { STAFF_FILINGS, clientDetails, sbcFields, staffObligation, staffRegistration, staffRegHref, type StaffFiling } from "@/data/staff-compliance";
import type { ThreadStep } from "@/components/cards/Thread";
import { SBC } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { SectionCard } from "@/components/cards/SectionCard";
import { Thread } from "@/components/cards/Thread";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { RecordHead, HoldsCard } from "@/screens/client/parts";
import { AssistCard, FromClientCard, NextStepButton, NoteCard, PeopleOnIt, ProofDialog, REVIEW_OB, ReviewCard, SbcFieldsCard, kbHref, useNextStep, withReview, type Proof } from "./comp-parts";
import { ClientName, clientHref, type StaffPortal } from "./parts";

/** Actions wrap on phones instead of running off the card. */
const WRAP = "flex max-w-[calc(100vw-4rem)] flex-wrap items-center justify-end gap-2";
const PORTAL_NAME: Record<string, string> = { GST: "GST", "Income tax": "Income-tax", MCA: "MCA", Payroll: "EPFO", FEMA: "RBI FIRMS", Labour: "Shram Suvidha" };
const STEP_MONTHS: Partial<Record<Frequency, number>> = { Monthly: 1, Quarterly: 3, "Half-yearly": 6, Annual: 12 };
const addMonths = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth() + n, date.getDate());

/** Thread with the first `done` steps done and the next one current. */
function advance(steps: ThreadStep[], done: number, by: string): ThreadStep[] {
  return steps.map((s, i): ThreadStep => {
    if (i < done) return s.state === "done" ? s : { ...s, state: "done", date: TODAY, by: `Done by ${by}`, note: undefined };
    if (i === done) return s.state === "current" ? s : { ...s, state: "current", by };
    return { ...s, state: "upcoming" };
  });
}

const pastColumnsFor = (onProof: (f: StaffFiling) => void): Column<StaffFiling>[] => [
  { key: "period", label: "Period", render: (f) => <span className="font-semibold">{f.period}</span> },
  { key: "due", label: "Due", width: 84, render: (f) => fmt(f.due) },
  { key: "filed", label: "Filed", width: 84, render: (f) => (f.filed ? fmt(f.filed) : "-") },
  { key: "status", label: "Status", width: 132, render: (f) => <Chip tone={FILING_STATUS_TONE[f.status]} fixed>{f.status}</Chip> },
  { key: "arn", label: "ARN", mono: true, render: (f) => f.arn ?? "-" },
  {
    key: "proof",
    label: "Proof",
    width: 90,
    render: (f) =>
      f.status === "Filed" ? (
        <button type="button" onClick={() => onProof(f)} className="rounded-sm hover:opacity-80">
          <Chip tone="prog" dot={false}>
            Proof
          </Chip>
        </button>
      ) : (
        "-"
      ),
  },
];

export function ObligationScreen({ portal, id }: { portal: StaffPortal; id: string }) {
  const o = staffObligation(id)!;
  const c = clientById(o.client)!;
  const [status, setStatus] = React.useState<ObStatus>(o.status);
  const [reminded, setReminded] = React.useState(false);
  const [approved, setApproved] = React.useState(false);

  const [proof, setProof] = React.useState<Proof | null>(null);
  const next = useNextStep(o.steps.length, o.steps.filter((s) => s.state === "done").length);

  const filedOn = status === "Filed" ? o.filed ?? TODAY : undefined;
  const steps = advance(o.steps, status === "Filed" ? o.steps.length : next.done, o.by);
  const done = steps.filter((s) => s.state === "done").length;
  const person = SBC.find((p) => p.name === o.by);
  // The registration link shows only when this client has that registration.
  const reg = o.startedBy ? staffRegistration(`${c.id}-${o.startedBy}`) : undefined;
  const late = status === "Overdue";
  const past = STAFF_FILINGS.filter((f) => f.client === o.client && f.obligationId === o.obId);
  const open = status !== "Filed";

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
            <ClientName id={c.id} short href={clientHref(portal, c.id)} className="text-12.5 font-semibold" />
            <Tag tone={AREA_TONE[o.area]}>{o.area}</Tag>
            <Chip tone={OB_STATUS_TONE[status]}>{status}</Chip>
            <span className={cn("text-12.5", late ? "font-semibold text-bad" : "text-muted")}>{filedOn ? `Filed ${fmt(filedOn)}` : `Due ${fmt(o.due)}`}</span>
            <PeopleOnIt client={c.id} />
          </>
        }
        action={
          open ? (
            <span className={WRAP}>
              {o.owner === "client" &&
                (reminded ? (
                  <Chip tone="ok">Reminder sent</Chip>
                ) : (
                  <Button size="sm" onClick={() => setReminded(true)}>
                    Send reminder
                  </Button>
                ))}
              {portal !== "lead" &&
                status === "In progress" &&
                (approved ? (
                  <Chip tone="ok">Approved</Chip>
                ) : (
                  <Button size="sm" variant="soft" onClick={() => setApproved(true)}>
                    Approve
                  </Button>
                ))}
              <Button size="sm" variant="primary" onClick={() => setStatus("Filed")}>
                Mark filed
              </Button>
            </span>
          ) : (
            <Button size="sm" onClick={() => setProof({ title: o.name, period: o.period, filed: filedOn, arn: o.idValue, client: c.id, area: o.area })}>
              <Download size={16} strokeWidth={1.5} /> Download acknowledgement
            </Button>
          )
        }
        facts={[
          { k: "Steps", v: `${done} of ${steps.length} done` },
          { k: "Period", v: o.period },
          { k: "Form", v: o.form },
          { k: o.idLabel ?? "Reference", v: (status === "Filed" && o.idValue) || "-", mono: true },
          { k: "Due rule", v: o.dueRule },
          { k: "Late fee", v: o.penalty },
          {
            k: "Started by",
            v: reg ? (
              <Link href={staffRegHref(portal, reg.id)} className="text-accent hover:underline">
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
          <SectionCard
            title="Thread"
            meta={`${o.period} · ${done} of ${steps.length} done`}
            icon={{ Icon: List, tone: "blue" }}
            right={open ? <NextStepButton busy={next.busy} disabled={done >= steps.length} onClick={next.run} /> : undefined}
          >
            <Thread steps={steps} />
          </SectionCard>
          {open && <AssistCard portalName={PORTAL_NAME[o.area]} form={`${o.name} for ${o.period}`} onFiled={() => setStatus("Filed")} />}
          <FromClientCard docs={withReview(o.docs, o.owner === "client" && open)} details={clientDetails("ob", o.obId, o.period)} confirmedBy={`Confirmed by ${c.short} on 3 Oct`} client={c.id} />
          <SbcFieldsCard rows={[["Period", o.period], ...sbcFields("ob", o.obId, status === "Filed", o.idLabel, o.idValue)]} locked={status === "Filed"} />
          {past.length > 0 && <DataGrid title="Past periods" columns={pastColumnsFor((f) => setProof({ title: o.name, period: f.period, filed: f.filed, arn: f.arn, client: c.id, area: o.area }))} rows={past} rowKey={(f) => f.id} rowLate={isLate} pageSize={6} />}
        </Col>
        <Col>
          <HoldsCard
            rows={[
              { k: "Owner", v: <OwnerChip owner={status === "Filed" ? "sbc" : o.owner} label={status !== "Filed" && o.owner === "client" ? c.short : undefined} /> },
              { k: "SBC person", v: person ? `${person.name} · ${person.role}` : o.by },
              { k: "Manager", v: c.manager },
              { k: "Last filed", v: filedOn ? fmt(filedOn) : o.lastFiled ? fmt(o.lastFiled) : "-" },
              { k: "Due", v: <span className={cn(late && "font-semibold text-bad")}>{fmt(o.due)}</span> },
            ]}
          />
          <NoteCard title="About" link={{ label: "Read the SBC SOP", href: kbHref(portal) }}>
            {o.name} is filed {o.frequency.toLowerCase()}: {o.dueRule}.
          </NoteCard>
          <NoteCard title="Why it applies">{reg ? `Started when the ${reg.name} was granted. Due ${o.dueRule}.` : `Applies to every company. Due ${o.dueRule}.`}</NoteCard>
          <NoteCard title="If filed late">{`${o.penalty} (the law's penalty)`}</NoteCard>
          <ReviewCard items={REVIEW_OB} initial={status === "Filed" ? 4 : done > 1 ? 2 : 0} />
          {coming.length > 0 && (
            <SectionCard title="Coming up" flush>
              <AttentionList rows={coming} />
            </SectionCard>
          )}
        </Col>
      </Cols>
      <ProofDialog proof={proof} onOpenChange={(v) => !v && setProof(null)} />
    </div>
  );
}
