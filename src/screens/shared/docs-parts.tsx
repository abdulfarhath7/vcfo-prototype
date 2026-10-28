"use client";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Check, Clock, Download, Eye, FileQuestion, Upload, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt, daysFrom } from "@/lib/dates";
import { NORTHWIND } from "@/data/people";
import { PHASES, STEPS } from "@/data/incorporation";
import { DOC_CATEGORIES, PREVIEWABLE, type DocItem } from "@/data/docs-library";
import { docStatusTone } from "@/data/shared";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { FileBadge } from "@/components/ui/FileBadge";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import type { ActionItem } from "@/components/ui/ActionMenu";
import { Empty } from "@/components/cards/SectionCard";

/* ---------- Tree model ---------- */

export type View = "step" | "cat";

export interface DocNode {
  id: string;
  label: string;
  kind: "phase" | "step" | "cat";
  kids: DocNode[];
  files: DocItem[];
  step?: number;
}

export const isMissing = (f: DocItem) => f.status === "Requested" || f.status === "Sent back";

/** By step: phase, then step, then files. By category: category, then files. */
export function buildTree(docs: DocItem[], view: View): DocNode[] {
  if (view === "cat") {
    return DOC_CATEGORIES.map((c) => ({ id: `c-${c.id}`, label: c.name, kind: "cat" as const, kids: [], files: docs.filter((f) => f.category === c.id) }));
  }
  return PHASES.map((p) => ({
    id: `p${p.n}`,
    label: p.name,
    kind: "phase" as const,
    files: [],
    kids: STEPS.filter((s) => s.phase === p.n && docs.some((f) => f.step === s.n)).map((s) => ({ id: `s${s.n}`, label: `${s.n} · ${s.title}`, kind: "step" as const, step: s.n, kids: [], files: docs.filter((f) => f.step === s.n) })),
  }));
}

export function allFiles(n: DocNode): DocItem[] {
  return [...n.files, ...n.kids.flatMap(allFiles)];
}

/** Received (verified), in review, missing. Replaced files do not count. */
export function progress(files: DocItem[]) {
  const live = files.filter((f) => !f.replaced);
  const ok = live.filter((f) => f.status === "Verified").length;
  const rv = live.filter((f) => f.status === "Received").length;
  const ms = live.filter(isMissing).length;
  return { ok, rv, ms, tot: ok + rv + ms };
}

export function findNode(list: DocNode[], id: string): DocNode | undefined {
  for (const n of list) {
    if (n.id === id) return n;
    const k = findNode(n.kids, id);
    if (k) return k;
  }
  return undefined;
}

export const stepLabel = (n?: number) => {
  const s = STEPS.find((x) => x.n === n);
  return s ? `${s.n} · ${s.title}` : "—";
};

/** Tooltip text for a file's status glyph. */
export function statusTip(f: DocItem) {
  if (f.status === "Verified") return `Done · verified ${fmt(f.date)}`;
  if (f.status === "Received") return `With SBC · in review since ${fmt(f.date)}`;
  if (f.status === "Sent back") return "Sent back · upload a new file";
  return daysFrom(f.date) < 0 ? `Late · was due ${fmt(f.date)}` : `Waiting on Northwind · due ${fmt(f.date)}`;
}

/** Small round status glyph in the tree (old "Status" toggle). */
export function StatusGlyph({ f }: { f: DocItem }) {
  const late = f.status === "Sent back" || (f.status === "Requested" && daysFrom(f.date) < 0);
  const [Icon, cls] =
    f.status === "Verified" ? [Check, "bg-ok-soft text-ok"] : f.status === "Received" ? [Clock, "bg-accent-soft text-accent"] : late ? [AlertTriangle, "bg-bad-soft text-bad"] : [User, "bg-warn-soft text-warn"];
  return (
    <span role="img" title={statusTip(f)} aria-label={statusTip(f)} className={cn("grid h-5 w-5 flex-none place-items-center rounded-sm", cls)}>
      <Icon size={12} strokeWidth={1.75} />
    </span>
  );
}

