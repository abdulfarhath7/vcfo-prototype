import { notFound } from "next/navigation";
import { staffObligation } from "@/data/staff-compliance";
import { ObligationScreen } from "@/screens/staff/ObligationScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!staffObligation(id)) notFound();
  return <ObligationScreen portal="manager" id={id} />;
}
