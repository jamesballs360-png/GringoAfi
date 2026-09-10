"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-pine-400 to-pine text-white shadow-sm hover:from-pine hover:to-pine-600 focus-visible:ring-pine/40",
  secondary:
    "bg-panel text-ink border border-line hover:bg-pine-50 hover:border-pine-100 focus-visible:ring-pine/30",
  danger:
    "bg-panel text-clay border border-clay/30 hover:bg-red-50 focus-visible:ring-clay/30",
  ghost:
    "bg-transparent text-muted hover:bg-pine-50 hover:text-ink focus-visible:ring-pine/30",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        transition-all duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-pine-400 disabled:hover:to-pine
        active:scale-[0.98]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}