import * as React from "react";
import { cn } from "@/lib/cn";

/** Main column and a 360 px rail. Stacks on phones. */
export function Cols({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]", className)}>{children}</div>;
}

export function Col({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid min-w-0 grid-cols-1 gap-5", className)}>{children}</div>;
}

/** Equal columns. */
export function Row({ children, className, cols = 2 }: { children: React.ReactNode; className?: string; cols?: 2 | 3 | 4 }) {
  const c = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 xl:grid-cols-4" }[cols];
  return <div className={cn("grid grid-cols-1 items-start gap-5", c, className)}>{children}</div>;
}

export function Stack({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-5", className)}>{children}</div>;
}
