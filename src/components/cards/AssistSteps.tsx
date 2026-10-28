"use client";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { StepMark } from "@/components/ui/StepMark";

export interface AssistStepRow {
  title: string;
  state: "done" | "run" | "wait";
  /** "Done · 10:02 am", "Working on it", "Waiting". */
  note: string;
  /** Screenshot label: "GST · p1". */
  shot?: string;
}

/**
 * VCFO Assist: the filing assistant works on the government portal step by step and keeps a screenshot of each page.
 * Body only; place it in a SectionCard or a panel. Old source: reference/old-screens/s/home/Item.dc.html "File with VCFO Assist".
 */
export function AssistSteps({ steps, className }: { steps: AssistStepRow[]; className?: string }) {
  return (
    <ol className={cn("grid", className)}>
      {steps.map((s, i) => (
        <li key={i} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13.5 first:border-t-0 md:px-5">
          <StepMark state={s.state === "done" ? "done" : s.state === "run" ? "now" : "next"} size={20} />
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate", s.state === "wait" ? "text-muted" : "font-semibold")}>{s.title}</span>
            <span className={cn("block text-12.5", s.state === "run" ? "text-accent" : "text-muted")}>{s.note}</span>
          </span>
          {s.shot && (
            <span className="inline-flex h-[22px] flex-none items-center gap-1 rounded-sm bg-raised px-2 font-mono text-11 text-muted" title="Screenshot of this page">
              <ImageIcon size={12} strokeWidth={1.6} aria-hidden />
              {s.shot}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
