"use client";
import * as React from "react";
import { InlineConfirm } from "@/components/cards/InlineConfirm";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { STAFF_TODAY } from "@/lib/dates";
import { AUDIT, type AuditAction, type AuditEntry, type AuditResult } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Input";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import * as M from "@radix-ui/react-dropdown-menu";

// ---------- Audit log for this session (R-40: risky changes and settings are logged) ----------

const KEY = "vcfo.dev.audit";
const EMPTY: AuditEntry[] = [];
let cache: AuditEntry[] | null = null;
let seq = 0;
const subs = new Set<() => void>();

function read(): AuditEntry[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as Array<Omit<AuditEntry, "at"> & { at: string }>;
    cache = raw.map((r) => ({ ...r, at: new Date(r.at) }));
  } catch {
    cache = [];
  }
  return cache;
}

/** The sample day (STAFF_TODAY) at the current clock time. */
export function nowToday() {
  const now = new Date();
  const t = new Date(STAFF_TODAY);
  t.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
  return t;
}

/** Write one row to the audit log. The sample day is STAFF_TODAY; the clock time is now. */
export function logAudit(action: AuditAction, target: string, result: AuditResult = "Done", before?: string, after?: string) {
  const t = nowToday();
  seq += 1;
  const entry: AuditEntry = { id: `s${t.getTime()}-${seq}`, at: t, actor: "Farhath", action, target, result, before, after };
  cache = [entry, ...read()];
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage blocked: the row stays for this page view.
  }
  subs.forEach((f) => f());
}

