# rtl-editor-backend/app/models/common.py
from pydantic import BaseModel
from typing import List, Dict, Any

class ToolResponse(BaseModel):
    """
    Common response model for all tool operations.
    """
    success: bool
    log: str # Full output log from the EDA tool
    message: str # A short, user-friendly message
    waveformData: List[Dict[str, Any]] = [] # Optional: for simulation results