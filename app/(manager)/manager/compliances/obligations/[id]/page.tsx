import { notFound } from "next/navigation";
import { itemExists } from "@/data/staff-item";
import { ObligationScreen } from "@/screens/staff/ObligationScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!itemExists("ob", id)) notFound();
  return <ObligationScreen portal="manager" id={id} />;
}
