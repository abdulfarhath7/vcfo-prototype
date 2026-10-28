import { notFound } from "next/navigation";
import { itemExists } from "@/data/staff-item";
import { RegistrationScreen } from "@/screens/staff/RegistrationScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!itemExists("reg", id)) notFound();
  return <RegistrationScreen portal="manager" id={id} />;
}
