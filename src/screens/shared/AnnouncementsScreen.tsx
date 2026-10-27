"use client";
import * as React from "react";
import { ExternalLink } from "lucide-react";
import { fmt } from "@/lib/dates";
import { ANNOUNCEMENTS, PORTALS_LIST, type Announcement } from "@/data/shared";
import { Tabs } from "@/components/ui/Tabs";
import { Tag, type ChipTone } from "@/components/ui/Chip";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { DateTile } from "@/components/cards/AttentionList";
import { Cols, Col } from "@/components/shell/Page";
import type { Portal } from "@/data/nav";

const kindTone: Record<Announcement["kind"], ChipTone> = { Deadline: "warn", Portal: "violet", SBC: "prog", "Law change": "teal" };

export function AnnouncementsScreen({ portal }: { portal: Portal }) {
  const [tab, setTab] = React.useState("all");
  const kinds: Announcement["kind"][] = ["Deadline", "Portal", "SBC", "Law change"];
  const shown = ANNOUNCEMENTS.filter((a) => tab === "all" || a.kind === tab);
  const staff = portal !== "client";
  return (
    <Cols>
      <Col>
        <SectionCard
          title="Announcements"
          flush
          right={<Tabs items={[{ key: "all", label: "All", count: ANNOUNCEMENTS.length }, ...kinds.map((k) => ({ key: k, label: k, count: ANNOUNCEMENTS.filter((a) => a.kind === k).length }))]} value={tab} onChange={setTab} />}
        >
          {shown.map((a) => (
            <ListRow key={a.id} className="items-start">
              <DateTile date={a.date} tint="idle" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{a.title}</span>
                  <Tag tone={kindTone[a.kind]}>{a.kind}</Tag>
                </span>
                <span className="mt-0.5 block text-13 text-ink-2">{a.body}</span>
                <span className="mt-1 block text-12 text-muted">
                  {a.by} · {fmt(a.date)}
                  {a.link && (
                    <>
                      <span className="mx-1.5 text-faint">·</span>
                      <a href={`https://${a.link.host}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent">
                        {a.link.label} <ExternalLink size={12} strokeWidth={1.5} />
                      </a>
                    </>
                  )}
                </span>
              </span>
            </ListRow>
          ))}
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="Official portals" flush>
          {PORTALS_LIST.map((g) => (
            <div key={g.group}>
              <p className="flex items-center gap-2 border-t border-line-soft bg-raised px-4 py-1.5 text-11.5 font-semibold text-faint first:border-t-0 md:px-5">
                {g.group} <span>{g.items.length}</span>
              </p>
              {g.items.map((it) => (
                <ListRow key={it} className="py-2">
                  <span className="min-w-0 flex-1 truncate">{it}</span>
                  <ExternalLink size={14} strokeWidth={1.5} className="text-faint" />
                </ListRow>
              ))}
            </div>
          ))}
        </SectionCard>
        {staff && (
          <SectionCard title="Post an announcement">
            <form className="grid gap-3" onSubmit={(e) => e.preventDefault()}>
              <input placeholder="Title" className="h-9 rounded-md border border-line bg-surface px-3 text-13.5 outline-none placeholder:text-faint" />
              <textarea placeholder="Body" rows={3} className="rounded-md border border-line bg-surface px-3 py-2 text-13.5 outline-none placeholder:text-faint" />
              <button type="submit" className="h-9 justify-self-end rounded-md bg-navy px-3.5 text-13.5 font-semibold text-white hover:bg-navy-hover">
                Post to all clients
              </button>
            </form>
          </SectionCard>
        )}
      </Col>
    </Cols>
  );
}
