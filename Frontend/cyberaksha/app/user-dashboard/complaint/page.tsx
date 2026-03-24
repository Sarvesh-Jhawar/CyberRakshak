'use client'

import type React from "react"
import { useState, useEffect } from "react"
import { UserLayout } from "@/components/dashboard/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Upload, CheckCircle, FileText, ImageIcon, Video, Mic } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ComplaintPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    title: searchParams.get("title") || "",
    category: searchParams.get("category") || "",
    description: searchParams.get("description") || "",
    evidenceType: "",
    evidenceText: "",
    evidenceUrl: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string>("")
  const router = useRouter()

  const categories = [
    { value: "phishing", label: "Phishing Attack" },
    { value: "malware", label: "Malware Detection" },
    { value: "fraud", label: "Fraud Attempt" },
    { value: "espionage", label: "Espionage Threat" },
    { value: "opsec", label: "OPSEC Risk" },
  ]

  const evidenceTypes = [
    { value: "text", label: "Text Description", icon: FileText },
    { value: "url", label: "URL/Link", icon: FileText },
    { value: "image", label: "Images", icon: ImageIcon },
    { value: "video", label: "Video", icon: Video },
    { value: "audio", label: "Audio", icon: Mic },
    { value: "file", label: "File Upload", icon: Upload },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
  
    try {
      // Use FormData for file uploads
      const submissionData = new FormData()
      submissionData.append("title", formData.title)
      submissionData.append("category", formData.category)
      submissionData.append("description", formData.description)
      if (formData.evidenceType) submissionData.append("evidence_type", formData.evidenceType)
      if (formData.evidenceText) submissionData.append("evidence_text", formData.evidenceText)
      if (formData.evidenceUrl) submissionData.append("evidence_url", formData.evidenceUrl)
      if (file) {
        submissionData.append("evidence", file)
      }

      // Submit to backend
      const response = await fetch("http://127.0.0.1:8000/api/v1/incidents", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: submissionData
      })

      if (!response.ok) {
        throw new Error("Failed to submit incident")
      }

      const result = await response.json()
      console.log("Incident submitted successfully:", result)

      // Store the incident ID for display
      setSubmittedIncidentId(result.data?.incident_id || "Unknown")
      setIsSubmitting(false)
      setShowSuccess(true)

      // Reset form after success
      setTimeout(() => {
        setShowSuccess(false)
        router.push("/user-dashboard/status")
      }, 3000)

    } catch (error) {
      console.error("Error submitting incident:", error)
      alert("Failed to submit incident. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="cyber-border max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-primary mx-auto cyber-glow" />
                <h2 className="text-2xl font-bold text-foreground">Complaint Submitted</h2>
                <p className="text-muted-foreground">
                  Your cybersecurity incident has been successfully reported. You will be redirected to view your
                  complaint status.
                </p>
                <div className="text-sm text-primary">
                  Complaint ID: <span className="font-mono">{submittedIncidentId}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">File a Complaint</h1>
            <p className="text-muted-foreground">Report a cybersecurity incident or threat</p>
          </div>
        </div>

        {/* Form */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle>Incident Report Form</CardTitle>
            <CardDescription>
              Provide detailed information about the cybersecurity incident. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Incident Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Suspicious Email from External Source"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Incident Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the type of incident" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Incident Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide a detailed description of the incident, including when it occurred, what happened, and any immediate actions taken..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="min-h-[120px]"
                  required
                />
              </div>

              {/* Evidence Type */}
              <div className="space-y-2">
                <Label htmlFor="evidenceType">Evidence Type</Label>
                <Select onValueChange={(value) => handleSelectChange("evidenceType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the type of evidence you want to provide" />
                  </SelectTrigger>
                  <SelectContent>
                    {evidenceTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Evidence Input - Dynamic based on type */}
              {formData.evidenceType && (
                <div className="space-y-2">
                  <Label htmlFor="evidence">Evidence</Label>
                  {formData.evidenceType === "text" && (
                    <Textarea
                      id="evidenceText"
                      name="evidenceText"
                      placeholder="Provide additional text evidence or details..."
                      value={formData.evidenceText}
                      onChange={handleInputChange}
                      className="min-h-[80px]"
                    />
                  )}
                  {formData.evidenceType === "url" && (
                    <Input
                      id="evidenceUrl"
                      name="evidenceUrl"
                      type="url"
                      placeholder="https://suspicious-website.com"
                      value={formData.evidenceUrl}
                      onChange={handleInputChange}
                    />
                  )}
                  {(formData.evidenceType === "image" ||
                    formData.evidenceType === "video" ||
                    formData.evidenceType === "audio" ||
                    formData.evidenceType === "file") && (
                    <div className="border-2 border-dashed border-border rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <Label htmlFor="fileUpload" className="cursor-pointer">
                          <span className="text-primary hover:text-primary/80">Click to upload</span> or drag and drop
                        </Label>
                        <Input
                          id="fileUpload"
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          accept={
                            formData.evidenceType === "image"
                              ? "image/*"
                              : formData.evidenceType === "video"
                                ? "video/*"
                                : formData.evidenceType === "audio"
                                  ? "audio/*"
                                  : "*/*"
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.evidenceType === "image" && "PNG, JPG, GIF up to 10MB"}
                          {formData.evidenceType === "video" && "MP4, AVI, MOV up to 100MB"}
                          {formData.evidenceType === "audio" && "MP3, WAV, M4A up to 50MB"}
                          {formData.evidenceType === "file" && "Any file type up to 50MB"}
                        </p>
                      </div>
                      {file && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Selected file:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>{file.name}</span>
                              <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" className="cyber-glow" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Complaint"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Security Notice</p>
                <p className="text-muted-foreground">
                  All incident reports are classified and will be handled according to defence cybersecurity protocols.
                  Do not include any classified information beyond what is necessary for incident resolution.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  )
}