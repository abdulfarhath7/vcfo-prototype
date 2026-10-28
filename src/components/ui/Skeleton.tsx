import { cn } from "@/lib/cn";

/** Grey placeholder block. Pulses (R-41: the one motion moment); globals.css stops it under reduced motion. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-pulse rounded-sm bg-line-soft", className)} />;
}

/** Placeholder list rows with hairlines, for a list that loads. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={className}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
          <Skeleton className="h-6 w-11" />
          <span className="grid min-w-0 flex-1 gap-1.5">
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-2.5 w-2/5" />
          </span>
          <Skeleton className="h-6 w-[104px]" />
        </div>
      ))}
    </div>
  );
}
