"use client";
import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { Check, Plus, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterChipProps<V extends string | null = string> {
  /** "Status", "Lead", "Area". */
  label: string;
  value: V;
  options: FilterOption[];
  onChange: (v: V) => void;
  /** The value that means "not set". "" by default; null or "all" where a screen stores it so. */
  none?: V;
  /** Set chip: hide the label and show the value only. */
  valueOnly?: boolean;
  className?: string;
}

const menuCls = "z-50 max-h-[320px] min-w-[180px] overflow-y-auto rounded-md border-1.5 border-line bg-surface p-[5px] text-14 text-ink shadow-float";
const itemCls = "flex h-[34px] cursor-pointer select-none items-center gap-2.5 rounded-sm px-[9px] outline-none data-[highlighted]:bg-hover";

/**
 * R-10 / Q3 filter chip, 28 px. Set: soft blurple fill, "Label Value" and an ×. Not set: a dashed "+ Label" chip.
 * Both open a light menu with 34 px rows (D2). The × clears the filter.
 */
export function FilterChip<V extends string | null = string>({ label, value, options, onChange, none = "" as V, valueOnly, className }: FilterChipProps<V>) {
  const set = value !== none && value !== null && value !== "";
  const cur = options.find((o) => o.value === value);
  const menu = (
    <M.Portal>
      <M.Content align="start" sideOffset={4} collisionPadding={12} className={menuCls}>
        {options
          .filter((o) => o.value !== none)
          .map((o) => (
            <M.Item key={o.value} onSelect={() => onChange(o.value as V)} className={itemCls}>
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {o.value === value && <Check size={14} strokeWidth={1.6} className="text-accent" aria-hidden />}
            </M.Item>
          ))}
      </M.Content>
    </M.Portal>
  );
  if (set)
    return (
      <span className={cn("inline-flex h-7 max-w-full flex-none items-center gap-1.5 rounded-md border-1.5 border-accent-line bg-accent-soft pl-2.5 pr-1.5 text-13 text-accent", className)}>
        <M.Root modal={false}>
          <M.Trigger asChild>
            <button type="button" className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap rounded-sm outline-none focus-visible:ring-4 focus-visible:ring-focus" aria-label={`${label}: ${cur?.label ?? value}. Change`}>
              {!valueOnly && <span className="text-ink-2">{label}</span>}
              <b className="max-w-[160px] truncate font-medium">{cur?.label ?? value}</b>
            </button>
          </M.Trigger>
          {menu}
        </M.Root>
        <button type="button" aria-label={`Remove ${label} filter`} onClick={() => onChange(none)} className="grid h-[18px] w-[18px] flex-none place-items-center rounded-sm text-accent hover:bg-accent-line focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus">
          <X size={13} strokeWidth={1.6} />
        </button>
      </span>
    );
  return (
    <M.Root modal={false}>
      <M.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 flex-none items-center gap-1.5 whitespace-nowrap rounded-md border-1.5 border-dashed border-line-2 px-2.5 text-13 font-medium text-ink-2 hover:bg-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus data-[state=open]:bg-hover",
            className,
          )}
        >
          <Plus size={14} strokeWidth={1.6} aria-hidden />
          {label}
        </button>
      </M.Trigger>
      {menu}
    </M.Root>
  );
}

/**
 * A row of filter chips (Q3). Shows the first `max` chips (4), then "More filters" for the rest.
 * Chips that are set always show. "Clear all" appears when any chip is set and `onClear` is given.
 * Each chip is { key, set, node }.
 */
export function FilterChipRow({
  chips,
  onClear,
  max = 4,
  className,
  children,
}: {
  chips: Array<{ key: string; set: boolean; node: React.ReactNode }>;
  onClear?: () => void;
  max?: number;
  className?: string;
  /** Extra things at the end of the row (tabs, a count). */
  children?: React.ReactNode;
}) {
  const [more, setMore] = React.useState(false);
  const hidden = chips.slice(max).filter((c) => !c.set);
  const shown = more ? chips : chips.filter((c, i) => i < max || c.set);
  const any = chips.some((c) => c.set);
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {shown.map((c) => (
        <React.Fragment key={c.key}>{c.node}</React.Fragment>
      ))}
      {hidden.length > 0 && (
        <button
          type="button"
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
          className="inline-flex h-7 flex-none items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-13 font-medium text-ink-2 hover:bg-ghost focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
        >
          <SlidersHorizontal size={14} strokeWidth={1.6} aria-hidden />
          {more ? "Fewer filters" : `More filters · ${hidden.length}`}
        </button>
      )}
      {any && onClear && (
        <button type="button" onClick={onClear} className="inline-flex h-7 flex-none items-center whitespace-nowrap rounded-md px-2 text-13 font-medium text-accent hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus">
          Clear all
        </button>
      )}
      {children}
    </div>
  );
}
