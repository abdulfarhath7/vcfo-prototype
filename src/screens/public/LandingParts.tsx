"use client";
import * as React from "react";
import { ArrowRight, Check, Minus, X } from "lucide-react";
import { COMPARE, COMPARE_COLS, ringItems, type Mark } from "./content";

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A 24 px line icon, drawn the way the old landing drew them (stroke 1.75). */
export function Ic({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** Inline style from a CSS string, so the markup stays the same as the old landing ("left:16.7%;--i:1"). */
export function st(css: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const part of css.split(";")) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!k) continue;
    out[k.startsWith("--") ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return out as React.CSSProperties;
}

/** Portal screen for each `data-app` key on the landing. */
export function appRoute(key: string): string | null {
  const fixed: Record<string, string> = {
    home: "/client/home",
    "home-chat": "/client/home",
    incorporation: "/client/incorporation",
    "inc-phase-a": "/client/incorporation/phase/1",
    "inc-phase": "/client/incorporation/phase/2",
    "inc-phase-3": "/client/incorporation/phase/3",
    "inc-phase-4": "/client/registrations",
    compliances: "/client/calendar",
    filings: "/client/filings",
    notifications: "/client/notifications",
    audit: "/client/audit",
    credentials: "/client/credentials",
    "lead-compliances": "/lead/compliances/calendar",
    "lead-home": "/lead/today",
    "mgr-home": "/manager/today",
    "admin-home": "/admin/today",
    "super-home": "/super/overview",
  };
  if (fixed[key]) return fixed[key];
  const m = /^inc-step-(\d+)$/.exec(key);
  if (!m) return null;
  const n = Number(m[1]);
  return n <= 25 ? `/client/incorporation/step/${n}` : "/client/registrations";
}

/**
 * The old landing's page script, scoped to the landing root:
 * scroll reveal with count-up, the sticky story, and the nav shadow sentinel.
 */
export function useLandingMotion(root: React.RefObject<HTMLElement | null>, setScrolled: (v: boolean) => void) {
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = reduceMotion();
    const hasIO = "IntersectionObserver" in window;
    const cleanups: (() => void)[] = [];

    const countUp = (n: HTMLElement) => {
      const target = parseInt(n.getAttribute("data-count") || "0", 10);
      if (reduce || !target) {
        n.textContent = String(target);
        return;
      }
      let start = 0;
      const tick = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / 1200);
        n.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const show = (r: Element) => {
      r.classList.add("in");
      r.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
    };
    const revealed = Array.from(el.querySelectorAll(".reveal"));
    if (reduce || !hasIO) revealed.forEach(show);
    else {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              show(e.target);
              io.unobserve(e.target);
            }
          }),
        { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
      );
      revealed.forEach((r) => io.observe(r));
      cleanups.push(() => io.disconnect());
    }

    el.querySelectorAll("[data-story]").forEach((story) => {
      const steps = Array.from(story.querySelectorAll(".story-step"));
      const groups = Array.from(story.querySelectorAll(".sg"));
      const activate = (n: number) => {
        steps.forEach((s, i) => s.classList.toggle("is-active", i + 1 === n));
        groups.forEach((g, i) => {
          g.classList.toggle("done", i + 1 < n);
          g.classList.toggle("cur", i + 1 === n);
        });
      };
      activate(1);
      if (!hasIO) return;
      const sio = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) activate(parseInt(e.target.getAttribute("data-step") || "1", 10));
          }),
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
      );
      steps.forEach((s) => sio.observe(s));
      cleanups.push(() => sio.disconnect());
    });

    const sentinel = el.querySelector(".nav-sentinel");
    if (hasIO && sentinel) {
      const nio = new IntersectionObserver((entries) => setScrolled(!entries[0].isIntersecting));
      nio.observe(sentinel);
      cleanups.push(() => nio.disconnect());
    }
    return () => cleanups.forEach((c) => c());
  }, [root, setScrolled]);
}

