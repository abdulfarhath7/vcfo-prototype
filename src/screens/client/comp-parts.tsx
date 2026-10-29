"use client";
import * as React from "react";
import Link from "next/link";
import { FilterChip as SharedFilterChip } from "@/components/ui/FilterChip";
import { CalendarPlus, Check, Download, ExternalLink, Eye, Search, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt, fmtYear, daysFrom } from "@/lib/dates";
import { FILINGS, FILING_STATUS_TONE, obligation, obHref, type Area, type Filing, type FilingStatus } from "@/data/compliance";
import { portalOf, type YearEvent } from "@/data/compliance-year";
import { ackRows, filingAssist, filingProofs, filingTrack, type TrackStep } from "@/data/compliance-detail";
import { SBC } from "@/data/people";
import { useClientState } from "@/components/shell/ClientState";
import { Button } from "@/components/ui/Button";
import { AreaPill, Chip } from "@/components/ui/Chip";
import { StepMark } from "@/components/ui/StepMark";
import { inputClass } from "@/components/ui/Input";
import { FileBadge } from "@/components/ui/FileBadge";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { SidePanel, PanelSection } from "@/components/ui/SidePanel";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { AssistSteps } from "@/components/cards/AssistSteps";
import type { Tile } from "@/components/cards/TileGrid";
import { Chevron } from "@/components/ui/Chevron";

/** Before incorporation the client has no registrations or filings yet (old Register.dc.html: "After the certificate"). */
export function useBeforeCoi() {
  return !useClientState().incorporated;
}

/** Old rule 15: a small link to the government portal next to each filing name. */
export function PortalLink({ area, name, className }: { area: Area; name: string; className?: string }) {
  const p = portalOf(area, name);
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={`Open ${p.label}`}
      aria-label={`Open ${p.label}`}
      className={cn("inline-grid h-6 w-6 flex-none place-items-center rounded-sm text-muted hover:bg-raised hover:text-accent", className)}
    >
      <ExternalLink size={13} strokeWidth={1.6} />
    </a>
  );
}

/* ---------- Filing record (shared by the calendar dialog and the filings side panel) ---------- */

const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

/** The filing behind a calendar entry. Entries without a FILINGS row get one built from the entry. */
export function eventFiling(e: YearEvent): Filing {
  const byId = e.id.startsWith("c-f") ? FILINGS.find((f) => `c-${f.id}` === e.id) : undefined;
  if (byId) return byId;
  const filed = e.status === "Filed" ? e.filed ?? addDays(e.date, -2) : undefined;
  return { id: e.id, form: e.name, period: e.period, due: e.date, filed, status: e.status, docs: 0, area: e.kind, frequency: e.frequency, fy: "2026-27", obligationId: e.obligationId };
}

