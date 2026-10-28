"use client";
import * as React from "react";
import { ExternalLink } from "lucide-react";
import { STEPS } from "@/data/incorporation";
import { STEP_ABOUT } from "@/data/staff-steps";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tag } from "@/components/ui/Chip";
import { SidePanel } from "@/components/ui/SidePanel";

/**
 * "What's this?" panel (Ask VCFO): what the step is, the rule, and the VCFO Assist profile.
 * Ported from the "What's this?" drawer in reference/old-screens/s/lead/Step.dc.html.
 * R-04: no bot figure. R-06: a named button opens it; no info icon.
 */
export function AboutStepPanel({ open, onOpenChange, n }: { open: boolean; onOpenChange: (v: boolean) => void; n: number }) {
  const s = STEPS[n - 1];
  const a = STEP_ABOUT[n];
  const [helpful, setHelpful] = React.useState<"yes" | "no" | null>(null);
  const [q, setQ] = React.useState("");
  const [answers, setAnswers] = React.useState<Array<{ q: string; a: string }>>([]);
  if (!s || !a) return null;
  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Ask VCFO"
      sub={<span className="text-12.5 text-muted">What&apos;s this? · Step {n}</span>}
      width={420}
      footer={
        <form
          className="flex w-full items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!q.trim()) return;
            setAnswers([...answers, { q: q.trim(), a: `${a.notes} Typical time: ${s.time}.` }]);
            setQ("");
          }}
        >
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a follow-up" aria-label="Ask a follow-up" />
          <Button type="submit" variant="primary">
            Ask
          </Button>
        </form>
      }
    >
      <div className="grid gap-4 px-5 py-4 text-13">
        <div className="grid gap-2.5 rounded-lg border border-line bg-navy-tint p-3.5">
          <b className="font-semibold">{s.title}</b>
          <p className="text-ink-2">{a.what}</p>
          {a.points.length > 0 && (
            <ul className="grid list-disc gap-1 pl-5 text-ink-2">
              {a.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-2 text-12.5">
            {helpful ? (
              <span className="font-semibold">{helpful === "yes" ? "Thanks" : "Noted. SBC will improve this text."}</span>
            ) : (
              <>
                <Button size="sm" variant="outline" className="w-[84px]" onClick={() => setHelpful("yes")} aria-label="Helpful">
                  Yes
                </Button>
                <Button size="sm" variant="outline" className="w-[84px]" onClick={() => setHelpful("no")} aria-label="Not helpful">
                  No
                </Button>
              </>
            )}
            <a href="https://www.mca.gov.in" target="_blank" rel="noreferrer" title={a.rule} className="ml-auto inline-flex items-center gap-1 font-semibold text-accent hover:underline">
              MCA rule <ExternalLink size={13} strokeWidth={1.6} />
            </a>
          </div>
        </div>
        <div className="grid gap-2">
          <h3 className="text-12 font-semibold text-muted">VCFO Assist profile</h3>
          {a.missing.map((m) => (
            <div key={m} className="flex items-start gap-2">
              <Tag tone="bad" className="flex-none">
                Missing in Suite
              </Tag>
              <span className="pt-0.5">{m}</span>
            </div>
          ))}
          {a.cannot.map((m) => (
            <div key={m} className="flex items-start gap-2">
              <Tag tone="idle" className="flex-none">
                Suite cannot supply
              </Tag>
              <span className="pt-0.5">{m}</span>
            </div>
          ))}
          <div className="flex items-start gap-2">
            <Tag tone="warn" className="flex-none">
              Notes for the lead
            </Tag>
            <span className="pt-0.5">{a.notes}</span>
          </div>
        </div>
        {answers.map((x, i) => (
          <div key={i} className="grid gap-1 border-t border-line-soft pt-3">
            <b className="font-semibold">{x.q}</b>
            <p className="text-ink-2">{x.a}</p>
          </div>
        ))}
      </div>
    </SidePanel>
  );
}
