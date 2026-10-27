"use client";
import * as React from "react";
import Link from "next/link";
import { BookOpen, Bookmark, BookmarkCheck, Download, ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { LIB_BOOKS, LIB_CATEGORIES, RECENT_READS, findBook, findDoc, readerFor, type LibCategory } from "@/data/docs-library";
import { docStatusTone } from "@/data/shared";
import { toneTile } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Bar } from "@/components/ui/Bar";
import { FileBadge } from "@/components/ui/FileBadge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, HeadLink, Empty } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { DateTile } from "@/components/cards/AttentionList";
import { Cols, Col } from "@/components/shell/Page";
import type { Portal } from "@/data/nav";

const libBase = (portal: Portal) => (portal === "client" ? "/client/library" : `/${portal}/docs/knowledge`);
const catTone = (c: LibCategory) => LIB_CATEGORIES.find((x) => x.id === c)?.tone ?? "blue";
const chipTone = { blue: "prog", violet: "violet", amber: "warn", green: "ok", teal: "teal" } as const;

/** Recently read rows with a reading bar. Shared by the rail card and the drill. */
function RecentRow({ id, pct, note, base }: { id: string; pct: number; note: string; base: string }) {
  const b = findBook(id);
  return (
    <ListRow href={`${base}/${b.id}`}>
      <span className={cn("grid h-9 w-9 flex-none place-items-center rounded-md", toneTile[catTone(b.cat)])}>
        <BookOpen size={16} strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{b.title}</span>
        <span className="mt-1 flex items-center gap-2">
          <Bar pct={pct} tone={pct >= 100 ? "ok" : "accent"} className="max-w-[120px]" />
          <span className="truncate text-12 text-muted">{note}</span>
        </span>
      </span>
    </ListRow>
  );
}

