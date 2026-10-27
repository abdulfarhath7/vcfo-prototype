import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// R-12: main button navy, 36 px; small 30 px. One main button per card.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line",
  {
    variants: {
      variant: {
        primary: "bg-btn text-white hover:bg-btn-hover",
        outline: "bg-surface text-ink-2 border border-line hover:bg-raised",
        ghost: "text-ink-2 hover:bg-raised",
        link: "text-accent h-auto px-0 font-semibold",
        onNavy: "bg-white/[.08] text-white border border-white/[.18] hover:bg-white/[.14]",
        onNavyPrimary: "bg-white text-navy hover:bg-navy-ink",
        soft: "bg-ok-soft text-ok hover:brightness-95",
      },
      size: {
        md: "h-9 px-3.5 text-13.5",
        sm: "h-[30px] px-2.5 text-12.5",
        icon: "h-9 w-9 p-0",
        iconSm: "h-[30px] w-[30px] p-0",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
