"use client";
import * as React from "react";
import Link from "next/link";
import { AlertCircle, Bell, CircleCheck, Clock, Megaphone, Upload, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY } from "@/lib/dates";
import type { Tone } from "@/components/icons";
import { IconTile } from "@/components/ui/IconTile";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { clientById, type StaffPortal } from "@/data/staff-clients";
import { BELL_ANNOUNCEMENTS, bellItems, type BellKind } from "@/data/staff-bells";

// Staff bell dropdowns. Ported from reference/old-screens/s/lead/Palette.dc.html ("notifications bell", "announcements bell").
// The shared TopBar links its two bells to the Updates pages. For staff portals, mount these two buttons in their place.

const KIND: Record<BellKind, { Icon: LucideIcon; tone: Tone }> = {
  upload: { Icon: Upload, tone: "blue" },
  approved: { Icon: CircleCheck, tone: "amber" },
  late: { Icon: AlertCircle, tone: "red" },
  reminder: { Icon: Clock, tone: "amber" },
};

const BTN = "relative grid h-9 w-9 place-items-center rounded-md border border-line bg-surface text-ink-2 hover:bg-raised";
const FOOT = "text-12.5 font-semibold text-accent hover:underline";

function Count({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white" aria-hidden>
      {n}
    </span>
  );
}

/** Notifications bell: Received / Sent, mark all read, clear today / this week / all, link to the history page. */
export function StaffNotificationsBell({ portal }: { portal: StaffPortal }) {
  const [box, setBox] = React.useState<"received" | "sent">("received");
  const [read, setRead] = React.useState<Set<string>>(new Set());
  const [gone, setGone] = React.useState<Set<string>>(new Set());
  const all = bellItems(portal).filter((i) => !gone.has(i.id));
  const rows = all.filter((i) => i.box === box);
  const unread = all.filter((i) => i.box === "received" && i.unread && !read.has(i.id)).length;
  const weekStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - ((TODAY.getDay() + 6) % 7));
  const clear = (pick: (d: Date) => boolean) => setGone(new Set([...gone, ...rows.filter((i) => pick(i.date)).map((i) => i.id)]));

  return (
    <PopoverCard
      align="end"
      width={380}
      trigger={
        <button type="button" className={BTN} aria-label={`Notifications, ${unread} new`} title="Notifications">
          <Bell size={16} strokeWidth={1.5} />
          <Count n={unread} />
        </button>
      }
      title={
        <span className="flex items-center gap-2">
          Notifications
          <Tabs
            className="ml-auto"
            items={[
              { key: "received", label: "Received" },
              { key: "sent", label: "Sent" },
            ]}
            value={box}
            onChange={(k) => setBox(k as "received" | "sent")}
          />
        </span>
      }
      footer={
        <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
          <button type="button" className={FOOT} onClick={() => setRead(new Set(all.map((i) => i.id)))}>
            Mark all read
          </button>
          <button type="button" className={FOOT} onClick={() => clear((d) => d.getTime() === TODAY.getTime())}>
            Clear today
          </button>
          <button type="button" className={FOOT} onClick={() => clear((d) => d >= weekStart)}>
            Clear this week
          </button>
          <button type="button" className={FOOT} onClick={() => clear(() => true)}>
            Clear all
          </button>
          <Link href={`/${portal}/updates/notifications`} className={cn(FOOT, "ml-auto")}>
            Notification history ›
          </Link>
        </span>
      }
    >
      {rows.length === 0 ? (
        <p className="px-4 py-4 text-13 text-faint">None</p>
      ) : (
        <ul>
          {rows.map((i) => {
            const c = clientById(i.client);
            const fresh = i.unread && !read.has(i.id);
            const { Icon, tone } = KIND[i.kind];
            return (
              <li key={i.id}>
                <Link
                  href={`/${portal}/clients/${i.client}`}
                  onClick={() => setRead(new Set([...read, i.id]))}
                  className={cn("flex items-start gap-3 border-t border-line-soft px-4 py-2.5 first:border-t-0 hover:bg-raised", fresh && "bg-raised")}
                >
                  <IconTile Icon={Icon} tone={tone} />
                  <span className="min-w-0 flex-1">
                    <b className={cn("block truncate text-13", fresh ? "font-semibold" : "font-medium")}>{i.title}</b>
                    <span className="block truncate text-12 text-muted">
                      {c?.short}
                      {i.context && ` · ${i.context}`}
                    </span>
                  </span>
                  <span className="flex-none font-mono text-11.5 text-muted">{i.when}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PopoverCard>
  );
}

/** Announcements bell: All / Important / General, link to the Announcements page. Super admin and developer have no Announcements page, so they get the menu without the link. */
export function StaffAnnouncementsBell({ portal }: { portal: StaffPortal | "super" | "dev" }) {
  const page = portal !== "super" && portal !== "dev";
  const [f, setF] = React.useState("all");
  const rows = BELL_ANNOUNCEMENTS.filter((a) => f === "all" || (f === "important" ? a.important : !a.important));
  return (
    <PopoverCard
      align="end"
      width={360}
      trigger={
        <button type="button" className={BTN} aria-label="Announcements" title="Announcements">
          <Megaphone size={16} strokeWidth={1.5} />
        </button>
      }
      title={
        <span className="flex items-center gap-2">
          Announcements
          <Tabs
            className="ml-auto"
            items={[
              { key: "all", label: "All" },
              { key: "important", label: "Important" },
              { key: "general", label: "General" },
            ]}
            value={f}
            onChange={setF}
          />
        </span>
      }
      footer={
        page ? (
          <Link href={`/${portal}/updates/announcements`} className={cn(FOOT, "mr-auto")}>
            View all announcements ›
          </Link>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <p className="px-4 py-4 text-13 text-faint">None</p>
      ) : (
        <ul>
          {rows.map((a) => (
            <li key={a.id} className="grid gap-1 border-t border-line-soft px-4 py-2.5 first:border-t-0">
              {a.important && (
                <Chip tone="bad" className="w-fit">
                  Important
                </Chip>
              )}
              <b className="text-13 font-semibold">{a.title}</b>
              <span className="text-12 text-muted">{a.when}</span>
            </li>
          ))}
        </ul>
      )}
    </PopoverCard>
  );
}

/** Both bells, in top-bar order. */
export function StaffBellMenu({ portal }: { portal: StaffPortal }) {
  return (
    <>
      <StaffAnnouncementsBell portal={portal} />
      <StaffNotificationsBell portal={portal} />
    </>
  );
}
