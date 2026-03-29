"use client"

import type React from "react"
import { useState } from "react"
import { Shield, Eye, EyeOff, Mail, Lock, User, Phone, Award as IdCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    serviceId: "",
    relation: "",
    email: "",
    phone: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.relation) {
      alert("Please select a Role before submitting.")
      return
    }

    setIsLoading(true)

    try {
      // Map frontend field names to backend expected field names
      const registrationData = {
        name: formData.name,
        service_id: formData.serviceId || `USR-${Date.now()}`,
        relation: formData.relation,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        unit: "", // Optional field
        clearance_level: "" // Optional field
      }

      const res = await fetch(api.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        console.error("Registration error:", errorData)
        throw new Error(errorData.detail || "Registration failed")
      }

      const result = await res.json()
      console.log("Registration successful:", result)
      alert("Registration successful. Please login.")
      router.push("/login")
    } catch (err: any) {
      console.error("Registration error:", err)
      alert(err.message)
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

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      relation: value,
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
          <p className="text-muted-foreground mt-2">Create your secure account</p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Register</CardTitle>
            <CardDescription className="text-center">Join the cyber safety community for the general public</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* ID (optional) */}
              <div className="space-y-2">
                <Label htmlFor="serviceId">ID (optional)</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="serviceId"
                    name="serviceId"
                    type="text"
                    placeholder="Enter your personal ID (optional)"
                    value={formData.serviceId}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Relation */}
              <div className="space-y-2">
                <Label htmlFor="relation">Role</Label>
                <Select onValueChange={handleSelectChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personnel">Personnel</SelectItem>
                    <SelectItem value="family">Family Member</SelectItem>
                    <SelectItem value="veteran">Veteran</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
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
                {isLoading ? "Creating Account..." : "Register"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By registering, you agree to follow our cybersecurity guidelines.
          </p>
        </div>
      </div>
    </div>
  )
}
