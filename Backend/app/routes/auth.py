from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
import logging
import uuid
from app.utils.auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_user, generate_user_id, validate_email_domain,
)
from app.utils.db import get_db
from app.models.schema import UserSchema, GmailAccountSchema
from app.config import settings
from app.models.user import UserCreate, UserLogin, Token, User, UserRole
from app.models.response import StandardResponse
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)

# Temporary in-memory store for OAuth state -> user_id mapping (expires after 10 minutes)
oauth_state_store: Dict[str, tuple[str, float]] = {}

class UserResponse(BaseModel):
    id: str
    name: str
    service_id: str
    relation: str
    email: EmailStr
    phone: str
    unit: str
    clearance_level: str
    role: UserRole
    is_active: bool

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    service_id: Optional[str] = None
    relation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    unit: Optional[str] = None
    clearance_level: Optional[str] = None

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=StandardResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        # Validate email domain
        if not validate_email_domain(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email must be from a trusted domain (defence.mil, army.mil, etc.)"
            )
        
        # Check if user already exists
        existing_users = db.query(UserSchema).filter(UserSchema.email == user_data.email).first()
        if existing_users:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Check if service ID already exists
        existing_service_ids = db.query(UserSchema).filter(UserSchema.service_id == user_data.service_id).first()
        if existing_service_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this service ID already exists"
            )
        
        # Generate user ID
        user_id = generate_user_id(user_data.email)
        
        # Create user document
        user_model = UserSchema(
            id=user_id,
            name=user_data.name,
            service_id=user_data.service_id,
            relation=user_data.relation,
            email=user_data.email,
            phone=user_data.phone,
            unit=user_data.unit,
            clearance_level=user_data.clearance_level,
            password_hash=get_password_hash(user_data.password),
            role=UserRole.USER,
            is_active=True,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat(),
            last_login=None
        )
        
        # Save to database
        db.add(user_model)
        db.commit()
        
        return StandardResponse(
            success=True,
            message="User registered successfully",
            data={"user_id": user_id, "email": user_data.email}
        )
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    try:
        # Authenticate user
        user = authenticate_user(db, login_data.email, login_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"], "user_id": user["id"]},
            expires_delta=access_token_expires
        )
        
        # Update last login
        user_model = db.query(UserSchema).filter(UserSchema.id == user["id"]).first()
        if user_model:
            user_model.last_login = datetime.utcnow().isoformat()
            db.commit()
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            role=user.get("role", UserRole.USER),
            user_id=user.get("id")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout", response_model=StandardResponse)
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Logout user (client-side token removal)"""
    try:
        # In a stateless JWT system, logout is handled client-side
        # We could implement token blacklisting here if needed
        
        return StandardResponse(
            success=True,
            message="Logged out successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information"""
    try:
        # Remove sensitive information
        user_info = current_user.copy()
        user_info.pop("password_hash", None)

        return UserResponse(**user_info)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user info: {str(e)}"
        )

