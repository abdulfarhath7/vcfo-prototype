import { redirect } from "next/navigation";

export default function Page() {
  redirect("/lead/profile?tab=settings");
}
