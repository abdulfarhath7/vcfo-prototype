"use client";
import * as React from "react";
import { Calendar } from "lucide-react";
import { TODAY, daysFrom, fmt, relative, urgency } from "@/lib/dates";
import { AREAS, FREQUENCIES, OB_STATUS_BAR, OB_STATUS_TONE, type ObStatus } from "@/data/compliance";
import { clientById } from "@/data/staff-clients";
import { complianceClients, obligationsFor, staffObHref, type StaffObligation } from "@/data/staff-compliance";
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

const STATUSES: ObStatus[] = ["Filed", "In progress", "Waiting on client", "Overdue", "Upcoming"];

export function ObligationsScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState("freq");
  const [client, setClient] = React.useState("");
  const [sent, setSent] = React.useState<Record<string, true>>({});
  const obs = obligationsFor(portal, client);

  // R-35: the tag carries the client name in its identity colour.
  const tile = (o: StaffObligation): Tile => {
    const c = clientById(o.client)!;
    return {
      id: o.id,
      name: o.name,
      tag: { label: c.short, tone: identityTag[c.tone] },
      chip: { label: o.status, tone: OB_STATUS_TONE[o.status] },
      date: o.status === "Filed" && o.filed ? `Filed ${fmt(o.filed)}` : `Due ${fmt(o.due)}`,
      late: o.status === "Overdue",
      href: staffObHref(portal, o.id),
    };
  };

  const groups: TileGroup[] =
    view === "freq"
      ? FREQUENCIES.map((f) => ({ label: f, tiles: obs.filter((o) => o.frequency === f).map(tile) }))
      : AREAS.map((a) => ({ label: a, tiles: obs.filter((o) => o.area === a).map(tile) }));

  const due: AttentionRow[] = obs
    .filter((o) => o.status !== "Filed" && daysFrom(o.due) <= 15)
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, 10)
    .map((o) => {
      const late = o.due < TODAY;
      return {
        id: o.id,
        date: o.due,
        title: `${o.name} · ${o.period}`,
        sub: `${clientById(o.client)?.short} · ${o.area}`,
        chip: { label: relative(o.due), tone: urgency(o.due) },
        urgent: late,
        action: late ? { label: "Open", href: staffObHref(portal, o.id) } : undefined,
        href: late ? undefined : staffObHref(portal, o.id),
      };
    });

  const waiting = obs.filter((o) => o.owner === "client" && o.status !== "Filed").sort((a, b) => a.due.getTime() - b.due.getTime());

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Obligations"
          meta={<span className="hidden sm:inline">{obs.length}</span>}
          flush
          right={
            <>
              <ClientSelect clients={complianceClients(portal)} value={client} onChange={setClient} />
              <Tabs
                items={[
                  { key: "freq", label: "By frequency" },
                  { key: "law", label: "By law" },
                ]}
                value={view}
                onChange={setView}
                className="hidden sm:inline-flex"
              />
            </>
          }
        >
          <div className="border-b border-line-soft px-4 py-2.5 sm:hidden">
            <Tabs
              items={[
                { key: "freq", label: "By frequency" },
                { key: "law", label: "By law" },
              ]}
              value={view}
              onChange={setView}
            />
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
            waiting.map((o) => {
              const c = clientById(o.client)!;
              return (
                <ListRow key={o.id}>
                  <ClientDot tone={c.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {c.short} · {o.name}
                    </span>
                    <span className="block truncate text-12.5 text-muted">{o.needs[0]}</span>
                  </span>
                  {sent[o.id] ? (
                    <Chip tone="ok">Sent</Chip>
                  ) : (
                    <Button size="sm" onClick={() => setSent({ ...sent, [o.id]: true })}>
                      Send reminder
                    </Button>
                  )}
                </ListRow>
              );
            })
          )}
        </SectionCard>
        <SectionCard title="Progress flow">
          <StackedBar segments={STATUSES.map((s) => ({ label: s, value: obs.filter((o) => o.status === s).length, tone: OB_STATUS_BAR[s] }))} />
        </SectionCard>
      </Col>
    </Cols>
  );
}
