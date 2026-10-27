"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, History, Lock, Paperclip, Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { COMPANY_IDS } from "@/data/client-home-extra";
import { ACCESS_LOG, AUTO_SOURCE, STATUSES, sheetsFor, type AccessEntry, type Sheet } from "@/data/credentials-book";
import { useClientState } from "@/components/shell/ClientState";
import { Button } from "@/components/ui/Button";
import { Chip, toneFor } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { CopyButton } from "@/components/ui/CopyButton";
import { SidePanel } from "@/components/ui/SidePanel";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { RevealGate, mmss } from "@/components/cards/RevealGate";

/*
 * v7p_credentials: the client's credentials workbook. Five sheets, six ID tiles, OTP-gated Preview, Edit and Reveal,
 * a 10-minute session, an access log. Kept out: the bot figure (C-0003), info tips (R-06), the empty-sheet bot message (R-05).
 */

const SESSION_MS = 10 * 60 * 1000;
const WHO = "Rohan Kumar";
const MGR = "Pranay";

type Gate = { kind: "preview" | "edit" | "cell" | "row" | "id"; key: string; label: string } | null;

function useNow(active: boolean) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!active) return;
    const h = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(h);
  }, [active]);
  return now;
}

const clone = (s: Sheet[]) => s.map((x) => ({ ...x, cols: x.cols.map((c) => ({ ...c })), rows: x.rows.map((r) => [...r]) }));

