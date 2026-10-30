"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, FileCog, ListChecks, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { stepHref } from "@/data/incorporation";
import {
  BR_RECORD,
  KEY_FACTS,
  NOC_SAMPLES,
  NOC_VARIANT,
  NOC_VARIANTS,
  STAGE_WORD,
  VERSION_CHANGES,
  isDone,
  receiveChecks,
  resolveNocVariant,
  todoAt,
  todoItems,
  trackEvents,
  trackLabel,
  type BrStage,
  type NocVariant,
} from "@/data/board-resolution";
import { setNocSample, useNocSample } from "@/components/shell/NocSample";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, Empty } from "@/components/cards/SectionCard";
import { DocAudit, DocFiles, DocPreview, DocTrack, ReceiveChecklist, SignedCopy, type AuditLine, type DocFile, type DocStep } from "@/components/cards/DocumentFlow";
import { NocTree } from "@/components/cards/NocTree";
import { WORD_TONE } from "@/screens/shared/detail-parts";
import { PageHead, Dot } from "@/screens/client/navy-head";

// Board resolution (NOC): docs/BOARD-RESOLUTION-NOC.md C1 to C8 (everyone) and T1 to T6 (staff), R-52.
// The prototype bar picks the sample case (one per tree path) and the stage.

export type BrRole = "client" | "lead" | "manager" | "admin" | "super";

const short = (d: Date) => fmt(d);

/** C5: a value filled from an answer. Tinted; a click opens the field or names it. */
function Fv({ q, children, onOpen }: { q: string; children: React.ReactNode; onOpen: (q: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(q)}
      title={q}
      className="rounded-[3px] bg-accent-soft px-[3px] font-medium text-accent hover:ring-1 hover:ring-accent focus-visible:ring-1 focus-visible:ring-accent"
    >
      {children}
    </button>
  );
}

function Sec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-0.5 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-3">
      <span className="pt-0.5 text-11 font-medium uppercase tracking-[.06em] text-muted sm:border-t-1.5 sm:border-line">{label}</span>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

