from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class UserRelation(str, Enum):
    PERSONNEL = "personnel"
    FAMILY = "family"
    VETERAN = "veteran"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    service_id: str
    relation: UserRelation
    phone: Optional[str] = None
    unit: Optional[str] = None
    clearance_level: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    unit: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str
    role: UserRole = UserRole.USER
    is_active: bool = True
    created_at: str
    last_login: Optional[str] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    user_id: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None