function Workbook({ after }: { after: boolean }) {
  const [sheets, setSheets] = React.useState<Sheet[]>(() => sheetsFor(after));
  const [draft, setDraft] = React.useState<Sheet[] | null>(null);
  const [tab, setTab] = React.useState<Sheet["id"]>("login");
  const [session, setSession] = React.useState<{ mode: "preview" | "edit"; until: number } | null>(null);
  const [rev, setRev] = React.useState<Record<string, number>>({});
  const [gate, setGate] = React.useState<Gate>(null);
  const [log, setLog] = React.useState<AccessEntry[]>(ACCESS_LOG);
  const [showLog, setShowLog] = React.useState(false);
  const toast = useUndoToast();

  const active = !!session || Object.keys(rev).length > 0;
  const now = useNow(active);
  const sessLeft = session ? Math.max(0, Math.ceil((session.until - now) / 1000)) : 0;
  const live = (k: string) => (rev[k] ?? 0) > now;

  React.useEffect(() => {
    if (session && session.until <= now) {
      setSession(null);
      setDraft(null);
    }
    if (Object.values(rev).some((u) => u <= now)) setRev((r) => Object.fromEntries(Object.entries(r).filter(([, u]) => u > now)));
  }, [now, session, rev]);

  const audit = (text: string) => setLog((l) => [...l, { at: new Date(), text }]);
  const book = draft ?? sheets;
  const sheet = book.find((s) => s.id === tab)!;
  const editing = session?.mode === "edit" && !!draft;
  const previewing = !!session;

  const isSecret = (s: Sheet, r: number, c: number) => !!s.cols[c]?.secret || (!!s.secretRows?.includes(r) && c > s.lab);
  const hasSecret = (s: Sheet, r: number) => s.rows[r].some((v, c) => v && v !== "Pending COI" && isSecret(s, r, c));
  const rowName = (s: Sheet, r: number) => s.rows[r][s.lab] || `Row ${r + 1}`;

  const pass = () => {
    if (!gate) return;
    const until = Date.now() + SESSION_MS;
    if (gate.kind === "preview" || gate.kind === "edit") {
      setSession({ mode: gate.kind, until });
      if (gate.kind === "edit") setDraft(clone(sheets));
      audit(`${WHO} started ${gate.kind === "edit" ? "Edit" : "Preview"} · all sheets · OTP approved by ${MGR}`);
      toast.show(`${gate.kind === "edit" ? "Edit" : "Preview"} for 10 minutes`);
    } else {
      setRev((r) => ({ ...r, [gate.key]: until }));
      audit(`${WHO} revealed ${gate.label} · OTP approved by ${MGR}`);
      toast.show("Visible for 10 minutes");
    }
  };

  const lock = () => {
    setSession(null);
    setDraft(null);
    setRev({});
    audit(`${WHO} locked the sheets`);
  };

  const save = () => {
    if (!draft) return;
    const prev = sheets;
    setSheets(draft);
    setDraft(clone(draft));
    audit(`${WHO} edited ${sheet.label}`);
    toast.show("Saved", () => {
      setSheets(prev);
      setDraft(clone(prev));
    });
  };

  const setCell = (r: number, c: number, v: string) =>
    setDraft((d) => d && d.map((s) => (s.id !== tab ? s : { ...s, rows: s.rows.map((row, i) => (i !== r ? row : row.map((x, j) => (j === c ? v : x)))) })));

  const addRow = () => {
    if (!draft) return;
    if (sheet.add === "director") {
      setDraft(draft.map((s) => (s.id !== tab ? s : { ...s, cols: [...s.cols, { name: "New director" }], rows: s.rows.map((row, i) => [...row, i === 1 ? "New director" : ""]) })));
      toast.show("Director column added", () => setDraft(draft));
    } else {
      setDraft(draft.map((s) => (s.id !== tab ? s : { ...s, rows: [...s.rows, s.cols.map((c) => (c.kind === "status" ? "Pending" : ""))] })));
      toast.show("Row added", () => setDraft(draft));
    }
  };

  const snoOf = (r: number) => sheet.rows.slice(0, r + 1).filter((row) => row.some(Boolean)).length;

  const cell = (r: number, c: number) => {
    const v = sheet.rows[r][c];
    const col = sheet.cols[c];
    const spacer = !sheet.rows[r].some(Boolean) && !editing;
    if (spacer) return null;
    if (col.kind === "sno") {
      const showRow = hasSecret(sheet, r) && !previewing;
      const rowKey = `row:${tab}|${r}`;
      return (
        <span className="flex items-center gap-1">
          <span className="w-5 font-mono text-12 text-muted">{snoOf(r)}</span>
          {showRow && (
            <button
              type="button"
              onClick={() => (live(rowKey) ? setRev((x) => Object.fromEntries(Object.entries(x).filter(([k]) => k !== rowKey))) : setGate({ kind: "row", key: rowKey, label: `${sheet.label} · ${rowName(sheet, r)}` }))}
              className={cn("grid h-6 w-6 place-items-center rounded-sm hover:bg-raised", live(rowKey) ? "text-ok" : "text-faint")}
              aria-label={`${live(rowKey) ? "Lock" : "Preview"} row ${snoOf(r)} · ${rowName(sheet, r)}`}
            >
              {live(rowKey) ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
            </button>
          )}
        </span>
      );
    }
    if (editing) {
      if (col.kind === "status")
        return <Select aria-label={`Status · ${rowName(sheet, r)}`} value={v || "Pending"} onChange={(e) => setCell(r, c, e.target.value)} options={STATUSES.map((s) => ({ value: s, label: s }))} />;
      if (!(sheet.id === "kyc" && c === 0))
        return (
          <input
            value={v}
            onChange={(e) => setCell(r, c, e.target.value)}
            aria-label={`${col.name} · ${rowName(sheet, r)}`}
            title={sheet.auto?.[`${r}|${c}`] ? `Filled from ${AUTO_SOURCE[sheet.auto[`${r}|${c}`]]}` : undefined}
            className={cn("h-8 w-full min-w-[120px] rounded-sm border border-line bg-surface px-2 text-12.5 outline-none focus-visible:ring-2 focus-visible:ring-accent-line", col.mono && "font-mono")}
          />
        );
    }
    if (!v) return <span className="text-faint">-</span>;
    if (v === "Pending COI" || v === "Not registered yet") return <Chip tone="idle">{v}</Chip>;
    if (col.kind === "status") return <Chip tone={v === "Not applicable" ? "idle" : toneFor(v)} fixed>{v}</Chip>;
    if (col.kind === "cert")
      return v === "Proof pending" ? (
        <Chip tone="warn">Proof pending</Chip>
      ) : (
        <Link href="/client/documents/view/d2" className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-12 font-semibold text-accent hover:underline">
          <Paperclip size={12} strokeWidth={1.5} /> {v}
        </Link>
      );
    const auto = sheet.auto?.[`${r}|${c}`];
    if (isSecret(sheet, r, c)) {
      const k = `cell:${tab}|${r}|${c}`;
      const open = previewing || live(k) || live(`row:${tab}|${r}`);
      if (!open)
        return (
          <span className="flex items-center gap-2">
            <span className="font-mono tracking-wider text-muted">••••••</span>
            <button type="button" onClick={() => setGate({ kind: "cell", key: k, label: `${sheet.label} · ${rowName(sheet, r)} · ${col.name}` })} className="inline-flex h-6 items-center gap-1 rounded-sm border border-line px-1.5 text-11.5 font-semibold text-ink-2 hover:bg-raised" aria-label={`Reveal ${rowName(sheet, r)} · ${col.name}`}>
              <Lock size={12} strokeWidth={1.5} /> Reveal
            </button>
          </span>
        );
      return (
        <span className="flex items-center gap-1">
          <span className={cn("truncate", col.mono && "font-mono text-12.5")}>{v}</span>
          <CopyButton value={v} label={`${rowName(sheet, r)} · ${col.name}`} className="h-6 w-6" />
          {live(k) && !previewing && <Chip tone="ok">{mmss(Math.ceil((rev[k] - now) / 1000))}</Chip>}
        </span>
      );
    }
    return (
      <span className={cn(c === sheet.lab ? "font-semibold" : "", col.mono && "font-mono text-12.5", "whitespace-nowrap")} title={auto ? `Filled from ${AUTO_SOURCE[auto]}` : undefined}>
        {v}
        {auto && <i className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" aria-label={`Filled from ${AUTO_SOURCE[auto]}`} />}
      </span>
    );
  };

  const columns: Column<{ r: number }>[] = sheet.cols.map((col, c) => ({
    key: `c${c}`,
    label: col.name,
    width: col.kind === "sno" ? 64 : col.kind === "status" ? 132 : undefined,
    render: (x) => cell(x.r, c),
    className: c === sheet.lab ? "min-w-[180px]" : undefined,
  }));

  const sheetTabs = book.map((s) => ({ key: s.id, label: s.label, count: s.rows.filter((r) => r.some(Boolean)).length }));

  return (
    <>
      <IdTiles after={after} rev={rev} now={now} previewing={previewing} onReveal={(key, label) => setGate({ kind: "id", key, label })} onTab={setTab} directors={book.find((s) => s.id === "kyc")!.cols.length - 1} />
      <DataGrid
        title={sheet.label}
        meta={sheet.id === "login" ? "Northwind Technologies India Pvt Ltd" : undefined}
        rows={sheet.rows.map((_, r) => ({ r }))}
        rowKey={(x) => `${tab}-${x.r}`}
        pageSize={40}
        columns={columns}
        filters={
          <>
            <Tabs items={sheetTabs} value={tab} onChange={(k) => setTab(k as Sheet["id"])} className="hidden xl:inline-flex" />
            <Select aria-label="Sheet" value={tab} onChange={(e) => setTab(e.target.value as Sheet["id"])} options={sheetTabs.map((t) => ({ value: t.key, label: `${t.label} (${t.count})` }))} className="xl:hidden" />
            {session && <Chip tone={session.mode === "edit" ? "warn" : "ok"}>{`${session.mode === "edit" ? "Edit" : "Preview"} · ${mmss(sessLeft)}`}</Chip>}
            <Button size="sm" variant="ghost" onClick={() => setShowLog(true)}>
              <History size={14} strokeWidth={1.5} /> Access log
            </Button>
            {!session && (
              <Button size="sm" onClick={() => setGate({ kind: "preview", key: "page", label: "all sheets" })}>
                <Eye size={14} strokeWidth={1.5} /> Preview
              </Button>
            )}
            {editing && sheet.add && (
              <Button size="sm" onClick={addRow}>
                <Plus size={14} strokeWidth={1.5} /> {sheet.add === "director" ? "Add director" : "Add row"}
              </Button>
            )}
            {editing ? (
              <Button size="sm" variant="primary" onClick={save}>
                Save
              </Button>
            ) : (
              <Button size="sm" variant="primary" onClick={() => setGate({ kind: "edit", key: "page", label: "all sheets" })}>
                <Pencil size={14} strokeWidth={1.5} /> Edit
              </Button>
            )}
            {session && (
              <Button size="sm" onClick={lock}>
                <Lock size={14} strokeWidth={1.5} /> Lock
              </Button>
            )}
          </>
        }
      />
      <RevealGate
        open={!!gate}
        onOpenChange={(v) => !v && setGate(null)}
        mode="otp"
        title={gate?.kind === "edit" ? "Edit the sheets" : gate?.kind === "preview" ? "Preview the sheets" : `Reveal ${gate?.label ?? ""}`}
        manager={{ name: MGR, mail: "pr•••••@sbc.in" }}
        onPass={pass}
      />
      <SidePanel open={showLog} onOpenChange={setShowLog} title="Access log" eyebrow={`${log.length} entries`}>
        <ul>
          {[...log].reverse().map((e, i) => (
            <li key={i} className="grid gap-0.5 border-b border-line-soft px-5 py-3 text-13">
              <time className="font-mono text-12 text-muted">
                {fmt(e.at)} {e.at.getFullYear()} · {String(e.at.getHours()).padStart(2, "0")}:{String(e.at.getMinutes()).padStart(2, "0")}
              </time>
              <span>{e.text}</span>
            </li>
          ))}
        </ul>
      </SidePanel>
      {toast.node}
    </>
  );
}

function IdTiles({
  after,
  rev,
  now,
  previewing,
  onReveal,
  onTab,
  directors,
}: {
  after: boolean;
  rev: Record<string, number>;
  now: number;
  previewing: boolean;
  onReveal: (key: string, label: string) => void;
  onTab: (t: Sheet["id"]) => void;
  directors: number;
}) {
  const tile = (key: string, label: string, body: React.ReactNode, act?: React.ReactNode, tone = "bg-surface") => (
    <article key={key} className={cn("flex min-w-0 flex-col gap-1 rounded-lg border border-line px-4 py-3", tone)}>
      <span className="flex items-center gap-2">
        <span className="text-12.5 font-semibold text-muted">{label}</span>
        <span className="ml-auto flex items-center">{act}</span>
      </span>
      {body}
    </article>
  );
  const pend = <Chip tone="idle" className="w-fit">Pending COI</Chip>;
  return (
    <section aria-label="Company identifiers" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {COMPANY_IDS.map((id) => {
        if (!after) return tile(id.key, id.label, pend);
        const k = `id:${id.key}`;
        const open = !id.masked || previewing || (rev[k] ?? 0) > now;
        return tile(
          id.key,
          id.label,
          <span className="truncate font-mono text-13.5 font-semibold">{open ? id.value : id.masked}</span>,
          open ? (
            <CopyButton value={id.value} label={id.label} className="h-6 w-6" />
          ) : (
            <button type="button" onClick={() => onReveal(k, `Company · ${id.label}`)} className="grid h-6 w-6 place-items-center rounded-sm text-muted hover:bg-raised hover:text-ink" aria-label={`Reveal ${id.label}`}>
              <Eye size={14} strokeWidth={1.5} />
            </button>
          ),
        );
      })}
      {tile(
        "reg",
        "Registrations",
        after ? <span className="truncate text-13.5 font-semibold">PF · ESI · PT</span> : pend,
        after ? (
          <button type="button" onClick={() => onTab("reg")} className="grid h-6 w-6 place-items-center rounded-sm text-muted hover:bg-raised hover:text-ink" aria-label="Open the registrations sheet">
            <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        ) : undefined,
      )}
      {tile(
        "dsc",
        "DSC holders",
        after ? <span className="truncate text-13.5 font-semibold">{directors} holders</span> : pend,
        after ? (
          <button type="button" onClick={() => onTab("kyc")} className="grid h-6 w-6 place-items-center rounded-sm text-muted hover:bg-raised hover:text-ink" aria-label="Open the directors KYC sheet">
            <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        ) : undefined,
      )}
    </section>
  );
}

/** C-0003: no bot figure. Reveal (ids-password) is an inline OTP step, not a page. */
export function CredentialsScreen() {
  const { incorporated } = useClientState();
  return (
    <div className="grid grid-cols-1 gap-5">
      <Workbook key={String(incorporated)} after={incorporated} />
    </div>
  );
}
