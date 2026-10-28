import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** R-24: a plain chevron. No box. Rotates 90° when open. */
export function Chevron({ open, className }: { open?: boolean; className?: string }) {
  return (
    <ChevronRight
      size={16}
      strokeWidth={1.6}
      aria-hidden
      className={cn("flex-none text-faint transition-transform", open && "rotate-90", className)}
    />
  );
}
