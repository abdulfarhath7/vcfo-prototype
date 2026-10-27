"use client";
import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { navFor, type NavItem, type Portal } from "@/data/nav";

function flatten(items: NavItem[], trail: string[] = []): Array<{ label: string; href: string }> {
  return items.flatMap((it) => {
    const t = [...trail, it.label];
    if (it.kids) return flatten(it.kids, t);
    return it.href ? [{ label: t.join(" · "), href: it.href }] : [];
  });
}

/** Search palette (Ctrl K). Searches pages and sample records. */
export function Palette({ portal, onClose }: { portal: Portal; onClose: () => void }) {
  const [q, setQ] = React.useState("");
  const pages = React.useMemo(() => flatten(navFor(portal, false)), [portal]);
  const hits = pages.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())).slice(0, 8);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-scrim p-4 pt-[12vh]" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search">
      <div className="mx-auto max-w-[560px] overflow-hidden rounded-lg border border-line bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-12 items-center gap-2.5 border-b border-line-soft px-4">
          <Search size={16} strokeWidth={1.5} className="text-muted" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages, clients, steps, filings" className="h-full flex-1 bg-transparent text-14 outline-none placeholder:text-faint" />
          <kbd className="rounded-sm border border-line px-1.5 font-mono text-11 text-muted">Esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-1.5">
          {hits.map((h) => (
            <li key={h.href}>
              <Link href={h.href} onClick={onClose} className="flex h-9 items-center px-4 text-13.5 hover:bg-raised">
                {h.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
