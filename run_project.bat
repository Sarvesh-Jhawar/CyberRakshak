@echo off
setlocal

echo ===================================================
echo   🛡️ CyberRakshak: Automated Project Launcher 🛡️
echo ===================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python from https://www.python.org/
    pause
    exit /b
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo [1/3] Installing Backend & ML Dependencies...
:: Using --quiet to keep the screen clean for the user
pip install -r Backend/requirements.txt --quiet
pip install -r models/requirements.txt --quiet

echo.
echo [2/3] Installing Frontend Dependencies (this might take a minute)...
cd Frontend
call npm install --silent
cd ..

echo.
echo [3/3] Launching Servers...
echo.

:: Launch ML API on Port 8001
echo Launching ML Model API on http://127.0.0.1:8001...
start "CyberRakshak ML API" cmd /k "cd models && python -m uvicorn api.main:app --host 127.0.0.1 --port 8001"

:: Give ML API a head start
timeout /t 5 /nobreak >nul

:: Launch Main Backend on Port 8000
echo Launching Main Backend on http://127.0.0.1:8000...
start "CyberRakshak Backend" cmd /k "cd Backend && python run.py"

:: Launch Frontend
echo Launching Frontend on http://localhost:3000...
start "CyberRakshak Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo ===================================================
echo   ✅ ALL SYSTEMS INITIALIZED
echo ===================================================
echo.
echo 🤖 ML API:    http://127.0.0.1:8001/docs
echo 🔌 Backend:   http://127.0.0.1:8000/docs
echo 🌐 Frontend:  http://localhost:3000
echo.
echo Note: Keep these three terminal windows open to keep the app running.
echo ===================================================
pause
