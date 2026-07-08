# serve-etm.ps1 - Supervisor for the ETM + Copilot server.
#
# Keeps `node server.js` alive: restarts it whenever it exits, with a
# crash-loop backoff so a hard-failing build can't hot-spin the CPU.
# Launched at logon (hidden) by the "ETM Server" scheduled task; see
# etm-service.ps1 (install/uninstall/status/restart/logs).
#
# Free, no admin, no external dependencies. NOTE: this runs in the user's
# session, so it keeps the server up while Cole is logged in and restarts it
# on crash, but it does NOT run before login. For true before-login service
# behavior, upgrade to NSSM (one download + one elevated command) later.

$ErrorActionPreference = 'Continue'

$AppDir = 'C:\Users\Cole\Dropbox\Website\projects\eisenhower-task-manager\eisenhower-task-manager-v3\eisenhower-app'
$Node   = 'C:\Program Files\nodejs\node.exe'
$LogDir = Join-Path $AppDir 'logs'
$SupLog = Join-Path $LogDir 'supervisor.log'
$OutLog = Join-Path $LogDir 'server.out.log'
$ErrLog = Join-Path $LogDir 'server.err.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($m) {
  $line = '{0}  {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m
  Add-Content -Path $SupLog -Value $line -Encoding utf8
}

# Single-instance guard (cross-session). CIM sees processes in every session,
# so this holds whether the other supervisor was launched by the scheduled
# task or by hand. A dead supervisor leaves no process, so there's no stale
# lock to clear.
$others = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -like '*serve-etm.ps1*' -and $_.ProcessId -ne $PID }
if ($others) {
  Log "Another supervisor already running (PID $($others.ProcessId -join ',')); exiting."
  exit
}

Log '=== supervisor started ==='

# Clean handoff: stop any pre-existing manually-started server.js so the new
# child owns port 3001.
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*server.js*' } |
  ForEach-Object {
    Log "Stopping pre-existing node PID $($_.ProcessId)"
    try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {}
  }

$restarts = 0
$windowStart = Get-Date

while ($true) {
  Log 'Starting server.js'
  $proc = Start-Process -FilePath $Node -ArgumentList 'server.js' -WorkingDirectory $AppDir `
            -NoNewWindow -PassThru -RedirectStandardOutput $OutLog -RedirectStandardError $ErrLog
  Wait-Process -Id $proc.Id -ErrorAction SilentlyContinue
  Log "server.js exited (pid $($proc.Id))"

  # Crash-loop backoff: more than 5 restarts within 60s -> pause 30s.
  if (((Get-Date) - $windowStart).TotalSeconds -lt 60) {
    $restarts++
  } else {
    $restarts = 0
    $windowStart = Get-Date
  }

  if ($restarts -ge 5) {
    Log 'Crash-looping (>=5 restarts in 60s) -> backing off 30s'
    Start-Sleep -Seconds 30
    $restarts = 0
    $windowStart = Get-Date
  } else {
    Start-Sleep -Seconds 2
  }
}
