import { notFound } from "next/navigation";
import { PhaseScreen } from "@/screens/client/PhaseScreen";

export default async function Page({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (n !== 1 && n !== 2 && n !== 3) notFound();
  return <PhaseScreen n={n} />;
}
