"use client";
import * as React from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { TODAY, daysFrom, relative, urgency } from "@/lib/dates";
import { ACTIVE_REGISTRATIONS, REGULATOR_LABEL, REGULATOR_TONE, REG_STATUS_TONE, regHref, type Registration, type RegStatus, type Regulator } from "@/data/registrations";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { TileGrid, type Tile, type TileGroup } from "@/components/cards/TileGrid";
import { AttentionList, type AttentionRow } from "@/components/cards/AttentionList";
import { StackedBar } from "@/components/cards/StackedBar";

const STATUS_ORDER: RegStatus[] = ["Waiting on client", "In progress", "Granted", "Not started"];
const REG_ORDER: Regulator[] = ["GST", "MCA", "IT", "Labour", "IP", "FEMA", "Other"];

const tile = (r: Registration): Tile => ({
  id: r.id,
  name: r.name,
  tag: { label: REGULATOR_LABEL[r.regulator], tone: REGULATOR_TONE[r.regulator] },
  chip: { label: r.status, tone: REG_STATUS_TONE[r.status] },
  date: r.nextLabel,
  late: r.status === "Waiting on client" && !!r.next && r.next < TODAY,
  href: regHref("client", r.id),
});

export function RegistrationsScreen() {
  const [view, setView] = React.useState("status");
  const regs = ACTIVE_REGISTRATIONS;

  const groups: TileGroup[] =
    view === "status"
      ? STATUS_ORDER.map((s) => ({ label: s, tiles: regs.filter((r) => r.status === s).map(tile) }))
      : REG_ORDER.map((g) => ({ label: REGULATOR_LABEL[g], tiles: regs.filter((r) => r.regulator === g).map(tile) }));

  const due: AttentionRow[] = regs
    .filter((r) => r.next && (r.status === "In progress" || r.status === "Waiting on client") && daysFrom(r.next) <= 15)
    .sort((a, b) => a.next!.getTime() - b.next!.getTime())
    .map((r) => ({ id: r.id, date: r.next!, title: r.name, sub: r.nextLabel, chip: { label: relative(r.next!), tone: urgency(r.next!) }, href: regHref("client", r.id) }));

  const waiting = regs.filter((r) => r.status === "Waiting on client");
  const count = (s: RegStatus) => regs.filter((r) => r.status === s).length;

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Registrations"
          meta={<span className="hidden sm:inline">{regs.length}</span>}
          flush
          right={
            <Tabs
              items={[
                { key: "status", label: "By status" },
                { key: "regulator", label: "By regulator" },
              ]}
              value={view}
              onChange={setView}
            />
          }
        >
          <TileGrid groups={groups} />
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="Due in the next 15 days" icon={{ Icon: Calendar, tone: "teal" }} flush>
          <AttentionList rows={due} />
        </SectionCard>
        <SectionCard title="Waiting on client" flush>
          {waiting.length === 0 ? (
            <Empty />
          ) : (
            waiting.map((r) => (
              <ListRow key={r.id}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.name}</span>
                  <span className="block truncate text-12.5 text-muted">{r.docs.filter((x) => x.status === "Asked").map((x) => x.name).join(", ") || r.authority}</span>
                </span>
                <Button asChild size="sm">
                  <Link href={regHref("client", r.id)}>Upload</Link>
                </Button>
              </ListRow>
            ))
          )}
        </SectionCard>
        <SectionCard title="Progress flow">
          <StackedBar
            segments={[
              { label: "Granted", value: count("Granted"), tone: "ok" },
              { label: "In progress", value: count("In progress"), tone: "accent" },
              { label: "Waiting on client", value: count("Waiting on client"), tone: "warn" },
              { label: "Not started", value: count("Not started"), tone: "idle" },
            ]}
          />
        </SectionCard>
      </Col>
    </Cols>
  );
}
