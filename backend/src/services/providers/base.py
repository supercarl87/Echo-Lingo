"""Base provider interface for translation services."""

from abc import ABC, abstractmethod


class BaseTranslationProvider(ABC):
    """Abstract base class for translation providers."""

    @abstractmethod
    async def translate_text(self, text: str, target_language: str) -> str:
        """
        Translate text to the target language.

        Args:
            text: Text to translate
            target_language: Target language for translation

        Returns:
            Translated text

        Raises:
            Exception: If translation fails
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """
        Get the name of the translation provider.

        Returns:
            Provider name
        """
        pass
