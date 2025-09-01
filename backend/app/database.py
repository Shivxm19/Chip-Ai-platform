# rtl-editor-backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
# Import settings from its new location
from app.core.config import settings

# Create the SQLAlchemy engine
ENGINE = create_engine(settings.DATABASE_URL)

# Create a SessionLocal class to get database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)

# Base class for your SQLAlchemy models
Base = declarative_base()

# Dependency to get a database session for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db # Provides the session to the route, then closes it
    finally:
        db.close()

# Function to create all tables defined by Base.metadata
def create_db_tables():
    # This will create tables if they don't exist.
    # In production, you'd use a proper migration tool like Alembic.
    Base.metadata.create_all(bind=ENGINE)