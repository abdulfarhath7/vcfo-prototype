import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-9 w-full rounded-md border border-line bg-surface px-3 text-13.5 text-ink placeholder:text-faint outline-none focus-visible:ring-2 focus-visible:ring-accent-line",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export function Field({ label, children, className, hint }: { label: string; children: React.ReactNode; className?: string; hint?: string }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-12.5 font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="text-12 text-faint">{hint}</span>}
    </label>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors", on ? "bg-btn" : "bg-line")}
    >
      <span className={cn("absolute h-4 w-4 rounded-full bg-white transition-transform", on ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange?: (v: boolean) => void; label?: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      className="h-[18px] w-[18px] cursor-pointer rounded-sm border-line accent-[var(--navy)]"
    />
  );
}
