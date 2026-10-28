"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/cn";
import type { Segment } from "./StackedBar";
import { barFill } from "@/components/ui/Bar";

const stroke: Record<Segment["tone"], string> = {
  accent: "var(--accent-mid)",
  ok: "var(--ok-mid)",
  warn: "var(--warn-mid)",
  bad: "var(--bad-mid)",
  violet: "var(--violet-mid)",
  teal: "var(--teal-mid)",
  idle: "var(--idle-mid)",
  navy: "var(--primary)",
};

/** R-25 (C1): donut in status colours, total in the centre, legend beside. */
export function Donut({ segments, total, title, size = 84, className }: { segments: Segment[]; total: React.ReactNode; title?: string; size?: 72 | 84 | 96; className?: string }) {
  const data = segments.filter((s) => s.value > 0);
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative flex-none" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={size / 2 - 12} outerRadius={size / 2} startAngle={90} endAngle={-270} paddingAngle={2} stroke="none" isAnimationActive={false}>
              {data.map((s) => (
                <Cell key={s.label} fill={stroke[s.tone]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <b className="absolute inset-0 grid place-items-center text-22 font-medium leading-none">{total}</b>
      </div>
      <div className="min-w-0">
        {title && <h3 className="mb-1.5 text-13 font-medium text-muted">{title}</h3>}
        <ul className="grid gap-1">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-13 text-ink-2">
              <i className={cn("h-2 w-2 flex-none rounded-[2px]", barFill[s.tone])} aria-hidden />
              {s.label}
              <b className="ml-auto pl-3 font-medium tabular-nums text-ink">{s.value}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
