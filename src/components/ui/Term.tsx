"use client";
import * as React from "react";
import * as T from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";
import { glossaryFor, leadingTerm, type GlossaryTerm } from "@/data/glossary";

function Card({ entry, children, className }: { entry: GlossaryTerm; children: React.ReactNode; className?: string }) {
  return (
    <T.Provider delayDuration={350} skipDelayDuration={200}>
      <T.Root>
        <T.Trigger asChild>
          {/* Focusable so keyboard users get the card too. The text stays plain text for screen readers; the card is a description. */}
          <span tabIndex={0} className={cn("cursor-help rounded-sm underline decoration-line-2 decoration-dotted decoration-[1.5px] underline-offset-[3px] outline-none focus-visible:ring-4 focus-visible:ring-focus", className)}>
            {children}
          </span>
        </T.Trigger>
        <T.Portal>
          <T.Content
            side="top"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className="z-[60] flex w-[260px] max-w-[calc(100vw-24px)] flex-col gap-[5px] rounded-md border-1.5 border-line bg-surface px-3.5 py-3 text-ink shadow-float"
          >
            <span className="text-13.5 font-medium">{entry.term}</span>
            <span className="text-13 leading-5 text-ink-2">{entry.text}</span>
            <span className="text-12 text-muted">{entry.by}</span>
            <T.Arrow width={12} height={6} className="fill-surface" />
          </T.Content>
        </T.Portal>
      </T.Root>
    </T.Provider>
  );
}

/**
 * TP2: a form code with a white info card on hover or focus. <Term>GSTR-3B</Term>, or <Term code="ADT-1">ADT-1 auditor appointment</Term>.
 * A title that starts with a code ("GSTR-3B · September") marks only the code. Text without a glossary entry renders plain.
 */
export function Term({ children, code, className }: { children: React.ReactNode; code?: string; className?: string }) {
  if (code) {
    const e = glossaryFor(code);
    return e ? (
      <Card entry={e} className={className}>
        {children}
      </Card>
    ) : (
      <>{children}</>
    );
  }
  if (typeof children !== "string") return <>{children}</>;
  const hit = leadingTerm(children);
  if (!hit) return <>{children}</>;
  return (
    <>
      <Card entry={hit.entry} className={className}>
        {children.slice(0, hit.end)}
      </Card>
      {children.slice(hit.end)}
    </>
  );
}
