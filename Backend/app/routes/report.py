from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from app.models.response import AnalyticsData, SystemStatus
from app.utils.auth import get_current_active_user, require_admin
from app.utils.helpers import generate_analytics_data, generate_system_status

router = APIRouter(tags=["reports"])

@router.get("/analytics/monthly", response_model=List[Dict[str, Any]])
async def get_monthly_analytics(current_user: Dict[str, Any] = Depends(require_admin)):
    """Get monthly analytics data"""
    try:
        analytics_data = generate_analytics_data()
        return analytics_data["monthly_data"]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get monthly analytics: {str(e)}"
        )

@router.get("/analytics/threat-types", response_model=List[Dict[str, Any]])
async def get_threat_types_analytics(current_user: Dict[str, Any] = Depends(require_admin)):
    """Get threat types analytics"""
    try:
        analytics_data = generate_analytics_data()
        return analytics_data["threat_types"]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get threat types analytics: {str(e)}"
        )

@router.get("/analytics/department-risk", response_model=List[Dict[str, Any]])
async def get_department_risk_analytics(current_user: Dict[str, Any] = Depends(require_admin)):
    """Get department risk analytics"""
    try:
        analytics_data = generate_analytics_data()
        return analytics_data["department_risk"]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get department risk analytics: {str(e)}"
        )

@router.get("/analytics/response-times", response_model=List[Dict[str, Any]])
async def get_response_times_analytics(current_user: Dict[str, Any] = Depends(require_admin)):
    """Get response times analytics"""
    try:
        analytics_data = generate_analytics_data()
        return analytics_data["response_times"]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get response times analytics: {str(e)}"
        )

@router.get("/system/status", response_model=List[Dict[str, Any]])
async def get_system_status(current_user: Dict[str, Any] = Depends(require_admin)):
    """Get system status"""
    try:
        system_status = generate_system_status()
        return system_status
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system status: {str(e)}"
        )

@router.post("/system/action", response_model=Dict[str, Any])
async def perform_system_action(
    action_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """Perform system action"""
    try:
        action = action_data.get("action", "")
        
        # Mock system actions
        if action == "Database backup":
            result = {"status": "completed", "message": "Database backup completed successfully"}
        elif action == "Data export":
            result = {"status": "completed", "message": "Data export completed successfully"}
        elif action == "System refresh":
            result = {"status": "completed", "message": "System refresh completed successfully"}
        else:
            result = {"status": "completed", "message": f"Action '{action}' completed successfully"}
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform system action: {str(e)}"
        )

@router.get("/dashboard/status", response_model=Dict[str, Any])
async def get_dashboard_status(current_user: Dict[str, Any] = Depends(get_current_active_user)):
    """Get dashboard status for user"""
    try:
        return {
            "online": True,
            "last_check": "2024-01-16T10:30:00Z",
            "services": [
                {"name": "Authentication", "status": "online"},
                {"name": "Database", "status": "online"},
                {"name": "ML Models", "status": "online"}
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard status: {str(e)}"
        )

@router.get("/user/profile", response_model=Dict[str, Any])
async def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_active_user)):
    """Get user profile"""
    try:
        # Remove sensitive information
        user_profile = current_user.copy()
        user_profile.pop("password_hash", None)
        user_profile.pop("id", None)  # Don't expose internal ID
        
        return user_profile
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}"
        )

@router.post("/user/logout", response_model=Dict[str, Any])
async def user_logout(current_user: Dict[str, Any] = Depends(get_current_active_user)):
    """User logout endpoint"""
    try:
        return {
            "success": True,
            "message": "Logged out successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )
