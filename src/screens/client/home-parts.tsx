"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight, Download, ExternalLink, Eye, EyeOff, Paperclip } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { STEPS, PHASES, stepsOf, doneCount, stepTone, stepHref, phaseHref, type Step } from "@/data/incorporation";
import {
  AFTER_TODAY,
  AREA_ROWS,
  COMP_DRILL,
  COMP_SPLIT,
  COMPANY_IDS,
  DINS,
  HOLDS,
  HOME_REGS,
  NEED_ACTION,
  NEED_TABS,
  POST_DONE,
  POST_DRILL,
  POST_OPEN,
  WHAT_NEXT,
  type HomeReg,
  type Need,
  type NeedKind,
  type RegCat,
} from "@/data/client-home-extra";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, type ChipTone } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Bar } from "@/components/ui/Bar";
import { CopyButton } from "@/components/ui/CopyButton";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { DateTile } from "@/components/cards/AttentionList";
import { DataGrid } from "@/components/cards/DataGrid";
import { StackedBar } from "@/components/cards/StackedBar";
import { PhaseRows, type Phase } from "@/components/cards/PhaseRows";
import { UploadDialog } from "@/components/cards/UploadDialog";
import { RevealGate, useCountdown, mmss } from "@/components/cards/RevealGate";
import type { DrillSpec } from "@/components/cards/DrillDialog";

type OpenDrill = (spec: DrillSpec, tab?: number) => void;

/* ---------- Drill specs built from the step data ---------- */

const ownerName = (s: Step) => (s.owner === "client" ? "Northwind" : s.owner === "sbc" ? "SBC" : "MCA");

/** v7c_greet_b / mobile.html stepsDrill: SPICe+ steps 1 to 14 by state. Tabs: All, Completed, Northwind, SBC, Upcoming. */
export function stepsDrill(): DrillSpec {
  const spice = STEPS.filter((s) => s.n <= 14);
  const tabOf = (s: Step) => (s.status === "Completed" ? 1 : s.status === "Upcoming" ? 4 : s.owner === "client" ? 2 : 3);
  return {
    title: "Incorporation steps",
    tabs: [
      { label: "All", count: spice.length },
      { label: "Completed", count: spice.filter((s) => tabOf(s) === 1).length },
      { label: "With Northwind", count: spice.filter((s) => tabOf(s) === 2).length },
      { label: "With SBC", count: spice.filter((s) => tabOf(s) === 3).length },
      { label: "Upcoming", count: spice.filter((s) => tabOf(s) === 4).length },
    ],
    rows: spice.map((s) => ({ name: `${s.n} · ${s.title}`, meta: s.done ? fmt(s.done) : s.due ? `${fmt(s.due)} · ${ownerName(s)}` : ownerName(s), status: s.status, tone: stepTone[s.status], tab: tabOf(s), href: stepHref("client", s.n) })),
    link: { name: "Incorporation", href: "/client/incorporation" },
  };
}

/** v7c_next drill. */
export function nextDrill(): DrillSpec {
  const tabOf = (n: (typeof WHAT_NEXT)[number]) => (n.days < 0 ? 1 : n.days <= 15 ? 2 : 3);
  return {
    title: "What is next",
    tabs: [
      { label: "All", count: WHAT_NEXT.length },
      { label: "Overdue", count: WHAT_NEXT.filter((n) => tabOf(n) === 1).length },
      { label: "Next 15 days", count: WHAT_NEXT.filter((n) => tabOf(n) === 2).length },
      { label: "16–30 days", count: WHAT_NEXT.filter((n) => tabOf(n) === 3).length },
    ],
    rows: WHAT_NEXT.map((n) => ({ name: `${n.title} · ${n.period}`, meta: fmt(n.date), status: n.when, tone: n.tint === "bad" ? "bad" : n.tint === "warn" ? "warn" : "prog", tab: tabOf(n), href: "/client/obligations" })),
    link: { name: "Obligations", href: "/client/obligations" },
  };
}

/* ---------- Who holds it now (v7c_current) ---------- */

export function HoldsCard({ onDrill, className }: { onDrill: OpenDrill; className?: string }) {
  const [tab, setTab] = React.useState<string>("client");
  const cur = HOLDS.find((h) => h.key === tab) ?? HOLDS[0];
  const around = STEPS.filter((s) => s.n >= 6 && s.n <= 11);
  const drillTab = (status: string, owner: string) => (status === "Completed" ? 1 : status === "Upcoming" ? 4 : owner === "client" ? 2 : 3);
  return (
    <SectionCard title="Who holds it now" flush className={className} right={<Tabs items={HOLDS.map((h) => ({ key: h.key, label: h.label, count: h.rows.length }))} value={tab} onChange={setTab} />}>
      {cur.rows.length === 0 ? (
        <Empty />
      ) : (
        cur.rows.map((h) => (
          <ListRow key={h.step} className="flex-wrap sm:flex-nowrap">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{h.title}</span>
              <span className="block truncate text-12.5 text-muted">{h.meta}</span>
            </span>
            <button type="button" onClick={() => onDrill(stepsDrill(), drillTab(h.status, cur.key))} aria-label={`${h.status} · open the step list`}>
              <Chip tone={h.tone}>{h.status}</Chip>
            </button>
            <Button asChild size="sm" variant={h.main ? "primary" : "outline"}>
              <Link href={stepHref("client", h.step)}>{h.action}</Link>
            </Button>
          </ListRow>
        ))
      )}
      <h3 className="border-t border-line-soft px-4 pb-1 pt-3 text-12 font-semibold text-muted md:px-5">Steps around Northwind</h3>
      <ul>
        {around.map((s) => (
          <li key={s.n} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13 first:border-t-0 md:px-5">
            <span className="w-14 flex-none font-mono text-12 text-muted">Step {s.n}</span>
            <Link href={stepHref("client", s.n)} className="min-w-0 flex-1 truncate font-semibold hover:underline">
              {s.title}
            </Link>
            <OwnerChip owner={s.owner} label={s.owner === "client" ? "Northwind" : undefined} className="hidden sm:inline-flex" />
            <button type="button" onClick={() => onDrill(stepsDrill(), drillTab(s.status, s.owner))} aria-label={`${s.status} · open the step list`}>
              <Chip tone={stepTone[s.status]}>{s.status === "Upcoming" ? "Not started" : s.status}</Chip>
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* ---------- Needs from Northwind: Upload, Fill, Correct, Sign ---------- */

export function NeedsCard({ rows, className }: { rows: Need[]; className?: string }) {
  const first = NEED_TABS.find((t) => rows.some((r) => r.kind === t.key))?.key ?? "upload";
  const [tab, setTab] = React.useState<NeedKind>(first);
  const [done, setDone] = React.useState<string[]>([]);
  const [up, setUp] = React.useState<Need | null>(null);
  const toast = useUndoToast();
  const open = rows.filter((r) => !done.includes(r.id));
  const shown = open.filter((r) => r.kind === tab);
  const uploads = open.filter((r) => r.kind === "upload" || r.kind === "correct");
  return (
    <SectionCard
      id="needs"
      title="Needs from Northwind"
      flush
      className={className}
      right={<Tabs items={NEED_TABS.map((t) => ({ key: t.key, label: t.label, count: open.filter((r) => r.kind === t.key).length }))} value={tab} onChange={(k) => setTab(k as NeedKind)} />}
    >
      {shown.length === 0 ? (
        <Empty />
      ) : (
        shown.map((r) => {
          const late = r.tint === "bad";
          const action = NEED_ACTION[r.kind];
          return (
            <ListRow key={r.id} className={cn(late && "bg-bad-soft")}>
              <DateTile date={r.due} tint={r.tint} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.title}</span>
                <span className="block truncate text-12.5 text-muted">{r.sub}</span>
              </span>
              <Chip tone={late ? "bad" : r.tint === "warn" ? "warn" : "prog"} className="hidden sm:inline-flex">
                {r.when}
              </Chip>
              {r.kind === "upload" || r.kind === "correct" ? (
                <Button size="sm" variant={late ? "primary" : "outline"} onClick={() => setUp(r)}>
                  {action}
                </Button>
              ) : (
                <Button asChild size="sm" variant={late ? "primary" : "outline"}>
                  <Link href={r.href}>{action}</Link>
                </Button>
              )}
            </ListRow>
          );
        })
      )}
      <UploadDialog
        key={up?.id ?? "none"}
        open={!!up}
        onOpenChange={(v) => !v && setUp(null)}
        requests={uploads.map((r) => ({ id: r.id, name: r.title, due: r.due, sentBack: r.kind === "correct", note: r.kind === "correct" ? "Blurred scan. Upload a clear copy of page 2." : undefined, noteBy: r.kind === "correct" ? "BH" : undefined }))}
        initialId={up?.id}
        onUpload={(id) => {
          const r = rows.find((x) => x.id === id);
          setUp(null);
          if (!r) return;
          setDone((d) => [...d, r.id]);
          toast.show(`Uploaded · ${r.title}`, () => setDone((d) => d.filter((x) => x !== r.id)));
        }}
      />
      {toast.node}
    </SectionCard>
  );
}

/* ---------- What is next (v7c_next) ---------- */

export function WhatNextCard({ onDrill, className }: { onDrill: OpenDrill; className?: string }) {
  const [tab, setTab] = React.useState("15");
  const win = tab === "15" ? 15 : 30;
  const lead = WHAT_NEXT.find((n) => n.overdue);
  const rows = WHAT_NEXT.filter((n) => !n.overdue && n.days <= win);
  return (
    <SectionCard
      title="What is next"
      flush
      className={className}
      right={
        <Tabs
          items={[
            { key: "15", label: "15 days", count: WHAT_NEXT.filter((n) => n.days <= 15).length },
            { key: "30", label: "30 days", count: WHAT_NEXT.length },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      {lead && (
        <ListRow className="bg-bad-soft">
          <DateTile date={lead.date} tint="bad" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">
              {lead.title} · {lead.period}
            </span>
            <span className="block truncate text-12.5 text-muted">Waiting on Northwind · TDS challan details · asked by Pranay</span>
          </span>
          <Chip tone="bad" className="hidden sm:inline-flex">
            {lead.when}
          </Chip>
          <Button asChild size="sm" variant="primary">
            <Link href="/client/obligations">Fill details</Link>
          </Button>
        </ListRow>
      )}
      {rows.map((n) => (
        <ListRow key={n.id}>
          <button type="button" onClick={() => onDrill(nextDrill(), n.days <= 15 ? 2 : 3)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`${n.title} · open the list`}>
            <DateTile date={n.date} tint={n.tint} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">
                {n.title} · {n.period}
              </span>
              <span className="block truncate text-12.5 text-muted">
                {n.area} · SBC prepares by {n.sbcBy}
              </span>
            </span>
          </button>
          <OwnerChip owner={n.owner} label={n.owner === "client" ? "Northwind" : undefined} className="hidden md:inline-flex" />
          <Chip tone={n.tint === "warn" ? "warn" : "prog"} className="hidden sm:inline-flex">
            {n.when}
          </Chip>
          <a href={n.portal} target="_blank" rel="noreferrer" className="grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-muted hover:bg-raised hover:text-ink" aria-label={`Open the ${n.area} portal`}>
            <ExternalLink size={15} strokeWidth={1.5} />
          </a>
        </ListRow>
      ))}
    </SectionCard>
  );
}

/* ---------- Compliance by area (v7c_area) ---------- */

export function AreaCard({ onDrill, className }: { onDrill: OpenDrill; className?: string }) {
  const total = AREA_ROWS.reduce((a, r) => ({ t: a.t + r.total, f: a.f + r.filed, d: a.d + r.due, o: a.o + r.overdue }), { t: 0, f: 0, d: 0, o: 0 });
  const status = (r: (typeof AREA_ROWS)[number]) => (r.overdue ? "Overdue" : r.due ? "Due soon" : r.filed ? "On track" : "Upcoming");
  const drill = (r: (typeof AREA_ROWS)[number], tab = 0): void => {
    const tabOf = (s: string) => (s === "Filed" ? 1 : s === "Due soon" ? 2 : s === "Overdue" ? 3 : 4);
    onDrill(
      {
        title: `${r.name} · filings`,
        tabs: [
          { label: "All", count: r.total },
          { label: "Filed", count: r.filed },
          { label: "Due soon", count: r.due },
          { label: "Overdue", count: r.overdue },
          { label: "Upcoming", count: r.total - r.filed - r.due - r.overdue },
        ],
        rows: r.rows.map((x) => ({ ...x, tab: tabOf(x.status), href: "/client/filings" })),
        link: { name: "Filings", href: "/client/filings" },
      },
      tab,
    );
  };
  return (
    <div className={className}>
      <DataGrid
        title="Compliance by area"
        meta={`FY 2026-27 · as of ${fmt(AFTER_TODAY)}`}
        rows={AREA_ROWS}
        rowKey={(r) => r.id}
        onRowClick={(r) => drill(r)}
        columns={[
          { key: "name", label: "Area", render: (r) => <span className="font-semibold">{r.name}</span> },
          { key: "total", label: "Total", align: "right", width: 64, mono: true },
          { key: "filed", label: "Filed", align: "right", width: 64, mono: true },
          { key: "due", label: "Due soon", align: "right", width: 84, mono: true },
          { key: "overdue", label: "Overdue", align: "right", width: 78, mono: true, render: (r) => <span className={cn(r.overdue > 0 && "font-semibold text-bad")}>{r.overdue}</span> },
          { key: "mix", label: "Mix", width: 120, render: (r) => <Bar pct={r.total ? Math.round(((r.filed + r.due) / r.total) * 100) : 0} tone={r.overdue ? "bad" : r.due ? "warn" : "ok"} /> },
          { key: "status", label: "Status", width: 124, render: (r) => <Chip fixed>{status(r)}</Chip> },
        ]}
        footer={
          <span className="font-mono">
            Total {total.t} · filed {total.f} · due soon {total.d} · overdue {total.o}
          </span>
        }
      />
    </div>
  );
}

/* ---------- Post-incorporation setup (v7c_postinc) ---------- */

export function PostIncCard({ onDrill, className }: { onDrill: OpenDrill; className?: string }) {
  return (
    <SectionCard title="Post-incorporation setup" meta={`Day 11 since COI · ${POST_OPEN.length} open`} flush className={className}>
      {POST_OPEN.map((p) => (
        <ListRow key={p.id} onClick={() => onDrill(POST_DRILL, 1)} className="items-start">
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-semibold">{p.title}</span>
              <span className="hidden font-mono text-12 text-muted sm:inline">{p.due}</span>
            </span>
            <span className="block truncate text-12.5 text-muted">{p.rule}</span>
            <span className="mt-2 flex items-center gap-3">
              <Bar pct={(p.day / p.of) * 100} tone={p.owner === "client" ? "warn" : "accent"} className="flex-1" />
              <span className="w-24 flex-none text-right font-mono text-12 text-muted">
                day {p.day} of {p.of}
              </span>
            </span>
          </span>
          <OwnerChip owner={p.owner} label={p.owner === "client" ? "Northwind" : undefined} className="mt-0.5 hidden sm:inline-flex" />
        </ListRow>
      ))}
      <ListRow onClick={() => onDrill(POST_DRILL, 2)}>
        <Chip tone="ok">{POST_DONE.length} completed</Chip>
        <span className="min-w-0 flex-1 truncate text-12.5 text-muted">{POST_DONE.map((p) => p.title).join(" · ")}</span>
        <ChevronRight size={16} strokeWidth={1.5} className="flex-none text-faint" />
      </ListRow>
    </SectionCard>
  );
}

/* ---------- Registrations (v7c_reg, mobile.html regs) ---------- */

const CATS: Array<"All" | RegCat> = ["All", "Tax", "Labour", "Business", "IP", "FEMA"];
const regTone = (s: HomeReg["status"]): ChipTone => (s === "Registered" ? "ok" : s === "In progress" ? "prog" : "idle");

export function HomeRegsCard({ className }: { className?: string }) {
  const [cat, setCat] = React.useState<string>("All");
  const rows = HOME_REGS.filter((r) => cat === "All" || r.cat === cat);
  return (
    <div className={className}>
      <DataGrid
        title="Registrations"
        meta={`${HOME_REGS.filter((r) => r.status === "Registered").length} of ${HOME_REGS.length} registered`}
        filters={<Tabs items={CATS.map((c) => ({ key: c, label: c, count: c === "All" ? HOME_REGS.length : HOME_REGS.filter((r) => r.cat === c).length }))} value={cat} onChange={setCat} />}
        rows={rows}
        rowKey={(r) => r.id}
        pageSize={8}
        columns={[
          { key: "name", label: "Registration", render: (r) => <span className="font-semibold">{r.name}</span> },
          { key: "cat", label: "Category", width: 92 },
          { key: "authority", label: "Authority", width: 150, render: (r) => <span className="text-muted">{r.authority}</span> },
          { key: "number", label: "Number", mono: true, render: (r) => r.number ?? <span className="text-faint">-</span> },
          { key: "date", label: "Date", width: 130, render: (r) => <span className="whitespace-nowrap font-mono text-12.5">{r.date}</span> },
          { key: "status", label: "Status", width: 124, render: (r) => <Chip tone={regTone(r.status)} fixed>{r.status}</Chip> },
          {
            key: "act",
            label: "",
            width: 120,
            render: (r) => (
              <span className="flex items-center justify-end gap-1">
                {r.proof === true && (
                  <Link href="/client/documents/view/d2" className="inline-flex h-[26px] items-center gap-1 rounded-sm px-1.5 text-12 font-semibold text-accent hover:bg-raised" aria-label={`Open proof for ${r.name}`}>
                    <Paperclip size={13} strokeWidth={1.5} /> Proof
                  </Link>
                )}
                {r.proof === false && <Chip tone="warn">Proof pending</Chip>}
                <a href={r.portal} target="_blank" rel="noreferrer" className="grid h-[26px] w-[26px] place-items-center rounded-sm text-muted hover:bg-raised hover:text-ink" aria-label={`Open the ${r.authority} portal`}>
                  <ExternalLink size={14} strokeWidth={1.5} />
                </a>
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}

/* ---------- Compliance status (v7c_comp) ---------- */

export function CompStatusCard({ onDrill, className }: { onDrill: OpenDrill; className?: string }) {
  const total = COMP_SPLIT.filed + COMP_SPLIT.due + COMP_SPLIT.overdue + COMP_SPLIT.upcoming;
  const pct = (n: number) => `${n} (${Math.round((n / total) * 100)}%)`;
  const segs = [
    { label: "Filed", value: COMP_SPLIT.filed, tone: "ok" as const },
    { label: "Due soon", value: COMP_SPLIT.due, tone: "warn" as const },
    { label: "Overdue", value: COMP_SPLIT.overdue, tone: "bad" as const },
    { label: "Upcoming", value: COMP_SPLIT.upcoming, tone: "idle" as const },
  ];
  return (
    <SectionCard
      title="Compliance status"
      meta="FY 2026-27"
      className={className}
      right={
        <Button size="sm" variant="ghost" onClick={() => onDrill(COMP_DRILL, 0)}>
          List
        </Button>
      }
    >
      <StackedBar title="This FY" total={total} segments={segs} format={pct} />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {segs.map((s, i) => (
          <button key={s.label} type="button" onClick={() => onDrill(COMP_DRILL, i)} className="rounded-sm border border-line px-2 py-0.5 text-12 font-semibold text-ink-2 hover:bg-raised">
            {s.label}
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

/* ---------- Company IDs (v7c_ids, v7p_ids_password) ---------- */

function IdRow({ id, onReveal, until, onHide }: { id: (typeof COMPANY_IDS)[number]; onReveal: () => void; until: number | null; onHide: () => void }) {
  const left = useCountdown(until);
  const open = !id.masked || left > 0;
  React.useEffect(() => {
    if (until && left === 0) onHide();
  }, [until, left, onHide]);
  return (
    <ListRow>
      <span className="w-14 flex-none text-12.5 font-semibold text-muted">{id.label}</span>
      <span className={cn("min-w-0 flex-1 truncate font-mono text-13", id.masked && open && "text-ok")}>{open ? id.value : id.masked}</span>
      {id.masked && !open && <Chip tone="idle" dot={false}>Private</Chip>}
      {id.masked && open && <Chip tone="ok">{mmss(left)}</Chip>}
      {id.masked && !open ? (
        <button type="button" onClick={onReveal} className="grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-muted hover:bg-raised hover:text-ink" aria-label={`Show ${id.label}`}>
          <Eye size={15} strokeWidth={1.5} />
        </button>
      ) : (
        <CopyButton value={id.value} label={id.label} />
      )}
      {id.masked && open && (
        <button type="button" onClick={onHide} className="grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-muted hover:bg-raised hover:text-ink" aria-label={`Hide ${id.label}`}>
          <EyeOff size={15} strokeWidth={1.5} />
        </button>
      )}
      <a href={id.portal} target="_blank" rel="noreferrer" className="hidden h-[30px] w-[30px] flex-none place-items-center rounded-md text-muted hover:bg-raised hover:text-ink sm:grid" aria-label={`Open the ${id.label} portal`}>
        <ExternalLink size={15} strokeWidth={1.5} />
      </a>
    </ListRow>
  );
}

export function IdsCard({ className }: { className?: string }) {
  const [ask, setAsk] = React.useState<string | null>(null);
  const [shown, setShown] = React.useState<Record<string, number>>({});
  const toast = useUndoToast();
  const askFor = COMPANY_IDS.find((x) => x.key === ask);
  return (
    <SectionCard
      title="Company IDs"
      flush
      className={className}
      right={
        <Link href="/client/documents/view/d2" className="inline-flex items-center gap-1 text-13 font-semibold text-accent hover:underline">
          <Download size={14} strokeWidth={1.5} /> COI
        </Link>
      }
    >
      {COMPANY_IDS.map((id) => (
        <IdRow
          key={id.key}
          id={id}
          until={shown[id.key] ?? null}
          onReveal={() => setAsk(id.key)}
          onHide={() =>
            setShown((s) => {
              if (!(id.key in s)) return s;
              const n = { ...s };
              delete n[id.key];
              return n;
            })
          }
        />
      ))}
      {DINS.map((x) => (
        <ListRow key={x.din}>
          <span className="w-14 flex-none text-12.5 font-semibold text-muted">DIN</span>
          <span className="min-w-0 flex-1 truncate">
            <span className="font-mono text-13">{x.din}</span>
            <span className="ml-2 text-12.5 text-muted">{x.name}</span>
          </span>
          <CopyButton value={x.din} label={`DIN of ${x.name}`} />
          <span className="hidden w-[30px] sm:block" />
        </ListRow>
      ))}
      <RevealGate
        open={!!ask}
        onOpenChange={(v) => !v && setAsk(null)}
        mode="password"
        title={`Show ${askFor?.label ?? ""}`}
        onPass={() => {
          if (!askFor) return;
          setShown((s) => ({ ...s, [askFor.key]: Date.now() + 60000 }));
          toast.show(`${askFor.label} shown for 60 s · logged in Audit`);
        }}
      />
      {toast.node}
    </SectionCard>
  );
}

/* ---------- Steps card in both states ---------- */

const POST_DONE_STEPS = [15, 16, 17, 18, 21, 24, 25];

export function HomeStepsCard({ after, className }: { after: boolean; className?: string }) {
  const phases: Phase[] = PHASES.map((p) => {
    const steps = stepsOf(p.n).map((s) => {
      const status = !after ? s.status : p.n < 3 || POST_DONE_STEPS.includes(s.n) ? "Completed" : "In progress";
      return { n: s.n, title: s.title, owner: s.owner, ownerLabel: s.owner === "client" ? "Northwind" : undefined, status, tone: stepTone[status], time: s.time, href: stepHref("client", s.n) };
    });
    const done = after ? steps.filter((s) => s.status === "Completed").length : doneCount(p.n);
    const status = after ? (p.n < 3 ? "Done" : "In progress") : p.status;
    return { id: p.id, name: p.name, done, total: steps.length, status, tone: status === "Done" ? "ok" : status === "In progress" ? "prog" : "idle", href: phaseHref("client", p.n), steps };
  });
  return (
    <SectionCard title="Steps" flush className={className} right={<Link href="/client/incorporation" className="whitespace-nowrap text-13 font-semibold text-accent hover:underline">Open incorporation ›</Link>}>
      <PhaseRows phases={phases} openId={after ? "phase-3" : "phase-2"} />
    </SectionCard>
  );
}

