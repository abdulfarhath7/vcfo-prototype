"use client";
import * as React from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  key: string;
  label: string;
  count?: number | string;
}

/**
 * R-11. Segmented switch (N5, the default) for filters: quiet track, picked option filled blurple with white text.
 * Underline tabs (N4) for views of one record: 2 px blurple underline.
 */
export function Tabs({
  items,
  value,
  onChange,
  className,
  size = "sm",
  variant = "segmented",
}: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
  size?: "sm" | "md";
  variant?: "segmented" | "underline";
}) {
  if (variant === "underline")
    return (
      <div role="tablist" className={cn("flex max-w-full items-end gap-5 overflow-x-auto border-b-1.5 border-line [scrollbar-width:none]", className)}>
        {items.map((t) => {
          const on = t.key === value;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={on}
              onClick={() => onChange(t.key)}
              className={cn(
                "-mb-[1.5px] inline-flex h-10 items-center gap-1.5 whitespace-nowrap border-b-2 text-14 font-medium transition-colors",
                on ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {t.label}
              {t.count !== undefined && <span className={cn("rounded-sm px-1.5 text-12 font-medium", on ? "bg-accent-soft text-accent" : "bg-raised text-ink-2")}>{t.count}</span>}
            </button>
          );
        })}
      </div>
    );
  return (
    <div role="tablist" className={cn("inline-flex max-w-full flex-none items-center gap-0.5 overflow-x-auto rounded-md border-1.5 border-line bg-raised p-[3px] [scrollbar-width:none]", className)}>
      {items.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-13 font-medium transition-colors",
              size === "sm" ? "h-[22px]" : "h-7",
              on ? "bg-primary text-primary-on shadow-shine" : "text-ink-2 hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined && <span className={cn("text-12 font-medium", on ? "text-primary-on opacity-85" : "text-muted")}>{t.count}</span>}
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
