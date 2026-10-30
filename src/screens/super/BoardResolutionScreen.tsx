"use client";
import { BoardResolutionPage } from "@/screens/shared/BoardResolutionPage";

// Super admin Board resolution (NOC): the same page as staff (T1 to T6).
export function BoardResolutionScreen() {
  return <BoardResolutionPage role="super" />;
}
