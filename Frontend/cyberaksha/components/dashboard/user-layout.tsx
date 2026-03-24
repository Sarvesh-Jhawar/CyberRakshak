"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Shield, FileText, History, BookOpen, HelpCircle, LogOut, User, Menu, X, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface UserLayoutProps {
  children: React.ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Frontend showcase mode - load demo user data
    // Check if token exists (from login demo)
    const token = localStorage.getItem("token")
    if (!token) {
      // Allow access without token in showcase mode
      setUser({ name: "Demo User", email: "user@demo.com", role: "USER" })
    } else {
      // User logged in via demo login
      setUser({ name: "Demo User", email: "user@demo.com", role: "USER" })
    }
  }, [])

  const navigation = [
    { name: "Dashboard", href: "/user-dashboard", icon: Monitor },
    { name: "File a Complaint", href: "/user-dashboard/complaint", icon: FileText },
    { name: "Complaint Status", href: "/user-dashboard/status", icon: History },
    { name: "Playbook", href: "/user-dashboard/playbook", icon: BookOpen },
    { name: "Help / Support", href: "/user-dashboard/help", icon: HelpCircle },
    { name: "Profile", href: "/user-dashboard/profile", icon: User },
  ]

  const handleLogout = async () => {
    // Demo logout - just clear localStorage and redirect
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    router.push("/login")
  }

  const isActive = (href: string) => pathname === href

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-sidebar-accent cyber-glow" />
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">User Portal</h1>
                <p className="text-xs text-sidebar-foreground/70">Cyber Security</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground cyber-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-8 w-8">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "User"}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email || "user@defence.mil"}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border z-30">
          <div className="flex items-center justify-between px-6 h-16">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
