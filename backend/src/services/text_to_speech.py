"""
Text-to-speech service for converting text to audio.
"""

from typing import AsyncGenerator

from src.core.config import get_settings
from src.core.logging import get_logger
from src.services.voice_providers.factory import create_voice_provider

# Set up logger
logger = get_logger(__name__)


async def generate_speech(
    text: str,
    output_file: str,
    voice_provider: str = None,
    voice_id: str = None
) -> str:
    """
    Convert text to speech and save to file using the specified or configured voice provider.

    Args:
        text: Text to convert to speech
        output_file: Path to save the output audio file
        voice_provider: Voice provider to use (if None, uses configured provider)
        voice_id: Voice ID to use (if None, uses default for the provider)

    Returns:
        Path to the saved audio file
    """
    settings = get_settings()
    provider_name = voice_provider or settings.VOICE_PROVIDER
    logger.info(
        f"Generating speech using {provider_name}, text length: {len(text)}, "
        f"output file: {output_file}, voice ID: {voice_id or 'default'}"
    )

    try:
        # Create the voice provider
        provider = create_voice_provider(provider_name)

        # Generate speech using the provider
        result = await provider.generate_speech(text, output_file, voice_id)

        logger.info(f"Speech generation successful using {provider_name}: {result}")
        return result

    except Exception as e:
        logger.error(f"Text-to-speech error with {provider_name}: {e}", exc_info=True)
        raise


async def generate_speech_stream(
    text: str,
    voice_provider: str = None,
    voice_id: str = None
) -> AsyncGenerator[bytes, None]:
    """
    Generate speech from text as a stream using the specified or configured voice provider.

    Args:
        text: Text to convert to speech
        voice_provider: Voice provider to use (if None, uses configured provider)
        voice_id: Voice ID to use (if None, uses default for the provider)

    Yields:
        Audio chunks as bytes
    """
    settings = get_settings()
    provider_name = voice_provider or settings.VOICE_PROVIDER
    logger.info(
        f"Generating speech stream using {provider_name}, text length: {len(text)}, "
        f"voice ID: {voice_id or 'default'}"
    )

    try:
        # Create the voice provider
        provider = create_voice_provider(provider_name)

        # Generate speech stream using the provider
        async for chunk in provider.generate_speech_stream(text, voice_id):
            yield chunk

        logger.info(f"Speech stream generation successful using {provider_name}")

    except Exception as e:
        logger.error(f"Text-to-speech stream error with {provider_name}: {e}", exc_info=True)
        raise


def get_current_provider_name() -> str:
    """
    Get the name of the currently configured voice provider.

    Returns:
        Name of the current voice provider
    """
    settings = get_settings()
    return settings.VOICE_PROVIDER


def validate_provider_configuration() -> bool:
    """
    Validate that the current voice provider is properly configured.

    Returns:
        True if configuration is valid

    Raises:
        ValueError: If configuration is invalid
    """
    try:
        provider = create_voice_provider()
        return provider.validate_configuration()
    except Exception as e:
        logger.error(f"Voice provider validation failed: {e}")
        raise
