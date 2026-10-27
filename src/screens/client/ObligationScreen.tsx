"use client";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardCheck, List, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt, relative, urgency } from "@/lib/dates";
import { AREA_TONE, FILINGS, FILING_STATUS_TONE, OB_STATUS_TONE, isLate, obligation, type Filing, type Frequency } from "@/data/compliance";
import { registration, regHref } from "@/data/registrations";
import { aboutObligation, obFields } from "@/data/compliance-detail";
import { SBC, CLIENT_PEOPLE } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { Thread } from "@/components/cards/Thread";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { EditableFacts, type FactRow } from "@/components/cards/EditableFacts";
import { RecordHead, ItemDocsCard, HoldsCard } from "./parts";
import { AboutCard, FilingPanel, PeopleStack, RecordAction, UploadCatcher } from "./comp-parts";

const STEP_MONTHS: Partial<Record<Frequency, number>> = { Monthly: 1, Quarterly: 3, "Half-yearly": 6, Annual: 12 };
const addMonths = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth() + n, date.getDate());
const toRows = (pairs: Array<[string, string]>, mono = false): FactRow[] => pairs.map(([k, v]) => ({ k, v, mono }));

const pastColumns: Column<Filing>[] = [
  { key: "period", label: "Period", render: (f) => <span className="font-semibold">{f.period}</span> },
  { key: "due", label: "Due", width: 84, render: (f) => fmt(f.due) },
  { key: "filed", label: "Filed on", width: 90, render: (f) => (f.filed ? fmt(f.filed) : "-") },
  { key: "status", label: "Status", width: 132, render: (f) => <Chip tone={FILING_STATUS_TONE[f.status]} fixed>{f.status}</Chip> },
  { key: "arn", label: "Reference", mono: true, render: (f) => f.arn ?? "-" },
];

export function ObligationScreen({ id }: { id: string }) {
  const o = obligation(id)!;
  const toast = useUndoToast();
  const done = o.steps.filter((s) => s.state === "done").length;
  const person = SBC.find((p) => p.name === o.by);
  const reg = o.startedBy ? registration(o.startedBy) : undefined;
  const late = o.status === "Overdue";
  const filed = o.status === "Filed";
  const past = FILINGS.filter((f) => f.obligationId === o.id);
  const [pick, setPick] = React.useState<Filing | null>(null);
  const fields = obFields(o);
  const [client, setClient] = React.useState<FactRow[]>(() => toRows(fields.client));
  const asked = o.docs.filter((x) => x.status === "Asked" || x.status === "Sent back").map((x) => x.name);
  const about = aboutObligation(o);
  const detailsRef = React.useRef<HTMLDivElement>(null);

  const step = STEP_MONTHS[o.frequency];
  const coming: AttentionRow[] = step
    ? [1, 2, 3].map((k) => {
        const date = addMonths(o.due, step * k);
        return { id: `n${k}`, date, title: o.name, sub: o.dueRule, chip: { label: relative(date), tone: urgency(date) } };
      })
    : [];

  const action =
    o.owner === "client" && !filed ? (
      <UploadCatcher requested={asked} onDone={(n) => toast.show(`${n} ${n === 1 ? "file" : "files"} uploaded · SBC reviews them next`)}>
        <RecordAction label="Upload documents" onDone={() => {}} />
      </UploadCatcher>
    ) : filed ? (
      <RecordAction label="Download acknowledgement" onDone={() => toast.show(`${o.form} acknowledgement downloaded`)} />
    ) : (
      <RecordAction label="Check my details" onDone={() => detailsRef.current?.scrollIntoView({ block: "start" })} />
    );

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
            <span className="text-12.5 text-muted">
              {done} of {o.steps.length} steps
            </span>
          </>
        }
        action={
          <>
            <PeopleStack people={[{ name: CLIENT_PEOPLE[0].name, role: "Northwind" }, { name: o.by, role: person?.role ?? "SBC" }, { name: "Pranay", role: "Manager" }]} />
            {action}
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
          <SectionCard title="This period" meta={`${o.period} · ${done} of ${o.steps.length} done`} icon={{ Icon: List, tone: "blue" }}>
            <Thread steps={o.steps} />
          </SectionCard>
          <UploadCatcher requested={asked} onDone={(n) => toast.show(`${n} ${n === 1 ? "file" : "files"} uploaded · SBC reviews them next`)}>
            <ItemDocsCard title="From Northwind" docs={o.docs} canUpload={o.owner === "client" && !filed} />
          </UploadCatcher>
          <div ref={detailsRef} className="scroll-mt-20">
            <EditableFacts
              title="Your details"
              icon={{ Icon: User, tone: "violet" }}
              meta={filed ? "Locked" : undefined}
              rows={client}
              editable={!filed}
              saveLabel="Submit details"
              onSave={(next) => {
                const prev = client;
                setClient(next);
                toast.show("Details sent to SBC", () => setClient(prev));
              }}
            />
          </div>
          <EditableFacts title="Filled by SBC" icon={{ Icon: ClipboardCheck, tone: "teal" }} rows={toRows(fields.sbc, true)} />
          {past.length > 0 && <DataGrid title="Past periods" columns={pastColumns} rows={past} rowKey={(f) => f.id} rowLate={isLate} pageSize={6} onRowClick={setPick} selectedKey={pick?.id} />}
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
          <AboutCard about={about.about} whyTitle="Why it applies" why={about.why} />
          <SectionCard title="If filed late" icon={{ Icon: AlertTriangle, tone: "red" }}>
            <p className="text-13.5 text-ink-2">{o.penalty}</p>
          </SectionCard>
          {coming.length > 0 && (
            <SectionCard title="Coming up" flush>
              <AttentionList rows={coming} />
            </SectionCard>
          )}
        </Col>
      </Cols>
      <FilingPanel filing={pick} onClose={() => setPick(null)} />
      {toast.node}
    </div>
  );
}
