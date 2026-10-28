import { cn } from "@/lib/cn";

/**
 * ST5 compact form (R-22): four bars sized by step count. Done phase green, current phase blurple with a soft ring, next grey.
 * Old prototype: data.js phaseBar() on the super admin client grid and expected-certificates list.
 */
export function PhaseBar({ done, totals, names, className }: { done: number[]; totals: readonly number[]; names?: string[]; className?: string }) {
  const cur = totals.findIndex((t, i) => (done[i] ?? 0) < t);
  return (
    <span className={cn("flex h-2 min-w-[96px] items-center gap-1", className)} role="img" aria-label={totals.map((t, i) => `${names?.[i] ?? `Phase ${i + 1}`} ${done[i]} of ${t}`).join(", ")}>
      {totals.map((t, i) => {
        const pct = Math.round(((done[i] ?? 0) / t) * 100);
        return (
          <span
            key={i}
            className={cn("relative h-2 overflow-hidden rounded-bar bg-raised", i === cur && "ring-[1.5px] ring-accent-line")}
            style={{ flex: t }}
            title={`${names?.[i] ?? `Phase ${i + 1}`} · ${done[i] ?? 0} of ${t}`}
          >
            <span className={cn("absolute inset-y-0 left-0 rounded-bar", pct === 100 ? "bg-ok-mid" : "bg-primary")} style={{ width: pct > 0 ? `max(${pct}%, 6px)` : 0 }} />
          </span>
        );
      })}
    </span>
  );
}
