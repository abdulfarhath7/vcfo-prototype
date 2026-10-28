"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Clock, FileText, SendHorizontal, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import type { Portal } from "@/data/nav";

/* Ask VCFO chat states (v7chat_home, v7chat_thinking, v7chat_answer, v7chat_handoff). R-04: no bot figure. */

interface Answer {
  text: string;
  /** Optional phase list with status (v7chat_answer). */
  phases?: Array<{ name: string; count: string; label: string; tone: ChipTone }>;
  links?: Array<{ label: string; href: string }>;
  sources: Array<{ label: string; href: string }>;
  reviewed?: boolean;
}

interface Pack {
  hello: string;
  project?: { stage: string; step: string; progress: string; href: string };
  groups: Array<{ key: string; label: string; questions: string[] }>;
  recent?: Array<{ title: string; sub: string; href: string }>;
  answers: Record<string, Answer>;
  lead: { name: string; role: string };
  placeholder: string;
}

const CLIENT: Pack = {
  hello: "Northwind Technologies",
  project: { stage: "Phase 2 · Incorporation", step: "Registered office address", progress: "6 of 25 steps done", href: "/client/incorporation/step/7" },
  groups: [
    { key: "project", label: "About Northwind’s project", questions: ["What is my next step?", "Where is my incorporation now?"] },
    { key: "basics", label: "Learn the basics", questions: ["What is SPICe+ Part A?", "What is GST, and do we need it?", "What happens after incorporation?", "What is FC-GPR?"] },
  ],
  recent: [
    { title: "Last conversation", sub: "What is SPICe+ Part A?", href: "#" },
    { title: "Northwind’s Library", sub: "Explanations saved from Ask VCFO", href: "/client/library" },
    { title: "Monthly status brief", sub: "PDF · October 2026", href: "/client/documents" },
  ],
  answers: {
    "What is my next step?": {
      text: "Your next step is step 7, Registered office address. Upload the utility bill and the NOC from the owner by 9 Oct.",
      links: [{ label: "Open Registered office address", href: "/client/incorporation/step/7" }],
      sources: [{ label: "Northwind’s project", href: "/client/incorporation" }],
      reviewed: true,
    },
    "Where is my incorporation now?": {
      text: "6 of 25 steps are complete. You are in Phase 2, on Registered office address.",
      phases: [
        { name: "Phase 1 · Name application", count: "5 of 5", label: "Done", tone: "ok" },
        { name: "Phase 2 · Incorporation", count: "1 of 9", label: "Northwind is here", tone: "prog" },
        { name: "Phase 3 · Post-incorporation", count: "0 of 11", label: "Next", tone: "idle" },
      ],
      links: [
        { label: "Open Incorporation", href: "/client/incorporation" },
        { label: "Open Registered office address", href: "/client/incorporation/step/7" },
      ],
      sources: [{ label: "Northwind’s project", href: "/client/incorporation" }],
      reviewed: true,
    },
    "What is SPICe+ Part A?": {
      text: "SPICe+ Part A reserves the company name with MCA. Northwind finished it on 24 Sep. The approved name stays valid for 20 days.",
      sources: [
        { label: "Library · SPICe+ explained", href: "/client/library" },
        { label: "MCA · SPICe+ form", href: "https://www.mca.gov.in" },
      ],
      reviewed: true,
    },
    "What is GST, and do we need it?": {
      text: "GST is the tax on the sale of goods and services. Registration is required above ₹20 lakh turnover, or for any export of services. SBC plans Northwind’s GST registration after the COI.",
      sources: [{ label: "Library · GST registration", href: "/client/library" }],
    },
    "What happens after incorporation?": {
      text: "Phase 3 starts on the COI date: first Board meeting, bank account, share capital, auditor appointment, INC-20A and the registrations.",
      links: [{ label: "Open Phase 3", href: "/client/incorporation/phase/3" }],
      sources: [{ label: "Northwind’s project", href: "/client/incorporation/phase/3" }],
    },
    "What is FC-GPR?": {
      text: "FC-GPR reports foreign investment to RBI. File it within 30 days of the share allotment, with the bank FIRC and KYC letter.",
      sources: [{ label: "Library · FEMA reporting", href: "/client/library" }],
    },
  },
  lead: { name: "Bharath", role: "Project lead" },
  placeholder: "Ask about Northwind’s setup",
};

