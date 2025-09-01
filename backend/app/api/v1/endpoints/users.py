# eda-backend/app/api/v1/endpoints/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database as MongoDatabase
from app.db.connections import get_mongo_db
from app.api.deps import get_current_user, CurrentUser, get_current_admin_user
from app.schemas.user import UserCreate, UserLogin, UserUpdate, UserResponse
from app.models.user import User as MongoUser
from typing import Annotated
import firebase_admin
from firebase_admin import auth
from datetime import datetime

router = APIRouter()

def transform_mongo_user(user_data: dict) -> dict:
    """
    Transforms MongoDB document data for Pydantic response.
    Converts '_id' ObjectId to string.
    """
    data = user_data.copy()
    if "_id" in data:
        data["_id"] = str(data["_id"])
    return data

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    mongo_db: Annotated[MongoDatabase, Depends(get_mongo_db)]
):
    users_collection = mongo_db.users

    user_exists = await users_collection.find_one({
        "$or": [
            {"firebaseUid": user_in.firebaseUid},
            {"email": user_in.email}
        ]
    })

    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this Firebase UID or email already exists."
        )

    user_data = user_in.model_dump(exclude_unset=True)
    user_data.update({
        "membership": "free",
        "isAdmin": False,
        "customMembershipProductId": None,
        "activeToolAccess": {},
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    })

    result = await users_collection.insert_one(user_data)
    created_user_data = await users_collection.find_one({"_id": result.inserted_id})

    return UserResponse(**transform_mongo_user(created_user_data))

@router.post("/login", response_model=UserResponse)
async def login_user(
    user_login: UserLogin,
    mongo_db: Annotated[MongoDatabase, Depends(get_mongo_db)]
):
    try:
        decoded_token = auth.verify_id_token(user_login.idToken) 
        firebase_uid = decoded_token['uid']

        users_collection = mongo_db.users
        user_data = await users_collection.find_one({"firebaseUid": firebase_uid})

        if not user_data:
            print(f"User with Firebase UID {firebase_uid} not found in MongoDB. Creating new user record.")
            new_user_data = {
                "firebaseUid": firebase_uid,
                "email": decoded_token.get("email"),
                "isAdmin": False,
                "membership": "free",
                "customMembershipProductId": None,
                "activeToolAccess": {},
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
            
            result = await users_collection.insert_one(new_user_data)
            user_data = await users_collection.find_one({"_id": result.inserted_id})
            
            print(f"New user with UID {firebase_uid} successfully created in MongoDB.")

        return UserResponse(**transform_mongo_user(user_data))

    except auth.InvalidIdTokenError as e:
        print(f"Authentication failed: Invalid ID token - {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid token."
        )
    except Exception as e:
        print(f"An error occurred during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during login: {e}"
        )

@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: Annotated[CurrentUser, Depends(get_current_user)]
):
    # CORRECTED: Pass current_user.user_data directly to transform_mongo_user,
    # as user_data is already the dictionary representation of the MongoUser.
    return UserResponse(**transform_mongo_user(current_user.user_data))

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    mongo_db: Annotated[MongoDatabase, Depends(get_mongo_db)]
):
    users_collection = mongo_db.users
    user_data = user_update.model_dump(exclude_unset=True)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data provided for update."
        )

    for restricted in ["membership", "customMembershipProductId", "isAdmin", "activeToolAccess"]:
        user_data.pop(restricted, None)

    user_data["updatedAt"] = datetime.utcnow()

    await users_collection.update_one(
        {"firebaseUid": current_user.firebase_uid},
        {"$set": user_data}
    )

    updated_user_data = await users_collection.find_one({"firebaseUid": current_user.firebase_uid})
    return UserResponse(**transform_mongo_user(updated_user_data))

@router.delete("/{firebase_uid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    firebase_uid: str,
    current_admin_user: Annotated[CurrentUser, Depends(get_current_admin_user)],
    mongo_db: Annotated[MongoDatabase, Depends(get_mongo_db)]
):
    users_collection = mongo_db.users

    if current_admin_user.firebase_uid == firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot delete their own account via this endpoint."
        )

    user_to_delete = await users_collection.find_one({"firebaseUid": firebase_uid})
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in database."
        )

    await users_collection.delete_one({"firebaseUid": firebase_uid})

    try:
        await auth.delete_user(firebase_uid)
    except auth.UserNotFoundError:
        print(f"Firebase user {firebase_uid} not found in Auth, skipping deletion.")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user from Firebase Auth: {e}"
        )

    return {"message": "User deleted successfully"}