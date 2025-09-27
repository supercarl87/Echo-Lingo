"""
Root API routes.
"""

import os

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse, JSONResponse

from src.core.config import get_settings
from src.core.logging import get_logger

# Set up logger
logger = get_logger(__name__)

# Create router
router = APIRouter()


@router.get("/", tags=["root"])
async def root(request: Request):
    """
    Root endpoint that returns basic application information.

    Args:
        request: FastAPI request object

    Returns:
        JSONResponse: Basic application information
    """
    logger.debug("Root endpoint accessed")
    settings = get_settings()

    response_data = {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "docs_url": f"{request.url._url}docs",
        "redoc_url": f"{request.url._url}redoc",
    }

    logger.debug(f"Returning application info: {response_data}")
    return JSONResponse(response_data)


@router.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint.

    Returns:
        JSONResponse: Health status
    """
    logger.debug("Health check endpoint accessed")
    return JSONResponse({"status": "ok", "message": "Service is running"})


@router.get("/favicon.ico", include_in_schema=False)
async def get_favicon():
    """
    Serve the favicon.ico file to prevent 404 errors.

    Returns:
        FileResponse: Favicon file or 204 No Content
    """
    logger.debug("Favicon requested")
    settings = get_settings()

    # Check if favicon exists in static directory
    favicon_path = settings.STATIC_DIR / "favicon.ico"
    if not os.path.exists(favicon_path):
        logger.debug("Favicon not found, returning 204 No Content")
        # Return 204 No Content if favicon doesn't exist
        return FileResponse(status_code=204)

    logger.debug(f"Serving favicon from {favicon_path}")
    return FileResponse(favicon_path)
