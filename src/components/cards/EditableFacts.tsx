"use client";
import * as React from "react";
import { Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "./SectionCard";

export interface FactRow {
  k: string;
  v: string;
  /** Identifier: IBM Plex Mono (R-28). */
  mono?: boolean;
}

export interface EditableFactsProps {
  title: string;
  rows: FactRow[];
  /** Show the Edit button. Read-only when false. */
  editable?: boolean;
  /** Called with the new rows on Save. The parent keeps the state (and can undo). */
  onSave?: (rows: FactRow[]) => void;
  meta?: React.ReactNode;
  icon?: { Icon: LucideIcon; tone: Tone };
  cols?: 1 | 2;
  /** Label of the main button in edit mode. */
  saveLabel?: string;
}

/** Label and value rows. Edit turns each value into an input; Save keeps them (R-40: a plain setting saves on Save). */
export function EditableFacts({ title, rows, editable, onSave, meta, icon, cols = 2, saveLabel = "Save" }: EditableFactsProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<string[]>(rows.map((r) => r.v));
  const start = () => {
    setDraft(rows.map((r) => r.v));
    setEditing(true);
  };
  const save = () => {
    onSave?.(rows.map((r, i) => ({ ...r, v: draft[i] ?? r.v })));
    setEditing(false);
  };
  const changed = draft.some((v, i) => v !== rows[i]?.v);

  return (
    <SectionCard
      title={title}
      meta={meta}
      icon={icon}
      right={
        editable && !editing ? (
          <Button size="sm" onClick={start}>
            <Pencil size={14} strokeWidth={1.6} /> Edit
          </Button>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <p className="text-13 text-faint">None</p>
      ) : editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className={cn("grid gap-x-6 gap-y-3", cols === 2 && "sm:grid-cols-2")}>
            {rows.map((r, i) => (
              <label key={r.k} className="grid min-w-0 gap-1">
                <span className="text-12 text-muted">{r.k}</span>
                <Input
                  value={draft[i] ?? ""}
                  onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? e.target.value : x)))}
                  className={cn("h-[34px]", r.mono && "font-mono text-13")}
                  autoFocus={i === 0}
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line-soft pt-3">
            <Button size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="primary" disabled={!changed}>
              {saveLabel}
            </Button>
          </div>
        </form>
      ) : (
        <dl className={cn("grid gap-x-6 gap-y-3", cols === 2 && "sm:grid-cols-2")}>
          {rows.map((r) => (
            <div key={r.k} className="min-w-0">
              <dt className="text-12 text-muted">{r.k}</dt>
              <dd className={cn("break-words text-13.5 font-medium", r.mono && "font-mono text-13", r.v === "-" && "text-faint")}>{r.v}</dd>
            </div>
          ))}
        </dl>
      )}
    </SectionCard>
  );
}
