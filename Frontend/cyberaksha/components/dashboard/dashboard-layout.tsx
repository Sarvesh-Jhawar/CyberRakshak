"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Shield,
  FileText,
  History,
  BookOpen,
  HelpCircle,
  LogOut,
  User,
  Menu,
  X,
  Monitor,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface User {
  name: string
  role: "admin" | "user"
  avatar?: string
}

interface SystemStatus {
  online: boolean
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Fetch user info from API
    const fetchUser = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        if (!res.ok) throw new Error("Failed to fetch user info")
        const data: User = await res.json()
        setUser(data)
      } catch (err) {
        router.push("/login")
      }
    }

    // Fetch system status from API
    const fetchSystemStatus = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/dashboard/status", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        if (!res.ok) throw new Error("Failed to fetch system status")
        const data: SystemStatus = await res.json()
        setSystemStatus(data)
      } catch (err) {
        setSystemStatus({ online: false })
      }
    }

    fetchUser()
    fetchSystemStatus()
  }, [router])

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Monitor },
    { name: "File a Complaint", href: "/dashboard/complaint", icon: FileText },
    { name: "Complaint Status", href: "/dashboard/status", icon: History },
    { name: "Playbook", href: "/dashboard/playbook", icon: BookOpen },
    { name: "Help / Support", href: "/dashboard/help", icon: HelpCircle },
    { name: "CERT-Army Dashboard", href: "/dashboard/cert", icon: Shield, adminOnly: true },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ]

  const isActive = (href: string) => pathname === href

  if (!user || !systemStatus) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-sidebar-accent cyber-glow" />
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">Defence Portal</h1>
                <p className="text-xs text-sidebar-foreground/70">Cyber Security</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              if (item.adminOnly && user.role !== "admin") return null
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground cyber-glow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {item.adminOnly && (
                    <span className="ml-auto text-xs bg-sidebar-accent/20 text-sidebar-accent px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-8 w-8">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} />
                ) : (
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {user.role === "admin" ? "Administrator" : "Personnel"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                localStorage.removeItem("token")
                localStorage.removeItem("role")
                router.push("/login")
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navigation Bar */}
        <header className="bg-card border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Cybersecurity Command Center</h2>
                <p className="text-sm text-muted-foreground">Secure • Monitor • Respond</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full animate-pulse ${
                    systemStatus.online ? "bg-primary" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-muted-foreground">
                  {systemStatus.online ? "System Online" : "System Offline"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
