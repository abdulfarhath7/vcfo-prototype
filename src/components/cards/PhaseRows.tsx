"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Bar, type BarTone } from "@/components/ui/Bar";
import { Chip, OwnerChip, type ChipTone, type Owner } from "@/components/ui/Chip";
import { Chevron } from "@/components/ui/Chevron";

export interface PhaseStep {
  n: number;
  title: string;
  owner: Owner;
  ownerLabel?: string;
  status: string;
  tone?: ChipTone;
  time: string;
  href?: string;
}

export interface Phase {
  id: string;
  name: string;
  done: number;
  total: number;
  status: string;
  tone?: ChipTone;
  barTone?: BarTone;
  href?: string;
  steps?: PhaseStep[];
}

/** K-21: flat phase rows with a 6 px bar and a 108 px count chip. Rows expand to a step table. `onAbout` adds "What's this?" to each step row. */
export function PhaseRows({ phases, openId, className, onAbout }: { phases: Phase[]; openId?: string; className?: string; onAbout?: (n: number) => void }) {
  const [open, setOpen] = React.useState<string | null>(openId ?? null);
  return (
    <div className={className}>
      {phases.map((p) => {
        const isOpen = open === p.id;
        const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
        return (
          <div key={p.id} className="border-t border-line-soft first:border-t-0">
            <div
              className={cn("grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-13.5 md:grid-cols-[16px_minmax(0,1fr)_120px_40px_108px] md:px-5", p.steps && "cursor-pointer hover:bg-raised", isOpen && "bg-raised")}
              onClick={p.steps ? () => setOpen(isOpen ? null : p.id) : undefined}
              role={p.steps ? "button" : undefined}
              aria-expanded={p.steps ? isOpen : undefined}
            >
              {p.steps ? <Chevron open={isOpen} /> : <span />}
              <span className="min-w-0 truncate font-semibold">
                {p.href ? (
                  <Link href={p.href} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                    {p.name}
                  </Link>
                ) : (
                  p.name
                )}
              </span>
              <Bar pct={pct} tone={p.barTone ?? (pct === 100 ? "ok" : "accent")} className="hidden md:block" />
              <span className="hidden text-right text-12.5 text-muted md:block">
                {p.done}/{p.total}
              </span>
              <Chip tone={p.tone} fixed>
                {p.status}
              </Chip>
            </div>
            {isOpen && p.steps && (
              <div className="overflow-x-auto border-t border-line-soft">
                <table className="grid-table">
                  <thead>
                    <tr>
                      <th className="num w-10">#</th>
                      <th>Step</th>
                      <th className="w-[120px]">Owner</th>
                      <th className="w-[132px]">Status</th>
                      <th className="w-[150px]">Typical time</th>
                      <th className="w-10" aria-label="Open" />
                    </tr>
                  </thead>
                  <tbody>
                    {p.steps.map((s) => (
                      <tr key={s.n}>
                        <td className="num text-faint">{s.n}</td>
                        <td className="font-semibold">
                          {s.href ? (
                            <Link href={s.href} className="hover:underline">
                              {s.title}
                            </Link>
                          ) : (
                            s.title
                          )}
                          {onAbout && (
                            <button type="button" onClick={() => onAbout(s.n)} className="ml-2.5 whitespace-nowrap text-11.5 font-semibold text-accent hover:underline">
                              What&apos;s this?
                            </button>
                          )}
                        </td>
                        <td>
                          <OwnerChip owner={s.owner} label={s.ownerLabel} />
                        </td>
                        <td>
                          <Chip tone={s.tone} fixed>
                            {s.status}
                          </Chip>
                        </td>
                        <td className="text-muted">{s.time}</td>
                        <td className="text-faint">
                          {s.href && (
                            <Link href={s.href} aria-label={`Open step ${s.n}`}>
                              <ChevronRight size={16} strokeWidth={1.5} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
