"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as M from "@radix-ui/react-dropdown-menu";
import { ArrowUpRight, Bell, Check, ChevronLeft, ChevronRight, Copy, MoreHorizontal, Pencil, Rows3, Rows4, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { iconFor, type Tone } from "@/components/icons";
import { IconTile } from "@/components/ui/IconTile";
import { ActionMenu, type ActionItem } from "@/components/ui/ActionMenu";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUndoToast } from "@/components/ui/UndoToast";
import { Empty } from "@/components/cards/SectionCard";
import { BulkBar, PeopleMenu } from "@/components/cards/BulkBar";
import { StatusMenu, sixOf, type SixWord } from "@/components/cards/StatusMenu";
import { SavedViews, type SavedViewsProps } from "@/components/cards/SavedViews";
import { logStatusChange } from "@/data/audit-live";
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
  /** B-19: the grey shape this column shows while the grid loads. Default: two lines in the first column, one line in the others. */
  skeleton?: "text" | "lines" | "chip" | "none";
}

/** What an action returns: the toast text (A2) and, when the action can be taken back, an Undo. */
export type GridResult = { text: string; undo?: () => void } | void;

/** E-01 and E-02: actions on picked rows (bulk bar) or on one row (row end). Each one is optional. */
export interface GridActions<T> {
  /** People in the Assign menu (bulk Assign and row Reassign). */
  people?: string[];
  /** Group label over the people, for example "Project lead". */
  peopleLabel?: string;
  /** The person who has the row now: the tick in the row Reassign menu. */
  ownerOf?: (row: T) => string | undefined;
  assign?: (rows: T[], person: string) => GridResult;
  remind?: (rows: T[]) => GridResult;
  done?: (rows: T[]) => GridResult;
  export?: (rows: T[]) => GridResult;
  /** Row Open. Default: the row link (rowHref), else onRowClick. */
  open?: (row: T) => void;
  /** D1 row menu: Edit (key E). */
  edit?: (row: T) => void;
  /** D1 row menu: the page to copy for Copy link (key C). Default: rowHref. */
  link?: (row: T) => string | undefined;
  /** Singular and plural for the bar ("task", "tasks"). */
  noun?: [string, string];
}

/** E-03: the chip in `column` opens a menu with the six words. */
export interface GridStatus<T> {
  column: string;
  get: (row: T) => string;
  set: (row: T, word: SixWord) => GridResult;
  /** Row name for the audit list and the screen reader ("GSTR-3B · Tidewater"). */
  label: (row: T) => string;
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

  // Opt-in features (Spectrum parity). Without them the grid looks and works as before.
  /** E-01: a checkbox column; picked rows show the bulk bar in place of the head. Uses `actions`. */
  selectable?: boolean;
  /** E-02: Open, Remind and Reassign at the row end on hover or focus. Keys on a focused row: Enter opens, R reminds, A assigns, E edits, C copies the link. */
  quickActions?: boolean;
  /** E-02: show the row actions over the right end of this column (a text column) instead of in a column of their own. For tables tight on width. The density switch then sits in this column's head. */
  actionsColumn?: string;
  actions?: GridActions<T>;
  /** E-03: click the status chip to change the status. The change is logged in the live audit list. */
  statusMenu?: GridStatus<T>;
  /** Who acts, for the audit list ("Pranay"). Also the per-user key for the density choice. */
  user?: string;
  /** E-06: saved views as a tab row above the table. */
  views?: SavedViewsProps;
  /** E-07: Comfortable 44 px or Compact 32 px rows, switched in the table head and kept per `user` in localStorage. */
  density?: boolean;
  /** E-08: when the row last changed. Rows changed since the last visit get a 6 px blurple square. */
  changedAt?: (row: T) => Date | undefined;
  /** E-08: page key for the last-visit time in localStorage ("manager:work"). */
  visitKey?: string;
  /** E-08: the last visit to assume when the browser has none stored. */
  visitSeed?: Date;
  /** B-18: E3 empty state. A dashed area with `empty` (six words or fewer) and this one action. */
  emptyAction?: React.ReactNode;
  /** B-19: grey row shapes for 300 ms on first load and whenever this key changes (a view switch). */
  loadKey?: string | number;
  /** Toast for action results. Default: the grid's own A2 toast. */
  notify?: (text: string, undo?: () => void) => void;
}

/** Class for a second line in a cell. Compact rows hide it. */
export const GRID_SUB = "grid-sub";

