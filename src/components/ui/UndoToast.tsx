"use client";
import * as React from "react";
import { Check, FileCheck2, Upload, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

/** A1 kinds: a white toast with a status tile. Without a kind the toast is the dark A2 toast. */
export type ToastKind = "saved" | "filed" | "uploaded";

export interface ToastOptions {
  /** A1: white toast with a status tile. */
  kind?: ToastKind;
  /** A1: second line under the title. */
  sub?: string;
  /** Undo. A2 shows it as a text button; A1 as a small outline button. */
  onUndo?: () => void;
  /** A1: one small action, for example "View". */
  action?: { label: string; onClick: () => void };
}

interface ToastState extends ToastOptions {
  id: number;
  text: string;
}

const KIND: Record<ToastKind, { Icon: LucideIcon; tile: string }> = {
  saved: { Icon: Check, tile: "bg-ok-soft text-ok" },
  filed: { Icon: FileCheck2, tile: "bg-ok-soft text-ok" },
  uploaded: { Icon: Upload, tile: "bg-accent-soft text-accent" },
};

const PLACE = "fixed bottom-[132px] left-1/2 z-[80] max-w-[calc(100vw-32px)] -translate-x-1/2 md:bottom-16 md:left-[calc(248px+20px)] md:translate-x-0";

/**
 * One toast at a time, bottom left, 5 s.
 * A2 (default): dark, one line, optional Undo. `toast.show("All marked read", undo)`.
 * A1: white with a status tile. `toast.show("Filing saved", { kind: "saved", sub: "GSTR-3B is ready", onUndo })`.
 * Render {toast.node}.
 */
export function useUndoToast(ms = 5000) {
  const [t, setT] = React.useState<ToastState | null>(null);
  React.useEffect(() => {
    if (!t) return;
    const h = window.setTimeout(() => setT(null), ms);
    return () => window.clearTimeout(h);
  }, [t, ms]);
  const show = React.useCallback((text: string, undo?: (() => void) | ToastOptions) => {
    const opts: ToastOptions = typeof undo === "function" ? { onUndo: undo } : (undo ?? {});
    setT({ id: Date.now(), text, ...opts });
  }, []);
  const close = React.useCallback(() => setT(null), []);

  let node: React.ReactNode = null;
  if (t?.kind) {
    const k = KIND[t.kind];
    node = (
      <div key={t.id} role="status" aria-live="polite" className={cn(PLACE, "flex w-[380px] items-start gap-2.5 rounded-md border-1.5 border-line bg-surface p-3.5 text-ink shadow-float")}>
        <span className={cn("grid h-[22px] w-[22px] flex-none place-items-center rounded-sm", k.tile)} aria-hidden>
          <k.Icon size={14} strokeWidth={1.6} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <b className="text-14 font-medium leading-[22px]">{t.text}</b>
          {t.sub && <span className="text-13 leading-[19px] text-ink-2">{t.sub}</span>}
        </span>
        {t.action && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              t.action?.onClick();
              close();
            }}
          >
            {t.action.label}
          </Button>
        )}
        {t.onUndo && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              t.onUndo?.();
              close();
            }}
          >
            Undo
          </Button>
        )}
        <button type="button" className="grid h-[30px] w-6 flex-none place-items-center rounded-sm text-muted hover:bg-ghost hover:text-ink" aria-label="Dismiss" onClick={close}>
          <X size={14} strokeWidth={1.6} />
        </button>
      </div>
    );
  } else if (t) {
    node = (
      <div key={t.id} role="status" aria-live="polite" className={cn(PLACE, "flex items-center gap-3 rounded-md bg-navy px-4 py-2.5 text-13.5 text-white shadow-float")}>
        <span className="min-w-0 truncate">{t.text}</span>
        {t.onUndo && (
          <button
            type="button"
            className="flex-none font-medium text-navy-on-ink underline-offset-2 hover:underline"
            onClick={() => {
              t.onUndo?.();
              close();
            }}
          >
            Undo
          </button>
        )}
        <button type="button" className="grid h-6 w-6 flex-none place-items-center rounded-sm text-navy-ink hover:bg-white/[.12]" aria-label="Dismiss" onClick={close}>
          <X size={14} strokeWidth={1.6} />
        </button>
      </div>
    );
  }
  return { show, node, hide: close };
}
