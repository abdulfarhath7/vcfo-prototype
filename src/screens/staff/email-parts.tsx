"use client";
import * as React from "react";
import { Paperclip, Plus, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { clientById } from "@/data/staff-clients";
import { GROUPS, RECIPIENTS, type MailTemplate, type Recipient } from "@/data/staff-mail";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { FileBadge, fileType } from "@/components/ui/FileBadge";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { InlineConfirm } from "@/components/cards/InlineConfirm";
import { identityTag } from "./filters";

// Parts of the staff Email screen. Ported from reference/old-screens/s/lead/Email.dc.html:
// the "To" field with client, team and group chips, the template list with Create, Edit and Delete, attachments.

export const AREA = "w-full rounded-md border border-line bg-surface px-3 py-2 text-13.5 text-ink placeholder:text-faint outline-none focus-visible:ring-2 focus-visible:ring-accent-line";

/** A picked recipient: a person or a group. */
export type To = { kind: "person"; id: string } | { kind: "group"; id: string } | { kind: "free"; id: string };

export function toLabel(t: To) {
  if (t.kind === "group") return GROUPS.find((g) => g.id === t.id)?.name ?? t.id;
  if (t.kind === "free") return t.id;
  const r = RECIPIENTS.find((x) => x.id === t.id);
  return r ? `${r.name} · ${r.kind === "team" ? "Team" : r.org}` : t.id;
}

function ToChip({ t, onRemove }: { t: To; onRemove: () => void }) {
  const r = t.kind === "person" ? RECIPIENTS.find((x) => x.id === t.id) : undefined;
  const c = r?.client ? clientById(r.client) : undefined;
  // R-35: a client contact carries the client's identity colour. Team members and groups are grey.
  const tone = c ? identityTag[c.tone] : "idle";
  return (
    <Tag tone={tone} className="h-[24px] gap-1.5 pr-1">
      {t.kind === "group" && <Users size={12} strokeWidth={1.6} aria-hidden />}
      <span className="max-w-[200px] truncate">{toLabel(t)}</span>
      <button type="button" onClick={onRemove} className="grid h-4 w-4 place-items-center rounded-sm hover:bg-surface" aria-label={`Remove ${toLabel(t)}`}>
        <X size={12} strokeWidth={1.6} />
      </button>
    </Tag>
  );
}

function PickRow({ r, on, onPick }: { r: Recipient; on: boolean; onPick: () => void }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onPick} className={cn("flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left hover:bg-hover", on && "bg-hover")}>
      <Avatar name={r.name} size={24} />
      <span className="min-w-0 flex-1">
        <b className="block truncate text-13 font-medium text-ink">{r.name}</b>
        <span className="block truncate text-11.5 text-muted">
          {r.org} · {r.email}
        </span>
      </span>
    </button>
  );
}

