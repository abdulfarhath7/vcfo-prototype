"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { iconFor, type Tone } from "@/components/icons";
import { IconTile } from "@/components/ui/IconTile";
import type { LucideIcon } from "lucide-react";

export interface Column<T> {
  key: string;
  label: React.ReactNode;
  width?: number | string;
  align?: "left" | "right" | "center";
  /** Identifier column: Roboto Mono (R-28). */
  mono?: boolean;
  /** Hide this column below 768 px, so the table fits a phone. */
  hideOnPhone?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataGridProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Card head above the grid: title and filters live here (R-08). Omit for a bare grid. */
  title?: string;
  meta?: React.ReactNode;
  filters?: React.ReactNode;
  icon?: { Icon: LucideIcon; tone: Tone };
  pageSize?: number;
  rowHref?: (row: T) => string | undefined;
  rowClass?: (row: T) => string | undefined;
  /** Red text on the whole row (late). */
  rowLate?: (row: T) => boolean;
  empty?: string;
  className?: string;
  /** Show the row count under the table. */
  footer?: React.ReactNode;
  /** Render inside an existing card: no outer border. */
  inset?: boolean;
  /** In-place detail: pick a row. The picked row shows a soft blue fill. */
  onRowClick?: (row: T) => void;
  selectedKey?: string;
}

/** R-07 (T1): clean rows. 36 px small-caps head, 44 px rows with one hairline, page numbers under the table. */
export function DataGrid<T>({ columns, rows, rowKey, title, meta, filters, icon, pageSize = 10, rowHref, rowClass, rowLate, empty = "No rows", className, footer, inset, onRowClick, selectedKey }: DataGridProps<T>) {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * pageSize, cur * pageSize);
  React.useEffect(() => setPage(1), [rows.length]);
  const head = title ? iconFor(title) : null;
  const tile = icon ?? head;

  return (
    <section className={cn("min-w-0 overflow-hidden bg-surface", !inset && "rounded-md border-1.5 border-line", className)} aria-label={title}>
      {(title || filters) && (
        <header className="flex min-h-head flex-wrap items-center gap-2.5 border-b border-line-soft px-4 py-2 md:px-5">
          {tile && title && <IconTile Icon={tile.Icon} tone={tile.tone} />}
          {title && <h2 className="whitespace-nowrap text-15 font-medium">{title}</h2>}
          {meta && <span className="truncate text-13 text-muted">{meta}</span>}
          {filters && <div className="ml-auto flex flex-wrap items-center gap-2">{filters}</div>}
        </header>
      )}
      <div className="overflow-x-auto">
        <table className="grid-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width }} className={cn(c.align === "right" && "text-right", c.align === "center" && "text-center", c.hideOnPhone && "max-md:hidden", c.className)}>
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
            {slice.map((r, i) => {
              const href = rowHref?.(r);
              const key = rowKey(r);
              const picked = selectedKey !== undefined && selectedKey === key;
              return (
                <tr
                  key={key}
                  onClick={
                    onRowClick
                      ? () => onRowClick(r)
                      : href
                        ? (e) => {
                            // The whole row opens the record. Links, buttons and inputs inside keep their own click.
                            if ((e.target as HTMLElement).closest("a, button, input, select, label, [role=menu]")) return;
                            router.push(href);
                          }
                        : undefined
                  }
                  aria-selected={onRowClick ? picked : undefined}
                  className={cn(rowLate?.(r) && "late", (href || onRowClick) && "cursor-pointer", picked && "[&>td]:!bg-accent-soft", rowClass?.(r))}
                >
                  {columns.map((c, ci) => {
                    const v = c.render ? c.render(r, (cur - 1) * pageSize + i) : String((r as Record<string, unknown>)[c.key] ?? "");
                    const cell = href && ci === 0 ? <Link href={href} className="-mx-2.5 -my-2.5 block px-2.5 py-2.5 font-medium text-ink hover:underline">{v}</Link> : v;
                    return (
                      <td key={c.key} className={cn(c.mono && "font-mono text-13", c.align === "right" && "text-right", c.align === "center" && "text-center", c.hideOnPhone && "max-md:hidden", c.className)}>
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center gap-3 border-t border-line-soft px-4 py-2 text-13 text-muted md:px-5">
        <span>
          {rows.length === 0 ? "0" : `${(cur - 1) * pageSize + 1}–${Math.min(rows.length, cur * pageSize)}`} of {rows.length}
        </span>
        {footer}
        {pages > 1 && (
          <nav className="ml-auto flex items-center gap-1" aria-label="Pages">
            <button type="button" onClick={() => setPage(Math.max(1, cur - 1))} disabled={cur === 1} className="grid h-7 w-7 place-items-center rounded-md hover:bg-ghost disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft size={14} strokeWidth={1.6} />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pages || Math.abs(p - cur) <= 1)
              .reduce<Array<number | "…">>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="px-1">
                    …
                  </span>
                ) : (
                  <button key={p} type="button" onClick={() => setPage(p)} aria-current={p === cur ? "page" : undefined} className={cn("h-7 min-w-7 rounded-md px-1.5 font-medium", p === cur ? "bg-primary text-primary-on" : "hover:bg-ghost")}>
                    {p}
                  </button>
                ),
              )}
            <button type="button" onClick={() => setPage(Math.min(pages, cur + 1))} disabled={cur === pages} className="grid h-7 w-7 place-items-center rounded-md hover:bg-ghost disabled:opacity-40" aria-label="Next page">
              <ChevronRight size={14} strokeWidth={1.6} />
            </button>
          </nav>
        )}
      </footer>
    </section>
  );
}
