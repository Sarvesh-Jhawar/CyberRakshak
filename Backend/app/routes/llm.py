import os
import httpx
import json
import base64
import uuid
from fastapi import APIRouter, HTTPException, status, Form, File, UploadFile, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
from dotenv import load_dotenv
from app.utils.auth import get_current_user  # ✅ keep auth for user login

load_dotenv()

router = APIRouter(tags=["LLM"])

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is required")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

class ChatMessageHistory(BaseModel):
    role: str
    content: str

async def call_groq_api(messages: List[Dict], timeout: float = 60.0) -> Dict:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": messages,
        "response_format": {"type": "json_object"}
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(GROQ_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        if "choices" in data and len(data["choices"]) > 0:
            choice = data["choices"][0]
            message_content = choice.get("message", {}).get("content")
            if message_content:
                try:
                    return json.loads(message_content)
                except json.JSONDecodeError:
                    return {"intent": "general_question", "answer": message_content}

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Groq AI response missing content.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code,
                            detail=f"Groq AI request failed: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Unexpected error: {str(e)}")

@router.post("/api/llm/analyze")
async def analyze_input(
    history: str = Form("[]"),
    text_input: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Handles a single chat turn. Keeps conversation only in memory/localStorage.
    """
    system_prompt = '''
    You are Sudarshan Chakra, an intelligent cybersecurity assistant for CyberRakshak.

    Classify every user message into one of these intents: "analyze_threat", "general_question", or "complaint_filing".

    --- INTENT: general_question ---
    Return: {"intent": "general_question", "answer": "..."}

    --- INTENT: analyze_threat ---
    When the user shares suspicious content (email, SMS, URL, logs, screenshots, malware reports, etc.), perform a full threat analysis AND simultaneously extract complaint filing fields.
    Return this exact JSON structure:
    {
        "intent": "analyze_threat",
        "detection_summary": "One-sentence summary of the threat",
        "user_alert": "Immediate action the user should take",
        "severity": "Low|Medium|High|Critical",
        "cert_alert": "Official CERT-style alert message",
        "playbook": ["Step 1", "Step 2", "Step 3"],
        "evidence_to_collect": ["Evidence item 1", "Evidence item 2"],
        "technical_details": {
            "indicators": ["IOC 1", "IOC 2"],
            "analysis": "Technical explanation"
        },
        "ui_labels": {
            "category": "phishing|malware|fraud|espionage|opsec",
            "status": "Pending",
            "recommended_action": "Short action label"
        },
        "summary": {
            "title": "Concise incident title (max 80 chars)",
            "category": "phishing|malware|fraud|espionage|opsec",
            "description": "2-3 sentence description suitable for an incident report",
            "evidenceType": "text|url|image|video|audio|file",
            "evidenceText": "Extracted text evidence if evidenceType is text, else empty string",
            "evidenceUrl": "Extracted URL if evidenceType is url, else empty string"
        }
    }
    Rules for summary fields:
    - category must be one of: phishing, malware, fraud, espionage, opsec
    - evidenceType must be one of: text, url, image, video, audio, file
    - If a URL is provided, set evidenceType to "url" and put it in evidenceUrl
    - If text/SMS/email content is provided, set evidenceType to "text" and put it in evidenceText
    - Always generate a title and description even if not explicitly stated by the user

    --- INTENT: complaint_filing (only when user explicitly says "file complaint" or "ACTION:START_COMPLAINT") ---
    Extract all complaint fields from conversation history and return:
    {
        "intent": "complaint_ready",
        "detection_summary": "...", "user_alert": "...", "severity": "...", "cert_alert": "...",
        "playbook": ["..."], "evidence_to_collect": ["..."],
        "technical_details": {"indicators": ["..."], "analysis": "..."},
        "ui_labels": {"category": "...", "status": "Pending", "recommended_action": "..."},
        "summary": {
            "title": "...", "category": "phishing|malware|fraud|espionage|opsec",
            "description": "...", "evidenceType": "text|url|image|video|audio|file",
            "evidenceText": "...", "evidenceUrl": "..."
        }
    }

    Always return valid JSON only. Never return plain text.
    '''

    messages_final = [{"role": "system", "content": system_prompt}]

    # Add previous conversation
    try:
        parsed_history = json.loads(history)
        for msg in parsed_history:
            messages_final.append({"role": msg["role"], "content": msg["content"]})
    except json.JSONDecodeError:
        pass

    # Add new user input
    user_content = [{"type": "text", "text": text_input}]
    if image:
        try:
            image_bytes = await image.read()
            encoded_image = base64.b64encode(image_bytes).decode()
            user_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{image.content_type};base64,{encoded_image}"}
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

    messages_final.append({"role": "user", "content": user_content})

    # Call Groq
    return await call_groq_api(messages_final)
