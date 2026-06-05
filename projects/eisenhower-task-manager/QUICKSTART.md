# Quick Start

## Prerequisites
- Node.js 16+ ([nodejs.org](https://nodejs.org/))

## Setup

```bash
cd eisenhower-task-manager-v2/eisenhower-app

# Install dependencies
npm install

# Start the server
npm run server
```

The server starts on port 3001. Access the app at `http://localhost:3001`.

## Auto-Start on Boot

Run `setup-scheduled-tasks.bat` as administrator to register a Windows logon task that starts the server automatically.

Once running, the app is accessible from any device on your Tailscale network at:
```
http://desktop-6ekk03i.tail6fdfc3.ts.net:3001
```

## Data

All tasks are stored server-side in `eisenhower-app/data/tasks.json`. No browser storage is used. If the server is offline, the app displays a "Server Offline" screen with a retry button.

To back up: use the Export button in the app's control bar, or copy the `data/` folder.

## Development

```bash
# Dev server (Vite HMR + API proxy)
npm start

# Production build
npm run build
```

## PIN

The PIN value is the `CORRECT_PIN` constant in `src/components/PINModal.jsx` (v2) or `src/components/BootOverlay.jsx` (v3). Change it and rebuild.