/** Top bar height plus the spectrum ribbon: where a sticky head stops. */
const PAGE_TOP = 63;

type Density = "comfortable" | "compact";

/** E-07: density per user in localStorage. */
function useDensity(user: string | undefined, on: boolean): [Density, (d: Density) => void] {
  const key = `vcfo.density.${user ?? "me"}`;
  const [d, setD] = React.useState<Density>("comfortable");
  React.useEffect(() => {
    if (!on) return;
    try {
      const v = window.localStorage.getItem(key);
      if (v === "compact" || v === "comfortable") setD(v);
    } catch {
      /* no storage: keep the default */
    }
  }, [key, on]);
  const set = (v: Density) => {
    setD(v);
    try {
      window.localStorage.setItem(key, v);
    } catch {
      /* no storage */
    }
  };
  return [d, set];
}

/** E-08: the last visit before this one. Read once per page load, so the squares stay while the user is on the page. */
const VISITS = new Map<string, number>();
function useLastVisit(key: string | undefined, seed: number | undefined) {
  const [since, setSince] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!key) return;
    const k = `vcfo.visit.${key}`;
    let prev = VISITS.get(k);
    if (prev === undefined) {
      let stored = NaN;
      try {
        const v = window.localStorage.getItem(k);
        if (v) stored = Number(v);
        window.localStorage.setItem(k, String(Date.now()));
      } catch {
        /* no storage: every visit is the first */
      }
      prev = Number.isFinite(stored) ? stored : (seed ?? 0);
      VISITS.set(k, prev);
    }
    setSince(prev);
  }, [key, seed]);
  return since;
}

/**
 * E-09: the head sticks under the top bar. The table scrolls sideways only when it is wider than the card;
 * then the head stays at the top of the table. Inside a scrolling panel the head sticks to the panel top.
 */
