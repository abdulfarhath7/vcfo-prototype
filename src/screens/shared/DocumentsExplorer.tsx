"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight, Download, Eye, MoreHorizontal, Search, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { CLIENTS } from "@/data/people";
import { docStatusTone } from "@/data/shared";
import { docsFor, PREVIEWABLE, type DocItem } from "@/data/docs-library";
import { useClientState } from "@/components/shell/ClientState";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { ActionMenu, type ActionItem } from "@/components/ui/ActionMenu";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useUndoToast } from "@/components/ui/UndoToast";
import { KeyValue } from "@/components/cards/KeyValue";
import { SectionCard } from "@/components/cards/SectionCard";
import { UploadDialog, type UploadRequest } from "@/components/cards/UploadDialog";
import {
  ActionSheet,
  DocDrillDialog,
  FileMark,
  MissingChip,
  PaperPage,
  NoPreview,
  PreviewSheet,
  ProgressTrack,
  StatusGlyph,
  allFiles,
  buildTree,
  findNode,
  isMissing,
  progress,
  stepLabel,
  type DocNode,
  type View,
} from "./docs-parts";
import type { Portal } from "@/data/nav";

const LOAD_MS = 300;

function matches(f: DocItem, q: string) {
  const s = q.trim().toLowerCase();
  return !s || f.label.toLowerCase().includes(s) || f.fileName.toLowerCase().includes(s);
}

/** Keep only branches that hold a visible file. */
function prune(nodes: DocNode[], keep: (f: DocItem) => boolean): DocNode[] {
  return nodes
    .map((n) => ({ ...n, files: n.files.filter(keep), kids: prune(n.kids, keep) }))
    .filter((n) => n.files.length > 0 || n.kids.length > 0);
}

function nodeIds(nodes: DocNode[]): string[] {
  return nodes.flatMap((n) => [n.id, ...nodeIds(n.kids)]);
}

/**
 * Documents (client) and Vault (staff). docs_a_refined: one tree by step or by category, a preview pane,
 * status glyphs, replaced files, drill per folder, ZIP and link toasts, upload dialog.
 * C-0025: no flicker. R-41: the only motion is the 300 ms skeleton when a folder opens.
 */
