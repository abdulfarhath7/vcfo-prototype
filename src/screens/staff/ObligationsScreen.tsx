"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { AlertTriangle, Calendar, CalendarClock, CircleCheck, User } from "lucide-react";
import { staffObHref } from "@/data/staff-compliance";
import { itemExists } from "@/data/staff-item";
import { FREQ_LABEL, LAW_AREA, LAW_GROUPS, OB_STATE, OB_TYPES, REG_CLIENTS, dueSoon, obRows, type Freq, type ObRow } from "@/data/staff-regs-table";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { AreaPill, Chip, regOf } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { clientById } from "@/data/staff-clients";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { type Column } from "@/components/cards/DataGrid";
import { type StaffPortal } from "./parts";
import { ClientTile } from "./grids";
import { KeyHint, useListKeys } from "./comp-parts";
import { FilterStrip, FlowCard, GroupedGrid, RailCard, type GridGroup, type StripItem } from "./register-parts";

// Staff Obligations, as in reference/old-screens/s/lead/Register.dc.html (kind "ob", who "staff"):
// number strip, a table grouped by frequency or by law, and a rail with "Filed recently".
// C-0018 to C-0020 changed only the client page.
// Spectrum (Compliances.dc.html): the default view groups the list by filing. Each band has a date tile, the filing name,
// an area pill and "3 of 5 filed"; the clients sit under it.

type Fil = "" | "bad" | "soon" | "wait" | "done" | "none";

const FREQ_DOT: Record<Freq, string> = { m: "bg-accent-mid", q: "bg-violet-mid", h: "bg-teal-mid", a: "bg-warn-mid" };
const AREA_DOT: Record<string, string> = { GST: "bg-reg-gst", "Income tax": "bg-reg-it", Payroll: "bg-reg-payroll", MCA: "bg-reg-mca", FEMA: "bg-reg-fema", Labour: "bg-reg-labour" };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "11 Nov 2026" as a sortable number. */
const dayKey = (s: string) => {
  const [d, m, y] = s.split(" ");
  return Number(y) * 10000 + MON.indexOf(m) * 100 + Number(d);
};
const TILE = { bad: "bg-bad-soft text-bad", soon: "bg-warn-soft text-warn", later: "bg-accent-soft text-accent" } as const;

/** 44 px date tile: day over month. Red when a client is overdue, amber when due in 15 days, blurple later. */
function DateTile({ date, tone }: { date: string; tone: keyof typeof TILE }) {
  const [d, m] = date.split(" ");
  return (
    <span className={cn("inline-flex h-11 w-11 flex-none flex-col items-center justify-center rounded-md", TILE[tone])} aria-label={`Due ${date}`}>
      <b className="text-16 font-medium leading-none">{d}</b>
      <span className="mt-[3px] text-[10.5px] font-medium uppercase tracking-[.06em]">{m}</span>
    </span>
  );
}

/** Band of one filing: date tile, name and due date, area pill, filed count with a green bar. */
function FilingHead({ ob, rows }: { ob: ObRow["ob"]; rows: ObRow[] }) {
  const filed = rows.filter((x) => x.state === "done").length;
  const tone = rows.some((x) => x.state === "bad") ? "bad" : rows.some(dueSoon) ? "soon" : "later";
  const area = LAW_AREA[ob.law];
  return (
    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3.5 gap-y-2">
      <DateTile date={ob.next} tone={tone} />
      <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
        <span className="truncate text-14.5 font-medium text-ink">{ob.name}</span>
        <span className="text-12.5 text-muted">Due {ob.next.replace(/ 20\d\d$/, "")}</span>
      </span>
      <AreaPill area={area ?? ob.law} />
      <span className="flex w-[190px] items-center gap-2.5">
        <span className="whitespace-nowrap text-12.5 font-normal text-muted">
          {filed} of {rows.length} filed
        </span>
        <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-bar bg-surface" aria-hidden>
          <i className="absolute inset-y-0 left-0 rounded-bar bg-ok-mid" style={{ width: `${Math.round((filed / rows.length) * 100)}%` }} />
        </span>
      </span>
    </span>
  );
}

