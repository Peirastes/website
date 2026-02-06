@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM SPECTRUM Market Data Update
REM Fetches real-time stock and crypto data from Yahoo Finance and CoinGecko
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║         SPECTRUM Market Data Update                       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check for required packages
echo Checking dependencies...
pip show yfinance >nul 2>&1 || pip install yfinance
pip show pandas >nul 2>&1 || pip install pandas
pip show requests >nul 2>&1 || pip install requests

echo.
echo Running market data generator...
echo.

python scripts\generate_market_data.py

if errorlevel 1 (
    echo.
    echo ERROR: Data generation failed!
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════
echo Data update complete! Refresh the dashboard to see new data.
echo ════════════════════════════════════════════════════════════
echo.

pause
