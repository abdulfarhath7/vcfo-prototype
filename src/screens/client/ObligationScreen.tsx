"use client";
import * as React from "react";
import Link from "next/link";
import { fmt, fmtYear } from "@/lib/dates";
import {
  FILINGS,
  FILING_STATUS_TONE,
  OB_STATUS_TONE,
  obligation,
  type Filing,
} from "@/data/compliance";
import { registration, regHref } from "@/data/registrations";
import { aboutObligation, obFields } from "@/data/compliance-detail";
import {
  AFTER_COI,
  OB_NEXT_BEFORE,
  OB_PAST_BEFORE,
  OB_PREPARED_BEFORE,
  obBefore,
} from "@/data/client-before-coi";
import { CLIENT_PEOPLE } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { AreaPill, Chip, type ChipTone } from "@/components/ui/Chip";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import type { FactRow } from "@/components/cards/EditableFacts";
import {
  FilingPanel,
  PeopleStack,
  RecordAction,
  UploadCatcher,
  useBeforeCoi,
} from "./comp-parts";
import {
  FromClientCard,
  ItemBand,
  SbcFieldsCard,
  SideThread,
  TextCard,
  isIdentifier,
} from "./item-parts";

const toRows = (pairs: Array<[string, string]>): FactRow[] =>
  pairs.map(([k, v]) => ({ k, v, mono: isIdentifier(k, v) }));

const LONG: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};
const longPeriod = (p: string) =>
  LONG[p.slice(0, 3)] && /^\w{3} \d{4}$/.test(p)
    ? `${LONG[p.slice(0, 3)]} ${p.slice(4)}`
    : p;

/** One row of the old Past periods table: period, filed on, reference, status. */
interface PastRow {
  id: string;
  period: string;
  filed: string;
  ref: string;
  status: string;
  tone: ChipTone;
  filing?: Filing;
}

const pastColumns: Column<PastRow>[] = [
  {
    key: "period",
    label: "Period",
    render: (r) => (
      <span className="whitespace-nowrap font-medium text-ink">{r.period}</span>
    ),
  },
  {
    key: "filed",
    label: "Filed on",
    width: 120,
    render: (r) => <span className="whitespace-nowrap">{r.filed}</span>,
  },
  { key: "ref", label: "Reference", render: (r) => (r.ref === "-" ? <span className="text-faint">-</span> : <span className="font-mono text-13">{r.ref}</span>) },
  {
    key: "status",
    label: "Status",
    width: 124,
    render: (r) => (
      <Chip tone={r.tone} fixed>
        {r.status}
      </Chip>
    ),
  },
];

const pastBefore: PastRow[] = OB_PAST_BEFORE.map(([period, filed, ref, late]) => ({
  id: period,
  period,
  filed,
  ref,
  status: late ? "Filed late" : "Filed",
  tone: late ? "warn" : "ok",
}));

const pastAfter = (id: string): PastRow[] =>
  FILINGS.filter((f) => f.obligationId === id).map((f) => ({
    id: f.id,
    period: f.period,
    filed: f.filed ? fmtYear(f.filed) : "-",
    ref: f.arn ?? "-",
    status: f.status,
    tone: FILING_STATUS_TONE[f.status],
    filing: f,
  }));

