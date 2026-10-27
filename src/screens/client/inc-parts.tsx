"use client";
import * as React from "react";
import Link from "next/link";
import { Check, ChevronRight, Copy, Download, ExternalLink, MessageSquare, Paperclip, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt, fmtYear, urgency } from "@/lib/dates";
import { PHASES, STEPS, COI_EXPECTED, stepsOf, doneCount, stepTone, stepHref, phaseHref, type Step } from "@/data/incorporation";
import { SUB_STEPS, STEP_PROOF, portalFor, NEED_ACTION, type IncNeed, type IncNeedKind, type StatSeg } from "@/data/incorporation-detail";
import { SBC } from "@/data/people";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, type ChipTone } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Bar } from "@/components/ui/Bar";
import { Avatar } from "@/components/ui/Avatar";
import { Checkbox } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SidePanel, PanelSection } from "@/components/ui/SidePanel";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { StatusCircle } from "@/components/cards/GanttTimeline";

export type Notify = (text: string, onUndo?: () => void) => void;

const ownerLabel = (s: Step) => (s.owner === "client" ? "Northwind" : undefined);

/** Status word for a step: SBC work in progress reads "With SBC". */
export function stepWord(s: Step): { label: string; tone: ChipTone } {
  if (s.status === "In progress" && s.owner !== "client") return { label: "With SBC", tone: "prog" };
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
                  <span className="block truncate font-semibold">
                    {s.n} · {s.title}
                  </span>
                  <span className={cn("block text-12.5", dt.late ? "font-semibold text-bad" : "text-muted")}>{dt.text}</span>
                </span>
                <OwnerChip owner={s.owner} label={ownerLabel(s)} className="hidden sm:inline-flex" />
                <Chip tone={w.tone} fixed className="hidden sm:inline-flex">
                  {w.label}
                </Chip>
                <ChevronRight size={16} strokeWidth={1.5} className="flex-none text-faint" />
              </ListRow>
            );
          }
          return (
            <ListRow key={it}>
              <span className="min-w-0 flex-1 truncate font-semibold">{it}</span>
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
    ["Waiting", "warn", (s) => s.status === "Waiting" || s.status === "Sent back"],
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
      <button type="button" onClick={onOpen} className="block w-full px-4 py-4 text-left hover:bg-raised md:px-5" aria-label={`${title} · ${total} ${unit}`}>
        <StackedBar total={total} segments={segs.map((s) => ({ label: s.label, value: s.items.length, tone: s.tone }))} />
      </button>
    </SectionCard>
  );
}

/* ---------- Monthly status brief ---------- */

