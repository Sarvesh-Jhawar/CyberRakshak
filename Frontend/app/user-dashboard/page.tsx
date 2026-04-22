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
  Clock,
  Download,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
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
  timestamp: string;
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  // ── Speech-to-Text (Voice Input) helpers ──
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition Not Supported", {
        description: "Your browser does not support the Web Speech API. Please try Chrome or Edge."
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      toast.info("Listening...", { description: "Speak your security concern clearly." });
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setMessage(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
      if (event.error !== 'no-speech') {
        toast.error("Recognition Error", { description: event.error });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
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
          <CardContent className="p-0">
            {/* Chat Messages Container */}
            <div 
              ref={chatContainerRef} 
              className="space-y-6 h-[500px] overflow-y-auto px-6 py-8 bg-muted/10 scroll-smooth"
            >
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="p-4 rounded-full bg-card shadow-sm border border-border">
                    <Image
                      src="/model logo.png"
                      alt="Model Logo"
                      width={64}
                      height={64}
                      className="opacity-80"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-foreground tracking-tight">How can I help you today?</p>
                    <p className="text-sm text-muted-foreground max-w-[280px]">Describe a cybersecurity concern, analyze a file, or ask an educational question.</p>
                  </div>
                </div>
              )}

              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {/* Role & Timestamp UI */}
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${msg.role === 'user' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {msg.role === 'user' ? 'Direct Input' : 'Sudarshan Chakra AI'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 font-medium flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {msg.timestamp}
                      </span>
                    </div>

                    <div
                      className={`relative p-5 rounded-2xl shadow-sm border transition-all duration-300 ${
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground border-primary/10 rounded-tr-none" 
                          : "bg-card text-foreground border-border rounded-tl-none hover:shadow-md"
                      }`}
                    >
                      {/* Multimedia: Image Preview */}
                      {msg.attachment && msg.attachmentType === 'image' && (
                        <div className="mb-4 overflow-hidden rounded-xl border border-black/5 bg-muted shadow-inner group">
                          <Image
                            src={msg.attachment}
                            alt="Analyzed Media"
                            width={500}
                            height={400}
                            className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        </div>
                      )}

                      {/* Message Text: Preserve formatting for User, Markdown for AI */}
                      <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'whitespace-pre-wrap font-medium' : 'prose prose-slate prose-sm max-w-none'}`}>
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        )}
                      </div>

                      {/* Multimedia: File Attachment Card */}
                      {msg.attachmentName && msg.attachmentType !== 'image' && (
                        <div className={`mt-4 p-4 rounded-xl border flex items-center gap-4 transition-all ${
                          msg.role === 'user' 
                            ? 'bg-white/10 border-white/20 text-white' 
                            : 'bg-muted/50 border-border text-foreground'
                        }`}>
                          <div className="h-12 w-12 rounded-xl bg-background/20 flex items-center justify-center text-2xl shadow-sm border border-black/5">
                            {getFileIcon(msg.attachmentType || 'file')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate tracking-tight">{msg.attachmentName}</p>
                            <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest mt-0.5">{msg.attachmentType || 'System File'}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-9 w-9 rounded-full ${msg.role === 'user' ? 'hover:bg-white/10' : 'hover:bg-muted'}`} 
                            asChild
                          >
                            <a href={msg.attachment} download={msg.attachmentName}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      )}

                      {/* Threat Analysis Components (Agentic Overlays) */}
                      {msg.role === 'assistant' && (msg.intent === 'analyze_threat' || msg.intent === 'complaint_ready') && msg.analysis && (
                        <div className="mt-5 space-y-4 pt-5 border-t border-border">
                          {/* Threat Header */}
                          <div className="rounded-xl border border-rose-500/20 bg-rose-50/10 dark:bg-rose-950/20 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3" />
                                Threat Logic
                              </span>
                              <div className="flex items-center gap-2">
                                {(msg as any).threat_verdict && (
                                  <Badge
                                    variant={(msg as any).threat_verdict === 'MALICIOUS' ? 'destructive' : 'secondary'}
                                    className="text-[9px] font-black px-2 py-0 h-4 rounded-sm"
                                  >
                                    {(msg as any).threat_verdict}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-[9px] font-black border-rose-200 text-rose-700 bg-white h-4 rounded-sm">
                                  {msg.analysis.severity?.toUpperCase() || 'UNKNOWN'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-1.5 pt-1">
                              <p className="text-xs text-foreground/90 leading-normal font-medium"><strong>Category:</strong> {msg.analysis.ui_labels?.category || '—'}</p>
                              <p className="text-xs text-muted-foreground leading-normal">{msg.analysis.detection_summary}</p>
                              <div className="p-3 bg-card border border-rose-500/20 rounded-lg shadow-sm">
                                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">Recommended: {msg.analysis.user_alert}</p>
                              </div>
                            </div>
                          </div>

                          {/* ML Mathematical Evidence Panel */}
                          {(msg as any).ml_analysis && (
                            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">ML Inference Data</span>
                                <Badge variant="outline" className="text-[9px] border-border text-muted-foreground bg-card h-4 uppercase">Verified</Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Active Model</p>
                                  <p className="text-xs font-black text-foreground italic">{(msg as any).ml_analysis.model_used}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Prediction</p>
                                  <p className={`text-xs font-black ${(msg as any).ml_analysis.prediction === 'benign' || (msg as any).ml_analysis.prediction === 'legitimate' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {((msg as any).ml_analysis.prediction || 'N/A').toUpperCase()}
                                  </p>
                                </div>
                              </div>

                              {/* Probability and Risk */}
                              {(msg as any).ml_analysis.threat_probability !== undefined && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-end">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Confidence Level</span>
                                    <span className="text-sm font-black font-mono text-foreground">
                                      {(((msg as any).ml_analysis.threat_probability || 0) * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-border rounded-full h-1 overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all duration-1000"
                                      style={{ width: `${Math.round(((msg as any).ml_analysis.threat_probability || 0) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {(msg as any).risk_score !== undefined && (
                                <div className="flex items-center justify-between py-2 border-t border-border">
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase italic">Synthesized Risk Score</span>
                                  <div className="flex items-baseline gap-0.5">
                                    <span className="text-xl font-black text-foreground leading-none">{(msg as any).risk_score}</span>
                                    <span className="text-[10px] text-muted-foreground font-bold">/10</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Button */}
                          <Button
                            size="default"
                            className="w-full bg-slate-900 hover:bg-black text-white font-black rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] gap-3 uppercase tracking-wider text-xs h-11"
                            onClick={handleProceedToComplaint}
                          >
                            <ClipboardList className="h-4 w-4" />
                            Initialize Auto-Complaint
                            <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                          </Button>
                        </div>
                      )}

                      {/* General Question Tools */}
                      {msg.role === 'assistant' && msg.intent === 'general_question' && (
                        <div className="mt-5 space-y-3 pt-5 border-t border-border">
                          {msg.related_playbook_id && msg.related_playbook_id !== 'null' && (
                            <button
                              onClick={() => {
                                router.push(`/user-dashboard/playbook?highlight=${msg.related_playbook_id}`);
                              }}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-black transition-all bg-card border border-border hover:border-primary hover:shadow-md active:scale-[0.98] group"
                            >
                              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <span className="flex-1 text-left text-foreground/80">
                                {PLAYBOOK_LABELS[msg.related_playbook_id] || 'Explore Security Playbook'}
                              </span>
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </button>
                          )}

                          <button
                            onClick={() => handleSpeak(`msg-${msg.id}`, msg.content)}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              speakingId === `msg-${msg.id}`
                                ? 'bg-primary/5 border-primary text-primary animate-pulse'
                                : 'bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                            }`}
                          >
                            {speakingId === `msg-${msg.id}` ? (
                              <><VolumeX className="h-3.5 w-3.5" /> Stop Narration</>
                            ) : (
                              <><Volume2 className="h-3.5 w-3.5" /> Native Voice Replay</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-card text-foreground p-4 rounded-2xl rounded-tl-none border border-border shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="relative h-6 w-6">
                        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-75"></div>
                        <div className="relative animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-foreground tracking-tight uppercase">Agent Synchronization</span>
                        <span className="text-[10px] text-muted-foreground font-bold font-mono animate-pulse">{agentStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input & Multimedia Control Center */}
            <div className="p-6 bg-card border-t border-border">
              {attachment && (
                <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-muted/50 border border-border rounded-2xl animate-in slide-in-from-bottom-2">
                  <span className="text-xl flex-shrink-0">{getFileIcon(getFileType(attachment))}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-foreground truncate">{attachment.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">{(attachment.size / 1024).toFixed(0)} KB • READ TO ANALYZE</p>
                  </div>
                  <button
                    onClick={handleRemoveAttachment}
                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all group"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition duration-500"></div>
                  <div className="relative flex items-center bg-muted/50 border border-border rounded-2xl transition-all focus-within:bg-card focus-within:border-primary focus-within:shadow-[0_4px_20px_rgba(59,130,246,0.08)]">
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder={isRecording ? "Listening to your concern..." : isFilingComplaint ? "Provide more details for the incident report..." : "Describe your cybersecurity concern..."}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(message);
                          }
                        }}
                        className="min-h-[52px] max-h-[250px] py-4 px-5 pr-12 resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-hide text-sm font-medium text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleRecording}
                        className={`h-9 w-9 rounded-xl transition-all ${
                          isRecording 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 animate-pulse shadow-[0_0_12px_rgba(225,29,72,0.2)]' 
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                        title={isRecording ? "Stop Listening" : "Start Voice Input"}
                      >
                        {isRecording ? <Mic className="h-4 w-4" /> : <Mic className="h-4 w-4 opacity-70" />}
                      </Button>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleAttachmentChange}
                        accept="image/*,.pdf,.docx,.doc,.exe,.dll,.bat,.cmd,.msi,.apk,.sh,.jar,.ps1,.vbs,.scr,.txt,.csv,.log,.json,.xml"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer group/label">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground group-hover/label:text-foreground transition-all">
                          <Paperclip className="h-4 w-4" />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => handleSendMessage(message)} 
                  disabled={!message.trim() && !attachment || isAiTyping}
                  className={`h-[54px] w-[54px] rounded-2xl shadow-lg transition-all duration-300 ${
                    message.trim() || attachment 
                      ? 'bg-slate-900 hover:bg-black text-white translate-y-0 scale-100 shadow-slate-200' 
                      : 'bg-slate-100 text-slate-300 translate-y-1 scale-95 shadow-none'
                  }`}
                >
                  <Send className={`h-5 w-5 transition-transform ${message.trim() || attachment ? 'rotate-0' : '-rotate-45 opacity-50'}`} />
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6 opacity-40">
                <div className="flex items-center gap-1.5 grayscale">
                  <Image src="/model logo.png" alt="Sudarshan" width={14} height={14} />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em]">CHAKRA CORE-V2</span>
                </div>
                <span className="h-1 w-1 rounded-full bg-slate-800"></span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">END-TO-END VERIFIED</span>
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