const STAFF_Q: Record<Exclude<Portal, "client">, string[]> = {
  lead: ["What is due this week?", "Which clients are stuck?", "Draft a reminder to Northwind", "Summarise Kestrel's filings"],
  manager: ["Which leads are overloaded?", "What needs my approval?", "Overdue filings by client", "Draft the weekly client note"],
  admin: ["Firm-wide overdue items", "Which managers are behind?", "Clients without a lead", "Summary for the partners"],
  super: ["Risks this month", "Clients added this quarter", "Team utilisation", "Practice areas behind plan"],
  dev: ["Failed jobs today", "Which connection needs attention?", "Last deploy summary", "Cost trend this month"],
};

/** The answer to the first quick question on each staff portal. Numbers come from that portal's sample data; each source is a real route. */
const FIRST: Record<Exclude<Portal, "client">, Pack["answers"][string]> = {
  lead: { text: "Northwind has 1 overdue item: the passport copy for Director 1, sent back on 2 Oct. Three more items fall due by 10 Oct.", sources: [{ label: "Work", href: "/lead/work" }], reviewed: true },
  manager: { text: "Bharath and Sneha Kulkarni have 13 open tasks each. Meera Nair has 8. Sneha has the most late work.", sources: [{ label: "Project leads", href: "/manager/leads" }], reviewed: true },
  admin: { text: "Managers have 3 overdue items: MCA remarks for Monsoon Labs, new name options for Banyan Wellness and the bank account delay for Brightwave Robotics.", sources: [{ label: "Work", href: "/admin/work" }], reviewed: true },
  super: { text: "There are 10 open risks. Four have severity 3: two unpaid TDS challans and unanswered MCA remarks for Monsoon Labs, among others.", sources: [{ label: "Risks", href: "/super/risks" }], reviewed: true },
  dev: { text: "One job failed today: WhatsApp reminders at 12:00. Meta has not approved the deadline_1d template, so 14 reminders were skipped.", sources: [{ label: "Jobs", href: "/dev/jobs" }], reviewed: true },
};

function packFor(portal: Portal): Pack {
  if (portal === "client") return CLIENT;
  const qs = STAFF_Q[portal];
  return {
    hello: "",
    groups: [{ key: "q", label: "Quick questions", questions: qs }],
    answers: { [qs[0]]: FIRST[portal] },
    lead: { name: "Pranay", role: "Manager" },
    placeholder: "Ask about a client, a step or a filing",
  };
}

type Msg = { id: number; q: string; state: "thinking" | "answer" | "unsure"; step: number; handoff?: "form" | "sent"; vote?: "up" | "down" };

const THINK = ["Checking the project", "Finding sources", "Writing"];

/**
 * The Ask VCFO thread: prompt home with question chips, thinking, answer with sources, hand-off to the team.
 * Fills the panel body and the composer. The panel frame (AskButton) is the lead's file.
 */
