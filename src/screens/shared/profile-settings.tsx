"use client";
import * as React from "react";
import { AlignLeft, Camera, ChartColumn, Check, CircleCheck, Clock, FileText, Lock, Megaphone, Moon, Rss, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Portal } from "@/data/nav";
import { NOTIF_PREFS, DEFAULT_EMAIL, DEFAULT_WA, DEVICES, PROFILE_EXTRA } from "@/data/updates-team";
import { useThemeMode, type ThemeMode } from "./theme-mode";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Field, Input, Switch, Checkbox } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";

export type Toast = ReturnType<typeof useUndoToast>;

/* ---------- Password (settings_password) ---------- */

const CHECKS: Array<{ label: string; test: (v: string) => boolean }> = [
  { label: "8+ characters", test: (v) => v.length >= 8 },
  { label: "Number", test: (v) => /\d/.test(v) },
  { label: "Symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
  { label: "Upper and lower case", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
];
const STRENGTH = ["Too weak", "Weak", "Fair", "Good", "Strong"];

export function PasswordForm({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [cur, setCur] = React.useState("");
  const [next, setNext] = React.useState("");
  const [conf, setConf] = React.useState("");
  const passed = CHECKS.filter((c) => c.test(next)).length;
  const match = conf.length > 0 && conf === next;
  const ok = cur.length > 0 && passed >= 3 && match;
  const barTone = passed >= 4 ? "bg-ok" : passed === 3 ? "bg-ok-mid" : passed === 2 ? "bg-warn-mid" : "bg-bad-mid";
  return (
    <form
      className="grid gap-3 rounded-md border border-line bg-raised p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSave();
      }}
    >
      <Field label="Current password">
        <Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" autoFocus />
      </Field>
      <Field label="New password">
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
      </Field>
      <div className="grid gap-1.5" aria-live="polite">
        <div className="flex gap-1" role="img" aria-label={`Strength: ${STRENGTH[passed]}`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn("h-[5px] flex-1 rounded-sm", i < passed ? barTone : "bg-line")} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-12">
          {CHECKS.map((c) => {
            const on = c.test(next);
            return (
              <span key={c.label} className={cn("inline-flex items-center gap-1", on ? "text-ok" : "text-muted")}>
                {on ? <Check size={13} strokeWidth={1.5} /> : <X size={13} strokeWidth={1.5} />}
                {c.label}
              </span>
            );
          })}
          {next && <b className={cn("ml-auto font-semibold", passed >= 3 ? "text-ok" : "text-warn")}>{STRENGTH[passed]}</b>}
        </div>
      </div>
      <Field label="Confirm new password">
        <Input type="password" value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="new-password" className={cn(conf && (match ? "border-ok" : "border-bad"))} aria-invalid={conf.length > 0 && !match} />
      </Field>
      {conf && !match && <span className="-mt-1.5 text-12 text-bad">Passwords do not match</span>}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" type="submit" disabled={!ok}>
          Save password
        </Button>
      </div>
    </form>
  );
}

function SecurityCard({ portal, toast }: { portal: Portal; toast: Toast }) {
  const staff = portal !== "client";
  const [pw, setPw] = React.useState(false);
  const [changed, setChanged] = React.useState("2 Sep");
  const [twoStep, setTwoStep] = React.useState(true);
  const [devices, setDevices] = React.useState(DEVICES);
  return (
    <SectionCard title="Security" flush>
      {staff ? (
        <ListRow>
          <span className="flex-1">Microsoft sign-in</span>
          <Chip tone="ok">Connected</Chip>
        </ListRow>
      ) : (
        <div className="border-b border-line-soft px-4 py-3 md:px-5">
          <div className="flex items-center gap-3 text-13.5">
            <span className="flex-1">
              Password
              <span className="ml-2 font-mono text-12.5 text-muted">••••••••</span>
              <span className="ml-2 text-12.5 text-muted">changed {changed}</span>
            </span>
            {!pw && (
              <Button size="sm" onClick={() => setPw(true)}>
                Change
              </Button>
            )}
          </div>
          {pw && (
            <div className="mt-3">
              <PasswordForm
                onCancel={() => setPw(false)}
                onSave={() => {
                  const was = changed;
                  setPw(false);
                  setChanged("6 Oct");
                  toast.show("Password changed", () => setChanged(was));
                }}
              />
            </div>
          )}
        </div>
      )}
      <ListRow>
        <span className="flex-1">Two-step verification</span>
        <Switch
          on={twoStep}
          onChange={(v) => {
            setTwoStep(v);
            toast.show(v ? "Two-step verification on" : "Two-step verification off", () => setTwoStep(!v));
          }}
          label="Two-step verification"
        />
      </ListRow>
      <p className="border-t border-line-soft bg-raised px-4 py-1.5 text-11.5 font-semibold text-faint md:px-5">Devices signed in</p>
      {devices.map((d) => (
        <ListRow key={d.id}>
          <span className="min-w-0 flex-1 truncate">{d.name}</span>
          {d.current ? <Chip tone="ok">{d.when}</Chip> : <span className="font-mono text-12.5 text-muted">{d.when}</span>}
        </ListRow>
      ))}
      {devices.length > 1 && (
        <ListRow>
          <span className="flex-1" />
          <Button
            size="sm"
            onClick={() => {
              const before = devices;
              setDevices(devices.filter((d) => d.current));
              toast.show("Signed out of the other device", () => setDevices(before));
            }}
          >
            Sign out others
          </Button>
        </ListRow>
      )}
      {portal === "dev" && (
        <ListRow href="/dev/access">
          <span className="flex-1">API tokens</span>
          <span className="text-12.5 text-muted">2 active</span>
          <span className="text-13 font-semibold text-accent">Manage ›</span>
        </ListRow>
      )}
    </SectionCard>
  );
}

/* ---------- WhatsApp opt-in (settings_whatsapp) ---------- */

function WhatsAppDialog({ open, onOpenChange, onDone, number }: { open: boolean; onOpenChange: (v: boolean) => void; onDone: (num: string) => void; number: string }) {
  const [step, setStep] = React.useState(0);
  const [num, setNum] = React.useState(number.replace(/^\+91\s*/, ""));
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [agree, setAgree] = React.useState(true);
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  React.useEffect(() => {
    if (open) {
      setStep(0);
      setCode(["", "", "", "", "", ""]);
      setAgree(true);
    }
  }, [open]);
  const numOk = num.replace(/\D/g, "").length === 10;
  const codeOk = code.every((c) => /^\d$/.test(c));
  const steps = ["Number", "Code", "Done"];
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="Turn on WhatsApp"
      sub={
        <ol className="flex items-center gap-2" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={s} className={cn("inline-flex items-center gap-1.5 text-12.5 font-semibold", i === step ? "text-ink" : i < step ? "text-ok" : "text-faint")} aria-current={i === step ? "step" : undefined}>
              <span className={cn("grid h-5 w-5 place-items-center rounded-full text-11", i < step ? "bg-ok-soft text-ok" : i === step ? "bg-navy text-white" : "bg-raised text-faint")}>{i < step ? <Check size={12} strokeWidth={1.5} /> : i + 1}</span>
              {s}
              {i < steps.length - 1 && <span className="ml-1 text-faint">›</span>}
            </li>
          ))}
        </ol>
      }
      footer={
        step === 2 ? (
          <Button variant="primary" onClick={() => onDone(`+91 ${num.trim()}`)}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={() => (step === 0 ? onOpenChange(false) : setStep(0))}>
              {step === 0 ? "Cancel" : "Change number"}
            </Button>
            {step === 0 ? (
              <Button variant="primary" disabled={!numOk || !agree} onClick={() => setStep(1)}>
                Send code
              </Button>
            ) : (
              <Button variant="primary" disabled={!codeOk} onClick={() => setStep(2)}>
                Verify and turn on
              </Button>
            )}
          </>
        )
      }
    >
      {step === 0 && (
        <div className="grid gap-3">
          <Field label="WhatsApp number">
            <span className="flex gap-2">
              <span className="grid h-9 w-[64px] flex-none place-items-center rounded-md border border-line bg-raised font-mono text-13">+91</span>
              <Input value={num} onChange={(e) => setNum(e.target.value)} inputMode="tel" className="font-mono" autoFocus />
            </span>
          </Field>
          <label className="flex items-start gap-2.5 text-12.5 font-semibold">
            <Checkbox checked={agree} onChange={setAgree} label="Send me WhatsApp updates" />
            <span>Send me WhatsApp updates about Northwind. Reply STOP to stop.</span>
          </label>
        </div>
      )}
      {step === 1 && (
        <Field label={`Code sent to +91 ${num}`}>
          <span className="grid grid-cols-6 gap-2">
            {code.map((c, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={c}
                inputMode="numeric"
                maxLength={1}
                aria-label={`Digit ${i + 1}`}
                autoFocus={i === 0}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(-1);
                  setCode((s) => s.map((x, j) => (j === i ? v : x)));
                  if (v && i < 5) refs.current[i + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
                }}
                className="h-11 w-full rounded-md border border-line bg-surface text-center font-mono text-16 text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
              />
            ))}
          </span>
        </Field>
      )}
      {step === 2 && (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-ok-soft text-ok">
            <Check size={18} strokeWidth={1.5} />
          </span>
          <span className="min-w-0">
            <span className="block text-14 font-semibold">WhatsApp is on</span>
            <span className="block font-mono text-12.5 text-muted">+91 {num}</span>
          </span>
        </div>
      )}
    </Modal>
  );
}

