"""
API routes for audio processing.
"""

import os
import time
import traceback
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse
from pydub import AudioSegment

from src.api.models.audio import AudioResponse
from src.core.config import get_settings
from src.core.logging import get_logger
from src.services import text_to_speech, transcription, translation
from src.utils import file_utils

# Set up logger
logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/audio", tags=["audio"])


def log_error(e: Exception, message: str, total_time: Optional[float] = None) -> None:
    """
    Log an error with consistent formatting.

    Args:
        e: The exception that occurred
        message: A descriptive message about the context
        total_time: Optional processing time before the error occurred
    """
    time_info = f" after {total_time:.2f}s" if total_time is not None else ""
    error_message = f"{message}{time_info}: {str(e)}"

    # Log with full traceback
    logger.error(f"{error_message}\nTraceback: {traceback.format_exc()}")


@router.post("/process", response_model=AudioResponse)
async def process_audio(
    request: Request,
    file: UploadFile = File(...),
    target_language: str = Query("English", description="Target language for translation"),
    should_translate: bool = Query(True, description="Whether to translate the transcribed text"),
    should_generate_audio: bool = Query(
        True, description="Whether to generate audio from translated text"
    ),
    voice_provider: str = Query("elevenlabs", description="Voice provider to use for TTS"),
    voice_id: Optional[str] = Query(None, description="Voice ID to use for TTS (uses default if not specified)"),
):
    """
    Process an audio file: transcribe, translate, and generate speech.

    Args:
        request: The FastAPI request object
        file: Audio file to process
        target_language: Target language for translation
        should_translate: Whether to translate the transcribed text
        should_generate_audio: Whether to generate audio from translated text
        voice_provider: Voice provider to use for TTS (elevenlabs, hume)
        voice_id: Voice ID to use for TTS (uses default if not specified)

    Returns:
        AudioResponse: Object containing transcribed text, translated text, and audio URL
    """
    start_time = time.time()
    logger.info(
        f"Processing audio file: {file.filename}, target language: {target_language}, "
        f"translate: {should_translate}, generate audio: {should_generate_audio}, "
        f"voice provider: {voice_provider}, voice ID: {voice_id or 'default'}"
    )

    # Log request content type and headers for debugging
    content_type = request.headers.get("content-type", "")
    logger.debug(f"Request content type: {content_type}")

    try:
        # Validate file
        if not file.filename:
            logger.error("No filename provided in the upload")
            raise HTTPException(status_code=400, detail="No filename provided")

        # Log file details
        logger.debug(f"File content type: {file.content_type}")
        logger.debug(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")

        # Save uploaded file
        step_start_time = time.time()
        try:
            temp_input_path = await file_utils.save_upload_file(file)
            step_time = time.time() - step_start_time
            logger.info(f"File upload saved in {step_time:.2f}s: {temp_input_path}")
        except Exception as e:
            log_error(e, "Error saving uploaded file")
            raise HTTPException(status_code=400, detail=f"Error processing uploaded file: {str(e)}")

        # Get audio length
        audio_length_seconds = None
        try:
            audio = AudioSegment.from_file(temp_input_path)
            audio_length_seconds = len(audio) / 1000  # Convert milliseconds to seconds
            logger.info(f"Audio length: {audio_length_seconds:.2f}s")
        except Exception as e:
            logger.warning(f"Could not determine audio length: {e}")

        # Transcribe audio
        try:
            step_start_time = time.time()
            logger.info(f"Transcribing audio from {temp_input_path}")
            transcribed_text = await transcription.transcribe_audio(temp_input_path)
            step_time = time.time() - step_start_time
            logger.info(f"Transcription completed in {step_time:.2f}s")
        except Exception as e:
            total_time = time.time() - start_time
            log_error(e, "Error transcribing audio", total_time)
            raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")

        # Initialize translated_text with transcribed_text
        translated_text = transcribed_text

        # Translate text if requested
        if should_translate:
            try:
                step_start_time = time.time()
                logger.info(f"Translating text to {target_language}")
                translated_text = await translation.translate_text(
                    transcribed_text, target_language
                )
                step_time = time.time() - step_start_time
                logger.info(f"Translation completed in {step_time:.2f}s")
            except Exception as e:
                total_time = time.time() - start_time
                log_error(e, f"Error translating text to {target_language}", total_time)
                # Continue with original text if translation fails
                logger.warning("Using original text due to translation failure")
                translated_text = transcribed_text
        else:
            logger.info("Translation skipped as per request")

        # Generate speech from translated text if requested
        audio_url = None
        if should_generate_audio:
            try:
                step_start_time = time.time()
                output_audio_path = file_utils.generate_output_path("mp3")
                logger.info(f"Generating speech to {output_audio_path}")
                await text_to_speech.generate_speech(
                    translated_text, output_audio_path, voice_provider, voice_id
                )
                step_time = time.time() - step_start_time
                logger.info(f"Speech generation completed in {step_time:.2f}s")

                # Get audio URL
                audio_url = file_utils.get_file_url(output_audio_path)
            except Exception as e:
                total_time = time.time() - start_time
                log_error(e, "Error generating speech", total_time)
                # Continue without audio if generation fails
                logger.warning("Continuing without audio due to speech generation failure")
        else:
            logger.info("Speech generation skipped as per request")

        # Create response
        step_start_time = time.time()
        response = AudioResponse(
            transcribed_text=transcribed_text,
            translated_text=translated_text,
            audio_url=audio_url,
        )
        step_time = time.time() - step_start_time
        logger.info(f"Response preparation completed in {step_time:.2f}s")

        # Log total processing time
        total_time = time.time() - start_time
        logger.info(f"Total audio processing completed in {total_time:.2f}s")

        # Log processing efficiency if audio length is available
        if audio_length_seconds:
            processing_ratio = total_time / audio_length_seconds
            logger.info(f"Processing time ratio: {processing_ratio:.2f}x audio length")

        return response

    except Exception as e:
        # Log error with time information and full traceback
        total_time = time.time() - start_time
        log_error(e, "Error processing audio", total_time)

        # Provide more specific error messages based on exception type
        if "multipart" in str(e).lower() or "boundary" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="Invalid multipart form data. "
                "Please check your request format and try again.",
            )

        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{filename}")
async def get_audio(filename: str):
    """
    Get an audio file by filename.

    Args:
        filename: Name of the audio file

    Returns:
        FileResponse: Audio file
    """
    logger.debug(f"Request for audio file: {filename}")
    settings = get_settings()

    # Construct the full path
    audio_path = settings.TEMP_DIR / "output" / filename

    # Check if file exists
    if not os.path.exists(audio_path):
        logger.warning(f"Audio file not found: {audio_path}")
        raise HTTPException(status_code=404, detail="Audio file not found")

    logger.debug(f"Serving audio file: {audio_path}")
    return FileResponse(audio_path)
