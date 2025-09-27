"""Factory for creating translation providers."""

from src.core.config import get_settings
from src.core.logging import get_logger

from .base import BaseTranslationProvider
from .openai_provider import OpenAITranslationProvider
from .sambanova_provider import SambaNovaTranslationProvider

logger = get_logger(__name__)


class TranslationProviderFactory:
    """Factory for creating translation providers based on configuration."""

    @staticmethod
    def create_provider() -> BaseTranslationProvider:
        """
        Create a translation provider based on the configured provider.

        Returns:
            BaseTranslationProvider: The configured translation provider

        Raises:
            ValueError: If the configured provider is not supported
        """
        settings = get_settings()
        provider_name = settings.TRANSLATION_PROVIDER

        logger.info(f"Creating translation provider: {provider_name}")

        if provider_name == "openai":
            return OpenAITranslationProvider()
        elif provider_name == "sambanova":
            return SambaNovaTranslationProvider()
        else:
            raise ValueError(
                f"Unsupported translation provider: {provider_name}. "
                f"Supported providers: openai, sambanova"
            )


def get_translation_provider() -> BaseTranslationProvider:
    """
    Get the configured translation provider instance.

    Returns:
        BaseTranslationProvider: The translation provider instance
    """
    return TranslationProviderFactory.create_provider()
