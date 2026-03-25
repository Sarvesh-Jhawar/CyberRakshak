"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/dashboard/admin-layout"
import { api, getAuthHeaders } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Bell, CheckCircle, Clock, User, MessageSquare, Shield, Eye } from "lucide-react"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  user: string
  unit: string
  timestamp: string
  read: boolean
  incidentId: string | null
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all")
  const [notificationList, setNotificationList] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const headers = getAuthHeaders()
        const res = await fetch(api.notifications.list, { headers })
        if (!res.ok) throw new Error("Failed to fetch notifications")
        const data = await res.json()
        setNotificationList(
          Array.isArray(data)
            ? data.map((n: any) => ({
                ...n, // Spread the original properties first
                id: n.id, // Ensure 'id' is correctly mapped from the source
                type: n.type,
                title: n.title,
                message: n.message,
                read: n.is_read,
                timestamp: n.created_at,
              }))
            : []
        )
      } catch (err) {
        console.error("Error fetching notifications:", err)
        setNotificationList([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const filteredNotifications = (notificationList || []).filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "critical") return notification.type === "critical"
    if (filter === "high") return notification.type === "high"
    return true
  })

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(api.notifications.markRead(id), {
        method: "PUT",
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }
      setNotificationList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch(api.notifications.markAllRead, {
        method: "PUT",
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }
      setNotificationList((prev) => prev.map((notification) => ({ ...notification, read: true })))
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err)
    }
  }

  const handleViewIncident = (incidentId: string | null) => {
    if (incidentId) router.push(`/admin-dashboard/incidents?incident_id=${incidentId}`)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "high":
        return <Shield className="h-5 w-5 text-orange-500" />
      case "medium":
        return <Bell className="h-5 w-5 text-yellow-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-blue-500" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "high":
        return <Badge variant="secondary">High</Badge>
      case "medium":
        return <Badge variant="outline">Medium</Badge>
      default:
        return <Badge variant="default">Info</Badge>
    }
  }

  const unreadCount = (notificationList || []).filter((n) => !n.read).length

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-2">
              Real-time alerts and updates from users ({unreadCount} unread)
            </p>
          </div>
          <Button onClick={markAllAsRead} variant="outline">
            Mark All as Read
          </Button>
        </div>

        {/* Filter Tabs */}
        <Card className="cyber-border">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Notifications", count: (notificationList || []).length },
                { key: "unread", label: "Unread", count: unreadCount },
                {
                  key: "critical",
                  label: "Critical",
                  count: (notificationList || []).filter((n) => n.type === "critical").length,
                },
                {
                  key: "high",
                  label: "High Priority",
                  count: (notificationList || []).filter((n) => n.type === "high").length,
                },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={filter === tab.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(tab.key)}
                  className="flex items-center space-x-2"
                >
                  <span>{tab.label}</span>
                  <Badge variant="secondary" className="ml-2">
                    {tab.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cyber-border transition-all hover:bg-muted/50 ${
                !notification.read ? "border-primary bg-primary/5" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">{notification.title}</h3>
                        {getNotificationBadge(notification.type)}
                        {!notification.read && (
                          <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{notification.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-3">{notification.message}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{notification.user}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Shield className="h-4 w-4" />
                          <span>{notification.unit}</span>
                        </div>
                        {notification.incidentId && (
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{notification.incidentId}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {notification.incidentId && (
                          <Button size="sm" variant="outline" onClick={() => handleViewIncident(notification.incidentId)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Incident
                          </Button>
                        )}
                        {!notification.read && (
                          <Button size="sm" variant="ghost" onClick={() => markAsRead(notification.id)}>
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <Card className="cyber-border">
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No notifications found</h3>
              <p className="text-muted-foreground">
                {filter === "unread"
                  ? "All notifications have been read"
                  : "No notifications match the current filter"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