/** lib_recent_drill: every book read, with All, In progress and Finished. */
function RecentDrill({ open, onOpenChange, base }: { open: boolean; onOpenChange: (v: boolean) => void; base: string }) {
  const [tab, setTab] = React.useState("all");
  const rows = RECENT_READS.filter((r) => tab === "all" || (tab === "done" ? r.pct >= 100 : r.pct < 100));
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Recently read"
      size="md"
      flush
      right={
        <Tabs
          items={[
            { key: "all", label: "All", count: RECENT_READS.length },
            { key: "prog", label: "In progress", count: RECENT_READS.filter((r) => r.pct < 100).length },
            { key: "done", label: "Finished", count: RECENT_READS.filter((r) => r.pct >= 100).length },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
      footer={
        <Button asChild>
          <Link href={base} onClick={() => onOpenChange(false)}>
            Open Library
          </Link>
        </Button>
      }
    >
      {rows.length === 0 ? <Empty /> : rows.map((r) => <RecentRow key={r.id} {...r} base={base} />)}
    </Modal>
  );
}

/** lib_shelf_a: classic shelves by category. K-46. R-04: no mascot. */
export function LibraryScreen({ portal, title = "Library" }: { portal: Portal; title?: string }) {
  const [cat, setCat] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [drill, setDrill] = React.useState(false);
  const base = libBase(portal);
  const s = q.trim().toLowerCase();
  const shown = LIB_BOOKS.filter((b) => (cat === "all" || b.cat === cat) && (!s || (b.title + " " + b.short).toLowerCase().includes(s)));
  const shelves = LIB_CATEGORIES.map((c) => ({ c, books: shown.filter((b) => b.cat === c.id) })).filter((g) => g.books.length);

  return (
    <Cols>
      <Col>
        <SectionCard
          title={title}
          meta={`${LIB_BOOKS.length} books`}
          flush
          right={
            <>
              <label className="hidden h-[30px] items-center gap-2 rounded-md border border-line bg-surface px-2.5 sm:flex">
                <Search size={14} strokeWidth={1.5} className="text-muted" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search books" aria-label="Search books" className="w-36 bg-transparent text-12.5 outline-none placeholder:text-faint" />
              </label>
              <Select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                aria-label="Shelf"
                options={[{ value: "all", label: `All shelves · ${LIB_BOOKS.length}` }, ...LIB_CATEGORIES.map((c) => ({ value: c.id, label: `${c.short} · ${LIB_BOOKS.filter((b) => b.cat === c.id).length}` }))]}
              />
            </>
          }
        >
          <label className="flex h-10 items-center gap-2 border-b border-line-soft px-4 sm:hidden">
            <Search size={14} strokeWidth={1.5} className="text-muted" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search books" aria-label="Search books" className="h-full min-w-0 flex-1 bg-transparent text-13 outline-none placeholder:text-faint" />
          </label>
          {shelves.length === 0 && (
            <div className="grid justify-items-center gap-3 px-4 py-10 text-center">
              <span className="text-13.5 font-semibold">{s ? <>No book matches “{q.trim()}”</> : "No books on this shelf"}</span>
              <Button
                size="sm"
                onClick={() => {
                  setQ("");
                  setCat("all");
                }}
              >
                Clear search
              </Button>
              <span className="flex flex-wrap justify-center gap-2">
                {["b1", "b2", "b4"].map((id) => (
                  <Link key={id} href={`${base}/${id}`} className="inline-flex h-[30px] items-center rounded-md border border-line px-2.5 text-12.5 font-semibold text-ink-2 hover:bg-raised">
                    {findBook(id).title}
                  </Link>
                ))}
              </span>
            </div>
          )}
          {shelves.map((g) => (
            <div key={g.c.id} className="border-t border-line-soft first:border-t-0">
              <p className="flex items-center gap-2 bg-raised px-4 py-1.5 text-11.5 font-semibold text-muted md:px-5">
                {g.c.id} <span className="text-faint">{g.books.length}</span>
              </p>
              <div className="grid grid-cols-1 gap-3 p-4 min-[420px]:grid-cols-2 md:px-5 lg:grid-cols-3 2xl:grid-cols-4">
                {g.books.map((b) => (
                  <Link key={b.id} href={`${base}/${b.id}`} className="flex min-w-0 gap-3 rounded-md border border-line p-3 hover:bg-raised">
                    <span className={cn("grid h-14 w-11 flex-none place-items-center rounded-sm", toneTile[g.c.tone])}>
                      <BookOpen size={18} strokeWidth={1.5} />
                    </span>
                    <span className="grid min-w-0 content-start gap-0.5">
                      <span className="line-clamp-2 text-13.5 font-semibold leading-snug">{b.title}</span>
                      <span className="line-clamp-1 text-12 text-muted">{b.short}</span>
                      <span className="mt-1 flex items-center gap-2 text-11.5 text-faint">
                        {b.minutes} min read
                        {b.updated && <Tag tone="warn">Updated</Tag>}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </SectionCard>
      </Col>
      <Col>
        <SectionCard
          title="Recently read"
          flush
          right={
            <button type="button" onClick={() => setDrill(true)} className="text-13 font-semibold text-accent hover:underline">
              All ›
            </button>
          }
        >
          {RECENT_READS.map((r) => (
            <RecentRow key={r.id} {...r} base={base} />
          ))}
        </SectionCard>
        <SectionCard title="Monthly status brief" flush>
          <ListRow href={`${base}/b8`}>
            <FileBadge type="PDF" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">September 2026</span>
              <span className="block truncate text-12.5 text-muted">Name approved, Phase 2 started, COI expected 28 Oct</span>
            </span>
          </ListRow>
        </SectionCard>
      </Col>
      <RecentDrill open={drill} onOpenChange={setDrill} base={base} />
    </Cols>
  );
}

const DEPTHS = [
  { key: "0", label: "Simpler" },
  { key: "1", label: "Normal" },
  { key: "2", label: "More detail" },
];

/** lib_reader: depth picker, timeline, key facts, sources, the project card, related books and documents. */
export function ReaderScreen({ portal, id }: { portal: Portal; id: string }) {
  const book = findBook(id);
  const r = readerFor(book);
  const base = libBase(portal);
  const docBase = portal === "client" ? "/client/documents/view" : `/${portal}/documents/view`;
  const stepHref = (n: number) => (portal === "client" ? `/client/incorporation/step/${n}` : `/${portal}/clients/northwind/step/${n}`);
  const [depth, setDepth] = React.useState("1");
  const [saved, setSaved] = React.useState(RECENT_READS.some((x) => x.id === book.id));
  const [pct, setPct] = React.useState(RECENT_READS.find((x) => x.id === book.id)?.pct ?? 0);
  const art = React.useRef<HTMLElement>(null);
  const toast = useUndoToast();

  // Reading progress follows the scroll position of the article. No animation.
  React.useEffect(() => {
    const on = () => {
      const el = art.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const read = Math.min(1, Math.max(0, (window.innerHeight * 0.4 - rect.top) / Math.max(1, total)));
      setPct((p) => Math.max(p, Math.round(read * 100)));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const toc = [
    { id: "summary", label: "Summary" },
    ...(r.timeline ? [{ id: "timeline", label: "Timeline" }] : []),
    ...(r.facts ? [{ id: "facts", label: "Key facts" }] : []),
    ...(r.why ? [{ id: "why", label: "Why it matters to Northwind" }] : []),
    ...(r.sources ? [{ id: "sources", label: "Sources" }] : []),
  ];
  const related = (r.related ?? LIB_BOOKS.filter((b) => b.cat === book.cat && b.id !== book.id).slice(0, 3).map((b) => b.id)).map(findBook);
  const docs = (r.docs ?? []).map(findDoc);

  return (
    <Cols>
      <Col>
        <SectionCard bare title={book.title}>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={chipTone[catTone(book.cat)]}>{book.cat}</Chip>
            <span className="text-12.5 text-muted">Reviewed by SBC</span>
            <span className="text-12.5 text-faint">·</span>
            <span className="text-12.5 text-muted">Updated {fmt(book.date)}</span>
            {book.updated && <Tag tone="warn">Updated since you read it</Tag>}
          </div>
          <h1 className="mt-2 text-[20px] font-semibold leading-tight tracking-tight md:text-22">{book.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Tabs items={DEPTHS} value={depth} onChange={setDepth} />
            <span className="text-12.5 text-muted">{book.minutes} min read</span>
            {r.official && (
              <a href={r.official.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-12.5 font-semibold text-accent hover:underline">
                Official link · {r.official.label}
                <ExternalLink size={13} strokeWidth={1.5} aria-hidden />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </SectionCard>

        <SectionCard bare title="Article" bodyClassName="p-0">
          <article ref={art} className="grid gap-0">
            <section id="summary" className="scroll-mt-20 px-4 py-5 md:px-6">
              <p className="max-w-[68ch] text-14.5 font-medium leading-relaxed">{r.lines[Number(depth) as 0 | 1 | 2]}</p>
              {depth !== "0" && book.body.length > 0 && (
                <div className="mt-3 grid max-w-[68ch] gap-2 text-14 leading-relaxed text-ink-2">
                  {book.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
            </section>
            {r.timeline && (
              <section id="timeline" className="scroll-mt-20 border-t border-line-soft px-4 py-5 md:px-6">
                <h2 className="mb-3 text-13 font-semibold text-muted">Timeline</h2>
                <ol className="grid gap-0">
                  {r.timeline.map((t, i) => (
                    <li key={t.label} className="flex items-start gap-3">
                      <span className="flex flex-col items-center">
                        <span className={cn("mt-1 h-3 w-3 rounded-full border-2", t.state === "done" ? "border-ok bg-ok" : t.state === "now" ? "border-accent bg-surface" : "border-line bg-surface")} aria-hidden />
                        {i < r.timeline!.length - 1 && <span className="h-7 w-px bg-line" aria-hidden />}
                      </span>
                      <span className={cn("min-w-0 flex-1 pb-2 text-13.5", t.state === "next" && "text-muted")}>
                        <span className="font-semibold">{t.label}</span>
                        <span className={cn("ml-2 font-mono text-12", t.state === "now" ? "text-accent" : "text-muted")}>{t.when}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {r.facts && (
              <section id="facts" className="scroll-mt-20 border-t border-line-soft px-4 py-5 md:px-6">
                <h2 className="mb-3 text-13 font-semibold text-muted">Key facts</h2>
                <KeyValue cols={3} rows={r.facts} />
              </section>
            )}
            {r.why && (
              <section id="why" className="scroll-mt-20 border-t border-line-soft px-4 py-5 md:px-6">
                <h2 className="mb-2 text-13 font-semibold text-muted">Why it matters to Northwind</h2>
                <p className="max-w-[68ch] text-14 leading-relaxed text-ink-2">{r.why}</p>
              </section>
            )}
            {r.sources && (
              <section id="sources" className="scroll-mt-20 border-t border-line-soft px-4 py-5 md:px-6">
                <h2 className="mb-2 text-13 font-semibold text-muted">Sources</h2>
                <ul className="flex flex-wrap gap-2">
                  {r.sources.map((s) => (
                    <li key={s} className="inline-flex h-[26px] items-center rounded-sm bg-raised px-2.5 text-12.5 text-ink-2">
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-6">
              {saved ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-13 font-semibold text-ok">
                    <BookmarkCheck size={16} strokeWidth={1.5} /> Saved to library
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSaved(false);
                      toast.show("Removed from library", () => setSaved(true));
                    }}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSaved(true);
                    toast.show("Saved to library", () => setSaved(false));
                  }}
                >
                  <Bookmark size={15} strokeWidth={1.5} /> Save to library
                </Button>
              )}
              <Button size="sm" onClick={() => toast.show(`Downloaded ${book.title}.pdf`)}>
                <Download size={15} strokeWidth={1.5} /> PDF brief
              </Button>
            </div>
          </article>
        </SectionCard>
      </Col>

      <Col className="lg:sticky lg:top-5">
        <SectionCard title="Contents" meta={`${pct}% read`} flush>
          <div className="px-4 pb-1 pt-3 md:px-5">
            <Bar pct={pct} tone={pct >= 100 ? "ok" : "accent"} />
          </div>
          <nav aria-label="Contents" className="py-1">
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="flex h-9 items-center px-4 text-13.5 text-ink-2 hover:bg-raised md:px-5">
                {t.label}
              </a>
            ))}
          </nav>
        </SectionCard>
        {r.project && (
          <SectionCard title="In Northwind’s project" flush>
            <ListRow href={r.project.step ? stepHref(r.project.step) : portal === "client" ? "/client/obligations" : `/${portal}/compliances/obligations`}>
              <DateTile date={r.project.date} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.project.title}</span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {r.project.chips.map((c) => (
                    <Tag key={c}>{c}</Tag>
                  ))}
                </span>
              </span>
            </ListRow>
            <div className="border-t border-line-soft px-4 py-2.5 md:px-5">
              <HeadLink href={portal === "client" ? "/client/calendar" : `/${portal}/compliances/calendar`}>Open in Compliances ›</HeadLink>
            </div>
          </SectionCard>
        )}
        {related.length > 0 && (
          <SectionCard title="Related in Northwind’s library" flush>
            {related.map((b) => (
              <ListRow key={b.id} href={`${base}/${b.id}`}>
                <BookOpen size={16} strokeWidth={1.5} className="flex-none text-teal" />
                <span className="min-w-0 flex-1 truncate font-semibold">{b.title}</span>
                <span className="flex-none text-12 text-faint">{b.minutes} min</span>
              </ListRow>
            ))}
          </SectionCard>
        )}
        {docs.length > 0 && (
          <SectionCard title="Documents for this" flush>
            {docs.map((f) => (
              <ListRow key={f.id} href={`${docBase}/${f.id}`}>
                <FileBadge type={f.type} />
                <span className="min-w-0 flex-1 truncate font-semibold">{f.label}</span>
                <Chip tone={docStatusTone[f.status]}>{f.status}</Chip>
              </ListRow>
            ))}
          </SectionCard>
        )}
      </Col>
      {toast.node}
    </Cols>
  );
}
