import { notFound } from "next/navigation";
import { STAFF_TODAY } from "@/lib/dates";
import { staffTask } from "@/data/compliance-tasks";
import { TaskDetail } from "@/screens/shared/TaskDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = staffTask(id);
  if (!task) notFound();
  return <TaskDetail role="lead" task={task} today={STAFF_TODAY} />;
}
