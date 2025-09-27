"""
ElevenLabs voice provider implementation.
"""

from typing import AsyncGenerator

from elevenlabs.client import ElevenLabs

from src.core.config import get_settings
from src.core.logging import get_logger

from .base import VoiceProvider

logger = get_logger(__name__)


class ElevenLabsProvider(VoiceProvider):
    """ElevenLabs voice provider implementation."""

    def __init__(self):
        """Initialize the ElevenLabs provider."""
        self.settings = get_settings()
        self.client = None
        self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize the ElevenLabs client."""
        try:
            if not self.settings.ELEVENLABS_API_KEY:
                raise ValueError("ELEVENLABS_API_KEY is not configured")

            self.client = ElevenLabs(api_key=self.settings.ELEVENLABS_API_KEY)
            logger.debug("ElevenLabs client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ElevenLabs client: {e}")
            raise

    async def generate_speech(self, text: str, output_file: str, voice_id: str = None) -> str:
        """
        Generate speech from text using ElevenLabs TTS and save to file.

        Args:
            text: Text to convert to speech
            output_file: Path to save the output audio file
            voice_id: Voice ID to use (if None, uses default voice)

        Returns:
            Path to the saved audio file

        Raises:
            Exception: If speech generation fails
        """
        logger.info(
            f"Generating speech with ElevenLabs, text length: {len(text)}, output: {output_file}"
        )

        try:
            if not self.client:
                self._initialize_client()

            # Get voice and model settings
            voice_id = voice_id or self.settings.DEFAULT_VOICE_ID
            model_id = self.settings.DEFAULT_TTS_MODEL
            output_format = "mp3_44100_128"
            logger.debug(f"Using voice ID: {voice_id}, model ID: {model_id}")

            # Generate speech using ElevenLabs TTS API
            audio_iterator = self.client.text_to_speech.convert(
                text=text,
                voice_id=voice_id,
                model_id=model_id,
                output_format=output_format,
            )

            # Save to file by writing all chunks
            chunk_count = 0
            with open(output_file, "wb") as f:
                for chunk in audio_iterator:
                    f.write(chunk)
                    chunk_count += 1

            logger.info(
                f"ElevenLabs speech generation successful, wrote {chunk_count} chunks to {output_file}"
            )
            return output_file

        except Exception as e:
            logger.error(f"ElevenLabs speech generation error: {e}", exc_info=True)
            raise

    async def generate_speech_stream(self, text: str, voice_id: str = None) -> AsyncGenerator[bytes, None]:
        """
        Generate speech from text as a stream using ElevenLabs TTS.

        Args:
            text: Text to convert to speech
            voice_id: Voice ID to use (if None, uses default voice)

        Yields:
            Audio chunks as bytes

        Raises:
            Exception: If speech generation fails
        """
        logger.info(f"Generating speech stream with ElevenLabs, text length: {len(text)}")

        try:
            if not self.client:
                self._initialize_client()

            # Get voice and model settings
            voice_id = voice_id or self.settings.DEFAULT_VOICE_ID
            model_id = self.settings.DEFAULT_TTS_MODEL
            output_format = "mp3_44100_128"
            logger.debug(f"Using voice ID: {voice_id}, model ID: {model_id}")

            # Generate speech using ElevenLabs TTS API
            audio_iterator = self.client.text_to_speech.convert(
                text=text,
                voice_id=voice_id,
                model_id=model_id,
                output_format=output_format,
            )

            # Yield chunks as they come
            chunk_count = 0
            for chunk in audio_iterator:
                yield chunk
                chunk_count += 1

            logger.info(
                f"ElevenLabs speech stream generation successful, yielded {chunk_count} chunks"
            )

        except Exception as e:
            logger.error(f"ElevenLabs speech stream generation error: {e}", exc_info=True)
            raise

    def get_provider_name(self) -> str:
        """Get the name of the voice provider."""
        return "elevenlabs"

    def validate_configuration(self) -> bool:
        """
        Validate that the ElevenLabs provider is properly configured.

        Returns:
            True if configuration is valid

        Raises:
            ValueError: If configuration is invalid
        """
        if not self.settings.ELEVENLABS_API_KEY:
            raise ValueError("ELEVENLABS_API_KEY is required for ElevenLabs provider")

        if not self.settings.DEFAULT_VOICE_ID:
            raise ValueError("DEFAULT_VOICE_ID is required for ElevenLabs provider")

        if not self.settings.DEFAULT_TTS_MODEL:
            raise ValueError("DEFAULT_TTS_MODEL is required for ElevenLabs provider")

        return True
