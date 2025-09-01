# main.py
import os
import uvicorn
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict

# --- Configuration ---
# Your Firebase Admin SDK credentials. For production, load this from a secret environment variable.
# For local development, download the key from Firebase Console (Project Settings > Service Accounts)
# and save it as 'firebase-admin-key.json' in the same directory as this file.
def get_firebase_credentials_path() -> Optional[str]:
    """Retrieves the path to the Firebase Admin SDK credentials file."""
    if os.path.exists("firebase-admin-key.json"):
        return "firebase-admin-key.json"
    return None

firebase_credentials_path = get_firebase_credentials_path()

# Initialize Firebase Admin SDK
if firebase_credentials_path and not firebase_admin._apps:
    try:
        cred = credentials.Certificate(firebase_credentials_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"❌ Failed to initialize Firebase Admin SDK: {e}")
        db = None
else:
    print("❌ Firebase Admin SDK not initialized. Check credentials.")
    db = None

# A placeholder for your app identifier, which should match your frontend's `appIdentifier`
APP_IDENTIFIER = "silicon-ai-7519b" 

# Set up a directory for project files, mirroring Firebase Cloud Storage
UPLOAD_DIR = os.path.join("uploads", "project-files")
os.makedirs(UPLOAD_DIR, exist_ok=True)
print(f"📁 File upload directory: {os.path.abspath(UPLOAD_DIR)}")

# Your FastAPI application instance
app = FastAPI(
    title="EDA Backend API",
    description="A backend for handling EDA tool logic and file management.",
    version="1.0.0"
)

# --- CORS Middleware ---
# This is crucial for allowing your frontend to communicate with this backend.
origins = ["*"]  # For development, allow all origins. In production, list your frontend's domain(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models for API Request Bodies ---
class SaveCodeRequest(BaseModel):
    project_id: str = Field(..., description="The ID of the project.")
    file_id: str = Field(..., description="The ID of the file to save.")
    code: str = Field(..., description="The Verilog/VHDL code content.")

class ToolRequest(BaseModel):
    project_id: str = Field(..., description="The ID of the project.")
    file_id: str = Field(..., description="The ID of the file to run the tool on.")

# --- Dependency to get current user from Firebase Auth token ---
async def get_current_user_id(request: Request):
    """Verifies the Firebase ID token and returns the user's UID."""
    if db is None:
        raise HTTPException(status_code=500, detail="Backend not configured correctly.")
        
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized: No Firebase ID token provided.")

    token = auth_header.split(' ')[1]
    
    try:
        # Verify the Firebase ID token with Firebase Admin SDK
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        print(f"Token verification failed: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized: Invalid Firebase ID token.")

# --- API Endpoints for RTL Editor ---
@app.post("/api/v1/tools/rtl-editor/save")
async def save_code(save_request: SaveCodeRequest, user_id: str = Depends(get_current_user_id)):
    """
    Saves RTL code to a file and updates Firestore metadata.
    """
    try:
        # Create a secure path for the user's project files
        project_dir = os.path.join(UPLOAD_DIR, user_id, save_request.project_id)
        os.makedirs(project_dir, exist_ok=True)
        
        # Save the code to a file, using a simple .v extension for now
        file_path = os.path.join(project_dir, f"{save_request.file_id}.v")
        with open(file_path, "w") as f:
            f.write(save_request.code)
            
        print(f"Saved file for user {user_id} at {file_path}")

        # Update Firestore to reflect the file save
        project_ref = db.collection('artifacts').document(APP_IDENTIFIER) \
                        .collection('users').document(user_id) \
                        .collection('live_projects').document(save_request.project_id)
        
        # We can update a 'files' array or just the 'last_saved' timestamp for simplicity
        await project_ref.set({"last_saved": firestore.SERVER_TIMESTAMP}, merge=True)

        return {"message": "Code saved successfully.", "file_path": file_path}
    
    except Exception as e:
        print(f"Error saving code: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to save code: {e}")

@app.post("/api/v1/tools/rtl-editor/lint")
async def run_lint(lint_request: ToolRequest, user_id: str = Depends(get_current_user_id)):
    """
    Simulates an RTL linting check on a saved file.
    """
    try:
        # Construct the file path to the saved file
        file_path = os.path.join(UPLOAD_DIR, user_id, lint_request.project_id, f"{lint_request.file_id}.v")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

        # Read the file content for a simulated check
        with open(file_path, 'r') as f:
            code_content = f.read()

        # Simulate linting output. In a real app, this would run a command-line tool.
        lint_output = f"Simulated linting check for {lint_request.file_id}.v:\n"
        if "always @(" in code_content:
            lint_output += "  - [WARNING] Detected old-style 'always @()' syntax. Consider 'always_ff' or 'always_comb'."
        else:
            lint_output += "  - [INFO] Linting completed successfully. No major issues found."

        return {"message": "Linting successful (simulated).", "log": lint_output}
    
    except HTTPException:
        raise # Re-raise FastAPI's HTTPException
    except Exception as e:
        print(f"Error during linting: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to run linting: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
