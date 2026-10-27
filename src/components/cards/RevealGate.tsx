"use client";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";

/** Demo secrets. Any other value is wrong. */
export const DEMO_PASSWORD = "sbc-demo-pass";
export const DEMO_OTP = "123456";

export interface RevealGateProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** "password": the user's own password (v7p_ids_password). "otp": a code sent to the manager (Credentials). */
  mode: "password" | "otp";
  /** "Show PAN", "Preview the sheet", "Edit the sheet". */
  title: string;
  /** Main button label: "Confirm", "Verify". */
  confirm?: string;
  /** Who receives the OTP. */
  manager?: { name: string; mail: string };
  onPass: () => void;
}

/**
 * v7p_ids_password and the Credentials OTP dialog. Three wrong tries lock the dialog.
 * No explanations on screen (R-06): the result line says how long the value stays visible.
 */
export function RevealGate({ open, onOpenChange, mode, title, confirm, manager = { name: "Pranay", mail: "pr•••••@sbc.in" }, onPass }: RevealGateProps) {
  const [pw, setPw] = React.useState(mode === "password" ? DEMO_PASSWORD : "");
  const [show, setShow] = React.useState(false);
  const [digits, setDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [wrong, setWrong] = React.useState(0);
  const [resendIn, setResendIn] = React.useState(30);
  const boxes = React.useRef<Array<HTMLInputElement | null>>([]);
  const locked = wrong >= 3;

  React.useEffect(() => {
    if (!open) return;
    setPw(mode === "password" ? DEMO_PASSWORD : "");
    setDigits(["", "", "", "", "", ""]);
    setWrong(0);
    setResendIn(30);
  }, [open, mode]);

  React.useEffect(() => {
    if (!open || mode !== "otp" || resendIn <= 0) return;
    const h = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(h);
  }, [open, mode, resendIn]);

  const value = mode === "password" ? pw : digits.join("");
  const full = mode === "password" ? pw.length > 0 : digits.every(Boolean);

  const submit = () => {
    if (!full || locked) return;
    const ok = mode === "password" ? value === DEMO_PASSWORD : value === DEMO_OTP;
    if (ok) {
      onPass();
      onOpenChange(false);
      return;
    }
    setWrong((n) => n + 1);
    if (mode === "otp") {
      setDigits(["", "", "", "", "", ""]);
      boxes.current[0]?.focus();
    }
  };

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split("");
      setDigits(Array.from({ length: 6 }, (_, k) => next[k] ?? ""));
      boxes.current[Math.min(5, next.length)]?.focus();
      return;
    }
    setDigits((d) => d.map((x, k) => (k === i ? clean : x)));
    if (clean && i < 5) boxes.current[i + 1]?.focus();
  };

  const left = 3 - wrong;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={mode === "password" ? "Confirm it is you" : title}
      eyebrow={mode === "password" ? title : undefined}
      footer={
        <>
          {mode === "otp" && (
            <button type="button" disabled={resendIn > 0 || locked} onClick={() => setResendIn(30)} className="mr-auto text-12.5 font-semibold text-accent disabled:text-faint">
              {resendIn > 0 ? `Resend code in 0:${String(resendIn).padStart(2, "0")}` : "Resend code"}
            </button>
          )}
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!full || locked}>
            {confirm ?? (mode === "password" ? "Confirm" : "Verify")}
          </Button>
        </>
      }
    >
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {mode === "password" ? (
          <Field label="Password">
            <span className="relative block">
              <Input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoFocus className={cn("pr-10", wrong > 0 && "border-bad")} aria-invalid={wrong > 0} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-sm text-muted hover:bg-raised" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
              </button>
            </span>
          </Field>
        ) : (
          <>
            <p className="text-13 text-ink-2">
              Code sent to {manager.name} at <span className="font-mono text-12.5">{manager.mail}</span>
            </p>
            <div className="flex gap-2" role="group" aria-label="One-time code">
              {digits.map((x, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    boxes.current[i] = el;
                  }}
                  value={x}
                  disabled={locked}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  autoFocus={i === 0}
                  aria-label={`Digit ${i + 1} of 6`}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !x && i > 0) boxes.current[i - 1]?.focus();
                  }}
                  className={cn("h-11 w-full min-w-0 rounded-md border bg-surface text-center font-mono text-16 outline-none focus-visible:ring-2 focus-visible:ring-accent-line disabled:opacity-50", wrong > 0 ? "border-bad" : "border-line")}
                />
              ))}
            </div>
          </>
        )}
        {wrong > 0 && !locked && (
          <p className="text-12.5 font-semibold text-bad" role="alert">
            {mode === "password" ? "Wrong password" : "Wrong code"}. {left} {left === 1 ? "try" : "tries"} left.
          </p>
        )}
        {locked && (
          <p className="text-12.5 font-semibold text-bad" role="alert">
            Too many wrong tries. Try again later.
          </p>
        )}
        <div className="flex items-center justify-between text-12.5 text-muted">
          <span>{mode === "password" ? "Shown for 60 seconds" : "Open for 10 minutes"}</span>
          {mode === "password" && (
            <a href="/client/profile?tab=settings" className="font-semibold text-accent hover:underline">
              Forgot password?
            </a>
          )}
        </div>
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

/** Seconds left until a time, refreshed each second. 0 when past or unset. */
export function useCountdown(until: number | null) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!until) return;
    const h = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(h);
  }, [until]);
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
