"use client";
import * as React from "react";
import { PORTALS } from "@/data/nav";
import { SBC } from "@/data/people";
import { Row } from "@/components/shell/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Checkbox, Field, Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/cards/SectionCard";
import { InlineConfirm } from "@/components/cards/InlineConfirm";
import type { StaffPortal } from "./parts";

// Staff settings. Ported from reference/old-screens/s/{lead,mgr,admin}/Settings.dc.html.
// K-16: Settings lives inside Profile for lead and manager. The shared ProfileScreen has notification, security and appearance cards.
// This section adds what the old staff page had and the shared one lacks: the editable profile form with photo, the password form and the Outlook mailbox.

export function StaffSettingsSection({ portal }: { portal: StaffPortal }) {
  const meta = PORTALS[portal];
  const me = SBC.find((p) => p.name === meta.person) ?? SBC[0];
  const [name, setName] = React.useState(me.name);
  const [phone, setPhone] = React.useState(me.phone);
  const [wa, setWa] = React.useState(true);
  const [photo, setPhoto] = React.useState<"initials" | "outlook">("initials");
  const [saved, setSaved] = React.useState(false);
  const [pw, setPw] = React.useState({ cur: "", next: "", again: "" });
  const [pwState, setPwState] = React.useState<"" | "done" | "mismatch">("");
  const [outlook, setOutlook] = React.useState(true);
  const [ask, setAsk] = React.useState(false);
  const file = React.useRef<HTMLInputElement>(null);

  const dirty = name !== me.name || phone !== me.phone || !wa;
  const pwReady = pw.cur.length > 0 && pw.next.length >= 8 && pw.again.length > 0;

  return (
    <Row>
      <SectionCard title="Profile" meta={saved ? <Chip tone="ok">Saved</Chip> : undefined}>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={me.ini ?? me.name} size={44} className={photo === "outlook" ? "ring-2 ring-accent-line" : undefined} />
            <span className="flex flex-wrap gap-2">
              <input ref={file} type="file" accept="image/png,image/jpeg" className="hidden" onChange={() => setPhoto("outlook")} aria-label="Photo file" />
              <Button size="sm" onClick={() => file.current?.click()}>
                Upload photo
              </Button>
              <Button size="sm" onClick={() => setPhoto("outlook")}>
                Use Outlook photo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPhoto("initials")} disabled={photo === "initials"}>
                Remove
              </Button>
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
            </Field>
            <Field label="Email">
              <Input value={me.email} disabled className="font-mono text-13" />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false); }} className="font-mono text-13" />
            </Field>
            <Field label="Role">
              <Input value={me.role} disabled />
            </Field>
          </div>
          <label className="flex flex-wrap items-center gap-2.5 text-13.5">
            <Checkbox checked={wa} onChange={(v) => { setWa(v); setSaved(false); }} label="WhatsApp reminders" />
            WhatsApp reminders on <span className="font-mono text-13">{phone}</span>
            <span className="text-12.5 text-muted">Email stays the record</span>
          </label>
          <div>
            <Button variant="primary" onClick={() => setSaved(true)} disabled={!dirty && saved}>
              Save profile
            </Button>
          </div>
        </div>
      </SectionCard>
      <div className="grid grid-cols-1 gap-5">
        <SectionCard title="Password" meta={pwState === "done" ? <Chip tone="ok">Updated</Chip> : pwState === "mismatch" ? <Chip tone="bad">Passwords differ</Chip> : undefined}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (pw.next !== pw.again) return setPwState("mismatch");
              setPwState("done");
              setPw({ cur: "", next: "", again: "" });
            }}
          >
            <Field label="Current password">
              <Input type="password" autoComplete="current-password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="New password" hint="8 characters or more">
                <Input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              </Field>
              <Field label="Confirm password">
                <Input type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} />
              </Field>
            </div>
            <div>
              <Button type="submit" disabled={!pwReady}>
                Update password
              </Button>
            </div>
          </form>
        </SectionCard>
        <SectionCard title="Outlook mailbox" meta={<Chip tone={outlook ? "ok" : "idle"}>{outlook ? "Connected" : "Not connected"}</Chip>} flush>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
            <span className="text-12.5 text-muted">Mailbox</span>
            <b className="min-w-0 truncate font-mono text-13 font-semibold">{me.email}</b>
            {outlook ? (
              <Button size="sm" className="ml-auto" onClick={() => setAsk(true)} disabled={ask}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" variant="primary" className="ml-auto" onClick={() => setOutlook(true)}>
                Connect
              </Button>
            )}
          </div>
          {ask && (
            // R-40: ask before a risky change.
            <InlineConfirm
              question="Disconnect Outlook? Email and Teams stop syncing."
              confirm="Disconnect"
              onConfirm={() => {
                setOutlook(false);
                setAsk(false);
              }}
              onCancel={() => setAsk(false)}
            />
          )}
        </SectionCard>
      </div>
    </Row>
  );
}
