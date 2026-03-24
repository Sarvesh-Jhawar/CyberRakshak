"use client"

import React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const themes = ["classic", "dark", "unique"]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const current = typeof theme === "string" ? theme : "classic"

  const handleCycle = () => {
    const idx = themes.indexOf(current)
    const next = themes[(idx + 1) % themes.length]
    setTheme(next)
  }

  const Icon = current === "dark" ? Moon : current === "unique" ? Zap : Sun

  return (
    <Button size="sm" variant="outline" onClick={handleCycle} aria-label="Toggle theme">
      <Icon className="mr-2 h-4 w-4" />
      {current === "classic" ? "Classic" : current === "dark" ? "Dark" : "Unique"}
    </Button>
  )
}
