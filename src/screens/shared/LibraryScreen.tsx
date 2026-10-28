"use client";
import * as React from "react";
import Link from "next/link";
import { BookOpen, BookmarkCheck, Bookmark, Check, Download, ExternalLink, Flag, Globe, Landmark, ReceiptText, Search, ShieldCheck, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { LIB_BOOKS, LIB_CATEGORIES, RECENT_READS, findBook, findDoc, readerFor, type LibBook, type LibCategory } from "@/data/docs-library";
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
import { openAsk } from "@/components/shell/AskButton";
import type { Portal } from "@/data/nav";

const libBase = (portal: Portal) => (portal === "client" ? "/client/library" : `/${portal}/docs/knowledge`);
const catTone = (c: LibCategory) => LIB_CATEGORIES.find((x) => x.id === c)?.tone ?? "blue";

/** Recently read rows with a reading bar. Shared by the rail card and the drill. */
function RecentRow({ id, pct, note, base }: { id: string; pct: number; note: string; base: string }) {
  const b = findBook(id);
  return (
    <ListRow href={`${base}/${b.id}`}>
      <span className={cn("grid h-9 w-9 flex-none place-items-center rounded-md", toneTile[catTone(b.cat)])}>
        <BookOpen size={16} strokeWidth={1.6} />
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

/* Cover colours by shelf. Light: the tone. Dark: the tone mixed with navy, so white text stays legible. */
const COVER: Record<LibCategory, string> = {
  Incorporation: "bg-accent dark:bg-[color-mix(in_srgb,var(--accent)_45%,var(--navy))]",
  "Foreign investment": "bg-[color-mix(in_srgb,var(--bad)_78%,var(--navy))] dark:bg-[color-mix(in_srgb,var(--bad)_42%,var(--navy))]",
  Tax: "bg-[color-mix(in_srgb,var(--warn)_88%,var(--navy))] dark:bg-[color-mix(in_srgb,var(--warn)_42%,var(--navy))]",
  Compliance: "bg-[color-mix(in_srgb,var(--teal)_78%,var(--navy))] dark:bg-[color-mix(in_srgb,var(--teal)_40%,var(--navy))]",
  "Northwind’s project": "bg-navy dark:bg-btn",
  "SBC SOPs": "bg-[color-mix(in_srgb,var(--ok)_80%,var(--navy))] dark:bg-[color-mix(in_srgb,var(--ok)_40%,var(--navy))]",
};
const COVER_ICON: Record<LibCategory, typeof BookOpen> = {
  Incorporation: Landmark,
  "Foreign investment": Globe,
  Tax: ReceiptText,
  Compliance: ShieldCheck,
  "Northwind’s project": Flag,
  "SBC SOPs": BookOpen,
};
const COVER_LABEL: Record<LibCategory, string> = {
  Incorporation: "Incorp.",
  "Foreign investment": "FDI",
  Tax: "Tax",
  Compliance: "Compliance",
  "Northwind’s project": "Northwind’s project",
  "SBC SOPs": "SOP",
};

/** One book on the shelf: coloured cover, darker spine, orange head band, page edge, ribbon when updated. */
function Book({ b, href }: { b: LibBook; href: string }) {
  const Icon = COVER_ICON[b.cat];
  return (
    <Link
      href={href}
      aria-label={`Open ${b.title}`}
      className={cn(
        "group relative flex h-[172px] w-[128px] flex-none flex-col gap-2 rounded-[2px_6px_6px_2px] py-4 pl-[22px] pr-3 text-white",
        "motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-3 motion-safe:hover:-rotate-2 motion-safe:focus-visible:-translate-y-3",
        COVER[b.cat],
      )}
    >
      <span className="absolute inset-y-0 left-0 w-[11px] rounded-l-[2px] bg-[color-mix(in_srgb,var(--navy)_45%,transparent)]" aria-hidden />
      <span className="absolute -right-[5px] bottom-[5px] top-[5px] w-[5px] rounded-r-[2px] border-y border-r border-line bg-raised" aria-hidden />
      <span className="absolute left-[11px] right-0 top-0 h-[5px] rounded-tr-[6px] bg-brand" aria-hidden />
      {b.updated && <span className="absolute right-2 top-0 h-[22px] w-[14px] bg-accent [clip-path:polygon(0_0,100%_0,100%_100%,50%_74%,0_100%)]" title="Updated" aria-label="Updated" />}
      <span className="grid h-7 w-7 place-items-center rounded-md bg-white/[.18]">
        <Icon size={14} strokeWidth={1.6} />
      </span>
      <span className="line-clamp-2 text-13 font-bold leading-[1.32] [overflow-wrap:break-word] group-hover:line-clamp-6">{b.title}</span>
      <span className="mt-auto truncate text-11 font-bold uppercase tracking-[.04em] text-white/80">{COVER_LABEL[b.cat]}</span>
    </Link>
  );
}

/** Shelf rows: books stand on a plank under every row. The plank repeats every 212 px (172 px book + 40 px gap). */
const PLANK_COLOR = "color-mix(in srgb, var(--line) 50%, var(--faint))";
const PLANK: React.CSSProperties = {
  backgroundImage: `linear-gradient(180deg, transparent 172px, ${PLANK_COLOR} 172px, ${PLANK_COLOR} 186px, transparent 186px)`,
  backgroundSize: "100% 212px",
  backgroundPosition: "0 22px",
  backgroundRepeat: "repeat-y",
};

/** lib_shelf_a: classic shelves by category, coloured spines on planks. K-46. R-04: no mascot. R-10: the shelf filter is a dropdown. */
export function LibraryScreen({ portal }: { portal: Portal; title?: string }) {
  const [cat, setCat] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [drill, setDrill] = React.useState(false);
  const toast = useUndoToast();
  const base = libBase(portal);
  const s = q.trim().toLowerCase();
  const shown = LIB_BOOKS.filter((b) => (cat === "all" || b.cat === cat) && (!s || (b.title + " " + b.short).toLowerCase().includes(s)));
  const shelves = LIB_CATEGORIES.map((c) => ({ c, books: shown.filter((b) => b.cat === c.id) })).filter((g) => g.books.length);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="Shelf"
          size="md"
          options={[{ value: "all", label: `All shelves · ${LIB_BOOKS.length}` }, ...LIB_CATEGORIES.map((c) => ({ value: c.id, label: `${c.short} · ${LIB_BOOKS.filter((b) => b.cat === c.id).length}` }))]}
        />
        <Tag tone="prog">{LIB_BOOKS.length} books</Tag>
        <span className="flex-1" />
        <Button asChild>
          <Link href={`${base}/b8`}>Monthly status brief</Link>
        </Button>
        <Button onClick={() => toast.show("Downloaded Northwind-status-brief-Sep-2026.pdf")}>
          <Download size={15} strokeWidth={1.6} /> PDF brief
        </Button>
      </div>
      <label className="flex h-10 items-center gap-2 rounded-md border border-line bg-surface px-3">
        <Search size={15} strokeWidth={1.6} className="text-muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search books" aria-label="Search books" className="h-full min-w-0 flex-1 bg-transparent text-13.5 outline-none placeholder:text-faint" />
      </label>

      <section aria-label="Recently read" className="flex flex-wrap items-center gap-3">
        <h2 className="basis-full text-12.5 font-semibold xl:basis-auto">Recently read</h2>
        {RECENT_READS.map((r) => {
          const b = findBook(r.id);
          return (
            <div key={r.id} className="flex min-w-0 flex-[1_1_220px] items-center gap-2.5 rounded-md border border-line bg-surface py-2 pl-2 pr-3 xl:max-w-[360px]">
              <span className={cn("h-[42px] w-[30px] flex-none rounded-[2px_4px_4px_2px]", COVER[b.cat])} aria-hidden />
              <span className="grid min-w-0 flex-1 gap-1.5">
                <Link href={`${base}/${b.id}`} className="truncate text-13 font-semibold hover:underline">
                  {b.title}
                </Link>
                <button type="button" onClick={() => setDrill(true)} title={r.note} aria-label={`${r.note}. Open the reading list`} className="block py-0.5">
                  <Bar pct={r.pct} tone={r.pct >= 100 ? "ok" : "accent"} />
                </button>
              </span>
            </div>
          );
        })}
      </section>

      <section aria-label="Shelves" className="rounded-lg border border-line bg-surface px-1 pb-6 pt-2 sm:px-3">
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
          </div>
        )}
        {shelves.map((g) => (
          <div key={g.c.id} className="pt-4">
            <div className="flex items-center gap-2 px-3">
              <span className={cn("h-2.5 w-2.5 flex-none rounded-[2px]", COVER[g.c.id])} aria-hidden />
              <h2 className="text-13.5 font-semibold">{g.c.id}</h2>
              <span className="font-mono text-12 text-faint">{g.books.length}</span>
            </div>
            <div className="mx-3 grid grid-cols-[repeat(auto-fill,128px)] items-end justify-center gap-x-[18px] gap-y-10 px-1 pt-[22px] sm:justify-start sm:px-4" style={PLANK}>
              {g.books.map((b) => (
                <Book key={b.id} b={b} href={`${base}/${b.id}`} />
              ))}
            </div>
            <div className="mx-3 mt-0 h-[14px] rounded-[2px]" style={{ background: PLANK_COLOR }} aria-hidden />
          </div>
        ))}
      </section>
      <RecentDrill open={drill} onOpenChange={setDrill} base={base} />
      {toast.node}
    </div>
  );
}

