"""OpenAI translation provider implementation."""

import openai

from src.core.config import get_settings
from src.core.logging import get_logger

from .base import BaseTranslationProvider

logger = get_logger(__name__)


class OpenAITranslationProvider(BaseTranslationProvider):
    """OpenAI-based translation provider."""

    def __init__(self):
        """Initialize OpenAI provider with API key and settings."""
        self.settings = get_settings()
        self.client = openai.OpenAI(api_key=self.settings.OPENAI_API_KEY)

    async def translate_text(self, text: str, target_language: str, guideline: str = "") -> str:
        """
        Translate text using OpenAI's GPT model.

        Args:
            text: Text to translate
            target_language: Target language for translation
            guideline: Additional translation guidelines (optional)

        Returns:
            Translated text

        Raises:
            Exception: If translation fails
        """
        logger.info(
            f"Translating text with OpenAI, text length: {len(text)}, target: {target_language}, "
            f"guideline: {'provided' if guideline else 'none'}"
        )

        # Create system prompt for translation
        guideline_text = f" {guideline}" if guideline else ""
        system_prompt = f"""You are a translation assistant.
        Translate the following text into {target_language}. {guideline_text}
        Provide only the translated text without any explanations or additional content."""

        print(system_prompt)

        try:
            response = self.client.chat.completions.create(
                model=self.settings.DEFAULT_TRANSLATION_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text},
                ],
                temperature=0.3,  # Lower temperature for more consistent translations
            )

            translated_text = response.choices[0].message.content.strip()
            logger.info(
                f"OpenAI translation successful, translated text length: {len(translated_text)}"
            )
            return translated_text

        except Exception as e:
            logger.error(f"OpenAI translation error: {e}", exc_info=True)
            raise

    def get_provider_name(self) -> str:
        """Get the provider name."""
        return "openai"
