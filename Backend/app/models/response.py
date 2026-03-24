from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class PaginatedResponse(BaseModel):
    success: bool = True
    data: list
    total: int
    page: int
    per_page: int
    total_pages: int

class AnalyticsData(BaseModel):
    monthly_data: list
    threat_types: list
    department_risk: list
    response_times: list

class SystemStatus(BaseModel):
    online: bool
    services: Optional[list] = None
    last_check: Optional[datetime] = None

class AdminSummary(BaseModel):
    users: int
    incidents: int
    pending_incidents: int
    resolved_incidents: int
    last_backup: Optional[datetime] = None

class AdminAction(BaseModel):
    id: str
    action: str
    user: str
    timestamp: datetime
    type: str  # user, system, security, export

class BulkNotification(BaseModel):
    message: str
    target: str = "all"  # all, admins, users

class SystemAction(BaseModel):
    action: str
    parameters: Optional[Dict[str, Any]] = None
