"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Empty, HeadLink } from "./SectionCard";

export interface DrillRow {
  name: string;
  /** Date or short meta: "9 Oct", "day 6 of 30 · 2 Dec". Shown in IBM Plex Mono. */
  meta?: string;
  status: string;
  tone?: ChipTone;
  /** Index of the tab that holds the row. Tab 0 "All" shows every row. */
  tab: number;
  href?: string;
}

export interface DrillSpec {
  title: string;
  /** First tab labelled "All" shows every row. */
  tabs: Array<{ label: string; count?: number }>;
  rows: DrillRow[];
  /** Where the full list lives: "Incorporation", "/client/incorporation". */
  link?: { name: string; href: string };
}

/** v7x_drilldown: one pop-up for every drill. Tabs over rows, the clicked part picked. Rows open the real page. */
export function DrillDialog({ spec, active = 0, open, onOpenChange }: { spec: DrillSpec | null; active?: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [tab, setTab] = React.useState(active);
  React.useEffect(() => setTab(active), [active, spec]);
  if (!spec) return null;
  const all = spec.tabs[0]?.label === "All";
  const rows = spec.rows.filter((r) => (all && tab === 0) || r.tab === tab);
  const total = spec.tabs[tab]?.count ?? rows.length;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={spec.title}
      flush
      footer={
        <>
          <span className="mr-auto text-12.5 text-muted">{rows.length < total ? `Showing ${rows.length} of ${total}` : `Showing all ${total}`}</span>
          {spec.link && <HeadLink href={spec.link.href}>Open {spec.link.name.toLowerCase()} ›</HeadLink>}
        </>
      }
    >
      <div className="border-b border-line-soft px-4 py-2.5 md:px-5">
        <Tabs items={spec.tabs.map((t, i) => ({ key: String(i), label: t.label, count: t.count }))} value={String(tab)} onChange={(k) => setTab(Number(k))} />
      </div>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ul>
          {rows.map((r, i) => {
            const inner = (
              <>
                <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
                {r.meta && <span className="hidden flex-none font-mono text-12 text-muted sm:inline">{r.meta}</span>}
                <Chip tone={r.tone} fixed className="hidden sm:inline-flex">
                  {r.status}
                </Chip>
                <Chip tone={r.tone} className="sm:hidden">
                  {r.status}
                </Chip>
                {r.href && <ChevronRight size={16} strokeWidth={1.5} className="flex-none text-faint" />}
              </>
            );
            const cls = "flex items-center gap-3 border-t border-line-soft px-4 py-3 text-13.5 first:border-t-0 md:px-5";
            return (
              <li key={`${r.name}-${i}`}>
                {r.href ? (
                  <Link href={r.href} className={`${cls} hover:bg-raised`} onClick={() => onOpenChange(false)}>
                    {inner}
                  </Link>
                ) : (
                  <div className={cls}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

/** Keeps one drill open at a time. `open(spec, tab)` from any trigger; render `node` once. */
export function useDrill() {
  const [state, setState] = React.useState<{ spec: DrillSpec; tab: number } | null>(null);
  const [open, setOpen] = React.useState(false);
  const show = React.useCallback((spec: DrillSpec, tab = 0) => {
    setState({ spec, tab });
    setOpen(true);
  }, []);
  const node = <DrillDialog spec={state?.spec ?? null} active={state?.tab ?? 0} open={open} onOpenChange={setOpen} />;
  return { open: show, node };
}
