"use client";
import * as React from "react";
import { Check, FileText, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { CONTACTS } from "@/data/staff-clients";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { IconTile } from "@/components/ui/IconTile";
import { useUndoToast } from "@/components/ui/UndoToast";
import { type StaffPortal } from "./parts";

// Staff board resolution, as in reference/old-screens/s/lead/BoardRes.dc.html:
// the document preview with B, I and U, the "Word document ready" buttons, the five-stage stepper,
// "Finalise for client" and the in-page "Finalise board resolution?" confirm (R-40), then "Send to client".

const CLIENT = "larkspur";

/** Stages of the old stepper. */
const STAGES = ["Generated from Pre-1", "Draft · editing", "Finalized · client visible", "Sent to client", "Signed copy uploaded"];

function Page({ docKey, editable, onInput, pageRef }: { docKey: number; editable: boolean; onInput: () => void; pageRef: React.RefObject<HTMLElement | null> }) {
  return (
    <article
      key={docKey}
      ref={pageRef}
      contentEditable={editable}
      suppressContentEditableWarning
      onInput={onInput}
      aria-label="Board resolution text"
      className="mx-auto min-h-[650px] w-full max-w-[600px] bg-white px-7 py-12 text-[12.5px] leading-[1.65] text-navy outline-none focus-visible:ring-2 focus-visible:ring-accent-line md:px-14"
      style={{ fontFamily: "Tinos, 'Times New Roman', serif" }}
    >
      <h3 className="mb-4 text-center font-bold">CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE BOARD OF DIRECTORS OF LARKSPUR DATA GMBH</h3>
      <p className="mb-4">At the meeting of the Board of Directors held on 9 October 2026 at Hamburg, the following resolution was passed:</p>
      <p className="mb-4">
        &quot;RESOLVED THAT the Company do incorporate a wholly owned subsidiary in India under the name{" "}
        <b className="border border-dashed border-warn-mid px-0.5 text-navy">Larkspur Analytics India Private Limited</b> or such other name as may be approved by the Registrar of Companies…&quot;
      </p>
      <p className="mb-4">&quot;RESOLVED FURTHER THAT Ms Sofia Moreau, Director, be and is hereby authorised to sign the subscriber sheet, Memorandum and Articles of Association…&quot;</p>
      <p className="mb-4">&quot;RESOLVED FURTHER THAT the Company subscribe to 9,999 equity shares of ₹10 each…&quot;</p>
      <p className="mt-12">
        For and on behalf of the Board
        <br />
        <br />
        <br />
        ____________________
        <br />
        Sofia Moreau, Director
      </p>
    </article>
  );
}

export function BoardResolutionScreen({ portal }: { portal: StaffPortal }) {
  void portal;
  const { show, node } = useUndoToast();
  const [stage, setStage] = React.useState(1);
  const [dirty, setDirty] = React.useState(true);
  // The old screen shows the confirm open under the stepper.
  const [confirm, setConfirm] = React.useState(true);
  const [docKey, setDocKey] = React.useState(0);
  const [marks, setMarks] = React.useState({ bold: false, italic: false, underline: false });
  const page = React.useRef<HTMLElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const editable = stage <= 1;
  const contact = CONTACTS[CLIENT];

  const fmtCmd = (cmd: "bold" | "italic" | "underline") => {
    page.current?.focus();
    // execCommand is deprecated but still the simplest rich-text toggle for a prototype.
    document.execCommand(cmd);
    setMarks((m) => ({ ...m, [cmd]: !m[cmd] }));
    setDirty(true);
  };
  const reset = (text: string) => {
    setDocKey((k) => k + 1);
    setDirty(false);
    show(text);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <IconTile Icon={FileText} tone="blue" size={30} />
        <Chip tone={stage >= 2 ? "ok" : "warn"} dot={false}>
          {["Generated", "Draft", "Finalized", "Sent", "Signed"][stage]}
        </Chip>
        <span className="grid h-[22px] w-[26px] place-items-center rounded-sm bg-ok-soft text-[10px] font-bold text-ok">LA</span>
        <span className="text-13.5 text-muted">Larkspur Analytics · Pre-2</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 overflow-hidden rounded-md border-1.5 border-line bg-surface" aria-label="Document preview">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-line-soft px-4 py-2.5">
            <b className="mr-2 text-13 font-semibold">Document preview</b>
            {(
              [
                ["bold", "B", "Bold", "font-bold"],
                ["italic", "I", "Italic", "italic"],
                ["underline", "U", "Underline", "underline"],
              ] as const
            ).map(([cmd, glyph, label, cls]) => (
              <button
                key={cmd}
                type="button"
                aria-label={label}
                aria-pressed={marks[cmd]}
                disabled={!editable}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => fmtCmd(cmd)}
                className={cn("grid h-[30px] w-[30px] place-items-center rounded-md border border-line text-13 text-ink hover:bg-raised disabled:opacity-50", cls, marks[cmd] && "bg-raised")}
              >
                {glyph}
              </button>
            ))}
            <span className="ml-auto inline-flex items-center gap-1.5 text-12.5 text-muted">
              <i className={cn("h-1.5 w-1.5 rounded-[2px]", dirty ? "bg-warn-mid" : "bg-ok-mid")} aria-hidden />
              {dirty ? "Unsaved changes" : "Saved"}
            </span>
          </div>
          <div className="bg-raised px-3 py-6 md:px-6">
            <Page docKey={docKey} editable={editable} onInput={() => setDirty(true)} pageRef={page} />
          </div>
        </section>

        <aside className="grid gap-4">
          <section className="rounded-md border-1.5 border-line bg-surface p-4" aria-label="Word document ready">
            <div className="mb-3 flex items-center gap-2.5">
              <IconTile Icon={Check} tone="green" />
              <b className="text-13.5 font-semibold">Word document ready</b>
            </div>
            <div className="grid gap-2 pl-[38px]">
              <Button size="sm" className="justify-start" disabled={!dirty || !editable} onClick={() => reset("Changes saved")}>
                Save changes
              </Button>
              <Button size="sm" className="justify-start" disabled={!editable} onClick={() => reset("Latest template applied")}>
                Apply latest template
              </Button>
              <Button size="sm" className="justify-start" disabled={!editable} onClick={() => reset("Generated again from Pre-1")}>
                Re-generate from Pre-1
              </Button>
              <Button size="sm" className="justify-start" onClick={() => show("Downloads the Word document")}>
                Download Word document
              </Button>
            </div>
          </section>

          <section className="rounded-md border-1.5 border-line bg-surface p-4" aria-label="Progress">
            <ol className="relative grid gap-3">
              <span className="absolute bottom-2.5 left-[10px] top-2.5 w-px bg-line" aria-hidden />
              {STAGES.map((t, i) => (
                <li key={t} className="relative flex items-center gap-2.5 text-13">
                  <span
                    className={cn(
                      "grid h-[21px] w-[21px] flex-none place-items-center rounded-sm text-[10px] font-bold",
                      i < stage ? "bg-ok text-white" : i === stage ? "bg-navy text-white ring-2 ring-navy ring-offset-2 ring-offset-surface" : "border border-dashed border-faint bg-surface text-faint",
                    )}
                  >
                    {i < stage ? <Check size={11} strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span className={cn(i === stage ? "font-semibold text-ink" : i < stage ? "text-ink" : "text-muted")}>{t}</span>
                </li>
              ))}
            </ol>
            {stage === 1 && (
              <Button variant="primary" className="mt-4 w-full" onClick={() => setConfirm(true)}>
                Finalise for client
              </Button>
            )}
            {stage === 3 && (
              <>
                <Button variant="primary" className="mt-4 w-full" onClick={() => fileRef.current?.click()}>
                  <Upload size={16} strokeWidth={1.6} /> Upload signed copy
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files?.[0]) return;
                    setStage(4);
                    show(`Signed copy uploaded · ${e.target.files[0].name}`);
                  }}
                />
              </>
            )}
          </section>

          {(confirm || stage === 2) && (
            <section className="rounded-md border-1.5 border-line bg-surface p-4" aria-label="Finalise board resolution">
              {stage === 1 && (
                <>
                  <b className="block text-13.5 font-semibold">Finalise board resolution?</b>
                  <p className="text-12.5 text-muted">The client can see and download it after this.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button onClick={() => setConfirm(false)}>Cancel</Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setConfirm(false);
                        setDirty(false);
                        setStage(2);
                        show("Finalized · Larkspur can see it");
                      }}
                    >
                      Finalise
                    </Button>
                  </div>
                </>
              )}
              <p className={cn("text-12.5 text-ink-2", stage === 1 && "mt-3 border-t border-line-soft pt-3")}>
                <b className="font-semibold">Next:</b> Send board resolution to client?{" "}
                {stage === 2 ? (
                  <a
                    href={`mailto:${contact?.email ?? ""}?subject=${encodeURIComponent("Board resolution for signature")}`}
                    onClick={() => {
                      setStage(3);
                      show("Sent to client · Outlook opened");
                    }}
                    className="font-semibold text-accent hover:underline"
                  >
                    Send to client
                  </a>
                ) : (
                  <span className="text-accent">Send to client</span>
                )}{" "}
                opens Outlook.
              </p>
            </section>
          )}
        </aside>
      </div>
      {node}
    </div>
  );
}
