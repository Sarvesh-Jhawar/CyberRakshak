"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { api, getAuthHeaders } from "@/lib/api"
import { EmailMLAnalysis } from "@/components/email-ml-analysis";
import { GmailConnect } from "@/components/gmail-connect"
import { useRouter } from "next/navigation"

interface Email {
  id: string
  gmail_message_id: string
  subject: string
  from_address: string
  to_address: string
  body_preview: string
  phishing_score: number
  threat_level: "safe" | "suspicious" | "malicious"
  is_read: boolean
  created_at: string
  threat_indicators?: Array<{
    type: string
    description: string
    severity: "low" | "medium" | "high"
  }>
  ml_analysis?: {
    ml_analysis?: any; // The formatted ML model results
    llm_analysis?: any; // The LLM contextual analysis
    threat_indicators?: Array<{
      type: string;
      description: string;
      severity: string;
    }>;
    features_extracted?: any;
  }
}

interface EmailStats {
  total_emails: number
  safe: number
  suspicious: number
  malicious: number
  this_week: number
  percentages: {
    safe: number
    suspicious: number
    malicious: number
  }
}

export default function EmailAnalysisPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [emails, setEmails] = useState<Email[]>([])
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [threatFilter, setThreatFilter] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileComplaint = (email: Email) => {
    const subject = email.subject || "Suspicious Email"
    const from = email.from_address || "Unknown Sender"
    const score = email.phishing_score?.toFixed(1) ?? "N/A"
    const level = email.threat_level?.toUpperCase() ?? "UNKNOWN"
    const params = new URLSearchParams({
      title: `Phishing Email Report: ${subject}`,
      category: "phishing",
      description: `A ${level} email was detected by CyberRakshak's AI analysis.\n\nSender: ${from}\nSubject: ${subject}\nPhishing Score: ${score}/100\nThreat Level: ${level}\n\nPlease investigate this email and take appropriate action.`,
      evidenceType: "text",
      evidenceText: `Email from ${from} with subject "${subject}" scored ${score}/100 on the phishing scale.`,
    })
    router.push(`/user-dashboard/complaint?${params.toString()}`)
  }

  useEffect(() => {
    checkGmailStatus()
  }, [])

  useEffect(() => {
    if (gmailConnected) {
      fetchEmails()
      fetchStats()
    }
  }, [gmailConnected, threatFilter])

  const checkGmailStatus = async () => {
    try {
      const response = await fetch(api.gmail.status, {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setGmailConnected(data.data?.gmail_connected || false)
      }
    } catch (error) {
      console.error("Error checking Gmail status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmails = async () => {
    try {
      const url = new URL(api.emails.list)
      url.searchParams.append("limit", "20")
      if (threatFilter) {
        url.searchParams.append("threat_level", threatFilter)
      }

      const response = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setEmails(data.data?.emails || [])
      }
    } catch (error) {
      console.error("Error fetching emails:", error)
      toast({
        title: "Error",
        description: "Failed to load emails",
        variant: "destructive",
      })
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(api.emails.stats, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const getThreatBadgeColor = (level: string) => {
    switch (level) {
      case "safe":
        return "bg-green-100 text-green-800"
      case "suspicious":
        return "bg-yellow-100 text-yellow-800"
      case "malicious":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getThreatIcon = (level: string) => {
    switch (level) {
      case "safe":
        return "🟢"
      case "suspicious":
        return "🟡"
      case "malicious":
        return "🔴"
      default:
        return "⚪"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading email analysis...</p>
        </div>
      </div>
    )
  }

  if (!gmailConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Threat Analysis</h1>
          <p className="text-gray-600 mt-2">Analyze your Gmail for phishing and security threats</p>
        </div>

        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Gmail Not Connected</h2>
              <p className="text-gray-600">
                Connect your Gmail account to start analyzing emails for threats
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left space-y-2">
              <p className="font-semibold text-blue-900">This allows us to:</p>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>✓ Detect phishing attempts</li>
                <li>✓ Identify malware links</li>
                <li>✓ Spot spoofed emails</li>
                <li>✓ Analyze email security threats</li>
              </ul>
            </div>

            <GmailConnect onConnected={() => setGmailConnected(true)} />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Threat Analysis</h1>
          <p className="text-gray-600 mt-2">Your Gmail emails analyzed for threats</p>
        </div>
        <Button variant="outline" onClick={() => setGmailConnected(false)}>
          Manage Gmail
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm font-medium text-gray-600">Total Emails</p>
            <p className="text-3xl font-bold mt-2">{stats.total_emails}</p>
          </Card>

          <Card className="p-4 border-green-200 bg-green-50">
            <p className="text-sm font-medium text-green-700">Safe</p>
            <p className="text-3xl font-bold text-green-700 mt-2">{stats.safe}</p>
            <p className="text-xs text-green-600 mt-1">{stats.percentages.safe}%</p>
          </Card>

          <Card className="p-4 border-yellow-200 bg-yellow-50">
            <p className="text-sm font-medium text-yellow-700">Suspicious</p>
            <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.suspicious}</p>
            <p className="text-xs text-yellow-600 mt-1">{stats.percentages.suspicious}%</p>
          </Card>

          <Card className="p-4 border-red-200 bg-red-50">
            <p className="text-sm font-medium text-red-700">Malicious</p>
            <p className="text-3xl font-bold text-red-700 mt-2">{stats.malicious}</p>
            <p className="text-xs text-red-600 mt-1">{stats.percentages.malicious}%</p>
          </Card>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={threatFilter === null ? "default" : "outline"}
          onClick={() => setThreatFilter(null)}
        >
          All Emails
        </Button>
        <Button
          variant={threatFilter === "malicious" ? "default" : "outline"}
          className="hover:bg-red-100"
          onClick={() => setThreatFilter("malicious")}
        >
          🔴 Malicious
        </Button>
        <Button
          variant={threatFilter === "suspicious" ? "default" : "outline"}
          className="hover:bg-yellow-100"
          onClick={() => setThreatFilter("suspicious")}
        >
          🟡 Suspicious
        </Button>
        <Button
          variant={threatFilter === "safe" ? "default" : "outline"}
          className="hover:bg-green-100"
          onClick={() => setThreatFilter("safe")}
        >
          🟢 Safe
        </Button>
      </div>

      {/* Emails List */}
      {selectedEmail ? (
        <Card className="p-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedEmail(null)}
            className="mb-4"
          >
            ← Back to List
          </Button>

          <div className="space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedEmail.subject}</h2>
                  <p className="text-gray-600 mt-1">From: {selectedEmail.from_address}</p>
                  <p className="text-gray-600">To: {selectedEmail.to_address}</p>
                </div>
                <Badge className={getThreatBadgeColor(selectedEmail.threat_level)}>
                  {getThreatIcon(selectedEmail.threat_level)} {selectedEmail.threat_level.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Phishing Score:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      selectedEmail.phishing_score > 70
                        ? "bg-red-600"
                        : selectedEmail.phishing_score > 40
                        ? "bg-yellow-600"
                        : "bg-green-600"
                    }`}
                    style={{ width: `${selectedEmail.phishing_score}%` }}
                  />
                </div>
                <span className="font-bold min-w-fit">{selectedEmail.phishing_score.toFixed(1)}%</span>
              </div>
            </div>

            {selectedEmail.body_preview && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <p className="text-gray-600 whitespace-pre-wrap font-mono text-sm">
                  {selectedEmail.body_preview}
                </p>
              </div>
            )}

            {selectedEmail.ml_analysis && (
              <EmailMLAnalysis
                mlAnalysis={selectedEmail.ml_analysis?.ml_analysis || selectedEmail.ml_analysis}
                phishingScore={selectedEmail.phishing_score}
                threatLevel={selectedEmail.threat_level}
                llmAnalysis={selectedEmail.ml_analysis?.llm_analysis}
              />
            )}

            {/* File a Complaint Button */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Report this email as a security incident</p>
                  <p className="text-xs text-gray-500 mt-0.5">AI will pre-fill the complaint form with email details</p>
                </div>
                <Button
                  onClick={() => handleFileComplaint(selectedEmail)}
                  className={`flex items-center gap-2 ${
                    selectedEmail.threat_level === "malicious"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : selectedEmail.threat_level === "suspicious"
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <span>🚨</span>
                  File a Complaint
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {emails.length === 0 ? (
            <Card className="p-8 text-center text-gray-600">
              <p>No emails to display</p>
            </Card>
          ) : (
            emails.map((email) => (
              <Card
                key={email.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => setSelectedEmail(email)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getThreatIcon(email.threat_level)}</span>
                      <h3 className="font-semibold">{email.subject}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">From: {email.from_address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {email.created_at
                        ? `${new Date(email.created_at).toLocaleDateString()} at ${new Date(email.created_at).toLocaleTimeString()}`
                        : "Unknown date"}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge className={getThreatBadgeColor(email.threat_level)}>
                      {email.phishing_score.toFixed(1)}%
                    </Badge>
                    <p className="text-xs font-medium text-gray-600">
                      {email.threat_level.charAt(0).toUpperCase() + email.threat_level.slice(1)}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
