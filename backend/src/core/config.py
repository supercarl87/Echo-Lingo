"""
Configuration settings for the EchoLingo application.
"""

import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    # Application info
    APP_NAME: str = "EchoLingo"
    APP_VERSION: str = "0.1.0"
    APP_DESCRIPTION: str = (
        "API for transcribing, translating, and generating speech from audio files"
    )

    # API settings
    API_PREFIX: str = ""

    # CORS settings
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    # File storage settings
    TEMP_DIR: Path = Field(default_factory=lambda: Path("temp"))
    STATIC_DIR: Path = Field(default_factory=lambda: Path("static"))
    LOGS_DIR: Path = Field(default_factory=lambda: Path("logs"))

    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Service settings (Required)
    OPENAI_API_KEY: str = Field(
        default="", description="OpenAI API key for transcription and translation services"
    )
    ELEVENLABS_API_KEY: str = Field(
        default="", description="ElevenLabs API key for text-to-speech services"
    )
    HUME_API_KEY: str = Field(default="", description="Hume API key for text-to-speech services")

    # Voice provider settings
    VOICE_PROVIDER: str = Field(
        default="hume", description="Voice service provider (hume or elevenlabs)"
    )
    HUME_VOICE_ID: str = Field(
        default="30edfa2e-7d75-45fb-8ccf-e280941393ee", description="Hume voice ID for TTS"
    )

    # Translation provider settings
    TRANSLATION_PROVIDER: str = Field(
        default="openai", description="Translation service provider (openai or sambanova)"
    )

    # SambaNova settings
    SAMBANOVA_API_KEY: str = Field(
        default="", description="SambaNova API key for translation services"
    )
    SAMBANOVA_BASE_URL: str = Field(
        default="https://api.sambanova.ai/v1", description="SambaNova API base URL"
    )
    SAMBANOVA_TRANSLATION_MODEL: str = Field(
        default="Meta-Llama-3.1-8B-Instruct", description="SambaNova model for translation"
    )

    # Default voice and model settings
    DEFAULT_VOICE_ID: str = "o47F6fLSHEFdPzySrC5z"
    DEFAULT_TTS_MODEL: str = "eleven_multilingual_v2"
    DEFAULT_TRANSLATION_MODEL: str = "gpt-4o-mini"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )

    @field_validator("OPENAI_API_KEY")
    @classmethod
    def validate_openai_key(cls, v: str) -> str:
        """Validate OpenAI API key."""
        if not v or v == "your_openai_api_key_here":
            raise ValueError("OPENAI_API_KEY is required. Please set it in your .env file.")
        if not v.startswith("sk-"):
            raise ValueError("Invalid OPENAI_API_KEY format. It should start with 'sk-'")
        return v

    @field_validator("ELEVENLABS_API_KEY")
    @classmethod
    def validate_elevenlabs_key(cls, v: str, info) -> str:
        """Validate ElevenLabs API key when using elevenlabs provider."""
        voice_provider = info.data.get("VOICE_PROVIDER", "hume")

        if voice_provider == "elevenlabs":
            if not v or v == "your_elevenlabs_api_key_here":
                raise ValueError(
                    "ELEVENLABS_API_KEY is required when using elevenlabs provider. "
                    "Please set it in your .env file."
                )
        return v

    @field_validator("HUME_API_KEY")
    @classmethod
    def validate_hume_key(cls, v: str, info) -> str:
        """Validate Hume API key when using hume provider."""
        voice_provider = info.data.get("VOICE_PROVIDER", "hume")

        if voice_provider == "hume":
            if not v or v == "your_hume_api_key_here":
                raise ValueError(
                    "HUME_API_KEY is required when using hume provider. "
                    "Please set it in your .env file."
                )
        return v

    @field_validator("VOICE_PROVIDER")
    @classmethod
    def validate_voice_provider(cls, v: str) -> str:
        """Validate voice provider."""
        valid_providers = ["hume", "elevenlabs"]
        if v.lower() not in valid_providers:
            raise ValueError(f"Invalid VOICE_PROVIDER: {v}. Must be one of {valid_providers}")
        return v.lower()

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Invalid LOG_LEVEL: {v}. Must be one of {valid_levels}")
        return v.upper()

    @field_validator("TRANSLATION_PROVIDER")
    @classmethod
    def validate_translation_provider(cls, v: str) -> str:
        """Validate translation provider."""
        valid_providers = ["openai", "sambanova"]
        if v.lower() not in valid_providers:
            raise ValueError(f"Invalid TRANSLATION_PROVIDER: {v}. Must be one of {valid_providers}")
        return v.lower()

    @field_validator("SAMBANOVA_API_KEY")
    @classmethod
    def validate_sambanova_key(cls, v: str, info) -> str:
        """Validate SambaNova API key when using sambanova provider."""
        # Get the translation provider from the data being validated
        translation_provider = info.data.get("TRANSLATION_PROVIDER", "openai")

        if translation_provider == "sambanova":
            if not v or v == "your_sambanova_api_key_here":
                raise ValueError(
                    "SAMBANOVA_API_KEY is required when using sambanova provider. "
                    "Please set it in your .env file."
                )
        return v


