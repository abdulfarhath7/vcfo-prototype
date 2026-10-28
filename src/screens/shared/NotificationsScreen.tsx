"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bell, CalendarClock, ChevronRight, CircleCheck, FileText, Mail, Megaphone, MessageSquareText, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { NOTIFS, STAFF_NOTIFS, NOTIF_GROUPS, NOTIF_GROUP_HOME, NOTIF_TYPE, portalHref, type Notif, type NotifGroup, type NotifType } from "@/data/updates-team";
import type { Tone } from "@/components/icons";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { IconTile } from "@/components/ui/IconTile";
import { Modal } from "@/components/ui/Modal";
import { SidePanel, PanelSection } from "@/components/ui/SidePanel";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { StackedBar } from "@/components/cards/StackedBar";
import { Cols, Col } from "@/components/shell/Page";
import type { Portal } from "@/data/nav";

/* notif_redesign: tabs, groups by day, type tile, linked second line, chip, who and time, unread dot, arrow button.
   No "Mark all read" on the page: no CHANGES row asks for it (the bell menus have it, C-0049).
   notif_drill: the "This month" legend opens a pop-up with tabs and rows. notif_empty: Unread with nothing unread.
   Row detail opens in a side panel with the linked step. Kept out: the bot in the empty state (R-04). */

const TYPE_ICON: Record<NotifType, { Icon: LucideIcon; tone: Tone }> = {
  doc: { Icon: FileText, tone: "blue" },
  back: { Icon: FileText, tone: "blue" },
  step: { Icon: CircleCheck, tone: "green" },
  time: { Icon: CircleCheck, tone: "green" },
  deadline: { Icon: CalendarClock, tone: "amber" },
  mail: { Icon: Mail, tone: "violet" },
  ann: { Icon: Megaphone, tone: "amber" },
  team: { Icon: Users, tone: "blue" },
  bot: { Icon: MessageSquareText, tone: "blue" },
};

const GROUPS: NotifGroup[] = ["Documents", "Steps", "Deadlines", "Messages"];
// Staff portals add a Chatbot tab (s/lead/Notifications). "This month" keeps the four groups.
const TAB_GROUPS = (staff: boolean): NotifGroup[] => (staff ? [...GROUPS, "Chatbot"] : GROUPS);
const BAR_TONE = { Documents: "warn", Steps: "accent", Deadlines: "bad", Messages: "teal", Chatbot: "accent" } as const;
const grp = (n: Notif) => NOTIF_TYPE[n.type].group;

