"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { PORTALS, type Portal } from "@/data/nav";
import { SBC, CLIENT_PEOPLE, NORTHWIND, type Person } from "@/data/people";
import { PROFILE_EXTRA, COMPANY_FACTS, MEMBERS } from "@/data/updates-team";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { Input, Switch, Checkbox } from "@/components/ui/Input";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard } from "@/components/cards/SectionCard";
import { StaffSettingsSection } from "@/screens/staff/StaffSettingsSection";
import { TeamSection } from "./profile-team";
import { SettingsSection, PasswordForm, ThemePicker } from "./profile-settings";

/*
 * Profile (s/home/Profile.dc.html, v7p_profile, s/lead/ProfilePage): a left section menu and an editable form.
 * C-0027, C-0028: Team is a Profile section for the client. K-16: Settings is a Profile section.
 * Kept out: the subtitle under each section title and the note under the form (R-05, R-06).
 */

type SecKey = "about" | "security" | "notify" | "email" | "look" | "company" | "team" | "settings";

const LABEL: Record<SecKey, string> = {
  about: "About you",
  security: "Sign-in and security",
  notify: "Notifications",
  email: "Email",
  look: "Appearance",
  company: "Company",
  team: "Team",
  settings: "Settings",
};

function sectionsFor(portal: Portal): SecKey[] {
  if (portal === "client") return ["about", "security", "notify", "look", "company", "team", "settings"];
  if (portal === "dev") return ["about", "security", "notify", "look", "settings"];
  return ["about", "security", "notify", "email", "look", "settings"];
}

/** One form row: label with a hint on the left, the control on the right. */
function FormRow({ k, hint, children }: { k: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-line-soft px-4 py-2.5 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,464px)] sm:items-center md:px-5">
      <span className="min-w-0">
        <span className="block text-14 font-medium">{k}</span>
        {hint && <span className="block text-12.5 text-muted">{hint}</span>}
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-2">{children}</span>
    </div>
  );
}