function subscribe(cb: () => void) {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

/** Session rows first, then the sample rows. */
export function useAudit(): AuditEntry[] {
  const session = React.useSyncExternalStore(subscribe, read, () => EMPTY);
  return React.useMemo(() => [...session, ...AUDIT], [session]);
}

// ---------- Console settings shared by every page (R-40: a plain setting saves as it changes) ----------

const SKEY = "vcfo.dev.settings";
type Settings = Record<string, boolean | number>;
const NONE: Settings = {};
let scache: Settings | null = null;
const ssubs = new Set<() => void>();

function readSettings(): Settings {
  if (scache) return scache;
  try {
    scache = JSON.parse(sessionStorage.getItem(SKEY) ?? "{}") as Settings;
  } catch {
    scache = {};
  }
  return scache;
}

function subscribeSettings(cb: () => void) {
  ssubs.add(cb);
  return () => {
    ssubs.delete(cb);
  };
}

function writeSetting(key: string, v: boolean | number) {
  scache = { ...readSettings(), [key]: v };
  try {
    sessionStorage.setItem(SKEY, JSON.stringify(scache));
  } catch {
    // Storage blocked: the value stays for this page view.
  }
  ssubs.forEach((f) => f());
}

/** A switch value shared across pages: "wa-fallback" on Connections and Access is one value. */
export function useSwitch(key: string, initial: boolean, label: string): [boolean, (v: boolean) => void] {
  const all = React.useSyncExternalStore(subscribeSettings, readSettings, () => NONE);
  const on = key in all ? Boolean(all[key]) : initial;
  const set = (v: boolean) => {
    writeSetting(key, v);
    logAudit("Change setting", label, "Done", on ? "On" : "Off", v ? "On" : "Off");
  };
  return [on, set];
}

/** A segmented choice shared across pages. Returns the picked index. */
export function useChoice(key: string, opts: string[], initial: number, label: string): [number, (i: number) => void] {
  const all = React.useSyncExternalStore(subscribeSettings, readSettings, () => NONE);
  const cur = key in all ? Number(all[key]) : initial;
  const set = (i: number) => {
    if (i === cur) return;
    writeSetting(key, i);
    logAudit("Change setting", label, "Done", opts[cur], opts[i]);
  };
  return [cur, set];
}

/** Segmented control on a quiet track: the Tabs look (R-11, N5). */
export function Segmented({ opts, value, onChange, label }: { opts: string[]; value: number; onChange: (i: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full flex-none items-center gap-0.5 overflow-x-auto rounded-md border-1.5 border-line bg-raised p-[3px] [scrollbar-width:none]">
      {opts.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={i === value}
          onClick={() => onChange(i)}
          className={cn(
            "inline-flex h-[22px] items-center whitespace-nowrap rounded-sm px-3 text-13 font-medium transition-colors",
            i === value ? "bg-primary text-primary-on shadow-shine" : "text-ink-2 hover:text-ink",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** Settings row: label and hint on the left, value and control on the right. Stacks on phones. */
export function SettingRow({ label, hint, children, className }: { label: string; hint?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-2 border-t border-line-soft px-4 py-3 text-14 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-center sm:gap-4 md:px-5", className)}>
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        {hint && <div className="text-12.5 text-muted">{hint}</div>}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">{children}</div>
    </div>
  );
}

/** A switch row bound to a shared setting. */
/** `confirmOn` asks before the switch turns on (R-40), for a risky switch such as "Pause all jobs". */
export function SwitchRow({ k, initial, label, hint, confirmOn }: { k: string; initial: boolean; label: string; hint?: string; confirmOn?: { question: string; confirm: string } }) {
  const [on, set] = useSwitch(k, initial, label);
  const [asking, setAsking] = React.useState(false);
  return (
    <>
      <SettingRow label={label} hint={hint}>
        <Switch on={on} onChange={(v) => (v && confirmOn ? setAsking(true) : set(v))} label={label} />
      </SettingRow>
      {asking && confirmOn && (
        <InlineConfirm
          question={confirmOn.question}
          confirm={confirmOn.confirm}
          onConfirm={() => {
            set(true);
            setAsking(false);
          }}
          onCancel={() => setAsking(false)}
        />
      )}
    </>
  );
}

/** A segmented row bound to a shared setting. */
export function ChoiceRow({ k, opts, initial, label, hint }: { k: string; opts: string[]; initial: number; label: string; hint?: string }) {
  const [cur, set] = useChoice(k, opts, initial, label);
  return (
    <SettingRow label={label} hint={hint}>
      <Segmented opts={opts} value={cur} onChange={set} label={label} />
    </SettingRow>
  );
}

// ---------- Pick a grid row in place (R-36) ----------

/** First cell of a pickable row: a plain text button, so the keyboard can pick the row too. */
export function PickCell({ on, onPick, children }: { on: boolean; onPick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onPick();
      }}
      aria-expanded={on}
      className="text-left font-medium text-ink hover:underline"
    >
      {children}
    </button>
  );
}

/** Panel under a grid: scrolls into view when its record changes. */
export function useRevealRef<T extends HTMLElement>(key: string | null) {
  const ref = React.useRef<T>(null);
  const prev = React.useRef(key);
  React.useEffect(() => {
    if (prev.current === key) return;
    prev.current = key;
    if (key) ref.current?.scrollIntoView({ block: "nearest" });
  }, [key]);
  return ref;
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="iconSm" onClick={onClick} aria-label="Close">
      <X size={16} strokeWidth={1.6} />
    </Button>
  );
}

/** Small label above a block inside a card body. */
export function BlockLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="border-t border-line-soft px-4 pb-1 pt-3 text-12.5 font-medium text-muted md:px-5">{children}</h3>;
}

/** Run log: time and level in sans (R-28), the console text in mono. */
export function LogLines({ lines }: { lines: Array<{ at: Date; level: "info" | "warn" | "error"; text: string }> }) {
  const lv = { info: "text-muted", warn: "text-warn", error: "text-bad" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <ol className="grid gap-1 px-4 py-3 text-12.5 md:px-5">
      {lines.map((l, i) => (
        <li key={i} className="grid grid-cols-[60px_44px_minmax(0,1fr)] gap-2">
          <span className="text-faint">{`${pad(l.at.getHours())}:${pad(l.at.getMinutes())}:${pad(l.at.getSeconds())}`}</span>
          <span className={lv[l.level]}>{l.level}</span>
          <span className="break-words font-mono text-ink-2">{l.text}</span>
        </li>
      ))}
    </ol>
  );
}


// ---------- Status chips in tables (R-13) ----------

/**
 * Status chip for a grid column. `wide` gives the whole column 124 px chips where a word ("Needs re-auth") does not fit 104 px.
 * "Working" means healthy here, so it keeps its own word instead of the six-word "In progress".
 */
export function StatusChip({ tone, children, wide, loose }: { tone?: ChipTone; children: string; wide?: boolean; loose?: boolean }) {
  return (
    <Chip fixed={!loose} tone={tone ?? (children === "Working" ? "ok" : undefined)} className={wide && !loose ? "w-[124px]" : undefined}>
      {children === "Working" ? <>{children}</> : children}
    </Chip>
  );
}

// ---------- Filter chips (R-10) ----------

/**
 * R-10 filter chip. Set: soft blurple fill with the value and an ×. Not set: a dashed "+ Label" chip.
 * Both open a light menu with 34 px rows (R-48).
 */
export function FilterChip({ label, value, options, onChange, all = "all" }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void; all?: string }) {
  const set = value !== all;
  const cur = options.find((o) => o.value === value);
  return (
    <span
      className={cn(
        "inline-flex h-7 flex-none items-center rounded-md border-1.5 text-13",
        set ? "border-accent-line bg-accent-soft text-accent" : "border-dashed border-line-2 text-ink-2",
      )}
    >
      <M.Root modal={false}>
        <M.Trigger asChild>
          <button type="button" className={cn("inline-flex h-full items-center gap-1.5 whitespace-nowrap font-medium outline-none focus-visible:ring-4 focus-visible:ring-focus", set ? "rounded-l-md pl-2.5 pr-1" : "rounded-md px-2.5")}>
            {set ? (
              <>
                <span className="text-ink-2">{label}</span>
                <b className="font-medium">{cur?.label ?? value}</b>
              </>
            ) : (
              <>
                <Plus size={14} strokeWidth={1.6} aria-hidden />
                {label}
                <ChevronDown size={13} strokeWidth={1.6} className="text-muted" aria-hidden />
              </>
            )}
          </button>
        </M.Trigger>
        <M.Portal>
          <M.Content align="start" sideOffset={4} collisionPadding={12} className="z-50 max-h-[320px] min-w-[200px] overflow-y-auto rounded-md border border-line bg-surface p-1 text-14 text-ink shadow-float">
            {options
              .filter((o) => o.value !== all)
              .map((o) => (
                <M.Item key={o.value} onSelect={() => onChange(o.value)} className="flex h-[34px] cursor-pointer select-none items-center gap-3 rounded-sm px-2.5 outline-none data-[highlighted]:bg-hover">
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.value === value && <Check size={15} strokeWidth={1.6} className="text-accent" aria-hidden />}
                </M.Item>
              ))}
          </M.Content>
        </M.Portal>
      </M.Root>
      {set && (
        <button type="button" onClick={() => onChange(all)} aria-label={`Remove ${label} filter`} className="mr-1 grid h-[18px] w-[18px] place-items-center rounded-sm text-accent hover:bg-accent-line">
          <X size={13} strokeWidth={1.6} />
        </button>
      )}
    </span>
  );
}

/**
 * R-28: mono only for machine identifiers (ANTHROPIC_API_KEY, vcfo-apprunner, sk-ant-…9c1d, 1.4.2).
 * Emails, phone numbers and plain words stay in Roboto, even where the data marks them mono.
 */
export function ident(v: string) {
  const t = v.trim().replace(/\s*•+\s*/g, "•");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return false;
  if (/^[A-Z0-9_]+( \(.*\))?$/.test(t)) return true;
  return !/\s/.test(t);
}
