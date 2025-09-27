"""
Main FastAPI application.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.api.routes import router
from src.core.config import create_directories, get_settings
from src.core.logging import get_logger, setup_logging

# Set up logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for the FastAPI application.

    Args:
        app: FastAPI application
    """
    # Setup: Create necessary directories
    logger.info("Creating necessary directories")
    create_directories()
    logger.info("Application startup complete")

    yield

    # Cleanup: Nothing to do here for now
    logger.info("Application shutdown")


def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns:
        FastAPI: Configured FastAPI application
    """
    settings = get_settings()
    logger.info(f"Creating {settings.APP_NAME} application")

    # Create FastAPI app
    app = FastAPI(
        title=settings.APP_NAME,
        description=settings.APP_DESCRIPTION,
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    # Add CORS middleware
    logger.debug("Configuring CORS middleware")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )

    # Mount static files directory
    logger.debug(f"Mounting static files directory: {settings.STATIC_DIR}")
    app.mount("/static", StaticFiles(directory=str(settings.STATIC_DIR)), name="static")

    # Include API routes
    logger.debug("Including API routes")
    app.include_router(router, prefix=settings.API_PREFIX)

    logger.info(f"{settings.APP_NAME} application created successfully")
    return app


# Create the FastAPI application
app = create_application()


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting application directly")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
