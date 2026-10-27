"use client";
import * as React from "react";
import { TODAY, fmt, fmtYear, daysFrom } from "@/lib/dates";
import { API_KEYS, CONSOLE_SETTINGS, CONSOLE_USERS, stamp, type ApiKey, type ConsoleUser } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Switch } from "@/components/ui/Input";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { InlineConfirm } from "@/components/cards/InlineConfirm";
import { logAudit, pickedRow } from "./parts";

type Ask = { id: string; kind: "rotate" | "revoke" } | null;

interface LiveKey extends ApiKey {
  revoked?: boolean;
}

const day = (d: Date | null) => (d ? (d.getFullYear() === TODAY.getFullYear() ? fmt(d) : fmtYear(d)) : "-");

const userColumns: Column<ConsoleUser>[] = [
  { key: "name", label: "Name", render: (u) => <span className="whitespace-nowrap font-semibold">{u.name}</span> },
  { key: "role", label: "Role", render: (u) => <span className="whitespace-nowrap">{u.role}</span> },
  { key: "2fa", label: "Two-step sign-in", width: 124, render: (u) => <Chip fixed tone={u.twoFactor === "On" ? "ok" : u.twoFactor === "Off" ? "warn" : "idle"}>{u.twoFactor}</Chip> },
  { key: "last", label: "Last sign-in", mono: true, render: (u) => <span className="whitespace-nowrap">{stamp(u.lastSignIn)}</span> },
];

export function AccessScreen() {
  const [keys, setKeys] = React.useState<LiveKey[]>(API_KEYS);
  const [ask, setAsk] = React.useState<Ask>(null);
  const [settings, setSettings] = React.useState(CONSOLE_SETTINGS);

  const target = ask ? keys.find((k) => k.id === ask.id) ?? null : null;

  const confirm = () => {
    if (!ask || !target) return;
    if (ask.kind === "rotate") {
      setKeys((ks) => ks.map((k) => (k.id === target.id ? { ...k, created: TODAY, missing: false, prefix: k.missing ? "Secrets Manager" : k.prefix, expires: k.expires ? new Date(TODAY.getTime() + 180 * 86400000) : null } : k)));
      logAudit("Rotate key", target.name);
    } else {
      setKeys((ks) => ks.map((k) => (k.id === target.id ? { ...k, revoked: true } : k)));
      logAudit("Revoke key", target.name);
    }
    setAsk(null);
  };

  const keyColumns: Column<LiveKey>[] = [
    { key: "name", label: "Name", render: (k) => <span className={k.revoked ? "whitespace-nowrap text-faint line-through" : "whitespace-nowrap font-semibold"}>{k.name}</span> },
    { key: "prefix", label: "Prefix", mono: true, render: (k) => <span className={k.missing ? "font-semibold text-bad" : "whitespace-nowrap"}>{k.prefix}</span> },
    { key: "scope", label: "Scope", render: (k) => <span className="whitespace-nowrap">{k.scope}</span> },
    { key: "created", label: "Created", render: (k) => <span className="whitespace-nowrap">{day(k.created)}</span> },
    {
      key: "expires",
      label: "Expires",
      render: (k) =>
        k.missing ? (
          <Chip tone="bad">Missing</Chip>
        ) : k.revoked ? (
          <Chip tone="idle">Revoked</Chip>
        ) : (
          <span className={k.expires && daysFrom(k.expires) <= 15 ? "whitespace-nowrap font-semibold text-warn" : "whitespace-nowrap"}>{k.expires ? day(k.expires) : "None"}</span>
        ),
    },
    { key: "used", label: "Last used", mono: true, render: (k) => <span className="whitespace-nowrap">{k.lastUsed ? stamp(k.lastUsed) : "-"}</span> },
    {
      key: "act",
      label: "",
      width: 1,
      render: (k) =>
        k.revoked ? null : (
          <span className="flex items-center gap-1.5">
            <Button size="sm" onClick={() => setAsk({ id: k.id, kind: "rotate" })}>
              {k.missing ? "Set" : "Rotate"}
            </Button>
            {k.own && (
              <Button size="sm" onClick={() => setAsk({ id: k.id, kind: "revoke" })}>
                Revoke
              </Button>
            )}
          </span>
        ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard title="API keys" bare flush>
        <DataGrid inset title="API keys" columns={keyColumns} rows={keys} rowKey={(k) => k.id} rowClass={(k) => (ask?.id === k.id ? pickedRow : undefined)} />
        {target && ask && (
          <InlineConfirm
            question={ask.kind === "rotate" ? (target.missing ? `Set a new ${target.name}?` : `Rotate the key for ${target.name}?`) : `Revoke the key for ${target.name}?`}
            confirm={ask.kind === "rotate" ? (target.missing ? "Set" : "Rotate") : "Revoke"}
            onConfirm={confirm}
            onCancel={() => setAsk(null)}
          />
        )}
      </SectionCard>
      <DataGrid title="Users with console access" columns={userColumns} rows={CONSOLE_USERS} rowKey={(u) => u.id} />
      <SectionCard title="Console settings" flush>
        {settings.map((s) => (
          <ListRow key={s.id}>
            <span className="min-w-0 flex-1">{s.label}</span>
            <Switch
              on={s.on}
              label={s.label}
              onChange={(v) => {
                setSettings((ss) => ss.map((x) => (x.id === s.id ? { ...x, on: v } : x)));
                logAudit("Change setting", `${s.label}: ${v ? "on" : "off"}`);
              }}
            />
          </ListRow>
        ))}
      </SectionCard>
    </div>
  );
}
