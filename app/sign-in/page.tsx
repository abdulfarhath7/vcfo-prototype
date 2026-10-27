import type { Metadata } from "next";
import { SignInScreen } from "@/screens/public/SignInScreen";

export const metadata: Metadata = { title: "Sign in · VCFO Suite" };

export default function Page() {
  return <SignInScreen />;
}
