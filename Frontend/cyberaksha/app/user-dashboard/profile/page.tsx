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
import { User, Mail, Phone, Shield, Edit, Save, X, Award as IdCard } from "lucide-react"
import { api, getAuthHeaders } from "@/lib/api"
import { toast } from "sonner"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [user, setUser] = useState<any>(null) // Keep for initial load check and non-form data like avatar
  const [formData, setFormData] = useState({
    name: "",
    service_id: "",
    relation: "",
    email: "",
    phone: "",
    unit: "",
    clearance_level: "",
  })
  const [isActive, setIsActive] = useState(true);
  const [originalFormData, setOriginalFormData] = useState(formData)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
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
          unit: data.unit || "",
          clearance_level: data.clearance_level || "",
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
                <Button className="cyber-glow" type="submit">
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
          <Card className="cyber-border">
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
                  <span className="text-sm text-muted-foreground">Unit</span>
                  <span className="text-sm font-medium">{formData.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Clearance</span>
                  <Badge variant="outline" className="risk-medium">
                    {formData.clearance_level}
                  </Badge>
                </div>
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
          <Card className="cyber-border lg:col-span-2">
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
                  <Label htmlFor="service_id">Service ID</Label>
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
                  <Label htmlFor="relation">Relation</Label>
                  <Select
                    value={formData.relation}
                    onValueChange={(value) => handleSelectChange("relation", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personnel">Personnel</SelectItem>
                      <SelectItem value="Family">Family</SelectItem>
                      <SelectItem value="Veteran">Veteran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleSelectChange("unit", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cyber Command">Cyber Command</SelectItem>
                      <SelectItem value="Intelligence">Intelligence</SelectItem>
                      <SelectItem value="Communications">Communications</SelectItem>
                      <SelectItem value="IT Security">IT Security</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Logistics">Logistics</SelectItem>
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
        <Card className="cyber-border">
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
                  <div>
                    <h4 className="font-medium text-foreground">Security Clearance</h4>
                    <p className="text-sm text-muted-foreground">Current clearance level</p>
                  </div>
                  <Badge variant="outline" className="risk-medium">
                    {formData.clearance_level}
                  </Badge>
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
