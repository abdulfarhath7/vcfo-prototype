"use client";
import * as React from "react";
import Link from "next/link";
import { TODAY, fmt } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { Thread } from "@/components/cards/Thread";
import { RISKS, RISK_STATUS_TONE, SEVERITY_TONE, clientById, type Risk, type RiskStatus } from "@/data/super";
import { ClientName, clientHref, opts } from "./parts";

export function RisksScreen() {
  const [risks, setRisks] = React.useState<Risk[]>(RISKS);
  const [tab, setTab] = React.useState<RiskStatus>("Open");
  const [sev, setSev] = React.useState("");
  const [picked, setPicked] = React.useState<string>(RISKS[0].id);

  const rows = risks.filter((r) => r.status === tab && (!sev || r.severity === sev));
  const cur = risks.find((r) => r.id === picked) ?? rows[0];

  function act(r: Risk) {
    setPicked(r.id);
    setRisks((all) =>
      all.map((x) => {
        if (x.id !== r.id) return x;
        if (x.action === "Reopen") return { ...x, status: "Open", action: "Escalate" };
        const title = x.action === "Escalate" ? "Escalated to Mithilesh" : x.action === "Assign" ? "Assigned" : "Remind sent";
        if (x.thread.some((t) => t.title === title)) return x;
        const thread = x.thread.map((t) => (t.state === "current" ? { ...t, state: "done" as const } : t));
        const at = thread.findIndex((t) => t.state === "upcoming");
        const step = { id: `act-${thread.length}`, title, state: "current" as const, date: TODAY, by: "Mithilesh" };
        return { ...x, thread: at < 0 ? [...thread, step] : [...thread.slice(0, at), step, ...thread.slice(at)] };
      }),
    );
  }

  function close(r: Risk) {
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
  }

  const columns: Column<Risk>[] = [
    {
      key: "risk",
      label: "Risk",
      render: (r) => (
        <button type="button" onClick={() => setPicked(r.id)} className="block max-w-[280px] truncate text-left font-semibold hover:underline">
          {r.title}
        </button>
      ),
    },
    {
      key: "client",
      label: "Client",
      render: (r) => {
        const c = r.clientId ? clientById(r.clientId) : undefined;
        return c ? <ClientName client={c} href={clientHref(c.id)} /> : <span className="text-muted">{r.clientName}</span>;
      },
    },
    { key: "area", label: "Area" },
    { key: "owner", label: "Owner", className: "whitespace-nowrap" },
    { key: "since", label: "Since", width: 80, className: "whitespace-nowrap", render: (r) => fmt(r.since) },
    {
      key: "severity",
      label: "Severity",
      width: 124,
      render: (r) => (
        <Chip fixed tone={SEVERITY_TONE[r.severity]}>
          {r.severity}
        </Chip>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: 124,
      render: (r) => (
        <Chip fixed tone={RISK_STATUS_TONE[r.status]}>
          {r.status}
        </Chip>
      ),
    },
    {
      key: "action",
      label: "Action",
      width: 100,
      render: (r) => (
        <Button size="sm" variant="outline" onClick={() => act(r)}>
          {r.action}
        </Button>
      ),
    },
  ];

  const count = (s: RiskStatus) => risks.filter((r) => r.status === s).length;

  return (
    <div className="grid grid-cols-1 gap-5">
      <DataGrid
        title="Risks"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        rowClass={(r) => (cur && r.id === cur.id ? "[&>td]:!bg-accent-soft" : undefined)}
        filters={
          <>
            <Tabs
              items={(["Open", "Watching", "Closed"] as RiskStatus[]).map((s) => ({ key: s, label: s, count: count(s) }))}
              value={tab}
              onChange={(k) => {
                setTab(k as RiskStatus);
                const first = risks.find((r) => r.status === k && (!sev || r.severity === sev));
                if (first) setPicked(first.id);
              }}
            />
            <Select aria-label="Severity" value={sev} onChange={(e) => setSev(e.target.value)} options={opts("All severities", ["High", "Medium", "Low"])} />
          </>
        }
      />
      {cur && (
        <SectionCard title="Risk" meta={cur.clientName} right={<Chip tone={SEVERITY_TONE[cur.severity]}>{cur.severity}</Chip>}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="min-w-0">
              <h3 className="text-14 font-semibold">{cur.title}</h3>
              <KeyValue
                cols={1}
                className="mt-3 [&_dd]:whitespace-normal"
                rows={[
                  { k: "What", v: cur.what },
                  { k: "Why", v: cur.why },
                  { k: "Next step", v: cur.next },
                  { k: "Owner", v: `${cur.owner} · since ${fmt(cur.since)}` },
                ]}
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="primary" onClick={() => act(cur)}>
                  {cur.action}
                </Button>
                {cur.status !== "Closed" && (
                  <Button size="sm" variant="outline" onClick={() => close(cur)}>
                    Close risk
                  </Button>
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
    </div>
  );
}
