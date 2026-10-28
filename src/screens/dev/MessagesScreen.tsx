"use client";
import * as React from "react";
import { CHANNEL_TEMPLATES, CHANNEL_TONE, MESSAGES, MSG_FAILS, MSG_TONE, ROUTES, SENDERS, TEMPLATES, TPL_TONE, stamp, stampSec, type Channel, type ChannelTemplate, type Message, type Route } from "@/data/dev";
import { fmt } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { ChangeConfirm } from "@/components/cards/ChangeConfirm";
import { Row } from "@/components/shell/Page";
import { ChoiceRow, CloseButton, FilterChip, PickCell, SettingRow, StatusChip, SwitchRow, logAudit, useRevealRef } from "./parts";
import { DomainCard } from "./conn-detail";

const CHANNELS: Channel[] = ["Email", "WhatsApp", "SMS", "Teams"];

// ---------- Per-message timeline: queued, sent, delivered, read ----------

function timeline(m: Message) {
  const s = (sec: number) => new Date(m.at.getTime() + sec * 1000);
  const steps: Array<{ label: string; at?: Date; tone: "ok" | "bad" | "idle" }> = [{ label: "Queued", at: m.at, tone: "ok" }];
  if (m.status === "Failed") {
    steps.push({ label: "Failed", at: s(2), tone: "bad" });
    return steps;
  }
  const order = ["Queued", "Sent", "Delivered", "Read"] as const;
  const reached = order.indexOf(m.status as (typeof order)[number]);
  const offsets = [0, 2, 6, 14 * 60];
  const last = m.channel === "Teams" ? 2 : 3;
  for (let i = 1; i <= last; i++) steps.push({ label: order[i], at: i <= reached ? s(offsets[i]) : undefined, tone: i <= reached ? "ok" : "idle" });
  return steps;
}

function Timeline({ m }: { m: Message }) {
  return (
    <ol className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-4 md:px-5">
      {timeline(m).map((t) => (
        <li key={t.label} className={`min-w-0 ${t.at ? "" : "opacity-50"}`}>
          <div className="flex items-center gap-2 text-13 font-medium">
            <i className={`h-2 w-2 flex-none rounded-[2px] ${t.tone === "ok" ? "bg-ok-mid" : t.tone === "bad" ? "bg-bad-mid" : "border-1.5 border-line-2"}`} aria-hidden />
            {t.label}
          </div>
          {t.at && <div className="pl-4 text-12 text-muted">{stampSec(t.at)}</div>}
        </li>
      ))}
    </ol>
  );
}

// ---------- Screen ----------

