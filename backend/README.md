# EchoLingo Backend

FastAPI backend for the EchoLingo application, providing audio transcription, translation, and text-to-speech capabilities.

## Features

-   Audio transcription using FunASR
-   Text translation
-   Text-to-speech conversion using ElevenLabs

## Project Structure

The project follows a modular structure for better organization and maintainability:

```
src/
├── api/                  # API-related code
│   ├── models/           # Pydantic models for request/response
│   └── routes/           # API route definitions
├── core/                 # Core application code
│   ├── config.py         # Application configuration
│   └── logging.py        # Logging configuration
├── services/             # Business logic services
│   ├── transcription.py  # Audio transcription service
│   ├── translation.py    # Text translation service
│   └── text_to_speech.py # Text-to-speech service
├── utils/                # Utility functions
│   └── file_utils.py     # File handling utilities
└── app.py               # Main application entry point
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
pip install -e .
```

Or with uv:

```bash
uv pip install -e .
```

## Running the Server

The project includes a convenient script (`run.py`) to start the server in different modes with optional ngrok tunneling.

### Basic Usage

```bash
# Start in development mode (default)
./run.py

# Start in production mode
./run.py --mode prod

# Start without ngrok tunneling
./run.py --no-ngrok

# Specify a custom port
./run.py --port 8000

# Set a specific log level
./run.py --log-level DEBUG
```

### Command Line Options

| Option           | Description                                 | Default                                |
| ---------------- | ------------------------------------------- | -------------------------------------- |
| `--mode`         | Server mode: 'dev' or 'prod'                | 'dev'                                  |
| `--port`         | Port number                                 | 50000                                  |
| `--host`         | Host address                                | '0.0.0.0'                              |
| `--ngrok`        | Enable ngrok tunneling                      | True                                   |
| `--no-ngrok`     | Disable ngrok tunneling                     | -                                      |
| `--ngrok-domain` | Custom ngrok domain                         | 'fond-workable-firefly.ngrok-free.app' |
| `--workers`      | Number of worker processes (prod mode only) | Auto-calculated based on CPU cores     |
| `--log-level`    | Logging level (DEBUG, INFO, WARNING, etc.)  | INFO                                   |

### Examples

Start in development mode with default settings:

```bash
./run.py
```

Start in production mode with 4 workers:

```bash
./run.py --mode prod --workers 4
```

Start on a custom port without ngrok:

```bash
./run.py --port 8080 --no-ngrok
```

Use a custom ngrok domain:

```bash
./run.py --ngrok-domain your-custom-domain.ngrok-free.app
```

Start with debug logging:

```bash
./run.py --log-level DEBUG
```

## Testing

The project includes integration tests to verify the functionality of the API endpoints.

### Running Tests

To run all tests:

```bash
pytest
```

To run specific tests:

```bash
# Run only integration tests
pytest tests/integration/

# Run a specific test file
pytest tests/integration/test_audio_routes.py

# Run a specific test function
pytest tests/integration/test_audio_routes.py::test_process_audio_endpoint
```

### Test Coverage

To run tests with coverage reporting:

```bash
pytest --cov=src tests/
```

This requires the `pytest-cov` package, which can be installed with:

```bash
uv pip install pytest-cov
```

## API Endpoints

### Root Endpoints

-   `GET /`: Returns basic application information
-   `GET /health`: Health check endpoint
-   `GET /favicon.ico`: Serves the favicon

### Audio Processing Endpoints

-   `POST /api/audio/process`: Process an audio file for transcription, translation, and text-to-speech
-   `GET /api/audio/{filename}`: Retrieve a generated audio file

## Development

The development server includes auto-reload functionality, which automatically restarts the server when code changes are detected.

## Logging

The application uses Python's standard logging module with the following features:

-   Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
-   Log output: Console and log files
-   Log files location: `logs/` directory
    -   `app.log`: Contains all logs
    -   `error.log`: Contains only error logs

You can configure the log level when starting the server using the `--log-level` option.

## Favicon

The application includes a custom favicon that is automatically generated when the server starts if one doesn't exist. This prevents the common 404 errors when browsers request `/favicon.ico`.

If you want to use your own favicon:

1. Place your custom favicon.ico file in the `static` directory
2. The server will use your custom favicon instead of generating one

The favicon generation uses the Pillow library, which is installed automatically when you run the server for the first time.
