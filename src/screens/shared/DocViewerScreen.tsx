"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Minus, Plus, X } from "lucide-react";
import { fmt } from "@/lib/dates";
import { docsFor, findDoc, PREVIEWABLE } from "@/data/docs-library";
import { TREE_FILES, treeDoc, treeFile } from "@/data/docs-tree";
import { useClientState } from "@/components/shell/ClientState";
import { Button } from "@/components/ui/Button";
import { FileBadge } from "@/components/ui/FileBadge";
import { useUndoToast } from "@/components/ui/UndoToast";
import { NoPreview, PaperPage } from "./docs-parts";
import { DocumentsExplorer } from "./DocumentsExplorer";
import type { Portal } from "@/data/nav";

const ZOOMS = [50, 75, 100, 125, 150, 200];

/** Shared document viewer (v7x_doc_viewer): an overlay over the Documents page. Previous and next file, pages, zoom pill, Esc closes. No back link (R-09). No info icon (R-06). */
export function DocViewerScreen({ portal, id }: { portal: Portal; id: string }) {
  const router = useRouter();
  const { incorporated } = useClientState();
  const base = portal === "client" ? "/client" : `/${portal}`;
  // Files of the Documents tree (docs_a_refined) open in order; other files keep the library order.
  const tf = treeFile(id);
  const f = tf ? treeDoc(tf) : findDoc(id);
  const seq = tf ? TREE_FILES.filter((x) => !x.hidden && x.status !== "Missing").map(treeDoc) : docsFor(incorporated).filter((x) => x.status !== "Requested" && !x.replaced);
  const pos = Math.max(0, seq.findIndex((x) => x.id === f.id));
  const prev = seq[(pos - 1 + seq.length) % seq.length];
  const next = seq[(pos + 1) % seq.length];
  const [zoom, setZoom] = React.useState(100);
  const [page, setPage] = React.useState(1);
  const pages = f.pages ?? 1;
  const can = PREVIEWABLE.has(f.type) && f.status !== "Requested";
  const toast = useUndoToast();
  // Staff open the viewer from Docs › Vault; the client opens it from Documents. Close returns to that page.
  const home = portal === "client" ? "/client/documents" : `/${portal}/docs/vault`;
  const close = React.useCallback(() => router.push(home), [router, home]);

  const dialog = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // aria-modal: Tab stays inside the preview.
      if (e.key === "Tab" && dialog.current) {
        const all = Array.from(dialog.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])')).filter((x) => x.offsetParent !== null);
        if (all.length) {
          const first = all[0];
          const last = all[all.length - 1];
          const inside = dialog.current.contains(document.activeElement);
          if (e.shiftKey && (!inside || document.activeElement === first)) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
            e.preventDefault();
            first.focus();
          }
        }
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") router.push(`${base}/documents/view/${prev.id}`);
      if (e.key === "ArrowRight") router.push(`${base}/documents/view/${next.id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, router, base, prev.id, next.id]);

  const download = () => toast.show(`Downloaded ${f.fileName}`);
  const fromLabel = f.from === "client" ? "Northwind" : f.from === "sbc" ? "SBC" : "MCA";
  const closeBtn = React.useRef<HTMLButtonElement>(null);

  // The overlay owns the screen: the page under it does not scroll, and focus starts on Close.
  React.useEffect(() => {
    closeBtn.current?.focus();
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = was;
    };
  }, []);

  return (
    <>
      {/* The page that opened the viewer stays under the scrim (v7x_doc_viewer). */}
      <div inert aria-hidden>
        <DocumentsExplorer portal={portal} />
      </div>
      <div className="fixed inset-0 z-40 md:left-[248px]">
        <button type="button" tabIndex={-1} aria-label="Close preview" onClick={close} className="absolute inset-0 h-full w-full cursor-default bg-scrim" />
        <div
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label="Document preview"
          className="absolute inset-0 flex flex-col overflow-hidden bg-surface md:inset-x-5 md:bottom-auto md:top-1/2 md:h-[min(720px,calc(100vh-40px))] md:-translate-y-1/2 md:rounded-lg md:border md:border-line"
        >
          <div className="flex min-h-[54px] flex-none flex-wrap items-center gap-3 border-b border-line-soft px-3 py-2 md:px-4">
            <FileBadge type={f.type} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-13.5 font-semibold">{f.fileName === "-" ? f.name : f.fileName}</span>
              <span className="block truncate text-12 text-muted">
                From {fromLabel} · {fmt(f.date)} {f.date.getFullYear()}
                {f.size && ` · ${f.size}`}
              </span>
            </span>
            <span className="text-12 text-muted" aria-label={`File ${pos + 1} of ${seq.length}`}>
              {pos + 1} of {seq.length}
            </span>
            <Button size="sm" onClick={download} aria-label="Download">
              <Download size={15} strokeWidth={1.6} /> <span className="hidden sm:inline">Download</span>
            </Button>
            <Button ref={closeBtn} size="iconSm" onClick={close} aria-label="Close preview (Esc)" title="Close (Esc)">
              <X size={16} strokeWidth={1.6} />
            </Button>
          </div>

          <div className="relative min-h-0 flex-1 overflow-auto bg-raised px-3 pb-20 pt-7 md:px-16">
            {can ? (
              <PaperPage f={f} zoom={zoom} page={page} mark />
            ) : (
              <div className="mx-auto w-full max-w-[420px] pt-10">
                <NoPreview f={f} onDownload={download} />
              </div>
            )}
          </div>
          <Link href={`${base}/documents/view/${prev.id}`} aria-label="Previous document" className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-md border border-line bg-surface text-ink-2 hover:text-ink md:grid">
            <ChevronLeft size={18} strokeWidth={1.6} />
          </Link>
          <Link href={`${base}/documents/view/${next.id}`} aria-label="Next document" className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-md border border-line bg-surface text-ink-2 hover:text-ink md:grid">
            <ChevronRight size={18} strokeWidth={1.6} />
          </Link>

          {can && (
            <div className="absolute bottom-16 left-1/2 flex h-[38px] -translate-x-1/2 items-center gap-1 rounded-md bg-navy px-2 text-12.5 font-semibold text-white md:bottom-4">
              {pages > 1 && (
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="grid h-7 w-6 place-items-center rounded-sm hover:bg-white/[.12] disabled:opacity-40">
                  <ChevronLeft size={14} strokeWidth={1.6} />
                </button>
              )}
              <span className="whitespace-nowrap px-1.5">
                Page {page} / {pages}
              </span>
              {pages > 1 && (
                <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="grid h-7 w-6 place-items-center rounded-sm hover:bg-white/[.12] disabled:opacity-40">
                  <ChevronRight size={14} strokeWidth={1.6} />
                </button>
              )}
              <span className="mx-1 h-4 w-px bg-white/[.25]" aria-hidden />
              <button type="button" aria-label="Zoom out" disabled={zoom <= ZOOMS[0]} onClick={() => setZoom((z) => ZOOMS[Math.max(0, ZOOMS.indexOf(z) - 1)])} className="grid h-7 w-7 place-items-center rounded-sm hover:bg-white/[.12] disabled:opacity-40">
                <Minus size={14} strokeWidth={1.6} />
              </button>
              <button type="button" onClick={() => setZoom(100)} aria-label="Reset zoom" className="h-7 w-12 rounded-sm text-12 hover:bg-white/[.12]">
                {zoom}%
              </button>
              <button type="button" aria-label="Zoom in" disabled={zoom >= ZOOMS[ZOOMS.length - 1]} onClick={() => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + 1)])} className="grid h-7 w-7 place-items-center rounded-sm hover:bg-white/[.12] disabled:opacity-40">
                <Plus size={14} strokeWidth={1.6} />
              </button>
            </div>
          )}
          <div className="flex flex-none items-center justify-between gap-2 border-t border-line-soft bg-surface px-3 py-2 md:hidden">
            <Button asChild size="sm">
              <Link href={`${base}/documents/view/${prev.id}`}>
                <ChevronLeft size={15} strokeWidth={1.6} /> Previous
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`${base}/documents/view/${next.id}`}>
                Next <ChevronRight size={15} strokeWidth={1.6} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      {toast.node}
    </>
  );
}
