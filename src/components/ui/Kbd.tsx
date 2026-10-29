import * as React from "react";
import { cn } from "@/lib/cn";

/** A key cap: 18 px line, 11 px 500, 4 px corners. `dark` sits on the navy tip (TP3). */
export function Kbd({ children, dark, className }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex flex-none items-center rounded-sm px-[5px] font-sans text-11 font-medium leading-[18px]",
        dark ? "bg-white/[.10] leading-4 text-navy-ink" : "border border-line bg-raised text-muted",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
