# Background Jobs — Spec

Status: **Phases 1 + 2 SHIPPED (2026-06-20).**
- Phase 1 — JobManager + routes + MCP tools (run_job/get_job/list_jobs/stop_job) + Jobs panel (live output, badge, completion toast).
- Phase 2 — **Web push** (`services/pushService.js`, VAPID via `web-push`, `/api/push/*` routes, `chat/sw.js` push+notificationclick handlers, "🔔 Alerts" opt-in in the Jobs panel). Job completion notifies the phone even when the Copilot is closed; the SW suppresses the OS notification when a Copilot window is focused (the in-app toast covers it). **Requires a secure context** (localhost or HTTPS, e.g. Tailscale Serve) — degrades to in-app toasts where push is unsupported. Short successful jobs (<8s) don't buzz; failures always do.

Phase 3 (detach/re-adopt across server restart, approval gating) remains. Owner: Engineer hat.

## 1. Goal & motivation

Turn the Copilot from "a chat that can poke my PC" into a **remote control for long-running agent work**. The hard blocker today: the MCP `shell_command` tool caps at **60 seconds**, so the agent can run snippets but not the things you actually want to start from your phone and walk away from — builds, pipelines, `git` ops, installs, long scripts, multi-minute agent tasks, renders.

Background jobs let the agent (or Cole directly) **kick off work that outlives a chat turn**, stream its output to the phone/tablet, and get **notified on completion** — the same control you'd have at the terminal.

## 2. The architectural crux (why this isn't just "raise the timeout")

