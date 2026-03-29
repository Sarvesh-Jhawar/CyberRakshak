'use client'

import { useState, useEffect, useRef } from "react"
import { UserLayout } from "@/components/dashboard/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  History,
  BookOpen,
  HelpCircle,
  Shield,
  AlertTriangle,
  Plus,
  Mic,
  Send,
  Paperclip,
  ClipboardList,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { api, getAuthHeaders, analyzeWithLlm } from "@/lib/api"
import { isMockAuthEnabled } from "@/lib/mockAuth"
import { toast } from "sonner"
import Image from "next/image"
import { AIResponse } from "@/components/dashboard/AIResponse"
import ReactMarkdown from "react-markdown"
import { useRouter } from "next/navigation"
import { GmailConnect } from "@/components/gmail-connect"

interface Incident {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  analysis?: any;
  intent?: 'analyze_threat' | 'general_question' | 'request_information' | 'complaint_ready';
  summary?: any;
  question?: string;
  attachment?: string;
}

// Add this interface to handle the SpeechRecognition API
interface IWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

export default function UserDashboard() {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([])
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isFilingComplaint, setIsFilingComplaint] = useState(false);
  const [complaintData, setComplaintData] = useState(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);


  const chatContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter();

  // Check for Gmail OAuth callback redirect
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const gmailConnected = searchParams.get('gmail_connected')
    const gmailError = searchParams.get('gmail_error')

    if (gmailConnected === 'true') {
      toast.success("Gmail Connected!", {
        description: "Your Gmail account has been successfully connected. Emails will sync shortly.",
      })
      // Clean up URL
      window.history.replaceState({}, '', '/user-dashboard')
    }

    if (gmailError) {
      toast.error("Gmail Connection Failed", {
        description: gmailError,
      })
      // Clean up URL
      window.history.replaceState({}, '', '/user-dashboard')
    }
  }, [])


  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
      case "closed":
        return "outline-green"
      case "pending":
      case "under review":
        return "outline-yellow"
      default:
        return "outline"
    }
  }

  // Load chat history from localStorage on initial render
  useEffect(() => {
    const savedChat = localStorage.getItem('chatHistory');
    if (savedChat) {
      setChatMessages(JSON.parse(savedChat));
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  useEffect(() => {
    // Scroll to the bottom of the chat container when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, isAiTyping])

  useEffect(() => {
    if (attachment) {
      handleSendMessage("", attachment);
    }
  }, [attachment]);

  const handleSendMessage = async (messageContent?: string, attachment?: File) => {
    const textToSend = messageContent || message;
    if (!textToSend.trim() && !attachment) return;

    const newUserMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: textToSend,
      attachment: attachment ? URL.createObjectURL(attachment) : undefined,
    };
    const updatedChatMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedChatMessages);

    setMessage("");
    setAttachment(null);
    setIsAiTyping(true);

    try {
      const history: { role: 'user' | 'assistant'; content: string }[] = updatedChatMessages.slice(0, -1).map(msg => {
        if (msg.role === 'assistant') {
          const assistantResponse = {
            intent: msg.intent,
            analysis: msg.analysis,
            answer: msg.content,
            summary: msg.summary,
            question: msg.question,
          };
          return { role: 'assistant', content: JSON.stringify(assistantResponse) };
        }
        return { role: 'user', content: msg.content };
      });

      const result = await analyzeWithLlm(textToSend, history, attachment || undefined);

      const newAiMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: result.answer || result.response || result.question || result.message || '',
        analysis: result.intent === 'complaint_ready' || result.intent === 'analyze_threat' ? {
          detection_summary: result.detection_summary,
          user_alert: result.user_alert,
          playbook: result.playbook,
          evidence_to_collect: result.evidence_to_collect,
          severity: result.severity,
          cert_alert: result.cert_alert,
          technical_details: result.technical_details,
          ui_labels: result.ui_labels,
        } : result.analysis,
        intent: result.intent,
        summary: result.summary,
        question: result.question,
      };

      if (result.intent === 'analyze_threat' && result.summary) {
        setComplaintData(result.summary);
      }

      if (result.intent === 'complaint_ready') {
        setComplaintData(result.summary);
        setIsFilingComplaint(false);
      }

      setChatMessages((prev) => [...prev, newAiMessage]);
    } catch (error: any) {
      console.error("[Analyze] Error:", error);
      toast.error("Analysis Error", { description: error.message });
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Sorry, I encountered an error and couldn't process your request. Please try again.",
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const startComplaintProcess = () => {
    setIsFilingComplaint(true);
    handleSendMessage("ACTION:START_COMPLAINT");
  }

  const handleProceedToComplaint = () => {
    if (!complaintData) return;

    const queryParams = new URLSearchParams(complaintData);
    router.push(`/user-dashboard/complaint?${queryParams.toString()}`);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleNewChat = () => {
    setChatMessages([]);
    localStorage.removeItem('chatHistory');
    toast.success("New chat started!");
  };

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        if (isMockAuthEnabled()) {
          // provide some mock incidents for UI development
          const mock = [
            { id: '1', title: 'Phishing attempt reported', category: 'phishing', status: 'pending', created_at: new Date().toISOString() },
            { id: '2', title: 'Malware detected on endpoint', category: 'malware', status: 'resolved', created_at: new Date().toISOString() },
          ]
          setRecentIncidents(mock)
          return
        }
        const headers = getAuthHeaders()
        const response = await fetch(api.incidents.list, { headers })
        if (!response.ok) {
          throw new Error("Failed to fetch recent activity.")
        }
        const data = await response.json()
        // Get the 2 most recent incidents
        setRecentIncidents(data.slice(0, 2))
      } catch (error: any) {
        toast.error("Could not load activity", { description: error.message })
      }
    }
    fetchRecentActivity()
  }, [])

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome to Your Security Dashboard</h1>
            <p className="text-muted-foreground mt-2">Stay protected with real-time monitoring and instant support</p>
          </div>
          <div className="flex gap-2">
            <GmailConnect />
            <Link href="/user-dashboard/gmail-analysis">
              <Button variant="outline" size="sm">
                📧 View Email Analysis
              </Button>
            </Link>
          </div>
        </div>

        {/* Sudarshan Chakra AI Assistant */}
        <Card className="cyber-border">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <Image
                  src="/model logo.png"
                  alt="Model Logo"
                  width={32}
                  height={32}
                />
                <div>
                  <CardTitle>Sudarshan Chakra AI Assistant</CardTitle>
                  <CardDescription>Describe your cybersecurity concerns and get instant guidance</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleNewChat}>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Chat Messages */}
            <div ref={chatContainerRef} className="space-y-4 mb-6 h-96 overflow-y-auto p-2">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <Image
                    src="/model logo.png"
                    alt="Model Logo"
                    width={48}
                    height={48}
                    className="mx-auto mb-4"
                  />
                  <p className="text-muted-foreground">What's your cybersecurity concern today?</p>
                </div>
              )}

              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="text-sm prose dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {msg.attachment && (
                        <Image
                          src={msg.attachment}
                          alt="Attachment"
                          width={200}
                          height={200}
                          className="mt-2 rounded-lg"
                        />
                      )}
                    </div>
                    {/* Threat detected: show rich card + Auto File Complaint button */}
                    {msg.role === 'assistant' && (msg.intent === 'analyze_threat' || msg.intent === 'complaint_ready') && msg.analysis && (
                      <div className="mt-3 space-y-3">
                        {/* Threat Summary Card */}
                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">⚠ Threat Detected</span>
                            <Badge variant={msg.analysis.severity?.toLowerCase() === 'critical' || msg.analysis.severity?.toLowerCase() === 'high' ? 'destructive' : 'default'} className="text-xs">
                              {msg.analysis.severity || 'Unknown'}
                            </Badge>
                          </div>
                          <p className="text-xs text-foreground/80"><strong>Category:</strong> {msg.analysis.ui_labels?.category || '—'}</p>
                          <p className="text-xs text-foreground/80"><strong>Summary:</strong> {msg.analysis.detection_summary}</p>
                          <p className="text-xs text-amber-300"><strong>Action:</strong> {msg.analysis.user_alert}</p>
                        </div>

                        {/* Auto File Complaint Button */}
                        <Button
                          size="sm"
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 cyber-glow"
                          onClick={handleProceedToComplaint}
                        >
                          <ClipboardList className="h-4 w-4" />
                          🚀 Auto File Complaint
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">All fields will be pre-filled — just review and submit</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      <span className="text-sm">Generating response...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="relative">
              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
              <div className="flex-1 relative">
                <Input
                  placeholder="Describe your cybersecurity issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage(message, attachment ?? undefined)}
                  className="pr-10 bg-white border-slate-300 focus-visible:border-primary focus-visible:ring-primary/20"
                />
                 <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleAttachmentChange}
                    accept="image/*"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200" asChild>
                      <Paperclip className="h-4 w-4 text-slate-600" />
                    </Button>
                  </label>
                </div>
              </div>
              <Button 
                onClick={() => handleSendMessage(message, attachment ?? undefined)} 
                disabled={!message.trim() && !attachment || isAiTyping}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest security interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentIncidents.length > 0 ? (
                recentIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{incident.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted {new Date(incident.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(incident.status) as any}>
                      {incident.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  )
}