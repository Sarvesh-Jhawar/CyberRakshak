"""
CyberRakshak Agent — Router-to-Synthesizer Architecture
=========================================================
Phase 1  : LLM routing — classify threat type, extract params from user text
Phase 2  : Parameter validation — ask user if required fields are missing
Phase 3A : ML inference — POST to models-api (port 8001) for hard score
Phase 3B : LLM contextual analysis — Groq heuristic reasoning (parallel)
Phase 4  : Synthesis — combine ML score + LLM reasoning → verdict + confidence
Phase 5  : Structured threat report returned to frontend
"""

import os
import io
import httpx
import json
import base64
import uuid
import asyncio
import re
import mimetypes
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Form, File, UploadFile, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv

# Document parsing
try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None

try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None
from app.utils.auth import get_current_user

load_dotenv()

router = APIRouter(tags=["LLM"])

# ─── API Keys & Endpoints ────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is required")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# ML model API (separate FastAPI process on port 8001)
ML_API_BASE = os.getenv("ML_API_BASE_URL", "http://127.0.0.1:8001")

# ─── Pydantic ────────────────────────────────────────────────────────────────
class ChatMessageHistory(BaseModel):
    role: str
    content: str

# ─── Model Metadata ──────────────────────────────────────────────────────────
MODEL_METADATA = {
    "phishing": {
        "display_name": "Phishing Evaluator (RF)",
        "endpoint": "/predict/phishing",
        "accuracy": "99.86%",
        "roc_auc": "99.95%",
        "description": "Custom URL-structure + text-feature extraction + Random Forest",
        # Fields the ML API accepts (from PhishingInput pydantic model)
        "api_fields": ["subject", "body", "url"],
        "required_from_user": ["url"],
        "optional_from_user": ["subject", "body"],
        "questions": {
            "url": "What is the suspicious URL? (e.g. http://secure-paypa1-update.com/verify)",
        }
    },
    "malware": {
        "display_name": "Malware Detection Model (RF)",
        "endpoint": "/predict/malware",
        "accuracy": "97.50%",
        "roc_auc": "99.72%",
        "description": "PE header + CPU/memory execution state → Random Forest (depth=5)",
        # Malware model uses 33 numeric features extracted from OS memory/CPU state.
        # These are kernel-level metrics not directly available from chat,
        # so we use LLM to estimate/synthesize plausible feature vectors from description.
        "api_fields": [
            "millisecond", "state", "usage_counter", "prio", "static_prio", "normal_prio",
            "policy", "vm_pgoff", "vm_truncate_count", "task_size", "cached_hole_size",
            "free_area_cache", "mm_users", "map_count", "hiwater_rss", "total_vm",
            "shared_vm", "exec_vm", "reserved_vm", "nr_ptes", "end_data", "last_interval",
            "nvcsw", "nivcsw", "min_flt", "maj_flt", "fs_excl_counter", "lock",
            "utime", "stime", "gtime", "cgtime", "signal_nvcsw"
        ],
        "required_from_user": ["file_name", "file_hash"],
        "optional_from_user": ["file_size", "file_extension"],
        "questions": {
            "file_name": "What is the name of the suspicious file? (e.g. update.exe)",
            "file_hash": "Do you have the file hash? (MD5 or SHA256)",
        }
    },
    "ransomware": {
        "display_name": "Ransomware Behavioral Model (ANOVA + RF)",
        "endpoint": "/predict/ransomware",
        "accuracy": "100.0%",
        "roc_auc": "N/A",
        "description": "85+ PE/registry/API behavioral metrics → SelectKBest(k=15) + Random Forest (depth=3)",
        # Ransomware model uses PE structure + behavioral OS metrics.
        # Key human-observable signals: registry changes, file encryption patterns, API calls, processes
        "api_fields": [
            "registry_delete", "registry_write", "registry_read", "registry_total",
            "processes_suspicious", "processes_malicious", "processes_monitored", "total_procsses",
            "network_connections", "network_http", "network_dns", "network_threats",
            "files_malicious", "files_suspicious", "files_unknown", "files_text",
            "ApiVector", "DllVector", "NumberOfSections", "dlls_calls", "apis"
        ],
        "required_from_user": ["processes_involved", "file_extensions"],
        "optional_from_user": ["registry_changes", "api_calls", "file_count"],
        "questions": {
            "processes_involved": "Which processes are involved in the suspicious activity? (e.g. svchost.exe, unknown.exe)",
            "file_extensions": "What file extensions are appearing on encrypted files? (e.g. .encrypted, .locked, .ransom)",
        }
    },
    "networking": {
        "display_name": "Network Anomaly Model (RF)",
        "endpoint": "/predict/networking",
        "accuracy": "99.38%",
        "roc_auc": "99.97%",
        "description": "KDD-style TCP/UDP flow features → ColumnTransformer + Random Forest (depth=10)",
        # Networking model uses KDD Cup 99 style features: protocol_type, service, flag + 38 numeric
        "api_fields": [
            "duration", "protocol_type", "service", "flag",
            "src_bytes", "dst_bytes", "land", "wrong_fragment", "urgent",
            "hot", "num_failed_logins", "logged_in", "num_compromised",
            "root_shell", "su_attempted", "num_root", "num_file_creations",
            "num_shells", "num_access_files", "num_outbound_cmds",
            "is_host_login", "is_guest_login", "count", "srv_count",
            "serror_rate", "srv_serror_rate", "rerror_rate", "srv_rerror_rate",
            "same_srv_rate", "diff_srv_rate", "srv_diff_host_rate",
            "dst_host_count", "dst_host_srv_count", "dst_host_same_srv_rate",
            "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
            "dst_host_srv_diff_host_rate", "dst_host_serror_rate",
            "dst_host_srv_serror_rate", "dst_host_rerror_rate", "dst_host_srv_rerror_rate"
        ],
        "required_from_user": ["protocol_type", "src_bytes", "dst_bytes"],
        "optional_from_user": ["duration", "service", "flag", "count"],
        "questions": {
            "protocol_type": "What protocol was used? (TCP, UDP, or ICMP)",
            "src_bytes": "How many bytes were sent from source? (approximate number)",
            "dst_bytes": "How many bytes were received at destination? (approximate number)",
        }
    },
    "zero-day": {
        "display_name": "Zero-Day Predictor (Logistic Regression)",
        "endpoint": "/predict/zero-day",
        "accuracy": "71.81%",
        "roc_auc": "N/A",
        "description": "Payload + flow behavioral features → LogisticRegression (C=1.0) — extrapolates unseen threats",
        # Zero-day model uses: protocol, flag, duration, src_bytes, dst_bytes, count, btc, usd,
        # netflow bytes, payload size, number of packets (leakage cols removed)
        "api_fields": [
            "protocol", "flag", "duration", "src_bytes", "dst_bytes",
            "land", "wrong_fragment", "urgent", "hot", "num_failed_logins",
            "logged_in", "num_compromised", "root_shell", "su_attempted",
            "num_root", "count", "srv_count", "serror_rate", "srv_serror_rate",
            "btc", "usd", "netflow bytes", "payload size", "number of packets",
            "response time", "data transfer rate"
        ],
        "required_from_user": ["raw_description"],
        "optional_from_user": ["payload_type", "context"],
        "questions": {
            "raw_description": "Describe the suspicious behavior or paste the code/log in as much detail as possible.",
        }
    }
}

