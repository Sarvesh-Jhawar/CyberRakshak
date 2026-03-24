"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { AdminLayout } from "@/components/dashboard/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Search, MessageSquare, Clock, User, FileText, ExternalLink } from "lucide-react"

// ✅ Later we’ll replace this with actual FastAPI endpoint
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000"

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ✅ Fetch incidents from backend API
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/incidents`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        if (!res.ok) throw new Error("Failed to fetch incidents")
        const data = await res.json()
        // Ensure data is an array and has proper structure
        const incidentsArray = Array.isArray(data) ? data : []
        setIncidents(incidentsArray)
      } catch (error) {
        console.error("Error fetching incidents:", error)
        setIncidents([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    fetchIncidents()
  }, [])

  const handleSelectIncident = async (incident: any) => {
    if (selectedIncident?.id === incident.id) {
      setSelectedIncident(null) // Deselect if clicking the same one
      return
    }
    setIsDetailLoading(true)
    setSelectedIncident(incident) // Show basic info immediately
    try {
      const res = await fetch(`${API_BASE}/api/v1/incidents/${incident.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (!res.ok) throw new Error("Failed to fetch incident details")
      const detailedData = await res.json()
      setSelectedIncident(detailedData)
    } catch (error) {
      console.error("Error fetching incident details:", error)
      // Keep basic data if details fail to load
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string | null) => {
    if (!newStatus || !selectedIncident) return
    try {
      const res = await fetch(`${API_BASE}/api/v1/incidents/${selectedIncident.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      // Optimistically update the UI
      setSelectedIncident({ ...selectedIncident, status: newStatus })
      setIncidents(incidents.map((inc) => (inc.id === selectedIncident.id ? { ...inc, status: newStatus } : inc)))
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status.")
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedIncident) return
    setIsSubmitting(true)
    try {
      await fetch(`${API_BASE}/api/v1/incidents/${selectedIncident.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ text: newComment }),
      })
      // Refresh the incident details to show the new comment
      const refreshedIncident = await fetchIncidentDetails(selectedIncident.id);
      setSelectedIncident(refreshedIncident);
      setIncidents(incidents.map(inc => inc.id === selectedIncident.id ? refreshedIncident : inc));
      setNewComment("")
      setIsCommentDialogOpen(false)
    } catch (error) {
      console.error("Error adding comment:", error)
      alert("Failed to add comment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchIncidentDetails = async (id: string) => {
    const res = await fetch(`${API_BASE}/api/v1/incidents/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch incident details");
    const detailedData = await res.json();
    return detailedData;
  }

  // A simple function to check if the file is an image based on its extension
  const isImageFile = (filename: string | null | undefined) => {
    if (!filename) return false
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
  }

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      (incident.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (incident.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (incident.reporter_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === "all" || (incident.severity || "").toLowerCase() === severityFilter
    const matchesStatus = statusFilter === "all" || (incident.status || "").toLowerCase().replace(" ", "-") === statusFilter

    return matchesSearch && matchesSeverity && matchesStatus
  })

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "destructive"
      case "high":
        return "secondary"
      case "medium":
        return "default"
      default:
        return "default"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Under Review":
        return "text-yellow-500"
      case "Resolved":
      case "Closed":
        return "text-green-500"
      case "Pending":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Incident Management</h1>
          <p className="text-muted-foreground mt-2">Monitor and manage all cybersecurity incidents</p>
        </div>

        {/* Filters */}
        <Card className="cyber-border">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search incidents, IDs, or reporters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
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
          </CardContent>
        </Card>

        {/* Incidents List & Details */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading incidents...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incidents Table */}
            <div className="lg:col-span-1">
              <Card className="cyber-border">
                <CardHeader>
                  <CardTitle>Incidents ({filteredIncidents.length})</CardTitle>
                  <CardDescription>Click on an incident to view details</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredIncidents.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {incidents.length === 0 ? "No incidents found" : "No incidents match your filters"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredIncidents.map((incident) => (
                      <div
                        key={incident.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                          selectedIncident?.id === incident.id ? "bg-muted border-primary" : "bg-card"
                        }`}
                        onClick={() => handleSelectIncident(incident)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle
                                className={`h-4 w-4 ${
                                  incident.severity === "Critical"
                                    ? "text-red-500"
                                    : incident.severity === "High"
                                    ? "text-orange-500"
                                    : "text-yellow-500"
                                }`}
                              />
                              <span className="font-medium text-sm">{incident.id || "N/A"}</span>
                              <Badge variant={getSeverityColor(incident.severity)}>{incident.severity || "Unknown"}</Badge>
                            </div>
                            <h3 className="font-medium text-sm mb-1">{incident.title || "Untitled Incident"}</h3>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{incident.reporter_name || "Unknown"}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {incident.created_at ? format(new Date(incident.created_at), "PPp") : "Unknown"}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-medium ${getStatusColor(incident.status)}`}>
                              {incident.status || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{incident.unit || "N/A"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Incident Details */}
            <div className="lg:col-span-1">
              <Card className="cyber-border">
                <CardHeader>
                  <CardTitle>Incident Details</CardTitle>
                  <CardDescription>
                    {selectedIncident
                      ? "Detailed information about the selected incident"
                      : "Select an incident to view details"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isDetailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading details...</p>
                      </div>
                    </div>
                  ) : !selectedIncident ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Select an incident from the list to view details</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedIncident.title || "Untitled Incident"}</h3>
                        <p className="text-sm text-muted-foreground">{selectedIncident.id || "N/A"}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Severity</p>
                          <Badge variant={getSeverityColor(selectedIncident.severity)}>
                            {selectedIncident.severity || "Unknown"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          <p className={`text-sm ${getStatusColor(selectedIncident.status)}`}>
                            {selectedIncident.status || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Reporter</p>
                          <p className="text-sm">{selectedIncident.reporter_name || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Unit</p>
                          <p className="text-sm">{selectedIncident.unit || "N/A"}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Description</p>
                        <p className="text-sm text-muted-foreground">{selectedIncident.description || "No description available"}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Comments</p>
                        <div className="space-y-3 max-h-48 overflow-y-auto bg-muted/50 p-3 rounded-lg">
                          {selectedIncident.comments && selectedIncident.comments.length > 0 ? (
                            selectedIncident.comments.map((comment: any, index: number) => (
                              <div key={index} className="text-sm">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                  <span className="font-medium text-foreground">{comment.author_name}</span>
                                  <span>{format(new Date(comment.created_at), "PPp")}</span>
                                </div>
                                <p>{comment.text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Evidence</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedIncident.evidence_files && selectedIncident.evidence_files.length > 0 ? (
                            selectedIncident.evidence_files.map((file: string, index: number) => {
                              const evidenceUrl = `${API_BASE}/media/${file}`
                              return (
                                <div key={index}>
                                  {isImageFile(file) ? (
                                    <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                                      <img src={evidenceUrl} alt="Evidence" className="mt-2 rounded-md border max-w-xs" />
                                    </a>
                                  ) : (
                                    <a href={evidenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-2 bg-muted rounded hover:bg-muted/80">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm truncate">{file}</span>
                                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                    </a>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">No evidence files available</p>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-4">
                        <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="flex-1">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Comment
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Comment to {selectedIncident.id}</DialogTitle>
                              <DialogDescription>
                                Your comment will be visible to other administrators.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="comment">Comment</Label>
                                <Textarea
                                  id="comment"
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Type your comment here..."
                                  className="min-h-[100px]"
                                />
                              </div>
                            </div>
                            <Button onClick={handleAddComment} disabled={isSubmitting}>
                              {isSubmitting ? "Submitting..." : "Submit Comment"}
                            </Button>
                          </DialogContent>
                        </Dialog>
                        <Select onValueChange={(value) => handleUpdateStatus(value)} value={selectedIncident.status}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Under Review">Under Review</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
