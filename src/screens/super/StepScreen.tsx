"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Copy, List, Send } from "lucide-react";
import { STAFF_TODAY, d, fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { barFill } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, Tag } from "@/components/ui/Chip";
import { FileBadge, fileType } from "@/components/ui/FileBadge";
import { Field, Input } from "@/components/ui/Input";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { Thread, type ThreadStep } from "@/components/cards/Thread";
import { STEPS, stepTone, type StepStatus } from "@/data/incorporation";
import { clientById, type FirmClient } from "@/data/super";
import { PHASE_TOTALS, phasesOf } from "@/data/super-firm";
import { clientById as staffClientById } from "@/data/staff-clients";
import { stepState } from "@/data/staff-steps";
import { StepView as StaffStepView } from "@/screens/staff/StepScreen";

// Super admin step page. Ported from reference/old-screens/s/super/Step.dc.html.
// The staff StepScreen takes portal "lead" | "manager" | "admin" only, so the super portal has this small version:
// step code and status, "What's this?", the work window with Edit, document pack link, "Copy for Assist",
// Forms and Activity tabs, the steps of the phase, and the pre-incorporation documents summary.

type FormState = "Accepted" | "Asked" | "Submitted" | "Rejected";

interface Form {
  id: string;
  name: string;
  detail: string;
  state: FormState;
  date: Date;
  required?: boolean;
  file?: string;
}

const formTone: Record<FormState, "ok" | "warn" | "prog" | "bad"> = { Accepted: "ok", Asked: "prog", Submitted: "warn", Rejected: "bad" };

const STEP7_FORMS: Form[] = [
  { id: "f1", name: "Address details", detail: "4th floor, Prestige Meridian, MG Road, Bengaluru 560001", state: "Accepted", date: d(2026, 10, 10) },
  { id: "f2", name: "Rent agreement", detail: "rent-agreement-2026.pdf · 2.1 MB", file: "rent-agreement-2026.pdf", state: "Accepted", date: d(2026, 10, 10) },
  { id: "f3", name: "Utility bill (under 2 months)", detail: "Asked 5 days ago", state: "Asked", date: d(2026, 10, 11), required: true },
  { id: "f4", name: "NOC from owner", detail: "noc-unsigned.pdf · client submitted 14 Oct · signature missing", file: "noc-unsigned.pdf", state: "Submitted", date: d(2026, 10, 14), required: true },
];

const STEP7_THREAD: ThreadStep[] = [
  { id: "a1", title: "Documents asked from the client", state: "done", date: d(2026, 10, 9), by: "Bharath" },
  { id: "a2", title: "Address details accepted", state: "done", date: d(2026, 10, 10), by: "Bharath" },
  { id: "a3", title: "Rent agreement accepted", state: "done", date: d(2026, 10, 10), by: "Bharath" },
  { id: "a4", title: "NOC uploaded without signature", state: "done", date: d(2026, 10, 14), by: "Rohan Kumar", owner: "client" },
  { id: "a5", title: "Reminder sent", state: "done", date: d(2026, 10, 15), by: "VCFO" },
  { id: "a6", title: "Utility bill and signed NOC", state: "current", date: STAFF_TODAY, owner: "client" },
  { id: "a7", title: "SBC review", state: "upcoming", owner: "sbc" },
];

/** Step status as the lead step page shows it (shared staff step data), else from the firm data. */
function statusFor(c: FirmClient, n: number): StepStatus {
  const sc = staffClientById(c.id);
  if (sc) return stepState(sc, n).status;
  const step = STEPS[n - 1];
  const done = phasesOf(c)[step.phase - 1];
  const idx = STEPS.filter((s) => s.phase === step.phase).findIndex((s) => s.n === n);
  if (idx < done) return "Completed";
  if (c.stepNo === n) return c.health === "Stuck" || c.health === "Overdue" ? "Sent back" : c.owner === "client" ? "Waiting" : "In progress";
  return "Upcoming";
}

