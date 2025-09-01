# backend/utils/auth_deps.py
from fastapi import Header, HTTPException, status
import firebase_admin
from firebase_admin import credentials, auth
import os
from app.core.config import settings

# Initialize Firebase Admin SDK (only once when the app starts)
# This block ensures Firebase is initialized if it hasn't been already.
if not firebase_admin._apps:
    try:
        # Ensure the service account key path is set and the file exists
        cred_path = settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH
        if not cred_path or not os.path.exists(cred_path):
            # Log an error or raise an exception if the key path is invalid
            print(f"ERROR: Firebase service account key not found at {cred_path}. Firebase Admin SDK not initialized.")
            # For development, you might continue. For production, this should be a critical error.
        else:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"ERROR: Failed to initialize Firebase Admin SDK: {e}")

# Dependency function to get the current user's UID from Firebase ID Token
async def get_current_user_id(authorization: str = Header(...)) -> str:
    """
    Authenticates a user by verifying their Firebase ID token from the Authorization header.
    Returns the Firebase UID if successful, otherwise raises an HTTPException.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid Authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    id_token = authorization.split("Bearer ")[1]
    try:
        # Verify the ID token using the Firebase Admin SDK.
        # This checks token validity, expiration, and signature.
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        return uid
    except firebase_admin.auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid Firebase ID token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"Error during Firebase ID token verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, # Use 500 for server-side issues
            detail="Authentication failed: Internal server error during token verification.",
            headers={"WWW-Authenticate": "Bearer"},
        )