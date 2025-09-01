# eda-backend/app/ai_chat/chat_handler.py

import json
from typing import List
from app.core.config import settings
from app.aichat.models import ChatMessage, ChatResponse
import httpx # You need to install this library: pip install httpx

# The base URL for the Gemini API
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent"

# The prompt that "trains" your AI assistant
SYSTEM_PROMPT = """
You are Silicon AI, an expert AI assistant and tutor for chip design, PCB design, and related hardware engineering topics.
Your primary purpose is to help users of the platform with their EDA (Electronic Design Automation) workflows.
Your tone is professional, knowledgeable, and concise. You should provide accurate technical information,
explain complex concepts, and offer practical guidance.

When a user asks a question, please follow these rules:
1.  Provide clear, direct answers related to hardware design and EDA.
2.  If asked for code, provide well-commented Verilog, VHDL, or SystemVerilog snippets.
3.  Do not answer questions outside of hardware design, software development for hardware, or EDA. If a question is off-topic, politely decline and ask how you can help with their design work.
4.  Maintain a friendly and encouraging tone, like a helpful tutor.
5.  Always stay within your defined persona. Do not reveal that you are a large language model or break character.
"""

async def call_llm_api(chat_history: List[dict]) -> str:
    """
    Makes a call to the LLM API (e.g., Gemini) with the chat history.
    """
    payload = {
        "contents": chat_history,
        "generationConfig": {
            "temperature": 0.5,
            "maxOutputTokens": 2048,
        },
    }
    
    headers = {
        "Content-Type": "application/json",
    }
    
    params = {
        "key": settings.AI_SERVICE_API_KEY,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(GEMINI_API_URL, json=payload, headers=headers, params=params, timeout=60)
            response.raise_for_status()
            
            response_json = response.json()
            # Extract the text response from the API result
            return response_json["candidates"][0]["content"]["parts"][0]["text"]

    except httpx.HTTPError as e:
        print(f"HTTP error during LLM API call: {e}")
        return "An error occurred while connecting to the AI service. Please try again."
    except KeyError:
        print("Invalid response format from LLM API.")
        return "An error occurred while processing the AI response. Please try again later."
    except Exception as e:
        print(f"An unexpected error occurred during LLM API call: {e}")
        return "An unexpected error occurred. Please check the server logs."


async def generate_chat_response(message: str, chat_history: List[ChatMessage]) -> ChatResponse:
    """
    Generates an AI response by calling the LLM API.
    """
    # Create the full chat history including the system prompt
    full_chat_history_with_persona = [
        {"role": "user", "parts": [{"text": SYSTEM_PROMPT}]},
        *[{"role": msg.role, "parts": [{"text": msg.content}]} for msg in chat_history],
        {"role": "user", "parts": [{"text": message}]}
    ]

    # Call the LLM API with the full conversation context
    ai_response_content = await call_llm_api(full_chat_history_with_persona)
    
    return ChatResponse(response=ai_response_content)
