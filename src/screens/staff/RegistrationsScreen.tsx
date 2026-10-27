"use client";
import * as React from "react";
import { Calendar } from "lucide-react";
import { daysFrom, relative, urgency } from "@/lib/dates";
import { REGULATOR_LABEL, REG_STATUS_TONE, type RegStatus, type Regulator } from "@/data/registrations";
import { clientById } from "@/data/staff-clients";
import { myClients, registrationsFor, staffRegHref, type StaffRegistration } from "@/data/staff-compliance";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { TileGrid, type Tile, type TileGroup } from "@/components/cards/TileGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { StackedBar } from "@/components/cards/StackedBar";
import { ClientDot, type StaffPortal } from "./parts";
import { ClientSelect, identityTag } from "./filters";

const STATUS_ORDER: RegStatus[] = ["Waiting on client", "In progress", "Granted"];
const REG_ORDER: Regulator[] = ["GST", "MCA", "IT", "Labour", "IP", "FEMA", "Other"];

export function RegistrationsScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState("status");
  const [client, setClient] = React.useState("");
  const [sent, setSent] = React.useState<Record<string, true>>({});
  const regs = registrationsFor(portal, client);
  // Clients before incorporation have no registrations yet: leave them out of the filter.
  const withRegs = myClients(portal).filter((c) => registrationsFor(portal, c.id).length > 0);

  const tile = (r: StaffRegistration): Tile => {
    const c = clientById(r.client)!;
    return {
      id: r.id,
      name: r.name,
      tag: { label: c.short, tone: identityTag[c.tone] },
      chip: { label: r.status, tone: REG_STATUS_TONE[r.status] },
      date: r.nextLabel,
      late: r.status === "Waiting on client" && !!r.next && daysFrom(r.next) < 0,
      href: staffRegHref(portal, r.id),
    };
  };

  const groups: TileGroup[] =
    view === "status"
      ? STATUS_ORDER.map((s) => ({ label: s, tiles: regs.filter((r) => r.status === s).map(tile) }))
      : REG_ORDER.map((g) => ({ label: REGULATOR_LABEL[g], tiles: regs.filter((r) => r.regulator === g).map(tile) }));

  const due: AttentionRow[] = regs
    .filter((r) => r.next && (r.status === "In progress" || r.status === "Waiting on client") && daysFrom(r.next) <= 15)
    .sort((a, b) => a.next!.getTime() - b.next!.getTime())
    .slice(0, 10)
    .map((r) => ({ id: r.id, date: r.next!, title: r.name, sub: `${clientById(r.client)?.short} · ${r.nextLabel}`, chip: { label: relative(r.next!), tone: urgency(r.next!) }, href: staffRegHref(portal, r.id) }));

  const waiting = regs.filter((r) => r.status === "Waiting on client");
  const count = (s: RegStatus) => regs.filter((r) => r.status === s).length;
  const tabs = [
    { key: "status", label: "By status" },
    { key: "regulator", label: "By regulator" },
  ];

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Registrations"
          meta={<span className="hidden sm:inline">{regs.length}</span>}
          flush
          right={
            <>
              <ClientSelect clients={withRegs} value={client} onChange={setClient} />
              <Tabs items={tabs} value={view} onChange={setView} className="hidden sm:inline-flex" />
            </>
          }
        >
          <div className="border-b border-line-soft px-4 py-2.5 sm:hidden">
            <Tabs items={tabs} value={view} onChange={setView} />
          </div>
          <TileGrid groups={groups} />
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="Due in the next 15 days" icon={{ Icon: Calendar, tone: "teal" }} flush>
          <AttentionList rows={due} />
        </SectionCard>
        <SectionCard title="Waiting on client" meta={waiting.length || undefined} flush>
          {waiting.length === 0 ? (
            <Empty />
          ) : (
            waiting.map((r) => {
              const c = clientById(r.client)!;
              return (
                <ListRow key={r.id}>
                  <ClientDot tone={c.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {c.short} · {r.name}
                    </span>
                    <span className="block truncate text-12.5 text-muted">{r.docs.filter((x) => x.status === "Asked").map((x) => x.name).join(", ") || r.authority}</span>
                  </span>
                  {sent[r.id] ? (
                    <Chip tone="ok">Sent</Chip>
                  ) : (
                    <Button size="sm" onClick={() => setSent({ ...sent, [r.id]: true })}>
                      Send reminder
                    </Button>
                  )}
                </ListRow>
              );
            })
          )}
        </SectionCard>
        <SectionCard title="Progress flow">
          <StackedBar
            segments={[
              { label: "Granted", value: count("Granted"), tone: "ok" },
              { label: "In progress", value: count("In progress"), tone: "accent" },
              { label: "Waiting on client", value: count("Waiting on client"), tone: "warn" },
            ]}
          />
        </SectionCard>
      </Col>
    </Cols>
  );
}
