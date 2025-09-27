"""
Utility functions for file handling.
"""

import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import UploadFile

from src.core.config import get_settings
from src.core.logging import get_logger

# Set up logger
logger = get_logger(__name__)


async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Save an uploaded file to a temporary location.

    Args:
        upload_file: The uploaded file

    Returns:
        Path to the saved file
    """
    settings = get_settings()
    logger.info(f"Saving uploaded file: {upload_file.filename}")

    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    unique_id = str(uuid.uuid4())[:8]
    file_prefix = f"{timestamp}_{unique_id}"
    logger.debug(f"Generated file prefix: {file_prefix}")

    # Get original filename and ensure it has a valid extension
    filename = upload_file.filename or "audio.wav"
    if not any(filename.endswith(ext) for ext in [".mp3", ".wav", ".m4a"]):
        logger.debug(f"Adding .wav extension to filename: {filename}")
        filename = f"{filename}.wav"

    # Create full path for saving
    temp_input_path = settings.TEMP_DIR / "input" / f"{file_prefix}_{filename}"
    logger.debug(f"Saving file to: {temp_input_path}")

    # Save the file
    try:
        with open(temp_input_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        logger.info(f"File saved successfully to: {temp_input_path}")
    except Exception as e:
        logger.error(f"Error saving file: {e}", exc_info=True)
        raise

    return str(temp_input_path)


def generate_output_path(extension: str = "mp3") -> str:
    """
    Generate a path for an output file.

    Args:
        extension: File extension (default: mp3)

    Returns:
        Path to the output file
    """
    settings = get_settings()
    logger.debug(f"Generating output path with extension: {extension}")

    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    unique_id = str(uuid.uuid4())[:8]
    file_prefix = f"{timestamp}_{unique_id}"

    # Create full path for output
    output_path = os.path.join(settings.TEMP_DIR, "output", f"{file_prefix}.{extension}")
    logger.debug(f"Generated output path: {output_path}")

    return str(output_path)


def get_file_url(file_path: str) -> str:
    """
    Convert a file path to a URL for API access.

    Args:
        file_path: Path to the file

    Returns:
        URL to access the file
    """
    # Convert path to Path object for easier manipulation
    path = Path(file_path)

    # Extract the filename
    filename = path.name

    # Create URL
    url = f"/api/audio/{filename}"
    logger.debug(f"Generated URL for file {file_path}: {url}")

    return url
