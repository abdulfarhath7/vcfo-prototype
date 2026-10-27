import { cn } from "@/lib/cn";

export interface KV {
  k: string;
  v: React.ReactNode;
  /** Identifier: IBM Plex Mono (R-28). */
  mono?: boolean;
}

/** Label and value rows in two columns. `wrap` lets long values (addresses) run to several lines. */
export function KeyValue({ rows, className, cols = 2, wrap }: { rows: KV[]; className?: string; cols?: 1 | 2 | 3; wrap?: boolean }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-3", className)}>
      {rows.map((r) => (
        <div key={r.k} className="min-w-0">
          <dt className="text-12 text-muted">{r.k}</dt>
          <dd className={cn("text-13.5 font-medium", wrap ? "break-words" : "truncate", r.mono && "font-mono text-13")}>{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}
