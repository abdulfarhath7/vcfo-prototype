"use client";
import * as React from "react";
import Link from "next/link";
import { Download, Eye, Maximize2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, d, fmt } from "@/lib/dates";
import { STEPS, stepHref } from "@/data/incorporation";
import { NORTHWIND } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StepMark } from "@/components/ui/StepMark";
import { FileBadge } from "@/components/ui/FileBadge";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { PageHead, Dot } from "./navy-head";
import { DropZone, type Notify } from "./inc-parts";

const draft = STEPS[1];
const signedStep = STEPS[2];

/** Round company stamp on the signed copy (old board.html .stamp). */
function CompanyStamp() {
  return (
    <span className="grid h-[74px] w-[74px] -rotate-12 place-items-center rounded-full border-2 border-accent text-center font-serif text-[10px] font-bold uppercase leading-tight text-accent" role="img" aria-label="Company stamp · Northwind Inc.">
      <span className="grid h-[62px] w-[62px] place-items-center rounded-full border border-accent px-1">
        Northwind
        <br />
        Inc.
      </span>
    </span>
  );
}

/** Stages of the resolution as an ST5 track (R-22): done stages are green squares with a tick, joined by a green line. */
function BoardTrack({ stages }: { stages: Array<{ label: string; sub?: string; done: boolean }> }) {
  return (
    <section className="rounded-md border-1.5 border-line bg-surface px-4 py-4 md:px-5" aria-label="Progress">
      <ol className="flex flex-col gap-3 md:flex-row md:items-start md:gap-0">
        {stages.map((st, i) => (
          <li key={st.label} className="relative flex min-w-0 flex-1 items-center gap-2.5 md:flex-col md:items-start md:gap-2">
            {i < stages.length - 1 && <span className={cn("absolute left-[30px] right-3 top-[10px] hidden h-[1.5px] md:block", st.done && stages[i + 1].done ? "bg-ok-mid" : "bg-line")} aria-hidden />}
            <StepMark state={st.done ? "done" : "next"} label={st.done ? "Done" : "Not started"} className="relative z-[1]" />
            <span className="min-w-0">
              <b className="block truncate text-14 font-medium">{st.label}</b>
              {st.sub && <span className="block truncate text-12.5 text-muted">{st.sub}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The resolution text. Scaled by the preview zoom. */
function Resolution({ signer, signedOn }: { signer?: string; signedOn?: Date }) {
  return (
    <article className="mx-auto max-w-[720px] bg-surface px-5 py-6 text-13.5 leading-relaxed text-ink-2 md:px-8 md:py-8">
      <h2 className="text-center text-13 font-medium uppercase tracking-wide text-ink">
        Certified true copy of the resolution passed by the Board of Directors of Northwind Inc. on 24 September 2026
      </h2>
      <p className="mt-5">The Board considered the proposal to set up a wholly owned subsidiary in India for software development and IT services.</p>
      <h3 className="mt-5 text-12.5 font-medium uppercase tracking-wide text-ink">Resolved that</h3>
      <p className="mt-1.5">
        the Company incorporate a private limited company in India under the Companies Act, 2013, with the proposed name <b className="font-medium text-ink">{NORTHWIND.name}</b>, and an authorised capital of ₹10,00,000 divided into 1,00,000 equity
        shares of ₹10 each.
      </p>
      <p className="mt-3">The Company subscribe to 9,999 equity shares of the proposed company. Mr J. Carter hold 1 equity share as nominee of the Company.</p>
      <h3 className="mt-5 text-12.5 font-medium uppercase tracking-wide text-ink">Resolved further that</h3>
      <p className="mt-1.5">Mr Rohan Kumar, Director, be authorised to sign the application for reservation of name, the SPICe+ forms, the memorandum and articles of association, and every other document for the incorporation.</p>
      <p className="mt-3">SBC LLP, Chartered Accountants, be appointed to file the forms with the Registrar of Companies and to act for the Company before the Ministry of Corporate Affairs.</p>
      <p className="mt-3">Any Director of the Company be authorised to certify a copy of this resolution as true.</p>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-line-soft pt-4">
        <div className="min-w-[180px]">
          <div className="text-12 text-muted">For Northwind Inc.</div>
          {signer ? (
            <div className="mt-3 w-[200px] border-b border-ink-2 pb-0.5 font-serif text-[24px] italic leading-tight text-accent" aria-label={`Signature of ${signer}`}>
              {signer}
            </div>
          ) : (
            <div className="mt-8 w-[200px] border-b border-line" aria-label="Not signed yet" />
          )}
          <div className={cn("mt-1.5 text-13 font-medium", signer ? "text-ink" : "text-faint")}>{signer ?? "-"}</div>
          <div className="text-12 text-muted">Director, Northwind Inc.</div>
        </div>
        <div className="flex items-end gap-5">
          {signer && <CompanyStamp />}
          <div className="text-right text-12 text-muted">
            <div>Place: Bengaluru</div>
            <div>Date: {signedOn ? fmt(signedOn) : "-"}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------- Files: the draft and the signed copy, then the replace zone (old board.html .files) ---------- */

interface BoardFile {
  id: string;
  name: string;
  file: string;
  type: "DOCX" | "PDF";
  meta: string;
  status: string;
  viewId?: string;
}

function FilesCard({ files, notify, onReplace }: { files: BoardFile[]; notify: Notify; onReplace: (file: string) => void }) {
  return (
    <SectionCard title="Files" meta={`${files.length} files`} flush>
      {files.map((f) => (
        <ListRow key={f.id}>
          <FileBadge type={f.type} />
          <span className="min-w-0 flex-1" title={f.file}>
            <b className="block truncate font-medium">{f.name}</b>
            <span className="block truncate text-12.5 text-muted">
              <span className="text-ok">{f.status}</span> · {f.meta}
            </span>
          </span>
          {f.viewId ? (
            <Button asChild size="iconSm" variant="ghost" aria-label={`Preview ${f.file}`}>
              <Link href={`/client/documents/view/${f.viewId}`}>
                <Eye size={16} strokeWidth={1.6} />
              </Link>
            </Button>
          ) : (
            <span className="w-[30px] flex-none" />
          )}
          <Button size="iconSm" variant="ghost" aria-label={`Download ${f.file}`} onClick={() => notify(`Download started · ${f.file}`)}>
            <Download size={16} strokeWidth={1.6} />
          </Button>
        </ListRow>
      ))}
      <div className="border-t border-line-soft px-4 py-3 md:px-5">
        <DropZone label="Replace signed copy" hint="PDF · DOCX" tone="accent" accept=".pdf,.docx" onFile={onReplace} />
      </div>
    </SectionCard>
  );
}

// Old renderBoard values: drafted 26 Sep, released 28 Sep, signed by J. Carter and received 30 Sep.
const DRAFTED = d(2026, 9, 26);
const RELEASED = d(2026, 9, 28);
const SIGNED = d(2026, 9, 30);
const SIGNER = "J. Carter";
const FILES_START: BoardFile[] = [
  { id: "draft", name: "Draft · Word", file: "board-resolution.docx", type: "DOCX", meta: `SBC · ${fmt(DRAFTED)}`, status: "Released", viewId: "f6" },
  { id: "signed", name: "Signed copy", file: "br-signed-northwind.pdf", type: "PDF", meta: `Northwind · ${fmt(SIGNED)}`, status: "Received", viewId: "f7" },
];

export function BoardResolutionScreen() {
  const toast = useUndoToast();
  const [files, setFiles] = React.useState<BoardFile[]>(FILES_START);
  const [zoom, setZoom] = React.useState(1);
  const signedOn = SIGNED;
  const signer = SIGNER;

  const replace = (file: string) => {
    const before = files;
    setFiles(files.map((f) => (f.id === "signed" ? { ...f, file, type: /\.docx$/i.test(file) ? "DOCX" : "PDF", meta: `Northwind · ${fmt(TODAY)}`, status: "Received", viewId: undefined } : f)));
    toast.show(`${file} uploaded · Bharath checks it`, () => setFiles(before));
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHead
        label="Board resolution"
        title="Board resolution"
        chips={<Chip tone="ok">Done</Chip>}
        meta={
          <>
            <span>Phase 1 · Name Application · steps 2-3</span>
            <Dot />
            <span>Signed copy received · {fmt(signedOn)}</span>
            <Dot />
            <span>Certified true copy</span>
          </>
        }
        links={[
          { href: stepHref("client", 2), label: `2 · ${draft.title}`, dir: "next" },
          { href: stepHref("client", 3), label: `3 · ${signedStep.title}`, dir: "next" },
        ]}
      />
      <BoardTrack
        stages={[
          { label: "Drafted", sub: `SBC · ${fmt(DRAFTED)}`, done: true },
          { label: "Released", sub: fmt(RELEASED), done: true },
          { label: "Signed", sub: `Northwind · ${fmt(signedOn)}`, done: true },
          { label: "Received by SBC", sub: `Bharath · ${fmt(signedOn)}`, done: true },
        ]}
      />
      <Cols>
        <Col>
          <SectionCard
            title="Preview"
            meta={`page 1 of 2 · ${Math.round(zoom * 100)}%`}
            flush
            right={
              <>
                <Button size="iconSm" variant="ghost" aria-label="Zoom out" disabled={zoom <= 0.6} onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}>
                  <Minus size={16} strokeWidth={1.6} />
                </Button>
                <Button size="iconSm" variant="ghost" aria-label="Zoom in" disabled={zoom >= 1.6} onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}>
                  <Plus size={16} strokeWidth={1.6} />
                </Button>
                <Button asChild size="iconSm" variant="ghost" aria-label="Open full screen">
                  <Link href="/client/documents/view/f7">
                    <Maximize2 size={16} strokeWidth={1.6} />
                  </Link>
                </Button>
              </>
            }
          >
            <div className="max-h-[760px] overflow-auto bg-raised p-3 md:p-5">
              <div className="origin-top border border-line" style={{ zoom }}>
                <Resolution signer={signer} signedOn={signedOn} />
              </div>
            </div>
          </SectionCard>
        </Col>
        <Col>
          <FilesCard files={files} notify={toast.show} onReplace={replace} />
        </Col>
      </Cols>
      {toast.node}
    </div>
  );
}
