import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Bar, type BarTone } from "@/components/ui/Bar";
import { Empty } from "./SectionCard";

export interface ProgressItem {
  id: string;
  name: string;
  /** "Bharath · Step 10 · ready 13 Oct" */
  sub?: string;
  pct: number;
  tone?: BarTone;
  href?: string;
}

/** K-23: bars in category colours. No info icons. */
export function ProgressList({ items, className }: { items: ProgressItem[]; className?: string }) {
  if (items.length === 0) return <Empty />;
  return (
    <ul className={className}>
      {items.map((it) => {
        const inner = (
          <>
            <span className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-13.5 font-semibold">{it.name}</span>
              <span className="text-12.5 text-muted">{it.pct}%</span>
              {it.href && <ChevronRight size={16} strokeWidth={1.6} className="text-faint" />}
            </span>
            {it.sub && <span className="block truncate text-12.5 text-muted">{it.sub}</span>}
            <Bar pct={it.pct} tone={it.tone} className="mt-2" />
          </>
        );
        const cls = cn("block border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5", it.href && "hover:bg-raised");
        return (
          <li key={it.id}>
            {it.href ? (
              <Link href={it.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
