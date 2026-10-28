import * as React from "react";
import { cn } from "@/lib/cn";

/** R-47 (I1): 40 px, 1.5 px edge, 6 px corners. Focus: blurple edge and a 4 px glow. Error: red edge. */
export const inputClass =
  "h-10 w-full rounded-md border-1.5 border-line-2 bg-surface px-3 text-14 text-ink placeholder:text-faint outline-none transition-shadow focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-focus aria-[invalid=true]:border-bad-mid";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...props} />
));
Input.displayName = "Input";

export function Field({ label, children, className, hint, error }: { label: string; children: React.ReactNode; className?: string; hint?: string; error?: string }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-13 font-medium text-ink-2">{label}</span>
      {children}
      {error ? <span className="text-12.5 text-bad">{error}</span> : hint && <span className="text-12.5 text-muted">{hint}</span>}
    </label>
  );
}

/** R-47 (X2): 44 x 24 rounded-rectangle track (6 px), 4 px-corner thumb. */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-none items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus",
        on ? "bg-primary" : "bg-line-2",
      )}
    >
      <span className={cn("absolute h-[18px] w-[18px] rounded-sm bg-white shadow-control transition-transform", on ? "translate-x-[23px]" : "translate-x-[3px]")} />
    </button>
  );
}

/** R-47 (X4): 18 px, 4 px corners, blurple when on. */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange?: (v: boolean) => void; label?: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      className="h-[18px] w-[18px] flex-none cursor-pointer rounded-sm accent-[var(--primary)]"
    />
  );
}
