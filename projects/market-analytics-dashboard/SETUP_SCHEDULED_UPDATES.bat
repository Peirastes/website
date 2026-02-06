@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM SPECTRUM Market Analytics - Task Scheduler Setup
REM Creates scheduled tasks for automatic market data updates
REM
REM Schedule:
REM   - Market hours: Every 15 minutes from 9:30 AM to 4:30 PM ET (weekdays)
REM   - After hours: Once at 6:00 PM ET for closing prices
REM   - Weekend: Once on Saturday morning for weekly summary
REM
REM Run this script as Administrator to set up scheduled updates.
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║    SPECTRUM Scheduled Updates Setup                       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Check for admin rights
net session >nul 2>&1
if errorlevel 1 (
    echo ERROR: This script requires Administrator privileges.
    echo Please right-click and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

set SCRIPT_DIR=%~dp0
set BATCH_FILE=%SCRIPT_DIR%RUN_MARKET_UPDATE.bat

echo Script location: %BATCH_FILE%
echo.

REM Delete existing tasks if they exist
echo Removing any existing SPECTRUM tasks...
schtasks /delete /tn "SPECTRUM_Market_Update_Hourly" /f >nul 2>&1
schtasks /delete /tn "SPECTRUM_Market_Update_Close" /f >nul 2>&1

echo.
echo Creating scheduled tasks...
echo.

REM Task 1: Hourly updates during extended market hours (6 AM - 8 PM local time)
REM Runs every hour on weekdays
echo [1/2] Creating hourly market update task (weekdays 6AM-8PM)...
schtasks /create /tn "SPECTRUM_Market_Update_Hourly" ^
    /tr "\"%BATCH_FILE%\" --scheduled" ^
    /sc hourly ^
    /mo 1 ^
    /st 06:00 ^
    /et 20:00 ^
    /d MON,TUE,WED,THU,FRI ^
    /f

if errorlevel 1 (
    echo    [FAILED] Could not create hourly task
) else (
    echo    [OK] Hourly task created
)

REM Task 2: End of day update at 6 PM for final closing prices
echo [2/2] Creating end-of-day task (weekdays 6PM)...
schtasks /create /tn "SPECTRUM_Market_Update_Close" ^
    /tr "\"%BATCH_FILE%\" --scheduled" ^
    /sc weekly ^
    /d MON,TUE,WED,THU,FRI ^
    /st 18:00 ^
    /f

if errorlevel 1 (
    echo    [FAILED] Could not create end-of-day task
) else (
    echo    [OK] End-of-day task created
)

echo.
echo ════════════════════════════════════════════════════════════
echo Setup complete!
echo.
echo Scheduled tasks created:
echo   - SPECTRUM_Market_Update_Hourly: Every hour 6AM-8PM weekdays
echo   - SPECTRUM_Market_Update_Close:  6PM weekdays for closing data
echo.
echo To verify: Open Task Scheduler and look for "SPECTRUM_" tasks
echo To remove: Run this script again or delete tasks manually
echo ════════════════════════════════════════════════════════════
echo.
pause
