"use client";
import * as React from "react";
import type { AuditRow } from "@/data/updates-team";

// E-03: changes made in this session (status picked from a table chip). Kept in memory only, newest first.
// The rows have the Audit screen's shape, so the Audit screen can show them above AUDIT_LOG.

let rows: AuditRow[] = [];
const subs = new Set<() => void>();
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};
const EMPTY: AuditRow[] = [];

const hhmm = (at: Date) => `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;

/** Add one status change to the in-memory audit list. */
export function logStatusChange({ target, from, to, who, role = "Staff" }: { target: string; from: string; to: string; who: string; role?: string }) {
  const at = new Date();
  const row: AuditRow = {
    id: `live-${at.getTime()}-${rows.length}`,
    date: at,
    time: hhmm(at),
    type: to === "Done" ? "ok" : "up",
    cat: "Milestones",
    action: "Status changed",
    target,
    who,
    role,
    side: "sbc",
    result: "Done",
    facts: [
      { k: "Before", v: from },
      { k: "After", v: to },
    ],
  };
  rows = [row, ...rows];
  subs.forEach((f) => f());
  return row;
}

/** Live audit rows, newest first. */
export function useLiveAudit() {
  return React.useSyncExternalStore(subscribe, () => rows, () => EMPTY);
}

export const liveAudit = () => rows;
