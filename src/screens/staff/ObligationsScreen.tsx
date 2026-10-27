"use client";
import * as React from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { TODAY, daysFrom, fmt, relative, urgency } from "@/lib/dates";
import { AREAS, AREA_TONE, FREQUENCIES, OB_STATUS_TONE, type ObStatus } from "@/data/compliance";
import { clientById } from "@/data/staff-clients";
import { complianceClients, obligationsFor, staffObHref, type StaffObligation } from "@/data/staff-compliance";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { type Tile, type TileGroup } from "@/components/cards/TileGrid";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { StackedBar } from "@/components/cards/StackedBar";
import { ClientDot, ClientName, type StaffPortal } from "./parts";
import { FoldingGroups, KeyHint, PortalLink, useListKeys } from "./comp-parts";
import { ClientSelect, identityTag } from "./filters";

type Fil = "" | ObStatus | "soon";
// The old number strip is gone (C-0018). Its five states stay as one compact filter (R-10).
const FILTERS: Array<{ value: Fil; label: string }> = [
  { value: "", label: "All states" },
  { value: "Overdue", label: "Overdue" },
  { value: "soon", label: "Due in 15 days" },
  { value: "Waiting on client", label: "Waiting on client" },
  { value: "In progress", label: "In progress" },
  { value: "Filed", label: "Filed" },
  { value: "Upcoming", label: "Upcoming" },
];

export function ObligationsScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState("freq");
  const [client, setClient] = React.useState("");
  const [sent, setSent] = React.useState<Record<string, true>>({});
  const [fil, setFil] = React.useState<Fil>("");
  const listRef = React.useRef<HTMLElement>(null);
  const filterRef = React.useRef<HTMLSpanElement>(null);
  useListKeys(listRef, filterRef);
  const all = obligationsFor(portal, client);
  const soon = (o: (typeof all)[number]) => o.status !== "Filed" && daysFrom(o.due) >= 0 && daysFrom(o.due) <= 15;
  const obs = all.filter((o) => !fil || (fil === "soon" ? soon(o) : o.status === fil));

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

  const due: AttentionRow[] = all
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

  const waiting = all.filter((o) => o.owner === "client" && o.status !== "Filed").sort((a, b) => a.due.getTime() - b.due.getTime());

  const tabs = [
    { key: "freq", label: "By frequency" },
    { key: "law", label: "By law" },
    { key: "list", label: "List" },
  ];
  const head = (
    <>
      <span ref={filterRef} className="inline-flex">
        <ClientSelect clients={complianceClients(portal)} value={client} onChange={setClient} />
      </span>
      <Select aria-label="State" value={fil} onChange={(e) => setFil(e.target.value as Fil)} options={FILTERS} />
      {(fil || client) && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setFil("");
            setClient("");
          }}
        >
          Clear
        </Button>
      )}
      <Tabs items={tabs} value={view} onChange={setView} className="hidden sm:inline-flex" />
    </>
  );
  // Old staff list columns: obligation, client, law, last filed, status, next due.
  const listCols: Column<StaffObligation>[] = [
    {
      key: "name",
      label: "Obligation",
      render: (o) => (
        <span className="flex items-center gap-1.5 font-semibold">
          {o.name}
          <PortalLink area={o.area} />
        </span>
      ),
    },
    { key: "client", label: "Client", width: 150, render: (o) => <ClientName id={o.client} short /> },
    { key: "law", label: "Law", width: 150, render: (o) => <Tag tone={AREA_TONE[o.area]}>{o.law}</Tag> },
    { key: "last", label: "Last filed", width: 100, render: (o) => (o.lastFiled ? fmt(o.lastFiled) : "-") },
    { key: "status", label: "Status", width: 132, render: (o) => <Chip tone={OB_STATUS_TONE[o.status]} fixed>{o.status}</Chip> },
    { key: "due", label: "Next due", width: 90, render: (o) => <span className={o.status === "Overdue" ? "font-semibold text-bad" : undefined} title={`Late: ${o.penalty}`}>{fmt(o.due)}</span> },
  ];

  return (
    <Cols>
      <Col>
        <section ref={listRef} className="min-w-0">
          {view === "list" ? (
            <div className="grid gap-3">
              <div className="sm:hidden">
                <Tabs items={tabs} value={view} onChange={setView} />
              </div>
              <DataGrid title="Obligations" meta={`${obs.length}`} columns={listCols} rows={obs} rowKey={(o) => o.id} rowHref={(o) => staffObHref(portal, o.id)} rowLate={(o) => o.status === "Overdue"} filters={head} pageSize={12} footer={<KeyHint />} />
            </div>
          ) : (
            <SectionCard title="Obligations" meta={<span className="hidden sm:inline">{obs.length}</span>} flush right={<div className="flex flex-wrap items-center justify-end gap-2">{head}</div>}>
              <div className="border-b border-line-soft px-4 py-2.5 sm:hidden">
                <Tabs items={tabs} value={view} onChange={setView} />
              </div>
              <FoldingGroups groups={groups} />
              <div className="border-t border-line-soft px-4 py-2 md:px-5">
                <KeyHint />
              </div>
            </SectionCard>
          )}
        </section>
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
                    <Link href={staffObHref(portal, o.id)} className="block truncate font-semibold hover:underline">
                      {c.short} · {o.name}
                    </Link>
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
          <StackedBar
            segments={[
              { label: "Data from client", value: all.filter((o) => o.status === "Waiting on client" || o.status === "Overdue").length, tone: "warn" },
              { label: "Prepared", value: all.filter((o) => o.status === "In progress").length, tone: "accent" },
              { label: "Filed", value: all.filter((o) => o.status === "Filed").length, tone: "ok" },
              { label: "Upcoming", value: all.filter((o) => o.status === "Upcoming").length, tone: "idle" },
            ]}
          />
        </SectionCard>
      </Col>
    </Cols>
  );
}
