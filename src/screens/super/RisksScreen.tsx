"use client";
import * as React from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import { TODAY, fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { Thread } from "@/components/cards/Thread";
import { RISKS, RISK_STATUS_TONE, SEVERITY_TONE, clientById, type Risk, type RiskStatus } from "@/data/super";
import { RISK_KIND_LABEL, RISK_KIND_TONE, adminOf, ageOf, kindOf, type RiskKind } from "@/data/super-firm";
import { ClientName, clientHref, opts } from "./parts";
import { AssignDialog } from "./assign";

// Ported from reference/old-patch/super/Risks.dc.html: grouping by kind with counts (a compact Select, R-10),
// owner with the admin under it, age, severity and the per-risk action (Assign for "No manager", otherwise Send reminder; K-17).
// The first build's status tabs, thread, Escalate and Close stay.

const KINDS = Object.keys(RISK_KIND_LABEL) as RiskKind[];
type Act = "Remind" | "Escalate" | "Assign" | "Reopen";

export function RisksScreen() {
  const [risks, setRisks] = React.useState<Risk[]>(RISKS);
  const [tab, setTab] = React.useState<RiskStatus>("Open");
  const [sev, setSev] = React.useState("");
  const [kind, setKind] = React.useState("");
  const [picked, setPicked] = React.useState<string>(RISKS[0].id);
  const [assignFor, setAssignFor] = React.useState<Risk | null>(null);
  const toast = useUndoToast();

  const rows = risks.filter((r) => r.status === tab && (!sev || r.severity === sev) && (!kind || kindOf(r) === kind));
  const cur = risks.find((r) => r.id === picked) ?? rows[0];

  function log(r: Risk, title: string) {
    setRisks((all) =>
      all.map((x) => {
        if (x.id !== r.id) return x;
        if (x.thread.some((t) => t.title === title && t.date?.getTime() === TODAY.getTime())) return x;
        const thread = x.thread.map((t) => (t.state === "current" ? { ...t, state: "done" as const } : t));
        const at = thread.findIndex((t) => t.state === "upcoming");
        const step = { id: `act-${thread.length}-${title}`, title, state: "current" as const, date: TODAY, by: "Mithilesh" };
        return { ...x, thread: at < 0 ? [...thread, step] : [...thread.slice(0, at), step, ...thread.slice(at)] };
      }),
    );
  }

  function act(r: Risk, a: Act) {
    setPicked(r.id);
    if (a === "Reopen") {
      setRisks((all) => all.map((x) => (x.id === r.id ? { ...x, status: "Open", action: "Escalate" } : x)));
      toast.show(`Reopened: ${r.title}`);
      return;
    }
    if (a === "Assign") {
      setAssignFor(r);
      return;
    }
    if (a === "Escalate") {
      log(r, "Escalated to Mithilesh");
      toast.show(`Escalated: ${r.title}`);
      return;
    }
    const admin = adminOf(r.owner) || "Krishna";
    log(r, "Reminder sent");
    toast.show(`Reminder sent to ${r.owner} and ${admin} · ${r.title}`);
  }

  function close(r: Risk) {
    const before = risks;
    setRisks((all) =>
      all.map((x) =>
        x.id === r.id
          ? {
              ...x,
              status: "Closed",
              action: "Reopen",
              thread: [...x.thread.map((t) => ({ ...t, state: "done" as const, date: t.date ?? TODAY })), { id: "closed", title: "Closed", state: "done" as const, date: TODAY, by: "Mithilesh" }],
            }
          : x,
      ),
    );
    toast.show(`Closed: ${r.title}`, () => setRisks(before));
  }

  /** The row action: Assign for risks without an owner, Reopen for closed risks, otherwise Send reminder. */
  const rowAct = (r: Risk): Act => (r.status === "Closed" ? "Reopen" : kindOf(r) === "owner" || kindOf(r) === "unassigned" ? "Assign" : "Remind");
  const label = (a: Act) => (a === "Remind" ? "Send reminder" : a);

  const columns: Column<Risk>[] = [
    { key: "kind", label: "Kind", width: 130, render: (r) => <Tag tone={RISK_KIND_TONE[kindOf(r)]}>{RISK_KIND_LABEL[kindOf(r)]}</Tag> },
    {
      key: "risk",
      label: "Risk",
      render: (r) => (
        <button type="button" onClick={() => setPicked(r.id)} className="block max-w-[260px] text-left hover:underline">
          <span className="block truncate font-semibold">{r.title}</span>
          <span className="flex items-center gap-1.5 text-12 text-muted">
            <span className="flex gap-0.5" title={`${r.severity} severity`} aria-label={`${r.severity} severity`}>
              {[1, 2, 3].map((i) => (
                <i key={i} className={cn("h-1.5 w-3 rounded-[2px]", i <= (r.severity === "High" ? 3 : r.severity === "Medium" ? 2 : 1) ? "bg-bad-mid" : "bg-line")} />
              ))}
            </span>
            {r.area}
          </span>
        </button>
      ),
    },
    {
      key: "client",
      label: "Client",
      render: (r) => {
        const c = r.clientId ? clientById(r.clientId) : undefined;
        return c ? <ClientName client={c} href={clientHref(c.id)} className="max-w-[180px]" /> : <span className="text-muted">{r.clientName}</span>;
      },
    },
    {
      key: "owner",
      label: "Owner",
      className: "whitespace-nowrap",
      render: (r) => (
        <span>
          <span className="block">{r.owner}</span>
          <span className="block text-12 text-muted">{adminOf(r.owner) || "Krishna (to assign)"}</span>
        </span>
      ),
    },
    { key: "age", label: "Age", width: 76, className: "whitespace-nowrap", render: (r) => ageOf(r) },
    { key: "severity", label: "Severity", width: 124, render: (r) => <Chip fixed tone={SEVERITY_TONE[r.severity]}>{r.severity}</Chip> },
    {
      key: "action",
      label: "Action",
      width: 130,
      render: (r) => (
        <Button size="sm" variant="outline" onClick={() => act(r, rowAct(r))}>
          {label(rowAct(r))}
        </Button>
      ),
    },
  ];

  const count = (s: RiskStatus) => risks.filter((r) => r.status === s).length;
  const inTab = risks.filter((r) => r.status === tab);

  return (
    <div className="grid grid-cols-1 gap-5">
      <DataGrid
        title="Risks"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => setPicked(r.id)}
        selectedKey={cur?.id}
        empty="No risks"
        filters={
          <>
            <Tabs
              items={(["Open", "Watching", "Closed"] as RiskStatus[]).map((s) => ({ key: s, label: s, count: count(s) }))}
              value={tab}
              onChange={(k) => {
                setTab(k as RiskStatus);
                const first = risks.find((r) => r.status === k && (!sev || r.severity === sev) && (!kind || kindOf(r) === kind));
                if (first) setPicked(first.id);
              }}
            />
            <Select
              aria-label="Kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              options={[{ value: "", label: `All kinds · ${inTab.length}` }, ...KINDS.map((k) => ({ value: k, label: `${RISK_KIND_LABEL[k]} · ${inTab.filter((r) => kindOf(r) === k).length}` }))]}
            />
            <Select aria-label="Severity" value={sev} onChange={(e) => setSev(e.target.value)} options={opts("All severities", ["High", "Medium", "Low"])} />
          </>
        }
      />
      <Cols>
        <Col>
          {cur && (
            <SectionCard title="Risk" meta={cur.clientName} right={<Chip tone={SEVERITY_TONE[cur.severity]}>{cur.severity}</Chip>}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag tone={RISK_KIND_TONE[kindOf(cur)]}>{RISK_KIND_LABEL[kindOf(cur)]}</Tag>
                    <Chip tone={RISK_STATUS_TONE[cur.status]}>{cur.status}</Chip>
                  </div>
                  <h3 className="mt-2 text-14 font-semibold">{cur.title}</h3>
                  <KeyValue
                    cols={1}
                    wrap
                    className="mt-3"
                    rows={[
                      { k: "What", v: cur.what },
                      { k: "Why", v: cur.why },
                      { k: "Next step", v: cur.next },
                      { k: "Owner", v: `${cur.owner} · ${adminOf(cur.owner) || "Krishna"} · since ${fmt(cur.since)} · ${ageOf(cur)}` },
                    ]}
                  />
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {cur.status === "Closed" ? (
                      <Button size="sm" variant="primary" onClick={() => act(cur, "Reopen")}>
                        Reopen
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="primary" onClick={() => act(cur, rowAct(cur) === "Assign" ? "Assign" : (cur.action as Act))}>
                          {label(rowAct(cur) === "Assign" ? "Assign" : (cur.action as Act))}
                        </Button>
                        {cur.action !== "Remind" && rowAct(cur) !== "Assign" && (
                          <Button size="sm" variant="outline" onClick={() => act(cur, "Remind")}>
                            Send reminder
                          </Button>
                        )}
                        {cur.action !== "Escalate" && (
                          <Button size="sm" variant="outline" onClick={() => act(cur, "Escalate")}>
                            Escalate
                          </Button>
                        )}
                        {rowAct(cur) !== "Assign" && (
                          <Button size="sm" variant="outline" onClick={() => act(cur, "Assign")}>
                            Assign
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => close(cur)}>
                          Close risk
                        </Button>
                      </>
                    )}
                    {cur.clientId && (
                      <Button asChild size="sm" variant="ghost" className="ml-auto">
                        <Link href={clientHref(cur.clientId)}>Open client</Link>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="min-w-0 border-t border-line-soft pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                  <Thread steps={cur.thread} />
                </div>
              </div>
            </SectionCard>
          )}
        </Col>
        <Col>
          <SectionCard title="By kind" meta={tab} flush icon={{ Icon: Layers, tone: "red" }}>
            <ListRow onClick={() => setKind("")} className={cn(!kind && "bg-accent-soft")}>
              <span className="min-w-0 flex-1 font-semibold">All</span>
              <b className="font-semibold">{inTab.length}</b>
            </ListRow>
            {KINDS.map((k) => (
              <ListRow key={k} onClick={() => setKind(k)} className={cn(kind === k && "bg-accent-soft")}>
                <span className="min-w-0 flex-1">
                  <Tag tone={RISK_KIND_TONE[k]}>{RISK_KIND_LABEL[k]}</Tag>
                </span>
                <b className="font-semibold">{inTab.filter((r) => kindOf(r) === k).length}</b>
              </ListRow>
            ))}
          </SectionCard>
        </Col>
      </Cols>
      <AssignDialog
        open={!!assignFor}
        onOpenChange={(v) => !v && setAssignFor(null)}
        clientId={assignFor?.clientId ?? undefined}
        newClient={assignFor && !assignFor.clientId ? "Lotus Dental" : undefined}
        mode={assignFor && kindOf(assignFor) === "unassigned" ? "task" : "client"}
        onDone={(m) => {
          if (assignFor) log(assignFor, "Assigned");
          toast.show(m);
        }}
      />
      {toast.node}
    </div>
  );
}