function Parts({ n, portal }: { n: Notif; portal: Portal }) {
  return (
    <>
      {n.parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="mx-1.5 text-faint">·</span>}
          {p.href ? (
            p.href.startsWith("http") ? (
              <a href={p.href} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                {p.text} ↗
              </a>
            ) : (
              <Link href={portalHref(portal, p.href)!} className="text-accent hover:underline">
                {p.text}
              </Link>
            )
          ) : (
            <span>{p.text}</span>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

function Who({ n, portal }: { n: Notif; portal: Portal }) {
  return n.person ? (
    <Link href={portalHref(portal, "/client/profile?tab=team")!} className={cn("hover:underline", portal !== "client" && "font-semibold text-accent")}>
      {n.who}
    </Link>
  ) : (
    <span>{n.who}</span>
  );
}

/** One notification row: type tile, title link, linked second line, chip, unread dot, open. */
function NotifRow({ n, unread, onRead, onOpen, portal }: { n: Notif; unread: boolean; onRead: () => void; onOpen: () => void; portal: Portal }) {
  const t = NOTIF_TYPE[n.type];
  const ic = TYPE_ICON[n.type];
  return (
    <div className={cn("flex items-center gap-3 border-t border-line-soft px-4 py-2.5 text-13.5 md:px-5", unread && "bg-accent-soft")}>
      <span title={t.tip} className="flex-none self-start sm:self-center">
        <IconTile Icon={ic.Icon} tone={ic.tone} size={30} />
      </span>
      <span className="min-w-0 flex-1">
        <Link href={portalHref(portal, n.href)!} onClick={onRead} className={cn("block hover:underline", unread ? "font-bold" : "font-semibold")}>
          {n.title}
        </Link>
        <span className="mt-0.5 block text-12.5 text-ink-2">
          <Parts n={n} portal={portal} />
        </span>
        <span className="mt-0.5 block text-12 text-muted sm:hidden">
          <Who n={n} portal={portal} /> · {n.when}
        </span>
      </span>
      <span className="hidden w-[120px] flex-none sm:block">
        <Chip tone={t.tone} dot={false}>
          {t.chip}
        </Chip>
      </span>
      <span className="hidden w-[150px] flex-none text-right text-12 text-muted sm:block">
        <Who n={n} portal={portal} /> · {n.when}
      </span>
      <span className="flex flex-none items-center gap-1.5">
        {unread ? (
          <button type="button" onClick={onRead} className="grid h-5 w-5 place-items-center rounded-sm hover:bg-surface" aria-label="Unread · mark as read" title="Mark as read">
            <span className="h-2 w-2 rounded-[2px] bg-accent" />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Button size="iconSm" onClick={onOpen} aria-label={`Open ${n.title}`}>
          <ArrowRight size={15} strokeWidth={1.6} />
        </Button>
      </span>
    </div>
  );
}

export function NotificationsScreen({ portal }: { portal: Portal }) {
  const [tab, setTab] = React.useState("all");
  const [read, setRead] = React.useState<Set<string>>(new Set());
  const [drill, setDrill] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<Notif | null>(null);

  const staff = portal !== "client";
  const LIST = staff ? STAFF_NOTIFS : NOTIFS;
  const isU = (n: Notif) => n.unread && !read.has(n.id);
  const unread = LIST.filter(isU).length;
  const markRead = (id: string) => setRead((s) => new Set(s).add(id));
  const filters: Record<string, (n: Notif) => boolean> = { all: () => true, unread: isU, ...Object.fromEntries(TAB_GROUPS(staff).map((g) => [g, (n: Notif) => grp(n) === g])) };
  const shown = LIST.filter(filters[tab]);
  const groups = NOTIF_GROUPS.map((label, gi) => ({ label, rows: shown.filter((n) => n.g === gi) })).filter((g) => g.rows.length);
  const cnt = (g: NotifGroup) => LIST.filter((n) => grp(n) === g).length;

  const dRows = drill === null ? [] : LIST.filter((n) => drill === "all" || grp(n) === drill);
  const dHome = drill && drill !== "all" ? NOTIF_GROUP_HOME[drill as NotifGroup] : null;

  return (
    <Cols className="lg:grid-cols-[minmax(0,1fr)_272px] xl:grid-cols-[minmax(0,1fr)_272px]">
      <Col>
        {/* R-09: no card title that repeats the sidebar. The tabs head the card, as in the old screen. */}
        <SectionCard bare title="Notifications" bodyClassName="p-0">
          <div className="overflow-x-auto border-b border-line-soft px-4 py-3 md:px-5">
            <Tabs
              size="md"
              items={[
                { key: "all", label: "All", count: LIST.length },
                { key: "unread", label: "Unread", count: unread },
                ...TAB_GROUPS(staff).map((g) => ({ key: g, label: g, count: cnt(g) })),
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
          {groups.length === 0 ? (
            <div role="status" className="flex items-center gap-3 px-4 py-4 md:px-5">
              <span className="flex-1 text-13 text-faint">Nothing unread</span>
              <Button size="sm" onClick={() => setTab("all")}>
                See all
              </Button>
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.label}>
                <p className="border-t border-line-soft px-4 pb-2 pt-3 text-12 font-semibold text-ink first:border-t-0 md:px-5">{g.label}</p>
                {g.rows.map((n) => (
                  <NotifRow
                    key={n.id}
                    n={n}
                    portal={portal}
                    unread={isU(n)}
                    onRead={() => markRead(n.id)}
                    onOpen={() => {
                      markRead(n.id);
                      setDetail(n);
                    }}
                  />
                ))}
              </div>
            ))
          )}
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="This month" flush>
          <button type="button" onClick={() => setDrill("all")} className="block w-full px-4 pt-4 text-left hover:bg-raised md:px-5" aria-label={`Show all ${LIST.length} notifications`}>
            <span className="text-24 font-semibold leading-none">{LIST.length}</span>
            <span className="ml-2 text-12.5 text-muted">this month</span>
          </button>
          <div className="px-4 pb-2 pt-3 md:px-5">
            <StackedBar segments={GROUPS.map((g) => ({ label: g, value: cnt(g), tone: BAR_TONE[g] }))} className="[&>ul]:hidden" />
          </div>
          {GROUPS.map((g) => (
            <ListRow key={g} onClick={() => setDrill(g)} className="py-2 text-13">
              <span className="min-w-0 flex-1">{g}</span>
              <b className="font-mono font-semibold">{cnt(g)}</b>
              <ChevronRight size={14} strokeWidth={1.6} className="text-faint" />
            </ListRow>
          ))}
        </SectionCard>
        {(
          <SectionCard title="Northwind gets these by" flush>
            <div className="grid gap-2 px-4 py-4 md:px-5">
              <span className="flex flex-wrap gap-2">
                <Chip tone="prog" dot={false}>✓ Email</Chip>
                <Chip tone="ok" dot={false}>✓ WhatsApp</Chip>
              </span>
              <Link href={portalHref(portal, "/client/profile?tab=settings")!} className="text-13 font-semibold text-accent hover:underline">
                Change in Settings ›
              </Link>
            </div>
          </SectionCard>
        )}
      </Col>

      <Modal
        open={drill !== null}
        onOpenChange={(v) => !v && setDrill(null)}
        size="lg"
        flush
        title="This month"
        sub={<span>{dRows.length} notifications</span>}
        right={
          <span className="hidden md:inline-flex">
            <Tabs items={[{ key: "all", label: "All", count: LIST.length }, ...TAB_GROUPS(staff).map((g) => ({ key: g, label: g, count: cnt(g) }))]} value={drill ?? "all"} onChange={setDrill} />
          </span>
        }
        footer={
          dHome ? (
            <Button asChild variant="primary">
              <Link href={portalHref(portal, dHome.href)!}>{dHome.label}</Link>
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setDrill(null)}>
              Show in the list
            </Button>
          )
        }
      >
        <div className="border-b border-line-soft px-4 py-2 md:hidden">
          <Tabs items={[{ key: "all", label: "All" }, ...TAB_GROUPS(staff).map((g) => ({ key: g, label: g, count: cnt(g) }))]} value={drill ?? "all"} onChange={setDrill} />
        </div>
        {dRows.map((n) => {
          const ic = TYPE_ICON[n.type];
          return (
            <ListRow
              key={n.id}
              onClick={() => {
                setDrill(null);
                setDetail(n);
                markRead(n.id);
              }}
            >
              <IconTile Icon={ic.Icon} tone={ic.tone} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{n.title}</span>
                <span className="block truncate font-mono text-12 text-muted">
                  {n.who} · {n.when}
                </span>
              </span>
              <Chip tone={NOTIF_TYPE[n.type].tone} className="hidden sm:inline-flex">
                {NOTIF_TYPE[n.type].chip}
              </Chip>
            </ListRow>
          );
        })}
      </Modal>

      <SidePanel
        open={detail !== null}
        onOpenChange={(v) => !v && setDetail(null)}
        title={detail?.title ?? ""}
        eyebrow={
          detail && (
            <>
              <Bell size={14} strokeWidth={1.6} /> {NOTIF_TYPE[detail.type].tip}
            </>
          )
        }
        sub={detail && <Tag tone={NOTIF_TYPE[detail.type].tone}>{NOTIF_TYPE[detail.type].chip}</Tag>}
        footer={
          detail && (
            <Button asChild variant="primary">
              <Link href={portalHref(portal, detail.href)!}>{detail.cta}</Link>
            </Button>
          )
        }
      >
        {detail && (
          <>
            <PanelSection>
              <KeyValue
                rows={[
                  { k: "From", v: detail.who },
                  { k: "When", v: detail.when, mono: true },
                  { k: "Area", v: NOTIF_TYPE[detail.type].group },
                ]}
              />
              <p className="mt-3 text-13.5 text-ink-2">
                <Parts n={detail} portal={portal} />
              </p>
            </PanelSection>
            {detail.step && (
              <PanelSection title="Linked step">
                <Link href={portalHref(portal, `/client/incorporation/step/${detail.step.n}`)!} className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 hover:bg-raised">
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-accent-soft font-mono text-12 font-semibold text-accent">{detail.step.n}</span>
                  <span className="min-w-0 flex-1 truncate text-13.5 font-semibold">{detail.step.title}</span>
                  <Chip>{detail.step.status}</Chip>
                </Link>
              </PanelSection>
            )}
          </>
        )}
      </SidePanel>
    </Cols>
  );
}
