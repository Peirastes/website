# Copilot / ETM — UI Diagnostics

A shared workspace for debugging mobile (and desktop) appearance of the Copilot and ETM.

## Two sides

```
diagnostics/
├── device/      ← Cole drops REAL screenshots from phone/tablet here
└── generated/   ← Claude's headless captures (via shoot.js) land here
```

## Cole's side — `device/`

Drop screenshots straight from your phone/tablet into **`device/`** (via the Dropbox
mobile app — **star/favorite this folder** in Dropbox for one-tap access so you don't
dig through the path each time).

Most useful filename hint (optional, but helps): `device-orientation-issue.png`
e.g. `iphone15pro-portrait-keyboard.png`, `ipad-landscape-tab.png`.
When you drop one, just tell me what's bugging you + the device + orientation.

**Real-device screenshots are the ground truth** — they're the only way to see things
headless Chromium can't reproduce: safe-area/notch/Dynamic-Island insets, the on-screen
keyboard pushing the composer, standalone-PWA chrome (home-screen launch), and true
Safari font rendering.

## Claude's side — `generated/` + `shoot.js`

`shoot.js` captures the live app at a chosen device viewport for fast iteration between
your real-device checks (server must be running on :3001):

```
node diagnostics/shoot.js [device] [page] [label]
```

- **device**: `iphone-se` · `iphone` · `iphone15pro` · `iphone-max` · `ipad` · `ipad-land` · `desktop`  (default `iphone15pro`)
- **page**: `chat` · `etm`  (default `chat`)
- **label**: optional filename suffix

Examples:
```
node diagnostics/shoot.js iphone15pro chat
node diagnostics/shoot.js ipad-land etm tabview
```

Tell me your actual device model(s) and I'll default to matching viewports.

## Workflow

1. You spot something off → screenshot → `device/` → ping me with the gripe + device/orientation.
2. I match your viewport with `shoot.js`, make the change, and post a `generated/` capture.
3. You confirm on the real device (the final eye on anything device-specific).

> Not web-served (lives outside `/chat` and `/etm`), so screenshots stay private.
> Safe to clear out `generated/` anytime — they're disposable.
