"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import {
  X,
  Zap,
  ZapOff,
  SkipForward,
  SkipBack,
  LogOut,
  CheckCircle2,
  XCircle,
  Loader2,
  Bot,
  Eye,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

interface Email {
  id: string;
  subject: string;
  from_address: string;
  phishing_score: number;
  threat_level: "safe" | "suspicious" | "malicious";
  body_preview?: string;
}

interface ComplaintForm {
  title: string;
  category: string;
  description: string;
  evidenceType: string;
  evidenceText: string;
}

interface SubmitResult {
  email: Email;
  status: "success" | "error" | "skipped";
  incidentId?: string;
  error?: string;
}

interface AutoSubmitPromptProps {
  emailCount: number;
  onConfirm: (autoSubmit: boolean) => void;
  onCancel: () => void;
}

interface BulkComplaintDialogProps {
  emails: Email[];
  onClose: () => void;
  initialAutoSubmit?: boolean;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Auto-Submit Prompt Modal                                        */
/* ─────────────────────────────────────────────────────────────── */
export function AutoSubmitPrompt({ emailCount, onConfirm, onCancel }: AutoSubmitPromptProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Submission Mode</h2>
              <p className="text-indigo-200 text-sm">
                {emailCount} email{emailCount !== 1 ? "s" : ""} ready to process
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-gray-600 text-sm">
            Choose how you'd like to handle the complaint submissions:
          </p>

          {/* Auto-submit option */}
          <button
            onClick={() => onConfirm(true)}
            className="w-full group flex items-start gap-4 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 transition-all text-left"
          >
            <div className="mt-0.5 bg-indigo-600 rounded-full p-2 group-hover:scale-110 transition-transform flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-indigo-900">Auto-Submit ON</p>
              <p className="text-sm text-indigo-700 mt-0.5">
                AI fills each form and submits automatically — no manual approval needed. Fastest option.
              </p>
            </div>
          </button>

          {/* Manual review option */}
          <button
            onClick={() => onConfirm(false)}
            className="w-full group flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all text-left"
          >
            <div className="mt-0.5 bg-gray-700 rounded-full p-2 group-hover:scale-110 transition-transform flex-shrink-0">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Auto-Submit OFF</p>
              <p className="text-sm text-gray-600 mt-0.5">
                AI fills each form, then waits for your review and manual submit. You stay in control.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Typing animation hook                                          */
/* ─────────────────────────────────────────────────────────────── */
function useTypingAnimation(target: string, active: boolean, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when target changes
  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
  }, [target]);

