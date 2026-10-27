import type { Metadata } from "next";
import { PortalsScreen } from "@/screens/public/PortalsScreen";

export const metadata: Metadata = { title: "Portals · VCFO Suite" };

export default function Page() {
  return <PortalsScreen />;
}
