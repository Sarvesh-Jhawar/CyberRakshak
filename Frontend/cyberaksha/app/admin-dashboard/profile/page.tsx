"use client"

import { AdminLayout } from "@/components/dashboard/admin-layout"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Key,
  Bell,
  Monitor,
  Clock,
  CheckCircle,
  Settings,
  Camera,
} from "lucide-react"
import { useState, useEffect, FormEvent } from "react"
import { toast } from "sonner"
import { api, getAuthHeaders } from "@/lib/api"

interface AdminStats {
  total_incidents: number;
  total_users: number;
  resolution_rate: number;
  avg_response_time?: string; // This might not be in the stats endpoint, so optional
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
}

export default function AdminProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
  })
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const headers = getAuthHeaders()
        const response = await fetch(api.admin.profile, { headers })
        if (!response.ok) {
          throw new Error("Failed to fetch admin profile.")
        }
        const data = await response.json()
        setUser(data)
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          department: data.department || "",
        })
      } catch (error: any) {
        toast.error("Error", { description: error.message })
      }
    }

    const fetchStatsAndActivity = async () => {
      try {
        const headers = getAuthHeaders()
        const [statsRes, activityRes] = await Promise.all([
          fetch(api.admin.dashboardStats, { headers }),
          fetch(api.admin.actions, { headers }),
        ])

        if (!statsRes.ok) throw new Error("Failed to fetch admin stats.")
        if (!activityRes.ok) throw new Error("Failed to fetch recent activity.")

        const statsData = await statsRes.json()
        const activityData = await activityRes.json()

        setStats(statsData)
        setRecentActivity(activityData)
      } catch (error: any) {
        toast.error("Error loading page data", { description: error.message })
      }
    }

    fetchProfile()
    fetchStatsAndActivity()
  }, [])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const headers = getAuthHeaders()
      const response = await fetch(api.admin.profile, {
        method: "PUT",
        headers,
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to update profile.")
      const updatedUser = await response.json()
      setUser(updatedUser.data)
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      toast.error("Update Failed", { description: error.message })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords do not match.")
      return
    }
    if (passwordData.new_password.length < 8) {
      toast.error("New password must be at least 8 characters long.")
      return
    }

    try {
      const headers = getAuthHeaders()
      const response = await fetch(api.admin.changePassword, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      })
      if (!response.ok) throw new Error("Failed to change password. Check your current password.")
      toast.success("Password changed successfully!")
      setIsPasswordDialogOpen(false)
    } catch (error: any) {
      toast.error("Update Failed", { description: error.message })
    } finally {
      // Clear password fields for security after the attempt
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    }
  }

  if (!user) return null

  const adminStats = [
    { label: "Incidents Managed", value: stats?.total_incidents ?? 'N/A', icon: Shield },
    { label: "Users Supervised", value: stats?.total_users ?? 'N/A', icon: User },
    { label: "Resolution Rate", value: stats ? `${stats.resolution_rate}%` : 'N/A', icon: Monitor },
    { label: "Avg Response Time", value: stats?.avg_response_time ?? "N/A", icon: Clock },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your administrator account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="cyber-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information and contact details</CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={(e) => (isEditing ? handleSave(e) : setIsEditing(true))}
                  >
                    {isEditing ? "Save Changes" : "Edit Profile"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="/placeholder.svg?height=80&width=80" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {user.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("") || "A"}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 p-0 bg-transparent"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user.name || "Administrator"}</h3>
                    <p className="text-muted-foreground">CERT-Army Administrator</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      <Badge variant="outline">Admin Level</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => handleInputChange("department", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="CERT-Army Division"
                      />
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="cyber-border">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsPasswordDialogOpen(true)}>
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Enabled via SMS</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Security Notifications</p>
                      <p className="text-sm text-muted-foreground">Email alerts for suspicious activity</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin Stats */}
            <Card className="cyber-border">
              <CardHeader>
                <CardTitle>Admin Statistics</CardTitle>
                <CardDescription>Your performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminStats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{stat.label}</span>
                        </div>
                        <span className="font-semibold">{stat.value}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="cyber-border">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.slice(0, 4).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current_password" className="text-right">
                  Current
                </Label>
                <Input
                  id="current_password"
                  name="current_password"
                  type="password"
                  className="col-span-3"
                  value={passwordData.current_password}
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new_password" className="text-right">
                  New
                </Label>
                <Input
                  id="new_password"
                  name="new_password"
                  type="password"
                  className="col-span-3"
                  value={passwordData.new_password}
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirm_password" className="text-right">
                  Confirm
                </Label>
                <Input id="confirm_password" name="confirm_password" type="password" className="col-span-3" value={passwordData.confirm_password} onChange={handlePasswordInputChange} required />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
