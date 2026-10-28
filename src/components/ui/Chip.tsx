import * as React from "react";
import { cn } from "@/lib/cn";

export type ChipTone = "ok" | "warn" | "bad" | "prog" | "idle" | "violet" | "teal";

// Soft fill and text, plus the solid colour for the 7 px square dot (R-13).
const tones: Record<ChipTone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  prog: "bg-accent-soft text-accent",
  idle: "bg-idle-soft text-idle",
  violet: "bg-violet-soft text-violet",
  teal: "bg-teal-soft text-teal",
};
const dots: Record<ChipTone, string> = {
  ok: "bg-ok-mid",
  warn: "bg-warn-mid",
  bad: "bg-bad-mid",
  prog: "bg-accent-mid",
  idle: "bg-idle-mid",
  violet: "bg-violet-mid",
  teal: "bg-teal-mid",
};

/** Map common status words to a tone. Six meanings: not started, in progress, waiting, due soon, overdue, done. */
export function toneFor(status: string): ChipTone {
  const s = status.toLowerCase();
  if (/(done|complete|filed|approved|granted|active|paid|closed|resolved|\bok\b|healthy|connected|live|verified)/.test(s)) return "ok";
  if (/(overdue|late|fail|error|rejected|blocked|stuck|critical|down|expired|sent back)/.test(s)) return "bad";
  if (/(waiting|pending|with client|with sbc|with mca|hold|needs|asked|sent)/.test(s)) return "teal";
  if (/(due|soon|warn|degraded|expir)/.test(s)) return "warn";
  if (/(progress|current|running|filing|review|started|working|processing|open|mca)/.test(s)) return "prog";
  return "idle";
}

/** R-13: six words only. Long status variants collapse to the six; other words (Filed, Approved) stay. */
const SIX: Array<[RegExp, string]> = [
  [/^(due this week|due today|due tomorrow|due soon|due)$/i, "Due soon"],
  [/^(with client|waiting on client|waiting on the client|waiting|pending with client)$/i, "Waiting"],
  [/^(in progress)$/i, "In progress"],
  [/^(overdue|late)$/i, "Overdue"],
  [/^(done|complete|completed)$/i, "Done"],
  [/^(not started)$/i, "Not started"],
];
export function statusWord(s: string) {
  const hit = SIX.find(([re]) => re.test(s.trim()));
  return hit ? hit[1] : s;
}

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  /** R-13: exactly 104 px, so status columns line up. Without it the chip is at least 104 px. */
  fixed?: boolean;
  dot?: boolean;
}

/** R-13: status chip. 24 px high, 6 px corners, 104 px wide, 7 px square dot, 12 px weight 500. */
export function Chip({ tone, fixed, dot = true, className, children, ...rest }: ChipProps) {
  const t = tone ?? (typeof children === "string" ? toneFor(children) : "idle");
  const word = typeof children === "string" ? statusWord(children) : children;
  return (
    <span
      title={typeof children === "string" && word !== children ? children : undefined}
      className={cn(
        "inline-flex h-6 flex-none items-center gap-[7px] whitespace-nowrap rounded-md px-[9px] text-12 font-medium",
        tones[t],
        fixed ? "w-[104px] overflow-hidden" : "min-w-[104px]",
        className,
      )}
      {...rest}
    >
      {dot && <i className={cn("h-[7px] w-[7px] flex-none rounded-[2px]", dots[t])} aria-hidden />}
      <span className="min-w-0 truncate">{word}</span>
    </span>
  );
}

export type Owner = "client" | "sbc" | "mca";

const ownerTone: Record<Owner, [string, string]> = {
  client: ["bg-warn-soft text-warn", "bg-warn-mid"],
  sbc: ["bg-info-soft text-info", "bg-info-mid"],
  mca: ["bg-violet-soft text-violet", "bg-violet-mid"],
};

/** R-14: owner chip, 104 px. Client amber, SBC blue, MCA violet. */
export function OwnerChip({ owner, label, className }: { owner: Owner; label?: string; className?: string }) {
  const text = label ?? (owner === "client" ? "Client" : owner === "sbc" ? "SBC" : "MCA");
  return (
    <span className={cn("inline-flex h-6 w-[104px] flex-none items-center gap-[7px] overflow-hidden whitespace-nowrap rounded-md px-[9px] text-12 font-medium", ownerTone[owner][0], className)}>
      <i className={cn("h-[7px] w-[7px] flex-none rounded-[2px]", ownerTone[owner][1])} aria-hidden />
      <span className="min-w-0 truncate">{text}</span>
    </span>
  );
}

export type Regulator = "mca" | "gst" | "it" | "payroll" | "fema" | "labour";

const REG_SWATCH: Record<Regulator, string> = {
  mca: "bg-reg-mca",
  gst: "bg-reg-gst",
  it: "bg-reg-it",
  payroll: "bg-reg-payroll",
  fema: "bg-reg-fema",
  labour: "bg-reg-labour",
};

/** The regulator for an area word, or undefined. "ROC" is MCA; "TDS" is income tax; PF and ESI are payroll. */
export function regOf(area: string): Regulator | undefined {
  const s = area.trim().toLowerCase();
  if (/^(mca|roc|incorporation)$/.test(s)) return "mca";
  if (/^gst/.test(s)) return "gst";
  if (/^(income tax|it|tds|tcs)$/.test(s)) return "it";
  if (/^(payroll|pf|esi|pf and esi)$/.test(s)) return "payroll";
  if (/^(fema|rbi)$/.test(s)) return "fema";
  if (/^(labour|labor|pt|professional tax|shops)$/.test(s)) return "labour";
  return undefined;
}

/** R-43: area pill. 24 px, 6 px corners, 1.5 px edge, white fill, 104 px, 8 px swatch. The text stays ink. */
export function AreaPill({ area, reg, className }: { area: string; reg?: Regulator; className?: string }) {
  const r = reg ?? regOf(area);
  return (
    <span className={cn("inline-flex h-6 w-[104px] flex-none items-center gap-1 overflow-hidden whitespace-nowrap rounded-md border-1.5 border-line bg-surface px-[7px] text-12 font-medium text-ink-2", className)}>
      <i className={cn("h-2 w-2 flex-none rounded-[2px]", r ? REG_SWATCH[r] : "bg-idle-mid")} aria-hidden />
      <span className="min-w-0 truncate">{area}</span>
    </span>
  );
}

/** Soft tag without a dot, for categories. A regulator word (GST, MCA, Income tax) becomes an area pill (R-43). */
export function Tag({ tone = "idle", className, children }: { tone?: ChipTone; className?: string; children: React.ReactNode }) {
  if (typeof children === "string" && regOf(children)) return <AreaPill area={children} className={className} />;
  return <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-md px-2 text-12 font-medium", tones[tone], className)}>{children}</span>;
}
