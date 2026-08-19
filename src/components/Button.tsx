import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export default function Button({
  className = "",
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? "span" : "button";

  // Base styles
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-[1px] hover:-translate-y-[1px] active:translate-y-[0px]";

  // Variant styles
  const variantStyles = {
    default: "bg-accent/10 text-accent hover:bg-accent/20 active:bg-accent/30",
    destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30",
    outline: "border border-accent/20 text-accent hover:bg-accent/10 active:bg-accent/20",
    secondary: "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20 active:bg-muted-foreground/30",
    ghost: "bg-transparent text-muted-foreground hover:bg-muted-foreground/10 active:bg-muted-foreground/20",
    link: "bg-transparent text-accent underline-offset-4 hover:underline active:underline",
  }[variant] ?? "bg-accent/10 text-accent hover:bg-accent/20 active:bg-accent/30";

  // Size styles
  const sizeStyles = {
    default: "h-9 py-1 px-3",
    sm: "h-8 px-2",
    lg: "h-10 px-4",
    icon: "h-8 w-8",
  }[size] ?? "h-9 py-1 px-3";

  return (
    <Component
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    />
  );
}