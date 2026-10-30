"use client";
import { BoardResolutionPage } from "@/screens/shared/BoardResolutionPage";
import { type StaffPortal } from "./parts";

// Staff Board resolution (NOC): the client page plus T1 to T6 (docs/BOARD-RESOLUTION-NOC.md).
export function BoardResolutionScreen({ portal }: { portal: StaffPortal }) {
  return <BoardResolutionPage role={portal} />;
}
