# eda-backend/app/schemas/project.py
# Pydantic schemas for Project, File metadata, ToolLog, and MembershipProduct.

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- File Schema (for Project.files) ---
class FileMetadata(BaseModel):
    """Metadata for a file stored in Firebase Storage."""
    fileName: str
    filePath: str # Path within the Firebase Storage bucket
    fileUrl: str # Public URL (if public) or placeholder for signed URL
    fileType: str
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)

class ProjectBase(BaseModel):
    """Base schema for a project."""
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    status: str = Field("draft", description="Current status of the project")

class ProjectCreate(ProjectBase):
    """Schema for creating a new project."""
    # userId will be derived from auth, not provided by client
    pass

class ProjectUpdate(ProjectBase):
    """Schema for updating an existing project."""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    """Schema for project data returned in API responses."""
    id: str = Field(..., description="Firestore Document ID")
    userId: str = Field(..., description="Firebase UID of the project owner")
    files: List[FileMetadata] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}
        populate_by_name = True

# --- Membership Product Schemas (now in project.py) ---
# These were previously in project.py, now they are here
# We need to import ToolAccessDetails from app.schemas.membership
from app.schemas.membership import ToolAccessDetails # Import ToolAccessDetails

class MembershipProductBase(BaseModel):
    """Base schema for a Membership Product (service bundle)."""
    name: str = Field(..., min_length=3, max_length=100, description="Name of the membership product (e.g., 'Basic PCB Pack')")
    description: Optional[str] = None
    price: float = Field(..., ge=0, description="Price of the product in base currency units (e.g., INR)")
    durationInDays: int = Field(..., ge=-1, description="Duration of the membership in days (-1 for perpetual)")
    # toolAccess: Maps tool_name (str) to ToolAccessDetails
    toolAccess: Dict[str, ToolAccessDetails] = Field({}, description="Map of tool names to their access details")
    isActive: bool = Field(True, description="Whether this product is currently active and can be offered")

class MembershipProductCreate(MembershipProductBase):
    """Schema for creating a new Membership Product."""
    pass

class MembershipProductUpdate(MembershipProductBase):
    """Schema for updating an existing Membership Product."""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    durationInDays: Optional[int] = None
    toolAccess: Optional[Dict[str, ToolAccessDetails]] = None
    isActive: Optional[bool] = None

class MembershipProductResponse(MembershipProductBase):
    """Schema for Membership Product data returned in API responses."""
    id: str = Field(..., description="Firestore Document ID of the membership product")
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}
        populate_by_name = True
        schema_extra = {
            "example": {
                "id": "firestoreProductId123",
                "name": "Pro Chip Design Suite",
                "description": "Full access to advanced chip design tools for 30 days.",
                "price": 1999.00,
                "durationInDays": 30,
                "toolAccess": {
                    "pcbDesignTool": {"hasAccess": True, "limit": -1},
                    "chipSynthesisTool": {"hasAccess": True, "limit": -1},
                    "platformSimulationTool": {"hasAccess": False, "limit": 0}
                },
                "isActive": True,
                "createdAt": "2023-01-01T10:00:00Z",
                    "updatedAt": "2023-01-01T10:00:00Z"
            }
        }


# --- Tool Log Schema (for Firestore 'toolLogs' collection) ---
class ToolLogEntry(BaseModel):
    """Schema for a log entry of tool usage."""
    id: Optional[str] = Field(None, description="Firestore Document ID of the log entry") # Added for ID tracking
    userId: str = Field(..., description="Firebase UID of the user who used the tool")
    toolName: str = Field(..., description="Name of the tool used")
    projectId: Optional[str] = Field(None, description="Firestore ID of the project associated with this tool usage")
    usageDate: datetime = Field(default_factory=datetime.utcnow)
    details: Dict[str, Any] = Field({}, description="Additional details about the tool usage (e.g., parameters, output summary)")
    cost: Optional[float] = Field(None, description="Optional cost incurred for this tool usage")

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}
        populate_by_name = True
        schema_extra = {
            "example": {
                "userId": "someFirebaseUID123",
                "toolName": "chipSynthesisTool",
                "projectId": "firestoreProjectId456",
                "details": {"input_size": "10MB", "runtime_seconds": 120},
                "cost": 0.50
            }
        }

# --- Tool Specific Request Schemas ---
# These define the expected input parameters for each tool type
class PcbDesignParameters(BaseModel):
    """Parameters for PCB Design Tool."""
    board_size: str = Field("100x100mm", description="Dimensions of the PCB board")
    layer_count: int = Field(2, description="Number of PCB layers")
    component_density: str = Field("medium", description="Expected component density")
    # Add more PCB specific parameters as needed
    class Config:
        schema_extra = {"example": {"board_size": "150x100mm", "layer_count": 4, "component_density": "high"}}

class ChipSynthesisParameters(BaseModel):
    """Parameters for Chip Synthesis Tool."""
    target_frequency_ghz: float = Field(1.0, description="Target clock frequency in GHz")
    technology_node_nm: int = Field(65, description="Technology node in nanometers")
    power_constraint_mw: Optional[float] = None
    # Add more Chip specific parameters as needed
    class Config:
        schema_extra = {"example": {"target_frequency_ghz": 2.5, "technology_node_nm": 28, "power_constraint_mw": 100.0}}

class PlatformSimulationParameters(BaseModel):
    """Parameters for Platform Simulation Tool."""
    simulation_duration_ns: float = Field(100.0, description="Simulation duration in nanoseconds")
    temperature_celsius: int = Field(25, description="Simulation temperature in Celsius")
    voltage_v: float = Field(1.2, description="Supply voltage in Volts")
    # Add more Platform specific parameters as needed
    class Config:
        schema_extra = {"example": {"simulation_duration_ns": 500.0, "temperature_celsius": 85, "voltage_v": 0.9}}

