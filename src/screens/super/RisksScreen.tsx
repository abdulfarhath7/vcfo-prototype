"use client";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Chip, Tag } from "@/components/ui/Chip";
import { useUndoToast } from "@/components/ui/UndoToast";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { RISKS, clientById, type Risk } from "@/data/super";
import { RISK_KIND_LABEL, RISK_KIND_TONE, ageOf, type RiskKind } from "@/data/super-firm";
import { ClientTile, clientHref } from "./parts";
import { AssignDialog } from "./assign";
import Link from "next/link";

// Ported from reference/old-screens/s/super/Risks.dc.html: a row of kind chips with counts, then one grid of the 10 risks.
// Each row: kind, client tile, title, severity bars, client, owner with the admin under it, age, and one action.
// The action is Assign for "No manager", otherwise Remind (K-17: no "Nudge").

const KINDS = Object.keys(RISK_KIND_LABEL) as RiskKind[];

function SeverityBars({ sev }: { sev: 1 | 2 | 3 }) {
  return (
    <span className="flex flex-none gap-0.5" aria-hidden>
      {[1, 2, 3].map((i) => (
        <i key={i} className={cn("h-3 w-1.5 rounded-[1px]", i <= sev ? "bg-bad-mid" : "bg-line")} />
      ))}
    </span>
  );
}

export function RisksScreen() {
  const [kind, setKind] = React.useState<RiskKind | "">("");
  const [assignFor, setAssignFor] = React.useState<Risk | null>(null);
  // Risks given a manager here, as Growth marks a won client (prototype state for this page).
  const [assigned, setAssigned] = React.useState<Record<string, boolean>>({});
  const toast = useUndoToast();
  const rows = RISKS.filter((r) => !kind || r.kind === kind);

  const chips: Array<{ key: RiskKind | ""; label: string; n: number }> = [
    { key: "", label: "All", n: RISKS.length },
    ...KINDS.map((k) => ({ key: k, label: RISK_KIND_LABEL[k], n: RISKS.filter((r) => r.kind === k).length })),
  ];

  const columns: Column<Risk>[] = [
    { key: "kind", label: "Kind", width: 140, render: (r) => <Tag tone={RISK_KIND_TONE[r.kind]} className="w-[104px]">{RISK_KIND_LABEL[r.kind]}</Tag> },
    {
      key: "risk",
      label: "Risk",
      render: (r) => {
        const c = r.clientId ? clientById(r.clientId) : undefined;
        return (
          <span className="flex min-w-0 items-center gap-2.5">
            <ClientTile client={c} />
            <span className="min-w-0">
              <span className="block truncate font-medium">{r.title}</span>
              <span className="flex items-center gap-1.5 text-12 text-muted" title={`${r.severity} severity`}>
                <SeverityBars sev={r.sev} />
                {c ? (
                  <Link href={clientHref(c.id)} className="truncate hover:underline">
                    {r.clientName}
                  </Link>
                ) : (
                  <span className="truncate">{r.clientName}</span>
                )}
              </span>
            </span>
          </span>
        );
      },
    },
    {
      key: "owner",
      label: "Owner",
      width: 180,
      className: "whitespace-nowrap",
      render: (r) => (
        <span>
          <span className="block">{r.owner}</span>
          <span className="block text-12 text-muted">{r.admin}</span>
        </span>
      ),
    },
    { key: "age", label: "Age", width: 90, align: "right", className: "whitespace-nowrap", render: (r) => ageOf(r) },
    {
      key: "action",
      label: "",
      width: 110,
      render: (r) =>
        r.kind === "owner" && assigned[r.id] ? (
          <Chip fixed tone="ok" title="Manager assigned">Assigned</Chip>
        ) : r.kind === "owner" ? (
          <Button size="sm" variant="outline" className="w-[84px]" onClick={() => setAssignFor(r)}>
            Assign
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="w-[84px]" onClick={() => toast.show(`Reminder sent to ${r.owner} and ${r.admin} · ${r.title}`)}>
            Remind
          </Button>
        ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <DataGrid
        title="Risks"
        meta={String(rows.length)}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        pageSize={10}
        filters={<Tabs items={chips.map((c) => ({ key: c.key || "all", label: c.label, count: c.n }))} value={kind || "all"} onChange={(k) => setKind(k === "all" ? "" : (k as RiskKind))} />}
      />

      <AssignDialog
        open={!!assignFor}
        onOpenChange={(v) => !v && setAssignFor(null)}
        newClient={assignFor?.kind === "owner" ? "Lotus Dental" : undefined}
        clientId={assignFor?.clientId ?? undefined}
        onDone={(m) => {
          if (assignFor) setAssigned((a) => ({ ...a, [assignFor.id]: true }));
          toast.show(m);
        }}
      />
      {toast.node}
    </div>
  );
}
