from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from app.utils.auth import get_current_active_user, require_admin
from app.utils.db import get_db
from app.models.schema import NotificationSchema
from app.models.response import StandardResponse

router = APIRouter()

# Get all notifications
@router.get("/notifications", response_model=List[Dict[str, Any]])
async def get_notifications(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all notifications for the current user"""
    try:
        notifications = db.query(NotificationSchema).filter(
            NotificationSchema.user_id == current_user["id"]
        ).order_by(NotificationSchema.created_at.desc()).all()
        
        return [
            {
                "id": n.id,
                "user_id": n.user_id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at,
                "read_at": n.read_at
            }
            for n in notifications
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch notifications: {str(e)}"
        )

# Mark notification as read
@router.put("/notifications/{notification_id}/read", response_model=StandardResponse)
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    try:
        notification = db.query(NotificationSchema).filter(NotificationSchema.id == notification_id).first()
        if not notification:
            raise HTTPException(
                status_code=404,
                detail="Notification not found"
            )
        
        if notification.user_id != current_user["id"]:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to modify this notification"
            )
        
        notification.is_read = True
        notification.read_at = datetime.utcnow().isoformat()
        db.commit()
        
        return StandardResponse(
            success=True,
            message="Notification marked as read"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark notification as read: {str(e)}"
        )

# Delete notification
@router.delete("/notifications/{notification_id}", response_model=StandardResponse)
async def delete_notification(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    try:
        notification = db.query(NotificationSchema).filter(NotificationSchema.id == notification_id).first()
        if not notification:
            raise HTTPException(
                status_code=404,
                detail="Notification not found"
            )
        
        if notification.user_id != current_user["id"]:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to delete this notification"
            )
        
        db.delete(notification)
        db.commit()
        
        return StandardResponse(
            success=True,
            message="Notification deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete notification: {str(e)}"
        )

# Mark all notifications as read
@router.put("/notifications/read-all", response_model=StandardResponse)
async def mark_all_notifications_read(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the current user"""
    try:
        notifications = db.query(NotificationSchema).filter(
            NotificationSchema.user_id == current_user["id"],
            NotificationSchema.is_read == False
        ).all()
        
        updated_count = 0
        timestamp = datetime.utcnow().isoformat()
        for notification in notifications:
            notification.is_read = True
            notification.read_at = timestamp
            updated_count += 1
            
        db.commit()
        
        return StandardResponse(
            success=True,
            message=f"Marked {updated_count} notifications as read"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark notifications as read: {str(e)}"
        )

# Get notification count
@router.get("/notifications/count", response_model=Dict[str, Any])
async def get_notification_count(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notification count for the current user"""
    try:
        notifications = db.query(NotificationSchema).filter(
            NotificationSchema.user_id == current_user["id"]
        ).all()
        
        total_count = len(notifications)
        unread_count = sum(1 for n in notifications if not n.is_read)
        
        return {
            "total": total_count,
            "unread": unread_count,
            "read": total_count - unread_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get notification count: {str(e)}"
        )
