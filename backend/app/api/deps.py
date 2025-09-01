# eda-backend/app/api/deps.py

from fastapi import HTTPException, status, Header, Depends
from typing import Annotated, Optional, Any
from pymongo.database import Database as MongoDatabase
import firebase_admin
from firebase_admin import auth, exceptions
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.db.connections import get_mongo_db
from app.models.user import User as MongoUser
from app.core.config import settings
from pydantic import BaseModel, Field

executor = ThreadPoolExecutor(max_workers=5)

class CurrentUser(BaseModel):
    firebase_uid: str
    user_data: dict = Field(default_factory=dict)
    is_admin: bool = False
    email: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True

async def get_current_user(
    mongo_db: Annotated[MongoDatabase, Depends(get_mongo_db)],
    authorization: Annotated[Optional[str], Header()] = None
) -> CurrentUser:
    
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing.")

    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token scheme. Must be 'Bearer'.")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header format. Expected 'Bearer <token>'.")

    try:
        loop = asyncio.get_event_loop()
        decoded_token = await loop.run_in_executor(
            executor, lambda: auth.verify_id_token(token)
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Firebase ID token has expired.")
    except (auth.InvalidIdTokenError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase ID token.")
    except Exception as e:
        print(f"🔥 ERROR during auth: {repr(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication failed due to server error.")

    firebase_uid = decoded_token.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="UID missing in token payload.")

    try:
        users_collection = mongo_db.users
        print(f"🔥 DEBUG: Attempting to find user with firebaseUid: {firebase_uid}")
        user_data = await users_collection.find_one({"firebaseUid": firebase_uid})
    except Exception as e:
        print(f"🔥 ERROR fetching user from MongoDB: {repr(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve user data from the database.")

    if not user_data:
        print(f"🔥 DEBUG: User with firebaseUid {firebase_uid} not found in database.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in the database.")

    return CurrentUser(
        firebase_uid=firebase_uid, 
        user_data=user_data,
        is_admin=user_data.get("is_admin", False),
        email=user_data.get("email")
    )


async def get_current_admin_user(
    current_user: Annotated[CurrentUser, Depends(get_current_user)]
) -> CurrentUser:
    """
    Dependency that ensures the current authenticated user is an administrator.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden: Admin privileges required."
        )
    return current_user
