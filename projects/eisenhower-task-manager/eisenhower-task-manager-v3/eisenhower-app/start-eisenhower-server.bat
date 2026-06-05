@echo off
:: Eisenhower Task Manager — Server Auto-Start Script
:: Runs the Express API server on port 3001
cd /d "%~dp0"
echo [%date% %time%] Starting Eisenhower Task Manager server... >> data\server.log
node server.js >> data\server.log 2>&1

:: ============================================================
:: To register with Windows Task Scheduler, run in Admin prompt:
::
::   schtasks /create /tn "Eisenhower Task Manager" /tr "\"%~f0\"" /sc onlogon /rl highest /f
::
:: To verify:  schtasks /query /tn "Eisenhower Task Manager"
:: To remove:  schtasks /delete /tn "Eisenhower Task Manager" /f
:: ============================================================