/** The hero stage word: typed, held, erased and retyped, one stage after the other. */
export function SwapWord({ words, start }: { words: string[]; start: boolean }) {
  const [text, setText] = React.useState(words[0]);
  React.useEffect(() => {
    if (!start || reduceMotion()) return;
    let wi = 0;
    let cur = words[0];
    let timer: ReturnType<typeof setTimeout>;
    const type = (word: string, i: number) => {
      cur = word.slice(0, i);
      setText(cur);
      if (i >= word.length) return cycle();
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
    const cycle = () => {
      timer = setTimeout(erase, 2400);
    };
    cycle();
    return () => clearTimeout(timer);
  }, [words, start]);
  return <span className="swap">{text}</span>;
}

/** Fixed decimals, so the server and the browser print the same coordinates. */
const f2 = (n: number) => n.toFixed(2);

/** The year ring: one track per regulator, a dot for every statutory date, a sweeping hand. */
export function ComplianceRing() {
  const C = 260;
  const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const R = { gst: 214, it: 192, mca: 170, lab: 148, rbi: 126 } as const;
  const items = ringItems();
  const pos = (m: number, d: number, r: number) => {
    const a = ((m + (d - 1) / 31) / 12) * Math.PI * 2 - Math.PI / 2;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };
  return (
    <svg id="ring" viewBox="0 0 520 520" role="img" aria-label="A year ring from April to March with dots for every statutory filing: GST, income tax, MCA, labour and RBI.">
      {Object.entries(R).map(([k, r]) => (
        <circle key={k} className="track" cx={C} cy={C} r={r} />
      ))}
      {MONTHS.map((mo, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const am = ((i + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <React.Fragment key={mo}>
            <line className="mline" x1={f2(C + 112 * Math.cos(a))} y1={f2(C + 112 * Math.sin(a))} x2={f2(C + 228 * Math.cos(a))} y2={f2(C + 228 * Math.sin(a))} />
            <text className="month" x={f2(C + 246 * Math.cos(am))} y={f2(C + 246 * Math.sin(am) + 4)}>
              {mo.toUpperCase()}
            </text>
          </React.Fragment>
        );
      })}
      {items.map((it, idx) => {
        const [x, y] = pos(it.m, it.d, R[it.s]);
        const small = it.t.indexOf("GSTR") === 0 || it.t === "TDS payment" || it.s === "lab";
        return (
          <circle key={idx} className={`dot s-${it.s}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={small ? 3.2 : 4.6} style={{ "--i": idx } as React.CSSProperties}>
            <title>{`${it.t}, ${it.d} ${MONTHS[it.m]}`}</title>
          </circle>
        );
      })}
      <g className="hand-g">
        <line className="hand" x1={C} y1={C} x2={C} y2={C - 222} />
        <circle className="hand-cap" cx={C} cy={C - 222} r={3} />
      </g>
      <circle className="ctr" cx={C} cy={C} r={100} />
      <text className="ctr-t" x={C} y={C - 2}>
        FY 2026-27
      </text>
      <text className="ctr-s" x={C} y={C + 20}>
        {items.length} statutory dates
      </text>
    </svg>
  );
}

function CompareMark({ m }: { m: Mark }) {
  if (m === "yes") return <Check className="cmp-yes" size={22} strokeWidth={2.2} role="img" aria-label="Yes" />;
  if (m === "no") return <X className="cmp-no" size={20} strokeWidth={1.8} role="img" aria-label="No" />;
  return (
    <span className="cmp-part">
      <Minus size={18} strokeWidth={1.8} role="img" aria-label="Partly" />
      By hand
    </span>
  );
}

/** Board C2: VCFO Suite against a generic task tool and spreadsheets. On a phone the task-tool column drops out. */
export function CompareSection({ onDemo }: { onDemo: () => void }) {
  return (
    <section className="cmp" id="compare" aria-labelledby="cmp-t">
      <div className="cmp-in">
        <div className="cmp-head reveal">
          <span className="cmp-kicker">The VCFO way vs. the old way</span>
          <h2 className="cmp-h" id="cmp-t">
            Spreadsheets break when compliance stops being <span>routine.</span>
          </h2>
        </div>
        <div className="cmp-card reveal">
          <table className="cmp-table">
            <caption className="sr">VCFO Suite compared with the old way</caption>
            <colgroup>
              <col className="c-label" />
              <col className="c-vcfo" />
              <col className="c-tool" />
              <col className="c-sheet" />
            </colgroup>
            <thead>
              <tr>
                <td className="cmp-corner" />
                <th scope="col" className="cmp-vh">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/vcfo-logo-on-black.webp" alt={COMPARE_COLS[0]} width="1104" height="240" />
                </th>
                <th scope="col" className="cmp-oh c-tool">
                  {COMPARE_COLS[1]}
                </th>
                <th scope="col" className="cmp-oh">
                  {COMPARE_COLS[2]}
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td className="cmp-v">
                    <CompareMark m={r.vcfo} />
                  </td>
                  <td className="c-tool">
                    <CompareMark m={r.tool} />
                  </td>
                  <td>
                    <CompareMark m={r.sheet} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cmp-acts reveal">
          <button type="button" className="cmp-btn" onClick={onDemo}>
            Book a demo <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </button>
          <a className="cmp-link" href="#journey">
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * The opening beat of the old landing: the three stage cards stack into the VCFO mark,
 * the word mark is drawn, then the lockup glides into the nav logo. About 3.5 s; any input skips it.
 * Returns a cleanup that stops it at once.
 */
export function playIntro(opts: { root: HTMLElement; hero: HTMLElement; navImg: HTMLElement; release: () => void; finish: () => void }) {
  const { root, hero, navImg, release, finish } = opts;
  const NS = "http://www.w3.org/2000/svg";
  const wrap = document.createElement("div");
  wrap.id = "reveal";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML =
    '<svg id="rv-svg" viewBox="72 50 1000 400" xmlns="' + NS + '">' +
    '<defs><clipPath id="rv-wordClip"><rect id="rv-wordClipRect" x="0" y="0" width="0" height="1000"/></clipPath>' +
    '<clipPath id="rv-vClip"><rect id="rv-vClipRect" x="0" y="0" width="0" height="0"/></clipPath></defs>' +
    '<g id="rv-lockup"><g id="rv-stack">' +
    '<g id="rv-card0" opacity="0"><polygon class="shape c0"/><text class="cname n0" text-anchor="middle" font-weight="700">Incorporation</text></g>' +
    '<g id="rv-card1" opacity="0"><polygon class="shape c1"/><text class="cname n1" text-anchor="middle" font-weight="700">Registrations</text></g>' +
    '<g id="rv-card2" opacity="0"><polygon class="shape c2"/><text class="cname n2" text-anchor="middle" font-weight="700">Compliances</text>' +
    '<g clip-path="url(#rv-vClip)"><text id="rv-vee" class="vee" text-anchor="middle" font-weight="700">V</text></g></g>' +
    '</g><g id="rv-word" clip-path="url(#rv-wordClip)"><text id="rv-wordText" font-size="100" letter-spacing="-2">' +
    '<tspan class="w1" font-weight="700">VCFO</tspan><tspan class="w2" font-weight="400"> Suite</tspan></text></g>' +
    '<g id="rv-byline" opacity="0"><text id="rv-byText" class="by" font-size="18" font-weight="700" letter-spacing="3.5">BY</text>' +
    '<image id="rv-sbc" href="/landing/sbc-mark.webp" width="72" height="21.3"/></g></g></svg>';
  root.appendChild(wrap);
  const place = () => {
    const r = hero.getBoundingClientRect();
    const top = Math.max(0, r.top);
    const h = Math.min(r.bottom, innerHeight) - top;
    wrap.style.left = r.left + "px";
    wrap.style.top = top + "px";
    wrap.style.width = r.width + "px";
    wrap.style.height = Math.max(240, h) + "px";
  };
  place();
  const $ = (id: string) => wrap.querySelector("#rv-" + id) as SVGElement;
  const svg = $("svg") as SVGSVGElement;
  const stack = $("stack");
  const lockup = $("lockup");
  const cards = [0, 1, 2].map((i) => $("card" + i));
  const names = Array.from(wrap.querySelectorAll<SVGTextElement>(".cname"));
  const vClipRect = $("vClipRect");
  const wordClipRect = $("wordClipRect");
  const wordText = $("wordText");
  const byline = $("byline");
  const byText = $("byText");
  const sbc = $("sbc");
  const vee = $("vee");
  const W = 215, DX = 37, DH = 62, LH = 75, RISE = 135, FULL = LH + RISE + 2 * DH;
  const MARK_H = 220, K = MARK_H / FULL, MARK_W = (W + 2 * DX) * K, NAME_FS = 15;
  const GEO = [0, 1, 2].map((i) => {
    const n = 2 - i;
    const x0 = DX * n * K, lh = (LH + DH * n) * K, rh = (LH + RISE + DH * n) * K, w = W * K;
    return { x0, w, lh, rh, cx: x0 + w / 2 };
  });
  GEO.forEach((g, i) => {
    cards[i].querySelector(".shape")!.setAttribute("points", `${g.x0},0 ${g.x0},${-g.lh} ${g.x0 + g.w},${-g.rh} ${g.x0 + g.w},0`);
    const t = names[i];
    t.setAttribute("x", String(g.cx));
    t.setAttribute("y", (-Math.min(g.lh, 60) * 0.55).toFixed(1));
    t.setAttribute("font-size", String(NAME_FS));
  });
  const F = GEO[2], vx = F.x0 + F.w * 0.52, vbase = -22 * K, vsize = 115 * K;
  vee.setAttribute("x", String(vx));
  vee.setAttribute("y", String(vbase));
  vee.setAttribute("font-size", String(vsize));
  vClipRect.setAttribute("x", String(vx - vsize));
  vClipRect.setAttribute("width", String(vsize * 2));
  type Layout = { vb: number[]; cx: number; cy: number; fs: number; fo: number[]; wx: number; wy: number; by: number; anchor: string; s1: number };
  const LAYOUTS: Record<"wide" | "square", Layout> = {
    wide: { vb: [72, 50, 1000, 400], cx: 600, cy: 250, fs: 0.72, fo: [220, 340], wx: 371, wy: 287, by: 327, anchor: "start", s1: 1.55 },
    square: { vb: [40, 160, 720, 540], cx: 400, cy: 400, fs: 0.9, fo: [400 - MARK_W * 0.45, 440], wx: 400, wy: 570, by: 616, anchor: "middle", s1: 1.8 },
  };
  let L = LAYOUTS.wide;
  let s0 = 1;
  let cur = 0;
  const DUR = 7.0, SPEED = 1.6;
  const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
  const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
  const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeBack = (x: number) => {
    const c1 = 1.4, c3 = c1 + 1;
    return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };
  const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
  const renderAt = (t: number) => {
    cur = t;
    const gx = L.cx - (MARK_W * s0) / 2, gy = L.cy + (MARK_H * s0) / 2;
    const mv = easeInOut(seg(t, 3.7, 4.5)), sc = lerp(s0, L.fs, mv);
    const ox = lerp(gx, L.fo[0], mv), oy = lerp(gy, L.fo[1], mv);
    const pulse = 1 + Math.sin(Math.PI * seg(t, 3.15, 3.6)) * 0.04;
    stack.setAttribute("transform", `translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${(sc * pulse).toFixed(4)})`);
    const arr: number[] = [];
    for (let i = 0; i < 3; i++) {
      const a = 0.35 + i * 0.7, p = seg(t, a, a + 0.75);
      cards[i].setAttribute("transform", `scale(1 ${Math.max(0.001, easeBack(p)).toFixed(4)})`);
      cards[i].setAttribute("opacity", clamp(p * 8).toFixed(3));
      arr.push(easeOut(p));
    }
    const nameFade = 1 - seg(t, 2.85, 3.1);
    for (let j = 0; j < 3; j++) {
      const shown = clamp(seg(t, 0.35 + j * 0.5, 0.75 + j * 0.5) * 3), covered = j < 2 ? arr[j + 1] : 0;
      names[j].setAttribute("opacity", (nameFade * (1 - covered) * Math.min(1, shown)).toFixed(3));
    }
    const vp = easeOut(seg(t, 3.05, 3.5));
    vClipRect.setAttribute("y", (vbase - vsize).toFixed(2));
    vClipRect.setAttribute("height", (vsize * 1.1 * vp).toFixed(2));
    const wp = easeInOut(seg(t, 4.1, 5.0)), ww = 640 * wp;
    wordClipRect.setAttribute("x", L.anchor === "middle" ? (L.wx - ww / 2).toFixed(2) : String(L.wx - 10));
    wordClipRect.setAttribute("width", (wp > 0 ? ww + 20 : 0).toFixed(2));
    const bp = easeOut(seg(t, 4.8, 5.4));
    byline.setAttribute("opacity", bp.toFixed(3));
    byline.setAttribute("transform", `translate(0 ${((1 - bp) * 8).toFixed(2)})`);
  };
  const setLayout = () => {
    L = LAYOUTS[wrap.clientWidth / Math.max(1, wrap.clientHeight) < 1.05 ? "square" : "wide"];
    svg.setAttribute("viewBox", L.vb.join(" "));
    wordText.setAttribute("x", String(L.wx));
    wordText.setAttribute("y", String(L.wy));
    wordText.setAttribute("text-anchor", L.anchor);
    const bx = L.anchor === "middle" ? L.wx - 57 : L.wx + 6;
    byText.setAttribute("x", String(bx));
    byText.setAttribute("y", String(L.by));
    sbc.setAttribute("x", String(bx + 36));
    sbc.setAttribute("y", (L.by - 0.707 * 21.3).toFixed(2));
    const r = svg.getBoundingClientRect();
    const ppu = Math.min(r.width / L.vb[2], r.height / L.vb[3]) || 1;
    s0 = Math.max(1, Math.min(L.s1, 11.5 / (NAME_FS * ppu)));
    renderAt(cur);
  };
  setLayout();
  let raf = 0;
  let last = -1;
  let t = 0;
  let done = false;
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const later = (f: () => void, ms: number) => timers.push(setTimeout(f, ms));
  const EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  const skip = () => glide(true);
  const onResize = () => {
    place();
    setLayout();
  };
  const unlisten = () => {
    EVENTS.forEach((ev) => removeEventListener(ev, skip, true));
    removeEventListener("resize", onResize);
  };
  function glide(fast: boolean) {
    if (done) return;
    done = true;
    if (raf) cancelAnimationFrame(raf);
    renderAt(DUR);
    unlisten();
    const o = svg.getBoundingClientRect(), r = lockup.getBoundingClientRect(), n = navImg.getBoundingClientRect();
    const k = n.height / Math.max(1, r.height);
    const tx = n.left - o.left - k * (r.left - o.left), ty = n.top - o.top - k * (r.top - o.top);
    later(release, fast ? 60 : 260);
    wrap.classList.add("glide");
    if (fast) wrap.classList.add("fast");
    requestAnimationFrame(() => {
      svg.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k.toFixed(4)})`;
    });
    later(
      () => {
        finish();
        wrap.classList.add("gone");
        later(() => wrap.remove(), 220);
        if ("scrollRestoration" in history) history.scrollRestoration = "auto";
      },
      fast ? 340 : 740,
    );
  }
  const tick = (now: number) => {
    if (cancelled) return;
    if (last >= 0) t += (Math.min(50, Math.max(0, now - last)) / 1000) * SPEED;
    last = now;
    if (t >= 5.6) {
      renderAt(DUR);
      later(() => glide(false), 280);
      return;
    }
    renderAt(t);
    raf = requestAnimationFrame(tick);
  };
  EVENTS.forEach((ev) => addEventListener(ev, skip, { capture: true, passive: true }));
  addEventListener("resize", onResize);
  const go = () => {
    if (cancelled) return;
    renderAt(0);
    raf = requestAnimationFrame(tick);
  };
  const family = getComputedStyle(root).getPropertyValue("--lp-poppins").trim() || "Poppins";
  Promise.race([Promise.all([document.fonts.load(`700 20px ${family}`), document.fonts.load(`400 20px ${family}`)]), new Promise((r) => setTimeout(r, 400))])
    .catch(() => undefined)
    .then(go);
  return () => {
    cancelled = true;
    if (raf) cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    unlisten();
    wrap.remove();
  };
}
