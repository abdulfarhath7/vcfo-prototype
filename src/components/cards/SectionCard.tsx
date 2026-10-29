import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { iconFor, type Tone } from "@/components/icons";
import { IconTile } from "@/components/ui/IconTile";
import { CardBody } from "@/components/ui/CardLoad";

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
  /** L1: grey shapes for 300 ms on first load and on a tab switch inside the card. On by default; off for bare cards. */
  skeleton?: boolean;
}

/**
 * R-15, R-16: white card, 1.5 px line, 6 px corners, 52 px head with a 28 px tinted icon tile. Title 15 px weight 500.
 * R-48 L1: the body shows grey shapes for 300 ms on first load and on a tab switch (`skeleton={false}` turns it off).
 */
export const SectionCard = React.forwardRef<HTMLElement, SectionCardProps>(function SectionCard({ title, meta, right, icon, flush, bare, className, bodyClassName, children, id, titleLead, skeleton = true }, ref) {
  const { Icon, tone } = icon ?? iconFor(title);
  return (
    <section ref={ref} id={id} className={cn("min-w-0 overflow-hidden rounded-md border-1.5 border-line bg-surface", className)} aria-label={title}>
      {!bare && (
        <header className="flex min-h-head flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-line-soft px-4 py-2 md:px-5">
          <IconTile Icon={Icon} tone={tone} />
          {titleLead}
          <h2 className="min-w-0 truncate text-15 font-medium">{title}</h2>
          {meta && <span className="truncate text-13 text-muted">{meta}</span>}
          {right && <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">{right}</div>}
        </header>
      )}
      {skeleton && !bare ? (
        <CardBody name={id ?? title} flush={flush} className={cn(!flush && "px-4 py-4 md:px-5", bodyClassName)}>
          {children}
        </CardBody>
      ) : (
        <div className={cn(!flush && "px-4 py-4 md:px-5", bodyClassName)}>{children}</div>
      )}
    </section>
  );
});

/** Empty list body (R-05: no filler sentences; R-48 E3: a dashed area, with the action when there is one). */
export function Empty({ children = "None", action }: { children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="m-4 flex flex-col items-center gap-2.5 rounded-md border-1.5 border-dashed border-line-2 px-4 py-6 text-center text-13 text-muted md:mx-5">
      <span>{children}</span>
      {action}
    </div>
  );
}

/** Full-width list row with a hairline between rows (R-19). */
export function ListRow({ children, className, href, onClick }: { children: React.ReactNode; className?: string; href?: string; onClick?: () => void }) {
  const base = cn("flex items-center gap-3 border-t border-line-soft px-4 py-3 text-14 first:border-t-0 md:px-5", (href || onClick) && "hover:bg-hover", className);
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
    <Link href={href} className="inline-flex items-center gap-1 whitespace-nowrap text-13 font-medium text-accent hover:underline">
      {children}
    </Link>
  );
}
