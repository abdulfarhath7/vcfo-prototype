import { cn } from "@/lib/cn";
import { StepMark } from "@/components/ui/StepMark";
import { fmt } from "@/lib/dates";
import { OwnerChip, type Owner } from "@/components/ui/Chip";

export interface ThreadStep {
  id: string;
  title: string;
  state: "done" | "current" | "upcoming";
  date?: Date;
  by?: string;
  owner?: Owner;
  /** Chip text when the owner is an authority other than MCA: "GSTN", "EPFO". */
  ownerLabel?: string;
  note?: string;
}

/** R-23: done steps show dates. Upcoming steps are faded, without dates. */
export function Thread({ steps, className }: { steps: ThreadStep[]; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={s.id} className={cn("relative grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 pb-4 last:pb-0", s.state === "upcoming" && "opacity-50")}>
            {!last && <span className="absolute left-[9px] top-5 h-[calc(100%-20px)] border-l border-line" aria-hidden />}
            <StepMark state={s.state === "done" ? "done" : s.state === "current" ? "now" : "next"} size={20} />
            <div className="min-w-0 pt-px">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className={cn("text-13.5", s.state === "current" ? "font-semibold" : "font-medium")}>{s.title}</span>
                {s.owner && <OwnerChip owner={s.owner} label={s.ownerLabel} className="h-5 w-auto px-2 text-11.5" />}
                {s.state !== "upcoming" && s.date && <span className="ml-auto text-12.5 text-muted">{fmt(s.date)}</span>}
              </div>
              {(s.by || s.note) && s.state !== "upcoming" && (
                <p className="mt-0.5 text-12.5 text-muted">
                  {s.by}
                  {s.by && s.note && <span className="mx-1.5 text-faint">·</span>}
                  {s.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