export function BoardResolutionPage({ role }: { role: BrRole }) {
  const router = useRouter();
  const toast = useUndoToast();
  const staff = role !== "client";
  const canChange = role === "manager" || role === "admin" || role === "super";
  const sample = useNocSample();
  const s = NOC_SAMPLES[sample.noc];
  const p = s.parent;
  const answerVariant = resolveNocVariant(s.answers);
  const foreign = s.answers.companyType === "foreign";
  const stage: BrStage = sample.stage ?? (staff ? "received" : "accepted");
  const setStage = (v: BrStage) => setNocSample({ stage: v });

  // Staff choices for this client (D1, D3, T2, T3, T4).
  const [notary, setNotary] = React.useState(true);
  const [certifier, setCertifier] = React.useState(p.directors[0]);
  const [override, setOverride] = React.useState<NocVariant | null>(null);
  const [version, setVersion] = React.useState(2);
  const [stale, setStale] = React.useState(true);
  const [changing, setChanging] = React.useState(false);
  const [comparing, setComparing] = React.useState(false);
  const [pick, setPick] = React.useState<NocVariant>("foreign-parent");
  const [reason, setReason] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const [extra, setExtra] = React.useState<AuditLine[]>([]);
  React.useEffect(() => {
    setOverride(null);
    setCertifier(NOC_SAMPLES[sample.noc].parent.directors[0]);
  }, [sample.noc]);

  const variant = override ?? answerVariant;
  const none = variant === null;
  const useNotary = foreign && notary;
  const word = none ? "Not started" : STAGE_WORD[stage];
  const R = BR_RECORD;
  const signer = foreign ? R.signed.who : p.directors[0];

  /* C2: the track from the one record. */
  const events = trackEvents(foreign, notary);
  const firstOpen = events.findIndex((e) => !isDone(stage, e));
  const steps: DocStep[] = events.map((e, i) => {
    const rec = e === "signed" ? { who: signer, when: R.signed.when } : R[e];
    return none
      ? { label: trackLabel(e), state: "next" }
      : { label: trackLabel(e), state: i < firstOpen || firstOpen < 0 ? "done" : i === firstOpen ? "now" : "next", who: rec.who, when: rec.when };
  });

  /* C4 */
  const todo = todoItems(foreign, notary);
  const at = todoAt(stage, todo.length);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const upload = (name: string) => {
    const before = stage;
    setStage("received");
    toast.show("Signed copy uploaded", { kind: "uploaded", sub: staff ? `${name} · ready to check` : `${name} · Bharath checks it`, onUndo: () => setStage(before) });
  };

  /* C7: the Word draft, then the signed copy. The internal file name is for staff only (P5). */
  const docBase = staff ? `/${role}/documents/view` : "/client/documents/view";
  const draft: DocFile | null = none
    ? null
    : {
        id: "draft",
        name: "Board resolution (NOC) · Word",
        file: staff ? NOC_VARIANT[variant].file : undefined,
        type: "DOCX",
        meta: `Released · ${R.released.who} · ${short(R.released.when)} · Version ${version}`,
        viewHref: `${docBase}/f6`,
      };
  const signed: DocFile | null =
    none || (stage !== "received" && stage !== "accepted")
      ? null
      : {
          id: "signed",
          name: "Signed copy",
          type: "PDF",
          meta: stage === "accepted" ? `Accepted · ${R.accepted.who} · ${short(R.accepted.when)}` : `Uploaded · ${R.uploaded.who} · ${short(R.uploaded.when)}`,
          viewHref: `${docBase}/f7`,
        };
  const files = [draft, signed].filter((f): f is DocFile => !!f);

  const openValue = (q: string) => {
    const editable = stage === "released" && q.startsWith("Pre-1");
    if (editable && !staff) return router.push(stepHref("client", 1));
    toast.show(staff ? `${q} · Change it in the project` : `${q} · Message SBC to change it`);
  };

  /* T2 to T6 audit lines. */
  const audit: AuditLine[] = [
    ...extra,
    ...(stage === "accepted" ? [{ who: R.accepted.who, what: "accepted the signed copy. VCFO saved it to the Vault.", when: short(R.accepted.when) }] : []),
    ...(stage === "received" || stage === "accepted" ? [{ who: R.uploaded.who, what: "uploaded the signed copy", when: short(R.uploaded.when) }] : []),
    { who: R.released.who, what: `released version ${version}`, when: short(R.released.when) },
    { who: R.drafted.who, what: `made the draft from ${answerVariant ? NOC_VARIANT[answerVariant].file : "the template"}`, when: short(R.drafted.when) },
  ];
  const addAudit = (what: string) =>
    setExtra((x) => [{ who: role === "super" ? "Krishna" : role === "admin" ? "Krishna" : role === "manager" ? "Pranay" : "Bharath", what, when: "Now" }, ...x]);

  const changeTemplate = () => {
    setTried(true);
    if (!reason.trim()) return;
    setOverride(pick);
    addAudit(`changed the template to ${NOC_VARIANT[pick].label}. Reason: ${reason.trim()}`);
    setChanging(false);
    setReason("");
    setTried(false);
    toast.show("Template changed", { kind: "saved", sub: NOC_VARIANT[pick].label });
  };

  const missing = <span className="text-faint">Not given yet</span>;
  const facts: Array<[string, React.ReactNode]> = [
    ["New company", KEY_FACTS.company],
    ["Capital", KEY_FACTS.capital],
    ["Shares", sample.noc === "name" ? missing : `${p.name} ${KEY_FACTS.parentShares} · ${KEY_FACTS.nominee} 1 (nominee)`],
    ["Signs the forms", `${KEY_FACTS.signatory}, Director`],
    ["Files the forms", KEY_FACTS.filer],
    ["Certifies", `${certifier}, Director of ${p.name}`],
    ["Template", variant ? NOC_VARIANT[variant].label : missing],
  ];

  const paper = none ? (
    <Empty>No draft yet. SBC chooses the parent&apos;s role first.</Empty>
  ) : (
    <article className="mx-auto max-w-[680px] rounded-sm border border-line bg-surface px-4 py-6 text-13.5 leading-relaxed text-ink-2 md:px-8">
      {s.letterhead ? (
        <div className="flex items-center gap-3 border-b-2 border-ink pb-2.5">
          <i className="grid h-9 w-9 flex-none place-items-center rounded-sm bg-ink text-15 font-bold not-italic text-surface" aria-hidden>
            {p.name[0]}
          </i>
          <span className="min-w-0">
            <b className="block text-13 font-medium uppercase tracking-[.03em] text-ink">{p.name}</b>
            <span className="block text-12 text-muted">{p.address}</span>
          </span>
        </div>
      ) : (
        <div className="border-b-2 border-ink pb-2.5 text-center text-13 font-medium uppercase tracking-[.03em] text-ink">{p.name}</div>
      )}
      <span className="mt-2 inline-flex rounded-sm border border-dashed border-line-2 px-1.5 text-11 text-muted">
        {s.letterhead ? "Parent's letterhead, from Pre-1" : "Plain page. Pre-1 has no letterhead."}
      </span>
      <h2 className="mt-3 text-center text-12.5 font-medium uppercase leading-normal tracking-[.04em] text-ink">
        Certified true copy of the resolution passed by the Board of Directors of{" "}
        <Fv q="Pre-1 · Parent company name" onOpen={openValue}>
          {p.name}
        </Fv>
      </h2>
      <div className="mt-2 flex flex-wrap justify-center gap-2 text-11 text-muted">
        <span className="rounded-sm border border-line px-1.5">Meeting · {short(R.meeting)}</span>
        <span className="rounded-sm border border-line px-1.5">Certified · {isDone(stage, "signed") ? short(R.signed.when) : "Not yet"}</span>
      </div>
      <Sec label="Purpose">
        <p>
          The Board considered the proposal to set up {variant === "indian-name-only" ? "a company in India that uses the Company's name," : "a subsidiary in India"} for{" "}
          <Fv q="Pre-1 · Business activity" onOpen={openValue}>
            {KEY_FACTS.activity}
          </Fv>
          .
        </p>
      </Sec>
      <Sec label="Decision">
        <p>
          <b className="font-medium text-ink">RESOLVED THAT</b>{" "}
          {variant === "indian-name-only" ? "the Company gives its consent to the use of its name by" : "the Company incorporate"} a private limited company in India under the
          Companies Act, 2013, with the proposed name{" "}
          <Fv q="Step 1 · Proposed name" onOpen={openValue}>
            {KEY_FACTS.company}
          </Fv>
          , and an authorised capital of{" "}
          <Fv q="Pre-1 · Authorised capital" onOpen={openValue}>
            ₹10,00,000
          </Fv>
          .
        </p>
        {variant !== "indian-name-only" && (
          <p>
            The Company subscribe to{" "}
            <Fv q="Pre-1 · Shares held by the parent" onOpen={openValue}>
              {KEY_FACTS.parentShares}
            </Fv>{" "}
            equity shares of the proposed company.{" "}
            <Fv q="Pre-1 · Nominee shareholder" onOpen={openValue}>
              Mr {KEY_FACTS.nominee}
            </Fv>{" "}
            hold 1 equity share as nominee of the Company.
          </p>
        )}
      </Sec>
      <Sec label="Who signs">
        <p>
          <b className="font-medium text-ink">RESOLVED FURTHER THAT</b>{" "}
          <Fv q="Pre-1 · Authorised signatory" onOpen={openValue}>
            Mr {KEY_FACTS.signatory}
          </Fv>
          , Director, be authorised to sign the application for reservation of name, the SPICe+ forms, the memorandum and articles of association, and every other document for the
          incorporation.
        </p>
      </Sec>
      <Sec label="Filing agent">
        <p>SBC LLP, Chartered Accountants, be appointed to file the forms with the Registrar of Companies and to act for the Company before the Ministry of Corporate Affairs.</p>
      </Sec>
      <Sec label="Certifies">
        <p>
          <Fv q="Project setup · Certifying director" onOpen={openValue}>
            {certifier}
          </Fv>
          , Director of the Company, be authorised to certify a copy of this resolution as true.
        </p>
        <p className="text-muted">
          For {p.name} · Director: ______________ · Place:{" "}
          <Fv q="Pre-1 · Parent's city" onOpen={openValue}>
            {p.city}
          </Fv>
        </p>
      </Sec>
    </article>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* C1 */}
      <PageHead
        label="Board resolution (NOC)"
        title="Board resolution (NOC)"
        chips={
          <Chip tone={WORD_TONE[word]} fixed>
            {word}
          </Chip>
        }
        meta={
          <>
            <span className="basis-full font-medium text-ink-2">{variant ? NOC_VARIANT[variant].label : "No template yet"}</span>
            {staff && (
              <>
                <span>Northwind</span>
                <Dot />
              </>
            )}
            <span>
              Passed by: <b className="font-medium text-ink">Board of {p.name} (the parent)</b>
            </span>
            <Dot />
            <span>Phase 1 · Steps 2–3</span>
          </>
        }
        links={[
          { href: stepHref(role, 1), label: "Previous step", dir: "prev" },
          { href: stepHref(role, 4), label: "Next step", dir: "next" },
        ]}
      />

      <DocTrack steps={steps} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="grid min-w-0 gap-5">
          {/* C3 */}
          <SectionCard title="Key facts" icon={{ Icon: Info, tone: "blue" }} meta="From the engagement" flush>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 px-4 py-3 text-14 md:px-5">
              {facts.map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt className="text-13 text-muted">{k}</dt>
                  <dd className="min-w-0 font-medium">{v}</dd>
                </React.Fragment>
              ))}
            </dl>
          </SectionCard>

          {/* C4 */}
          <SectionCard
            title={staff ? "What the client does" : "What you do"}
            icon={{ Icon: ListChecks, tone: "teal" }}
            right={
              <Chip tone={WORD_TONE[word]} fixed>
                {word}
              </Chip>
            }
            flush
          >
            {none ? (
              <Empty>SBC chooses the parent&apos;s role first.</Empty>
            ) : (
              <ol className="grid gap-0.5 px-2.5 py-2">
                {todo.map((t, i) => (
                  <li
                    key={t}
                    className={cn("grid grid-cols-[24px_minmax(0,1fr)] items-center gap-2.5 rounded-md px-1.5 py-2 text-14", i === at && "bg-accent-soft", i < at && "text-muted")}
                  >
                    <span className={cn("text-right text-12 font-medium", i < at ? "text-ok" : i === at ? "text-accent" : "text-faint")}>
                      {i < at ? <Check size={14} strokeWidth={2} className="ml-auto" aria-label="Done" /> : i + 1}
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            )}
            {!staff && !none && (stage === "released" || stage === "signed") && (
              <div className="flex justify-end border-t border-line-soft px-4 py-3 md:px-5">
                {stage === "released" ? (
                  <Button variant="primary" onClick={() => toast.show("Download started · Board resolution (NOC) · Word")}>
                    Download the Word file
                  </Button>
                ) : (
                  <>
                    <Button variant="primary" onClick={() => fileRef.current?.click()}>
                      Upload signed copy
                    </Button>
                    <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0].name)} />
                  </>
                )}
              </div>
            )}
          </SectionCard>

          {/* C7 */}
          <DocFiles
            files={files}
            drop={none || stage === "accepted" ? undefined : { label: signed ? "Replace signed copy" : "Upload signed copy", onFile: upload }}
            onDownload={(f) => toast.show(`Download started · ${f.name}`)}
          />
        </div>

        <div className="grid min-w-0 gap-5">
          {/* C5, C6 */}
          <DocPreview
            meta={none ? undefined : `Version ${version}`}
            tabs={[
              { key: "draft", label: "Draft", body: paper },
              { key: "signed", label: "Signed copy", body: <SignedCopy file={signed} /> },
            ]}
          />

          {/* T2, T3, T4, D1, D3 */}
          {staff && (
            <SectionCard
              title="Template"
              icon={{ Icon: FileCog, tone: "violet" }}
              right={
                canChange ? (
                  <Button size="sm" onClick={() => setChanging(true)}>
                    Change template
                  </Button>
                ) : undefined
              }
              flush
            >
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-4 py-3 text-14 md:px-5">
                <dt className="text-13 text-muted">Variant</dt>
                <dd className="min-w-0 font-medium">{variant ? NOC_VARIANT[variant].label : <span className="text-faint">Not given yet</span>}</dd>
                <dt className="text-13 text-muted">File</dt>
                <dd className="min-w-0 truncate font-mono text-12.5">{variant ? NOC_VARIANT[variant].file : "-"}</dd>
                <dt className="text-13 text-muted">Certified by</dt>
                <dd className="min-w-0">
                  <Select
                    aria-label="Certifying director"
                    value={certifier}
                    disabled={!canChange}
                    options={p.directors.map((n) => ({ value: n, label: n }))}
                    onChange={(e) => setCertifier(e.target.value)}
                  />
                </dd>
                {foreign && (
                  <>
                    <dt className="text-13 text-muted">Notary and apostille</dt>
                    <dd>
                      <label className="inline-flex items-center gap-2 text-14">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={notary}
                          disabled={!canChange}
                          onChange={(e) => {
                            setNotary(e.target.checked);
                            addAudit(e.target.checked ? "turned on the notary and apostille steps" : "turned off the notary and apostille steps");
                          }}
                        />
                        {notary ? "On for this client" : "Off for this client"}
                      </label>
                    </dd>
                  </>
                )}
              </dl>
              {!none && (
                <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
                  {stale && (stage === "released" || stage === "signed") && (
                    <>
                      <Tag tone="warn">Answers changed after release</Tag>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setVersion((v) => v + 1);
                          setStale(false);
                          addAudit(`made the draft again as version ${version + 1}`);
                          toast.show("Draft made again", { kind: "saved", sub: `Version ${version + 1} · Northwind can see it` });
                        }}
                      >
                        Make the draft again
                      </Button>
                    </>
                  )}
                  <Button size="sm" onClick={() => setComparing(true)}>
                    Compare versions
                  </Button>
                </div>
              )}
            </SectionCard>
          )}

          {/* T5, T6 */}
          {staff && !none && (stage === "received" || stage === "accepted") && (
            <ReceiveChecklist
              key={`${sample.noc}-${useNotary}`}
              checks={receiveChecks(foreign, notary)}
              accepted={stage === "accepted"}
              onAccept={() => {
                setStage("accepted");
                toast.show("Signed copy accepted", { kind: "filed", sub: "Saved to Documents › Vault › Incorporation › Board resolution", onUndo: () => setStage("received") });
              }}
              onSendBack={(why) => {
                setStage("signed");
                addAudit(`sent the signed copy back. Reason: ${why}`);
                toast.show("Sent back · Northwind gets the reason");
              }}
              after={
                stage === "accepted" ? (
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-t border-line-soft px-4 py-3 text-13 md:px-5">
                    <dt className="text-muted">Saved to</dt>
                    <dd className="font-medium">Documents › Vault › Incorporation › Board resolution</dd>
                    <dt className="text-muted">SPICe+</dt>
                    <dd className="font-medium">Added to the attachment list</dd>
                  </dl>
                ) : undefined
              }
            />
          )}
          {staff && <DocAudit rows={audit} />}
        </div>
      </div>

      {/* C8 */}
      <NocTree answers={s.answers} answerText={s.answerText} staff={staff && canChange} onChange={() => setChanging(true)} />

      <Modal
        open={changing}
        onOpenChange={setChanging}
        title="Change template"
        size="sm"
        footer={
          <>
            <Button onClick={() => setChanging(false)}>Cancel</Button>
            <Button variant="primary" onClick={changeTemplate}>
              Change template
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-13">
            <span className="font-medium">Template</span>
            <Select
              aria-label="Template"
              size="md"
              value={pick}
              options={NOC_VARIANTS.map((v) => ({ value: v, label: NOC_VARIANT[v].label }))}
              onChange={(e) => setPick(e.target.value as NocVariant)}
              className="w-full [&>select]:w-full"
            />
          </label>
          <label className="grid gap-1.5 text-13">
            <span className="font-medium">Reason</span>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={tried && !reason.trim()}
              className={cn("w-full rounded-md border-1.5 border-line-2 bg-surface px-3 py-2 text-14 outline-none focus:border-primary", tried && !reason.trim() && "border-bad")}
            />
            {tried && !reason.trim() ? (
              <span className="text-12.5 text-bad">Write the reason.</span>
            ) : (
              <span className="text-12.5 text-muted">VCFO writes it to the audit lines.</span>
            )}
          </label>
        </div>
      </Modal>

      <Modal open={comparing} onOpenChange={setComparing} title="Compare versions" sub={`Version ${version - 1} and version ${version}`} size="md" flush>
        <table className="grid-table w-full">
          <thead>
            <tr>
              <th>Value</th>
              <th>Version {version - 1}</th>
              <th>Version {version}</th>
            </tr>
          </thead>
          <tbody>
            {VERSION_CHANGES.map((c) => (
              <tr key={c.field}>
                <td>
                  <b className="block font-medium">{c.field}</b>
                  <span className="block text-12.5 text-muted">{c.source}</span>
                </td>
                <td className="text-muted line-through">{c.from}</td>
                <td className="font-medium">{c.to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
      {toast.node}
    </div>
  );
}
