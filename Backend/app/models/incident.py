from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

class IncidentCategory(str, Enum):
    PHISHING = "phishing"
    MALWARE = "malware"
    FRAUD = "fraud"
    ESPIONAGE = "espionage"
    OPSEC = "opsec"

class IncidentStatus(str, Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    RESOLVED = "Resolved"
    CLOSED = "Closed"

class IncidentSeverity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class EvidenceType(str, Enum):
    TEXT = "text"
    URL = "url"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    FILE = "file"

class IncidentBase(BaseModel):
    title: str
    category: IncidentCategory
    description: str
    evidence_type: Optional[EvidenceType] = None
    evidence_text: Optional[str] = None
    evidence_url: Optional[str] = None
    evidence_files: Optional[List[str]] = None

class IncidentCreate(IncidentBase):
    pass

class CommentCreate(BaseModel):
    text: str

class Comment(CommentCreate):
    author_id: str
    author_name: str
    created_at: datetime

class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    severity: Optional[IncidentSeverity] = None
    assigned_to: Optional[str] = None
    admin_notes: Optional[str] = None
    resolution_notes: Optional[str] = None

class IncidentInDB(IncidentBase):
    id: str
    reporter_id: str
    reporter_name: str
    reporter_email: EmailStr
    status: IncidentStatus = IncidentStatus.PENDING
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    assigned_to: Optional[str] = None
    admin_notes: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

class Incident(IncidentInDB):
    pass
    evidence_files: Optional[List[str]] = None
    comments: Optional[List[Comment]] = []

class IncidentResponse(BaseModel):
    id: str
    title: str
    category: str
    description: str
    status: str
    severity: str
    reporter_name: str
    created_at: datetime
    updated_at: datetime
    assigned_to: Optional[str] = None
    unit: Optional[str] = None
