import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type StepState = "done" | "now" | "next";
export type StepTone = "prog" | "teal" | "warn" | "bad";

const RING: Record<StepTone, string> = {
  prog: "shadow-[inset_0_0_0_1.5px_var(--accent-mid),0_0_0_4px_var(--accent-soft)]",
  teal: "shadow-[inset_0_0_0_1.5px_var(--teal-mid),0_0_0_4px_var(--teal-soft)]",
  warn: "shadow-[inset_0_0_0_1.5px_var(--warn-mid),0_0_0_4px_var(--warn-soft)]",
  bad: "shadow-[inset_0_0_0_1.5px_var(--bad-mid),0_0_0_4px_var(--bad-soft)]",
};
const DOT: Record<StepTone, string> = { prog: "bg-accent-mid", teal: "bg-teal-mid", warn: "bg-warn-mid", bad: "bg-bad-mid" };

/**
 * ST5 step marker (R-22), 22 px. Done: green square with a tick. Live: a ring with a square in the status colour and a soft halo.
 * Upcoming: a dashed square.
 */
export function StepMark({ state, tone = "prog", size = 22, className, label }: { state: StepState; tone?: StepTone; size?: 18 | 20 | 22; className?: string; label?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-grid flex-none place-items-center rounded-sm",
        state === "done" && "bg-ok-mid text-white",
        state === "now" && cn("bg-surface", RING[tone]),
        state === "next" && "border-[1.5px] border-dashed border-line-2",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {state === "done" && <Check size={size - 9} strokeWidth={2.6} />}
      {state === "now" && <i className={cn("h-2 w-2 rounded-[2px]", DOT[tone])} />}
    </span>
  );
}
