"""
Translation service for converting text from one language to another.
"""

from src.core.logging import get_logger
from src.services.providers.factory import get_translation_provider

# Set up logger
logger = get_logger(__name__)


async def translate_text(text: str, target_language: str) -> str:
    """
    Translate text to the target language using the configured provider.

    Args:
        text: Text to translate
        target_language: Target language for translation

    Returns:
        Translated text
    """
    logger.info(f"Translating text to {target_language}, text length: {len(text)}")

    try:
        # Get the configured translation provider
        provider = get_translation_provider()
        logger.debug(f"Using translation provider: {provider.get_provider_name()}")

        # Perform translation using the provider
        translated_text = await provider.translate_text(text, target_language)

        logger.info(f"Translation successful, translated text length: {len(translated_text)}")
        logger.debug(f"Translated text: {translated_text[:100]}...")
        return translated_text

    except Exception as e:
        logger.error(f"Translation error: {e}", exc_info=True)
        logger.warning("Returning original text due to translation failure")
        # Return original text if translation fails
        return text
