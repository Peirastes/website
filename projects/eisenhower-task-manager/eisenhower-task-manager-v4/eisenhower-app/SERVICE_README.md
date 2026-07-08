# ETM Server — auto-start / auto-restart

The ETM + Copilot server (`server.js`, port 3001) runs under a tiny supervisor
that **restarts it automatically if it crashes**, started by a Windows
**Scheduled Task** ("ETM Server") that fires **at logon**. No admin, no
external tools, no cost.

## Manage it

Run from this folder (`...\eisenhower-app`):

```powershell
powershell -ExecutionPolicy Bypass -File .\etm-service.ps1 status      # task state + server health + PIDs
powershell -ExecutionPolicy Bypass -File .\etm-service.ps1 restart      # bounce the server (e.g. after a code change)
powershell -ExecutionPolicy Bypass -File .\etm-service.ps1 logs         # tail supervisor + server logs
powershell -ExecutionPolicy Bypass -File .\etm-service.ps1 stop         # stop the server (stays stopped until next logon/start)
powershell -ExecutionPolicy Bypass -File .\etm-service.ps1 start        # start it again
powershell -ExecutionPolicy Bypass -File .\etm-service.ps1 install      # (re)register the task + start now
powershell -ExecutionPolicy Bypass -File .\etm-service.ps1 uninstall    # remove the task + stop the server
```

## Pieces

- `serve-etm.ps1` — the supervisor loop. Restarts `node server.js` whenever it
  exits, with a crash-loop backoff (>5 restarts in 60s → pause 30s). Only one
  supervisor can run at a time (cross-session process guard). On start it takes
  over from any manually-started `server.js`.
- `etm-service.ps1` — installs/manages the "ETM Server" scheduled task.
- `logs/supervisor.log` — durable history of starts / crashes / restarts.
- `logs/server.out.log`, `logs/server.err.log` — the current run's server output
  (overwritten each restart).

## After changing server-side code

`server.js`, anything in `services/`, or the MCP server need a restart to load:

```powershell
powershell -ExecutionPolicy Bypass -File .\etm-service.ps1 restart
```

(The React app in `dist/` and the static `chat/` are served from disk and are
live on browser reload — they don't need a restart, only `npm run build` for the
React side.)

## Limitation + upgrade path

The task runs **in your user session**, so it keeps the server up while you're
logged in and restarts it on crash — but it does **not** run before login. If
you ever want the server up at the login screen / immediately on boot without
logging in, upgrade to a true Windows service with **NSSM** (free download, one
elevated command):

```powershell
# one-time, elevated:
nssm install ETMServer "C:\Program Files\nodejs\node.exe" server.js
nssm set ETMServer AppDirectory "<this folder>"
nssm set ETMServer AppExit Default Restart
nssm start ETMServer
# then: powershell -File .\etm-service.ps1 uninstall   # drop the logon-task version
```
