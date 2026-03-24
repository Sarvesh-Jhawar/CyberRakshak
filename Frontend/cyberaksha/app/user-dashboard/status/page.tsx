"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { UserLayout } from "@/components/dashboard/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { History, Search, Filter, AlertTriangle, CheckCircle, Clock, XCircle, Loader2, MessageSquare } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000"

export default function StatusPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null)
  const [riskFilter, setRiskFilter] = useState("all")

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/v1/incidents`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        if (!res.ok) throw new Error("Failed to fetch complaints")
        const data: any[] = await res.json()

        // Fetch full details for each incident to get comments
        const detailedComplaints = await Promise.all(
          data.map(async (complaint) => {
            const detailRes = await fetch(`${API_BASE}/api/v1/incidents/${complaint.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            return detailRes.ok ? detailRes.json() : complaint
          })
        )
        setComplaints(detailedComplaints)
      } catch (error) {
        console.error("Error fetching complaints:", error)
        setComplaints([])
      } finally {
        setLoading(false)
      }
    }
    fetchComplaints()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4" />
      case "Under Review":
        return <AlertTriangle className="h-4 w-4" />
      case "Resolved":
        return <CheckCircle className="h-4 w-4" />
      case "Closed":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "Under Review":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "Resolved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "Closed":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "risk-low"
      case "Medium":
        return "risk-medium"
      case "High":
        return "risk-high"
      case "Critical":
        return "risk-critical"
      default:
        return "risk-low"
    }
  }

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || complaint.status.toLowerCase().replace(" ", "-") === statusFilter
    const matchesRisk = riskFilter === "all" || complaint.severity.toLowerCase() === riskFilter

    return matchesSearch && matchesStatus && matchesRisk
  })

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Complaint Status & History</h1>
            <p className="text-muted-foreground">Track your cybersecurity incident reports</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, category, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Level</label>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredComplaints.length} of {complaints.length} complaints
          </p>
        </div>

        {/* Complaints Table */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle>Incident Reports</CardTitle>
            <CardDescription>Your submitted cybersecurity incident reports and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your reports...</p>
                  </div>
                </div>
              ) : (
                <>
                  {filteredComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className={`border border-border rounded-lg p-4 transition-colors ${
                        selectedComplaint === complaint.id ? "bg-accent/50" : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-sm font-medium text-primary">{complaint.id}</span>
                            <Badge variant="outline" className={getStatusColor(complaint.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(complaint.status)}
                                <span>{complaint.status}</span>
                              </div>
                            </Badge>
                            <Badge variant="outline" className={getRiskColor(complaint.severity)}>
                              {complaint.severity}
                            </Badge>
                          </div>

                          <div>
                            <h3 className="font-medium text-foreground">{complaint.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{complaint.description}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Submitted:</span>{" "}
                              {format(new Date(complaint.created_at), "PP")}
                            </div>
                            <div>
                              <span className="font-medium">Last Updated:</span>{" "}
                              {format(new Date(complaint.updated_at), "PP")}
                            </div>
                            <div>
                              <span className="font-medium">Assigned To:</span> {complaint.assigned_to || "Pending"}
                            </div>
                          </div>

                          {complaint.comments && complaint.comments.length > 0 && (
                            <Accordion
                              type="single"
                              collapsible
                              className="w-full"
                              value={selectedComplaint || ""}
                              onValueChange={setSelectedComplaint}
                            >
                              <AccordionItem value={complaint.id} className="border-none">
                                <AccordionTrigger className="text-xs text-primary hover:no-underline p-0">
                                  <div className="flex items-center space-x-1">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>View {complaint.comments.length} comment(s)</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 text-xs space-y-2">
                                  {complaint.comments.map((comment: any, index: number) => (
                                    <div key={index} className="p-2 bg-background rounded-md">
                                      <p className="font-medium text-foreground">{comment.author_name}</p>
                                      <p className="text-muted-foreground">{comment.text}</p>
                                    </div>
                                  ))}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}

                          {/* Display Comments */}
                          {complaint.comments && complaint.comments.length > 0 && (
                            <div className="mt-2 text-xs">
                              <p className="font-medium text-foreground">Comments:</p>
                              <div className="space-y-2 mt-1">
                                {complaint.comments.map((comment: any, index: number) => (
                                  <div key={index} className="p-2 bg-background rounded-md">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium text-foreground">{comment.author_name}</span>
                                      <span className="text-muted-foreground">
                                        {format(new Date(comment.created_at), "PPp")}
                                      </span>
                                    </div>
                                    <p className="text-muted-foreground">{comment.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Display Admin Notes as Comments */}
                          {complaint.admin_notes && (
                             <div className="mt-2 text-xs">
                               <p className="font-medium text-foreground">Admin Notes:</p>
                               <div className="p-2 bg-background rounded-md mt-1">
                                 <p className="text-muted-foreground">{complaint.admin_notes}</p>
                               </div>
                             </div>
                          )}

                          {/* Display Resolution Notes */}
                          {complaint.resolution_notes && (
                            <div className="mt-2 text-xs">
                              <p className="font-medium text-foreground">Resolution Notes:</p>
                              <div className="p-2 bg-background rounded-md mt-1">
                                <p className="text-muted-foreground">{complaint.resolution_notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!loading && filteredComplaints.length === 0 && (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No complaints found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || riskFilter !== "all"
                      ? "Try adjusting your search criteria"
                      : "You haven't submitted any incident reports yet"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  )
}
