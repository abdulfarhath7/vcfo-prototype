"use client";
import * as React from "react";
import { AlertTriangle, Award, Building2, CalendarCheck, CheckCircle2, Clock, FileCheck2, User } from "lucide-react";
import { fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { NumberStrip, type StatItem } from "@/components/cards/GreetingCard";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { StackedBar, type Segment } from "@/components/cards/StackedBar";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { FIRM_CLIENTS, INC_STAGES, MANAGERS, REG_DONE, WORK, WORK_TONE, clientById, pipeLabel, type Area, type Work, type WorkStatus } from "@/data/super";
import { ClientName, clientHref, opts } from "./parts";

const ITEM_LABEL: Record<Area, string> = { Incorporation: "Step", Registrations: "Registration", Compliances: "Form" };

function columns(area: Area): Column<Work>[] {
  return [
    {
      key: "client",
      label: "Client",
      render: (w) => {
        const c = clientById(w.clientId)!;
        return <ClientName client={c} sub={c.manager} className="max-w-[240px]" />;
      },
    },
    { key: "item", label: ITEM_LABEL[area], render: (w) => <span className="block max-w-[280px] truncate">{w.item}</span> },
    { key: "owner", label: "With", width: 112, render: (w) => <OwnerChip owner={w.owner} /> },
    { key: "due", label: "Due", width: 76, render: (w) => <span className={cn("whitespace-nowrap", (w.status === "Overdue" || w.status === "Stuck") && "font-semibold text-bad")}>{fmt(w.due)}</span> },
    { key: "days", label: area === "Compliances" ? "Days open" : "Days in step", align: "right", width: 104, render: (w) => (w.days === null ? <span className="text-faint">–</span> : w.days) },
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
}

function stats(area: Area, rows: Work[]): StatItem[] {
  const n = (s: WorkStatus) => rows.filter((w) => w.status === s).length;
  const clients = new Set(rows.map((w) => w.clientId)).size;
  if (area === "Incorporation")
    return [
      { label: "Clients", value: clients, Icon: Building2, tone: "blue" },
      { label: "With client", value: n("With client"), Icon: User, tone: "amber" },
      { label: "Stuck", value: n("Stuck") + n("Overdue"), Icon: AlertTriangle, tone: "red", bad: n("Stuck") + n("Overdue") > 0 },
      { label: "Days to COI · average", value: 34, of: "/ 30", Icon: Award, tone: "green" },
    ];
  if (area === "Registrations")
    return [
      { label: "Open registrations", value: rows.length, Icon: FileCheck2, tone: "violet" },
      { label: "With client", value: n("With client"), Icon: User, tone: "amber" },
      { label: "Overdue", value: n("Overdue"), Icon: AlertTriangle, tone: "red", bad: n("Overdue") > 0 },
      { label: "Done to date", value: REG_DONE, Icon: CheckCircle2, tone: "green" },
    ];
  const due = rows.filter((w) => w.status !== "Filed" && w.status !== "Overdue").length;
  return [
    { label: "Filings in October", value: rows.length, Icon: CalendarCheck, tone: "teal" },
    { label: "Filed", value: n("Filed"), Icon: CheckCircle2, tone: "green" },
    { label: "Overdue", value: n("Overdue"), Icon: AlertTriangle, tone: "red", bad: n("Overdue") > 0 },
    { label: "Still to file", value: due, Icon: Clock, tone: "blue" },
  ];
}

function stages(area: Area, rows: Work[]): Segment[] {
  if (area === "Incorporation") {
    const tones = ["violet", "accent", "teal", "ok"] as const;
    return INC_STAGES.map((p, i) => ({ label: pipeLabel(p), value: rows.filter((w) => w.group === pipeLabel(p)).length, tone: tones[i] }));
  }
  const n = (s: WorkStatus) => rows.filter((w) => w.status === s).length;
  if (area === "Registrations")
    return [
      { label: "In progress", value: n("In progress"), tone: "accent" },
      { label: "Due in 7 days", value: n("Due soon"), tone: "warn" },
      { label: "With client", value: n("With client"), tone: "violet" },
      { label: "Overdue", value: n("Overdue"), tone: "bad" },
    ];
  return [
    { label: "Filed", value: n("Filed"), tone: "ok" },
    { label: "In progress", value: n("In progress"), tone: "accent" },
    { label: "With client", value: n("With client"), tone: "violet" },
    { label: "Due in 7 days", value: n("Due soon"), tone: "warn" },
    { label: "Overdue", value: n("Overdue"), tone: "bad" },
    { label: "Upcoming", value: n("Upcoming"), tone: "idle" },
  ];
}

export function PracticeScreen({ area }: { area: Area }) {
  const all = WORK[area];
  const [manager, setManager] = React.useState("");
  const [status, setStatus] = React.useState("");
  const statuses = Array.from(new Set(all.map((w) => w.status)));
  const rows = all.filter((w) => (!manager || clientById(w.clientId)?.manager === manager) && (!status || w.status === status));

  const stuck: AttentionRow[] = all
    .filter((w) => w.status === "Stuck" || w.status === "Overdue")
    .map((w) => {
      const c = clientById(w.clientId)!;
      return { id: w.id, date: w.due, title: c.name, sub: `${w.item} · ${c.lead}`, chip: { label: w.status, tone: WORK_TONE[w.status] }, href: clientHref(c.id) };
    });

  const title = area === "Incorporation" ? "Clients in incorporation" : area === "Registrations" ? "Open registrations" : "Filings · October";

  return (
    <div className="grid grid-cols-1 gap-5">
      <section className="overflow-hidden rounded-lg border border-line bg-surface" aria-label="Summary">
        <NumberStrip items={stats(area, all)} />
      </section>
      <Cols>
        <Col>
          <DataGrid
            title={title}
            columns={columns(area)}
            rows={rows}
            rowKey={(w) => w.id}
            rowHref={(w) => clientHref(w.clientId)}
            rowLate={(w) => w.status === "Overdue"}
            filters={
              <>
                <Select
                  aria-label="Manager"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  options={opts(
                    "All managers",
                    MANAGERS.map((m) => m.name).filter((m) => FIRM_CLIENTS.some((c) => c.manager === m)),
                  )}
                />
                <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={opts("All statuses", statuses)} />
              </>
            }
          />
        </Col>
        <Col>
          <SectionCard title={area === "Compliances" ? "Filings by status" : area === "Registrations" ? "Registrations by status" : "Clients by stage"}>
            <StackedBar total={all.length} segments={stages(area, all)} />
          </SectionCard>
          <SectionCard title="Stuck" meta={String(stuck.length)} flush>
            <AttentionList rows={stuck} />
          </SectionCard>
        </Col>
      </Cols>
    </div>
  );
}