export function MessagesScreen() {
  const [rows, setRows] = React.useState<Message[]>(MESSAGES);
  const [tab, setTab] = React.useState("all");
  const [channel, setChannel] = React.useState("all");
  const [picked, setPicked] = React.useState<string | null>(null);
  const reveal = useRevealRef<HTMLDivElement>(picked);

  const [routes, setRoutes] = React.useState<Route[]>(ROUTES);
  const [routeCh, setRouteCh] = React.useState("all");
  const [editing, setEditing] = React.useState<{ id: string; from: string } | null>(null);
  const [tested, setTested] = React.useState<Record<string, boolean>>({});

  const [tplCh, setTplCh] = React.useState<ChannelTemplate["channel"]>("WhatsApp");
  const [tplPick, setTplPick] = React.useState<string | null>(null);
  const tplReveal = useRevealRef<HTMLDivElement>(tplPick);

  const [askRetry, setAskRetry] = React.useState(false);

  const pick = (id: string) => setPicked((p) => (p === id ? null : id));
  const retry = (m: Message) => {
    setRows((rs) => rs.map((x) => (x.id === m.id ? { ...x, status: "Queued", retries: x.retries + 1 } : x)));
    logAudit("Retry message", `${m.template} to ${m.to}`, "Done", "Failed", "Queued");
  };
  const retryAll = () => {
    const n = rows.filter((m) => m.status === "Failed").length;
    setRows((rs) => rs.map((x) => (x.status === "Failed" ? { ...x, status: "Queued", retries: x.retries + 1 } : x)));
    logAudit("Retry message", `${n} failed messages`, "Done", `${n} failed`, "Queued again");
    setAskRetry(false);
  };

  const failed = rows.filter((m) => m.status === "Failed").length;
  const queued = rows.filter((m) => m.status === "Queued").length;
  const shown = rows.filter((m) => (tab === "all" || (tab === "failed" ? m.status === "Failed" : m.status === "Queued")) && (channel === "all" || m.channel === channel));
  const cur = rows.find((m) => m.id === picked) ?? null;
  const tpl = cur ? TEMPLATES[cur.template] : null;

  const columns: Column<Message>[] = [
    {
      key: "time",
      label: "Time",
      render: (m) => (
        <span className="whitespace-nowrap">
          <PickCell on={picked === m.id} onPick={() => pick(m.id)}>
            {stamp(m.at)}
          </PickCell>
        </span>
      ),
    },
    { key: "channel", label: "Channel", render: (m) => <Tag tone={CHANNEL_TONE[m.channel]} className="w-[104px]">{m.channel}</Tag> },
    { key: "to", label: "To", render: (m) => <span className="whitespace-nowrap">{m.to}</span> },
    { key: "template", label: "Template", mono: true, render: (m) => <span className="whitespace-nowrap">{m.template}</span> },
    { key: "status", label: "Status", width: 124, render: (m) => <StatusChip tone={MSG_TONE[m.status]}>{m.status}</StatusChip> },
    { key: "retries", label: "Retries", align: "right", render: (m) => <span className={m.retries > 0 ? "font-medium" : "text-muted"}>{m.retries}</span> },
  ];

  const routeRows = routes.filter((r) => routeCh === "all" || r.channel === routeCh);
  const routeColumns: Column<Route>[] = [
    {
      key: "msg",
      label: "Message",
      render: (r) => (
        <span className="block min-w-[200px]">
          <b className="font-medium">{r.message}</b>
          <span className="block text-12 text-muted">{r.when}</span>
        </span>
      ),
    },
    { key: "ch", label: "Channel", render: (r) => <Tag tone={CHANNEL_TONE[r.channel]} className="w-[104px]">{r.channel}</Tag> },
    { key: "from", label: "Sent from", render: (r) => <span className="whitespace-nowrap">{r.from}</span> },
    {
      key: "tpl",
      label: "Template",
      render: (r) => (
        <span className="flex flex-col items-start gap-1 whitespace-nowrap">
          <span className="font-mono text-13">{r.template}</span>
          {r.status !== "Approved" && <StatusChip tone="teal">Waiting</StatusChip>}
        </span>
      ),
    },
    { key: "to", label: "To", render: (r) => <span className="block min-w-[140px] text-12.5">{r.to}</span> },
    { key: "sent", label: "7 days", align: "right", render: (r) => r.sent7d },
    { key: "del", label: "Delivered", align: "right", render: (r) => <span className={r.sent7d && r.delivered < 98 ? "font-medium text-warn" : undefined}>{r.sent7d ? `${r.delivered}%` : "-"}</span> },
    {
      key: "act",
      label: "",
      width: 1,
      render: (r) => (
        <span className="flex items-center gap-1.5">
          {tested[r.id] ? (
            <StatusChip tone="ok">Test sent</StatusChip>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setTested((t) => ({ ...t, [r.id]: true }));
                logAudit("Send test", `${r.message} from ${r.from} to Farhath`);
              }}
            >
              Test
            </Button>
          )}
          {/* Edit only where the channel has a second sender to pick. */}
          {SENDERS[r.channel].length > 1 && (
            <Button size="sm" onClick={() => setEditing({ id: r.id, from: r.from })} aria-expanded={editing?.id === r.id}>
              Edit
            </Button>
          )}
        </span>
      ),
    },
  ];
  const editRoute = editing ? routes.find((r) => r.id === editing.id) : null;

  const tpls = CHANNEL_TEMPLATES.filter((t) => t.channel === tplCh);
  const tplCur = CHANNEL_TEMPLATES.find((t) => t.id === tplPick) ?? null;
  const tplColumns: Column<ChannelTemplate>[] = [
    { key: "name", label: "Template", mono: true, render: (t) => <span className="whitespace-nowrap font-medium">{t.name}</span> },
    { key: "lang", label: "Language", render: (t) => <span className="whitespace-nowrap">{t.language}</span> },
    { key: "cat", label: "Category", render: (t) => t.category },
    { key: "status", label: "Status", width: 124, render: (t) => <StatusChip tone={TPL_TONE[t.status]}>{t.status === "Waiting" && t.since ? `Since ${fmt(t.since)}` : t.status}</StatusChip> },
    { key: "used", label: "Last used", render: (t) => <span className="whitespace-nowrap">{t.lastUsed ? stamp(t.lastUsed) : "-"}</span> },
    { key: "sent", label: "Sent, 7 days", align: "right", render: (t) => t.sent7d },
    { key: "body", label: "Body", render: (t) => <span className="block max-w-[320px] truncate text-12.5 text-muted">{t.body.replace(/\n+/g, " ")}</span> },
  ];
  const tplCount = (c: ChannelTemplate["channel"]) => CHANNEL_TEMPLATES.filter((t) => t.channel === c).length;

  return (
    <div className="grid grid-cols-1 gap-5">
      <DataGrid
        title="Outbound messages"
        meta="Today"
        columns={columns}
        rows={shown}
        rowKey={(m) => m.id}
        pageSize={10}
        onRowClick={(m) => pick(m.id)}
        selectedKey={picked ?? undefined}
        empty="No messages match"
        filters={
          <>
            <FilterChip label="Channel" value={channel} onChange={setChannel} options={CHANNELS.map((c) => ({ value: c, label: c }))} />
            <Tabs
              items={[
                { key: "all", label: "All", count: rows.length },
                { key: "failed", label: "Failed", count: failed },
                { key: "queued", label: "Queued", count: queued },
              ]}
              value={tab}
              onChange={setTab}
            />
          </>
        }
      />
      {cur && tpl && (
        <div ref={reveal}>
          <SectionCard
            title="Message preview"
            meta={cur.template}
            flush
            right={
              <>
                {cur.status === "Failed" && (
                  <Button size="sm" onClick={() => retry(cur)}>
                    Retry
                  </Button>
                )}
                <CloseButton onClick={() => setPicked(null)} />
              </>
            }
          >
            <Timeline m={cur} />
            <div className="border-t border-line-soft px-4 py-4 md:px-5">
              <KeyValue
                cols={3}
                rows={[
                  { k: "From", v: tpl.from },
                  { k: "To", v: cur.to },
                  { k: "Queued", v: stamp(cur.at) },
                  { k: "Channel", v: cur.channel },
                  { k: "Status", v: <StatusChip tone={MSG_TONE[cur.status]}>{cur.status}</StatusChip> },
                  { k: "Retries", v: cur.retries },
                ]}
              />
              {cur.error && <p className="mt-3 text-13 font-medium text-bad">{cur.error}</p>}
            </div>
            <div className="border-t border-line-soft px-4 py-4 md:px-5">
              {tpl.subject && <div className="mb-2 text-14 font-medium">{tpl.subject}</div>}
              <div className="whitespace-pre-line rounded-md border-1.5 border-line bg-raised px-4 py-3 text-14 text-ink-2">{tpl.body}</div>
            </div>
          </SectionCard>
        </div>
      )}

      <SectionCard title="Message routes" bare flush>
        <DataGrid
          inset
          title="Message routes"
          meta="Which channel each event goes on"
          columns={routeColumns}
          rows={routeRows}
          rowKey={(r) => r.id}
          pageSize={15}
          selectedKey={editing?.id}
          filters={<FilterChip label="Channel" value={routeCh} onChange={setRouteCh} options={CHANNELS.map((c) => ({ value: c, label: c }))} />}
        />
        {editing && editRoute && (
          <div className="flex flex-wrap items-center gap-2.5 border-t border-line-soft bg-raised px-4 py-2.5 md:px-5">
            <span className="min-w-0 flex-1 text-14 font-medium">Send {editRoute.message.toLowerCase()} from</span>
            <Select aria-label="Sent from" value={editing.from} onChange={(e) => setEditing({ ...editing, from: e.target.value })} options={SENDERS[editRoute.channel].map((s) => ({ value: s, label: s }))} />
            <Button
              size="sm"
              variant="primary"
              disabled={editing.from === editRoute.from}
              onClick={() => {
                logAudit("Edit route", editRoute.message, "Done", editRoute.from, editing.from);
                setRoutes((rs) => rs.map((r) => (r.id === editing.id ? { ...r, from: editing.from } : r)));
                setEditing(null);
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Timing and channels" flush>
        <SettingRow label="Order" hint="Email is the record. WhatsApp and SMS follow it as reminders.">
          <span>Email, then WhatsApp, then SMS</span>
        </SettingRow>
        <ChoiceRow k="msg-dl" opts={["7, 3, 1", "10, 5, 1", "3, 1"]} initial={0} label="Deadline reminders" hint="Days before a filing date" />
        <ChoiceRow k="msg-rn" opts={["60, 30, 7", "30, 7"]} initial={0} label="Renewal reminders" hint="LUT, IEC, LEI, trade licence" />
        <ChoiceRow k="msg-dg" opts={["08:30", "09:00", "09:30"]} initial={1} label="Staff daily digest" hint="Teams and email, working days" />
        <ChoiceRow k="wa-quiet" opts={["Off", "21:00 to 09:00", "20:00 to 10:00"]} initial={1} label="Quiet hours" hint="WhatsApp and SMS wait for the morning" />
        <SwitchRow k="msg-report" initial={true} label="Monthly client report" hint="1st of the month, 08:00 from reports@sbcllp.in" />
        <SwitchRow k="wa-fallback" initial={false} label="Send SMS when WhatsApp fails" hint="Same message from SBCLLP" />
      </SectionCard>
      <Row>
        <SectionCard
          title="Failed in the last 24 hours"
          meta={`${MSG_FAILS.reduce((a, f) => a + f.n, 0)} messages`}
          flush
          right={
            <Button size="sm" onClick={() => setAskRetry(true)} disabled={failed === 0} aria-expanded={askRetry}>
              Retry failed
            </Button>
          }
        >
          {MSG_FAILS.map((f) => (
            <SettingRow key={f.id} label={f.what} hint={f.cause}>
              <b className="font-medium">{f.n}</b>
            </SettingRow>
          ))}
          {askRetry && (
            <ChangeConfirm
              question={`Retry ${failed} failed messages? deadline_1d fails again until Meta approves it.`}
              confirm="Retry"
              before={`${failed} failed`}
              after="Queued again"
              onConfirm={retryAll}
              onCancel={() => setAskRetry(false)}
            />
          )}
        </SectionCard>
        <DomainCard />
      </Row>

      <DataGrid
        title="Templates"
        meta={tplCh === "WhatsApp" ? "Meta approves each template" : tplCh === "SMS" ? "Registered on the DLT portal" : "Kept in the app"}
        columns={tplColumns}
        rows={tpls}
        rowKey={(t) => t.id}
        onRowClick={(t) => setTplPick((p) => (p === t.id ? null : t.id))}
        selectedKey={tplPick ?? undefined}
        filters={
          <Tabs
            items={(["WhatsApp", "SMS", "Email"] as const).map((c) => ({ key: c, label: c, count: tplCount(c) }))}
            value={tplCh}
            onChange={(v) => {
              setTplCh(v as ChannelTemplate["channel"]);
              setTplPick(null);
            }}
          />
        }
      />
      {tplCur && (
        <div ref={tplReveal}>
          <SectionCard title="Template preview" meta={tplCur.name} flush right={<CloseButton onClick={() => setTplPick(null)} />}>
            <div className="px-4 py-4 md:px-5">
              <KeyValue
                cols={3}
                rows={[
                  { k: "Used for", v: tplCur.usedFor },
                  { k: "Channel", v: tplCur.channel },
                  { k: "Status", v: <StatusChip tone={TPL_TONE[tplCur.status]}>{tplCur.status}</StatusChip> },
                ]}
              />
              <div className="mt-3 whitespace-pre-line rounded-md border-1.5 border-line bg-raised px-4 py-3 text-14 text-ink-2">{tplCur.body}</div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
