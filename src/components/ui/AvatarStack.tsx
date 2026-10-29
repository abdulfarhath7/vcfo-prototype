import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";

/**
 * V3: people stacked with a ring in the panel colour. Up to `max` faces, then "+N".
 * The whole stack has one name for screen readers and a tooltip with every name.
 */
export function AvatarStack({ names, max = 3, size = 24, label, className }: { names: string[]; max?: number; size?: 24 | 30; label?: string; className?: string }) {
  const shown = names.slice(0, max);
  const more = names.length - shown.length;
  const all = label ?? names.join(", ");
  const overlap = size === 24 ? "-ml-1.5" : "-ml-2";
  return (
    <span className={cn("inline-flex flex-none items-center", className)} role="img" aria-label={all} title={all}>
      {shown.map((n, i) => (
        <Avatar key={n} name={n} size={size} className={cn("ring-2 ring-surface", i > 0 && overlap)} />
      ))}
      {more > 0 && (
        <span
          className={cn("inline-grid flex-none place-items-center rounded-full bg-raised font-medium text-ink-2 ring-2 ring-surface", size === 24 ? "text-[10px]" : "text-11", overlap)}
          style={{ width: size, height: size }}
          aria-hidden
        >
          +{more}
        </span>
      )}
    </span>
  );
}
