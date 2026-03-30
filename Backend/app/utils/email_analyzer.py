from typing import Dict, Optional
from app.utils.ml_service import get_ml_prediction
import re
import logging

logger = logging.getLogger(__name__)


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
        Analyze email for phishing and other threats
        
        Args:
            email_data: Dict with keys: subject, body, from, urls
            
        Returns:
            Dict with analysis results including phishing_score and threat_level
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
            
            return {
                "phishing_score": phishing_score,
                "threat_level": threat_level,
                "features_extracted": features,
                "ml_analysis": ml_result,
                "threat_indicators": self._get_threat_indicators(features, email_data)
            }
        except Exception as e:
            logger.error(f"Error analyzing email: {e}")
            return {
                "phishing_score": 0,
                "threat_level": "unknown",
                "features_extracted": {},
                "ml_analysis": None,
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
        
        # Start with ML model result if available
        if ml_result and 'prediction' in ml_result:
            score = ml_result['prediction'] * 100
        
        # Apply additional heuristics
        if features.get('suspicious_sender'):
            score += 15.0
        
        if features.get('has_spoofed_links'):
            score += 25.0
        
        if features.get('has_url_shortener'):
            score += 15.0
        
        if features.get('has_urgent_keywords'):
            score += 10.0
        
        urgency = features.get('urgency_score', 0)
        score += urgency * 20
        
        # Boost if not a safe sender
        if not features.get('suspicious_sender'):
            score -= 10.0  # Reduce score for safe senders
        
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
