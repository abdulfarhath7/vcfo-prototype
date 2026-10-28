"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { PHASES, STEPS, stepTone, stepsOf, stepHref } from "@/data/incorporation";
import { stepNeeds } from "@/data/incorporation-detail";
import { Cols, Col } from "@/components/shell/Page";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { useUndoToast } from "@/components/ui/UndoToast";
import { stepAnswers, stepDetail } from "./step-detail";
import { RecordHead } from "./parts";
import { MessageModal, Pager, PortalButton } from "./inc-parts";
import { AnswersCard, ApprovalBar, PhaseStepsRail, StepDocsCard, stepKind } from "./step-parts";

export function StepScreen({ n }: { n: number }) {
  const sd = stepDetail(n)!;
  const s = sd.step;
  const phase = PHASES[s.phase - 1];
  const inPhase = stepsOf(s.phase);
  const late = s.status !== "Completed" && !!s.due && s.due < TODAY;
  const clientOwned = s.owner === "client" && s.status !== "Completed" && s.status !== "Upcoming";
  const toast = useUndoToast();
  const [uploaded, setUploaded] = React.useState<Record<string, string>>({});
  const [msg, setMsg] = React.useState<null | "change" | "message">(null);
  const needs = stepNeeds(s);
  // Approval progress: the share of the step's checklist that is done (old actBar).
  const checked: Record<string, boolean> = Object.fromEntries((needs ?? []).map((i) => [i.id, i.done]));
  const waiting = stepKind(s) === "you";
  const prev = STEPS[n - 2];
  const next = STEPS[n];
  // Step 7: Approve needs the NOC first (old setNeed / data-approve).
  const noc = sd.docs.find((x) => /NOC/.test(x.name));
  const blocked = n === 7 && noc && !uploaded[noc.id] ? "NOC from the owner" : undefined;

  return (
    <div className="grid grid-cols-1 gap-5">
      <RecordHead
        eyebrow={`Phase ${phase.n} · ${phase.short} · step ${inPhase.indexOf(s) + 1} of ${inPhase.length}`}
        title={s.title}
        chips={
          <>
            <OwnerChip owner={s.owner} label={s.owner === "client" ? "Northwind" : undefined} />
            <Chip tone={stepTone[s.status]}>{s.status}</Chip>
            {s.done && <span className="text-12.5 text-muted">Done {fmt(s.done)}</span>}
            {!s.done && s.due && <span className={cn("text-12.5", late ? "font-semibold text-bad" : "text-muted")}>Due {fmt(s.due)}</span>}
            <span className="text-12.5 text-muted">{s.time}</span>
            {sd.forms.slice(0, 3).map((f) => (
              <PortalButton key={f} form={f} step={s} notify={toast.show} />
            ))}
          </>
        }
      />
      <Cols>
        <Col>
          <AnswersCard step={s} about={sd.about} rows={stepAnswers(n)} notify={toast.show} onChange={() => setMsg("change")} onMessage={() => setMsg("message")} />
          <StepDocsCard docs={sd.docs} due={s.due} by={s.by ?? "Bharath"} canUpload={clientOwned} uploaded={uploaded} onUpload={(id, f) => setUploaded((u) => { const x = { ...u }; if (f) x[id] = f; else delete x[id]; return x; })} notify={toast.show} />
        </Col>
        <Col>
          <PhaseStepsRail step={s} />
        </Col>
      </Cols>
      {waiting && needs && (
        <ApprovalBar
          key={n}
          pct={Math.round((needs.filter((i) => checked[i.id]).length / needs.length) * 100)}
          blocked={blocked}
          notify={toast.show}
          onChange={() => setMsg("change")}
        />
      )}
      <Pager
        prev={prev ? { href: stepHref("client", prev.n), label: `${prev.n} · ${prev.title}` } : { href: "/client/incorporation", label: "All phases" }}
        next={next ? { href: stepHref("client", next.n), label: `${next.n} · ${next.title}` } : { href: "/client/incorporation", label: "All phases" }}
      />
      <MessageModal
        open={!!msg}
        onOpenChange={(v) => !v && setMsg(null)}
        to={s.by ?? "Bharath"}
        about={`Step ${s.n} · ${s.title}`}
        title={msg === "change" ? "Request a change" : "Message"}
        notify={toast.show}
      />
      {toast.node}
    </div>
  );
}
