"use client";
import * as React from "react";
import { STAFF_TODAY, fmt, fmtYear, daysFrom } from "@/lib/dates";
import { API_KEYS, CONSOLE_SETTINGS, CONSOLE_USERS, ROLES, SERVICE_ACCOUNTS, SESSIONS, SIGNIN, stamp, type ApiKey, type ConsoleUser, type ServiceAccount, type Session } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Switch } from "@/components/ui/Input";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { InlineConfirm } from "@/components/cards/InlineConfirm";
import { ChangeConfirm } from "@/components/cards/ChangeConfirm";
import { StackedBar, type Segment } from "@/components/cards/StackedBar";
import { Cols, Col } from "@/components/shell/Page";
import { ChoiceRow, SettingRow, SwitchRow, logAudit, useSwitch } from "./parts";

type Kind = "rotate" | "revoke" | "set" | "purge";
type Ask = { id: string; kind: Kind } | null;

interface LiveKey extends ApiKey {
  revoked?: boolean;
  purged?: boolean;
}

const day = (d: Date | null) => (d ? (d.getFullYear() === STAFF_TODAY.getFullYear() ? fmt(d) : fmtYear(d)) : "-");

function keyStatus(k: LiveKey): { label: string; tone: "ok" | "warn" | "bad" | "idle" } {
  if (k.revoked) return { label: "Revoked", tone: "idle" };
  if (k.purged) return { label: "Purged", tone: "idle" };
  if (k.missing) return { label: "Missing", tone: "bad" };
  if (k.purge) return { label: "Before launch", tone: "warn" };
  if (k.expires && daysFrom(k.expires, STAFF_TODAY) <= 15) return { label: `${daysFrom(k.expires, STAFF_TODAY)} days left`, tone: "warn" };
  return { label: "Working", tone: "ok" };
}

const userColumns: Column<ConsoleUser>[] = [
  { key: "name", label: "Name", render: (u) => <span className="whitespace-nowrap font-semibold">{u.name}</span> },
  { key: "role", label: "Role", render: (u) => <span className="whitespace-nowrap">{u.role}</span> },
  { key: "2fa", label: "Two-step sign-in", width: 124, render: (u) => <Chip fixed tone={u.twoFactor === "On" ? "ok" : u.twoFactor === "Off" ? "warn" : "idle"}>{u.twoFactor}</Chip> },
  { key: "last", label: "Last sign-in", mono: true, render: (u) => <span className="whitespace-nowrap">{stamp(u.lastSignIn)}</span> },
];

const roleColumns: Column<(typeof ROLES)[number]>[] = [
  { key: "role", label: "Role", render: (r) => <span className="whitespace-nowrap font-semibold">{r.role}</span> },
  { key: "people", label: "People", align: "right", render: (r) => r.people },
  { key: "can", label: "Can open", render: (r) => <span className="block min-w-[140px]">{r.can}</span> },
];

const saColumns: Column<ServiceAccount>[] = [
  { key: "name", label: "Account", mono: true, render: (a) => <span className="whitespace-nowrap font-semibold">{a.name}</span> },
  { key: "kind", label: "Kind", render: (a) => <span className="whitespace-nowrap">{a.kind}</span> },
  { key: "can", label: "Can", render: (a) => <span className="block min-w-[180px]">{a.can}</span> },
  { key: "used", label: "Last used", mono: true, render: (a) => <span className="whitespace-nowrap">{stamp(a.lastUsed)}</span> },
];

/** Two-step check for staff: turning it off asks first (R-40). */
function StaffTwoStep() {
  const [on, set] = useSwitch("acc-2fa-staff", true, "Require the two-step check for staff");
  const [ask, setAsk] = React.useState(false);
  return (
    <>
      <SettingRow label="Require the two-step check for staff" hint="Every admin, manager and project lead">
        <Switch on={on} onChange={(v) => (v ? set(true) : setAsk(true))} label="Require the two-step check for staff" />
      </SettingRow>
      {ask && (
        <ChangeConfirm
          question="Turn off the two-step check for staff? Staff sign in with a password only."
          confirm="Turn off"
          before="On"
          after="Off"
          onConfirm={() => {
            set(false);
            setAsk(false);
          }}
          onCancel={() => setAsk(false)}
        />
      )}
    </>
  );
}

