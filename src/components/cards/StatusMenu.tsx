"use client";
import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { statusWord } from "@/components/ui/Chip";

/** R-13: the six status words, in the order of the work. */
export const SIX_WORDS = ["Not started", "In progress", "Waiting", "Due soon", "Overdue", "Done"] as const;
export type SixWord = (typeof SIX_WORDS)[number];

const DOT: Record<SixWord, string> = {
  "Not started": "bg-idle-mid",
  "In progress": "bg-accent-mid",
  Waiting: "bg-teal-mid",
  "Due soon": "bg-warn-mid",
  Overdue: "bg-bad-mid",
  Done: "bg-ok-mid",
};

/** The six-word form of any status ("With client" is Waiting, "Due this week" is Due soon). */
export const sixOf = (status: string): SixWord => {
  const w = statusWord(status).word;
  if ((SIX_WORDS as readonly string[]).includes(w)) return w as SixWord;
  if (/due/i.test(status)) return "Due soon";
  return "Not started";
};

/**
 * E-03: the status chip opens a small light menu (D2) with the six words. The current word has a tick.
 * The child is the chip. Arrow keys, Enter and Escape work (Radix).
 */
export function StatusMenu({ value, onPick, label, children }: { value: string; onPick: (word: SixWord) => void; label: string; children: React.ReactNode }) {
  const cur = sixOf(value);
  return (
    <M.Root modal={false}>
      <M.Trigger asChild>
        <button
          type="button"
          data-grid-ctl
          aria-label={`${label} · status ${cur}. Change status`}
          onClick={(e) => e.stopPropagation()}
          className="-m-0.5 inline-flex max-w-full rounded-md p-0.5 hover:bg-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus data-[state=open]:bg-ghost"
        >
          {children}
        </button>
      </M.Trigger>
      <M.Portal>
        <M.Content align="start" sideOffset={4} collisionPadding={12} className="z-50 w-[200px] rounded-md border-1.5 border-line bg-surface p-[5px] text-14 text-ink shadow-float" onClick={(e) => e.stopPropagation()}>
          <M.Label className="px-[9px] pb-1 pt-1.5 text-12 font-medium text-muted">Status</M.Label>
          {SIX_WORDS.map((w) => (
            <M.Item
              key={w}
              onSelect={() => w !== cur && onPick(w)}
              className="flex h-[34px] cursor-pointer select-none items-center gap-2.5 rounded-sm px-[9px] outline-none data-[highlighted]:bg-hover"
            >
              <i className={cn("h-[7px] w-[7px] flex-none rounded-[2px]", DOT[w])} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{w}</span>
              {w === cur && <Check size={14} strokeWidth={1.6} className="flex-none text-accent" aria-label="Current" />}
            </M.Item>
          ))}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}
