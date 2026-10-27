"use client";
import * as React from "react";
import { AlertTriangle, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt, daysFrom } from "@/lib/dates";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FileBadge, fileType } from "@/components/ui/FileBadge";

export interface UploadRequest {
  id: string;
  name: string;
  due?: Date;
  /** SBC sent the last file back. */
  sentBack?: boolean;
  /** SBC note on the file it sent back. */
  note?: string;
  /** Initials of the SBC person who wrote the note. */
  noteBy?: string;
}

export interface PickedFile {
  key: string;
  name: string;
  size: number;
  pct: number;
  error?: string;
}

const ACCEPT = ["PDF", "JPG", "JPEG", "PNG", "DOCX"];
const MAX = 10 * 1024 * 1024;

function sizeLabel(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function dueChip(r: UploadRequest) {
  if (r.sentBack) return <Chip tone="bad">Re-upload</Chip>;
  if (!r.due) return null;
  return daysFrom(r.due) < 0 ? <Chip tone="bad">Overdue · {fmt(r.due)}</Chip> : <Chip tone="warn">Due {fmt(r.due)}</Chip>;
}

/** docs_upload: pick the request, drop or browse files, see progress and refused files. One main button (R-12). */
export function UploadDialog({
  open,
  onOpenChange,
  requests,
  initialId,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  requests: UploadRequest[];
  initialId?: string;
  onUpload: (requestId: string | undefined, files: PickedFile[]) => void;
}) {
  const [forId, setForId] = React.useState<string | undefined>(initialId ?? requests[0]?.id);
  const [files, setFiles] = React.useState<PickedFile[]>([]);
  const [over, setOver] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setForId(initialId ?? requests[0]?.id);
    setFiles([]);
    setOver(false);
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialId]);

  // Simulated upload progress. Text only, no animation (R-41).
  React.useEffect(() => {
    if (!files.some((f) => !f.error && f.pct < 100)) return;
    const h = window.setInterval(() => setFiles((fs) => fs.map((f) => (f.error || f.pct >= 100 ? f : { ...f, pct: Math.min(100, f.pct + 18) }))), 160);
    return () => window.clearInterval(h);
  }, [files]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next: PickedFile[] = Array.from(list).map((f, i) => {
      const ext = f.name.split(".").pop()?.toUpperCase() ?? "";
      const error = !ACCEPT.includes(ext) ? "this file type can't be opened" : f.size > MAX ? "larger than 10 MB" : undefined;
      return { key: `${Date.now()}-${i}-${f.name}`, name: f.name, size: f.size, pct: error ? 0 : 0, error };
    });
    setFiles((fs) => [...fs, ...next]);
  };

  const req = requests.find((r) => r.id === forId);
  const good = files.filter((f) => !f.error);
  const ready = good.length > 0 && good.every((f) => f.pct >= 100) && (requests.length === 0 || !!req);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Upload a document"
      size="md"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!ready}
            onClick={() => {
              onUpload(forId, good);
              onOpenChange(false);
            }}
          >
            <Upload size={15} strokeWidth={1.5} /> Upload
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {requests.length > 0 && (
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-12.5 font-semibold text-muted">For</legend>
            <div className="overflow-hidden rounded-md border border-line">
              {requests.map((r) => {
                const on = r.id === forId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setForId(r.id)}
                    className={cn("flex w-full items-center gap-3 border-t border-line-soft px-3 py-2.5 text-left text-13.5 first:border-t-0 hover:bg-raised", on && "bg-accent-soft hover:bg-accent-soft")}
                  >
                    <span className={cn("grid h-4 w-4 flex-none place-items-center rounded-full border", on ? "border-btn" : "border-line")}>{on && <span className="h-2 w-2 rounded-full bg-navy" />}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
                    {dueChip(r)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {req?.note && (
          <div className="flex items-start gap-2.5 rounded-md bg-raised px-3 py-2.5 text-13">
            <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-accent-soft font-mono text-11 font-semibold text-accent">{req.noteBy ?? "SBC"}</span>
            <span className="min-w-0 text-ink-2">“{req.note}”</span>
          </div>
        )}

        <div
          role="button"
          tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            add(e.dataTransfer.files);
          }}
          className={cn("grid cursor-pointer place-items-center gap-1 rounded-md border border-dashed px-4 py-7 text-center outline-none focus-visible:ring-2 focus-visible:ring-accent-line", over ? "border-accent bg-accent-soft" : "border-line bg-raised hover:border-accent-line")}
        >
          <Upload size={18} strokeWidth={1.5} className={over ? "text-accent" : "text-muted"} />
          <span className="text-13.5 font-semibold">{over ? "Release to upload" : <>Drop files here or <span className="text-accent">browse</span></>}</span>
          <span className="font-mono text-11.5 text-faint">PDF · JPG · PNG · DOCX · up to 10 MB</span>
          <input ref={input} type="file" multiple className="sr-only" tabIndex={-1} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </div>

        {files.length > 0 && (
          <ul className="overflow-hidden rounded-md border border-line">
            {files.map((f) => (
              <li key={f.key} className={cn("flex items-center gap-3 border-t border-line-soft px-3 py-2.5 text-13 first:border-t-0", f.error && "bg-bad-soft")}>
                {f.error ? <AlertTriangle size={16} strokeWidth={1.5} className="flex-none text-bad" /> : <FileBadge type={fileType(f.name)} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-12.5 font-medium">{f.name}</span>
                  <span className={cn("block text-12", f.error ? "text-bad" : "text-muted")}>{f.error ? f.error : f.pct >= 100 ? `${sizeLabel(f.size)} · ready` : `${sizeLabel(f.size)} · ${f.pct}%`}</span>
                </span>
                {f.error ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setFiles((fs) => fs.filter((x) => x.key !== f.key));
                      input.current?.click();
                    }}
                  >
                    Try again
                  </Button>
                ) : (
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((fs) => fs.filter((x) => x.key !== f.key))} className="grid h-7 w-7 flex-none place-items-center rounded-sm text-muted hover:bg-raised">
                    <X size={14} strokeWidth={1.5} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
