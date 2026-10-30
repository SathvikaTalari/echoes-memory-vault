#!/usr/bin/env bash
# ============================================================
#   ECHOES - MEMORIES NEVER DIE (Hacktoberfest 2026)
#   Local AI-Powered Memory Preservation Platform
# ============================================================

set -e

echo "[1/3] Checking backend dependencies..."
cd backend
python3 -m pip install -r requirements.txt

echo "[2/3] Launching Flask Backend on http://127.0.0.1:5000 in background..."
python3 app.py &
BACKEND_PID=$!

echo "[3/3] Starting Vite Frontend on http://localhost:5173..."
cd ../frontend
npm install
npm run dev

# Trap exit to kill backend on CTRL+C
trap "kill $BACKEND_PID" EXIT
