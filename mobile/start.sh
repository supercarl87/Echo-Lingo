#!/bin/bash

# Mobile Startup Script for EchoLingo
# This script starts the Expo development server

echo "📱 Starting EchoLingo Mobile App..."
echo "==================================="

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing Expo processes
echo "🧹 Cleaning up existing Expo processes..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true

# Clear Metro bundler cache
echo "🗑️  Clearing Metro cache..."
npx expo start --clear &

# Wait for the server to start
echo "⏳ Waiting for Expo to start..."
sleep 5

echo "==================================="
echo "✅ Mobile app started successfully!"
echo ""
echo "📱 Scan the QR code with Expo Go app to run on your device"
echo "📱 Press 'i' for iOS simulator"
echo "📱 Press 'a' for Android emulator"
echo "📱 Press 'w' for web browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo "==================================="

# Keep the script running
wait