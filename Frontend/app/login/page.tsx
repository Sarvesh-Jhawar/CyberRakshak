"use client"

import type React from "react"
import { useState } from "react"
import { Shield, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { mockLogin, isMockAuthEnabled } from "@/lib/mockAuth"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    console.log("[Login] submit", formData)
    try {
      let data
      if (isMockAuthEnabled()) {
        data = await mockLogin(formData)
        console.log("[Login] mockLogin returned", data)
      } else {
        const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!res.ok) {
          throw new Error("Invalid credentials")
        }
        data = await res.json()
      }

      if (!data.access_token) throw new Error("Login failed")

      // Clear previous session and store user + token in localStorage
      localStorage.clear()
      localStorage.setItem("token", data.access_token)
      localStorage.setItem("role", data.role)

      // Redirect based on role
      if (data.role === "ADMIN") {
        console.log("[Login] redirecting to admin-dashboard")
        router.push("/admin-dashboard")
      } else {
        console.log("[Login] redirecting to user-dashboard")
        router.push("/user-dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      // err may be unknown; coerce to string message
      const msg = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err)
      setError(msg || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">ThreatGuard</h1>
          <p className="text-muted-foreground mt-2">Welcome Back</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Sign In"}
              </Button>
              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
            </form>

            <div className="mt-4 text-xs text-muted-foreground">
              <p>Test mock accounts: <strong>admin@cyber.local / admin123</strong> or <strong>user@cyber.local / user123</strong></p>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                New user?{" "}
                <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Secure Login. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  )
}
