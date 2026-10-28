"use client";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Input";
import { KeyValue, type KV } from "./KeyValue";

export interface DrawerCheck {
  id: string;
  label: string;
  done: boolean;
}

export interface TaskDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Line above the title: client identity, step code. */
  eyebrow?: React.ReactNode;
  /** Status chip after the title. */
  status?: React.ReactNode;
  facts: KV[];
  notes?: string;
  checklist?: DrawerCheck[];
  onToggle?: (id: string) => void;
  /** Main action. Hidden when the task is done. */
  onDone?: () => void;
  done?: boolean;
  /** Secondary actions next to the main one. */
  actions?: React.ReactNode;
}

/** Right-side task panel. Escape or the scrim closes it. One main button (R-12). */
export function TaskDrawer({ open, onClose, title, eyebrow, status, facts, notes, checklist, onToggle, onDone, done, actions }: TaskDrawerProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const doneN = checklist?.filter((c) => c.done).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-scrim" aria-label="Close task" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[440px] flex-col border-l border-line bg-surface">
        <header className="flex items-start gap-3 border-b border-line-soft px-5 py-4">
          <div className="min-w-0 flex-1">
            {eyebrow && <div className="flex min-w-0 items-center gap-2 text-12.5 text-muted">{eyebrow}</div>}
            <h2 className="mt-1 text-16 font-semibold leading-snug">{title}</h2>
            {status && <div className="mt-2">{status}</div>}
          </div>
          <Button variant="ghost" size="iconSm" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.6} />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-line-soft px-5 py-4">
            <KeyValue rows={facts} />
          </div>
          {notes && (
            <div className="border-b border-line-soft px-5 py-4">
              <h3 className="text-12 text-muted">Notes</h3>
              <p className="mt-1 text-13.5">{notes}</p>
            </div>
          )}
          {checklist && checklist.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 px-5 pb-1 pt-4 text-12 text-muted">
                Checklist
                <span className="text-faint">
                  {doneN} of {checklist.length}
                </span>
              </h3>
              <ul>
                {checklist.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 border-t border-line-soft px-5 py-2.5 text-13.5 first:border-t-0">
                    <Checkbox checked={c.done} onChange={() => onToggle?.(c.id)} label={c.label} />
                    <span className={cn("min-w-0 flex-1 truncate", c.done && "text-muted line-through")}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft px-5 py-3">
          {actions}
          {onDone && !done && (
            <Button variant="primary" onClick={onDone}>
              Mark done
            </Button>
          )}
        </footer>
      </aside>
    </div>
  );
}