/* ---------- Notifications (settings_redesign) ---------- */

// Solid icon circle on each alert row, as in the old Settings page. Dark mode mixes the tone with navy so the white glyph stays legible.
const PREF_ICON: Record<string, { Icon: LucideIcon; bg: string }> = {
  docs: { Icon: FileText, bg: "bg-brand" },
  steps: { Icon: Check, bg: "bg-ok-mid" },
  dead: { Icon: Clock, bg: "bg-bad-mid" },
  time: { Icon: AlignLeft, bg: "bg-accent dark:bg-btn" },
  ann: { Icon: Megaphone, bg: "bg-accent dark:bg-btn" },
  feed: { Icon: Rss, bg: "bg-teal dark:bg-[color-mix(in_srgb,var(--teal)_45%,var(--navy))]" },
  digest: { Icon: FileText, bg: "bg-violet dark:bg-[color-mix(in_srgb,var(--violet)_45%,var(--navy))]" },
  daily: { Icon: FileText, bg: "bg-violet dark:bg-[color-mix(in_srgb,var(--violet)_45%,var(--navy))]" },
  approvals: { Icon: CircleCheck, bg: "bg-ok-mid" },
  esc: { Icon: TriangleAlert, bg: "bg-bad-mid" },
  partner: { Icon: ChartColumn, bg: "bg-accent dark:bg-btn" },
  incidents: { Icon: TriangleAlert, bg: "bg-bad-mid" },
  quiet: { Icon: Moon, bg: "bg-navy dark:bg-btn" },
};

