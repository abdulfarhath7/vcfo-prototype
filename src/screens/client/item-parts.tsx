"use client";
import * as React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { DOC_STATUS_TONE, type ItemDoc } from "@/data/registrations";
import type { ThreadStep } from "@/components/cards/Thread";
import type { FactRow } from "@/components/cards/EditableFacts";
import { SectionCard } from "@/components/cards/SectionCard";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { useUndoToast } from "@/components/ui/UndoToast";
import { UploadModal } from "./comp-parts";

// Record page parts of the old client item page (reference/old-screens/s/home/Item.dc.html).

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type RingTone = "ok" | "warn" | "bad" | "accent";

const RING: Record<RingTone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  accent: "text-accent",
};

/** Progress ring of the deadline band: "0/6", or a tick when done. */
export function StepRing({
  done,
  total,
  tone,
}: {
  done: number;
  total: number;
  tone: RingTone;
}) {
  const c = 2 * Math.PI * 22;
  const frac = total ? done / total : 0;
  return (
    <span
      className="relative grid h-[52px] w-[52px] flex-none place-items-center"
      title={`${done} of ${total} steps done`}
    >
      <svg
        viewBox="0 0 52 52"
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="26"
          cy="26"
          r="22"
          fill="none"
          strokeWidth="4"
          className="stroke-current text-line-soft"
        />
        {frac > 0 && (
          <circle
            cx="26"
            cy="26"
            r="22"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${frac * c} ${c}`}
            className={cn("stroke-current", RING[tone])}
          />
        )}
      </svg>
      <b className="text-12.5 font-semibold">
        {done === total && total > 0 ? "✓" : `${done}/${total}`}
      </b>
    </span>
  );
}

export interface BandFact {
  k: string;
  v: React.ReactNode;
  tone?: "bad";
}

/** Deadline band (old it-band): ring, name, form line, three facts, people and the one main action. */
export function ItemBand({
  ring,
  title,
  sub,
  facts,
  people,
  action,
}: {
  ring: React.ReactNode;
  title: string;
  sub: React.ReactNode;
  facts: BandFact[];
  people?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <SectionCard
      title={title}
      bare
      bodyClassName="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4 md:px-5"
    >
      <div className="flex min-w-0 flex-[1_1_260px] items-center gap-3.5">
        {ring}
        <div className="min-w-0">
          <h1 className="truncate text-[19px] font-semibold leading-tight tracking-tight">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-12.5 text-muted">{sub}</p>
        </div>
      </div>
      <dl className="flex flex-wrap gap-y-2">
        {facts.map((f) => (
          <div
            key={f.k}
            className="min-w-[120px] border-l border-line-soft px-4"
          >
            <dt className="text-12 text-muted">{f.k}</dt>
            <dd
              className={cn(
                "text-13.5 font-semibold",
                f.tone === "bad" && "text-bad",
              )}
            >
              {f.v}
            </dd>
          </div>
        ))}
      </dl>
      <div className="ml-auto flex items-center gap-3">
        {people}
        {action}
      </div>
    </SectionCard>
  );
}

/**
 * Two-sided thread (old th): the authority on the left, SBC on the right, dates on the spine.
 * Done steps show dates. The next step has a "Today" mark. Later steps are faded, without dates (C-0021).
 */
export function SideThread({
  steps,
  authority,
  authLabel,
  client = "Northwind",
  nextSub,
}: {
  steps: ThreadStep[];
  authority: string;
  authLabel: string;
  client?: string;
  nextSub?: string;
}) {
  const next = steps.findIndex((s) => s.state !== "done");
  const isAuth = (s: ThreadStep) =>
    s.owner === undefined &&
    (s.state === "upcoming" ||
      s.by === authority ||
      !!s.by?.startsWith("With "));
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[340px] grid-cols-[minmax(0,1fr)_68px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)] gap-y-2">
        <div className="border-b-2 border-line pb-1.5 text-12.5 font-semibold text-muted">
          {authLabel}
        </div>
        <div />
        <div className="border-b-2 border-accent pb-1.5 text-12.5 font-semibold text-muted">
          SBC, for {client}
        </div>
        {steps.map((s, i) => {
          const auth = isAuth(s);
          const now = i === next;
          const later = next >= 0 && i > next;
          const title = now
            ? s.owner === "client"
              ? `Waiting on ${client}`
              : `Next: ${s.title}`
            : s.title;
          const sub = now
            ? s.owner === "client"
              ? (s.note ?? s.by)
              : (nextSub ?? s.by)
            : later
              ? undefined
              : s.by;
          const card = (
            <div
              className={cn(
                "min-w-0 rounded-md px-3 py-2",
                now
                  ? s.owner === "client"
                    ? "border border-dashed border-warn bg-warn-soft"
                    : "border border-dashed border-accent-line"
                  : "",
                now &&
                  (auth
                    ? "border-r-2 border-r-accent"
                    : "border-l-2 border-l-accent"),
                later && "opacity-55",
              )}
            >
              <b
                className={cn(
                  "block truncate text-13",
                  now ? "font-semibold" : "font-medium",
                )}
              >
                {title}
              </b>
              {sub && (
                <small className="block truncate text-12 text-muted">
                  {sub}
                </small>
              )}
            </div>
          );
          return (
            <React.Fragment key={s.id}>
              <div className={cn("min-w-0", auth && "text-right")}>
                {auth ? card : null}
              </div>
              <div className="grid place-items-center">
                {s.state === "done" && s.date ? (
                  <span className="grid w-[64px] justify-items-center rounded-md border border-line-soft py-1 text-center leading-tight">
                    <i className="text-11 not-italic text-muted">
                      {WD[s.date.getDay()]}
                    </i>
                    <b className="text-12.5 font-semibold">{fmt(s.date)}</b>
                  </span>
                ) : now ? (
                  <span className="grid w-[64px] justify-items-center rounded-md border border-accent-line bg-accent-soft py-1 text-center leading-tight">
                    <i className="text-11 not-italic text-muted">
                      {WD[TODAY.getDay()]}
                    </i>
                    <b className="text-12.5 font-semibold text-accent">Today</b>
                  </span>
                ) : (
                  <span
                    className="h-2 w-2 rounded-full border border-line"
                    aria-hidden
                  />
                )}
              </div>
              <div className="min-w-0">{auth ? null : card}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
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
            className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 first:border-t-0 md:px-5"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-13 font-semibold">
                {x.name}
              </span>
              <span
                className={cn(
                  "block truncate text-12 text-muted",
                  x.status === "Sent back" && "text-bad",
                )}
              >
                {docSub(x, by)}
              </span>
            </span>
            <Chip
              tone={DOC_STATUS_TONE[x.status]}
              className="hidden sm:inline-flex"
            >
              {x.status}
            </Chip>
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
                <Download size={16} strokeWidth={1.5} />
              </Button>
            ) : null}
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
            <span className="text-12.5 text-muted">{r.k}</span>
            {editable ? (
              <Input
                value={draft[i] ?? ""}
                onChange={(e) => {
                  setSent(false);
                  setDraft((d) =>
                    d.map((v, j) => (j === i ? e.target.value : v)),
                  );
                }}
                className={cn("h-[34px]", r.mono && "font-mono text-13")}
              />
            ) : (
              <b
                className={cn(
                  "min-w-0 break-words text-13.5 font-medium",
                  r.mono && "font-mono text-13",
                  r.v === "-" && "text-faint",
                )}
              >
                {r.v}
              </b>
            )}
          </label>
        ))}
        {editable && rows.length > 0 && (
          <div className="flex justify-end border-t border-line-soft bg-raised px-4 py-2.5 md:px-5">
            <Button
              type="submit"
              size="sm"
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
        <p className="px-4 py-3 text-13 text-faint md:px-5">None</p>
      ) : (
        rows.map((r) => (
          <div
            key={r.k}
            className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 border-t border-line-soft px-4 py-2 first:border-t-0 sm:grid-cols-[190px_minmax(0,1fr)] md:px-5"
          >
            <span className="text-12.5 text-muted">{r.k}</span>
            <span
              className={cn(
                "min-w-0 break-words text-13",
                r.mono && "font-mono",
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
              className="font-semibold text-accent hover:underline"
            >
              Read the SBC SOP
            </Link>
          </>
        )}
      </p>
    </SectionCard>
  );
}
