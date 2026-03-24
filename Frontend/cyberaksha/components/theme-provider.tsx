"use client"

import * as React from "react"
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Use `class` attribute so themes map directly to html classes (e.g. .dark, .unique)
  return (
    <NextThemesProvider attribute="class" defaultTheme="classic" enableSystem={false} {...props}>
      {children}
    </NextThemesProvider>
  )
}
