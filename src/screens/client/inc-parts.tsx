"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, ListChecks, Paperclip, RefreshCw, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { PHASES, STEPS, COI_EXPECTED, doneCount, stepTone, stepHref, type Step } from "@/data/incorporation";
import { SUB_STEPS, STEP_PROOF, portalFor, type StatSeg } from "@/data/incorporation-detail";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, type ChipTone } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { StatusCircle } from "@/components/cards/GanttTimeline";
import { StepMark } from "@/components/ui/StepMark";
import { StepRow, stepsInState } from "./st5";

export type Notify = (text: string, onUndo?: () => void) => void;

const ownerLabel = (s: Step) => (s.owner === "client" ? "Northwind" : undefined);

/** Status word for a step, in the six words of R-13 (the owner column says who holds it). */
export function stepWord(s: Step): { label: string; tone: ChipTone } {
  if (s.status === "Upcoming") return { label: "Not started", tone: "idle" };
  return { label: s.status, tone: stepTone[s.status] };
}

/** "Done 24 Sep", "Due 9 Oct", "Since 1 Oct", "-" */
export function stepDate(s: Step) {
  if (s.done) return { text: `Done ${fmt(s.done)}`, late: false };
  if (!s.due) return { text: "-", late: false };
  if (s.status === "Upcoming") return { text: s.n === 14 ? `Exp. ${fmt(COI_EXPECTED)}` : `Planned ${fmt(s.due)}`, late: false };
  return { text: `Due ${fmt(s.due)}`, late: s.due < TODAY };
}

const circle = (s: Step) => (s.status === "Completed" ? "done" : s.status === "Upcoming" ? "planned" : "current");

/* ---------- Drill dialog: tabs per segment, rows of steps or documents ---------- */

export interface DrillSpec {
  title: string;
  sub?: string;
  groups: StatSeg[];
  active?: number;
  /** Footer link. */
  link?: { text: string; href: string };
  /** Who the documents come from. */
  docFrom?: string;
}

export function DrillModal({ spec, onClose }: { spec: DrillSpec | null; onClose: () => void }) {
  const [tab, setTab] = React.useState(0);
  React.useEffect(() => {
    if (spec) setTab(spec.active ?? Math.max(0, spec.groups.findIndex((g) => g.items.length > 0)));
  }, [spec]);
  if (!spec) return null;
  const g = spec.groups[tab] ?? spec.groups[0];
  return (
    <Modal
      open={!!spec}
      onOpenChange={(v) => !v && onClose()}
      title={spec.title}
      sub={spec.sub}
      size="lg"
      flush
      footer={
        spec.link ? (
          <Button asChild variant="primary">
            <Link href={spec.link.href}>{spec.link.text}</Link>
          </Button>
        ) : undefined
      }
    >
      <div className="border-b border-line-soft px-4 py-2.5 md:px-5">
        <Tabs items={spec.groups.map((x, i) => ({ key: String(i), label: x.label, count: x.items.length }))} value={String(tab)} onChange={(k) => setTab(Number(k))} />
      </div>
      {g.items.length === 0 ? (
        <Empty />
      ) : (
        g.items.map((it) => {
          if (typeof it === "number") {
            const s = STEPS[it - 1];
            const w = stepWord(s);
            const dt = stepDate(s);
            return (
              <ListRow key={it} href={stepHref("client", s.n)}>
                <StatusCircle status={circle(s)} />
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="flex-none font-mono text-12 text-muted">Step {s.n}</span>
                    <span className="truncate font-medium">{s.title}</span>
                  </span>
                  <span className={cn("block text-12.5", dt.late ? "font-medium text-bad" : "text-muted")}>{dt.text}</span>
                </span>
                <OwnerChip owner={s.owner} label={ownerLabel(s)} className="hidden sm:inline-flex" />
                <Chip tone={w.tone} fixed className="hidden sm:inline-flex">
                  {w.label}
                </Chip>
                <ChevronRight size={16} strokeWidth={1.6} className="flex-none text-faint" />
              </ListRow>
            );
          }
          return (
            <ListRow key={it}>
              <span className="min-w-0 flex-1 truncate font-medium">{it}</span>
              <span className="flex-none text-12.5 text-muted">{spec.docFrom}</span>
            </ListRow>
          );
        })
      )}
    </Modal>
  );
}