export function DocumentsExplorer({ portal, title = "Documents" }: { portal: Portal; title?: string }) {
  const staff = portal !== "client";
  const { incorporated } = useClientState();
  const base = portal === "client" ? "/client" : `/${portal}`;
  const incHref = portal === "client" ? "/client/incorporation" : `/${portal}/clients/northwind`;
  const stepHref = (n?: number) => (n ? (portal === "client" ? `/client/incorporation/step/${n}` : `/${portal}/clients/northwind/step/${n}`) : incHref);
  const viewHref = (id: string) => `${base}/documents/view/${id}`;

  const [client, setClient] = React.useState(CLIENTS[0].id);
  const [view, setView] = React.useState<View>("step");
  const [q, setQ] = React.useState("");
  const [showStatus, setShowStatus] = React.useState(true);
  const [showReplaced, setShowReplaced] = React.useState(false);
  const [filter, setFilter] = React.useState("all");
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(["p2", "s7", "s8"]));
  const [loading, setLoading] = React.useState<string | null>(null);
  const [selId, setSelId] = React.useState<string>("f8");
  const [overrides, setOverrides] = React.useState<Record<string, Partial<DocItem>>>({});
  const [upload, setUpload] = React.useState<{ open: boolean; id?: string }>({ open: false });
  const [drill, setDrill] = React.useState<string | null>(null);
  const [path, setPath] = React.useState<string[]>([]);
  const [sheet, setSheet] = React.useState<{ title: string; items: ActionItem[] } | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const toast = useUndoToast();

  // Only Northwind has sample files. Other clients show the empty state (docs_a_empty).
  const docs = React.useMemo(() => (client === CLIENTS[0].id ? docsFor(incorporated).map((f) => ({ ...f, ...overrides[f.id] })) : []), [client, incorporated, overrides]);
  const live = docs.filter((f) => !f.replaced);
  const visible = (f: DocItem) =>
    (showReplaced || !f.replaced) &&
    matches(f, q) &&
    (filter === "all" || (filter === "missing" ? isMissing(f) : filter === "review" ? f.status === "Received" : f.status === "Verified"));
  const fullTree = React.useMemo(() => buildTree(docs, view), [docs, view]);
  const tree = React.useMemo(() => (q || filter !== "all" ? prune(fullTree, visible) : fullTree.map((n) => ({ ...n, files: n.files.filter(visible), kids: n.kids.map((k) => ({ ...k, files: k.files.filter(visible) })) }))),
    // visible depends on the filter state listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fullTree, q, filter, showReplaced],
  );
  const shownCount = tree.flatMap(allFiles).filter((f) => !f.replaced).length;
  const missing = live.filter(isMissing);
  const sel = docs.find((f) => f.id === selId) ?? live[0];
  const searching = q.trim() !== "" || filter !== "all";

  // R-41: one calm motion moment. A folder shows a skeleton for 300 ms when it opens.
  React.useEffect(() => {
    if (!loading) return;
    const h = window.setTimeout(() => setLoading(null), LOAD_MS);
    return () => window.clearTimeout(h);
  }, [loading]);

  const toggle = (id: string) => {
    const opening = !open.has(id);
    setOpen((s) => {
      const n = new Set(s);
      if (opening) n.add(id);
      else n.delete(id);
      return n;
    });
    if (opening) setLoading(id);
  };

  const zip = (name: string, count: number) => {
    toast.show(`Preparing ${name}.zip…`);
    window.setTimeout(() => toast.show(`Downloaded ${name}.zip · ${count} files`), 900);
  };
  const copy = (href: string) => {
    try {
      void navigator.clipboard?.writeText(`${window.location.origin}${href}`);
    } catch {}
    toast.show("Link copied");
  };
  const download = (f: DocItem) => toast.show(`Downloaded ${f.fileName}`);

  const requests: UploadRequest[] = missing.map((f) => ({ id: f.id, name: f.label, due: f.status === "Requested" ? f.date : undefined, sentBack: f.status === "Sent back", note: f.note, noteBy: f.note ? "BH" : undefined }));
  const onUploaded = (id: string | undefined, files: Array<{ name: string }>) => {
    if (!id || files.length === 0) return;
    const before = overrides[id];
    setOverrides((o) => ({ ...o, [id]: { status: "Received", fileName: files[0].name.toLowerCase(), size: "1 MB", from: "client" } }));
    setSelId(id);
    toast.show(`Uploaded ${files.length === 1 ? files[0].name : `${files.length} files`} · SBC reviews it`, () =>
      setOverrides((o) => {
        const n = { ...o };
        if (before) n[id] = before;
        else delete n[id];
        return n;
      }),
    );
  };

  const groupMenu = (n: DocNode): ActionItem[] => [
    { label: "Download folder as ZIP", hint: String(allFiles(n).filter((f) => !isMissing(f) && !f.replaced).length), onSelect: () => zip(n.label.replace(/^\d+ · /, ""), allFiles(n).filter((f) => !isMissing(f)).length) },
    { label: "Expand all", onSelect: () => setOpen((s) => new Set([...s, n.id, ...nodeIds(n.kids)])) },
    { label: "Collapse all", onSelect: () => setOpen((s) => new Set([...s].filter((x) => x !== n.id && !nodeIds(n.kids).includes(x)))) },
    "separator",
    { label: "Copy link to folder", onSelect: () => copy(`${base}/documents?folder=${n.id}`) },
  ];
  const fileMenu = (f: DocItem): ActionItem[] =>
    isMissing(f)
      ? [
          { label: "Upload", onSelect: () => setUpload({ open: true, id: f.id }) },
          ...(f.step ? [{ label: `Open step ${f.step}`, onSelect: () => (window.location.href = stepHref(f.step)) }] : []),
          "separator",
          { label: "Copy link", onSelect: () => copy(viewHref(f.id)) },
        ]
      : [
          { label: "Download", onSelect: () => download(f) },
          { label: "Preview", onSelect: () => setSelId(f.id) },
          ...(f.step ? [{ label: `Open step ${f.step}`, onSelect: () => (window.location.href = stepHref(f.step)) }] : []),
          "separator",
          { label: "Copy link", onSelect: () => copy(viewHref(f.id)) },
        ];

  /* ---------- Desktop tree rows ---------- */

  const fileRow = (f: DocItem, depth: number) => {
    const on = sel?.id === f.id;
    return (
      <div key={f.id} className={cn("group flex items-center gap-2 border-t border-line-soft pr-2 text-13.5 first:border-t-0 hover:bg-raised", on && "bg-accent-soft hover:bg-accent-soft", f.replaced && "text-muted")}>
        <button type="button" onClick={() => setSelId(f.id)} aria-current={on ? "true" : undefined} className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left" style={{ paddingLeft: 16 + depth * 20 }}>
          <span className="w-4 flex-none" />
          <FileMark f={f} />
          <span className={cn("min-w-0 flex-1 truncate", isMissing(f) ? "font-medium text-ink-2" : "font-semibold", f.replaced && "line-through")}>{f.label}</span>
          {f.stale && <Tag tone="warn">Older than 2 months</Tag>}
          {f.replaced && <Tag>Replaced</Tag>}
          {isMissing(f) && <MissingChip f={f} className="hidden sm:inline-flex" />}
          {showStatus && <StatusGlyph f={f} />}
        </button>
        <ActionMenu label={`More actions for ${f.label}`} items={fileMenu(f)} />
      </div>
    );
  };

  const groupRow = (n: DocNode, depth: number): React.ReactNode => {
    const isOpen = searching || open.has(n.id);
    const files = allFiles(n).filter((f) => !f.replaced);
    const p = progress(files);
    return (
      <React.Fragment key={n.id}>
        <div className={cn("flex items-center gap-2 border-t border-line-soft pr-2 text-13.5 first:border-t-0 hover:bg-raised", depth === 0 && "bg-raised/60")}>
          <button type="button" onClick={() => toggle(n.id)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-2.5 py-2.5 text-left" style={{ paddingLeft: 16 + depth * 20 }}>
            <ChevronRight size={16} strokeWidth={1.5} className={cn("flex-none text-faint transition-transform", isOpen && "rotate-90")} aria-hidden />
            <span className={cn("min-w-0 flex-1 truncate", depth === 0 ? "font-semibold" : "font-medium")}>{n.label}</span>
            {p.ms > 0 && <Chip tone="warn" className="hidden sm:inline-flex">{p.ms} missing</Chip>}
          </button>
          {p.tot > 0 && (
            <button type="button" onClick={() => setDrill(n.id)} className="flex flex-none items-center gap-2 rounded-sm px-1.5 py-1 hover:bg-surface" aria-label={`${p.ok} of ${p.tot} verified. Open the list`}>
              <ProgressTrack files={files} />
              <span className="w-9 text-right font-mono text-12 text-muted">
                {p.ok}/{p.tot}
              </span>
            </button>
          )}
          <ActionMenu label={`More actions for ${n.label}`} items={groupMenu(n)} />
        </div>
        {isOpen &&
          (loading === n.id ? (
            <SkeletonRows rows={Math.min(3, Math.max(1, n.files.length + n.kids.length))} className="border-t border-line-soft" />
          ) : (
            <>
              {n.kids.map((k) => groupRow(k, depth + 1))}
              {n.files.map((f) => fileRow(f, depth + 1))}
            </>
          ))}
      </React.Fragment>
    );
  };

  /* ---------- Preview pane ---------- */

  const pane = (f: DocItem) => {
    const miss = isMissing(f);
    return (
      <div className="grid min-w-0 grid-cols-1 gap-4 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <FileMark f={f} />
          <span className="min-w-0 flex-1 truncate text-14 font-semibold">{f.label}</span>
          {miss ? <MissingChip f={f} /> : <Chip tone={docStatusTone[f.status]}>{f.status}</Chip>}
          {!miss && (
            <>
              <Button asChild size="iconSm" variant="ghost">
                <Link href={viewHref(f.id)} aria-label="Preview">
                  <Eye size={15} strokeWidth={1.5} />
                </Link>
              </Button>
              <Button size="iconSm" variant="ghost" aria-label="Download" onClick={() => download(f)}>
                <Download size={15} strokeWidth={1.5} />
              </Button>
            </>
          )}
        </div>
        {f.status === "Sent back" && f.note && (
          <div className="flex items-start gap-2.5 rounded-md bg-bad-soft px-3 py-2.5 text-13 text-bad">
            <span className="min-w-0">“{f.note}”</span>
          </div>
        )}
        {miss ? (
          <button type="button" onClick={() => setUpload({ open: true, id: f.id })} className="grid aspect-[4/3] place-items-center gap-1 rounded-md border border-dashed border-line bg-raised px-4 text-center hover:border-accent-line">
            <span className="grid justify-items-center gap-1.5">
              <Upload size={18} strokeWidth={1.5} className="text-muted" />
              <span className="text-13.5 font-semibold">
                Drop the file or <span className="text-accent">browse</span>
              </span>
              <span className="font-mono text-11.5 text-faint">PDF · JPG · PNG · DOCX · up to 10 MB</span>
            </span>
          </button>
        ) : PREVIEWABLE.has(f.type) ? (
          <Link href={viewHref(f.id)} className="block rounded-md bg-raised p-3 hover:bg-navy-tint" aria-label="Open in viewer">
            <PaperPage f={f} />
          </Link>
        ) : (
          <NoPreview f={f} onDownload={() => download(f)} />
        )}
        <KeyValue
          cols={2}
          rows={[
            { k: "Step", v: f.step ? <Link href={stepHref(f.step)} className="font-semibold text-accent hover:underline">{stepLabel(f.step)}</Link> : "—" },
            { k: "From", v: <OwnerChip owner={f.from} label={f.from === "client" ? "Northwind" : undefined} /> },
            { k: miss ? "Due" : f.status === "Received" ? "Received" : "Verified", v: <span className="font-mono">{fmt(f.date)}</span> },
            { k: "File", v: f.fileName === "-" ? "—" : f.fileName, mono: f.fileName !== "-" },
            ...(f.size ? [{ k: "Size", v: f.size }] : []),
            ...(f.by ? [{ k: miss ? "Asked by" : "Sent by", v: f.by.replace(/^Asked by /, "") }] : []),
            ...(f.portal ? [{ k: "Verify", v: <a href={f.portal.href} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">{f.portal.label}<span className="sr-only"> (opens in a new tab)</span></a> }] : []),
          ]}
        />
        <div className="flex flex-wrap gap-2">
          {miss ? (
            <Button variant="primary" size="sm" onClick={() => setUpload({ open: true, id: f.id })}>
              <Upload size={15} strokeWidth={1.5} /> Upload
            </Button>
          ) : (
            <Button asChild variant="primary" size="sm">
              <Link href={viewHref(f.id)}>Open</Link>
            </Button>
          )}
          {staff && f.status === "Received" && (
            <Button size="sm" onClick={() => setOverrides((o) => ({ ...o, [f.id]: { ...o[f.id], status: "Verified" } }))}>
              Verify
            </Button>
          )}
          {staff && f.status === "Received" && (
            <Button size="sm" onClick={() => setOverrides((o) => ({ ...o, [f.id]: { ...o[f.id], status: "Sent back" } }))}>
              Send back
            </Button>
          )}
        </div>
      </div>
    );
  };

  /* ---------- Empty states (docs_a_empty, no match) ---------- */

  const noDocs = () => (
    <div className="grid justify-items-center gap-3 px-4 py-12 text-center">
      <span className="text-14 font-semibold">No documents yet</span>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" size="sm" onClick={() => setUpload({ open: true })}>
          <Upload size={15} strokeWidth={1.5} /> Upload a document
        </Button>
        <Button asChild size="sm">
          <Link href={incHref}>Open incorporation</Link>
        </Button>
      </div>
    </div>
  );
  const noMatch = () => (
    <div className="grid justify-items-center gap-3 px-4 py-10 text-center">
      <span className="text-13.5 font-semibold">{q.trim() ? <>No document matches “{q.trim()}”</> : "No document in this filter"}</span>
      <Button
        size="sm"
        onClick={() => {
          setQ("");
          setFilter("all");
        }}
      >
        Clear filter
      </Button>
    </div>
  );

  /* ---------- Phone drill-down (docs_a_mobile, docs_a_mobile_menu) ---------- */

  const here = path.length ? findNode(tree, path[path.length - 1]) : undefined;
  const levelNodes = here ? here.kids : tree;
  const levelFiles = here ? here.files : [];
  const crumbs = path.map((id) => findNode(fullTree, id)).filter(Boolean) as DocNode[];

  const phone = () => (
    <div className="md:hidden">
      <nav aria-label="Folder path" className="flex min-w-0 items-center gap-1 overflow-x-auto border-b border-line-soft px-4 py-2 text-12.5 [scrollbar-width:none]">
        <button type="button" onClick={() => setPath([])} className={cn("whitespace-nowrap font-semibold", path.length ? "text-accent" : "text-ink")}>
          {title}
        </button>
        {crumbs.map((c, i) => (
          <React.Fragment key={c.id}>
            <ChevronRight size={13} strokeWidth={1.5} className="flex-none text-faint" aria-hidden />
            <button type="button" onClick={() => setPath(path.slice(0, i + 1))} className={cn("max-w-[180px] truncate whitespace-nowrap font-semibold", i < crumbs.length - 1 ? "text-accent" : "text-ink")}>
              {c.label}
            </button>
          </React.Fragment>
        ))}
      </nav>
      {levelNodes.length === 0 && levelFiles.length === 0 ? (
        docs.length === 0 ? noDocs() : noMatch()
      ) : (
        <>
          {levelNodes.map((n) => {
            const files = allFiles(n).filter((f) => !f.replaced);
            const p = progress(files);
            return (
              <div key={n.id} className="flex items-center gap-2 border-t border-line-soft pr-2 first:border-t-0">
                <button type="button" onClick={() => setPath([...path, n.id])} className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-13.5 font-semibold">{n.label}</span>
                    <span className="mt-1 flex items-center gap-2">
                      <ProgressTrack files={files} />
                      <span className="font-mono text-11.5 text-muted">
                        {p.ok}/{p.tot}
                      </span>
                      {p.ms > 0 && <span className="text-11.5 font-semibold text-warn">{p.ms} missing</span>}
                    </span>
                  </span>
                  <ChevronRight size={16} strokeWidth={1.5} className="flex-none text-faint" aria-hidden />
                </button>
                <Button size="iconSm" variant="ghost" aria-label={`More actions for ${n.label}`} onClick={() => setSheet({ title: n.label, items: groupMenu(n) })}>
                  <MoreHorizontal size={16} strokeWidth={1.5} />
                </Button>
              </div>
            );
          })}
          {levelFiles.map((f) => (
            <div key={f.id} className="flex items-center gap-2 border-t border-line-soft pr-2 first:border-t-0">
              <button type="button" onClick={() => (isMissing(f) ? setUpload({ open: true, id: f.id }) : setPreview(f.id))} className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left">
                <FileMark f={f} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-13.5 font-semibold", f.replaced && "text-muted line-through")}>{f.label}</span>
                  <span className="block truncate font-mono text-11.5 text-muted">
                    {f.status} · {fmt(f.date)}
                  </span>
                </span>
                {showStatus && <StatusGlyph f={f} />}
              </button>
              <Button size="iconSm" variant="ghost" aria-label={`More actions for ${f.label}`} onClick={() => setSheet({ title: f.label, items: fileMenu(f) })}>
                <MoreHorizontal size={16} strokeWidth={1.5} />
              </Button>
            </div>
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard
        title={title}
        meta={staff ? CLIENTS.find((c) => c.id === client)?.short : undefined}
        flush
        right={
          <>
            {staff && <Select value={client} onChange={(e) => setClient(e.target.value)} options={CLIENTS.map((c) => ({ value: c.id, label: c.short }))} aria-label="Client" />}
            <Button size="sm" className="hidden md:inline-flex" onClick={() => zip(`${CLIENTS.find((c) => c.id === client)?.short ?? "Documents"} documents`, live.filter((f) => !isMissing(f)).length)} disabled={live.length === 0}>
              <Download size={15} strokeWidth={1.5} /> Download all (ZIP)
            </Button>
            <Button size="sm" variant="primary" onClick={() => setUpload({ open: true, id: missing[0]?.id })}>
              <Upload size={15} strokeWidth={1.5} /> {missing.length ? `Upload · ${missing.length} requested` : "Upload"}
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-4 py-2.5 md:px-5">
          <label className="flex h-[30px] min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-surface px-2.5 sm:max-w-[320px]">
            <Search size={14} strokeWidth={1.5} className="flex-none text-muted" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter documents" aria-label="Filter documents" className="h-full min-w-0 flex-1 bg-transparent text-12.5 outline-none placeholder:text-faint" />
            <span className="flex-none font-mono text-11.5 text-faint">
              {shownCount}/{live.length}
            </span>
          </label>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Show"
            options={[
              { value: "all", label: "All files" },
              { value: "missing", label: `Missing · ${missing.length}` },
              { value: "review", label: `In review · ${live.filter((f) => f.status === "Received").length}` },
              { value: "verified", label: `Verified · ${live.filter((f) => f.status === "Verified").length}` },
            ]}
          />
          <Button size="sm" variant={showStatus ? "primary" : "outline"} aria-pressed={showStatus} onClick={() => setShowStatus((v) => !v)}>
            Status
          </Button>
          <Button size="sm" variant={showReplaced ? "primary" : "outline"} aria-pressed={showReplaced} onClick={() => setShowReplaced((v) => !v)}>
            Replaced
          </Button>
          <Tabs
            className="ml-auto"
            items={[
              { key: "step", label: "By step" },
              { key: "cat", label: "By category" },
            ]}
            value={view}
            onChange={(v) => {
              setView(v as View);
              setPath([]);
            }}
          />
        </div>

        {phone()}

        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0" aria-label="Folders and files" role="tree">
            {docs.length === 0 ? noDocs() : tree.length === 0 ? noMatch() : tree.map((n) => groupRow(n, 0))}
          </div>
          <aside className="min-w-0 border-l border-line-soft" aria-label="Preview">
            {sel ? pane(sel) : <p className="p-5 text-13 text-faint">—</p>}
          </aside>
        </div>
      </SectionCard>

      <UploadDialog open={upload.open} onOpenChange={(v) => setUpload((u) => ({ ...u, open: v }))} requests={requests} initialId={upload.id} onUpload={onUploaded} />
      <DocDrillDialog
        node={drill ? findNode(fullTree, drill) : undefined}
        open={!!drill}
        onOpenChange={(v) => !v && setDrill(null)}
        viewHref={viewHref}
        incHref={drill ? stepHref(findNode(fullTree, drill)?.step) : incHref}
        onUpload={(id) => {
          setDrill(null);
          setUpload({ open: true, id });
        }}
        staff={staff}
      />
      <ActionSheet title={sheet?.title ?? ""} items={sheet?.items ?? []} open={!!sheet} onOpenChange={(v) => !v && setSheet(null)} />
      <PreviewSheet f={preview ? docs.find((f) => f.id === preview) : undefined} open={!!preview} onOpenChange={(v) => !v && setPreview(null)} viewHref={viewHref} onDownload={() => preview && download(docs.find((f) => f.id === preview)!)} />
      {toast.node}
    </div>
  );
}