  // Handle typing animation
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!active || !target) return;

    intervalRef.current = setInterval(() => {
      if (indexRef.current < target.length) {
        setDisplayed(target.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [target, active, speed]);

  const isDone = displayed.length === target.length && target.length > 0;
  return { displayed, isDone };
}

function buildComplaintForm(email: Email): ComplaintForm {
  const subject = email.subject || "Suspicious Email";
  const from = email.from_address || "Unknown Sender";
  const score = email.phishing_score?.toFixed(1) ?? "N/A";
  const level = email.threat_level?.toUpperCase() ?? "UNKNOWN";
  const receivedAt = (email as any).created_at
    ? new Date((email as any).created_at).toLocaleString()
    : "Unknown time";
  return {
    title: `Phishing Email Report: ${subject}`,
    category: "phishing",
    description: `A ${level} email was detected by CyberRakshak's AI analysis.\n\nSender: ${from}\nSubject: ${subject}\nPhishing Score: ${score}/100\nThreat Level: ${level}\nReceived: ${receivedAt}\n\nThis email has been flagged and requires investigation. Please take appropriate action according to the cybersecurity protocol.`,
    evidenceType: "text",
    evidenceText: `Email from ${from} with subject "${subject}" scored ${score}/100 on the phishing scale. Threat level: ${level}. Received: ${receivedAt}.`,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Main BulkComplaintDialog                                        */
/* ─────────────────────────────────────────────────────────────── */
export function BulkComplaintDialog({ emails, onClose, initialAutoSubmit = false }: BulkComplaintDialogProps) {
  const [autoSubmit, setAutoSubmit] = useState(initialAutoSubmit);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"filling" | "review" | "submitting" | "done">("filling");
  const [results, setResults] = useState<SubmitResult[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [paused, setPaused] = useState(false);

  const currentEmail = emails[currentIndex];
  const form = currentEmail ? buildComplaintForm(currentEmail) : null;

  // Field animation phases: 0=title, 1=description, 2=evidence
  const [fieldPhase, setFieldPhase] = useState(0);

  const titleAnim = useTypingAnimation(form?.title ?? "", phase === "filling" && fieldPhase === 0 && !paused);
  const descAnim = useTypingAnimation(form?.description ?? "", phase === "filling" && fieldPhase === 1 && !paused, 12);
  const evidAnim = useTypingAnimation(form?.evidenceText ?? "", phase === "filling" && fieldPhase === 2 && !paused, 20);

  // Advance field phases automatically
  useEffect(() => {
    if (phase !== "filling" || paused) return;
    if (fieldPhase === 0 && titleAnim.isDone) {
      const t = setTimeout(() => setFieldPhase(1), 300);
      return () => clearTimeout(t);
    }
    if (fieldPhase === 1 && descAnim.isDone) {
      const t = setTimeout(() => setFieldPhase(2), 300);
      return () => clearTimeout(t);
    }
    if (fieldPhase === 2 && evidAnim.isDone) {
      const t = setTimeout(() => setPhase("review"), 400);
      return () => clearTimeout(t);
    }
  }, [phase, fieldPhase, titleAnim.isDone, descAnim.isDone, evidAnim.isDone, paused]);

  // Auto-submit: submit immediately when review phase is reached
  useEffect(() => {
    if (autoSubmit && phase === "review" && !allDone) {
      const t = setTimeout(() => handleSubmit(), 600);
      return () => clearTimeout(t);
    }
  }, [autoSubmit, phase, allDone]);

  // Reset animation state when switching email
  useEffect(() => {
    setFieldPhase(0);
    setPhase("filling");
  }, [currentIndex]);

  // Keyboard: Escape = exit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "submitting") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, onClose]);

  const handleSubmit = async () => {
    if (!currentEmail || !form) return;
    setPhase("submitting");

    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("category", form.category);
      fd.append("description", form.description);
      fd.append("evidence_type", form.evidenceType);
      fd.append("evidence_text", form.evidenceText);

      const response = await fetch(api.incidents.create, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setResults((prev) => [
          ...prev,
          { email: currentEmail, status: "success", incidentId: data.data?.incident_id },
        ]);
      } else {
        setResults((prev) => [
          ...prev,
          { email: currentEmail, status: "error", error: data.message || "Submission failed" },
        ]);
      }
    } catch (err: any) {
      setResults((prev) => [
        ...prev,
        { email: currentEmail, status: "error", error: err?.message || "Network error" },
      ]);
    }

    if (currentIndex + 1 < emails.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setAllDone(true);
      setPhase("done");
    }
  };

  const handleSkip = () => {
    setResults((prev) => [
      ...prev,
      { email: currentEmail, status: "skipped", error: "Skipped by user" },
    ]);
    if (currentIndex + 1 < emails.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setAllDone(true);
      setPhase("done");
    }
  };

  const handleSkipAll = () => {
    const remaining = emails.slice(currentIndex);
    const skipped: SubmitResult[] = remaining.map((e) => ({
      email: e,
      status: "skipped",
      error: "Skipped by user",
    }));
    setResults((prev) => [...prev, ...skipped]);
    setAllDone(true);
    setPhase("done");
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case "malicious": return "bg-red-100 text-red-800 border-red-300";
      case "suspicious": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default: return "bg-green-100 text-green-800 border-green-300";
    }
  };

  const progress = Math.round((currentIndex / emails.length) * 100);
  const successCount = results.filter((r) => r.status === "success").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const failedCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                🚨 Bulk Complaint Filing
              </h2>
              <p className="text-red-100 text-sm mt-0.5">
                {allDone ? "All complaints processed" : "AI is processing flagged emails"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto-submit toggle */}
              {!allDone && (
                <button
                  onClick={() => setAutoSubmit((v) => !v)}
                  title={autoSubmit ? "Auto-Submit is ON — click to turn off" : "Auto-Submit is OFF — click to turn on"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    autoSubmit
                      ? "bg-white text-indigo-700 border-white shadow-inner"
                      : "bg-white/20 text-white border-white/40 hover:bg-white/30"
                  }`}
                >
                  {autoSubmit ? (
                    <><Zap className="w-3.5 h-3.5" /> Auto-Submit ON</>
                  ) : (
                    <><ZapOff className="w-3.5 h-3.5" /> Auto-Submit OFF</>
                  )}
                </button>
              )}

              {/* Counter */}
              {!allDone && (
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {currentIndex + 1}
                    <span className="text-red-200 text-base">/{emails.length}</span>
                  </div>
                  <div className="text-xs text-red-200">{progress}% done</div>
                </div>
              )}

              {/* Exit button */}
              <button
                onClick={onClose}
                disabled={phase === "submitting"}
                title="Exit (Esc)"
                className="bg-white/20 hover:bg-white/30 disabled:opacity-40 rounded-full p-1.5 transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {!allDone && (
            <div className="mt-3 bg-red-700/40 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ALL DONE STATE */}
          {allDone ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-5xl mb-3">✅</div>
                <h3 className="text-xl font-bold text-gray-800">All Complaints Processed!</h3>
                <p className="text-gray-500 text-sm mt-1">Summary of submitted incident reports</p>
                <div className="flex justify-center gap-4 mt-3">
                  <span className="text-sm text-green-600 font-semibold">✅ {successCount} Filed</span>
                  <span className="text-sm text-gray-500 font-semibold">⏭ {skippedCount} Skipped</span>
                  {failedCount > 0 && (
                    <span className="text-sm text-red-500 font-semibold">❌ {failedCount} Failed</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      r.status === "success"
                        ? "bg-green-50 border-green-200"
                        : r.status === "skipped"
                        ? "bg-gray-50 border-gray-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.email.subject || "(No Subject)"}</p>
                      <p className="text-xs text-gray-500 truncate">{r.email.from_address}</p>
                    </div>
                    <div className="ml-3 text-right">
                      {r.status === "success" ? (
                        <div>
                          <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Filed
                          </span>
                          {r.incidentId && (
                            <p className="text-xs text-green-600 font-mono">{r.incidentId}</p>
                          )}
                        </div>
                      ) : r.status === "skipped" ? (
                        <span className="text-xs text-gray-500">⏭ Skipped</span>
                      ) : (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-center">
                <Button onClick={onClose} className="bg-gray-800 hover:bg-gray-900 text-white px-8 flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Close & Exit
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Current Email Card */}
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">Current Email</p>
                    <p className="font-semibold text-gray-800 truncate">{currentEmail?.subject || "(No Subject)"}</p>
                    <p className="text-sm text-gray-500 truncate">From: {currentEmail?.from_address}</p>
                  </div>
                  {currentEmail && (
                    <Badge className={`ml-3 ${getThreatColor(currentEmail.threat_level)}`}>
                      {currentEmail.threat_level?.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Status Indicators */}
              {phase === "filling" && (
                <div className={`flex items-center justify-between text-sm font-medium mb-4 rounded-lg px-3 py-2 ${
                  paused ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : "bg-indigo-50 text-indigo-600"
                }`}>
                  <div className="flex items-center gap-2">
                    {paused ? (
                      <><PauseCircle className="w-4 h-4" /> Paused — click Resume to continue</>
                    ) : (
                      <>
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        AI Assistant is auto-filling the complaint form...
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setPaused((p) => !p)}
                    className="ml-3 text-xs font-semibold underline underline-offset-2 hover:no-underline"
                  >
                    {paused ? "▶ Resume" : "⏸ Pause"}
                  </button>
                </div>
              )}

              {phase === "review" && (
                <div className="flex items-center justify-between text-sm font-medium mb-4 bg-green-50 text-green-700 rounded-lg px-3 py-2 border border-green-200">
                  <span className="flex items-center gap-1.5">
                    ✅ Form filled —{" "}
                    {autoSubmit ? (
                      <span className="text-indigo-700 font-semibold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> Auto-submitting...
                      </span>
                    ) : (
                      "Review and submit"
                    )}
                  </span>
                  {!autoSubmit && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      Awaiting your approval
                    </span>
                  )}
                </div>
              )}

              {phase === "submitting" && (
                <div className="flex items-center gap-2 text-sm text-blue-700 font-medium mb-4 bg-blue-50 rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting complaint to CERT-In portal...
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Incident Title
                    {fieldPhase === 0 && phase === "filling" && !paused && (
                      <span className="ml-2 text-indigo-500 normal-case font-normal">● typing...</span>
                    )}
                  </label>
                  <div className={`w-full border rounded-lg px-3 py-2 text-sm bg-white min-h-[38px] font-mono transition-all ${
                    fieldPhase === 0 && phase === "filling"
                      ? "border-indigo-400 ring-2 ring-indigo-100"
                      : "border-gray-200"
                  }`}>
                    {titleAnim.displayed || <span className="text-gray-300">Filling...</span>}
                    {fieldPhase === 0 && phase === "filling" && !paused && (
                      <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Category</label>
                  <div className={`w-full border rounded-lg px-3 py-2 text-sm bg-white transition-all ${
                    phase !== "filling" || fieldPhase > 0 ? "border-gray-200" : "border-gray-100 text-gray-300"
                  }`}>
                    {phase !== "filling" || fieldPhase > 0 ? (
                      <span className="font-medium text-orange-700">🎣 Phishing Attack</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Description
                    {fieldPhase === 1 && phase === "filling" && !paused && (
                      <span className="ml-2 text-indigo-500 normal-case font-normal">● typing...</span>
                    )}
                  </label>
                  <div className={`w-full border rounded-lg px-3 py-2 text-sm bg-white min-h-[100px] whitespace-pre-wrap font-mono transition-all ${
                    fieldPhase === 1 && phase === "filling"
                      ? "border-indigo-400 ring-2 ring-indigo-100"
                      : fieldPhase > 1 || phase !== "filling"
                      ? "border-gray-200"
                      : "border-gray-100"
                  }`}>
                    {descAnim.displayed || (fieldPhase > 1 || phase !== "filling" ? form?.description : <span className="text-gray-300">Waiting...</span>)}
                    {fieldPhase === 1 && phase === "filling" && !paused && (
                      <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                </div>

                {/* Evidence */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Evidence
                    {fieldPhase === 2 && phase === "filling" && !paused && (
                      <span className="ml-2 text-indigo-500 normal-case font-normal">● typing...</span>
                    )}
                  </label>
                  <div className={`w-full border rounded-lg px-3 py-2 text-sm bg-white min-h-[60px] font-mono transition-all ${
                    fieldPhase === 2 && phase === "filling"
                      ? "border-indigo-400 ring-2 ring-indigo-100"
                      : phase === "review" || phase === "submitting"
                      ? "border-gray-200"
                      : "border-gray-100"
                  }`}>
                    {evidAnim.displayed || (phase !== "filling" ? form?.evidenceText : <span className="text-gray-300">Waiting...</span>)}
                    {fieldPhase === 2 && phase === "filling" && !paused && (
                      <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                </div>
              </div>

              {/* Previously submitted results */}
              {results.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Completed</p>
                  <div className="space-y-1">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1">
                        <span className="truncate text-gray-600 flex-1">{r.email.subject || "(No Subject)"}</span>
                        {r.status === "skipped" ? (
                          <span className="ml-2 text-gray-400">⏭ Skipped</span>
                        ) : r.status === "success" ? (
                          <span className="ml-2 text-green-600 font-medium">✅ {r.incidentId}</span>
                        ) : (
                          <span className="ml-2 text-red-500">❌ Failed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer Actions ── */}
        {!allDone && (
          <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Skip this one */}
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={phase === "submitting"}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
                title="Skip this email and move to next"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </Button>
              {/* Skip all remaining */}
              {emails.length - currentIndex > 1 && (
                <Button
                  variant="ghost"
                  onClick={handleSkipAll}
                  disabled={phase === "submitting"}
                  className="text-orange-500 hover:text-orange-700 flex items-center gap-1.5 text-xs"
                  title="Skip all remaining emails"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  Skip Remaining ({emails.length - currentIndex - 1})
                </Button>
              )}
            </div>

            <div className="flex gap-3 items-center">
              {/* Exit button */}
              <Button
                variant="outline"
                onClick={onClose}
                disabled={phase === "submitting"}
                className="flex items-center gap-1.5 border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                Exit
              </Button>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={phase !== "review" || autoSubmit}
                className={`min-w-[150px] flex items-center gap-2 ${
                  phase === "review" && !autoSubmit
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : phase === "submitting"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {phase === "filling" && (
                  <>
                    <Bot className="w-4 h-4 animate-pulse" />
                    AI Filling...
                  </>
                )}
                {phase === "review" && !autoSubmit && (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Submit Complaint
                  </>
                )}
                {phase === "review" && autoSubmit && (
                  <>
                    <Zap className="w-4 h-4 animate-pulse" />
                    Auto-Submitting...
                  </>
                )}
                {phase === "submitting" && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
