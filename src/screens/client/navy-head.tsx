"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

/*
 * Plain page head (R-02, R-17): no navy band, no card. A 28 px title, a muted meta line, actions on the right.
 * Used by the incorporation, phase and board resolution pages. The file keeps its old name so imports stay short.
 */

export interface HeadLink {
  href: string;
  label: string;
  dir: "prev" | "next";
}

export function PageHead({ title, meta, chips, actions, links, label }: { title: React.ReactNode; meta?: React.ReactNode; chips?: React.ReactNode; actions?: React.ReactNode; links?: HeadLink[]; label: string }) {
  return (
    <section className="flex min-w-0 flex-wrap items-end gap-x-6 gap-y-3" aria-label={label}>
      <div className="min-w-0 flex-[1_1_320px]">
        <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-22 font-medium tracking-[-0.01em] md:text-28">
          <span className="min-w-0">{title}</span>
          {chips}
        </h1>
        {meta && <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-13.5 text-muted">{meta}</div>}
      </div>
      {(links?.length || actions) && (
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          {links?.map((l) => (
            <Button key={l.href + l.label} asChild variant="secondary" size="sm" className="min-w-0 max-w-full">
              <Link href={l.href} aria-label={`${l.dir === "prev" ? "Previous" : "Next"} · ${l.label}`}>
                {l.dir === "prev" && <ChevronLeft size={15} strokeWidth={1.6} />}
                <span className="truncate">{l.label}</span>
                {l.dir === "next" && <ChevronRight size={15} strokeWidth={1.6} />}
              </Link>
            </Button>
          ))}
          {actions}
        </div>
      )}
    </section>
  );
}

/** Dot between meta items. */
export function Dot() {
  return (
    <span className="text-faint" aria-hidden>
      ·
    </span>
  );
}
