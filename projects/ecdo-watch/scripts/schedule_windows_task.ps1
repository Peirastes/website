# ECDO Watch - PowerShell Windows Task Scheduler Setup
# Run this script with Administrator privileges to schedule daily updates
# Usage: Right-click PowerShell, "Run as Administrator", then run:
#        Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
#        .\schedule_windows_task.ps1

param(
    [string]$ScheduleTime = "06:00"
)

Write-Host ""
Write-Host "============================================================"
Write-Host "  ECDO Watch - Windows Task Scheduler Configuration"
Write-Host "============================================================"
Write-Host ""

# Get paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WrapperScript = Join-Path $ScriptDir "run_daily_update.py"
$PythonExe = (Get-Command python).Source

Write-Host "Wrapper Script: $WrapperScript"
Write-Host "Python Executable: $PythonExe"
Write-Host "Schedule Time: $ScheduleTime (your local system time)"
Write-Host ""

# Check if running as admin
$CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$Principal = New-Object System.Security.Principal.WindowsPrincipal($CurrentUser)
$IsAdmin = $Principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $IsAdmin) {
    Write-Host "ERROR: This script requires Administrator privileges"
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Verify files exist
if (-not (Test-Path $WrapperScript)) {
    Write-Host "ERROR: Wrapper script not found at: $WrapperScript"
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path $PythonExe)) {
    Write-Host "ERROR: Python executable not found at: $PythonExe"
    Write-Host "Please ensure Python 3 is installed and in your PATH"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Creating Windows scheduled task: 'ECDO Watch Daily Update'..."
Write-Host ""

# Define task action
$Action = New-ScheduledTaskAction -Execute $PythonExe -Argument $WrapperScript

# Define task trigger (daily at specified time)
$Trigger = New-ScheduledTaskTrigger -Daily -At $ScheduleTime

# Define task principal (run with highest privileges)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Define task settings
$Settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable

# Create the task
try {
    Register-ScheduledTask -TaskName "ECDO Watch Daily Update" `
        -Action $Action `
        -Trigger $Trigger `
        -Principal $Principal `
        -Settings $Settings `
        -Force | Out-Null

    Write-Host ""
    Write-Host "============================================================"
    Write-Host "  ✓ Task created successfully!"
    Write-Host "============================================================"
    Write-Host ""
    Write-Host "Task Name:    ECDO Watch Daily Update"
    Write-Host "Schedule:     Daily at $ScheduleTime"
    Write-Host "Action:       $PythonExe $WrapperScript"
    Write-Host "Run As:       SYSTEM (highest privileges)"
    Write-Host ""
    Write-Host "Logs will be saved to:"
    Write-Host "  $(Join-Path $ScriptDir '..\..\logs\')"
    Write-Host ""
    Write-Host "To manage the task:"
    Write-Host "  - Open Task Scheduler: Win+R, type 'taskschd.msc'"
    Write-Host "  - Find 'ECDO Watch Daily Update' in the task library"
    Write-Host "  - Right-click to 'Run', 'Properties', or 'Delete'"
    Write-Host ""
    Write-Host "To run the task manually:"
    Write-Host "  Start-ScheduledTask -TaskName 'ECDO Watch Daily Update'"
    Write-Host ""
    Write-Host "To view task history:"
    Write-Host "  Get-ScheduledTask -TaskName 'ECDO Watch Daily Update' | Get-ScheduledTaskInfo"
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "  ERROR: Failed to create scheduled task"
    Write-Host "============================================================"
    Write-Host ""
    Write-Host "Error: $_"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"
exit 0
