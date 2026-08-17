"use client"

import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

type Variant = "primary" | "pink" | "teal" | "blue" | "orange" | "yellow" | "ghost" | "outline"

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground",
  pink: "bg-pop-pink text-white",
  teal: "bg-pop-teal text-white",
  blue: "bg-pop-blue text-white",
  orange: "bg-pop-orange text-white",
  yellow: "bg-pop-yellow text-foreground",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  outline: "bg-card text-foreground border-2 border-border",
}

interface PopButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant
  size?: "sm" | "md" | "lg"
}

export function PopButton({ variant = "primary", size = "md", className, children, ...props }: PopButtonProps) {
  const sizeCls =
    size === "lg" ? "px-8 py-4 text-lg" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base"
  const withShadow = variant !== "ghost"
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ y: 2, scale: 0.98 }}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-2xl font-bold tracking-wide transition-colors",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-50",
        VARIANTS[variant],
        withShadow && "shadow-pop-sm",
        sizeCls,
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
