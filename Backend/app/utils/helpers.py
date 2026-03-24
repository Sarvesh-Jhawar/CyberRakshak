from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import string

def generate_random_string(length: int = 8) -> str:
    """Generate a random string of specified length"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def generate_incident_id() -> str:
    """Generate a unique incident ID"""
    import time
    timestamp = str(int(time.time()))
    return f"INC-{timestamp[-6:]}"

def format_datetime(dt: datetime) -> str:
    """Format datetime for API responses"""
    return dt.isoformat()

def parse_datetime(dt_str: str) -> datetime:
    """Parse datetime string from API requests"""
    try:
        return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
    except:
        return datetime.utcnow()

def calculate_response_time(created_at: datetime, resolved_at: Optional[datetime] = None) -> int:
    """Calculate response time in hours"""
    if resolved_at:
        delta = resolved_at - created_at
        return int(delta.total_seconds() / 3600)
    else:
        delta = datetime.utcnow() - created_at
        return int(delta.total_seconds() / 3600)

def get_risk_level(incident_data: Dict[str, Any]) -> str:
    """Calculate risk level based on incident data"""
    category = incident_data.get("category", "").lower()
    description = incident_data.get("description", "").lower()
    
    # High-risk keywords
    high_risk_keywords = ["classified", "secret", "top secret", "confidential", "espionage", "breach"]
    critical_keywords = ["ransomware", "apt", "nation-state", "critical infrastructure"]
    
    if any(keyword in description for keyword in critical_keywords):
        return "Critical"
    elif any(keyword in description for keyword in high_risk_keywords):
        return "High"
    elif category in ["malware", "espionage"]:
        return "High"
    elif category in ["phishing", "opsec"]:
        return "Medium"
    else:
        return "Low"

def generate_analytics_data() -> Dict[str, List[Dict[str, Any]]]:
    """Generate mock analytics data"""
    # Monthly data for the last 12 months
    monthly_data = []
    for i in range(12):
        month = datetime.utcnow() - timedelta(days=30 * i)
        monthly_data.append({
            "month": month.strftime("%Y-%m"),
            "incidents": random.randint(10, 50),
            "resolved": random.randint(8, 45),
            "avg_response_time": random.randint(2, 24)
        })
    
    # Threat types distribution
    threat_types = [
        {"type": "Phishing", "count": random.randint(20, 40), "percentage": 35},
        {"type": "Malware", "count": random.randint(15, 30), "percentage": 25},
        {"type": "Fraud", "count": random.randint(10, 25), "percentage": 20},
        {"type": "OPSEC", "count": random.randint(5, 15), "percentage": 12},
        {"type": "Espionage", "count": random.randint(2, 8), "percentage": 8}
    ]
    
    # Department risk levels
    departments = ["Cyber Command", "Intelligence", "Communications", "IT Security", "Operations", "Logistics"]
    department_risk = []
    for dept in departments:
        department_risk.append({
            "department": dept,
            "risk_level": random.choice(["Low", "Medium", "High"]),
            "incidents": random.randint(5, 25),
            "avg_response_time": random.randint(4, 48)
        })
    
    # Response times over time
    response_times = []
    for i in range(30):
        date = datetime.utcnow() - timedelta(days=i)
        response_times.append({
            "date": date.strftime("%Y-%m-%d"),
            "avg_response_time": random.randint(2, 36),
            "incidents_resolved": random.randint(1, 10)
        })
    
    return {
        "monthly_data": monthly_data,
        "threat_types": threat_types,
        "department_risk": department_risk,
        "response_times": response_times
    }

def generate_system_status() -> List[Dict[str, Any]]:
    """Generate system status data"""
    services = [
        {"service": "Database", "status": "online", "uptime": "99.9%", "lastCheck": "2 minutes ago"},
        {"service": "Authentication", "status": "online", "uptime": "99.8%", "lastCheck": "1 minute ago"},
        {"service": "File Storage", "status": "online", "uptime": "99.7%", "lastCheck": "3 minutes ago"},
        {"service": "ML Models", "status": "online", "uptime": "99.5%", "lastCheck": "5 minutes ago"},
        {"service": "Notification Service", "status": "online", "uptime": "99.6%", "lastCheck": "2 minutes ago"}
    ]
    return services

def generate_admin_actions() -> List[Dict[str, Any]]:
    """Generate recent admin actions"""
    actions = [
        {
            "id": generate_random_string(8),
            "action": "Updated security settings",
            "user": "admin@defence.mil",
            "timestamp": datetime.utcnow() - timedelta(hours=1),
            "type": "security"
        },
        {
            "id": generate_random_string(8),
            "action": "Exported incident reports",
            "user": "admin@defence.mil",
            "timestamp": datetime.utcnow() - timedelta(hours=2),
            "type": "export"
        },
        {
            "id": generate_random_string(8),
            "action": "Created new user account",
            "user": "admin@defence.mil",
            "timestamp": datetime.utcnow() - timedelta(hours=3),
            "type": "user"
        },
        {
            "id": generate_random_string(8),
            "action": "System maintenance completed",
            "user": "admin@defence.mil",
            "timestamp": datetime.utcnow() - timedelta(hours=4),
            "type": "system"
        }
    ]
    return actions

def validate_email_domain(email: str) -> bool:
    """Validate if email is from a trusted domain"""
    trusted_domains = ["defence.mil", "army.mil", "navy.mil", "airforce.mil"]
    domain = email.split("@")[-1].lower()
    return domain in trusted_domains

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    import re
    # Remove or replace dangerous characters
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    # Limit length
    if len(filename) > 100:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:95] + ('.' + ext if ext else '')
    return filename
