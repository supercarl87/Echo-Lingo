"""
Transcription service for converting audio to text.
"""

from pathlib import Path

import openai

from src.core.config import get_settings
from src.core.logging import get_logger

# Set up logger
logger = get_logger(__name__)


async def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribe audio file using OpenAI's Whisper model.

    Args:
        audio_file_path: Path to the audio file

    Returns:
        Transcribed text
    """
    settings = get_settings()
    logger.info(f"Transcribing audio file: {audio_file_path}")

    # Initialize OpenAI client
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        logger.error("OpenAI API key not found")
        raise ValueError("OpenAI API key not found in environment variables or settings")

    client = openai.OpenAI(api_key=api_key)
    logger.debug("OpenAI client initialized")

    try:
        # Ensure audio path exists
        audio_path = Path(audio_file_path)
        if not audio_path.exists():
            logger.error(f"Audio file not found: {audio_path}")
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.debug("Starting transcription with Whisper model")
        # Perform transcription
        with open(audio_file_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(model="whisper-1", file=audio_file)

        logger.info(f"Transcription successful, text length: {len(transcript.text)}")
        logger.debug(f"Transcribed text: {transcript.text[:100]}...")
        return transcript.text
    except Exception as e:
        logger.error(f"Transcription error: {e}", exc_info=True)
        raise
