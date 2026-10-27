"use client";
import * as React from "react";
import { X } from "lucide-react";
import { TODAY } from "@/lib/dates";
import { AUDIT, type AuditAction, type AuditEntry, type AuditResult } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Input";

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

/** The sample day (TODAY) at the current clock time. */
export function nowToday() {
  const now = new Date();
  const t = new Date(TODAY);
  t.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
  return t;
}

/** Write one row to the audit log. The sample day is TODAY; the clock time is now. */
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

/** Segmented control on a quiet track: the Tabs look (R-11). */
export function Segmented({ opts, value, onChange, label }: { opts: string[]; value: number; onChange: (i: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full flex-none items-center gap-0.5 overflow-x-auto rounded-md border border-line bg-raised p-0.5 [scrollbar-width:none]">
      {opts.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={i === value}
          onClick={() => onChange(i)}
          className={`inline-flex h-[26px] items-center whitespace-nowrap rounded-sm px-2.5 text-12.5 font-semibold transition-colors ${i === value ? "bg-btn text-white" : "text-muted hover:text-ink"}`}
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
    <div className={`grid gap-2 border-t border-line-soft px-4 py-3 text-13.5 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-center sm:gap-4 md:px-5 ${className ?? ""}`}>
      <div className="min-w-0">
        <div className="font-semibold">{label}</div>
        {hint && <div className="text-12.5 text-muted">{hint}</div>}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">{children}</div>
    </div>
  );
}

/** A switch row bound to a shared setting. */
export function SwitchRow({ k, initial, label, hint }: { k: string; initial: boolean; label: string; hint?: string }) {
  const [on, set] = useSwitch(k, initial, label);
  return (
    <SettingRow label={label} hint={hint}>
      <Switch on={on} onChange={set} label={label} />
    </SettingRow>
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
      aria-expanded={on} className="text-left font-semibold text-ink hover:underline">
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
      <X size={16} strokeWidth={1.5} />
    </Button>
  );
}

/** Small label above a block inside a card body. */
export function BlockLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="border-t border-line-soft px-4 pb-1 pt-3 text-12.5 font-semibold text-muted md:px-5">{children}</h3>;
}

/** Monospace run log: time, level, text. */
export function LogLines({ lines }: { lines: Array<{ at: Date; level: "info" | "warn" | "error"; text: string }> }) {
  const lv = { info: "text-muted", warn: "text-warn", error: "text-bad" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <ol className="grid gap-1 px-4 py-3 font-mono text-12.5 md:px-5">
      {lines.map((l, i) => (
        <li key={i} className="grid grid-cols-[64px_44px_minmax(0,1fr)] gap-2">
          <span className="text-faint">{`${pad(l.at.getHours())}:${pad(l.at.getMinutes())}:${pad(l.at.getSeconds())}`}</span>
          <span className={lv[l.level]}>{l.level}</span>
          <span className="break-words text-ink-2">{l.text}</span>
        </li>
      ))}
    </ol>
  );
}
