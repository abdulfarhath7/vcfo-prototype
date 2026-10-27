import { notFound } from "next/navigation";
import { staffRegistration } from "@/data/staff-compliance";
import { RegistrationScreen } from "@/screens/staff/RegistrationScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!staffRegistration(id)) notFound();
  return <RegistrationScreen portal="manager" id={id} />;
}
