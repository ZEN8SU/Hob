"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "honey" | "dark" | "outline" | "success" | "warning" | "info" | "danger";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "honey",
  size = "md",
  ...props
}) => {
  const baseStyles = "inline-flex items-center font-bold rounded-full tracking-wide";

  const variants = {
    honey: "bg-yellow-100 text-yellow-900 border border-yellow-300",
    dark: "bg-zinc-900 text-yellow-400 border border-zinc-700",
    outline: "border border-zinc-300 text-zinc-700 bg-white",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
    danger: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};

