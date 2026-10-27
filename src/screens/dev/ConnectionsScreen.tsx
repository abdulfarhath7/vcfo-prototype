"use client";
import * as React from "react";
import { TODAY, fmt, fmtYear, daysFrom } from "@/lib/dates";
import { CONNECTIONS, CONN_TONE, stamp, type ConnEvent, type ConnStatus, type Connection } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { InlineConfirm } from "@/components/cards/InlineConfirm";
import { BlockLabel, CloseButton, PickCell, RowPicker, logAudit, pickedRow, rowTag, useRevealRef } from "./parts";

type Risky = "rotate" | "disconnect";

interface Live extends Connection {
  off?: boolean;
}

function expiry(c: Live) {
  if (!c.authExpires) return <span className="text-faint">None</span>;
  const n = daysFrom(c.authExpires);
  return <span className={n <= 15 ? "font-semibold text-warn" : undefined}>{c.authExpires.getFullYear() === TODAY.getFullYear() ? fmt(c.authExpires) : fmtYear(c.authExpires)}</span>;
}

function Detail({ c, risky, setRisky, onClose, onConfirm }: { c: Live; risky: Risky | null; setRisky: (r: Risky | null) => void; onClose: () => void; onConfirm: (r: Risky) => void }) {
  return (
    <SectionCard title={c.name} meta={c.provider} flush right={<CloseButton onClick={onClose} />}>
      <div className="px-4 py-4 md:px-5">
        <KeyValue
          rows={[
            { k: "Endpoint", v: c.endpoint, mono: true },
            { k: "Webhook URL", v: c.webhook ?? "None", mono: !!c.webhook },
            { k: "Account", v: c.account },
            { k: "Auth expires", v: expiry(c) },
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
      <BlockLabel>Last 5 events</BlockLabel>
      <ul>
        {c.events.slice(0, 5).map((e, i) => (
          <li key={i} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13 first:border-t-0 md:px-5">
            <span className="w-[92px] flex-none font-mono text-12 text-muted">{stamp(e.at)}</span>
            <span className="min-w-0 flex-1 truncate">{e.text}</span>
            {e.chip && <Chip tone={e.tone}>{e.chip}</Chip>}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
        {c.hasKey && (
          <Button size="sm" onClick={() => setRisky("rotate")} disabled={c.off}>
            Rotate key
          </Button>
        )}
        <Button size="sm" onClick={() => setRisky("disconnect")} disabled={c.off}>
          Disconnect
        </Button>
      </div>
      {risky && (
        <InlineConfirm
          question={risky === "rotate" ? `Rotate the key for ${c.name}?` : `Disconnect ${c.name}?`}
          confirm={risky === "rotate" ? "Rotate" : "Disconnect"}
          onConfirm={() => onConfirm(risky)}
          onCancel={() => setRisky(null)}
        />
      )}
    </SectionCard>
  );
}

export function ConnectionsScreen() {
  const [rows, setRows] = React.useState<Live[]>(CONNECTIONS);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [risky, setRisky] = React.useState<Risky | null>(null);
  const [tab, setTab] = React.useState("all");
  const reveal = useRevealRef<HTMLDivElement>(picked);

  const now = () => {
    const n = new Date();
    const t = new Date(TODAY);
    t.setHours(n.getHours(), n.getMinutes());
    return t;
  };
  const update = (id: string, f: (c: Live) => Partial<Live>, ev?: ConnEvent) =>
    setRows((rs) => rs.map((c) => (c.id === id ? { ...c, ...f(c), events: ev ? [ev, ...c.events] : c.events } : c)));

  const pick = (id: string) => {
    setPicked((p) => (p === id ? null : id));
    setRisky(null);
  };

  const test = (c: Live) => {
    const ok = c.status !== "Offline";
    update(c.id, () => ({ lastSync: now() }), { at: now(), text: ok ? "Test passed" : "Test failed: no answer", chip: ok ? "OK" : "Failed", tone: ok ? "ok" : "bad" });
    logAudit("Test", c.name, ok ? "Done" : "Failed");
  };
  const reconnect = (c: Live) => {
    const expires = c.hasKey ? new Date(TODAY.getTime() + 90 * 86400000) : c.authExpires;
    update(c.id, () => ({ status: "Connected" as ConnStatus, authExpires: c.status === "Needs re-auth" ? expires : c.authExpires, lastSync: now(), off: false }), { at: now(), text: "Reconnected", chip: "OK", tone: "ok" });
    logAudit("Reconnect", c.name);
  };
  const confirm = (c: Live, r: Risky) => {
    if (r === "rotate") {
      update(c.id, () => ({}), { at: now(), text: "Key rotated. The old key works for 24 hours.", chip: "OK", tone: "ok" });
      logAudit("Rotate key", c.name);
    } else {
      update(c.id, () => ({ status: "Offline" as ConnStatus, off: true }), { at: now(), text: "Disconnected by Farhath", chip: "Off", tone: "idle" });
      logAudit("Disconnect", c.name);
    }
    setRisky(null);
  };

  const attention = rows.filter((c) => c.status !== "Connected");
  const shown = tab === "attention" ? attention : rows;
  const cur = rows.find((c) => c.id === picked) ?? null;

  const columns: Column<Live>[] = [
    {
      key: "service",
      label: "Service",
      render: (c) => (
        <span className="block min-w-[180px]">
          <PickCell on={picked === c.id} onPick={() => pick(c.id)}>
            {c.name}
          </PickCell>
          <span className="block truncate text-12 text-muted">{c.provider}</span>
        </span>
      ),
    },
    { key: "kind", label: "Kind", render: (c) => <span className="whitespace-nowrap">{c.kind}</span> },
    { key: "status", label: "Status", width: 124, render: (c) => <Chip fixed tone={c.off ? "idle" : CONN_TONE[c.status]}>{c.off ? "Off" : c.status}</Chip> },
    { key: "sync", label: "Last sync", mono: true, render: (c) => <span className="whitespace-nowrap">{stamp(c.lastSync)}</span> },
    { key: "exp", label: "Auth expires", render: (c) => <span className="whitespace-nowrap">{expiry(c)}</span> },
    {
      key: "act",
      label: "",
      width: 1,
      render: (c) => (
        <span className="flex items-center gap-1.5">
          <Button size="sm" onClick={() => test(c)}>
            Test
          </Button>
          <Button size="sm" onClick={() => reconnect(c)}>
            Reconnect
          </Button>
          <Button
            size="sm"
            disabled={!c.hasKey || c.off}
            onClick={() => {
              setPicked(c.id);
              setRisky("rotate");
            }}
          >
            Rotate key
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <RowPicker onPick={pick}>
        <DataGrid
          title="Connected services"
          columns={columns}
          rows={shown}
          rowKey={(c) => c.id}
          pageSize={15}
          rowClass={(c) => `cursor-pointer ${rowTag(c.id)} ${picked === c.id ? pickedRow : ""}`}
          filters={
            <Tabs
              items={[
                { key: "all", label: "All", count: rows.length },
                { key: "attention", label: "Needs attention", count: attention.length },
              ]}
              value={tab}
              onChange={setTab}
            />
          }
        />
      </RowPicker>
      {cur && (
        <div ref={reveal}>
          <Detail c={cur} risky={risky} setRisky={setRisky} onClose={() => pick(cur.id)} onConfirm={(r) => confirm(cur, r)} />
        </div>
      )}
    </div>
  );
}
