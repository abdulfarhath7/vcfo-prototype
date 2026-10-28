"use client";
import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

export type ActionItem = { label: string; onSelect?: () => void; hint?: string; danger?: boolean } | "separator";

/** Kebab button with a small menu (Radix DropdownMenu). Arrow keys and Escape work. */
export function ActionMenu({ items, label, className, align = "end" }: { items: ActionItem[]; label: string; className?: string; align?: "start" | "end" }) {
  return (
    <M.Root modal={false}>
      <M.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
          className={cn("grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-muted hover:bg-ghost hover:text-ink data-[state=open]:bg-ghost data-[state=open]:text-ink", className)}
        >
          <MoreHorizontal size={16} strokeWidth={1.6} />
        </button>
      </M.Trigger>
      <M.Portal>
        <M.Content align={align} sideOffset={4} collisionPadding={12} className="z-50 min-w-[200px] overflow-hidden rounded-md border border-line bg-surface p-1 text-14 text-ink shadow-float" onClick={(e) => e.stopPropagation()}>
          {items.map((it, i) =>
            it === "separator" ? (
              <M.Separator key={`s${i}`} className="my-1 h-px bg-line-soft" />
            ) : (
              <M.Item
                key={it.label}
                onSelect={() => it.onSelect?.()}
                className={cn("flex h-[34px] cursor-pointer select-none items-center gap-3 rounded-sm px-2.5 outline-none data-[highlighted]:bg-hover", it.danger && "text-bad")}
              >
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.hint && <span className="rounded-sm border border-line px-1 font-mono text-11 text-muted">{it.hint}</span>}
              </M.Item>
            ),
          )}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}