function FormSection({ portal, sec, me }: { portal: Portal; sec: SecKey; me: Person }) {
  const staff = portal !== "client";
  const x = PROFILE_EXTRA[portal];
  const toast = useUndoToast();
  const [saved, setSaved] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  const tick = () => {
    setSaved(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaved(false), 1500);
  };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const [about, setAbout] = React.useState({ name: me.name, designation: x.designation, membership: x.membership ?? "", mobile: x.mobile });
  const [twoStep, setTwoStep] = React.useState(true);
  const [pw, setPw] = React.useState(false);
  const [changed, setChanged] = React.useState("12 Sep 2026");
  const [signedOut, setSignedOut] = React.useState(false);
  const channels = staff ? ["In-app", "Email", "Teams", ...(portal !== "dev" ? ["WhatsApp"] : [])] : ["In-app", "Email", "WhatsApp"];
  const [on, setOn] = React.useState<Record<string, boolean>>(() => Object.fromEntries(channels.map((c) => [c, true])));
  const [quiet, setQuiet] = React.useState("9 pm to 8 am");
  const [digest, setDigest] = React.useState("8:30 am");
  const [remind, setRemind] = React.useState("3");
  const [extra, setExtra] = React.useState(true);
  const [density, setDensity] = React.useState("comfortable");
  const [size, setSize] = React.useState("default");

  const text = (k: string, value: string, set: (v: string) => void, opts?: { mono?: boolean }) => (
    <Input
      value={value}
      aria-label={k}
      onChange={(e) => set(e.target.value)}
      onBlur={tick}
      className={cn(opts?.mono && "font-mono text-13")}
    />
  );

  let rows: React.ReactNode = null;
  if (sec === "about") {
    rows = (
      <>
        <FormRow k="Name">{text("Name", about.name, (v) => setAbout({ ...about, name: v }))}</FormRow>
        <FormRow k="Designation" hint={staff ? "Shown on your emails and in the client portal" : "Your role in the company"}>
          {text("Designation", about.designation, (v) => setAbout({ ...about, designation: v }))}
        </FormRow>
        {staff && portal !== "dev" && (
          <FormRow k="Membership number" hint="ICAI or ICSI">
            {text("Membership number", about.membership, (v) => setAbout({ ...about, membership: v }), { mono: true })}
          </FormRow>
        )}
        <FormRow k="Mobile" hint="For sign-in codes and WhatsApp">
          {text("Mobile", about.mobile, (v) => setAbout({ ...about, mobile: v }))}
        </FormRow>
        <FormRow k="Email" hint="Your sign-in address">
          <span className="text-14 text-ink">{me.email}</span>
        </FormRow>
        <FormRow k="Photo">
          <Button size="sm" onClick={() => toast.show("Photo picker opens here")}>
            Change photo
          </Button>
        </FormRow>
      </>
    );
  } else if (sec === "security") {
    rows = (
      <>
        {staff ? (
          <FormRow k="Microsoft sign-in" hint="SBC accounts sign in with Microsoft 365">
            <Chip fixed tone="ok">Connected</Chip>
          </FormRow>
        ) : (
          <FormRow k="Password" hint={`Last changed ${changed}`}>
            {!pw && (
              <Button size="sm" onClick={() => setPw(true)}>
                Change password
              </Button>
            )}
          </FormRow>
        )}
        {pw && (
          <div className="border-t border-line-soft px-4 py-3 md:px-5">
            <PasswordForm
              onCancel={() => setPw(false)}
              onSave={() => {
                const was = changed;
                setPw(false);
                setChanged("6 Oct 2026");
                toast.show("Password changed", () => setChanged(was));
              }}
            />
          </div>
        )}
        <FormRow k="Two-step verification" hint="A code on your phone at each new sign-in">
          <Switch
            on={twoStep}
            onChange={(v) => {
              setTwoStep(v);
              toast.show(v ? "Two-step verification on" : "Two-step verification off", () => setTwoStep(!v));
            }}
            label="Two-step verification"
          />
        </FormRow>
        <FormRow k="Devices signed in">
          <span className="text-14">{signedOut ? "This laptop" : staff ? "This laptop · Chrome on Android" : "This laptop · iPhone"}</span>
        </FormRow>
        <FormRow k="Sign out other devices">
          <Button
            size="sm"
            disabled={signedOut}
            onClick={() => {
              setSignedOut(true);
              toast.show("Signed out of the other device", () => setSignedOut(false));
            }}
          >
            Sign out others
          </Button>
        </FormRow>
        {portal === "dev" && (
          <FormRow k="API tokens" hint="2 active · rotate every 90 days">
            <Button asChild size="sm">
              <Link href="/dev/access">Manage tokens</Link>
            </Button>
          </FormRow>
        )}
      </>
    );
  } else if (sec === "notify") {
    const toggle = portal === "manager" ? ["Approvals waiting", "When a lead asks for your approval"] : portal === "admin" || portal === "super" ? ["Escalations", "When a manager escalates to you"] : portal === "dev" ? ["Incidents and failed jobs", "Straight away, any hour"] : null;
    rows = (
      <>
        <FormRow k="Channels" hint="Where VCFO reaches you">
          {channels.map((c) => (
            <label key={c} className="inline-flex h-[30px] cursor-pointer items-center gap-2 rounded-md border-1.5 border-line-2 px-2.5 text-13">
              <Checkbox
                checked={!!on[c]}
                onChange={(v) => {
                  setOn({ ...on, [c]: v });
                  tick();
                }}
                label={c}
              />
              {c}
            </label>
          ))}
        </FormRow>
        <FormRow k="Quiet hours" hint={staff ? "No WhatsApp or Teams messages in this window" : "No WhatsApp messages in this window"}>
          {text("Quiet hours", quiet, setQuiet)}
        </FormRow>
        {!staff && (
          <FormRow k="Remind me before a due date">
            <Tabs
              items={[
                { key: "7", label: "7 days" },
                { key: "3", label: "3 days" },
                { key: "1", label: "1 day" },
              ]}
              value={remind}
              onChange={(k) => {
                setRemind(k);
                tick();
              }}
            />
          </FormRow>
        )}
        {staff && portal !== "dev" && (
          <FormRow k="Daily digest" hint="One summary instead of many alerts">
            {text("Daily digest", digest, setDigest)}
          </FormRow>
        )}
        {toggle && (
          <FormRow k={toggle[0]} hint={toggle[1]}>
            <Switch on={extra} onChange={(v) => { setExtra(v); tick(); }} label={toggle[0]} />
          </FormRow>
        )}
        {portal === "super" && (
          <FormRow k="Monthly partner report" hint="On the 1st at 7 am">
            <Switch on={extra} onChange={(v) => { setExtra(v); tick(); }} label="Monthly partner report" />
          </FormRow>
        )}
      </>
    );
  } else if (sec === "email") {
    rows = (
      <>
        <FormRow k="Outlook" hint="Mail you send from VCFO goes from your mailbox">
          <span className="text-14 text-ink">{me.email}</span>
          <Chip fixed tone="ok">Connected</Chip>
        </FormRow>
        <FormRow k="Signature" hint="Added by the firm’s server-side signature tool">
          <span className="text-14">From Outlook · server-side signature on</span>
        </FormRow>
        <FormRow k="Reconnect">
          <Button size="sm" onClick={() => toast.show("Opens Microsoft sign-in")}>
            Reconnect Outlook
          </Button>
        </FormRow>
      </>
    );
  } else if (sec === "look") {
    rows = (
      <>
        <FormRow k="Theme">
          <ThemePicker toast={toast} />
        </FormRow>
        {staff && (
          <FormRow k="Density" hint="Compact fits more rows on the screen">
            <Tabs
              items={[
                { key: "comfortable", label: "Comfortable" },
                { key: "compact", label: "Compact" },
              ]}
              value={density}
              onChange={(k) => {
                setDensity(k);
                tick();
              }}
            />
          </FormRow>
        )}
        <FormRow k="Text size">
          <Tabs
            items={[
              { key: "small", label: "Small" },
              { key: "default", label: "Default" },
              { key: "large", label: "Large" },
            ]}
            value={size}
            onChange={(k) => {
              setSize(k);
              tick();
            }}
          />
        </FormRow>
      </>
    );
  } else if (sec === "company") {
    const people = MEMBERS.filter((m) => m.kind !== "invited")
      .map((m) => `${m.name} (${m.role.toLowerCase()})`)
      .join(" · ");
    rows = (
      <>
        <FormRow k="Company">
          <span className="text-14 font-medium">{NORTHWIND.name}</span>
        </FormRow>
        <FormRow k="People who can sign in">
          <span className="text-14">{people}</span>
        </FormRow>
        <FormRow k="Add a person" hint="They get an invite by email">
          <Button size="sm" onClick={() => toast.show("Invite sent")}>
            Invite
          </Button>
        </FormRow>
        <FormRow k="Employees" hint="From the questionnaire">
          <span className="text-14">{COMPANY_FACTS.employees}</span>
        </FormRow>
        <FormRow k="State" hint="From the questionnaire">
          <span className="text-14">{COMPANY_FACTS.state}</span>
        </FormRow>
        <FormRow k="Exports" hint="From the questionnaire">
          <span className="text-14">{COMPANY_FACTS.exports}</span>
        </FormRow>
        <FormRow k="Something changed?" hint="SBC updates the questionnaire and tells you what changes">
          <Button size="sm" onClick={() => toast.show("Request sent to Bharath and Pranay")}>
            Ask for a change
          </Button>
        </FormRow>
      </>
    );
  }

  return (
    <SectionCard title={LABEL[sec]} meta={saved ? <Chip fixed tone="ok">Saved</Chip> : undefined} flush>
      {rows}
      {toast.node}
    </SectionCard>
  );
}

