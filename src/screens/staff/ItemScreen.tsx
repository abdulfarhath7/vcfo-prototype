"use client";
import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { itemView, type ItemDocRow, type ItemEvent, type ItemKind, type ItemView } from "@/data/staff-item";
import { staffObHref } from "@/data/staff-compliance";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Checkbox, Input } from "@/components/ui/Input";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { DataGrid } from "@/components/cards/DataGrid";
import { kbHref } from "./comp-parts";
import { type StaffPortal } from "./parts";

// Staff record page of a registration or an obligation, as in reference/old-screens/s/lead/Item.dc.html:
// a head band with a progress ring, a two-sided steps thread, VCFO Assist, from the client, filled by SBC,
// past periods (obligations) and the rail: about, why it applies, late penalty, what it starts, renewal, before filing.
// R-09: no back link. R-16: every card head has its icon tile. R-07: past periods are an e-Filing grid.

const TONE_TEXT: Record<string, string> = { bad: "text-bad", ok: "text-ok", warn: "text-warn", prog: "text-accent", idle: "text-ink" };
const RING: Record<string, string> = { done: "var(--ok)", bad: "var(--bad)", wait: "var(--warn)" };

function Ring({ v }: { v: ItemView }) {
  const C = 138.2;
  const frac = v.total ? v.done / v.total : 0;
  const text = v.state === "done" ? "✓" : v.state === "bad" ? "-3d" : `${v.done}/${v.total}`;
  return (
    <span className="relative grid h-[52px] w-[52px] flex-none place-items-center" title={`${v.done} of ${v.total} steps done`}>
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="26" cy="26" r="22" fill="none" stroke="var(--line-soft)" strokeWidth="4" />
        <circle cx="26" cy="26" r="22" fill="none" stroke={RING[v.state] ?? "var(--accent)"} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${Math.round(frac * C)} ${C}`} />
      </svg>
      <b className={cn("text-12.5 font-semibold", v.state === "bad" && "text-bad")}>{text}</b>
    </span>
  );
}

function People({ v }: { v: ItemView }) {
  const client = v.client === "northwind" ? ["RK", "Rohan Kumar · Client · Northwind"] : [v.clientName.slice(0, 2).toUpperCase(), `${v.clientShort} contact · Client · ${v.clientName}`];
  const rows: Array<[string, string, string]> = [
    [client[0], client[1], "bg-warn-soft text-warn"],
    ["BH", "Bharath · Project lead", "bg-accent-soft text-accent"],
    ["PN", "Pranay · Manager", "bg-ok-soft text-ok"],
  ];
  return (
    <span className="flex flex-none" aria-label="People on it">
      {rows.map(([ini, tip, cls], i) => (
        <span key={ini + i} title={tip} className={cn("grid h-[26px] w-[26px] place-items-center rounded-full border-2 border-surface text-[10px] font-bold", cls, i > 0 && "-ml-1.5")}>
          {ini}
        </span>
      ))}
    </span>
  );
}

function EventCard({ e }: { e: ItemEvent }) {
  return (
    <div className={cn("min-w-0 rounded-md border border-l-[3px] px-3 py-2", e.next ? "border-dashed border-line" : "border-line", e.late ? "border-l-warn-mid" : "border-l-accent")}>
      <b className={cn("block truncate text-12.5 font-semibold", e.late && "text-warn")}>{e.title}</b>
      <span className="block truncate text-11.5 text-muted">{e.sub}</span>
    </div>
  );
}

function StepsThread({ v }: { v: ItemView }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 md:grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)]">
      <div className="border-b-2 border-line pb-1.5 text-12 font-semibold text-ink-2">{v.authTitle}</div>
      <div />
      <div className="border-b-2 border-accent pb-1.5 text-12 font-semibold text-ink-2">SBC, for {v.clientShort}</div>
      {v.events.map((e, i) => (
        <React.Fragment key={i}>
          <div className="min-w-0">{e.side === "a" && <EventCard e={e} />}</div>
          <div className={cn("grid place-items-center rounded-md border px-1 py-1 leading-tight", e.next ? "border-dashed border-line" : "border-line", e.late && "border-warn-mid bg-warn-soft text-warn")}>
            <i className="text-[10.5px] not-italic text-muted">{e.weekday}</i>
            <b className="text-12.5 font-semibold">{e.date}</b>
          </div>
          <div className="min-w-0">{e.side === "s" && <EventCard e={e} />}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

function Assist({ v, toast }: { v: ItemView; toast: (t: string) => void }) {
  const [at, setAt] = React.useState(-1);
  const n = v.assist.length;
  const running = at >= 0 && at < n;
  const ran = at >= n;
  React.useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => {
      setAt(at + 1);
      if (at + 1 >= n) toast("Filed by VCFO Assist · replay kept in Audit");
    }, 900);
    return () => window.clearTimeout(t);
  }, [at, running, n, toast]);
  const portalName = v.kind === "ob" ? v.form : v.auth;
  return (
    <SectionCard title="File with VCFO Assist" right={<span className="text-12.5 text-muted">Runs in your browser on the portal</span>} flush>
      {v.assist.map((t, i) => (
        <ListRow key={t} className="py-2.5">
          <span className={cn("grid h-4 w-4 flex-none place-items-center rounded-full border", i < at ? "border-ok bg-ok text-white" : i === at ? "border-accent border-t-transparent motion-safe:animate-spin" : "border-faint")} aria-hidden>
            {i < at && <Check size={10} strokeWidth={2.5} />}
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-13 font-semibold">{t}</b>
            <span className="block text-12 text-muted">{i < at ? `Done · ${10 + i}:0${2 + i} am` : i === at ? "Working on it" : "Waiting"}</span>
          </span>
          {i < at && (
            <span className="flex-none rounded-sm border border-line px-1.5 py-0.5 font-mono text-11 text-muted" title="Screenshot of this page">
              {portalName.split(" ")[0]} · p{i + 1}
            </span>
          )}
        </ListRow>
      ))}
      <div className="flex flex-wrap items-center gap-3 border-t border-line-soft px-4 py-3 md:px-5">
        <span className="min-w-0 flex-1 text-12.5 text-muted">{ran ? "Replay kept in Audit · 5 screenshots" : "You see each step; nothing is submitted without the last step"}</span>
        <Button variant="primary" disabled={running} onClick={() => (ran ? toast("Opens the replay: 5 screenshots, in Audit") : setAt(0))}>
          {ran ? "View replay" : running ? "Filing" : "Start filing"}
        </Button>
      </div>
    </SectionCard>
  );
}

const DOC_CHIP: Record<ItemDocRow["state"], [string, ChipTone]> = { ok: ["Accepted", "ok"], review: ["To review", "prog"], asked: ["Asked", "warn"], notyet: ["Not asked yet", "idle"] };

function DocLine({ d, client, toast }: { d: ItemDocRow; client: string; toast: (t: string) => void }) {
  const [state, setState] = React.useState(d.state);
  const [asking, setAsking] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState(false);
  const [label, tone] = DOC_CHIP[state];
  return (
    <div className="border-t border-line-soft px-4 py-3 first:border-t-0 md:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1">
          <b className="block truncate text-13 font-semibold">{d.title}</b>
          <span className="block truncate text-12 text-muted">{state === "ok" && d.state !== "ok" ? "Accepted by Bharath" : d.sub}</span>
        </span>
        <Chip tone={tone}>{label}</Chip>
        {state === "review" && !asking && (
          <>
            <Button
              size="sm"
              onClick={() => {
                setState("ok");
                toast(`Accepted: ${d.title}`);
              }}
            >
              Accept
            </Button>
            <Button size="sm" onClick={() => setAsking(true)}>
              Ask again
            </Button>
          </>
        )}
      </div>
      {asking && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Input
            aria-label="Reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErr(false);
            }}
            placeholder="What should the client fix? (for example: stamp missing on page 2)"
            className="h-[30px] min-w-[220px] flex-1 text-13"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              if (!reason.trim()) return setErr(true);
              setAsking(false);
              setState("asked");
              toast(`Asked again: ${d.title} · ${client} is told on email and WhatsApp`);
            }}
          >
            Send
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>
            Cancel
          </Button>
          {err && <span className="text-12.5 font-semibold text-bad">Enter a reason first</span>}
        </div>
      )}
    </div>
  );
}

function KV({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-line-soft px-4 py-2 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center sm:gap-3 md:px-5">
      <span className="text-12.5 text-muted">{k}</span>
      <div className="min-w-0 text-13">{children}</div>
    </div>
  );
}

function Note({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <SectionCard title={title} right={right}>
      <div className="text-13 leading-relaxed text-ink-2">{children}</div>
    </SectionCard>
  );
}

export function ItemScreen({ kind, portal, id }: { kind: ItemKind; portal: StaffPortal; id: string }) {
  const v = itemView(kind, id)!;
  const { show, node } = useUndoToast();
  const [busy, setBusy] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  const [review, setReview] = React.useState(() => v.review.map((_, i) => i < v.reviewDone));
  const [sbc, setSbc] = React.useState(v.sbc);
  const editSbc = v.state !== "done";

  const act = () => {
    if (busy) return;
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setOk(true);
      show(v.state === "done" ? "Downloads the certificate" : `${v.name}: next step marked done`);
      window.setTimeout(() => setOk(false), 2200);
    }, 900);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <section className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-md border-1.5 border-line bg-surface px-4 py-3.5 md:px-5" aria-label="Deadline band">
        <div className="flex min-w-0 flex-[1_1_auto] items-center gap-3.5">
          <Ring v={v} />
          <div className="min-w-0">
            <h1 className="text-[18px] font-semibold leading-tight xl:whitespace-nowrap">{v.name}</h1>
            <small className="block text-12.5 text-muted">
              <span className="cursor-help border-b border-dashed border-faint" title={v.formTip}>
                {v.form}
              </span>{" "}
              · {v.auth} · {v.team}
            </small>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-y-2">
          {v.facts.map((f) => (
            <div key={f.k} className="min-w-[104px] border-l border-line px-4">
              <em className="block text-11.5 not-italic text-muted">{f.k}</em>
              <b className={cn("block whitespace-nowrap text-13.5 font-semibold", f.tone && TONE_TEXT[f.tone])}>{f.v}</b>
            </div>
          ))}
        </div>
        <People v={v} />
        <Button variant="primary" onClick={act} disabled={busy} className={cn(ok && "!bg-ok")}>
          {busy && <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent motion-safe:animate-spin" aria-hidden />}
          {busy ? "Working" : ok ? "Done" : v.state === "done" ? "Download certificate" : "Mark next step done"}
        </Button>
      </section>

      <Cols>
        <Col>
          <SectionCard title={v.threadTitle} right={<span className="text-12.5 text-muted">{v.threadSub}</span>}>
            <StepsThread v={v} />
          </SectionCard>

          {v.state !== "done" && v.state !== "na" && <Assist v={v} toast={show} />}

          <SectionCard title="From the client" right={<span className="text-12.5 text-muted">Uploaded by the client or by the lead for them</span>} flush>
            {v.docs.map((d) => (
              <DocLine key={d.title} d={d} client={v.clientShort} toast={show} />
            ))}
            {v.details.map(([k, val]) => (
              <KV key={k} k={k}>
                <b className="font-medium">{val}</b>
              </KV>
            ))}
            <p className="border-t border-line-soft px-4 py-2.5 text-12.5 text-muted md:px-5">{v.detailNote}</p>
          </SectionCard>

          <SectionCard title="Filled by SBC" right={<span className="text-12.5 text-muted">{editSbc ? "Click a value to edit" : "Read only"}</span>} flush>
            {sbc.map(([k, val], i) => (
              <KV key={k} k={k}>
                {editSbc ? (
                  <Input aria-label={k} value={val} onChange={(e) => setSbc(sbc.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} className="h-[34px] font-mono text-13" />
                ) : (
                  <b className="font-mono font-medium">{val}</b>
                )}
              </KV>
            ))}
          </SectionCard>

          {v.kind === "ob" && (
            <SectionCard title="Past periods" flush>
              <DataGrid
                inset
                rows={v.past}
                rowKey={(p) => p.period}
                columns={[
                  { key: "period", label: "Period" },
                  { key: "filed", label: "Filed on" },
                  { key: "ref", label: "Reference", mono: true },
                  { key: "status", label: "Status", width: 132, render: (p) => <Chip tone={p.late ? "warn" : "ok"} fixed>{p.late ? "Filed late" : "Filed"}</Chip> },
                ]}
              />
            </SectionCard>
          )}
        </Col>
        <Col>
          <Note title="About">
            {v.about}{" "}
            <Link href={kbHref(portal)} className="font-semibold text-accent hover:underline">
              Read the SBC SOP
            </Link>
          </Note>
          <Note title={v.whyTitle}>{v.why}</Note>
          {v.pen && (
            <Note title="If filed late">
              {v.pen} <span className="text-muted">(the law&apos;s penalty)</span>
            </Note>
          )}
          {v.starts.length > 0 && (
            <SectionCard title="What it starts" flush>
              {v.starts.map((o) => (
                <ListRow key={o.id} href={o.key ? staffObHref(portal, o.key) : undefined} className="py-2.5">
                  <span className="min-w-0 flex-1 truncate text-13">{o.name}</span>
                  <span className="flex-none text-12.5 text-muted">{o.fr}</span>
                </ListRow>
              ))}
            </SectionCard>
          )}
          <Note title={v.renTitle}>{v.ren}</Note>
          <SectionCard title="Before filing" right={<span className="text-12.5 text-muted">Staff only</span>} flush>
            {v.review.map((t, i) => (
              <label key={t} className="flex cursor-pointer items-center gap-2.5 border-t border-line-soft px-4 py-2 text-13 first:border-t-0 md:px-5">
                <Checkbox checked={review[i]} onChange={(on) => setReview(review.map((x, j) => (j === i ? on : x)))} label={t} />
                {t}
              </label>
            ))}
          </SectionCard>
        </Col>
      </Cols>
      {node}
    </div>
  );
}