/** Steps grouped by status, for a drill. */
export function statusGroups(list: Step[]): StatSeg[] {
  const groups: Array<[string, StatSeg["tone"], (s: Step) => boolean]> = [
    ["Waiting", "teal", (s) => s.status === "Waiting" || s.status === "Sent back"],
    ["In progress", "accent", (s) => s.status === "In progress" && s.owner === "client"],
    ["With SBC", "accent", (s) => s.status === "In progress" && s.owner !== "client"],
    ["Done", "ok", (s) => s.status === "Completed"],
    ["Upcoming", "idle", (s) => s.status === "Upcoming"],
  ];
  return groups.map(([label, tone, test]) => ({ label, tone, items: list.filter(test).map((s) => s.n) })).filter((g) => g.items.length > 0);
}

/* ---------- Stat card: one stacked bar; a click opens the drill ---------- */

export function StatCard({ title, segs, onOpen, unit }: { title: string; segs: StatSeg[]; onOpen: () => void; unit: string }) {
  const total = segs.reduce((a, s) => a + s.items.length, 0);
  return (
    <SectionCard title={title} flush>
      <button type="button" onClick={onOpen} className="block w-full px-4 py-4 text-left hover:bg-hover md:px-5" aria-label={`${title} · ${total} ${unit}`}>
        <StackedBar total={total} segments={segs.map((s) => ({ label: s.label, value: s.items.length, tone: s.tone }))} />
      </button>
    </SectionCard>
  );
}

/* ---------- Journey: the steps of a phase in ST5 (R-22); the focus step shows its sub-steps ---------- */

