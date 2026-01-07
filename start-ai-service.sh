#!/bin/bash

# Script to start the AI service

cd "$(dirname "$0")/ai-service"

echo "Starting AI Finance Tracker AI Service..."
echo "Port: 8001"
echo ""

# Check if port is already in use
if lsof -ti:8001 > /dev/null 2>&1; then
    echo "Port 8001 is already in use. Stopping existing service..."
    pkill -f "uvicorn.*8001"
    sleep 2
fi

# Start the service
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

echo ""
echo "AI Service started!"
echo "Health check: http://localhost:8001/health"

