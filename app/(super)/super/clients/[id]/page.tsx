import { notFound } from "next/navigation";
import { ClientRecordScreen } from "@/screens/super/ClientRecordScreen";
import { FIRM_CLIENTS, clientById } from "@/data/super";

export function generateStaticParams() {
  return FIRM_CLIENTS.map((c) => ({ id: c.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!clientById(id)) notFound();
  return <ClientRecordScreen id={id} />;
}
