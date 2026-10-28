import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export interface ChangeConfirmProps {
  /** "Rotate the MSG91 auth key?" */
  question: string;
  /** Label of the main button: "Rotate". */
  confirm: string;
  /** Value now and value after the change. Both optional. */
  before?: string;
  after?: string;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

/** R-40: ask before a risky change. Shows the value now and after, then a navy confirm and Cancel. Never window.confirm. */
export function ChangeConfirm({ question, confirm, before, after, onConfirm, onCancel, className }: ChangeConfirmProps) {
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
      className={cn("grid gap-2 border-t border-line-soft bg-raised px-4 py-2.5 md:px-5", className)}>
      <div className="flex flex-wrap items-center gap-2.5">
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
      {(before || after) && (
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-12.5">
          <span className="text-muted">Now</span>
          <span className="min-w-0 break-words rounded-sm border border-line bg-surface px-2 py-0.5 font-mono text-12">{before || "-"}</span>
          <ArrowRight size={14} strokeWidth={1.5} className="flex-none text-faint" aria-hidden />
          <span className="text-muted">After</span>
          <span className="min-w-0 break-words rounded-sm border border-line bg-surface px-2 py-0.5 font-mono text-12">{after || "-"}</span>
        </div>
      )}
    </div>
  );
}
