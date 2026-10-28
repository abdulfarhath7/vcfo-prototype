import { cn } from "@/lib/cn";
import { StepMark } from "@/components/ui/StepMark";

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
    <section className={cn("min-w-0 overflow-hidden rounded-md border-1.5 border-line bg-surface px-4 py-3.5 md:px-5", className)} aria-label="Progress">
      <ol className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
        {stages.map((s, i) => {
          const last = i === stages.length - 1;
          const isNow = s.state === "now" && now;
          return (
            <li key={s.label} className={cn("flex min-w-0 items-center md:flex-1", last && "md:flex-none")}>
              {isNow ? (
                <div className="flex min-w-0 items-center gap-2.5 rounded-md bg-accent-soft px-3 py-2 text-ink shadow-[inset_0_0_0_1.5px_var(--accent-line)]">
                  <StepMark state="now" size={20} />
                  <span className="min-w-0">
                    <span className="block truncate text-12 text-accent">{now.kicker}</span>
                    <b className="block truncate text-13 font-semibold">{now.title}</b>
                    {now.sub && <span className="block truncate text-12 text-muted">{now.sub}</span>}
                  </span>
                  {now.tag && <span className="ml-1 hidden flex-none rounded-sm bg-surface px-1.5 py-0.5 text-11.5 font-medium text-accent lg:inline">{now.tag}</span>}
                </div>
              ) : (
                <div className={cn("flex min-w-0 items-center gap-2.5", s.state === "todo" && "opacity-60")}>
                  <StepMark state={s.state === "done" ? "done" : s.state === "now" ? "now" : "next"} size={20} />
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
