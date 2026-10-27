import { notFound } from "next/navigation";
import { STEPS } from "@/data/incorporation";
import { StepScreen } from "@/screens/client/StepScreen";

export default async function Page({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!STEPS.some((s) => s.n === n)) notFound();
  return <StepScreen n={n} />;
}
