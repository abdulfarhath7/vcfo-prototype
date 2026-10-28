"use client";
import { TimelineCardFull } from "./inc-timeline";

/** Timeline card with the editor, the change request and the row drill. Built in inc-timeline.tsx. */
export function IncTimelineCard({ after, portal, className }: { after?: boolean; portal?: string; className?: string } = {}) {
  return <TimelineCardFull after={after} portal={portal} className={className} />;
}
