"use client";
import * as React from "react";
import Link from "next/link";
import { Check, Download, Eye } from "lucide-react";
import { cn } from "@/lib/cn";
import { MOA_PREVIEW, PACK, PACK_CLIENT, PACK_STATE, type PackDoc } from "@/data/staff-doc-pack";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Bar } from "@/components/ui/Bar";
import { useUndoToast } from "@/components/ui/UndoToast";
import { clientHref, stepHrefFor, type StaffPortal } from "./parts";

// Staff Documents: the pre-incorporation document pack, as in reference/old-screens/s/lead/Documents.dc.html.
// Ready, needs inputs and waiting counts; Part A and Part B tabs; a preview of the picked document.

const all = PACK.flatMap((p) => p.docs);
const ready = all.filter((x) => x.state === "ready");
const needs = all.filter((x) => x.state === "needs" || x.state === "missing");
const waiting = all.filter((x) => x.state === "waiting");

/** The missing row is hatched, as in the old pack. */
const HATCH: React.CSSProperties = { backgroundImage: "repeating-linear-gradient(135deg, var(--surface) 0 8px, var(--raised) 8px 16px)" };

function DocRow({ doc, picked, onPreview, onDownload }: { doc: PackDoc; picked: boolean; onPreview: () => void; onDownload: () => void }) {
  const s = PACK_STATE[doc.state];
  const missing = doc.state === "missing";
  return (
    <div
      className={cn("grid grid-cols-[4px_36px_minmax(0,1fr)_auto] items-center gap-3 border-t border-line py-2.5 pr-4 md:grid-cols-[4px_36px_minmax(0,1fr)_130px_150px_68px]", picked && !missing && "bg-accent-soft")}
      style={missing ? HATCH : undefined}
    >
      <span className={cn("self-stretch", doc.type === "DOCX" ? "bg-accent" : "bg-bad")} aria-hidden />
      <span className={cn("grid h-10 w-[34px] place-items-center rounded-sm font-mono text-[8.5px] font-semibold", missing ? "border border-dashed border-faint text-faint" : "bg-raised text-muted")}>{doc.type}</span>
      <span className="min-w-0">
        <b className="block truncate text-13 font-semibold">{doc.title}</b>
        <span className="block truncate text-11.5 text-muted">{doc.sub}</span>
        <span className="mt-1 block md:hidden">
          <Chip tone={s.tone}>{s.label}</Chip>
        </span>
      </span>
      <span className="hidden truncate font-mono text-11 text-muted md:block">{doc.meta}</span>
      <span className="hidden md:block">
        <Chip tone={s.tone}>{s.label}</Chip>
      </span>
      <span className="flex gap-1">
        <Button size="iconSm" variant="outline" aria-label={`Preview ${doc.title}`} title="Preview" onClick={onPreview}>
          <Eye size={14} strokeWidth={1.6} />
        </Button>
        <Button size="iconSm" variant="outline" aria-label={`Download ${doc.title} as Word`} title="Download as Word" disabled={missing} onClick={onDownload}>
          <Download size={14} strokeWidth={1.6} />
        </Button>
      </span>
    </div>
  );
}

function Preview({ doc, portal, onDownload }: { doc: PackDoc; portal: StaffPortal; onDownload: () => void }) {
  const s = PACK_STATE[doc.state];
  const moa = doc.id === "moa";
  return (
    <section className="grid gap-2.5 rounded-md border-1.5 border-line bg-surface p-3.5" aria-label="Preview">
      <div className="flex items-center gap-2">
        <b className="text-13 font-semibold">Preview</b>
        <Chip tone={s.tone}>{s.label}</Chip>
        <span className="ml-auto truncate text-11.5 text-muted">{moa ? `MOA · page 1 of ${MOA_PREVIEW.pages}` : `${doc.title} · page 1`}</span>
      </div>
      <div className="flex justify-center rounded-md bg-raised p-4">
        <div className="h-[400px] w-full max-w-[300px] overflow-hidden bg-white px-[26px] py-7 text-[10.5px] leading-normal text-navy" style={{ fontFamily: "Tinos, 'Times New Roman', serif" }}>
          {moa ? (
            <>
              <div className="text-center font-bold">
                {MOA_PREVIEW.head.map((h) => (
                  <div key={h}>{h}</div>
                ))}
              </div>
              {MOA_PREVIEW.body.map((p) => (
                <p key={p} className="mt-2.5">
                  {p}
                </p>
              ))}
            </>
          ) : (
            <div className="text-center font-bold">
              <div>NORTHWIND TECHNOLOGIES INDIA PRIVATE LIMITED</div>
              <div className="mt-1">{doc.title.toUpperCase()}</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onDownload}>
          Download as Word
        </Button>
        <Button asChild className="flex-1">
          <Link href={stepHrefFor(portal, PACK_CLIENT, doc.step)}>Open step</Link>
        </Button>
      </div>
    </section>
  );
}

export function DocumentPackScreen({ portal }: { portal: StaffPortal }) {
  const [part, setPart] = React.useState("all");
  const [picked, setPicked] = React.useState("moa");
  const [zipped, setZipped] = React.useState(false);
  const toast = useUndoToast();
  // Same prototype message as "Download Word document" on the board resolution page.
  const download = (x: PackDoc) => toast.show(`Downloads ${x.title} as Word`);
  const doc = all.find((x) => x.id === picked) ?? all[0];
  const parts = PACK.filter((p) => part === "all" || p.id === part);

  React.useEffect(() => {
    if (!zipped) return;
    const t = window.setTimeout(() => setZipped(false), 2000);
    return () => window.clearTimeout(t);
  }, [zipped]);

  return (
    <div className="grid gap-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Tag tone="ok">{ready.length} ready</Tag>
        <Tag tone="warn">{needs.length} need inputs</Tag>
        <Tag>{waiting.length} waiting for release</Tag>
        <Button variant="primary" className="ml-auto" onClick={() => setZipped(true)}>
          {zipped ? <Check size={16} strokeWidth={1.6} /> : <Download size={16} strokeWidth={1.6} />}
          {zipped ? `${ready.length} files in the .zip` : `Download ready (${ready.length}) as .zip`}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Tabs
          items={[{ key: "all", label: "All", count: all.length }, ...PACK.map((p) => ({ key: p.id, label: p.label, count: p.docs.length }))]}
          value={part}
          onChange={setPart}
        />
        <Link href={clientHref(portal, PACK_CLIENT)} className="text-12 font-semibold text-accent hover:underline">
          Not in the pack yet: Proposed Directors →
        </Link>
      </div>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 overflow-hidden rounded-md border-1.5 border-line bg-surface" aria-label="Document pack">
          {parts.map((p, pi) => {
            const done = p.docs.filter((x) => x.state === "ready").length;
            return (
              <div key={p.id}>
                <div className={cn("flex items-center gap-2.5 bg-raised px-4 py-2.5", pi > 0 && "border-t border-line")}>
                  <b className="text-12 font-semibold uppercase tracking-[.07em]">{p.label}</b>
                  <Bar pct={(done / p.docs.length) * 100} tone="ok" className="max-w-[160px] flex-1" />
                  <span className="font-mono text-11 text-muted">
                    {done} of {p.docs.length}
                  </span>
                </div>
                {p.docs.map((x) => (
                  <DocRow key={x.id} doc={x} picked={x.id === doc.id} onPreview={() => setPicked(x.id)} onDownload={() => download(x)} />
                ))}
              </div>
            );
          })}
        </section>
        <Preview doc={doc} portal={portal} onDownload={() => download(doc)} />
      </div>
      {toast.node}
    </div>
  );
}
