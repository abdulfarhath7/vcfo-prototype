"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { barFill } from "@/components/ui/Bar";
import { regOf, statusWord, type Regulator } from "@/components/ui/Chip";
import { FilterChip, FilterChipRow, type FilterOption } from "@/components/ui/FilterChip";
import { Kbd } from "@/components/ui/Kbd";
import { searchIndex, searchRecords, type SearchRecord } from "@/data/search-index";
import type { Portal } from "@/data/nav";

const REG_LABEL: Record<Regulator, string> = { mca: "MCA", gst: "GST", it: "Income tax", payroll: "Payroll", fema: "FEMA", labour: "Labour" };
const SIX = ["Not started", "In progress", "Waiting", "Due soon", "Overdue", "Done"];

const regLabel = (r: SearchRecord) => {
  const g = r.area ? regOf(r.area) : undefined;
  return g ? REG_LABEL[g] : undefined;
};
const statusLabel = (r: SearchRecord) => (r.status ? statusWord(r.status).word : undefined);

/** The chip options that the portal's records can match. A chip with fewer than two options is left out. */
function useFilterOptions(portal: Portal) {
  return React.useMemo(() => {
    const all = searchIndex(portal);
    const regs = new Set(all.map(regLabel).filter(Boolean) as string[]);
    const stats = new Set(all.map(statusLabel).filter(Boolean) as string[]);
    const clients = [...new Set(all.map((r) => r.client).filter(Boolean) as string[])].sort();
    const opt = (xs: string[]): FilterOption[] => xs.map((x) => ({ value: x, label: x }));
    return {
      reg: opt(Object.values(REG_LABEL).filter((x) => regs.has(x))),
      status: opt(SIX.filter((x) => stats.has(x))),
      client: opt(clients),
    };
  }, [portal]);
}

/**
 * Search palette (Ctrl K), Q3. Filter chips under the field (Regulator, Status, Client) narrow the results.
 * Groups: clients, steps, filings, obligations, registrations, documents, knowledge bank, pages. ↑ ↓ move, Enter opens, Esc closes.
 */
export function Palette({ portal, onClose }: { portal: Portal; onClose: () => void }) {
  const router = useRouter();
  const input = React.useRef<HTMLInputElement>(null);
  const [q, setQ] = React.useState("");
  const [cur, setCur] = React.useState(0);
  const [reg, setReg] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [client, setClient] = React.useState("");
  const opts = useFilterOptions(portal);
  const filter = React.useMemo(
    () => (reg || status || client ? (r: SearchRecord) => (!reg || regLabel(r) === reg) && (!status || statusLabel(r) === status) && (!client || r.client === client) : undefined),
    [reg, status, client],
  );
  const groups = React.useMemo(() => searchRecords(portal, q, 4, filter), [portal, q, filter]);
  const flat = React.useMemo(() => groups.flatMap((g) => g.hits), [groups]);

  React.useEffect(() => setCur(0), [q, filter]);

  const go = React.useCallback(
    (r: SearchRecord | undefined) => {
      if (!r) return;
      router.push(r.href);
      onClose();
    },
    [router, onClose],
  );

  const onKey = (e: React.KeyboardEvent) => {
    // Keys in a chip menu (it sits in a portal) belong to the menu.
    if (!(e.currentTarget as HTMLElement).contains(e.target as Node)) return;
    if (e.key === "Escape") onClose();
    if (e.target !== input.current) return;
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

  const chips = [
    { key: "reg", label: "Regulator", value: reg, set: setReg, options: opts.reg },
    { key: "status", label: "Status", value: status, set: setStatus, options: opts.status },
    { key: "client", label: "Client", value: client, set: setClient, options: opts.client },
  ].filter((c) => c.options.length > 1);

  const starts = groups.reduce<number[]>((acc, g, gi) => [...acc, gi === 0 ? 0 : acc[gi - 1] + groups[gi - 1].hits.length], []);
  return (
    <div className="fixed inset-0 z-50 bg-scrim p-4 pt-[12vh]" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search">
      <div className="mx-auto max-w-[600px] overflow-hidden rounded-md border-1.5 border-line bg-surface shadow-dialog" onClick={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="flex h-[52px] items-center gap-2.5 border-b-1.5 border-line px-4">
          <Search size={16} strokeWidth={1.6} className="text-muted" />
          <input ref={input} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients, steps, filings, documents" className="h-full min-w-0 flex-1 bg-transparent text-15 outline-none placeholder:text-faint" aria-label="Search" />
          <Kbd>Esc</Kbd>
        </div>
        {chips.length > 0 && (
          <FilterChipRow
            className="border-b-1.5 border-line px-4 py-2.5"
            onClear={() => {
              setReg("");
              setStatus("");
              setClient("");
              input.current?.focus();
            }}
            chips={chips.map((c) => ({
              key: c.key,
              set: !!c.value,
              node: <FilterChip label={c.label} value={c.value} onChange={c.set} options={c.options} />,
            }))}
          />
        )}
        <div className="max-h-[56vh] overflow-y-auto py-1.5" role="listbox" aria-label="Results">
          {groups.length === 0 && <p className="px-4 py-3 text-13 text-faint">No match</p>}
          {groups.map((g, gi) => (
            <div key={g.group}>
              <p className="px-4 pb-1 pt-2 text-12 font-medium text-muted">{g.group}</p>
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
                    className={cn("flex h-10 w-full items-center gap-2.5 px-4 text-left", on ? "bg-accent-soft" : "hover:bg-hover")}
                  >
                    {h.tone && <i className={cn("h-2 w-2 flex-none rounded-[2px]", barFill[h.tone])} aria-hidden />}
                    <span className="min-w-0 flex-1 truncate text-13.5">
                      <span className="font-medium">{h.title}</span>
                      {h.sub && <span className="ml-2 text-12.5 text-muted">{h.sub}</span>}
                    </span>
                    {h.mono && <span className="flex-none font-mono text-12 text-muted">{h.mono}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 border-t-1.5 border-line px-4 py-2.5 text-12 text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> Move
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Enter</Kbd> Open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Esc</Kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
