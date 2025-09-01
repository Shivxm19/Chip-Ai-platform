# ✅ eda-backend/app/core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os

load_dotenv(".env") # Fallback to load .env manually

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App Config ---
    PROJECT_NAME: str = "EDA App Backend"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "0.1.0"
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000"
    ]
    UPLOAD_DIR: str = "uploads/project-files"

    # --- MongoDB Settings (for User Profiles/Membership) ---
    # It's best practice to load MONGO_URI from .env for security.
    # Ensure the database name in the URI matches MONGO_DB_NAME below.
    MONGO_URI: str = "mongodb+srv://shivxm19:test12345@eda-user-db.xrjnyqf.mongodb.net/?retryWrites=true&w=majority&appName=eda-user-db"
    MONGO_DB_NAME: str = "eda-user-db" # CORRECTED: Ensure this matches appName in URI for consistency.
                                       # If your actual DB is 'EDAdb', change this back to 'EDAdb'
                                       # and ensure the URI doesn't have appName=eda-user-db or is /EDAdb.

    # --- Firebase Admin SDK Settings (for Auth, Firestore Projects, Storage) ---
    # These should come from your Firebase service account key JSON file
    # The private key needs to have actual newlines, not escaped \n.
    # It's safer to load this from an environment variable directly.
    FIREBASE_PRIVATE_KEY_ID: str = "9f962f396682ea73644eb523c18646f45a4eac56"
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n') # CORRECTED: Load from env and handle newlines
    FIREBASE_PROJECT_ID: str = "silicon-ai-7519b"
    FIREBASE_CLIENT_EMAIL: str = "firebase-adminsdk-fbsvc@silicon-ai-7519b.iam.gserviceaccount.com"
    FIREBASE_STORAGE_BUCKET: str = "silicon-ai-7519b.firebasestorage.app"

    # --- Third-Party Service Keys ---
    RAZORPAY_KEY_ID: str = "" # Provide default empty string or load from env
    RAZORPAY_KEY_SECRET: str = "" # Provide default empty string or load from env
    AI_SERVICE_API_KEY: str = "" # Provide default empty string or load from env

    # --- Security Settings ---
    JWT_SECRET_KEY: str = "your_super_secret_jwt_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

# Create an instance of settings to be imported throughout the application
settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
print(f"📁 File upload directory: {settings.UPLOAD_DIR}")
print(f"✅ DEBUG MONGO_DB_NAME from settings: {settings.MONGO_DB_NAME}")