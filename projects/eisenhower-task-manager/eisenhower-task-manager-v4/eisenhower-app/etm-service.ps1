# etm-service.ps1 - Manage the "ETM Server" auto-restart scheduled task.
#
#   powershell -ExecutionPolicy Bypass -File etm-service.ps1 install     # register + start now
#   powershell -ExecutionPolicy Bypass -File etm-service.ps1 status      # task + server health
#   powershell -ExecutionPolicy Bypass -File etm-service.ps1 restart     # bounce the server
#   powershell -ExecutionPolicy Bypass -File etm-service.ps1 logs        # tail supervisor/server logs
#   powershell -ExecutionPolicy Bypass -File etm-service.ps1 uninstall   # stop + remove
#
# No admin required: the task runs as the current user, at logon, in the
# user's session (LogonType Interactive, RunLevel Limited).

param(
  [ValidateSet('install','uninstall','status','restart','logs','start','stop')]
  [string]$Action = 'status'
)

$TaskName = 'ETM Server'
$AppDir   = 'C:\Users\Cole\Dropbox\Website\projects\eisenhower-task-manager\eisenhower-task-manager-v3\eisenhower-app'
$Sup      = Join-Path $AppDir 'serve-etm.ps1'
$LogDir   = Join-Path $AppDir 'logs'

function Stop-ServerNode {
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like '*server.js*' } |
    ForEach-Object {
      try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop; Write-Host "  killed node PID $($_.ProcessId)" } catch {}
    }
}

function Do-Install {
  $a = New-ScheduledTaskAction -Execute 'powershell.exe' `
        -Argument ('-ExecutionPolicy Bypass -NonInteractive -WindowStyle Hidden -File "{0}"' -f $Sup)
  $t = New-ScheduledTaskTrigger -AtLogOn -User ('{0}\{1}' -f $env:USERDOMAIN, $env:USERNAME)
  $s = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew `
        -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
        -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero)
  $p = New-ScheduledTaskPrincipal -UserId ('{0}\{1}' -f $env:USERDOMAIN, $env:USERNAME) `
        -LogonType Interactive -RunLevel Limited
  Register-ScheduledTask -TaskName $TaskName -Action $a -Trigger $t -Settings $s -Principal $p -Force | Out-Null
  Write-Host "Registered scheduled task '$TaskName' (auto-start at logon, auto-restart on crash)."
  Start-ScheduledTask -TaskName $TaskName
  Write-Host 'Started now.'
}

function Do-Uninstall {
  try { Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue } catch {}
  Stop-ServerNode
  try { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop; Write-Host "Removed task '$TaskName'." }
  catch { Write-Host "Task '$TaskName' not found." }
}

function Do-Status {
  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if ($task) {
    $info = Get-ScheduledTaskInfo -TaskName $TaskName
    Write-Host ("Task '{0}': {1}  (last run {2}, result 0x{3:X})" -f $TaskName, $task.State, $info.LastRunTime, $info.LastTaskResult)
  } else {
    Write-Host "Task '$TaskName': NOT INSTALLED"
  }
  try {
    $h = Invoke-RestMethod 'http://localhost:3001/api/health' -TimeoutSec 3
    Write-Host ("Server: UP  (uptime {0:N0}s)" -f $h.uptime)
  } catch {
    Write-Host 'Server: DOWN (no response on :3001)'
  }
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like '*server.js*' } |
    ForEach-Object { Write-Host "  node server.js PID $($_.ProcessId)" }
}

function Do-Restart {
  try { Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue } catch {}
  Stop-ServerNode
  Start-Sleep -Seconds 1
  Start-ScheduledTask -TaskName $TaskName
  Write-Host 'Restarted.'
}

function Do-Logs {
  foreach ($f in @('supervisor.log','server.err.log','server.out.log')) {
    $path = Join-Path $LogDir $f
    Write-Host ('=== {0} (last 15) ===' -f $f)
    if (Test-Path $path) { Get-Content $path -Tail 15 } else { Write-Host '(none)' }
    Write-Host ''
  }
}

switch ($Action) {
  'install'   { Do-Install }
  'uninstall' { Do-Uninstall }
  'status'    { Do-Status }
  'restart'   { Do-Restart }
  'start'     { Start-ScheduledTask -TaskName $TaskName; Write-Host 'Started.' }
  'stop'      { Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue; Stop-ServerNode; Write-Host 'Stopped.' }
  'logs'      { Do-Logs }
}