function PrefIcon({ k }: { k: string }) {
  const x = PREF_ICON[k] ?? PREF_ICON.docs;
  return (
    <span className={cn("grid h-[30px] w-[30px] flex-none place-items-center rounded-full text-white", x.bg)} aria-hidden>
      <x.Icon size={14} strokeWidth={1.5} />
    </span>
  );
}

export function NotificationsCard({ portal, toast, remind: showRemind = true }: { portal: Portal; toast: Toast; remind?: boolean }) {
  const client = portal === "client";
  const [waOn, setWaOn] = React.useState(true);
  const [waNum, setWaNum] = React.useState(PROFILE_EXTRA[portal].mobile);
  const [dialog, setDialog] = React.useState(false);
  const [quiet, setQuiet] = React.useState(true);
  const [em, setEm] = React.useState(DEFAULT_EMAIL);
  const [wa, setWa] = React.useState(DEFAULT_WA);
  const [remind, setRemind] = React.useState("3");
  const prefs = NOTIF_PREFS.filter((p) => !p.only || p.only.includes(portal));
  const email = client ? "rohan@northwind.in" : `${portal === "super" ? "mithilesh" : portal === "dev" ? "farhath" : portal === "manager" ? "pranay" : portal === "admin" ? "krishna" : "bharath"}@sbcllp.in`;

  // The toast is set outside the state updater: an updater must not change another component's state.
  const flip = (cur: Record<string, boolean>, set: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, key: string, label: string, ch: string) => {
    const v = !cur[key];
    set((s) => ({ ...s, [key]: v }));
    toast.show(`${label} · ${ch} ${v ? "on" : "off"}`, () => set((x) => ({ ...x, [key]: !v })));
  };

  return (
    <SectionCard title="Notifications" flush>
      <div className="grid grid-cols-1 border-b border-line-soft sm:grid-cols-2">
        <div className="flex items-center gap-3 px-4 py-3 md:px-5">
          <span className="min-w-0 flex-1">
            <span className="block text-13.5 font-semibold">Email</span>
            <span className="block truncate font-mono text-12 text-muted">{email}</span>
          </span>
          <Tag>Always on</Tag>
        </div>
        <div className="flex items-center gap-3 border-t border-line-soft px-4 py-3 sm:border-l sm:border-t-0 md:px-5">
          <span className="min-w-0 flex-1">
            <span className="block text-13.5 font-semibold">WhatsApp</span>
            <span className="block truncate font-mono text-12 text-muted">{waOn ? waNum : "Off"}</span>
          </span>
          {waOn ? (
            <Switch
              on
              onChange={() => {
                setWaOn(false);
                toast.show("WhatsApp turned off", () => setWaOn(true));
              }}
              label="WhatsApp"
            />
          ) : (
            <Button size="sm" variant="primary" onClick={() => setDialog(true)}>
              Turn on
            </Button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-13">
          <thead>
            <tr className="bg-raised text-11.5 font-semibold text-faint">
              <th className="px-4 py-1.5 text-left font-semibold md:px-5">Tell me when</th>
              <th className="w-[76px] py-1.5 text-center font-semibold">Email</th>
              <th className="w-[92px] py-1.5 pr-4 text-center font-semibold md:pr-5">WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {prefs.map((p) => (
              <tr key={p.key} className="border-t border-line-soft">
                <td className="px-4 py-2 md:px-5">
                  <span className="flex items-center gap-3">
                    <PrefIcon k={p.key} />
                    {p.label}
                  </span>
                </td>
                <td className="py-2 text-center">
                  {p.locked ? (
                    <span className="inline-flex h-[22px] items-center gap-1 rounded-sm bg-raised px-2 text-12 font-semibold text-muted" title="Always on">
                      <Lock size={11} strokeWidth={1.5} /> On
                    </span>
                  ) : (
                    <span className="inline-flex">
                      <Switch on={!!em[p.key]} onChange={() => flip(em, setEm, p.key, p.label, "email")} label={`${p.label} by email`} />
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-center md:pr-5">
                  {p.noWa ? (
                    <span className="text-faint">-</span>
                  ) : (
                    <span className={cn("inline-flex", !waOn && "pointer-events-none opacity-40")} aria-disabled={!waOn}>
                      <Switch on={waOn && !!wa[p.key]} onChange={() => flip(wa, setWa, p.key, p.label, "WhatsApp")} label={`${p.label} on WhatsApp`} />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListRow className="bg-raised">
        <PrefIcon k="quiet" />
        <span className="flex-1">Quiet hours · no WhatsApp 9 pm to 8 am</span>
        <span className={cn("inline-flex", !waOn && "pointer-events-none opacity-40")}>
          <Switch
            on={quiet}
            onChange={(v) => {
              setQuiet(v);
              toast.show(v ? "Quiet hours on" : "Quiet hours off", () => setQuiet(!v));
            }}
            label="Quiet hours"
          />
        </span>
      </ListRow>
      {client && showRemind && (
        <ListRow>
          <span className="flex-1">Remind me before a due date</span>
          <Tabs
            items={[
              { key: "7", label: "7 days" },
              { key: "3", label: "3 days" },
              { key: "1", label: "1 day" },
            ]}
            value={remind}
            onChange={(k) => {
              const was = remind;
              setRemind(k);
              toast.show(`Reminders ${k === "1" ? "1 day" : `${k} days`} before`, () => setRemind(was));
            }}
          />
        </ListRow>
      )}
      <WhatsAppDialog
        open={dialog}
        onOpenChange={setDialog}
        number={waNum}
        onDone={(n) => {
          setDialog(false);
          setWaNum(n);
          setWaOn(true);
          toast.show("WhatsApp is on", () => setWaOn(false));
        }}
      />
    </SectionCard>
  );
}

/* ---------- Appearance and email ---------- */

const THEMES = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
];

/** Theme picker: Light, Dark or System. System follows prefers-color-scheme (theme-mode.ts). */
export function ThemePicker({ toast }: { toast?: Toast }) {
  const { mode, setMode } = useThemeMode();
  return (
    <Tabs
      items={THEMES}
      value={mode}
      onChange={(k) => {
        const was = mode;
        setMode(k as ThemeMode);
        toast?.show(`Theme · ${THEMES.find((x) => x.key === k)?.label}`, () => setMode(was));
      }}
    />
  );
}

export function AppearanceCard({ toast, textSize = true }: { toast: Toast; textSize?: boolean }) {
  const [motion, setMotion] = React.useState(false);
  const [size, setSize] = React.useState("default");
  return (
    <SectionCard title="Appearance" flush>
      <ListRow>
        <span className="flex-1">Theme</span>
        <ThemePicker toast={toast} />
      </ListRow>
      {textSize && (
        <ListRow>
          <span className="flex-1">Text size</span>
          <Tabs
            items={[
              { key: "small", label: "Small" },
              { key: "default", label: "Default" },
              { key: "large", label: "Large" },
            ]}
            value={size}
            onChange={setSize}
          />
        </ListRow>
      )}
      <ListRow>
        <span className="flex-1">Reduce motion</span>
        <Switch
          on={motion}
          onChange={(v) => {
            setMotion(v);
            toast.show(v ? "Reduce motion on" : "Reduce motion off", () => setMotion(!v));
          }}
          label="Reduce motion"
        />
      </ListRow>
    </SectionCard>
  );
}

/** Staff only: mail sent from VCFO goes from the person's Outlook mailbox. */
function EmailCard({ portal, toast }: { portal: Portal; toast: Toast }) {
  const name = portal === "super" ? "mithilesh" : portal === "manager" ? "pranay" : portal === "admin" ? "krishna" : "bharath";
  return (
    <SectionCard title="Email" flush>
      <ListRow>
        <span className="min-w-0 flex-1">
          <span className="block">Outlook</span>
          <span className="block truncate font-mono text-12 text-muted">{name}@sbcllp.in</span>
        </span>
        <Chip tone="ok">Connected</Chip>
      </ListRow>
      <ListRow>
        <span className="flex-1">Signature</span>
        <span className="text-12.5 text-muted">From Outlook · server-side</span>
      </ListRow>
      <ListRow>
        <span className="flex-1" />
        <Button size="sm" onClick={() => toast.show("Outlook reconnected")}>
          Reconnect Outlook
        </Button>
      </ListRow>
    </SectionCard>
  );
}

/* ---------- Client settings page (settings_redesign) ---------- */

function FactLine({ k, children, end }: { k: string; children: React.ReactNode; end?: React.ReactNode }) {
  return (
    <div className="flex min-h-[44px] items-center gap-3 border-t border-line-soft px-4 py-2 text-13.5 first:border-t-0 md:px-5">
      <span className="w-[92px] flex-none text-12.5 font-semibold text-muted">{k}</span>
      <span className="min-w-0 flex-1">{children}</span>
      {end}
    </div>
  );
}

/** The client's Settings: navy profile card, profile facts, security, notifications with an icon on each alert row, appearance. */
function ClientSettingsView() {
  const toast = useUndoToast();
  const me = { name: "Rohan Kumar", ini: "RK", email: "rohan@northwind.in", phone: PROFILE_EXTRA.client.mobile };
  const [edit, setEdit] = React.useState(false);
  const [name, setName] = React.useState(me.name);
  const [phone, setPhone] = React.useState(me.phone);
  const [pw, setPw] = React.useState(false);
  const [changed, setChanged] = React.useState("2 Sep");
  const [motion, setMotion] = React.useState(false);
  const photo = React.useRef<HTMLInputElement>(null);
  const device = DEVICES.find((d) => d.current)!;

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
      <div className="grid min-w-0 gap-4">
        <section aria-label="Your profile" className="flex items-center gap-4 rounded-lg bg-navy px-4 py-4 text-white">
          <span className="relative flex-none">
            <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-accent text-22 font-bold text-white ring-2 ring-white/[.25] dark:bg-btn">{me.ini}</span>
            <button type="button" onClick={() => photo.current?.click()} aria-label="Change photo" title="Change photo" className="absolute -bottom-0.5 -right-1 grid h-7 w-7 place-items-center rounded-md bg-brand text-white">
              <Camera size={14} strokeWidth={1.5} />
            </button>
            <input ref={photo} type="file" accept="image/png,image/jpeg" className="hidden" aria-label="Photo file" onChange={() => toast.show("Photo updated")} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-22 font-semibold leading-tight">{name}</span>
            <span className="block truncate font-mono text-12 text-navy-ink">{me.email}</span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="inline-flex h-[22px] items-center rounded-sm bg-brand px-2 text-11.5 font-bold text-white">Primary</span>
              <span className="inline-flex h-[22px] items-center rounded-sm bg-white/[.12] px-2 text-11.5 font-semibold text-white">Northwind Technologies</span>
            </span>
          </span>
        </section>

        <SectionCard
          title="Profile"
          flush
          right={
            edit ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => { setName(me.name); setPhone(me.phone); setEdit(false); }}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setEdit(false);
                    toast.show("Profile saved", () => { setName(me.name); setPhone(me.phone); });
                  }}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setEdit(true)}>
                Edit
              </Button>
            )
          }
        >
          <FactLine k="Full name">{edit ? <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" /> : name}</FactLine>
          <FactLine k="Email">
            <span className="font-mono text-13">{me.email}</span>
          </FactLine>
          <FactLine k="Phone">{edit ? <Input value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Phone" className="font-mono" /> : <span className="whitespace-nowrap font-mono text-13">{phone}</span>}</FactLine>
          <FactLine k="WhatsApp" end={<Chip tone="ok">Verified</Chip>}>
            <span className="whitespace-nowrap font-mono text-13">{phone}</span>
          </FactLine>
        </SectionCard>

        <SectionCard title="Security" flush>
          <FactLine
            k="Password"
            end={
              !pw && (
                <Button size="sm" onClick={() => setPw(true)}>
                  Change
                </Button>
              )
            }
          >
            <span className="whitespace-nowrap font-mono text-12.5">••••••••</span>
            <span className="ml-2 text-12 text-muted">changed {changed}</span>
          </FactLine>
          {pw && (
            <div className="border-t border-line-soft px-4 py-3 md:px-5">
              <PasswordForm
                onCancel={() => setPw(false)}
                onSave={() => {
                  const was = changed;
                  setPw(false);
                  setChanged("6 Oct");
                  toast.show("Password changed", () => setChanged(was));
                }}
              />
            </div>
          )}
          <FactLine k="This device" end={<Chip tone="ok">{device.when}</Chip>}>
            {device.name}
          </FactLine>
        </SectionCard>
      </div>

      <div className="grid min-w-0 gap-4">
        <NotificationsCard portal="client" toast={toast} remind={false} />
        <SectionCard title="Appearance">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid justify-items-start gap-1.5">
              <span className="text-12.5 font-semibold text-muted">Theme</span>
              <ThemePicker toast={toast} />
            </div>
            <div className="grid justify-items-start gap-1.5">
              <span className="text-12.5 font-semibold text-muted">Reduce motion</span>
              <Switch
                on={motion}
                onChange={(v) => {
                  setMotion(v);
                  toast.show(v ? "Reduce motion on" : "Reduce motion off", () => setMotion(!v));
                }}
                label="Reduce motion"
              />
            </div>
          </div>
        </SectionCard>
      </div>
      {toast.node}
    </div>
  );
}

/** Settings section of Profile. Client: the old Settings page. Super admin and developer: security, notification channels with the WhatsApp opt-in, appearance. Every change shows a toast with Undo. */
export function SettingsSection({ portal }: { portal: Portal }) {
  const toast = useUndoToast();
  if (portal === "client") return <ClientSettingsView />;
  const staffMail = portal !== "dev";
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
      <div className="grid min-w-0 grid-cols-1 gap-4">
        <NotificationsCard portal={portal} toast={toast} />
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4">
        <SecurityCard portal={portal} toast={toast} />
        {staffMail && <EmailCard portal={portal} toast={toast} />}
        <AppearanceCard toast={toast} />
      </div>
      {toast.node}
    </div>
  );
}
