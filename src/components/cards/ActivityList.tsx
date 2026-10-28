import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { Empty } from "./SectionCard";

export interface ActivityRow {
  id: string;
  date: Date;
  time?: string;
  text: string;
  who: string;
}

/** Date in mono, text, who. */
export function ActivityList({ rows, className }: { rows: ActivityRow[]; className?: string }) {
  if (rows.length === 0) return <Empty />;
  return (
    <ul className={className}>
      {rows.map((r) => (
        <li key={r.id} className="grid grid-cols-[64px_minmax(0,1fr)] items-baseline gap-3 border-t border-line-soft px-4 py-2.5 text-13.5 first:border-t-0 md:grid-cols-[64px_minmax(0,1fr)_110px] md:px-5">
          <span className="text-12.5 text-muted">
            {fmt(r.date)}
            {r.time && <span className="hidden md:inline"> {r.time}</span>}
          </span>
          <span className="min-w-0 break-words">{r.text}</span>
          <span className={cn("truncate text-12.5 text-muted md:text-right")}>{r.who}</span>
        </li>
      ))}
    </ul>
  );
}
