import * as React from "react";
import { cn } from "@/lib/cn";

export type ChipTone = "ok" | "warn" | "bad" | "prog" | "idle" | "violet" | "teal";

const tones: Record<ChipTone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  prog: "bg-accent-soft text-accent",
  idle: "bg-idle-soft text-idle",
  violet: "bg-violet-soft text-violet",
  teal: "bg-teal-soft text-teal",
};

/** Map common status words to a tone. */
export function toneFor(status: string): ChipTone {
  const s = status.toLowerCase();
  if (/(done|complete|filed|approved|granted|active|paid|closed|resolved|ok|healthy|connected|live|verified)/.test(s)) return "ok";
  if (/(overdue|late|fail|error|rejected|blocked|stuck|critical|down|expired|sent back)/.test(s)) return "bad";
  if (/(waiting|due|pending|soon|review|hold|warn|degraded|needs|open)/.test(s)) return "warn";
  if (/(progress|current|running|filing|in review|started|working|processing|mca)/.test(s)) return "prog";
  return "idle";
}

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  /** R-13: in tables the chip is 108 px wide. */
  fixed?: boolean;
  dot?: boolean;
}

/** R-13: soft chip with a 6 px dot, 22 px high, 5 px corners. */
export function Chip({ tone, fixed, dot = true, className, children, ...rest }: ChipProps) {
  const t = tone ?? (typeof children === "string" ? toneFor(children) : "idle");
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-sm px-2 text-12 font-semibold",
        tones[t],
        fixed && "w-[108px] justify-center",
        className,
      )}
      {...rest}
    >
      {dot && <i className="h-1.5 w-1.5 flex-none rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export type Owner = "client" | "sbc" | "mca";

const ownerTone: Record<Owner, string> = {
  client: "bg-warn-soft text-warn",
  sbc: "bg-accent-soft text-accent",
  mca: "bg-violet-soft text-violet",
};

/** R-14: 96 px owner chip. Client amber, SBC blue, MCA violet. */
export function OwnerChip({ owner, label, className }: { owner: Owner; label?: string; className?: string }) {
  const text = label ?? (owner === "client" ? "Client" : owner === "sbc" ? "SBC" : "MCA");
  return (
    <span className={cn("inline-flex h-[22px] w-[96px] items-center justify-center gap-1.5 rounded-sm text-12 font-semibold", ownerTone[owner], className)}>
      <i className="h-1.5 w-1.5 flex-none rounded-full bg-current" aria-hidden />
      {text}
    </span>
  );
}

/** Soft tag without a dot, for categories such as GST or MCA. */
export function Tag({ tone = "idle", className, children }: { tone?: ChipTone; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex h-[22px] items-center rounded-sm px-2 text-11.5 font-semibold", tones[tone], className)}>{children}</span>;
}
