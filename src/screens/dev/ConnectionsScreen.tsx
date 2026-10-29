"use client";
import * as React from "react";
import { STAFF_TODAY, fmt, fmtYear, daysFrom } from "@/lib/dates";
import { CONNECTIONS, CONN_TONE, stamp, type ConnEvent, type ConnStatus, type Connection } from "@/data/dev";
import { detailFor } from "@/data/dev-connections";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { DangerConfirm } from "@/components/ui/DangerConfirm";
import { RotateCw } from "lucide-react";
import { CloseButton, FilterChip, PickCell, StatusChip, ident, logAudit, nowToday, useRevealRef } from "./parts";
import { ConnSections, ConnectFlow } from "./conn-detail";

interface Live extends Connection {
  off?: boolean;
}

const isOff = (c: Live) => c.status === "Not connected";

function expiry(c: Live) {
  if (!c.authExpires) return <span className="text-faint">None</span>;
  const n = daysFrom(c.authExpires, STAFF_TODAY);
  return <span className={n <= 15 ? "font-medium text-warn" : undefined}>{c.authExpires.getFullYear() === STAFF_TODAY.getFullYear() ? fmt(c.authExpires) : fmtYear(c.authExpires)}</span>;
}

/** Head of the detail: summary facts, scopes, account edit, key rotation. */
function Summary({ c, rotating, setRotating, onRotate, onAccount, onClose }: { c: Live; rotating: boolean; setRotating: (v: boolean) => void; onRotate: () => void; onAccount: (v: string) => void; onClose: () => void }) {
  const [edit, setEdit] = React.useState<string | null>(null);
  const status = c.off ? "Off" : c.status;
  return (
    <SectionCard
      title={c.name}
      meta={c.provider}
      flush
      right={
        <>
          <StatusChip wide tone={c.off ? "idle" : CONN_TONE[c.status]}>{status}</StatusChip>
          <CloseButton onClick={onClose} />
        </>
      }
    >
      <div className="px-4 py-4 md:px-5">
        <KeyValue
          wrap
          rows={[
            { k: "Endpoint", v: c.endpoint, mono: ident(c.endpoint) },
            { k: "Webhook URL", v: c.webhook ?? "None", mono: !!c.webhook && ident(c.webhook) },
            { k: "Account", v: c.account },
            { k: "Last check", v: isOff(c) ? "-" : stamp(c.lastSync) },
            { k: "Auth expires", v: expiry(c) },
            { k: "Secret", v: c.secret ?? (c.hasKey ? "•••• •••• ••••" : "None stored. IAM role."), mono: c.secret ? ident(c.secret) : c.hasKey },
          ]}
        />
        <div className="mt-3">
          <div className="text-12 text-muted">Scopes</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {c.scopes.map((s) => (
              <Tag key={s} className="font-mono font-medium">
                {s}
              </Tag>
            ))}
          </div>
        </div>
      </div>
      {edit !== null ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-line-soft bg-raised px-4 py-2.5 md:px-5">
          <Input aria-label="Account" value={edit} onChange={(e) => setEdit(e.target.value)} className="h-[30px] min-w-0 flex-1 text-12.5 sm:max-w-[360px]" autoFocus />
          <Button
            size="sm"
            variant="primary"
            disabled={!edit.trim() || edit.trim() === c.account}
            onClick={() => {
              onAccount(edit.trim());
              setEdit(null);
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEdit(null)}>
            Cancel
          </Button>
        </div>
      ) : (
        !isOff(c) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
            <Button size="sm" onClick={() => setEdit(c.account)} disabled={c.off}>
              Edit account
            </Button>
            {c.hasKey && (
              <Button size="sm" onClick={() => setRotating(true)} disabled={c.off} aria-haspopup="dialog">
                Rotate key
              </Button>
            )}
          </div>
        )
      )}
      {/* M1: type the word before the key changes. */}
      <DangerConfirm
        open={rotating}
        onOpenChange={setRotating}
        title={`Rotate the key for ${c.name}?`}
        body={`${c.secret ? `The key ${c.secret} gets a new value. ` : ""}The old key works for 24 hours.`}
        word="ROTATE"
        confirm="Rotate key"
        icon={RotateCw}
        onConfirm={onRotate}
      />
    </SectionCard>
  );
}