export function AskThread({ portal, className }: { portal: Portal; className?: string }) {
  const pack = packFor(portal);
  const [group, setGroup] = React.useState(pack.groups[0].key);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [q, setQ] = React.useState("");
  const [note, setNote] = React.useState("");
  const scroller = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const last = msgs[msgs.length - 1];
    if (!last || last.state !== "thinking") return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const h = window.setTimeout(
      () =>
        setMsgs((m) =>
          m.map((x) => (x.id !== last.id ? x : x.step < THINK.length - 1 ? { ...x, step: x.step + 1 } : { ...x, state: pack.answers[x.q] ? "answer" : "unsure" })),
        ),
      reduce ? 0 : 450,
    );
    return () => window.clearTimeout(h);
  }, [msgs, pack.answers]);

  React.useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [msgs]);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { id: Date.now(), q: t, state: "thinking", step: 0 }]);
    setQ("");
  };
  const patch = (id: number, p: Partial<Msg>) => setMsgs((m) => m.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const shown = pack.groups.find((g) => g.key === group) ?? pack.groups[0];

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        {msgs.length === 0 ? (
          <div className="grid gap-4 p-4">
            {pack.hello && (
              <div>
                <div className="text-12.5 text-muted">Hello,</div>
                <div className="text-16 font-semibold">{pack.hello}</div>
              </div>
            )}
            {pack.project && (
              <Link href={pack.project.href} className="grid gap-0.5 rounded-md border border-line px-3 py-2.5 hover:bg-raised">
                <span className="text-12 text-muted">{pack.project.stage}</span>
                <span className="text-13.5 font-semibold">{pack.project.step}</span>
                <span className="text-12 text-muted">{pack.project.progress}</span>
              </Link>
            )}
            <div className="grid gap-2">
              {pack.groups.length > 1 ? (
                <Tabs items={pack.groups.map((g) => ({ key: g.key, label: g.label, count: g.questions.length }))} value={group} onChange={setGroup} />
              ) : (
                <h3 className="text-12 font-semibold text-muted">{shown.label}</h3>
              )}
              <div className="flex flex-wrap gap-2">
                {shown.questions.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} className="rounded-md border border-line px-3 py-1.5 text-left text-13 text-ink-2 hover:bg-raised">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {pack.recent && (
              <div>
                <h3 className="mb-1 text-12 font-semibold text-muted">Pick up where you left off</h3>
                <ul className="overflow-hidden rounded-md border border-line">
                  {pack.recent.map((r, i) => (
                    <li key={r.title}>
                      <Link
                        href={r.href}
                        onClick={(e) => {
                          if (r.href === "#") {
                            e.preventDefault();
                            ask(r.sub);
                          }
                        }}
                        className={cn("flex items-center gap-3 px-3 py-2.5 hover:bg-raised", i > 0 && "border-t border-line-soft")}
                      >
                        {i === 0 ? <Clock size={15} strokeWidth={1.6} className="text-muted" /> : <FileText size={15} strokeWidth={1.6} className="text-muted" />}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-13 font-semibold">{r.title}</span>
                          <span className="block truncate text-12 text-muted">{r.sub}</span>
                        </span>
                        <ChevronRight size={15} strokeWidth={1.6} className="text-faint" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-4">
            <button type="button" onClick={() => setMsgs([])} className="inline-flex w-fit items-center gap-1.5 text-12.5 font-semibold text-muted hover:text-ink">
              <ArrowLeft size={14} strokeWidth={1.6} /> Questions
            </button>
            {msgs.map((m) => {
              const a = pack.answers[m.q];
              return (
                <div key={m.id} className="grid gap-2">
                  <div className="ml-auto max-w-[85%] rounded-md bg-btn px-3 py-2 text-13 text-white">{m.q}</div>
                  {m.state === "thinking" && (
                    <ol className="grid gap-1 rounded-md bg-raised px-3 py-2 text-12.5" aria-live="polite">
                      {THINK.map((t, i) => (
                        <li key={t} className={cn("flex items-center gap-2", i > m.step ? "text-faint" : i === m.step ? "font-semibold text-ink" : "text-muted")}>
                          {i < m.step ? <Check size={13} strokeWidth={1.6} className="text-ok" /> : <span className={cn("h-1.5 w-1.5 rounded-[2px]", i === m.step ? "bg-accent" : "bg-line")} />}
                          {t}…
                        </li>
                      ))}
                    </ol>
                  )}
                  {m.state === "answer" && a && (
                    <div className="grid gap-3 rounded-md border border-line px-3 py-3 text-13">
                      {a.reviewed && (
                        <Chip tone="ok" className="w-fit">
                          Reviewed by SBC
                        </Chip>
                      )}
                      <p>{a.text}</p>
                      {a.phases && (
                        <ol className="grid gap-1.5">
                          {a.phases.map((p, i) => (
                            <li key={p.name} className="flex items-center gap-2.5">
                              <span className="grid h-5 w-5 flex-none place-items-center rounded-sm bg-raised font-mono text-11 text-muted">{i + 1}</span>
                              <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                              <span className="font-mono text-12 text-muted">{p.count}</span>
                              <Chip tone={p.tone}>{p.label}</Chip>
                            </li>
                          ))}
                        </ol>
                      )}
                      {a.links && (
                        <div className="flex flex-wrap gap-2">
                          {a.links.map((l, i) => (
                            <Button key={l.href + l.label} asChild size="sm" variant={i === a.links!.length - 1 ? "primary" : "outline"}>
                              <Link href={l.href}>{l.label}</Link>
                            </Button>
                          ))}
                        </div>
                      )}
                      <div>
                        <h4 className="mb-1 text-12 font-semibold text-muted">Sources</h4>
                        <ol className="grid gap-1">
                          {a.sources.map((s, i) => (
                            <li key={s.label} className="flex items-center gap-2 text-12.5">
                              <span className="grid h-4 w-4 place-items-center rounded-sm bg-accent-soft font-mono text-11 text-accent">{i + 1}</span>
                              <a href={s.href} className="truncate font-semibold text-accent hover:underline" target={s.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                                {s.label}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="flex items-center gap-1 border-t border-line-soft pt-2">
                        <Button size="sm" variant="ghost" onClick={() => patch(m.id, { handoff: "form" })}>
                          Ask my lead
                        </Button>
                        <span className="ml-auto text-12 text-muted">Helpful?</span>
                        <button type="button" aria-label="Helpful" aria-pressed={m.vote === "up"} onClick={() => patch(m.id, { vote: "up" })} className={cn("grid h-7 w-7 place-items-center rounded-sm hover:bg-raised", m.vote === "up" ? "text-ok" : "text-muted")}>
                          <ThumbsUp size={14} strokeWidth={1.6} />
                        </button>
                        <button type="button" aria-label="Not helpful" aria-pressed={m.vote === "down"} onClick={() => patch(m.id, { vote: "down" })} className={cn("grid h-7 w-7 place-items-center rounded-sm hover:bg-raised", m.vote === "down" ? "text-bad" : "text-muted")}>
                          <ThumbsDown size={14} strokeWidth={1.6} />
                        </button>
                      </div>
                    </div>
                  )}
                  {m.state === "unsure" && (
                    <div className="grid gap-2 rounded-md border border-line px-3 py-3 text-13">
                      <Chip tone="warn" className="w-fit">
                        AI answer · check with your lead
                      </Chip>
                      <p>I am not certain about this one. {pack.lead.name} can answer it.</p>
                      {!m.handoff && (
                        <Button size="sm" variant="primary" className="w-fit" onClick={() => patch(m.id, { handoff: "form" })}>
                          Ask my lead
                        </Button>
                      )}
                    </div>
                  )}
                  {m.handoff === "form" && (
                    <form
                      className="grid gap-2 rounded-md border border-line bg-raised px-3 py-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        patch(m.id, { handoff: "sent" });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-12 font-semibold text-accent">{pack.lead.name.slice(0, 2).toUpperCase()}</span>
                        <span className="min-w-0">
                          <span className="block text-13 font-semibold">{pack.lead.name}</span>
                          <span className="block text-12 text-muted">{pack.lead.role} · replies by email</span>
                        </span>
                      </div>
                      <textarea
                        aria-label={`Message to ${pack.lead.name}`}
                        defaultValue={m.q}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-line bg-surface px-3 py-2 text-13 outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
                      />
                      <span className="text-12 text-muted">The last 4 messages go with it.</span>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => patch(m.id, { handoff: undefined })}>
                          Cancel
                        </Button>
                        <Button size="sm" variant="primary" type="submit" disabled={note.trim() === "" && m.q.trim() === ""}>
                          Send to lead
                        </Button>
                      </div>
                    </form>
                  )}
                  {m.handoff === "sent" && (
                    <div role="status" className="flex items-center gap-2 rounded-md bg-ok-soft px-3 py-2 text-13 text-ok">
                      <Check size={15} strokeWidth={1.6} /> Sent to {pack.lead.name}. Reply comes by email.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <form
        className="flex items-center gap-2 border-t border-line-soft p-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={pack.placeholder} aria-label="Ask VCFO" className="h-9 min-w-0 flex-1 rounded-md border border-line bg-surface px-3 text-13.5 outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent-line" />
        <Button type="submit" variant="primary" size="icon" aria-label="Send" disabled={!q.trim()}>
          <SendHorizontal size={16} strokeWidth={1.6} />
        </Button>
      </form>
    </div>
  );
}
