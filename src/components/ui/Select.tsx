import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options: Array<{ value: string; label: string }>;
  size?: "sm" | "md";
}

/** R-10: compact dropdown filter. Native select, styled. */
export function Select({ options, className, size = "sm", ...rest }: SelectProps) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <select
        className={cn(
          "appearance-none rounded-md border border-line bg-surface pl-2.5 pr-7 font-semibold text-ink-2 outline-none focus-visible:ring-2 focus-visible:ring-accent-line",
          size === "sm" ? "h-[30px] text-12.5" : "h-9 text-13.5",
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} strokeWidth={1.5} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
    </span>
  );
}

/** Same look, but on a navy grid head bar. */
export function SelectOnNavy({ options, className, ...rest }: Omit<SelectProps, "size">) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <select
        className="h-[28px] appearance-none rounded-sm border border-white/[.18] bg-white/[.08] pl-2.5 pr-7 text-12.5 font-semibold text-white outline-none [&>option]:text-ink"
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} strokeWidth={1.5} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-navy-ink" aria-hidden />
    </span>
  );
}
