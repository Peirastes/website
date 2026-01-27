@echo off
echo ========================================
echo   Eisenhower Task Manager Setup
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ❌ Installation failed!
    echo Please make sure Node.js is installed.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Setup Complete!
echo ========================================
echo.
echo Choose how to run the app:
echo.
echo   [1] Simple mode (localStorage)
echo       Run: npm run dev
echo       Data stored in browser
echo.
echo   [2] File-based mode (recommended)
echo       Run: npm start
echo       Data stored in ./data folder
echo.
echo ========================================
echo.

choice /C 12 /N /M "Select mode (1 or 2): "

if %errorlevel%==1 (
    echo.
    echo Starting in Simple mode...
    echo Opening http://localhost:5173
    timeout /t 2 >nul
    start http://localhost:5173
    npm run dev
) else (
    echo.
    echo Starting in File-based mode...
    echo Opening http://localhost:5173
    timeout /t 2 >nul
    start http://localhost:5173
    npm start
)
