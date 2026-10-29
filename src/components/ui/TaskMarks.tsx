import * as React from "react";
import { Building2, User, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { URGENCY_BARS, VISIBILITY_LABEL, type TaskUrgency, type Visibility } from "@/data/compliance-tasks";

// Marks for non-statutory tasks (docs/COMPLIANCE-MODEL.md S-6 and S-7).
// Urgency stays neutral: red is for late work only (R-03). Only "Critical" fills its bars with warn-mid.

export function UrgencyPill({ urgency, className }: { urgency: TaskUrgency; className?: string }) {
  const n = URGENCY_BARS[urgency];
  return (
    <span
      className={cn("inline-flex h-6 w-[88px] shrink-0 items-center gap-2 rounded-md border-1.5 border-line bg-surface px-2 text-12.5 font-medium text-ink-2", className)}
      title={`Urgency: ${urgency}`}
    >
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-bar", i <= n ? (urgency === "Critical" ? "bg-warn-mid" : "bg-ink-2") : "bg-line-2")} style={{ height: `${3 + i * 2}px` }} />
        ))}
      </span>
      {urgency}
    </span>
  );
}

const VIS_ICON = { firm: Building2, client: User, both: Users } as const;

export function VisibilityTag({ visibility, className }: { visibility: Visibility; className?: string }) {
  const Icon = VIS_ICON[visibility];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-13 text-ink-2", className)}
      title={visibility === "both" ? "Visible to the firm and the client" : visibility === "firm" ? "Visible to the firm only" : "Visible to the client"}
    >
      <Icon size={15} strokeWidth={1.6} aria-hidden className="text-muted" />
      {VISIBILITY_LABEL[visibility]}
    </span>
  );
}
