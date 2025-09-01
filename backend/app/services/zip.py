# eda-backend/app/services/zip.py
# Service for zip file operations.

import asyncio
import zipfile
import os
from typing import List

async def create_dummy_zip(output_path: str, file_names: List[str] = ['dummy.txt']):
    """
    Asynchronously creates a dummy zip file with specified internal file names.
    This is for simulating tool output.
    """
    # Ensure the directory exists
    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)

    # Perform the blocking zip operation in a separate thread to not block the event loop
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(
        None, # Use default ThreadPoolExecutor
        _sync_create_dummy_zip,
        output_path,
        file_names
    )
    print(f"Dummy zip file created at: {output_path}")

def _sync_create_dummy_zip(output_path: str, file_names: List[str]):
    """Synchronous helper for creating a dummy zip file."""
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_name in file_names:
            content = f"This is dummy content for {file_name} generated at {datetime.utcnow().isoformat()}."
            zipf.writestr(file_name, content)


async def extract_zip(zip_file_path: str, destination_path: str):
    """
    Asynchronously extracts a zip file to a specified destination.
    """
    # Ensure the directory exists
    os.makedirs(destination_path, exist_ok=True)

    loop = asyncio.get_running_loop()
    await loop.run_in_executor(
        None,
        _sync_extract_zip,
        zip_file_path,
        destination_path
    )
    print(f"Zip file extracted to: {destination_path}")

def _sync_extract_zip(zip_file_path: str, destination_path: str):
    """Synchronous helper for extracting a zip file."""
    with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
        zip_ref.extractall(destination_path)

