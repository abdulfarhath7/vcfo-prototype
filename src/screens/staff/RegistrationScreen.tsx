"use client";
import * as React from "react";
import { List, Upload } from "lucide-react";
import { fmt, relative, urgency } from "@/lib/dates";
import { REGULATOR_LABEL, REGULATOR_TONE, REG_STATUS_TONE, type RegStatus } from "@/data/registrations";
import { clientById } from "@/data/staff-clients";
import { staffObHref, staffObligation, staffRegistration } from "@/data/staff-compliance";
import { SBC } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { SectionCard } from "@/components/cards/SectionCard";
import { Thread } from "@/components/cards/Thread";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { RecordHead, ItemDocsCard, HoldsCard } from "@/screens/client/parts";
import { ClientName, clientHref, type StaffPortal } from "./parts";

/** Actions wrap on phones instead of running off the card. */
const WRAP = "flex max-w-[calc(100vw-4rem)] flex-wrap items-center justify-end gap-2";
const STATUSES: RegStatus[] = ["Not started", "In progress", "Waiting on client", "Granted"];

export function RegistrationScreen({ portal, id }: { portal: StaffPortal; id: string }) {
  const r = staffRegistration(id)!;
  const c = clientById(r.client)!;
  const [status, setStatus] = React.useState<RegStatus>(r.status);
  const [editing, setEditing] = React.useState(false);
  const [pick, setPick] = React.useState<RegStatus>(r.status);
  const [reminded, setReminded] = React.useState(false);
  const [uploaded, setUploaded] = React.useState(false);

  const done = r.steps.filter((s) => s.state === "done").length;
  const person = SBC.find((p) => p.name === r.by);
  const owner = status === "Waiting on client" ? "client" : "sbc";

  const coming: AttentionRow[] = [
    ...(r.next ? [{ id: "next", date: r.next, title: r.nextLabel ?? r.name, sub: r.authority, chip: { label: relative(r.next), tone: urgency(r.next) } }] : []),
    ...r.obligations
      .map((oid) => staffObligation(`${c.id}-${oid}`))
      .filter((o) => !!o)
      .map((o) => ({ id: o.id, date: o.due, title: `${o.name} · ${o.period}`, sub: o.frequency, chip: { label: o.status, tone: o.status === "Filed" ? ("ok" as const) : urgency(o.due) }, href: staffObHref(portal, o.id) })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="grid grid-cols-1 gap-5">
      <RecordHead
        eyebrow={`${r.authority} · ${r.form}`}
        title={r.name}
        chips={
          <>
            <ClientName id={c.id} short href={clientHref(portal, c.id)} className="text-12.5 font-semibold" />
            <Tag tone={REGULATOR_TONE[r.regulator]}>{REGULATOR_LABEL[r.regulator]}</Tag>
            <Chip tone={REG_STATUS_TONE[status]}>{status}</Chip>
            {r.nextLabel && status === r.status && <span className="text-12.5 text-muted">{r.nextLabel}</span>}
          </>
        }
        action={
          editing ? (
            <span className={WRAP}>
              <Select aria-label="Status" value={pick} onChange={(e) => setPick(e.target.value as RegStatus)} options={STATUSES.map((s) => ({ value: s, label: s }))} />
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setStatus(pick);
                  setEditing(false);
                }}
              >
                Save
              </Button>
            </span>
          ) : (
            <span className={WRAP}>
              {owner === "client" &&
                (reminded ? (
                  <Chip tone="ok">Reminder sent</Chip>
                ) : (
                  <Button size="sm" onClick={() => setReminded(true)}>
                    Send reminder
                  </Button>
                ))}
              {status !== "Granted" &&
                (uploaded ? (
                  <Chip tone="prog">Uploaded</Chip>
                ) : (
                  <Button size="sm" onClick={() => setUploaded(true)}>
                    <Upload size={16} strokeWidth={1.5} /> Upload on behalf
                  </Button>
                ))}
              <Button size="sm" variant="primary" onClick={() => setEditing(true)}>
                Update status
              </Button>
            </span>
          )
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
          <ItemDocsCard docs={r.docs} />
        </Col>
        <Col>
          <HoldsCard
            rows={[
              { k: "Owner", v: <OwnerChip owner={owner} label={owner === "client" ? c.short : undefined} /> },
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
