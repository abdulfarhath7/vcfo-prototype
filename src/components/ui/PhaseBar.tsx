import { cn } from "@/lib/cn";

/**
 * Four-part progress bar: one segment per phase, sized by its step count, filled by steps done.
 * Old prototype: data.js phaseBar() on the super admin client grid and expected-certificates list.
 */
export function PhaseBar({ done, totals, names, className }: { done: number[]; totals: readonly number[]; names?: string[]; className?: string }) {
  return (
    <span className={cn("flex h-1.5 min-w-[96px] gap-0.5", className)} role="img" aria-label={totals.map((t, i) => `${names?.[i] ?? `Phase ${i + 1}`} ${done[i]} of ${t}`).join(", ")}>
      {totals.map((t, i) => {
        const pct = Math.round(((done[i] ?? 0) / t) * 100);
        return (
          <span key={i} className="relative overflow-hidden rounded-[2px] bg-line" style={{ flex: t }} title={`${names?.[i] ?? `Phase ${i + 1}`} · ${done[i] ?? 0} of ${t}`}>
            <span className="absolute inset-y-0 left-0 bg-ok-mid" style={{ width: `${pct}%` }} />
          </span>
        );
      })}
    </span>
  );
}
