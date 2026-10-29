"use client";
import * as React from "react";
import * as T from "@radix-ui/react-tooltip";
import { Kbd } from "@/components/ui/Kbd";

/**
 * TP3: dark tip with the action name and its shortcut, in both themes. For icon-only buttons.
 * The child is the trigger and keeps its own aria-label; the tip only repeats it for sighted users.
 */
export function Tip({ label, keys, side = "bottom", children }: { label: string; keys?: string[]; side?: "top" | "bottom" | "left" | "right"; children: React.ReactElement }) {
  return (
    <T.Provider delayDuration={300} skipDelayDuration={200}>
      <T.Root>
        <T.Trigger asChild>{children}</T.Trigger>
        <T.Portal>
          <T.Content
            side={side}
            sideOffset={6}
            collisionPadding={12}
            className="z-[60] inline-flex items-center gap-2 rounded-md border border-navy-line bg-navy py-1.5 pl-2.5 pr-2 text-12.5 text-white shadow-float"
          >
            <span>{label}</span>
            {keys?.map((k) => (
              <Kbd key={k} dark>
                {k}
              </Kbd>
            ))}
            <T.Arrow width={10} height={5} className="fill-navy" />
          </T.Content>
        </T.Portal>
      </T.Root>
    </T.Provider>
  );
}
