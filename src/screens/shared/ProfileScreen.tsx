"use client";
import * as React from "react";
import { Mail, MessageCircle, Phone, Video } from "lucide-react";
import { cn } from "@/lib/cn";
import { PORTALS, type Portal } from "@/data/nav";
import { SBC, CLIENT_PEOPLE, NORTHWIND, WHATSAPP, type Person } from "@/data/people";
import { useTheme } from "@/components/shell/ThemeProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Field, Input, Switch } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { DataGrid } from "@/components/cards/DataGrid";
import { Cols, Col, Row } from "@/components/shell/Page";

/** C-0026: 8 px gap between contact buttons. */
function Contact({ p }: { p: Person }) {
  const btn = "grid h-[30px] w-[30px] place-items-center rounded-md border border-line text-ink-2 hover:bg-raised";
  return (
    <span className="flex gap-2">
      <a href={WHATSAPP(p.phone)} className={cn(btn, "border-transparent bg-ok-soft text-ok")} aria-label={`WhatsApp ${p.name}`} title="WhatsApp">
        <MessageCircle size={15} strokeWidth={1.5} />
      </a>
      <a href={`tel:${p.phone}`} className={btn} aria-label={`Call ${p.name}`} title="Call">
        <Phone size={15} strokeWidth={1.5} />
      </a>
      <a href={`mailto:${p.email}`} className={btn} aria-label={`Email ${p.name}`} title="Email">
        <Mail size={15} strokeWidth={1.5} />
      </a>
      <a href="#" className={btn} aria-label={`Teams ${p.name}`} title="Teams">
        <Video size={15} strokeWidth={1.5} />
      </a>
    </span>
  );
}

/** R-42 / C-0027 / C-0028: Team is one section inside Profile. SBC team on top, client's people in a large card below. */
function TeamSection() {
  const team = SBC.filter((p) => ["pranay", "bharath", "support"].includes(p.id));
  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard title="Northwind's SBC team" flush>
        {team.map((p) => (
          <ListRow key={p.id}>
            <Avatar name={p.ini ?? p.name} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{p.name}</span>
              <span className="block text-12.5 text-muted">
                {p.role} · {p.email}
              </span>
            </span>
            <Contact p={p} />
          </ListRow>
        ))}
      </SectionCard>
      <DataGrid
        title="People from Northwind"
        meta={`${CLIENT_PEOPLE.length} people`}
        filters={
          <Button size="sm" variant="primary">
            Invite
          </Button>
        }
        columns={[
          { key: "name", label: "Name", render: (p) => (
              <span className="flex items-center gap-2.5">
                <Avatar name={p.ini ?? p.name} size={24} />
                <span className="font-semibold">{p.name}</span>
              </span>
            ) },
          { key: "role", label: "Role" },
          { key: "email", label: "Email", mono: true },
          { key: "phone", label: "Phone", mono: true },
          { key: "access", label: "Access", width: 132, render: (p) => <Chip tone={p.id === "rohan" ? "prog" : "ok"} fixed>{p.id === "rohan" ? "Primary" : "Member"}</Chip> },
          { key: "contact", label: "", width: 150, render: (p) => <Contact p={p} /> },
        ]}
        rows={CLIENT_PEOPLE}
        rowKey={(p) => p.id}
      />
    </div>
  );
}