export function ConnectionsScreen() {
  const [rows, setRows] = React.useState<Live[]>(CONNECTIONS);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [rotating, setRotating] = React.useState(false);
  const [tab, setTab] = React.useState("all");
  const [kind, setKind] = React.useState("all");
  const reveal = useRevealRef<HTMLDivElement>(picked);

  // Deep link from the overview: /dev/connections?c=teams
  React.useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("c");
    if (id && CONNECTIONS.some((c) => c.id === id)) setPicked(id);
  }, []);

  const update = (id: string, f: (c: Live) => Partial<Live>, ev?: ConnEvent) =>
    setRows((rs) => rs.map((c) => (c.id === id ? { ...c, ...f(c), events: ev ? [ev, ...c.events] : c.events } : c)));

  const pick = (id: string) => {
    setPicked((p) => (p === id ? null : id));
    setRotating(false);
  };

  const test = (c: Live) => {
    const ok = c.status !== "Offline" && !c.off;
    update(c.id, () => ({ lastSync: nowToday() }), { at: nowToday(), text: ok ? "Test passed" : "Test failed: no answer", chip: ok ? "OK" : "Failed", tone: ok ? "ok" : "bad" });
    logAudit("Test", c.name, ok ? "Done" : "Failed");
  };
  const sendTest = (c: Live, to: string, via: string) => {
    update(c.id, () => ({ lastSync: nowToday() }), { at: nowToday(), text: `Test sent through ${via} to ${to}`, chip: "OK", tone: "ok" });
    logAudit("Send test", `${c.name} to ${to}`);
  };
  const reconnect = (c: Live) => {
    const expires = c.hasKey ? new Date(STAFF_TODAY.getTime() + 90 * 86400000) : c.authExpires;
    update(c.id, () => ({ status: "Connected" as ConnStatus, authExpires: c.status === "Needs re-auth" ? expires : c.authExpires, lastSync: nowToday(), off: false }), { at: nowToday(), text: "Reconnected", chip: "OK", tone: "ok" });
    logAudit("Reconnect", c.name, "Done", c.off ? "Off" : c.status, "Connected");
  };
  const connect = (c: Live) => {
    update(c.id, () => ({ status: "Connected" as ConnStatus, account: "Connected by Farhath", lastSync: nowToday() }), { at: nowToday(), text: "Connected by Farhath", chip: "OK", tone: "ok" });
    logAudit("Connect", c.name, "Done", "Not connected", "Connected");
  };
  const rotate = (c: Live) => {
    update(c.id, () => ({}), { at: nowToday(), text: "Key rotated. The old key works for 24 hours.", chip: "OK", tone: "ok" });
    logAudit("Rotate key", c.name, "Done", c.secret ?? "Current key", "New key");
    setRotating(false);
  };
  const disconnect = (c: Live) => {
    update(c.id, () => ({ status: "Offline" as ConnStatus, off: true }), { at: nowToday(), text: "Disconnected by Farhath", chip: "Off", tone: "idle" });
    logAudit("Disconnect", c.name, "Done", c.status, "Not connected");
  };
  const account = (c: Live, v: string) => {
    logAudit("Change setting", `${c.name} account`, "Done", c.account, v);
    update(c.id, () => ({ account: v }));
  };

  const kinds = Array.from(new Set(rows.map((c) => c.kind)));
  const attention = rows.filter((c) => !isOff(c) && (c.status !== "Connected" || c.off));
  const notConnected = rows.filter(isOff);
  const byTab = tab === "attention" ? attention : tab === "off" ? notConnected : rows;
  const shown = byTab.filter((c) => kind === "all" || c.kind === kind);
  const cur = rows.find((c) => c.id === picked) ?? null;

  const columns: Column<Live>[] = [
    {
      key: "service",
      label: "Service",
      render: (c) => (
        <span className="block w-[210px] min-w-0">
          <PickCell on={picked === c.id} onPick={() => pick(c.id)}>
            {c.name}
          </PickCell>
          <span className="block truncate text-12 text-muted">
            {c.kind} · {c.provider}
          </span>
        </span>
      ),
    },
    { key: "status", label: "Status", width: 144, render: (c) => <StatusChip wide tone={c.off ? "idle" : CONN_TONE[c.status]}>{c.off ? "Off" : c.status}</StatusChip> },
    { key: "account", label: "Account", render: (c) => <span className="block min-w-[150px] text-12.5">{c.account}</span> },
    { key: "sync", label: "Last check", render: (c) => <span className="whitespace-nowrap">{isOff(c) ? "-" : stamp(c.lastSync)}</span> },
    { key: "exp", label: "Auth expires", render: (c) => <span className="whitespace-nowrap">{expiry(c)}</span> },
    {
      key: "act",
      label: "Action",
      width: 1,
      render: (c) =>
        isOff(c) ? (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setPicked(c.id);
            }}
          >
            Connect
          </Button>
        ) : (
          <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" onClick={() => test(c)}>
              Test
            </Button>
            {/* Reconnect only where the link is broken; the row stays inside the card at 1440 px. */}
            {(c.status !== "Connected" || c.off) && (
              <Button size="sm" onClick={() => reconnect(c)}>
                Reconnect
              </Button>
            )}
            {c.hasKey && (
              <Button
                size="sm"
                disabled={c.off}
                onClick={() => {
                  setPicked(c.id);
                  setRotating(true);
                }}
              >
                Rotate key
              </Button>
            )}
          </span>
        ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <DataGrid
        title="Connected services"
        columns={columns}
        rows={shown}
        rowKey={(c) => c.id}
        pageSize={20}
        onRowClick={(c) => pick(c.id)}
        selectedKey={picked ?? undefined}
        empty="No services match"
        filters={
          <>
            <FilterChip label="Kind" value={kind} onChange={setKind} options={kinds.map((k) => ({ value: k, label: k }))} />
            <Tabs
              items={[
                { key: "all", label: "All", count: rows.length },
                { key: "attention", label: "Needs attention", count: attention.length },
                { key: "off", label: "Not connected", count: notConnected.length },
              ]}
              value={tab}
              onChange={setTab}
            />
          </>
        }
      />
      {cur && (
        <div ref={reveal} className="grid grid-cols-1 gap-5">
          <Summary c={cur} rotating={rotating} setRotating={setRotating} onRotate={() => rotate(cur)} onAccount={(v) => account(cur, v)} onClose={() => pick(cur.id)} />
          {isOff(cur) && <ConnectFlow key={cur.id} c={cur} onConnect={() => connect(cur)} onCancel={() => pick(cur.id)} />}
          <ConnSections key={`s-${cur.id}`} c={cur} sections={detailFor(cur.id, cur.lines, cur.name, isOff(cur))} off={!!cur.off} onTest={(to, via) => sendTest(cur, to, via)} onDisconnect={() => disconnect(cur)} />
        </div>
      )}
    </div>
  );
}
