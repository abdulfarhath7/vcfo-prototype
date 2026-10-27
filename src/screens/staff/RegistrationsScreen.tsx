"use client";
import * as React from "react";
import Link from "next/link";
import { Calendar, Check, Minus, MoreHorizontal, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { daysFrom, fmt, relative, urgency } from "@/lib/dates";
import { REGULATOR_LABEL, REG_STATUS_TONE, type RegStatus, type Regulator } from "@/data/registrations";
import { clientById } from "@/data/staff-clients";
import {
  REG_GRID_COLS,
  myClients,
  notNeededFor,
  notStartedFor,
  regGridFor,
  registrationsFor,
  renewalsFor,
  staffRegHref,
  type RegGridRow,
  type StaffRegistration,
} from "@/data/staff-compliance";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { type Tile, type TileGroup } from "@/components/cards/TileGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { StackedBar } from "@/components/cards/StackedBar";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ClientDot, ClientName, type StaffPortal } from "./parts";
import { ClientSelect, identityTag } from "./filters";
import { FoldingGroups, KeyHint, useListKeys } from "./comp-parts";

const STATUS_ORDER: RegStatus[] = ["Waiting on client", "In progress", "Granted"];
const REG_ORDER: Regulator[] = ["GST", "MCA", "IT", "Labour", "IP", "FEMA", "Other"];
type Fil = "" | RegStatus | "renew";

const FILTERS: Array<{ value: Fil; label: string }> = [
  { value: "", label: "All states" },
  { value: "Granted", label: "Granted" },
  { value: "In progress", label: "In progress" },
  { value: "Waiting on client", label: "Waiting on client" },
  { value: "Not started", label: "Not started" },
  { value: "renew", label: "Renewals in 60 days" },
];

/** Grid cell: granted green tick, in progress blue dots, waiting amber mark, not started grey, not needed a dash. */
const CELL: Record<RegStatus, { cls: string; Icon?: typeof Check }> = {
  Granted: { cls: "bg-ok-soft text-ok", Icon: Check },
  "In progress": { cls: "bg-accent-soft text-accent", Icon: MoreHorizontal },
  "Waiting on client": { cls: "bg-warn-soft text-warn", Icon: AlertCircle },
  "Not started": { cls: "bg-raised text-faint" },
  "Not needed": { cls: "border border-line-soft text-faint", Icon: Minus },
};

function Cell({ status, href, tip }: { status: RegStatus; href?: string; tip: string }) {
  const c = CELL[status];
  const inner = (
    <span className={cn("mx-auto grid h-6 w-9 place-items-center rounded-sm", c.cls)} title={tip} aria-label={tip}>
      {c.Icon && <c.Icon size={14} strokeWidth={1.8} />}
    </span>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function Legend() {
  return (
    <span className="hidden flex-wrap items-center gap-3 md:flex">
      {(Object.keys(CELL) as RegStatus[]).map((s) => {
        const c = CELL[s];
        return (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("grid h-4 w-5 place-items-center rounded-sm", c.cls)}>{c.Icon && <c.Icon size={10} strokeWidth={2} />}</span>
            {s}
          </span>
        );
      })}
    </span>
  );
}

export function RegistrationsScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState("status");
  const [client, setClient] = React.useState("");
  const [fil, setFil] = React.useState<Fil>("");
  const [sent, setSent] = React.useState<Record<string, true>>({});
  const listRef = React.useRef<HTMLElement>(null);
  const filterRef = React.useRef<HTMLSpanElement>(null);
  useListKeys(listRef, filterRef);

  const regs = registrationsFor(portal, client);
  const renewals = renewalsFor(portal, client);
  const notNeeded = notNeededFor(portal, client);
  const notStarted = notStartedFor(portal, client);
  const renewSoon = new Set(renewals.filter((r) => daysFrom(r.date) <= 60).map((r) => r.key));
  const match = (r: StaffRegistration) => !fil || (fil === "renew" ? renewSoon.has(r.id) : r.status === fil);
  const shown = regs.filter(match);
  // Clients before incorporation have no registrations yet: the filter still lists every client for the grid.
  const clients = myClients(portal);

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
  const plain = (x: { id: string; client: string; name: string; reason: string }, status: RegStatus): Tile => {
    const c = clientById(x.client)!;
    return { id: x.id, name: x.name, tag: { label: c.short, tone: identityTag[c.tone] }, chip: { label: status, tone: REG_STATUS_TONE[status] }, date: status === "Not needed" ? `${x.reason} · changed by ${c.manager}` : x.reason };
  };

  const startedTiles = fil === "Not started" || fil === "" ? notStarted.map((x) => plain(x, "Not started")) : [];
  const groups: TileGroup[] =
    view === "status"
      ? [...STATUS_ORDER.map((s) => ({ label: s, tiles: shown.filter((r) => r.status === s).map(tile) })), { label: "Not started", tiles: startedTiles }]
      : REG_ORDER.map((g) => ({ label: REGULATOR_LABEL[g], tiles: shown.filter((r) => r.regulator === g).map(tile) }));
  // Old staff list: "Not needed" closes the list when no state filter is on.
  if (!fil) groups.push({ label: "Not needed", tiles: notNeeded.map((x) => plain(x, "Not needed")) });

  const due: AttentionRow[] = regs
    .filter((r) => r.next && (r.status === "In progress" || r.status === "Waiting on client") && daysFrom(r.next) <= 15)
    .sort((a, b) => a.next!.getTime() - b.next!.getTime())
    .slice(0, 10)
    .map((r) => ({ id: r.id, date: r.next!, title: r.name, sub: `${clientById(r.client)?.short} · ${r.nextLabel}`, chip: { label: relative(r.next!), tone: urgency(r.next!) }, href: staffRegHref(portal, r.id) }));

  const waiting = regs.filter((r) => r.status === "Waiting on client");
  const granted = regs.filter((r) => r.status === "Granted").sort((a, b) => (b.granted?.getTime() ?? 0) - (a.granted?.getTime() ?? 0));
  const atAuthority = regs.filter((r) => r.status === "In progress" && r.steps.find((s) => s.state === "current")?.owner !== "sbc").length;

  const listCols: Column<StaffRegistration>[] = [
    { key: "name", label: "Registration", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "client", label: "Client", width: 150, render: (r) => <ClientName id={r.client} short /> },
    { key: "authority", label: "Authority", width: 130 },
    { key: "num", label: "Number", width: 190, mono: true, render: (r) => r.idValue ?? <span className="font-sans text-muted">{r.form}</span> },
    { key: "status", label: "Status", width: 132, render: (r) => <Chip tone={REG_STATUS_TONE[r.status]} fixed>{r.status}</Chip> },
    { key: "date", label: "Date", width: 150, render: (r) => <span className={r.status === "Waiting on client" ? "font-semibold text-warn" : undefined}>{r.nextLabel}</span> },
  ];

  const gridCols: Column<RegGridRow>[] = [
    { key: "client", label: "Client", width: 160, render: (row) => <ClientName id={row.client} short className="font-semibold" /> },
    ...REG_GRID_COLS.map(
      (col, i): Column<RegGridRow> => ({
        key: col.id,
        label: col.label,
        align: "center",
        render: (row) => {
          const cell = row.cells[i];
          return <Cell status={cell.status} href={cell.key ? staffRegHref(portal, cell.key) : undefined} tip={`${clientById(row.client)?.short} · ${col.label} · ${cell.status}`} />;
        },
      }),
    ),
  ];

  const tabs = [
    { key: "status", label: "By status" },
    { key: "regulator", label: "By regulator" },
    { key: "list", label: "List" },
    { key: "grid", label: "Grid" },
  ];
  const head = (
    <>
      <span ref={filterRef} className="inline-flex">
        <ClientSelect clients={clients} value={client} onChange={setClient} />
      </span>
      {view !== "grid" && <Select aria-label="State" value={fil} onChange={(e) => setFil(e.target.value as Fil)} options={FILTERS} />}
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

  return (
    <Cols>
      <Col>
        <section ref={listRef} className="min-w-0">
          {view === "list" || view === "grid" ? (
            <div className="grid gap-3">
              <div className="sm:hidden">
                <Tabs items={tabs} value={view} onChange={setView} />
              </div>
              {view === "list" ? (
                <DataGrid title="Registrations" meta={`${shown.length}`} columns={listCols} rows={shown} rowKey={(r) => r.id} rowHref={(r) => staffRegHref(portal, r.id)} filters={head} pageSize={12} footer={<KeyHint />} />
              ) : (
                <DataGrid title="Registrations" meta={`${clients.length} clients`} columns={gridCols} rows={regGridFor(portal, client)} rowKey={(r) => r.client} filters={head} pageSize={14} footer={<Legend />} />
              )}
            </div>
          ) : (
            <SectionCard title="Registrations" meta={<span className="hidden sm:inline">{shown.length}</span>} flush right={<div className="flex flex-wrap items-center justify-end gap-2">{head}</div>}>
              <div className="border-b border-line-soft px-4 py-2.5 sm:hidden">
                <Tabs items={tabs} value={view} onChange={setView} />
              </div>
              <FoldingGroups groups={groups} folded={["Not started", "Not needed"]} />
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
            waiting.map((r) => {
              const c = clientById(r.client)!;
              return (
                <ListRow key={r.id}>
                  <ClientDot tone={c.tone} />
                  <span className="min-w-0 flex-1">
                    <Link href={staffRegHref(portal, r.id)} className="block truncate font-semibold hover:underline">
                      {c.short} · {r.name}
                    </Link>
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
              { label: "Documents", value: waiting.length, tone: "warn" },
              { label: "Application", value: regs.filter((r) => r.status === "In progress").length - atAuthority, tone: "accent" },
              { label: "Authority review", value: atAuthority, tone: "violet" },
              { label: "Granted", value: granted.length, tone: "ok" },
            ]}
          />
        </SectionCard>
        <SectionCard title="Renewals and expiry" meta={renewals.length || undefined} flush>
          {renewals.length === 0 ? (
            <Empty />
          ) : (
            renewals.slice(0, 6).map((r) => {
              const c = clientById(r.client)!;
              return (
                <ListRow key={r.id} href={staffRegHref(portal, r.key)}>
                  <ClientDot tone={c.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.title}</span>
                    <span className="block truncate text-12.5 text-muted">
                      {c.short} · {r.authority}
                    </span>
                  </span>
                  <span className={cn("flex-none text-12.5", daysFrom(r.date) <= 90 ? "font-semibold text-warn" : "text-muted")}>{fmt(r.date)}</span>
                </ListRow>
              );
            })
          )}
        </SectionCard>
        <SectionCard title="Recently granted" meta={granted.length || undefined} flush>
          {granted.length === 0 ? (
            <Empty />
          ) : (
            granted.slice(0, 4).map((r) => {
              const c = clientById(r.client)!;
              return (
                <ListRow key={r.id} href={staffRegHref(portal, r.id)}>
                  <ClientDot tone={c.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="block truncate text-12.5 text-muted">
                      {c.short} · <span className={r.idValue ? "font-mono" : undefined}>{r.idValue ?? "Certificate on file"}</span>
                    </span>
                  </span>
                  {r.granted && <span className="flex-none text-12.5 text-muted">{fmt(r.granted)}</span>}
                </ListRow>
              );
            })
          )}
        </SectionCard>
        <SectionCard title="Next to start" meta={notStarted.length || undefined} flush>
          {notStarted.length === 0 ? (
            <Empty />
          ) : (
            notStarted.slice(0, 4).map((x) => {
              const c = clientById(x.client)!;
              return (
                <ListRow key={x.id}>
                  <ClientDot tone={c.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{x.name}</span>
                    <span className="block truncate text-12.5 text-muted">
                      {c.short} · {x.reason}
                    </span>
                  </span>
                </ListRow>
              );
            })
          )}
        </SectionCard>
      </Col>
    </Cols>
  );
}
