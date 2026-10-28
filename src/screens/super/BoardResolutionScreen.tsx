"use client";
import * as React from "react";
import Link from "next/link";
import { Bold, Download, Italic, RefreshCw, Send, Underline } from "lucide-react";
import { TODAY, fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { barFill } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FileBadge } from "@/components/ui/FileBadge";
import { Modal } from "@/components/ui/Modal";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { StatusCircle } from "@/components/cards/GanttTimeline";
import { clientById } from "@/data/super";

// Super admin board resolution. Ported from reference/old-screens/s/super/BoardRes.dc.html.
// The staff BoardResolutionScreen takes portal "lead" | "manager" | "admin" only, so the super portal has this version:
// document preview with a small format bar, the Word document actions, and the five-stage flow with "Finalise for client".

const CLIENT = "larkspur";

const DRAFT = [
  "CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE BOARD OF DIRECTORS OF EMBER STUDIOS HOLDINGS LIMITED",
  "At the meeting of the Board of Directors held on 29 September 2026 at London, the following resolution was passed:",
  "“RESOLVED THAT the Company do incorporate a wholly owned subsidiary in India under the name Larkspur Analytics Private Limited or such other name as may be approved by the Registrar of Companies.”",
  "“RESOLVED FURTHER THAT Ms Sofia Moreau, Director, be and is hereby authorised to sign the subscriber sheet, Memorandum and Articles of Association and all other documents for the incorporation.”",
  "“RESOLVED FURTHER THAT the Company subscribe to 9,999 equity shares of ₹10 each of the proposed company.”",
  "For and on behalf of the Board",
  "Sofia Moreau, Director",
];

const STAGES = ["Generated from step 1", "Draft · editing", "Finalised · client can see it", "Sent to client", "Signed copy uploaded"];

export function BoardResolutionScreen() {
  const c = clientById(CLIENT)!;
  const [stage, setStage] = React.useState(1);
  const [dirty, setDirty] = React.useState(false);
  const [marks, setMarks] = React.useState<Record<string, boolean>>({});
  const [asking, setAsking] = React.useState(false);
  const toast = useUndoToast();

  const mark = (k: string) => {
    setMarks((m) => ({ ...m, [k]: !m[k] }));
    setDirty(true);
  };
  const tools = [
    { k: "b", Icon: Bold, label: "Bold" },
    { k: "i", Icon: Italic, label: "Italic" },
    { k: "u", Icon: Underline, label: "Underline" },
  ];

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Board resolution"
          meta={
            <span className="inline-flex items-center gap-1.5">
              <i className={cn("h-2 w-2 rounded-[2px]", barFill[c.tone])} aria-hidden />
              {c.short} · Step 2
            </span>
          }
          right={<Chip tone={stage >= 2 ? "ok" : "idle"}>{stage >= 2 ? "Final" : "Draft"}</Chip>}
          flush
        >
          <div className="flex items-center gap-1 border-b border-line-soft px-4 py-2 md:px-5">
            {tools.map((t) => (
              <Button key={t.k} size="iconSm" variant="ghost" aria-label={t.label} aria-pressed={!!marks[t.k]} className={cn(marks[t.k] && "bg-raised text-ink")} onClick={() => mark(t.k)} disabled={stage >= 2}>
                <t.Icon size={15} strokeWidth={1.6} />
              </Button>
            ))}
            {dirty && <span className="ml-2 text-12.5 text-warn">Unsaved changes</span>}
          </div>
          <div className="px-4 py-5 md:px-5">
            <article
              contentEditable={stage < 2}
              suppressContentEditableWarning
              onInput={() => setDirty(true)}
              className={cn("mx-auto grid max-w-[640px] gap-3 rounded-md border border-line bg-surface px-5 py-6 text-13.5 leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-accent-line md:px-8", marks.b && "font-semibold", marks.i && "italic", marks.u && "underline")}
            >
              <h3 className="text-center text-13 font-semibold">{DRAFT[0]}</h3>
              {DRAFT.slice(1, 5).map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p className="mt-6">{DRAFT[5]}</p>
              <p className="border-t border-line pt-2 text-muted">{DRAFT[6]}</p>
            </article>
          </div>
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="Word document ready" flush>
          <ListRow>
            <FileBadge type="DOCX" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-12.5 font-semibold">board-resolution-larkspur-v{stage + 2}.docx</span>
              <span className="block truncate text-12.5 text-muted">52 KB · {fmt(TODAY)}</span>
            </span>
          </ListRow>
          <div className="grid gap-2 border-t border-line-soft px-4 py-3 md:px-5">
            <Button
              size="sm"
              variant="outline"
              disabled={!dirty}
              onClick={() => {
                setDirty(false);
                toast.show("Changes saved");
              }}
            >
              Save changes
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.show("Latest template applied")} disabled={stage >= 2}>
              Apply latest template
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.show("Draft generated again from step 1")} disabled={stage >= 2}>
              <RefreshCw size={14} strokeWidth={1.6} /> Generate again from step 1
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.show("Downloaded board-resolution-larkspur.docx")}>
              <Download size={14} strokeWidth={1.6} /> Download Word document
            </Button>
          </div>
        </SectionCard>

        <SectionCard
          title="Progress flow"
          flush
          right={
            stage === 1 ? (
              <Button size="sm" variant="primary" onClick={() => setAsking(true)}>
                Finalise for client
              </Button>
            ) : stage === 2 ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setStage(3);
                  toast.show("Sent to Sofia Moreau");
                }}
              >
                <Send size={14} strokeWidth={1.6} /> Send to client
              </Button>
            ) : undefined
          }
        >
          {STAGES.map((s, i) => (
            <ListRow key={s}>
              <StatusCircle status={i < stage ? "done" : i === stage ? "current" : "planned"} />
              <span className={cn("min-w-0 flex-1 truncate", i > stage && "text-muted", i === stage && "font-semibold")}>{s}</span>
              {i < stage && <span className=" text-12 text-muted">{fmt(TODAY)}</span>}
            </ListRow>
          ))}
          <div className="border-t border-line-soft px-4 py-3 text-13 md:px-5">
            <Link href={`/super/clients/${CLIENT}/step/2`} className="font-semibold text-accent hover:underline">
              Open step ›
            </Link>
          </div>
        </SectionCard>
      </Col>

      <Modal
        open={asking}
        onOpenChange={setAsking}
        title="Finalise board resolution?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAsking(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setStage(2);
                setDirty(false);
                setAsking(false);
                toast.show("Board resolution finalised");
              }}
            >
              Finalise
            </Button>
          </>
        }
      >
        <p className="text-13.5 text-ink-2">The client can see and download it after this.</p>
      </Modal>
      {toast.node}
    </Cols>
  );
}
