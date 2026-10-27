"use client";
import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

/** "Book a demo": a small sample form. Nothing is sent. */
export function BookDemoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [sent, setSent] = React.useState("");
  const [email, setEmail] = React.useState("");
  const change = (v: boolean) => {
    onOpenChange(v);
    if (!v) setSent("");
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(email.trim() || "your email");
  };
  return (
    <Modal
      open={open}
      onOpenChange={change}
      title="Book a demo"
      size="sm"
      footer={
        sent ? (
          <Button variant="primary" onClick={() => change(false)}>
            Close
          </Button>
        ) : (
          <Button variant="primary" type="submit" form="lp-demo-form">
            Send
          </Button>
        )
      }
    >
      {sent ? (
        <p className="text-14 text-ink-2">Request sent to SBC. The reply goes to {sent}.</p>
      ) : (
        <form id="lp-demo-form" onSubmit={submit} className="grid gap-3.5">
          <Field label="Name">
            <Input name="name" autoComplete="name" required />
          </Field>
          <Field label="Firm">
            <Input name="firm" autoComplete="organization" required />
          </Field>
          <Field label="Work email">
            <Input name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </form>
      )}
    </Modal>
  );
}