/** Sub-steps of the focus step: small ST5 marks with labels under them (was the navy railHero stepper). */
function SubSteps({ subs }: { subs: Array<{ label: string; state: "done" | "now" | "todo" }> }) {
  return (
    <ol className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${subs.length}, minmax(0, 1fr))` }} aria-label="Sub-steps">
      {subs.map((x) => (
        <li key={x.label} className="grid min-w-0 justify-items-start gap-1">
          <StepMark state={x.state === "todo" ? "next" : x.state} size={18} label={x.state === "done" ? "done" : x.state === "now" ? "now" : "to do"} />
          <span className={cn("block w-full truncate text-11.5", x.state === "now" ? "font-medium text-ink" : "text-muted")}>{x.label}</span>
        </li>
      ))}
    </ol>
  );
}

export function JourneyCard({ phase, focus }: { phase: 1 | 2 | 3; focus: number }) {
  const all = stepsInState(false);
  const list = all.filter((s) => s.phase === phase);
  const p = PHASES[phase - 1];
  return (
    <SectionCard title={`${p.short} · journey`} icon={{ Icon: ListChecks, tone: "blue" }} meta={`${doneCount(phase)} / ${list.length}`}>
      <ol className="flex flex-col">
        {list.map((s, i) => {
          const subs = SUB_STEPS[s.n];
          const isFocus = s.n === focus;
          return <StepRow key={s.n} s={s} prev={all[s.n - 2]} today={TODAY} after={false} lastRow={i === list.length - 1} focus={isFocus} compact below={isFocus && subs ? <SubSteps subs={subs} /> : undefined} />;
        })}
      </ol>
    </SectionCard>
  );
}

/* ---------- Message a person on SBC's team ---------- */

export function MessageModal({ to, about, open, onOpenChange, notify, title = "Message" }: { to: string; about: string; open: boolean; onOpenChange: (v: boolean) => void; notify: Notify; title?: string }) {
  const [text, setText] = React.useState("");
  React.useEffect(() => {
    if (open) setText("");
  }, [open]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`${title} · ${to}`}
      eyebrow={about}
      size="sm"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!text.trim()}
            onClick={() => {
              onOpenChange(false);
              notify(`Sent to ${to}`);
            }}
          >
            Send
          </Button>
        </>
      }
    >
      <label className="grid gap-1.5">
        <span className="text-13 font-medium text-ink-2">Message</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full rounded-md border-1.5 border-line-2 bg-surface px-3 py-2 text-14 text-ink outline-none placeholder:text-faint focus-visible:border-primary focus-visible:shadow-[0_0_0_4px_var(--accent-soft)]"
          placeholder={`Write to ${to}`}
        />
      </label>
    </Modal>
  );
}

/* ---------- Official portal and proof links ---------- */

export function PortalButton({ form, step, notify }: { form: string; step: Step; notify: Notify }) {
  return (
    <button
      type="button"
      onClick={() => notify(`Opens ${form} on the ${portalFor(step)} in a new tab`)}
      className="inline-flex h-6 items-center gap-1.5 rounded-md border-1.5 border-line bg-surface px-2 font-mono text-12 font-medium text-ink-2 hover:bg-hover"
      aria-label={`Open ${form} on the ${portalFor(step)}`}
    >
      {form}
      <ExternalLink size={12} strokeWidth={1.6} />
    </button>
  );
}

/** Portal and proof cell for a step table row. Client-owned steps have none. */
export function PortalProof({ step, notify, forms }: { step: Step; notify: Notify; forms: string[] }) {
  if (step.owner === "client" || step.n === 2) return <span className="text-faint">-</span>;
  const proof = STEP_PROOF[step.n];
  return (
    <span className="flex items-center gap-1.5">
      <Button size="iconSm" variant="ghost" aria-label={`Open ${forms[0] ?? "the filing"} on the ${portalFor(step)}`} onClick={() => notify(`Opens ${forms[0] ?? "the filing"} on the ${portalFor(step)} in a new tab`)}>
        <ExternalLink size={15} strokeWidth={1.6} />
      </Button>
      {step.status === "Completed" &&
        (proof ? (
          <Button asChild size="sm" variant="ghost">
            <Link href={`/client/documents/view/${proof}`} aria-label={`Proof of step ${step.n}`}>
              <Paperclip size={14} strokeWidth={1.6} /> Proof
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => notify(`Proof · step ${step.n} · ${step.title}`)} aria-label={`Proof of step ${step.n}`}>
            <Paperclip size={14} strokeWidth={1.6} /> Proof
          </Button>
        ))}
    </span>
  );
}

/* ---------- Prev and next pager ---------- */

export function Pager({ prev, next }: { prev?: { href: string; label: string }; next?: { href: string; label: string } }) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-2" aria-label="Pages">
      {prev ? (
        <Button asChild className="min-w-0 max-w-full">
          <Link href={prev.href}>
            <ChevronRight size={16} strokeWidth={1.6} className="rotate-180" />
            <span className="truncate">{prev.label}</span>
          </Link>
        </Button>
      ) : (
        <span />
      )}
      {next && (
        <Button asChild className="min-w-0 max-w-full">
          <Link href={next.href}>
            <span className="truncate">{next.label}</span>
            <ChevronRight size={16} strokeWidth={1.6} />
          </Link>
        </Button>
      )}
    </nav>
  );
}

/* ---------- Drop zone ---------- */

/**
 * Drop zone for one requested file. "warn" is the amber zone of a file Northwind owes (old .drop on step 7).
 * "accent" is the blue zone that replaces a file (old board.html "Replace signed copy").
 */
export function DropZone({ label, hint, chip, onFile, accept = ".pdf,.jpg,.jpeg,.png,.docx", tone = "warn" }: { label: string; hint?: string; chip?: React.ReactNode; onFile: (name: string) => void; accept?: string; tone?: "warn" | "accent" }) {
  const [over, setOver] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);
  const warn = tone === "warn";
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f.name);
      }}
      className={cn(
        "flex items-center gap-3 rounded-md border-1.5 border-dashed border-line-2 bg-surface px-4 py-3.5",
        over && "border-primary bg-accent-soft",
      )}
    >
      <button
        type="button"
        aria-label={`Upload ${label}`}
        onClick={() => ref.current?.click()}
        className={cn("grid h-10 w-10 flex-none place-items-center rounded-md", warn ? "bg-warn-soft text-warn hover:bg-warn-soft/70" : "bg-accent-soft text-accent hover:bg-accent-soft/70")}
      >
        {warn ? <Upload size={16} strokeWidth={1.8} /> : <RefreshCw size={16} strokeWidth={1.8} />}
      </button>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-14 font-medium">{label}</b>
        <span className="block text-12.5 text-muted">
          Drop a file here or{" "}
          <button type="button" className="font-medium text-accent hover:underline" onClick={() => ref.current?.click()}>
            browse
          </button>
        </span>
      </span>
      {hint && <span className="hidden flex-none text-12 text-muted sm:inline">{hint}</span>}
      {chip}
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0].name)} />
    </div>
  );
}
