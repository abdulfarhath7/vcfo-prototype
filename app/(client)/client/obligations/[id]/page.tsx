import { notFound } from "next/navigation";
import { obligation } from "@/data/compliance";
import { ObligationScreen } from "@/screens/client/ObligationScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!obligation(id)) notFound();
  return <ObligationScreen id={id} />;
}
