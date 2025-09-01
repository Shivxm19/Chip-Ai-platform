# eda-backend/app/schemas/user.py

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    firebase_uid: str
    is_admin: bool = False
    # Removed 'password: str' from here as it's handled by Firebase Auth
    # and not sent to the backend for profile creation.

class UserLogin(BaseModel):
    # This model is used for backend login endpoint, which expects a Firebase ID token.
    # The frontend sends the ID token after Firebase authentication.
    idToken: str = Field(..., alias="idToken") # Expecting Firebase ID Token

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_premium: Optional[bool] = None

class UserInDB(UserBase):
    firebase_uid: str = Field(..., alias="firebaseUid")
    is_admin: bool = False
    is_premium: bool = False
    created_at: datetime = Field(None, alias="createdAt")
    updated_at: datetime = Field(None, alias="updatedAt")
    membership: str = "free" # Default membership level

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class UserResponse(BaseModel):
    id: str = Field(..., alias="firebaseUid")
    email: EmailStr
    name: Optional[str] = None
    is_admin: bool
    is_premium: bool
    membership: str
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