/** Client obligation page, as the old Item.dc.html: deadline band, this period, from the client, filled by SBC, past periods. */
export function ObligationScreen({ id }: { id: string }) {
  const before = useBeforeCoi();
  const found = obligation(id)!;
  // Before the certificate nothing is filed: the client fills the details.
  const o = before ? obBefore(found) : found;
  const toast = useUndoToast();
  const done = o.steps.filter((s) => s.state === "done").length;
  const reg = o.startedBy ? registration(o.startedBy) : undefined;
  const late = o.status === "Overdue";
  const filed = o.status === "Filed";
  const past = before ? pastBefore : pastAfter(o.id);
  const [pick, setPick] = React.useState<Filing | null>(null);
  const fields = obFields(o);
  // Before the certificate the old page shows the October period, prepared from the Tally export.
  const clientRows: Array<[string, string]> = before
    ? [
        ["Period", longPeriod(o.period)],
        ["Prepared from", OB_PREPARED_BEFORE],
      ]
    : fields.client;
  const asked = o.docs
    .filter((x) => x.status === "Asked" || x.status === "Sent back")
    .map((x) => x.name);
  const about = aboutObligation(o);
  const detailsRef = React.useRef<HTMLDivElement>(null);
  const uploaded = (n: number) =>
    toast.show(
      `${n} ${n === 1 ? "file" : "files"} uploaded · SBC reviews them next`,
    );

  const action =
    o.owner === "client" && !filed ? (
      <UploadCatcher requested={asked} onDone={uploaded}>
        <RecordAction label="Upload documents" onDone={() => {}} />
      </UploadCatcher>
    ) : filed ? (
      <RecordAction
        label="Download acknowledgement"
        onDone={() => toast.show(`${o.form} acknowledgement downloaded`)}
      />
    ) : (
      <RecordAction
        label="Check my details"
        onDone={() => detailsRef.current?.scrollIntoView({ block: "start" })}
      />
    );

  return (
    <div className="grid grid-cols-1 gap-5">
      <ItemBand
        title={o.name}
        chips={
          <>
            <Chip tone={OB_STATUS_TONE[o.status]} fixed>
              {o.status}
            </Chip>
            <AreaPill area={o.area} />
          </>
        }
        sub={
          <>
            {o.law} · {o.frequency} ·{" "}
            {reg ? (
              <Link
                href={regHref("client", reg.id)}
                className="hover:text-accent hover:underline"
              >
                Started by {reg.name}
              </Link>
            ) : (
              "Every company"
            )}
          </>
        }
        facts={[
          {
            k: o.filed ? "Filed" : "Next due",
            v: before ? AFTER_COI : o.filed ? fmt(o.filed) : fmt(o.due),
            tone: late ? "bad" : undefined,
          },
          { k: "Steps", v: `${done} of ${o.steps.length}` },
        ]}
        people={
          <PeopleStack
            people={[
              { name: CLIENT_PEOPLE[0].name, role: "Northwind" },
              { name: o.by, role: "Project lead" },
              { name: "Pranay", role: "Manager" },
            ]}
          />
        }
        action={action}
      />
      <Cols>
        <Col>
          <SectionCard title="This period" meta={longPeriod(o.period)} bodyClassName="py-1.5">
            <SideThread
              steps={o.steps}
              authority={o.law}
              authLabel={`${o.law} portal`}
              nextSub={before ? OB_NEXT_BEFORE : undefined}
            />
          </SectionCard>
          <div ref={detailsRef} className="scroll-mt-20">
            <FromClientCard
              key={before ? "before" : "after"}
              docs={o.docs}
              rows={toRows(clientRows)}
              editable={!filed}
              by={o.by}
              onUpload={uploaded}
              onSubmit={() => toast.show("Details sent to SBC")}
            />
          </div>
          <SbcFieldsCard
            rows={toRows(
              before
                ? fields.sbc.map(([k]): [string, string] => [k, "-"])
                : fields.sbc,
            )}
          />

          <DataGrid
            title="Past periods"
            columns={pastColumns}
            rows={past}
            rowKey={(f) => f.id}
            pageSize={6}
            onRowClick={before ? undefined : (r) => r.filing && setPick(r.filing)}
            selectedKey={pick?.id}
            empty="None"
          />
        </Col>
        <Col>
          <TextCard title="About" sop>
            {about.about}
          </TextCard>
          <TextCard title="Why it applies">
            {about.why} Due {o.dueRule}.
          </TextCard>
          <TextCard title="If filed late">
            {o.penalty} (the law&apos;s penalty)
          </TextCard>
          <TextCard title="Due rule">{o.dueRule}</TextCard>
        </Col>
      </Cols>
      <FilingPanel filing={pick} onClose={() => setPick(null)} onNotify={toast.show} />
      {toast.node}
    </div>
  );
}
