"use client";
import * as React from "react";
import { Bold, Check, Download, Italic, Send, Underline, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, d, fmt } from "@/lib/dates";
import { clientById } from "@/data/staff-clients";
import { CONTACTS } from "@/data/staff-clients";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FileBadge } from "@/components/ui/FileBadge";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, HeadLink } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { InlineConfirm } from "@/components/cards/InlineConfirm";
import { ClientDot, personOf, stepHrefFor, type StaffPortal } from "./parts";

// Ported from reference/old-screens/s/lead/BoardRes.dc.html. The old sample was Larkspur (Pre-2); here it is Ember, step 2.
const CLIENT = "ember";

const DRAFT = [
  "CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE BOARD OF DIRECTORS OF EMBER STUDIOS HOLDINGS LIMITED",
  "At the meeting of the Board of Directors held on 29 September 2026 at London, the following resolution was passed:",
  "“RESOLVED THAT the Company do incorporate a wholly owned subsidiary in India under the name Ember Studios Private Limited or such other name as may be approved by the Registrar of Companies.”",
  "“RESOLVED FURTHER THAT Ms Sofia Moreau, Director, be and is hereby authorised to sign the subscriber sheet, Memorandum and Articles of Association and all other documents for the incorporation.”",
  "“RESOLVED FURTHER THAT the Company subscribe to 9,999 equity shares of ₹10 each of the proposed company.”",
  "For and on behalf of the Board",
  "Sofia Moreau, Director",
];

interface Version {
  v: number;
  label: string;
  by: string;
  date: Date;
  state: string;
}

const VERSIONS: Version[] = [
  { v: 1, label: "Generated from client details", by: "VCFO", date: d(2026, 9, 28), state: "Done" },
  { v: 2, label: "Draft · edited", by: "Divya", date: d(2026, 10, 2), state: "Done" },
  { v: 3, label: "Draft · manager review", by: "Divya", date: d(2026, 10, 5), state: "In review" },
];

/** Stages of the progress flow (old right rail). */
const STAGES = ["Generated from Step 1", "Draft · editing", "Finalised · client can see it", "Sent to client", "Signed copy uploaded"];