const DEPTHS = [
  { key: "0", label: "Simpler" },
  { key: "1", label: "Normal" },
  { key: "2", label: "More detail" },
];

/** Three-step reading timeline: circles with solid (done) and dashed (to come) links. */
function ReaderTimeline({ steps }: { steps: NonNullable<ReturnType<typeof readerFor>["timeline"]> }) {
  return (
    <ol className="flex items-start">
      {steps.map((t, i) => (
        <React.Fragment key={t.label}>
          {i > 0 && <li aria-hidden className={cn("mt-5 h-0 min-w-4 flex-1 border-t-2", steps[i - 1].state === "done" && t.state !== "next" ? "border-ok" : "border-dashed border-accent")} />}
          <li className="grid w-[30%] max-w-[180px] flex-none justify-items-center gap-1 text-center">
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-md text-13 font-semibold",
                t.state === "done" ? "bg-ok-soft text-ok" : t.state === "now" ? "border border-line bg-surface text-ink" : "border-2 border-dashed border-accent bg-surface text-accent",
              )}
            >
              {t.state === "done" ? <Check size={16} strokeWidth={1.6} /> : i + 1}
            </span>
            <span className="text-13 font-semibold leading-snug">{t.label}</span>
            <span className="font-mono text-11.5 text-muted">{t.when}</span>
          </li>
        </React.Fragment>
      ))}
    </ol>
  );
}

