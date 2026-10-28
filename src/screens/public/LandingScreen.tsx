"use client";
import "@/styles/landing.css";
import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  FileCheck,
  History,
  Info,
  Landmark,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Receipt,
  Server,
  Ship,
  Users,
  X,
} from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import {
  ASK_QUESTIONS,
  CLUSTERS,
  FACTS,
  FAQ,
  LANES,
  LEGEND,
  NAV,
  PINS,
  PORTAL_TABS,
  RECORD_FACTS,
  TICKS,
  TRUST,
  type ClusterKey,
  type PortalKey,
} from "./content";
import { ComplianceRing, Counter, HeroMock, JourneyDiagram, MonthMock, Story, SwapWord, useReveal } from "./LandingParts";
import { AskGuide } from "./AskGuide";
import { BookDemoDialog } from "./BookDemoDialog";

const I = { size: 16, strokeWidth: 1.5 } as const;
const CLUSTER_ICON: Record<ClusterKey, React.ElementType> = { tax: Receipt, lab: Users, trade: Ship, rbi: Landmark, ip: BadgeCheck };
const TRUST_ICON = { server: Server, lock: Lock, history: History, mail: Mail } as const;
const SWAP_WORDS = ["compliance", "incorporation", "registration"];

function Logo() {
  return (
    <span className="lp-logo">
      <span className="mark">V</span>
      <span>
        <b>VCFO Suite</b> <small>by SBC</small>
      </span>
    </span>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="lp-caption lp-reveal">
      <Info {...I} />
      {children}
    </p>
  );
}

