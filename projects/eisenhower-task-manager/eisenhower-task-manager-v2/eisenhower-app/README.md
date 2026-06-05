# Eisenhower Task Manager

A tactical task prioritization instrument built on the Eisenhower Matrix (Urgent/Important framework), styled as an electronic warfare control station with CRT monitor displays.

## Architecture

ETM runs as a single Express server on port 3001, serving both the React frontend and REST API. The server is the **single source of truth** for all task data — there is no localStorage fallback.

**Access points:**
- **Direct:** `http://localhost:3001` (redirects to `/etm`)
- **Tailscale:** `http://desktop-6ekk03i.tail6fdfc3.ts.net:3001`
- **Website:** `peirastes.com/projects/eisenhower-task-manager.html` (redirects to Tailscale URL)
- **Copilot PWA:** `/chat` on the same server
- **API:** `/api/*` (used by Copilot, MCP server, Pipeline IDE)

**Services on port 3001:**
| Path | What |
|------|------|
| `/etm` | ETM React app (from `dist/`) |
| `/chat` | Copilot PWA |
| `/api/tasks` | Task CRUD |
| `/api/settings` | Category/subcategory config |
| `/api/health` | Health check |

## Mobile Access

1. Ensure Tailscale is connected on your phone
2. Open `http://desktop-6ekk03i.tail6fdfc3.ts.net:3001` in Safari
3. Enter PIN, use the app — all changes save directly to the server
4. **Add to Home Screen** (Safari Share > Add to Home Screen) for a full-screen PWA with the Peirastes icon

Requires the desktop machine to be running. The auto-start task handles boot; sleep/shutdown means offline.

## Features

- **Matrix View** — Four CRT monitors in a 2x2 grid (Do First, Schedule, Delegate, Eliminate). Each monitor has anti-glare hood, metallic bezel with rivets, recessed screen well, phosphor-tinted glass with scanlines and vignette. Tasks are compact single-line items that expand on click to show full details.
- **List View** — Filterable/sortable table inside a single CRT monitor.
- **Gantt Chart** — Timeline visualization with zoom levels (daily to yearly), grouping by quadrant or category.
- **Analytics** — Completion stats, score distributions, duration accuracy, rolling trend lines.
- **Calendar** — Monthly grid with task pills, click-to-add on empty dates.
- **PIN Protection** — CRT terminal boot sequence with vault door animation. Session-based (courtesy, not security; Tailscale is the real gate). PIN value lives in `src/components/PINModal.jsx` (`CORRECT_PIN` constant) — change it there and rebuild.
- **Completion Verification** — LED-style quality/ease ratings on task completion.
- **Planning/Execution Score** — `(Due Date - Completed Date) / (Due Date - Assigned Date)`.
- **Recurrence** — Once, Daily, Weekly, Monthly, Yearly.
- **Export/Import** — JSON backup and restore from the control bar.

## UI Design

**Peirastes Style Guide v2.1 compliance** — Analytical tier with Instrument accents.

- **Typography:** Space Grotesk (body/labels), JetBrains Mono (data/numbers), Courier New (CRT screens only)
- **Layout:** Full-viewport control panel. LED readout strip (top), CRT monitors (middle), chassis control bar (bottom). No page scrolling — content scrolls inside monitor viewports.
- **Components:** LED indicators with glow, metallic pushbuttons, recessed input wells, modal backdrop blur, stamped nameplates, SVG noise textures on bezels
- **Monitor construction** (matched from Cash Bubble benchmark): `hood > bezel [textures, rivets, label plate] > well [inset shadow] > glass [scanlines, vignette, phosphor tint] > content`
- **Quadrant phosphor tints:** Do First = red-black, Schedule = green-black (classic CRT), Delegate = amber-black, Eliminate = neutral dark

## Quick Start

```bash
# Install dependencies
npm install

# Start the server (serves API + frontend on port 3001)
npm run server

# Development mode (Vite dev server + API server)
npm start
```

Access at `http://localhost:3001`.

## Build

```bash
# Production build (outputs to dist/, base path /etm/)
npm run build
```

The Express server serves `dist/` at `/etm`. No separate website build is needed — the GitHub Pages wrapper redirects to the Tailscale URL.

## Data

All data is stored server-side as JSON files:

```
data/
  tasks.json            # All tasks
  settings.json         # Categories & subcategories
  backup-metadata.json  # Export history
```

**No localStorage.** If the server is unreachable, the app shows a "Server Offline" screen with a retry button.

## Task Data Schema

```javascript
{
  id: string,
  task: string,
  category: 'Career' | 'Personal',
  subcategory: string,
  isUrgent: boolean,
  isNecessary: boolean,
  rank: 1 | 2 | 3,
  assignedDate: 'YYYY-MM-DD',
  dueDate: 'YYYY-MM-DD',
  completedDate: null | 'YYYY-MM-DD',
  percentComplete: 0-100,
  isRecurring: boolean,
  recurringPattern: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly',
  notes: string,
  qualityRating: 1-5 | null,
  easeRating: 1-5 | null,
  timeEstimateValue: number | null,
  timeEstimateUnit: 'hours' | 'days'
}
```

## Project Structure

```
eisenhower-app/
  src/
    App.jsx              # Main application (~3200 lines)
    index.css            # Peirastes design tokens + component classes
    components/
      PINModal.jsx       # CRT boot sequence + vault door animation
  chat/                  # Copilot PWA (served at /chat)
  dist/                  # Production build (served at /etm)
  data/                  # Task data (JSON files)
  services/              # Express service modules
    taskService.js       # File-based task persistence
    CopilotHeadless.js   # Claude integration via MCP
    TokenTracker.js      # API budget tracking
  peirastes-mcp-server/  # MCP server for Claude Code integration
  server.js              # Express server (port 3001)
  package.json
  vite.config.mjs        # Vite config (base: /etm/)
  tailwind.config.js
```

## Auto-Start

`setup-scheduled-tasks.bat` (run as admin) registers a Windows logon task that starts the server automatically. The server hosts both ETM (`/etm`) and Copilot (`/chat`).

## Credits

Built with React, Vite, Tailwind CSS, Chart.js, Lucide React, Express. Styled to the Peirastes Application Style Guide v2.1.
