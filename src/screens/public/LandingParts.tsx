"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { STEPS, PHASES, COI_EXPECTED } from "@/data/incorporation";
import { TODAY, daysFrom, fmt } from "@/lib/dates";
import { JOURNEY, STORY, ringItems, type Series } from "./content";

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scroll reveal: one observer adds `in` to every `.lp-reveal` inside the root. */
export function useReveal(root: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".lp-reveal"));
    if (reduceMotion() || !("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [root]);
}

/** Counts from 0 to the target when it scrolls into view. Shows the target at once under reduced motion. */
export function Counter({ to }: { to: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [n, setN] = React.useState(to);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion() || !("IntersectionObserver" in window)) return;
    let raf = 0;
    setN(0);
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      let start = 0;
      const tick = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / 1200);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <div ref={ref} className="num">
      {n}
    </div>
  );
}

/** The hero stage word: typed, held, erased and retyped. Static under reduced motion. */
export function SwapWord({ words }: { words: string[] }) {
  const [text, setText] = React.useState(words[0]);
  React.useEffect(() => {
    if (reduceMotion()) return;
    let wi = 0;
    let cur = words[0];
    let timer: ReturnType<typeof setTimeout>;
    const type = (word: string, i: number) => {
      cur = word.slice(0, i);
      setText(cur);
      if (i >= word.length) return hold();
      timer = setTimeout(() => type(word, i + 1), 72);
    };
    const erase = () => {
      if (!cur.length) {
        wi = (wi + 1) % words.length;
        timer = setTimeout(() => type(words[wi], 1), 260);
        return;
      }
      cur = cur.slice(0, -1);
      setText(cur);
      timer = setTimeout(erase, 40);
    };
    const hold = () => {
      timer = setTimeout(erase, 2400);
    };
    hold();
    return () => clearTimeout(timer);
  }, [words]);
  return <span className="lp-swap">{text}</span>;
}

