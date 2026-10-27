import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { iconFor, type Tone } from "@/components/icons";
import { IconTile } from "@/components/ui/IconTile";

export interface SectionCardProps {
  title: string;
  /** Small text after the title. */
  meta?: React.ReactNode;
  /** Right side of the head: tabs, one button, a link. */
  right?: React.ReactNode;
  /** Override the icon from the title table. */
  icon?: { Icon: LucideIcon; tone: Tone };
  /** No body padding: for lists, grids and tables. */
  flush?: boolean;
  /** No head at all. */
  bare?: boolean;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
  id?: string;
  /** Small element before the title text, after the tile: a client colour dot (R-35). */
  titleLead?: React.ReactNode;
}

/** R-15, R-16: white card, 1 px line, 10 px corners, 52 px head with a tinted icon tile. */
export const SectionCard = React.forwardRef<HTMLElement, SectionCardProps>(function SectionCard({ title, meta, right, icon, flush, bare, className, bodyClassName, children, id, titleLead }, ref) {
  const { Icon, tone } = icon ?? iconFor(title);
  return (
    <section ref={ref} id={id} className={cn("min-w-0 overflow-hidden rounded-lg border border-line bg-surface", className)} aria-label={title}>
      {!bare && (
        <header className="flex min-h-head flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-line-soft px-4 py-2 md:px-5">
          <IconTile Icon={Icon} tone={tone} />
          {titleLead}
          <h2 className="min-w-0 truncate text-14.5 font-semibold">{title}</h2>
          {meta && <span className="truncate text-12.5 text-muted">{meta}</span>}
          {right && <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">{right}</div>}
        </header>
      )}
      <div className={cn(!flush && "px-4 py-4 md:px-5", bodyClassName)}>{children}</div>
    </section>
  );
});

/** Empty list body (R-05: no filler sentences). */
export function Empty({ children = "None" }: { children?: React.ReactNode }) {
  return <p className="px-5 py-4 text-13 text-faint">{children}</p>;
}

/** Full-width list row with a hairline between rows (R-19). */
export function ListRow({ children, className, href, onClick }: { children: React.ReactNode; className?: string; href?: string; onClick?: () => void }) {
  const base = cn("flex items-center gap-3 border-t border-line-soft px-4 py-3 text-13.5 first:border-t-0 md:px-5", (href || onClick) && "hover:bg-raised", className);
  if (href)
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cn(base, "w-full text-left")}>
        {children}
      </button>
    );
  return <div className={base}>{children}</div>;
}

/** Small link in a card head: "Open incorporation ›". */
export function HeadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 whitespace-nowrap text-13 font-semibold text-accent hover:underline">
      {children}
    </Link>
  );
}
