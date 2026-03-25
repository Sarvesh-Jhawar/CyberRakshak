"use client"

import { AdminLayout } from "@/components/dashboard/admin-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Users,
  Database,
  Settings,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Lock,
  User as UserIcon,
} from "lucide-react"
import { useState, useEffect } from "react"
import { api, getAuthHeaders } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const systemStatus = [
  { service: "Threat Detection Engine", status: "online", uptime: "99.9%", lastCheck: "2 min ago" },
  { service: "Incident Management System", status: "online", uptime: "99.8%", lastCheck: "1 min ago" },
  { service: "User Authentication", status: "online", uptime: "100%", lastCheck: "30 sec ago" },
  { service: "Email Notification Service", status: "maintenance", uptime: "98.5%", lastCheck: "5 min ago" },
  { service: "Database Backup System", status: "online", uptime: "99.7%", lastCheck: "3 min ago" },
  { service: "Analytics Engine", status: "online", uptime: "99.9%", lastCheck: "1 min ago" },
]

interface AdminAction {
  id: string
  action: string
  user: string
  timestamp: string
  type: string
}

interface User {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN"
  is_active: boolean
  last_login: string | null
}

export default function AdminToolsPage() {
  const [bulkMessage, setBulkMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isUserTableLoading, setIsUserTableLoading] = useState(false)
  const [recentActions, setRecentActions] = useState<AdminAction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showUserManagement, setShowUserManagement] = useState(false)
  const router = useRouter()

  // Fetch recent actions on component mount
  useEffect(() => {
    const fetchRecentActions = async () => {
      try {
        const headers = getAuthHeaders()
        const response = await fetch(api.admin.actions, { headers })
        if (!response.ok) throw new Error("Failed to fetch recent actions.")
        const data = await response.json()
        setRecentActions(data)
      } catch (error: any) {
        toast.error("Error fetching actions", { description: error.message })
      }
    }
    fetchRecentActions()
  }, [])

  // Fetch users when the user management section is shown
  const fetchUsers = async () => {
    setIsUserTableLoading(true)
    try {
      const headers = getAuthHeaders()
      const response = await fetch(api.admin.users, { headers })
      if (!response.ok) throw new Error("Failed to fetch users.")
      const data = await response.json()
      setUsers(data)
    } catch (error: any) {
      toast.error("Error fetching users", { description: error.message })
    } finally {
      setIsUserTableLoading(false)
    }
  }

  const handleManageUsersClick = () => {
    setShowUserManagement(true)
    fetchUsers()
  }

  const handleUserStatusChange = async (userId: string, isActive: boolean) => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(api.admin.updateUserStatus(userId), {
        method: "PUT",
        headers,
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!response.ok) throw new Error("Failed to update user status.")

      toast.success(`User status updated successfully.`)
      fetchUsers() // Refresh user list
    } catch (error: any) {
      toast.error("Update failed", { description: error.message })
    }
  }

  const handleBulkNotification = async (target: "all" | "admins" | "users") => {
    setLoading(true)
    try {
      const headers = getAuthHeaders()
      const response = await fetch(api.admin.bulkNotification, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: bulkMessage, target }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to send notification.")
      }
      toast.success("Bulk notification sent successfully!")
      setBulkMessage("")
    } catch (error: any) {
      toast.error("Notification Failed", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSystemAction = async (action: string, endpoint: string, method: "POST" | "GET" = "POST") => {
    setIsLoading(true)
    try {
      const headers = getAuthHeaders()
      const response = await fetch(endpoint, { method, headers })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Action "${action}" failed.`)
      }

      // Handle file download for export
      if (action === "Data export" && response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const contentDisposition = response.headers.get("content-disposition")
        let fileName = "incidents_export.csv"
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/)
          if (fileNameMatch && fileNameMatch.length > 1) fileName = fileNameMatch[1]
        }
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast.success("Data export started.", { description: "Your file is downloading." })
      } else {
        toast.success(`${action} completed successfully!`)
      }
    } catch (error: any) {
      toast.error("Action Failed", { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "maintenance":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge variant="default" className="bg-green-500">
            Online
          </Badge>
        )
      case "maintenance":
        return <Badge variant="secondary">Maintenance</Badge>
      default:
        return <Badge variant="destructive">Offline</Badge>
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case "user":
        return <Users className="h-4 w-4 text-blue-500" />
      case "system":
        return <Settings className="h-4 w-4 text-gray-500" />
      case "security":
        return <Shield className="h-4 w-4 text-green-500" />
      case "export":
        return <Download className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Tools</h1>
          <p className="text-muted-foreground mt-2">System management and administrative utilities</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cyber-border">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">User Management</p>
                  <p className="text-sm text-muted-foreground">View & manage users</p>
                </div>
              </div>
              <Button className="w-full mt-4" size="sm" onClick={handleManageUsersClick}>
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card className="cyber-border">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Database className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm text-muted-foreground">Last backup: 2h ago</p>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-transparent"
                size="sm"
                variant="outline"
                onClick={() => handleSystemAction("Database backup", api.admin.createBackup)}
                disabled={isLoading}
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Backup Now
              </Button>
            </CardContent>
          </Card>

          <Card className="cyber-border">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Download className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-muted-foreground">Generate reports</p>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-transparent"
                size="sm"
                variant="outline"
                onClick={() => handleSystemAction("Data export", api.admin.exportIncidents, "GET")}
                disabled={isLoading}
              >
                Export Reports
              </Button>
            </CardContent>
          </Card>

          <Card className="cyber-border">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-medium">System Refresh</p>
                  <p className="text-sm text-muted-foreground">Clear cache & reload</p>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-transparent"
                size="sm"
                variant="outline"
                onClick={() => toast.info("System Refresh", { description: "This is a mock action." })}
                disabled={isLoading}
              >
                Refresh System
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Management Table (Conditional) */}
        {showUserManagement && (
          <Card className="cyber-border">
            <CardHeader>
              <CardTitle className="flex items-center"><UserIcon className="mr-2" /> User Management</CardTitle>
              <CardDescription>Activate or deactivate user accounts. <Button variant="link" className="p-0 h-auto" onClick={() => setShowUserManagement(false)}>Hide</Button></CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Status (Active/Inactive)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isUserTableLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Loading users...</TableCell></TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "ADMIN" ? "destructive" : "outline"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}</TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={(checked) => handleUserStatusChange(user.id, checked)}
                            aria-label={`Toggle status for ${user.name}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time status of all system components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemStatus.map((service) => (
                <div key={service.service} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium">{service.service}</p>
                      <p className="text-sm text-muted-foreground">
                        Uptime: {service.uptime} • Last check: {service.lastCheck}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(service.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bulk Notifications */}
          <Card className="cyber-border">
            <CardHeader>
              <CardTitle>Bulk Notifications</CardTitle>
              <CardDescription>Send notifications to all users or specific groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your message here..."
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                rows={4}
              />
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleBulkNotification("all")}
                  disabled={!bulkMessage.trim() || isLoading}
                  className="flex-1"
                > 
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send to All Users
                </Button>
                <Button variant="outline" onClick={() => handleBulkNotification("admins")} disabled={!bulkMessage.trim() || isLoading}>
                  Send to Admins
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Admin Actions */}
          <Card className="cyber-border">
            <CardHeader>
              <CardTitle>Recent Admin Actions</CardTitle>
              <CardDescription>Latest administrative activities and system changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActions.slice(0, 5).map((action) => (
                  <div key={action.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    {getActionIcon(action.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{action.action}</p>
                      <p className="text-xs text-muted-foreground">
                        by {action.user} • {new Date(action.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Settings */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Configure system-wide security policies and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Timeout (minutes)</label>
                <Input type="number" defaultValue="30" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Login Attempts</label>
                <Input type="number" defaultValue="5" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password Min Length</label>
                <Input type="number" defaultValue="8" />
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <Button onClick={() => toast.info("Mock Action", { description: "Security settings update is not implemented." })}>
                <Lock className="h-4 w-4 mr-2" />
                Update Security Settings
              </Button>
              <Button variant="outline">Reset to Defaults</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}