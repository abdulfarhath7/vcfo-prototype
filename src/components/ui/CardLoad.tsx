"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Fired by Tabs when the picked tab changes. Bubbles, so the card around the tabs sees it. */
export const TAB_EVENT = "vcfo:tab";

const MS = 300;
/** Cards that already loaded once on a page in this session. They do not show L1 again on return. */
const seen = new Set<string>();

const bar = "block animate-pulse rounded-bar bg-line motion-reduce:animate-none";

/** L1 shapes: rows with a tile, two lines and a 104 px chip. Clipped to the body height. */
function Shapes({ flush }: { flush?: boolean }) {
  if (flush)
    return (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
            <span className={cn(bar, "h-7 w-7 flex-none rounded-md")} />
            <span className="grid min-w-0 flex-1 gap-1.5">
              <span className={cn(bar, "h-3 w-3/5")} />
              <span className={cn(bar, "h-2.5 w-2/5")} />
            </span>
            <span className={cn(bar, "hidden h-6 w-[104px] flex-none rounded-md sm:block")} />
          </div>
        ))}
      </>
    );
  return (
    <div className="flex flex-col gap-3.5 px-4 py-4 md:px-5">
      <div className="flex items-center gap-3">
        <span className={cn(bar, "h-9 w-9 flex-none rounded-md")} />
        <span className="flex flex-1 flex-col gap-2">
          <span className={cn(bar, "h-3 w-3/5")} />
          <span className={cn(bar, "h-2.5 w-[35%]")} />
        </span>
      </div>
      <span className={cn(bar, "h-2.5 w-full")} />
      <span className={cn(bar, "h-2.5 w-[85%]")} />
      <div className="flex gap-2.5">
        <span className={cn(bar, "h-6 w-[104px] rounded-md")} />
        <span className={cn(bar, "h-6 w-[104px] rounded-md")} />
        <span className={cn(bar, "h-6 w-20 rounded-md")} />
      </div>
    </div>
  );
}

/**
 * The body of a SectionCard with L1 loading: grey shapes for 300 ms on the first load of the card on a page,
 * and again when a tab in the card changes. The real content stays mounted (state, focus and size kept) but hidden.
 * Under reduced motion the shapes do not pulse.
 */
export function CardBody({ name, flush, className, children }: { name: string; flush?: boolean; className?: string; children?: React.ReactNode }) {
  const path = usePathname();
  const key = `${path}|${name}`;
  const ref = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(() => !seen.has(key));

  // First load: hide for 300 ms, once per card and page.
  React.useEffect(() => {
    if (seen.has(key)) return;
    seen.add(key);
    let fired = false;
    const h = window.setTimeout(() => {
      fired = true;
      setLoading(false);
    }, MS);
    return () => {
      window.clearTimeout(h);
      // React runs effects twice in development; forget the card if the timer never fired.
      if (!fired) seen.delete(key);
    };
  }, [key]);

  // Tab switch inside this card: show the shapes again.
  React.useEffect(() => {
    const card = ref.current?.parentElement;
    if (!card) return;
    let h = 0;
    const on = (e: Event) => {
      e.stopPropagation();
      setLoading(true);
      window.clearTimeout(h);
      h = window.setTimeout(() => setLoading(false), MS);
    };
    card.addEventListener(TAB_EVENT, on);
    return () => {
      card.removeEventListener(TAB_EVENT, on);
      window.clearTimeout(h);
    };
  }, []);

  return (
    <div ref={ref} aria-busy={loading || undefined} className={cn(loading && "relative [&>*:not([data-l1])]:invisible", className)}>
      {children}
      {loading && (
        <div data-l1 aria-hidden className="absolute inset-0 z-[1] overflow-hidden bg-surface">
          <Shapes flush={flush} />
        </div>
      )}
    </div>
  );
}
