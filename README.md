# EchoLingo

EchoLingo is a real-time voice translation application that allows you to speak in one language and have your speech translated and spoken back in another language.

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- uv (Python package manager)
- ngrok (for tunneling)

### Installation

1. **Install uv (Python package manager):**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

3. **Install dependencies:**
   ```bash
   # Backend dependencies (handled by uv)
   cd backend
   uv sync
   
   # Mobile dependencies
   cd ../mobile
   npm install
   ```

## 🎯 Starting the Application

### Option 1: Start Everything (Recommended)
```bash
./start-all.sh
```
This will open two terminal windows - one for the backend and one for the mobile app.

### Option 2: Start Services Individually

**Backend:**
```bash
cd backend
./start.sh
```
The backend will start on port 50000 with ngrok tunneling to `https://fond-workable-firefly.ngrok-free.app`

**Mobile App:**
```bash
cd mobile
./start.sh
```
The mobile app will start with Expo. Scan the QR code with the Expo Go app on your phone.

## 📁 Project Structure

```
EchoLingo/
├── backend/          # FastAPI backend server
│   ├── src/         # Source code
│   ├── start.sh     # Backend startup script
│   └── pyproject.toml
├── mobile/          # React Native/Expo mobile app
│   ├── app/         # App screens and components
│   ├── start.sh     # Mobile startup script
│   └── package.json
├── frontend/        # Web frontend (if applicable)
└── start-all.sh     # Combined startup script
```

## 🔧 Configuration

### Backend Configuration
- **Port:** 50000 (default)
- **Ngrok Domain:** fond-workable-firefly.ngrok-free.app
- **API Endpoint:** https://fond-workable-firefly.ngrok-free.app/api/audio/process

### Mobile Configuration
- **API URL:** Configured in `mobile/app/(tabs)/index.tsx`
- **Expo Port:** 8081 (default)

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI:** https://fond-workable-firefly.ngrok-free.app/docs
- **ReDoc:** https://fond-workable-firefly.ngrok-free.app/redoc

### Voice Provider Support

The API supports multiple voice providers for text-to-speech generation:

**Supported Providers:**
- **ElevenLabs** (default): High-quality voice synthesis
- **Hume AI**: Emotionally expressive voice synthesis

**API Parameters:**
- `voice_provider`: Specify "elevenlabs" or "hume" (defaults to "elevenlabs")
- `voice_id`: Specify any valid voice ID for the chosen provider (uses provider's default if omitted)

**Example API Calls:**
```bash
# Use default ElevenLabs provider with default voice
curl -X POST "https://fond-workable-firefly.ngrok-free.app/api/audio/process" \
  -F "file=@audio.wav"

# Use ElevenLabs with specific voice ID
curl -X POST "https://fond-workable-firefly.ngrok-free.app/api/audio/process?voice_provider=elevenlabs&voice_id=voice_123" \
  -F "file=@audio.wav"

# Use Hume AI with specific voice ID
curl -X POST "https://fond-workable-firefly.ngrok-free.app/api/audio/process?voice_provider=hume&voice_id=hume_voice_456" \
  -F "file=@audio.wav"
```

## 🛠️ Development

### Backend Development
```bash
cd backend
uv run python run.py --mode dev --no-ngrok  # Run without ngrok
```

### Mobile Development
```bash
cd mobile
npx expo start --clear  # Start with cache cleared
```

## 🐛 Troubleshooting

### Backend Issues
- **audioop error:** Make sure you have Python 3.12+ (audioop is built-in)
- **Port in use:** The startup scripts will automatically kill existing processes

### Mobile Issues
- **InternalBytecode.js error:** Already fixed with a placeholder file
- **API connection failed:** Ensure backend is running and ngrok URL is correct
- **Metro bundler issues:** Run `npx expo start --clear` to clear cache

## 📦 Dependencies

### Backend (Python 3.12+)
- FastAPI
- uvicorn
- OpenAI API
- ElevenLabs
- Hume AI
- pydub

### Mobile (React Native/Expo)
- Expo SDK 54
- React Native
- expo-av (audio recording/playback)
- axios (HTTP client)
- expo-file-system/legacy

## 🔑 Environment Variables

Create a `.env` file in the project root with:
```
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
HUME_API_KEY=your_hume_api_key_here
```

## 📱 Usage

1. Start the application using `./start-all.sh`
2. Open the Expo Go app on your phone
3. Scan the QR code displayed in the terminal
4. Select your target language
5. Press and hold the microphone button to record
6. Release to send for translation
7. The translated audio will play automatically

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

[Your License Here]