/** lib_reader: navy head band with chips, depth picker and official link; article with a 3-step timeline and an amber "Why it matters" box. */
export function ReaderScreen({ portal, id }: { portal: Portal; id: string }) {
  const book = findBook(id);
  const r = readerFor(book);
  const base = libBase(portal);
  const docBase = portal === "client" ? "/client/documents/view" : `/${portal}/documents/view`;
  const stepHref = (n: number) => (portal === "client" ? `/client/incorporation/step/${n}` : `/${portal}/clients/northwind/step/${n}`);
  const [depth, setDepth] = React.useState("1");
  const [saved, setSaved] = React.useState(RECENT_READS.some((x) => x.id === book.id));
  const toast = useUndoToast();
  const related = (r.related ?? LIB_BOOKS.filter((b) => b.cat === book.cat && b.id !== book.id).slice(0, 3).map((b) => b.id)).map(findBook);
  const docs = (r.docs ?? []).map(findDoc);

  return (
    <Cols>
      <Col>
        <section aria-label={book.title} className="rounded-lg bg-navy px-5 py-5 text-white md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-[22px] items-center rounded-sm border border-white/[.25] bg-white/[.08] px-2 text-11.5 font-semibold">{book.cat}</span>
            <Chip tone="ok">Reviewed by SBC</Chip>
            {(saved || book.updated) && <Chip tone="prog">Updated {fmt(book.date)}</Chip>}
          </div>
          <h1 className="mt-2.5 text-[24px] font-bold leading-tight tracking-tight md:text-[28px]">{book.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Tabs items={DEPTHS} value={depth} onChange={setDepth} size="md" />
            <span className="flex-1" />
            <span className="font-mono text-12 text-navy-ink">{book.minutes} min read</span>
            {r.official && (
              <Button asChild size="sm" variant="onNavy">
                <a href={r.official.href} target="_blank" rel="noreferrer">
                  Official link · {r.official.label}
                  <ExternalLink size={13} strokeWidth={1.6} aria-hidden />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
            )}
          </div>
        </section>

        <SectionCard bare title="Article" bodyClassName="grid gap-5 px-4 py-5 md:px-6">
          <p className="max-w-[72ch] text-16 font-medium leading-relaxed">{r.lines[Number(depth) as 0 | 1 | 2]}</p>
          {r.timeline && (
            <div className="rounded-lg bg-accent-soft px-4 py-4 md:px-5">
              <h2 className="mb-3 text-11.5 font-bold text-accent">Timeline</h2>
              <ReaderTimeline steps={r.timeline} />
            </div>
          )}
          {depth === "2" && r.facts && <KeyValue cols={3} rows={r.facts} />}
          {r.why && (
            <div className="flex gap-3 rounded-lg border border-warn-mid bg-warn-soft px-4 py-4 md:px-5">
              <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-brand text-white">
                <Star size={14} strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <h2 className="text-13.5 font-bold text-warn">Why it matters to Northwind</h2>
                <p className="mt-1 max-w-[72ch] text-13.5 leading-relaxed text-ink">{r.why}</p>
              </div>
            </div>
          )}
          {r.sources && (
            <div className="px-1">
              <h2 className="mb-2 text-11.5 font-bold text-ink-2">Sources</h2>
              <ul className="flex flex-wrap gap-2">
                {r.sources.map((s) => (
                  <li key={s} className="inline-flex h-[26px] items-center rounded-sm border border-line bg-raised px-2.5 text-12 font-semibold text-ink-2">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
            {saved ? (
              <span className="inline-flex h-9 items-center gap-2 rounded-md bg-ok-soft px-3.5 text-13.5 font-semibold text-ok">
                <BookmarkCheck size={16} strokeWidth={1.6} /> Saved to library
              </span>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setSaved(true);
                  toast.show("Saved to library", () => setSaved(false));
                }}
              >
                <Bookmark size={15} strokeWidth={1.6} /> Save to library
              </Button>
            )}
            <Button onClick={() => toast.show(`Downloaded ${book.title}.pdf`)}>
              <Download size={15} strokeWidth={1.6} /> PDF brief
            </Button>
            <Button onClick={openAsk}>Ask a follow-up</Button>
            <span className="flex-1" />
            {saved && (
              <Button
                size="icon"
                aria-label="Remove from library"
                title="Remove from library"
                onClick={() => {
                  setSaved(false);
                  toast.show("Removed from library", () => setSaved(true));
                }}
              >
                <Trash2 size={15} strokeWidth={1.6} />
              </Button>
            )}
          </div>
        </SectionCard>
      </Col>

      <Col>
        {r.project && (
          <SectionCard title="In Northwind’s project" flush>
            <ListRow href={r.project.step ? stepHref(r.project.step) : portal === "client" ? "/client/obligations" : `/${portal}/compliances/obligations`}>
              <DateTile date={r.project.date} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.project.title}</span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {r.project.chips.map((c, i) => (
                    <Tag key={c} tone={i === 0 ? "warn" : "idle"}>
                      {c}
                    </Tag>
                  ))}
                </span>
              </span>
            </ListRow>
            <div className="border-t border-line-soft px-4 py-2.5 md:px-5">
              <HeadLink href={portal === "client" ? "/client/calendar" : `/${portal}/compliances/calendar`}>Open in Compliances</HeadLink>
            </div>
          </SectionCard>
        )}
        {related.length > 0 && (
          <SectionCard title="Related in Northwind’s library" flush>
            {related.map((b) => {
              const Icon = COVER_ICON[b.cat];
              return (
                <ListRow key={b.id} href={`${base}/${b.id}`}>
                  <span className={cn("grid h-7 w-7 flex-none place-items-center rounded-md", toneTile[catTone(b.cat)])}>
                    <Icon size={14} strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{b.title}</span>
                </ListRow>
              );
            })}
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
