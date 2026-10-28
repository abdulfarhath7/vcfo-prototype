"use client";
import * as React from "react";
import Link from "next/link";
import { AlertCircle, Calendar, Check, CircleCheck, CircleDashed, Clock, MoreHorizontal, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { staffRegHref } from "@/data/staff-compliance";
import { itemExists } from "@/data/staff-item";
import { REG_CATS, REG_CLIENTS, REG_RENEWALS, REG_STATE, REG_TYPES, regRows, regState, type RegRow, type RowState } from "@/data/staff-regs-table";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { type StaffPortal } from "./parts";
import { KeyHint, useListKeys } from "./comp-parts";
import { FilterStrip, FlowCard, GroupedGrid, RailCard, type GridGroup, type StripItem } from "./register-parts";

// Staff Registrations, as in reference/old-screens/s/lead/Register.dc.html (kind "reg", who "staff"):
// number strip, a table grouped by area with List and Grid views, and a five-card rail.
// C-0022 changed only the client page.

type Fil = "" | "done" | "run" | "wait" | "none" | "ren";

const RENEW_IDS = new Set(REG_RENEWALS.map((r) => r.id));
const CAT_DOT: Record<string, string> = { tax: "bg-accent", labour: "bg-ok-mid", business: "bg-warn-mid", ip: "bg-violet", fema: "bg-teal", na: "bg-faint" };

/** Grid cell: granted green tick, in progress blue dots, waiting amber mark, not started grey, not needed hatched. */
const CELL: Record<Exclude<RowState, "bad">, { cls: string; Icon?: typeof Check }> = {
  done: { cls: "bg-ok-soft text-ok", Icon: Check },
  run: { cls: "bg-accent-soft text-accent", Icon: MoreHorizontal },
  wait: { cls: "bg-warn-soft text-warn", Icon: AlertCircle },
  none: { cls: "bg-raised text-faint" },
  na: { cls: "border border-line-soft text-faint" },
};
const HATCH: React.CSSProperties = { backgroundImage: "repeating-linear-gradient(45deg, transparent 0 4px, var(--line-soft) 4px 5px)" };

function Cell({ state, href, tip }: { state: Exclude<RowState, "bad">; href?: string; tip: string }) {
  const c = CELL[state];
  const inner = (
    <span className={cn("mx-auto grid h-6 w-9 place-items-center rounded-sm", c.cls)} style={state === "na" ? HATCH : undefined} title={tip} aria-label={tip}>
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
      {(Object.keys(CELL) as Array<keyof typeof CELL>).map((s) => {
        const c = CELL[s];
        return (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("grid h-4 w-5 place-items-center rounded-sm", c.cls)} style={s === "na" ? HATCH : undefined}>
              {c.Icon && <c.Icon size={10} strokeWidth={2} />}
            </span>
            {REG_STATE[s].label}
          </span>
        );
      })}
    </span>
  );
}

