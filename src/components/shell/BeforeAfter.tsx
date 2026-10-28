"use client";
import { cn } from "@/lib/cn";
import { useClientState } from "./ClientState";

/**
 * Before | After switch for the client portal (old shell.js `.vp-ba`).
 * Desktop: in the top bar. Phone: at the top of the sidebar drawer.
 * It drives useClientState(), so every client screen follows it.
 */
export function BeforeAfter({ onNavy, className }: { onNavy?: boolean; className?: string }) {
  const { incorporated, set } = useClientState();
  const opts: Array<[boolean, string]> = [
    [false, "Before"],
    [true, "After"],
  ];
  return (
    <div
      role="group"
      aria-label="Company before or after incorporation"
      className={cn("grid h-8 w-[168px] flex-none grid-cols-2 rounded-lg p-[3px]", onNavy ? "bg-white/[.1]" : "bg-raised", className)}
    >
      {opts.map(([v, label]) => {
        const on = incorporated === v;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={on}
            onClick={() => set(v)}
            className={cn(
              "rounded-md text-12 font-bold transition-colors",
              on ? (onNavy ? "bg-white text-navy" : "bg-btn text-white") : onNavy ? "text-navy-ink hover:text-white" : "text-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
