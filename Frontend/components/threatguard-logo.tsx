"use client"

import { Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThreatGuardLogoProps {
  /** "sidebar" = compact for nav (default), "header" = larger for landing/auth */
  variant?: "sidebar" | "header"
  className?: string
}

export function ThreatGuardLogo({ variant = "sidebar", className }: ThreatGuardLogoProps) {
  const isSidebar = variant === "sidebar"
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20",
        isSidebar ? "h-10 w-10" : "h-12 w-12",
        className
      )}
      aria-hidden
    >
      <Shield className={isSidebar ? "h-5 w-5" : "h-6 w-6"} strokeWidth={2.5} />
    </div>
  )
}