export function RegistrationsScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState("list");
  const [client, setClient] = React.useState("");
  const [fil, setFil] = React.useState<Fil>("");
  const listRef = React.useRef<HTMLElement>(null);
  const filterRef = React.useRef<HTMLSpanElement>(null);
  useListKeys(listRef, filterRef);

  const items = regRows(client);
  const live = items.filter((x) => x.state !== "na");
  const na = items.filter((x) => x.state === "na");
  const match = (x: RegRow, f: Fil) => (f === "ren" ? RENEW_IDS.has(x.reg.id) && x.state === "done" : x.state === f);
  const shown = live.filter((x) => !fil || match(x, fil));
  const hrefOf = (x: RegRow) => (itemExists("reg", x.key) ? staffRegHref(portal, x.key) : undefined);
  const count = (f: Fil) => items.filter((x) => match(x, f)).length;

  const strip: StripItem[] = [
    { key: "done", label: "Granted", value: count("done"), Icon: CircleCheck, tone: "green", valueClass: "text-ok" },
    { key: "run", label: "In progress", value: count("run"), Icon: Clock, tone: "blue", valueClass: "text-accent" },
    { key: "wait", label: "Waiting on client", value: count("wait"), Icon: User, tone: "amber", valueClass: "text-warn" },
    { key: "none", label: "Not started", value: count("none"), Icon: CircleDashed, tone: "violet" },
    { key: "ren", label: "Renewals in 60 days", value: count("ren"), Icon: Calendar, tone: "teal" },
  ];

  const groups: GridGroup<RegRow>[] = REG_CATS.map((c) => ({ id: c.id, label: c.label, dot: CAT_DOT[c.id], rows: shown.filter((x) => x.reg.cat === c.id) }));
  // Old staff list: "Not needed" closes the list when no state filter is on.
  if (!fil && na.length) groups.push({ id: "na", label: "Not needed", dot: CAT_DOT.na, rows: na });

  const listCols: Column<RegRow>[] = [
    {
      key: "name",
      label: "Registration",
      render: (x) => (
        <span className="block min-w-0">
          <b className="block truncate text-13 font-semibold">{x.reg.name}</b>
          <span className="block truncate text-12 text-muted">{x.state === "na" ? `${x.clientName} · No contract labour yet` : x.clientName}</span>
        </span>
      ),
    },
    { key: "auth", label: "Authority", width: 150, render: (x) => <span className="text-ink-2">{x.reg.auth}</span> },
    { key: "num", label: "Number", width: 150, render: (x) => (x.num ? <span className={x.reg.id === "gst" ? "font-mono text-12.5" : "text-ink-2"}>{x.num}</span> : <span className="text-muted">{x.reg.form}</span>) },
    { key: "status", label: "Status", width: 132, render: (x) => <Chip tone={REG_STATE[x.state as keyof typeof REG_STATE].tone} fixed>{REG_STATE[x.state as keyof typeof REG_STATE].label}</Chip> },
    {
      key: "date",
      label: "Date",
      width: 140,
      render: (x) => <span className={x.state === "wait" ? "font-semibold text-warn" : "text-muted"}>{x.state === "na" ? "Changed by Pranay" : x.date}</span>,
    },
  ];

  const gridRows = REG_CLIENTS.filter((c) => !client || c.id === client);
  const gridCols: Column<(typeof REG_CLIENTS)[number]>[] = [
    { key: "client", label: "Client", width: 180, render: (c) => <b className="font-semibold">{c.name}</b> },
    ...REG_TYPES.map(
      (r): Column<(typeof REG_CLIENTS)[number]> => ({
        key: r.id,
        label: r.short,
        align: "center",
        render: (c) => {
          const st = regState(c.id, r.id) as keyof typeof CELL;
          const key = `${c.id}-${r.id}`;
          return <Cell state={st} href={itemExists("reg", key) ? staffRegHref(portal, key) : undefined} tip={`${c.name} · ${r.name} · ${REG_STATE[st].label}`} />;
        },
      }),
    ),
  ];

  const head = (
    <>
      <span ref={filterRef} className="inline-flex">
        <Select aria-label="Client" value={client} onChange={(e) => setClient(e.target.value)} options={[{ value: "", label: "All my clients" }, ...REG_CLIENTS.map((c) => ({ value: c.id, label: c.name }))]} />
      </span>
      <Tabs
        items={[
          { key: "list", label: "List" },
          { key: "grid", label: "Grid" },
        ]}
        value={view}
        onChange={setView}
      />
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
    </>
  );

  const wait = live.filter((x) => x.state === "wait");
  const done = live.filter((x) => x.state === "done");
  const next = live.filter((x) => x.state === "none").slice(0, 4);

  return (
    <div className="grid gap-4">
      <FilterStrip items={strip} value={fil} onChange={(k) => setFil(k as Fil)} />
      <Cols>
        <Col>
          <section ref={listRef} className="min-w-0">
            {view === "grid" ? (
              <DataGrid title="Registrations" meta={`${gridRows.length} clients`} columns={gridCols} rows={gridRows} rowKey={(c) => c.id} filters={head} pageSize={10} footer={<Legend />} />
            ) : (
              <GroupedGrid
                title="Registrations"
                count={shown.length}
                right={head}
                columns={listCols}
                groups={groups}
                rowKey={(x) => x.key}
                rowHref={hrefOf}
                footer={
                  <span className="ml-auto flex items-center gap-3">
                    {!client && <span>{REG_CLIENTS.length} clients</span>}
                    <KeyHint />
                  </span>
                }
              />
            )}
          </section>
        </Col>
        <Col>
          <FlowCard
            title="Progress"
            steps={[
              { label: "Documents", value: wait.length },
              { label: "Application", value: live.filter((x) => x.state === "run").length },
              { label: "Authority review", value: 3 },
              { label: "Granted", value: done.length },
            ]}
          />
          <RailCard
            title="Renewals and expiry"
            count={REG_RENEWALS.length}
            items={REG_RENEWALS.map((r) => ({ key: r.id, title: r.title, sub: r.auth, right: r.date, rightClass: r.soon ? "font-semibold text-warn" : undefined }))}
          />
          <RailCard title="Waiting on client" count={wait.length} items={wait.slice(0, 5).map((x) => ({ key: x.key, title: x.reg.name, sub: x.clientName, right: "4 days", rightClass: "font-semibold text-warn", href: hrefOf(x) }))} />
          <RailCard title="Recently granted" count={Math.min(4, done.length)} items={done.slice(0, 4).map((x) => ({ key: x.key, title: x.reg.name, sub: `${x.clientName} · ${x.num}`, href: hrefOf(x) }))} />
          <RailCard title="Next to start" count={next.length} items={next.map((x) => ({ key: x.key, title: x.reg.name, sub: x.clientName }))} />
        </Col>
      </Cols>
    </div>
  );
}
