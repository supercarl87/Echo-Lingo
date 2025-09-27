#!/bin/bash

# Backend Startup Script for EchoLingo
# This script starts the backend server with uv and ngrok

echo "🚀 Starting EchoLingo Backend..."
echo "================================="

# Set the port
PORT=50000
NGROK_DOMAIN="fond-workable-firefly.ngrok-free.app"

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed"
    echo "Please install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Error: ngrok is not installed"
    echo "Please install ngrok: brew install ngrok"
    exit 1
fi

# Kill any existing processes on the port
echo "🧹 Cleaning up existing processes..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true

# Kill any existing ngrok processes
pkill -f ngrok 2>/dev/null || true

# Start ngrok in the background
echo "🌐 Starting ngrok tunnel..."
ngrok http --url=$NGROK_DOMAIN $PORT > /dev/null 2>&1 &
NGROK_PID=$!
echo "✅ Ngrok started with PID: $NGROK_PID"
echo "📡 Public URL: https://$NGROK_DOMAIN"

# Wait a moment for ngrok to initialize
sleep 2

# Start the backend server with uv
echo "🔧 Starting backend server on port $PORT..."
echo "================================="

# Run the server with uv (without built-in ngrok since we're using standalone ngrok)
uv run python run.py --mode dev --port $PORT --no-ngrok

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $NGROK_PID 2>/dev/null || true
    echo "✅ Backend stopped"
}

# Set up trap to clean up on exit
trap cleanup EXIT INT TERM