#!/bin/bash

# Script to start all services for AI Finance Tracker

echo "🚀 Starting AI Finance Tracker Services..."
echo ""

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to check if port is in use
check_port() {
    if lsof -ti:$1 > /dev/null 2>&1; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Start PostgreSQL (if using local)
# echo "Checking PostgreSQL..."
# if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
#     echo "⚠️  PostgreSQL might not be running"
# fi

# Start Backend
echo "📦 Starting Backend (port 5001)..."
if check_port 5001; then
    cd backend
    nohup npm run dev > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend started (PID: $BACKEND_PID)"
    cd ..
else
    echo "   Backend already running"
fi

# Start AI Service
echo "🤖 Starting AI Service (port 8001)..."
if check_port 8001; then
    cd ai-service
    nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 > /tmp/ai-service.log 2>&1 &
    AI_PID=$!
    echo "   AI Service started (PID: $AI_PID)"
    cd ..
else
    echo "   AI Service already running"
fi

# Start Frontend
echo "🎨 Starting Frontend (port 3000)..."
if check_port 3000; then
    cd frontend
    nohup npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "   Frontend started (PID: $FRONTEND_PID)"
    cd ..
else
    echo "   Frontend already running"
fi

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "✅ Services Status:"
echo ""

# Check Backend
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend: http://localhost:5001"
else
    echo "   ❌ Backend: Not responding"
fi

# Check AI Service
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "   ✅ AI Service: http://localhost:8001"
else
    echo "   ❌ AI Service: Not responding"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Frontend: http://localhost:3000"
else
    echo "   ❌ Frontend: Not responding"
fi

echo ""
echo "🌐 Open http://localhost:3000 in your browser"
echo ""
echo "📋 Logs:"
echo "   Backend: tail -f /tmp/backend.log"
echo "   AI Service: tail -f /tmp/ai-service.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 To stop all services: pkill -f 'node.*server.js|uvicorn|vite'"

