# eda-backend/app/schemas/membership.py
# Pydantic schemas for Membership-related data (ToolAccessConfig, ToolAccessDetails).

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

# --- Tool Access Configuration within a Membership Product ---
# This defines access and limits for a single tool within a product bundle
class ToolAccessDetails(BaseModel):
    """Details for a specific tool's access within a membership product."""
    hasAccess: bool = False
    limit: int = 0 # -1 for unlimited, 0 for no access, >0 for specific count

class ToolAccessConfig(BaseModel):
    """Schema for tool access configuration (used in Firestore 'toolAccessConfigs' collection)."""
    toolName: str = Field(..., description="Unique name of the tool")
    accessLevels: Dict[str, bool] = Field({}, description="Map of membership levels (free, basic, premium) to boolean access")
    usageLimits: Dict[str, int] = Field({}, description="Map of membership levels to usage limits (-1 for unlimited)")
    lastResetDate: Optional[datetime] = None # For periodic usage limits
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}
        populate_by_name = True
        schema_extra = {
            "example": {
                "toolName": "pcbDesignTool",
                "accessLevels": {"free": False, "basic": True, "premium": True},
                "usageLimits": {"free": 0, "basic": 5, "premium": -1}
            }
        }

