import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TrackStage {
  label: string;
  sub?: string;
  state: "done" | "now" | "todo";
}

/**
 * Progress of one item in a few fixed stages: Started, Submitted, Reviewed, Completed.
 * The current stage shows as a navy block with a kicker line. Stacks on phones.
 */
export function StageTrack({ stages, now, className }: { stages: TrackStage[]; now?: { kicker: string; title: string; sub?: string; tag?: string }; className?: string }) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-lg border border-line bg-surface px-4 py-3.5 md:px-5", className)} aria-label="Progress">
      <ol className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
        {stages.map((s, i) => {
          const last = i === stages.length - 1;
          const isNow = s.state === "now" && now;
          return (
            <li key={s.label} className={cn("flex min-w-0 items-center md:flex-1", last && "md:flex-none")}>
              {isNow ? (
                <div className="flex min-w-0 items-center gap-2.5 rounded-md bg-navy px-3 py-2 text-white">
                  <span className="h-2 w-2 flex-none rounded-[2px] bg-brand" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-11.5 text-navy-ink">{now.kicker}</span>
                    <b className="block truncate text-13 font-semibold">{now.title}</b>
                    {now.sub && <span className="block truncate text-11.5 text-navy-faint">{now.sub}</span>}
                  </span>
                  {now.tag && <span className="ml-1 hidden flex-none rounded-sm bg-white/[.12] px-1.5 py-0.5 text-11 font-semibold lg:inline">{now.tag}</span>}
                </div>
              ) : (
                <div className={cn("flex min-w-0 items-center gap-2.5", s.state === "todo" && "opacity-60")}>
                  <span
                    className={cn("grid h-5 w-5 flex-none place-items-center rounded-sm", s.state === "done" ? "bg-ok-soft text-ok" : s.state === "now" ? "bg-accent-soft text-accent" : "shadow-[inset_0_0_0_1.5px_var(--line)]")}
                    aria-hidden
                  >
                    {s.state === "done" && <Check size={12} strokeWidth={2.4} />}
                  </span>
                  <span className="min-w-0">
                    <b className="block truncate text-13 font-semibold">{s.label}</b>
                    {s.sub && <span className="block truncate text-11.5 text-muted">{s.sub}</span>}
                  </span>
                </div>
              )}
              {!last && <span className={cn("mx-3 hidden h-px min-w-4 flex-1 md:block", s.state === "done" ? "bg-ok-mid" : "bg-line")} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
