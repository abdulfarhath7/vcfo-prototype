"use client";
import * as React from "react";
import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { BOOKS, type Book } from "@/data/shared";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Chip";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { Cols, Col } from "@/components/shell/Page";
import type { Portal } from "@/data/nav";

const SHELVES: Book["shelf"][] = ["Incorporation", "GST", "Income tax", "MCA filings", "Payroll", "Briefs"];

/** K-46: the SBC SOPs as a book shelf. R-04: no mascot. */
export function LibraryScreen({ portal, title = "Library" }: { portal: Portal; title?: string }) {
  const [shelf, setShelf] = React.useState("all");
  const [q, setQ] = React.useState("");
  const base = portal === "client" ? "/client/library" : `/${portal}/docs/knowledge`;
  const shown = BOOKS.filter((b) => (shelf === "all" || b.shelf === shelf) && (b.title + b.short).toLowerCase().includes(q.toLowerCase()));
  const grouped = SHELVES.map((s) => ({ s, books: shown.filter((b) => b.shelf === s) })).filter((g) => g.books.length);

  return (
    <Cols>
      <Col>
        <SectionCard
          title={title}
          meta={`${BOOKS.length} books`}
          flush
          right={
            <>
              <span className="hidden h-[30px] items-center gap-2 rounded-md border border-line px-2.5 md:flex">
                <Search size={14} strokeWidth={1.5} className="text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a book" className="w-32 bg-transparent text-12.5 outline-none placeholder:text-faint" />
              </span>
              <Tabs items={[{ key: "all", label: "All" }, ...SHELVES.map((s) => ({ key: s, label: s }))]} value={shelf} onChange={setShelf} className="max-w-full overflow-x-auto" />
            </>
          }
        >
          {grouped.length === 0 && <p className="px-5 py-4 text-13 text-faint">No book matches</p>}
          {grouped.map((g) => (
            <div key={g.s} className="border-t border-line-soft first:border-t-0">
              <p className="flex items-center gap-2 bg-raised px-4 py-1.5 text-11.5 font-semibold text-faint md:px-5">
                {g.s} <span>{g.books.length}</span>
              </p>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:px-5 lg:grid-cols-4">
                {g.books.map((b) => (
                  <Link key={b.id} href={`${base}/${b.id}`} className="group grid gap-2 rounded-md border border-line p-3 hover:bg-raised">
                    <span className={cn("grid h-20 place-items-center rounded-md", "bg-teal-soft text-teal")}>
                      <BookOpen size={22} strokeWidth={1.5} />
                    </span>
                    <span className="line-clamp-2 text-13.5 font-semibold leading-snug">{b.title}</span>
                    <span className="line-clamp-2 text-12 text-muted">{b.short}</span>
                    <span className="text-11.5 text-faint">
                      {b.pages} pages · {fmt(b.updated)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="Recently read" flush>
          {BOOKS.slice(0, 3).map((b) => (
            <ListRow key={b.id} href={`${base}/${b.id}`}>
              <BookOpen size={16} strokeWidth={1.5} className="text-teal" />
              <span className="min-w-0 flex-1 truncate font-semibold">{b.title}</span>
              <Tag tone="teal">{b.shelf}</Tag>
            </ListRow>
          ))}
        </SectionCard>
        <SectionCard title="Monthly status brief" flush>
          <ListRow href={`${base}/b8`}>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">September 2026</span>
              <span className="block text-12.5 text-muted">Name approved, Phase 2 started, COI expected 28 Oct</span>
            </span>
            <Tag>PDF</Tag>
          </ListRow>
        </SectionCard>
      </Col>
    </Cols>
  );
}

export function ReaderScreen({ portal, id }: { portal: Portal; id: string }) {
  const book = BOOKS.find((b) => b.id === id) ?? BOOKS[0];
  const base = portal === "client" ? "/client/library" : `/${portal}/docs/knowledge`;
  const siblings = BOOKS.filter((b) => b.shelf === book.shelf && b.id !== book.id);
  return (
    <Cols>
      <Col>
        <SectionCard title={book.title} meta={book.shelf} icon={{ Icon: BookOpen, tone: "teal" }}>
          <article className="grid max-w-[68ch] gap-3 text-14 leading-relaxed text-ink-2">
            {book.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="About this book">
          <KeyValue cols={1} rows={[{ k: "Shelf", v: book.shelf }, { k: "Pages", v: book.pages }, { k: "Updated", v: fmt(book.updated) }, { k: "Owner", v: "SBC" }]} />
        </SectionCard>
        {siblings.length > 0 && (
          <SectionCard title={`More in ${book.shelf}`} flush>
            {siblings.map((b) => (
              <ListRow key={b.id} href={`${base}/${b.id}`}>
                <span className="min-w-0 flex-1 truncate font-semibold">{b.title}</span>
                <span className="text-12 text-faint">{b.pages} p</span>
              </ListRow>
            ))}
          </SectionCard>
        )}
      </Col>
    </Cols>
  );
}