export function ObligationsScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState("filing");
  const [client, setClient] = React.useState("");
  const [fil, setFil] = React.useState<Fil>("");
  const listRef = React.useRef<HTMLElement>(null);
  const filterRef = React.useRef<HTMLSpanElement>(null);
  useListKeys(listRef, filterRef);

  const items = obRows(client);
  const match = (x: ObRow, f: Fil) => (f === "soon" ? dueSoon(x) : x.state === f);
  const shown = items.filter((x) => !fil || match(x, fil));
  const count = (f: Fil) => items.filter((x) => match(x, f)).length;
  const hrefOf = (x: ObRow) => (itemExists("ob", x.key) ? staffObHref(portal, x.key) : undefined);

  const strip: StripItem[] = [
    { key: "bad", label: "Overdue", value: count("bad"), Icon: AlertTriangle, tone: "red", valueClass: "text-bad" },
    { key: "soon", label: "Due in 15 days", value: count("soon"), Icon: Calendar, tone: "teal", valueClass: "text-warn" },
    { key: "wait", label: "Waiting on client", value: count("wait"), Icon: User, tone: "amber" },
    { key: "done", label: "Filed", value: count("done"), Icon: CircleCheck, tone: "green", valueClass: "text-ok" },
    { key: "none", label: "Upcoming", value: count("none"), Icon: CalendarClock, tone: "blue" },
  ];

  const groups: GridGroup<ObRow>[] =
    view === "filing"
      ? [...OB_TYPES]
          .sort((a, b) => dayKey(a.next) - dayKey(b.next))
          .map((ob) => {
            const rows = shown.filter((x) => x.ob.id === ob.id);
            return { id: ob.id, label: ob.name, dot: "", rows, head: rows.length ? <FilingHead ob={ob} rows={rows} /> : undefined };
          })
      : view === "law"
        ? LAW_GROUPS.map((g) => ({ id: g.area, label: g.label, dot: AREA_DOT[g.area], rows: shown.filter((x) => LAW_AREA[x.ob.law] === g.area) }))
        : (Object.keys(FREQ_LABEL) as Freq[]).map((f) => ({ id: f, label: FREQ_LABEL[f], dot: FREQ_DOT[f], rows: shown.filter((x) => x.ob.fr === f) }));

  // Spectrum: waiting is teal (R-13); the data keeps its own tone.
  const statusCol: Column<ObRow> = {
    key: "status",
    label: "Status",
    width: 128,
    render: (x) => (
      <Chip tone={x.state === "wait" ? "teal" : OB_STATE[x.state].tone} fixed>
        {OB_STATE[x.state].label}
      </Chip>
    ),
  };
  const dueCol: Column<ObRow> = {
    key: "due",
    label: "Next due",
    width: 100,
    render: (x) => (
      <span className={x.state === "bad" ? "font-medium text-bad" : "text-muted"} title={`Late: ${x.ob.pen}`}>
        {x.due}
      </span>
    ),
  };
  const lastCol: Column<ObRow> = { key: "last", label: "Last filed", width: 130, className: "hidden md:table-cell", render: (x) => <span className="text-muted">{x.ob.last}</span> };

  // By filing: the client under the band, its lead, last filed, status, next due.
  const filingCols: Column<ObRow>[] = [
    {
      key: "client",
      label: "Filing · client",
      render: (x) => {
        const c = clientById(x.client);
        return (
          <span className="flex min-w-0 items-center gap-2.5 md:pl-[56px]">
            {c && <ClientTile c={c} size={26} />}
            <span className="min-w-0 truncate font-medium text-ink">{x.clientName}</span>
          </span>
        );
      },
    },
    {
      key: "lead",
      label: "Lead",
      width: 160,
      className: "hidden md:table-cell",
      render: (x) => {
        const lead = clientById(x.client)?.lead;
        return lead ? (
          <span className="inline-flex min-w-0 items-center gap-2">
            <Avatar name={lead} size={24} />
            <span className="truncate">{lead}</span>
          </span>
        ) : null;
      },
    },
    lastCol,
    statusCol,
    // Phone: the band above already gives the due date.
    { ...dueCol, className: "hidden md:table-cell" },
  ];

  const cols: Column<ObRow>[] = [
    {
      key: "name",
      label: "Obligation",
      render: (x) => (
        <span className="block min-w-0">
          <b className="block truncate text-14 font-medium text-ink">{x.ob.name}</b>
          <span className="block truncate text-12.5 text-muted">{x.clientName}</span>
        </span>
      ),
    },
    { key: "law", label: "Law", width: 140, className: "hidden md:table-cell", render: (x) => <AreaPill area={x.ob.law} reg={regOf(LAW_AREA[x.ob.law] ?? x.ob.law)} className="w-auto min-w-[104px] max-w-full" /> },
    lastCol,
    statusCol,
    dueCol,
  ];

  const head = (
    <>
      <span ref={filterRef} className="inline-flex">
        <Select aria-label="Client" value={client} onChange={(e) => setClient(e.target.value)} options={[{ value: "", label: "All my clients" }, ...REG_CLIENTS.map((c) => ({ value: c.id, label: c.name }))]} />
      </span>
      <Tabs
        items={[
          { key: "filing", label: "By filing" },
          { key: "freq", label: "By frequency" },
          { key: "law", label: "By law" },
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

  const done = items.filter((x) => x.state === "done");
  const soon = items.filter(dueSoon).slice(0, 5);
  const wait = items.filter((x) => x.state === "wait").slice(0, 4);
  const filed = done.slice(0, 4);

  return (
    <div className="grid gap-4">
      <FilterStrip items={strip} value={fil} onChange={(k) => setFil(k as Fil)} />
      <Cols>
        <Col>
          <section ref={listRef} className="min-w-0">
            <GroupedGrid
              title="Obligations"
              right={head}
              columns={view === "filing" ? filingCols : cols}
              groups={groups}
              phoneFit
              rowKey={(x) => x.key}
              rowHref={hrefOf}
              footer={
                <span className="ml-auto flex items-center gap-3">
                  <KeyHint />
                </span>
              }
            />
          </section>
        </Col>
        <Col>
          <FlowCard
            title="This month"
            steps={[
              { label: "Data from client", value: count("wait") },
              { label: "Prepared", value: items.filter((x) => x.state === "run").length },
              { label: "Filed", value: done.length },
              { label: "Acknowledged", value: Math.max(0, done.length - 1) },
            ]}
          />
          <RailCard
            title="Due in the next 15 days"
            count={soon.length}
            items={soon.map((x) => ({ key: x.key, title: x.ob.name, sub: x.clientName, right: x.due, rightClass: x.state === "bad" ? "font-medium text-bad" : undefined, href: hrefOf(x) }))}
          />
          <RailCard title="Waiting on client" count={wait.length} items={wait.map((x) => ({ key: x.key, title: x.ob.name, sub: x.clientName, right: "3 days", rightClass: "font-medium text-teal", href: hrefOf(x) }))} />
          <RailCard title="Filed recently" count={filed.length} items={filed.map((x) => ({ key: x.key, title: x.ob.name, sub: x.clientName, right: x.ob.last, href: hrefOf(x) }))} />
        </Col>
      </Cols>
    </div>
  );
}