/** "To" field: chips, a text input and a pop-down with Client, Team and Groups. Enter picks the first match. */
export function RecipientField({ value, onChange, bare, initialQuery = "" }: { value: To[]; onChange: (v: To[]) => void; bare?: boolean; initialQuery?: string }) {
  const [q, setQ] = React.useState(initialQuery);
  const [open, setOpen] = React.useState(false);
  const has = (t: To) => value.some((v) => v.kind === t.kind && v.id === t.id);
  const query = q.trim().toLowerCase();
  const match = (s: string) => !query || s.toLowerCase().includes(query);
  const people = RECIPIENTS.filter((r) => !has({ kind: "person", id: r.id }) && (match(r.name) || match(r.email) || match(r.org)));
  const clients = people.filter((r) => r.kind === "client").slice(0, 5);
  const team = people.filter((r) => r.kind === "team").slice(0, 4);
  const groups = GROUPS.filter((g) => !has({ kind: "group", id: g.id }) && match(g.name));
  const add = (t: To) => {
    onChange([...value, t]);
    setQ("");
  };
  const first: To | undefined = clients[0] ? { kind: "person", id: clients[0].id } : team[0] ? { kind: "person", id: team[0].id } : groups[0] ? { kind: "group", id: groups[0].id } : query.includes("@") ? { kind: "free", id: q.trim() } : undefined;

  return (
    <div className="relative">
      <div className={cn("flex min-h-9 flex-wrap items-center gap-1.5", bare ? "py-1" : "rounded-md border-1.5 border-line-2 bg-surface px-2 py-1 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-line")}>
        {value.map((t) => (
          <ToChip key={`${t.kind}:${t.id}`} t={t} onRemove={() => onChange(value.filter((v) => !(v.kind === t.kind && v.id === t.id)))} />
        ))}
        <input
          aria-label="To"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && first) {
              e.preventDefault();
              add(first);
            }
            if (e.key === "Backspace" && !q && value.length) onChange(value.slice(0, -1));
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={value.length ? "" : "Name, email or group"}
          className="h-7 min-w-[140px] flex-1 bg-transparent text-13.5 outline-none placeholder:text-faint"
        />
      </div>
      {open && (clients.length > 0 || team.length > 0 || groups.length > 0) && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-full max-w-[380px] rounded-md border-1.5 border-line bg-surface p-1.5 shadow-pop" role="listbox" aria-label="Recipients">
          {clients.length > 0 && (
            <>
              <p className="px-2 pb-1 pt-1.5 text-11 font-medium uppercase tracking-[.07em] text-muted">Client</p>
              {clients.map((r, i) => (
                <PickRow key={r.id} r={r} on={i === 0} onPick={() => add({ kind: "person", id: r.id })} />
              ))}
            </>
          )}
          {team.length > 0 && (
            <>
              <p className="px-2 pb-1 pt-2 text-11 font-medium uppercase tracking-[.07em] text-muted">Team</p>
              {team.map((r, i) => (
                <PickRow key={r.id} r={r} on={clients.length === 0 && i === 0} onPick={() => add({ kind: "person", id: r.id })} />
              ))}
            </>
          )}
          {groups.length > 0 && (
            <>
              <p className="px-2 pb-1 pt-2 text-11 font-medium uppercase tracking-[.07em] text-muted">Groups</p>
              <div className="flex flex-wrap gap-1.5 px-2 pb-1.5">
                {groups.map((g) => (
                  <button key={g.id} type="button" title={g.members} onMouseDown={(e) => e.preventDefault()} onClick={() => add({ kind: "group", id: g.id })} className="rounded-sm hover:opacity-80">
                    <Tag>
                      <Users size={12} strokeWidth={1.6} className="mr-1" aria-hidden />
                      {g.name}
                    </Tag>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Attached files: badge, name, remove. "Attach" opens the file picker. */
export function Attachments({ files, onChange }: { files: string[]; onChange: (f: string[]) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {files.map((f) => (
        <span key={f} className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-md border border-line py-1 pl-2 pr-1">
          <FileBadge type={fileType(f)} />
          <span className="min-w-0 truncate text-12.5">{f}</span>
          <Button size="iconSm" variant="ghost" className="h-6 w-6" onClick={() => onChange(files.filter((x) => x !== f))} aria-label={`Remove ${f}`}>
            <X size={14} strokeWidth={1.6} />
          </Button>
        </span>
      ))}
      <input
        ref={ref}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const names = [...(e.target.files ?? [])].map((x) => x.name).filter((n) => !files.includes(n));
          if (names.length) onChange([...files, ...names]);
          e.target.value = "";
        }}
      />
      <Button size="sm" variant="ghost" onClick={() => ref.current?.click()}>
        <Paperclip size={16} strokeWidth={1.6} /> Attach
      </Button>
    </div>
  );
}

const STYLES = ["SBC branded", "Plain"];

/** Create or edit a template. */
export function TemplateDialog({ open, onOpenChange, initial, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; initial?: MailTemplate; onSave: (t: MailTemplate) => void }) {
  const blank: MailTemplate = {
    id: "",
    name: "",
    style: "SBC branded",
    subject: "",
    body: "",
  };
  const [t, setT] = React.useState<MailTemplate>(initial ?? blank);
  React.useEffect(() => {
    if (open) setT(initial ?? blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);
  const ok = t.name.trim() && t.subject.trim();
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit template" : "New template"}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!ok} onClick={() => onSave({ ...t, id: t.id || `t${Date.now()}` })}>
            Save template
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5">
        <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_160px]">
          <Field label="Name">
            <Input value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} autoFocus />
          </Field>
          <Field label="Style">
            <Select size="md" className="w-full [&>select]:w-full" value={t.style} onChange={(e) => setT({ ...t, style: e.target.value })} options={STYLES.map((s) => ({ value: s, label: s }))} />
          </Field>
        </div>
        <Field label="Subject">
          <Input value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} />
        </Field>
        <Field label="Message" hint="Fields: {client}, {name}, {step}">
          <textarea rows={9} value={t.body} onChange={(e) => setT({ ...t, body: e.target.value })} className={AREA} />
        </Field>
      </div>
    </Modal>
  );
}

/** Template list with Edit and Delete. Delete asks first (R-40). The old rail puts Create in the card head. */
export function TemplateList({
  templates,
  active,
  onUse,
  onEdit,
  onDelete,
  onCreate,
}: {
  templates: MailTemplate[];
  active?: string;
  onUse: (id: string) => void;
  onEdit: (t: MailTemplate) => void;
  onDelete: (id: string) => void;
  onCreate?: () => void;
}) {
  const [asking, setAsking] = React.useState<string | null>(null);
  return (
    <div>
      <button type="button" onClick={() => onUse("")} className={cn("flex w-full items-center gap-2 border-b border-line-soft px-4 py-2.5 text-left text-13.5 text-muted hover:bg-hover md:px-5", active === "" && "bg-accent-soft text-accent")}>
        Write without a template
      </button>
      {templates.map((t) => (
        <div key={t.id} className="border-b border-line-soft last:border-b-0">
          <div className={cn("flex items-center gap-3 px-4 py-2.5 hover:bg-hover md:px-5", active === t.id && "bg-accent-soft hover:bg-accent-soft")}>
            <button type="button" onClick={() => onUse(t.id)} className="min-w-0 flex-1 text-left" aria-pressed={active === t.id}>
              <b className="block truncate text-13.5 font-medium text-ink">{t.name}</b>
              <span className="block truncate text-12 text-muted">{t.style}</span>
            </button>
            <button type="button" onClick={() => onEdit(t)} className="text-13 font-medium text-accent hover:underline">
              Edit
            </button>
            <button type="button" onClick={() => setAsking(t.id)} className="text-13 font-medium text-bad hover:underline">
              Delete
            </button>
          </div>
          {asking === t.id && (
            <InlineConfirm
              question={`Delete "${t.name}"?`}
              confirm="Delete"
              onConfirm={() => {
                onDelete(t.id);
                setAsking(null);
              }}
              onCancel={() => setAsking(null)}
            />
          )}
        </div>
      ))}
      {onCreate && (
        <div className="flex justify-end border-t border-line-soft px-4 py-2.5">
          <Button size="sm" onClick={onCreate}>
            <Plus size={16} strokeWidth={1.6} /> Create
          </Button>
        </div>
      )}
    </div>
  );
}
