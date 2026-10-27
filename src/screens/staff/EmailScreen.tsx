"use client";
import * as React from "react";
import { Download, FileText, Inbox, PenLine, Search, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { clientById } from "@/data/staff-clients";
import { MAIL, MAIL_ADDRESS, RECIPIENTS, TEMPLATES, type Mail, type MailFolder, type MailTemplate } from "@/data/staff-mail";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { FileBadge, fileType } from "@/components/ui/FileBadge";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionCard, ListRow, Empty, HeadLink } from "@/components/cards/SectionCard";
import { ClientDot, ClientName, clientHref, type StaffPortal } from "./parts";
import { identityTag } from "./filters";
import { AREA, Attachments, RecipientField, TemplateDialog, TemplateList, toLabel, type To } from "./email-parts";

type Folder = MailFolder | "templates";

const FOLDERS: Array<{ key: Folder; label: string }> = [
  { key: "inbox", label: "Inbox" },
  { key: "sent", label: "Sent" },
  { key: "drafts", label: "Drafts" },
  { key: "templates", label: "Templates" },
];

const when = (m: Mail) => (m.date.getTime() === TODAY.getTime() ? m.time : fmt(m.date));
const first = (name: string) => name.split(" ")[0];

interface Draft {
  to: To[];
  subject: string;
  template: string;
  body: string;
  files: string[];
}

const EMPTY: Draft = { to: [], subject: "", template: "", body: "", files: [] };

function fill(text: string, m?: Mail) {
  const c = m ? clientById(m.client) : undefined;
  return text
    .replaceAll("{client}", c?.short ?? "Northwind")
    .replaceAll("{name}", m ? first(m.from) : "Rohan")
    .replaceAll("{step}", c?.step.toLowerCase() ?? "this step");
}

/** The recipient of a mail as a picked chip. */
function toOf(m: Mail): To[] {
  const r = RECIPIENTS.find((x) => x.email === m.address || x.name === m.from);
  return [r ? { kind: "person", id: r.id } : { kind: "free", id: m.address }];
}