export function StatusBrief({ open, onOpenChange, incorporated, notify }: { open: boolean; onOpenChange: (v: boolean) => void; incorporated: boolean; notify: Notify }) {
  const spice = STEPS.filter((s) => s.phase <= 2);
  const spiceDone = incorporated ? spice.length : spice.filter((s) => s.status === "Completed").length;
  const pct = Math.round((spiceDone / spice.length) * 100);
  const days = Math.round((COI_EXPECTED.getTime() - TODAY.getTime()) / 86400000);
  const waiting = STEPS.filter((s) => s.owner === "client" && (s.status === "Waiting" || s.status === "Sent back" || (s.status === "In progress" && !!s.due && s.due < TODAY)));
  const going = STEPS.filter((s) => s.status === "In progress" && !waiting.includes(s));
  const text = [`Incorporation status brief · Northwind Technologies India Pvt Ltd · ${fmtYear(TODAY)}`, ...PHASES.map((p) => `Phase ${p.n} · ${p.short}: ${doneCount(p.n)} of ${stepsOf(p.n).length} done`)].join("\n");
  const row = (s: Step) => {
    const dt = stepDate(s);
    return (
      <ListRow key={s.n} href={stepHref("client", s.n)}>
        <StatusCircle status={circle(s)} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">
            {s.n} · {s.title}
          </span>
          <span className={cn("block text-12.5", dt.late ? "font-semibold text-bad" : "text-muted")}>{dt.text}</span>
        </span>
        <OwnerChip owner={s.owner} label={ownerLabel(s)} />
      </ListRow>
    );
  };
  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Monthly status brief"
      eyebrow={`Northwind Technologies India Pvt Ltd · as of ${fmtYear(TODAY)}`}
      width={480}
      footer={
        <>
          <Button
            onClick={() => {
              try {
                void navigator.clipboard?.writeText(text);
              } catch {}
              notify("Status brief copied");
            }}
          >
            <Copy size={16} strokeWidth={1.5} /> Copy brief
          </Button>
          <Button variant="primary" onClick={() => notify("Download started · status-brief-oct-2026.pdf")}>
            <Download size={16} strokeWidth={1.5} /> Download PDF
          </Button>
        </>
      }
    >
      <PanelSection>
        <p className="text-13.5">
          {incorporated ? (
            <>
              Incorporated on <b className="font-semibold">{fmtYear(COI_EXPECTED)}</b>. SPICe+ is <b className="font-semibold">100%</b> done.
            </>
          ) : (
            <>
              <b className="font-semibold">{days} days</b> to the expected COI ({fmt(COI_EXPECTED)}). SPICe+ is <b className="font-semibold">{pct}%</b> done: {spiceDone} of {spice.length} steps.
            </>
          )}
        </p>
      </PanelSection>
      <PanelSection title="Phases" flush>
        {PHASES.map((p) => {
          const n = stepsOf(p.n).length;
          const dn = doneCount(p.n);
          return (
            <ListRow key={p.id} href={phaseHref("client", p.n)}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  Phase {p.n} · {p.short}
                </span>
                <span className="block text-12.5 text-muted">
                  {dn} of {n} · {p.status === "Done" ? "done" : "ends"} {fmt(p.end)}
                </span>
                <Bar pct={(dn / n) * 100} tone={dn === n ? "ok" : "accent"} className="mt-1.5 max-w-[200px]" />
              </span>
              <Chip tone={p.status === "Done" ? "ok" : p.status === "In progress" ? "prog" : "idle"}>{p.status}</Chip>
            </ListRow>
          );
        })}
      </PanelSection>
      <PanelSection title="Waiting on Northwind" flush>
        {waiting.length ? waiting.map(row) : <Empty />}
      </PanelSection>
      <PanelSection title="In progress" flush>
        {going.length ? going.map(row) : <Empty />}
      </PanelSection>
    </SidePanel>
  );
}

/* ---------- Needs from Northwind (refresh "req" rows) ---------- */

export function IncNeedsCard({ rows, notify }: { rows: IncNeed[]; notify: Notify }) {
  const [tab, setTab] = React.useState<IncNeedKind>("upload");
  const [ticked, setTicked] = React.useState<Record<string, boolean>>({});
  const kinds: IncNeedKind[] = ["upload", "fill", "correct", "sign"];
  const label: Record<IncNeedKind, string> = { upload: "Upload", fill: "Fill", correct: "Correct", sign: "Sign" };
  const shown = rows.filter((r) => r.kind === tab);
  return (
    <SectionCard
      title="Needs from Northwind"
      flush
      right={<Tabs items={kinds.map((k) => ({ key: k, label: label[k], count: rows.filter((r) => r.kind === k && !ticked[r.id]).length }))} value={tab} onChange={(k) => setTab(k as IncNeedKind)} />}
    >
      {shown.length === 0 ? (
        <Empty />
      ) : (
        shown.map((r) => {
          const u = urgency(r.due);
          const on = !!ticked[r.id];
          return (
            <ListRow key={r.id}>
              <Checkbox
                checked={on}
                label={`Mark ${r.title} as done`}
                onChange={(v) => {
                  setTicked((t) => ({ ...t, [r.id]: v }));
                  if (v) notify(`${r.title} marked as done`, () => setTicked((t) => ({ ...t, [r.id]: false })));
                }}
              />
              <span className={cn("min-w-0 flex-1 truncate font-semibold", on && "text-muted line-through")}>{r.title}</span>
              <Chip tone={on ? "ok" : u === "bad" ? "bad" : u === "warn" ? "warn" : "idle"}>{on ? "Done" : u === "bad" ? "Overdue" : fmt(r.due)}</Chip>
              <Button asChild size="sm" variant={u === "bad" && !on ? "primary" : "outline"}>
                <Link href={stepHref("client", r.step)}>{NEED_ACTION[r.kind]}</Link>
              </Button>
            </ListRow>
          );
        })
      )}
    </SectionCard>
  );
}

