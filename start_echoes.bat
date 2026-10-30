@echo off
echo ============================================================
echo   ECHOES - MEMORIES NEVER DIE (Hacktoberfest 2026)
echo   Local AI-Powered Memory Preservation Platform
echo ============================================================
echo.

echo [1/3] Checking Python backend dependencies...
cd backend
python -c "import flask, flask_cors, whisper, jwt" >nul 2>&1
if errorlevel 1 (
    echo Installing backend dependencies...
    pip install -r requirements.txt
)

echo [2/3] Starting Flask Backend on http://127.0.0.1:5000 ...
start "Echoes Backend Server" cmd /k "python app.py"

cd ..\frontend

echo [3/3] Starting Vite Frontend on http://localhost:5173 ...
call npm run dev

pause
