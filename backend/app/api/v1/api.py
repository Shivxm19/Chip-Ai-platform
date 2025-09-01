# eda-backend/app/api/v1/api.py
# Main API router for version 1 of the API.

from fastapi import APIRouter

# CORRECTED IMPORTS: Import the router object directly from each endpoint file
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.project import router as projects_router
from app.api.v1.endpoints.pcb_tools import router as pcb_tools_router
from app.api.v1.endpoints.chip_tools import router as chip_tools_router
from app.api.v1.endpoints.platformtools import router as platform_tools_router
from app.api.v1.endpoints.payment import router as payments_router
from app.api.v1.endpoints.schematic_tools import router as schematic_tools_router



api_router = APIRouter()

# Include routers for different functionalities
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(projects_router, prefix="/projects", tags=["Projects"])
api_router.include_router(pcb_tools_router, prefix="/tools", tags=["PCB Tools"]) # Prefix /tools for all tool types
api_router.include_router(chip_tools_router, prefix="/tools", tags=["Chip Tools"])
api_router.include_router(platform_tools_router, prefix="/tools", tags=["Platform Tools"])
api_router.include_router(payments_router, prefix="/payments", tags=["Payments"])
api_router.include_router(schematic_tools_router, prefix="/chip/schematic", tags=["chip_schematic"])

