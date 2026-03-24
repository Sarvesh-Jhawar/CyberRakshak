"use client"

import { useState, useMemo, useEffect } from "react"
import { playbooksData, Locale } from "./data"
import { UserLayout } from "@/components/dashboard/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  BookOpen,
  Search,
  AlertTriangle,
  Bug,
  CreditCard,
  Eye,
  Lock,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Volume2,
  StopCircle,
  Languages,
} from "lucide-react"

export default function PlaybookPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedLocale, setSelectedLocale] = useState<Locale>("en")
  // The voice lang may be more specific (e.g., en-US) than the locale (en)
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<string>("en-US")

  const handleSpeak = (id: string, text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("Sorry, your browser does not support text-to-speech.")
      return
    }
  
    if (speakingId === id) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
    } else {
      window.speechSynthesis.cancel() // Stop any other speech
      const utterance = new SpeechSynthesisUtterance(text)
      const voice = voices.find((v) => v.lang === selectedVoiceLang)
      if (voice) {
        utterance.voice = voice
      }
      utterance.lang = selectedVoiceLang
      utterance.onstart = () => setSpeakingId(id)
      utterance.onend = () => setSpeakingId(null)
      utterance.onerror = () => setSpeakingId(null)
      window.speechSynthesis.speak(utterance)
    }
  }
  
  useEffect(() => {
    const getVoices = () => {
      if ("speechSynthesis" in window) {
        setVoices(window.speechSynthesis.getVoices())
      }
    }
    getVoices()
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = getVoices
    }
    // Cleanup speech synthesis on component unmount or voice change
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])
  
  const filteredPlaybooks = useMemo(() => {
    return playbooksData.filter((playbook) => {
      const lowerSearchTerm = searchTerm.toLowerCase()
      const matchesSearch =
        playbook.title[selectedLocale].toLowerCase().includes(lowerSearchTerm) ||
        playbook.description[selectedLocale].toLowerCase().includes(lowerSearchTerm) ||
        playbook.category.toLowerCase().includes(lowerSearchTerm) ||
        playbook.id.toLowerCase().includes(lowerSearchTerm)
      return matchesSearch
    })
  }, [searchTerm, selectedLocale])

  const getSeverityColor = (severity: string) => {
    const colorMap: { [key: string]: string } = {
      Critical: "risk-critical",
      High: "risk-high",
      Medium: "risk-medium",
      Low: "risk-low",
    }
    return colorMap[severity] || "risk-low"
  }

  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      Critical: "bg-destructive/10 text-destructive border-destructive/20",
      High: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      Medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      Low: "bg-green-500/10 text-green-500 border-green-500/20",
      Info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    }
    return colorMap[priority] || "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }

  const supportedLangs: { [key in Locale]?: { name: string; voiceRegex: RegExp } } = {
    en: { name: "English", voiceRegex: /^en(-|GB|US|AU|IN)/ },
    hi: { name: "हिंदी (Hindi)", voiceRegex: /^hi(-IN)?/ },
  }

  const languageOptions = useMemo(() => {
    const availableLocales = new Map<Locale, string>()
    for (const voice of voices) {
      for (const locale of Object.keys(supportedLangs) as Locale[]) {
        if (!availableLocales.has(locale) && supportedLangs[locale].voiceRegex.test(voice.lang)) {
          availableLocales.set(locale, voice.lang)
        }
      }
    }
    return Array.from(availableLocales.entries())
  }, [voices])

  useEffect(() => {
    // Update the selected voice when the content locale changes
    const bestVoice = languageOptions.find(([locale]) => locale === selectedLocale)
    if (bestVoice) {
      setSelectedVoiceLang(bestVoice[1])
    } else if (languageOptions.length > 0) {
      // Fallback to the first available language
      setSelectedLocale(languageOptions[0][0])
      setSelectedVoiceLang(languageOptions[0][1])
    }
  }, [selectedLocale, languageOptions])

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security Playbooks</h1>
            <p className="text-muted-foreground">Step-by-step incident response and mitigation guides</p>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="cyber-border">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search playbooks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-4 flex-wrap items-center">
                {languageOptions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-muted-foreground" />
                    <Select value={selectedLocale} onValueChange={(value) => setSelectedLocale(value as Locale)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map(([locale]) => (
                          <SelectItem key={locale} value={locale} disabled={!supportedLangs[locale]}>
                            {supportedLangs[locale].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Playbooks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPlaybooks.map((playbook) => {
            const Icon = playbook.icon
            const infoStep = playbook.steps.find((step) => step.priority === "Info")
            return (
              <Card key={playbook.id} className="cyber-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{playbook.title[selectedLocale]}</CardTitle>
                        <CardDescription className="mt-1">{playbook.description[selectedLocale]}</CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>{playbook.steps.filter((s) => s.priority !== "Info").length} steps</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {infoStep && (
                    <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground">{infoStep.title[selectedLocale]}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSpeak(`${playbook.id}-info`, infoStep.actions[selectedLocale].join(". "))}
                          className="text-muted-foreground"
                        >
                          {speakingId === `${playbook.id}-info` ? (
                            <StopCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <Volume2 className="h-4 w-4 mr-2" />
                          )}
                          {speakingId === `${playbook.id}-info` ? "Stop" : "Read"}
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {infoStep.actions[selectedLocale].map((action, actionIndex) => (
                          <p key={actionIndex}>{action}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <h4 className="font-medium text-foreground mb-3">Steps to be Taken</h4>
                  <Accordion type="single" collapsible className="w-full">
                    {playbook.steps
                      .filter((step) => step.priority !== "Info")
                      .map((step, index) => (
                        <AccordionItem key={index} value={`step-${index}`}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline" className={getPriorityColor(step.priority)} size="sm">
                                {step.priority}
                              </Badge>
                              <span>{step.title[selectedLocale]}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4">
                              <div>
                                <ul className="space-y-2">
                                  {step.actions[selectedLocale].map((action, actionIndex) => (
                                    <li key={actionIndex} className="flex items-start space-x-2">
                                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-muted-foreground">{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSpeak(`${playbook.id}-${index}`, step.actions[selectedLocale].join(". "))}
                                className="text-muted-foreground"
                              >
                                {speakingId === `${playbook.id}-${index}` ? (
                                  <StopCircle className="h-4 w-4 mr-2" />
                                ) : (
                                  <Volume2 className="h-4 w-4 mr-2" />
                                )}
                                {speakingId === `${playbook.id}-${index}` ? "Stop Reading" : "Read Aloud"}
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>

                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredPlaybooks.length === 0 && (
          <Card className="cyber-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No playbooks found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria or category filter</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Reference */}
        <Card className="cyber-border border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span>Quick Reference</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-foreground mb-2">Emergency Numbers</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• CERT-In (भारत का साइबर आपात प्रतिक्रिया टीम): 1800-11-4949</li>
                  <li>• National Cyber Crime Reporting Portal (NCRP): 1930</li>
                  <li>• All-India Police / Emergency Helpline: 112</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Key Principles</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Act quickly but don't panic</li>
                  <li>• Document everything</li>
                  <li>• Follow chain of command</li>
                  <li>• Preserve evidence</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  )
}