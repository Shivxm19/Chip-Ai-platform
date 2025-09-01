# eda-backend/app/ai_chat/models.py

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class ChatMessage(BaseModel):
    """Represents a single message in a chat conversation."""
    role: str = Field(..., description="The role of the message's author (e.g., 'user', 'model').")
    content: str = Field(..., description="The text content of the message.")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    """Defines the request body for the chat API endpoint."""
    message: str = Field(..., description="The new message from the user.")
    chat_history: List[ChatMessage] = Field(default_factory=list, description="A list of previous chat messages for context.")

class ChatResponse(BaseModel):
    """Defines the response body from the chat API endpoint."""
    response: str = Field(..., description="The generated response from the AI model.")
    ai_uses_left: Optional[int] = Field(None, description="The number of AI uses remaining for the user.")
