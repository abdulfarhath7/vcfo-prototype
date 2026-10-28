"use client";
import * as React from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

/*
 * Navy head band of the phase page and the board resolution page (old phase.html .hero, board.html .hero).
 * Kept out: the back chevron (R-09) and the "What's this?" bot button (R-04).
 */

export interface HeadLink {
  href: string;
  label: string;
  dir: "prev" | "next";
}

/** Eyebrow, title, a sub line or chips on the left. Phase links and a ring or mark on the right. */
export function NavyHead({ eyebrow, title, sub, links, mark, label }: { eyebrow: string; title: string; sub?: React.ReactNode; links?: HeadLink[]; mark?: React.ReactNode; label: string }) {
  return (
    <section className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-4 rounded-lg border border-navy bg-navy px-5 py-4 text-white md:px-6 md:py-5" aria-label={label}>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-11.5 font-semibold text-brand">{eyebrow}</div>
        <h1 className="mt-1 truncate text-22 font-semibold tracking-tight md:text-24">{title}</h1>
        {sub && <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-12 text-navy-ink">{sub}</div>}
      </div>
      {(links?.length || mark) && (
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          {links?.map((l) => (
            <Button key={l.href + l.label} asChild variant="onNavy" size="sm" className="min-w-0 max-w-full">
              <Link href={l.href} aria-label={`${l.dir === "prev" ? "Previous" : "Next"} · ${l.label}`}>
                {l.dir === "prev" && <ChevronLeft size={15} strokeWidth={1.6} />}
                <span className="truncate">{l.label}</span>
                {l.dir === "next" && <ChevronRight size={15} strokeWidth={1.6} />}
              </Link>
            </Button>
          ))}
          {mark}
        </div>
      )}
    </section>
  );
}

/** Ring of the phase head: the percentage inside, "Phase n" under it. Green when done, orange while open. */
export function PhaseRing({ pct, caption, onClick, ariaLabel }: { pct: number; caption: string; onClick?: () => void; ariaLabel: string }) {
  const R = 20;
  const C = 2 * Math.PI * R;
  return (
    <button type="button" onClick={onClick} className="grid justify-items-center gap-1 rounded-md px-1 py-0.5 hover:bg-white/[.06]" aria-label={ariaLabel}>
      <span className="relative block h-[50px] w-[50px]">
        <svg viewBox="0 0 50 50" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="25" cy="25" r={R} fill="none" strokeWidth="4" className="stroke-white/[.16]" />
          <circle cx="25" cy="25" r={R} fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} className={pct === 100 ? "stroke-ok-mid" : "stroke-warn-mid"} />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-12 font-bold">{pct}%</span>
      </span>
      <small className="font-mono text-11 text-navy-ink">{caption}</small>
    </button>
  );
}

/** Green tick mark at the end of the board resolution head. */
export function DoneMark({ label }: { label: string }) {
  return (
    <span className={cn("grid h-6 w-6 flex-none place-items-center rounded-md bg-ok-mid text-white")} role="img" aria-label={label}>
      <Check size={14} strokeWidth={2.4} />
    </span>
  );
}
