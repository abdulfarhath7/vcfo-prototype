"use client";
import * as React from "react";
import Link from "next/link";
import { Check, Download, Eye, List, Maximize2, Minus, PenLine, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { STEPS, stepHref } from "@/data/incorporation";
import { BOARD_VERSIONS, type BoardVersion } from "@/data/incorporation-detail";
import { NORTHWIND } from "@/data/people";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { FileBadge } from "@/components/ui/FileBadge";
import { Checkbox, Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { Thread } from "@/components/cards/Thread";
import { StageTrack } from "@/components/cards/StageTrack";
import { RecordHead } from "./parts";
import { DropZone, type Notify } from "./inc-parts";

const draft = STEPS[1];
const signedStep = STEPS[2];

/** The resolution text. Scaled by the preview zoom. */
function Resolution({ signer, signedOn }: { signer?: string; signedOn?: Date }) {
  return (
    <article className="mx-auto max-w-[720px] bg-surface px-5 py-6 text-13.5 leading-relaxed text-ink-2 md:px-8 md:py-8">
      <h2 className="text-center text-13 font-semibold uppercase tracking-wide text-ink">
        Certified true copy of the resolution passed by the Board of Directors of Northwind Inc. at its meeting held on 11 September 2026
      </h2>
      <p className="mt-5">The Board considered the proposal to set up a wholly owned subsidiary in India for software development and IT services.</p>
      <h3 className="mt-5 text-12.5 font-semibold uppercase tracking-wide text-ink">Resolved that</h3>
      <p className="mt-1.5">
        the Company incorporate a private limited company in India under the Companies Act, 2013, with the proposed name <b className="font-semibold text-ink">{NORTHWIND.name}</b>, and an authorised capital of ₹10,00,000 divided into 1,00,000 equity
        shares of ₹10 each.
      </p>
      <p className="mt-3">The Company subscribe to 9,999 equity shares of the proposed company. Mr J. Carter hold 1 equity share as nominee of the Company.</p>
      <h3 className="mt-5 text-12.5 font-semibold uppercase tracking-wide text-ink">Resolved further that</h3>
      <p className="mt-1.5">Mr Rohan Kumar, Director, be authorised to sign the application for reservation of name, the SPICe+ forms, the memorandum and articles of association, and every other document for the incorporation.</p>
      <p className="mt-3">SBC LLP, Chartered Accountants, be appointed to file the forms with the Registrar of Companies and to act for the Company before the Ministry of Corporate Affairs.</p>
      <p className="mt-3">Any Director of the Company be authorised to certify a copy of this resolution as true.</p>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-line-soft pt-4">
        <div>
          <div className="text-12 text-muted">For Northwind Inc.</div>
          <div className={cn("mt-6 text-13.5 font-semibold", signer ? "text-ink" : "text-faint")}>{signer ?? "-"}</div>
          <div className="text-12 text-muted">Director</div>
        </div>
        <div className="text-right text-12 text-muted">
          <div>Place: Bengaluru</div>
          <div>Date: {signedOn ? fmt(signedOn) : "-"}</div>
        </div>
      </div>
    </article>
  );
}

/* ---------- e-sign: review, Aadhaar OTP, done ---------- */

function ESignModal({ open, onOpenChange, onSigned }: { open: boolean; onOpenChange: (v: boolean) => void; onSigned: (signer: string) => void }) {
  const [step, setStep] = React.useState(0);
  const [read, setRead] = React.useState(false);
  const [signer, setSigner] = React.useState("Rohan Kumar");
  const [otp, setOtp] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setStep(0);
      setRead(false);
      setOtp("");
    }
  }, [open]);
  const labels = ["Review", "Verify", "Done"];
  const footer =
    step === 0 ? (
      <>
        <Button onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" disabled={!read} onClick={() => setStep(1)}>
          Send OTP
        </Button>
      </>
    ) : step === 1 ? (
      <>
        <Button onClick={() => setStep(0)}>Back</Button>
        <Button
          variant="primary"
          disabled={otp.length !== 6}
          onClick={() => {
            setStep(2);
            onSigned(signer);
          }}
        >
          <PenLine size={16} strokeWidth={1.5} /> Sign
        </Button>
      </>
    ) : (
      <Button variant="primary" onClick={() => onOpenChange(false)}>
        Close
      </Button>
    );
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="e-Sign the Board resolution"
      eyebrow="Aadhaar e-sign · board-resolution-v2.docx"
      sub={
        <ol className="flex items-center gap-2">
          {labels.map((l, i) => (
            <li key={l} className={cn("inline-flex items-center gap-1.5 text-12.5", i === step ? "font-semibold text-ink" : i < step ? "text-ok" : "text-faint")}>
              <span className={cn("grid h-5 w-5 place-items-center rounded-full text-11 font-semibold", i < step ? "bg-ok-soft text-ok" : i === step ? "bg-navy text-white" : "bg-raised text-faint")}>{i < step ? <Check size={12} strokeWidth={2.4} /> : i + 1}</span>
              {l}
            </li>
          ))}
        </ol>
      }
      footer={footer}
    >
      {step === 0 && (
        <div className="grid gap-4">
          <Field label="Signing director">
            <Select size="md" value={signer} onChange={(e) => setSigner(e.target.value)} options={[{ value: "Rohan Kumar", label: "Rohan Kumar · Director" }, { value: "J. Carter", label: "J. Carter · Director" }]} />
          </Field>
          <label className="flex cursor-pointer items-start gap-3 text-13.5">
            <Checkbox checked={read} onChange={setRead} label="I have read the resolution" />
            <span>I have read the resolution and I sign it for Northwind Inc.</span>
          </label>
        </div>
      )}
      {step === 1 && (
        <div className="grid gap-4">
          <p className="text-13.5">
            OTP sent to the mobile number linked with the Aadhaar of <b className="font-semibold">{signer}</b>: <span className="font-mono">+91 ••••• ••412</span>
          </p>
          <Field label="6-digit OTP">
            <Input inputMode="numeric" autoFocus maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="max-w-[180px] font-mono tracking-[.3em]" aria-label="OTP" />
          </Field>
        </div>
      )}
      {step === 2 && (
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-ok-soft text-ok">
            <Check size={16} strokeWidth={2} />
          </span>
          <div className="text-13.5">
            <b className="block font-semibold">Signed by {signer}</b>
            <span className="text-muted">
              {fmt(TODAY)} · <span className="font-mono">board-resolution-esigned.pdf</span> sent to Bharath
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------- Versions and the replace drop zone ---------- */

function VersionsCard({ versions, notify, onReplace, onESign }: { versions: BoardVersion[]; notify: Notify; onReplace: (file: string) => void; onESign: () => void }) {
  return (
    <SectionCard title="Files" meta={`${versions.length} versions`} flush right={<Button variant="primary" size="sm" onClick={onESign}><PenLine size={15} strokeWidth={1.5} /> e-Sign</Button>}>
      {[...versions].reverse().map((v) => (
        <ListRow key={v.id}>
          <FileBadge type={v.type} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <b className="truncate font-semibold">{v.name}</b>
              <span className="flex-none font-mono text-11.5 text-faint">{v.v}</span>
            </span>
            <span className="block truncate text-12.5 text-muted">
              <span className="font-mono">{v.file}</span> · <span className={cn(v.from === "client" ? "text-warn" : "text-accent")}>{v.by}</span> · {fmt(v.date)}
            </span>
          </span>
          <Chip tone={v.status === "Replaced" ? "idle" : "ok"} className="hidden sm:inline-flex">
            {v.status}
          </Chip>
          {v.viewId ? (
            <Button asChild size="iconSm" variant="ghost" aria-label={`Preview ${v.file}`}>
              <Link href={`/client/documents/view/${v.viewId}`}>
                <Eye size={16} strokeWidth={1.5} />
              </Link>
            </Button>
          ) : (
            <span className="w-[30px] flex-none" />
          )}
          <Button size="iconSm" variant="ghost" aria-label={`Download ${v.file}`} onClick={() => notify(`Download started · ${v.file}`)}>
            <Download size={16} strokeWidth={1.5} />
          </Button>
        </ListRow>
      ))}
      <div className="border-t border-line-soft px-4 py-3 md:px-5">
        <DropZone label="Replace signed copy" hint="PDF or DOCX" accept=".pdf,.docx" onFile={onReplace} />
      </div>
    </SectionCard>
  );
}

export function BoardResolutionScreen() {
  const toast = useUndoToast();
  const [versions, setVersions] = React.useState<BoardVersion[]>(BOARD_VERSIONS);
  const [zoom, setZoom] = React.useState(1);
  const [esign, setEsign] = React.useState(false);
  const latest = versions[versions.length - 1];
  const signedV = [...versions].reverse().find((v) => v.from === "client");
  const signedOn = signedV?.date ?? (signedStep.status === "Completed" ? signedStep.done : undefined);
  const signer = signedV ? (signedV.by === "Rohan Kumar" || signedV.by === "J. Carter" ? signedV.by : "Rohan Kumar") : undefined;

  const addVersion = (v: Omit<BoardVersion, "id" | "v">, text: string) => {
    const before = versions;
    const next = [...versions.map((x) => (x.from === "client" && x.status !== "Replaced" ? { ...x, status: "Replaced" } : x)), { ...v, id: `bv${versions.length + 1}`, v: `v${versions.length + 1}` }];
    setVersions(next);
    toast.show(text, () => setVersions(before));
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <RecordHead
        eyebrow="Phase 1 · Name Application · steps 2 and 3"
        title="Board resolution"
        chips={
          <>
            <Chip tone={signedOn ? "ok" : "warn"}>{signedOn ? `Signed copy received · ${fmt(signedOn)}` : "Waiting for signature"}</Chip>
            <Tag>Certified true copy</Tag>
            <span className="text-12.5 text-muted">Latest {latest.v} · {latest.name}</span>
          </>
        }
        action={
          <>
            <Button asChild size="sm">
              <Link href={stepHref("client", 2)}>2 · {draft.title}</Link>
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href={stepHref("client", 3)}>3 · {signedStep.title}</Link>
            </Button>
          </>
        }
      />
      <StageTrack
        stages={[
          { label: "Drafted", sub: `SBC · ${fmt(BOARD_VERSIONS[0].date)}`, state: "done" },
          { label: "Released", sub: draft.done ? fmt(draft.done) : undefined, state: "done" },
          { label: "Signed", sub: signedOn ? `Northwind · ${fmt(signedOn)}` : "Northwind", state: signedOn ? "done" : "now" },
          { label: "Received by SBC", sub: signedOn ? `Bharath · ${fmt(signedOn)}` : undefined, state: signedOn ? "done" : "todo" },
        ]}
        now={signedOn ? undefined : { kicker: "Now · 3 of 4", title: "Sign", sub: "Northwind", tag: "Waiting on Northwind" }}
      />
      <Cols>
        <Col>
          <SectionCard
            title="Preview"
            icon={{ Icon: Eye, tone: "amber" }}
            meta={`page 1 of 2 · ${Math.round(zoom * 100)}%`}
            flush
            right={
              <>
                <Button size="iconSm" variant="ghost" aria-label="Zoom out" disabled={zoom <= 0.6} onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}>
                  <Minus size={16} strokeWidth={1.5} />
                </Button>
                <Button size="iconSm" variant="ghost" aria-label="Zoom in" disabled={zoom >= 1.6} onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}>
                  <Plus size={16} strokeWidth={1.5} />
                </Button>
                <Button asChild size="iconSm" variant="ghost" aria-label="Open full screen">
                  <Link href={`/client/documents/view/${signedV?.viewId ?? "f7"}`}>
                    <Maximize2 size={16} strokeWidth={1.5} />
                  </Link>
                </Button>
              </>
            }
          >
            <div className="max-h-[720px] overflow-auto bg-raised p-3 md:p-5">
              <div className="origin-top border border-line" style={{ zoom }}>
                <Resolution signer={signer} signedOn={signedOn} />
              </div>
            </div>
            <footer className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
              {signedOn ? (
                <span className="inline-flex items-center gap-1.5 text-13 font-semibold text-ok">
                  <Check size={16} strokeWidth={2} /> Signed by {signer} · {fmt(signedOn)}
                </span>
              ) : (
                <Button variant="primary" onClick={() => setEsign(true)}>
                  <PenLine size={16} strokeWidth={1.5} /> e-Sign
                </Button>
              )}
              <Button className="ml-auto" onClick={() => toast.show(`Download started · ${latest.file}`)}>
                <Download size={16} strokeWidth={1.5} /> Download
              </Button>
            </footer>
          </SectionCard>
        </Col>
        <Col>
          <VersionsCard
            versions={versions}
            notify={toast.show}
            onESign={() => setEsign(true)}
            onReplace={(file) => addVersion({ name: "Signed copy · replaced", file, type: /\.docx$/i.test(file) ? "DOCX" : "PDF", by: "Rohan Kumar", from: "client", date: TODAY, status: "Received" }, `${file} uploaded · Bharath checks it`)}
          />
          <SectionCard title="What happens with it">
            <p className="text-13.5 text-ink-2">The parent board authorises the India subsidiary. SBC drafted it, a director signed it, and it went with the name application in step 4.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={stepHref("client", 3)}>Open step 3</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={stepHref("client", 4)}>Open step 4</Link>
              </Button>
            </div>
          </SectionCard>
          <SectionCard title="Thread" icon={{ Icon: List, tone: "blue" }}>
            <Thread
              steps={[
                { id: "b1", title: "Drafted", state: "done", date: BOARD_VERSIONS[0].date, by: "Bharath", owner: "sbc" },
                { id: "b2", title: "Released to Northwind", state: "done", date: draft.done, by: "Bharath" },
                signedOn ? { id: "b3", title: "Signed", state: "done", date: signedOn, by: signer, owner: "client" } : { id: "b3", title: "Signed", state: "current", owner: "client", by: "Waiting on Northwind" },
                signedOn ? { id: "b4", title: "Received by SBC", state: "done", date: signedOn, by: "Bharath" } : { id: "b4", title: "Received by SBC", state: "upcoming" },
                { id: "b5", title: "Name application filed", state: STEPS[3].status === "Completed" ? "done" : "upcoming", date: STEPS[3].done, by: "Bharath" },
              ]}
            />
          </SectionCard>
        </Col>
      </Cols>
      <ESignModal
        open={esign}
        onOpenChange={setEsign}
        onSigned={(who) => addVersion({ name: "Signed copy · e-sign", file: "board-resolution-esigned.pdf", type: "PDF", by: who, from: "client", date: TODAY, status: "Received" }, `Signed by ${who} · sent to Bharath`)}
      />
      {toast.node}
    </div>
  );
}
