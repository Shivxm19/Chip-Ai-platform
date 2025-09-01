# eda-backend/app/models/user.py

from datetime import datetime
from typing import Any, Dict, Optional, Annotated # Import Annotated
from pydantic import BaseModel, EmailStr, Field, BeforeValidator # Import BeforeValidator
from bson import ObjectId

# Custom type for MongoDB's ObjectId to work with Pydantic v2
# This uses Pydantic's recommended way of handling custom types (Annotated and BeforeValidator)
def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str):
        try:
            return ObjectId(v)
        except Exception:
            pass
    raise ValueError("Invalid ObjectId format")

# Define PyObjectId using Annotated for Pydantic v2 compatibility
PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]

# Base User Model for MongoDB
class User(BaseModel):
    # Use PyObjectId for the _id field
    id: Optional[PyObjectId] = Field(alias="_id", default=None) 
    firebaseUid: str = Field(..., alias="firebaseUid") # Matches Firebase UID
    email: EmailStr
    name: Optional[str] = None
    is_admin: bool = False
    is_premium: bool = False
    membership: str = "free"
    customMembershipProductId: Optional[str] = None
    activeToolAccess: Dict[str, Any] = {} # Store tool access configuration
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True # Needed for ObjectId
        json_encoders = {
            ObjectId: lambda oid: str(oid), # Ensure ObjectId is serialized to string
            datetime: lambda dt: dt.isoformat()
        }
