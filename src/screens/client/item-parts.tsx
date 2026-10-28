"use client";
import * as React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { DOC_STATUS_TONE, type ItemDoc } from "@/data/registrations";
import type { ThreadStep } from "@/components/cards/Thread";
import type { FactRow } from "@/components/cards/EditableFacts";
import { SectionCard, Empty } from "@/components/cards/SectionCard";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StepMark } from "@/components/ui/StepMark";
import { Input } from "@/components/ui/Input";
import { useUndoToast } from "@/components/ui/UndoToast";
import { UploadModal } from "./comp-parts";

// Record page parts of the old client item page (reference/old-screens/s/home/Item.dc.html).

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** R-28: Roboto Mono only for identifiers. A row is an identifier when its label names one and its value looks like one. */
export function isIdentifier(k: string, v: string) {
  return /(TRN|ARN|SRN|GSTIN|CIN|PAN|TAN|DIN|LEI|UIN|\bID\b|number|code$|Challan|Reference)/i.test(k) && /\d/.test(v) && /^[A-Z0-9][A-Z0-9-]{5,}$/i.test(v.trim());
}

export interface BandFact {
  k: string;
  v: React.ReactNode;
  tone?: "bad";
}

/**
 * Plain record head (R-02): 28 px title, a muted meta line, the status chips, key facts in one row. People and the one main action on the right.
 * Replaces the old deadline band and its progress ring.
 */
