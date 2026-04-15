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
  FileImage,
  X,
  File as FileIcon,
  Volume2,
  VolumeX,
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
  attachmentName?: string;
  attachmentType?: 'image' | 'pdf' | 'docx' | 'executable' | 'file';
  // Agent fields
  ml_analysis?: any;
  threat_verdict?: 'MALICIOUS' | 'BENIGN' | 'SUSPICIOUS';
  risk_score?: number;
  incident_id?: string;
  routing_model?: string;
  recommended_actions?: any;
  reporting_protocol?: any;
  related_playbook_id?: string | null;
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
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<string>("Thinking...");


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

  // Helper to detect file type from name
  const getFileType = (file: File): 'image' | 'pdf' | 'docx' | 'executable' | 'file' => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['docx', 'doc'].includes(ext)) return 'docx';
    if (['exe', 'dll', 'bat', 'cmd', 'msi', 'apk', 'sh', 'jar', 'ps1', 'vbs', 'scr', 'com'].includes(ext)) return 'executable';
    return 'file';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'image': return '🖼️';
      case 'executable': return '⚠️';
      default: return '📎';
    }
  };

  const handleSendMessage = async (messageContent?: string, attachmentFile?: File) => {
    const textToSend = messageContent || message;
    const fileToSend = attachmentFile || attachment;
    if (!textToSend.trim() && !fileToSend) return;

    const fileType = fileToSend ? getFileType(fileToSend) : undefined;

    const newUserMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: textToSend || (fileToSend ? `Sent ${fileToSend.name}` : ''),
      attachment: fileToSend && fileType === 'image' ? URL.createObjectURL(fileToSend) : undefined,
      attachmentName: fileToSend?.name,
      attachmentType: fileType,
    };
    const updatedChatMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedChatMessages);

    setMessage("");
    setAttachment(null);
    setIsAiTyping(true);
    setAgentStatus("Routing request...");

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

      setAgentStatus("Analyzing context & synthesizing report...");
      const result = await analyzeWithLlm(textToSend, history, fileToSend || undefined);

      if (result.related_playbook_id && result.related_playbook_id !== 'null') {
        // Play notification sound for playbook suggestion
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 660; osc.type = 'sine'; gain.gain.value = 0.1;
        osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.stop(ctx.currentTime + 0.2);
      }

      // Build the AI message with all agent response fields
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
        // New agent-specific fields
        ml_analysis: result.ml_analysis,
        threat_verdict: result.threat_verdict,
        risk_score: result.risk_score,
        incident_id: result.incident_id,
        routing_model: result.routing_model,
        recommended_actions: result.recommended_actions,
        reporting_protocol: result.reporting_protocol,
        related_playbook_id: result.related_playbook_id || null,
      };

      if (result.intent === 'analyze_threat' && result.summary) {
        setComplaintData(result.summary);
      }

      if (result.intent === 'complaint_ready') {
        setComplaintData(result.summary);
        setIsFilingComplaint(false);
      }

      setChatMessages((prev) => [...prev, newAiMessage]);

      // ── Agentic AI: Auto-play TTS for general questions ──
      if (result.intent === 'general_question' && result.answer) {
        handleSpeak(`msg-${newAiMessage.id}`, result.answer);
      }
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
    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
  };

  // ── Text-to-Speech helpers ──
  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      handleStopSpeaking();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  };

  // Playbook label map for button text
  const PLAYBOOK_LABELS: Record<string, string> = {
    'phishing': '🎣 Phishing Attack Response',
    'malware': '🐛 Malware Detection & Removal',
    'fraud': '💳 Fraud Prevention & Response',
    'espionage': '👁 Espionage Threat Response',
    'opsec': '🔒 OPSEC Risk Mitigation',
    'social-engineering': '👥 Social Engineering Defense',
    'deepfake': '🤖 Deepfake Attack Response',
    'insider-threats': '🕵 Insider Threat Protocol',
    'network-intrusion': '🌐 Network Intrusion Response',
    'dos-ddos': '💥 DoS/DDoS Attack Mitigation',
    'zero-day': '💣 Zero-Day Exploit Response',
    'fake-website': '📋 Fake Website / Cloned App Response',
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
                      {/* Image attachment preview */}
                      {msg.attachment && msg.attachmentType === 'image' && (
                        <Image
                          src={msg.attachment}
                          alt="Attachment"
                          width={200}
                          height={200}
                          className="mt-2 rounded-lg"
                        />
                      )}
                      {/* Non-image file attachment badge */}
                      {msg.attachmentName && msg.attachmentType !== 'image' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background/60 border border-border/50 text-xs">
                          <span>{getFileIcon(msg.attachmentType || 'file')}</span>
                          <span className="font-medium truncate max-w-[180px]">{msg.attachmentName}</span>
                        </div>
                      )}
                    </div>
                    {/* Threat detected: show rich card + ML evidence + Auto File Complaint button */}
                    {msg.role === 'assistant' && (msg.intent === 'analyze_threat' || msg.intent === 'complaint_ready') && msg.analysis && (
                      <div className="mt-3 space-y-3">
                        {/* ── Verdict Header ── */}
                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">⚠ Threat Detected</span>
                            <div className="flex items-center gap-1.5">
                              {(msg as any).threat_verdict && (
                                <Badge
                                  variant={(msg as any).threat_verdict === 'MALICIOUS' ? 'destructive' : 'default'}
                                  className="text-xs font-bold"
                                >
                                  {(msg as any).threat_verdict}
                                </Badge>
                              )}
                              <Badge variant={msg.analysis.severity?.toLowerCase() === 'critical' || msg.analysis.severity?.toLowerCase() === 'high' ? 'destructive' : 'default'} className="text-xs">
                                {msg.analysis.severity || 'Unknown'}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-foreground/80"><strong>Category:</strong> {msg.analysis.ui_labels?.category || '—'}</p>
                          <p className="text-xs text-foreground/80"><strong>Summary:</strong> {msg.analysis.detection_summary}</p>
                          <p className="text-xs text-amber-300"><strong>Action:</strong> {msg.analysis.user_alert}</p>
                          {(msg as any).incident_id && (
                            <p className="text-xs text-muted-foreground font-mono">🔖 Incident: {(msg as any).incident_id}</p>
                          )}
                        </div>

                        {/* ── ML Mathematical Evidence ── */}
                        {(msg as any).ml_analysis && (
                          <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3 space-y-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">🎯 ML Mathematical Evidence</span>
                              {(msg as any).ml_analysis.ml_available ? (
                                <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">Model Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">LLM-Only</Badge>
                              )}
                            </div>
                            <p className="text-xs text-foreground/80">
                              <strong>Model:</strong> {(msg as any).ml_analysis.model_used}
                            </p>
                            <p className="text-xs text-foreground/80">
                              <strong>Prediction:</strong>{' '}
                              <span className={`font-semibold ${(msg as any).ml_analysis.prediction === 'benign' || (msg as any).ml_analysis.prediction === 'legitimate' ? 'text-green-400' : 'text-red-400'}`}>
                                {((msg as any).ml_analysis.prediction || 'N/A').toUpperCase()}
                              </span>
                            </p>
                            {/* Threat Probability Bar */}
                            {(msg as any).ml_analysis.threat_probability !== undefined && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-foreground/70">
                                  <span><strong>Threat Probability</strong></span>
                                  <span className="font-mono font-bold">
                                    {(((msg as any).ml_analysis.threat_probability || 0) * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      ((msg as any).ml_analysis.threat_probability || 0) > 0.7
                                        ? 'bg-red-500'
                                        : ((msg as any).ml_analysis.threat_probability || 0) > 0.4
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.round(((msg as any).ml_analysis.threat_probability || 0) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {/* Risk Score */}
                            {(msg as any).risk_score !== undefined && (
                              <div className="flex items-center justify-between pt-1 border-t border-blue-500/20">
                                <span className="text-xs text-foreground/70"><strong>Risk Score</strong></span>
                                <span className={`text-sm font-bold font-mono ${
                                  (msg as any).risk_score > 7 ? 'text-red-400'
                                  : (msg as any).risk_score > 4 ? 'text-yellow-400'
                                  : 'text-green-400'
                                }`}>
                                  {(msg as any).risk_score}/10
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs text-foreground/60 pt-1">
                              <span>Accuracy: {(msg as any).ml_analysis.model_accuracy}</span>
                              {(msg as any).ml_analysis.model_roc_auc !== 'N/A' && (
                                <span>ROC-AUC: {(msg as any).ml_analysis.model_roc_auc}</span>
                              )}
                            </div>
                            {(msg as any).ml_analysis.ml_note && (
                              <p className="text-xs text-yellow-400/80 italic">{(msg as any).ml_analysis.ml_note}</p>
                            )}
                          </div>
                        )}

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

                    {/* ── Agentic: Playbook Button + Read Aloud for general_question ── */}
                    {msg.role === 'assistant' && msg.intent === 'general_question' && (
                      <div className="mt-3 space-y-2">
                        {/* Read Aloud Button */}
                        <button
                          onClick={() => handleSpeak(`msg-${msg.id}`, msg.content)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                            speakingId === `msg-${msg.id}`
                              ? 'bg-purple-100 border-purple-300 text-purple-700 animate-pulse'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'
                          }`}
                        >
                          {speakingId === `msg-${msg.id}` ? (
                            <><VolumeX className="h-3.5 w-3.5" /> Stop Reading</>
                          ) : (
                            <><Volume2 className="h-3.5 w-3.5" /> 🔊 Read Aloud</>
                          )}
                        </button>

                        {/* Playbook Navigation Button */}
                        {msg.related_playbook_id && msg.related_playbook_id !== 'null' && (
                          <button
                            onClick={() => {
                              // Play a short alert sound
                              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                              const osc = ctx.createOscillator();
                              const gain = ctx.createGain();
                              osc.connect(gain);
                              gain.connect(ctx.destination);
                              osc.frequency.value = 880;
                              osc.type = 'sine';
                              gain.gain.value = 0.15;
                              osc.start();
                              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                              osc.stop(ctx.currentTime + 0.3);
                              // Navigate to playbook
                              router.push(`/user-dashboard/playbook?highlight=${msg.related_playbook_id}`);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] group"
                          >
                            <BookOpen className="h-4 w-4 group-hover:animate-bounce" />
                            <span className="flex-1 text-left">
                              {PLAYBOOK_LABELS[msg.related_playbook_id] || '📋 View Security Playbook'}
                            </span>
                            <ChevronRight className="h-4 w-4 opacity-60 group-hover:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground p-3 rounded-lg border border-primary/20 shadow-sm shadow-primary/5">
                    <div className="flex items-center space-x-3">
                      <div className="relative h-5 w-5">
                        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-75"></div>
                        <div className="relative animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground tracking-tight">Sudarshan Chakra AI</span>
                        <span className="text-[10px] text-muted-foreground font-mono animate-pulse">{agentStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Attachment Preview Bar */}
            {attachment && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-base">{getFileIcon(getFileType(attachment))}</span>
                <span className="text-sm font-medium text-blue-800 truncate flex-1">{attachment.name}</span>
                <span className="text-xs text-blue-500">{(attachment.size / 1024).toFixed(0)} KB</span>
                <button
                  onClick={handleRemoveAttachment}
                  className="p-0.5 rounded-full hover:bg-blue-200 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-blue-600" />
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="relative">
              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
              <div className="flex-1 relative">
                <Input
                  placeholder="Describe your cybersecurity issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage(message)}
                  className="pr-10 bg-white border-slate-300 focus-visible:border-primary focus-visible:ring-primary/20"
                />
                 <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleAttachmentChange}
                    accept="image/*,.pdf,.docx,.doc,.exe,.dll,.bat,.cmd,.msi,.apk,.sh,.jar,.ps1,.vbs,.scr,.txt,.csv,.log,.json,.xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/x-msdownload,application/octet-stream"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200" asChild>
                      <Paperclip className="h-4 w-4 text-slate-600" />
                    </Button>
                  </label>
                </div>
              </div>
              <Button 
                onClick={() => handleSendMessage(message)} 
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