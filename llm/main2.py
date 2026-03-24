import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from the main backend .env file
# Adjust the path if your script is in a different location relative to the .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'Backend', '.env')
load_dotenv(dotenv_path=dotenv_path)

# -----------------------------
# Configuration
# -----------------------------
# Use the key from the environment file
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    # Fallback to the hardcoded key if not in .env
    OPENROUTER_API_KEY = "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"

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# -----------------------------
# Step 1: User input
# -----------------------------
text_input = "I received an email from 'noreply@microsft.com' with the subject 'Action Required: Unusual sign-in activity'. It says I need to verify my account by clicking a link. The link looks like http://microsft-security-update.com/login. Is this a phishing attempt?"
# Image processing is disabled in the backend, so this script will only test text input.
image_path = None  # r"C:\Users\anura\Desktop\ai\image.png"

# -----------------------------
# Step 2: Analyze text with DeepSeek
# -----------------------------
if image_path and os.path.exists(image_path):
    print(f"Image found at {image_path}, but image processing is disabled. Analyzing text input only.")

print("Analyzing text with DeepSeek...")

deepseek_headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json"
}

deepseek_prompt = f"""
You are a cyber incident assistant specializing in Phishing and Spear-Phishing threats. 
Analyze the following input and generate a structured JSON object with:
1. detection_summary
2. user_alert
3. playbook
4. evidence_to_collect
5. severity
6. cert_alert
7. technical_details
8. ui_labels

Rules: Output only valid JSON, keep end-user language simple and actionable.

INPUT: {text_input}
"""

deepseek_data = {
    "model": "deepseek/deepseek-chat-v3.1:free",
    "messages": [{"role": "user", "content": deepseek_prompt}],
    "max_tokens": 2048,
    "response_format": {"type": "json_object"}
}

try:
    deepseek_response = requests.post(OPENROUTER_URL, headers=deepseek_headers, data=json.dumps(deepseek_data), timeout=30)
    deepseek_response.raise_for_status()  # Raise an exception for bad status codes
    result = deepseek_response.json()

    deepseek_json_str = None
    if "choices" in result and len(result["choices"]) > 0:
        choice = result["choices"][0]
        deepseek_json_str = choice.get("message", {}).get("content")

    if deepseek_json_str:
        try:
            # Try to parse and pretty-print the JSON
            parsed_json = json.loads(deepseek_json_str)
            print("\nDeepSeek JSON Analysis:\n")
            print(json.dumps(parsed_json, indent=2))
        except json.JSONDecodeError:
            print("\nDeepSeek returned a non-JSON string:\n", deepseek_json_str)
    else:
        print("DeepSeek response missing 'content'. Full response:")
        print(result)
except requests.RequestException as e:
    print(f"DeepSeek request failed: {e}")
except json.JSONDecodeError as e:
    print(f"Failed to decode DeepSeek JSON response: {e}")
    print("Raw response:", deepseek_response.text)
