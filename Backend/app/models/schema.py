from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
import enum
import datetime
from app.utils.db import Base

class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class UserRelation(str, enum.Enum):
    PERSONNEL = "personnel"
    FAMILY = "family"
    VETERAN = "veteran"

class UserSchema(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    service_id = Column(String, unique=True, index=True, nullable=False)
    relation = Column(Enum(UserRelation), nullable=False)
    phone = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    clearance_level = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)
    last_login = Column(String, nullable=True)

class GmailAccountSchema(Base):
    __tablename__ = "gmail_accounts"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    oauth_provider = Column(String, nullable=True)
    oauth_id = Column(String, nullable=True)
    gmail_access_token = Column(String, nullable=True)
    gmail_refresh_token = Column(String, nullable=True)
    gmail_token_expires_at = Column(DateTime, nullable=True)
    gmail_connected = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class IncidentCategory(str, enum.Enum):
    PHISHING = "phishing"
    MALWARE = "malware"
    FRAUD = "fraud"
    ESPIONAGE = "espionage"
    OPSEC = "opsec"

class IncidentStatus(str, enum.Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    RESOLVED = "Resolved"
    CLOSED = "Closed"

class IncidentSeverity(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class IncidentSchema(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(Enum(IncidentCategory), nullable=False)
    description = Column(String, nullable=False)
    evidence_type = Column(String, nullable=True)
    evidence_text = Column(String, nullable=True)
    evidence_url = Column(String, nullable=True)
    evidence_files = Column(JSON, nullable=True)
    ml_analysis = Column(JSON, nullable=True)
    
    reporter_id = Column(String, ForeignKey("users.id"))
    reporter_name = Column(String, nullable=False)
    reporter_email = Column(String, nullable=False)
    department = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    
    status = Column(Enum(IncidentStatus), default=IncidentStatus.PENDING)
    severity = Column(Enum(IncidentSeverity), default=IncidentSeverity.MEDIUM)
    assigned_to = Column(String, nullable=True)
    admin_notes = Column(String, nullable=True)
    resolution_notes = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    comments = relationship("CommentSchema", back_populates="incident")

class CommentSchema(Base):
    __tablename__ = "comments"
    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, ForeignKey("incidents.id"))
    text = Column(String, nullable=False)
    author_id = Column(String, ForeignKey("users.id"))
    author_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    incident = relationship("IncidentSchema", back_populates="comments")

class NotificationSchema(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(String, nullable=False)
    read_at = Column(String, nullable=True)

class ChatMessageSchema(Base):
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    conversation_id = Column(String, index=True)
    role = Column(String, nullable=False) 
    content = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)

class AdminActionSchema(Base):
    __tablename__ = "admin_actions"
    id = Column(String, primary_key=True, index=True)
    action = Column(String, nullable=False)
    user = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    type = Column(String, nullable=False)

class BackupSchema(Base):
    __tablename__ = "backups"
    id = Column(String, primary_key=True, index=True)
    created_by = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    status = Column(String, nullable=False)
    size = Column(String, nullable=False)
    tables = Column(JSON, nullable=False)

class EmailSchema(Base):
    __tablename__ = "gmail_emails"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    gmail_message_id = Column(String, unique=True, index=True)
    subject = Column(String, nullable=True)
    from_address = Column(String, nullable=True)
    to_address = Column(String, nullable=True)
    body_preview = Column(String, nullable=True)
    phishing_score = Column(String, nullable=True)  # Float stored as string
    threat_level = Column(String, nullable=True)  # "safe", "suspicious", "malicious"
    ml_analysis = Column(JSON, nullable=True)  # Store detailed model output
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
