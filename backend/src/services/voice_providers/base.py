"""
Abstract base class for voice providers.
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator


class VoiceProvider(ABC):
    """Abstract base class for voice providers."""

    @abstractmethod
    async def generate_speech(self, text: str, output_file: str, voice_id: str = None) -> str:
        """
        Generate speech from text and save to file.

        Args:
            text: Text to convert to speech
            output_file: Path to save the output audio file
            voice_id: Voice ID to use (if None, uses default voice)

        Returns:
            Path to the saved audio file

        Raises:
            Exception: If speech generation fails
        """
        pass

    @abstractmethod
    async def generate_speech_stream(self, text: str, voice_id: str = None) -> AsyncGenerator[bytes, None]:
        """
        Generate speech from text as a stream of audio chunks.

        Args:
            text: Text to convert to speech
            voice_id: Voice ID to use (if None, uses default voice)

        Yields:
            Audio chunks as bytes

        Raises:
            Exception: If speech generation fails
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """
        Get the name of the voice provider.

        Returns:
            Name of the provider
        """
        pass

    @abstractmethod
    def validate_configuration(self) -> bool:
        """
        Validate that the provider is properly configured.

        Returns:
            True if configuration is valid

        Raises:
            ValueError: If configuration is invalid
        """
        pass
