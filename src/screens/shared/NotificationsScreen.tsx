"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { fmt, TODAY, daysFrom } from "@/lib/dates";
import { NOTIFICATIONS, type Notification } from "@/data/shared";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Tag, type ChipTone } from "@/components/ui/Chip";
import { SectionCard } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { Cols, Col } from "@/components/shell/Page";
import type { Portal } from "@/data/nav";

const kindTone: Record<Notification["kind"], ChipTone> = { Action: "warn", Update: "prog", Reminder: "violet", Done: "ok" };

function group(n: Notification) {
  const k = daysFrom(n.date);
  if (k === 0) return "Today";
  if (k === -1) return "Yesterday";
  if (k >= -7) return "This week";
  return "Earlier";
}

export function NotificationsScreen({ portal }: { portal: Portal }) {
  const [tab, setTab] = React.useState("all");
  const [read, setRead] = React.useState<Set<string>>(new Set(NOTIFICATIONS.filter((n) => n.read).map((n) => n.id)));
  const unread = NOTIFICATIONS.filter((n) => !read.has(n.id)).length;
  const shown = NOTIFICATIONS.filter((n) => tab === "all" || (tab === "unread" ? !read.has(n.id) : n.kind === tab));
  const groups = ["Today", "Yesterday", "This week", "Earlier"].map((g) => ({ g, rows: shown.filter((n) => group(n) === g) })).filter((g) => g.rows.length);
  const staffHref = (h?: string) => (h && portal !== "client" ? h.replace("/client/incorporation", `/${portal}/clients/northwind`) : h);

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Notifications"
          flush
          right={
            <>
              <Tabs
                items={[
                  { key: "all", label: "All", count: NOTIFICATIONS.length },
                  { key: "unread", label: "Unread", count: unread },
                  { key: "Action", label: "Action" },
                  { key: "Update", label: "Update" },
                  { key: "Reminder", label: "Reminder" },
                ]}
                value={tab}
                onChange={setTab}
              />
              <Button size="sm" onClick={() => setRead(new Set(NOTIFICATIONS.map((n) => n.id)))} disabled={unread === 0}>
                Mark all read
              </Button>
            </>
          }
        >
          {groups.length === 0 && <p className="px-5 py-4 text-13 text-faint">None</p>}
          {groups.map((g) => (
            <div key={g.g}>
              <p className="border-t border-line-soft bg-raised px-4 py-1.5 text-11.5 font-semibold text-faint first:border-t-0 md:px-5">{g.g}</p>
              {g.rows.map((n) => {
                const isRead = read.has(n.id);
                const inner = (
                  <>
                    <span className={cn("mt-2 h-1.5 w-1.5 flex-none rounded-full", isRead ? "bg-transparent" : "bg-accent")} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-13.5", !isRead && "font-semibold")}>{n.title}</span>
                      <span className="block text-12 text-muted">
                        {n.who} · {fmt(n.date)} {n.time}
                      </span>
                    </span>
                    <Tag tone={kindTone[n.kind]}>{n.kind}</Tag>
                  </>
                );
                const cls = "flex items-start gap-3 border-t border-line-soft px-4 py-2.5 hover:bg-raised md:px-5";
                const href = staffHref(n.href);
                return href ? (
                  <Link key={n.id} href={href} className={cls} onClick={() => setRead((s) => new Set(s).add(n.id))}>
                    {inner}
                  </Link>
                ) : (
                  <button key={n.id} type="button" className={cn(cls, "w-full text-left")} onClick={() => setRead((s) => new Set(s).add(n.id))}>
                    {inner}
                  </button>
                );
              })}
            </div>
          ))}
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="This month" meta={fmt(TODAY).split(" ")[1] + " 2026"}>
          <StackedBar
            total={NOTIFICATIONS.length}
            segments={[
              { label: "Action", value: NOTIFICATIONS.filter((n) => n.kind === "Action").length, tone: "warn" },
              { label: "Update", value: NOTIFICATIONS.filter((n) => n.kind === "Update").length, tone: "accent" },
              { label: "Reminder", value: NOTIFICATIONS.filter((n) => n.kind === "Reminder").length, tone: "violet" },
              { label: "Done", value: NOTIFICATIONS.filter((n) => n.kind === "Done").length, tone: "ok" },
            ]}
          />
        </SectionCard>
        {portal === "client" && (
          <SectionCard title="Northwind gets these by" flush>
            <div className="grid gap-2 px-5 py-4 text-13.5">
              <span>Email · rohan@northwind.in</span>
              <span>WhatsApp · +91 98111 22334</span>
              <Link href="/client/profile?tab=settings" className="text-13 font-semibold text-accent">
                Change in Settings ›
              </Link>
            </div>
          </SectionCard>
        )}
      </Col>
    </Cols>
  );
}
