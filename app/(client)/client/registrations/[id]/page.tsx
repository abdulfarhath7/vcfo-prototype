import { notFound } from "next/navigation";
import { registration } from "@/data/registrations";
import { RegistrationScreen } from "@/screens/client/RegistrationScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!registration(id)) notFound();
  return <RegistrationScreen id={id} />;
}
