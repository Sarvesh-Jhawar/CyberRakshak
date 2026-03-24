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
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

class ChatMessageHistory(BaseModel):
    role: str
    content: str

async def call_mistral_api(messages: List[Dict], timeout: float = 60.0) -> Dict:
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "mistral-large-latest",
        "messages": messages,
        "response_format": {"type": "json_object"}
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(MISTRAL_URL, headers=headers, json=payload)
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
                            detail="Mistral AI response missing content.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code,
                            detail=f"Mistral AI request failed: {e.response.text}")
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
    You are Sudarshan Chakra, an intelligent cybersecurity assistant.
    - Classify messages as either "analyze_threat", "general_question", or "complaint_filing".
    - For "general_question": return {"intent":"general_question","answer":"..."}.
    - For "analyze_threat": return a JSON object with the following structure: { "intent": "analyze_threat", "detection_summary": "...", "user_alert": "...", "playbook": ["...", "..."], "evidence_to_collect": ["...", "..."], "severity": "...", "cert_alert": "...", "technical_details": { "indicators": ["...", "..."], "analysis": "..." }, "ui_labels": { "category": "...", "status": "...", "recommended_action": "..." } }.
    - For "complaint_filing":
        - The goal is to collect the following information for a complaint: "title", "category", "description", "evidenceType", "evidenceText", "evidenceUrl".
        - **Crucially, you must proactively extract and infer all possible complaint fields from the user's current input and the entire conversation history.** Do not ask for information if it can be extracted, inferred, or reasonably generated.
        - Maintain a `complaint_data` object in the state to store collected information.
        - When the user's current input is "ACTION:START_COMPLAINT" or a clear complaint is initiated, immediately attempt to fill all fields.
        - **Extraction and Inference Guidelines:**
            - **Title:** If not explicitly provided, infer a concise title from the initial complaint (e.g., "Spam SMS Received", "Suspicious Email").
            - **Category:** If not explicitly provided, infer from keywords. If "spam sms", "phishing email", "suspicious link", categorize as "phishing". If "virus", "malware", categorize as "malware". **Always return the category in lowercase.**
            - **Description:** If not explicitly provided, generate a brief, generic description based on the inferred category and title (e.g., "Received an unsolicited SMS message, likely a phishing attempt, containing a suspicious link.").
            - **Evidence Type:** If not explicitly provided, infer from the context. If "sms" or "text", default to "text". If a link is provided, use "url". If "image", "video", "audio", "file" are mentioned, use those. **Always return the evidenceType in lowercase.**
            - **Evidence Text:** If "evidenceType" is "text", extract the content of the message or relevant text.
            - **Evidence URL:** If "evidenceType" is "url", extract the URL.
        - If all chat-collectable details ("title", "category", "description", "evidenceType", "evidenceText" OR "evidenceUrl") are gathered (either extracted, inferred, or generated), also perform a threat analysis and return a JSON object with the following structure:
        {
            "intent": "complaint_ready",
            "detection_summary": "...",
            "user_alert": "...",
            "playbook": ["...", "..."],
            "evidence_to_collect": ["...", "..."],
            "severity": "...",
            "cert_alert": "...",
            "technical_details": {
                "indicators": ["...", "..."],
                "analysis": "..."
            },
            "ui_labels": {
                "category": "...",
                "status": "...",
                "recommended_action": "..."
            },
            "summary": {
                "title": "...",
                "category": "...",
                "description": "...",
                "evidenceType": "...",
                "evidenceText": "...",
                "evidenceUrl": "..."
            }
        }
        Fill in the "..." with the collected and analyzed information.
        - If not all details are gathered, determine the next *missing* piece of information and ask for it. Prioritize asking for "title", then "category", then "description", then "evidenceType", then "evidenceText" or "evidenceUrl" based on "evidenceType".
        - Example for asking: {"intent": "ask_complaint_field", "field": "title", "question": "Please provide the Incident Title."}
    Always return valid JSON.
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

    # Call Mistral
    return await call_mistral_api(messages_final)
