import * as React from "react";
import { cn } from "@/lib/cn";

// C4 (Data.dc.html, Compliances.dc.html): on time vs late, one stacked column per month.
// Green on-time part at the base, red late part on top with 3 px top corners. Three faint guide lines.

export interface OnTimeMonth {
  label: string;
  onTime: number;
  late: number;
}

export function OnTimeColumns({ data, height = 146, className }: { data: OnTimeMonth[]; height?: number; className?: string }) {
  const max = Math.max(1, ...data.map((m) => m.onTime + m.late));
  const px = (n: number) => Math.round((n / max) * height);
  const summary = data.map((m) => `${m.label}: ${m.onTime} on time, ${m.late} late`).join("; ");
  const many = data.length > 6;
  return (
    <div className={cn("flex flex-col gap-3.5", className)}>
      <div className="flex gap-4 text-12.5 text-ink-2" aria-hidden>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-[2px] bg-ok-mid" />
          On time
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-[2px] bg-bad-mid" />
          Late
        </span>
      </div>
      <div className="relative" role="img" aria-label={`On time vs late by month. ${summary}.`}>
        {[0, Math.round(height / 2), height].map((top) => (
          <span key={top} className="absolute inset-x-0 h-px bg-line-soft" style={{ top }} aria-hidden />
        ))}
        <div className={cn("relative z-[1] flex items-end", many ? "gap-1 sm:gap-2.5" : "gap-3.5")}>
          {data.map((m) => (
            <div key={m.label} className="flex min-w-0 flex-1 flex-col items-center gap-2" title={`${m.label} · ${m.onTime} on time · ${m.late} late`}>
              <div className="flex w-full max-w-[36px] flex-col justify-end gap-0.5" style={{ height }}>
                {m.late > 0 && <span className="rounded-t-bar bg-bad-mid" style={{ height: Math.max(2, px(m.late)) }} />}
                {m.onTime > 0 && <span className={cn("bg-ok-mid", m.late > 0 ? "rounded-b-[2px]" : "rounded-t-bar")} style={{ height: px(m.onTime) }} />}
              </div>
              <span className="text-12 text-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
