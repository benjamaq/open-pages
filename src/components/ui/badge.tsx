import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const variants: Record<NonNull<BadgeProps["variant"]>, string> = {
  default: "bg-black text-white",
  secondary: "bg-neutral-200 text-neutral-900",
  destructive: "bg-red-600 text-white",
  outline: "border border-neutral-300 text-neutral-900 bg-transparent",
  success: "bg-green-50 text-green-900 border border-green-200",
  warning: "bg-amber-50 text-amber-900 border border-amber-200",
};

type NonNull<T> = T extends null | undefined ? never : T;

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export default Badge;