/** Due chip for a missing file: "Overdue" or "Due 9 Oct". */
export function MissingChip({ f, className }: { f: DocItem; className?: string }) {
  if (f.status === "Sent back") return <Chip tone="bad" className={className}>Sent back</Chip>;
  return daysFrom(f.date) < 0 ? <Chip tone="bad" className={className}>Overdue</Chip> : <Chip tone="warn" className={className}>Due {fmt(f.date)}</Chip>;
}

export function FileMark({ f }: { f: DocItem }) {
  return isMissing(f) && f.status === "Requested" ? (
    <span className="inline-flex h-6 w-11 flex-none items-center justify-center rounded-sm border border-dashed border-line text-faint" aria-label="Not uploaded yet">
      <FileQuestion size={14} strokeWidth={1.6} />
    </span>
  ) : (
    <FileBadge type={f.type} />
  );
}

/** Three-part progress track: verified, in review, missing. */
export function ProgressTrack({ files, className }: { files: DocItem[]; className?: string }) {
  const p = progress(files);
  if (!p.tot) return null;
  return (
    <span className={cn("flex h-1.5 w-16 flex-none overflow-hidden rounded-bar bg-line", className)} aria-hidden>
      <span className="bg-ok-mid" style={{ width: `${(p.ok / p.tot) * 100}%` }} />
      <span className="bg-accent" style={{ width: `${(p.rv / p.tot) * 100}%` }} />
      <span className="bg-warn-mid" style={{ width: `${(p.ms / p.tot) * 100}%` }} />
    </span>
  );
}

/** Sample page. Static grey lines, no motion. The viewer adds a large SAMPLE mark (v7x_doc_viewer). */
export function PaperPage({ f, zoom = 100, page = 1, mark = false }: { f: DocItem; zoom?: number; page?: number; mark?: boolean }) {
  return (
    <span className="relative mx-auto grid aspect-[1/1.3] w-full content-start gap-2 overflow-hidden rounded-md border border-line bg-surface p-5 text-left md:p-7" style={{ maxWidth: Math.round(460 * (zoom / 100)) }}>
      <span className="text-11 font-semibold text-faint">Sample · placeholder page{page > 1 ? ` · page ${page}` : ""}</span>
      <span className="text-16 font-semibold leading-snug">{f.label}</span>
      <span className="text-12 text-muted">
        {NORTHWIND.name} · {fmt(f.date)}
      </span>
      {[92, 80, 86, 64, 88, 72, 50].map((w, i) => (
        <span key={i} className="mt-1 block h-2 rounded-sm bg-raised" style={{ width: `${w}%` }} />
      ))}
      {mark && (
        <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
          <span className="-rotate-[24deg] select-none font-bold tracking-[.18em] text-line" style={{ fontSize: Math.round(64 * (zoom / 100)) }}>
            SAMPLE
          </span>
        </span>
      )}
    </span>
  );
}

/** Explains a file that the browser cannot draw. */
export function NoPreview({ f, onDownload }: { f: DocItem; onDownload?: () => void }) {
  return (
    <div className="grid place-items-center gap-3 rounded-md border border-line bg-surface px-4 py-10 text-center">
      <FileBadge type={f.type} />
      <span className="text-13.5 font-semibold">Preview not available for this file type</span>
      <Button variant="primary" size="sm" onClick={onDownload}>
        <Download size={15} strokeWidth={1.6} /> Download
      </Button>
    </div>
  );
}

/* ---------- Drill: one step or category (docs_a_drill) ---------- */

