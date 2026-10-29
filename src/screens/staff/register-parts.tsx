"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { iconFor, type Tone } from "@/components/icons";
import { IconTile } from "@/components/ui/IconTile";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import type { Column } from "@/components/cards/DataGrid";

// Parts of the staff Registrations and Obligations pages, as in reference/old-screens/s/lead/Register.dc.html:
// a number strip that filters the table, a table grouped by area or frequency, a flow card and rail lists.

/* ---------- Number strip that filters ---------- */

export interface StripItem {
  key: string;
  label: string;
  value: number;
  Icon: LucideIcon;
  tone: Tone;
  /** Text colour of the number. */
  valueClass?: string;
  /** Line under the number. */
  sub?: string;
}

/**
 * R-18 KP1 number tiles: label 13/500 with a 15 px icon, number 26 px 500, sub 12.5 muted.
 * Each tile is a toggle: a click filters the table, a second click clears it. The picked tile has a blurple edge.
 * (NumberStrip has no toggle, so the tile look is repeated here.)
 */
export function FilterStrip({ items, value, onChange }: { items: StripItem[]; value: string; onChange: (key: string) => void }) {
  return (
    <div role="group" aria-label="Filter by state" className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
      {items.map((s, i) => {
        const on = value === s.key;
        return (
          <button
            key={s.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? "" : s.key)}
            className={cn(
              "flex min-w-0 flex-col gap-1.5 rounded-md border-1.5 bg-surface px-4 pb-3.5 pt-4 text-left transition-colors",
              on ? "border-accent-mid shadow-[0_0_0_3px_var(--accent-soft)]" : "border-line hover:border-line-2",
              i === items.length - 1 && items.length % 2 === 1 && "col-span-2 md:col-span-1",
            )}
          >
            <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-13 font-medium text-ink-2">
              <s.Icon size={15} strokeWidth={1.6} className="flex-none text-muted" aria-hidden />
              <span className="truncate">{s.label}</span>
            </span>
            <span className={cn("text-26 font-medium leading-none tracking-[-0.01em] tabular-nums", s.value > 0 && s.valueClass)}>{s.value}</span>
            {s.sub && <span className="truncate text-12.5 text-muted">{s.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Grouped e-Filing grid ---------- */

export interface GridGroup<T> {
  id: string;
  label: string;
  /** Dot colour class: bg-accent, bg-ok-mid. */
  dot: string;
  rows: T[];
  /** Custom group band (Compliances "by filing": date tile, name, area pill, "3 of 5 filed"). */
  head?: React.ReactNode;
}

type Entry<T> = { kind: "g"; g: GridGroup<T>; open: boolean } | { kind: "r"; row: T };

/** R-07 T1 grid with a folding band per group: 36 px head, 44 px rows, 1 px hairlines, page numbers. */
export function GroupedGrid<T>({
  title,
  meta,
  right,
  columns,
  groups,
  rowKey,
  rowHref,
  rowClass,
  footer,
  pageSize = 30,
  empty = "None",
  count,
  phoneFit,
  bar,
}: {
  title: string;
  /** A row under the head for a segmented switch (as SavedViews in DataGrid). */
  bar?: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  columns: Column<T>[];
  groups: GridGroup<T>[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string | undefined;
  rowClass?: (row: T) => string | undefined;
  footer?: React.ReactNode;
  pageSize?: number;
  empty?: string;
  /** Number in the head badge. Default: every row. The old registrations badge leaves out "Not needed". */
  count?: number;
  /** Phone: no 720 px floor; columns marked "hidden md:table-cell" drop out so the grid fits 390 px. */
  phoneFit?: boolean;
}) {
  const router = useRouter();
  const [closed, setClosed] = React.useState<Record<string, boolean>>({});
  const [page, setPage] = React.useState(1);
  const shown = groups.filter((g) => g.rows.length > 0);
  const entries: Entry<T>[] = shown.flatMap((g) => {
    const open = !closed[g.id];
    return [{ kind: "g" as const, g, open }, ...(open ? g.rows.map((row) => ({ kind: "r" as const, row })) : [])];
  });
  const total = shown.reduce((n, g) => n + g.rows.length, 0);
  const pages = Math.max(1, Math.ceil(entries.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = entries.slice((cur - 1) * pageSize, cur * pageSize);
  React.useEffect(() => setPage(1), [total]);

  return (
    <section className="min-w-0 overflow-hidden rounded-md border-1.5 border-line bg-surface" aria-label={title}>
      <header className="flex min-h-head flex-wrap items-center gap-2.5 border-b border-line-soft px-4 py-2 md:px-5">
        <IconTile Icon={iconFor(title).Icon} tone={iconFor(title).tone} />
        <h2 className="whitespace-nowrap text-15 font-medium">{title}</h2>
        <span className="inline-flex h-5 items-center rounded-sm bg-accent-soft px-1.5 text-12 font-medium text-accent">{count ?? total}</span>
        {meta && <span className="ml-auto truncate text-12.5 text-muted">{meta}</span>}
        {right && <div className="ml-auto flex flex-wrap items-center gap-2">{right}</div>}
      </header>
      {bar && <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-4 py-2.5 md:px-5">{bar}</div>}
      <div className="overflow-x-auto">
        <table className={cn("grid-table", phoneFit ? "md:min-w-[720px]" : "min-w-[720px]")}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width }} className={cn(c.className, c.align === "right" && "text-right", c.align === "center" && "text-center")}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center text-13 text-faint">
                  {empty}
                </td>
              </tr>
            )}
            {slice.map((e, i) => {
              if (e.kind === "g")
                return (
                  <tr key={`g-${e.g.id}`} className="[&>td]:!bg-raised">
                    <td colSpan={columns.length} className={cn("!h-auto !border-t-1.5 !border-t-line !p-0", i === 0 && "!border-t-0")}>
                      <button
                        type="button"
                        aria-expanded={e.open}
                        onClick={() => setClosed({ ...closed, [e.g.id]: e.open })}
                        className={cn("flex w-full items-center gap-2 px-3 text-left", e.g.head ? "py-3" : "h-10 text-13 font-medium")}
                      >
                        {e.g.head ?? (
                          <>
                            <i className={cn("h-2 w-2 flex-none rounded-[2px]", e.g.dot)} aria-hidden />
                            {e.g.label}
                            <span className="text-12.5 font-medium text-muted">{e.g.rows.length}</span>
                          </>
                        )}
                        <ChevronDown size={16} strokeWidth={1.6} className={cn("ml-auto flex-none text-muted transition-transform", !e.open && "-rotate-90")} aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              const href = rowHref?.(e.row);
              return (
                <tr
                  key={rowKey(e.row)}
                  // The whole row opens the record, not only the first cell. Links and buttons inside keep their own click.
                  onClick={href ? (ev) => !(ev.target as HTMLElement).closest("a,button") && router.push(href) : undefined}
                  className={cn(href && "cursor-pointer", rowClass?.(e.row))}
                >
                  {columns.map((c, ci) => {
                    const v = c.render ? c.render(e.row, i) : String((e.row as Record<string, unknown>)[c.key] ?? "");
                    return (
                      <td key={c.key} className={cn(c.mono && "font-mono text-13", c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)}>
                        {href && ci === 0 ? (
                          <Link href={href} className="-mx-3 -my-2.5 block px-3 py-2.5 hover:underline">
                            {v}
                          </Link>
                        ) : (
                          v
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap items-center gap-3 border-t border-line-soft px-4 py-2 text-13 text-muted md:px-5">
        <span>
          {count ?? total} row{(count ?? total) === 1 ? "" : "s"} · page {cur} of {pages}
        </span>
        {footer}
        {pages > 1 && (
          <nav className="ml-auto flex items-center gap-1" aria-label="Pages">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, cur - 1))}
              disabled={cur === 1}
              className="grid h-7 w-7 place-items-center rounded-md hover:bg-ghost disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} strokeWidth={1.6} />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === cur ? "page" : undefined}
                className={cn("h-7 min-w-7 rounded-md px-1.5 font-medium", p === cur ? "bg-primary text-primary-on" : "hover:bg-ghost")}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(Math.min(pages, cur + 1))}
              disabled={cur === pages}
              className="grid h-7 w-7 place-items-center rounded-md hover:bg-ghost disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={14} strokeWidth={1.6} />
            </button>
          </nav>
        )}
      </footer>
    </section>
  );
}

/* ---------- Rail ---------- */

/** Four boxes with a chevron between: Documents › Application › Authority review › Granted. */
export function FlowCard({ title, steps }: { title: string; steps: Array<{ label: string; value: number }> }) {
  return (
    <SectionCard title={title} bodyClassName="px-3 py-4 md:px-3">
      <div className="flex items-stretch">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <ChevronRight size={10} strokeWidth={1.6} className="flex-none self-center text-faint" aria-hidden />}
            <div className="grid min-w-0 flex-1 place-items-center content-center gap-0.5 rounded-md bg-raised px-0.5 py-2.5 text-center">
              <b className="text-18 font-medium tabular-nums">{s.value}</b>
              <span className="text-11 leading-tight text-muted">{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </SectionCard>
  );
}

export interface RailItem {
  key: string;
  title: string;
  sub: string;
  right?: string;
  rightClass?: string;
  href?: string;
}

/** Rail card: full-width rows, title and client, a date or a count on the right. */
export function RailCard({ title, count, items }: { title: string; count: number; items: RailItem[] }) {
  return (
    <SectionCard title={title} meta={<span className="inline-flex h-5 items-center rounded-sm bg-accent-soft px-1.5 text-12 font-medium text-accent">{count}</span>} flush>
      {items.length === 0 ? (
        <Empty />
      ) : (
        items.map((x) => (
          <ListRow key={x.key} href={x.href} className="py-2.5">
            <span className="min-w-0 flex-1">
              <b className="block truncate text-13.5 font-medium">{x.title}</b>
              <span className="block truncate text-12 text-muted">{x.sub}</span>
            </span>
            {x.right && <span className={cn("flex-none whitespace-nowrap text-13", x.rightClass ?? "text-ink-2")}>{x.right}</span>}
          </ListRow>
        ))
      )}
    </SectionCard>
  );
}
