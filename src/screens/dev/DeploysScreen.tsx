"use client";
import * as React from "react";
import { DEPLOYS, DEPLOY_TONE, ENVIRONMENTS, ENV_TONE, FLAGS, MIGRATIONS, RELEASE_NOTES, stamp, type Deploy, type Environment, type Flag, type Migration } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Switch } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { InlineConfirm } from "@/components/cards/InlineConfirm";
import { ChangeConfirm } from "@/components/cards/ChangeConfirm";
import { CloseButton, logAudit, nowToday, useRevealRef } from "./parts";
import { envColumns } from "./OverviewScreen";

export function DeploysScreen() {
  const [rows, setRows] = React.useState<Deploy[]>(DEPLOYS);
  const [envs, setEnvs] = React.useState<Environment[]>(ENVIRONMENTS);
  const [migs, setMigs] = React.useState<Migration[]>(MIGRATIONS);
  const [flags, setFlags] = React.useState<Flag[]>(FLAGS);
  const [flagEnv, setFlagEnv] = React.useState("all");
  const [ask, setAsk] = React.useState<string | null>(null);
  const [askDeploy, setAskDeploy] = React.useState(false);
  const [askMig, setAskMig] = React.useState(false);
  const [picked, setPicked] = React.useState<string | null>(null);
  const reveal = useRevealRef<HTMLDivElement>(picked);

  const prod = rows.find((d) => d.env === "Production" && d.status === "Live");
  const staging = rows.find((d) => d.env === "Staging" && d.status === "Live");
  const pending = migs.filter((m) => m.status === "Pending");
  const target = rows.find((d) => d.id === ask) ?? null;
  const cur = rows.find((d) => d.id === picked) ?? null;

  const rollBack = (to: Deploy) => {
    const t = nowToday();
    const from = prod?.version ?? "";
    setRows((rs) => [
      { ...to, id: `rb${t.getTime()}`, at: t, by: "Farhath", duration: "1 min 20 s", status: "Live", note: `Roll back from ${from}` },
      ...rs.map((d) => (d.env === "Production" && d.status === "Live" ? { ...d, status: "Rolled back" as const } : d)),
    ]);
    setEnvs((es) => es.map((e) => (e.id === "prod" ? { ...e, version: to.version, commit: to.commit, deployed: t } : e)));
    logAudit("Roll back", `Production to ${to.version}`, "Done", from, to.version);
    setAsk(null);
  };

  const deployMain = () => {
    if (!staging) return;
    const t = nowToday();
    const from = prod?.version ?? "";
    setRows((rs) => [
      { ...staging, id: `dp${t.getTime()}`, env: "Production", at: t, by: "Farhath", duration: "4 min 6 s", status: "Live" },
      ...rs.map((d) => (d.env === "Production" && d.status === "Live" ? { ...d, status: "Succeeded" as const } : d)),
    ]);
    setEnvs((es) => es.map((e) => (e.id === "prod" ? { ...e, version: staging.version, commit: staging.commit, deployed: t, by: "Farhath" } : e)));
    logAudit("Deploy", `Production ${staging.version}`, "Done", from, staging.version);
    setAskDeploy(false);
  };

  const runMigrations = () => {
    const t = nowToday();
    setMigs((ms) => ms.map((m) => (m.status === "Pending" ? { ...m, status: "Applied", at: t } : m)));
    logAudit("Run migrations", pending.map((m) => m.id).join(", "), "Done", `${pending.length} pending`, "Applied");
    setAskMig(false);
  };

  const flip = (f: Flag, on: boolean) => {
    setFlags((fs) => fs.map((x) => (x.id === f.id ? { ...x, on, by: "Farhath", at: nowToday() } : x)));
    logAudit("Change flag", `${f.name} (${f.env})`, "Done", f.on ? "On" : "Off", on ? "On" : "Off");
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
    { key: "note", label: "What changed", render: (d) => <span className="block min-w-[200px] text-12.5">{d.note}</span> },
    { key: "dur", label: "Duration", render: (d) => <span className="whitespace-nowrap">{d.duration}</span> },
    { key: "status", label: "Status", width: 124, render: (d) => <Chip fixed tone={DEPLOY_TONE[d.status]}>{d.status}</Chip> },
    {
      key: "act",
      label: "",
      width: 1,
      render: (d) =>
        d.env === "Production" && d.status === "Succeeded" ? (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setAsk(d.id);
            }}
          >
            Roll back
          </Button>
        ) : null,
    },
  ];

  const migColumns: Column<Migration>[] = [
    { key: "id", label: "Migration", mono: true, render: (m) => <span className="whitespace-nowrap font-semibold">{m.id}</span> },
    { key: "what", label: "What it does", render: (m) => <span className="block min-w-[180px]">{m.what}</span> },
    { key: "status", label: "Status", width: 124, render: (m) => <Chip fixed tone={m.status === "Applied" ? "ok" : "warn"}>{m.status}</Chip> },
    { key: "at", label: "Applied", mono: true, render: (m) => <span className="whitespace-nowrap">{m.at ? stamp(m.at) : "-"}</span> },
  ];

  const shownFlags = flags.filter((f) => flagEnv === "all" || f.env === flagEnv);
  const flagColumns: Column<Flag>[] = [
    {
      key: "flag",
      label: "Flag",
      render: (f) => (
        <span className="block min-w-[200px]">
          <b className="font-semibold">{f.name}</b>
          <span className="block font-mono text-12 text-muted">{f.id}</span>
        </span>
      ),
    },
    { key: "env", label: "Environment", render: (f) => <Tag tone={ENV_TONE[f.env]}>{f.env}</Tag> },
    { key: "who", label: "Who sees it", render: (f) => <span className="block min-w-[140px] text-12.5">{f.who}</span> },
    { key: "on", label: "On", align: "center", render: (f) => <Switch on={f.on} onChange={(v) => flip(f, v)} label={f.name} /> },
    { key: "by", label: "Changed by", render: (f) => <span className="whitespace-nowrap">{f.by}</span> },
    { key: "at", label: "When", mono: true, render: (f) => <span className="whitespace-nowrap">{stamp(f.at)}</span> },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard title="Environments" bare flush>
        <DataGrid
          inset
          title="Environments"
          columns={envColumns}
          rows={envs}
          rowKey={(e) => e.id}
          filters={
            <Button size="sm" variant="primary" onClick={() => setAskDeploy(true)} disabled={!staging || staging.version === prod?.version} aria-expanded={askDeploy}>
              Deploy main
            </Button>
          }
        />
        {askDeploy && staging && (
          <ChangeConfirm
            question={`Deploy ${staging.version} to production? App Runner pulls the new image.`}
            confirm="Deploy"
            before={prod?.version}
            after={staging.version}
            onConfirm={deployMain}
            onCancel={() => setAskDeploy(false)}
          />
        )}
      </SectionCard>

      <SectionCard title="Deploy history" bare flush>
        <DataGrid
          inset
          title="Deploy history"
          meta="App Runner · from main"
          columns={columns}
          rows={rows}
          rowKey={(d) => d.id}
          onRowClick={(d) => setPicked((p) => (p === d.id ? null : d.id))}
          selectedKey={ask ?? picked ?? undefined}
        />
        {target && <InlineConfirm question={`Roll back production to ${target.version}?`} confirm="Roll back" onConfirm={() => rollBack(target)} onCancel={() => setAsk(null)} />}
      </SectionCard>
      {cur && (
        <div ref={reveal}>
          <SectionCard title="Release notes" meta={`${cur.version} · ${cur.env}`} flush right={<CloseButton onClick={() => setPicked(null)} />}>
            <div className="px-4 py-4 md:px-5">
              <KeyValue
                cols={3}
                rows={[
                  { k: "Commit", v: cur.commit, mono: true },
                  { k: "Deployed", v: `${stamp(cur.at)} · ${cur.by}` },
                  { k: "Duration", v: cur.duration },
                ]}
              />
            </div>
            <ul className="border-t border-line-soft">
              {(RELEASE_NOTES[cur.version] ?? [cur.note]).map((n) => (
                <li key={n} className="border-t border-line-soft px-4 py-2.5 text-13.5 first:border-t-0 md:px-5">
                  {n}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}

      <SectionCard title="Database migrations" bare flush>
        <DataGrid
          inset
          title="Database migrations"
          meta={`${pending.length} pending`}
          columns={migColumns}
          rows={migs}
          rowKey={(m) => m.id}
          filters={
            <Button size="sm" onClick={() => setAskMig(true)} disabled={!pending.length} aria-expanded={askMig}>
              Run migrations
            </Button>
          }
        />
        {askMig && (
          <ChangeConfirm
            question={`Apply ${pending.length} migrations to the production database? A backup is taken first.`}
            confirm="Run migrations"
            before={`${pending.length} pending`}
            after="Applied"
            onConfirm={runMigrations}
            onCancel={() => setAskMig(false)}
          />
        )}
      </SectionCard>

      <DataGrid
        title="Feature flags"
        columns={flagColumns}
        rows={shownFlags}
        rowKey={(f) => f.id}
        filters={
          <Tabs
            items={[
              { key: "all", label: "All", count: flags.length },
              { key: "Production", label: "Production", count: flags.filter((f) => f.env === "Production").length },
              { key: "Staging", label: "Staging", count: flags.filter((f) => f.env === "Staging").length },
            ]}
            value={flagEnv}
            onChange={setFlagEnv}
          />
        }
      />
    </div>
  );
}
