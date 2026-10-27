"use client";
import * as React from "react";
import { ClipboardCheck, List, User } from "lucide-react";
import { fmt, relative, urgency } from "@/lib/dates";
import { REGULATOR_LABEL, REGULATOR_TONE, REG_STATUS_TONE, registration } from "@/data/registrations";
import { OB_STATUS_TONE, obligation, obHref } from "@/data/compliance";
import { regFields } from "@/data/compliance-detail";
import { SBC, CLIENT_PEOPLE } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { Thread } from "@/components/cards/Thread";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { EditableFacts, type FactRow } from "@/components/cards/EditableFacts";
import { RecordHead, ItemDocsCard, HoldsCard } from "./parts";
import { AboutCard, PeopleStack, RecordAction, UploadCatcher } from "./comp-parts";

const toRows = (pairs: Array<[string, string]>, mono = false): FactRow[] => pairs.map(([k, v]) => ({ k, v, mono }));

export function RegistrationScreen({ id }: { id: string }) {
  const r = registration(id)!;
  const toast = useUndoToast();
  const done = r.steps.filter((s) => s.state === "done").length;
  const person = SBC.find((p) => p.name === r.by);
  const fields = regFields(r);
  const [client, setClient] = React.useState<FactRow[]>(() => toRows(fields.client));
  const locked = r.status === "Granted" || r.status === "Not needed";
  const asked = r.docs.filter((x) => x.status === "Asked" || x.status === "Sent back").map((x) => x.name);
  const detailsRef = React.useRef<HTMLDivElement>(null);
  const starts = r.obligations.map((oid) => obligation(oid)).filter((o) => !!o);
  const uploaded = (n: number) => toast.show(`${n} ${n === 1 ? "file" : "files"} uploaded · SBC reviews them next`);

  const coming: AttentionRow[] = [
    ...(r.next ? [{ id: "next", date: r.next, title: r.nextLabel ?? r.name, sub: r.authority, chip: { label: relative(r.next), tone: urgency(r.next) } }] : []),
    ...starts.map((o) => ({ id: o.id, date: o.due, title: `${o.name} · ${o.period}`, sub: o.frequency, chip: { label: o.status, tone: o.status === "Filed" ? ("ok" as const) : urgency(o.due) }, href: obHref("client", o.id) })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const action =
    r.status === "Waiting on client" ? (
      <UploadCatcher requested={asked} onDone={uploaded}>
        <RecordAction label="Upload documents" onDone={() => {}} />
      </UploadCatcher>
    ) : r.status === "Granted" ? (
      <RecordAction label="Download certificate" onDone={() => toast.show(`${r.name} certificate downloaded`)} />
    ) : r.status === "Not needed" ? null : (
      <RecordAction label="Check my details" onDone={() => detailsRef.current?.scrollIntoView({ block: "start" })} />
    );

  return (
    <div className="grid grid-cols-1 gap-5">
      <RecordHead
        eyebrow={`${r.authority} · ${r.form} · ${r.team}`}
        title={r.name}
        chips={
          <>
            <Tag tone={REGULATOR_TONE[r.regulator]}>{REGULATOR_LABEL[r.regulator]}</Tag>
            <Chip tone={REG_STATUS_TONE[r.status]}>{r.status}</Chip>
            {r.nextLabel && <span className="text-12.5 text-muted">{r.nextLabel}</span>}
            {r.status !== "Not needed" && (
              <span className="text-12.5 text-muted">
                {done} of {r.steps.length} steps
              </span>
            )}
          </>
        }
        action={
          <>
            <PeopleStack people={[{ name: CLIENT_PEOPLE[0].name, role: "Northwind" }, { name: r.by, role: person?.role ?? "SBC" }, { name: "Pranay", role: "Manager" }]} />
            {action}
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
          {r.status !== "Not needed" && (
            <SectionCard title="Steps" meta={`${done} of ${r.steps.length} done`} icon={{ Icon: List, tone: "blue" }}>
              <Thread steps={r.steps} />
            </SectionCard>
          )}
          <UploadCatcher requested={asked} onDone={uploaded}>
            <ItemDocsCard title="From Northwind" docs={r.docs} canUpload={r.status === "Waiting on client"} />
          </UploadCatcher>
          <div ref={detailsRef} className="scroll-mt-20">
            <EditableFacts
              title="Your details"
              icon={{ Icon: User, tone: "violet" }}
              meta={locked ? "Locked" : undefined}
              rows={client}
              editable={!locked}
              saveLabel="Submit details"
              onSave={(next) => {
                const prev = client;
                setClient(next);
                toast.show("Details sent to SBC", () => setClient(prev));
              }}
            />
          </div>
          <EditableFacts title="Filled by SBC" icon={{ Icon: ClipboardCheck, tone: "teal" }} rows={toRows(fields.sbc, true)} />
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
          <AboutCard about={r.about} whyTitle={r.status === "Not needed" ? "Not needed" : "Applies because"} why={r.why} />
          <SectionCard title="What it starts" icon={{ Icon: List, tone: "blue" }} flush>
            {starts.length === 0 ? (
              <Empty />
            ) : (
              starts.map((o) => (
                <ListRow key={o.id} href={obHref("client", o.id)}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{o.name}</span>
                    <span className="block truncate text-12.5 text-muted">
                      {o.frequency} · {o.dueRule}
                    </span>
                  </span>
                  <Chip tone={OB_STATUS_TONE[o.status]} className="hidden sm:inline-flex">
                    {o.status}
                  </Chip>
                </ListRow>
              ))
            )}
          </SectionCard>
          {coming.length > 0 && (
            <SectionCard title="Coming up" flush>
              <AttentionList rows={coming} />
            </SectionCard>
          )}
        </Col>
      </Cols>
      {toast.node}
    </div>
  );
}
