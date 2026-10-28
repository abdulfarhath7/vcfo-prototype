"use client";
import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt, STAFF_TODAY } from "@/lib/dates";
import { KB_DRAFT, KB_FILES, KB_OPEN_SHELF, KB_SHELVES, type KbFile, type KbShelf } from "@/data/knowledge-bank";
import { Button } from "@/components/ui/Button";
import { FileBadge, fileType } from "@/components/ui/FileBadge";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";

/*
 * Staff knowledge bank: s/{lead,mgr,admin}/Knowledge.dc.html. Folder shelves per area, the open shelf's file list
 * and an "Upload to library" form. It is not the client's book shelf.
 * Kept out: "Only managers can delete files." under the form buttons (R-06).
 */

// Spine colours, in the old palette order: violet, blue, navy, green, orange, amber, red, violet.
const SPINES = ["bg-violet", "bg-accent", "bg-navy dark:bg-btn", "bg-ok", "bg-brand", "bg-warn", "bg-bad", "bg-violet"];
const PLANK = "bg-[color-mix(in_srgb,var(--warn-mid)_38%,var(--line))]";

function ShelfFolder({ s }: { s: KbShelf }) {
  const books = Array.from({ length: Math.min(s.count, 9) }, (_, i) => ({
    w: 14 + ((i * 7 + s.seed) % 3) * 4,
    h: 70 + ((i * 13 + s.seed) % 5) * 9,
    tone: SPINES[(i + s.seed) % SPINES.length],
  }));
  return (
    <div className="min-w-0">
      <div className="flex h-[112px] items-end gap-1.5 overflow-hidden px-3.5" aria-hidden>
        {books.map((b, i) => (
          <span key={i} className={cn("block flex-none rounded-t-[2px]", b.tone)} style={{ width: b.w, height: b.h }} />
        ))}
      </div>
      <div className={cn("h-[7px] rounded-[2px]", PLANK)} aria-hidden />
      <div className="mt-1.5 flex items-baseline justify-between gap-2 px-0.5">
        <b className="truncate text-13 font-semibold">{s.name}</b>
        <span className="flex-none text-12 text-muted">{s.count} docs</span>
      </div>
    </div>
  );
}

export function KnowledgeBankScreen() {
  const [shelves, setShelves] = React.useState(KB_SHELVES);
  const [files, setFiles] = React.useState<KbFile[]>(KB_FILES);
  const [q, setQ] = React.useState("");
  const [title, setTitle] = React.useState(KB_DRAFT.title);
  const [when, setWhen] = React.useState(KB_DRAFT.when);
  const [picked, setPicked] = React.useState<string>("");
  const [folder, setFolder] = React.useState(false);
  const [folderName, setFolderName] = React.useState("");
  const titleRef = React.useRef<HTMLInputElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const toast = useUndoToast();

  const s = q.trim().toLowerCase();
  const shown = files.filter((f) => !s || f.title.toLowerCase().includes(s));

  const reset = () => {
    setTitle("");
    setWhen("");
    setPicked("");
  };
  const upload = () => {
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    const before = files;
    const row: KbFile = { id: `u${Date.now()}`, title: title.trim(), note: when.trim() || "Internal", type: picked ? fileType(picked) : "PDF", when: fmt(STAFF_TODAY) };
    setFiles([row, ...files]);
    setShelves((x) => x.map((sh) => (sh.name === KB_OPEN_SHELF ? { ...sh, count: sh.count + 1 } : sh)));
    reset();
    toast.show(`Uploaded to ${KB_OPEN_SHELF}`, () => {
      setFiles(before);
      setShelves((x) => x.map((sh) => (sh.name === KB_OPEN_SHELF ? { ...sh, count: sh.count - 1 } : sh)));
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <nav aria-label="Folder path" className="mr-auto text-13 text-muted">
          All › <b className="font-semibold text-ink">{KB_OPEN_SHELF}</b>
        </nav>
        <label className="flex h-9 w-full items-center gap-2 rounded-md border border-line bg-surface px-3 sm:w-[260px]">
          <Search size={14} strokeWidth={1.6} className="text-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files by name…" aria-label="Search files" className="h-full min-w-0 flex-1 bg-transparent text-13 outline-none placeholder:text-faint" />
        </label>
        <Button onClick={() => setFolder(true)}>New folder</Button>
        <Button variant="primary" onClick={() => titleRef.current?.focus()}>
          Upload document
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="grid min-w-0 gap-4">
          <SectionCard title="Shelves">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {shelves.map((sh) => (
                <ShelfFolder key={sh.name} s={sh} />
              ))}
            </div>
          </SectionCard>
          <SectionCard title={`${KB_OPEN_SHELF} · ${shown.length} documents`} flush>
            {shown.length === 0 ? (
              <Empty />
            ) : (
              shown.map((f) => (
                <ListRow key={f.id}>
                  <FileBadge type={f.type} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{f.title}</span>
                    <span className="block truncate text-12.5 text-muted">{f.note}</span>
                  </span>
                  <span className="flex-none text-12 text-muted">{f.when}</span>
                </ListRow>
              ))
            )}
          </SectionCard>
        </div>

        <SectionCard title="Upload to library">
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              upload();
            }}
          >
            <Field label="Title">
              <Input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <div className="grid gap-1.5">
              <span className="text-12.5 font-semibold text-muted">File</span>
              <div
                className="grid min-h-[68px] place-items-center rounded-md border border-dashed border-line bg-raised px-3 py-3 text-center text-13 text-muted"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) setPicked(f.name);
                }}
              >
                {picked ? (
                  <span className="flex items-center gap-2">
                    <FileBadge type={fileType(picked)} />
                    <span className="truncate font-mono text-12.5 text-ink">{picked}</span>
                  </span>
                ) : (
                  <span>
                    Drop a file or{" "}
                    <button type="button" onClick={() => fileRef.current?.click()} className="font-semibold text-accent hover:underline">
                      browse
                    </button>
                  </span>
                )}
                <input ref={fileRef} type="file" className="hidden" aria-label="File" onChange={(e) => setPicked(e.target.files?.[0]?.name ?? "")} />
              </div>
            </div>
            <Field label="When to use this document…">
              <textarea
                rows={3}
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-13.5 text-ink outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent-line"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button onClick={reset}>Cancel</Button>
              <Button type="submit" variant="primary">
                Upload to library
              </Button>
            </div>
          </form>
        </SectionCard>
      </div>

      <Modal
        open={folder}
        onOpenChange={setFolder}
        size="sm"
        title="New folder"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFolder(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!folderName.trim()}
              onClick={() => {
                const before = shelves;
                setShelves([...shelves, { name: folderName.trim(), count: 0, seed: shelves.length + 1 }]);
                setFolder(false);
                setFolderName("");
                toast.show("Folder created", () => setShelves(before));
              }}
            >
              Create folder
            </Button>
          </>
        }
      >
        <Field label="Folder name">
          <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} autoFocus />
        </Field>
      </Modal>
      {toast.node}
    </div>
  );
}
