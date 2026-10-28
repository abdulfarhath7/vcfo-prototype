"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronRight, Download, Eye, EyeOff, Folder, Search, TrendingUp, Upload, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt, fmtYear } from "@/lib/dates";
import { CLIENTS } from "@/data/people";
import { PREVIEWABLE } from "@/data/docs-library";
import { TREE_CATS, TREE_FILES, TREE_FOLDERS, TREE_OPEN, TREE_SELECTED, treeDoc, type TreeFile, type TreeStatus } from "@/data/docs-tree";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { FileBadge } from "@/components/ui/FileBadge";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { ActionMenu, type ActionItem } from "@/components/ui/ActionMenu";
import { useUndoToast } from "@/components/ui/UndoToast";
import { UploadDialog, type UploadRequest } from "@/components/cards/UploadDialog";
import { PaperPage } from "./docs-parts";
import type { Portal } from "@/data/nav";

/*
 * Documents (client) and Vault (staff): docs_a_refined, s/lead/Vault. One tree by step or by category on the left,
 * a half-width preview with a Step / From / Date / File footer on the right. Status glyphs, replaced files, ZIP and link toasts, upload dialog.
 * R-09: no card title that repeats the sidebar.
 */

type Bucket = "ok" | "rv" | "ms" | "x";
const bucket = (s: TreeStatus): Bucket => (s === "Approved" || s === "Final" ? "ok" : s === "In review" ? "rv" : s === "Missing" ? "ms" : "x");

interface Node {
  id: string;
  parent: string | null;
  label: string;
  file?: TreeFile;
}

function nodesFor(view: "step" | "cat", files: TreeFile[]): Node[] {
  if (view === "step") {
    const out: Node[] = [];
    for (const fo of TREE_FOLDERS) {
      out.push(fo);
      for (const f of files.filter((x) => x.parent === fo.id)) out.push({ id: f.id, parent: fo.id, label: f.label, file: f });
    }
    return out;
  }
  return TREE_CATS.flatMap((c) => [{ id: c.id, parent: null, label: c.label } as Node, ...files.filter((f) => f.cat === c.id).map((f) => ({ id: f.id, parent: c.id, label: f.label, file: f }))]);
}

/** Status glyph: done green tick, with SBC blue arrow, waiting on the client amber person, late red mark. */
function Glyph({ f }: { f: TreeFile }) {
  const k = f.status === "In review" ? "sbc" : f.status === "Missing" ? (f.due === "over" ? "late" : "you") : "done";
  const cfg = {
    done: { cls: "bg-ok dark:bg-ok-mid", Icon: Check, tip: f.status === "Final" ? `Done · from SBC ${fmtYear(f.date)}` : `Done · approved ${fmtYear(f.date)}` },
    sbc: { cls: "bg-accent dark:bg-btn", Icon: TrendingUp, tip: `With SBC · in review since ${fmtYear(f.date)}` },
    you: { cls: "bg-brand", Icon: User, tip: `Waiting on Northwind · due ${fmtYear(f.date)}` },
    late: { cls: "bg-bad dark:bg-bad-mid", Icon: AlertCircle, tip: `Late · was due ${fmtYear(f.date)}` },
  }[k];
  return (
    <span className={cn("grid h-5 w-5 flex-none place-items-center rounded-[5px] text-white", cfg.cls)} title={cfg.tip} aria-label={cfg.tip} role="img">
      <cfg.Icon size={12} strokeWidth={2} />
    </span>
  );
}

const MINI: Record<string, string> = { PDF: "bg-bad-soft text-bad", JPG: "bg-teal-soft text-teal", PNG: "bg-teal-soft text-teal", DOCX: "bg-accent-soft text-accent", XLSX: "bg-ok-soft text-ok" };

function MiniType({ f }: { f: TreeFile }) {
  if (f.status === "Missing") return <span className="h-[18px] w-[18px] flex-none rounded-[4px] border border-dashed border-warn-mid" aria-label="Not uploaded yet" />;
  return <span className={cn("grid h-[18px] w-[22px] flex-none place-items-center rounded-[4px] font-mono text-[7.5px] font-bold", MINI[f.type ?? "PDF"])}>{f.type}</span>;
}