export function DocDrillDialog({
  node,
  open,
  onOpenChange,
  viewHref,
  incHref,
  onUpload,
  staff,
}: {
  node: DocNode | undefined;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  viewHref: (id: string) => string;
  incHref: string;
  onUpload: (id: string) => void;
  staff: boolean;
}) {
  const [tab, setTab] = React.useState("all");
  React.useEffect(() => {
    if (open) setTab("all");
  }, [open]);
  if (!node) return null;
  const files = allFiles(node).filter((f) => !f.replaced);
  const p = progress(files);
  const pick = (f: DocItem) => tab === "all" || (tab === "ok" ? f.status === "Verified" : tab === "rv" ? f.status === "Received" : isMissing(f));
  const rows = files.filter(pick);
  const phase = node.kind === "step" ? PHASES.find((x) => STEPS.find((s) => s.n === node.step)?.phase === x.n) : undefined;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      flush
      eyebrow={phase ? phase.name : "By category"}
      title={
        <span className="flex items-center gap-2">
          <span className="min-w-0 truncate">{node.label}</span>
          <span className="font-mono text-13 font-medium text-muted">
            {p.ok}/{p.tot}
          </span>
        </span>
      }
      sub={
        node.kind === "step" ? (
          <Link href={incHref} className="font-semibold text-accent hover:underline">
            Open incorporation
          </Link>
        ) : undefined
      }
    >
      <div className="flex items-center border-b border-line-soft px-4 py-2.5 md:px-5">
        <Tabs
          items={[
            { key: "all", label: "All", count: files.length },
            { key: "ok", label: "Verified", count: p.ok },
            { key: "rv", label: "In review", count: p.rv },
            { key: "ms", label: "Missing", count: p.ms },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        rows.map((f) => (
          <div key={f.id} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13.5 first:border-t-0 md:px-5">
            <FileMark f={f} />
            {isMissing(f) ? (
              <span className="min-w-0 flex-1 truncate font-semibold">{f.label}</span>
            ) : (
              <Link href={viewHref(f.id)} className="min-w-0 flex-1 truncate font-semibold hover:underline">
                {f.label}
              </Link>
            )}
            <span className="hidden text-12 text-muted sm:inline">{fmt(f.date)}</span>
            {isMissing(f) ? <MissingChip f={f} /> : <Chip tone={docStatusTone[f.status]}>{f.status}</Chip>}
            {isMissing(f) ? (
              !staff || f.status === "Requested" ? (
                <Button size="iconSm" variant="ghost" aria-label={`Upload ${f.label}`} onClick={() => onUpload(f.id)}>
                  <Upload size={15} strokeWidth={1.6} />
                </Button>
              ) : (
                <span className="w-[30px]" />
              )
            ) : (
              <Button asChild size="iconSm" variant="ghost">
                <Link href={viewHref(f.id)} aria-label={`Preview ${f.label}`}>
                  <Eye size={15} strokeWidth={1.6} />
                </Link>
              </Button>
            )}
          </div>
        ))
      )}
    </Modal>
  );
}

/* ---------- Phone: action sheet and preview sheet (docs_a_mobile_menu, docs_mobile_preview) ---------- */

export function ActionSheet({ title, items, open, onOpenChange }: { title: string; items: ActionItem[]; open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm" flush>
      <div className="py-1">
        {items.map((it, i) =>
          it === "separator" ? (
            <hr key={`s${i}`} className="my-1 border-line-soft" />
          ) : (
            <button
              key={it.label}
              type="button"
              onClick={() => {
                onOpenChange(false);
                it.onSelect?.();
              }}
              className={cn("flex h-11 w-full items-center gap-3 px-4 text-left text-13.5 hover:bg-raised md:px-5", it.danger && "text-bad")}
            >
              <span className="min-w-0 flex-1 truncate">{it.label}</span>
              {it.hint && <span className="font-mono text-11.5 text-faint">{it.hint}</span>}
            </button>
          ),
        )}
      </div>
    </Modal>
  );
}

export function PreviewSheet({ f, open, onOpenChange, viewHref, onDownload }: { f: DocItem | undefined; open: boolean; onOpenChange: (v: boolean) => void; viewHref: (id: string) => string; onDownload: () => void }) {
  if (!f) return null;
  const can = PREVIEWABLE.has(f.type);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={f.label}
      size="md"
      sub={
        <>
          <Chip tone={docStatusTone[f.status]}>{f.status}</Chip>
          <OwnerChip owner={f.from} label={f.from === "client" ? "Northwind" : undefined} />
          <span className="">{fmt(f.date)}</span>
        </>
      }
      footer={
        <>
          <Button asChild>
            <Link href={viewHref(f.id)}>Open</Link>
          </Button>
          <Button variant="primary" onClick={onDownload}>
            <Download size={15} strokeWidth={1.6} /> Download
          </Button>
        </>
      }
    >
      <div className="grid gap-2 bg-raised p-3">
        {can ? <PaperPage f={f} /> : <NoPreview f={f} onDownload={onDownload} />}
        {can && <span className="text-center font-mono text-11.5 text-faint">Page 1 of {f.pages ?? 1}</span>}
      </div>
    </Modal>
  );
}
