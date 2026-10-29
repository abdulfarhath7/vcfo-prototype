"use client";
import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Kbd } from "@/components/ui/Kbd";
import { Avatar } from "@/components/ui/Avatar";

export type ActionItem =
  | {
      label: string;
      onSelect?: () => void;
      /** Small grey note at the right: "12 files". */
      hint?: string;
      /** D1: one-letter shortcut (E Edit, A Reassign, C Copy link). Shown as a key; works while the menu is open. */
      key?: string;
      danger?: boolean;
      /** D1: 16 px icon before the label. */
      Icon?: LucideIcon;
      /** D1: a side menu of people, as Reassign has. The key opens it. */
      people?: { label?: string; names: string[]; current?: string; onPick: (name: string) => void };
    }
  | "separator";

const ROW = "flex h-[34px] cursor-pointer select-none items-center gap-2.5 rounded-sm px-[9px] outline-none data-[highlighted]:bg-hover data-[state=open]:bg-hover";

/**
 * Kebab button with a small menu (Radix DropdownMenu, D2: 34 px rows). Arrow keys and Escape work.
 * Items with a `key` show it at the right; pressing that letter while the menu is open runs the item.
 * `trigger` replaces the kebab button (it must forward a ref, like Button).
 */
export function ActionMenu({ items, label, className, align = "end", trigger }: { items: ActionItem[]; label: string; className?: string; align?: "start" | "end"; trigger?: React.ReactElement }) {
  const [open, setOpen] = React.useState(false);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    const hit = items.find((it) => it !== "separator" && it.key && it.key.toLowerCase() === e.key.toLowerCase());
    if (!hit || hit === "separator") return;
    // Stop Radix typeahead from moving focus; run the item and close.
    e.preventDefault();
    e.stopPropagation();
    if (hit.people) {
      // Open the side menu as ArrowRight does, so focus moves into it.
      const el = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-menu-key="${hit.key}"]`);
      el?.focus();
      el?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      return;
    }
    setOpen(false);
    hit.onSelect?.();
  };
  return (
    <M.Root modal={false} open={open} onOpenChange={setOpen}>
      <M.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label={label}
            onClick={(e) => e.stopPropagation()}
            className={cn("grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-muted hover:bg-ghost hover:text-ink data-[state=open]:bg-ghost data-[state=open]:text-ink", className)}
          >
            <MoreHorizontal size={16} strokeWidth={1.6} />
          </button>
        )}
      </M.Trigger>
      <M.Portal>
        <M.Content
          align={align}
          sideOffset={4}
          collisionPadding={12}
          aria-label={label}
          onKeyDown={onKeyDown}
          className="z-50 min-w-[200px] overflow-hidden rounded-md border-1.5 border-line bg-surface p-[5px] text-14 text-ink shadow-float"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((it, i) => {
            if (it === "separator") return <M.Separator key={`s${i}`} className="mx-0 my-1 h-[1.5px] bg-line-soft" />;
            const body = (
              <>
                {it.Icon && <it.Icon size={16} strokeWidth={1.6} className={cn("flex-none", it.danger ? "text-bad" : "text-muted")} aria-hidden />}
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.hint && <span className="flex-none text-12 text-muted">{it.hint}</span>}
                {it.key && <Kbd>{it.key.toUpperCase()}</Kbd>}
              </>
            );
            if (it.people) {
              const pp = it.people;
              return (
                <M.Sub key={it.label}>
                  <M.SubTrigger data-menu-key={it.key} aria-keyshortcuts={it.key?.toUpperCase()} className={ROW}>
                    {body}
                    {!it.key && <ChevronRight size={14} strokeWidth={1.6} className="flex-none text-muted" aria-hidden />}
                  </M.SubTrigger>
                  <M.Portal>
                    <M.SubContent sideOffset={8} collisionPadding={12} className="z-50 w-[220px] rounded-md border-1.5 border-line bg-surface p-[5px] text-14 text-ink shadow-float" onClick={(e) => e.stopPropagation()}>
                      <M.Label className="px-[9px] pb-1 pt-1.5 text-12 font-medium text-muted">{pp.label ?? "Assign to"}</M.Label>
                      {pp.names.map((n) => (
                        <M.Item key={n} onSelect={() => pp.onPick(n)} className={ROW}>
                          <Avatar name={n} size={24} />
                          <span className="min-w-0 flex-1 truncate">{n}</span>
                          {n === pp.current && <Check size={14} strokeWidth={1.6} className="flex-none text-accent" aria-label="Current" />}
                        </M.Item>
                      ))}
                    </M.SubContent>
                  </M.Portal>
                </M.Sub>
              );
            }
            return (
              <M.Item key={it.label} onSelect={() => it.onSelect?.()} aria-keyshortcuts={it.key?.toUpperCase()} className={cn(ROW, it.danger && "text-bad")}>
                {body}
              </M.Item>
            );
          })}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}
