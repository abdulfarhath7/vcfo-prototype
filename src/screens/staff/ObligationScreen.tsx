"use client";
import * as React from "react";
import { STAFF_TODAY } from "@/lib/dates";
import { activityOf, type StatInput } from "@/data/compliance-tasks";
import { clientById } from "@/data/staff-clients";
import { itemView } from "@/data/staff-item";
import { FREQ_LABEL, LAW_AREA, OB_TYPES, obRows } from "@/data/staff-regs-table";
import { StatDetail } from "@/screens/shared/StatDetail";
import { type StaffPortal } from "./parts";

// Staff statutory detail page (docs/COMPLIANCE-MODEL.md 4.2). Keys are "<client>-<obId>", for example "northwind-gstr1".
// The row state comes from the Obligations list (obRows), so the detail chip matches the list chip.

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "11 Nov 2026" to a date. */
const parseDay = (s: string) => {
  const m = /^(\d{1,2}) (\w{3}) (\d{4})$/.exec(s.trim());
  return m ? new Date(Number(m[3]), MON.indexOf(m[2]), Number(m[1])) : undefined;
};
const FR_WORD = { m: "Monthly", q: "Quarterly", h: "Half-yearly", a: "Yearly" } as const;

export function ObligationScreen({ portal, id }: { portal: StaffPortal; id: string }) {
  const v = itemView("ob", id)!;
  const obId = id.slice(v.client.length + 1);
  const ob = OB_TYPES.find((o) => o.id === obId);
  const row = obRows(v.client).find((r) => r.key === id);
  const c = clientById(v.client);
  const a = activityOf(obId);
  const fr = ob?.fr ?? "m";
  const next = (ob && parseDay(ob.next)) ?? parseDay(v.facts[0].v) ?? STAFF_TODAY;
  const state = row?.state ?? (v.state === "na" ? "none" : v.state);
  // A filed row shows the period it filed: one period before the next due date, if that date has passed.
  const back = { m: 1, q: 3, h: 6, a: 12 }[ob?.fr ?? "m"];
  const prev = new Date(next.getFullYear(), next.getMonth() - back, next.getDate());
  // An overdue row shows the last due date that has passed.
  let late = next;
  while (late.getTime() >= STAFF_TODAY.getTime()) late = new Date(late.getFullYear(), late.getMonth() - back, late.getDate());
  const due = state === "done" && prev.getTime() < STAFF_TODAY.getTime() ? prev : state === "bad" ? late : next;
  const law = ob?.law ?? v.form;
  const area = LAW_AREA[law] ?? "GST";

  const input = React.useMemo<StatInput>(
    () => ({
      key: id,
      obId,
      name: ob?.name ?? v.name,
      area,
      frequency: FR_WORD[fr],
      due,
      state,
      needs: v.docs.map((d) => d.title),
      clientShort: v.clientShort,
      owner: c?.lead ?? "Bharath",
      reviewer: c?.manager ?? "Pranay",
      today: STAFF_TODAY,
    }),
    // The key fixes every value above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
  );

  return (
    <StatDetail
      key={id}
      role={portal}
      name={ob?.name ?? v.name.split(" · ")[0]}
      client={v.client}
      area={area}
      input={input}
      rule={{
        dueRule: a?.dueRule ?? v.ren,
        applies: a?.applies,
        penalty: a?.penalty || ob?.pen || v.pen || "",
        frequency: a?.frequency ?? FREQ_LABEL[fr],
        confirm: a?.confirm,
      }}
      assist={{ portalName: law, form: ob?.name ?? v.name }}
      review={{ items: v.review, initial: v.reviewDone }}
    />
  );
}
