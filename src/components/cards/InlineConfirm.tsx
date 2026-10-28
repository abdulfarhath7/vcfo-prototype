import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export interface InlineConfirmProps {
  /** "Rotate the key for Email?" */
  question: string;
  /** Label of the main button: "Rotate". */
  confirm: string;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

/** R-40: ask before a risky change. One row: the question, a navy confirm button and a Cancel button. Never window.confirm. */
export function InlineConfirm({ question, confirm, onConfirm, onCancel, className }: InlineConfirmProps) {
  return (
    <div
      role="alertdialog"
      aria-label={question}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel();
        }
      }}
      className={cn("flex flex-wrap items-center gap-2.5 border-t border-line-soft bg-raised px-4 py-2.5 md:px-5", className)}>
      <span className="min-w-0 flex-1 text-13 font-semibold">{question}</span>
      <span className="flex flex-none items-center gap-2">
        <Button variant="primary" size="sm" onClick={onConfirm} autoFocus>
          {confirm}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </span>
    </div>
  );
}
