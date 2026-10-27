"use client";
import * as React from "react";
import { CHANNEL_TONE, MESSAGES, MSG_TONE, TEMPLATES, stamp, type Message } from "@/data/dev";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { SectionCard } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { CloseButton, PickCell, RowPicker, logAudit, pickedRow, rowTag, useRevealRef } from "./parts";

export function MessagesScreen() {
  const [rows, setRows] = React.useState<Message[]>(MESSAGES);
  const [tab, setTab] = React.useState("all");
  const [picked, setPicked] = React.useState<string | null>(null);
  const reveal = useRevealRef<HTMLDivElement>(picked);

  const pick = (id: string) => setPicked((p) => (p === id ? null : id));
  const retry = (m: Message) => {
    setRows((rs) => rs.map((x) => (x.id === m.id ? { ...x, status: "Queued", retries: x.retries + 1 } : x)));
    logAudit("Retry message", `${m.template} to ${m.to}`);
  };

  const failed = rows.filter((m) => m.status === "Failed").length;
  const queued = rows.filter((m) => m.status === "Queued").length;
  const shown = rows.filter((m) => tab === "all" || (tab === "failed" ? m.status === "Failed" : m.status === "Queued"));
  const cur = rows.find((m) => m.id === picked) ?? null;
  const tpl = cur ? TEMPLATES[cur.template] : null;

  const columns: Column<Message>[] = [
    {
      key: "time",
      label: "Time",
      mono: true,
      render: (m) => (
        <span className="whitespace-nowrap font-mono">
          <PickCell on={picked === m.id} onPick={() => pick(m.id)}>
            {stamp(m.at)}
          </PickCell>
        </span>
      ),
    },
    { key: "channel", label: "Channel", render: (m) => <Tag tone={CHANNEL_TONE[m.channel]}>{m.channel}</Tag> },
    { key: "to", label: "To", render: (m) => <span className="whitespace-nowrap">{m.to}</span> },
    { key: "template", label: "Template", mono: true, render: (m) => <span className="whitespace-nowrap">{m.template}</span> },
    { key: "status", label: "Status", width: 124, render: (m) => <Chip fixed tone={MSG_TONE[m.status]}>{m.status}</Chip> },
    { key: "retries", label: "Retries", align: "right", render: (m) => <span className={m.retries > 0 ? "font-semibold" : "text-muted"}>{m.retries}</span> },
  ];

  return (
    <div className="grid grid-cols-1 gap-5">
      <RowPicker onPick={pick}>
        <DataGrid
          title="Outbound messages"
          meta="Today"
          columns={columns}
          rows={shown}
          rowKey={(m) => m.id}
          pageSize={10}
          rowClass={(m) => `cursor-pointer ${rowTag(m.id)} ${picked === m.id ? pickedRow : ""}`}
          filters={
            <Tabs
              items={[
                { key: "all", label: "All", count: rows.length },
                { key: "failed", label: "Failed", count: failed },
                { key: "queued", label: "Queued", count: queued },
              ]}
              value={tab}
              onChange={setTab}
            />
          }
        />
      </RowPicker>
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
            <div className="px-4 py-4 md:px-5">
              <KeyValue
                cols={3}
                rows={[
                  { k: "From", v: tpl.from, mono: tpl.channel !== "Teams" },
                  { k: "To", v: cur.to },
                  { k: "Sent", v: stamp(cur.at) },
                  { k: "Channel", v: cur.channel },
                  { k: "Status", v: <Chip tone={MSG_TONE[cur.status]}>{cur.status}</Chip> },
                  { k: "Retries", v: cur.retries },
                ]}
              />
              {cur.error && <p className="mt-3 text-13 font-semibold text-bad">{cur.error}</p>}
            </div>
            <div className="border-t border-line-soft px-4 py-4 md:px-5">
              {tpl.subject && <div className="mb-2 text-13.5 font-semibold">{tpl.subject}</div>}
              <div className="whitespace-pre-line rounded-md border border-line bg-raised px-4 py-3 text-13.5 text-ink-2">{tpl.body}</div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
