import Link from "next/link";
import { cn } from "@/lib/cn";
import { OwnerChip, type Owner } from "@/components/ui/Chip";
import { Empty } from "./SectionCard";

export interface WeekRow {
  id: string;
  /** "Today", "Wed 7 Oct" */
  when: string;
  now?: boolean;
  owner: Owner;
  ownerLabel?: string;
  text: string;
  href?: string;
}

/** This week list. R-14: 12 px gap between the owner chip and the text (C-0023). */
export function WeekList({ rows, className }: { rows: WeekRow[]; className?: string }) {
  if (rows.length === 0) return <Empty />;
  return (
    <ul className={className}>
      {rows.map((r) => {
        const inner = (
          <>
            <span className={cn("w-[84px] flex-none text-12.5", r.now ? "font-semibold text-accent" : "text-muted")}>{r.when}</span>
            <OwnerChip owner={r.owner} label={r.ownerLabel} />
            <span className="min-w-0 flex-1 truncate pl-3 text-13.5">{r.text}</span>
          </>
        );
        const cls = cn("flex items-center gap-3 border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5", r.href && "hover:bg-raised");
        return (
          <li key={r.id}>
            {r.href ? (
              <Link href={r.href} className={cls}>
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
