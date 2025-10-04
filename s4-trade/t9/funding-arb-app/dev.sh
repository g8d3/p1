#!/bin/bash

# Start backend in background
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend in background
cd frontend && npm run dev &
FRONTEND_PID=$!

# Function to kill both processes on script exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "Both services started. Press Ctrl+C to stop."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:5000"

# Wait for background processes
wait