export function ItemBand({
  title,
  sub,
  chips,
  facts,
  people,
  action,
}: {
  title: string;
  sub: React.ReactNode;
  chips?: React.ReactNode;
  facts: BandFact[];
  people?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex min-w-0 flex-wrap items-start gap-x-6 gap-y-4" aria-label={title}>
      <div className="min-w-0 flex-[1_1_320px]">
        <h1 className="text-24 font-medium leading-tight tracking-[-0.01em] md:text-28">{title}</h1>
        <p className="mt-1 text-14 text-muted">{sub}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          {chips}
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-13.5">
            {facts.map((f) => (
              <div key={f.k} className="flex items-baseline gap-1.5">
                <dt className="text-muted">{f.k}</dt>
                <dd className={cn("font-medium text-ink", f.tone === "bad" && "text-bad")}>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="flex flex-none items-center gap-3">
        {people}
        {action}
      </div>
    </header>
  );
}

/**
 * Steps of a record as ST5 (R-22): done steps a green square with a tick and their date, the live step a ring with a halo on a tinted row,
 * later steps a dashed square without dates (C-0021). Who acts (the authority or SBC) shows on each step.
 */
export function SideThread({
  steps,
  authority,
  client = "Northwind",
  nextSub,
}: {
  steps: ThreadStep[];
  authority: string;
  /** Kept for the callers; the side label is now part of each step line. */
  authLabel?: string;
  client?: string;
  nextSub?: string;
}) {
  const next = steps.findIndex((s) => s.state !== "done");
  const isAuth = (s: ThreadStep) => s.owner === undefined && (s.state === "upcoming" || s.by === authority || !!s.by?.startsWith("With "));
  return (
    <ol className="-mx-4 md:-mx-5">
      {steps.map((s, i) => {
        const now = i === next;
        const later = next >= 0 && i > next;
        const done = s.state === "done";
        const waitClient = now && s.owner === "client";
        const holder = waitClient ? client : isAuth(s) ? authority : "SBC";
        const sub = now ? (waitClient ? (s.note ?? s.by) : (nextSub ?? s.by)) : later ? undefined : s.by;
        const last = i === steps.length - 1;
        return (
          <li key={s.id} className={cn("relative grid grid-cols-[22px_minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-2.5 md:px-5", now && "bg-hover")}>
            {!last && <span className={cn("absolute left-[26px] top-[34px] h-[calc(100%-24px)] w-[1.5px] md:left-[30px]", done ? "bg-ok-mid" : "bg-line")} aria-hidden />}
            <StepMark state={done ? "done" : now ? "now" : "next"} tone={waitClient ? "teal" : "prog"} label={done ? "Done" : now ? "Now" : "Upcoming"} className="relative" />
            <span className="min-w-0">
              <b className={cn("block truncate text-14 font-medium", later && "font-normal text-muted")}>{s.title}</b>
              {now ? (
                <small className={cn("block truncate text-12.5", waitClient ? "text-teal" : "text-accent")}>
                  With {holder}
                  {sub && <span className="text-muted"> · {sub}</span>}
                </small>
              ) : (
                sub && <small className="block truncate text-12.5 text-muted">{sub}</small>
              )}
            </span>
            <span className="pt-0.5 text-right text-12.5 text-muted">
              {done && s.date ? (
                <>
                  {WD[s.date.getDay()]} {fmt(s.date)}
                </>
              ) : now ? (
                <span className="font-medium text-accent">
                  {WD[TODAY.getDay()]} · Today
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function docSub(x: ItemDoc, by: string) {
  if (x.status === "Not asked yet")
    return x.note ?? "SBC will ask when this starts";
  if (x.status === "Accepted")
    return x.from === "client"
      ? `Accepted by ${by}${x.date ? ` · ${fmt(x.date)}` : ""}`
      : `${x.fromLabel ?? "SBC"}${x.date ? ` · ${fmt(x.date)}` : ""}`;
  if (x.status === "To review") return "Uploaded · SBC reviews it next";
  return x.note ?? (x.status === "Asked" ? "Asked by SBC" : x.status);
}

/**
 * From the client (old from-client card): the documents, then the details the client fills.
 * The details are inputs until SBC files. Submit details sends them to SBC.
 */
export function FromClientCard({
  docs,
  rows,
  editable,
  by,
  onUpload,
  onSubmit,
}: {
  docs: ItemDoc[];
  rows: FactRow[];
  editable: boolean;
  by: string;
  onUpload: (n: number) => void;
  onSubmit: (rows: FactRow[]) => void;
}) {
  const [draft, setDraft] = React.useState<string[]>(() =>
    rows.map((r) => (r.v === "-" ? "" : r.v)),
  );
  const [sent, setSent] = React.useState(false);
  const [upload, setUpload] = React.useState(false);
  const toast = useUndoToast();
  const asked = docs
    .filter((x) => x.status === "Asked" || x.status === "Sent back")
    .map((x) => x.name);
  return (
    <SectionCard
      title="From the client"
      meta={
        docs.length
          ? `${docs.filter((x) => x.status === "Accepted").length} of ${docs.length} accepted`
          : undefined
      }
      flush
    >
      {docs.map((x) => {
        const ask = x.status === "Asked" || x.status === "Sent back";
        return (
          <div
            key={x.id}
            className="flex min-h-[52px] items-center gap-3 border-t border-line-soft px-4 py-2 first:border-t-0 md:px-5"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-14 font-medium">
                {x.name}
              </span>
              <span
                className={cn(
                  "block truncate text-12.5 text-muted",
                  x.status === "Sent back" && "text-bad",
                )}
              >
                {docSub(x, by)}
              </span>
            </span>
            <Chip
              tone={DOC_STATUS_TONE[x.status]}
              fixed
              className="hidden sm:inline-flex"
            >
              {x.status}
            </Chip>
            <span className="flex w-[76px] flex-none justify-end">
              {ask ? (
                <Button size="sm" onClick={() => setUpload(true)}>
                  Upload
                </Button>
              ) : x.status === "Accepted" ? (
                <Button
                  size="iconSm"
                  variant="ghost"
                  aria-label={`Download ${x.name}`}
                  onClick={() => toast.show(`Downloaded ${x.name}`)}
                >
                  <Download size={16} strokeWidth={1.6} />
                </Button>
              ) : null}
            </span>
          </div>
        );
      })}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
          onSubmit(rows.map((r, i) => ({ ...r, v: draft[i] || "-" })));
        }}
      >
        {rows.map((r, i) => (
          <label
            key={r.k}
            className="grid min-w-0 gap-1 border-t border-line-soft px-4 py-2.5 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center sm:gap-4 md:px-5"
          >
            <span className="text-13 text-muted">{r.k}</span>
            {editable ? (
              <Input
                value={draft[i] ?? ""}
                onChange={(e) => {
                  setSent(false);
                  setDraft((d) =>
                    d.map((v, j) => (j === i ? e.target.value : v)),
                  );
                }}
                className={cn(r.mono && "font-mono")}
              />
            ) : (
              <b
                className={cn(
                  "min-w-0 break-words text-14 font-medium",
                  r.mono && "font-mono text-13.5",
                  r.v === "-" && "text-faint",
                )}
              >
                {r.v}
              </b>
            )}
          </label>
        ))}
        {editable && rows.length > 0 && (
          <div className="flex justify-end border-t border-line-soft px-4 py-3 md:px-5">
            <Button
              type="submit"
              variant={sent ? "soft" : "primary"}
              disabled={sent}
            >
              {sent ? "Submitted" : "Submit details"}
            </Button>
          </div>
        )}
      </form>
      <UploadModal
        open={upload}
        onOpenChange={setUpload}
        requested={asked}
        onDone={onUpload}
      />
      {toast.node}
    </SectionCard>
  );
}

/** Filled by SBC (old filled-by-sbc card): read-only label and value rows. */
export function SbcFieldsCard({ rows }: { rows: FactRow[] }) {
  return (
    <SectionCard title="Filled by SBC" meta="Read only" flush>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        rows.map((r) => (
          <div
            key={r.k}
            className="grid min-h-[44px] grid-cols-[150px_minmax(0,1fr)] items-center gap-4 border-t border-line-soft px-4 py-2 first:border-t-0 sm:grid-cols-[190px_minmax(0,1fr)] md:px-5"
          >
            <span className="text-13 text-muted">{r.k}</span>
            <span
              className={cn(
                "min-w-0 break-words text-14 font-medium",
                r.mono && "font-mono text-13.5",
                r.v === "-" && "text-faint",
              )}
            >
              {r.v}
            </span>
          </div>
        ))
      )}
    </SectionCard>
  );
}

/** A small text card of the right rail: About, Applies because, Renewal, Due rule. */
export function TextCard({
  title,
  children,
  sop,
}: {
  title: string;
  children: React.ReactNode;
  sop?: boolean;
}) {
  return (
    <SectionCard title={title}>
      <p className="text-13.5 text-ink-2">
        {children}
        {sop && (
          <>
            {" "}
            <Link
              href="/client/library"
              className="font-medium text-accent hover:underline"

            >
              Read the SBC SOP
            </Link>
          </>
        )}
      </p>
    </SectionCard>
  );
}
