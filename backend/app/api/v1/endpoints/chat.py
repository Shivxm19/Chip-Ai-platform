# eda-backend/app/api/v1/endpoints/chat.py

from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user, CurrentUser
from app.core.config import settings
from app.aichat.models import ChatRequest, ChatResponse
from app.aichat.chat_handler import generate_chat_response
from pymongo.database import Database as MongoDatabase
from app.db.connections import get_mongo_db

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    chat_request: ChatRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    mongo_db: Annotated[MongoDatabase, Depends(get_mongo_db)]
):
    """
    Handles conversational requests for the AI Chat Assistant.
    """
    users_collection = mongo_db.users
    user_profile = await users_collection.find_one({"firebaseUid": current_user.firebase_uid})

    # You must have an 'aiUsesLeft' field in your MongoDB user profile.
    ai_uses_left = user_profile.get("aiUsesLeft", 0)

    # Implement AI usage limit logic
    if user_profile.get("membership") == "free" and ai_uses_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="AI usage limit exceeded. Please upgrade your plan."
        )

    # Call the chat handler to get the AI response
    chat_response = await generate_chat_response(chat_request.message, chat_request.chat_history)

    # After a successful LLM call, update the user's remaining uses in MongoDB
    if user_profile.get("membership") == "free":
        new_uses_left = ai_uses_left - 1
        await users_collection.update_one(
            {"firebaseUid": current_user.firebase_uid},
            {"$set": {"aiUsesLeft": new_uses_left}}
        )
        chat_response.ai_uses_left = new_uses_left
    else:
        chat_response.ai_uses_left = None # Unlimited uses for paid plans

    return chat_response
