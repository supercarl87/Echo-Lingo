"""
Hume voice provider implementation.
"""

from typing import AsyncGenerator

from hume import HumeClient
from hume.tts import FormatMp3

from src.core.config import get_settings
from src.core.logging import get_logger

from .base import VoiceProvider

logger = get_logger(__name__)


class HumeProvider(VoiceProvider):
    """Hume voice provider implementation."""

    def __init__(self):
        """Initialize the Hume provider."""
        self.settings = get_settings()
        self.client = None
        self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize the Hume client."""
        try:
            if not self.settings.HUME_API_KEY:
                raise ValueError("HUME_API_KEY is not configured")

            self.client = HumeClient(api_key=self.settings.HUME_API_KEY)
            logger.debug("Hume client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Hume client: {e}")
            raise

    async def generate_speech(self, text: str, output_file: str, voice_id: str = None) -> str:
        """
        Generate speech from text using Hume TTS and save to file.

        Args:
            text: Text to convert to speech
            output_file: Path to save the output audio file
            voice_id: Voice ID to use (if None, uses default voice)

        Returns:
            Path to the saved audio file

        Raises:
            Exception: If speech generation fails
        """
        logger.info(f"Generating speech with Hume, text length: {len(text)}, output: {output_file}")

        try:
            if not self.client:
                self._initialize_client()

            # Use provided voice_id or default
            voice_id = voice_id or self.settings.HUME_VOICE_ID
            logger.debug(f"Using Hume voice ID: {voice_id}")

            # Generate speech using Hume TTS API
            response = self.client.tts.synthesize_file(
                format=FormatMp3(),
                num_generations=1,
                utterances=[{"text": text, "voice": {"id": voice_id}}],
            )

            # Save the response to file
            chunk_count = 0
            with open(output_file, "wb") as f:
                for chunk in response:
                    f.write(chunk)
                    chunk_count += 1

            logger.info(
                f"Hume speech generation successful, wrote {chunk_count} chunks to {output_file}"
            )
            return output_file

        except Exception as e:
            logger.error(f"Hume speech generation error: {e}", exc_info=True)
            raise

    async def generate_speech_stream(self, text: str, voice_id: str = None) -> AsyncGenerator[bytes, None]:
        """
        Generate speech from text as a stream using Hume TTS.

        Args:
            text: Text to convert to speech
            voice_id: Voice ID to use (if None, uses default voice)

        Yields:
            Audio chunks as bytes

        Raises:
            Exception: If speech generation fails
        """
        logger.info(f"Generating speech stream with Hume, text length: {len(text)}")

        try:
            if not self.client:
                self._initialize_client()

            # Use provided voice_id or default
            voice_id = voice_id or self.settings.HUME_VOICE_ID
            logger.debug(f"Using Hume voice ID: {voice_id}")

            # Generate speech using Hume TTS API
            response = self.client.tts.synthesize_file(
                format=FormatMp3(),
                num_generations=1,
                utterances=[{"text": text, "voice": {"id": voice_id}}],
            )

            # Yield chunks as they come
            chunk_count = 0
            for chunk in response:
                yield chunk
                chunk_count += 1

            logger.info(f"Hume speech stream generation successful, yielded {chunk_count} chunks")

        except Exception as e:
            logger.error(f"Hume speech stream generation error: {e}", exc_info=True)
            raise

    def get_provider_name(self) -> str:
        """Get the name of the voice provider."""
        return "hume"

    def validate_configuration(self) -> bool:
        """
        Validate that the Hume provider is properly configured.

        Returns:
            True if configuration is valid

        Raises:
            ValueError: If configuration is invalid
        """
        if not self.settings.HUME_API_KEY:
            raise ValueError("HUME_API_KEY is required for Hume provider")

        if not self.settings.HUME_VOICE_ID:
            raise ValueError("HUME_VOICE_ID is required for Hume provider")

        return True
