"use client";
import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { Kbd } from "@/components/ui/Kbd";

export type ActionItem =
  | {
      label: string;
      onSelect?: () => void;
      /** Small grey note at the right: "12 files". */
      hint?: string;
      /** D1: one-letter shortcut (E Edit, A Reassign, C Copy link). Shown as a key; works while the menu is open. */
      key?: string;
      danger?: boolean;
    }
  | "separator";

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
          {items.map((it, i) =>
            it === "separator" ? (
              <M.Separator key={`s${i}`} className="mx-0 my-1 h-[1.5px] bg-line-soft" />
            ) : (
              <M.Item
                key={it.label}
                onSelect={() => it.onSelect?.()}
                aria-keyshortcuts={it.key?.toUpperCase()}
                className={cn("flex h-[34px] cursor-pointer select-none items-center gap-2.5 rounded-sm px-[9px] outline-none data-[highlighted]:bg-hover", it.danger && "text-bad")}
              >
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.hint && <span className="flex-none text-12 text-muted">{it.hint}</span>}
                {it.key && <Kbd>{it.key.toUpperCase()}</Kbd>}
              </M.Item>
            ),
          )}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}
