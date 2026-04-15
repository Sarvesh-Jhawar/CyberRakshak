from typing import Dict, Optional
from app.utils.ml_service import get_ml_prediction
import re
import logging
import httpx
import os
import json
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)

# LLM API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class EmailAnalyzer:
    """Analyze emails for phishing and threats using ML models"""
    
    # Phishing keywords that increase suspicion
    URGENT_KEYWORDS = ['urgent', 'verify', 'confirm', 'suspended', 'locked', 'action required',
                       'immediate action', 'click here', 'validate', 'update', 'reactivate',
                       'alert', 'warning', 'threat', 'security']
    
    # Safe domains (verified senders)
    SAFE_DOMAINS = {
        'github.com', 'github.io',
        'amazon.com', 'aws.amazon.com',
        'google.com', 'accounts.google.com',
        'microsoft.com', 'outlook.com',
        'paypal.com', 'ebay.com',
        'twitter.com', 'linkedin.com',
        'slack.com', 'stripe.com'
    }
    
    async def analyze_email(self, email_data: Dict) -> Dict:
        """
        Analyze email for phishing and other threats using ML + LLM
        
        Args:
            email_data: Dict with keys: subject, body, from, urls
            
        Returns:
            Dict with analysis results including phishing_score, threat_level, ml_analysis, and llm_analysis
        """
        try:
            # Extract features from email
            features = self._extract_phishing_features(email_data)
            
            # Call ML phishing model
            ml_result = await get_ml_prediction("phishing", features)
            
            # Calculate phishing score (0-100)
            phishing_score = self._calculate_phishing_score(ml_result, features, email_data)
            
            # Determine threat level
            threat_level = self._get_threat_level(phishing_score)
            
            # Get LLM contextual analysis
            llm_analysis = await self._get_llm_analysis(email_data, ml_result)
            
            # Combine ML and LLM analysis
            combined_analysis = {
                "ml_analysis": self._format_ml_analysis(ml_result, threat_level),
                "llm_analysis": llm_analysis,
                "threat_indicators": self._get_threat_indicators(features, email_data),
                "features_extracted": features
            }
            
            return {
                "phishing_score": phishing_score,
                "threat_level": threat_level,
                "ml_analysis": combined_analysis,
                "llm_analysis": llm_analysis,  # Keep for backward compatibility
                "threat_indicators": self._get_threat_indicators(features, email_data)
            }
        except Exception as e:
            logger.error(f"Error analyzing email: {e}")
            return {
                "phishing_score": 0,
                "threat_level": "unknown",
                "ml_analysis": {"error": str(e)},
                "llm_analysis": {"error": str(e)},
                "threat_indicators": []
            }
    
    def _extract_phishing_features(self, email_data: Dict) -> Dict:
        """Extract features for phishing detection model"""
        subject = email_data.get('subject', '').lower()
        body = email_data.get('body', '').lower()
        from_addr = email_data.get('from', '').lower()
        urls = email_data.get('urls', [])
        
        return {
            "subject": email_data.get('subject', ''),
            "body": body[:500],  # First 500 chars
            "sender_domain": self._extract_domain(from_addr),
            "has_urls": len(urls) > 0,
            "url_count": len(urls),
            "has_urgent_keywords": any(kw in body or kw in subject for kw in self.URGENT_KEYWORDS),
            "has_spoofed_links": self._check_spoofed_links(from_addr, urls),
            "has_url_shortener": self._check_url_shortener(urls),
            "suspicious_sender": not self._is_safe_sender(from_addr),
            "urgency_score": self._calculate_urgency_score(subject, body),
            "num_urls": len(urls),
            "has_attachments": False  # Could be extended for attachment analysis
        }
    
    def _extract_domain(self, email_addr: str) -> str:
        """Extract domain from email address"""
        try:
            return email_addr.split('@')[1] if '@' in email_addr else ''
        except:
            return ''
    
    def _is_safe_sender(self, from_addr: str) -> bool:
        """Check if sender domain is in safe domains list"""
        domain = self._extract_domain(from_addr)
        return domain in self.SAFE_DOMAINS
    
    def _check_spoofed_links(self, from_addr: str, urls: list) -> bool:
        """Check if sender domain doesn't match URLs"""
        sender_domain = self._extract_domain(from_addr)
        if not sender_domain or not urls:
            return False
        
        # Extract domains from URLs
        url_domains = [self._extract_url_domain(url) for url in urls]
        
        # Check if any URL doesn't match sender domain
        for url_domain in url_domains:
            if url_domain and url_domain != sender_domain:
                return True
        return False
    
    def _extract_url_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            # Remove protocol
            url = url.replace('https://', '').replace('http://', '')
            # Get domain part
            domain = url.split('/')[0].split(':')[0]
            # Remove subdomain if present (keep only main domain)
            parts = domain.split('.')
            if len(parts) >= 2:
                return '.'.join(parts[-2:])
            return domain
        except:
            return ''
    
    def _check_url_shortener(self, urls: list) -> bool:
        """Check for URL shortener services"""
        shorteners = ['bit.ly', 'tinyurl.com', 'short.url', 'goo.gl', 'clickmeter.com', 'ow.ly']
        return any(shortener in url for url in urls for shortener in shorteners)
    
    def _calculate_urgency_score(self, subject: str, body: str) -> float:
        """Calculate urgency score (0-1) based on keywords and punctuation"""
        score = 0.0
        text = (subject + ' ' + body).lower()
        
        # Check urgent keywords
        urgent_count = sum(1 for kw in self.URGENT_KEYWORDS if kw in text)
        score += min(urgent_count * 0.15, 0.5)
        
        # Check excessive punctuation
        if '!!!' in text or '???' in text:
            score += 0.2
        
        # Check all caps words (threat language)
        caps_words = len([w for w in text.split() if w.isupper() and len(w) > 2])
        score += min(caps_words * 0.05, 0.2)
        
        return min(score, 1.0)
    
    def _calculate_phishing_score(self, ml_result: Optional[Dict], features: Dict, email_data: Dict) -> float:
        """Calculate final phishing score (0-100)"""
        score = 0.0
        
        # Start with ML model confidence probability (0.0–1.0) scaled to 0–60
        # Use 'confidence' (probability) not raw 'prediction' (0 or 1)
        if ml_result:
            confidence = ml_result.get('confidence', None)
            if confidence is not None:
                # Scale confidence to contribute up to 60 points
                score = float(confidence) * 60.0
            elif 'prediction' in ml_result:
                # Fallback: if only binary prediction available, use a moderate score
                score = 30.0 if ml_result['prediction'] == 1 else 5.0
        
        # Apply heuristics — each contributes a reasonable portion of the remaining 40 points
        if features.get('has_spoofed_links'):
            score += 15.0  # Strong signal — domain mismatch
        
        if features.get('suspicious_sender'):
            score += 8.0   # Sender not in known-safe list
        
        if features.get('has_url_shortener'):
            score += 8.0   # URL shorteners hide destinations
        
        if features.get('has_urgent_keywords'):
            score += 5.0   # Social engineering language
        
        urgency = features.get('urgency_score', 0)
        score += urgency * 10  # Urgency contributes up to 10 more points
        
        # Reduce score for verified safe senders
        if not features.get('suspicious_sender'):
            score -= 8.0
        
        return min(max(score, 0.0), 100.0)  # Clamp between 0-100
    
    def _get_threat_level(self, phishing_score: float) -> str:
        """Determine threat level based on score"""
        if phishing_score < 20:
            return "safe"
        elif phishing_score < 60:
            return "suspicious"
        else:
            return "malicious"
    
    def _get_threat_indicators(self, features: Dict, email_data: Dict) -> list:
        """Get detailed threat indicators for display"""
        indicators = []
        
        if features.get('suspicious_sender'):
            indicators.append({
                "type": "SENDER_SPOOFING",
                "description": "Unknown or suspicious sender domain",
                "severity": "high"
            })
        
        if features.get('has_spoofed_links'):
            indicators.append({
                "type": "DOMAIN_MISMATCH",
                "description": "URLs don't match sender domain",
                "severity": "high"
            })
        
        if features.get('has_url_shortener'):
            indicators.append({
                "type": "URL_SHORTENER",
                "description": "Email contains URL shorteners (often used to hide malicious links)",
                "severity": "medium"
            })
        
        if features.get('has_urgent_keywords'):
            indicators.append({
                "type": "SOCIAL_ENGINEERING",
                "description": "Email uses urgency and pressure tactics",
                "severity": "medium"
            })
        
        return indicators
    
    async def _get_llm_analysis(self, email_data: Dict, ml_result: Optional[Dict]) -> Dict:
        """Get LLM contextual analysis for the email"""
        if not GROQ_API_KEY:
            return {"error": "GROQ_API_KEY not configured"}
        
        try:
            # Prepare email content for LLM analysis
            subject = email_data.get('subject', '')
            body = email_data.get('body', '')[:1000]  # Limit body length
            sender = email_data.get('from', '')
            
            # Create analysis prompt
            analysis_prompt = f"""
Analyze this email for security threats. Provide a detailed assessment.

EMAIL DETAILS:
Subject: {subject}
From: {sender}
Body: {body}

ML Analysis Result: {json.dumps(ml_result) if ml_result else 'No ML analysis available'}

Return ONLY valid JSON with this structure:
{{
  "threat_verdict": "MALICIOUS|SUSPICIOUS|BENIGN",
  "severity": "Critical|High|Medium|Low",
  "detection_summary": "One-sentence summary of the threat",
  "user_alert": "Immediate action the user should take",
  "technical_details": {{
    "indicators": ["IOC 1", "IOC 2"],
    "analysis": "Detailed technical explanation"
  }},
  "recommended_actions": {{
    "immediate": ["Action 1", "Action 2"],
    "investigation": ["Step 1", "Step 2"],
    "prevention": ["Measure 1", "Measure 2"]
  }},
  "playbook": ["Investigation step 1", "Investigation step 2"],
  "evidence_to_collect": ["Evidence item 1", "Evidence item 2"]
}}
"""
            
            # Call Groq API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    GROQ_URL,
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": [
                            {"role": "system", "content": "You are CyberRakshak's email security analyzer. Analyze emails for threats and provide actionable security recommendations."},
                            {"role": "user", "content": analysis_prompt}
                        ],
                        "response_format": {"type": "json_object"}
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                # Extract the JSON response
                content = result["choices"][0]["message"]["content"]
                return json.loads(content)
                
        except Exception as e:
            logger.error(f"Error getting LLM analysis: {e}")
            return {"error": str(e)}
    
    def _format_ml_analysis(self, ml_result: Optional[Dict], threat_level: str) -> Dict:
        """Format ML analysis results for consistent display"""
        if not ml_result:
            return {
                "model_used": "Phishing Evaluator (RF)",
                "model_accuracy": "99.86%",
                "model_roc_auc": "99.95%",
                "model_description": "Custom URL-structure + text-feature extraction + Random Forest",
                "threat_probability": 0.0,
                "prediction": "unknown",
                "confidence_level": "LOW",
                "ml_available": False,
                "ml_note": "ML model API unavailable"
            }
        
        # Format the ML result for display
        formatted = {
            "model_used": "Phishing Evaluator (RF)",
            "model_accuracy": "99.86%",
            "model_roc_auc": "99.95%",
            "model_description": "Custom URL-structure + text-feature extraction + Random Forest",
            "threat_probability": ml_result.get("confidence", ml_result.get("prediction", 0)),
            "prediction": ml_result.get("prediction", "unknown"),
            "confidence_level": "HIGH" if ml_result.get("confidence", 0) > 0.8 else "MEDIUM" if ml_result.get("confidence", 0) > 0.5 else "LOW",
            "ml_available": True
        }
        
        # Add class probabilities if available
        if "class_probabilities" in ml_result:
            formatted["class_probabilities"] = ml_result["class_probabilities"]
        
        return formatted
