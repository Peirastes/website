@echo off
REM ECDO Watch - Windows Task Scheduler Setup
REM Run this script with Administrator privileges to schedule daily updates
REM Usage: Run as Administrator, or double-click this file

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo  ECDO Watch - Windows Task Scheduler Configuration
echo ============================================================
echo.

REM Get the absolute path to the wrapper script
for %%A in ("%~dp0run_daily_update.py") do set "WRAPPER_PATH=%%~fA"

REM Get Python executable path
for /f "delims=" %%A in ('python -c "import sys; print(sys.executable)"') do set "PYTHON_EXE=%%A"

if not exist "!PYTHON_EXE!" (
    echo ERROR: Python executable not found at: !PYTHON_EXE!
    echo Please ensure Python 3 is installed and in your PATH
    pause
    exit /b 1
)

echo Wrapper Script: !WRAPPER_PATH!
echo Python Executable: !PYTHON_EXE!
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo WARNING: This script should be run as Administrator
    echo Please right-click and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo Creating Windows scheduled task: "ECDO Watch Daily Update"...
echo.

REM Create the scheduled task
REM Runs daily at 06:00 UTC (which is system-dependent; adjust as needed)
REM To convert UTC to your local time, Windows Task Scheduler uses your system timezone

schtasks /create /tn "ECDO Watch Daily Update" /tr "\"!PYTHON_EXE!\" \"!WRAPPER_PATH!\"" /sc daily /st 06:00 /f

if %errorLevel% equ 0 (
    echo.
    echo ============================================================
    echo  ✓ Task created successfully!
    echo ============================================================
    echo.
    echo Task Name:    ECDO Watch Daily Update
    echo Schedule:     Daily at 06:00 (your local system time)
    echo Action:       !PYTHON_EXE! !WRAPPER_PATH!
    echo.
    echo Logs will be saved to:
    echo   !WRAPPER_PATH!\..\..\..\logs\
    echo.
    echo To view/manage the task:
    echo   1. Open Task Scheduler (Win+R, type "taskschd.msc")
    echo   2. Find "ECDO Watch Daily Update" in the task list
    echo   3. Right-click to "Run" manually or "Properties" to edit
    echo.
    echo To adjust the schedule time:
    echo   schtasks /change /tn "ECDO Watch Daily Update" /st 07:30
    echo   (Replace 07:30 with your desired time in HH:MM format)
    echo.
    echo To delete the task:
    echo   schtasks /delete /tn "ECDO Watch Daily Update" /f
    echo.
) else (
    echo.
    echo ============================================================
    echo  ERROR: Failed to create scheduled task
    echo ============================================================
    echo.
    echo This may occur if:
    echo  - Not running as Administrator
    echo  - Task already exists (try deleting it first)
    echo  - Python path contains special characters
    echo.
    pause
    exit /b 1
)

echo Press any key to exit...
pause >nul
exit /b 0
