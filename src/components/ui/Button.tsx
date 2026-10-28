import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// R-12: main button blurple with a faint top shine. 36 px; small 30 px; large 42 px. 6 px corners.
// Icon-only buttons are 6 px squares, never circles. One main button per card.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[7px] whitespace-nowrap rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-on shadow-shine hover:bg-primary-hover",
        strong: "bg-strong text-strong-on shadow-shine hover:opacity-90",
        outline: "border-1.5 border-line-2 bg-surface text-ink shadow-control hover:bg-hover",
        secondary: "border-1.5 border-line-2 bg-surface text-ink shadow-control hover:bg-hover",
        ghost: "bg-ghost text-ink hover:bg-ghost-hover",
        quiet: "text-ink-2 hover:bg-ghost",
        soft: "bg-accent-soft text-accent hover:bg-accent-line",
        danger: "bg-danger text-white shadow-shine hover:bg-danger-hover",
        link: "h-auto px-0 text-accent hover:underline",
        onNavy: "border-1.5 border-white/[.18] bg-white/[.08] text-white hover:bg-white/[.14]",
        onNavyPrimary: "bg-white text-navy hover:bg-navy-ink",
      },
      size: {
        md: "h-9 px-3.5 text-14",
        sm: "h-[30px] px-2.5 text-13",
        lg: "h-[42px] px-[18px] text-15",
        icon: "h-9 w-9 p-0",
        iconSm: "h-[30px] w-[30px] p-0",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
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
