"use client";
import * as React from "react";
import { AlertTriangle, Calendar, CalendarClock, CircleCheck, Plus, User } from "lucide-react";
import { STAFF_TODAY, fmt } from "@/lib/dates";
import { STAFF_TASKS, taskHref, taskWord, weekOf, type NsTask } from "@/data/compliance-tasks";
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
import { personOf, type StaffPortal } from "./parts";
import { useUndoToast } from "@/components/ui/UndoToast";
import { CategoryTabs, NewTaskDialog, clientLabel, nsColumns, nsGroups, nsMatch, type Cat, type Fil } from "./ns-parts";
import { ClientTile } from "./grids";
import { KeyHint, useListKeys } from "./comp-parts";
import { FilingBand, type DateTone } from "@/components/cards/FilingBand";
import { FilterStrip, FlowCard, GroupedGrid, RailCard, type GridGroup, type RailItem, type StripItem } from "./register-parts";

// Staff Obligations, as in reference/old-screens/s/lead/Register.dc.html (kind "ob", who "staff"):
// number strip, a table grouped by frequency or by law, and a rail with "Filed recently".
// C-0018 to C-0020 changed only the client page.
// Spectrum (Compliances.dc.html): the default view groups the list by filing. Each band has a date tile, the filing name,
// an area pill and "3 of 5 filed"; the clients sit under it.
// COMPLIANCE-MODEL.md 4.1: a Statutory / Non-statutory / All switch over the list (S-1). The strip and the rail follow it (S-8).
// Managers and admins create non-statutory tasks here (S-4, S-5); the new rows live in page state.

const FREQ_DOT: Record<Freq, string> = { m: "bg-accent-mid", q: "bg-violet-mid", h: "bg-teal-mid", a: "bg-warn-mid" };
const AREA_DOT: Record<string, string> = {
  GST: "bg-reg-gst",
  "Income tax": "bg-reg-it",
  Payroll: "bg-reg-payroll",
  MCA: "bg-reg-mca",
  FEMA: "bg-reg-fema",
  Labour: "bg-reg-labour",
};
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "11 Nov 2026" as a sortable number. */
const dayKey = (s: string) => {
  const [d, m, y] = s.split(" ");
  return Number(y) * 10000 + MON.indexOf(m) * 100 + Number(d);
};
/** Band tint: red when a client is overdue, amber when due in 15 days, blurple later. */
const bandTone = (rows: ObRow[]): DateTone => (rows.some((x) => x.state === "bad") ? "bad" : rows.some(dueSoon) ? "warn" : "accent");