/* ---------- Who holds it now (refresh "hl" rows) ---------- */

export function WhoHoldsCard({ phase }: { phase: 1 | 2 | 3 }) {
  const list = stepsOf(phase);
  const owners = [
    { key: "client", label: "Northwind" },
    { key: "sbc", label: "SBC" },
    { key: "mca", label: "MCA" },
  ] as const;
  const open = (o: string) => list.filter((s) => s.owner === o && s.status !== "Completed").length;
  const [tab, setTab] = React.useState<string>("client");
  const rows = list.filter((s) => s.owner === tab);
  return (
    <SectionCard title="Who holds it now" flush right={<Tabs items={owners.map((o) => ({ key: o.key, label: o.label, count: open(o.key) }))} value={tab} onChange={setTab} />}>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        rows.map((s) => {
          const w = stepWord(s);
          return (
            <ListRow key={s.n} href={stepHref("client", s.n)}>
              <span className="w-[52px] flex-none text-12.5 text-faint">Step {s.n}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{s.title}</span>
              <OwnerChip owner={s.owner} label={ownerLabel(s)} className="hidden sm:inline-flex" />
              <Chip tone={s.status === "Upcoming" ? "idle" : w.tone} fixed>
                {s.status === "Upcoming" ? "Not started" : w.label}
              </Chip>
              <ChevronRight size={16} strokeWidth={1.5} className="flex-none text-faint" />
            </ListRow>
          );
        })
      )}
    </SectionCard>
  );
}

/* ---------- Journey: the steps of a phase, the focus step shows its sub-steps ---------- */

function journeySub(s: Step) {
  if (s.status === "Completed") return s.done ? `Done · ${fmt(s.done)}` : "Done";
  if (s.status === "Upcoming") return "Opens later";
  if (s.owner === "client") return `${s.status === "Waiting" ? "Waiting on Northwind" : "In progress"} · due ${s.due ? fmt(s.due) : "-"}`;
  return `With SBC · due ${s.due ? fmt(s.due) : "-"}`;
}

