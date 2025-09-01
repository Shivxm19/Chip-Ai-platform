# eda-backend/app/api/v1/endpoints/projects.py
# API endpoints for project management (Firestore for metadata, Firebase Storage for files).

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from firebase_admin import firestore, storage
from app.db.firebase_connection import get_firestore_db, get_firebase_storage_bucket
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, FileMetadata
from app.api.deps import get_current_user, CurrentUser
from app.core.config import settings
from typing import Annotated, List, Optional, Any
from datetime import datetime, timedelta
import os
import asyncio

router = APIRouter()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)]
):
    """
    Creates a new design project in Firestore.
    """
    project_data = project_in.model_dump()
    project_data["userId"] = current_user.firebase_uid # CORRECTED: Associate project with the current user
    project_data["files"] = []
    project_data["createdAt"] = firestore.SERVER_TIMESTAMP
    project_data["updatedAt"] = firestore.SERVER_TIMESTAMP

    # Auto-generate document ID in the 'projects' collection
    project_ref = firestore_db.collection("projects").document()
    await project_ref.set(project_data)

    # Fetch the created document to get server-generated timestamps and the ID
    created_project_doc = await project_ref.get()
    return ProjectResponse(id=created_project_doc.id, **created_project_doc.to_dict())

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)]
):
    """
    Retrieves all projects for the authenticated user from Firestore.
    """
    projects_ref = firestore_db.collection("projects")
    # Query projects where 'userId' matches the current authenticated user's UID
    query = projects_ref.where("userId", "==", current_user.firebase_uid).order_by("createdAt", direction=firestore.Query.DESCENDING)
    projects_snapshot = await query.get()

    projects = []
    for doc in projects_snapshot:
        projects.append(ProjectResponse(id=doc.id, **doc.to_dict()))
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project_by_id(
    project_id: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)]
):
    """
    Retrieves a specific project by its ID from Firestore.
    """
    project_ref = firestore_db.collection("projects").document(project_id)
    project_doc = await project_ref.get()

    if not project_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project_data = project_doc.to_dict()
    if project_data.get("userId") != current_user.firebase_uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this project")

    return ProjectResponse(id=project_doc.id, **project_data)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)]
):
    """
    Updates an existing project in Firestore.
    """
    project_ref = firestore_db.collection("projects").document(project_id)
    project_doc = await project_ref.get()

    if not project_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project_data = project_doc.to_dict()
    if project_data.get("userId") != current_user.firebase_uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this project")

    updates = project_in.model_dump(exclude_unset=True)
    updates["updatedAt"] = firestore.SERVER_TIMESTAMP

    await project_ref.update(updates)

    updated_project_doc = await project_ref.get()
    return ProjectResponse(id=updated_project_doc.id, **updated_project_doc.to_dict())

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)],
    firebase_storage_bucket: Annotated[Any, Depends(get_firebase_storage_bucket)]
):
    """
    Deletes a project from Firestore and its associated files from Firebase Storage.
    """
    project_ref = firestore_db.collection("projects").document(project_id)
    project_doc = await project_ref.get()

    if not project_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project_data = project_doc.to_dict()
    if project_data.get("userId") != current_user.firebase_uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this project")

    if project_data.get("files"):
        loop = asyncio.get_event_loop()
        for file_meta in project_data["files"]:
            file_path_in_storage = file_meta.get("filePath")
            if file_path_in_storage:
                try:
                    blob = firebase_storage_bucket.blob(file_path_in_storage)
                    await loop.run_in_executor(None, lambda: blob.delete())
                    print(f"Deleted file from Storage: {file_path_in_storage}")
                except Exception as e:
                    print(f"Failed to delete file {file_path_in_storage} from Storage: {e}")

    await project_ref.delete()
    return

@router.post("/{project_id}/upload-file", response_model=ProjectResponse)
async def upload_project_file(
    project_id: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)],
    firebase_storage_bucket: Annotated[Any, Depends(get_firebase_storage_bucket)],
    file: Annotated[UploadFile, File(...)]
):
    """
    Uploads a file to a specific project in Firebase Storage and updates Firestore metadata.
    """
    project_ref = firestore_db.collection("projects").document(project_id)
    project_doc = await project_ref.get()

    if not project_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project_data = project_doc.to_dict()
    if project_data.get("userId") != current_user.firebase_uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload to this project")

    file_content = await file.read()

    unique_filename = f"{datetime.now().timestamp()}-{file.filename}"
    file_path_in_storage = f"project-files/{project_id}/{unique_filename}"
    blob = firebase_storage_bucket.blob(file_path_in_storage)

    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, lambda: blob.upload_from_string(file_content, content_type=file.content_type))
        await loop.run_in_executor(None, lambda: blob.make_public())
        public_url = blob.public_url
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file to Firebase Storage: {e}"
        )

    file_metadata = FileMetadata(
        fileName=file.filename,
        filePath=file_path_in_storage,
        fileUrl=public_url,
        fileType=file.content_type,
        uploadedAt=datetime.utcnow()
    )

    await project_ref.update({
        "files": firestore.ArrayUnion([file_metadata.model_dump()]),
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })

    updated_project_doc = await project_ref.get()
    return ProjectResponse(id=updated_project_doc.id, **updated_project_doc.to_dict())

@router.get("/{project_id}/download-file/{file_name}", response_model=dict)
async def download_project_file(
    project_id: str,
    file_name: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)],
    firebase_storage_bucket: Annotated[Any, Depends(get_firebase_storage_bucket)]
):
    """
    Provides a download URL for a specific file within a project from Firebase Storage.
    """
    project_ref = firestore_db.collection("projects").document(project_id)
    project_doc = await project_ref.get()

    if not project_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project_data = project_doc.to_dict()
    if project_data.get("userId") != current_user.firebase_uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this project's files")

    found_file = next((f for f in project_data.get("files", []) if f.get("fileName") == file_name), None)

    if not found_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in this project")

    file_path_in_storage = found_file.get("filePath")
    if not file_path_in_storage:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="File path missing in metadata")

    blob = firebase_storage_bucket.blob(file_path_in_storage)

    loop = asyncio.get_event_loop()
    file_exists = await loop.run_in_executor(None, lambda: blob.exists())

    if not file_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in storage")

    if blob.public_url:
        return {"download_url": blob.public_url}
    else:
        signed_url = await loop.run_in_executor(None, lambda: blob.generate_signed_url(expiration=datetime.utcnow() + timedelta(hours=1)))
        return {"download_url": signed_url}
