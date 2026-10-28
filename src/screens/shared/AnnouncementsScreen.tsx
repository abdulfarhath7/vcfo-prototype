"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, FileText, Landmark, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { ANNS, ANN_PRANAY, ANN_TONE, OFFICIAL_PORTALS, isImportant, portalHref, type Ann } from "@/data/updates-team";
import { WHATSAPP } from "@/data/people";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
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
  const act = "grid h-[34px] w-[34px] flex-none place-items-center rounded-md border border-line text-ink-2 hover:bg-raised hover:text-ink";
  return (
    <SectionCard title="Official portals" icon={{ Icon: Landmark, tone: "blue" }} bodyClassName="grid gap-1 px-4 pb-3 pt-3 md:px-5">
      <div>
        <Tabs
          items={[
            { key: "setup", label: "Setup", count: count("setup") },
            { key: "recurring", label: "Recurring", count: count("recurring") },
          ]}
          value={tab}
          onChange={(k) => setTab(k as "setup" | "recurring")}
        />
      </div>
      {groups.map((g) => (
        <div key={g.group}>
          <p className="border-b border-line-soft pb-1.5 pt-2 text-11.5 font-semibold text-muted">{g.group}</p>
          {g.rows.map((r) => (
            <div key={r.name} className="flex min-h-[45px] items-center gap-2 border-b border-line-soft py-1.5 text-13.5 last:border-b-0">
              <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
              <a href={`https://${r.host}`} target="_blank" rel="noreferrer" className={act} aria-label={`Open portal for ${r.name}`} title="Portal">
                <ArrowUpRight size={15} strokeWidth={1.5} />
              </a>
              <a href={`https://${r.host}`} target="_blank" rel="noreferrer" className={act} aria-label={`Read circular for ${r.name}`} title="Circular">
                <FileText size={15} strokeWidth={1.5} />
              </a>
            </div>
          ))}
        </div>
      ))}
    </SectionCard>
  );
}

/** Old date tile: day without a leading zero over the month, on a soft tint. */
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function AnnDate({ date, warn, upper }: { date: Date; warn: boolean; upper: boolean }) {
  return (
    <span className={cn("grid h-[52px] w-[50px] flex-none content-center justify-items-center rounded-md", warn ? "bg-warn-soft text-warn" : "bg-accent-soft text-ink")} aria-hidden>
      <span className="text-[18px] font-bold leading-none">{date.getDate()}</span>
      <span className={cn("mt-1 text-11 font-bold leading-none", upper && "uppercase tracking-wide")}>{MON[date.getMonth()]}</span>
    </span>
  );
}

/** Deadline, MCA and Compliance show a soft chip with a dot. Other kinds show a plain outlined tag. */
function KindChip({ kind }: { kind: Ann["kind"] }) {
  if (kind === "Deadline" || kind === "MCA" || kind === "Compliance")
    return (
      <Chip tone={ANN_TONE[kind]} className="w-[120px] justify-center">
        {kind}
      </Chip>
    );
  return <span className="inline-flex h-[22px] items-center rounded-sm border border-line bg-surface px-1.5 text-11.5 font-semibold text-ink-2">{kind}</span>;
}

export function AnnouncementsScreen({ portal }: { portal: Portal }) {
  const staff = portal !== "client";
  // s/lead/Announcements: on staff portals the bank-account note comes from Pranay.
  const [list] = React.useState<Ann[]>(() => (staff ? ANNS.map((a) => (a.id === "a6" ? { ...a, by: ANN_PRANAY } : a)) : ANNS));
  const [tab, setTab] = React.useState("all");
  const [read, setRead] = React.useState<Set<string>>(new Set());
  const [open, setOpen] = React.useState<number | null>(null);

  const shown = list.filter(FILTERS[tab]);
  const isUnread = (a: Ann) => !!a.unread && !read.has(a.id);
  const openAt = (i: number) => {
    setOpen(i);
    const a = shown[i];
    if (a) setRead((s) => new Set(s).add(a.id));
  };

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Latest"
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
                <ListRow key={a.id} onClick={() => openAt(i)} className={cn("min-h-[79px] items-center", u && "bg-accent-soft hover:bg-accent-soft")}>
                  <AnnDate date={a.date} warn={a.kind === "Deadline"} upper={!staff} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <KindChip kind={a.kind} />
                      <span className="text-12 text-muted">{byLine(a)}</span>
                      {a.host && <Tag className="border border-line sm:hidden">{a.host}</Tag>}
                    </span>
                    <span className={cn("mt-1.5 block truncate text-14", u ? "font-bold" : "font-semibold")}>{a.title}</span>
                  </span>
                  {a.host && <Tag className="hidden border border-line sm:inline-flex">{a.host}</Tag>}
                  <span className={cn("h-2 w-2 flex-none rounded-full", u ? "bg-accent" : "bg-transparent")} role={u ? "img" : undefined} aria-label={u ? "Unread" : undefined} />
                </ListRow>
              );
            })
          )}
        </SectionCard>
      </Col>
      <Col>
        <PortalsCard />
      </Col>
      {open !== null && <AnnDetail list={shown} index={open} onIndex={openAt} onClose={() => setOpen(null)} portal={portal} />}
    </Cols>
  );
}
