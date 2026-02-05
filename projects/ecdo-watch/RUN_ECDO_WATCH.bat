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
    echo SUCCESS - Data update complete
    color 02

    echo.
    echo Pushing updates to GitHub...
    echo.

    REM Navigate to repository root
    cd /d "%~dp0..\.."

    REM Add ECDO Watch data files
    git add projects/ecdo-watch/assets/*.json
    git add projects/ecdo-watch/assets/cache/*.csv
    git add projects/ecdo-watch/assets/cache/*.txt

    REM Get current date/time for commit message
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set COMMIT_DATE=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%

    REM Commit and push
    git commit -m "ECDO Watch data update: %COMMIT_DATE%"

    if %ERRORLEVEL% equ 0 (
        git push
        if %ERRORLEVEL% equ 0 (
            echo.
            echo GitHub push successful!
        ) else (
            echo.
            echo WARNING - Git push failed. Check network connection.
            set EXIT_CODE=2
        )
    ) else (
        echo.
        echo No changes to commit (data may be unchanged)
    )
) else (
    echo WARNING - Data update failed. Check logs for details.
    color 0E
)
echo ================================================================================
echo.
echo Press any key to close this window...
pause >nul

exit /b %EXIT_CODE%
