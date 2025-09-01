# backend/schemas/project.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# Schema for base file attributes
class ProjectFileBase(BaseModel):
    file_name: str = Field(..., description="Original name of the file.")
    file_type: str = Field(..., description="Type of the file, e.g., 'rtl_code', 'schematic_json', 'waveform_vcd'.")
    storage_path: str = Field(..., description="Internal path where the file is stored on the server or cloud.")

# Schema for creating a new file (does not include ID or timestamps)
class ProjectFileCreate(ProjectFileBase):
    pass

# Schema for a file as returned by the API (includes ID and timestamps)
class ProjectFile(ProjectFileBase):
    id: str = Field(..., description="Unique ID of the project file.")
    project_id: str = Field(..., description="ID of the project this file belongs to.")
    created_at: datetime
    updated_at: datetime

    # Configures Pydantic to work with SQLAlchemy ORM models
    class Config:
        from_attributes = True # For Pydantic v2. Use orm_mode = True for Pydantic v1.

# Schema for base project attributes
class ProjectBase(BaseModel):
    name: str = Field(..., description="Name of the project.")

# Schema for creating a new project
class ProjectCreate(ProjectBase):
    pass

# Schema for updating an existing project
class ProjectUpdate(ProjectBase):
    pass

# Schema for a project as returned by the API (includes ID, user_id, timestamps, and nested files)
class Project(ProjectBase):
    id: str = Field(..., description="Unique ID of the project.")
    user_id: str = Field(..., description="Firebase UID of the user who owns this project.")
    created_at: datetime
    updated_at: datetime
    files: List[ProjectFile] = Field([], description="List of files associated with this project.") # Nested files

    class Config:
        from_attributes = True # For Pydantic v2. Use orm_mode = True for Pydantic v1.