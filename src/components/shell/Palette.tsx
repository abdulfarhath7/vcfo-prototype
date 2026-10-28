"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { barFill } from "@/components/ui/Bar";
import { searchRecords, type SearchRecord } from "@/data/search-index";
import type { Portal } from "@/data/nav";

/** Search palette (Ctrl K). Groups: clients, steps, filings, obligations, registrations, documents, knowledge bank, pages. ↑ ↓ move, Enter opens, Esc closes. */
export function Palette({ portal, onClose }: { portal: Portal; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [cur, setCur] = React.useState(0);
  const groups = React.useMemo(() => searchRecords(portal, q), [portal, q]);
  const flat = React.useMemo(() => groups.flatMap((g) => g.hits), [groups]);

  React.useEffect(() => setCur(0), [q]);

  const go = React.useCallback(
    (r: SearchRecord | undefined) => {
      if (!r) return;
      router.push(r.href);
      onClose();
    },
    [router, onClose],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCur((c) => Math.min(flat.length - 1, c + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCur((c) => Math.max(0, c - 1));
    }
    if (e.key === "Enter") go(flat[cur]);
  };

  const starts = groups.reduce<number[]>((acc, g, gi) => [...acc, gi === 0 ? 0 : acc[gi - 1] + groups[gi - 1].hits.length], []);
  return (
    <div className="fixed inset-0 z-50 bg-scrim p-4 pt-[12vh]" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search">
      <div className="mx-auto max-w-[600px] overflow-hidden rounded-md border-1.5 border-line bg-surface shadow-pop" onClick={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="flex h-12 items-center gap-2.5 border-b border-line-soft px-4">
          <Search size={16} strokeWidth={1.6} className="text-muted" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients, steps, filings, documents" className="h-full flex-1 bg-transparent text-14 outline-none placeholder:text-faint" aria-label="Search" />
          <kbd className="rounded-sm border border-line px-1.5 font-mono text-11 text-muted">Esc</kbd>
        </div>
        <div className="max-h-[56vh] overflow-y-auto py-1.5" role="listbox">
          {groups.length === 0 && <p className="px-4 py-3 text-13 text-faint">No match</p>}
          {groups.map((g, gi) => (
            <div key={g.group}>
              <p className="px-4 pb-1 pt-2 text-11.5 font-semibold text-faint">{g.group}</p>
              {g.hits.map((h, hi) => {
                const idx = starts[gi] + hi;
                const on = idx === cur;
                return (
                  <button
                    key={h.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onMouseEnter={() => setCur(idx)}
                    onClick={() => go(h)}
                    className={cn("flex h-10 w-full items-center gap-2.5 px-4 text-left", on ? "bg-navy-tint" : "hover:bg-raised")}
                  >
                    {h.tone && <i className={cn("h-2 w-2 flex-none rounded-[2px]", barFill[h.tone])} aria-hidden />}
                    <span className="min-w-0 flex-1 truncate text-13.5">
                      <span className="font-semibold">{h.title}</span>
                      {h.sub && <span className="ml-2 text-12.5 text-muted">{h.sub}</span>}
                    </span>
                    {h.mono && <span className="flex-none font-mono text-12 text-muted">{h.mono}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-line-soft px-4 py-2 text-11.5 text-faint">
          <span>
            <kbd className="font-mono">↑ ↓</kbd> move
          </span>
          <span>
            <kbd className="font-mono">Enter</kbd> open
          </span>
        </div>
      </div>
    </div>
  );
}
