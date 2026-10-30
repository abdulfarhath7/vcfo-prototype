"use client";
import * as React from "react";
import { ClipboardCheck, Download, Eye, FileText, History } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FileBadge, type FileType } from "@/components/ui/FileBadge";
import { Modal } from "@/components/ui/Modal";
import { StepMark, type StepState } from "@/components/ui/StepMark";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { DropZone } from "@/screens/client/inc-parts";

/*
 * One document part (docs/BOARD-RESOLUTION-NOC.md section 5): track, files, preview tabs, receive checklist and audit lines.
 * The Board resolution (NOC) uses it first. A resolution by circulation, a notice or minutes give their own steps,
 * their own letterhead source and their own checklist.
 */

/* ---------- Track ---------- */

export interface DocStep {
  label: string;
  state: StepState;
  who?: string;
  when?: Date;
}

/** ST5 track (C2). A done step shows who and when. Six steps wrap to three columns on tablets and two on phones. */
export function DocTrack({ steps }: { steps: DocStep[] }) {
  return (
    <section aria-label="Progress" className="rounded-md border-1.5 border-line bg-surface">
      <ol className={cn("grid grid-cols-2", steps.length > 4 ? "md:grid-cols-3 xl:grid-cols-6" : "md:grid-cols-4")}>
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={cn(
              "grid min-w-0 gap-1 border-line-soft px-3.5 py-3.5",
              i > 0 && "border-l",
              "max-md:[&:nth-child(odd)]:border-l-0 max-md:[&:nth-child(n+3)]:border-t",
              steps.length > 4 && "md:max-xl:[&:nth-child(4)]:border-l-0 md:max-xl:[&:nth-child(n+4)]:border-t",
            )}
          >
            <StepMark state={s.state} size={20} label={s.state === "done" ? "Done" : s.state === "now" ? "Current step" : "Next"} />
            <b className={cn("mt-1 truncate text-14 font-medium", s.state === "next" && "text-muted")}>{s.label}</b>
            <span className="truncate text-12.5 text-muted">
              {s.state === "done" ? [s.who, s.when && fmt(s.when)].filter(Boolean).join(" · ") : s.state === "now" ? "Now" : "Next"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- Files ---------- */

export interface DocFile {
  id: string;
  /** The name people see. The client never sees the internal file name (P5). */
  name: string;
  /** Internal file name: staff only. */
  file?: string;
  type: FileType;
  meta: string;
  viewHref?: string;
}

export function DocFiles({
  files,
  drop,
  onDownload,
}: {
  files: DocFile[];
  drop?: { label: string; onFile: (name: string) => void; accept?: string };
  onDownload: (f: DocFile) => void;
}) {
  return (
    <SectionCard title="Files" icon={{ Icon: FileText, tone: "blue" }} meta={`${files.length} ${files.length === 1 ? "file" : "files"}`} flush>
      {files.length === 0 && <Empty>No files yet</Empty>}
      {files.map((f) => (
        <ListRow key={f.id}>
          <FileBadge type={f.type} />
          <span className="min-w-0 flex-1">
            <b className="block truncate font-medium">{f.name}</b>
            <span className="block truncate text-12.5 text-muted">
              {f.file && <span className="font-mono text-12">{f.file} · </span>}
              {f.meta}
            </span>
          </span>
          {f.viewHref ? (
            <Button asChild size="iconSm" variant="ghost" aria-label={`Open ${f.name}`}>
              <a href={f.viewHref}>
                <Eye size={16} strokeWidth={1.6} />
              </a>
            </Button>
          ) : (
            <span className="w-[30px] flex-none" />
          )}
          <Button size="iconSm" variant="ghost" aria-label={`Download ${f.name}`} onClick={() => onDownload(f)}>
            <Download size={16} strokeWidth={1.6} />
          </Button>
        </ListRow>
      ))}
      {drop && (
        <div className="border-t border-line-soft px-4 py-3 md:px-5">
          <DropZone label={drop.label} hint="PDF" tone="accent" accept={drop.accept ?? ".pdf"} onFile={drop.onFile} />
        </div>
      )}
    </SectionCard>
  );
}

/* ---------- Preview tabs ---------- */

export function DocPreview({ tabs, meta }: { tabs: Array<{ key: string; label: string; body: React.ReactNode }>; meta?: React.ReactNode }) {
  const [tab, setTab] = React.useState(tabs[0].key);
  const pick = tabs.find((t) => t.key === tab) ?? tabs[0];
  return (
    <section aria-label="Preview" className="min-w-0 overflow-hidden rounded-md border-1.5 border-line bg-surface">
      <div className="flex items-end justify-between gap-3 px-4 md:px-5">
        <Tabs variant="underline" items={tabs.map((t) => ({ key: t.key, label: t.label }))} value={pick.key} onChange={setTab} className="border-b-0" />
        {meta && <span className="pb-2.5 text-12.5 text-muted">{meta}</span>}
      </div>
      <div role="tabpanel" aria-label={pick.label} className="border-t-1.5 border-line bg-raised p-3 md:p-5">
        {pick.body}
      </div>
    </section>
  );
}

/** C6: the uploaded file only. VCFO never draws a signature or a seal (P7). */
export function SignedCopy({ file, onOpen }: { file: DocFile | null; onOpen?: () => void }) {
  if (!file)
    return (
      <div className="grid place-items-center gap-1 rounded-md border-1.5 border-dashed border-line-2 bg-surface px-4 py-12 text-center">
        <b className="text-14 font-medium">No signed copy yet</b>
        <span className="text-13 text-muted">The uploaded PDF shows here.</span>
      </div>
    );
  return (
    <div className="grid place-items-center gap-3 rounded-md border-1.5 border-line bg-surface px-4 py-10 text-center">
      <FileBadge type={file.type} />
      <span>
        <b className="block text-14 font-medium">{file.name}</b>
        <span className="block text-13 text-muted">{file.meta}</span>
      </span>
      {file.viewHref ? (
        <Button asChild size="sm">
          <a href={file.viewHref}>Open the PDF</a>
        </Button>
      ) : (
        <Button size="sm" onClick={onOpen}>
          Open the PDF
        </Button>
      )}
    </div>
  );
}

/* ---------- Receive checklist ---------- */

/** T5: Accept unlocks when every check is ticked. Send back asks for a reason. */
export function ReceiveChecklist({
  checks,
  accepted,
  onAccept,
  onSendBack,
  after,
}: {
  checks: string[];
  accepted: boolean;
  onAccept: () => void;
  onSendBack: (reason: string) => void;
  after?: React.ReactNode;
}) {
  const [ticked, setTicked] = React.useState<Set<number>>(new Set());
  const [asking, setAsking] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const all = accepted || ticked.size === checks.length;
  const flip = (i: number) =>
    setTicked((t) => {
      const n = new Set(t);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const send = () => {
    setTried(true);
    if (!reason.trim()) return;
    onSendBack(reason.trim());
    setAsking(false);
    setReason("");
    setTried(false);
    setTicked(new Set());
  };
  return (
    <SectionCard title="Receive checklist" icon={{ Icon: ClipboardCheck, tone: "teal" }} meta={`${accepted ? checks.length : ticked.size} of ${checks.length}`} flush>
      <ul className="px-4 py-2 md:px-5">
        {checks.map((c, i) => (
          <li key={c}>
            <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-14">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={accepted || ticked.has(i)} disabled={accepted} onChange={() => flip(i)} />
              {c}
            </label>
          </li>
        ))}
      </ul>
      {after}
      {!accepted && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft px-4 py-3 md:px-5">
          <Button onClick={() => setAsking(true)}>Send back</Button>
          <Button variant="primary" disabled={!all} onClick={onAccept}>
            Accept
          </Button>
        </div>
      )}
      <Modal
        open={asking}
        onOpenChange={setAsking}
        title="Send back"
        size="sm"
        footer={
          <>
            <Button onClick={() => setAsking(false)}>Cancel</Button>
            <Button variant="primary" onClick={send}>
              Send back
            </Button>
          </>
        }
      >
        <label className="grid gap-1.5 text-13">
          <span className="font-medium">Reason</span>
          <textarea
            autoFocus
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={tried && !reason.trim()}
            className={cn("w-full rounded-md border-1.5 border-line-2 bg-surface px-3 py-2 text-14 outline-none focus:border-primary", tried && !reason.trim() && "border-bad")}
          />
          {tried && !reason.trim() ? <span className="text-12.5 text-bad">Write the reason.</span> : <span className="text-12.5 text-muted">The client gets this reason.</span>}
        </label>
      </Modal>
    </SectionCard>
  );
}

/* ---------- Audit lines ---------- */

export interface AuditLine {
  who: string;
  what: string;
  when: string;
}

export function DocAudit({ rows }: { rows: AuditLine[] }) {
  return (
    <SectionCard title="Audit" icon={{ Icon: History, tone: "violet" }} meta={rows.length} flush>
      <ul>
        {rows.map((h, i) => (
          <li key={i} className="flex items-start gap-3 border-t border-line-soft px-4 py-2.5 first:border-t-0 md:px-5">
            <Avatar name={h.who} size={24} />
            <span className="min-w-0 flex-1 text-14">
              <b className="font-medium">{h.who}</b> <span className="text-ink-2">{h.what}</span>
            </span>
            <span className="flex-none whitespace-nowrap text-12.5 text-muted">{h.when}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
