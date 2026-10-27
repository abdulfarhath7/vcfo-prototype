"use client";
import * as React from "react";
import * as P from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";

/** Small pop-over card (Radix Popover). The trigger is the child element. */
export function PopoverCard({
  trigger,
  title,
  children,
  footer,
  align = "start",
  side = "bottom",
  width = 300,
  open,
  onOpenChange,
}: {
  trigger: React.ReactNode;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  width?: number;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  return (
    <P.Root open={open} onOpenChange={onOpenChange}>
      <P.Trigger asChild>{trigger}</P.Trigger>
      <P.Portal>
        <P.Content
          align={align}
          side={side}
          sideOffset={6}
          collisionPadding={12}
          className={cn("z-50 max-w-[calc(100vw-24px)] overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-pop outline-none")}
          style={{ width }}
        >
          {title && <div className="border-b border-line-soft px-4 py-2.5 text-13 font-semibold">{title}</div>}
          <div className="max-h-[60vh] overflow-y-auto">{children}</div>
          {footer && <div className="flex items-center justify-end gap-2 border-t border-line-soft px-4 py-2.5">{footer}</div>}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
