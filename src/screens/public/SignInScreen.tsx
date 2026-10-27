"use client";
import "@/styles/landing.css";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { DEMO_ACCOUNTS } from "./content";
import { BookDemoDialog } from "./BookDemoDialog";

/** Sign in. Sample only: there is no real auth. A demo account opens its portal; any other email opens the client portal. */
export function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [err, setErr] = React.useState(false);
  const [demo, setDemo] = React.useState(false);
  const passRef = React.useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = email.trim().toLowerCase();
    if (!e2.includes("@") || !pass) {
      setErr(true);
      passRef.current?.select();
      return;
    }
    setErr(false);
    router.push(DEMO_ACCOUNTS.find((a) => a.email === e2)?.href ?? "/client/home");
  };

  const quick = (a: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(a.email);
    setPass("demo2026");
    setErr(false);
    router.push(a.href);
  };

  return (
    <div className="si">
      <svg className="si-peaks" viewBox="0 0 1440 360" preserveAspectRatio="none" aria-hidden>
        <path className="p2" d="M0 200 L120 150 L240 190 L384 110 L528 170 L672 96 L816 160 L960 120 L1104 176 L1248 104 L1440 150 L1440 360 L0 360Z" />
        <path className="p3" d="M0 250 L168 206 L312 240 L480 196 L624 232 L792 188 L960 226 L1128 180 L1296 220 L1440 196 L1440 360 L0 360Z" />
        <path className="p1" d="M0 300 L192 262 L360 290 L552 252 L720 284 L912 246 L1080 278 L1272 250 L1440 276 L1440 360 L0 360Z" />
      </svg>

      <div className="si-top">
        <Link href="/" className="si-back">
          <ArrowLeft size={16} strokeWidth={1.5} />
          Back to site
        </Link>
        <span className="hint lp-mono" style={{ color: "var(--navy-faint)" }}>
          Live prototype, sample data
        </span>
      </div>

      <form className="si-card" onSubmit={submit} noValidate aria-labelledby="si-t">
        <span className="si-logo">
          <span className="mark">V</span>
          <span>
            <b>VCFO Suite</b> <small>by SBC</small>
          </span>
        </span>
        <h1 id="si-t">Sign in to your workspace</h1>
        <p className="lead">Use the account your firm created for you.</p>
        <Field label="Work email">
          <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
        </Field>
        <Field label="Password">
          <Input ref={passRef} type="password" autoComplete="current-password" required value={pass} onChange={(e) => setPass(e.target.value)} className="h-10" />
        </Field>
        {err && (
          <p className="si-err" role="alert">
            That email and password do not match an account.
          </p>
        )}
        <Button variant="primary" type="submit" className="h-10 w-full dark:border dark:border-accent-line">
          Sign in
        </Button>
        <div className="si-quick">
          <span>Demo accounts</span>
          {DEMO_ACCOUNTS.map((a) => (
            <Button key={a.label} variant="outline" size="sm" className="w-full min-w-0" onClick={() => quick(a)} title={a.email}>
              {a.label}
            </Button>
          ))}
        </div>
        <p className="si-foot">
          Forgot your password? Ask your firm&apos;s admin to reset it.
          <br />
          No account yet?{" "}
          <button type="button" onClick={() => setDemo(true)}>
            Book a demo
          </button>
        </p>
        <p className="lp-mono sm:hidden">Live prototype, sample data</p>
      </form>
      <BookDemoDialog open={demo} onOpenChange={setDemo} />
    </div>
  );
}
