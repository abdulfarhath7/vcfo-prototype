"use client";
import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, User } from "lucide-react";
import { TASKS } from "@/data/staff-tasks";
import { STAFF_CLIENTS, HEALTH_ORDER, clientById } from "@/data/staff-clients";
import { managerRows, leadRows, UNASSIGNED, ESCALATIONS, CAPACITY } from "@/data/staff-team";
import { Cols, Col, Row } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Bar } from "@/components/ui/Bar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PopoverCard } from "@/components/ui/PopoverCard";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty, HeadLink } from "@/components/cards/SectionCard";
import { StackedBar } from "@/components/cards/StackedBar";
import { ClientsGrid, ManagersGrid } from "./grids";
import { ClientDot, clientHref } from "./parts";
import { AssignDialog, managerOf, useAssignments } from "./record-parts";
import { AreaRows, LeadExpandList, statusSegments } from "./LeadsScreen";

/** Admin portal: managers, the picked manager's detail, escalations and clients to assign.
 *  From reference/old-patch/admin/Managers.dc.html, assign.js and data.js. */
export function ManagersScreen() {
  const s = useAssignments();
  const rows = managerRows();
  const [pick, setPick] = React.useState(rows[0].name);
  const [dialog, setDialog] = React.useState<{ mode: "client" | "task"; client?: string } | null>(null);
  const [resolved, setResolved] = React.useState<Set<string>>(new Set());
  const toast = useUndoToast();

  const m = rows.find((x) => x.name === pick)!;
  const clients = STAFF_CLIENTS.filter((c) => managerOf(c, s) === pick).sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health]);
  const ids = new Set(clients.map((c) => c.id));
  const tasks = TASKS.filter((t) => ids.has(t.client));
  const open = tasks.filter((t) => t.status !== "Done");
  const leads = leadRows(pick);
  const first = pick.split(" ")[0];
  const unassigned = UNASSIGNED.filter((u) => !s.managers[u.id]);
  const esc = ESCALATIONS.filter((e) => !resolved.has(e.id));

  return (
    <div className="grid grid-cols-1 gap-5">
      <ManagersGrid rows={rows} onPick={(r) => setPick(r.name)} picked={pick} />

      <SectionCard
        title={m.name}
        icon={{ Icon: User, tone: "violet" }}
        meta={`Manager · ${clients.length} clients · ${leads.length} project leads · ${open.length} open · ${open.filter((t) => t.status === "Overdue").length} overdue · ${m.onTime}% on time`}
        right={
          <>
            <PopoverCard
              align="end"
              width={200}
              trigger={
                <Button size="iconSm" variant="outline" aria-label="More actions">
                  <MoreHorizontal size={16} strokeWidth={1.5} />
                </Button>
              }
            >
              <div role="menu" className="py-1">
                <button type="button" role="menuitem" className="flex h-9 w-full items-center px-4 text-13.5 hover:bg-raised" onClick={() => setDialog({ mode: "task", client: clients[0]?.id })}>
                  Assign a task
                </button>
                <button type="button" role="menuitem" className="flex h-9 w-full items-center px-4 text-13.5 hover:bg-raised" onClick={() => toast.show(`Exported ${m.name}'s work`)}>
                  Export
                </button>
              </div>
            </PopoverCard>
            <Button size="sm" variant="primary" onClick={() => setDialog({ mode: "client" })}>
              Assign client
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name={m.name} size={44} />
          <span className="min-w-0 flex-1 text-13 text-muted">
            Capacity {clients.length} of {CAPACITY} clients · last active {m.lastActive}
            <Bar pct={(clients.length / CAPACITY) * 100} tone={clients.length > CAPACITY ? "bad" : clients.length > CAPACITY * 0.8 ? "warn" : "accent"} className="mt-1.5 max-w-[240px]" />
          </span>
        </div>
      </SectionCard>

      <Row cols={2}>
        <SectionCard title={`${first} · status`} right={<HeadLink href="/admin/work">Open Work ›</HeadLink>}>
          <StackedBar segments={statusSegments(tasks)} total={tasks.length} title="Tasks" />
        </SectionCard>
        <SectionCard title="By area · Sep to Oct">
          <AreaRows tasks={tasks} />
        </SectionCard>
      </Row>

      <Cols>
        <Col>
          <ClientsGrid portal="admin" title={`${first}'s clients`} rows={clients} />
          <LeadExpandList portal="admin" leads={leads} manager={pick} />
        </Col>
        <Col>
          <SectionCard title="Escalations" meta={String(esc.length)} flush>
            {esc.length === 0 ? (
              <Empty />
            ) : (
              esc.map((e) => {
                const c = clientById(e.client);
                return (
                  <ListRow key={e.id} className="items-start">
                    {c && <ClientDot tone={c.tone} className="mt-1.5" />}
                    <span className="min-w-0 flex-1">
                      <Link href={clientHref("admin", e.client)} className="block truncate font-semibold hover:underline">
                        {e.title}
                      </Link>
                      <span className="block truncate text-12.5 text-muted">
                        {c?.short} · {e.manager} · {e.lead}
                      </span>
                      <span className="mt-2 flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "client", client: e.client })}>
                          Reassign
                        </Button>
                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() => {
                            setResolved(new Set([...resolved, e.id]));
                            toast.show(`Escalation resolved: ${e.title}`, () => setResolved((r) => new Set([...r].filter((x) => x !== e.id))));
                          }}
                        >
                          Resolve
                        </Button>
                      </span>
                    </span>
                    <Chip tone={e.age > 5 ? "bad" : "warn"}>{e.age} days</Chip>
                  </ListRow>
                );
              })
            )}
          </SectionCard>
          <SectionCard title="Assign" meta={`${unassigned.length} without a manager`} flush>
            {UNASSIGNED.length === 0 ? (
              <Empty />
            ) : (
              UNASSIGNED.map((u) => (
                <ListRow key={u.id}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{u.name}</span>
                    <span className="block truncate text-12.5 text-muted">
                      {u.service} · {u.won}
                    </span>
                  </span>
                  {s.managers[u.id] ? (
                    <Chip tone="ok">{s.managers[u.id]}</Chip>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "client", client: u.id })}>
                      Assign
                    </Button>
                  )}
                </ListRow>
              ))
            )}
          </SectionCard>
        </Col>
      </Cols>

      <AssignDialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)} mode={dialog?.mode ?? "client"} clientId={dialog?.client} onDone={(t) => toast.show(t)} />
      {toast.node}
    </div>
  );
}
