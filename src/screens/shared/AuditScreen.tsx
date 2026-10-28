"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Download, Search } from "lucide-react";
import { TODAY, fmt, fmtLong, daysFrom } from "@/lib/dates";
import { AUDIT_LOG, AUDIT_TYPE, portalHref, type AuditCat, type AuditRow } from "@/data/updates-team";
import { Button } from "@/components/ui/Button";
import { Chip, Tag, type ChipTone } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { SidePanel, PanelSection } from "@/components/ui/SidePanel";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import type { Portal } from "@/data/nav";

const resultTone: Record<AuditRow["result"], ChipTone> = { Done: "ok", "Sent back": "warn", Failed: "bad" };
const CATS: AuditCat[] = ["Documents", "Milestones", "Team", "Email", "Credentials", "Sign-in"];
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Export: the rows in view as a CSV file, as the staff Filings export does. */
function exportCsv(rows: AuditRow[]) {
  const head = ["Date", "Time", "Event", "Target", "Area", "Who", "Role", "Result"];
  const lines = rows.map((e) => [fmt(e.date), e.time, e.action, e.target, e.cat, e.who, e.role, e.result].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","));
  const url = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "audit-log.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Facts with a Before and After pair show the change as one row. */
function Facts({ e }: { e: AuditRow }) {
  const before = e.facts.find((f) => f.k === "Before");
  const after = e.facts.find((f) => f.k === "After");
  const rest = e.facts.filter((f) => f !== before && f !== after);
  return (
    <>
      {before && after && (
        <PanelSection title="Change">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0 rounded-md border border-line bg-raised px-3 py-2">
              <div className="text-12 text-muted">Before</div>
              <div className="truncate text-13.5 font-medium text-ink-2 line-through decoration-faint">{before.v}</div>
            </div>
            <ArrowRight size={16} strokeWidth={1.6} className="text-faint" aria-hidden />
            <div className="min-w-0 rounded-md border border-accent-line bg-accent-soft px-3 py-2">
              <div className="text-12 text-muted">After</div>
              <div className="truncate text-13.5 font-semibold">{after.v}</div>
            </div>
          </div>
        </PanelSection>
      )}
      {rest.length > 0 && (
        <PanelSection title="Details">
          <KeyValue rows={rest.map((f) => ({ k: f.k, v: f.v, mono: /File|SRN|To/.test(f.k) }))} />
        </PanelSection>
      )}
    </>
  );
}

