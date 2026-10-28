"use client";
import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  /** Small line above the title. */
  eyebrow?: React.ReactNode;
  /** Chips or small text under the title. */
  sub?: React.ReactNode;
  /** Footer: one main button and secondary buttons (R-12). */
  footer?: React.ReactNode;
  /** Right side of the head, before the close button: tabs. */
  right?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** No body padding: for lists and grids. */
  flush?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const widths = { sm: "max-w-[420px]", md: "max-w-[560px]", lg: "max-w-[760px]", xl: "max-w-[1000px]" };

/** Centred dialog on a scrim (Radix Dialog). Escape and the scrim close it. Full screen on phones. */
export function Modal({ open, onOpenChange, title, eyebrow, sub, footer, right, size = "md", flush, children, className }: ModalProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <D.Content
          className={cn(
            "fixed inset-x-0 bottom-0 top-auto z-50 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-md border border-line bg-surface text-ink shadow-dialog outline-none",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[86vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md",
            widths[size],
            className,
          )}
          aria-describedby={undefined}
        >
          <header className="flex min-h-head items-start gap-3 border-b border-line-soft px-4 py-3 md:px-5">
            <div className="min-w-0 flex-1">
              {eyebrow && <div className="truncate text-12.5 text-muted">{eyebrow}</div>}
              <D.Title className="text-15 font-medium leading-snug">{title}</D.Title>
              {sub && <div className="mt-1.5 flex flex-wrap items-center gap-2 text-12.5 text-muted">{sub}</div>}
            </div>
            {right && <div className="flex flex-none items-center gap-2 self-center">{right}</div>}
            <D.Close className="grid h-8 w-8 flex-none place-items-center rounded-md text-muted hover:bg-ghost" aria-label="Close">
              <X size={16} strokeWidth={1.6} />
            </D.Close>
          </header>
          <div className={cn("min-h-0 flex-1 overflow-y-auto", !flush && "px-4 py-4 md:px-5")}>{children}</div>
          {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft px-4 py-3 md:px-5">{footer}</footer>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
