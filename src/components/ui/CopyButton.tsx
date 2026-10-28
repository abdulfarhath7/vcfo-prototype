"use client";
import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

/** Small icon button that copies a value. Shows a tick for 1.5 s. */
export function CopyButton({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (!done) return;
    const h = window.setTimeout(() => setDone(false), 1500);
    return () => window.clearTimeout(h);
  }, [done]);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        try {
          navigator.clipboard?.writeText(value).catch(() => {});
        } catch {}
        setDone(true);
      }}
      aria-label={done ? "Copied" : `Copy ${label ?? value}`}
      className={cn("grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-muted hover:bg-raised hover:text-ink", done && "text-ok", className)}
    >
      {done ? <Check size={15} strokeWidth={1.6} /> : <Copy size={15} strokeWidth={1.6} />}
    </button>
  );
}
