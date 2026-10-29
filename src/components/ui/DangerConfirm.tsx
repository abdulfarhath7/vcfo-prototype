"use client";
import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface DangerConfirmProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** "Remove Bharath from Northwind?" */
  title: string;
  /** What happens next, one or two short sentences. */
  body?: React.ReactNode;
  /** The word to type, in capitals: "REMOVE". */
  word: string;
  /** Label of the red button: "Remove lead". */
  confirm: string;
  onConfirm: () => void;
  icon?: LucideIcon;
}

/**
 * M1: danger confirm. A red tile, the question, what happens, and a field: "Type REMOVE to confirm".
 * The red button stays off until the word matches (any case). Enter confirms; Escape and Cancel close.
 */
export function DangerConfirm(props: DangerConfirmProps) {
  const id = React.useId();
  return (
    <D.Root open={props.open} onOpenChange={props.onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <D.Content
          role="alertdialog"
          className="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border-1.5 border-line bg-surface text-ink shadow-dialog outline-none"
          aria-describedby={props.body ? `${id}-body` : undefined}
        >
          {/* The body mounts with the dialog, so the typed word starts empty each time. */}
          <Body {...props} id={id} />
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

function Body({ onOpenChange, title, body, word, confirm, onConfirm, icon: Icon = Trash2, id }: DangerConfirmProps & { id: string }) {
  const [typed, setTyped] = React.useState("");
  const ok = typed.trim().toUpperCase() === word.toUpperCase();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        onConfirm();
        onOpenChange(false);
      }}
    >
      <div className="flex flex-col gap-3.5 px-[22px] pb-[18px] pt-[22px]">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-md bg-bad-soft text-bad" aria-hidden>
            <Icon size={18} strokeWidth={1.6} />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <D.Title className="text-[17px] font-medium leading-6">{title}</D.Title>
            {body && (
              <D.Description id={`${id}-body`} className="text-14 leading-[21px] text-ink-2">
                {body}
              </D.Description>
            )}
          </span>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-13 font-medium text-ink-2">
            Type <span className="font-mono text-ink">{word}</span> to confirm
          </span>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={typed.length > 0 && !word.toUpperCase().startsWith(typed.trim().toUpperCase())}
          />
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t-1.5 border-line bg-raised px-[22px] py-3.5">
        <D.Close asChild>
          <Button variant="outline">Cancel</Button>
        </D.Close>
        <Button type="submit" variant="danger" disabled={!ok}>
          {confirm}
        </Button>
      </div>
    </form>
  );
}
