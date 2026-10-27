"use client";
import * as React from "react";
import { X } from "lucide-react";
import { TODAY } from "@/lib/dates";
import { AUDIT, type AuditAction, type AuditEntry, type AuditResult } from "@/data/dev";
import { Button } from "@/components/ui/Button";

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

/** Write one row to the audit log. The sample day is TODAY; the clock time is now. */
export function logAudit(action: AuditAction, target: string, result: AuditResult = "Done") {
  const now = new Date();
  const t = new Date(TODAY);
  t.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
  seq += 1;
  const entry: AuditEntry = { id: `s${now.getTime()}-${seq}`, at: t, actor: "Farhath", action, target, result };
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

// ---------- Pick a grid row in place (R-36) ----------

/** Class that marks a grid row with its id, so a click on the row can find it. */
export const rowTag = (id: string) => `dgk-${id}`;

/** Picked row: soft blue cells over the zebra fill. */
export const pickedRow = "[&>td]:!bg-accent-soft";

/** Wrap a DataGrid: a click anywhere on a row (not on its buttons) picks the row. */
export function RowPicker({ onPick, children }: { onPick: (id: string) => void; children: React.ReactNode }) {
  return (
    <div
      className="min-w-0"
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest("button, a, input, select")) return;
        const tr = t.closest("tr");
        const m = tr ? /(?:^|\s)dgk-(\S+)/.exec(tr.className) : null;
        if (m) onPick(m[1]);
      }}
    >
      {children}
    </div>
  );
}

/** First cell of a pickable row: a plain text button, so the keyboard can pick the row too. */
export function PickCell({ on, onPick, children }: { on: boolean; onPick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onPick} aria-expanded={on} className="text-left font-semibold text-ink hover:underline">
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
