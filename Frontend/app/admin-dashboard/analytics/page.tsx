"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminLayout } from "@/components/dashboard/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { AlertTriangle, Shield, Activity, Layers, Loader2 } from "lucide-react"
import { api, getAuthHeaders } from "@/lib/api"
import { cn } from "@/lib/utils"

const COLORS = ["#22c55e", "#f59e0b", "#f97316", "#ef4444"] // Low, Medium, High, Critical

interface RiskData {
  risk_levels: { name: string; count: number; color: string }[]
  category_distribution: { [key: string]: number }
  high_risk_percentage: number
}

interface PriorityData {
  priority_incidents: {
    id: string
    category: string
    priority: string
    unit: string
    created_at: string
  }[]
  priority_distribution: { [key: string]: number }
}

interface HeatmapData {
  heatmap_data: {
    unit: string
    incident_count: number
    risk_level: "low" | "medium" | "high" | "critical"
  }[]
}

export default function AnalyticsPage() {
  const [riskData, setRiskData] = useState<RiskData | null>(null)
  const [priorityData, setPriorityData] = useState<PriorityData | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const headers = getAuthHeaders()
        if (!headers) {
          throw new Error("Authentication token not found.")
        }

        const [riskRes, priorityRes, heatmapRes] = await Promise.all([
          fetch(api.admin.incidentsRisk, { headers }),
          fetch(api.admin.incidentsPriority, { headers }),
          fetch(api.admin.incidentsHeatmap, { headers }),
        ])

        if (!riskRes.ok || !priorityRes.ok || !heatmapRes.ok) {
          throw new Error("Failed to fetch analytics data. Please check network and authentication.")
        }

        const risk = await riskRes.json()
        const priority = await priorityRes.json()
        const heatmap = await heatmapRes.json()

        setRiskData(risk)
        setPriorityData(priority)
        setHeatmapData(heatmap)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading Risk Analytics...</span>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center text-red-500 p-8 bg-red-500/10 rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
          <h2 className="text-xl font-bold">Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </AdminLayout>
    )
  }

  if (!riskData || !priorityData || !heatmapData) {
    return (
      <AdminLayout>
        <div className="text-center text-muted-foreground p-8">No analytics data available.</div>
      </AdminLayout>
    )
  }

  const categoryChartData = Object.entries(riskData.category_distribution).map(([name, value]) => ({ name, count: value }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Risk Analytics</h1>
          <p className="text-muted-foreground mt-2">
            In-depth analysis of incident risks and priorities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-1 cyber-border">
            <CardHeader>
              <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-primary" />Risk Level Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                   <Pie data={riskData.risk_levels} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                     {riskData.risk_levels.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                   <Legend />
                 </PieChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
 
           <Card className="lg:col-span-1 cyber-border">
             <CardHeader>
               <CardTitle className="flex items-center"><Layers className="mr-2 h-5 w-5 text-primary" />Incident Category Distribution</CardTitle>
             </CardHeader>
             <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={categoryChartData}>
                   <XAxis dataKey="name" />
                   <YAxis />
                   <Tooltip />
                   <Bar dataKey="count" fill="#8884d8" />
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
         </div>
 
         <Card className="cyber-border">
           <CardHeader>
             <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" />High & Critical Priority Incidents</CardTitle>
             <CardDescription>Incidents requiring immediate attention.</CardDescription>
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Incident ID</TableHead>
                   <TableHead>Category</TableHead>
                   <TableHead>Priority</TableHead>
                   <TableHead>Unit</TableHead>
                   <TableHead>Reported At</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {priorityData.priority_incidents.length > 0 ? (
                   priorityData.priority_incidents.map((incident) => (
                     <TableRow key={incident.id}>
                       <TableCell className="font-medium">{incident.id}</TableCell>
                       <TableCell>{incident.category}</TableCell>
                       <TableCell>
                         <Badge
                           variant={incident.priority.toLowerCase() === "critical" ? "destructive" : "default"}
                           className={cn(incident.priority.toLowerCase() === "high" && "bg-orange-500 text-white")}
                         >
                           {incident.priority}
                         </Badge>
                       </TableCell>
                       <TableCell>{incident.unit}</TableCell>
                       <TableCell>{new Date(incident.created_at).toLocaleString()}</TableCell>
                     </TableRow>
                   ))
                 ) : (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center">
                       No high or critical priority incidents at the moment.
                     </TableCell>
                   </TableRow>
                 )}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
 
         <Card className="cyber-border">
           <CardHeader>
             <CardTitle className="flex items-center"><Shield className="mr-2 h-5 w-5 text-primary" />Unit Risk Heatmap</CardTitle>
             <CardDescription>Incident concentration across different units.</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {heatmapData.heatmap_data.map((unit) => (
                 <div
                   key={unit.unit}
                   className={cn(
                     "p-4 rounded-lg border flex flex-col items-center justify-center text-center",
                     {
                       "bg-red-500/20 border-red-500": unit.risk_level === "critical",
                       "bg-orange-500/20 border-orange-500": unit.risk_level === "high",
                       "bg-yellow-500/20 border-yellow-500": unit.risk_level === "medium",
                       "bg-green-500/20 border-green-500": unit.risk_level === "low",
                     }
                   )}
                 >
                   <p className="font-bold text-lg">{unit.unit}</p>
                   <p className="text-2xl font-extrabold">{unit.incident_count}</p>
                   <p className="text-sm text-muted-foreground">Incidents</p>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
      </div>
    </AdminLayout>
  )
}