function Compose({
  draft,
  setDraft,
  from,
  templates,
  onSend,
  onDiscard,
  context,
  closeLabel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  from: string;
  templates: MailTemplate[];
  onSend: () => void;
  onDiscard: () => void;
  context?: Mail;
  closeLabel: string;
}) {
  const pickTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    setDraft({ ...draft, template: id, subject: t ? fill(t.subject, context) : draft.subject, body: t ? fill(t.body, context) : draft.body });
  };
  const tpl = templates.find((t) => t.id === draft.template);
  return (
    <SectionCard
      title="New message"
      icon={{ Icon: PenLine, tone: "blue" }}
      right={
        <>
          <span className="hidden font-mono text-12 text-muted sm:inline">{from}</span>
          <Button size="iconSm" variant="ghost" className="lg:hidden" onClick={onDiscard} aria-label={closeLabel}>
            <X size={16} strokeWidth={1.5} />
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5">
        <Field label="To">
          <RecipientField value={draft.to} onChange={(to) => setDraft({ ...draft, to })} />
        </Field>
        <Field label="Subject">
          <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
        </Field>
        <Field label="Template">
          <Select size="md" className="w-full [&>select]:w-full" value={draft.template} onChange={(e) => pickTemplate(e.target.value)} options={[{ value: "", label: "No template" }, ...templates.map((t) => ({ value: t.id, label: t.name }))]} />
        </Field>
        <textarea aria-label="Message" rows={10} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className={AREA} />
        <Attachments files={draft.files} onChange={(files) => setDraft({ ...draft, files })} />
        {/* K-40: Outlook adds the signature on the server. */}
        <p className="text-12.5 text-muted">Your Outlook signature and the SBC footer are added when this is sent.</p>
        <div className="flex flex-wrap items-center gap-2">
          {tpl && <Tag tone="warn">Template · {tpl.name}</Tag>}
          {tpl && <Tag>{tpl.style}</Tag>}
          <span className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onDiscard}>
              Discard
            </Button>
            <Button size="sm" variant="primary" onClick={onSend} disabled={draft.to.length === 0 || !draft.subject.trim()}>
              <Send size={16} strokeWidth={1.5} /> Send
            </Button>
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

function Reading({ m, portal, folder, onClose, onEditDraft, onSendDraft }: { m: Mail; portal: StaffPortal; folder: Folder; onClose: () => void; onEditDraft: () => void; onSendDraft: () => void }) {
  const [reply, setReply] = React.useState("");
  const [files, setFiles] = React.useState<string[]>([]);
  const [sent, setSent] = React.useState(false);
  React.useEffect(() => {
    setReply("");
    setFiles([]);
    setSent(false);
  }, [m.id]);
  return (
    <SectionCard
      title={m.subject}
      icon={{ Icon: Inbox, tone: "blue" }}
      flush
      right={
        <Button size="iconSm" variant="ghost" className="lg:hidden" onClick={onClose} aria-label="Close message">
          <X size={16} strokeWidth={1.5} />
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-soft px-4 py-3 md:px-5">
        <span className="min-w-0">
          <span className="block truncate text-13.5 font-semibold">{folder === "inbox" ? m.from : `To ${m.from}`}</span>
          <span className="block truncate font-mono text-12 text-muted">{m.address}</span>
        </span>
        <ClientName id={m.client} short href={clientHref(portal, m.client)} className="text-12.5 font-semibold" />
        <span className="ml-auto text-12.5 text-muted">
          {fmt(m.date)} · {m.time}
        </span>
      </div>
      <div className="grid gap-3 px-4 py-4 text-13.5 leading-relaxed text-ink-2 md:px-5">
        {m.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {m.attachments && (
        <div className="flex flex-wrap gap-2 px-4 pb-4 md:px-5">
          {m.attachments.map((a) => (
            <span key={a} className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-md border border-line px-2.5 py-1.5">
              <FileBadge type={fileType(a)} />
              <span className="min-w-0 truncate font-mono text-12">{a}</span>
              <Button size="iconSm" variant="ghost" aria-label={`Download ${a}`}>
                <Download size={16} strokeWidth={1.5} />
              </Button>
            </span>
          ))}
        </div>
      )}
      {folder === "inbox" && (
        <div className="grid gap-2.5 border-t border-line-soft px-4 py-4 md:px-5">
          {sent ? (
            <span className="flex items-center gap-2 text-13">
              <Chip tone="ok">Sent</Chip>
              <span className="text-muted">Reply to {m.from}</span>
            </span>
          ) : (
            <>
              <textarea aria-label="Reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${first(m.from)}`} className={AREA} />
              <Attachments files={files} onChange={setFiles} />
              <div className="flex items-center gap-2">
                <span className="text-12.5 text-muted">Signature from Outlook · server-side signature on</span>
                <Button size="sm" variant="primary" className="ml-auto" disabled={!reply.trim()} onClick={() => setSent(true)}>
                  <Send size={16} strokeWidth={1.5} /> Reply
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      {folder === "drafts" && (
        <div className="flex justify-end gap-2 border-t border-line-soft px-4 py-3 md:px-5">
          <Button size="sm" variant="outline" onClick={onEditDraft}>
            <PenLine size={16} strokeWidth={1.5} /> Edit
          </Button>
          <Button size="sm" variant="primary" onClick={onSendDraft}>
            <Send size={16} strokeWidth={1.5} /> Send
          </Button>
        </div>
      )}
    </SectionCard>
  );
}

export function EmailScreen({ portal }: { portal: StaffPortal }) {
  const [folder, setFolder] = React.useState<Folder>("inbox");
  const [picked, setPicked] = React.useState("m01");
  const [read, setRead] = React.useState<Record<string, true>>({ m01: true });
  const [compose, setCompose] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [outbox, setOutbox] = React.useState<Mail[]>([]);
  const [gone, setGone] = React.useState<Record<string, true>>({});
  const [q, setQ] = React.useState("");
  const [templates, setTemplates] = React.useState<MailTemplate[]>(TEMPLATES);
  const [editing, setEditing] = React.useState<MailTemplate | undefined>();
  const [dialog, setDialog] = React.useState(false);
  // Phone: the list and the message are two steps (old WorkPhone and mobile Email pattern).
  const [phoneOpen, setPhoneOpen] = React.useState(false);

  const all = [...outbox, ...MAIL].filter((m) => !gone[m.id]);
  const query = q.trim().toLowerCase();
  const hit = (m: Mail) => !query || [m.from, m.address, m.subject, ...m.body, clientById(m.client)?.short ?? ""].some((s) => s.toLowerCase().includes(query));
  const list = folder === "templates" ? [] : all.filter((m) => m.folder === folder && hit(m));
  const current = all.find((m) => m.id === picked && m.folder === folder) ?? list[0];
  const unread = (m: Mail) => m.unread && !read[m.id];
  const count = (f: Folder) => (f === "inbox" ? all.filter((m) => m.folder === "inbox" && unread(m)).length : f === "templates" ? templates.length : all.filter((m) => m.folder === f).length);

  const open = (m: Mail) => {
    setPicked(m.id);
    setRead({ ...read, [m.id]: true });
    setCompose(false);
    setPhoneOpen(true);
  };
  const startCompose = (template = "") => {
    const t = templates.find((x) => x.id === template);
    setDraft({ ...EMPTY, subject: t ? fill(t.subject, current) : "", template, body: t ? fill(t.body, current) : "" });
    setCompose(true);
    setPhoneOpen(true);
  };
  const editDraft = (m: Mail) => {
    setDraft({ to: toOf(m), subject: m.subject, template: "", body: m.body.join("\n\n"), files: m.attachments ?? [] });
    setGone({ ...gone, [m.id]: true });
    setCompose(true);
  };
  const sendMail = (d: Draft, client?: string) => {
    const id = `o${outbox.length + 1}`;
    const names = d.to.map(toLabel).join(", ");
    const addr = d.to.map((t) => (t.kind === "person" ? RECIPIENTS.find((r) => r.id === t.id)?.email ?? t.id : t.kind === "free" ? t.id : toLabel(t))).join(", ");
    const c = client ?? RECIPIENTS.find((r) => d.to.some((t) => t.kind === "person" && t.id === r.id && r.client))?.client ?? current?.client ?? "northwind";
    setOutbox([{ id, folder: "sent", from: names, address: addr, client: c, date: TODAY, time: "Now", subject: d.subject, body: d.body.split("\n").filter(Boolean), attachments: d.files.length ? d.files : undefined }, ...outbox]);
    setCompose(false);
    setFolder("sent");
    setPicked(id);
  };
  const sendDraft = (m: Mail) => {
    setGone({ ...gone, [m.id]: true });
    sendMail({ to: toOf(m), subject: m.subject, template: "", body: m.body.join("\n"), files: m.attachments ?? [] }, m.client);
  };

  const listCard = (
    <SectionCard
      title={FOLDERS.find((f) => f.key === folder)!.label}
      meta={folder === "inbox" ? `${count("inbox")} new` : undefined}
      flush
      className={cn(phoneOpen && "hidden lg:block")}
      right={
        <>
          <Select aria-label="Folder" value={folder} onChange={(e) => setFolder(e.target.value as Folder)} options={FOLDERS.map((f) => ({ value: f.key, label: f.label }))} className="lg:hidden" />
          <Button size="sm" variant="primary" onClick={() => startCompose()}>
            <PenLine size={16} strokeWidth={1.5} /> Compose
          </Button>
        </>
      }
    >
      {folder === "templates" ? (
        <TemplateList
          templates={templates}
          active={compose ? draft.template : undefined}
          onUse={(id) => startCompose(id)}
          onEdit={(t) => {
            setEditing(t);
            setDialog(true);
          }}
          onDelete={(id) => setTemplates(templates.filter((t) => t.id !== id))}
          onCreate={() => {
            setEditing(undefined);
            setDialog(true);
          }}
        />
      ) : (
        <>
          <div className="border-b border-line-soft px-4 py-2.5 md:px-5">
            <span className="relative block">
              <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mail" aria-label="Search mail" className="h-[30px] pl-8 text-13" />
            </span>
          </div>
          {list.length === 0 ? (
            <Empty>{query ? "No match" : undefined}</Empty>
          ) : (
            list.map((m) => {
              const c = clientById(m.client);
              const on = !compose && current?.id === m.id;
              return (
                <ListRow key={m.id} onClick={() => open(m)} className={cn("items-start", on && "lg:bg-accent-soft lg:hover:bg-accent-soft")}>
                  <i className={cn("mt-1.5 h-1.5 w-1.5 flex-none rounded-full", unread(m) ? "bg-accent" : "bg-transparent")} aria-label={unread(m) ? "Unread" : undefined} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("min-w-0 flex-1 truncate", unread(m) ? "font-semibold" : "font-medium")}>{folder === "inbox" ? m.from : `To ${m.from}`}</span>
                      <span className="flex-none text-12 text-muted">{when(m)}</span>
                    </span>
                    <span className={cn("block truncate text-13", unread(m) ? "text-ink" : "text-ink-2")}>{m.subject}</span>
                    {c && (
                      <span className="mt-1 flex items-center gap-1.5 text-12 text-muted">
                        <ClientDot tone={c.tone} />
                        {c.short}
                        {m.attachments && (
                          <Tag tone={identityTag.idle} className="ml-1 h-[18px] px-1.5">
                            {m.attachments.length} file{m.attachments.length > 1 ? "s" : ""}
                          </Tag>
                        )}
                      </span>
                    )}
                  </span>
                </ListRow>
              );
            })
          )}
        </>
      )}
    </SectionCard>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[180px_minmax(0,340px)_minmax(0,1fr)]">
      <SectionCard title="Mail" flush className="hidden lg:block">
        <nav aria-label="Folders" className="py-1.5">
          {FOLDERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFolder(f.key)}
              aria-current={folder === f.key ? "page" : undefined}
              className={cn("flex w-full items-center gap-2 px-4 py-2 text-left text-13.5", folder === f.key ? "bg-raised font-semibold text-ink" : "text-ink-2 hover:bg-raised")}
            >
              {f.key === "templates" && <FileText size={14} strokeWidth={1.5} className="text-faint" />}
              {f.label}
              <span className={cn("ml-auto text-12", f.key === "inbox" && count("inbox") > 0 ? "font-semibold text-accent" : "text-faint")}>{count(f.key) || ""}</span>
            </button>
          ))}
        </nav>
        <div className="grid gap-2 border-t border-line-soft px-4 py-3">
          <Chip tone="ok">Outlook connected</Chip>
          <HeadLink href={`/${portal}/profile?tab=settings`}>Profile › Email</HeadLink>
        </div>
      </SectionCard>

      {listCard}

      <div className={cn("min-w-0", !phoneOpen && "hidden lg:block")}>
        {compose ? (
          <Compose
            draft={draft}
            setDraft={setDraft}
            from={MAIL_ADDRESS[portal]}
            templates={templates}
            onSend={() => sendMail(draft)}
            onDiscard={() => {
              setCompose(false);
              setPhoneOpen(false);
            }}
            context={current}
            closeLabel="Close message"
          />
        ) : current ? (
          <Reading m={current} portal={portal} folder={folder} onClose={() => setPhoneOpen(false)} onEditDraft={() => editDraft(current)} onSendDraft={() => sendDraft(current)} />
        ) : (
          <SectionCard title="Message">
            <Empty />
          </SectionCard>
        )}
      </div>

      <TemplateDialog
        open={dialog}
        onOpenChange={setDialog}
        initial={editing}
        onSave={(t) => {
          setTemplates(editing ? templates.map((x) => (x.id === t.id ? t : x)) : [...templates, t]);
          setDialog(false);
        }}
      />
    </div>
  );
}
