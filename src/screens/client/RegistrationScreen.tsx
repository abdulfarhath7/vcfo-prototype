"use client";
import * as React from "react";
import { fmt } from "@/lib/dates";
import { REG_STATUS_TONE, registration } from "@/data/registrations";
import { obligation, obHref } from "@/data/compliance";
import { regFields } from "@/data/compliance-detail";
import { AFTER_COI, REG_NEXT_BEFORE, regBefore } from "@/data/client-before-coi";
import { CLIENT_PEOPLE } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import type { FactRow } from "@/components/cards/EditableFacts";
import {
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
  StepRing,
  TextCard,
  type RingTone,
} from "./item-parts";

const toRows = (pairs: Array<[string, string]>, mono = false): FactRow[] =>
  pairs.map(([k, v]) => ({ k, v, mono }));

const TONE_TEXT: Record<string, string> = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  prog: "text-accent",
  idle: "text-muted",
};

/** Client registration page, as the old Item.dc.html: deadline band, two-sided thread, from the client, filled by SBC. */
export function RegistrationScreen({ id }: { id: string }) {
  const before = useBeforeCoi();
  const found = registration(id)!;
  // Before the certificate nothing is started: the client fills the details.
  const r = before ? regBefore(found) : found;
  const toast = useUndoToast();
  const done = r.steps.filter((s) => s.state === "done").length;
  const fields = regFields(r);
  const locked = r.status === "Granted" || r.status === "Not needed";
  const asked = r.docs
    .filter((x) => x.status === "Asked" || x.status === "Sent back")
    .map((x) => x.name);
  const detailsRef = React.useRef<HTMLDivElement>(null);
  const starts = r.obligations.map((oid) => obligation(oid)).filter((o) => !!o);
  const uploaded = (n: number) =>
    toast.show(
      `${n} ${n === 1 ? "file" : "files"} uploaded · SBC reviews them next`,
    );
  const ring: RingTone =
    r.status === "Granted"
      ? "ok"
      : r.status === "Waiting on client"
        ? "warn"
        : "accent";

  const action =
    r.status === "Waiting on client" ? (
      <UploadCatcher requested={asked} onDone={uploaded}>
        <RecordAction label="Upload documents" onDone={() => {}} />
      </UploadCatcher>
    ) : r.status === "Granted" ? (
      <RecordAction
        label="Download certificate"
        onDone={() => toast.show(`${r.name} certificate downloaded`)}
      />
    ) : r.status === "Not needed" ? null : (
      <RecordAction
        label="Check my details"
        onDone={() => detailsRef.current?.scrollIntoView({ block: "start" })}
      />
    );

  const expected = before
    ? AFTER_COI
    : r.status === "Granted" && r.granted
      ? fmt(r.granted)
      : (r.nextLabel ?? "-");

  return (
    <div className="grid grid-cols-1 gap-5">
      <ItemBand
        ring={<StepRing done={done} total={r.steps.length} tone={ring} />}
        title={r.name}
        sub={
          <>
            <span className="underline decoration-dotted underline-offset-2">
              {r.form}
            </span>{" "}
            · {r.authority} · {r.team}
          </>
        }
        facts={[
          { k: r.status === "Granted" ? "Granted" : "Expected", v: expected },
          {
            k: "Number",
            v: r.idValue ? (
              <span className="font-mono text-13">{r.idValue}</span>
            ) : (
              "-"
            ),
          },
          {
            k: "Status",
            v: (
              <span className={TONE_TEXT[REG_STATUS_TONE[r.status]]}>
                {r.status}
              </span>
            ),
          },
        ]}
        people={
          <PeopleStack
            people={[
              { name: CLIENT_PEOPLE[0].name, role: "Northwind" },
              { name: r.by, role: "Project lead" },
              { name: "Pranay", role: "Manager" },
            ]}
          />
        }
        action={action}
      />
      <Cols>
        <Col>
          {r.status !== "Not needed" && (
            <SectionCard
              title="Steps"
              meta={`${done} of ${r.steps.length} done`}
            >
              <SideThread
                steps={r.steps}
                authority={r.authority}
                authLabel={r.authority}
                nextSub={before ? REG_NEXT_BEFORE : undefined}
              />
            </SectionCard>
          )}
          <div ref={detailsRef} className="scroll-mt-20">
            <FromClientCard
              key={before ? "before" : "after"}
              docs={r.docs}
              rows={toRows(fields.client)}
              editable={!locked}
              by={r.by}
              onUpload={uploaded}
              onSubmit={() => toast.show("Details sent to SBC")}
            />
          </div>
          <SbcFieldsCard rows={toRows(fields.sbc, true)} />
        </Col>
        <Col>
          <TextCard title="About" sop>
            {r.about}
          </TextCard>
          <TextCard
            title={r.status === "Not needed" ? "Not needed" : "Applies because"}
          >
            {r.status === "Not needed"
              ? `Not needed for Northwind: ${r.why}.`
              : `Applies to Northwind Technologies because: ${r.why}. Rule: ${r.rule}.`}
          </TextCard>
          {starts.length > 0 && (
            <SectionCard title="What it starts" flush>
              {starts.length === 0 ? (
                <Empty />
              ) : (
                starts.map((o) => (
                  <ListRow key={o.id} href={obHref("client", o.id)}>
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {o.name}
                    </span>
                    <span className="flex-none text-12.5 text-muted">
                      {o.frequency}
                    </span>
                  </ListRow>
                ))
              )}
            </SectionCard>
          )}
          <TextCard title="Renewal">
            {r.renewal === "None"
              ? "None"
              : `${r.renewal}. Reminders at 60, 30 and 7 days.`}
          </TextCard>
        </Col>
      </Cols>
      {toast.node}
    </div>
  );
}
