"use client";
import * as React from "react";
import { SendHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import type { Portal } from "@/data/nav";

const STARTERS: Record<Portal, string[]> = {
  client: ["What is waiting on us?", "When is the COI expected?", "Which documents are still due?", "Explain SPICe+ Part B"],
  lead: ["What is due this week?", "Which clients are stuck?", "Draft a reminder to Northwind", "Summarise Zenith's filings"],
  manager: ["Which leads are overloaded?", "What needs my approval?", "Overdue filings by client", "Draft the weekly client note"],
  admin: ["Firm-wide overdue items", "Which managers are behind?", "Clients without a lead", "Summary for the partners"],
  super: ["Risks this month", "Revenue by practice area", "Team utilisation", "Clients added this quarter"],
  dev: ["Failed jobs today", "Which connection needs attention?", "Last deploy summary", "Cost trend this month"],
};

const ANSWER: Record<string, string> = {
  default: "Northwind is waiting on 4 items: Registered office address proof, 2 office documents, MOA and AOA review, and the passport copy for Director 1 (sent back on 2 Oct). The passport copy is overdue by 4 days.",
};

/** R-04: Ask VCFO is a text button. No mascot. */
export function AskButton({ portal }: { portal: Portal }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [thread, setThread] = React.useState<Array<{ who: "me" | "vcfo"; text: string }>>([]);

  const ask = (text: string) => {
    if (!text.trim()) return;
    setThread((t) => [...t, { who: "me", text }, { who: "vcfo", text: ANSWER.default }]);
    setQ("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("fixed bottom-5 right-5 z-30 h-9 rounded-md bg-navy px-3.5 text-13.5 font-semibold text-white shadow-pop hover:bg-navy-hover", open && "hidden")}
        aria-expanded={open}
        aria-controls="ask-panel"
      >
        Ask VCFO
      </button>
      {open && (
        <section id="ask-panel" className="fixed bottom-5 right-5 z-40 flex h-[min(560px,calc(100vh-40px))] w-[min(400px,calc(100vw-40px))] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-pop" aria-label="Ask VCFO">
          <header className="flex h-head items-center gap-2.5 border-b border-line-soft px-4">
            <h2 className="text-14.5 font-semibold">Ask VCFO</h2>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-raised" aria-label="Close">
              <X size={16} strokeWidth={1.5} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            {thread.length === 0 ? (
              <div className="grid gap-2">
                {STARTERS[portal].map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} className="h-9 rounded-md border border-line px-3 text-left text-13 text-ink-2 hover:bg-raised">
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                {thread.map((m, i) => (
                  <div key={i} className={cn("max-w-[85%] rounded-md px-3 py-2 text-13", m.who === "me" ? "ml-auto bg-navy text-white" : "bg-raised text-ink")}>
                    {m.text}
                  </div>
                ))}
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
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about a step, a filing or a document" className="h-9 flex-1 rounded-md border border-line bg-surface px-3 text-13.5 outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent-line" />
            <Button type="submit" variant="primary" size="icon" aria-label="Send">
              <SendHorizontal size={16} strokeWidth={1.5} />
            </Button>
          </form>
        </section>
      )}
    </>
  );
}
