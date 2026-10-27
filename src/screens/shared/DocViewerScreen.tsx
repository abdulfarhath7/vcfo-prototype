"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Link2, Minus, Plus, X } from "lucide-react";
import { fmt } from "@/lib/dates";
import { docStatusTone } from "@/data/shared";
import { docsFor, findDoc, PREVIEWABLE } from "@/data/docs-library";
import { useClientState } from "@/components/shell/ClientState";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { FileBadge } from "@/components/ui/FileBadge";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { Cols, Col } from "@/components/shell/Page";
import { NoPreview, PaperPage, stepLabel } from "./docs-parts";
import type { Portal } from "@/data/nav";

const ZOOMS = [50, 75, 100, 125, 150, 200];

/** Shared document viewer (v7x_doc_viewer). Previous and next file, pages, zoom, Esc closes. No back link (R-09). */
export function DocViewerScreen({ portal, id }: { portal: Portal; id: string }) {
  const router = useRouter();
  const { incorporated } = useClientState();
  const base = portal === "client" ? "/client" : `/${portal}`;
  const f = findDoc(id);
  const seq = docsFor(incorporated).filter((x) => x.status !== "Requested" && !x.replaced);
  const pos = Math.max(0, seq.findIndex((x) => x.id === f.id));
  const prev = seq[(pos - 1 + seq.length) % seq.length];
  const next = seq[(pos + 1) % seq.length];
  const [zoom, setZoom] = React.useState(100);
  const [page, setPage] = React.useState(1);
  const pages = f.pages ?? 1;
  const can = PREVIEWABLE.has(f.type) && f.status !== "Requested";
  const toast = useUndoToast();
  const stepHref = portal === "client" ? `/client/incorporation/step/${f.step}` : `/${portal}/clients/northwind/step/${f.step}`;
  const same = seq.filter((x) => x.step === f.step && x.id !== f.id).slice(0, 5);
  const close = React.useCallback(() => router.push(`${base}/documents`), [router, base]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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

  return (
    <Cols>
      <Col>
        <SectionCard bare title={f.label} bodyClassName="p-0">
          <div className="flex min-h-head flex-wrap items-center gap-3 border-b border-line-soft px-4 py-2 md:px-5">
            <FileBadge type={f.type} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-13.5 font-medium">{f.fileName === "-" ? f.name : f.fileName}</span>
              <span className="block truncate text-12 text-muted">
                From {fromLabel} · {fmt(f.date)} {f.date.getFullYear()}
                {f.size && ` · ${f.size}`}
              </span>
            </span>
            <Chip tone={docStatusTone[f.status]} className="hidden sm:inline-flex">
              {f.status}
            </Chip>
            <span className="font-mono text-12 text-muted" aria-label={`File ${pos + 1} of ${seq.length}`}>
              {pos + 1} / {seq.length}
            </span>
            <Button
              size="iconSm"
              aria-label="Copy link"
              onClick={() => {
                try {
                  void navigator.clipboard?.writeText(window.location.href);
                } catch {}
                toast.show("Link copied");
              }}
            >
              <Link2 size={15} strokeWidth={1.5} />
            </Button>
            <Button size="sm" variant="primary" onClick={download}>
              <Download size={15} strokeWidth={1.5} /> Download
            </Button>
            <Button size="iconSm" variant="ghost" onClick={close} aria-label="Close preview (Esc)" title="Close (Esc)">
              <X size={16} strokeWidth={1.5} />
            </Button>
          </div>

          <div className="relative grid min-h-[60vh] place-items-center overflow-auto bg-raised px-3 py-6 md:px-14">
            {can ? <PaperPage f={f} zoom={zoom} page={page} /> : <div className="w-full max-w-[420px]"><NoPreview f={f} onDownload={download} /></div>}
            <Link href={`${base}/documents/view/${prev.id}`} aria-label="Previous document" className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink md:grid">
              <ChevronLeft size={18} strokeWidth={1.5} />
            </Link>
            <Link href={`${base}/documents/view/${next.id}`} aria-label="Next document" className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink md:grid">
              <ChevronRight size={18} strokeWidth={1.5} />
            </Link>
          </div>

          {can && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-2 md:px-5">
              <Button size="iconSm" variant="ghost" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={15} strokeWidth={1.5} />
              </Button>
              <span className="font-mono text-12 text-muted">
                Page {page} / {pages}
                <span className="md:hidden"> · swipe</span>
              </span>
              <Button size="iconSm" variant="ghost" aria-label="Next page" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={15} strokeWidth={1.5} />
              </Button>
              <span className="ml-auto flex items-center gap-1">
                <Button size="iconSm" variant="ghost" aria-label="Zoom out" disabled={zoom <= ZOOMS[0]} onClick={() => setZoom((z) => ZOOMS[Math.max(0, ZOOMS.indexOf(z) - 1)])}>
                  <Minus size={15} strokeWidth={1.5} />
                </Button>
                <button type="button" onClick={() => setZoom(100)} className="h-[30px] w-12 rounded-sm font-mono text-12 text-muted hover:bg-raised" aria-label="Reset zoom">
                  {zoom}%
                </button>
                <Button size="iconSm" variant="ghost" aria-label="Zoom in" disabled={zoom >= ZOOMS[ZOOMS.length - 1]} onClick={() => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + 1)])}>
                  <Plus size={15} strokeWidth={1.5} />
                </Button>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-line-soft px-4 py-2 md:hidden">
            <Button asChild size="sm">
              <Link href={`${base}/documents/view/${prev.id}`}>
                <ChevronLeft size={15} strokeWidth={1.5} /> Previous
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`${base}/documents/view/${next.id}`}>
                Next <ChevronRight size={15} strokeWidth={1.5} />
              </Link>
            </Button>
          </div>
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="Details">
          <KeyValue
            cols={1}
            rows={[
              { k: "From", v: <OwnerChip owner={f.from} label={f.from === "client" ? "Northwind" : undefined} /> },
              { k: "Status", v: <Chip tone={docStatusTone[f.status]}>{f.status}</Chip> },
              { k: "Date", v: <span className="font-mono">{fmt(f.date)}</span> },
              { k: "File", v: f.fileName === "-" ? "—" : f.fileName, mono: f.fileName !== "-" },
              { k: "Size", v: f.size || "—" },
              { k: "Step", v: f.step ? <Link href={stepHref} className="font-semibold text-accent hover:underline">{stepLabel(f.step)}</Link> : "—" },
              ...(f.portal ? [{ k: "Verify", v: <a href={f.portal.href} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">{f.portal.label}<span className="sr-only"> (opens in a new tab)</span></a> }] : []),
            ]}
          />
        </SectionCard>
        {same.length > 0 && (
          <SectionCard title="Same step" flush>
            {same.map((r) => (
              <ListRow key={r.id} href={`${base}/documents/view/${r.id}`}>
                <FileBadge type={r.type} />
                <span className="min-w-0 flex-1 truncate font-semibold">{r.label}</span>
                <span className="font-mono text-12 text-muted">{fmt(r.date)}</span>
              </ListRow>
            ))}
          </SectionCard>
        )}
      </Col>
      {toast.node}
    </Cols>
  );
}
