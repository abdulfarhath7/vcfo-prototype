import Link from "next/link";
import { Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { FileBadge, type FileType } from "@/components/ui/FileBadge";
import { Empty } from "./SectionCard";

export interface Doc {
  id: string;
  name: string;
  type: FileType;
  from: "client" | "sbc" | "mca";
  fromLabel?: string;
  date: Date;
  href?: string;
  size?: string;
}

export interface DocGroup {
  label: string;
  docs: Doc[];
}

/** Recent documents with file badges coloured by type (R-26). */
export function DocList({ groups, className }: { groups: DocGroup[]; className?: string }) {
  if (groups.every((g) => g.docs.length === 0)) return <Empty />;
  return (
    <div className={className}>
      {groups.map((g) =>
        g.docs.length === 0 ? null : (
          <div key={g.label}>
            <p className="border-t border-line-soft bg-raised px-4 py-1.5 text-11.5 font-semibold text-faint first:border-t-0 md:px-5">{g.label}</p>
            <ul>
              {g.docs.map((d) => {
                const inner = (
                  <>
                    <FileBadge type={d.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-13.5 font-semibold">{d.name}</span>
                      <span className="block truncate text-12.5 text-muted">
                        <span className={cn(d.from === "client" && "text-warn", d.from === "mca" && "text-violet")}>{d.fromLabel ?? (d.from === "client" ? "Client" : d.from === "sbc" ? "SBC" : "MCA")}</span>
                        <span className="mx-1.5 text-faint">·</span>
                        {fmt(d.date)}
                        {d.size && (
                          <>
                            <span className="mx-1.5 text-faint">·</span>
                            {d.size}
                          </>
                        )}
                      </span>
                    </span>
                    <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-muted hover:bg-raised" aria-label={`Download ${d.name}`} title="Download">
                      <Download size={16} strokeWidth={1.5} />
                    </span>
                  </>
                );
                const cls = cn("flex items-center gap-3 border-t border-line-soft px-4 py-2.5 md:px-5", d.href && "hover:bg-raised");
                return (
                  <li key={d.id}>
                    {d.href ? (
                      <Link href={d.href} className={cls}>
                        {inner}
                      </Link>
                    ) : (
                      <div className={cls}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ),
      )}
    </div>
  );
}
