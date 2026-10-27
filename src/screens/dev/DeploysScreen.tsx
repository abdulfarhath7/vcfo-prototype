"use client";
import * as React from "react";
import { TODAY, fmt } from "@/lib/dates";
import { DEPLOYS, DEPLOY_TONE, ENV_TONE, MIGRATIONS, stamp, type Deploy } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { InlineConfirm } from "@/components/cards/InlineConfirm";
import { logAudit, pickedRow } from "./parts";

export function DeploysScreen() {
  const [rows, setRows] = React.useState<Deploy[]>(DEPLOYS);
  const [ask, setAsk] = React.useState<string | null>(null);

  const prod = rows.find((d) => d.env === "Production" && d.status === "Live");
  const staging = rows.find((d) => d.env === "Staging" && d.status === "Live");
  const applied = MIGRATIONS.filter((m) => m.status === "Applied").at(-1);
  const pending = MIGRATIONS.filter((m) => m.status === "Pending");
  const target = rows.find((d) => d.id === ask) ?? null;

  const rollBack = (to: Deploy) => {
    const n = new Date();
    const t = new Date(TODAY);
    t.setHours(n.getHours(), n.getMinutes());
    const from = prod?.version ?? "";
    setRows((rs) => [
      { ...to, id: `rb${t.getTime()}`, at: t, by: "Farhath", duration: "1 min 20 s", status: "Live", note: `Roll back from ${from}` },
      ...rs.map((d) => (d.env === "Production" && d.status === "Live" ? { ...d, status: "Rolled back" as const } : d)),
    ]);
    logAudit("Roll back", `Production to ${to.version}`);
    setAsk(null);
  };

  const columns: Column<Deploy>[] = [
    {
      key: "version",
      label: "Version",
      mono: true,
      render: (d) => (
        <span className="whitespace-nowrap">
          <b className="font-semibold">{d.version}</b> <span className="text-faint">{d.commit}</span>
        </span>
      ),
    },
    { key: "env", label: "Environment", render: (d) => <Tag tone={ENV_TONE[d.env]}>{d.env}</Tag> },
    { key: "when", label: "When", mono: true, render: (d) => <span className="whitespace-nowrap">{stamp(d.at)}</span> },
    { key: "by", label: "By", render: (d) => <span className="whitespace-nowrap">{d.by}</span> },
    { key: "dur", label: "Duration", render: (d) => <span className="whitespace-nowrap">{d.duration}</span> },
    { key: "status", label: "Status", width: 124, render: (d) => <Chip fixed tone={DEPLOY_TONE[d.status]}>{d.status}</Chip> },
    {
      key: "act",
      label: "",
      width: 1,
      render: (d) =>
        d.env === "Production" && d.status === "Succeeded" ? (
          <Button size="sm" onClick={() => setAsk(d.id)}>
            Roll back
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard title="Current">
        <KeyValue
          cols={2}
          rows={[
            { k: "Production · app.sbctrack.in", v: prod ? `${prod.version} · ${prod.commit}` : "-", mono: true },
            { k: "Staging · staging.sbctrack.in", v: staging ? `${staging.version} · ${staging.commit}` : "-", mono: true },
            { k: "Last migration", v: applied ? `${applied.id} · ${applied.at ? fmt(applied.at) : ""}` : "-", mono: true },
            { k: "Pending migrations", v: pending.map((m) => m.id).join(", ") || "None", mono: true },
          ]}
        />
      </SectionCard>
      <SectionCard title="Deploy history" bare flush>
        <DataGrid inset title="Deploy history" columns={columns} rows={rows} rowKey={(d) => d.id} rowClass={(d) => (d.id === ask ? pickedRow : undefined)} />
        {target && <InlineConfirm question={`Roll back production to ${target.version}?`} confirm="Roll back" onConfirm={() => rollBack(target)} onCancel={() => setAsk(null)} />}
      </SectionCard>
    </div>
  );
}
