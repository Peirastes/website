# Create a desktop shortcut for ECDO Watch
# This puts a clickable icon on your desktop

$DesktopPath = [Environment]::GetFolderPath("Desktop")
$BatchFile = "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\RUN_ECDO_WATCH.bat"
$ShortcutPath = Join-Path $DesktopPath "ECDO Watch.lnk"

Write-Host "Creating desktop shortcut..." -ForegroundColor Cyan

# Verify batch file exists
if (-not (Test-Path $BatchFile)) {
    Write-Host "ERROR: RUN_ECDO_WATCH.bat not found at $BatchFile" -ForegroundColor Red
    exit 1
}

# Create COM object for shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Configure shortcut
$Shortcut.TargetPath = $BatchFile
$Shortcut.WorkingDirectory = Split-Path $BatchFile
$Shortcut.Description = "ECDO Watch - Daily Geophysics Monitoring"
$Shortcut.WindowStyle = 1  # Normal window

# Save shortcut
$Shortcut.Save()

Write-Host "SUCCESS! Desktop shortcut created:" -ForegroundColor Green
Write-Host "  $ShortcutPath" -ForegroundColor Green
Write-Host ""
Write-Host "You can now:" -ForegroundColor Cyan
Write-Host "  1. Double-click the 'ECDO Watch' shortcut on your desktop to run the automation"
Write-Host "  2. Right-click it and select 'Pin to Taskbar' for quick access"
Write-Host ""
