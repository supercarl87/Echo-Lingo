"""
Integration tests for audio processing routes.
"""

import os

from fastapi import status


def test_process_audio_endpoint(client, test_audio_file):
    """
    Test the /api/audio/process endpoint with a real audio file.

    This test verifies that:
    1. The API can process an audio file
    2. The response contains the expected fields
    3. The transcribed and translated text are non-empty
    4. The audio URL is valid and points to an existing file

    Args:
        client: Test client
        test_audio_file: Path to test audio file
    """
    # Prepare the file for upload
    with open(test_audio_file, "rb") as f:
        # Make the request
        response = client.post(
            "/api/audio/process",
            files={"file": ("input.mp3", f, "audio/mpeg")},
            params={"target_language": "English"},
        )

    # Check status code
    assert response.status_code == status.HTTP_200_OK, f"Response: {response.text}"

    # Parse response
    data = response.json()

    # Validate response structure
    assert "transcribed_text" in data, "Response missing transcribed_text field"
    assert "translated_text" in data, "Response missing translated_text field"
    assert "audio_url" in data, "Response missing audio_url field"

    # Validate content
    assert data["transcribed_text"], "Transcribed text is empty"
    assert data["translated_text"], "Translated text is empty"
    assert data["audio_url"].startswith("/api/audio/"), "Invalid audio URL format"

    # Extract filename from URL and check if file exists
    filename = data["audio_url"].split("/")[-1]

    # Get the output directory from settings
    from src.core.config import get_settings

    settings = get_settings()
    output_path = settings.TEMP_DIR / "output" / filename

    # Verify the output file exists
    assert output_path.exists(), f"Output audio file not found: {output_path}"

    # Verify file size is reasonable (greater than 1KB)
    assert output_path.stat().st_size > 1024, "Output audio file is too small"

    # Clean up - remove the generated file
    os.remove(output_path)


def test_get_audio_endpoint(client, test_audio_file):
    """
    Test the /api/audio/{filename} endpoint.

    This test:
    1. Processes an audio file to generate an output
    2. Retrieves the generated audio file
    3. Verifies the content type and size

    Args:
        client: Test client
        test_audio_file: Path to test audio file
    """
    # First, process an audio file to get a valid filename
    with open(test_audio_file, "rb") as f:
        process_response = client.post(
            "/api/audio/process",
            files={"file": ("input.mp3", f, "audio/mpeg")},
            params={"target_language": "English"},
        )

    # Check if processing was successful
    assert process_response.status_code == status.HTTP_200_OK

    # Get the filename from the response
    data = process_response.json()
    filename = data["audio_url"].split("/")[-1]

    # Now test the get_audio endpoint
    get_response = client.get(f"/api/audio/{filename}")

    # Check status code
    assert get_response.status_code == status.HTTP_200_OK

    # Check content type
    assert get_response.headers["content-type"] == "audio/mpeg"

    # Check content length
    assert int(get_response.headers["content-length"]) > 1024

    # Clean up - remove the generated file
    from src.core.config import get_settings

    settings = get_settings()
    output_path = settings.TEMP_DIR / "output" / filename
    os.remove(output_path)


def test_get_audio_nonexistent_file(client):
    """
    Test the /api/audio/{filename} endpoint with a nonexistent file.

    Args:
        client: Test client
    """
    # Generate a filename that doesn't exist
    nonexistent_filename = "nonexistent_file.mp3"

    # Make the request
    response = client.get(f"/api/audio/{nonexistent_filename}")

    # Check status code
    assert response.status_code == status.HTTP_404_NOT_FOUND
