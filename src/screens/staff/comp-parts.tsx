"use client";
import * as React from "react";
import Link from "next/link";
import { BookOpen, Check, Download, ExternalLink, Loader2, Play, ScanLine } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt, fmtYear } from "@/lib/dates";
import type { Area } from "@/data/compliance";
import { DOC_STATUS_TONE, type DocStatus, type ItemDoc } from "@/data/registrations";
import { clientById } from "@/data/staff-clients";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Chevron } from "@/components/ui/Chevron";
import { FileBadge } from "@/components/ui/FileBadge";
import { Checkbox, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { TileGrid, type TileGroup } from "@/components/cards/TileGrid";
import { KeyValue } from "@/components/cards/KeyValue";
import type { StaffPortal } from "./parts";

// Shared parts of the staff Compliances and Registrations pages.
// Ported from reference/old-screens/s/lead/Register.dc.html and Item.dc.html (via regcat.js).

/* ---------- Lists ---------- */

/** Tile groups with a plain chevron to fold each group (old Register group heads). */
export function FoldingGroups({ groups, folded = [] }: { groups: TileGroup[]; folded?: string[] }) {
  const [closed, setClosed] = React.useState<Record<string, boolean>>(() => Object.fromEntries(folded.map((k) => [k, true])));
  const shown = groups.filter((g) => g.tiles.length > 0);
  if (shown.length === 0) return <Empty />;
  return (
    <div>
      {shown.map((g, i) => {
        const key = g.label ?? String(i);
        const open = !closed[key];
        return (
          <div key={key} className="border-t border-line-soft first:border-t-0">
            <button type="button" aria-expanded={open} onClick={() => setClosed({ ...closed, [key]: open })} className="flex w-full items-center gap-2 bg-raised px-4 py-1.5 text-left text-11.5 font-semibold text-faint hover:text-ink md:px-5">
              <Chevron open={open} />
              {g.label}
              <span>{g.tiles.length}</span>
            </button>
            {open && <TileGrid groups={[{ tiles: g.tiles }]} />}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Old keyboard: ↑ and ↓ move between rows, Enter opens, / goes to the client filter.
 * The hook works on every link inside the card.
 */
export function useListKeys(ref: React.RefObject<HTMLElement | null>, filterRef: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = ref.current;
      if (!el) return;
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select";
      if (e.key === "/" && !typing) {
        e.preventDefault();
        filterRef.current?.querySelector<HTMLElement>("select, input")?.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (typing) return;
      const links = [...el.querySelectorAll<HTMLAnchorElement>("a[href]")];
      if (links.length === 0) return;
      const at = links.indexOf(document.activeElement as HTMLAnchorElement);
      if (at < 0 && !el.contains(document.activeElement)) {
        if (document.activeElement && document.activeElement !== document.body) return;
      }
      e.preventDefault();
      const next = e.key === "ArrowDown" ? Math.min(links.length - 1, at + 1) : Math.max(0, at - 1);
      links[next]?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ref, filterRef]);
}

/** The keyboard hint under a list. Hidden on phones. */
export function KeyHint() {
  const k = "rounded-sm border border-line px-1 font-mono text-11 text-muted";
  return (
    <span className="hidden items-center gap-1 text-12 text-faint md:inline-flex">
      <kbd className={k}>↑</kbd>
      <kbd className={k}>↓</kbd> move · <kbd className={k}>Enter</kbd> open · <kbd className={k}>/</kbd> filter
    </span>
  );
}

/* ---------- Portals ---------- */

const PORTAL: Record<Area, [string, string]> = {
  GST: ["GST portal", "https://www.gst.gov.in/"],
  "Income tax": ["Income-tax portal", "https://www.incometax.gov.in/"],
  MCA: ["MCA portal", "https://www.mca.gov.in/"],
  Payroll: ["EPFO portal", "https://unifiedportal-emp.epfindia.gov.in/"],
  FEMA: ["RBI FIRMS", "https://firms.rbi.org.in/"],
  Labour: ["Labour portal", "https://shramsuvidha.gov.in/"],
};

/** Small link to the government portal of a filing. */
export function PortalLink({ area }: { area: Area }) {
  const [label, href] = PORTAL[area];
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-grid h-6 w-6 flex-none place-items-center rounded-sm text-faint hover:bg-raised hover:text-accent" aria-label={`Open ${label}`} title={`Open ${label}`}>
      <ExternalLink size={14} strokeWidth={1.5} />
    </a>
  );
}

/* ---------- Proof ---------- */

export interface Proof {
  title: string;
  period: string;
  filed?: Date;
  arn?: string;
  client: string;
  area: Area;
}

/** Proof of a filing: acknowledgement, challan, reference. Opens from the "Proof" chip. */
export function ProofDialog({ proof, onOpenChange }: { proof: Proof | null; onOpenChange: (v: boolean) => void }) {
  const c = proof ? clientById(proof.client) : undefined;
  const files = proof ? [`${proof.title.replace(/[^A-Za-z0-9]+/g, "_")}_${proof.period.replace(/\s+/g, "")}_ack.pdf`, ...(proof.area === "GST" || proof.area === "Income tax" || proof.area === "Payroll" ? [`Challan_${proof.period.replace(/\s+/g, "")}.pdf`] : [])] : [];
  return (
    <Modal
      open={!!proof}
      onOpenChange={onOpenChange}
      title={proof ? `${proof.title} · ${proof.period}` : ""}
      eyebrow={c?.name}
      size="sm"
      flush
      footer={
        <Button variant="primary" onClick={() => onOpenChange(false)}>
          <Download size={16} strokeWidth={1.5} /> Download all
        </Button>
      }
    >
      {proof && (
        <>
          <div className="border-b border-line-soft px-4 py-4 md:px-5">
            <KeyValue
              rows={[
                { k: "Filed on", v: proof.filed ? fmtYear(proof.filed) : "-" },
                { k: "Reference", v: proof.arn ?? "-", mono: true },
              ]}
            />
          </div>
          {files.map((f) => (
            <ListRow key={f}>
              <FileBadge type="PDF" />
              <span className="min-w-0 flex-1 truncate font-mono text-12.5">{f}</span>
              <Button size="iconSm" variant="ghost" aria-label={`Download ${f}`}>
                <Download size={16} strokeWidth={1.5} />
              </Button>
            </ListRow>
          ))}
        </>
      )}
    </Modal>
  );
}

/* ---------- Record page ---------- */

/** People on the item: client contact, project lead, manager. */
export function PeopleOnIt({ client }: { client: string }) {
  const c = clientById(client);
  if (!c) return null;
  const people = [
    { name: `${c.short} contact`, tip: `Client · ${c.name}` },
    { name: c.lead, tip: `${c.lead} · Project lead` },
    { name: c.manager, tip: `${c.manager} · Manager` },
  ];
  return (
    <span className="flex -space-x-1.5" aria-label="People on it">
      {people.map((p) => (
        <span key={p.tip} title={p.tip} className="rounded-full ring-2 ring-surface">
          <Avatar name={p.name} size={24} />
        </span>
      ))}
    </span>
  );
}

/** "Mark next step done": a short busy state, then the next thread step turns done. */
export function useNextStep(total: number, initial: number) {
  const [done, setDone] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const run = React.useCallback(() => {
    if (busy || done >= total) return;
    setBusy(true);
    window.setTimeout(() => {
      setDone((n) => Math.min(total, n + 1));
      setBusy(false);
    }, 900);
  }, [busy, done, total]);
  return { done, busy, run };
}

export function NextStepButton({ busy, disabled, onClick }: { busy: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick} disabled={disabled || busy}>
      {busy ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin motion-reduce:animate-none" /> : <Check size={16} strokeWidth={1.5} />}
      {busy ? "Working" : "Mark next step done"}
    </Button>
  );
}

/** VCFO Assist fills the government portal. Each page is kept as a screenshot. */
export function AssistCard({ portalName, form, onFiled }: { portalName: string; form: string; onFiled?: () => void }) {
  const STEPS = [`Sign in to the ${portalName} portal`, `Open ${form}`, "Fill the details from VCFO", "Attach the accepted documents", "Submit and read back the reference"];
  const [at, setAt] = React.useState(-1);
  const [replay, setReplay] = React.useState(false);
  const filed = React.useRef(onFiled);
  React.useEffect(() => {
    filed.current = onFiled;
  }, [onFiled]);
  const running = at >= 0 && at < STEPS.length;
  const ran = at >= STEPS.length;
  React.useEffect(() => {
    if (!running) return;
    const h = window.setTimeout(() => {
      setAt(at + 1);
      if (at + 1 >= STEPS.length) filed.current?.();
    }, 900);
    return () => window.clearTimeout(h);
  }, [at, running, STEPS.length]);
  const short = portalName.split(" ")[0];
  return (
    <SectionCard
      title="File with VCFO Assist"
      meta="Runs in your browser on the portal"
      icon={{ Icon: ScanLine, tone: "blue" }}
      flush
      right={
        <Button size="sm" variant="primary" disabled={running} onClick={() => (ran ? setReplay(true) : setAt(0))}>
          {running ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin motion-reduce:animate-none" /> : <Play size={16} strokeWidth={1.5} />}
          {ran ? "View replay" : running ? "Filing" : "Start filing"}
        </Button>
      }
    >
      <ol>
        {STEPS.map((t, i) => {
          const ok = i < at;
          const now = i === at;
          return (
            <li key={t} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13.5 first:border-t-0 md:px-5">
              <span className={cn("grid h-5 w-5 flex-none place-items-center rounded-full", ok ? "bg-ok-soft text-ok" : now ? "bg-accent-soft text-accent" : "shadow-[inset_0_0_0_1.5px_var(--line)]")} aria-hidden>
                {ok ? <Check size={12} strokeWidth={2.4} /> : now ? <Loader2 size={12} strokeWidth={2} className="animate-spin motion-reduce:animate-none" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate", now ? "font-semibold" : "font-medium")}>{t}</span>
                <span className="block text-12 text-muted">{ok ? `Done · 10:0${2 + i} am` : now ? "Working on it" : "Waiting"}</span>
              </span>
              {ok && (
                <span className="flex-none rounded-sm border border-line px-1.5 py-0.5 font-mono text-11 text-muted" title="Screenshot of this page">
                  {short} · p{i + 1}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="border-t border-line-soft px-4 py-2.5 text-12.5 text-muted md:px-5">{ran ? "Replay kept in Audit · 5 screenshots" : "Nothing is submitted before the last step"}</p>
      <Modal open={replay} onOpenChange={setReplay} title="VCFO Assist replay" sub={`${form} · 5 screenshots`} size="lg">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STEPS.map((t, i) => (
            <li key={t} className="grid gap-1.5">
              <span className="grid aspect-[4/3] place-items-center rounded-md border border-line bg-raised font-mono text-12 text-muted">
                {short} · p{i + 1}
              </span>
              <span className="truncate text-12.5">{t}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </SectionCard>
  );
}

type DocState = DocStatus;

/**
 * "From the client": documents with Accept and Ask again, then the details the client gave.
 * Ask again needs a reason (old Item: "Enter a reason first").
 */
export function FromClientCard({ docs, details, confirmedBy, client }: { docs: ItemDoc[]; details: Array<[string, string]>; confirmedBy: string; client: string }) {
  const c = clientById(client);
  const [state, setState] = React.useState<Record<string, DocState>>({});
  const [asking, setAsking] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState(false);
  const [sent, setSent] = React.useState<Record<string, string>>({});
  const stOf = (x: ItemDoc) => state[x.id] ?? x.status;
  const accepted = docs.filter((x) => stOf(x) === "Accepted").length;
  return (
    <SectionCard title="From the client" meta={docs.length ? `${accepted} of ${docs.length} accepted` : undefined} flush icon={{ Icon: BookOpen, tone: "amber" }}>
      {docs.length === 0 ? (
        <Empty />
      ) : (
        docs.map((x) => {
          const st = stOf(x);
          return (
            <div key={x.id} className="border-t border-line-soft first:border-t-0">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-13.5 md:px-5">
                <FileBadge type={x.type} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{x.name}</span>
                  <span className="block truncate text-12.5 text-muted">
                    {sent[x.id]
                      ? `Asked again · ${sent[x.id]}`
                      : st === "Accepted"
                        ? `Uploaded by ${x.fromLabel ?? c?.short ?? "the client"}${x.date ? ` · ${fmt(x.date)}` : ""}`
                        : st === "To review"
                          ? "Uploaded today"
                          : st === "Asked"
                            ? "Asked · reminder in 3 days"
                            : st === "Sent back"
                              ? x.note ?? "Sent back"
                              : "SBC asks when this starts"}
                  </span>
                </span>
                <Chip tone={DOC_STATUS_TONE[st]} className="hidden sm:inline-flex">
                  {st}
                </Chip>
                {st === "To review" && asking !== x.id && (
                  <span className="flex flex-none gap-1.5">
                    <Button size="sm" variant="soft" onClick={() => setState({ ...state, [x.id]: "Accepted" })}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setAsking(x.id);
                        setReason("");
                        setErr(false);
                      }}
                    >
                      Ask again
                    </Button>
                  </span>
                )}
                {st === "Accepted" && (
                  <Button size="iconSm" variant="ghost" aria-label={`Download ${x.name}`}>
                    <Download size={16} strokeWidth={1.5} />
                  </Button>
                )}
              </div>
              {asking === x.id && (
                <div className="flex flex-wrap items-center gap-2 border-t border-line-soft bg-raised px-4 py-2.5 md:px-5">
                  <Input
                    aria-label="Reason"
                    autoFocus
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setErr(false);
                    }}
                    placeholder="What should the client fix? For example: stamp missing on page 2"
                    className="h-[30px] min-w-[200px] flex-1 text-13"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (!reason.trim()) return setErr(true);
                      setState({ ...state, [x.id]: "Sent back" });
                      setSent({ ...sent, [x.id]: reason.trim() });
                      setAsking(null);
                    }}
                  >
                    Send
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAsking(null)}>
                    Cancel
                  </Button>
                  {err && <span className="w-full text-12.5 font-semibold text-bad">Enter a reason first</span>}
                </div>
              )}
            </div>
          );
        })
      )}
      {details.length > 0 && (
        <div className="border-t border-line-soft px-4 py-4 md:px-5">
          <KeyValue rows={details.map(([k, v]) => ({ k, v }))} wrap />
          <p className="mt-3 text-12.5 text-muted">{confirmedBy}</p>
        </div>
      )}
    </SectionCard>
  );
}

/** "Filled by SBC": click a value to edit it. Save keeps the change (R-40: a plain setting saves as it changes). */
export function SbcFieldsCard({ rows, locked }: { rows: Array<[string, string]>; locked?: boolean }) {
  const [vals, setVals] = React.useState<Record<string, string>>({});
  const [edit, setEdit] = React.useState<string | null>(null);
  return (
    <SectionCard title="Filled by SBC" meta={locked ? "Locked after filing" : "Click a value to edit"}>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, v]) => {
          const val = vals[k] ?? v;
          return (
            <div key={k} className="min-w-0">
              <dt className="text-12 text-muted">{k}</dt>
              <dd className="font-mono text-13">
                {edit === k && !locked ? (
                  <Input
                    autoFocus
                    aria-label={k}
                    defaultValue={val === "-" ? "" : val}
                    className="mt-0.5 h-[30px] font-mono text-13"
                    onBlur={(e) => {
                      setVals({ ...vals, [k]: e.target.value.trim() || "-" });
                      setEdit(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEdit(null);
                    }}
                  />
                ) : (
                  <button type="button" disabled={locked} onClick={() => setEdit(k)} className={cn("block max-w-full truncate text-left", !locked && "hover:text-accent hover:underline")}>
                    {val}
                  </button>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </SectionCard>
  );
}

/** Rail card with one short paragraph, and an optional link. */
export function NoteCard({ title, children, link }: { title: string; children: React.ReactNode; link?: { label: string; href: string } }) {
  return (
    <SectionCard title={title}>
      <p className="text-13.5 leading-relaxed text-ink-2">
        {children}
        {link && (
          <>
            {" "}
            <Link href={link.href} className="font-semibold text-accent hover:underline">
              {link.label}
            </Link>
          </>
        )}
      </p>
    </SectionCard>
  );
}

/** "Before filing": staff-only checklist. */
export function ReviewCard({ items, initial }: { items: string[]; initial: number }) {
  const [on, setOn] = React.useState<boolean[]>(items.map((_, i) => i < initial));
  return (
    <SectionCard title="Before filing" meta={`${on.filter(Boolean).length} of ${items.length} · staff only`} flush icon={{ Icon: Check, tone: "green" }}>
      {items.map((t, i) => (
        <label key={t} className="flex cursor-pointer items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13.5 first:border-t-0 md:px-5">
          <Checkbox checked={on[i]} onChange={(v) => setOn(on.map((x, j) => (j === i ? v : x)))} label={t} />
          <span className={cn("min-w-0 flex-1", on[i] && "text-muted line-through")}>{t}</span>
        </label>
      ))}
    </SectionCard>
  );
}

export const REVIEW_OB = ["Figures match the books", "Prior period carried forward", "Client approved the summary", "Challan details checked"];
export const REVIEW_REG = ["Entity type and state checked", "Every document accepted", "Details match the documents", "Manager approval if needed"];

/** Docs: on a waiting item, the first asked document came in today and waits for review (old Item). */
export function withReview(docs: ItemDoc[], waiting: boolean): ItemDoc[] {
  if (!waiting) return docs;
  let flipped = false;
  return docs.map((x) => {
    if (!flipped && x.from === "client" && x.status === "Asked") {
      flipped = true;
      return { ...x, status: "To review" as const };
    }
    return x;
  });
}

export const kbHref = (portal: StaffPortal) => `/${portal}/docs/knowledge`;
