import { cn } from "@/lib/cn";
import { barFill, type BarTone } from "@/components/ui/Bar";

export interface Segment {
  label: string;
  value: number;
  tone: BarTone;
}

/** R-25 (C2): a split as one stacked bar with a legend, in status colours. */
export function StackedBar({ segments, total, title, className, height = 8, format = (n) => String(n) }: { segments: Segment[]; total?: React.ReactNode; title?: string; className?: string; height?: 6 | 8 | 10; format?: (n: number) => string }) {
  const sum = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className={cn("grid gap-2.5", className)}>
      {(title || total !== undefined) && (
        <div className="flex items-baseline gap-2">
          {title && <span className="text-13 font-medium text-muted">{title}</span>}
          {total !== undefined && <span className="ml-auto text-26 font-medium leading-none">{total}</span>}
        </div>
      )}
      <span className="flex w-full gap-0.5 overflow-hidden rounded-bar" style={{ height }} aria-hidden>
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <i key={s.label} className={cn("block h-full rounded-[2px]", barFill[s.tone])} style={{ width: `${(s.value / sum) * 100}%` }} />
          ))}
      </span>
      <ul className="grid gap-1">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-13 text-ink-2">
            <i className={cn("h-2 w-2 flex-none rounded-[2px]", barFill[s.tone])} aria-hidden />
            {s.label}
            <b className="ml-auto font-medium tabular-nums text-ink">{format(s.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
