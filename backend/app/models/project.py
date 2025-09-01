# backend/models/project.py
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base # Import Base from parent directory

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, index=True) # UUID for project ID
    user_id = Column(String, index=True, nullable=False) # Firebase UID of the project owner
    name = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One-to-many relationship: a project can have multiple files
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")

class ProjectFile(Base):
    __tablename__ = "project_files"
    id = Column(String, primary_key=True, index=True) # UUID for file ID
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False) # e.g., "rtl_code", "schematic_json", "waveform_vcd", "gerber_zip"
    storage_path = Column(String, nullable=False) # Full path on server disk or S3 URL
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Many-to-one relationship: a file belongs to one project
    project = relationship("Project", back_populates="files")