# ─── File Text Extraction Helper ─────────────────────────────────────────────
def get_file_type(filename: str, content_type: str = "") -> str:
    """Detect file type from filename extension or MIME type."""
    ext = os.path.splitext(filename or "")[1].lower()
    if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]:
        return "image"
    if ext == ".pdf" or "pdf" in content_type:
        return "pdf"
    if ext in [".docx", ".doc"] or "wordprocessingml" in content_type:
        return "docx"
    if ext in [".exe", ".dll", ".bat", ".cmd", ".msi", ".apk", ".sh", ".jar", ".ps1", ".vbs", ".scr", ".com"]:
        return "executable"
    return "unknown"


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file."""
    if PdfReader is None:
        return "[Error: PyPDF2 not installed — cannot parse PDF]"
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        extracted = "\n".join(text_parts).strip()
        if not extracted:
            return "[PDF contained no extractable text — possibly scanned/image-based]"
        return extracted
    except Exception as e:
        return f"[Error extracting PDF text: {str(e)}]"


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract all text from a DOCX file."""
    if DocxDocument is None:
        return "[Error: python-docx not installed — cannot parse DOCX]"
    try:
        doc = DocxDocument(io.BytesIO(file_bytes))
        text_parts = [para.text for para in doc.paragraphs if para.text.strip()]
        extracted = "\n".join(text_parts).strip()
        if not extracted:
            return "[DOCX contained no extractable text]"
        return extracted
    except Exception as e:
        return f"[Error extracting DOCX text: {str(e)}]"


# ─── Groq API Helper ─────────────────────────────────────────────────────────
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
TEXT_MODEL = "llama-3.1-8b-instant"


async def call_groq(
    messages: List[Dict],
    timeout: float = 60.0,
    json_mode: bool = True,
    image_base64: Optional[str] = None,
    image_media_type: str = "image/jpeg",
) -> Dict:
    """
    Call Groq API. If image_base64 is provided, uses the vision model
    with multimodal content blocks. Otherwise uses the fast text model.
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    # Determine model based on whether an image is present
    use_vision = image_base64 is not None
    model = VISION_MODEL if use_vision else TEXT_MODEL

    # If vision: rewrite the last user message as multimodal content blocks
    if use_vision and messages:
        processed_messages = []
        for msg in messages:
            if msg["role"] == "user" and msg is messages[-1]:
                # Convert the last user message to multimodal format
                content_blocks = [
                    {"type": "text", "text": msg["content"]},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{image_media_type};base64,{image_base64}"
                        }
                    }
                ]
                processed_messages.append({"role": "user", "content": content_blocks})
            else:
                processed_messages.append(msg)
        messages = processed_messages

    payload = {
        "model": model,
        "messages": messages,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(GROQ_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

    content = data["choices"][0]["message"]["content"]
    if json_mode:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"raw": content}
    return {"text": content}


# ─── ML API Helper ───────────────────────────────────────────────────────────
async def call_ml_model(endpoint: str, payload: Dict, timeout: float = 30.0) -> Optional[Dict]:
    """Call the separate ML model API. Returns None on failure (graceful degradation)."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{ML_API_BASE}{endpoint}", json=payload)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        return {"error": str(e), "available": False}


# ─── Feature Extraction from LLM-parsed params ───────────────────────────────
def build_phishing_payload(extracted: Dict) -> Dict:
    return {
        "url": extracted.get("url", ""),
        "subject": extracted.get("subject", ""),
        "body": extracted.get("body", ""),
    }


