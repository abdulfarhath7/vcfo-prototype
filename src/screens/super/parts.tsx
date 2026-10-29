"use client";
import * as React from "react";
import Link from "next/link";
import { FilterChip, FilterChipRow } from "@/components/ui/FilterChip";
import { cn } from "@/lib/cn";
import { barFill } from "@/components/ui/Bar";
import type { Client } from "@/data/people";
import { Avatar } from "@/components/ui/Avatar";
import type { ActivityRow } from "@/components/cards/ActivityList";
import { STAFF_TODAY, daysFrom, fmt } from "@/lib/dates";

const TILE: Record<Client["tone"], string> = {
  accent: "bg-accent-soft text-accent",
  violet: "bg-violet-soft text-violet",
  teal: "bg-teal-soft text-teal",
  warn: "bg-warn-soft text-warn",
  ok: "bg-ok-soft text-ok",
  idle: "bg-raised text-ink-2",
};

const ini = (name: string) => {
  const w = name.replace(/ (Pvt Ltd|LLP)$/, "").split(" ");
  return (w.length > 1 ? w[0][0] + w[1][0] : name.slice(0, 2)).toUpperCase();
};

/** 26 px initials tile in the client's identity colour (old .ct). No client shows "?". */
export function ClientTile({ client, className }: { client?: Pick<Client, "name" | "tone">; className?: string }) {
  return (
    <span className={cn("inline-grid h-[26px] w-[26px] flex-none place-items-center rounded-md text-[10.5px] font-medium", client ? TILE[client.tone] : "bg-raised text-muted", className)} aria-hidden>
      {client ? ini(client.name) : "?"}
    </span>
  );
}

/** Client name with its identity colour dot (R-35). */
export function ClientName({ client, href, sub, className }: { client: Pick<Client, "name" | "tone">; href?: string; sub?: string; className?: string }) {
  const body = (
    <>
      <i className={cn("h-2 w-2 flex-none rounded-[2px]", barFill[client.tone])} aria-hidden />
      <span className="min-w-0">
        <span className="block truncate font-medium">{client.name}</span>
        {sub && <span className="block truncate text-12 text-muted">{sub}</span>}
      </span>
    </>
  );
  const cls = cn("flex min-w-0 items-center gap-2", className);
  return href ? (
    <Link href={href} className={cn(cls, "hover:underline")}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  );
}

/** Option lists for compact Select filters. */
export const opts = (all: string, values: string[]) => [{ value: "", label: all }, ...values.map((v) => ({ value: v, label: v }))];

export const clientHref = (id: string) => `/super/clients/${id}`;

/* ---------- R-10 filter chips ---------- */

export interface FilterDef {
  key: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

/** R-10: set filters are soft blurple chips with an ×; unset ones are dashed "+ Label" chips. "Clear all" when any is set; "More filters" after 4. Shared parts (B-05). */
export function FilterChips({ filters, onClear, className }: { filters: FilterDef[]; onClear?: () => void; className?: string }) {
  return (
    <FilterChipRow
      className={className}
      onClear={onClear}
      chips={filters.map((f) => ({
        key: f.key,
        set: !!f.value,
        node: <FilterChip label={f.label} value={f.value} onChange={f.onChange} options={f.options.map((o) => ({ value: o, label: o }))} />,
      }))}
    />
  );
}

/* ---------- R-22 ST5 phase track (full form) ---------- */

const TRACK_NAMES = ["Name application", "Incorporation", "Post-incorporation", "Registrations"];
const TRACK_CODES = ["Pre-1–5", "Pre-6–14", "Post-1–11", "Reg-1–23"];

/** ST5 (a): four bars sized by step count. Done green, current blurple with a soft ring, next grey. Name above, count and codes below. */
export function PhaseTrack({ done, totals, className }: { done: number[]; totals: readonly number[]; className?: string }) {
  const cur = totals.findIndex((t, i) => (done[i] ?? 0) < t);
  return (
    <ol className={cn("flex gap-2", className)} aria-label="Phases">
      {totals.map((t, i) => {
        const n = done[i] ?? 0;
        const state = n >= t ? "done" : i === cur ? "now" : "next";
        return (
          <li key={i} className="flex min-w-0 flex-col gap-[7px]" style={{ flex: `${t} 1 0` }}>
            <span className={cn("truncate text-13 font-medium", state === "next" ? "text-muted" : "text-ink")}>{TRACK_NAMES[i]}</span>
            <span className={cn("relative h-2.5 overflow-hidden rounded-bar bg-raised", state === "now" && "shadow-[0_0_0_1.5px_var(--accent-line)]")}>
              <i className={cn("absolute inset-y-0 left-0 rounded-bar", state === "done" ? "bg-ok-mid" : "bg-primary")} style={{ width: n ? `max(${(n / t) * 100}%, 6px)` : 0 }} />
            </span>
            <span className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className={cn("text-12 font-medium", state === "done" ? "text-ok" : state === "now" ? "text-accent" : "text-muted")}>
                {n}/{t}
              </span>
              <span className={cn("hidden truncate font-mono text-11.5 sm:inline", state === "next" ? "text-faint" : "text-muted")}>{TRACK_CODES[i]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Admin feed ---------- */

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Old feed times: "Today 11:20", "Yesterday", "Wed 14 Oct". */
export function when(date: Date, time?: string) {
  const n = daysFrom(date, STAFF_TODAY);
  if (n === 0) return `Today ${time ?? ""}`.trim();
  if (n === -1) return "Yesterday";
  return `${DAY[date.getDay()]} ${fmt(date)}`;
}

/** "What admins did": the person, the full sentence, and when. */
export function AdminFeedList({ rows }: { rows: ActivityRow[] }) {
  return (
    <ul>
      {rows.map((f) => (
        <li key={f.id} className="flex items-start gap-3 border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
          <Avatar name={f.who ?? ""} size={24} className="mt-0.5" />
          <span className="min-w-0 flex-1">
            <span className="block text-13.5 leading-snug text-ink">{f.text}</span>
            <span className="block text-12.5 text-muted">
              {f.who} · {when(f.date, f.time)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
