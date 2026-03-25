"use client"

import type React from "react"
import { useState, useEffect, FormEvent } from "react"
import { UserLayout } from "@/components/dashboard/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Shield, Edit, Save, X, Award as IdCard, Sun, Moon, Monitor } from "lucide-react"
import { api, getAuthHeaders } from "@/lib/api"
import { isMockAuthEnabled } from "@/lib/mockAuth"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [user, setUser] = useState<any>(null) // Keep for initial load check and non-form data like avatar
  const [formData, setFormData] = useState({
    name: "",
    service_id: "",
    relation: "",
    email: "",
    phone: "",
  })
  const [isActive, setIsActive] = useState(true);
  const [originalFormData, setOriginalFormData] = useState(formData)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isMockAuthEnabled()) {
          const mock = {
            name: "Mock User",
            service_id: "MOCK123",
            relation: "Officer",
            email: localStorage.getItem("role") === "ADMIN" ? "admin@cyber.local" : "user@cyber.local",
            phone: "",
            is_active: true,
            avatar: null,
          }
          setIsActive(mock.is_active)
          setUser(mock)
          const initialData = {
            name: mock.name,
            service_id: mock.service_id,
            relation: mock.relation,
            email: mock.email,
            phone: mock.phone,
          }
          setFormData(initialData)
          setOriginalFormData(initialData)
          return
        }
        const headers = getAuthHeaders()
        const response = await fetch(api.auth.me, { headers })
        if (!response.ok) throw new Error("Failed to fetch profile.")
        const data = await response.json()
        setIsActive(data.is_active);
        setUser(data)
        const initialData = {
          name: data.name || "",
          service_id: data.service_id || "",
          relation: data.relation || "",
          email: data.email || "",
          phone: data.phone || "",
        }
        setFormData(initialData)
        setOriginalFormData(initialData)
      } catch (error: any) {
        toast.error("Error loading profile", { description: error.message })
      }
    }
    fetchProfile()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const headers = getAuthHeaders()
      const response = await fetch(api.auth.me, {
        method: "PUT",
        headers,
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to update profile.")
      const updatedUser = await response.json()
      setUser(updatedUser.data) // Update user state with fresh data from backend
      setOriginalFormData(formData) // Update original data to new saved state
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      toast.error("Update Failed", { description: error.message })
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData(originalFormData)
    setIsEditing(false)
  }

  if (!user) {
    // You can return a loading spinner here
    return <UserLayout><div>Loading profile...</div></UserLayout>
  }

  return (
    <UserLayout>
      <form className="space-y-6" onSubmit={handleSave}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground">Manage your account information and security settings</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar || "/placeholder.svg?height=96&width=96"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">{formData.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">{formData.name}</h3>
                  <p className="text-sm text-muted-foreground">{formData.service_id}</p>
                  <Badge variant="outline" className="mt-2">
                    {formData.relation}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={isActive ? "outline-green" : "outline"} className={!isActive ? "text-yellow-600 border-yellow-600" : ""}>
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="service_id">ID (optional)</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="service_id"
                      name="service_id"
                      value={formData.service_id}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="relation">Role</Label>
                    <Select
                      value={formData.relation}
                      onValueChange={(value) => handleSelectChange("relation", value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General public">General public</SelectItem>
                        <SelectItem value="Organization">Organization</SelectItem>
                        <SelectItem value="IT professional">IT professional</SelectItem>
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Security Settings</span>
            </CardTitle>
            <CardDescription>Manage your account security and access preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Badge variant="outline" className="risk-low">
                    Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">Theme</h4>
                    <p className="text-sm text-muted-foreground">Choose your preferred color theme</p>
                  </div>
                  {mounted ? (
                    <Select
                      value={theme || "light"}
                      onValueChange={(value) => setTheme(value)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <div className="flex items-center gap-2">
                          {theme === "dark" ? (
                            <Moon className="h-4 w-4" />
                          ) : theme === "system" ? (
                            <Monitor className="h-4 w-4" />
                          ) : (
                            <Sun className="h-4 w-4" />
                          )}
                          <SelectValue>
                            {theme === "dark" ? "Dark" : theme === "system" ? "System" : "Light"}
                          </SelectValue>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            <span>Light</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            <span>Dark</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span>System</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-[160px] h-10 flex items-center justify-center text-sm text-muted-foreground">
                      Loading...
                    </div>
                  )}
                </div>

              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Login Notifications</h4>
                    <p className="text-sm text-muted-foreground">Get notified of account access</p>
                  </div>
                  <Badge variant="outline" className="risk-low">
                    Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Session Timeout</h4>
                    <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <span className="text-sm font-medium">30 minutes</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex space-x-4">
                <Button variant="outline">Change Password</Button>
                <Button variant="outline">Download Security Report</Button>
                <Button variant="outline">View Login History</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </UserLayout>
  )
}
