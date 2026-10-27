"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronRight, Download, FolderOpen, Search, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/dates";
import { CLIENTS } from "@/data/people";
import { FOLDERS, FILES, docStatusTone, type DocFile, type Folder } from "@/data/shared";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { FileBadge } from "@/components/ui/FileBadge";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { KeyValue } from "@/components/cards/KeyValue";
import { SectionCard } from "@/components/cards/SectionCard";
import type { Portal } from "@/data/nav";

function count(folder: Folder, files: DocFile[]): number {
  return files.filter((f) => f.folder === folder.id).length + (folder.kids?.reduce((a, k) => a + count(k, files), 0) ?? 0);
}

function ids(folder: Folder): string[] {
  return [folder.id, ...(folder.kids?.flatMap(ids) ?? [])];
}

function Tree({ folders, pick, picked, files, depth = 0 }: { folders: Folder[]; pick: (id: string) => void; picked: string; files: DocFile[]; depth?: number }) {
  return (
    <ul>
      {folders.map((f) => {
        const on = picked === f.id;
        const holds = ids(f).includes(picked);
        return (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => pick(f.id)}
              className={cn("flex h-9 w-full items-center gap-2 rounded-md pr-2 text-left text-13.5 hover:bg-raised", on && "bg-navy-tint font-semibold text-navy")}
              style={{ paddingLeft: 8 + depth * 16 }}
              aria-current={on ? "true" : undefined}
            >
              {f.kids ? <ChevronRight size={14} strokeWidth={1.5} className={cn("flex-none text-faint transition-transform", holds && "rotate-90")} /> : <span className="w-3.5" />}
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="text-11.5 text-faint">{count(f, files)}</span>
            </button>
            {f.kids && holds && <Tree folders={f.kids} pick={pick} picked={picked} files={files} depth={depth + 1} />}
          </li>
        );
      })}
    </ul>
  );
}

/** Documents (client) and Vault (staff). C-0025: the tree and the preview change without flicker — plain state, no animation. */
export function DocumentsExplorer({ portal, title = "Documents" }: { portal: Portal; title?: string }) {
  const staff = portal !== "client";
  const [client, setClient] = React.useState(CLIENTS[0].id);
  const [folder, setFolder] = React.useState<string>("all");
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sel, setSel] = React.useState<DocFile | null>(FILES[0]);

  const folderIds = folder === "all" ? null : ids(FOLDERS.flatMap(ids).includes(folder) ? findFolder(FOLDERS, folder)! : FOLDERS[0]);
  const shown = FILES.filter((f) => (!folderIds || folderIds.includes(f.folder)) && (status === "all" || f.status === status) && f.name.toLowerCase().includes(q.toLowerCase()));
  const requested = FILES.filter((f) => f.status === "Requested").length;
  const base = portal === "client" ? "/client" : `/${portal}`;

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard
        title={title}
        meta={`${FILES.length} files`}
        flush
        right={
          <>
            {staff && <Select value={client} onChange={(e) => setClient(e.target.value)} options={CLIENTS.map((c) => ({ value: c.id, label: c.short }))} aria-label="Client" />}
            <Tabs
              items={[
                { key: "all", label: "All", count: FILES.length },
                { key: "Requested", label: "Requested", count: requested },
                { key: "Sent back", label: "Sent back", count: FILES.filter((f) => f.status === "Sent back").length },
              ]}
              value={status}
              onChange={setStatus}
            />
            <Button size="sm">
              <Download size={15} strokeWidth={1.5} /> ZIP
            </Button>
            <Button size="sm" variant="primary">
              <Upload size={15} strokeWidth={1.5} /> Upload
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
          <nav className="border-b border-line-soft p-2 md:border-b-0 md:border-r" aria-label="Folders">
            <button type="button" onClick={() => setFolder("all")} className={cn("flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-13.5 hover:bg-raised", folder === "all" && "bg-navy-tint font-semibold text-navy")}>
              <FolderOpen size={14} strokeWidth={1.5} className="text-faint" />
              <span className="flex-1">All documents</span>
              <span className="text-11.5 text-faint">{FILES.length}</span>
            </button>
            <Tree folders={FOLDERS} pick={setFolder} picked={folder} files={FILES} />
          </nav>
          <div className="min-w-0">
            <div className="flex h-11 items-center gap-2 border-b border-line-soft px-3">
              <Search size={15} strokeWidth={1.5} className="text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a file" className="h-full flex-1 bg-transparent text-13.5 outline-none placeholder:text-faint" />
            </div>
            <ul>
              {shown.length === 0 && <li className="px-4 py-4 text-13 text-faint">No file matches</li>}
              {shown.map((f) => (
                <li key={f.id}>
                  <button type="button" onClick={() => setSel(f)} className={cn("flex w-full items-center gap-3 border-t border-line-soft px-3 py-2.5 text-left hover:bg-raised", sel?.id === f.id && "bg-raised")} aria-current={sel?.id === f.id}>
                    <FileBadge type={f.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-13.5 font-semibold">{f.name}</span>
                      <span className="block truncate text-12 text-muted">
                        {f.from === "client" ? "Northwind" : f.from === "sbc" ? "SBC" : "MCA"} · {fmt(f.date)}
                        {f.size && ` · ${f.size}`}
                        {f.step && ` · Step ${f.step}`}
                      </span>
                    </span>
                    <Chip tone={docStatusTone[f.status]} fixed>
                      {f.status}
                    </Chip>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <aside className="border-t border-line-soft xl:border-l xl:border-t-0" aria-label="Preview">
            {sel ? (
              <div className="grid min-w-0 grid-cols-1 gap-4 p-4">
                <div className="flex items-center gap-3">
                  <FileBadge type={sel.type} />
                  <span className="min-w-0 flex-1 truncate font-mono text-13 font-medium">{sel.name}</span>
                  <Chip tone={docStatusTone[sel.status]}>{sel.status}</Chip>
                </div>
                <div className="grid aspect-[4/5] place-items-center rounded-md border border-line bg-raised text-12.5 text-faint">{sel.status === "Requested" ? "Not received yet" : `${sel.type} preview`}</div>
                <KeyValue
                  cols={2}
                  rows={[
                    { k: "From", v: <OwnerChip owner={sel.from} label={sel.from === "client" ? "Northwind" : undefined} /> },
                    { k: sel.status === "Requested" ? "Due" : "Received", v: fmt(sel.date) },
                    { k: "Step", v: sel.step ? `Step ${sel.step}` : "—" },
                    { k: "Size", v: sel.size || "—" },
                  ]}
                />
                <div className="flex flex-wrap gap-2">
                  {sel.status === "Requested" ? (
                    <Button variant="primary" size="sm">
                      <Upload size={15} strokeWidth={1.5} /> Upload
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="primary" size="sm">
                        <Link href={`${base}/documents/view/${sel.id}`}>Open</Link>
                      </Button>
                      <Button size="sm">
                        <Download size={15} strokeWidth={1.5} /> Download
                      </Button>
                    </>
                  )}
                  {staff && sel.status === "Received" && <Button size="sm">Verify</Button>}
                  {sel.step && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={portal === "client" ? `/client/incorporation/step/${sel.step}` : `/${portal}/clients/northwind/step/${sel.step}`}>Open step {sel.step}</Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="p-4 text-13 text-faint">Pick a file</p>
            )}
          </aside>
        </div>
      </SectionCard>
    </div>
  );
}

function findFolder(list: Folder[], id: string): Folder | undefined {
  for (const f of list) {
    if (f.id === id) return f;
    const k = f.kids && findFolder(f.kids, id);
    if (k) return k;
  }
  return undefined;
}
