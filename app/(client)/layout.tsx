"use client";
import { Shell } from "@/components/shell/Shell";
import { ClientStateProvider, useClientState } from "@/components/shell/ClientState";

function Inner({ children }: { children: React.ReactNode }) {
  const { incorporated } = useClientState();
  return (
    <Shell portal="client" incorporated={incorporated}>
      {children}
    </Shell>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientStateProvider>
      <Inner>{children}</Inner>
    </ClientStateProvider>
  );
}
