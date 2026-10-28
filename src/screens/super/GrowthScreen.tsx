"use client";
import * as React from "react";
import { Gauge, TrendingUp } from "lucide-react";
import { STAFF_TODAY, daysFrom } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Bar } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
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

  const tiles = [
    { n: String(sum(oct)), label: `New engagements in October (${sum(sep)} in September)`, cls: "" },
    { n: String(open), label: "Prospects in the pipeline", cls: "text-accent" },
    { n: "40%", label: "Proposals won this quarter", cls: "" },
    { n: `${room} clients`, label: "Room across the managers", cls: "text-ok" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-line bg-surface px-4 py-3.5">
            <b className={cn("block text-22 font-semibold leading-tight", t.cls)}>{t.n}</b>
            <span className="text-12.5 text-muted">{t.label}</span>
          </div>
        ))}
      </div>

      <SectionCard title="Sales pipeline" icon={{ Icon: TrendingUp, tone: "blue" }}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {BOARD.map((col) => {
            const items = PIPELINE.filter((p) => p.stage === col.stage);
            return (
              <div key={col.stage} className="min-w-0 rounded-md bg-raised p-2.5">
                <h3 className="px-1 pb-2 text-12.5 font-semibold text-muted">
                  {col.label} · {items.length}
                </h3>
                <ul className="grid gap-2">
                  {items.map((p) => (
                    <li key={p.id} className="min-w-0 rounded-md border border-line bg-surface px-3 py-2.5">
                      <b className="block truncate text-13.5 font-semibold">{p.name}</b>
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
              <span className="truncate font-semibold">{m.name}</span>
              <Bar pct={m.load} tone="accent" />
              <span className={cn("col-span-2 text-12.5 sm:col-span-1 sm:text-right", m.room <= 2 ? "font-semibold text-warn" : "text-ink-2")}>
                {m.clients} of {CAP} · room for {m.room}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line-soft px-4 py-3 text-13 font-semibold md:px-5">
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
