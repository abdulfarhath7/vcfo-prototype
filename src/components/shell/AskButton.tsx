"use client";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { AskThread } from "@/components/cards/AskThread";
import type { Portal } from "@/data/nav";

const OPEN_EVENT = "vcfo:ask";

/** Open the Ask VCFO panel from any screen ("Ask VCFO why", "Ask about this"). */
export function openAsk() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** R-04: Ask VCFO is a text button. No mascot. The chat states live in AskThread. */
export function AskButton({ portal }: { portal: Portal }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("fixed bottom-5 right-5 z-30 h-9 rounded-md bg-btn px-3.5 text-13.5 font-semibold text-white shadow-pop hover:bg-btn-hover", open && "hidden")}
        aria-expanded={open}
        aria-controls="ask-panel"
      >
        Ask VCFO
      </button>
      {open && (
        <section
          id="ask-panel"
          className="fixed bottom-5 right-5 z-40 flex h-[min(620px,calc(100vh-40px))] w-[min(420px,calc(100vw-40px))] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-pop max-sm:inset-0 max-sm:h-auto max-sm:w-auto max-sm:rounded-none"
          aria-label="Ask VCFO"
        >
          <header className="flex h-head flex-none items-center gap-2.5 border-b border-line-soft px-4">
            <h2 className="text-14.5 font-semibold">Ask VCFO</h2>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-raised" aria-label="Close">
              <X size={16} strokeWidth={1.5} />
            </button>
          </header>
          <AskThread portal={portal} className="min-h-0 flex-1" />
        </section>
      )}
    </>
  );
}
