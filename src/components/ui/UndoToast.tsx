"use client";
import * as React from "react";
import { X } from "lucide-react";

interface ToastState {
  id: number;
  text: string;
  onUndo?: () => void;
}

/**
 * One toast at a time, bottom left, 5 s. Optional Undo.
 * Usage: const toast = useUndoToast(); toast.show("All marked read", undo); render {toast.node}.
 */
export function useUndoToast(ms = 5000) {
  const [t, setT] = React.useState<ToastState | null>(null);
  React.useEffect(() => {
    if (!t) return;
    const h = window.setTimeout(() => setT(null), ms);
    return () => window.clearTimeout(h);
  }, [t, ms]);
  const show = React.useCallback((text: string, onUndo?: () => void) => setT({ id: Date.now(), text, onUndo }), []);
  const node = t ? (
    <div role="status" aria-live="polite" className="fixed bottom-[132px] left-1/2 z-[80] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-md bg-navy px-4 py-2.5 text-13 text-white shadow-pop md:bottom-16 md:left-[calc(248px+20px)] md:translate-x-0">
      <span className="min-w-0 truncate">{t.text}</span>
      {t.onUndo && (
        <button
          type="button"
          className="flex-none font-semibold text-navy-ink underline-offset-2 hover:underline"
          onClick={() => {
            t.onUndo?.();
            setT(null);
          }}
        >
          Undo
        </button>
      )}
      <button type="button" className="grid h-6 w-6 flex-none place-items-center rounded-sm text-navy-ink hover:bg-white/[.12]" aria-label="Dismiss" onClick={() => setT(null)}>
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  ) : null;
  return { show, node, hide: () => setT(null) };
}
