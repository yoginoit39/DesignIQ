#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🏛️  Starting DesignIQ — System Design Interview Prep"
echo ""

# Start backend
echo "▶ Starting backend on http://localhost:8004"
(cd "$SCRIPT_DIR/backend" && venv/bin/uvicorn main:app --reload --port 8004) &
BACKEND_PID=$!

# Start frontend
echo "▶ Starting frontend on http://localhost:5176"
(cd "$SCRIPT_DIR/frontend" && VITE_API_URL=http://localhost:8004 npm run dev -- --port 5176) &
FRONTEND_PID=$!

echo ""
echo "✅ Running!"
echo "   Frontend → http://localhost:5176"
echo "   Backend  → http://localhost:8004"
echo ""
echo "Press Ctrl+C to stop both servers"

wait $BACKEND_PID $FRONTEND_PID
