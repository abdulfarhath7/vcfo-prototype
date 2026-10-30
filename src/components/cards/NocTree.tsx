"use client";
import * as React from "react";
import { GitBranch } from "lucide-react";
import { cn } from "@/lib/cn";
import { NOC_VARIANT, resolveNocVariant, type NocAnswers } from "@/data/board-resolution";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { SectionCard } from "@/components/cards/SectionCard";

/*
 * C8 "Why VCFO chose this template" (D5). The full tree for everyone; the chosen path lights up.
 * The path comes from resolveNocVariant(), the same logic as VCFO Suite src/lib/noc/variant.ts.
 * "Not chosen yet" and "No NOC yet" stay grey and dashed (P4).
 */

type NodeId = "own" | "sa" | "sub" | "nonoc" | "for" | "ind" | "nocf" | "nu" | "inv" | "nc" | "ni1" | "ni2" | "ni3";
interface TNode {
  id: NodeId;
  x: number;
  y: number;
  t: string[];
  w?: number;
  h?: number;
  root?: boolean;
  dash?: boolean;
  end?: boolean;
}

const NODES: TNode[] = [
  { id: "own", x: 590, y: 40, t: ["Ownership"], w: 170, root: true },
  { id: "sa", x: 230, y: 135, t: ["Standalone"] },
  { id: "sub", x: 830, y: 135, t: ["Subsidiary"] },
  { id: "nonoc", x: 230, y: 240, t: ["No NOC"], end: true },
  { id: "for", x: 660, y: 240, t: ["Foreign subsidiary"], w: 170 },
  { id: "ind", x: 990, y: 240, t: ["Indian subsidiary"], w: 160 },
  { id: "nocf", x: 660, y: 350, t: ["NOC — Foreign", "subsidiary"], w: 190, h: 50, end: true },
  { id: "nu", x: 850, y: 350, t: ["Name use only"] },
  { id: "inv", x: 990, y: 350, t: ["Investing"] },
  { id: "nc", x: 1125, y: 350, t: ["Not chosen yet"], dash: true },
  { id: "ni1", x: 850, y: 450, t: ["NOC — Indian", "(name use)"], h: 50, end: true },
  { id: "ni2", x: 990, y: 450, t: ["NOC — Indian", "(investing)"], h: 50, end: true },
  { id: "ni3", x: 1125, y: 450, t: ["No NOC yet"], dash: true, end: true },
];
const EDGES: Array<[NodeId, NodeId]> = [
  ["own", "sa"],
  ["own", "sub"],
  ["sa", "nonoc"],
  ["sub", "for"],
  ["sub", "ind"],
  ["for", "nocf"],
  ["ind", "nu"],
  ["ind", "inv"],
  ["ind", "nc"],
  ["nu", "ni1"],
  ["inv", "ni2"],
  ["nc", "ni3"],
];
const BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<NodeId, TNode>;
const W = 124;
const H = 40;
const nw = (n: TNode) => n.w ?? W;
const nh = (n: TNode) => n.h ?? H;

/** The chosen path, root first. */
export function nocPath(a: NocAnswers): NodeId[] {
  if (a.ownershipType === "independent") return ["own", "sa", "nonoc"];
  if (a.companyType === "foreign") return ["own", "sub", "for", "nocf"];
  const v = resolveNocVariant(a);
  if (v === "indian-name-only") return ["own", "sub", "ind", "nu", "ni1"];
  if (v === "indian-investing") return ["own", "sub", "ind", "inv", "ni2"];
  return ["own", "sub", "ind", "nc", "ni3"];
}

const LABEL: Record<NonNullable<ReturnType<typeof resolveNocVariant>> | "none" | "unset", string> = {
  "foreign-parent": NOC_VARIANT["foreign-parent"].label,
  "indian-name-only": NOC_VARIANT["indian-name-only"].label,
  "indian-investing": NOC_VARIANT["indian-investing"].label,
  none: "No NOC",
  unset: "No NOC yet",
};

export function NocTree({ answers, answerText, staff, onChange }: { answers: NocAnswers; answerText: [string, string, string]; staff?: boolean; onChange?: () => void }) {
  const path = nocPath(answers);
  const variant = resolveNocVariant(answers);
  const result = variant ?? (answers.ownershipType === "independent" ? "none" : "unset");
  const foreign = answers.companyType === "foreign";
  // Lit level of each node: 1 for the first decision, the last for the result.
  const level = new Map<NodeId, number>(path.slice(1).map((id, i) => [id, i + 1]));
  const max = path.length - 1;
  const [lit, setLit] = React.useState(max);
  const timers = React.useRef<number[]>([]);
  const key = path.join();
  React.useEffect(() => setLit(max), [max, key]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // Phones: the tree is wider than the screen. Scroll it so the chosen result is in view.
  const box = React.useRef<HTMLDivElement>(null);
  const endX = BY_ID[path[path.length - 1]].x;
  React.useEffect(() => {
    const el = box.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (endX / 1200) * el.scrollWidth - el.clientWidth / 2;
  }, [endX]);
  const replay = () => {
    timers.current.forEach(clearTimeout);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setLit(max);
    setLit(0);
    timers.current = Array.from({ length: max }, (_, i) => window.setTimeout(() => setLit(i + 1), 200 + i * 250));
  };
  const on = (id: NodeId) => (level.get(id) ?? 99) <= lit;
  const badge = (id: NodeId) => (level.has(id) && !BY_ID[id].end ? level.get(id) : id === "nocf" ? 3 : undefined);
  const chosen = (id: NodeId) => BY_ID[id].end && !BY_ID[id].dash && on(id);
  const lbl = path.slice(1).map((id) => BY_ID[id].t.join(" "));

  const rows: Array<[string, string, string]> = [
    ["Project setup · Ownership type", answerText[0], answers.ownershipType === "independent" ? "Standalone, no NOC" : "Subsidiary, not standalone"],
    ["Project setup · Company type", answerText[1], foreign ? "Foreign subsidiary" : "Indian subsidiary"],
    ["Project setup · Parent's role", answerText[2], LABEL[result]],
  ];

  return (
    <SectionCard
      title="Why VCFO chose this template"
      icon={{ Icon: GitBranch, tone: "violet" }}
      meta="3 project answers"
      flush
      right={
        <>
          <Button size="sm" onClick={replay}>
            Replay
          </Button>
          {staff && onChange && (
            <Button size="sm" onClick={onChange}>
              Change template
            </Button>
          )}
        </>
      }
    >
      <div ref={box} className="overflow-x-auto px-4 pt-3 md:px-5">
        <svg viewBox="0 0 1200 500" role="img" aria-label={`Decision tree. Chosen path: ${lbl.join(", then ")}.`} className="block h-auto w-full min-w-[760px]">
          {EDGES.map(([a, b]) => {
            const A = BY_ID[a];
            const B = BY_ID[b];
            const y1 = A.y + nh(A) / 2;
            const y2 = B.y - nh(B) / 2;
            const my = (y1 + y2) / 2;
            const lit2 = on(b) && level.has(b) && (a === "own" || level.has(a));
            return (
              <path
                key={a + b}
                d={`M${A.x} ${y1} V${my} H${B.x} V${y2}`}
                className={cn(
                  "fill-none transition-[stroke] duration-200 motion-reduce:transition-none",
                  lit2 ? "stroke-primary [stroke-width:2.5]" : "stroke-line-2 [stroke-width:1.5]",
                )}
              />
            );
          })}
          <text x={840} y={176} textAnchor="start" className={cn("text-[10.5px] font-medium tracking-[.06em]", on("for") || on("ind") ? "fill-primary" : "fill-faint")}>
            SUBSIDIARY TYPE
          </text>
          <text x={1000} y={284} textAnchor="start" className={cn("text-[10.5px] font-medium tracking-[.06em]", on("nu") || on("inv") || on("nc") ? "fill-primary" : "fill-faint")}>
            PARENT&apos;S ROLE
          </text>
          {NODES.map((n) => {
            const w = nw(n);
            const h = nh(n);
            const isOn = level.has(n.id) && on(n.id);
            const solid = isOn && !n.dash;
            const b = badge(n.id);
            return (
              <g key={n.id}>
                <rect
                  x={n.x - w / 2}
                  y={n.y - h / 2}
                  width={w}
                  height={h}
                  rx={6}
                  className={cn(
                    "transition-[fill,stroke] duration-200 motion-reduce:transition-none",
                    n.root
                      ? "fill-ink stroke-ink"
                      : n.dash
                        ? cn("fill-raised [stroke-dasharray:5_4]", isOn ? "stroke-muted [stroke-width:2]" : "stroke-line-2 [stroke-width:1.5]")
                        : solid
                          ? n.end
                            ? "fill-primary stroke-primary [stroke-width:2]"
                            : "fill-accent-soft stroke-primary [stroke-width:2]"
                          : "fill-surface stroke-line-2 [stroke-width:1.5]",
                  )}
                />
                {n.t.map((t, i) => (
                  <text
                    key={t}
                    x={n.x}
                    y={n.y + 5 + (i - (n.t.length - 1) / 2) * 16}
                    textAnchor="middle"
                    className={cn("text-[13px] font-medium", n.root ? "fill-surface" : solid ? (n.end ? "fill-primary-on" : "fill-primary") : "fill-muted")}
                  >
                    {t}
                  </text>
                ))}
                {b !== undefined && level.has(n.id) && (
                  <g className={cn("transition-opacity duration-200 motion-reduce:transition-none", isOn ? "opacity-100" : "opacity-0")}>
                    <circle cx={n.x - w / 2 - 14} cy={n.y} r={10} className={n.dash ? "fill-muted" : "fill-primary"} />
                    <text x={n.x - w / 2 - 14} y={n.y + 4} textAnchor="middle" className="fill-primary-on text-[11px] font-bold">
                      {b}
                    </text>
                  </g>
                )}
                {chosen(n.id) && (
                  <g>
                    <rect x={n.x - 36} y={n.y + h / 2 + 6} width={72} height={18} rx={4} className="fill-primary" />
                    <text x={n.x} y={n.y + h / 2 + 19} textAnchor="middle" className="fill-primary-on text-[10px] font-bold tracking-[.06em]">
                      CHOSEN
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="px-4 pt-2 md:px-5">
        <div className="overflow-x-auto rounded-md border-1.5 border-line">
          <table className="grid-table w-full min-w-[560px]">
            <thead>
              <tr>
                <th className="w-[44px]">#</th>
                <th>VCFO asked</th>
                <th>The answer</th>
                <th>So VCFO chose</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([q, a, so], i) => (
                <tr key={q}>
                  <td>
                    <Tag tone="prog">{i + 1}</Tag>
                  </td>
                  <td>{q}</td>
                  <td className={cn("font-medium", a === "Not chosen yet" ? "text-faint" : "text-ink")}>{a}</td>
                  <td>{so}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-14 md:px-5">
        {foreign ? (
          <>
            <span>This choice adds</span>
            <Tag tone="prog">2 steps</Tag>
            <span className="text-muted">Notarise · Apostille</span>
          </>
        ) : result === "unset" ? (
          <span className="text-muted">SBC chooses the parent&apos;s role first. Then VCFO makes the draft.</span>
        ) : (
          <span className="text-muted">This choice adds no steps.</span>
        )}
      </div>
    </SectionCard>
  );
}
