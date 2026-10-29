"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { TODAY, fmt, relative, urgency } from "@/lib/dates";
import {
  AREAS,
  AREA_TONE,
  FREQUENCIES,
  OBLIGATIONS,
  OB_STATUS_BAR,
  OB_STATUS_TONE,
  dueWithin,
  obHref,
  type ObStatus,
  type Obligation,
} from "@/data/compliance";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import type { Tile } from "@/components/cards/TileGrid";
import {
  AttentionList,
  type AttentionRow,
} from "@/components/cards/AttentionList";
import { StackedBar } from "@/components/cards/StackedBar";
import {
  HeadSearch,
  RegisterTiles,
  useBeforeCoi,
  type TileSection,
} from "./comp-parts";
import {
  AFTER_COI,
  OBLIGATIONS_BEFORE,
  beforeObLink,
} from "@/data/client-before-coi";

const STATUSES: ObStatus[] = [
  "Filed",
  "In progress",
  "Waiting on client",
  "Overdue",
  "Upcoming",
];

const tile = (o: Obligation, before = false): Tile => ({
  id: o.id,
  name: o.name,
  tag: { label: o.area, tone: AREA_TONE[o.area] },
  chip: { label: o.status, tone: OB_STATUS_TONE[o.status] },
  date: before
    ? AFTER_COI
    : o.status === "Filed" && o.filed
      ? `Filed ${fmt(o.filed)}`
      : `Due ${fmt(o.due)}`,
  late: o.status === "Overdue",
  href: before
    ? beforeObLink(o.id)
      ? obHref("client", beforeObLink(o.id)!)
      : undefined
    : obHref("client", o.id),
});

export function ObligationsScreen() {
  const router = useRouter();
  const before = useBeforeCoi();
  const [view, setView] = React.useState("freq");
  const [q, setQ] = React.useState("");
  // Before the certificate every obligation is "Upcoming" (old Item.dc.html).
  const obs = before ? OBLIGATIONS_BEFORE : OBLIGATIONS;
  const toTile = (o: Obligation) => tile(o, before);

  const sections: TileSection[] =
    view === "freq"
      ? FREQUENCIES.map((f) => ({
          id: f,
          label: f,
          tiles: obs.filter((o) => o.frequency === f).map(toTile),
        }))
      : AREAS.map((a) => ({
          id: a,
          label: a,
          tiles: obs.filter((o) => o.area === a).map(toTile),
        }));
  const openFirst = () => {
    const hit = sections
      .flatMap((s) => s.tiles)
      .find((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()));
    if (q.trim() && hit?.href) router.push(hit.href);
  };

  const due: AttentionRow[] = (before ? [] : dueWithin(15)).map((o) => {
    const late = o.due < TODAY;
    return {
      id: o.id,
      date: o.due,
      title: `${o.name} · ${o.period}`,
      sub: o.area,
      chip: { label: relative(o.due), tone: urgency(o.due) },
      urgent: late,
      action: late ? { label: "Fix", href: obHref("client", o.id) } : undefined,
      href: late ? undefined : obHref("client", o.id),
    };
  });

  const waiting = obs.filter(
    (o) => o.owner === "client" && o.status !== "Filed",
  );

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Obligations"
          meta={<span className="hidden sm:inline">{obs.length}</span>}
          flush
          right={
            <>
              <HeadSearch
                value={q}
                onChange={setQ}
                onEnter={openFirst}
                label="Search obligations"
              />
              <Tabs
                items={[
                  { key: "freq", label: "By frequency" },
                  { key: "law", label: "By law" },
                ]}
                value={view}
                onChange={setView}
              />
            </>
          }
        >
          <RegisterTiles
            key={view}
            sections={sections}
            query={q}
            onClear={() => setQ("")}
          />
        </SectionCard>
      </Col>
      <Col>
        <SectionCard
          title="Due in the next 15 days"
          icon={{ Icon: Calendar, tone: "teal" }}
          flush
        >
          {before ? (
            <Empty>After the certificate</Empty>
          ) : (
            <AttentionList rows={due} today={TODAY} />
          )}
        </SectionCard>
        <SectionCard title="Waiting on client" flush>
          {waiting.length === 0 ? (
            <Empty />
          ) : (
            waiting.map((o) => (
              <ListRow key={o.id}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{o.name}</span>
                  <span className="block truncate text-12.5 text-muted">
                    {o.needs[0]}
                  </span>
                </span>
                <Button asChild size="sm">
                  <Link href={obHref("client", o.id)}>
                    {o.needs[0].includes("OTP") ? "Approve" : "Upload"}
                  </Link>
                </Button>
              </ListRow>
            ))
          )}
        </SectionCard>
        <SectionCard title="Progress flow">
          <StackedBar
            segments={STATUSES.map((s) => ({
              label: s,
              value: obs.filter((o) => o.status === s).length,
              tone: OB_STATUS_BAR[s],
            }))}
          />
        </SectionCard>
      </Col>
    </Cols>
  );
}