/** Horizontal step track with ST5 marks (R-22): done green tick, the live step a ring, upcoming a dashed square. */
export function FilingTrack({ steps }: { steps: TrackStep[] }) {
  return (
    <ol className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
      {steps.map((s, i) => (
        <li key={i} className="grid min-w-0 grid-cols-[20px_minmax(0,1fr)] gap-x-2">
          <StepMark state={s.state === "done" ? "done" : s.state === "current" ? "now" : "next"} size={20} label={s.state === "done" ? "Done" : s.state === "current" ? "Now" : "Upcoming"} />
          <span className="min-w-0">
            <span className={cn("block truncate text-13 font-medium", s.state === "upcoming" && "text-muted")}>{s.label}</span>
            <span className="block truncate text-12 text-muted">
              {s.state !== "upcoming" && s.date ? fmt(s.date) : s.owner ? <span className={s.owner === "client" ? "text-warn" : "text-info"}>{s.owner === "client" ? "With Northwind" : "With SBC"}</span> : null}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function FilingFacts({ f }: { f: Filing }) {
  const o = f.obligationId ? obligation(f.obligationId) : undefined;
  const person = SBC.find((p) => p.name === (o?.by ?? "Bharath"));
  const late = f.filed ? daysFrom(f.filed, f.due) : 0;
  return (
    <KeyValue
      cols={2}
      rows={[
        { k: "Authority", v: o?.law ?? f.area },
        { k: "Frequency", v: f.frequency },
        { k: "Period", v: f.period },
        { k: "Due", v: <span className={cn(f.status === "Overdue" && "font-semibold text-bad")}>{fmtYear(f.due)}</span> },
        { k: "Filed on", v: f.filed ? <span className={cn(late > 0 && "text-bad")}>{fmtYear(f.filed)}</span> : "-" },
        { k: "Reference", v: f.arn ?? "-", mono: true },
        { k: "Filed by", v: f.filed ? `${person?.name ?? "Bharath"} · SBC` : "-" },
        { k: "Penalty if late", v: o?.penalty ?? "-" },
      ]}
    />
  );
}

/** Proof files with Preview and Download. A filed row without files shows "Proof pending". */
export function ProofList({ f, onPreview, onDownload }: { f: Filing; onPreview: () => void; onDownload?: (name: string) => void }) {
  const files = filingProofs(f);
  if (f.status !== "Filed") return <p className="px-5 py-3 text-13 text-faint">None</p>;
  if (files.length === 0)
    return (
      <div className="px-5 py-3">
        <Chip tone="warn">Proof pending</Chip>
      </div>
    );
  return (
    <ul>
      {files.map((x, i) => (
        <li key={x.id} className={cn("flex items-center gap-3 border-t border-line-soft px-5 py-2.5 first:border-t-0", i === 0 && "bg-hover")}>
          <FileBadge type="PDF" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-13 font-medium">{x.name}</span>
            <span className="block text-12 text-muted">
              {x.size} · {fmt(x.date)}
            </span>
          </span>
          <Button size="iconSm" variant="ghost" aria-label={`Preview ${x.name}`} onClick={onPreview}>
            <Eye size={16} strokeWidth={1.6} />
          </Button>
          <Button size="iconSm" variant="ghost" aria-label={`Download ${x.name}`} onClick={() => onDownload?.(x.name)}>
            <Download size={16} strokeWidth={1.6} />
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** VCFO Assist state for a filing: SBC's filing assistant on the portal, one screenshot per page. */
export function AssistBlock({ f }: { f: Filing }) {
  const a = filingAssist(f);
  return (
    <div>
      <div className="flex items-center gap-2 px-5 pt-4">
        <h3 className="text-12.5 font-medium text-muted">VCFO Assist</h3>
        <Chip tone={a.tone}>{a.label}</Chip>
        {f.status === "Filed" && (
          <Link href="/client/audit" className="ml-auto text-12.5 font-medium text-accent hover:underline">
            View replay
          </Link>
        )}
      </div>
      <AssistSteps steps={a.steps} className="mt-2" />
    </div>
  );
}

function FilingBody({ f, onPreview, onDownload }: { f: Filing; onPreview: () => void; onDownload: (name: string) => void }) {
  return (
    <>
      <PanelSection>
        <FilingTrack steps={filingTrack(f)} />
      </PanelSection>
      <PanelSection>
        <FilingFacts f={f} />
      </PanelSection>
      <div className="border-b border-line-soft">
        <AssistBlock f={f} />
      </div>
      <PanelSection title="Proof" flush>
        <ProofList f={f} onPreview={onPreview} onDownload={onDownload} />
      </PanelSection>
    </>
  );
}

function FilingChips({ f }: { f: Filing }) {
  const early = f.filed ? daysFrom(f.due, f.filed) : 0;
  return (
    <>
      <AreaPill area={f.area} />
      <Chip tone={FILING_STATUS_TONE[f.status]}>{f.status}</Chip>
      {f.filed && early > 0 && <Chip tone="ok">{early === 1 ? "1 day early" : `${early} days early`}</Chip>}
      {f.filed && early < 0 && <Chip tone="bad">{-early === 1 ? "1 day late" : `${-early} days late`}</Chip>}
      {!f.filed && <span className={cn("text-12.5", f.status === "Overdue" ? "font-medium text-bad" : "text-muted")}>Due {fmt(f.due)}</span>}
    </>
  );
}

function FilingTitle({ f }: { f: Filing }) {
  return (
    <span className="inline-flex items-center gap-1">
      {f.form} · {f.period}
      <PortalLink area={f.area} name={f.form} />
    </span>
  );
}

/** Filings: the record opens in a side panel so the grid stays visible (old owner decision, 9 Oct). */
export function FilingPanel({ filing, onClose, onNotify }: { filing: Filing | null; onClose: () => void; onNotify: (text: string) => void }) {
  const [preview, setPreview] = React.useState(false);
  const download = (name: string) => onNotify(`Downloaded ${name}`);
  const f = filing;
  return (
    <>
      <SidePanel
        open={!!f}
        onOpenChange={(v) => !v && onClose()}
        width={520}
        eyebrow={f ? `${f.area} · ${f.frequency}` : undefined}
        title={f ? <FilingTitle f={f} /> : ""}
        sub={f ? <FilingChips f={f} /> : undefined}
        footer={
          f?.obligationId ? (
            <Button asChild variant="primary">
              <Link href={obHref("client", f.obligationId)}>Open obligation</Link>
            </Button>
          ) : undefined
        }
      >
        {f && <FilingBody f={f} onPreview={() => setPreview(true)} onDownload={download} />}
      </SidePanel>
      {f && <AckPreview filing={f} open={preview} onOpenChange={setPreview} onDownload={download} />}
    </>
  );
}

/** Calendar: the record opens in a dialog (old owner decision, 9 Oct). */
export function EventDialog({ event, onClose, onRemind }: { event: YearEvent | null; onClose: () => void; onRemind: (text: string) => void }) {
  const [preview, setPreview] = React.useState(false);
  const f = event ? eventFiling(event) : null;
  const download = (name: string) => onRemind(`Downloaded ${name}`);
  return (
    <>
      <Modal
        open={!!f}
        onOpenChange={(v) => !v && onClose()}
        size="lg"
        flush
        eyebrow={f ? `${event?.authority} · ${f.frequency}` : undefined}
        title={f ? <FilingTitle f={f} /> : ""}
        sub={f ? <FilingChips f={f} /> : undefined}
        footer={
          f && (
            <>
              <Button onClick={() => onRemind(`${f.form} · ${f.period} added to your calendar`)}>
                <CalendarPlus size={16} strokeWidth={1.6} /> Add to my calendar
              </Button>
              <Button asChild variant="primary">
                <Link href={`/client/filings?f=${encodeURIComponent(f.id)}`}>Open in filings</Link>
              </Button>
            </>
          )
        }
      >
        {f && <FilingBody f={f} onPreview={() => setPreview(true)} onDownload={download} />}
      </Modal>
      {f && <AckPreview filing={f} open={preview} onOpenChange={setPreview} onDownload={download} />}
    </>
  );
}

/** The acknowledgement page, as the portal issues it (index.html docPreview). */
export function AckPreview({ filing: f, open, onOpenChange, onDownload }: { filing: Filing; open: boolean; onOpenChange: (v: boolean) => void; onDownload?: (name: string) => void }) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      eyebrow={`${f.form} · ${f.period}${f.filed ? ` · filed ${fmt(f.filed)}` : ""}`}
      title={`${f.form} acknowledgement.pdf`}
      footer={
        <Button variant="primary" onClick={() => onDownload?.(`${f.form} acknowledgement.pdf`)}>
          <Download size={16} strokeWidth={1.6} /> Download
        </Button>
      }
    >
      <article className="mx-auto max-w-[460px] rounded-md border-1.5 border-line bg-surface px-5 py-6 md:px-8">
        <header className="border-b-1.5 border-line pb-3 text-center">
          <div className="text-12 font-medium uppercase tracking-[.07em] text-muted">{f.area === "GST" ? "GOODS AND SERVICES TAX" : f.area === "MCA" ? "MINISTRY OF CORPORATE AFFAIRS" : f.area === "Income tax" ? "INCOME TAX DEPARTMENT" : f.area === "Payroll" ? "EMPLOYEES' PROVIDENT FUND ORGANISATION" : "RESERVE BANK OF INDIA"}</div>
          <div className="mt-1.5 text-16 font-medium">Acknowledgement</div>
          <div className="mt-0.5 text-12 text-muted">Form {f.form}</div>
        </header>
        <table className="grid-table mt-2 text-13">
          <tbody>
            {ackRows(f).map(([k, v]) => (
              <tr key={k}>
                <td className="w-[46%] pl-0 text-muted">{k}</td>
                <td className={cn("pr-0 font-medium text-ink", /Reference|GSTIN|TAN|CIN|PAN|ARN|SRN|code/.test(k) && "font-mono text-12.5")}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 flex justify-end">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-md border-1.5 border-ok-mid px-3 text-12 font-medium uppercase tracking-[.07em] text-ok">
            <Check size={14} strokeWidth={2} aria-hidden /> Filed
          </span>
        </div>
      </article>
    </Modal>
  );
}

/* ---------- Drill-down (old rule 14: click a number or a chart part to see its rows) ---------- */

export interface DrillRow {
  id: string;
  name: string;
  period: string;
  area: Area;
  due: Date;
  filed?: Date;
  status: FilingStatus;
}

const DRILL_TABS: Array<{ key: "all" | FilingStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "Filed", label: "Filed" },
  { key: "In progress", label: "In progress" },
  { key: "Due soon", label: "Due soon" },
  { key: "Overdue", label: "Overdue" },
  { key: "Upcoming", label: "Upcoming" },
];

const drillColumns: Column<DrillRow>[] = [
  {
    key: "name",
    label: "Filing",
    render: (r) => (
      <span className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-ink">
        {r.name}
        <PortalLink area={r.area} name={r.name} />
      </span>
    ),
  },
  { key: "period", label: "Period", width: 120 },
  { key: "area", label: "Area", width: 124, render: (r) => <AreaPill area={r.area} /> },
  { key: "due", label: "Due / filed", width: 110, render: (r) => <span className="whitespace-nowrap">{r.filed ? `Filed ${fmt(r.filed)}` : fmt(r.due)}</span> },
  { key: "status", label: "Status", width: 124, render: (r) => <Chip tone={FILING_STATUS_TONE[r.status]} fixed>{r.status}</Chip> },
];

/** Dialog with status tabs and an e-Filing grid of the rows behind a number or a chart. */
export function ComplianceDrill({ open, onOpenChange, title, rows, initial = "all", onPick, asOf = TODAY, statuses }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; rows: DrillRow[]; initial?: string; onPick?: (r: DrillRow) => void; asOf?: Date; statuses?: FilingStatus[] }) {
  const [tab, setTab] = React.useState(initial);
  React.useEffect(() => {
    if (open) setTab(initial);
  }, [open, initial]);
  const shown = rows.filter((r) => tab === "all" || r.status === tab).sort((a, b) => a.due.getTime() - b.due.getTime());
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      flush
      title={title}
      eyebrow={`As of ${fmt(asOf)}`}
      footer={
        <Button asChild variant="primary">
          <Link href="/client/filings">Open filings</Link>
        </Button>
      }
    >
      <div className="border-b border-line-soft px-4 py-3 md:px-5">
        <Tabs items={DRILL_TABS.filter((t) => t.key === "all" || !statuses || statuses.includes(t.key)).map((t) => ({ key: t.key, label: t.label, count: rows.filter((r) => t.key === "all" || r.status === t.key).length }))} value={tab} onChange={setTab} />
      </div>
      <DataGrid inset columns={drillColumns} rows={shown} rowKey={(r) => r.id} pageSize={7} empty="None" onRowClick={onPick} />
    </Modal>
  );
}

/* ---------- Upload (Item.dc.html: drop the file here or browse) ---------- */

export function UploadModal({ open, onOpenChange, requested, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; requested: string[]; onDone: (n: number) => void }) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [over, setOver] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (open) setFiles([]);
  }, [open]);
  const add = (list: FileList | null) => list && setFiles((f) => [...f, ...Array.from(list)]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Upload documents"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            disabled={files.length === 0}
            onClick={() => {
              onDone(files.length);
              onOpenChange(false);
            }}
          >
            <Upload size={16} strokeWidth={1.6} /> Upload{requested.length ? ` · ${requested.length} requested` : ""}
          </Button>
        </>
      }
    >
      {requested.length > 0 && (
        <ul className="mb-3 grid gap-1.5">
          {requested.map((r) => (
            <li key={r} className="flex items-center gap-2 text-13">
              <Chip tone="warn">Asked</Chip>
              <span className="min-w-0 truncate">{r}</span>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
        className={cn("grid w-full place-items-center gap-1 rounded-md border-1.5 border-dashed border-line-2 px-4 py-8 text-13 text-muted hover:bg-hover", over && "border-accent-line bg-accent-soft")}
      >
        <Upload size={20} strokeWidth={1.6} aria-hidden />
        <span>
          Drop the files here or <b className="font-medium text-accent">browse</b>
        </span>
      </button>
      <input ref={input} type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      {files.length > 0 && (
        <ul className="mt-3 rounded-md border-1.5 border-line">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 border-t border-line-soft px-3 py-2 text-13 first:border-t-0">
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="text-12 text-muted">{Math.max(1, Math.round(f.size / 1024))} KB</span>
              <button type="button" className="grid h-6 w-6 place-items-center rounded-sm text-muted hover:bg-raised" aria-label={`Remove ${f.name}`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}>
                <X size={14} strokeWidth={1.6} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/**
 * ItemDocsCard (parts.tsx) has Upload buttons without a handler. This wrapper catches their clicks and opens the upload dialog.
 * Gap: ItemDocsCard needs an `onUpload` prop; then this wrapper can go.
 */
export function UploadCatcher({ requested, onDone, children }: { requested: string[]; onDone: (n: number) => void; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      onClickCapture={(e) => {
        const b = (e.target as HTMLElement).closest("button");
        if (b && /upload/i.test(b.textContent ?? "")) {
          e.preventDefault();
          setOpen(true);
        }
      }}
    >
      {children}
      <UploadModal open={open} onOpenChange={setOpen} requested={requested} onDone={onDone} />
    </div>
  );
}

/* ---------- Record page parts (Item.dc.html) ---------- */

/** People on the record: client, lead, manager. */
export function PeopleStack({ people }: { people: Array<{ name: string; role: string }> }) {
  return (
    <span className="flex items-center -space-x-1.5" aria-label="People on it">
      {people.map((p) => (
        <span key={`${p.role}-${p.name}`} title={`${p.name} · ${p.role}`} className="rounded-full ring-2 ring-surface">
          <Avatar name={p.name} size={30} />
        </span>
      ))}
    </span>
  );
}

/** The one main action of a record head. Shows "Working" then "Done" for 2 s. */
export function RecordAction({ label, onDone }: { label: string; onDone: () => void }) {
  const [state, setState] = React.useState<"idle" | "busy" | "done">("idle");
  React.useEffect(() => {
    if (state === "busy") {
      const h = window.setTimeout(() => {
        setState("done");
        onDone();
      }, 900);
      return () => window.clearTimeout(h);
    }
    if (state === "done") {
      const h = window.setTimeout(() => setState("idle"), 2200);
      return () => window.clearTimeout(h);
    }
  }, [state, onDone]);
  return (
    <Button variant={state === "done" ? "soft" : "primary"} onClick={() => state === "idle" && setState("busy")} aria-live="polite">
      {state === "busy" ? "Working" : state === "done" ? (
        <>
          <Check size={16} strokeWidth={1.6} /> Done
        </>
      ) : (
        label
      )}
    </Button>
  );
}

/** About the item, why it applies, and the SOP link. */
export function AboutCard({ about, whyTitle, why }: { about: string; whyTitle: string; why: string }) {
  return (
    <SectionCard title="About" icon={{ Icon: Eye, tone: "teal" }}>
      <p className="text-13.5 text-ink-2">{about}</p>
      <h3 className="mt-3 text-12.5 font-medium text-muted">{whyTitle}</h3>
      <p className="mt-0.5 text-13.5 text-ink-2">{why}</p>
      <Link href="/client/library" className="mt-3 inline-block text-13 font-medium text-accent hover:underline">

        Read the SBC SOP
      </Link>
    </SectionCard>
  );
}

/* ---------- Register lists (Register.dc.html): search, groups that fold, keyboard ---------- */

export interface TileSection {
  id: string;
  label: string;
  tiles: Tile[];
  /** Starts folded: the "Not needed" group. */
  folded?: boolean;
  /** Faded tiles (not needed). */
  muted?: boolean;
}

/**
 * Tile groups with a plain chevron to fold each one (R-24). A search box filters by name.
 * Press "/" to search; Enter opens the first match. An empty result shows "None" and a Clear button.
 */
export function RegisterTiles({ sections, query, onClear }: { sections: TileSection[]; query: string; onClear: () => void }) {
  const [closed, setClosed] = React.useState<Record<string, boolean>>(() => Object.fromEntries(sections.filter((s) => s.folded).map((s) => [s.id, true])));
  const q = query.trim().toLowerCase();
  const shown = sections.map((s) => ({ ...s, tiles: q ? s.tiles.filter((t) => `${t.name} ${t.tag?.label ?? ""}`.toLowerCase().includes(q)) : s.tiles })).filter((s) => s.tiles.length > 0);
  if (shown.length === 0)
    return (
      <div className="flex items-center gap-3 px-4 py-4 md:px-5">
        <span className="flex-1 text-13 text-faint">None</span>
        {q && (
          <Button size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>
    );
  return (
    <div>
      {shown.map((s) => {
        const open = q ? true : !closed[s.id];
        return (
          <div key={s.id} className="border-t border-line-soft first:border-t-0">
            <button
              type="button"
              onClick={() => setClosed((c) => ({ ...c, [s.id]: !c[s.id] }))}
              aria-expanded={open}
              className="flex w-full items-center gap-2 bg-raised px-4 py-1.5 text-left text-11.5 font-medium uppercase tracking-[.07em] text-muted hover:text-ink md:px-5"
            >
              <Chevron open={open} className="h-3.5 w-3.5" />
              {s.label}
              <span className="text-faint">{s.tiles.length}</span>
            </button>
            {open && <RegisterGrid tiles={s.tiles} muted={s.muted} />}
          </div>
        );
      })}
    </div>
  );
}

/** Tiles of one register group (R-13, R-43): name, a 104 px area pill and a 104 px status chip, then the date. */
function RegisterGrid({ tiles, muted }: { tiles: Tile[]; muted?: boolean }) {
  return (
    <ul className={cn("grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 md:px-5 2xl:grid-cols-3", muted && "[&_li]:opacity-60")}>
      {tiles.map((t) => {
        const inner = (
          <>
            <span className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-14 font-medium">{t.name}</span>
              {t.href && <Chevron />}
            </span>
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              {t.tag && <AreaPill area={t.tag.label} />}
              <Chip tone={t.chip.tone} fixed>
                {t.chip.label}
              </Chip>
            </span>
            <span className={cn("block truncate text-12.5", t.late ? "font-medium text-bad" : "text-muted")}>{t.date ?? "-"}</span>
          </>
        );
        const cls = cn("grid min-w-0 gap-2 rounded-md border-1.5 border-line bg-surface px-3.5 py-3", t.href && "hover:bg-hover");
        return (
          <li key={t.id} className="min-w-0">
            {t.href ? (
              <Link href={t.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Compact search box for a card head. "/" focuses it; Enter opens the first match. */
export function HeadSearch({ value, onChange, onEnter, label }: { value: string; onChange: (v: string) => void; onEnter?: () => void; label: string }) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <span className="relative hidden sm:inline-flex">
      <Search size={14} strokeWidth={1.6} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnter?.();
          if (e.key === "Escape") onChange("");
        }}
        placeholder="Search"
        aria-label={label}
        className={cn(inputClass, "h-[30px] w-[160px] pl-8 pr-2 text-13")}
      />
    </span>
  );
}

/** R-10 filter chip for a card head: the shared part (B-05). Here null means "not set". */
export function FilterChip({ label, value, options, onChange }: { label: string; value: string | null; options: Array<{ value: string; label: string }>; onChange: (v: string | null) => void }) {
  return <SharedFilterChip<string | null> label={label} value={value} options={options} onChange={onChange} none={null} />;
}

