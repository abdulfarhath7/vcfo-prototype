import Link from "next/link";
import { cn } from "@/lib/cn";
import { Chip, Tag, type ChipTone } from "@/components/ui/Chip";
import { Chevron } from "@/components/ui/Chevron";
import { Empty } from "./SectionCard";

export interface Tile {
  id: string;
  name: string;
  /** Category tag: regulator or law. */
  tag?: { label: string; tone?: ChipTone };
  chip: { label: string; tone?: ChipTone };
  /** "Due 11 Oct", "Expected 12 Oct". */
  date?: string;
  /** Red date (late). */
  late?: boolean;
  href?: string;
}

export interface TileGroup {
  /** Omit for a single grid without a group label. */
  label?: string;
  tiles: Tile[];
}

/** C-0019, C-0022: small cards in a responsive grid. Name, tag, status chip, date. */
export function TileGrid({ groups, className }: { groups: TileGroup[]; className?: string }) {
  const shown = groups.filter((g) => g.tiles.length > 0);
  if (shown.length === 0) return <Empty />;
  return (
    <div className={className}>
      {shown.map((g, gi) => (
        <div key={g.label ?? gi} className="border-t border-line-soft first:border-t-0">
          {g.label && (
            <p className="flex items-center gap-2 bg-raised px-4 py-1.5 text-11.5 font-semibold text-faint md:px-5">
              {g.label}
              <span>{g.tiles.length}</span>
            </p>
          )}
          <ul className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 md:px-5 2xl:grid-cols-3">
            {g.tiles.map((t) => {
              const inner = (
                <>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-13.5 font-semibold">{t.name}</span>
                    {t.href && <Chevron />}
                  </span>
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    {t.tag && <Tag tone={t.tag.tone}>{t.tag.label}</Tag>}
                    <Chip tone={t.chip.tone} fixed>{t.chip.label}</Chip>
                  </span>
                  <span className={cn("block truncate text-12.5", t.late ? "font-semibold text-bad" : "text-muted")}>{t.date ?? "-"}</span>
                </>
              );
              const cls = cn("grid min-w-0 gap-2 rounded-md border border-line bg-surface px-3.5 py-3", t.href && "hover:bg-raised");
              return (
                <li key={t.id} className="min-w-0">
                  {t.href ? (
                    <Link href={t.href} className={cls}>
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
      ))}
    </div>
  );
}
