import { DocViewerScreen } from "@/screens/shared/DocViewerScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocViewerScreen portal="lead" id={id} />;
}