export function JourneyCard({ phase, focus }: { phase: 1 | 2 | 3; focus: number }) {
  const list = stepsOf(phase);
  const p = PHASES[phase - 1];
  return (
    <SectionCard title={`${p.short} · journey`} icon={{ Icon: ChevronRight, tone: "blue" }} meta={`${doneCount(phase)} / ${list.length}`} flush>
      <ol>
        {list.map((s) => {
          const subs = SUB_STEPS[s.n];
          const isFocus = s.n === focus;
          const dt = stepDate(s);
          return (
            <li key={s.n} className="border-t border-line-soft first:border-t-0">
              <Link href={stepHref("client", s.n)} aria-current={isFocus ? "step" : undefined} className={cn("flex items-start gap-3 px-4 py-2.5 hover:bg-raised md:px-5", isFocus && "bg-accent-soft hover:bg-accent-soft")}>
                <StatusCircle status={circle(s)} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  {isFocus && <span className="block text-11.5 font-semibold text-accent">Step {s.n}</span>}
                  <span className="block truncate text-13 font-semibold">
                    {isFocus ? s.title : `${s.n} · ${s.title}`}
                  </span>
                  <span className={cn("block truncate text-12", dt.late ? "font-semibold text-bad" : "text-muted")}>{journeySub(s)}</span>
                  {isFocus && subs && s.status !== "Completed" && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {subs.map((x) => (
                        <span key={x.label} className={cn("inline-flex h-[22px] items-center gap-1.5 rounded-sm px-2 text-11.5 font-semibold", x.state === "done" ? "bg-ok-soft text-ok" : x.state === "now" ? "bg-surface text-accent" : "bg-surface text-faint")}>
                          {x.state === "done" ? <Check size={11} strokeWidth={2.4} /> : <i className={cn("h-1.5 w-1.5 rounded-full", x.state === "now" ? "bg-accent" : "bg-line")} aria-hidden />}
                          {x.label}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <OwnerChip owner={s.owner} label={ownerLabel(s)} className="mt-0.5 hidden sm:inline-flex" />
              </Link>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}

/* ---------- Holder block (refresh "hold" card) ---------- */

export function HolderBlock({ owner, title, sub, action }: { owner: Step["owner"]; title: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-md border border-line border-l-[3px] px-4 py-3", owner === "client" ? "border-l-warn-mid" : owner === "mca" ? "border-l-violet" : "border-l-accent")}>
      <div className="flex min-w-0 items-center gap-2 text-13.5 font-semibold">{title}</div>
      {action && <div className="row-span-2">{action}</div>}
      {sub && <div className="min-w-0 text-12.5 text-muted">{sub}</div>}
    </div>
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
        <span className="text-12.5 font-semibold text-muted">Message</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-13.5 text-ink outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent-line"
          placeholder={`Write to ${to}`}
        />
      </label>
    </Modal>
  );
}

/* ---------- SBC team on a step ---------- */

export function StepTeamCard({ step, notify }: { step: Step; notify: Notify }) {
  const [to, setTo] = React.useState<string | null>(null);
  const people = [
    { p: SBC.find((x) => x.id === "bharath")!, role: step.owner === "client" ? "Project lead · reviews Northwind's answers" : "Project lead · does this step" },
    { p: SBC.find((x) => x.id === "pranay")!, role: "Manager · approves" },
  ];
  return (
    <SectionCard title="SBC team on this step" flush>
      {people.map(({ p, role }) => (
        <ListRow key={p.id}>
          <Avatar name={p.ini ?? p.name} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{p.name}</span>
            <span className="block truncate text-12.5 text-muted">{role}</span>
          </span>
          <Button size="iconSm" variant="ghost" aria-label={`Message ${p.name}`} onClick={() => setTo(p.name)}>
            <MessageSquare size={16} strokeWidth={1.5} />
          </Button>
        </ListRow>
      ))}
      <MessageModal to={to ?? ""} about={`Step ${step.n} · ${step.title}`} open={!!to} onOpenChange={(v) => !v && setTo(null)} notify={notify} />
    </SectionCard>
  );
}

/* ---------- Official portal and proof links ---------- */

export function PortalButton({ form, step, notify }: { form: string; step: Step; notify: Notify }) {
  return (
    <button
      type="button"
      onClick={() => notify(`Opens ${form} on the ${portalFor(step)} in a new tab`)}
      className="inline-flex h-[22px] items-center gap-1 rounded-sm bg-violet-soft px-2 text-11.5 font-semibold text-violet hover:brightness-95"
      aria-label={`Open ${form} on the ${portalFor(step)}`}
    >
      {form}
      <ExternalLink size={12} strokeWidth={1.5} />
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
        <ExternalLink size={15} strokeWidth={1.5} />
      </Button>
      {step.status === "Completed" &&
        (proof ? (
          <Button asChild size="sm" variant="ghost">
            <Link href={`/client/documents/view/${proof}`} aria-label={`Proof of step ${step.n}`}>
              <Paperclip size={14} strokeWidth={1.5} /> Proof
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => notify(`Proof · step ${step.n} · ${step.title}`)} aria-label={`Proof of step ${step.n}`}>
            <Paperclip size={14} strokeWidth={1.5} /> Proof
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
            <ChevronRight size={16} strokeWidth={1.5} className="rotate-180" />
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
            <ChevronRight size={16} strokeWidth={1.5} />
          </Link>
        </Button>
      )}
    </nav>
  );
}

/* ---------- Drop zone ---------- */

export function DropZone({ label, hint, chip, onFile, accept = ".pdf,.jpg,.jpeg,.png,.docx" }: { label: string; hint?: string; chip?: React.ReactNode; onFile: (name: string) => void; accept?: string }) {
  const [over, setOver] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);
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
      className={cn("flex items-center gap-3 rounded-md border border-dashed px-3 py-3", over ? "border-accent bg-accent-soft" : "border-line bg-raised")}
    >
      <Button size="iconSm" variant="outline" aria-label={`Upload ${label}`} onClick={() => ref.current?.click()}>
        <Upload size={15} strokeWidth={1.5} />
      </Button>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-13 font-semibold">{label}</b>
        <span className="block truncate text-12 text-muted">
          {hint ? `${hint} · ` : ""}Drop a file or{" "}
          <button type="button" className="font-semibold text-accent hover:underline" onClick={() => ref.current?.click()}>
            browse
          </button>
        </span>
      </span>
      {chip}
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0].name)} />
    </div>
  );
}

