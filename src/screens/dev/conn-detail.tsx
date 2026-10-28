"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { CONNECT_STEPS, DOMAIN, ROUTES, stamp, type ConnEvent, type Connection, type DomainRecord, type Route } from "@/data/dev";
import type { Section, SpecButton, SpecCell, SpecRow } from "@/data/dev-connections";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Checkbox, Input, Switch } from "@/components/ui/Input";
import { CopyButton } from "@/components/ui/CopyButton";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { InlineConfirm } from "@/components/cards/InlineConfirm";
import { ChangeConfirm } from "@/components/cards/ChangeConfirm";
import { Segmented, SettingRow, logAudit, nowToday, useChoice, useSwitch } from "./parts";

// ---------- Buttons that ask first (R-40) ----------

interface Asking {
  key: string;
  btn: SpecButton;
}

function useAsk(owner: string) {
  const [asking, setAsking] = React.useState<Asking | null>(null);
  const [done, setDone] = React.useState<Record<string, string>>({});
  const press = (key: string, btn: SpecButton) => {
    if (btn.ask) setAsking({ key, btn });
    else {
      logAudit(btn.action, `${owner}: ${btn.label}`);
      setDone((d) => ({ ...d, [key]: btn.done }));
    }
  };
  const confirm = asking ? (
    <ChangeConfirm
      question={asking.btn.ask ?? asking.btn.label}
      confirm={asking.btn.label}
      before={asking.btn.before}
      after={asking.btn.after}
      onConfirm={() => {
        logAudit(asking.btn.action, `${owner}: ${asking.btn.ask?.replace(/\?$/, "") ?? asking.btn.label}`, "Done", asking.btn.before, asking.btn.after);
        setDone((d) => ({ ...d, [asking.key]: asking.btn.done }));
        setAsking(null);
      }}
      onCancel={() => setAsking(null)}
    />
  ) : null;
  const render = (key: string, btn: SpecButton) =>
    done[key] ? (
      <Chip tone="ok">{done[key]}</Chip>
    ) : (
      <Button size="sm" onClick={() => press(key, btn)} aria-expanded={asking?.key === key}>
        {btn.label}
      </Button>
    );
  return { asking, confirm, render };
}

// ---------- Controls bound to shared settings ----------

function SwitchCtl({ k, initial, label }: { k: string; initial: boolean; label: string }) {
  const [on, set] = useSwitch(k, initial, label);
  return <Switch on={on} onChange={set} label={label} />;
}

function ChoiceCtl({ k, opts, initial, label }: { k: string; opts: string[]; initial: number; label: string }) {
  const [cur, set] = useChoice(k, opts, initial, label);
  return <Segmented opts={opts} value={cur} onChange={set} label={label} />;
}

// ---------- Section kinds ----------

