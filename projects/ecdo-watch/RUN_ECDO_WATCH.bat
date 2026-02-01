@echo off
REM ECDO Watch Master Daily Run
REM Double-click this file to run the automation

setlocal enabledelayedexpansion

REM Get the directory this batch file is in
set SCRIPT_DIR=%~dp0scripts
set MASTER_SCRIPT=%SCRIPT_DIR%\master_daily_run.py

REM Colors and formatting
color 0A
cls

echo.
echo ================================================================================
echo ECDO WATCH MASTER DAILY RUN
echo ================================================================================
echo.
echo Starting automation...
echo Script: %MASTER_SCRIPT%
echo.

REM Run Python script
python "%MASTER_SCRIPT%"

REM Capture exit code
set EXIT_CODE=%ERRORLEVEL%

echo.
echo ================================================================================
if %EXIT_CODE% equ 0 (
    echo SUCCESS - All systems nominal
    color 02
) else (
    echo WARNING - Check logs for details
    color 0E
)
echo ================================================================================
echo.
echo Press any key to close this window...
pause >nul

exit /b %EXIT_CODE%
