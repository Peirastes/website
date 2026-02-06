@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM SPECTRUM Market Data Update
REM Fetches real-time stock and crypto data from Yahoo Finance and CoinGecko
REM
REM Can be run manually or scheduled via Windows Task Scheduler.
REM For scheduled runs, use: RUN_MARKET_UPDATE.bat --scheduled
REM ═══════════════════════════════════════════════════════════════════════════

setlocal EnableDelayedExpansion

cd /d "%~dp0"

REM Check if running scheduled (silent mode)
set SCHEDULED=0
if "%1"=="--scheduled" set SCHEDULED=1

if %SCHEDULED%==0 (
    echo.
    echo ╔══════════════════════════════════════════════════════════╗
    echo ║         SPECTRUM Market Data Update                       ║
    echo ╚══════════════════════════════════════════════════════════╝
    echo.
)

REM Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    if %SCHEDULED%==0 pause
    exit /b 1
)

REM Check for required packages (only if not scheduled, to save time)
if %SCHEDULED%==0 (
    echo Checking dependencies...
    pip show yfinance >nul 2>&1 || pip install yfinance
    pip show pandas >nul 2>&1 || pip install pandas
    pip show requests >nul 2>&1 || pip install requests
    echo.
)

REM Run the update script
if %SCHEDULED%==0 (
    echo Running market data generator...
    echo.
)

python scripts\run_market_update.py

set EXITCODE=%ERRORLEVEL%

if %SCHEDULED%==0 (
    echo.
    if %EXITCODE%==0 (
        echo ════════════════════════════════════════════════════════════
        echo Data update complete! Refresh the dashboard to see new data.
        echo ════════════════════════════════════════════════════════════
    ) else (
        echo ERROR: Data update failed! Check logs for details.
    )
    echo.
    pause
)

exit /b %EXITCODE%
