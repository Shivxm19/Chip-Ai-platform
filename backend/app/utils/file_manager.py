# rtl-editor-backend/app/utils/file_manager.py
import os
import shutil
import uuid

def create_temp_dir() -> str:
    """Creates a unique temporary directory for tool execution."""
    temp_dir = os.path.join("/tmp", str(uuid.uuid4()))
    os.makedirs(temp_dir, exist_ok=True)
    print(f"Created temporary directory: {temp_dir}")
    return temp_dir

def cleanup_temp_dir(path: str):
    """Removes a directory and its contents."""
    if os.path.exists(path):
        shutil.rmtree(path)
        print(f"Cleaned up temporary directory: {path}")