function DueChip({ f }: { f: TreeFile }) {
  return f.due === "over" ? <Chip tone="bad" dot={false}>Overdue</Chip> : <Chip tone="warn" dot={false}>Due {fmt(f.date)}</Chip>;
}

const STATUS_CHIP: Record<TreeStatus, React.ReactNode> = {
  Final: <span className="inline-flex h-[22px] items-center rounded-sm bg-navy px-2 text-11.5 font-semibold text-white dark:bg-btn">Final</span>,
  Approved: <Chip tone="ok">Approved</Chip>,
  "In review": <Chip tone="prog">In review</Chip>,
  Replaced: <Chip tone="idle">Replaced</Chip>,
  Missing: <Chip tone="warn">Missing</Chip>,
};

export function DocumentsExplorer({ portal }: { portal: Portal; title?: string }) {
  const staff = portal !== "client";
  const router = useRouter();
  const base = portal === "client" ? "/client" : `/${portal}`;
  const viewHref = (id: string) => `${base}/documents/view/${id}`;

  const [client, setClient] = React.useState(CLIENTS[0].id);
  const [view, setView] = React.useState<"step" | "cat">("step");
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState(true);
  const [hid, setHid] = React.useState(false);
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(TREE_OPEN));
  const [sel, setSel] = React.useState(TREE_SELECTED);
  const [files, setFiles] = React.useState<TreeFile[]>(TREE_FILES);
  const [upload, setUpload] = React.useState<{ open: boolean; id?: string }>({ open: false });
  const toast = useUndoToast();

  // Only Northwind has sample files. Other clients show the empty state.
  const all = client === CLIENTS[0].id ? files : [];
  const s = q.trim().toLowerCase();
  const shown = (f: TreeFile) => (hid || !f.hidden) && (!s || f.label.toLowerCase().includes(s));
  const nodes = nodesFor(view, all);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const under = (id: string) =>
    all.filter((f) => {
      let p: string | null = view === "step" ? f.parent : f.cat;
      while (p) {
        if (p === id) return true;
        p = byId.get(p)?.parent ?? null;
      }
      return false;
    });
  const depth = (n: Node) => {
    let k = 0;
    let p = n.parent;
    while (p) {
      k++;
      p = byId.get(p)?.parent ?? null;
    }
    return k;
  };
  const folderIds = (id: string): string[] => nodes.filter((n) => !n.file && n.parent === id).flatMap((n) => [n.id, ...folderIds(n.id)]);
  const missing = all.filter((f) => f.status === "Missing");
  const selFile = all.find((f) => f.id === sel) ?? all.find((f) => f.id === TREE_SELECTED);
  const stepOf = (f: TreeFile) => TREE_FOLDERS.find((x) => x.id === f.parent)?.label ?? "";

  const zip = (name: string, count: number) => {
    toast.show(`Preparing ${name}.zip…`);
    window.setTimeout(() => toast.show(`Downloaded ${name}.zip · ${count} files`), 900);
  };
  const copy = (href: string) => {
    try {
      navigator.clipboard?.writeText(`${window.location.origin}${href}`).catch(() => undefined);
    } catch {}
    toast.show("Link copied");
  };
  const download = (f: TreeFile) => toast.show(`Downloaded ${f.file}`);
  const flip = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const folderMenu = (n: Node): ActionItem[] => {
    const kids = under(n.id).filter((f) => !f.hidden && f.status !== "Missing");
    return [
      { label: "Download folder as ZIP", hint: `${kids.length} files`, onSelect: () => zip(n.label.replace(/^\d+ · /, ""), Math.max(1, kids.length)) },
      { label: "Expand all", onSelect: () => setOpen((o) => new Set([...o, n.id, ...folderIds(n.id)])) },
      { label: "Collapse all", onSelect: () => setOpen((o) => new Set([...o].filter((x) => x !== n.id && !folderIds(n.id).includes(x)))) },
      "separator",
      { label: "Copy link to folder", onSelect: () => copy(`${portal === "client" ? "/client/documents" : portal === "super" ? "/super/documents" : `${base}/docs/vault`}?folder=${n.id}`) },
    ];
  };
  const fileMenu = (f: TreeFile): ActionItem[] =>
    f.status === "Missing"
      ? [{ label: "Upload", onSelect: () => setUpload({ open: true, id: f.id }) }, "separator", { label: "Copy link", onSelect: () => copy(viewHref(f.id)) }]
      : [
          { label: "Download", onSelect: () => download(f) },
          { label: "Open in viewer", onSelect: () => router.push(viewHref(f.id)) },
          "separator",
          { label: "Copy link", onSelect: () => copy(viewHref(f.id)) },
        ];

  const requests: UploadRequest[] = missing.map((f) => ({ id: f.id, name: f.label, due: f.date }));
  const onUploaded = (id: string | undefined, picked: Array<{ name: string }>) => {
    if (!id || picked.length === 0) return;
    const before = files;
    setFiles((l) => l.map((f) => (f.id === id ? { ...f, status: "In review", type: "PDF", file: picked[0].name.toLowerCase(), from: "Northwind", due: undefined } : f)));
    setSel(id);
    toast.show(`Uploaded ${picked.length === 1 ? picked[0].name : `${picked.length} files`} · SBC reviews it`, () => setFiles(before));
  };

  /* ---------- Tree rows ---------- */

  const rows: React.ReactNode[] = [];
  for (const n of nodes) {
    let p = n.parent;
    let vis = true;
    while (p) {
      if (!s && !open.has(p)) vis = false;
      p = byId.get(p)?.parent ?? null;
    }
    if (!vis) continue;
    const d = depth(n);
    const guides = Array.from({ length: d }, (_, i) => <span key={i} className="absolute inset-y-0 w-px bg-line" style={{ left: 22 + i * 31 }} aria-hidden />);
    if (n.file) {
      const f = n.file;
      if (!shown(f)) continue;
      const on = sel === f.id;
      rows.push(
        <div key={n.id} role="treeitem" aria-selected={on} className={cn("group relative flex h-9 items-center pr-2 text-13.5", on ? "bg-navy text-white shadow-[inset_3px_0_0_var(--brand)] dark:bg-btn" : "hover:bg-raised", f.hidden && !on && "text-muted")}>
          {guides}
          <button
            type="button"
            onClick={() => {
              setSel(f.id);
              if (window.matchMedia("(max-width: 767px)").matches) {
                if (f.status === "Missing") setUpload({ open: true, id: f.id });
                else router.push(viewHref(f.id));
              }
            }}
            className="flex h-full min-w-0 flex-1 items-center gap-2.5 text-left"
            style={{ paddingLeft: 22 + d * 31 - 6 }}
          >
            <MiniType f={f} />
            <span className={cn("min-w-0 flex-1 truncate", f.status === "Missing" ? "font-medium" : "font-semibold", f.hidden && "line-through")}>{f.label}</span>
            {f.stale && <Tag tone="warn">Older than 2 months</Tag>}
            {f.hidden && <Tag>Replaced</Tag>}
            {f.status === "Missing" && <DueChip f={f} />}
            {status && !f.hidden && <Glyph f={f} />}
          </button>
          <span className="opacity-0 focus-within:opacity-100 group-hover:opacity-100">
            <ActionMenu label={`More actions for ${f.label}`} items={fileMenu(f)} />
          </span>
        </div>,
      );
      continue;
    }
    const kidsAll = under(n.id);
    if (kidsAll.filter(shown).length === 0) continue;
    const kids = kidsAll.filter((f) => !f.hidden);
    const isOpen = !!s || open.has(n.id);
    const phase = view === "step" && n.parent === null;
    const ok = kids.filter((f) => bucket(f.status) === "ok").length;
    const rv = kids.filter((f) => bucket(f.status) === "rv").length;
    const ms = kids.filter((f) => bucket(f.status) === "ms").length;
    const tot = ok + rv + ms;
    rows.push(
      <div key={n.id} role="treeitem" aria-selected={false} aria-expanded={isOpen} className="group relative flex h-9 items-center pr-2 text-13.5 hover:bg-raised">
        {guides}
        <button type="button" onClick={() => flip(n.id)} className="flex h-full min-w-0 flex-1 items-center gap-2 text-left" style={{ paddingLeft: 14 + d * 31 }}>
          <ChevronRight size={15} strokeWidth={1.6} className={cn("flex-none text-muted transition-transform", isOpen && "rotate-90")} aria-hidden />
          <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-[5px] bg-accent-soft text-accent" aria-hidden>
            <Folder size={12} strokeWidth={1.6} className="fill-current" />
          </span>
          <span className="min-w-0 flex-1 truncate font-semibold">{n.label}</span>
          {phase ? (
            <span className="w-8 flex-none text-right text-12 text-muted">{kids.length}</span>
          ) : (
            tot > 0 && (
              <span className="flex flex-none items-center gap-2" title={`${n.label.replace(/^\d+ · /, "")} · ${ok} received · ${rv} in review · ${ms} missing`}>
                <span className="flex h-[4px] w-[54px] gap-px overflow-hidden rounded-sm bg-line">
                  <span className="bg-ok dark:bg-ok-mid" style={{ width: `${(ok / tot) * 100}%` }} />
                  <span className="bg-accent" style={{ width: `${(rv / tot) * 100}%` }} />
                  <span className="bg-brand" style={{ width: `${(ms / tot) * 100}%` }} />
                </span>
                <span className="w-8 text-right font-mono text-12 text-muted">
                  {ok}/{tot}
                </span>
              </span>
            )
          )}
        </button>
        <span className="opacity-0 focus-within:opacity-100 group-hover:opacity-100">
          <ActionMenu label={`More actions for ${n.label}`} items={folderMenu(n)} />
        </span>
      </div>,
    );
  }

  /* ---------- Preview pane ---------- */

  const pane = (f: TreeFile) => {
    const miss = f.status === "Missing";
    const doc = treeDoc(f);
    return (
      <div className="flex h-full min-h-[calc(100vh-150px)] flex-col">
        <div className="flex min-h-[52px] items-center gap-3 border-b border-line-soft px-4">
          {miss ? <span className="h-6 w-11 flex-none rounded-sm border border-dashed border-warn-mid" aria-hidden /> : <FileBadge type={doc.type} />}
          <span className="min-w-0 flex-1 truncate text-14 font-semibold">{f.label}</span>
          {STATUS_CHIP[f.status]}
          {!miss && (
            <>
              <Button asChild size="iconSm">
                <Link href={viewHref(f.id)} aria-label="Open in viewer" title="Open in viewer">
                  <Eye size={15} strokeWidth={1.6} />
                </Link>
              </Button>
              <Button size="iconSm" aria-label="Download" title="Download" onClick={() => download(f)}>
                <Download size={15} strokeWidth={1.6} />
              </Button>
            </>
          )}
        </div>
        <div className="grid flex-1 place-items-center bg-raised px-6 py-8">
          {miss ? (
            <button type="button" onClick={() => setUpload({ open: true, id: f.id })} className="grid w-full max-w-[340px] justify-items-center gap-2 rounded-md border border-dashed border-line bg-surface px-4 py-10 text-center hover:border-accent-line">
              <Upload size={18} strokeWidth={1.6} className="text-muted" />
              <span className="text-13.5 font-semibold">
                Drop the file or <span className="text-accent">browse</span>
              </span>
              <span className="font-mono text-11.5 text-faint">PDF · JPG · PNG · DOCX · up to 10 MB</span>
            </button>
          ) : PREVIEWABLE.has(doc.type) ? (
            <Link href={viewHref(f.id)} className="block w-full max-w-[340px]" aria-label="Open in viewer">
              <PaperPage f={doc} />
            </Link>
          ) : (
            <div className="grid w-full max-w-[340px] justify-items-center gap-3 rounded-md border border-line bg-surface px-4 py-10 text-center">
              <FileBadge type={doc.type} />
              <span className="text-13.5 font-semibold">Preview not available for this file type</span>
              <Button size="sm" variant="primary" onClick={() => download(f)}>
                <Download size={15} strokeWidth={1.6} /> Download
              </Button>
            </div>
          )}
        </div>
        <dl className="text-13.5">
          {[
            ["Step", stepOf(f)],
            ["From", f.from],
            [miss ? "Due" : "Date", fmtYear(f.date)],
            ["File", f.file],
          ].map(([k, v]) => (
            <div key={k} className="flex min-h-[36px] items-center justify-between gap-3 border-t border-line-soft px-4">
              <dt className="text-muted">{k}</dt>
              <dd className={cn("min-w-0 truncate text-right font-semibold", k === "File" && v !== "-" && "font-mono text-12.5")}>{v}</dd>
            </div>
          ))}
          {f.portal && (
            <div className="flex min-h-[36px] items-center justify-between gap-3 border-t border-line-soft px-4">
              <dt className="text-muted">Verify</dt>
              <dd>
                <a href={f.portal.href} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">
                  {f.portal.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    );
  };

  const total = all.length;
  const count = all.filter(shown).length;

  return (
    <div className="grid grid-cols-1 gap-5">
      <section aria-label="Documents" className="min-w-0 overflow-hidden rounded-md border-1.5 border-line bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-3 py-2.5">
          {staff && <Select value={client} onChange={(e) => setClient(e.target.value)} options={CLIENTS.map((c) => ({ value: c.id, label: c.name.replace(/ (India )?Pvt Ltd$/, "") }))} aria-label="Client" />}
          <label className="flex h-[34px] min-w-[140px] flex-1 items-center gap-2 rounded-md border border-line bg-surface px-2.5 sm:max-w-[300px]">
            <Search size={14} strokeWidth={1.6} className="flex-none text-muted" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter documents" aria-label="Filter documents" className="h-full min-w-0 flex-1 bg-transparent text-13 outline-none placeholder:text-faint" />
            <span className="flex-none font-mono text-12 text-faint">
              {count}/{total}
            </span>
          </label>
          <button type="button" aria-pressed={status} onClick={() => setStatus((v) => !v)} className={cn("inline-flex h-[34px] items-center gap-2 rounded-md border px-2.5 text-12.5 font-semibold", status ? "border-accent-line bg-accent-soft text-accent" : "border-line text-ink-2 hover:bg-raised")}>
            <span className="flex gap-0.5" aria-hidden>
              <i className="h-1.5 w-1.5 rounded-[2px] bg-accent" />
              <i className="h-1.5 w-1.5 rounded-[2px] bg-accent" />
              <i className="h-1.5 w-1.5 rounded-[2px] bg-brand" />
            </span>
            Status
          </button>
          <button type="button" aria-pressed={hid} onClick={() => setHid((v) => !v)} className={cn("inline-flex h-[34px] items-center gap-2 rounded-md border px-2.5 text-12.5 font-semibold", hid ? "border-accent-line bg-accent-soft text-accent" : "border-line text-ink-2 hover:bg-raised")}>
            <EyeOff size={14} strokeWidth={1.6} /> Replaced
          </button>
          <Tabs
            items={[
              { key: "step", label: "By step" },
              { key: "cat", label: "By category" },
            ]}
            value={view}
            onChange={(v) => setView(v as "step" | "cat")}
          />
          <Button size="sm" className="ml-auto h-[34px]" onClick={() => zip("Northwind documents", all.filter((f) => f.status !== "Missing" && !f.hidden).length)} disabled={total === 0}>
            <Download size={15} strokeWidth={1.6} /> Download all (ZIP)
          </Button>
          <Button size="sm" className="h-[34px]" variant="primary" onClick={() => setUpload({ open: true, id: missing[0]?.id })}>
            <Upload size={15} strokeWidth={1.6} /> {missing.length ? `Upload · ${missing.length} requested` : "Upload"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[440px_minmax(0,1fr)]">
          <div role="tree" aria-label="Folders and files" className="min-w-0 py-2 md:border-r md:border-line-soft">
            {total === 0 ? (
              <div className="grid justify-items-center gap-3 px-4 py-12 text-center">
                <span className="text-14 font-semibold">No documents yet</span>
                <Button variant="primary" size="sm" onClick={() => setUpload({ open: true })}>
                  <Upload size={15} strokeWidth={1.6} /> Upload a document
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="grid justify-items-center gap-3 px-4 py-10 text-center">
                <span className="text-13.5 font-semibold">No document matches “{q.trim()}”</span>
                <Button size="sm" onClick={() => setQ("")}>
                  Clear filter
                </Button>
              </div>
            ) : (
              rows
            )}
          </div>
          <aside className="hidden min-w-0 md:block" aria-label="Preview">
            {selFile ? pane(selFile) : <p className="p-5 text-13 text-faint">—</p>}
          </aside>
        </div>
      </section>

      <UploadDialog open={upload.open} onOpenChange={(v) => setUpload((u) => ({ ...u, open: v }))} requests={requests} initialId={upload.id} onUpload={onUploaded} />
      {toast.node}
    </div>
  );
}