export function ObligationsScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState("filing");
  const [client, setClient] = React.useState("");
  const [fil, setFil] = React.useState<Fil>("");
  const [cat, setCat] = React.useState<Cat>("stat");
  const [tasks, setTasks] = React.useState<NsTask[]>(STAFF_TASKS);
  const [creating, setCreating] = React.useState(false);
  const toast = useUndoToast();
  const canCreate = portal === "manager" || portal === "admin";
  const today = STAFF_TODAY;
  const listRef = React.useRef<HTMLElement>(null);
  const filterRef = React.useRef<HTMLSpanElement>(null);
  useListKeys(listRef, filterRef);

  const items = obRows(client);
  const match = (x: ObRow, f: Fil) => (f === "soon" ? dueSoon(x) : x.state === f);
  const shown = items.filter((x) => !fil || match(x, fil));
  const count = (f: Fil) => items.filter((x) => match(x, f)).length;
  const hrefOf = (x: ObRow) => (itemExists("ob", x.key) ? staffObHref(portal, x.key) : undefined);

  // Non-statutory tasks (S-3). The client filter applies to them too.
  const nsItems = tasks.filter((t) => !client || t.client === client);
  const nsShown = nsItems.filter((t) => !fil || nsMatch(t, fil, today));
  const nsCount = (f: Fil) => nsItems.filter((t) => nsMatch(t, f, today)).length;
  const nsHref = (t: NsTask) => (t.id.startsWith("ns-new-") ? undefined : taskHref(portal, t.id));
  const hasStat = cat !== "ns";
  const hasNs = cat !== "stat";
  /** S-8: the strip counts the category in view. */
  const tally = (f: Fil) => (hasStat ? count(f) : 0) + (hasNs ? nsCount(f) : 0);
  const LABELS: Record<Cat, [string, string, string, string, string]> = {
    stat: ["Overdue", "Due in 15 days", "Waiting on client", "Filed", "Upcoming"],
    ns: ["Overdue", "Due this week", "Waiting on client", "Done", "Not started"],
    all: ["Overdue", "Due soon", "Waiting on client", "Done", "Not started"],
  };
  const L = LABELS[cat];

  const strip: StripItem[] = [
    { key: "bad", label: L[0], value: tally("bad"), Icon: AlertTriangle, tone: "red", valueClass: "text-bad" },
    { key: "soon", label: L[1], value: tally("soon"), Icon: Calendar, tone: "teal", valueClass: "text-warn" },
    { key: "wait", label: L[2], value: tally("wait"), Icon: User, tone: "amber" },
    { key: "done", label: L[3], value: tally("done"), Icon: CircleCheck, tone: "green", valueClass: "text-ok" },
    { key: "none", label: L[4], value: tally("none"), Icon: CalendarClock, tone: "blue" },
  ];

  const ownerOf = React.useCallback((id: string): [string, string] => {
    const t = STAFF_TASKS.find((x) => x.client === id);
    return [t?.owner ?? clientById(id)?.lead ?? "", t?.reviewer ?? "Pranay"];
  }, []);
  const create = (t: NsTask) => {
    setTasks((xs) => [...xs, t]);
    if (cat === "stat") setCat("ns");
    if (client && client !== t.client) setClient("");
    setFil("");
    toast.show("Task created", { kind: "saved", sub: `${t.name} · ${clientLabel(t.client)}` });
  };

  const groups: GridGroup<ObRow>[] =
    view === "filing"
      ? [...OB_TYPES]
          .sort((a, b) => dayKey(a.next) - dayKey(b.next))
          .map((ob) => {
            const rows = shown.filter((x) => x.ob.id === ob.id);
            const [day, mon] = ob.next.split(" ");
            const head = rows.length ? (
              <FilingBand
                day={day}
                month={mon}
                tone={bandTone(rows)}
                name={ob.name}
                sub={`Due ${ob.next.replace(/ 20\d\d$/, "")}`}
                area={LAW_AREA[ob.law] ?? ob.law}
                filed={rows.filter((x) => x.state === "done").length}
                total={rows.length}
              />
            ) : undefined;
            return { id: ob.id, label: ob.name, dot: "", rows, head };
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
  const lastCol: Column<ObRow> = {
    key: "last",
    label: "Last filed",
    width: 130,
    className: "hidden md:table-cell",
    render: (x) => <span className="text-muted">{x.ob.last}</span>,
  };

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
    {
      key: "law",
      label: "Law",
      width: 140,
      className: "hidden md:table-cell",
      render: (x) => <AreaPill area={x.ob.law} reg={regOf(LAW_AREA[x.ob.law] ?? x.ob.law)} className="w-auto min-w-[104px] max-w-full" />,
    },
    lastCol,
    statusCol,
    dueCol,
  ];

  const head = (
    <>
      <span ref={filterRef} className="inline-flex">
        <Select
          aria-label="Client"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          options={[{ value: "", label: "All my clients" }, ...REG_CLIENTS.map((c) => ({ value: c.id, label: c.name }))]}
        />
      </span>
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
      {canCreate && (
        <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
          <Plus size={15} strokeWidth={1.6} aria-hidden />
          New task
        </Button>
      )}
    </>
  );

  const bar = (
    <>
      <CategoryTabs value={cat} onChange={setCat} stat={items.length} ns={nsItems.length} />
      {hasStat && (
        <Tabs
          className="sm:ml-auto"
          items={[
            { key: "filing", label: "By filing" },
            { key: "freq", label: "By frequency" },
            { key: "law", label: "By law" },
          ]}
          value={view}
          onChange={setView}
        />
      )}
    </>
  );
  const keys = (
    <span className="ml-auto flex items-center gap-3">
      <KeyHint />
    </span>
  );
  const nsGrid = (top: boolean) => (
    <GroupedGrid
      title={top ? "Obligations" : "Non-statutory tasks"}
      bar={top ? bar : undefined}
      right={top ? head : undefined}
      columns={nsColumns(today, "staff")}
      groups={nsGroups(nsShown, today)}
      phoneFit
      rowKey={(t) => t.id}
      rowHref={nsHref}
      footer={keys}
    />
  );

  // Rail: follows the category. All puts statutory rows first, then tasks.
  const done = items.filter((x) => x.state === "done");
  type R = RailItem;
  const sR = (x: ObRow, right: string, rightClass?: string): R => ({ key: x.key, title: x.ob.name, sub: x.clientName, right, rightClass, href: hrefOf(x) });
  const nR = (t: NsTask): R => ({
    key: t.id,
    title: t.name,
    sub: clientLabel(t.client),
    right: fmt(t.end),
    rightClass: taskWord(t, today) === "Overdue" ? "font-medium text-bad" : undefined,
    href: nsHref(t),
  });
  const byEnd = (a: NsTask, b: NsTask) => a.end.getTime() - b.end.getTime();
  const nsOpen = nsItems.filter((t) => t.stage !== "completed");
  const soonAll: R[] = [
    ...(hasStat ? items.filter(dueSoon).map((x) => sR(x, x.due, x.state === "bad" ? "font-medium text-bad" : undefined)) : []),
    ...(hasNs
      ? nsOpen
          .filter((t) => weekOf(t, today) === "This week")
          .sort(byEnd)
          .map(nR)
      : []),
  ];
  const waitAll: R[] = [
    ...(hasStat ? items.filter((x) => x.state === "wait").map((x) => sR(x, "3 days", "font-medium text-teal")) : []),
    ...(hasNs
      ? nsItems
          .filter((t) => taskWord(t, today) === "Waiting")
          .sort(byEnd)
          .map(nR)
      : []),
  ];
  const doneAll: R[] = [
    ...(hasStat ? done.map((x) => sR(x, x.ob.last)) : []),
    ...(hasNs
      ? nsItems
          .filter((t) => t.stage === "completed")
          .sort((a, b) => byEnd(b, a))
          .map(nR)
      : []),
  ];
  const nsIn = (...st: NsTask["stage"][]) => nsItems.filter((t) => st.includes(t.stage)).length;
  const flow =
    cat === "stat"
      ? [
          { label: "Data from client", value: count("wait") },
          { label: "Prepared", value: items.filter((x) => x.state === "run").length },
          { label: "Filed", value: done.length },
          { label: "Acknowledged", value: Math.max(0, done.length - 1) },
        ]
      : [
          { label: "Not started", value: (hasStat ? count("none") : 0) + nsIn("not-started", "ready") },
          { label: "Waiting on client", value: (hasStat ? count("wait") : 0) + nsIn("waiting") },
          { label: "In progress", value: (hasStat ? items.filter((x) => x.state === "run").length : 0) + nsIn("in-progress", "review", "rework") },
          { label: "Done", value: (hasStat ? done.length : 0) + nsIn("completed") },
        ];

  return (
    <div className="grid gap-4">
      <FilterStrip items={strip} value={fil} onChange={(k) => setFil(k as Fil)} />
      <Cols>
        <Col>
          <section ref={listRef} className="grid min-w-0 gap-5">
            {hasStat ? (
              <GroupedGrid
                title="Obligations"
                bar={bar}
                right={head}
                columns={view === "filing" ? filingCols : cols}
                groups={groups}
                phoneFit
                rowKey={(x) => x.key}
                rowHref={hrefOf}
                footer={keys}
              />
            ) : (
              nsGrid(true)
            )}
            {cat === "all" && nsGrid(false)}
          </section>
        </Col>
        <Col>
          <FlowCard title="This month" steps={flow} />
          <RailCard title={cat === "stat" ? "Due in the next 15 days" : cat === "ns" ? "This week" : "Due soon"} count={soonAll.length} items={soonAll.slice(0, 5)} />
          <RailCard title="Waiting on client" count={waitAll.length} items={waitAll.slice(0, 4)} />
          <RailCard title={cat === "stat" ? "Filed recently" : "Done recently"} count={doneAll.length} items={doneAll.slice(0, 4)} />
        </Col>
      </Cols>
      {canCreate && <NewTaskDialog open={creating} onOpenChange={setCreating} today={today} defaultClient={client} ownerOf={ownerOf} onCreate={create} by={personOf(portal)} />}
      {toast.node}
    </div>
  );
}
