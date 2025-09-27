"""
Pydantic models for audio processing.
"""

from pydantic import BaseModel, Field


class AudioResponse(BaseModel):
    """Response model for audio processing."""

    transcribed_text: str = Field(..., description="The transcribed text from the audio file")
    translated_text: str = Field(..., description="The translated text")
    audio_url: str = Field(..., description="URL to access the generated audio file")


class AudioProcessRequest(BaseModel):
    """Request model for audio processing."""

    target_language: str = Field(default="English", description="Target language for translation")


class ErrorResponse(BaseModel):
    """Error response model."""

    detail: str = Field(..., description="Error details")
