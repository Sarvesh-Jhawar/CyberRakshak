from fastapi import APIRouter, HTTPException, status, Depends, Query, File, UploadFile, Form
from typing import List, Optional, Dict, Any
from datetime import datetime
import shutil
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.incident import (
    IncidentCreate, IncidentUpdate, Incident, IncidentResponse, CommentCreate,
    IncidentStatus, IncidentSeverity, IncidentCategory, EvidenceType
)
from app.models.response import StandardResponse, PaginatedResponse
from app.utils.auth import get_current_active_user, require_admin
from app.utils.db import get_db
from app.models.schema import IncidentSchema, NotificationSchema, UserSchema, CommentSchema
from app.utils.helpers import generate_incident_id, get_risk_level, generate_random_string
from app.utils.ml_models import ml_manager

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.post("/", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    title: str = Form(...),
    category: IncidentCategory = Form(...),
    description: str = Form(...),
    evidence_type: Optional[EvidenceType] = Form(None),
    evidence_text: Optional[str] = Form(None),
    evidence_url: Optional[str] = Form(None),
    evidence: Optional[UploadFile] = File(None),
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new incident report"""
    try:
        # Generate incident ID
        incident_id = generate_incident_id()

        evidence_filename = None
        if evidence and evidence.filename:
            safe_filename = f"{incident_id}_{evidence.filename.replace(' ', '_')}"
            file_location = f"media/{safe_filename}"
            with open(file_location, "wb+") as file_object:
                shutil.copyfileobj(evidence.file, file_object)
            evidence_filename = safe_filename

        analysis_data = {
            "title": title,
            "category": category,
            "description": description,
            "evidence_text": evidence_text,
            "evidence_url": evidence_url,
        }
        risk_level = get_risk_level(analysis_data)
        
        ml_analysis = None
        try:
            if evidence_text or evidence_url:
                if hasattr(ml_manager, 'analyze_incident'):
                    ml_analysis = ml_manager.analyze_incident(analysis_data)
                else:
                    # Run category-specific analysis as fallback
                    category_str = str(category.value if hasattr(category, 'value') else category).lower()
                    if category_str == "phishing" and evidence_url:
                        from app.utils.ml_models import PhishingInput
                        ml_analysis = ml_manager.predict_phishing(PhishingInput(url=evidence_url, body=evidence_text or ""))
                    elif category_str == "malware":
                        from app.utils.ml_models import MalwareInput
                        ml_analysis = ml_manager.predict_malware(MalwareInput())
        except Exception as ml_err:
            print(f"ML analysis skipped: {ml_err}")
            ml_analysis = None

        incident_model = IncidentSchema(
            id=incident_id,
            title=title,
            category=category,
            description=description,
            evidence_type=evidence_type,
            evidence_text=evidence_text,
            evidence_url=evidence_url,
            evidence_files=[evidence_filename] if evidence_filename else [],
            ml_analysis=ml_analysis,
            reporter_id=current_user["id"],
            reporter_name=current_user["name"],
            unit=current_user.get("unit"),
            department=current_user.get("department", current_user.get("unit")),
            reporter_email=current_user["email"],
            status=IncidentStatus.PENDING,
            severity=IncidentSeverity(risk_level),
            assigned_to=None,
            admin_notes="",
            resolution_notes=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(incident_model)

        admins = db.query(UserSchema).filter(UserSchema.role == "ADMIN").all()
        for admin in admins:
            notif = NotificationSchema(
                id=generate_random_string(12),
                user_id=admin.id,
                title="New Incident",
                message=f"New incident '{incident_id}' reported by {current_user['name']}.",
                type="alert",
                is_read=False,
                created_at=datetime.utcnow().isoformat()
            )
            db.add(notif)
            
        db.commit()

        return StandardResponse(
            success=True,
            message="Incident reported successfully",
            data={
                "incident_id": incident_id,
                "status": IncidentStatus.PENDING,
                "severity": risk_level,
                "ml_analysis": ml_analysis
            }
        )
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create incident: {str(e)}"
        )

@router.get("/", response_model=List[IncidentResponse])
async def get_incidents(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    status_filter: Optional[IncidentStatus] = Query(None, description="Filter by status"),
    category_filter: Optional[IncidentCategory] = Query(None, description="Filter by category"),
    severity_filter: Optional[IncidentSeverity] = Query(None, description="Filter by severity"),
    limit: int = Query(50, ge=1, le=100, description="Number of incidents to return"),
    offset: int = Query(0, ge=0, description="Number of incidents to skip"),
    db: Session = Depends(get_db)
):
    """Get incidents (user sees their own, admin sees all)"""
    try:
        query = db.query(IncidentSchema)
        if current_user.get("role") != "ADMIN":
            query = query.filter(IncidentSchema.reporter_id == current_user["id"])
            
        if status_filter:
            query = query.filter(IncidentSchema.status == status_filter)
        if category_filter:
            query = query.filter(IncidentSchema.category == category_filter)
        if severity_filter:
            query = query.filter(IncidentSchema.severity == severity_filter)
            
        incidents = query.order_by(desc(IncidentSchema.created_at)).offset(offset).limit(limit).all()
        
        incident_responses = []
        for incident in incidents:
            incident_responses.append(IncidentResponse(
                id=incident.id,
                title=incident.title,
                category=incident.category.value if incident.category else "Unknown",
                description=incident.description,
                status=incident.status.value if incident.status else "Pending",
                severity=incident.severity.value if incident.severity else "Medium",
                reporter_name=incident.reporter_name,
                created_at=incident.created_at,
                updated_at=incident.updated_at,
                assigned_to=incident.assigned_to,
                unit=incident.unit
            ))
        
        return incident_responses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get incidents: {str(e)}"
        )

@router.get("/{incident_id}", response_model=Incident)
async def get_incident(
    incident_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        incident = db.query(IncidentSchema).filter(IncidentSchema.id == incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
            
        if current_user.get("role") != "ADMIN" and incident.reporter_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
            
        comments_list = []
        for c in incident.comments:
            comments_list.append({
                "text": c.text,
                "author_id": c.author_id,
                "author_name": c.author_name,
                "created_at": c.created_at
            })
            
        return Incident(
            id=incident.id,
            title=incident.title,
            category=incident.category,
            description=incident.description,
            evidence_type=incident.evidence_type,
            evidence_text=incident.evidence_text,
            evidence_url=incident.evidence_url,
            evidence_files=incident.evidence_files,
            reporter_id=incident.reporter_id,
            reporter_name=incident.reporter_name,
            reporter_email=incident.reporter_email,
            status=incident.status,
            severity=incident.severity,
            assigned_to=incident.assigned_to,
            admin_notes=incident.admin_notes,
            resolution_notes=incident.resolution_notes,
            created_at=incident.created_at,
            updated_at=incident.updated_at,
            resolved_at=incident.resolved_at,
            comments=comments_list
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get incident: {str(e)}")

@router.put("/{incident_id}", response_model=StandardResponse)
async def update_incident(
    incident_id: str,
    incident_update: IncidentUpdate,
    current_user: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        incident = db.query(IncidentSchema).filter(IncidentSchema.id == incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
            
        update_data = incident_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(incident, key, value)
            
        incident.updated_at = datetime.utcnow()
        if incident_update.status == IncidentStatus.RESOLVED:
            incident.resolved_at = datetime.utcnow()
            
        db.commit()
        return StandardResponse(success=True, message="Incident updated successfully", data={"incident_id": incident_id})
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update incident: {str(e)}")

@router.delete("/{incident_id}", response_model=StandardResponse)
async def delete_incident(
    incident_id: str,
    current_user: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        incident = db.query(IncidentSchema).filter(IncidentSchema.id == incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
            
        db.delete(incident)
        db.commit()
        return StandardResponse(success=True, message="Incident deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete incident: {str(e)}")

@router.post("/{incident_id}/comments", response_model=StandardResponse)
async def add_comment_to_incident(
    incident_id: str,
    comment_data: CommentCreate,
    current_user: Dict[str, Any] = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        incident = db.query(IncidentSchema).filter(IncidentSchema.id == incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
            
        new_comment = CommentSchema(
            id=generate_random_string(12),
            incident_id=incident_id,
            author_id=current_user["id"],
            author_name=current_user["name"],
            text=comment_data.text,
            created_at=datetime.utcnow()
        )
        db.add(new_comment)
        incident.updated_at = datetime.utcnow()
        
        notif = NotificationSchema(
            id=generate_random_string(12),
            user_id=incident.reporter_id,
            title="New Comment",
            message=f"A new comment has been added to your incident report {incident_id}.",
            type="info",
            is_read=False,
            created_at=datetime.utcnow().isoformat()
        )
        db.add(notif)
        db.commit()
        
        return StandardResponse(success=True, message="Comment added successfully")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add comment: {str(e)}")

@router.get("/stats/summary", response_model=Dict[str, Any])
async def get_incident_stats(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(IncidentSchema)
        if current_user.get("role") != "ADMIN":
            query = query.filter(IncidentSchema.reporter_id == current_user["id"])
            
        incidents = query.all()
        
        total_incidents = len(incidents)
        pending_incidents = sum(1 for i in incidents if i.status == IncidentStatus.PENDING)
        under_review = sum(1 for i in incidents if i.status == IncidentStatus.UNDER_REVIEW)
        resolved_incidents = sum(1 for i in incidents if i.status == IncidentStatus.RESOLVED)
        closed_incidents = sum(1 for i in incidents if i.status == IncidentStatus.CLOSED)
        
        category_stats = {}
        severity_stats = {}
        for incident in incidents:
            cat = incident.category.value if incident.category else "unknown"
            sev = incident.severity.value if incident.severity else "unknown"
            category_stats[cat] = category_stats.get(cat, 0) + 1
            severity_stats[sev] = severity_stats.get(sev, 0) + 1
            
        return {
            "total_incidents": total_incidents,
            "pending_incidents": pending_incidents,
            "under_review": under_review,
            "resolved_incidents": resolved_incidents,
            "closed_incidents": closed_incidents,
            "category_breakdown": category_stats,
            "severity_breakdown": severity_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get incident statistics: {str(e)}")
