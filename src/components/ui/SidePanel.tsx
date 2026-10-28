"use client";
import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SidePanelProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  /** Chips under the title. */
  sub?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  width?: number;
}

/** Right-side detail panel (Radix Dialog). Same frame as TaskDrawer, for any record drill. Full width on phones. */
export function SidePanel({ open, onOpenChange, title, eyebrow, sub, footer, children, width = 440 }: SidePanelProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <D.Content
          className={cn("fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-surface text-ink shadow-dialog outline-none")}
          style={{ maxWidth: width }}
          aria-describedby={undefined}
        >
          <header className="flex items-start gap-3 border-b border-line-soft px-5 py-4">
            <div className="min-w-0 flex-1">
              {eyebrow && <div className="flex min-w-0 items-center gap-2 truncate text-12.5 text-muted">{eyebrow}</div>}
              <D.Title className="mt-0.5 text-15 font-medium leading-snug">{title}</D.Title>
              {sub && <div className="mt-2 flex flex-wrap items-center gap-2">{sub}</div>}
            </div>
            <D.Close className="grid h-8 w-8 flex-none place-items-center rounded-md text-muted hover:bg-ghost" aria-label="Close">
              <X size={16} strokeWidth={1.6} />
            </D.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft px-5 py-3">{footer}</footer>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** A titled block inside a SidePanel or Modal, with a hairline above. */
export function PanelSection({ title, children, className, flush }: { title?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <div className={cn("border-b border-line-soft last:border-b-0", !flush && "px-5 py-4", className)}>
      {title && <h3 className={cn("mb-2 text-11.5 font-medium uppercase tracking-[.07em] text-muted", flush && "px-5 pt-4")}>{title}</h3>}
      {children}
    </div>
  );
}