function useStickyHead(wrap: React.RefObject<HTMLDivElement | null>, table: React.RefObject<HTMLTableElement | null>) {
  const [fits, setFits] = React.useState(false);
  const [top, setTop] = React.useState(PAGE_TOP);
  const [ww, setWw] = React.useState(0);
  React.useEffect(() => {
    const w = wrap.current;
    const t = table.current;
    if (!w || !t) return;
    let p = w.parentElement;
    let inner = false;
    while (p && p !== document.body) {
      const o = getComputedStyle(p).overflowY;
      if (o === "auto" || o === "scroll") {
        inner = true;
        break;
      }
      p = p.parentElement;
    }
    setTop(inner ? 0 : PAGE_TOP);
    const check = () => {
      setFits(t.offsetWidth <= w.clientWidth + 1);
      setWw(w.clientWidth);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(w);
    ro.observe(t);
    return () => ro.disconnect();
  }, [wrap, table]);
  return { fits, top, ww };
}

const iconBtn =
  "grid h-7 w-7 flex-none place-items-center rounded-md text-muted hover:bg-ghost hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus data-[state=open]:bg-ghost data-[state=open]:text-ink";

/** E-07: Comfortable or Compact, a small D2 menu in the table head. */
function DensityMenu({ value, onChange }: { value: Density; onChange: (d: Density) => void }) {
  const Icon = value === "compact" ? Rows4 : Rows3;
  const opts: Array<[Density, string, string, LucideIcon]> = [
    ["comfortable", "Comfortable", "44 px", Rows3],
    ["compact", "Compact", "32 px", Rows4],
  ];
  return (
    <M.Root modal={false}>
      <M.Trigger asChild>
        <button type="button" data-grid-ctl className={iconBtn} aria-label={`Row density: ${value === "compact" ? "Compact" : "Comfortable"}`} title="Row density">
          <Icon size={15} strokeWidth={1.6} />
        </button>
      </M.Trigger>
      <M.Portal>
        <M.Content align="end" sideOffset={4} collisionPadding={12} className="z-50 w-[210px] rounded-md border-1.5 border-line bg-surface p-[5px] text-14 normal-case tracking-normal text-ink shadow-float">
          <M.Label className="px-[9px] pb-1 pt-1.5 text-12 font-medium text-muted">Row density</M.Label>
          {opts.map(([k, label, px, I]) => (
            <M.Item key={k} onSelect={() => onChange(k)} className="flex h-[34px] cursor-pointer select-none items-center gap-2.5 rounded-sm px-[9px] outline-none data-[highlighted]:bg-hover">
              <I size={15} strokeWidth={1.6} className="flex-none text-muted" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <span className="text-12 text-muted">{px}</span>
              <Check size={14} strokeWidth={1.6} className={cn("flex-none text-accent", value !== k && "invisible")} aria-hidden />
            </M.Item>
          ))}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

/** Native checkbox in the X4 look, with the mixed state for the head. */
function Box({ checked, mixed, onChange, label }: { checked: boolean; mixed?: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <input
      type="checkbox"
      data-grid-ctl
      aria-label={label}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!mixed;
      }}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className="block h-[18px] w-[18px] flex-none cursor-pointer rounded-sm accent-[var(--primary)]"
    />
  );
}

const stamp = (at: Date) => `${at.getDate()} ${at.toLocaleString("en-GB", { month: "short" })}, ${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;

/** R-07 (T1): clean rows. 36 px small-caps head, 44 px rows with one hairline, page numbers under the table. */
export function DataGrid<T>({
  columns,
  rows,
  rowKey,
  title,
  meta,
  filters,
  icon,
  pageSize = 10,
  rowHref,
  rowClass,
  rowLate,
  empty = "No rows",
  className,
  footer,
  inset,
  onRowClick,
  selectedKey,
  selectable,
  quickActions,
  actionsColumn,
  actions,
  statusMenu,
  user,
  views,
  density: densityOn,
  changedAt,
  visitKey,
  visitSeed,
  emptyAction,
  loadKey,
  notify,
}: DataGridProps<T>) {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * pageSize, cur * pageSize);
  React.useEffect(() => setPage(1), [rows.length]);
  const head = title ? iconFor(title) : null;
  const tile = icon ?? head;

  const toast = useUndoToast();
  const say = notify ?? toast.show;
  const report = (res: GridResult) => {
    if (res) say(res.text, res.undo);
  };

  // E-09
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const sticky = useStickyHead(wrapRef, tableRef);

  // E-07
  const [density, setDensity] = useDensity(user, !!densityOn);
  const compact = !!densityOn && density === "compact";

  // E-08
  const since = useLastVisit(changedAt ? visitKey : undefined, visitSeed?.getTime());

  // B-19
  const [loading, setLoading] = React.useState(loadKey !== undefined);
  React.useEffect(() => {
    if (loadKey === undefined) return;
    setLoading(true);
    const h = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(h);
  }, [loadKey]);

  // E-01
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set());
  const allKeys = rows.map(rowKey);
  const keySig = allKeys.join("|");
  React.useEffect(() => {
    setPicked((s) => {
      if (s.size === 0) return s;
      const live = new Set(keySig.split("|"));
      const next = new Set([...s].filter((k) => live.has(k)));
      return next.size === s.size ? s : next;
    });
  }, [keySig]);
  const pageKeys = slice.map(rowKey);
  const pageAll = pageKeys.length > 0 && pageKeys.every((k) => picked.has(k));
  const pageSome = pageKeys.some((k) => picked.has(k));
  const pickedRows = rows.filter((r) => picked.has(rowKey(r)));
  const bulk = !!selectable && picked.size > 0;
  const runBulk = (fn?: (rs: T[]) => GridResult) =>
    fn
      ? () => {
          report(fn(pickedRows));
          setPicked(new Set());
        }
      : undefined;
  const pickPage = (v: boolean) => setPicked(v ? new Set([...picked, ...pageKeys]) : new Set([...picked].filter((k) => !pageKeys.includes(k))));

  // E-02
  const [assignFor, setAssignFor] = React.useState<string | null>(null);
  const rowKeys = !!quickActions && !!actions;
  const trailing = (rowKeys || !!densityOn) && !actionsColumn;
  const openRow = (r: T) => {
    if (actions?.open) return actions.open(r);
    const href = rowHref?.(r);
    if (href) return router.push(href);
    onRowClick?.(r);
  };
  const canAssign = !!actions?.assign && !!actions.people?.length;
  const linkOf = (r: T) => actions?.link?.(r) ?? rowHref?.(r);
  const copyLink = (r: T) => {
    const href = linkOf(r);
    if (!href) return;
    navigator.clipboard?.writeText(`${window.location.origin}${href}`).catch(() => undefined);
    say("Link copied");
  };
  /** D1: the row menu, with a key at the right of each item. The keys also work on a focused row. */
  const menuItems = (r: T): ActionItem[] => [
    ...(actions?.edit ? [{ label: "Edit", key: "E", Icon: Pencil, onSelect: () => actions.edit!(r) }] : []),
    ...(canAssign
      ? [{ label: "Reassign", key: "A", Icon: Users, people: { label: actions!.peopleLabel, names: actions!.people!, current: actions!.ownerOf?.(r), onPick: (p: string) => report(actions!.assign!([r], p)) } }]
      : []),
    ...(linkOf(r) ? [{ label: "Copy link", key: "C", Icon: Copy, onSelect: () => copyLink(r) }] : []),
  ];

  // Inside a sideways-scrolling wrapper the head cannot stick to the page; it stays at the top of the table.
  const headTop = sticky.fits ? sticky.top : 0;
  /** E-02: Open, Remind, Reassign. In their own column, or over the right end of `actionsColumn`. Shown on row hover or focus. */
  const quick = (r: T, key: string, overlay: boolean) => (
    <span
      className={cn(
        "invisible items-center gap-0.5 group-focus-within/row:visible group-focus-visible/row:visible group-hover/row:visible",
        overlay ? "absolute inset-y-0 right-1 flex bg-inherit pl-1.5 max-md:hidden" : "inline-flex justify-end",
        assignFor === key && "visible",
      )}
    >
      <button
        type="button"
        data-grid-ctl
        tabIndex={-1}
        className={iconBtn}
        aria-label="Open"
        title="Open · Enter"
        onClick={(e) => {
          e.stopPropagation();
          openRow(r);
        }}
      >
        <ArrowUpRight size={15} strokeWidth={1.6} />
      </button>
      {actions?.remind && (
        <button
          type="button"
          data-grid-ctl
          tabIndex={-1}
          className={iconBtn}
          aria-label="Remind"
          title="Remind · R"
          onClick={(e) => {
            e.stopPropagation();
            report(actions.remind!([r]));
          }}
        >
          <Bell size={15} strokeWidth={1.6} />
        </button>
      )}
      {actions?.assign && !!actions.people?.length && (
        <PeopleMenu
          people={actions.people}
          label={actions.peopleLabel}
          current={actions.ownerOf?.(r)}
          open={assignFor === key}
          onOpenChange={(o) => setAssignFor(o ? key : null)}
          onPick={(p) => report(actions.assign!([r], p))}
        >
          <button type="button" data-grid-ctl tabIndex={-1} className={iconBtn} aria-label="Reassign" title="Reassign · A" onClick={(e) => e.stopPropagation()}>
            <UserPlus size={15} strokeWidth={1.6} />
          </button>
        </PeopleMenu>
      )}
      {menuItems(r).length > 0 && (
        <ActionMenu
          label="More actions"
          items={menuItems(r)}
          trigger={
            <button type="button" data-grid-ctl tabIndex={-1} className={iconBtn} aria-label="More actions" title="More actions" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal size={15} strokeWidth={1.6} />
            </button>
          }
        />
      )}
    </span>
  );

  const colCount = columns.length + (selectable ? 1 : 0) + (trailing ? 1 : 0);
  const stickTh = "sticky z-[2] bg-surface !border-b-0 shadow-[inset_0_-1.5px_0_var(--line)]";
  // E-09: the first column (and the checkbox column) stay put on a phone while the table scrolls sideways.
  const boxSticky = "max-sm:sticky max-sm:left-0 max-sm:z-[1] max-sm:bg-surface";
  const firstSticky = cn("max-sm:sticky max-sm:z-[1] max-sm:bg-surface", selectable ? "max-sm:left-[28px]" : "max-sm:left-0");
  const skeletonRows = Math.max(1, Math.min(pageSize, slice.length || 4, 8));
  const showE3 = !!emptyAction && !loading && rows.length === 0;

  return (
    <section className={cn("min-w-0 overflow-clip bg-surface", !inset && "rounded-md border-1.5 border-line", className)} aria-label={title}>
      {(title || filters) && (
        <header className="flex min-h-head flex-wrap items-center gap-2.5 border-b border-line-soft px-4 py-2 md:px-5">
          {tile && title && <IconTile Icon={tile.Icon} tone={tile.tone} />}
          {title && <h2 className="whitespace-nowrap text-15 font-medium">{title}</h2>}
          {meta && <span className="truncate text-13 text-muted">{meta}</span>}
          {filters && <div className="ml-auto flex flex-wrap items-center gap-2">{filters}</div>}
        </header>
      )}
      {views && <SavedViews {...views} className={cn("border-b border-line-soft px-4 py-2.5 md:px-5", views.className)} />}
      <div ref={wrapRef} className={sticky.fits ? "overflow-visible" : "overflow-x-auto"}>
        <table ref={tableRef} className={cn("grid-table", compact && "[&_.grid-sub]:hidden [&_td]:h-8")}>
          <thead>
            <tr>
              {selectable && (
                <th className={cn(stickTh, "w-[28px] !pr-0", boxSticky, "max-sm:z-[3]")} style={{ top: headTop }}>
                  <Box checked={pageAll} mixed={!pageAll && pageSome} onChange={pickPage} label="Pick every row on this page" />
                </th>
              )}
              {columns.map((c, ci) => (
                <th
                  key={c.key}
                  style={{ width: c.width, top: headTop }}
                  className={cn(stickTh, c.align === "right" && "text-right", c.align === "center" && "text-center", c.hideOnPhone && "max-md:hidden", ci === 0 && firstSticky, ci === 0 && "max-sm:z-[3]", c.className, bulk && ci === 0 && "z-[4] max-sm:z-[4]")}
                >
                  {c.label}
                  {bulk && ci === 0 && (
                    // E-01: the bar covers the head row while rows are picked, so the rows do not move. Column widths stay.
                    <div className="absolute bottom-[1.5px] left-0 top-0 flex items-center bg-surface px-2.5 text-left" style={{ width: Math.max(240, sticky.ww - (selectable ? 28 : 0)) }}>
                      <BulkBar
                        count={picked.size}
                        pageAll={pageAll}
                        total={rows.length}
                        onSelectAll={() => setPicked(new Set(allKeys))}
                        onClear={() => setPicked(new Set())}
                        people={actions?.people}
                        peopleLabel={actions?.peopleLabel}
                        noun={actions?.noun}
                        handlers={{
                          assign: actions?.assign
                            ? (p) => {
                                report(actions.assign!(pickedRows, p));
                                setPicked(new Set());
                              }
                            : undefined,
                          remind: runBulk(actions?.remind),
                          done: runBulk(actions?.done),
                          export: runBulk(actions?.export),
                        }}
                      />
                    </div>
                  )}
                  {densityOn && !bulk && c.key === actionsColumn && (
                    <span className="absolute inset-y-0 right-1 flex items-center max-md:hidden">
                      <DensityMenu value={density} onChange={setDensity} />
                    </span>
                  )}
                </th>
              ))}
              {trailing && (
                <th style={{ width: rowKeys ? 100 : 44, top: headTop }} className={cn(stickTh, "px-1.5 text-right max-md:hidden")}>
                  <span className="sr-only">Row actions</span>
                  {densityOn && (
                    <span className="inline-flex align-middle">
                      <DensityMenu value={density} onChange={setDensity} />
                    </span>
                  )}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={`sk${i}`} aria-hidden className="[&>td]:!bg-transparent">
                  {selectable && (
                    <td className="w-[28px] !pr-0">
                      <Skeleton className="h-[18px] w-[18px]" />
                    </td>
                  )}
                  {columns.map((c, ci) => {
                    const shape = c.skeleton ?? (ci === 0 ? "lines" : "text");
                    return (
                      <td key={c.key} className={cn(c.hideOnPhone && "max-md:hidden")}>
                        {shape === "lines" ? (
                          <span className="grid gap-1.5">
                            <Skeleton className="h-3 w-3/5" />
                            {!compact && <Skeleton className="h-2.5 w-2/5" />}
                          </span>
                        ) : shape === "chip" ? (
                          <Skeleton className="h-6 w-[104px] rounded-md" />
                        ) : shape === "text" ? (
                          <Skeleton className={cn("h-3 w-3/4", c.align === "right" && "ml-auto")} />
                        ) : null}
                      </td>
                    );
                  })}
                  {trailing && <td className="max-md:hidden" />}
                </tr>
              ))}
            {loading && (
              <tr className="sr-only">
                <td colSpan={colCount} role="status">
                  Loading
                </td>
              </tr>
            )}
            {!loading && slice.length === 0 && !showE3 && (
              <tr>
                <td colSpan={colCount} className="text-center text-13 text-faint">
                  {empty}
                </td>
              </tr>
            )}
            {!loading &&
              slice.map((r, i) => {
                const href = rowHref?.(r);
                const key = rowKey(r);
                const sel = selectedKey !== undefined && selectedKey === key;
                const isPicked = picked.has(key);
                const changed = since !== null ? changedAt?.(r) : undefined;
                const dot =
                  changed && changed.getTime() > (since ?? 0) ? (
                    <i className="absolute left-[2px] top-1/2 -mt-[3px] block h-1.5 w-1.5 rounded-[2px] bg-primary" title={`Changed ${stamp(changed)}`}>
                      <span className="sr-only">Changed since your last visit</span>
                    </i>
                  ) : null;
                return (
                  <tr
                    key={key}
                    onClick={
                      onRowClick
                        ? (e) => {
                            if ((e.target as HTMLElement).closest("[data-grid-ctl], [role=menu]")) return;
                            onRowClick(r);
                          }
                        : href
                          ? (e) => {
                              // The whole row opens the record. Links, buttons and inputs inside keep their own click.
                              if ((e.target as HTMLElement).closest("a, button, input, select, label, [role=menu]")) return;
                              router.push(href);
                            }
                          : undefined
                    }
                    tabIndex={rowKeys ? 0 : undefined}
                    aria-keyshortcuts={rowKeys ? "Enter R A E C" : undefined}
                    onKeyDown={
                      rowKeys
                        ? (e) => {
                            if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return;
                            const k = e.key.toLowerCase();
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              openRow(r);
                            } else if (k === "r" && actions?.remind) {
                              e.preventDefault();
                              e.stopPropagation();
                              report(actions.remind([r]));
                            } else if (k === "a" && canAssign) {
                              e.preventDefault();
                              e.stopPropagation();
                              setAssignFor(key);
                            } else if (k === "e" && actions?.edit) {
                              e.preventDefault();
                              e.stopPropagation();
                              actions.edit(r);
                            } else if (k === "c" && linkOf(r)) {
                              e.preventDefault();
                              e.stopPropagation();
                              copyLink(r);
                            }
                          }
                        : undefined
                    }
                    aria-selected={onRowClick ? sel : selectable ? isPicked : undefined}
                    className={cn(
                      rowKeys && "group/row focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus focus-visible:[&>td]:bg-hover",
                      rowLate?.(r) && "late",
                      (href || onRowClick) && "cursor-pointer",
                      (sel || isPicked) && "[&>td]:!bg-accent-soft",
                      rowClass?.(r),
                    )}
                  >
                    {selectable && (
                      <td className={cn("relative w-[28px] !pr-0", boxSticky)}>
                        {dot}
                        <Box checked={isPicked} onChange={(v) => setPicked((s) => (v ? new Set([...s, key]) : new Set([...s].filter((x) => x !== key))))} label={`Pick ${statusMenu?.label(r) ?? `row ${i + 1}`}`} />
                      </td>
                    )}
                    {columns.map((c, ci) => {
                      let v = c.render ? c.render(r, (cur - 1) * pageSize + i) : String((r as Record<string, unknown>)[c.key] ?? "");
                      if (statusMenu && c.key === statusMenu.column) {
                        const before = statusMenu.get(r);
                        v = (
                          <StatusMenu
                            value={before}
                            label={statusMenu.label(r)}
                            onPick={(w) => {
                              const from = sixOf(before);
                              const target = statusMenu.label(r);
                              const who = user ?? "Staff";
                              logStatusChange({ target, from, to: w, who });
                              const res = statusMenu.set(r, w);
                              if (res)
                                say(
                                  res.text,
                                  res.undo &&
                                    (() => {
                                      res.undo!();
                                      logStatusChange({ target, from: w, to: from, who });
                                    }),
                                );
                            }}
                          >
                            {v}
                          </StatusMenu>
                        );
                      }
                      const cell = href && ci === 0 ? <Link href={href} className="-mx-2.5 -my-2.5 block px-2.5 py-2.5 font-medium text-ink hover:underline">{v}</Link> : v;
                      const lead = ci === 0 && !selectable;
                      return (
                        <td key={c.key} className={cn(c.mono && "font-mono text-13", c.align === "right" && "text-right", c.align === "center" && "text-center", c.hideOnPhone && "max-md:hidden", ((lead && dot) || (rowKeys && c.key === actionsColumn)) && "relative", ci === 0 && firstSticky, c.className)}>
                          {lead && dot}
                          {cell}
                          {rowKeys && c.key === actionsColumn && quick(r, key, true)}
                        </td>
                      );
                    })}
                    {trailing && (
                      <td className="px-1.5 text-right max-md:hidden">
                        {rowKeys && quick(r, key, false)}
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {showE3 && <Empty action={emptyAction}>{empty}</Empty>}
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
      {!notify && toast.node}
    </section>
  );
}
