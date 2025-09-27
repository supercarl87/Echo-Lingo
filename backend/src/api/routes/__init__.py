"""
Routes package initialization.
"""

from fastapi import APIRouter

from src.api.routes import audio, root

# Create main router
router = APIRouter()

# Include all routers
router.include_router(root.router)
router.include_router(audio.router)
