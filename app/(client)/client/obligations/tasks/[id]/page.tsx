import { notFound } from "next/navigation";
import { TODAY } from "@/lib/dates";
import { clientTask, clientVisible } from "@/data/compliance-tasks";
import { TaskDetail } from "@/screens/shared/TaskDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = clientTask(id);
  if (!task || !clientVisible(task)) notFound();
  return <TaskDetail role="client" task={task} today={TODAY} />;
}
