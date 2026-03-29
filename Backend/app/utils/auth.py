from datetime import datetime, timedelta
from typing import Optional, Union, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import TokenData, UserRole
from app.models.schema import UserSchema
from app.utils.db import get_db
import hashlib
import logging

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token handling
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        if email is None or user_id is None:
            return None
        return TokenData(email=email, user_id=user_id)
    except JWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get current user from JWT token"""
    logging.info("Auth: Starting user authentication")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    logging.info(f"Auth: Received token (length: {len(token)})")
    
    token_data = verify_token(token)
    if token_data is None:
        logging.error("Auth: Token verification failed - invalid or expired token")
        raise credentials_exception
    
    logging.info(f"Auth: Token verified for user_id: {token_data.user_id}, email: {token_data.email}")
    
    # Get user from database
    user = db.query(UserSchema).filter(UserSchema.id == token_data.user_id).first()
    if user is None:
        logging.error(f"Auth: User not found in database for user_id: {token_data.user_id}")
        raise credentials_exception
    
    logging.info(f"Auth: User found - id: {user.id}, email: {user.email}, active: {user.is_active}")
    
    # Convert SQLAlchemy model to dict to match existing return format
    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "service_id": user.service_id,
        "relation": user.relation.value if user.relation else None,
        "phone": user.phone,
        "unit": user.unit,
        "clearance_level": user.clearance_level,
        "password_hash": user.password_hash,
        "role": user.role.value if user.role else UserRole.USER.value,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "last_login": user.last_login
    }
    
    logging.info("Auth: Authentication successful")
    return user_data

def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Get current active user"""
    if not current_user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_admin(current_user: dict = Depends(get_current_active_user)):
    """Require admin role"""
    if current_user.get("role") != UserRole.ADMIN.value and current_user.get("role") != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[dict]:
    """Authenticate a user with email and password"""
    # Query user by email
    user = db.query(UserSchema).filter(UserSchema.email == email).first()
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "service_id": user.service_id,
        "relation": user.relation.value if user.relation else None,
        "phone": user.phone,
        "unit": user.unit,
        "clearance_level": user.clearance_level,
        "password_hash": user.password_hash,
        "role": user.role.value if user.role else UserRole.USER.value,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "last_login": user.last_login
    }
    
    return user_data

def generate_incident_id() -> str:
    """Generate a unique incident ID"""
    import time
    timestamp = str(int(time.time()))
    return f"INC-{timestamp[-6:]}"

def generate_user_id(email: str) -> str:
    """Generate a unique user ID based on email"""
    return hashlib.md5(email.encode()).hexdigest()

def validate_email_domain(email: str) -> bool:
    """Validate if email is from a trusted domain"""
    trusted_domains = ["defence.mil", "army.mil", "navy.mil", "airforce.mil", "test.com", "gmail.com"]
    domain = email.split("@")[-1].lower()
    return domain in trusted_domains