/** Stands in for the old hero screenshot: the client incorporation view for Northwind. */
export function HeroMock() {
  const done = STEPS.filter((s) => s.status === "Completed").length;
  const week = STEPS.filter((s) => s.due && s.status !== "Completed" && daysFrom(s.due) >= 0 && daysFrom(s.due) <= 7);
  const days = daysFrom(COI_EXPECTED, TODAY);
  const tone: Record<string, string> = { Done: "var(--ok-mid)", "In progress": "var(--accent)", Upcoming: "var(--line)" };
  return (
    <div className="lp-mock">
      <div className="lp-mock-side" aria-hidden>
        <i />
        <i className="on" />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="lp-mock-main">
        <div className="lp-mock-band">
          <div className="min-w-0">
            <b className="truncate">Northwind Technologies India Pvt Ltd</b>
            <span>
              {done} of {STEPS.length} steps done
            </span>
          </div>
          <div className="days">
            <b>{days}</b>
            <span className="block">days to the certificate</span>
          </div>
        </div>
        <div className="lp-mock-cols">
          <div className="lp-mock-card">
            <b>This week</b>
            {week.map((s) => (
              <div className="lp-mock-row" key={s.n}>
                <span>{s.title}</span>
                <span className={`lp-pill ${s.owner === "client" ? "warn" : "prog"}`}>{s.due ? fmt(s.due) : ""}</span>
              </div>
            ))}
          </div>
          <div className="lp-mock-card">
            <b>SPICe+ timeline</b>
            <div className="lp-mock-gantt">
              {PHASES.map((p) => (
                <div key={p.n}>
                  <span className="truncate">{p.short}</span>
                  <em style={{ background: tone[p.status], width: `${40 + p.n * 18}%`, marginLeft: `${(p.n - 1) * 22}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The stage line: six nodes on a wave. Each node opens its page in the portal. */
export function JourneyDiagram() {
  const router = useRouter();
  const wave = "M 60 130 C 162 130 162 80 264 80 S 366 130 468 130 S 570 80 672 80 S 774 130 876 130 S 978 80 1080 80";
  return (
    <div className="lp-journey lp-reveal">
      <svg viewBox="-30 0 1180 230" role="img" aria-label="The journey: name and papers, incorporation, certificate of incorporation, the first 180 days, registrations, then compliance every year.">
        <path className="line-glow" d={wave} />
        <path className="line" d={wave} />
        {JOURNEY.map((n, i) => {
          const y = n.up ? 80 : 130;
          const ty = n.up ? [30, 48, 14] : [178, 196, 214];
          const go = () => router.push(n.href);
          return (
            <g
              key={n.title}
              className={`node ${n.kind === "coi" ? "coi" : n.kind === "loop" ? "loop" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
              role="link"
              tabIndex={0}
              aria-label={n.title}
              onClick={go}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  go();
                }
              }}
            >
              {n.kind === "coi" ? (
                <>
                  <circle className="pulse" cx={n.x} cy={y} r="20" />
                  <path className="d" d={`M ${n.x} ${y - 18} L ${n.x + 18} ${y} L ${n.x} ${y + 18} L ${n.x - 18} ${y} Z`} />
                </>
              ) : (
                <>
                  <circle className="halo" cx={n.x} cy={y} r="30" />
                  <circle className="c" cx={n.x} cy={y} r="18" />
                  {n.kind === "loop" ? (
                    <>
                      <path className="loop-ic" d={`M ${n.x - 8} ${y} a 8 8 0 1 1 3 6.3`} />
                      <path className="loop-ic" d={`M ${n.x - 5} ${y + 4} l 0 4 l -4 0`} />
                    </>
                  ) : (
                    <text className="n" x={n.x} y={y + 5}>
                      {n.n}
                    </text>
                  )}
                </>
              )}
              <text className="t" x={n.x} y={ty[0]}>
                {n.title}
              </text>
              <text className="s" x={n.x} y={ty[1]}>
                {n.sub}
              </text>
              <text className="w" x={n.x} y={ty[2]}>
                {n.who}
              </text>
            </g>
          );
        })}
      </svg>
      <ol className="lp-journey-list">
        {JOURNEY.map((n) => (
          <li key={n.title} data-n={n.n ?? ""} className={n.kind === "coi" ? "coi" : n.kind === "loop" ? "loop" : ""}>
            <Link href={n.href}>
              <b>{n.title}</b>
              <span>{n.list}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Stages 1 and 2: steps scroll on the left, the swimlane diagram follows on the right. */
export function Story() {
  const [active, setActive] = React.useState(1);
  const steps = React.useRef<(HTMLDivElement | null)[]>([]);
  React.useEffect(() => {
    if (reduceMotion() || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    steps.current.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, []);
  const sg = (n: number) => `lp-sg ${n < active ? "done" : n === active ? "cur" : ""}`;
  return (
    <div className="lp-story">
      <div className="lp-story-steps">
        {STORY.map((s, i) => (
          <div
            key={s.title}
            ref={(el) => {
              steps.current[i] = el;
            }}
            data-step={i + 1}
            className={`lp-step ${active === i + 1 ? "on" : ""}`}
          >
            <h3 className="lp-h3">{s.title}</h3>
            <p>{s.body}</p>
            <div className="whos">
              {s.whos.map(([w, label]) => (
                <span key={label} className={`lp-who ${w}`}>
                  <i>{w === "client" ? "C" : w === "firm" ? "F" : "M"}</i>
                  {label}
                </span>
              ))}
            </div>
            <Link className="lp-step-open" href={`/client/incorporation/step/${s.step}`}>
              Open this step in the portal <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        ))}
      </div>
      <div className="lp-story-stage">
        <div className="lp-card lp-stage-panel">
          <svg className="lp-swim" viewBox="0 0 600 560" role="img" aria-label="Swimlane diagram with three columns, Client, Firm and MCA, showing how documents move between them during incorporation.">
            <defs>
              <marker id="lp-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path className="ah" d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
              <marker id="lp-ah2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path className="ah2" d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            {[
              [20, 100, "CLIENT"],
              [220, 300, "FIRM"],
              [420, 500, "MCA"],
            ].map(([x, cx, t]) => (
              <g key={t}>
                <rect className="col-h" x={x} y="14" width="160" height="34" rx="8" />
                <text className="col-t" x={cx} y="36">
                  {t}
                </text>
                <line className="lane" x1={cx} y1="60" x2={cx} y2="548" />
              </g>
            ))}
            <g className={sg(1)}>
              <rect className="doc" x="30" y="72" width="140" height="58" rx="8" />
              <line className="doc-l" x1="46" y1="90" x2="140" y2="90" />
              <line className="doc-l" x1="46" y1="102" x2="118" y2="102" />
              <line className="doc-l" x1="46" y1="114" x2="130" y2="114" />
              <text className="lbl" x="100" y="148" textAnchor="middle">
                Company details
              </text>
              <path className="arrow" d="M 176 101 L 222 101" />
              <rect className="doc" x="228" y="83" width="144" height="36" rx="8" />
              <text className="lbl" x="300" y="105" textAnchor="middle">
                Firm reviews
              </text>
            </g>
            <g className={sg(2)}>
              <rect className="doc" x="225" y="166" width="150" height="48" rx="8" />
              <text className="lbl" x="300" y="186" textAnchor="middle">
                Board resolution
              </text>
              <text className="sub" x="300" y="202" textAnchor="middle">
                drafted from the answers
              </text>
              <path className="arrow back" d="M 219 190 L 181 190" />
              <rect className="doc" x="25" y="166" width="150" height="48" rx="8" />
              <text className="lbl" x="100" y="186" textAnchor="middle">
                Signed, uploaded
              </text>
              <text className="sub" x="100" y="202" textAnchor="middle">
                on letterhead
              </text>
              <circle className="badge" cx="171" cy="168" r="9" />
              <path className="tick" d="M 167 168 l 3 3 l 5.5 -6" />
            </g>
            <g className={sg(3)}>
              <rect className="doc" x="225" y="242" width="150" height="48" rx="8" />
              <text className="lbl" x="300" y="262" textAnchor="middle">
                Name application
              </text>
              <text className="sub" x="300" y="278" textAnchor="middle">
                RUN, Part A
              </text>
              <path className="arrow" d="M 381 266 L 419 266" />
              <rect className="badge" x="425" y="242" width="150" height="48" rx="8" />
              <text className="badge-t" x="500" y="262">
                Name approved
              </text>
              <text className="sub" x="500" y="278" textAnchor="middle">
                held for 20 days
              </text>
            </g>
            <g className={sg(4)}>
              <rect className="doc" x="231" y="318" width="150" height="48" rx="8" transform="rotate(-5 306 342)" />
              <rect className="doc" x="228" y="321" width="150" height="48" rx="8" transform="rotate(-2.5 303 345)" />
              <rect className="doc" x="225" y="324" width="150" height="48" rx="8" />
              <text className="lbl" x="300" y="344" textAnchor="middle">
                MOA, AOA, DIR-2
              </text>
              <text className="sub" x="300" y="360" textAnchor="middle">
                INC-9, declarations
              </text>
              <path className="arrow back" d="M 219 348 L 181 348" />
              <rect className="doc" x="25" y="324" width="150" height="48" rx="8" />
              <text className="lbl" x="100" y="344" textAnchor="middle">
                Signed with DSC
              </text>
              <text className="sub" x="100" y="360" textAnchor="middle">
                each director
              </text>
              <circle className="badge" cx="171" cy="326" r="9" />
              <path className="tick" d="M 167 326 l 3 3 l 5.5 -6" />
            </g>
            <g className={sg(5)}>
              <rect className="doc" x="225" y="400" width="150" height="48" rx="8" />
              <text className="lbl" x="300" y="420" textAnchor="middle">
                SPICe+ Part B
              </text>
              <text className="sub" x="300" y="436" textAnchor="middle">
                with AGILE-PRO-S
              </text>
              <path className="arrow" d="M 381 424 L 500 424 L 500 456" />
              <rect className="cert-glow" x="418" y="460" width="164" height="88" rx="14" />
              <rect className="cert" x="428" y="468" width="144" height="72" rx="10" />
              <text className="lbl" x="500" y="492" textAnchor="middle">
                Certificate
              </text>
              <text className="sub" x="500" y="508" textAnchor="middle">
                of Incorporation
              </text>
              <text className="sub mono-sub" x="500" y="526" textAnchor="middle">
                CIN · PAN · TAN
              </text>
              <circle className="badge" cx="568" cy="470" r="9" />
              <path className="tick" d="M 564 470 l 3 3 l 5.5 -6" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
/** Round SVG coordinates so server and client render the same string. */
const r1 = (n: number) => n.toFixed(1);
const RADIUS: Record<Series, number> = { gst: 214, it: 192, mca: 170, lab: 148, rbi: 126 };

/** The financial year ring: one track per regulator, one dot per statutory date, a sweeping hand. */
export function ComplianceRing() {
  const C = 260;
  const items = ringItems();
  const pos = (m: number, d: number, r: number) => {
    const a = ((m + (d - 1) / 31) / 12) * Math.PI * 2 - Math.PI / 2;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };
  return (
    <Link href="/client/calendar" className="lp-ring lp-reveal" aria-label="Open the compliance calendar">
      <svg viewBox="0 0 520 520" role="img" aria-label="A year ring from April to March with dots for every statutory filing: GST, income tax, MCA, labour and RBI.">
        {(Object.keys(RADIUS) as Series[]).map((s) => (
          <circle key={s} className="track" cx={C} cy={C} r={RADIUS[s]} />
        ))}
        {MONTHS.map((m, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const am = ((i + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
          return (
            <g key={m}>
              <line className="spoke" x1={r1(C + 112 * Math.cos(a))} y1={r1(C + 112 * Math.sin(a))} x2={r1(C + 228 * Math.cos(a))} y2={r1(C + 228 * Math.sin(a))} />
              <text className="month" x={r1(C + 246 * Math.cos(am))} y={r1(C + 246 * Math.sin(am) + 4)}>
                {m.toUpperCase()}
              </text>
            </g>
          );
        })}
        {items.map((it, i) => {
          const [x, y] = pos(it.m, it.d, RADIUS[it.s]);
          const small = it.t.startsWith("GSTR") || it.t === "TDS payment" || it.s === "lab";
          return (
            <circle key={i} className={`dot ${it.s}`} cx={r1(x)} cy={r1(y)} r={small ? 3.2 : 4.6} style={{ "--i": i } as React.CSSProperties}>
              <title>{`${it.t}, ${it.d} ${MONTHS[it.m]}`}</title>
            </circle>
          );
        })}
        <g className="hand-g">
          <line className="hand" x1={C} y1={C} x2={C} y2={C - 222} />
          <circle className="hand-cap" cx={C} cy={C - 222} r="3" />
        </g>
        <circle className="ctr" cx={C} cy={C} r="100" />
        <text className="ctr-t" x={C} y={C - 2}>
          FY 2026-27
        </text>
        <text className="ctr-s" x={C} y={C + 20}>
          {items.length} statutory dates
        </text>
      </svg>
    </Link>
  );
}

/** October on the client calendar (stands in for the old screenshot). */
export function MonthMock() {
  // 1 Oct 2026 is a Thursday. Weeks start on Monday.
  const lead = 3;
  const events: Record<number, [string, "gst" | "it" | "lab"][]> = {
    7: [["TDS", "it"]],
    10: [["PT", "lab"]],
    11: [["GSTR-1", "gst"]],
    15: [["PF · ESI", "lab"]],
    20: [["GSTR-3B", "gst"]],
    31: [["TDS Q2", "it"]],
  };
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return (
    <div>
      <div className="lp-cal-head">
        <b>October 2026</b>
        <span className="text-muted">Next deadline: GSTR-1, 11 Oct</span>
      </div>
      <div className="lp-month">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="h">
            {d}
          </div>
        ))}
        {cells.map((n, i) => (
          <div key={i} className={n === null ? "mute" : n === TODAY.getDate() ? "today" : ""}>
            {n !== null && <span className="d">{n}</span>}
            {n !== null &&
              events[n]?.map(([t, s]) => (
                <span key={t} className={`ev ${s}`}>
                  {t}
                </span>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
