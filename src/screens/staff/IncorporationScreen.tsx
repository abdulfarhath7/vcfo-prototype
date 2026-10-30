"use client";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Building2, Landmark, User } from "lucide-react";
import { fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { clientsFor, healthTone, incDone, PHASE_TOTALS, type StaffClient } from "@/data/staff-clients";
import { NumberStrip, type StatItem } from "@/components/cards/GreetingCard";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PhaseBar } from "@/components/ui/PhaseBar";
import { Tabs } from "@/components/ui/Tabs";
import { clientHref, type StaffPortal } from "./parts";

// R-51: the practice block. Staff Incorporation lists the clients that are still incorporating,
// in the same shape as the super admin Practice › Incorporation page, scoped to the role:
// admin sees every client, a manager and the manager's project leads see the manager's clients.

const NAMES = ["Name", "Incorporation", "Post-incorporation", "Registrations"];
type With = "" | StaffClient["pendingWith"];

export function IncorporationScreen({ portal }: { portal: StaffPortal }) {
  const all = clientsFor(portal).filter((c) => c.stage === "incorporating");
  const [withWho, setWithWho] = React.useState<With>("");
  const rows = all.filter((c) => !withWho || c.pendingWith === withWho).sort((a, b) => incDone(a) - incDone(b));

  const n = (w: StaffClient["pendingWith"]) => all.filter((c) => c.pendingWith === w).length;
  const late = all.filter((c) => c.health === "Overdue" || c.health === "Stuck").length;
  const stats: StatItem[] = [
    { label: "Clients incorporating", value: all.length, Icon: Building2, tone: "blue" },
    { label: "Waiting on client", value: n("Client"), Icon: User, tone: "amber" },
    { label: "With MCA", value: n("MCA"), Icon: Landmark, tone: "violet" },
    { label: "Stuck or overdue", value: late, Icon: AlertTriangle, tone: "red", bad: late > 0 },
  ];

  const cols: Column<StaffClient>[] = [
    { key: "client", label: "Client", render: (c) => <span className="block max-w-[220px] truncate font-medium">{c.name}</span> },
    {
      key: "step",
      label: "Current step",
      render: (c) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex-none font-mono text-12 text-muted">{c.code}</span>
          <span className="truncate">{c.step}</span>
        </span>
      ),
    },
    { key: "phase", label: "Progress", width: 140, hideOnPhone: true, render: (c) => <PhaseBar done={c.phases} totals={PHASE_TOTALS} names={NAMES} /> },
    { key: "done", label: "Steps", width: 72, align: "right", render: (c) => <span className="tabular-nums">{incDone(c)} / 25</span> },
    { key: "with", label: "With", width: 84, render: (c) => c.pendingWith },
    { key: "days", label: "Days", width: 64, align: "right", render: (c) => <span className={cn("tabular-nums", c.days >= 5 && "font-medium text-bad")}>{c.days}</span> },
    { key: "next", label: "Next", width: 76, hideOnPhone: true, render: (c) => <span className="whitespace-nowrap">{fmt(c.next)}</span> },
    { key: "status", label: "Status", width: 124, render: (c) => <Chip fixed tone={healthTone[c.health]}>{c.health}</Chip> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <NumberStrip items={stats} />
      <DataGrid
        title="Incorporation"
        meta={`${rows.length}`}
        icon={{ Icon: Landmark, tone: "blue" }}
        filters={
          <Tabs
            value={withWho}
            onChange={(v) => setWithWho(v as With)}
            items={[
              { key: "", label: "All", count: all.length },
              { key: "Client", label: "Client", count: n("Client") },
              { key: "SBC", label: "SBC", count: n("SBC") },
              { key: "MCA", label: "MCA", count: n("MCA") },
            ]}
          />
        }
        columns={cols}
        rows={rows}
        rowKey={(c) => c.id}
        rowHref={(c) => clientHref(portal, c.id)}
        rowLate={(c) => c.health === "Overdue" || c.health === "Stuck"}
        empty="No clients in incorporation"
        emptyAction={
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/${portal}/clients`}>View clients</Link>
          </Button>
        }
      />
    </div>
  );
}