`claude -p` is spawned fresh **per chat turn** and dies when the turn ends. Anything spawned *inside* that process (today's `shell_command`) dies with it. So a long job must be owned by the **long-lived server** (`server.js`, which now runs under the auto-restart Scheduled Task), not by `claude -p`.

**Flow:** the agent calls an MCP tool `run_job` → the tool does `POST /api/jobs` (returns in <1s) → the **server** spawns and owns the child process → the agent's turn completes normally and `claude -p` exits, **but the job keeps running** in the server. The phone attaches to the job's output stream on demand.

```
phone  ──chat──▶  claude -p (per turn)  ──MCP run_job──▶  POST /api/jobs
                                                              │
                                              server.js (long-lived) spawns child ──▶ logfile
phone  ──GET /api/jobs/:id/stream (SSE)──▶  server tails logfile  ◀── child writes output
phone  ◀── push: "Job done" ──  server (on child exit)
```

## 3. Design principles

- **Server owns the process**, not `claude -p`.
- **File-backed output** (not just in-memory pipes) → survives page reloads, device switches, and (with detach) server restarts; lets any device attach and get backlog + live tail.
- **Reuse existing plumbing:** SSE (from the chat stream), `taskkill /T /F` tree-kill (from the chat Stop button), `bearerAuth` same-origin bypass, atomic-write-with-retry (`renameWithRetry`).
- **Keep job output OFF the Dropbox tree** (high-churn appends would thrash Dropbox sync). Output → `%LOCALAPPDATA%\peirastes-etm\jobs\`. Low-churn **metadata** (`jobs.json`) stays in `data/` (recoverable, atomic).

## 4. Data model

`data/jobs.json` — array of job records:

```jsonc
{
  "id": "job_1782000000000_a1b2",
  "command": "npm run build",
  "cwd": "C:\\...\\eisenhower-app",
  "label": "Build ETM",                  // agent-supplied or derived from command
  "source": "agent" | "ui" | "api",
  "status": "queued" | "running" | "completed" | "failed" | "stopped" | "interrupted" | "timed-out",
  "pid": 12345,
  "exitCode": 0,
  "startedAt": "2026-06-20T21:00:00.000Z",
  "endedAt":   "2026-06-20T21:03:12.000Z",
  "logFile": "C:\\Users\\Cole\\AppData\\Local\\peirastes-etm\\jobs\\job_..._a1b2.log",
  "bytesOut": 10234                       // progress hint for the UI
}
```

Output text → `logFile` (outside Dropbox).

## 5. Server: `services/jobService.js` (JobManager)

A singleton `EventEmitter`. Responsibilities:

- `launch({command, cwd, label, source})` → create record (status `running`), `spawn(command, { shell: true, cwd, windowsHide: true, detached: <phase3> })`, pipe stdout+stderr → append `WriteStream` to `logFile`, persist record (atomic write w/ retry). Return record. **Returns immediately** — never awaits the process.
- Caps: `MAX_CONCURRENT` (default 5) → beyond ⇒ status `queued`, FIFO drained on completion; `MAX_RUNTIME` (default 6h) → auto-kill ⇒ `timed-out`; per-job log cap (truncate middle past ~5 MB).
- On child `exit`: set `status` (`completed` if code 0 else `failed`), `endedAt`, `exitCode`; persist; emit `job:done`; fire notification; drain the queue.
- `stop(id)` → `taskkill /pid <pid> /T /F` (Windows tree-kill) ⇒ `stopped`.
- `tail(id)` → backlog (read existing `logFile`) + live appends (`fs.watch` or 500 ms size-poll). Backs the SSE route.
- `list({status})`, `get(id)`, `remove(id)` (finished only — deletes record + logfile).
- `reconcile()` on server start: for each record still `running`, check PID liveness (`process.kill(pid, 0)`); alive ⇒ keep `running` (re-tailable from logfile); dead ⇒ `interrupted`.
- Auto-prune finished jobs + logs older than N days (default 7).

## 6. API routes (`server.js`) — all behind `bearerAuth` (same-origin OK)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/jobs` | `{command, cwd?, label?}` → `202 {id,...}` |
| `GET`  | `/api/jobs?status=` | list job records |
| `GET`  | `/api/jobs/:id` | one record + last N KB of output |
| `GET`  | `/api/jobs/:id/stream` | **SSE**: `backlog` (chunked existing output) → `output` (live) → `done {exitCode,status}` |
| `POST` | `/api/jobs/:id/stop` | tree-kill |
| `DELETE` | `/api/jobs/:id` | remove finished job + log |
| `GET`  | `/api/jobs/events` | **SSE**: global lifecycle (`started`/`done`) → drives toasts + badge |

SSE specifics (reuse chat pattern): `res.flushHeaders()`, no compression middleware, abort on `res.on('close')`.

Push (Phase 2): `GET /api/push/vapid` (public key), `POST /api/push/subscribe {subscription}` (store `data/push-subs.json`).

## 7. MCP tools (`peirastes-mcp-server/index.js`) — the agent side

- **`run_job(command, cwd?, label?)`** → `POST /api/jobs` → `{id, label, status}`. Description steers the agent: *"Use for anything that may exceed ~30s — builds, installs, pipelines, long scripts, multi-step work. Returns immediately with a job id; the job runs in the background and Cole is notified on completion. Poll with get_job; don't use shell_command for long work (it times out at 60s)."*
- **`get_job(id)`** → status + recent output (so the agent can check and report progress mid-conversation).
- **`list_jobs(status?)`**.
- **`stop_job(id)`**.
- Keep `shell_command` for quick (<30s) synchronous commands; update its description to redirect long work to `run_job`.

## 8. UI (`chat/index.html`) — Jobs panel

- A **Jobs** entry in the tools tray (and/or a top-bar icon) with a **running-count badge**.
- Panel: list of jobs — status-dot color by state, label, live elapsed timer, source chip (ui/agent). Tap a job → expand **live output** (attaches to `/api/jobs/:id/stream`, shows backlog + live, autoscroll), with a **Stop** button; a "clear finished" action.
- Global: subscribe to `/api/jobs/events` → **toast on completion** + badge update (while the PWA is open).
- When the agent launches a job, drop an inline chat card: **"▶ Started: <label> (#id) — tap to watch."**
- Reuse the cinematic styling + the existing SSE client code from the chat. Surfaces in ETM too (Copilot is already an ETM tab).

## 9. Notifications

- **Phase 1 (in-app):** `/api/jobs/events` SSE → toast + badge. Works when the PWA is open/foregrounded.
- **Phase 2 (web push):** the real "kick it off and walk away" payoff — a notification even when the app is closed/backgrounded. Needs: VAPID keypair (`web-push` lib), service-worker `push` + `notificationclick` handlers (the SW already exists at `/etm/sw.js` and `chat` is static — add a push handler), subscription stored server-side, send on `job:done`. Tap → opens the job in the Copilot.

## 10. Security & guardrails

- Same exposure class as the existing `shell_command` (arbitrary shell, already shipped), gated by `bearerAuth` + Tailscale. The new surface is *duration* + *agent-initiated*, not *capability*.
- Caps: `MAX_CONCURRENT`, `MAX_RUNTIME` auto-kill, per-job log size cap.
- **Approval hook (for the future CONTROL feature):** a stub before `launch()` that can flag a job (esp. `source: 'agent'`) for approve/deny on the phone. MVP can auto-approve (matches today's bypass posture); the hook is where the approval surface plugs in later.

## 11. Restart survival

- Output is file-backed → always readable after a restart.
- **Phase 1:** jobs are children of `server.js`; a server restart kills them → marked `interrupted` by `reconcile()`. Acceptable because the auto-restart service makes crashes rare.
- **Phase 3:** spawn `detached: true` + `unref()` so jobs survive a server restart; `reconcile()` re-adopts by PID liveness. Tradeoff: a truly detached job is orphaned if PID/log tracking is lost — needs careful bookkeeping.

## 12. Phasing

- **Phase 1 (MVP):** JobManager (in-process children, file-backed output), `POST`/`GET`/`stream`/`stop` routes, `run_job`/`get_job`/`list_jobs` MCP tools, Jobs panel with live output + Stop, in-app completion toast. No push; server restart ⇒ `interrupted`; auto-approve.
- **Phase 2:** Web push (walk-away notifications).
- **Phase 3:** detach + restart re-adoption; queueing UI; approval-gating wired to the CONTROL feature.

## 13. Relationship to existing pieces

- **Pipelines** (`/api/pipeline/*`) keep their own engine; background jobs are the general-purpose shell-level primitive. A pipeline *could* later be launched as a job, but they stay separate for now.
- **Auto-restart service** (`etm-service.ps1`) is a prerequisite — it's why the server is a reliable job host. ✅ already in place.
- **Audit log** — job launches/stops can also be recorded (source attribution already solved via `X-ETM-Source`).

## 14. Open decisions (need Cole)

1. **Push in MVP or Phase 2?** (Recommend Phase 2 — prove the in-app loop first.)
2. **Caps:** `MAX_CONCURRENT` and `MAX_RUNTIME` defaults (5 jobs / 6h?).
3. **Approval gating** of agent-launched jobs from day one, or auto-approve like the current shell + hook for later? (Recommend auto-approve MVP — it's Tailscale-gated and you trust the agent.)
4. **Detach-for-restart-survival** now or Phase 3? (Recommend Phase 3 — adds real complexity; auto-restart makes server crashes rare.)
