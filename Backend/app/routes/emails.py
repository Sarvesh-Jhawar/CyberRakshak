from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timedelta
from app.utils.db import get_db
from app.utils.auth import get_current_user
from app.models.schema import EmailSchema, UserSchema
from app.models.response import StandardResponse
import uuid

router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("", response_model=StandardResponse)
async def get_user_emails(
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    threat_level: str = Query(None),  # Filter by threat level: safe, suspicious, malicious
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analyzed emails for current user
    
    Query Parameters:
    - limit: Number of emails to return (max 100)
    - offset: Pagination offset
    - threat_level: Filter by threat level (safe, suspicious, malicious)
    """
    try:
        user_id = current_user["id"]
        
        # Start query
        query = db.query(EmailSchema).filter(EmailSchema.user_id == user_id)
        
        # Apply threat level filter if provided
        if threat_level and threat_level in ["safe", "suspicious", "malicious"]:
            query = query.filter(EmailSchema.threat_level == threat_level)
        
        # Get total count
        total = query.count()
        
        # Order by created_at descending and apply pagination
        emails = query.order_by(EmailSchema.created_at.desc()).offset(offset).limit(limit).all()
        
        # Convert to dict
        emails_data = []
        for email in emails:
            emails_data.append({
                "id": email.id,
                "gmail_message_id": email.gmail_message_id,
                "subject": email.subject,
                "from_address": email.from_address,
                "to_address": email.to_address,
                "body_preview": email.body_preview,
                "phishing_score": float(email.phishing_score) if email.phishing_score else 0,
                "threat_level": email.threat_level,
                "is_read": email.is_read,
                "created_at": email.created_at.isoformat() if email.created_at else None,
                "ml_analysis": email.ml_analysis
            })
        
        return StandardResponse(
            success=True,
            message="Emails retrieved successfully",
            data={
                "emails": emails_data,
                "total": total,
                "limit": limit,
                "offset": offset
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve emails: {str(e)}"
        )


@router.get("/stats/overview", response_model=StandardResponse)
async def get_email_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get email threat statistics for current user"""
    try:
        user_id = current_user["id"]
        
        # Total emails
        total = db.query(EmailSchema).filter(EmailSchema.user_id == user_id).count()
        
        # By threat level
        safe_count = db.query(EmailSchema).filter(
            EmailSchema.user_id == user_id,
            EmailSchema.threat_level == "safe"
        ).count()
        
        suspicious_count = db.query(EmailSchema).filter(
            EmailSchema.user_id == user_id,
            EmailSchema.threat_level == "suspicious"
        ).count()
        
        malicious_count = db.query(EmailSchema).filter(
            EmailSchema.user_id == user_id,
            EmailSchema.threat_level == "malicious"
        ).count()
        
        # This week
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        week_total = db.query(EmailSchema).filter(
            EmailSchema.user_id == user_id,
            EmailSchema.created_at >= one_week_ago
        ).count()
        
        return StandardResponse(
            success=True,
            message="Email statistics retrieved",
            data={
                "total_emails": total,
                "safe": safe_count,
                "suspicious": suspicious_count,
                "malicious": malicious_count,
                "this_week": week_total,
                "percentages": {
                    "safe": round((safe_count / total * 100) if total > 0 else 0, 1),
                    "suspicious": round((suspicious_count / total * 100) if total > 0 else 0, 1),
                    "malicious": round((malicious_count / total * 100) if total > 0 else 0, 1)
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )


@router.get("/{email_id}", response_model=StandardResponse)
async def get_email_detail(
    email_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed analysis of a specific email"""
    try:
        user_id = current_user["id"]
        
        email = db.query(EmailSchema).filter(
            EmailSchema.id == email_id,
            EmailSchema.user_id == user_id
        ).first()
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        # Mark as read
        email.is_read = True
        db.commit()
        
        return StandardResponse(
            success=True,
            message="Email details retrieved",
            data={
                "id": email.id,
                "gmail_message_id": email.gmail_message_id,
                "subject": email.subject,
                "from_address": email.from_address,
                "to_address": email.to_address,
                "body_preview": email.body_preview,
                "phishing_score": float(email.phishing_score) if email.phishing_score else 0,
                "threat_level": email.threat_level,
                "ml_analysis": email.ml_analysis,
                "is_read": email.is_read,
                "created_at": email.created_at.isoformat() if email.created_at else None,
                "updated_at": email.updated_at.isoformat() if email.updated_at else None
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve email: {str(e)}"
        )


@router.post("/{email_id}/mark-read", response_model=StandardResponse)
async def mark_email_read(
    email_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark email as read"""
    try:
        user_id = current_user["id"]
        
        email = db.query(EmailSchema).filter(
            EmailSchema.id == email_id,
            EmailSchema.user_id == user_id
        ).first()
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        email.is_read = True
        db.commit()
        
        return StandardResponse(
            success=True,
            message="Email marked as read"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark email: {str(e)}"
        )


@router.delete("/{email_id}", response_model=StandardResponse)
async def delete_email(
    email_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete (local record) of an email"""
    try:
        user_id = current_user["id"]
        
        email = db.query(EmailSchema).filter(
            EmailSchema.id == email_id,
            EmailSchema.user_id == user_id
        ).first()
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        db.delete(email)
        db.commit()
        
        return StandardResponse(
            success=True,
            message="Email deleted"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete email: {str(e)}"
        )