function RowsSection({ title, meta, rows, owner }: { title: string; meta?: string; rows: SpecRow[]; owner: string }) {
  const ask = useAsk(owner);
  return (
    <SectionCard title={title} meta={meta} flush>
      {rows.map((r, i) => {
        const key = `${title}-${i}`;
        const x = r.x ?? {};
        return (
          <React.Fragment key={key}>
            <SettingRow label={r.label} hint={r.hint}>
              {r.value && <span className={`min-w-0 break-words text-right ${x.mono && !x.list ? "font-mono text-12.5" : ""}`}>{r.value}</span>}
              {x.copy && r.value && <CopyButton value={r.value} label={r.label} />}
              {x.chip && <Chip tone={x.chip[1]}>{x.chip[0]}</Chip>}
              {x.list && (
                <ul className={`grid gap-0.5 text-12.5 sm:text-right ${x.mono ? "font-mono" : ""}`}>
                  {x.list.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
              {x.sw && <SwitchCtl k={x.sw.key} initial={x.sw.on} label={`${owner}: ${r.label}`} />}
              {x.seg && <ChoiceCtl k={x.seg.key} opts={x.seg.opts} initial={x.seg.sel} label={`${owner}: ${r.label}`} />}
              {x.btn && ask.render(key, x.btn)}
            </SettingRow>
            {ask.asking?.key === key && ask.confirm}
          </React.Fragment>
        );
      })}
    </SectionCard>
  );
}

interface TRow {
  id: string;
  cells: SpecCell[];
}

function TableSection({ title, meta, head, rows, owner }: { title: string; meta?: string; head: string[]; rows: SpecCell[][]; owner: string }) {
  const ask = useAsk(owner);
  const data: TRow[] = rows.map((cells, i) => ({ id: `${i}`, cells }));
  const columns: Column<TRow>[] = head.map((h, ci) => ({
    key: `c${ci}`,
    label: h,
    width: h === "" ? 1 : undefined,
    render: (r) => {
      const c = r.cells[ci];
      if (c === undefined || c === "") return null;
      if (typeof c === "string") return <span className="whitespace-nowrap">{c}</span>;
      if (c.btn) return ask.render(`${r.id}-${ci}`, c.btn);
      if (c.tone)
        return (
          <Chip fixed tone={c.tone}>
            {c.t}
          </Chip>
        );
      return (
        <span className="block">
          <span className={c.mono ? "whitespace-nowrap font-mono text-12.5" : "whitespace-nowrap"}>{c.t}</span>
          {c.sub && <span className="block text-12 text-muted">{c.sub}</span>}
        </span>
      );
    },
  }));
  return (
    <SectionCard title={title} bare flush>
      <DataGrid inset title={title} meta={meta} columns={columns} rows={data} rowKey={(r) => r.id} />
      {ask.confirm}
    </SectionCard>
  );
}

/** SPF, DKIM, DMARC and return path for sbcllp.in, with Verify. Used on Connections (Email) and Messages. */
export function DomainCard() {
  const rows = DOMAIN;
  const [checked, setChecked] = React.useState<Date | null>(null);
  const verify = () => {
    const t = nowToday();
    setChecked(t);
    const failing = rows.filter((r) => r.status !== "Passing").map((r) => r.record);
    logAudit("Verify domain", "sbcllp.in", "Done", "-", failing.length ? `${failing.join(", ")} needs a change` : "All passing");
  };
  const columns: Column<DomainRecord>[] = [
    { key: "record", label: "Record", render: (r) => <span className="whitespace-nowrap font-semibold">{r.record}</span> },
    { key: "status", label: "Status", width: 124, render: (r) => <Chip fixed tone={r.status === "Passing" ? "ok" : "warn"}>{r.status}</Chip> },
    { key: "value", label: "Value", mono: true, render: (r) => <span className="block min-w-[200px] break-words">{r.value}</span> },
  ];
  return (
    <DataGrid
      title="Email domain sbcllp.in"
      meta={checked ? `Checked ${stamp(checked)}` : "DNS records"}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      filters={
        <Button size="sm" onClick={verify}>
          Verify
        </Button>
      }
    />
  );
}

function UsedBy({ channel }: { channel: Route["channel"] }) {
  const rows = ROUTES.filter((r) => r.channel === channel);
  const columns: Column<Route>[] = [
    {
      key: "msg",
      label: "Message",
      render: (r) => (
        <span className="block min-w-[200px]">
          <b className="font-semibold">{r.message}</b>
          <span className="block text-12 text-muted">{r.when}</span>
        </span>
      ),
    },
    { key: "tpl", label: "Template", mono: true, render: (r) => <span className="whitespace-nowrap">{r.template}</span> },
    { key: "status", label: "Status", width: 124, render: (r) => <Chip fixed tone={r.status === "Approved" ? "ok" : "warn"}>{r.status === "Approved" ? "Approved" : "Waiting"}</Chip> },
    { key: "sent", label: "Sent, 7 days", align: "right", render: (r) => r.sent7d },
  ];
  if (!rows.length) return null;
  return <DataGrid title="Used by" meta={`${rows.length} message routes`} columns={columns} rows={rows} rowKey={(r) => r.id} />;
}

function TestCard({ to, via, onSent }: { to: string; via: string; onSent: (to: string) => void }) {
  const [value, setValue] = React.useState(to);
  return (
    <SectionCard title="Send a test" flush>
      <SettingRow label="Send to">
        <Input aria-label="Send to" value={value} onChange={(e) => setValue(e.target.value)} className="h-[30px] w-full min-w-0 font-mono text-12.5 sm:w-[220px]" />
        <Button size="sm" variant="primary" disabled={!value.trim()} onClick={() => onSent(value.trim())}>
          Send a test
        </Button>
      </SettingRow>
      <span className="sr-only">{via}</span>
    </SectionCard>
  );
}

export function EventsCard({ events }: { events: ConnEvent[] }) {
  if (!events.length) return null;
  return (
    <SectionCard title="Recent events" meta="Last 5" flush>
      <ul>
        {events.slice(0, 5).map((e, i) => (
          <li key={i} className="flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13 first:border-t-0 md:px-5">
            <span className="w-[92px] flex-none font-mono text-12 text-muted">{stamp(e.at)}</span>
            <span className="min-w-0 flex-1 break-words">{e.text}</span>
            {e.chip && <Chip tone={e.tone}>{e.chip}</Chip>}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function DisconnectCard({ name, effect, off, onConfirm }: { name: string; effect: string; off: boolean; onConfirm: () => void }) {
  const [ask, setAsk] = React.useState(false);
  return (
    <SectionCard title="Disconnect" flush>
      <SettingRow label={`Disconnect ${name}`} hint={effect}>
        {off ? (
          <Chip tone="idle">Disconnected</Chip>
        ) : (
          <Button size="sm" onClick={() => setAsk(true)} aria-expanded={ask}>
            Disconnect
          </Button>
        )}
      </SettingRow>
      {ask && !off && (
        <InlineConfirm
          question={`Disconnect ${name}? ${effect}`}
          confirm="Disconnect"
          onConfirm={() => {
            onConfirm();
            setAsk(false);
          }}
          onCancel={() => setAsk(false)}
        />
      )}
    </SectionCard>
  );
}

/** Every section of one connection, stacked. */
export function ConnSections({ c, sections, off, onTest, onDisconnect }: { c: Connection; sections: Section[]; off: boolean; onTest: (to: string, via: string) => void; onDisconnect: () => void }) {
  return (
    <>
      {sections.map((s, i) => {
        const key = `${c.id}-${i}`;
        switch (s.kind) {
          case "rows":
            return <RowsSection key={key} title={s.title} meta={s.meta} rows={s.rows} owner={c.name} />;
          case "table":
            return <TableSection key={key} title={s.title} meta={s.meta} head={s.head} rows={s.rows} owner={c.name} />;
          case "domain":
            return <DomainCard key={key} />;
          case "used":
            return <UsedBy key={key} channel={s.channel} />;
          case "test":
            return off ? null : <TestCard key={key} to={s.to} via={s.via} onSent={(to) => onTest(to, s.via)} />;
          case "events":
            return <EventsCard key={key} events={c.events} />;
          case "disconnect":
            return <DisconnectCard key={key} name={c.name} effect={s.effect} off={off} onConfirm={onDisconnect} />;
        }
      })}
    </>
  );
}

// ---------- Connect flow for a service that is not connected (inline steps) ----------

export function ConnectFlow({ c, onConnect, onCancel }: { c: Connection; onConnect: () => void; onCancel: () => void }) {
  const steps = CONNECT_STEPS[c.id] ?? [{ label: `Sign in to ${c.provider}`, kind: "signin" as const, field: "Sign in" }];
  const [vals, setVals] = React.useState<Record<number, string>>({});
  const [signed, setSigned] = React.useState<Record<number, boolean>>({});
  const [ticks, setTicks] = React.useState<Record<string, boolean>>({});
  const isDone = (i: number) => {
    const s = steps[i];
    if (s.kind === "input") return !!vals[i]?.trim();
    if (s.kind === "signin") return !!signed[i];
    return (s.items ?? []).every((it) => ticks[`${i}-${it}`]);
  };
  const all = steps.every((_, i) => isDone(i));
  const firstOpen = steps.findIndex((_, i) => !isDone(i));
  return (
    <SectionCard title={`Connect ${c.name}`} meta={`Step ${firstOpen === -1 ? steps.length : firstOpen + 1} of ${steps.length}`} flush>
      <ol>
        {steps.map((s, i) => {
          const done = isDone(i);
          const open = i === firstOpen || done;
          return (
            <li key={s.label} className={`grid gap-2 border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5 ${!open ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-2.5 text-13.5 font-semibold">
                <span className={`grid h-[22px] w-[22px] flex-none place-items-center rounded-sm text-12 ${done ? "bg-ok-soft text-ok" : i === firstOpen ? "bg-accent-soft text-accent" : "border border-line text-faint"}`}>
                  {done ? <Check size={13} strokeWidth={2} /> : i + 1}
                </span>
                {s.label}
              </div>
              {open && (
                <div className="pl-[32px]">
                  {s.kind === "input" && (
                    <Input aria-label={s.field} placeholder={s.placeholder} value={vals[i] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [i]: e.target.value }))} className="h-[30px] w-full max-w-[320px] font-mono text-12.5" />
                  )}
                  {s.kind === "signin" &&
                    (signed[i] ? (
                      <Chip tone="ok">Done</Chip>
                    ) : (
                      <Button size="sm" onClick={() => setSigned((v) => ({ ...v, [i]: true }))}>
                        {s.field ?? "Sign in"}
                      </Button>
                    ))}
                  {s.kind === "consent" && (
                    <div className="grid gap-1.5 text-13">
                      {(s.items ?? []).map((it) => (
                        <label key={it} className="flex items-center gap-2">
                          <Checkbox checked={!!ticks[`${i}-${it}`]} onChange={(v) => setTicks((t) => ({ ...t, [`${i}-${it}`]: v }))} label={it} />
                          {it}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
        <Button size="sm" variant="primary" disabled={!all} onClick={onConnect}>
          Connect
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </SectionCard>
  );
}
