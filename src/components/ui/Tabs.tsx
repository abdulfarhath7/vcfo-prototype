"use client";
import * as React from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  key: string;
  label: string;
  count?: number | string;
}

/** R-11: small inline buttons on a quiet track. Picked tab is navy with white text. No sliding highlight. */
export function Tabs({
  items,
  value,
  onChange,
  className,
  size = "sm",
}: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="tablist" className={cn("inline-flex max-w-full flex-none items-center gap-0.5 overflow-x-auto rounded-md border border-line bg-raised p-0.5 [scrollbar-width:none]", className)}>
      {items.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 font-semibold transition-colors",
              size === "sm" ? "h-[26px] text-12.5" : "h-[30px] text-13",
              on ? "bg-navy text-white" : "text-muted hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined && <span className={cn("text-11.5 font-semibold", on ? "text-navy-ink" : "text-faint")}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Uncontrolled helper for screens: keeps the picked key. */
export function useTabs(initial: string) {
  const [value, setValue] = React.useState(initial);
  return { value, onChange: setValue };
}
