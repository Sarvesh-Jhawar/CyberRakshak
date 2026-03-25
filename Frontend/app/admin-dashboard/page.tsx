"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/dashboard/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { AlertTriangle, Users, TrendingUp, Clock } from "lucide-react"

export default function AdminDashboard() {
  // State for different datasets
  const [incidentData, setIncidentData] = useState<any[]>([])
  const [riskData, setRiskData] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [priorityIncidents, setPriorityIncidents] = useState<any[]>([])
  const [heatmap, setHeatmap] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, incidentsRes, riskRes, priorityRes, heatmapRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/admin/dashboard/stats", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }),
          fetch("http://127.0.0.1:8000/api/v1/admin/incidents/trends", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }),
          fetch("http://127.0.0.1:8000/api/v1/admin/incidents/risk", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }),
          fetch("http://127.0.0.1:8000/api/v1/admin/incidents/priority", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }),
          fetch("http://127.0.0.1:8000/api/v1/admin/incidents/heatmap", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }),
        ])

        setStats(await statsRes.json())
        setIncidentData(await incidentsRes.json())
        setRiskData(await riskRes.json())
        setPriorityIncidents(await priorityRes.json())
        setHeatmap(await heatmapRes.json())
      } catch (err) {
        console.error("Failed to fetch admin dashboard data:", err)
      }
    }

    fetchData()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">CERT-Army Command Center</h1>
          <p className="text-muted-foreground mt-2">Real-time cybersecurity incident monitoring and response</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cyber-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open Incidents</p>
                    <p className="text-3xl font-bold text-red-500">{stats.open_incidents || 0}</p>
                    <p className="text-sm text-muted-foreground">Require attention</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-3xl font-bold text-primary">{stats.active_users || 0}</p>
                    <p className="text-sm text-muted-foreground">Total: {stats.total_users || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                    <p className="text-3xl font-bold text-green-500">{stats.resolution_rate || 0}%</p>
                    <p className="text-sm text-muted-foreground">Resolved: {stats.resolved_incidents || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Incidents</p>
                    <p className="text-3xl font-bold text-yellow-500">{stats.total_incidents || 0}</p>
                    <p className="text-sm text-muted-foreground">Recent: {stats.recent_incidents || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Trends */}
          <Card className="cyber-border">
            <CardHeader>
              <CardTitle>Incident Trends</CardTitle>
              <CardDescription>Monthly incident reports and resolution rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incidentData.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="cyber-border">
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Current threat level breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskData.risk_levels || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {(riskData.risk_levels || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || "#8884d8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Priority Incidents */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle>Priority Incidents</CardTitle>
            <CardDescription>High-priority incidents requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(priorityIncidents.priority_incidents || []).length > 0 ? (
                (priorityIncidents.priority_incidents || []).map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <AlertTriangle
                        className={`h-5 w-5 ${incident.priority === "High" ? "text-red-500" : "text-orange-500"}`}
                      />
                      <div>
                        <p className="font-medium">{incident.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {incident.id} • {incident.unit || "Unknown Unit"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={incident.priority === "High" ? "destructive" : "secondary"}>
                        {incident.priority}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{incident.created_at}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No priority incidents at this time</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Threat Heatmap */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle>Organizational Threat Heatmap</CardTitle>
            <CardDescription>Risk levels across different departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(heatmap.heatmap_data || []).length > 0 ? (
                (heatmap.heatmap_data || []).map((unit) => (
                  <div
                    key={unit.unit}
                    className={`p-4 rounded-lg text-center transition-all hover:scale-105 ${
                      unit.risk_level === "critical"
                        ? "bg-red-500/20 border border-red-500"
                        : unit.risk_level === "high"
                        ? "bg-orange-500/20 border border-orange-500"
                        : unit.risk_level === "medium"
                        ? "bg-yellow-500/20 border border-yellow-500"
                        : "bg-green-500/20 border border-green-500"
                    }`}
                  >
                    <p className="font-medium text-sm">{unit.unit}</p>
                    <p className="text-2xl font-bold mt-2">{unit.incident_count}</p>
                    <p className="text-xs text-muted-foreground">incidents</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <p>No heatmap data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