function View({ id, n }: { id: string; n: number }) {
  const c = clientById(id);
  const step = STEPS.find((s) => s.n === n);
  const isStep7 = id === "northwind" && n === 7;
  const status = c && step ? statusFor(c, n) : "Upcoming";
  const done = status === "Completed";
  const [tab, setTab] = React.useState("forms");
  const [forms, setForms] = React.useState<Form[]>(() =>
    isStep7
      ? STEP7_FORMS
      : (step?.docs ?? []).map((x, i) => ({ id: `g${i}`, name: x.replace(/\.[a-z]+$/i, ""), detail: /\./.test(x) ? x : "Asked from the client", file: /\./.test(x) ? x : undefined, state: done ? "Accepted" : i === 0 ? "Submitted" : "Asked", date: d(2026, 10, 11 + i) })),
  );
  const [editing, setEditing] = React.useState(false);
  // Old Step.dc.html: Window from 13 Oct to 20 Oct.
  const [from, setFrom] = React.useState("2026-10-13");
  const [to, setTo] = React.useState("2026-10-20");
  const toast = useUndoToast();

  if (!c || !step) return <SectionCard title="Step">{<Empty>No step</Empty>}</SectionCard>;

  const filed = forms.filter((f) => f.state === "Accepted");
  const toFile = forms.filter((f) => f.state !== "Accepted");
  const phaseSteps = STEPS.filter((s) => s.phase === step.phase);
  const thread: ThreadStep[] = isStep7
    ? STEP7_THREAD
    : [
        { id: "g1", title: "Step opened", state: "done", date: d(2026, 10, 8), by: c.lead },
        { id: "g2", title: "Documents asked", state: "done", date: d(2026, 10, 9), by: c.lead },
        { id: "g3", title: step.owner === "client" ? "Client uploads" : "SBC works the step", state: done ? "done" : "current", date: done ? d(2026, 10, 12) : STAFF_TODAY, owner: step.owner },
        { id: "g4", title: "Review", state: done ? "done" : "upcoming", owner: "sbc" },
      ];
  const assist = `${c.name} · Step ${step.n} ${step.title} · window ${from} to ${to} · ${toFile.map((f) => f.name).join(", ") || "nothing open"}`;

  const formRow = (f: Form) => (
    <ListRow key={f.id} className="flex-wrap md:flex-nowrap">
      <FileBadge type={f.file ? fileType(f.file) : "PDF"} className={f.file ? undefined : "opacity-40"} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">
          {f.name}
          {f.required && <span className="text-bad"> *</span>}
        </span>
        <span className={cn("block truncate text-12.5 text-muted", f.file && "font-mono")}>{f.detail}</span>
        {f.state === "Asked" && !f.file && (
          <label className="mt-1.5 flex w-fit cursor-pointer items-center gap-1 rounded-md border border-dashed border-line px-3 py-1.5 text-12.5 text-muted hover:bg-raised">
            Drop a file or <span className="font-semibold text-accent">browse</span>
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setForms(forms.map((x) => (x.id === f.id ? { ...x, state: "Submitted", file: file.name, detail: `${file.name} · uploaded by SBC`, date: STAFF_TODAY } : x)));
              }}
            />
          </label>
        )}
      </span>
      <Chip fixed tone={formTone[f.state]}>
        {f.state === "Asked" ? `Asked · ${Math.max(0, Math.round((STAFF_TODAY.getTime() - f.date.getTime()) / 86400000))}d` : f.state === "Submitted" ? "Review" : f.state}
      </Chip>
      <span className="w-12 flex-none text-12 text-muted">{fmt(f.date)}</span>
      {f.state === "Asked" && (
        <Button size="sm" variant="outline" onClick={() => toast.show(`Reminder sent to ${c.contacts[0]?.name ?? c.short}: ${f.name}`)}>
          <Send size={14} strokeWidth={1.6} /> Send reminder
        </Button>
      )}
      {f.state === "Submitted" && (
        <span className="flex flex-none items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setForms(forms.map((x) => (x.id === f.id ? { ...x, state: "Accepted", date: STAFF_TODAY } : x)))}>
            Accept
          </Button>
          <Button size="sm" variant="ghost" className="text-bad" onClick={() => setForms(forms.map((x) => (x.id === f.id ? { ...x, state: "Rejected", date: STAFF_TODAY } : x)))}>
            Reject
          </Button>
        </span>
      )}
    </ListRow>
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard
        title={`Step ${step.n} · ${step.title}`}
        icon={{ Icon: List, tone: "blue" }}
        meta={
          <span className="inline-flex items-center gap-1.5">
            <i className={cn("h-2 w-2 rounded-[2px]", barFill[c.tone])} aria-hidden />
            {c.short}
          </span>
        }
        right={
          <PopoverCard trigger={<Button size="sm" variant="ghost">What&apos;s this?</Button>} title={step.title} align="end">
            <div className="px-4 py-3">
              <KeyValue
                cols={1}
                wrap
                rows={[
                  { k: "Typical time", v: step.time },
                  { k: "Who works it", v: step.owner === "client" ? "The client uploads, SBC reviews" : step.owner === "mca" ? "MCA" : "SBC" },
                  { k: "Documents", v: step.docs?.join(", ") || "None" },
                ]}
              />
            </div>
          </PopoverCard>
        }
      >
        <KeyValue
          cols={3}
          rows={[
            { k: "Status", v: <Chip tone={stepTone[status]}>{status}</Chip> },
            { k: "Owner", v: <OwnerChip owner={step.owner} label={step.owner === "client" ? c.short : undefined} /> },
            { k: "Phase", v: `Phase ${step.phase} · ${phasesOf(c)[step.phase - 1]} of ${PHASE_TOTALS[step.phase - 1]}` },
            { k: "Window", v: <span className=" text-13">From {fmt(new Date(from))} to {fmt(new Date(to))}</span> },
            { k: "Manager", v: c.manager },
            { k: "Project lead", v: c.lead },
          ]}
        />
        {editing && (
          <div className="mt-4 grid gap-3 sm:grid-cols-[160px_160px_auto] sm:items-end">
            <Field label="From">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3">
          <Button size="sm" variant={editing ? "primary" : "outline"} onClick={() => setEditing(!editing)}>
            {editing ? "Done" : "Edit window"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              try {
                void navigator.clipboard?.writeText(assist);
              } catch {}
              toast.show("Copied for Assist");
            }}
          >
            <Copy size={14} strokeWidth={1.6} /> Copy for Assist
          </Button>
          <Link href="/super/documents" className="ml-auto text-13 font-semibold text-accent hover:underline">
            Open in document pack ›
          </Link>
        </div>
      </SectionCard>

      <Cols>
        <Col>
          <SectionCard
            title={tab === "forms" ? "Documents" : "Activity"}
            flush
            right={
              <Tabs
                items={[
                  { key: "forms", label: "Forms", count: forms.length },
                  { key: "activity", label: "Activity", count: thread.length },
                ]}
                value={tab}
                onChange={setTab}
              />
            }
          >
            {tab === "forms" ? (
              forms.length === 0 ? (
                <Empty />
              ) : (
                <>
                  <div className="border-b border-line-soft px-4 py-2 text-11.5 font-semibold text-muted md:px-5">FILED · {filed.length}</div>
                  {filed.map(formRow)}
                  <div className="border-y border-line-soft px-4 py-2 text-11.5 font-semibold text-muted md:px-5">TO FILE · {toFile.length}</div>
                  {toFile.map(formRow)}
                  <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
                    <span className="mr-auto inline-flex items-center gap-1.5 text-12.5 text-muted">
                      <i className="h-1.5 w-1.5 rounded-[2px] bg-ok" aria-hidden /> Draft saved
                    </span>
                    <Button size="sm" variant="outline" onClick={() => toast.show(`Sent to ${c.contacts[0]?.name ?? c.short} to fill`)}>
                      Request client to fill
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.show(`Approval requested from ${c.manager}`)}>
                      Request manager approval
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        const before = forms;
                        setForms(forms.map((x) => ({ ...x, state: "Accepted" as FormState })));
                        toast.show(`Step ${step.n} marked complete`, () => setForms(before));
                      }}
                    >
                      Mark all complete
                    </Button>
                  </div>
                </>
              )
            ) : (
              <div className="px-4 py-4 md:px-5">
                <Thread steps={thread} />
              </div>
            )}
          </SectionCard>
        </Col>
        <Col>
          <SectionCard title={step.phase === 2 ? "SPICe+ Part B" : `Steps · phase ${step.phase}`} flush>
            {phaseSteps.map((s) => {
              const st = statusFor(c, s.n);
              const on = s.n === step.n;
              return (
                <ListRow key={s.n} href={`/super/clients/${c.id}/step/${s.n}`} className={cn(on && "bg-accent-soft")}>
                  <span className="w-6 flex-none font-mono text-12 text-muted">{s.n}</span>
                  <span className={cn("min-w-0 flex-1 truncate", on && "font-semibold")}>{s.title}</span>
                  <Chip tone={stepTone[st]}>{st}</Chip>
                </ListRow>
              );
            })}
          </SectionCard>
          <SectionCard title="Pre-incorporation documents">
            <div className="flex flex-wrap gap-2">
              <Tag tone="ok">3 ready</Tag>
              <Tag tone="warn">4 need inputs</Tag>
              <Tag tone="idle">1 waiting</Tag>
            </div>
            <Link href="/super/documents" className="mt-3 inline-block text-13 font-semibold text-accent hover:underline">
              Open document pack ›
            </Link>
          </SectionCard>
        </Col>
      </Cols>
      {toast.node}
    </div>
  );
}

export function StepScreen() {
  const params = useParams<{ id: string; n: string }>();
  // The old super step page is the lead step page. Clients that the staff data knows use the shared view.
  if (staffClientById(params.id)) return <StaffStepView key={`${params.id}-${params.n}`} portal="super" id={params.id} n={Number(params.n)} />;
  return <View key={`${params.id}-${params.n}`} id={params.id} n={Number(params.n)} />;
}
