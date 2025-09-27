#!/bin/bash

# Combined Startup Script for EchoLingo
# This script starts both backend and mobile services

echo "🚀 Starting EchoLingo Services..."
echo "=================================="
echo ""

# Get the project root directory
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"
MOBILE_DIR="$PROJECT_ROOT/mobile"

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check required dependencies
echo "🔍 Checking dependencies..."

if ! command_exists uv; then
    echo "❌ Error: uv is not installed"
    echo "Please install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

if ! command_exists ngrok; then
    echo "❌ Error: ngrok is not installed"
    echo "Please install ngrok: brew install ngrok"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ All dependencies found"
echo ""

# Kill existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:50000 | xargs kill -9 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
pkill -f ngrok 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
echo "✅ Cleanup complete"
echo ""

# Start backend in a new terminal (macOS)
echo "🔧 Starting Backend Service..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$BACKEND_DIR' && ./start.sh\""
else
    # For Linux, try gnome-terminal or xterm
    if command_exists gnome-terminal; then
        gnome-terminal -- bash -c "cd '$BACKEND_DIR' && ./start.sh; exec bash"
    elif command_exists xterm; then
        xterm -e "cd '$BACKEND_DIR' && ./start.sh" &
    else
        echo "⚠️  Starting backend in background (no terminal available)"
        cd "$BACKEND_DIR" && ./start.sh &
    fi
fi

# Wait for backend to initialize
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start mobile in a new terminal
echo "📱 Starting Mobile App..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$MOBILE_DIR' && ./start.sh\""
else
    # For Linux, try gnome-terminal or xterm
    if command_exists gnome-terminal; then
        gnome-terminal -- bash -c "cd '$MOBILE_DIR' && ./start.sh; exec bash"
    elif command_exists xterm; then
        xterm -e "cd '$MOBILE_DIR' && ./start.sh" &
    else
        echo "⚠️  Starting mobile in background (no terminal available)"
        cd "$MOBILE_DIR" && ./start.sh &
    fi
fi

echo ""
echo "=================================="
echo "✅ EchoLingo services starting!"
echo ""
echo "🔧 Backend API: https://fond-workable-firefly.ngrok-free.app"
echo "📱 Mobile App: Check the Expo terminal for QR code"
echo ""
echo "📝 Logs are displayed in separate terminal windows"
echo "🛑 Close the terminal windows to stop the services"
echo "=================================="