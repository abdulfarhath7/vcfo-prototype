"use client";
import * as React from "react";
import { AlertTriangle, Calendar, CalendarClock, CircleCheck, User } from "lucide-react";
import { staffObHref } from "@/data/staff-compliance";
import { itemExists } from "@/data/staff-item";
import { FREQ_LABEL, LAW_AREA, LAW_GROUPS, OB_STATE, REG_CLIENTS, dueSoon, lawTone, obRows, type Freq, type ObRow } from "@/data/staff-regs-table";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { type Column } from "@/components/cards/DataGrid";
import { type StaffPortal } from "./parts";
import { KeyHint, useListKeys } from "./comp-parts";
import { FilterStrip, FlowCard, GroupedGrid, RailCard, type GridGroup, type StripItem } from "./register-parts";

// Staff Obligations, as in reference/old-screens/s/lead/Register.dc.html (kind "ob", who "staff"):
// number strip, a table grouped by frequency or by law, and a rail with "Filed recently".
// C-0018 to C-0020 changed only the client page.

type Fil = "" | "bad" | "soon" | "wait" | "done" | "none";

const FREQ_DOT: Record<Freq, string> = { m: "bg-accent", q: "bg-violet", h: "bg-teal", a: "bg-warn-mid" };
const AREA_DOT: Record<string, string> = { GST: "bg-teal", "Income tax": "bg-accent", Payroll: "bg-warn-mid", MCA: "bg-violet", FEMA: "bg-ok-mid", Labour: "bg-faint" };

export function ObligationsScreen({ portal }: { portal: StaffPortal }) {
  const [view, setView] = React.useState("freq");
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
    { key: "wait", label: "Waiting on client", value: count("wait"), Icon: User, tone: "amber", valueClass: "text-warn" },
    { key: "done", label: "Filed", value: count("done"), Icon: CircleCheck, tone: "green", valueClass: "text-ok" },
    { key: "none", label: "Upcoming", value: count("none"), Icon: CalendarClock, tone: "blue" },
  ];

  const groups: GridGroup<ObRow>[] =
    view === "law"
      ? LAW_GROUPS.map((g) => ({ id: g.area, label: g.label, dot: AREA_DOT[g.area], rows: shown.filter((x) => LAW_AREA[x.ob.law] === g.area) }))
      : (Object.keys(FREQ_LABEL) as Freq[]).map((f) => ({ id: f, label: FREQ_LABEL[f], dot: FREQ_DOT[f], rows: shown.filter((x) => x.ob.fr === f) }));

  const cols: Column<ObRow>[] = [
    {
      key: "name",
      label: "Obligation",
      render: (x) => (
        <span className="block min-w-0">
          <b className="block truncate text-13 font-semibold">{x.ob.name}</b>
          <span className="block truncate text-12 text-muted">{x.clientName}</span>
        </span>
      ),
    },
    { key: "law", label: "Law", width: 150, render: (x) => <Tag tone={lawTone(x.ob.law)}>{x.ob.law}</Tag> },
    { key: "last", label: "Last filed", width: 150, render: (x) => <span className="text-muted">{x.ob.last}</span> },
    { key: "status", label: "Status", width: 132, render: (x) => <Chip tone={OB_STATE[x.state].tone} fixed>{OB_STATE[x.state].label}</Chip> },
    {
      key: "due",
      label: "Next due",
      width: 120,
      render: (x) => (
        <span className={x.state === "bad" ? "font-semibold text-bad" : "text-muted"} title={`Late: ${x.ob.pen}`}>
          {x.due}
        </span>
      ),
    },
  ];

  const head = (
    <>
      <span ref={filterRef} className="inline-flex">
        <Select aria-label="Client" value={client} onChange={(e) => setClient(e.target.value)} options={[{ value: "", label: "All my clients" }, ...REG_CLIENTS.map((c) => ({ value: c.id, label: c.name }))]} />
      </span>
      <Tabs
        items={[
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
              columns={cols}
              groups={groups}
              rowKey={(x) => x.key}
              rowHref={hrefOf}
              footer={
                <span className="ml-auto flex items-center gap-3">
                  <span>Started by your registrations</span>
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
            items={soon.map((x) => ({ key: x.key, title: x.ob.name, sub: x.clientName, right: x.due, rightClass: x.state === "bad" ? "font-semibold text-bad" : undefined, href: hrefOf(x) }))}
          />
          <RailCard title="Waiting on client" count={wait.length} items={wait.map((x) => ({ key: x.key, title: x.ob.name, sub: x.clientName, right: "3 days", rightClass: "font-semibold text-warn", href: hrefOf(x) }))} />
          <RailCard title="Filed recently" count={filed.length} items={filed.map((x) => ({ key: x.key, title: x.ob.name, sub: x.clientName, right: x.ob.last, href: hrefOf(x) }))} />
        </Col>
      </Cols>
    </div>
  );
}
