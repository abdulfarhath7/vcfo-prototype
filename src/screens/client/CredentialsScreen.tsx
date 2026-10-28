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
import { inputClass } from "@/components/ui/Input";
import { CopyButton } from "@/components/ui/CopyButton";
import { SidePanel } from "@/components/ui/SidePanel";
import { useUndoToast } from "@/components/ui/UndoToast";
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

function Workbook({ after, onStage }: { after: boolean; onStage: (v: boolean) => void }) {
  const [sheets, setSheets] = React.useState<Sheet[]>(() => sheetsFor(after));
  const [draft, setDraft] = React.useState<Sheet[] | null>(null);
  const [tab, setTab] = React.useState<Sheet["id"]>("address");
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

  // R-28: identifier rows of the KYC sheet (DIN, PAN) use mono like identifier columns.
  const monoAt = (r: number, c: number) => !!sheet.cols[c]?.mono || (c !== sheet.lab && /^(DIN|PAN|CIN|GSTIN|TAN)$/.test(sheet.rows[r][sheet.lab] ?? ""));
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
          <span className="w-5 text-13 text-muted">{snoOf(r)}</span>
          {showRow && (
            <button
              type="button"
              onClick={() => (live(rowKey) ? setRev((x) => Object.fromEntries(Object.entries(x).filter(([k]) => k !== rowKey))) : setGate({ kind: "row", key: rowKey, label: `${sheet.label} · ${rowName(sheet, r)}` }))}
              className={cn("grid h-6 w-6 place-items-center rounded-sm hover:bg-ghost", live(rowKey) ? "text-ok" : "text-faint")}
              aria-label={`${live(rowKey) ? "Lock" : "Preview"} row ${snoOf(r)} · ${rowName(sheet, r)}`}
            >
              {live(rowKey) ? <EyeOff size={13} strokeWidth={1.6} /> : <Eye size={13} strokeWidth={1.6} />}
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
            className={cn(inputClass, "h-8 min-w-[120px] px-2 text-13", col.mono && "font-mono")}
          />
        );
    }
    if (!v) return <span className="text-faint">-</span>;
    if (v === "Pending COI" || v === "Not registered yet") return <span className="whitespace-nowrap text-muted">{v}</span>;
    if (col.kind === "status") return <Chip tone={v === "Not applicable" ? "idle" : toneFor(v)} fixed={v !== "Not applicable"}>{v}</Chip>;

    if (col.kind === "cert")
      return v === "Proof pending" ? (
        <Chip tone="warn" fixed>Proof pending</Chip>
      ) : (
        <Link href="/client/documents/view/d2" className="inline-flex items-center gap-1 whitespace-nowrap text-13 font-medium text-accent hover:underline">
          <Paperclip size={12} strokeWidth={1.6} /> {v}
        </Link>
      );
    const auto = sheet.auto?.[`${r}|${c}`];
    if (isSecret(sheet, r, c)) {
      const k = `cell:${tab}|${r}|${c}`;
      const open = previewing || live(k) || live(`row:${tab}|${r}`);
      if (!open)
        return (
          <span className="flex items-center gap-2">
            <span className="tracking-wider text-muted">••••••</span>
            <button type="button" onClick={() => setGate({ kind: "cell", key: k, label: `${sheet.label} · ${rowName(sheet, r)} · ${col.name}` })} className="inline-flex h-6 items-center gap-1 rounded-md border-1.5 border-line-2 px-1.5 text-12 font-medium text-ink-2 hover:bg-hover" aria-label={`Reveal ${rowName(sheet, r)} · ${col.name}`}>
              <Lock size={12} strokeWidth={1.6} /> Reveal
            </button>
          </span>
        );
      return (
        <span className="flex items-center gap-1">
          <span className={cn("truncate", monoAt(r, c) && "font-mono text-13")}>{v}</span>
          <CopyButton value={v} label={`${rowName(sheet, r)} · ${col.name}`} className="h-6 w-6" />
          {live(k) && !previewing && <Chip tone="ok">{mmss(Math.ceil((rev[k] - now) / 1000))}</Chip>}
        </span>
      );
    }
    return (
      <span className="grid justify-items-start gap-0.5">
        <span className={cn(c === sheet.lab ? "font-medium text-ink" : "", monoAt(r, c) && "font-mono text-13", "whitespace-nowrap")}>{v}</span>
        {auto && <AutoTag source={auto} />}
      </span>
    );
  };

  const sheetTabs = book.map((s) => ({ key: s.id, label: s.label, count: s.rows.filter((r) => r.some(Boolean)).length }));
  // R-12: one set of Preview and Edit buttons, on the sheet card. The page-level copies are gone.
  const modeButtons = () => (
    <>
      {session && <Chip tone={session.mode === "edit" ? "warn" : "ok"}>{`${session.mode === "edit" ? "Edit" : "Preview"} · ${mmss(sessLeft)}`}</Chip>}
      {!session && (
        <Button size="sm" onClick={() => setGate({ kind: "preview", key: "page", label: "all sheets" })}>
          <Eye size={14} strokeWidth={1.6} /> Preview
        </Button>
      )}
      {editing && sheet.add && (
        <Button size="sm" onClick={addRow}>
          <Plus size={14} strokeWidth={1.6} /> {sheet.add === "director" ? "Add director" : "Add row"}
        </Button>
      )}
      {editing ? (
        <Button size="sm" variant="primary" onClick={save}>
          Save
        </Button>
      ) : (
        <Button size="sm" variant="primary" onClick={() => setGate({ kind: "edit", key: "page", label: "all sheets" })}>
          <Pencil size={14} strokeWidth={1.6} /> Edit
        </Button>
      )}
      {session && (
        <Button size="sm" onClick={lock}>
          <Lock size={14} strokeWidth={1.6} /> Lock
        </Button>
      )}
    </>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5" role="toolbar" aria-label="Credentials">
        <h1 className="sr-only">Credentials</h1>
        <Tabs
          items={[
            { key: "before", label: "Before COI" },
            { key: "after", label: "After COI" },
          ]}
          value={after ? "after" : "before"}
          onChange={(k) => onStage(k === "after")}
          size="md"
        />
        <span className="flex-1" />
        <Button size="sm" onClick={() => setShowLog(true)}>
          <History size={14} strokeWidth={1.6} /> Access log
        </Button>
      </div>
      <IdTiles after={after} rev={rev} now={now} previewing={previewing} onReveal={(key, label) => setGate({ kind: "id", key, label })} onTab={setTab} directors={book.find((s) => s.id === "kyc")!.cols.length - 1} />
      <section aria-label={sheet.label} className="min-w-0 overflow-hidden rounded-md border-1.5 border-line bg-surface">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-2 max-lg:py-3 md:px-5">
          <Tabs variant="underline" items={sheetTabs} value={tab} onChange={(k) => setTab(k as Sheet["id"])} className="hidden min-w-0 flex-1 border-b-0 lg:flex" />
          <Select aria-label="Sheet" size="md" value={tab} onChange={(e) => setTab(e.target.value as Sheet["id"])} options={sheetTabs.map((t) => ({ value: t.key, label: `${t.label} (${t.count})` }))} className="lg:hidden" />
          <span className="flex flex-1 flex-wrap items-center justify-end gap-2 lg:flex-none">{modeButtons()}</span>
        </div>
        <SheetGrid
          sheet={sheet}
          cell={cell}
          editing={editing}
          onEditRow={(r) => (editing ? undefined : setGate({ kind: "edit", key: "page", label: `${sheet.label} · ${rowName(sheet, r)}` }))}
        />
      </section>
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
              <time className=" text-12 text-muted">
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

/** Where an auto-filled cell came from, in the old wording: "Auto · from registered office". */
const AUTO_WORDS: Record<string, string> = { office: "registered office", profile: "client profile", coi: "company record", reg: "registration steps", inc: "incorporation steps" };
function AutoTag({ source }: { source: string }) {
  return (
    <span className="inline-flex h-[18px] items-center whitespace-nowrap rounded-sm bg-accent-soft px-1.5 text-11 font-semibold text-accent" title={`Filled from ${AUTO_SOURCE[source] ?? source}`}>
      Auto · from {AUTO_WORDS[source] ?? source}
    </span>
  );
}

/** Credentials sheet as a T1 table (R-07): 36 px head, 44 px rows, hairlines only. The first column holds the row number and an edit pencil. */
function SheetGrid({ sheet, cell, editing, onEditRow }: { sheet: Sheet; cell: (r: number, c: number) => React.ReactNode; editing: boolean; onEditRow: (r: number) => void }) {
  return (
    <div className="overflow-x-auto border-t border-line-soft">
      <table className="grid-table text-13.5">
        <thead>
          <tr>
            <th className="w-[52px] min-w-[52px] pl-4 md:pl-5">
              <span className="sr-only">Edit</span>
            </th>
            {sheet.cols.map((col, c) => (
              <th key={c} scope="col" className={cn(c === sheet.lab && "min-w-[190px]", col.kind === "status" && "w-[124px]", c === sheet.cols.length - 1 && "pr-4 md:pr-5")}>
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.rows.length === 0 && (
            <tr>
              <td colSpan={sheet.cols.length + 1} className="px-4 text-13 text-faint md:px-5">
                None
              </td>
            </tr>
          )}
          {sheet.rows.map((row, r) => {
            const spacer = !row.some(Boolean) && !editing;
            if (spacer)
              return (
                <tr key={r} aria-hidden>
                  <td colSpan={sheet.cols.length + 1} className="!h-2 bg-raised p-0" />
                </tr>
              );
            return (
              <tr key={r}>
                <td className="pl-3 text-13 text-muted md:pl-4">
                  {!editing && (
                    <button type="button" onClick={() => onEditRow(r)} className="grid h-6 w-6 place-items-center rounded-sm text-faint hover:bg-ghost hover:text-ink" aria-label={`Edit row ${r + 1}`}>
                      <Pencil size={13} strokeWidth={1.6} />
                    </button>
                  )}
                </td>
                {sheet.cols.map((_, c) => (
                  <td key={c} className={cn("py-1.5", c === sheet.lab && "font-medium text-ink", c === sheet.cols.length - 1 && "pr-4 md:pr-5")}>
                    {cell(r, c)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
  // Calm white ID tiles (R-02, R-18): a 13 px label, the value, one small action. The old tinted tiles are gone.
  const tile = (key: string, label: string, body: React.ReactNode, act?: React.ReactNode) => (
    <article key={key} className="flex min-h-[72px] min-w-0 flex-col justify-center gap-1 rounded-md border-1.5 border-line bg-surface px-3.5 py-2.5">
      <span className="flex min-h-6 items-center gap-2">
        <span className="truncate text-13 font-medium text-muted">{label}</span>
        <span className="ml-auto flex items-center">{act}</span>
      </span>
      <span className="min-w-0 text-ink">{body}</span>
    </article>
  );
  const pend = <span className="text-14 text-faint">Pending COI</span>;
  return (
    <section aria-label="Company identifiers" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))]">

      {COMPANY_IDS.map((id) => {
        if (!after) return tile(id.key, id.label, pend);
        const k = `id:${id.key}`;
        const open = !id.masked || previewing || (rev[k] ?? 0) > now;
        return tile(
          id.key,
          id.label,
          <span className="block truncate font-mono text-14 font-medium">{open ? id.value : id.masked}</span>,
          open ? (
            <CopyButton value={id.value} label={id.label} className="h-6 w-6" />
          ) : (
            <button type="button" onClick={() => onReveal(k, `Company · ${id.label}`)} className="grid h-6 w-6 place-items-center rounded-sm text-muted hover:bg-ghost hover:text-ink" aria-label={`Reveal ${id.label}`}>
              <Eye size={14} strokeWidth={1.6} />
            </button>
          ),
        );
      })}
      {tile(
        "reg",
        "Registrations",
        after ? <span className="block truncate text-14 font-medium">PF · ESI · PT</span> : pend,
        after ? (
          <button type="button" onClick={() => onTab("reg")} className="grid h-6 w-6 place-items-center rounded-sm text-muted hover:bg-ghost hover:text-ink" aria-label="Open the registrations sheet">
            <ArrowRight size={14} strokeWidth={1.6} />
          </button>
        ) : undefined,
      )}
      {tile(
        "dsc",
        "DSC holders",
        after ? <span className="block truncate text-14 font-medium">{directors} holders</span> : pend,
        after ? (
          <button type="button" onClick={() => onTab("kyc")} className="grid h-6 w-6 place-items-center rounded-sm text-muted hover:bg-ghost hover:text-ink" aria-label="Open the directors KYC sheet">
            <ArrowRight size={14} strokeWidth={1.6} />
          </button>
        ) : undefined,
      )}
    </section>
  );
}

/** C-0003: no bot figure. Reveal (ids-password) is an inline OTP step, not a page. */
export function CredentialsScreen() {
  const { incorporated, set } = useClientState();
  return (
    <div className="grid grid-cols-1 gap-4">
      <Workbook key={String(incorporated)} after={incorporated} onStage={set} />
    </div>
  );
}