export function BoardResolutionScreen({ portal }: { portal: StaffPortal }) {
  const c = clientById(CLIENT)!;
  const toast = useUndoToast();
  const [stage, setStage] = React.useState(1); // index into STAGES
  const [dirty, setDirty] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [versions, setVersions] = React.useState<Version[]>(VERSIONS);
  const [docKey, setDocKey] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const page = React.useRef<HTMLElement>(null);

  const addVersion = (label: string, state = "Done") => setVersions((vs) => [...vs.map((x) => ({ ...x, state: x.state === "In review" ? "Done" : x.state })), { v: vs.length + 1, label, by: personOf(portal), date: TODAY, state }]);
  const editable = stage <= 1;
  const fmtCmd = (cmd: "bold" | "italic" | "underline") => {
    page.current?.focus();
    // execCommand is deprecated but still the simplest rich-text toggle for a prototype.
    document.execCommand(cmd);
    setDirty(true);
  };
  const stateChip = ["Generated", "Draft", "Finalised", "Sent", "Signed"][stage];

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Board resolution"
          meta={
            <span className="inline-flex items-center gap-1.5">
              <ClientDot tone={c.tone} />
              {c.short} · Step 2
            </span>
          }
          right={<Chip tone={stage >= 2 ? "ok" : "warn"}>{stateChip}</Chip>}
          flush
        >
          <div className="flex flex-wrap items-center gap-1 border-b border-line-soft px-4 py-2 md:px-5">
            <span className="mr-2 text-12.5 font-semibold text-muted">Document preview</span>
            {(
              [
                ["bold", Bold, "Bold"],
                ["italic", Italic, "Italic"],
                ["underline", Underline, "Underline"],
              ] as const
            ).map(([cmd, Icon, label]) => (
              <Button key={cmd} size="iconSm" variant="ghost" aria-label={label} disabled={!editable} onMouseDown={(e) => e.preventDefault()} onClick={() => fmtCmd(cmd)}>
                <Icon size={15} strokeWidth={1.5} />
              </Button>
            ))}
            <span className="ml-auto inline-flex items-center gap-1.5 text-12.5 text-muted">
              <i className={cn("h-1.5 w-1.5 rounded-full", dirty ? "bg-warn-mid" : "bg-ok-mid")} aria-hidden />
              {dirty ? "Unsaved changes" : "Saved"}
            </span>
          </div>
          <div className="bg-raised px-3 py-5 md:px-6">
            <article
              key={docKey}
              ref={page}
              contentEditable={editable}
              suppressContentEditableWarning
              onInput={() => setDirty(true)}
              className="mx-auto grid max-w-[640px] gap-3 rounded-md border border-line bg-surface px-5 py-6 text-13.5 leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-accent-line md:px-8"
              aria-label="Board resolution text"
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
        <SectionCard title="Word document" meta={stage >= 2 ? "Final" : "Ready"} flush right={<HeadLink href={stepHrefFor(portal, CLIENT, 2)}>Open step ›</HeadLink>}>
          <ListRow>
            <FileBadge type="DOCX" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-12.5 font-semibold">board-resolution-ember-v{versions.length}.docx</span>
              <span className="block truncate text-12.5 text-muted">52 KB · {fmt(versions[versions.length - 1].date)}</span>
            </span>
            <Button size="iconSm" variant="ghost" aria-label="Download Word document" onClick={() => toast.show("Downloads the Word document")}>
              <Download size={16} strokeWidth={1.5} />
            </Button>
          </ListRow>
          <div className="grid grid-cols-2 gap-2 border-t border-line-soft px-4 py-3 md:px-5">
            <Button
              size="sm"
              variant="outline"
              disabled={!dirty}
              onClick={() => {
                setDirty(false);
                addVersion("Draft · edited");
              }}
            >
              Save changes
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!editable}
              onClick={() => {
                setDocKey((k) => k + 1);
                setDirty(false);
                addVersion("Latest template applied");
              }}
            >
              Apply latest template
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!editable}
              onClick={() => {
                setDocKey((k) => k + 1);
                setDirty(false);
                addVersion("Generated again from Step 1");
              }}
            >
              Generate again from Step 1
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.show("Downloads the Word document")}>
              Download Word
            </Button>
          </div>
          <div className="border-t border-line-soft px-4 py-3 md:px-5">
            <KeyValue
              cols={2}
              rows={[
                { k: "Client", v: c.short },
                { k: "Signs", v: "Sofia Moreau" },
                { k: "Project lead", v: c.lead },
                { k: "Approver", v: c.manager },
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard title="Progress flow" meta={`${stage + 1} of ${STAGES.length}`} flush>
          <ol className="px-4 py-3 md:px-5">
            {STAGES.map((t, i) => (
              <li key={t} className={cn("flex items-center gap-3 py-1.5 text-13.5", i > stage && "opacity-50")}>
                <span
                  className={cn(
                    "grid h-5 w-5 flex-none place-items-center rounded-full text-11 font-bold",
                    i < stage ? "bg-ok-soft text-ok" : i === stage ? "bg-accent-soft text-accent shadow-[inset_0_0_0_2px_var(--accent)]" : "text-faint shadow-[inset_0_0_0_1.5px_var(--line)]",
                  )}
                >
                  {i < stage ? <Check size={12} strokeWidth={2.4} /> : i + 1}
                </span>
                <span className={cn(i === stage ? "font-semibold" : "text-ink-2")}>{t}</span>
              </li>
            ))}
          </ol>
          {stage <= 1 && !confirm && (
            <div className="border-t border-line-soft px-4 py-3 md:px-5">
              <Button variant="primary" className="w-full" onClick={() => setConfirm(true)}>
                Finalise for client
              </Button>
            </div>
          )}
          {confirm && (
            <InlineConfirm
              question="Finalise the Board resolution? The client can see and download it."
              confirm="Finalise"
              onCancel={() => setConfirm(false)}
              onConfirm={() => {
                setConfirm(false);
                setDirty(false);
                setStage(2);
                addVersion("Finalised · client can see it", "Final");
              }}
            />
          )}
          {stage === 2 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 text-13 md:px-5">
              <span className="min-w-0 flex-1">
                <b className="font-semibold">Next:</b> send the Board resolution to {CONTACTS[CLIENT]?.name}.
              </span>
              <Button
                size="sm"
                variant="primary"
                asChild
                onClick={() => {
                  setStage(3);
                  addVersion("Sent to client", "Sent");
                }}
              >
                <a href={`mailto:${CONTACTS[CLIENT]?.email}?subject=${encodeURIComponent("Board resolution for signature")}`}>
                  <Send size={14} strokeWidth={1.5} /> Send to client
                </a>
              </Button>
            </div>
          )}
          {stage === 3 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 text-13 md:px-5">
              <span className="min-w-0 flex-1">Waiting for the signed copy.</span>
              <Button size="sm" variant="primary" onClick={() => fileRef.current?.click()}>
                <Upload size={14} strokeWidth={1.5} /> Upload signed copy
              </Button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (!e.target.files?.[0]) return;
                  setStage(4);
                  addVersion(`Signed copy · ${e.target.files[0].name}`, "Signed");
                }}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Versions" meta={String(versions.length)} flush>
          {[...versions].reverse().map((x) => (
            <ListRow key={x.v}>
              <span className="w-8 flex-none font-mono text-12 text-muted">v{x.v}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{x.label}</span>
                <span className="block truncate text-12.5 text-muted">
                  {x.by} · {fmt(x.date)}
                </span>
              </span>
              <Chip>{x.state}</Chip>
            </ListRow>
          ))}
        </SectionCard>
      </Col>
      {toast.node}
    </Cols>
  );
}