function SettingsSection({ portal }: { portal: Portal }) {
  const { theme, toggle } = useTheme();
  const [wa, setWa] = React.useState(true);
  const [quiet, setQuiet] = React.useState(true);
  const [motion, setMotion] = React.useState(false);
  const prefs = ["Something waits on me", "A document is sent back", "A deadline is 7 days away", "A step completes", "SBC posts an announcement"];
  const [on, setOn] = React.useState<Record<string, boolean>>(Object.fromEntries(prefs.map((p, i) => [p, i < 3])));
  return (
    <Row>
      <SectionCard title="Notifications" flush>
        <ListRow>
          <span className="flex-1">Email</span>
          <span className="text-12.5 text-muted">always on</span>
        </ListRow>
        <ListRow>
          <span className="flex-1">WhatsApp</span>
          <Switch on={wa} onChange={setWa} label="WhatsApp" />
        </ListRow>
        <ListRow>
          <span className="flex-1">Quiet hours · no WhatsApp 21:00 to 08:00</span>
          <Switch on={quiet} onChange={setQuiet} label="Quiet hours" />
        </ListRow>
        <p className="border-t border-line-soft bg-raised px-5 py-1.5 text-11.5 font-semibold text-faint">Tell me when</p>
        {prefs.map((p) => (
          <ListRow key={p} className="py-2">
            <span className="flex-1 text-13">{p}</span>
            <Switch on={on[p]} onChange={(v) => setOn((s) => ({ ...s, [p]: v }))} label={p} />
          </ListRow>
        ))}
      </SectionCard>
      <div className="grid grid-cols-1 gap-5">
        <SectionCard title="Security">
          <div className="grid gap-3">
            <Field label="Password">
              <span className="flex items-center gap-2">
                <Input type="password" value="••••••••••" readOnly className="max-w-[220px]" />
                <span className="text-12.5 text-muted">changed 2 Sep</span>
                <Button size="sm">Change</Button>
              </span>
            </Field>
            <Field label="This device">
              <span className="flex items-center gap-2 text-13.5">
                Chrome on Windows · Hyderabad <Chip tone="ok">Active now</Chip>
              </span>
            </Field>
            {portal !== "client" && (
              <Field label="Two-step sign-in">
                <span className="flex items-center gap-2 text-13.5">
                  Authenticator app <Chip tone="ok">On</Chip>
                </span>
              </Field>
            )}
          </div>
        </SectionCard>
        <SectionCard title="Appearance" flush>
          <ListRow>
            <span className="flex-1">Theme</span>
            <Select value={theme} onChange={() => toggle()} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} aria-label="Theme" />
          </ListRow>
          <ListRow>
            <span className="flex-1">Reduce motion</span>
            <Switch on={motion} onChange={setMotion} label="Reduce motion" />
          </ListRow>
        </SectionCard>
      </div>
    </Row>
  );
}

export function ProfileScreen({ portal }: { portal: Portal }) {
  const meta = PORTALS[portal];
  const [tab, setTab] = React.useState("profile");
  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t) setTab(t);
  }, []);
  const me: Person = portal === "client" ? CLIENT_PEOPLE[0] : (SBC.find((p) => p.name === meta.person) ?? SBC[0]);
  const items = [{ key: "profile", label: "Profile" }, ...(portal === "client" ? [{ key: "team", label: "Team" }] : []), { key: "settings", label: "Settings" }];

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard
        bare
        title="Profile head"
        bodyClassName="flex flex-wrap items-center gap-4"
      >
        <Avatar name={me.ini ?? me.name} size={44} />
        <span className="min-w-0">
          <span className="block text-16 font-semibold">{me.name}</span>
          <span className="block text-13 text-muted">
            {me.role}
            {portal === "client" && ` · ${NORTHWIND.short}`}
          </span>
        </span>
        <Tabs items={items} value={tab} onChange={setTab} size="md" className="ml-auto" />
      </SectionCard>

      {tab === "profile" && (
        <Cols>
          <Col>
            <SectionCard title="Profile" right={<Button size="sm">Edit</Button>}>
              <KeyValue
                rows={[
                  { k: "Full name", v: me.name },
                  { k: "Role", v: me.role },
                  { k: "Email", v: me.email, mono: true },
                  { k: "Phone", v: me.phone, mono: true },
                  { k: "WhatsApp", v: <span className="flex items-center gap-2">{me.phone} <Tag tone="ok">Verified</Tag></span> },
                  { k: portal === "client" ? "Company" : "Office", v: portal === "client" ? NORTHWIND.name : "SBC · Hyderabad" },
                ]}
              />
            </SectionCard>
          </Col>
          <Col>
            {portal === "client" ? (
              <SectionCard title="Company">
                <KeyValue cols={1} rows={[{ k: "Name", v: NORTHWIND.name }, { k: "PAN", v: NORTHWIND.pan, mono: true }, { k: "Stage", v: <Chip tone="prog">Incorporating</Chip> }, { k: "Manager", v: NORTHWIND.manager }, { k: "Project lead", v: NORTHWIND.lead }]} />
              </SectionCard>
            ) : (
              <SectionCard title="Work">
                <KeyValue cols={1} rows={[{ k: "Clients", v: portal === "lead" ? 8 : portal === "manager" ? 8 : 14 }, { k: "Reports to", v: portal === "lead" ? "Pranay" : portal === "manager" ? "Krishna" : "Mithilesh" }, { k: "Since", v: "Jun 2024" }]} />
              </SectionCard>
            )}
          </Col>
        </Cols>
      )}
      {tab === "team" && <TeamSection />}
      {tab === "settings" && <SettingsSection portal={portal} />}
    </div>
  );
}
