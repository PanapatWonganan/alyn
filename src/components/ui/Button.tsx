import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "coin";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rosegold/50 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-rosegold-dark text-white hover:bg-rosegold active:scale-[0.98]":
              variant === "primary",
            "bg-cream text-rosegold-dark hover:bg-cream-dark active:scale-[0.98]":
              variant === "secondary",
            "border-2 border-rosegold-dark text-rosegold-dark hover:bg-cream active:scale-[0.98]":
              variant === "outline",
            "text-rosegold-dark hover:bg-cream active:scale-[0.98]":
              variant === "ghost",
            "bg-coin text-white hover:bg-coin/90 active:scale-[0.98]":
              variant === "coin",
            "px-3 py-1.5 text-sm": size === "sm",
            "px-5 py-2.5 text-base": size === "md",
            "px-7 py-3 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
