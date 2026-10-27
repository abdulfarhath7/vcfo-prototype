"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { ANNS, ANN_TONE, OFFICIAL_PORTALS, isImportant, portalHref, type Ann } from "@/data/updates-team";
import { WHATSAPP } from "@/data/people";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { DateTile } from "@/components/cards/AttentionList";
import { Cols, Col } from "@/components/shell/Page";
import type { Portal } from "@/data/nav";

/* ann_redesign: tabs All / Important / General, unread dot, rows open a detail dialog (ann_detail).
   Kept out: the "Next deadline" focus bar (R-38), the bot in the empty state (R-04), "Ask VCFO why" (R-05). */

const FILTERS: Record<string, (a: Ann) => boolean> = { all: () => true, important: isImportant, general: (a) => !isImportant(a) };

function byLine(a: Ann) {
  return a.by === "feed" ? "Official feed" : `From ${a.by.name}`;
}

function AnnDetail({ list, index, onIndex, onClose, portal }: { list: Ann[]; index: number; onIndex: (i: number) => void; onClose: () => void; portal: Portal }) {
  const a = list[index];
  if (!a) return null;
  const href = portalHref(portal, a.href);
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      size="md"
      title={a.title}
      sub={
        <>
          <Tag tone={ANN_TONE[a.kind]}>{a.kind}</Tag>
          {isImportant(a) && <Tag tone="bad">Important</Tag>}
          <span>
            {fmt(a.date)}, {a.time}
          </span>
        </>
      }
      footer={
        <>
          <Button size="iconSm" variant="ghost" aria-label="Previous announcement" disabled={index === 0} onClick={() => onIndex(index - 1)}>
            <ChevronLeft size={16} strokeWidth={1.5} />
          </Button>
          <Button size="iconSm" variant="ghost" aria-label="Next announcement" disabled={index === list.length - 1} onClick={() => onIndex(index + 1)}>
            <ChevronRight size={16} strokeWidth={1.5} />
          </Button>
          <span className="mr-auto font-mono text-12 text-muted">
            {index + 1} / {list.length}
          </span>
          {href && (
            <Button asChild size="md">
              <Link href={href}>Open</Link>
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Got it
          </Button>
        </>
      }
    >
      <p className="text-14 leading-relaxed text-ink">{a.body}</p>
      <div className="mt-4 flex items-center gap-3 border-t border-line-soft pt-4">
        {a.by === "feed" ? (
          <>
            <span className="min-w-0 flex-1 text-13 text-muted">Official feed</span>
            <Button asChild size="sm">
              <a href={`https://${a.host}`} target="_blank" rel="noreferrer">
                {a.host} <ExternalLink size={14} strokeWidth={1.5} />
              </a>
            </Button>
          </>
        ) : (
          <>
            <Avatar name={a.by.ini} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block text-13.5 font-semibold">{a.by.name}</span>
              <span className="block text-12.5 text-muted">
                {a.by.role} · {fmt(a.date)}, {a.time}
              </span>
            </span>
            {a.by.phone && (
              <a href={WHATSAPP(a.by.phone)} className="grid h-[30px] w-[30px] place-items-center rounded-md bg-ok-soft text-ok" aria-label={`WhatsApp ${a.by.name}`} title="WhatsApp">
                <MessageCircle size={15} strokeWidth={1.5} />
              </a>
            )}
            {a.by.email && (
              <a href={`mailto:${a.by.email}`} className="grid h-[30px] w-[30px] place-items-center rounded-md border border-line text-ink-2 hover:bg-raised" aria-label={`Email ${a.by.name}`} title="Email">
                <Mail size={15} strokeWidth={1.5} />
              </a>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

function PortalsCard() {
  const [tab, setTab] = React.useState<"setup" | "recurring">("setup");
  const groups = OFFICIAL_PORTALS[tab];
  const count = (k: "setup" | "recurring") => OFFICIAL_PORTALS[k].reduce((n, g) => n + g.rows.length, 0);
  return (
    <SectionCard
      title="Official portals"
      icon={{ Icon: ExternalLink, tone: "teal" }}
      flush
      right={
        <Tabs
          items={[
            { key: "setup", label: "Setup", count: count("setup") },
            { key: "recurring", label: "Recurring", count: count("recurring") },
          ]}
          value={tab}
          onChange={(k) => setTab(k as "setup" | "recurring")}
        />
      }
    >
      {groups.map((g) => (
        <div key={g.group}>
          <p className="border-t border-line-soft bg-raised px-4 py-1.5 text-11.5 font-semibold text-faint first:border-t-0 md:px-5">{g.group}</p>
          {g.rows.map((r) => (
            <ListRow key={r.name} className="py-1.5">
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <a href={`https://${r.host}`} target="_blank" rel="noreferrer" className="grid h-[30px] w-[30px] place-items-center rounded-md text-muted hover:bg-raised hover:text-ink" aria-label={`Open portal for ${r.name}`} title="Portal">
                <ExternalLink size={15} strokeWidth={1.5} />
              </a>
              <a href={`https://${r.host}`} target="_blank" rel="noreferrer" className="grid h-[30px] w-[30px] place-items-center rounded-md text-muted hover:bg-raised hover:text-ink" aria-label={`Read circular for ${r.name}`} title="Circular">
                <FileText size={15} strokeWidth={1.5} />
              </a>
            </ListRow>
          ))}
        </div>
      ))}
    </SectionCard>
  );
}

export function AnnouncementsScreen({ portal }: { portal: Portal }) {
  const staff = portal !== "client";
  const [list, setList] = React.useState<Ann[]>(ANNS);
  const [tab, setTab] = React.useState("all");
  const [read, setRead] = React.useState<Set<string>>(new Set());
  const [open, setOpen] = React.useState<number | null>(null);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const toast = useUndoToast();

  const shown = list.filter(FILTERS[tab]);
  const isUnread = (a: Ann) => !!a.unread && !read.has(a.id);
  const openAt = (i: number) => {
    setOpen(i);
    const a = shown[i];
    if (a) setRead((s) => new Set(s).add(a.id));
  };

  const post = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const me = portal === "lead" ? { name: "Bharath", role: "Project lead", ini: "BH" } : portal === "manager" ? { name: "Pranay", role: "Manager", ini: "PN" } : { name: "Krishna", role: "Admin", ini: "KR" };
    const a: Ann = { id: `p${Date.now()}`, date: new Date(2026, 9, 6), time: "now", kind: "Compliance", title: title.trim(), body: body.trim(), by: me };
    setList((l) => [a, ...l]);
    setTitle("");
    setBody("");
    toast.show("Posted to all clients", () => setList((l) => l.filter((x) => x.id !== a.id)));
  };

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Announcements"
          flush
          right={
            <Tabs
              items={[
                { key: "all", label: "All", count: list.length },
                { key: "important", label: "Important", count: list.filter(FILTERS.important).length },
                { key: "general", label: "General", count: list.filter(FILTERS.general).length },
              ]}
              value={tab}
              onChange={setTab}
            />
          }
        >
          {shown.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-4 md:px-5">
              <span className="flex-1 text-13 text-faint">None</span>
              <Button size="sm" onClick={() => setTab("all")}>
                See all
              </Button>
            </div>
          ) : (
            shown.map((a, i) => {
              const u = isUnread(a);
              return (
                <ListRow key={a.id} onClick={() => openAt(i)} className="items-center">
                  <DateTile date={a.date} tint={a.kind === "Deadline" ? "warn" : "idle"} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <Tag tone={ANN_TONE[a.kind]}>{a.kind}</Tag>
                      <span className="text-12 text-muted">{byLine(a)}</span>
                      {a.host && <Tag className="font-mono sm:hidden">{a.host}</Tag>}
                    </span>
                    <span className={cn("mt-1 block truncate text-13.5", u ? "font-bold" : "font-semibold")}>{a.title}</span>
                  </span>
                  {a.host && <Tag className="hidden font-mono sm:inline-flex">{a.host}</Tag>}
                  <span className={cn("h-2 w-2 flex-none rounded-full", u ? "bg-accent" : "bg-transparent")} role={u ? "img" : undefined} aria-label={u ? "Unread" : undefined} />
                </ListRow>
              );
            })
          )}
        </SectionCard>
      </Col>
      <Col>
        <PortalsCard />
        {staff && (
          <SectionCard title="Post an announcement">
            <form className="grid gap-3" onSubmit={post}>
              <Field label="Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Body">
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="rounded-md border border-line bg-surface px-3 py-2 text-13.5 text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent-line" />
              </Field>
              <Button type="submit" variant="primary" className="justify-self-end" disabled={!title.trim()}>
                Post to all clients
              </Button>
            </form>
          </SectionCard>
        )}
      </Col>
      {open !== null && <AnnDetail list={shown} index={open} onIndex={openAt} onClose={() => setOpen(null)} portal={portal} />}
      {toast.node}
    </Cols>
  );
}
