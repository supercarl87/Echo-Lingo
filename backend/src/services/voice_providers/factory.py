"""
Voice provider factory for creating voice provider instances.
"""

from src.core.config import get_settings
from src.core.logging import get_logger

from .base import VoiceProvider
from .elevenlabs_provider import ElevenLabsProvider
from .hume_provider import HumeProvider

logger = get_logger(__name__)


def create_voice_provider(provider_name: str = None) -> VoiceProvider:
    """
    Create a voice provider instance based on configuration or specified provider.

    Args:
        provider_name: Name of the voice provider to create (if None, uses configured provider)

    Returns:
        VoiceProvider: The configured voice provider instance

    Raises:
        ValueError: If an unsupported provider is specified
        Exception: If provider initialization fails
    """
    settings = get_settings()
    provider_name = (provider_name or settings.VOICE_PROVIDER).lower()

    logger.info(f"Creating voice provider: {provider_name}")

    try:
        if provider_name == "hume":
            provider = HumeProvider()
        elif provider_name == "elevenlabs":
            provider = ElevenLabsProvider()
        else:
            raise ValueError(
                f"Unsupported voice provider: {provider_name}. "
                "Supported providers: hume, elevenlabs"
            )

        # Validate configuration
        provider.validate_configuration()

        logger.info(f"Voice provider '{provider_name}' created and validated successfully")
        return provider

    except Exception as e:
        logger.error(f"Failed to create voice provider '{provider_name}': {e}")
        raise


def get_available_providers() -> list[str]:
    """
    Get a list of available voice providers.

    Returns:
        List of available provider names
    """
    return ["hume", "elevenlabs"]


def validate_provider_configuration(provider_name: str) -> bool:
    """
    Validate configuration for a specific provider without creating it.

    Args:
        provider_name: Name of the provider to validate

    Returns:
        True if configuration is valid

    Raises:
        ValueError: If configuration is invalid
    """
    settings = get_settings()
    provider_name = provider_name.lower()

    if provider_name == "hume":
        if not settings.HUME_API_KEY:
            raise ValueError("HUME_API_KEY is required for Hume provider")
        if not settings.HUME_VOICE_ID:
            raise ValueError("HUME_VOICE_ID is required for Hume provider")

    elif provider_name == "elevenlabs":
        if not settings.ELEVENLABS_API_KEY:
            raise ValueError("ELEVENLABS_API_KEY is required for ElevenLabs provider")
        if not settings.DEFAULT_VOICE_ID:
            raise ValueError("DEFAULT_VOICE_ID is required for ElevenLabs provider")
        if not settings.DEFAULT_TTS_MODEL:
            raise ValueError("DEFAULT_TTS_MODEL is required for ElevenLabs provider")

    else:
        raise ValueError(f"Unknown provider: {provider_name}")

    return True
