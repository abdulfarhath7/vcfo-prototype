"use client";
import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PopoverCard } from "@/components/ui/PopoverCard";

export type ViewFilters = Record<string, string>;
export interface SavedView {
  key: string;
  label: string;
  filters: ViewFilters;
}

const same = (a: ViewFilters, b: ViewFilters) => [...new Set([...Object.keys(a), ...Object.keys(b)])].every((k) => (a[k] ?? "") === (b[k] ?? ""));

const read = (k: string): SavedView[] => {
  try {
    const v = JSON.parse(window.localStorage.getItem(k) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x.label === "string" && x.filters) : [];
  } catch {
    return [];
  }
};
const write = (k: string, v: SavedView[]) => {
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* private window: the view lasts for this page only */
  }
};

/** The key of the view that matches the filters, or "" when none matches. */
export const activeView = (views: SavedView[], current: ViewFilters) => views.find((v) => same(v.filters, current))?.key ?? "";

export interface SavedViewsProps {
  /** Per user and per table, for example "manager:work". Saved views live in localStorage under it. */
  storageKey: string;
  /** Default views ("All", "My overdue", "This week", "Waiting on clients"). */
  views: SavedView[];
  /** The filters on the table now. */
  current: ViewFilters;
  onApply: (filters: ViewFilters) => void;
  className?: string;
}

/**
 * E-06: saved views as a segmented tab row (R-11) above a big table. A view is a named set of filters.
 * "+ Save view" keeps the current filters under a name in localStorage. A saved view can be removed while it is picked.
 */
export function SavedViews({ storageKey, views, current, onApply, className }: SavedViewsProps) {
  const key = `vcfo.views.${storageKey}`;
  const [mine, setMine] = React.useState<SavedView[]>([]);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  React.useEffect(() => setMine(read(key)), [key]);
  const all = [...views, ...mine];
  const on = activeView(all, current);
  const taken = all.some((v) => v.label.toLowerCase() === name.trim().toLowerCase());
  const save = () => {
    const label = name.trim();
    if (!label || taken) return;
    const next = [...mine, { key: `c-${Date.now()}`, label, filters: { ...current } }];
    setMine(next);
    write(key, next);
    setName("");
    setOpen(false);
  };
  const remove = (k: string) => {
    const next = mine.filter((v) => v.key !== k);
    setMine(next);
    write(key, next);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div role="tablist" aria-label="Views" className="inline-flex max-w-full flex-none items-center gap-0.5 overflow-x-auto rounded-md border-1.5 border-line bg-raised p-[3px] [scrollbar-width:none]">
        {all.map((v) => {
          const picked = v.key === on;
          const custom = mine.some((m) => m.key === v.key);
          return (
            <span key={v.key} className={cn("inline-flex flex-none items-center rounded-sm", picked && "bg-primary text-primary-on shadow-shine")}>
              <button
                type="button"
                role="tab"
                aria-selected={picked}
                onClick={() => onApply({ ...v.filters })}
                className={cn("inline-flex h-[22px] items-center whitespace-nowrap rounded-sm px-3 text-13 font-medium transition-colors", picked ? "text-primary-on" : "text-ink-2 hover:text-ink", picked && custom && "pr-1.5")}
              >
                {v.label}
              </button>
              {picked && custom && (
                <button type="button" onClick={() => remove(v.key)} aria-label={`Remove view ${v.label}`} title="Remove view" className="mr-1 grid h-4 w-4 place-items-center rounded-sm text-primary-on hover:bg-white/[.18]">
                  <X size={12} strokeWidth={1.6} />
                </button>
              )}
            </span>
          );
        })}
      </div>
      <PopoverCard
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setName("");
        }}
        width={260}
        label="Save view"
        trigger={
          <button type="button" disabled={!!on} title={on ? "These filters are a view already" : undefined} className="inline-flex h-7 flex-none items-center gap-1.5 rounded-md border-1.5 border-dashed border-line-2 px-2.5 text-13 font-medium text-ink-2 hover:bg-hover disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent data-[state=open]:bg-hover">
            <Plus size={14} strokeWidth={1.6} aria-hidden />
            Save view
          </button>
        }
      >
        <form
          className="grid gap-2.5 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="View name" aria-label="View name" maxLength={32} />
          <Button type="submit" variant="primary" size="sm" disabled={!name.trim() || taken} className="justify-self-end">
            Save view
          </Button>
        </form>
      </PopoverCard>
    </div>
  );
}
