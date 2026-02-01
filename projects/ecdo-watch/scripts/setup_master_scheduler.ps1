# ECDO Watch Master Daily Run - Task Scheduler Setup
# This sets up ONE scheduled task that runs everything

Write-Host "================================" -ForegroundColor Cyan
Write-Host "ECDO Watch Master Scheduler Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$MasterScript = Join-Path $ScriptDir "master_daily_run.py"

# Verify master script exists
if (-not (Test-Path $MasterScript)) {
    Write-Host "ERROR: master_daily_run.py not found" -ForegroundColor Red
    Write-Host "Expected: $MasterScript" -ForegroundColor Red
    exit 1
}

Write-Host "Project Root: $ProjectRoot" -ForegroundColor Green
Write-Host "Master Script: $MasterScript" -ForegroundColor Green
Write-Host ""

# Check if already exists
$TaskName = "ECDO Watch Master Daily Run"
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "Found existing task: $TaskName" -ForegroundColor Yellow
    Write-Host "Updating schedule..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create task
Write-Host "Creating scheduled task..." -ForegroundColor Cyan

$Action = New-ScheduledTaskAction `
    -Execute "python.exe" `
    -Argument $MasterScript `
    -WorkingDirectory $ScriptDir

$Trigger = New-ScheduledTaskTrigger `
    -Daily `
    -At "06:00:00"

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable

$Task = Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "ECDO Watch - Daily data generation, validation check, and status reporting" `
    -Force

Write-Host ""
Write-Host "SUCCESS! Task created." -ForegroundColor Green
Write-Host ""
Write-Host "Task Details:" -ForegroundColor Cyan
Write-Host "  Name: $TaskName"
Write-Host "  Schedule: Daily at 06:00 UTC"
Write-Host "  Command: python.exe $MasterScript"
Write-Host "  Working Dir: $ScriptDir"
Write-Host ""
Write-Host "Test it manually:" -ForegroundColor Cyan
Write-Host "  python $MasterScript"
Write-Host ""
Write-Host "View task status:" -ForegroundColor Cyan
Write-Host "  Get-ScheduledTask -TaskName `'$TaskName`'"
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "  Get-ChildItem -Path $ProjectRoot\logs -Filter master_daily_*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1"
Write-Host ""
