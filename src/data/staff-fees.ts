import { d } from "@/lib/dates";
import type { StaffClient } from "@/data/staff-clients";

// Fees on the client record page only (R-37: no money on dashboards).
// Ported from reference/old-patch/shared/v7c_fees.dc.html and the DUES list in reference/old-screens/s/admin/data.js.

export type FeeStatus = "Paid" | "Due" | "Overdue";

export interface Invoice {
  id: string;
  /** "SBC/2026/0388" */
  number: string;
  date: Date;
  /** "Incorporation · second instalment" */
  item: string;
  amount: number;
  due: Date;
  status: FeeStatus;
}

export interface FeeSummary {
  engagement: string;
  total: number;
  paid: number;
  outstanding: number;
  /** Days the oldest open invoice is outstanding. */
  days: number;
  invoices: Invoice[];
}

/** Outstanding amount and days per client (data.js DUES, mapped to the new client ids). */
const DUES: Record<string, [number, number]> = {
  banyan: [85000, 72],
  monsoon: [60000, 41],
  northwind: [45000, 18],
  coral: [38000, 64],
  quartz: [30000, 12],
  arcadia: [26000, 8],
  bluefin: [20000, 22],
};

export const rupees = (n: number) => {
  const s = String(Math.round(n));
  const last = s.slice(-3);
  const rest = s.slice(0, -3);
  return "₹" + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "") + last;
};

export function feesOf(c: StaffClient): FeeSummary {
  const [open, days] = DUES[c.id] ?? [0, 0];
  const inc = c.stage === "incorporating";
  const total = inc ? 65000 : 240000;
  const n = (k: number) => `SBC/2026/0${300 + ((c.id.charCodeAt(0) * 7 + k * 13) % 180)}`;
  const invoices: Invoice[] = inc
    ? [
        { id: `${c.id}-i1`, number: n(1), date: d(2026, 9, 5), item: "Incorporation · first instalment", amount: 20000, due: d(2026, 9, 20), status: "Paid" },
        { id: `${c.id}-i2`, number: n(2), date: d(2026, 10, 5), item: "Incorporation · second instalment", amount: 45000, due: d(2026, 10, 20), status: open ? (days > 30 ? "Overdue" : "Due") : "Paid" },
      ]
    : [
        { id: `${c.id}-i1`, number: n(1), date: d(2026, 8, 5), item: "Monthly compliance · August", amount: 20000, due: d(2026, 8, 20), status: "Paid" },
        { id: `${c.id}-i2`, number: n(2), date: d(2026, 9, 5), item: "Monthly compliance · September", amount: 20000, due: d(2026, 9, 20), status: open && days > 30 ? "Overdue" : "Paid" },
        { id: `${c.id}-i3`, number: n(3), date: d(2026, 10, 5), item: "Monthly compliance · October", amount: open || 20000, due: d(2026, 10, 20), status: "Due" },
      ];
  const outstanding = invoices.filter((i) => i.status !== "Paid").reduce((a, i) => a + i.amount, 0);
  const paid = invoices.filter((i) => i.status === "Paid").reduce((a, i) => a + i.amount, 0);
  return { engagement: inc ? "Incorporation" : "Monthly compliance", total: inc ? total : paid + outstanding, paid, outstanding, days, invoices };
}