export function AccessScreen() {
  const [keys, setKeys] = React.useState<LiveKey[]>(API_KEYS);
  const [ask, setAsk] = React.useState<Ask>(null);
  const [sessions, setSessions] = React.useState<Session[]>(SESSIONS);
  const [revoke, setRevoke] = React.useState<string | null>(null);

  const target = ask ? (keys.find((k) => k.id === ask.id) ?? null) : null;
  const sessTarget = sessions.find((s) => s.id === revoke) ?? null;

  const confirm = () => {
    if (!ask || !target) return;
    if (ask.kind === "rotate" || ask.kind === "set") {
      setKeys((ks) => ks.map((k) => (k.id === target.id ? { ...k, created: STAFF_TODAY, missing: false, prefix: k.missing ? "••••a7f0" : k.prefix, expires: k.expires ? new Date(STAFF_TODAY.getTime() + 180 * 86400000) : null } : k)));
      logAudit(ask.kind === "set" ? "Set key" : "Rotate key", target.name, "Done", target.missing ? "Not set" : "Current value", "New value");
    } else if (ask.kind === "purge") {
      setKeys((ks) => ks.map((k) => (k.id === target.id ? { ...k, purged: true } : k)));
      logAudit("Purge", target.name, "Done", target.scope, "Removed");
    } else {
      setKeys((ks) => ks.map((k) => (k.id === target.id ? { ...k, revoked: true } : k)));
      logAudit("Revoke key", target.name, "Done", "Active", "Revoked");
    }
    setAsk(null);
  };

  const question = (k: LiveKey, kind: Kind) =>
    kind === "set"
      ? `Set ${k.name}${k.where === "App Runner" ? " on App Runner and redeploy" : ""}?`
      : kind === "purge"
        ? `Remove ${k.name.toLowerCase()} from the production database?`
        : kind === "revoke"
          ? `Revoke the key for ${k.name}?`
          : `Rotate ${k.name}?`;

  const keyColumns: Column<LiveKey>[] = [
    {
      key: "name",
      label: "Name",
      render: (k) => (
        <span className="block min-w-0 max-w-[260px]">
          <span className={k.revoked || k.purged ? "block truncate font-mono text-faint line-through" : "block truncate font-mono font-semibold"}>{k.name}</span>
          <span className="block truncate text-12 text-muted">{k.scope}</span>
        </span>
      ),
    },
    { key: "where", label: "Stored in", render: (k) => <span className="whitespace-nowrap">{k.where}</span> },
    { key: "prefix", label: "Value", mono: true, render: (k) => <span className={k.missing ? "whitespace-nowrap font-semibold text-bad" : "whitespace-nowrap"}>{k.prefix}</span> },
    { key: "created", label: "Created", render: (k) => <span className="whitespace-nowrap">{day(k.created)}</span> },
    { key: "expires", label: "Expires", render: (k) => <span className={k.expires && daysFrom(k.expires, STAFF_TODAY) <= 15 ? "whitespace-nowrap font-semibold text-warn" : "whitespace-nowrap"}>{k.expires ? day(k.expires) : "None"}</span> },
    {
      key: "status",
      label: "Status",
      width: 124,
      render: (k) => {
        const s = keyStatus(k);
        return (
          <Chip fixed tone={s.tone}>
            {s.label}
          </Chip>
        );
      },
    },
    { key: "used", label: "Last used", mono: true, render: (k) => <span className="whitespace-nowrap">{k.lastUsed ? stamp(k.lastUsed) : "-"}</span> },
    {
      key: "act",
      label: "Action",
      width: 1,
      render: (k) =>
        k.revoked || k.purged ? null : (
          <span className="flex items-center gap-1.5">
            {k.purge ? (
              <Button size="sm" onClick={() => setAsk({ id: k.id, kind: "purge" })}>
                Purge
              </Button>
            ) : (
              <Button size="sm" onClick={() => setAsk({ id: k.id, kind: k.missing ? "set" : "rotate" })}>
                {k.missing ? "Set" : "Rotate"}
              </Button>
            )}
            {k.own && (
              <Button size="sm" onClick={() => setAsk({ id: k.id, kind: "revoke" })}>
                Revoke
              </Button>
            )}
          </span>
        ),
    },
  ];

  const sessColumns: Column<Session>[] = [
    {
      key: "person",
      label: "Person",
      render: (s) => (
        <span className="block whitespace-nowrap">
          <b className="font-semibold">{s.person}</b>
          <span className="block text-12 text-muted">{s.role}</span>
        </span>
      ),
    },
    { key: "device", label: "Device", render: (s) => <span className="whitespace-nowrap">{s.device}</span> },
    { key: "browser", label: "Browser", render: (s) => <span className="whitespace-nowrap">{s.browser}</span> },
    { key: "place", label: "Place", render: (s) => <span className="whitespace-nowrap">{s.place}</span> },
    { key: "since", label: "Since", mono: true, render: (s) => <span className="whitespace-nowrap">{stamp(s.since)}</span> },
    { key: "active", label: "Active", render: (s) => <span className="whitespace-nowrap">{s.active}</span> },
    {
      key: "act",
      label: "",
      width: 1,
      render: (s) =>
        s.you ? (
          <Tag tone="prog">You</Tag>
        ) : (
          <Button size="sm" onClick={() => setRevoke(s.id)} aria-expanded={revoke === s.id}>
            Revoke
          </Button>
        ),
    },
  ];

  const signinSegs: Segment[] = SIGNIN.map((m, i) => ({ label: `${m.label} · ${m.who}`, value: m.n, tone: (["navy", "accent", "teal"] as const)[i] }));

  return (
    <div className="grid grid-cols-1 gap-5">
      <Cols>
        <Col>
          <SectionCard title="Sign-in methods" meta="People, last 30 days">
            <StackedBar segments={signinSegs} format={(n) => `${n} people`} />
          </SectionCard>
          <SectionCard title="Sign-in rules" flush>
            <StaffTwoStep />
            <ChoiceRow k="acc-2fa" opts={["Staff only", "Everyone"]} initial={0} label="Two-step check" hint="An SMS code after the password" />
            <ChoiceRow k="acc-sess" opts={["8 hours", "24 hours", "7 days"]} initial={1} label="Session length" hint="Signed out after this long without use" />
          </SectionCard>
        </Col>
        <Col>
          <DataGrid title="Roles" meta="What each role can open" columns={roleColumns} rows={ROLES} rowKey={(r) => r.id} />
          <SectionCard title="Console settings" flush>
            {CONSOLE_SETTINGS.map((s) => (
              <SwitchRow key={s.id} k={s.id} initial={s.on} label={s.label} />
            ))}
          </SectionCard>
        </Col>
      </Cols>

      <SectionCard title="Sessions signed in now" bare flush>
        <DataGrid inset title="Sessions signed in now" meta={`${sessions.length} sessions`} columns={sessColumns} rows={sessions} rowKey={(s) => s.id} selectedKey={revoke ?? undefined} />
        {sessTarget && (
          <InlineConfirm
            question={`Revoke the session of ${sessTarget.person} on ${sessTarget.browser}, ${sessTarget.device}?`}
            confirm="Revoke"
            onConfirm={() => {
              setSessions((ss) => ss.filter((s) => s.id !== sessTarget.id));
              logAudit("Sign out", `${sessTarget.person} on ${sessTarget.device}`, "Done", "Signed in", "Signed out");
              setRevoke(null);
            }}
            onCancel={() => setRevoke(null)}
          />
        )}
      </SectionCard>

      <SectionCard title="Secrets and API keys" bare flush>
        <DataGrid inset title="Secrets and API keys" meta="Values never shown" columns={keyColumns} rows={keys} rowKey={(k) => k.id} pageSize={15} selectedKey={ask?.id} />
        {target && ask && (
          <ChangeConfirm
            question={question(target, ask.kind)}
            confirm={ask.kind === "set" ? "Set" : ask.kind === "purge" ? "Purge" : ask.kind === "revoke" ? "Revoke" : "Rotate"}
            before={ask.kind === "set" ? "Not set" : ask.kind === "purge" ? target.scope : target.prefix}
            after={ask.kind === "purge" ? "Removed" : ask.kind === "revoke" ? "Revoked" : "New value"}
            onConfirm={confirm}
            onCancel={() => setAsk(null)}
          />
        )}
      </SectionCard>



      <DataGrid title="Users with console access" columns={userColumns} rows={CONSOLE_USERS} rowKey={(u) => u.id} />
      <DataGrid title="Service accounts" columns={saColumns} rows={SERVICE_ACCOUNTS} rowKey={(a) => a.id} />
    </div>
  );
}
