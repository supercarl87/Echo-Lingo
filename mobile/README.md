# EchoLingo Mobile App

Real-time voice translation mobile application built with React Native and Expo.

## Overview

The EchoLingo mobile app provides a seamless interface for real-time voice translation. Users can record speech in one language and receive translated audio in another language, powered by the EchoLingo backend services.

## Prerequisites

- Node.js 18+ and npm/pnpm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android emulator
- EchoLingo backend running (see backend README)

## Installation

```bash
# Install dependencies
npm install

# Or using pnpm
pnpm install
```

## Getting Started

### Quick Start

```bash
# Start the Expo development server
npm start

# Or with cache clearing (recommended for troubleshooting)
npx expo start --clear
```

### Platform-Specific Commands

```bash
# iOS
npm run ios

# Android
npm run android

# Web (experimental)
npm run web
```

### Using the Start Script

For convenience, use the provided start script:

```bash
./start.sh
```

This script automatically handles port conflicts and starts the Expo server.

## Project Structure

```
mobile/
├── app/                    # Main application code (Expo Router)
│   ├── (tabs)/            # Tab-based navigation screens
│   │   ├── index.tsx      # Home/recording screen
│   │   ├── history.tsx    # Translation history
│   │   └── _layout.tsx    # Tab layout configuration
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 screen
├── assets/                # Images, fonts, and other static assets
├── components/            # Reusable React components
├── constants/             # App constants and configuration
├── hooks/                 # Custom React hooks
├── scripts/               # Build and utility scripts
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── start.sh              # Development start script
```

## Key Features

- **Voice Recording**: Record audio using device microphone
- **Real-time Translation**: Send audio to backend for translation
- **Audio Playback**: Play translated speech
- **Translation History**: View past translations
- **Tab Navigation**: Intuitive tab-based UI

## Configuration

### Backend Connection

The app connects to the backend via ngrok URL. Default configuration:

```typescript
// Default backend URL (configured in app)
const API_URL = 'https://fond-workable-firefly.ngrok-free.app';
```

To use a different backend URL, update the API endpoint in the relevant service files.

### Environment Variables

Create a `.env` file in the mobile directory if needed:

```bash
# Example (if using environment-specific configs)
API_URL=https://your-backend-url.com
```

## Development

### Code Style

- TypeScript for all code
- Functional components with React hooks
- Expo Router for navigation
- Follow React Native best practices

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Type Checking

```bash
# Run TypeScript compiler
npx tsc --noEmit
```

## Dependencies

### Core Dependencies

- **expo**: ~54.0.0 - Expo SDK
- **expo-router**: Navigation framework
- **react**: 18.3.1
- **react-native**: 0.76.5

### Audio & Media

- **expo-av**: Audio recording and playback
- **expo-file-system**: File system operations

### UI Components

- **@expo/vector-icons**: Icon library
- **react-native-safe-area-context**: Safe area handling
- **react-native-screens**: Native navigation primitives

### HTTP & Networking

- **axios**: HTTP client for API requests

## API Integration

The app communicates with the backend API for translation services:

### Main Endpoints

- `POST /api/audio/process`: Submit audio for translation
  - Accepts: Audio file (WAV format)
  - Returns: Translated audio and text

### Audio Recording Settings

```typescript
{
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
}
```

## Troubleshooting

### Common Issues

1. **Metro bundler cache issues**
   ```bash
   npx expo start --clear
   ```

2. **Port 8081 already in use**
   ```bash
   # The start.sh script handles this automatically
   ./start.sh
   ```

3. **Backend connection failed**
   - Ensure backend is running: `cd ../backend && ./start.sh`
   - Check ngrok URL is accessible
   - Verify network connectivity

4. **iOS Simulator issues**
   ```bash
   # Reset simulator
   xcrun simctl shutdown all
   xcrun simctl erase all
   ```

5. **Android emulator issues**
   ```bash
   # Cold boot Android emulator
   emulator -avd <AVD_NAME> -no-snapshot-load
   ```

### Debug Mode

Enable debug logs in Expo:

```bash
# Set debug environment
export DEBUG=expo:*
npm start
```

## Building for Production

### iOS

```bash
# Build for iOS
eas build --platform ios

# Build locally
eas build --platform ios --local
```

### Android

```bash
# Build for Android
eas build --platform android

# Build APK
eas build --platform android --local
```

### Configuration

Ensure `eas.json` is properly configured for your build profiles.

## Testing

### Running Tests

```bash
# Run tests (if configured)
npm test

# Run tests with coverage
npm run test:coverage
```

### Manual Testing Checklist

- [ ] Audio recording works
- [ ] Audio playback functions correctly
- [ ] Translation request succeeds
- [ ] Error handling displays appropriate messages
- [ ] Navigation between tabs works smoothly
- [ ] App works on both iOS and Android

## Performance

### Optimization Tips

1. Use React.memo for expensive components
2. Implement proper list virtualization for history
3. Optimize audio file sizes before upload
4. Cache translation results locally
5. Use lazy loading for screens

## Contributing

1. Follow the existing code structure
2. Write TypeScript with proper types
3. Test on both iOS and Android
4. Update documentation as needed

## License

See the main project LICENSE file.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs for API issues
3. Check Expo documentation
4. Open an issue in the project repository



