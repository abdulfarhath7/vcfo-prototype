"use client";
import * as React from "react";
import { fmt, fmtYear, urgency } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { barFill } from "@/components/ui/Bar";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ActivityList, type ActivityRow } from "@/components/cards/ActivityList";
import { AUDIT } from "@/data/shared";
import {
  FILINGS,
  HEALTH_TONE,
  RISKS,
  RISK_STATUS_TONE,
  SERVICE_TONE,
  SEVERITY_TONE,
  WORK_TONE,
  auditOf,
  clientById,
  servicesOf,
  stageLabel,
  stageTone,
  type Risk,
  type Service,
  type Work,
} from "@/data/super";

const serviceCols: Column<Service>[] = [
  { key: "name", label: "Service", render: (s) => <span className="font-semibold">{s.name}</span> },
  { key: "area", label: "Area" },
  { key: "started", label: "Started", width: 110, render: (s) => fmtYear(s.started) },
  { key: "owner", label: "Owner" },
  {
    key: "status",
    label: "Status",
    width: 124,
    render: (s) => (
      <Chip fixed tone={SERVICE_TONE[s.status]}>
        {s.status}
      </Chip>
    ),
  },
];

const filingCols: Column<Work>[] = [
  { key: "item", label: "Form", render: (w) => <span className="font-semibold">{w.item}</span> },
  { key: "group", label: "Statute" },
  { key: "due", label: "Due", width: 80, render: (w) => <span className={cn(w.status === "Overdue" && "font-semibold text-bad")}>{fmt(w.due)}</span> },
  { key: "owner", label: "With", width: 112, render: (w) => <OwnerChip owner={w.owner} /> },
  {
    key: "status",
    label: "Status",
    width: 124,
    render: (w) => (
      <Chip fixed tone={WORK_TONE[w.status]}>
        {w.status}
      </Chip>
    ),
  },
];

const riskCols: Column<Risk>[] = [
  { key: "title", label: "Risk", render: (r) => <span className="font-semibold">{r.title}</span> },
  { key: "area", label: "Area" },
  { key: "owner", label: "Owner" },
  { key: "since", label: "Since", width: 80, render: (r) => fmt(r.since) },
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
];

export function ClientRecordScreen({ id }: { id: string }) {
  const [tab, setTab] = React.useState("overview");
  const c = clientById(id);
  if (!c) return null;

  const services = servicesOf(c);
  const filings = FILINGS.filter((f) => f.clientId === c.id);
  const risks = RISKS.filter((r) => r.clientId === c.id);
  const audit: ActivityRow[] = c.id === "northwind" ? AUDIT.map((a) => ({ id: a.id, date: a.date, time: a.time, text: `${a.action}: ${a.target}`, who: a.who })) : auditOf(c);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "services", label: "Services", count: services.length },
    { key: "filings", label: "Filings", count: filings.length },
    { key: "risks", label: "Risks", count: risks.length },
    { key: "audit", label: "Audit" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard title={c.name} bare>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <i className={cn("h-2.5 w-2.5 flex-none rounded-full", barFill[c.tone])} aria-hidden />
          <h1 className="min-w-0 truncate text-[18px] font-semibold leading-tight tracking-tight">{c.name}</h1>
          <Chip tone={stageTone(c)}>{stageLabel(c)}</Chip>
          <Chip tone={HEALTH_TONE[c.health]}>{c.health}</Chip>
        </div>
        <KeyValue
          cols={3}
          className="mt-4"
          rows={[
            { k: "Now at", v: c.stepNo ? `Step ${c.stepNo} · ${c.step}` : c.step },
            { k: "Next date", v: <span className={cn(urgency(c.next) === "bad" && "text-bad")}>{fmt(c.next)}</span> },
            { k: "Overdue", v: <span className={cn(c.overdue > 0 && "text-bad")}>{c.overdue}</span> },
            { k: "Manager", v: c.manager },
            { k: "Project lead", v: c.lead },
            { k: "Area", v: c.area },
          ]}
        />
        <div className="-mx-1 mt-4 overflow-x-auto px-1">
          <Tabs items={tabs} value={tab} onChange={setTab} />
        </div>
      </SectionCard>

      {tab === "overview" && (
        <Cols>
          <Col>
            <SectionCard title="Company details">
              <KeyValue
                rows={[
                  { k: "CIN", v: c.cin ?? "After incorporation", mono: !!c.cin },
                  { k: "PAN", v: c.pan ?? "After incorporation", mono: !!c.pan },
                  { k: "GSTIN", v: c.gstin ?? "Not registered", mono: !!c.gstin },
                  { k: c.stage === "incorporating" ? "Client since" : "Incorporated", v: fmtYear(c.since) },
                  { k: "Stage", v: stageLabel(c) },
                  { k: "Area", v: c.area },
                ]}
              />
            </SectionCard>
            <SectionCard title="Services" flush>
              {services.map((s) => (
                <ListRow key={s.id}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{s.name}</span>
                    <span className="block truncate text-12.5 text-muted">
                      {s.area} · since {fmtYear(s.started)}
                    </span>
                  </span>
                  <Chip tone={SERVICE_TONE[s.status]}>{s.status}</Chip>
                </ListRow>
              ))}
            </SectionCard>
          </Col>
          <Col>
            <SectionCard title="People" flush>
              {[{ name: c.manager, role: "Manager · SBC" }, { name: c.lead, role: "Project lead · SBC" }, ...c.contacts.map((p) => ({ name: p.name, role: p.role, email: p.email }))].map(
                (p: { name: string; role: string; email?: string }) => (
                  <ListRow key={p.name}>
                    <Avatar name={p.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.name}</span>
                      <span className="block truncate text-12.5 text-muted">{p.role}</span>
                    </span>
                    {p.email && <span className="hidden truncate font-mono text-12 text-muted sm:inline">{p.email}</span>}
                  </ListRow>
                ),
              )}
            </SectionCard>
          </Col>
        </Cols>
      )}

      {tab === "services" && <DataGrid title="Services" columns={serviceCols} rows={services} rowKey={(s) => s.id} />}
      {tab === "filings" && <DataGrid title="Filings" meta="October" columns={filingCols} rows={filings} rowKey={(w) => w.id} rowLate={(w) => w.status === "Overdue"} />}
      {tab === "risks" && <DataGrid title="Risks" columns={riskCols} rows={risks} rowKey={(r) => r.id} />}
      {tab === "audit" && (
        <SectionCard title="Audit" flush>
          <ActivityList rows={audit} />
        </SectionCard>
      )}
    </div>
  );
}
