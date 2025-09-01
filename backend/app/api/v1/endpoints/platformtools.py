# eda-backend/app/api/v1/endpoints/platform_tools.py
# API endpoints for Platform tools.

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from firebase_admin import firestore, storage
from app.db.firebase_connection import get_firestore_db, get_firebase_storage_bucket
from app.schemas.project import ToolLogEntry, PlatformSimulationParameters, FileMetadata
from app.api.deps import get_current_user, CurrentUser
from app.middleware.membership import check_membership
from app.services.ai import process_design_request
from app.services.zip import create_dummy_zip
from app.core.config import settings
from typing import Annotated, Dict, Any, List # Import Any
from datetime import datetime
import asyncio
import os

router = APIRouter()

# --- Helper function for simulating platform tool execution ---
async def _simulate_platform_tool_execution(
    project_id: str,
    user_id: str,
    simulation_parameters: PlatformSimulationParameters, # Use Pydantic model here
    input_files_meta: List[FileMetadata],
    firestore_db: firestore.Client,
    firebase_storage_bucket: Any # CORRECTED: Changed from storage.Bucket to Any
):
    """
    Simulates the execution of a Platform simulation tool.
    """
    tool_name = "platformSimulationTool"
    job_id = f"platform_job_{project_id}_{datetime.now().timestamp()}"
    print(f"[{job_id}] Simulating Platform simulation tool for project {project_id} by user {user_id}")

    tool_log_entry = ToolLogEntry(
        userId=user_id,
        toolName=tool_name,
        projectId=project_id,
        details={"status": "initiated", "jobId": job_id, "simulationParameters": simulation_parameters.model_dump()}
    )
    tool_log_ref = firestore_db.collection("toolLogs").document()
    await tool_log_ref.set(tool_log_entry.model_dump())
    tool_log_entry.id = tool_log_ref.id

    try:
        print(f"[{job_id}] Calling AI service for simulation analysis...")
        ai_response = await process_design_request(
            {"simulationParameters": simulation_parameters.model_dump(), "inputFiles": [f.model_dump() for f in input_files_meta]}
        )
        print(f"[{job_id}] AI Service Response: {ai_response.get('status')}")

        await asyncio.sleep(10) # Simulate longer work for platform tools

        output_dir_in_storage = f"project-outputs/{project_id}/{job_id}"
        output_file_name = f"platform_simulation_output_{job_id}.zip"
        output_file_path_in_storage = f"{output_dir_in_storage}/{output_file_name}"

        temp_zip_path = os.path.join(settings.UPLOAD_DIR, output_file_name)
        await create_dummy_zip(temp_zip_path, ['simulation_report.txt', 'log_files.txt'])

        blob = firebase_storage_bucket.blob(output_file_path_in_storage)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: blob.upload_from_filename(temp_zip_path, content_type="application/zip"))
        await loop.run_in_executor(None, lambda: blob.make_public())
        output_public_url = blob.public_url
        print(f"[{job_id}] Output uploaded to Storage: {output_public_url}")

        os.remove(temp_zip_path)

        project_ref = firestore_db.collection("projects").document(project_id)
        file_metadata = {
            "fileName": output_file_name,
            "filePath": output_file_path_in_storage,
            "fileUrl": output_public_url,
            "fileType": "application/zip",
            "uploadedAt": firestore.SERVER_TIMESTAMP
        }
        await project_ref.update({
            "files": firestore.ArrayUnion([file_metadata]),
            "updatedAt": firestore.SERVER_TIMESTAMP,
            f"tool_outputs.{tool_name}.{job_id}": {
                "status": "completed",
                "output_url": output_public_url,
                "ai_status": ai_response.get('status'),
                "completedAt": firestore.SERVER_TIMESTAMP
            }
        })

        await firestore_db.collection("toolLogs").document(tool_log_entry.id).update({
            "details.status": "completed",
            "details.outputFilePath": output_file_path_in_storage,
            "details.outputUrl": output_public_url,
            "details.aiServiceStatus": ai_response.get('status'),
            "details.completedAt": firestore.SERVER_TIMESTAMP,
            "cost": 1.00 # Example cost
        })
        print(f"[{job_id}] Platform simulation tool completed successfully.")

    except Exception as e:
        print(f"[{job_id}] Error during Platform tool execution: {e}")
        await firestore_db.collection("toolLogs").document(tool_log_entry.id).update({
            "details.status": "failed",
            "details.error": str(e),
            "details.completedAt": firestore.SERVER_TIMESTAMP,
        })


@router.post("/platform/simulation", response_model=dict)
async def run_platform_simulation_tool(
    project_id: str,
    simulation_parameters: PlatformSimulationParameters, # Use Pydantic model here
    current_user: Annotated[CurrentUser, Depends(check_membership("platformSimulationTool"))],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)],
    firebase_storage_bucket: Annotated[Any, Depends(get_firebase_storage_bucket)], # CORRECTED: Changed from storage.Bucket to Any
    background_tasks: BackgroundTasks
):
    """
    Initiates a Platform simulation tool run for a given project.
    Requires appropriate user membership.
    """
    project_ref = firestore_db.collection("projects").document(project_id)
    project_doc = await project_ref.get()

    if not project_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project_data = project_doc.to_dict()
    if project_data.get("userId") != current_user.firebase_uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to run tools on this project")

    input_files_meta = [FileMetadata(**f) for f in project_data.get("files", [])]

    background_tasks.add_task(
        _simulate_platform_tool_execution,
        project_id,
        current_user.firebase_uid,
        simulation_parameters,
        input_files_meta,
        firestore_db,
        firebase_storage_bucket
    )

    return {"message": "Platform simulation tool initiated successfully. Check project status for updates."}

@router.get("/platform/status/{job_id}", response_model=dict)
async def get_platform_tool_status(
    job_id: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)],
):
    """
    Retrieves the status of a Platform tool job.
    """
    tool_logs_ref = firestore_db.collection("toolLogs")
    query = tool_logs_ref.where("userId", "==", current_user.firebase_uid)\
                         .where("toolName", "==", "platformSimulationTool")\
                         .where("details.jobId", "==", job_id)\
                         .limit(1)

    log_snapshot = await query.get()

    if not log_snapshot.empty:
        log_entry = log_snapshot.docs[0].to_dict()
        return {
            "jobId": job_id,
            "status": log_entry.get("details", {}).get("status", "unknown"),
            "message": log_entry.get("details", {}).get("message", "Status available."),
            "outputAvailable": log_entry.get("details", {}).get("status") == "completed",
            "outputUrl": log_entry.get("details", {}).get("outputUrl"),
            "details": log_entry.get("details", {})
        }
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found or not authorized.")

@router.get("/platform/download/{job_id}", response_model=dict)
async def download_platform_output(
    job_id: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)],
):
    """
    Provides a download URL for the output of a completed Platform tool job.
    """
    tool_logs_ref = firestore_db.collection("toolLogs")
    query = tool_logs_ref.where("userId", "==", current_user.firebase_uid)\
                         .where("toolName", "==", "platformSimulationTool")\
                         .where("details.jobId", "==", job_id)\
                         .where("details.status", "==", "completed")\
                         .limit(1)

    log_snapshot = await query.get()

    if not log_snapshot.empty:
        log_entry = log_snapshot.docs[0].to_dict()
        output_url = log_entry.get("details", {}).get("outputUrl")
        if output_url:
            return {"download_url": output_url}
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Output URL not found for this job.")
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Completed job not found or not authorized.")

