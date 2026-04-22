"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { FileText, History, BookOpen, HelpCircle, LogOut, User, Menu, X, Monitor } from "lucide-react"
import { ThreatGuardLogo } from "@/components/threatguard-logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { isMockAuthEnabled } from "@/lib/mockAuth"
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
    const fetchUser = async () => {
      try {
        if (isMockAuthEnabled()) {
          // Provide a simple mock user so frontend works offline
          const mockUser = {
            name: localStorage.getItem("role") === "ADMIN" ? "Admin User" : "Regular User",
            email: localStorage.getItem("role") === "ADMIN" ? "admin@cyber.local" : "user@cyber.local",
            avatar: null,
          }
          setUser(mockUser)
          return
        }

        const res = await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        if (!res.ok) throw new Error("Failed to fetch user info")
        const data = await res.json()
        setUser(data)
      } catch (err) {
        router.push("/login")
      }
    }

    fetchUser()
  }, [router])

  const navigation = [
    { name: "Dashboard", href: "/user-dashboard", icon: Monitor },
    { name: "File a Complaint", href: "/user-dashboard/complaint", icon: FileText },
    { name: "Complaint Status", href: "/user-dashboard/status", icon: History },
    { name: "Playbook", href: "/user-dashboard/playbook", icon: BookOpen },
    { name: "Help / Support", href: "/user-dashboard/help", icon: HelpCircle },
    { name: "Profile", href: "/user-dashboard/profile", icon: User },
  ]

  const handleLogout = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/v1/auth/logout", { 
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
    } catch (err) {
      console.warn("Logout API failed, clearing client session anyway")
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("role")
      router.push("/login")
    }
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
            <div className="flex items-center gap-3">
              <ThreatGuardLogo variant="sidebar" />
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">ThreatGuard</h1>
                <p className="text-xs text-sidebar-foreground/60">Cyber Safety</p>
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
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-l-4 border-l-transparent",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-sm border-l-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-l-primary"
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
                <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email || "user@example.com"}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive border-sidebar-border"
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