@router.put("/me", response_model=StandardResponse)
async def update_current_user_profile(
    profile_data: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile information"""
    try:
        user_id = current_user["id"]
        
        # Prepare update data, excluding unset fields
        update_data = profile_data.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No update data provided"
            )
            
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update user document
        user_model = db.query(UserSchema).filter(UserSchema.id == user_id).first()
        if not user_model:
            raise HTTPException(status_code=404, detail="User not found")
            
        for key, value in update_data.items():
            setattr(user_model, key, value)
            
        db.commit()
        db.refresh(user_model)

        # Fetch the updated user to return
        updated_user = {
            "id": user_model.id,
            "email": user_model.email,
            "name": user_model.name,
            "service_id": user_model.service_id,
            "relation": user_model.relation.value if user_model.relation else None,
            "phone": user_model.phone,
            "unit": user_model.unit,
            "clearance_level": user_model.clearance_level,
            "role": user_model.role.value if user_model.role else UserRole.USER.value,
            "is_active": user_model.is_active,
        }

        return StandardResponse(success=True, message="Profile updated successfully", data=updated_user)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Refresh access token"""
    try:
        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": current_user["email"], "user_id": current_user["id"]},
            expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            role=UserRole(current_user.get("role", "USER")),
            user_id=current_user["id"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )


# ======================== Gmail OAuth Routes ========================

@router.get("/gmail/authorize", response_model=StandardResponse)
async def gmail_authorize(current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Start Gmail OAuth flow - returns authorization URL"""
    try:
        if not settings.GMAIL_CLIENT_ID or not settings.GMAIL_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gmail OAuth not configured"
            )
        
        from app.utils.gmail_service import GmailService
        import time
        
        user_id = current_user["id"]
        
        gmail_service = GmailService(
            settings.GMAIL_CLIENT_ID,
            settings.GMAIL_CLIENT_SECRET,
            settings.GMAIL_REDIRECT_URI,
            settings.gmail_scopes_list,
            settings.ENCRYPTION_KEY
        )
        
        # Generate auth URL with a unique state
        auth_url, state = gmail_service.get_auth_url()
        
        # Store user_id temporarily with state (expires in 10 minutes)
        oauth_state_store[state] = (user_id, time.time() + 600)
        
        return StandardResponse(
            success=True,
            message="Authorization URL generated",
            data={"auth_url": auth_url, "state": state}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authorization URL: {str(e)}"
        )


@router.get("/gmail/callback")
async def gmail_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handle Gmail OAuth callback and redirect to dashboard"""
    try:
        if not code:
            return RedirectResponse(
                url="http://localhost:3000/user-dashboard?gmail_error=No authorization code provided",
                status_code=302
            )
        
        from app.utils.gmail_service import GmailService
        import time
        
        # Look up user_id from state
        if state not in oauth_state_store:
            return RedirectResponse(
                url="http://localhost:3000/user-dashboard?gmail_error=Invalid state parameter - session expired",
                status_code=302
            )
        
        user_id, expiry_time = oauth_state_store[state]
        
        # Check if state has expired (more than 10 minutes)
        if time.time() > expiry_time:
            del oauth_state_store[state]
            return RedirectResponse(
                url="http://localhost:3000/user-dashboard?gmail_error=Authorization session expired. Please try again.",
                status_code=302
            )
        
        # Clean up state
        del oauth_state_store[state]
        
        gmail_service = GmailService(
            settings.GMAIL_CLIENT_ID,
            settings.GMAIL_CLIENT_SECRET,
            settings.GMAIL_REDIRECT_URI,
            settings.gmail_scopes_list,
            settings.ENCRYPTION_KEY
        )
        
        # Exchange code for token
        credentials = gmail_service.exchange_code_for_token(code)
        
        # Get Google's OAuth ID from ID token
        oauth_id = credentials.get('id_token', '').split('.')[1] if 'id_token' in credentials else str(uuid.uuid4())
        
        # Check if user exists
        user = db.query(UserSchema).filter(UserSchema.id == user_id).first()
        if not user:
            return RedirectResponse(
                url="http://localhost:3000/user-dashboard?gmail_error=User not found",
                status_code=302
            )
        
        # Check if Gmail account record exists for this user
        existing_gmail_account = db.query(GmailAccountSchema).filter(
            GmailAccountSchema.user_id == user_id
        ).first()
        
        if existing_gmail_account:
            # Update existing Gmail account credentials (session-based, will be cleared on logout)
            existing_gmail_account.gmail_access_token = gmail_service.encrypt_token(credentials['access_token'])
            existing_gmail_account.gmail_refresh_token = gmail_service.encrypt_token(credentials.get('refresh_token', ''))
            existing_gmail_account.gmail_token_expires_at = datetime.utcnow() + timedelta(seconds=credentials.get('expires_in', 3600))
            existing_gmail_account.gmail_connected = True
            existing_gmail_account.updated_at = datetime.utcnow()
            existing_gmail_account.oauth_provider = 'google'
            existing_gmail_account.oauth_id = oauth_id
            db.commit()
        else:
            # Create new Gmail account record (session-based, will be cleared on logout)
            new_gmail_account = GmailAccountSchema(
                id=str(uuid.uuid4()),
                user_id=user_id,
                oauth_provider='google',
                oauth_id=oauth_id,
                gmail_access_token=gmail_service.encrypt_token(credentials['access_token']),
                gmail_refresh_token=gmail_service.encrypt_token(credentials.get('refresh_token', '')),
                gmail_token_expires_at=datetime.utcnow() + timedelta(seconds=credentials.get('expires_in', 3600)),
                gmail_connected=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(new_gmail_account)
            db.commit()
        
        # Trigger immediate sync for this user after successful Gmail connect
        try:
            from app.utils.background_tasks import sync_service
            await sync_service.sync_user_emails(user_id, db)
        except Exception as sync_err:
            logger.warning(f"Immediate email sync failed for user {user_id}: {sync_err}")

        # Redirect to dashboard with success message
        return RedirectResponse(
            url="http://localhost:3000/user-dashboard?gmail_connected=true",
            status_code=302
        )
        
    except Exception as e:
        logger.error(f"Error processing Gmail callback: {str(e)}")
        return RedirectResponse(
            url=f"http://localhost:3000/user-dashboard?gmail_error={str(e)[:100]}",
            status_code=302
        )


@router.post("/gmail/disconnect", response_model=StandardResponse)
async def disconnect_gmail(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect Gmail from user account"""
    try:
        user_id = current_user["id"]
        gmail_account = db.query(GmailAccountSchema).filter(GmailAccountSchema.user_id == user_id).first()
        
        if not gmail_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gmail account not found"
            )
        
        # Clear Gmail credentials
        gmail_account.gmail_access_token = None
        gmail_account.gmail_refresh_token = None
        gmail_account.gmail_token_expires_at = None
        gmail_account.gmail_connected = False
        db.commit()
        
        return StandardResponse(
            success=True,
            message="Gmail disconnected successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disconnect Gmail: {str(e)}"
        )


@router.get("/gmail/status", response_model=StandardResponse)
async def get_gmail_status(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Gmail connection status for current user"""
    try:
        user_id = current_user["id"]
        gmail_account = db.query(GmailAccountSchema).filter(GmailAccountSchema.user_id == user_id).first()
        
        if not gmail_account:
            return StandardResponse(
                success=True,
                message="Gmail status retrieved",
                data={"gmail_connected": False, "oauth_provider": None}
            )
        
        return StandardResponse(
            success=True,
            message="Gmail status retrieved",
            data={
                "gmail_connected": gmail_account.gmail_connected,
                "oauth_provider": gmail_account.oauth_provider
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Gmail status: {str(e)}"
        )