def build_malware_payload(extracted: Dict) -> Dict:
    """
    Malware model uses 33 kernel-level OS metrics (prio, vm, utime, etc.)
    We synthesize plausible values from LLM-extracted behavioral indicators.
    High values for exec_vm, total_vm, prio = suspicious malware patterns.
    """
    is_suspicious = extracted.get("is_suspicious", False)
    base = {
        "millisecond": 0, "state": 0, "usage_counter": 0,
        "prio": 3069378560 if is_suspicious else 1000,
        "static_prio": 14274 if is_suspicious else 10,
        "normal_prio": 0, "policy": 0, "vm_pgoff": 0,
        "vm_truncate_count": 13173 if is_suspicious else 1000,
        "task_size": 0, "cached_hole_size": 0,
        "free_area_cache": 24 if is_suspicious else 5,
        "mm_users": 724 if is_suspicious else 50,
        "map_count": 6850 if is_suspicious else 500,
        "hiwater_rss": 0,
        "total_vm": extracted.get("total_vm_est", 150 if is_suspicious else 10),
        "shared_vm": extracted.get("shared_vm_est", 120 if is_suspicious else 10),
        "exec_vm": extracted.get("exec_vm_est", 124 if is_suspicious else 10),
        "reserved_vm": 210 if is_suspicious else 10,
        "nr_ptes": 0, "end_data": 120 if is_suspicious else 10,
        "last_interval": 3473 if is_suspicious else 100,
        "nvcsw": 341974 if is_suspicious else 1000,
        "nivcsw": 0, "min_flt": 0,
        "maj_flt": 120 if is_suspicious else 0,
        "fs_excl_counter": 0,
        "lock": 3204448256 if is_suspicious else 0,
        "utime": 380690 if is_suspicious else 10,
        "stime": 4 if is_suspicious else 1,
        "gtime": 0, "cgtime": 0, "signal_nvcsw": 0
    }
    return base


def build_ransomware_payload(extracted: Dict) -> Dict:
    """
    Ransomware model uses PE structure + behavioral OS metrics.
    Map user-visible signals (registry changes, encrypted file count, api calls) to model features.
    """
    reg_delete = int(extracted.get("registry_delete_count", 0))
    reg_write = int(extracted.get("registry_write_count", 0))
    reg_read = int(extracted.get("registry_read_count", 0))
    proc_sus = int(extracted.get("suspicious_process_count", 0))
    net_conn = int(extracted.get("network_connection_count", 0))
    files_enc = int(extracted.get("encrypted_file_count", 0))
    api_count = int(extracted.get("api_call_count", 0))

    return {
        "registry_delete": float(reg_delete),
        "registry_write": float(reg_write),
        "registry_read": float(reg_read),
        "registry_total": float(reg_delete + reg_write + reg_read),
        "processes_suspicious": float(proc_sus),
        "processes_malicious": float(max(0, proc_sus - 1)),
        "processes_monitored": float(proc_sus + 2),
        "total_procsses": float(proc_sus + 5),
        "network_connections": float(net_conn),
        "network_http": float(min(net_conn, 2)),
        "network_dns": float(min(net_conn, 1)),
        "network_threats": float(min(net_conn, 1)),
        "files_malicious": float(min(files_enc, 100)),
        "files_suspicious": float(files_enc),
        "files_unknown": float(max(0, files_enc - 50)),
        "files_text": 0.0,
        "ApiVector": float(min(api_count, 10)),
        "DllVector": float(min(api_count // 2, 5)),
        "NumberOfSections": float(extracted.get("pe_section_count", 4)),
        "dlls_calls": float(api_count),
        "apis": float(api_count),
        "CreationYear": float(extracted.get("creation_year", 2024)),
        "resources_mean_entropy": float(extracted.get("entropy_estimate", 0.5)),
        "sus_sections": float(extracted.get("suspicious_section_count", 0)),
        "packer": float(extracted.get("is_packed", 0)),
        "E_text": 0.0, "E_data": 0.0,
        "OsVersion": "unknown", "Subsystem": "unknown",
        "Machine": "unknown", "MachineType": "unknown",
        "Family": "unknown", "Category": "unknown", "file_extension": "unknown"
    }


def build_networking_payload(extracted: Dict) -> Dict:
    proto = extracted.get("protocol_type", "tcp").lower()
    if proto not in ["tcp", "udp", "icmp"]:
        proto = "tcp"
    return {
        "duration": int(extracted.get("duration", 0)),
        "protocol_type": proto,
        "service": extracted.get("service", "http").lower(),
        "flag": extracted.get("flag", "SF"),
        "src_bytes": int(extracted.get("src_bytes", 0)),
        "dst_bytes": int(extracted.get("dst_bytes", 0)),
        "land": int(extracted.get("land", 0)),
        "wrong_fragment": int(extracted.get("wrong_fragment", 0)),
        "urgent": int(extracted.get("urgent", 0)),
        "hot": int(extracted.get("hot", 0)),
        "num_failed_logins": int(extracted.get("num_failed_logins", 0)),
        "logged_in": int(extracted.get("logged_in", 0)),
        "num_compromised": int(extracted.get("num_compromised", 0)),
        "root_shell": int(extracted.get("root_shell", 0)),
        "su_attempted": int(extracted.get("su_attempted", 0)),
        "num_root": int(extracted.get("num_root", 0)),
        "num_file_creations": int(extracted.get("num_file_creations", 0)),
        "num_shells": int(extracted.get("num_shells", 0)),
        "num_access_files": int(extracted.get("num_access_files", 0)),
        "num_outbound_cmds": 0,
        "is_host_login": int(extracted.get("is_host_login", 0)),
        "is_guest_login": int(extracted.get("is_guest_login", 0)),
        "count": int(extracted.get("count", 1)),
        "srv_count": int(extracted.get("srv_count", 1)),
        "serror_rate": float(extracted.get("serror_rate", 0.0)),
        "srv_serror_rate": float(extracted.get("srv_serror_rate", 0.0)),
        "rerror_rate": float(extracted.get("rerror_rate", 0.0)),
        "srv_rerror_rate": float(extracted.get("srv_rerror_rate", 0.0)),
        "same_srv_rate": float(extracted.get("same_srv_rate", 1.0)),
        "diff_srv_rate": float(extracted.get("diff_srv_rate", 0.0)),
        "srv_diff_host_rate": float(extracted.get("srv_diff_host_rate", 0.0)),
        "dst_host_count": int(extracted.get("dst_host_count", 1)),
        "dst_host_srv_count": int(extracted.get("dst_host_srv_count", 1)),
        "dst_host_same_srv_rate": float(extracted.get("dst_host_same_srv_rate", 1.0)),
        "dst_host_diff_srv_rate": float(extracted.get("dst_host_diff_srv_rate", 0.0)),
        "dst_host_same_src_port_rate": float(extracted.get("dst_host_same_src_port_rate", 0.0)),
        "dst_host_srv_diff_host_rate": float(extracted.get("dst_host_srv_diff_host_rate", 0.0)),
        "dst_host_serror_rate": float(extracted.get("dst_host_serror_rate", 0.0)),
        "dst_host_srv_serror_rate": float(extracted.get("dst_host_srv_serror_rate", 0.0)),
        "dst_host_rerror_rate": float(extracted.get("dst_host_rerror_rate", 0.0)),
        "dst_host_srv_rerror_rate": float(extracted.get("dst_host_srv_rerror_rate", 0.0)),
    }


def build_zeroday_payload(extracted: Dict) -> Dict:
    proto = extracted.get("protocol", "tcp").upper()
    return {
        "protocol": proto,
        "flag": extracted.get("flag", "SF"),
        "duration": int(extracted.get("duration", 0)),
        "src_bytes": int(extracted.get("src_bytes", 0)),
        "dst_bytes": int(extracted.get("dst_bytes", 0)),
        "land": int(extracted.get("land", 0)),
        "wrong_fragment": int(extracted.get("wrong_fragment", 0)),
        "urgent": int(extracted.get("urgent", 0)),
        "hot": int(extracted.get("hot", 0)),
        "num_failed_logins": int(extracted.get("num_failed_logins", 0)),
        "logged_in": int(extracted.get("logged_in", 0)),
        "num_compromised": int(extracted.get("num_compromised", 0)),
        "root_shell": int(extracted.get("root_shell", 0)),
        "su_attempted": int(extracted.get("su_attempted", 0)),
        "num_root": int(extracted.get("num_root", 0)),
        "count": int(extracted.get("count", 1)),
        "srv_count": int(extracted.get("srv_count", 1)),
        "serror_rate": float(extracted.get("serror_rate", 0.0)),
        "srv_serror_rate": float(extracted.get("srv_serror_rate", 0.0)),
        "btc": float(extracted.get("btc", 0.0)),
        "usd": float(extracted.get("usd", 0.0)),
        "netflow bytes": int(extracted.get("netflow_bytes", 0)),
        "payload size": int(extracted.get("payload_size", 0)),
        "number of packets": int(extracted.get("number_of_packets", 0)),
        "response time": float(extracted.get("response_time", 0.0)),
        "data transfer rate": float(extracted.get("data_transfer_rate", 0.0)),
    }


PAYLOAD_BUILDERS = {
    "phishing": build_phishing_payload,
    "malware": build_malware_payload,
    "ransomware": build_ransomware_payload,
    "networking": build_networking_payload,
    "zero-day": build_zeroday_payload,
}

# ─── Phase 1: Router System Prompt ───────────────────────────────────────────
ROUTER_SYSTEM_PROMPT = """
You are CyberRakshak's routing engine. Analyze the user message and conversation history.

Your job: Classify the message into one of THREE primary categories:
1. EDUCATIONAL/GENERAL QUESTION: The user is asking for definitions, explanations, or general knowledge (e.g., "tell me about phishing", "what is ransomware", "how does a DDoS attack work?"). 
   -> ROUTE TO: "general_question"

2. SAFE/BENIGN INPUT: The user is asking to analyze an email, URL, or file, but it is COMPLETELY NORMAL and SAFE (e.g., standard internal company meeting invites, normal Google URLs, official software installers). There are no suspicious indicators.
   -> ROUTE TO: "safe_benign"

3. THREAT REPORT/ANALYSIS: The user is describing a potentially suspicious incident, URL, file, or activity that needs ML analysis.
   -> ROUTE TO: phishing|malware|ransomware|networking|zero-day

ROUTING RULES:
- "phishing": Analyzing a specific suspicious URL, domain, email, or SMS scam.
- "malware": Analyzing a specific suspicious file, hash, or executable.
- "ransomware": Analyzing a live ransomware incident (encrypted files, ransom notes).
- "networking": Analyzing specific network traffic anomalies or DDoS attacks currently happening.
- "zero-day": Unknown or novel attack patterns requiring deep behavioral analysis.
- "general_question": EDUCATIONAL queries. Any question asking "What is X?".
- "safe_benign": Completely normal, safe inputs that do not need ML threat analysis.

EXTRACT PARAMETERS ONLY IF IT'S A THREAT REPORT:
- For phishing: url, domain_name, subject, body, sender_email, brand_spoofed, urgency_language
- For malware: file_name, file_hash, hash_type, file_extension, file_size
- For ransomware: registry_delete_count(int), registry_write_count(int), registry_read_count(int), suspicious_process_count(int), network_connection_count(int), encrypted_file_count(int)
- For networking: protocol_type(tcp/udp/icmp), service(http/ftp/etc), flag(SF/S0/REJ/etc), src_bytes(int), dst_bytes(int)
- For zero-day: protocol, flag, src_bytes(int), dst_bytes(int), payload_size(int)

IMPORTANT — HANDLING USER DECLINING TO PROVIDE INFO:
If the user says "no", "I don't have it", "skip", or declines, set "missing_required_params" to [] and "user_declined_params" to true.

Return ONLY valid JSON:
{
  "threat_type": "phishing|malware|ransomware|networking|zero-day|general_question|safe_benign",
  "extracted_params": { ... },
  "missing_required_params": [ ... ],
  "user_declined_params": false,
  "confidence_routing": "high|medium|low",
  "routing_reason": "Briefly explain if this was an educational question, safe input, or threat report"
}
"""

# ─── Phase 3B + 5: Contextual Analysis + Report Generation Prompt ──────────
CONTEXTUAL_ANALYSIS_PROMPT = """
You are CyberRakshak's threat intelligence engine (Sudarshan Chakra AI).
You perform deep contextual analysis on the described threat.

IMPORTANT SAFEGUARD RULE:
Users will often submit normal, benign, and perfectly safe inputs (e.g., standard internal company emails like "team lunch", normal Google search URLs, safe downloads like "VLC installer from videolan.org", or normal network traffic).
The ML model might incorrectly flag them as malicious due to missing features or false positives. YOU ARE THE FINAL JUDGE.
If the input describes a completely normal, safe, and benign scenario with NO suspicious urgency, NO suspicious links, and NO requests for sensitive info, you MUST OVERRIDE the ML model.
In these safe cases:
- Set "threat_verdict" to "BENIGN"
- Set "severity" to "Low"
- Set "detection_summary" to state "No threat detected. This appears to be safe/benign."
- Set "user_alert" to "No action required. Safe to proceed."
- Provide a very low "risk_score" (e.g., 0.1 to 1.0).

Given the user's threat description and the ML model result, generate a FULL threat report.

ML Result provided will be: { prediction, confidence, model_name }

Return ONLY valid JSON matching this EXACT structure:
{
  "intent": "analyze_threat",
  "detection_summary": "One-sentence summary of what the threat is",
  "user_alert": "Immediate action the user must take RIGHT NOW",
  "severity": "Critical|High|Medium|Low",
  "cert_alert": "Official CERT-IN style alert message (formal)",
  "playbook": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "evidence_to_collect": ["Evidence item 1", "Evidence item 2", "Evidence item 3"],
  "technical_details": {
    "indicators": ["IOC 1", "IOC 2", "IOC 3"],
    "analysis": "Detailed technical explanation of how this threat works"
  },
  "ui_labels": {
    "category": "phishing|malware|fraud|espionage|opsec",
    "status": "Pending",
    "recommended_action": "Short action label (max 5 words)"
  },
  "summary": {
    "title": "Concise incident title (max 80 chars)",
    "category": "phishing|malware|fraud|espionage|opsec",
    "description": "2-3 sentence description for incident report",
    "evidenceType": "text|url|image|video|audio|file",
    "evidenceText": "Extracted text evidence if evidenceType is text, else empty string",
    "evidenceUrl": "Extracted URL if evidenceType is url, else empty string"
  },
  "threat_verdict": "MALICIOUS|BENIGN|SUSPICIOUS",
  "risk_score": 8.5,
  "recommended_actions": {
    "immediate": ["Action 1", "Action 2", "Action 3"],
    "investigation": ["Forensic step 1", "Forensic step 2"],
    "prevention": ["Policy 1", "Policy 2"]
  },
  "reporting_protocol": {
    "agency": "CERT-IN / IC3 / State Cybercrime Cell",
    "format": "Online complaint at https://cybercrime.gov.in",
    "timeline": "Within 6 hours of detection",
    "reference_id": "Will be assigned on filing"
  },
  "known_parallels": "Real-world incident this resembles (1-2 sentences)",
  "industry_impact": "Who is most vulnerable to this attack type"
}
"""

# ─── Incident ID Generator ────────────────────────────────────────────────────
def generate_incident_id() -> str:
    now = datetime.now(timezone.utc)
    rand = uuid.uuid4().hex[:5].upper()
    return f"CRX-{now.strftime('%Y%m%d')}-{rand}"


# ─── Confidence Synthesis ─────────────────────────────────────────────────────
def synthesize_confidence(ml_result: Optional[Dict], llm_verdict: str, llm_severity: str) -> Dict:
    """Combine ML probability + LLM verdict into final confidence ensemble."""
    llm_is_malicious = llm_verdict in ["MALICIOUS", "SUSPICIOUS"]
    severity_score_map = {"Critical": 1.0, "High": 0.8, "Medium": 0.5, "Low": 0.2}
    llm_score = severity_score_map.get(llm_severity, 0.5)

    if not ml_result or ml_result.get("error") or not ml_result.get("available", True):
        # ML unavailable – use LLM-only
        return {
            "final_verdict": llm_verdict,
            "confidence_level": "MEDIUM" if llm_is_malicious else "LOW",
            "ml_available": False,
            "ensemble_score": round(llm_score, 4),
            "ml_note": "ML model API unavailable — LLM-only analysis"
        }

    # Phishing / malware / ransomware / networking models return confidence directly
    ml_score = ml_result.get("confidence", None)
    if ml_score is None:
        # Zero-day returns class_probabilities dict
        probs = ml_result.get("class_probabilities", {})
        if probs:
            # Take max probability of any non-"normal" class
            normal_score = probs.get("normal", probs.get("Normal", 0))
            ml_score = 1.0 - normal_score
        else:
            ml_score = llm_score

    ml_score = float(ml_score)
    ml_is_malicious = ml_result.get("prediction", "benign") not in ["benign", "legitimate", "normal"]

    ensemble = (ml_score * 0.6) + (llm_score * 0.4)

    # Verdict logic: If LLM is highly confident it is BENIGN, it acts as an override for ML false positives
    if llm_verdict == "BENIGN":
        verdict = "BENIGN"
        confidence = "LOW"
    elif ml_is_malicious and llm_is_malicious:
        verdict = "MALICIOUS"
        confidence = "CRITICAL" if ensemble > 0.8 else "HIGH"
    elif ml_is_malicious or llm_is_malicious:
        verdict = "SUSPICIOUS"
        confidence = "MEDIUM"
    else:
        verdict = "BENIGN"
        confidence = "LOW"

    return {
        "final_verdict": verdict,
        "confidence_level": confidence,
        "ml_available": True,
        "ml_score": round(ml_score, 4),
        "llm_score": round(llm_score, 4),
        "ensemble_score": round(ensemble, 4),
        "ml_prediction": ml_result.get("prediction", "unknown"),
    }


# ─── Main Endpoint ────────────────────────────────────────────────────────────
@router.post("/api/llm/analyze")
async def analyze_input(
    history: str = Form("[]"),
    text_input: str = Form(""),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    CyberRakshak Router-to-Synthesizer Agent endpoint.
    Analyzes user threat descriptions via routing → ML inference → LLM synthesis.
    Supports multimodal input: text, images (via vision model), PDFs, and DOCX files.
    """

    # Parse conversation history
    parsed_history = []
    try:
        parsed_history = json.loads(history)
    except json.JSONDecodeError:
        pass

    # Build history for routing prompt
    history_msgs = [{"role": "system", "content": ROUTER_SYSTEM_PROMPT}]
    for msg in parsed_history[-6:]:  # Last 6 messages for context
        history_msgs.append({"role": msg["role"], "content": str(msg["content"])})

    # Handle file attachment (supports images, PDFs, DOCX)
    user_content = text_input
    image_base64 = None
    image_media_type = "image/jpeg"

    if file:
        try:
            file_bytes = await file.read()
            file_type = get_file_type(file.filename or "", file.content_type or "")

            if file_type == "image":
                # Encode image for vision model
                image_base64 = base64.b64encode(file_bytes).decode()
                # Detect MIME type
                ext = os.path.splitext(file.filename or "")[1].lower()
                mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
                            ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp"}
                image_media_type = mime_map.get(ext, "image/jpeg")
                user_content = f"{text_input}\n[Image attached: {file.filename} — analyze this image for cybersecurity threats, phishing, scams, or suspicious content]"

            elif file_type == "pdf":
                extracted_text = extract_text_from_pdf(file_bytes)
                user_content = (
                    f"{text_input}\n\n"
                    f"--- ATTACHED PDF: {file.filename} ---\n"
                    f"{extracted_text[:8000]}\n"
                    f"--- END OF PDF ---"
                )

            elif file_type == "docx":
                extracted_text = extract_text_from_docx(file_bytes)
                user_content = (
                    f"{text_input}\n\n"
                    f"--- ATTACHED DOCX: {file.filename} ---\n"
                    f"{extracted_text[:8000]}\n"
                    f"--- END OF DOCX ---"
                )

            elif file_type == "executable":
                # For executables/binaries: extract metadata for threat analysis
                file_ext = os.path.splitext(file.filename or "")[1].lower()
                file_size = len(file_bytes)
                file_md5 = hashlib.md5(file_bytes).hexdigest()
                file_sha256 = hashlib.sha256(file_bytes).hexdigest()
                user_content = (
                    f"{text_input}\n\n"
                    f"--- ATTACHED EXECUTABLE/BINARY FILE ---\n"
                    f"Filename: {file.filename}\n"
                    f"Extension: {file_ext}\n"
                    f"File Size: {file_size} bytes ({file_size / 1024:.1f} KB)\n"
                    f"MD5 Hash: {file_md5}\n"
                    f"SHA-256 Hash: {file_sha256}\n"
                    f"Content-Type: {file.content_type or 'unknown'}\n"
                    f"\nThis is a binary/executable file uploaded for malware analysis. "
                    f"Analyze the file metadata above for potential threats.\n"
                    f"--- END OF FILE METADATA ---"
                )

            else:
                # Unknown file type — try reading as plain text
                try:
                    text_content = file_bytes.decode("utf-8", errors="ignore")
                    user_content = (
                        f"{text_input}\n\n"
                        f"--- ATTACHED FILE: {file.filename} ---\n"
                        f"{text_content[:8000]}\n"
                        f"--- END OF FILE ---"
                    )
                except Exception:
                    user_content = f"{text_input}\n[File attached: {file.filename} — unsupported format]"

        except Exception as e:
            user_content = f"{text_input}\n[File upload error: {str(e)}]"

    history_msgs.append({"role": "user", "content": user_content})

    # ── Phase 1: Route ────────────────────────────────────────────────────────
    routing_result = await call_groq(
        history_msgs, timeout=30.0, json_mode=True,
        image_base64=image_base64, image_media_type=image_media_type
    )
    threat_type = routing_result.get("threat_type", "general_question")
    extracted_params = routing_result.get("extracted_params", {})
    missing_params = routing_result.get("missing_required_params", [])

    # General question — fast path, no ML needed
    if threat_type == "general_question":
        general_prompt = [
            {
                "role": "system",
                "content": (
                    "You are Sudarshan Chakra, CyberRakshak's cybersecurity AI assistant. "
                    "Answer the user's cybersecurity question clearly and helpfully. "
                    "If an image or document is attached, analyze its contents. "
                    "Format your answer with markdown for readability. Use headers, bullet points, and bold text. "
                    "\n\nIMPORTANT: If the user's question relates to a specific cybersecurity topic, "
                    "include the matching playbook_id from this list:\n"
                    "- 'phishing' — phishing attacks, suspicious emails, SMS scams\n"
                    "- 'malware' — malware, viruses, trojans, worms, suspicious files\n"
                    "- 'fraud' — financial fraud, credit card scams, identity theft\n"
                    "- 'espionage' — cyber espionage, spying, data theft by state actors\n"
                    "- 'opsec' — operational security, information disclosure\n"
                    "- 'social-engineering' — social engineering, pretexting, baiting\n"
                    "- 'deepfake' — deepfakes, synthetic media, AI-generated fakes\n"
                    "- 'insider-threats' — insider threats, disgruntled employees\n"
                    "- 'network-intrusion' — network intrusions, unauthorized access, hacking\n"
                    "- 'dos-ddos' — DDoS attacks, denial of service\n"
                    "- 'zero-day' — zero-day exploits, unpatched vulnerabilities\n"
                    "- 'fake-website' — fake websites, cloned apps, typosquatting\n"
                    "\nIf no playbook matches, set related_playbook_id to null.\n"
                    "\nReturn JSON: {\"intent\": \"general_question\", \"answer\": \"...\", \"related_playbook_id\": \"...|null\"}"
                )
            },
            *[{"role": m["role"], "content": str(m["content"])} for m in parsed_history[-4:]],
            {"role": "user", "content": user_content}
        ]
        return await call_groq(
            general_prompt, json_mode=True,
            image_base64=image_base64, image_media_type=image_media_type
        )

    # Safe/Benign fast path — bypass ML models
    if threat_type == "safe_benign":
        safe_prompt = [
            {
                "role": "system",
                "content": (
                    "You are Sudarshan Chakra, CyberRakshak's cybersecurity AI assistant. "
                    "The user has submitted an input (email, URL, file description) that is completely safe and benign. "
                    "Generate a threat analysis report confirming that this is safe, explaining briefly why it is normal. "
                    "Return ONLY valid JSON matching this EXACT structure:\n"
                    "{\n"
                    "  \"intent\": \"analyze_threat\",\n"
                    "  \"detection_summary\": \"No threat detected. This appears to be completely safe/benign.\",\n"
                    "  \"user_alert\": \"No action required. Safe to proceed.\",\n"
                    "  \"severity\": \"Low\",\n"
                    "  \"cert_alert\": \"N/A\",\n"
                    "  \"playbook\": [],\n"
                    "  \"evidence_to_collect\": [],\n"
                    "  \"technical_details\": {\"indicators\": [], \"analysis\": \"Explain briefly why this input is safe (e.g. normal internal email, official domain).\"},\n"
                    "  \"ui_labels\": {\"category\": \"phishing\", \"status\": \"Safe\", \"recommended_action\": \"No action needed\"},\n"
                    "  \"summary\": {\"title\": \"Benign Input Detected\", \"category\": \"phishing\", \"description\": \"Input is safe.\", \"evidenceType\": \"file\", \"evidenceText\": \"\", \"evidenceUrl\": \"\"},\n"
                    "  \"threat_verdict\": \"BENIGN\",\n"
                    "  \"risk_score\": 0.5,\n"
                    "  \"recommended_actions\": {\"immediate\": [], \"investigation\": [], \"prevention\": []},\n"
                    "  \"reporting_protocol\": {\"agency\": \"N/A\", \"format\": \"N/A\", \"timeline\": \"N/A\", \"reference_id\": \"N/A\"},\n"
                    "  \"known_parallels\": \"N/A\",\n"
                    "  \"industry_impact\": \"N/A\",\n"
                    "  \"ml_analysis\": {\"model_used\": \"LLM Context Engine (Bypass)\", \"prediction\": \"benign\", \"threat_probability\": 0.01}\n"
                    "}"
                )
            },
            *[{"role": m["role"], "content": str(m["content"])} for m in parsed_history[-4:]],
            {"role": "user", "content": user_content}
        ]
        return await call_groq(
            safe_prompt, json_mode=True,
            image_base64=image_base64, image_media_type=image_media_type
        )

    # ── Phase 2: Parameter Validation ────────────────────────────────────────
    model_meta = MODEL_METADATA.get(threat_type, MODEL_METADATA["zero-day"])

    if missing_params:
        questions = []
        for param in missing_params:
            q = model_meta["questions"].get(param)
            if q:
                questions.append(f"• **{param.replace('_', ' ').title()}**: {q}")

        if questions:
            question_text = (
                f"To analyze this **{threat_type.title()} threat** with the "
                f"**{model_meta['display_name']}**, I need a few more details:\n\n"
                + "\n".join(questions)
                + "\n\n_Optional info you can also share for higher accuracy:_\n"
                + "\n".join(
                    f"• {p.replace('_', ' ').title()}"
                    for p in model_meta.get("optional_from_user", [])
                )
            )
            return {
                "intent": "request_information",
                "answer": question_text,
                "routing_model": threat_type,
                "missing_params": missing_params
            }

    # ── Phase 3: Build ML payload & Run parallel analysis ────────────────────
    payload_builder = PAYLOAD_BUILDERS.get(threat_type, build_zeroday_payload)
    ml_payload = payload_builder(extracted_params)

    # Build contextual analysis prompt
    contextual_msgs = [
        {"role": "system", "content": CONTEXTUAL_ANALYSIS_PROMPT},
        *[{"role": m["role"], "content": str(m["content"])} for m in parsed_history[-4:]],
        {
            "role": "user",
            "content": (
                f"Threat Type: {threat_type.upper()}\n"
                f"User Description: {user_content}\n"
                f"Extracted Indicators: {json.dumps(extracted_params, indent=2)}\n"
                f"Routing Reason: {routing_result.get('routing_reason', '')}\n"
                f"Model: {model_meta['display_name']}"
            )
        }
    ]

    # Run ML inference and LLM contextual analysis in parallel (Phase 3A + 3B)
    ml_task = call_ml_model(model_meta["endpoint"], ml_payload)
    llm_task = call_groq(
        contextual_msgs, timeout=60.0, json_mode=True,
        image_base64=image_base64, image_media_type=image_media_type
    )
    ml_result, llm_report = await asyncio.gather(ml_task, llm_task)

    # ── Phase 4: Synthesis ────────────────────────────────────────────────────
    llm_verdict = llm_report.get("threat_verdict", "SUSPICIOUS")
    llm_severity = llm_report.get("severity", "Medium")
    synthesis = synthesize_confidence(ml_result, llm_verdict, llm_severity)

    incident_id = generate_incident_id()
    risk_score = round(synthesis["ensemble_score"] * 10, 1)

    # Override LLM verdict with synthesized consensus
    llm_report["threat_verdict"] = synthesis["final_verdict"]
    llm_report["risk_score"] = risk_score

    # ── Phase 5: Assemble Final Report ───────────────────────────────────────
    ml_analysis = {
        "model_used": model_meta["display_name"],
        "model_accuracy": model_meta["accuracy"],
        "model_roc_auc": model_meta["roc_auc"],
        "model_description": model_meta["description"],
        "threat_probability": synthesis.get("ml_score", synthesis["ensemble_score"]),
        "prediction": ml_result.get("prediction", "unknown") if ml_result and not ml_result.get("error") else "unavailable",
        "confidence_level": synthesis["confidence_level"],
        "ml_available": synthesis["ml_available"],
        "ensemble_score": synthesis["ensemble_score"],
        "feature_payload": ml_payload,
    }
    if ml_result and "class_probabilities" in ml_result:
        ml_analysis["class_probabilities"] = ml_result["class_probabilities"]
    if synthesis.get("ml_note"):
        ml_analysis["ml_note"] = synthesis["ml_note"]

    # Merge everything into the response
    response = {
        **llm_report,
        "intent": "analyze_threat",
        "ml_analysis": ml_analysis,
        "incident_id": incident_id,
        "routing_model": threat_type,
        "confidence_ensemble": synthesis,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Ensure backward-compatible fields exist
    response.setdefault("detection_summary", f"Potential {threat_type} threat detected")
    response.setdefault("user_alert", "Review the threat details and take immediate action")
    response.setdefault("severity", llm_severity)
    response.setdefault("cert_alert", f"CERT-IN Alert: {threat_type.upper()} threat detected")
    response.setdefault("playbook", ["Isolate affected system", "Preserve evidence", "Report to CERT-IN"])
    response.setdefault("evidence_to_collect", ["System logs", "Network traffic captures"])
    response.setdefault("technical_details", {"indicators": [], "analysis": "Analysis in progress"})
    response.setdefault("ui_labels", {"category": "malware", "status": "Pending", "recommended_action": "Investigate"})
    response.setdefault("summary", {
        "title": f"{threat_type.title()} threat detected",
        "category": "malware",
        "description": response.get("detection_summary", ""),
        "evidenceType": "text",
        "evidenceText": user_content[:500],
        "evidenceUrl": extracted_params.get("url", "")
    })

    return response
