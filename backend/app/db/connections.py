# eda-backend/app/db/connections.py

from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
from pymongo.database import Database as MongoDatabase
from fastapi import HTTPException, status

# Local imports
from app.core.config import settings

# Initialize a global variable for the MongoDB client
mongo_client: AsyncIOMotorClient = None

async def connect_to_db():
    """Establishes an asynchronous connection to MongoDB."""
    global mongo_client
    try:
        # Use settings.MONGO_URI for the connection string
        mongo_client = AsyncIOMotorClient(settings.MONGO_URI, maxPoolSize=10)
        # Ping the database to ensure a successful connection
        await mongo_client.admin.command('ping')
        print("MongoDB connected successfully!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")

async def close_db_connections():
    """Closes the MongoDB connection."""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("MongoDB connection closed.")

async def get_mongo_db() -> AsyncGenerator[MongoDatabase, None]:
    """
    Dependency that provides an asynchronous database session.
    It raises an error if the connection has not been initialized.
    """
    global mongo_client
    if mongo_client is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is not initialized."
        )
    # The `yield` statement passes the database instance from the async client
    try:
        yield mongo_client[settings.MONGO_DB_NAME]
    finally:
        pass # The client is managed by the lifespan context, so we don't close it here.