/** C-0029: no bar chart. Events in an e-Filing grid with filters in the head bar. A row opens its details; a date opens that day. */
export function AuditScreen({ portal }: { portal: Portal }) {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const [who, setWho] = React.useState("all");
  const [older, setOlder] = React.useState(false);
  const [pick, setPick] = React.useState<AuditRow | null>(null);
  const [day, setDay] = React.useState<string | null>(null);
  const client = portal === "client";

  const inRange = AUDIT_LOG.filter((e) => older || daysFrom(e.date, TODAY) >= -30);
  const olderN = AUDIT_LOG.length - AUDIT_LOG.filter((e) => daysFrom(e.date, TODAY) >= -30).length;
  const needle = q.trim().toLowerCase();
  const rows = inRange
    .filter((e) => (cat === "all" || e.cat === cat) && (who === "all" || e.side === who))
    .filter((e) => !needle || `${e.action} ${e.target} ${e.who}`.toLowerCase().includes(needle))
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.time.localeCompare(a.time));
  const filtered = cat !== "all" || who !== "all" || !!needle;
  const clear = () => {
    setCat("all");
    setWho("all");
    setQ("");
  };

  const days = Array.from(new Map(rows.map((e) => [dayKey(e.date), e.date])).entries());
  const dayRows = day ? rows.filter((e) => dayKey(e.date) === day) : [];
  const dayDate = days.find(([k]) => k === day)?.[1];

  const columns: Column<AuditRow>[] = [
    {
      key: "when",
      label: "When",
      width: 120,
      render: (e) => (
        <button
          type="button"
          className="font-mono text-12.5 text-accent hover:underline"
          onClick={(ev) => {
            ev.stopPropagation();
            setDay(dayKey(e.date));
          }}
          aria-label={`Show all events on ${fmt(e.date)}`}
        >
          {fmt(e.date)} {e.time}
        </button>
      ),
    },
    {
      key: "action",
      label: "Event",
      render: (e) => (
        <span className="block min-w-[180px]">
          <span className="block font-semibold">{e.action}</span>
          <span className="block truncate text-12.5 text-muted">{e.target}</span>
        </span>
      ),
    },
    { key: "cat", label: "Area", width: 120, render: (e) => <Tag tone={AUDIT_TYPE[e.type].tone}>{e.cat}</Tag> },
    {
      key: "who",
      label: "Who",
      width: 150,
      render: (e) => (
        <span>
          <span className="font-semibold">{e.who}</span>
          <span className="block text-12 text-muted">{e.role}</span>
        </span>
      ),
    },
    { key: "result", label: "Result", width: 132, render: (e) => <Chip tone={resultTone[e.result]} fixed>{e.result}</Chip> },
  ];

  return (
    <>
      <DataGrid
        title={client ? "Audit" : "Audit log"}
        meta={`${rows.length} events`}
        columns={columns}
        rows={rows}
        rowKey={(e) => e.id}
        pageSize={10}
        onRowClick={setPick}
        selectedKey={pick?.id}
        empty={filtered ? "No events match these filters" : "No events"}
        filters={
          <>
            <label className="relative inline-flex">
              <Search size={14} strokeWidth={1.6} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                aria-label="Search the audit log"
                className="h-[30px] w-[150px] rounded-md border border-line bg-surface pl-8 pr-2.5 text-12.5 text-ink outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent-line"
              />
            </label>
            <Select aria-label="Area" value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: "all", label: "All areas" }, ...CATS.map((c) => ({ value: c, label: `${c} · ${inRange.filter((e) => e.cat === c).length}` }))]} />
            <Select
              aria-label="Who"
              value={who}
              onChange={(e) => setWho(e.target.value)}
              options={[
                { value: "all", label: "Everyone" },
                { value: "sbc", label: "SBC" },
                { value: "client", label: "Northwind" },
              ]}
            />
            <Button size="sm" onClick={() => exportCsv(rows)}>
              <Download size={15} strokeWidth={1.6} /> Export
            </Button>
          </>
        }
        footer={
          <span className="flex items-center gap-2">
            {filtered && (
              <Button size="sm" variant="ghost" onClick={clear}>
                Clear filters
              </Button>
            )}
            {!older && olderN > 0 && (
              <Button size="sm" onClick={() => setOlder(true)}>
                Load older
              </Button>
            )}
          </span>
        }
      />

      <SidePanel
        open={pick !== null}
        onOpenChange={(v) => !v && setPick(null)}
        title={pick?.action ?? ""}
        eyebrow={pick && <span className="font-mono">{fmtLong(pick.date)} · {pick.time}</span>}
        sub={
          pick && (
            <>
              <Tag tone={AUDIT_TYPE[pick.type].tone}>{pick.cat}</Tag>
              <Chip tone={resultTone[pick.result]}>{pick.result}</Chip>
            </>
          )
        }
        footer={
          pick?.cta && (
            <Button asChild variant="primary">
              <Link href={portalHref(portal, pick.cta.href)!}>{pick.cta.label}</Link>
            </Button>
          )
        }
      >
        {pick && (
          <>
            <PanelSection>
              <KeyValue
                rows={[
                  { k: "Target", v: pick.target },
                  { k: "By", v: `${pick.who} · ${pick.role}` },
                ]}
                cols={1}
              />
            </PanelSection>
            <Facts e={pick} />
          </>
        )}
      </SidePanel>

      <Modal
        open={day !== null}
        onOpenChange={(v) => !v && setDay(null)}
        size="lg"
        flush
        title={dayDate ? fmtLong(dayDate) : ""}
        sub={<span>{dayRows.length} events</span>}
      >
        <div className="overflow-x-auto border-b border-line-soft px-4 py-2 md:px-5">
          <Tabs items={days.slice(0, 7).map(([k, dt]) => ({ key: k, label: fmt(dt), count: rows.filter((e) => dayKey(e.date) === k).length }))} value={day ?? ""} onChange={setDay} />
        </div>
        {dayRows.map((e) => (
          <ListRow
            key={e.id}
            onClick={() => {
              setDay(null);
              setPick(e);
            }}
          >
            <span className="w-12 flex-none font-mono text-12.5 text-muted">{e.time}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{e.action}</span>
              <span className="block truncate text-12.5 text-muted">
                {e.target} · {e.who}
              </span>
            </span>
            <Tag tone={AUDIT_TYPE[e.type].tone} className="hidden sm:inline-flex">
              {e.cat}
            </Tag>
          </ListRow>
        ))}
      </Modal>
    </>
  );
}
