"""
Pytest configuration for EchoLingo backend tests.
"""

import sys
import warnings
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.app import create_application


@pytest.fixture
def app():
    """
    Create a FastAPI application for testing.

    Returns:
        FastAPI: Application instance
    """
    return create_application()


@pytest.fixture
def client(app):
    """
    Create a test client for the FastAPI application.

    Args:
        app: FastAPI application

    Returns:
        TestClient: Test client
    """
    return TestClient(app)


@pytest.fixture
def test_audio_file():
    """
    Path to the test audio file.

    Returns:
        str: Path to the test audio file
    """
    # Use the input.mp3 file in the project root
    audio_path = Path(__file__).parent.parent / "input.mp3"

    # Ensure the file exists
    if not audio_path.exists():
        pytest.skip(f"Test audio file not found: {audio_path}")

    return str(audio_path)


# Filter out warnings before tests run
def pytest_configure(config):
    """Configure pytest."""
    # Filter out specific warnings
    warnings.filterwarnings("ignore", category=DeprecationWarning)
    warnings.filterwarnings("ignore", message=".*asyncio_default_fixture_loop_scope.*")
    warnings.filterwarnings("ignore", message=".*Support for class-based `config` is deprecated.*")
    warnings.filterwarnings("ignore", message=".*'audioop' is deprecated.*")