const TAB_ALIAS: Record<string, SecKey> = { profile: "about" };

export function ProfileScreen({ portal }: { portal: Portal }) {
  const meta = PORTALS[portal];
  const secs = sectionsFor(portal);
  const [sec, setSec] = React.useState<SecKey>("about");
  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab") ?? "";
    const k = (TAB_ALIAS[t] ?? t) as SecKey;
    if (secs.includes(k)) setSec(k);
    // secs depends only on portal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal]);
  const pick = (k: SecKey) => {
    setSec(k);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("tab", k === "about" ? "profile" : k);
      window.history.replaceState(null, "", u.toString());
    } catch {}
  };
  const menu = React.useRef<HTMLDivElement>(null);
  // On phones the menu scrolls sideways: keep the picked section in view.
  React.useEffect(() => {
    menu.current?.querySelector<HTMLElement>("[aria-current]")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [sec]);
  const me: Person = portal === "client" ? CLIENT_PEOPLE[0] : (SBC.find((p) => p.name === meta.person) ?? SBC[0]);
  const role = portal === "client" ? `${PROFILE_EXTRA.client.designation} · ${NORTHWIND.short}` : `${PROFILE_EXTRA[portal].designation} · SBC`;
  const staffSettings = portal === "lead" || portal === "manager" || portal === "admin";

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Profile sections" className="rounded-md border-1.5 border-line bg-surface p-2 md:sticky md:top-5">
        <div className="flex items-center gap-2.5 border-b border-line-soft px-2 pb-3 pt-2">
          <Avatar name={me.name} size={36} />
          <span className="min-w-0">
            <b className="block truncate text-14 font-medium">{me.name}</b>
            <small className="block truncate text-12 text-muted">{role}</small>
          </span>
        </div>
        <div ref={menu} className="mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none] md:grid md:overflow-visible">
          {secs.map((k) => (
            <button
              key={k}
              type="button"
              aria-current={sec === k ? "true" : undefined}
              onClick={() => pick(k)}
              className={cn(
                "flex h-[34px] flex-none items-center whitespace-nowrap rounded-md px-2.5 text-left text-14",
                sec === k ? "bg-accent-soft font-medium text-accent" : "text-ink-2 hover:bg-hover",
              )}
            >
              {LABEL[k]}
            </button>
          ))}
        </div>
      </nav>

      <div className="min-w-0">
        {sec === "team" && portal === "client" ? (
          <TeamSection />
        ) : sec === "settings" ? (
          staffSettings ? (
            <StaffSettingsSection portal={portal} />
          ) : (
            <SettingsSection portal={portal} />
          )
        ) : (
          <FormSection key={sec} portal={portal} sec={sec} me={me} />
        )}
      </div>
    </div>
  );
}