@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings from environment variables or .env file.

    Returns:
        Settings: Application settings
    """
    return Settings()


def validate_config() -> tuple[bool, str]:
    """
    Validate configuration on startup.

    Returns:
        tuple: (is_valid, error_message)
    """
    try:
        settings = get_settings()

        # Check if .env file exists
        env_file = Path(".env")
        if not env_file.exists():
            return False, (
                "⚠️  .env file not found!\n"
                "Please create a .env file with your configuration.\n"
                "You can copy .env.example as a template:\n"
                "  cp .env.example .env"
            )

        # Settings validation will happen automatically through Pydantic
        # If we get here, all validations passed
        print("✅ Configuration loaded and validated successfully!")
        print(f"   - OpenAI API Key: {'*' * 8}{settings.OPENAI_API_KEY[-4:]}")

        # Voice provider information
        print(f"   - Voice Provider: {settings.VOICE_PROVIDER}")
        if settings.VOICE_PROVIDER == "elevenlabs":
            el_key = settings.ELEVENLABS_API_KEY
            el_masked = f"{'*' * 8}{el_key[-4:]}" if len(el_key) > 4 else "****"
            print(f"   - ElevenLabs API Key: {el_masked}")
        elif settings.VOICE_PROVIDER == "hume":
            hume_key = settings.HUME_API_KEY
            hume_masked = f"{'*' * 8}{hume_key[-4:]}" if len(hume_key) > 4 else "****"
            print(f"   - Hume API Key: {hume_masked}")
            print(f"   - Hume Voice ID: {settings.HUME_VOICE_ID}")

        print(f"   - Translation Provider: {settings.TRANSLATION_PROVIDER}")
        print(f"   - Log Level: {settings.LOG_LEVEL}")

        return True, ""

    except ValidationError as e:
        error_messages = []
        for error in e.errors():
            field = error["loc"][0]
            msg = error["msg"]
            error_messages.append(f"   - {field}: {msg}")

        return False, (
            "❌ Configuration validation failed!\n"
            "The following errors were found:\n"
            + "\n".join(error_messages)
            + "\n\nPlease check your .env file and ensure all required fields are set correctly."
        )
    except Exception as e:
        return False, f"❌ Unexpected error loading configuration: {str(e)}"


# Create necessary directories
def create_directories():
    """Create necessary directories for the application."""
    settings = get_settings()

    # Create temp directories
    os.makedirs(settings.TEMP_DIR / "input", exist_ok=True)
    os.makedirs(settings.TEMP_DIR / "output", exist_ok=True)

    # Create static directory
    os.makedirs(settings.STATIC_DIR, exist_ok=True)

    # Create logs directory
    os.makedirs(settings.LOGS_DIR, exist_ok=True)
