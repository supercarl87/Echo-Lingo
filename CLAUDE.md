# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EchoLingo is a real-time voice translation application with a FastAPI Python backend and React Native/Expo mobile frontend. The app enables users to speak in one language and receive translated speech in another language.

## Architecture

This is a monorepo with two main components:

- **backend/**: FastAPI server with Python 3.12+, handling audio processing, translation, and TTS
- **mobile/**: React Native/Expo mobile app for audio recording and playback

### Backend Structure (`backend/`)
- `src/api/`: API routes and models
- `src/core/`: Core configuration and utilities
- `src/services/`: Business logic for translation, TTS, etc.
  - `voice_providers/`: Voice provider implementations (ElevenLabs, Hume AI)
- `src/utils/`: Helper utilities
- `run.py`: Main server startup script with ngrok integration

### Mobile Structure (`mobile/`)
- `app/`: Expo Router-based app screens and components
- `app/(tabs)/`: Tab-based navigation screens

## Common Development Commands

### Project Setup
```bash
# Install backend dependencies
cd backend && uv sync

# Install mobile dependencies
cd mobile && npm install
```

### Starting Services

**Start everything (recommended):**
```bash
./start-all.sh
```

**Start services individually:**
```bash
# Backend only
cd backend && ./start.sh

# Mobile only
cd mobile && ./start.sh
```

**Backend development (without ngrok):**
```bash
cd backend
uv run python run.py --mode dev --no-ngrok
```

**Mobile development (clear cache):**
```bash
cd mobile
npx expo start --clear
```

### Code Quality

**Backend linting/formatting:**
```bash
cd backend
uv run ruff check .
uv run ruff format .
```

**Mobile linting:**
```bash
cd mobile
npm run lint
```

**Backend testing:**
```bash
cd backend
uv run pytest
```

## Development Configuration

### Backend Configuration
- **Default port:** 50000
- **Ngrok domain:** fond-workable-firefly.ngrok-free.app
- **API docs:** https://fond-workable-firefly.ngrok-free.app/docs
- **Package manager:** uv (not pip)
- **Python version:** 3.12+

### Mobile Configuration
- **Expo SDK:** 54
- **Package manager:** npm/pnpm
- **Port:** 8081 (default Expo)

## Voice Provider Support

The backend supports multiple voice providers with configurable voice IDs:

### Supported Providers
- **ElevenLabs** (default): High-quality voice synthesis
- **Hume AI**: Emotionally expressive voice synthesis

### API Parameters
The `/api/audio/process` endpoint accepts:
- `voice_provider`: "elevenlabs" or "hume" (defaults to "elevenlabs")
- `voice_id`: Any valid voice ID for the chosen provider (uses default if omitted)

### Usage Examples
```bash
# Default ElevenLabs provider
curl -X POST "/api/audio/process" -F "file=@audio.wav"

# ElevenLabs with specific voice
curl -X POST "/api/audio/process?voice_provider=elevenlabs&voice_id=voice_123" -F "file=@audio.wav"

# Hume AI with specific voice
curl -X POST "/api/audio/process?voice_provider=hume&voice_id=hume_voice_456" -F "file=@audio.wav"
```

## Environment Variables

Create `.env` in project root:
```
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
HUME_API_KEY=your_hume_api_key_here
```

## Code Style Guidelines

### Backend (Python)
- Follow backend/.cursorrules for FastAPI best practices
- Use functional programming over classes where possible
- Use type hints for all function signatures
- Use Pydantic models for input validation
- Follow PEP 8 style guidelines
- Use ruff for linting and formatting

### Mobile (TypeScript/React Native)
- Follow mobile/.cursorrules for React Native/Expo best practices
- Use TypeScript for all code; prefer interfaces over types
- Use functional components with hooks
- Use expo-router for navigation
- Follow Expo's official documentation patterns

## Key Dependencies

### Backend
- FastAPI, uvicorn
- OpenAI API, ElevenLabs, Hume AI
- pydub for audio processing
- pytest for testing

### Mobile
- Expo SDK 54
- expo-av for audio recording/playback
- axios for HTTP requests
- expo-router for navigation

## Troubleshooting

### Backend Issues
- Ensure Python 3.12+ (audioop is built-in)
- Startup scripts automatically kill existing processes on port conflicts

### Mobile Issues
- Use `npx expo start --clear` to clear Metro cache
- Ensure backend is running and ngrok URL is accessible