"use client";
import * as React from "react";
import { TODAY } from "@/lib/dates";
import { obligation, type ObStatus } from "@/data/compliance";
import { activityOf, type RowState, type StatInput } from "@/data/compliance-tasks";
import { CLIENT_PEOPLE } from "@/data/people";
import { StatDetail } from "@/screens/shared/StatDetail";

// Client statutory detail page (docs/COMPLIANCE-MODEL.md 4.2 and D-4). Same page as staff, without the internal parts.
// The client portal sits on Tue 6 Oct 2026 (TODAY). The client is Northwind.

const STATE: Record<ObStatus, RowState> = { Filed: "done", "In progress": "run", "Waiting on client": "wait", Upcoming: "none", Overdue: "bad" };

export function ObligationScreen({ id }: { id: string }) {
  const o = obligation(id)!;
  const a = activityOf(id);
  const input = React.useMemo<StatInput>(
    () => ({
      key: `northwind-${o.id}`,
      obId: o.id,
      name: o.name,
      area: o.area,
      frequency: o.frequency,
      due: o.due,
      state: STATE[o.status],
      needs: o.needs,
      clientShort: CLIENT_PEOPLE[0].name,
      owner: o.by,
      reviewer: "Pranay",
      today: TODAY,
    }),
    [o],
  );
  return (
    <StatDetail
      key={id}
      role="client"
      name={o.name}
      client="northwind"
      area={o.area}
      input={input}
      rule={{ dueRule: o.dueRule, applies: a?.applies, penalty: o.penalty, frequency: o.frequency }}
    />
  );
}