export function LandingScreen() {
  const root = React.useRef<HTMLDivElement>(null);
  const [menu, setMenu] = React.useState(false);
  const [demo, setDemo] = React.useState(false);
  const [tab, setTab] = React.useState<PortalKey>("client");
  useReveal(root);
  const openDemo = () => setDemo(true);
  const current = PORTAL_TABS.find((p) => p.key === tab)!;

  return (
    <div ref={root} className="lp">
      {/* Nav */}
      <header className={`lp-nav ${menu ? "open" : ""}`} id="top">
        <div className="lp-wrap lp-nav-row">
          <a href="#top" aria-label="VCFO Suite by SBC, home">
            <Logo />
          </a>
          <nav className="lp-nav-links" aria-label="Primary">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="lp-nav-actions">
            <Link className="lp-btn sm ghost-on-navy signin" href="/sign-in">
              Sign in
            </Link>
            <button type="button" className="lp-btn sm primary demo" onClick={openDemo}>
              Book a demo
            </button>
            <button type="button" className="lp-nav-toggle" aria-expanded={menu} aria-controls="lp-nav-mobile" aria-label="Menu" onClick={() => setMenu((m) => !m)}>
              {menu ? <X size={18} strokeWidth={1.6} /> : <Menu size={18} strokeWidth={1.6} />}
            </button>
          </div>
        </div>
        <div className="lp-wrap lp-nav-mobile" id="lp-nav-mobile">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setMenu(false)}>
              {n.label}
            </a>
          ))}
          <Link href="/sign-in">Sign in</Link>
          <a
            href="#demo"
            onClick={(e) => {
              e.preventDefault();
              setMenu(false);
              openDemo();
            }}
          >
            Book a demo
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="lp-hero">
          <svg className="lp-beams" viewBox="0 0 1440 800" preserveAspectRatio="none" aria-hidden>
            <defs>
              <radialGradient id="lp-spot" cx="30%" cy="0%" r="60%">
                <stop offset="0" className="spot-stop" stopOpacity=".14" />
                <stop offset="1" className="spot-stop" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse className="spot" cx="420" cy="0" rx="700" ry="420" />
            <path d="M-40 640 C 320 420, 760 700, 1480 260" />
            <path d="M-40 700 C 380 520, 820 760, 1480 380" />
            <path d="M-40 560 C 260 360, 700 620, 1480 160" />
          </svg>
          <div className="lp-glow a" />
          <div className="lp-glow info b" />
          <div className="lp-wrap lp-hero-grid">
            <div>
              <p className="lp-kicker lp-enter d1">Incorporate. Register. Comply.</p>
              <h1 className="lp-h1 lp-enter d2">
                Your complete{" "}
                <span className="swap-line">
                  <SwapWord words={SWAP_WORDS} />
                </span>{" "}
                companion.
              </h1>
              <p className="lp-lead lp-enter d3">One record from the first form to every filing after. Your firm runs it. Your clients see it.</p>
              <div className="lp-ctas lp-enter d4">
                <button type="button" className="lp-btn primary" onClick={openDemo}>
                  Book a demo <ArrowRight {...I} />
                </button>
                <Link className="lp-btn outline-on-navy" href="/sign-in">
                  Try it live <ArrowUpRight {...I} />
                </Link>
                <a className="lp-btn ghost-on-navy" href="#journey">
                  See how it works
                </a>
              </div>
            </div>
            <div className="lp-shot lp-enter d4">
              <Link className="lp-float a" href="/client/filings" aria-label="Open the filings screen">
                <span className="lp-pill ok">Filed</span>
                <span className="t">
                  <span>GSTR-3B, September</span>
                  <span className="lp-mono">Acknowledgement attached</span>
                </span>
              </Link>
              <Link className="lp-float b" href="/client/incorporation/step/7" aria-label="Open step 7, registered office address">
                <span className="lp-pill brand">Needs you</span>
                <span className="t">
                  <span>Utility bill for the office</span>
                  <span className="lp-mono">Due 9 Oct</span>
                </span>
              </Link>
              <Link
                className="lp-frame"
                href="/client/incorporation"
                aria-label="VCFO Suite client portal, incorporation view for Northwind Technologies India Pvt Ltd. Open the incorporation screen."
              >
                <HeroMock />
              </Link>
            </div>
          </div>
        </section>

        {/* Facts */}
        <section className="lp-facts" aria-label="What the product tracks">
          <div className="lp-wrap">
            <div className="lp-facts-grid lp-reveal">
              {FACTS.map((f, i) => (
                <Link key={f.n} className="lp-fact" data-stagger href={f.href} style={{ "--i": i } as React.CSSProperties}>
                  <Counter to={f.n} />
                  <p>{f.text}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Journey */}
        <section className="lp-section" id="journey">
          <div className="lp-glow" style={{ width: 800, height: 500, right: -200, top: 0 }} />
          <div className="lp-wrap">
            <div className="lp-head lp-reveal">
              <h2 className="lp-h2">What happens to a company, start to finish.</h2>
              <p className="lp-body">
                Four stages happen once. The calendar repeats every year. The firm runs every step; the client sees every step, with who holds it and when it is due.
              </p>
            </div>
            <JourneyDiagram />
            <Caption>
              Every node on this line is a page in the portal, and every step on that page shows the same three things: who holds it, when it is due, and the document that proves it.
            </Caption>
          </div>
        </section>

        {/* Stages 1 and 2 */}
        <section className="lp-section alt" id="incorporate">
          <div className="lp-wrap">
            <div className="lp-head lp-reveal">
              <span className="lp-stage">
                <b>1</b>Stages 1 and 2
              </span>
              <h2 className="lp-h2">From a name on a wish list to a certificate from MCA.</h2>
              <p className="lp-body">
                Sixteen steps pass between the client, the firm and the Ministry of Corporate Affairs. The diagram follows one document at a time. Scroll, and watch it move.
              </p>
            </div>
            <Story />
          </div>
        </section>

        {/* Stage 3 */}
        <section className="lp-section" id="after">
          <div className="lp-glow info" style={{ width: 700, height: 500, left: -200, top: "20%" }} />
          <div className="lp-wrap">
            <div className="lp-head lp-reveal">
              <span className="lp-stage">
                <b>3</b>Stage 3
              </span>
              <h2 className="lp-h2">The first 180 days after the certificate.</h2>
              <p className="lp-body">
                Eleven steps, most with a statutory clock. They start the day the certificate arrives; the portal counts the days and sends a reminder before each one runs out.
              </p>
            </div>
            <div className="lp-tl lp-reveal" aria-label="Timeline of the first 180 days after incorporation">
              <div className="axis">
                <div className="axis-fill" />
                {TICKS.map(([left, t]) => (
                  <span key={t} className="tick" style={{ left }}>
                    {t}
                  </span>
                ))}
              </div>
              {PINS.map((p, i) => (
                <div
                  key={p.step}
                  className={`lp-pin ${p.up ? "up" : "down"} ${p.edge ?? ""} ${p.coi ? "coi" : ""}`}
                  style={{ left: p.left, "--i": i } as React.CSSProperties}
                >
                  <Link className="lp-card lp-pc" href={`/client/incorporation/step/${p.step}`}>
                    <span className="lp-mono">{p.when}</span>
                    <b>{p.title}</b>
                    {p.body && <span>{p.body}</span>}
                    {p.items && (
                      <ul>
                        {p.items.map((it) => (
                          <li key={it}>
                            <Check size={12} strokeWidth={2} />
                            {it}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Link>
                  <span className="stem" />
                  <span className="dot" />
                </div>
              ))}
            </div>
            <ol className="lp-tl-list lp-reveal">
              {PINS.map((p) => (
                <li key={p.step}>
                  <Link className="lp-card" href={`/client/incorporation/step/${p.step}`}>
                    <span className="lp-mono">{p.shortWhen}</span>
                    <b>{p.shortTitle}</b>
                    {p.shortBody && <span>{p.shortBody}</span>}
                  </Link>
                </li>
              ))}
            </ol>
            <Caption>Each pin is a step in the portal with a due date computed from the certificate date. The client sees the same countdown the project lead sees.</Caption>
          </div>
        </section>

        {/* Stage 4 */}
        <section className="lp-section alt" id="register">
          <div className="lp-wrap">
            <div className="lp-head lp-reveal">
              <span className="lp-stage">
                <b>4</b>Stage 4
              </span>
              <h2 className="lp-h2">Every registration the company needs, and none it does not.</h2>
              <p className="lp-body">
                Twenty-three registrations and reportings sit behind five regulators. The firm switches on the ones that apply to the company, and each becomes a step with an owner and a date.
              </p>
            </div>
            <div className="lp-hub lp-reveal">
              <svg className="wires" viewBox="0 0 1120 560" preserveAspectRatio="none" aria-hidden>
                {[
                  "M 560 280 C 460 280 300 123 157 123",
                  "M 560 280 C 660 280 820 123 963 123",
                  "M 560 280 C 460 280 300 437 157 437",
                  "M 560 280 C 660 280 820 437 963 437",
                  "M 560 280 L 560 515",
                ].map((d, i) => (
                  <path key={d} className="wire" style={{ "--i": i } as React.CSSProperties} d={d} />
                ))}
              </svg>
              <div className="lp-card centre">
                <span className="ring1" />
                <span className="ring2" />
                <b>Your company</b>
                <span className="lp-mono">CIN · PAN · TAN</span>
              </div>
              {CLUSTERS.map((c, i) => {
                const Ic = CLUSTER_ICON[c.key];
                return (
                  <Link key={c.key} href="/client/registrations" className={`lp-card lp-cluster ${c.key}`} style={{ "--i": i } as React.CSSProperties}>
                    <header>
                      <span className="tile">
                        <Ic size={14} strokeWidth={1.6} />
                      </span>
                      <b>{c.title}</b>
                      <span className="n">{c.chips.length}</span>
                    </header>
                    <div className="lp-chips">
                      {c.chips.map((ch) => (
                        <span key={ch} className="lp-chip">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
            <Caption>
              A software subsidiary with no exports never sees IEC or ICEGATE. A company with no foreign capital never sees FC-GPR. The checklist is cut to the company.
            </Caption>
          </div>
        </section>

        {/* Every year */}
        <section className="lp-section" id="comply">
          <div className="lp-glow" style={{ width: 900, height: 600, left: -300, top: "10%" }} />
          <div className="lp-wrap">
            <div className="lp-head lp-reveal">
              <span className="lp-stage loop">
                <b>∞</b>Every year
              </span>
              <h2 className="lp-h2">Then the calendar takes over.</h2>
              <p className="lp-body">
                A private company files something almost every week of the year. Every filing on this ring has a due date, an owner and a reminder in the portal. Nothing depends on someone remembering.
              </p>
            </div>
            <div className="lp-comply">
              <ComplianceRing />
              <div className="lp-reveal">
                <h3 className="lp-h3">What a financial year looks like</h3>
                <ul className="lp-legend">
                  {LEGEND.map((l) => (
                    <li key={l.s}>
                      <i className={l.s} />
                      <span>
                        <b>{l.name}</b> {l.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/client/notifications" className="lp-card lp-remind" aria-label="How a reminder works. Open notifications.">
                  <div className="box">
                    <CalendarClock size={20} strokeWidth={1.6} />
                    <b>Due date</b>
                    <span>from the calendar</span>
                  </div>
                  <div className="arr a">
                    <i />
                  </div>
                  <div className="box">
                    <Bell size={20} strokeWidth={1.6} />
                    <b>Reminder</b>
                    <span>email is the record, WhatsApp the reminder</span>
                  </div>
                  <div className="arr b">
                    <i />
                  </div>
                  <div className="box">
                    <FileCheck size={20} strokeWidth={1.6} />
                    <b>Filed</b>
                    <span>acknowledgement attached</span>
                  </div>
                </Link>
              </div>
            </div>

            <div className="lp-cal">
              <div className="lp-reveal">
                <h3 className="lp-h3">The same year, inside the portal</h3>
                <Link href="/client/calendar" className="lp-frame lp-link-card" aria-label="Open the compliance calendar">
                  <MonthMock />
                </Link>
                <p className="lp-caption">
                  <Info {...I} />
                  What the client sees: one month at a time, filtered by regulator, with the next deadline counting down and every filing after it in a list.
                </p>
              </div>
              <div className="lp-cal-two lp-reveal">
                <figure className="lp-card" data-stagger style={{ "--i": 0 } as React.CSSProperties}>
                  <Link href="/client/filings" className="lp-frame lp-link-card scroll-x" aria-label="Open the filings screen">
                    <table className="grid-table min-w-[420px]">
                      <thead>
                        <tr>
                          <th>Due date</th>
                          <th>Filing</th>
                          <th>Frequency</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          [
                            ["7 Oct", "TDS payment, Sept", "Monthly", "Filed"],
                            ["11 Oct", "GSTR-1, Sept", "Monthly", "Due soon"],
                            ["15 Oct", "PF and ESI, Sept", "Monthly", "Upcoming"],
                            ["20 Oct", "GSTR-3B, Sept", "Monthly", "Upcoming"],
                          ] as const
                        ).map(([d, f, q, s]) => (
                          <tr key={f}>
                            <td className="whitespace-nowrap">{d}</td>
                            <td className="whitespace-nowrap">{f}</td>
                            <td>{q}</td>
                            <td>
                              <Chip fixed>{s}</Chip>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Link>
                  <figcaption>
                    <b>Filings, with proof.</b> Each row carries its due date, frequency, status word and the acknowledgement once filed. Overdue is a word in red, never a surprise.
                  </figcaption>
                </figure>
                <figure className="lp-card" data-stagger style={{ "--i": 1 } as React.CSSProperties}>
                  <Link href="/lead/compliances/calendar" className="lp-frame lp-link-card" aria-label="Open the project lead calendar">
                    {(
                      [
                        ["7 Oct", "TDS payment", "8 companies", "it"],
                        ["10 Oct", "Professional tax", "5 companies", "lab"],
                        ["11 Oct", "GSTR-1", "6 companies", "gst"],
                        ["15 Oct", "PF and ESI", "5 companies", "lab"],
                      ] as const
                    ).map(([d, t, n, s]) => (
                      <div key={t} className="flex items-center gap-3 border-b border-line-soft px-3.5 py-2.5 text-13 last:border-b-0">
                        <span className="w-12 flex-none font-semibold">{d}</span>
                        <span className="min-w-0 flex-1 truncate">
                          <span className={`lp-legend-dot mr-2 inline-block h-2 w-2 rounded-full ${s === "it" ? "bg-accent" : s === "gst" ? "bg-teal" : "bg-warn-mid"}`} />
                          {t}
                        </span>
                        <span className="hidden text-12 text-muted sm:inline">{n}</span>
                        <span className="lp-btn lined sm pointer-events-none !h-[26px] !min-w-0 !px-2 !text-12">Remind</span>
                      </div>
                    ))}
                  </Link>
                  <figcaption>
                    <b>The firm&apos;s side.</b> The project lead sees every statutory date across every company, grouped by day, with a reminder button on each.
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* The record */}
        <section className="lp-section alt" id="record">
          <div className="lp-wrap">
            <div className="lp-split">
              <div className="lp-reveal">
                <h2 className="lp-h2">Every step has an owner, a date and a proof.</h2>
                <p className="lp-body" style={{ marginTop: 16 }}>
                  Work enters as a step, a filing or a document request. The firm reviews it. It leaves as a status word with a date behind it, and the client reads the same word the firm reads.
                </p>
                <div className="lp-facts-mini">
                  {RECORD_FACTS.map(([k, v], i) => (
                    <div key={k} data-stagger style={{ "--i": i } as React.CSSProperties}>
                      <span className="lp-mono">{k}</span>
                      <p>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-lanes lp-reveal" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className={`lane l${n}`} />
                ))}
                <div className="boundary" />
                <span className="lp-mono boundary-label">Firm review</span>
                <span className="lp-mono boundary-label right">On record</span>
                {LANES.map((l, i) => (
                  <React.Fragment key={l.title}>
                    <div className={`rec l${i + 1}`}>
                      <span className="lp-mono">{l.kind}</span>
                      <span className="t">{l.title}</span>
                    </div>
                    <div className={`out l${i + 1}`}>
                      <span className={`lp-pill ${l.tone}`}>{l.out}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Portals */}
        <section className="lp-section" id="portals">
          <div className="lp-glow info" style={{ width: 800, height: 500, right: -250, top: "30%" }} />
          <div className="lp-wrap">
            <div className="lp-head lp-reveal">
              <h2 className="lp-h2">Three portals. One engagement.</h2>
              <p className="lp-body">
                The whole firm for the partner, oversight for the admin, overview for the manager, focus for the project lead, clarity for the client. Nobody forwards a spreadsheet.
              </p>
            </div>
            <div className="lp-reveal">
              <div className="lp-tab-head">
                <div className="lp-tabs" role="tablist" aria-label="Portals">
                  {PORTAL_TABS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      role="tab"
                      className="lp-tab"
                      aria-selected={tab === p.key}
                      aria-controls={`lp-portal-${p.key}`}
                      onClick={() => setTab(p.key)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="lp-tab-desc" role="tabpanel">
                  <p>{current.desc}</p>
                  <ul>
                    {current.points.map((pt) => (
                      <li key={pt}>
                        <Check size={14} strokeWidth={2} />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="lp-portal-grid">
                {PORTAL_TABS.map((p) => (
                  <Link
                    key={p.key}
                    id={`lp-portal-${p.key}`}
                    href={p.href}
                    className={`lp-card lp-portal ${tab === p.key ? "on" : ""}`}
                    onMouseEnter={() => setTab(p.key)}
                    onFocus={() => setTab(p.key)}
                  >
                    <header>
                      <Avatar name={p.person} size={36} />
                      <span className="min-w-0">
                        <b className="block">{p.label}</b>
                        <span>{p.person}</span>
                      </span>
                    </header>
                    <p>{p.desc}</p>
                    <span className="go">
                      {p.open} <ArrowRight size={14} strokeWidth={1.6} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Ask VCFO */}
        <section className="lp-section alt" id="ask">
          <div className="lp-wrap">
            <div className="lp-ask">
              <div className="lp-reveal">
                <Link href="/client/home" className="lp-ask-panel" aria-label="Open Ask VCFO in the client portal">
                  <header>
                    <MessageSquare {...I} />
                    <span>
                      <b className="block text-14">Ask VCFO</b>
                      <span>Answers from Northwind&apos;s project data</span>
                    </span>
                  </header>
                  <div className="lp-ask-log">
                    <div className="lp-msg me">Where is my incorporation now?</div>
                    <div className="lp-msg bot">
                      Phase 2, incorporation. 6 of 25 steps are done. The registered office address is waiting on you, due 9 Oct. The certificate is expected on 28 Oct.
                    </div>
                    <div className="lp-msg me">Which documents are missing?</div>
                    <div className="lp-msg bot">Three, all for step 7: the rent agreement, a utility bill and the NOC from the owner.</div>
                  </div>
                </Link>
              </div>
              <div className="lp-reveal">
                <h2 className="lp-h2">Ask VCFO answers from the project, not from a brochure.</h2>
                <p className="lp-body" style={{ marginTop: 16 }}>
                  A client asks where the incorporation stands, which documents are missing or when a filing is due, and gets the answer from their own engagement data. Anything the assistant
                  cannot answer is handed to the firm&apos;s team with the context attached.
                </p>
                <ul className="lp-qs" aria-label="Example questions">
                  {ASK_QUESTIONS.map((q, i) => (
                    <li key={q} data-stagger style={{ "--i": i } as React.CSSProperties}>
                      <Link href="/client/home">
                        <MessageSquare size={14} strokeWidth={1.6} />
                        {q}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="lp-section" id="trust">
          <div className="lp-wrap">
            <div className="lp-head lp-reveal" style={{ marginBottom: 0 }}>
              <h2 className="lp-h2">Built by a firm that files, for firms that file.</h2>
              <p className="lp-body">
                SBC, a company secretarial and compliance practice, built VCFO Suite and runs its own engagements on it every day. Your firm gets the same system: your people, your clients, one
                record.
              </p>
            </div>
            <div className="lp-trust lp-reveal">
              {TRUST.map((t, i) => {
                const Ic = TRUST_ICON[t.icon];
                const inner = (
                  <>
                    <div className="tile">
                      <Ic {...I} />
                    </div>
                    <h3 className="lp-h3">{t.title}</h3>
                    <p>{t.body}</p>
                  </>
                );
                const style = { "--i": i } as React.CSSProperties;
                return "href" in t ? (
                  <Link key={t.title} href={t.href} className="lp-card" data-stagger style={style}>
                    {inner}
                  </Link>
                ) : (
                  <div key={t.title} className="lp-card" data-stagger style={style}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-section alt" id="faq">
          <div className="lp-wrap">
            <div className="lp-head lp-reveal">
              <h2 className="lp-h2">Questions clients ask before the first step.</h2>
            </div>
            <div className="lp-faq lp-reveal">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>
                    {f.q}
                    <ChevronDown {...I} />
                  </summary>
                  <p className="a">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-section lp-cta" id="demo">
          <div className="lp-glow" />
          <div className="lp-wrap lp-reveal">
            <p className="big">
              {["Your clients.", "Their filings.", "Your team."].map((t, i) => (
                <span key={t} style={{ "--i": i } as React.CSSProperties}>
                  {t}
                </span>
              ))}
              <span className="last" style={{ "--i": 3 } as React.CSSProperties}>
                All on one record.
              </span>
            </p>
            <div className="acts">
              <button type="button" className="lp-btn primary" onClick={openDemo}>
                Book a demo <ArrowRight {...I} />
              </button>
              <Link className="lp-btn outline-on-navy" href="/sign-in">
                Try it live <ArrowUpRight {...I} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-grid">
            <div className="brand">
              <Logo />
              <p>Company secretarial, incorporation and compliance for India companies, on one record.</p>
            </div>
            <div>
              <span className="lp-mono">Product</span>
              <ul>
                <li>
                  <a href="#journey">How it works</a>
                </li>
                <li>
                  <a href="#incorporate">Incorporation</a>
                </li>
                <li>
                  <a href="#comply">Compliance calendar</a>
                </li>
                <li>
                  <a href="#portals">Portals</a>
                </li>
                <li>
                  <a href="#ask">Ask VCFO</a>
                </li>
              </ul>
            </div>
            <div>
              <span className="lp-mono">Account</span>
              <ul>
                <li>
                  <Link href="/sign-in">Sign in</Link>
                </li>
                <li>
                  <button type="button" onClick={openDemo}>
                    Book a demo
                  </button>
                </li>
                <li>
                  <Link href="/portals">All portals</Link>
                </li>
              </ul>
            </div>
            <div>
              <span className="lp-mono">SBC</span>
              <ul>
                <li>
                  <a href="https://sbcllp.in">sbcllp.in</a>
                </li>
                <li>
                  <a href="mailto:info@sbcllp.in">info@sbcllp.in</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>&copy; 2026 SBC. VCFO Suite is a product of SBC.</span>
            <span>Local connect. Global outlook.</span>
          </div>
        </div>
      </footer>

      <AskGuide onDemo={openDemo} />
      <BookDemoDialog open={demo} onOpenChange={setDemo} />
    </div>
  );
}
