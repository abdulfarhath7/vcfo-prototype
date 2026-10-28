"use client";
import * as React from "react";
import { Gauge, Sparkles, TrendingUp, Trophy } from "lucide-react";
import { STAFF_TODAY, daysFrom } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Bar } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { NumberStrip, type StatItem } from "@/components/cards/GreetingCard";
import { CAP, FIRM_CLIENTS, GROWTH_MONTHS, MANAGERS, PIPELINE, type Prospect } from "@/data/super";
import { MANAGER_ROWS } from "@/data/super-firm";
import { AssignDialog } from "./assign";

// Ported from reference/old-screens/s/super/Growth.dc.html: four number tiles, the sales pipeline board
// (Enquiry, Proposal sent, Won) with "Assign a manager" on a won client, and "Capacity · can the team take more?"
// with its summary sentence. Counts only: the old fee totals stay out (R-37).

const BOARD: Array<{ stage: Prospect["stage"]; label: string }> = [
  { stage: "Enquiry", label: "Enquiry" },
  { stage: "Proposal", label: "Proposal sent" },
  { stage: "Won", label: "Won" },
];

const sum = (m: (typeof GROWTH_MONTHS)[number]) => m.Incorporation + m.Registrations + m.Compliances;

export function GrowthScreen() {
  const [assignFor, setAssignFor] = React.useState<string | null>(null);
  const [assigned, setAssigned] = React.useState<Record<string, boolean>>({});
  const toast = useUndoToast();
  const open = PIPELINE.filter((p) => p.stage !== "Won").length;
  const room = MANAGERS.length * CAP - FIRM_CLIENTS.length;
  const oct = GROWTH_MONTHS[GROWTH_MONTHS.length - 1];
  const sep = GROWTH_MONTHS[GROWTH_MONTHS.length - 2];
  const waiting = PIPELINE.filter((p) => p.stage === "Won" && p.next === "Assign a manager" && !assigned[p.id]);

  const tiles: StatItem[] = [
    { label: "New engagements in October", value: sum(oct), sub: `${sum(sep)} in September`, Icon: Sparkles, tone: "blue" },
    { label: "Prospects in the pipeline", value: open, Icon: TrendingUp, tone: "violet" },
    { label: "Proposals won this quarter", value: "40%", Icon: Trophy, tone: "green" },
    { label: "Room across the managers", value: room, of: "clients", Icon: Gauge, tone: "teal", good: true },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <NumberStrip items={tiles} />

      <SectionCard title="Sales pipeline" icon={{ Icon: TrendingUp, tone: "blue" }}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {BOARD.map((col) => {
            const items = PIPELINE.filter((p) => p.stage === col.stage);
            return (
              <div key={col.stage} className="min-w-0 rounded-md border-1.5 border-line bg-raised p-2.5">
                <h3 className="flex items-center gap-2 px-1 pb-2.5 text-13 font-medium text-ink-2">
                  {col.label}
                  <span className="rounded-sm bg-surface px-1.5 text-12 font-medium text-muted">{items.length}</span>
                </h3>
                <ul className="grid gap-2">
                  {items.map((p) => (
                    <li key={p.id} className="min-w-0 rounded-md border-1.5 border-line bg-surface px-3 py-2.5">
                      <b className="block truncate text-13.5 font-medium">{p.name}</b>
                      <span className="block truncate text-12 text-muted">{p.service}</span>
                      <span className="block truncate text-12.5 text-ink-2">
                        {p.owner} · {Math.max(0, -daysFrom(p.since, STAFF_TODAY))}d
                      </span>
                      {p.stage === "Won" &&
                        p.next === "Assign a manager" &&
                        (assigned[p.id] ? (
                          <Chip tone="ok" className="mt-2">
                            Manager assigned
                          </Chip>
                        ) : (
                          <Button size="sm" variant="primary" className="mt-2 w-full" onClick={() => setAssignFor(p.id)}>
                            Assign a manager
                          </Button>
                        ))}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Capacity · can the team take more?" flush icon={{ Icon: Gauge, tone: "violet" }}>
        <ul className="grid gap-2.5 px-4 py-3 md:px-5">
          {MANAGER_ROWS.map((m) => (
            <li key={m.id} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-3 gap-y-1 text-13 sm:grid-cols-[140px_minmax(0,1fr)_150px]">
              <span className="truncate font-medium">{m.name}</span>
              <Bar pct={m.load} tone={m.load > 80 ? "bad" : m.load >= 70 ? "warn" : "accent"} />
              <span className={cn("col-span-2 text-12.5 sm:col-span-1 sm:text-right", m.room <= 2 ? "font-medium text-warn" : "text-ink-2")}>
                {m.clients} of {CAP} · room for {m.room}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line-soft px-4 py-3 text-13.5 text-ink-2 md:px-5">
          The team can take {room} more clients; Arjun Mehta and Priya Raman have the most room.
          {waiting.length > 0 && ` ${waiting.map((p) => p.name).join(" and ")} is won and waiting for a manager.`}
        </p>
      </SectionCard>

      <AssignDialog
        open={!!assignFor}
        onOpenChange={(v) => !v && setAssignFor(null)}
        newClient={PIPELINE.find((p) => p.id === assignFor)?.name}
        onDone={(m) => {
          if (assignFor) setAssigned((a) => ({ ...a, [assignFor]: true }));
          toast.show(m);
        }}
      />
      {toast.node}
    </div>
  );
}
