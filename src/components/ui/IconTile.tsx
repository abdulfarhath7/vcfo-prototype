import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { toneTile, type Tone } from "@/components/icons";

/** R-16 / R-18: tinted icon tile. 28 px for card heads, 30 px for number strips. */
export function IconTile({ Icon, tone, size = 28, className }: { Icon: LucideIcon; tone: Tone; size?: 28 | 30 | 34; className?: string }) {
  return (
    <span
      className={cn("inline-grid flex-none place-items-center rounded-md", toneTile[tone], className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon size={size === 28 ? 15 : 16} strokeWidth={1.5} />
    </span>
  );
}
