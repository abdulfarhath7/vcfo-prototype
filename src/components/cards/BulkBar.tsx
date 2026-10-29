"use client";
import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { Bell, Check, Download, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";

/** D2 light menu of people: a group label, 34 px rows with a face, a tick on the current person. The child is the trigger. */
export function PeopleMenu({
  people,
  label = "Assign to",
  current,
  onPick,
  open,
  onOpenChange,
  children,
  align = "end",
}: {
  people: string[];
  label?: string;
  current?: string;
  onPick: (person: string) => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <M.Root modal={false} open={open} onOpenChange={onOpenChange}>
      <M.Trigger asChild>{children}</M.Trigger>
      <M.Portal>
        <M.Content align={align} sideOffset={4} collisionPadding={12} className="z-50 w-[220px] rounded-md border-1.5 border-line bg-surface p-[5px] text-14 text-ink shadow-float" onClick={(e) => e.stopPropagation()}>
          <M.Label className="px-[9px] pb-1 pt-1.5 text-12 font-medium text-muted">{label}</M.Label>
          {people.map((p) => (
            <M.Item key={p} onSelect={() => onPick(p)} className="flex h-[34px] cursor-pointer select-none items-center gap-2.5 rounded-sm px-[9px] outline-none data-[highlighted]:bg-hover">
              <Avatar name={p} size={24} />
              <span className="min-w-0 flex-1 truncate">{p}</span>
              {p === current && <Check size={14} strokeWidth={1.6} className="flex-none text-accent" aria-label="Current" />}
            </M.Item>
          ))}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

export interface BulkHandlers {
  assign?: (person: string) => void;
  remind?: () => void;
  done?: () => void;
  export?: () => void;
}

const btn =
  "inline-flex h-[30px] flex-none items-center gap-1.5 rounded-md border-1.5 border-line-2 bg-surface px-2.5 text-13 font-medium normal-case tracking-normal text-ink shadow-control hover:bg-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus max-sm:w-[30px] max-sm:justify-center max-sm:px-0 data-[state=open]:bg-hover";

/**
 * E-01: bulk actions bar. DataGrid lays it over the table head while rows are picked, so the rows do not move.
 * Assign, Remind, Mark done and Export; each action is optional. Phone: icon buttons with names for screen readers.
 */
export function BulkBar({
  count,
  pageAll,
  total,
  onSelectAll,
  onClear,
  handlers,
  people = [],
  peopleLabel,
  noun = ["row", "rows"],
}: {
  count: number;
  /** Every row on this page is picked. */
  pageAll: boolean;
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
  handlers: BulkHandlers;
  people?: string[];
  peopleLabel?: string;
  noun?: [string, string];
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 text-13 font-medium normal-case tracking-normal text-ink" role="toolbar" aria-label="Bulk actions">
      <span className="whitespace-nowrap" aria-live="polite">
        {count} selected
      </span>
      {pageAll && count < total && (
        <button type="button" onClick={onSelectAll} className="whitespace-nowrap text-accent hover:underline">
          Select all {total} {noun[1]}
        </button>
      )}
      <span className="ml-auto flex items-center gap-1.5">
        {handlers.assign && people.length > 0 && (
          <PeopleMenu people={people} label={peopleLabel} onPick={(p) => handlers.assign?.(p)}>
            <button type="button" className={btn} aria-label={`Assign ${count} ${count === 1 ? noun[0] : noun[1]}`}>
              <UserPlus size={15} strokeWidth={1.6} aria-hidden />
              <span className="max-sm:sr-only">Assign</span>
            </button>
          </PeopleMenu>
        )}
        {handlers.remind && (
          <button type="button" className={btn} onClick={handlers.remind}>
            <Bell size={15} strokeWidth={1.6} aria-hidden />
            <span className="max-sm:sr-only">Remind</span>
          </button>
        )}
        {handlers.done && (
          <button type="button" className={btn} onClick={handlers.done}>
            <Check size={15} strokeWidth={1.6} aria-hidden />
            <span className="max-sm:sr-only">Mark done</span>
          </button>
        )}
        {handlers.export && (
          <button type="button" className={btn} onClick={handlers.export}>
            <Download size={15} strokeWidth={1.6} aria-hidden />
            <span className="max-sm:sr-only">Export</span>
          </button>
        )}
        <button type="button" onClick={onClear} className={cn("grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-muted hover:bg-ghost hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus")} aria-label="Clear selection" title="Clear selection">
          <X size={15} strokeWidth={1.6} />
        </button>
      </span>
    </div>
  );
}
