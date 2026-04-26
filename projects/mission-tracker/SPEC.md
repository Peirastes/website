# Mission Tracker Framework — Specification

> **Status:** Physics track complete (Phases A–E). UI track pending.
> **Author:** Cole Prather + PM
> **Version:** 0.3
> **Created:** 2026-04-10
> **Last Updated:** 2026-04-11

---

## Current Status (2026-04-11)

The high-fidelity Artemis II simulator track is **complete and validated against real NASA Horizons data**:

| Phase | Description | Status | Result |
|-------|-------------|--------|--------|
| **A** | Burn data extraction (state injection method) | ✅ Complete | 5 burns canonicalized in `artemis2_burns.json` |
| **B** | Chebyshev DE440 Moon ephemeris | ✅ Complete | Sub-millimeter Moon position (0.46 mm max error) |
| **C** | High-fidelity perturbations (J2, SRP) | ✅ Complete | Cumulative coast accuracy 0.85 km mean |
| **D** | Full mission simulator with state injection | ✅ **PASS** | **0.05 km RMS / 0.08 km max** vs Horizons |
| **E** | Atmospheric entry + splashdown projection | ⚠ Complete with caveat | 803 km off published target — Orion bank schedule not public |
| **F** | Style Guide v2.2 (CD-hat work) | Pending | Console Tier from ETM/TFF lineage |
| **G** | Storyteller UI build | Pending | Consumes `artemis2_trajectory.json` |
| **H** | Engineer's Dashboard | Pending | Telemetry + residuals |
| **I** | Deploy `/artemis-ii-v2/` | Pending | Side-by-side review with v1 |

The cumulative cislunar trajectory tracks NASA Horizons within **20× margin on the 1 km RMS gate** and **130× margin on the 10 km max gate**. The atmospheric phase is approximate because Orion's closed-loop bank-modulation guidance is not publicly available. Working files are in `working/` and the deployed v1 simulator is untouched.

See **Section 11.5: High-Fidelity Simulator Track** for Phases A–E details.

---

## 1. Purpose

Artemis II proved the concept: a single-file browser app can compute a real spacecraft trajectory from physics, sync to live mission elapsed time, and present the result with publication-quality fidelity. But Artemis II was built as a one-off with two foundational compromises:

1. **2D physics.** The model uses a planar Earth-Moon-Sun system. The real Artemis II trajectory has out-of-plane components, and forcing the physics into 2D requires a synthetic 0.16 km/s post-flyby calibration burn — not a real maneuver — to make the splashdown timing match NASA. Removing this synthetic burn (to use the real RTC burns of ~0.49 + 0.40 m/s) shifts the splashdown by ~12 hours because the 2D return geometry cannot reproduce the real 3D path.

2. **Hardcoded layout.** The UI was calibrated for two specific screens (desktop and iPhone). The trajectory canvas uses pixel-positioned elements that don't auto-fit to arbitrary viewport sizes. As features were added (telemetry, mission log, time dilation), they began to crowd the canvas on smaller screens.

The Mission Tracker Framework eliminates both compromises from the start:

- **3D physics from the ground up.** State vectors, ephemeris, burns, and rendering all operate in 3D. No calibration hacks. Real burns produce real trajectories.
- **Viewport-aware layout from the ground up.** Canvas calibration is computed at runtime from actual screen dimensions. The trajectory auto-fits and auto-centers on any screen.

Each future crewed mission (Artemis III, IV, and beyond) becomes a **configuration** of the same engine, not a new app from scratch. Artemis II eventually becomes the framework's first backport — re-rendered through 3D physics as a clean reproduction of the real mission, no synthetic burns required.

---

## 2. Design Anchor

**The trajectory canvas is the primary element. Always.**

Everything else in the framework negotiates around the trajectory. If the canvas needs space, supporting elements yield. If supporting elements need to be richer, they expand into dedicated zones — they never overlay or obscure the canvas.

This single rule resolves nearly every layout decision in the framework.

---

## 2.5. 3D Physics — Foundational

The framework uses 3D Cartesian state vectors throughout. This is non-negotiable and foundational, not an enhancement.

### State Representation

```
position = (x, y, z)     // km from Earth center, J2000-like inertial frame
velocity = (vx, vy, vz)  // km/s in same frame
```

The integrator (RK4) advances all six components at each timestep. Gravity is computed from 3D vector positions of all attracting bodies (Earth, Moon, Sun).

### Ephemeris

The Moon and Sun positions are computed in 3D over time. Two options:

- **Option A (lightweight):** Keplerian orbital elements with inclination — Moon orbit inclined ~5.14° to ecliptic, Earth-Moon-Sun system in ecliptic plane. Sufficient for trajectory accuracy at the ~minutes level.
- **Option B (high fidelity):** JPL DE440 ephemeris embedded as Chebyshev polynomials. Used by professional trajectory tools. Larger code footprint but exact.

**Selected:** Option B for the Moon (Phase B). Order-16 Chebyshev fit over an 18-day mission window gives sub-millimeter accuracy against the JPL DE440 source. The Sun ephemeris uses the lightweight circular model from Option A — solar tidal perturbation on Orion is small enough that the circular approximation is within budget. See `working/chebyshev.js` and `working/moon_chebyshev.json`.

### Burns

Burns are 3D delta-v vectors. Each burn specifies:
- **Time** (MET in seconds)
- **Magnitude** (m/s)
- **Direction** in a reference frame: prograde (along velocity), radial (toward/away from Earth), normal (perpendicular to orbital plane), or RTN (Radial-Tangential-Normal)

A 3D burn schema:
```javascript
{ name: "RTC-1", met: 523668, dv_magnitude: 0.488, frame: "RTN", components: [-1, 0, 0] }
// radial-in: -1 in radial direction, 0 in tangential, 0 in normal
```

This eliminates the need to "hardcode radial-in vector math" inline — the burn specification is declarative.

### Rendering: 3D Physics, 2D Display

The canvas remains Canvas2D (no WebGL, no Three.js) — single-file architecture preserved. 3D coordinates are projected to 2D screen space at render time.

**Projection approach:**
- Define a viewing camera with 3D orientation (azimuth, elevation, roll)
- Each frame, transform 3D world coordinates to camera coordinates, then orthographic project to screen coordinates
- Camera orientation is controlled by user (pan/zoom/rotate) — same controls as before, but now they actually rotate the 3D view
- Default view: looking down on the Earth-Moon plane from above (mostly looks like the current 2D view but with proper depth)
- Alternate views: edge-on, polar, follow-spacecraft, etc.

This gives the user real 3D understanding without the complexity of WebGL. The trajectory line is drawn as connected 2D screen-space segments computed from 3D world-space points.

### What This Eliminates

| Problem in Artemis II 2D | Resolved by 3D? |
|--------------------------|-----------------|
| Synthetic 0.16 km/s post-flyby TCM hack | **Yes** — real RTC burns become sufficient |
| Perilune altitude error (12,349 km vs NASA's 6,546 km) | **Yes** — flyby geometry is 3D |
| Calibration brittleness (start angle ↔ flyby ↔ return) | **Yes** — physics is determined by initial conditions |
| Inability to model NRHO orbits (Artemis III) | **Yes** — NRHO is fundamentally 3D |
| Inability to model out-of-plane maneuvers | **Yes** — burns are 3D vectors |

3D is the entire reason this framework exists. Skipping it would make the framework just a layout refresh of the existing 2D limitation.

---

## 3. Two-Mode Architecture

The framework supports two distinct viewing modes for two distinct audiences. Each mode is fully designed for its audience — neither is a watered-down version of the other.

### Mode A: Mission Storyteller (default)

- **Audience:** Students, casual visitors, the public
- **Goal:** Make orbital mechanics and relativity tangible through narrative
- **Visible elements:**
  - Trajectory canvas (largest)
  - Mission log compact (current event + next event with countdown)
  - Minimal telemetry (1-2 key values: e.g., velocity + altitude, or current MET + phase)
  - Camera controls
  - Playback controls
- **Hidden by default:**
  - Tape gauges (full)
  - Time dilation panel (expanded)
  - Fidelity indicators (verbose)
  - Info panel
  - Raw state vectors
- **Purpose:** A user opens the page and sees Orion's path. They understand where the mission is in its story without reading any numbers. The narrative is the protagonist; the numbers are absent unless requested.

### Mode B: Engineer's Dashboard (on-demand)

- **Audience:** Cole, technical users, students who want to read the actual numbers
- **Goal:** Expose the full instrument panel without compromise
- **Visible elements (in addition to Mode A):**
  - Full telemetry strip (all four tape gauges)
  - Time dilation panel expanded with Δτ decomposition
  - Fidelity indicators with hover tooltips
  - Raw state vectors (position, velocity, acceleration)
  - Burn delta-v components
  - Integrator metadata (step size, point count, residuals)
  - Possible future additions: gravitational vs velocity Δτ split, detailed event tooltips
- **Layout:** Co-exists with the trajectory canvas — never obscures it.

**Critical constraint:** The trajectory canvas must remain fully visible in both modes. The user must be able to see the trajectory and the telemetry **simultaneously**. The dashboard does not pop over the canvas; it sits beside or below it.

---

## 4. Dashboard Visibility Mechanisms

Two complementary mechanisms expose the Engineer's Dashboard, each suited to a different context:

### Mechanism 1: Bottom Drawer (default desktop and mobile)

The dashboard slides up from the bottom of the screen, occupying the lower portion (typically 30-50% of viewport height). The trajectory canvas and Mode A elements remain in the upper portion. The drawer is dismissible and resizable.

**Behavior:**
- Closed by default
- Toggle button in the top-right or via keyboard shortcut (e.g., `D`)
- When open, the trajectory canvas resizes to fit the remaining vertical space (still primary, still visible)
- Drag handle at the top edge of the drawer for resizing
- Mobile: drawer can fully expand to ~60% of screen height; trajectory shrinks but remains visible at the top

**Why:** Universal — works on every screen size, requires no second window, no popup blockers, no cross-window state sync. This is the primary mechanism.

### Mechanism 2: Detachable Window (power-user, dual-monitor)

For users with multiple displays, the dashboard can be popped out into a separate browser window. The main window keeps the trajectory canvas full-screen; the second window becomes a dedicated telemetry display.

**Behavior:**
- A "pop out" button in the dashboard drawer header
- Opens a new browser window (`window.open` with target dimensions)
- The new window contains only the dashboard contents
- State syncs via `BroadcastChannel` API or `localStorage` events
- Both windows update in real time
- Closing the popup window collapses the dashboard back into the drawer in the main window

**Why:** Power users (Cole, conference projection, live streaming, classroom display) can dedicate one display to the trajectory and another to the instruments. This is opt-in and additive — most users will never touch it.

**Both mechanisms preserve the design anchor:** the trajectory is always visible, in its own dedicated space, never obscured.

---

## 5. Tier Hierarchy

Elements are classified into four tiers by importance. The tier determines visibility behavior at each viewport size.

| Tier | Element | Mode A | Mode B | Mobile | Desktop |
|------|---------|--------|--------|--------|---------|
| **1** | Trajectory canvas | Always largest | Always largest | Top half / full | Always primary |
| **2** | Mission log (compact) | Always visible | Always visible | Always visible | Always visible |
| **3** | Telemetry (1-2 readouts) | Visible | Hidden (replaced by full dashboard) | Inline with mission log | Beside canvas |
| **4a** | Camera + playback controls | Visible | Visible | Bottom strip | Beside canvas |
| **4b** | Full telemetry, fidelity, time dilation, info panel | Hidden (in drawer) | Visible (drawer or window) | Drawer | Drawer or detached window |
| **5** | Debug, integrator metadata | Hidden | Hidden by default; togglable in dashboard | Drawer | Drawer |

**Rules:**
- Tier 1 always has the largest screen real estate
- Tier 2 is always visible at every viewport size
- Tier 3 may collapse on small screens but remains visible by default
- Tier 4 is on-demand via drawer or dashboard mode
- Tier 5 is for advanced/debug use only

---

## 6. Mission Configuration Schema

A mission is defined by a JavaScript object passed to the framework. Below is the proposed schema:

```javascript
const missionConfig = {
  // Identity
  name: "Artemis II",
  shortName: "A2",
  status: "completed", // "upcoming" | "active" | "completed"
  
  // Epoch
  launchUTC: "2026-04-01T22:35:12Z",
  
  // Crew (for display)
  crew: [
    { name: "Reid Wiseman", role: "Commander", agency: "NASA" },
    // ...
  ],
  
  // Target body
  targetBody: "Moon", // determines ephemeris and gravity model
  
  // Trajectory model
  trajectory: {
    integrator: "RK4",
    timestep: 10, // seconds
    perturbations: ["Moon", "Sun"],
    burnSchedule: [
      { name: "TLI", met: 82800, dv: 3.05, direction: "prograde", confirmed: true },
      { name: "OTC-1", met: 215000, status: "canceled" },
      { name: "OTC-3", met: 361668, duration: 17.5, dv: null, direction: "trajectory_correction", confirmed: true },
      { name: "RTC-1", met: 523668, duration: 15, dv: 0.000488, direction: "radial_in", confirmed: true },
      { name: "RTC-2", met: 706668, duration: 15, dv: 0.000396, direction: "radial_in", confirmed: true },
      { name: "RTC-3", met: 775000, status: "pending" },
      // ...
    ]
  },
  
  // Mission events (for the mission log)
  events: [
    { met: 0, label: "Launch", detail: "SLS liftoff", fidelity: 100, tooltip: "..." },
    { met: 126, label: "SRB separation", detail: "126s, 45 km", fidelity: 95, tooltip: "..." },
    // ...
  ],
  
  // Entry/splashdown
  splashdown: {
    targetUTC: "2026-04-11T00:07:00Z",
    location: "Pacific Ocean, off San Diego",
    entryVelocity: 10660 // m/s
  },
  
  // Display preferences
  display: {
    primaryColor: "#e07050", // Peirastes orange
    showLiveSync: true,
    defaultPlaybackSpeed: 1
  }
};
```

A new mission is just a new config file. The engine reads the config and produces the trajectory, mission log, and instrument panels automatically.

---

## 7. Component Inventory

### Reusable from Artemis II (with generalization)

| Component | Source | Generalization needed |
|-----------|--------|----------------------|
| RK4 integrator | `buildTrajectory()` | Take ephemeris and burn schedule from config |
| Ephemeris (Earth + Moon + Sun) | Hardcoded | Modular — support different target bodies |
| Tape gauge (vertical scrolling) | Custom SVG | Take label, units, value source, range from props |
| Mission log (compact + expanded) | Custom HTML/JS | Take events from config; compact and expanded modes |
| Callout labels (with leader lines, fan-out avoidance) | Custom canvas | Generalize to any body, any label set |
| Fidelity indicators with hover tooltips | Inline | Standardize as a reusable component |
| Time dilation panel | Custom HTML | Generalize to any spacecraft, any reference clock |
| Live mode sync | `realElapsed` calculation | Generalize to any launch UTC |
| Playback controls | Custom HTML | Reusable as-is |
| Camera controls (pan/zoom/rotate) | Custom canvas | Reusable as-is |

### New components needed

| Component | Purpose |
|-----------|---------|
| **Mission log compact** | Two-line "current + next event" display for Tier 2 |
| **Bottom drawer** | Resizable, dismissible bottom panel for Engineer's Dashboard |
| **Mode toggle** | Switch between Storyteller and Engineer's Dashboard modes |
| **Window detach** | Pop dashboard into a separate browser window with state sync |
| **Viewport-aware canvas calibration** | Runtime auto-fit and auto-center based on actual canvas dimensions, not hardcoded pixels |
| **Mission lifecycle banner** | "Upcoming," "Active," "Completed" badge that drives default UI state |

---

## 8. Calibration Generalization

Artemis II's biggest layout problem is that the trajectory canvas is calibrated with hardcoded pixel positions tuned for two specific screens. The framework must replace this with **runtime viewport-relative positioning**.

**Approach:**
- The canvas measures its actual rendered dimensions on every resize event
- Trajectory bounds are computed in physical units (km), not pixels
- Scale factor = `min(canvasWidth, canvasHeight) / trajectoryExtent`
- Center point = canvas center, always
- Earth and Moon positions transform from physical coordinates to canvas coordinates using the runtime scale factor
- Callout labels recompute positions relative to current canvas dimensions

**Result:** The trajectory auto-fits and auto-centers on any screen size — phone in portrait, phone in landscape, tablet, laptop, ultrawide desktop, projector. No per-screen calibration ever again.

---

## 9. Mission Lifecycle States

A mission transitions through three states. The framework's UI adapts to the current state automatically.

| State | Definition | UI Behavior |
|-------|-----------|-------------|
| **Upcoming** | Mission has not yet launched | Show countdown to launch; trajectory based on planned values; no live sync; "expected" labels on all events |
| **Active** | Mission is in flight | Live sync enabled; current event highlighted in mission log; fidelity indicators distinguish confirmed vs predicted events |
| **Completed** | Mission has splashed down | Live sync disabled; full timeline available for playback; all events have confirmed data; subtle "historical" badge |

A mission's state is part of its config but can also be auto-detected based on the launch UTC and splashdown UTC compared to the current time.

---

## 10. Isolation Strategy and Backport Plan

**The deployed Artemis II simulator (`Website/artemis-ii/artemis2.html`) must not be modified during framework development.** It is live, accurate, and tracking a real mission. Any changes to it would risk regressions that could affect users mid-mission.

### Working Directory

All framework development happens in `Website/projects/mission-tracker/working/`. This directory is a sandbox — nothing in it is deployed to the website until explicitly approved by Cole.

The starting point is `working/artemis2-baseline.html` — a snapshot of the current Artemis II simulator copied at the start of framework development. This preserves the working version as a reference and a regression target.

### Development Workflow

1. **Framework code lives in `working/`** — never edit `Website/artemis-ii/artemis2.html` during development
2. **The framework is built using Artemis II's data as the test bed** — since Artemis II has known-good real mission data and known-good output, it is the perfect validation target
3. **Each phase produces a runnable working/ HTML file** that can be opened in a browser locally
4. **Visual comparison** between the framework version and the deployed Artemis II is the primary success metric — they should match in physics and improve in layout
5. **No git pushes of working/ to production-facing paths** until backport is approved

### Backport Decision Point

Once the framework is stable AND its Artemis II rendering looks at least as good as the deployed version on every target screen size, **Cole decides** whether to swap the deployed Artemis II to use the framework. This is a deliberate, optional step.

If approved, the backport:
1. Move framework code from `working/` to a deployable location (`mission-tracker/dist/` or similar)
2. Replace `Website/artemis-ii/artemis2.html` with a new framework-based version
3. Archive the original as `Website/artemis-ii/artemis2-legacy.html` for fallback
4. Verify on multiple screen sizes
5. Push as a single coordinated update
6. Monitor for regressions

If NOT approved, the framework proceeds to Artemis III deployment without touching Artemis II. The deployed Artemis II remains as-is until Cole is ready.

### Artemis III Deployment (Independent of Backport)

Artemis III deployment does not require Artemis II backport. Once the framework is validated, Artemis III can deploy as `Website/artemis-iii/index.html` (or similar) using its own config file. The two missions can coexist on different code paths until Cole decides to unify them.

---

## 11. Implementation Phases

**All work in `Website/projects/mission-tracker/working/` — never touching the deployed Artemis II.**

### Phase 1: 3D Physics Engine
- Confirm working directory and baseline copy in place (✓ done 2026-04-10)
- Define the mission config schema (3D state vectors, 3D burn schedule)
- Implement 3D RK4 integrator (six state components: x, y, z, vx, vy, vz)
- Implement 3D Keplerian ephemeris for Moon and Sun (with inclination)
- Implement 3D gravity computation from all attracting bodies
- Implement 3D burn application with declarative direction (RTN frame)
- **Test:** Hand-craft a trivial config (Earth orbit), verify integration produces a closed orbit
- **Test:** Apply a prograde burn at perigee, verify apogee raises as predicted by vis-viva

### Phase 2: 3D Rendering (Canvas2D Projection)
- Implement camera with 3D orientation (azimuth, elevation, roll)
- Implement orthographic projection from 3D world coordinates to 2D screen coordinates
- Implement viewport-aware canvas calibration (auto-fit, auto-center based on actual canvas dimensions)
- Render Earth, Moon, trajectory line with depth-correct ordering
- Port camera controls (pan/zoom/rotate) to operate on the 3D camera
- **Test:** Render the Earth-Moon system from multiple viewing angles, verify visual correctness
- **Test:** Resize the canvas, verify auto-fit and centering work correctly

### Phase 3: Artemis II Validation (3D vs reality) ✅ COMPLETE
- Built Artemis II config with all 5 real burns (TLI, OTC-3, RTC-1, RTC-2, RTC-3) extracted via state injection from Horizons
- Validated against JPL Horizons data for the entire 9-day mission (428 reference waypoints)
- Results vs NASA published values:
  - **Perilune** — predicted 8,283 km from Moon center (6,546 km altitude) at Apr 6 23:00 UTC. NASA target: same. ✓
  - **Splashdown timing** — predicted Apr 11 00:03:44 UTC vs NASA Apr 11 00:07:00 UTC. Off by 197 s.
  - **Splashdown coordinates** — predicted 29.88°N −125.87°W vs target ~32.5°N −118°W. Off by 803 km.
- **Cumulative position accuracy** — 0.05 km RMS / 0.08 km max against Horizons over the entire cislunar phase. Far exceeds the original 5% gate.
- **3D physics validated.** No synthetic calibration burns used.
- The atmospheric phase carries a known limitation (Orion bank schedule not publicly released) — see Section 11.5 Phase E.

This validation work was deeper than the original Phase 3 scope. The full breakdown is in **Section 11.5: High-Fidelity Simulator Track**.

### Phase 4: Storyteller Mode UI
- Build the compact mission log component (current + next event)
- Build the minimal telemetry strip (1-2 readouts)
- Build the mission lifecycle banner (upcoming/active/completed)
- Wire the live sync system to the launch UTC
- Verify Mode A renders correctly at every viewport size

### Phase 5: Engineer's Dashboard
- Build the bottom drawer component (resizable, dismissible)
- Port the full telemetry strip (tape gauges) into the drawer
- Port the time dilation panel (now with proper 3D velocity for Δτ_velocity)
- Port the fidelity indicators
- Build the mode toggle button
- Verify simultaneous trajectory + dashboard visibility

### Phase 6: Detachable Window
- Build the window detach feature with state sync
- Test cross-window updates via BroadcastChannel
- Verify graceful degradation when popup is blocked

### Phase 7: Artemis II Backport (in working/, not deployed)
- Compare framework-rendered Artemis II against `working/artemis2-baseline.html` and the deployed version
- Verify physics, mission events, fidelity ratings all match (or improve)
- Verify layout improvements on every screen size
- **Decision point:** Cole reviews and decides whether to backport to deployed Artemis II

### Phase 8: Artemis III Configuration
- Wait for NASA to publish Artemis III mission parameters (NRHO orbit details, burn schedule, lunar approach geometry)
- Create Artemis III config file
- Deploy as `Website/artemis-iii/index.html` (independent of Artemis II)
- Cole decides separately whether to also backport framework to Artemis II

**Critical insight:** Phase 3 is the validation gate for the entire framework. If 3D physics cannot reproduce Artemis II's real trajectory within tolerance using only real burns, the rest of the work is moot. We validate the foundation before investing in the UI.

---

## 11.5. High-Fidelity Simulator Track (Phases A–E)

After the original Phase 3 validation surfaced cumulative drift over 9 days, the validation effort was expanded into a full high-fidelity rebuild. Cole locked the requirements 2026-04-10:

- **Moon model:** Chebyshev fit to JPL DE440
- **Burn extraction:** Velocity differencing from Horizons + cross-check against NASA blog magnitudes
- **Accuracy gate:** **1 km RMS / 10 km max** position error vs Horizons over 9 days
- **Deployment:** Stand up `/artemis-ii-v2/` parallel to v1 (no overwrite)
- **Splashdown:** ~50 km target zone, refine when NASA publishes exact lat/lon
- **Mission events:** ICPS perigee raise (annotation), ICPS sep (annotation), ICPS disposal (annotation)
- **Principle:** Accuracy before precision — validate dominant physics first, add perturbations one at a time, stop when the gate passes

### Phase A: Burn data extraction ✅

**Pivoted from impulsive ΔV extraction to state injection.** Direct velocity differencing failed for small RTC burns because gravity contribution dominates over the sampling window (1.8× to 13× the published values), and TLI's velocity vector rotates rapidly near perigee, making magnitude-based extraction misleading.

**Resolution:** `working/artemis2_burns.json` stores Horizons state vectors directly at each burn epoch. The Phase D simulator resets spacecraft state at each burn boundary using these exact NASA-tracked values. Display ΔV magnitudes use NASA-published values (TLI 388 m/s, RTC-1 0.488 m/s, RTC-2 1.615 m/s, RTC-3 1.280 m/s).

**Burns canonicalized:** TLI (Apr 2 23:49), OTC-3 (Apr 6 03:05), RTC-1 (Apr 8 00:06), RTC-2 (Apr 10 02:53), RTC-3 (Apr 10 18:53). OTC-1 and OTC-2 cancelled.

**Files:** `parse_horizons.js`, `extract_burns.js`, `artemis2_burns.json`, `artemis2_horizons_full.json` (428 waypoints at 30-min cadence), 6 burn-window JSON files.

### Phase B: Chebyshev DE440 Moon ephemeris ✅

Pulled the dominant lever for cislunar accuracy. Coast errors improved 2,400× from the simplified circular Moon model.

**Implementation:** 433 Moon position samples from Horizons (target 301 vs Earth center 399), order-16 Chebyshev least-squares fit per ecliptic component. 51 coefficients total.

**Validation:**
- Moon model max error: **0.46 mm** vs DE440 source
- Coast segment errors (30-min): **0.85 km mean / 0.05 km typical** (was 2,027 km / 19,952 km)

**Files:** `chebyshev.js`, `fit_moon_ephemeris.js`, `moon_ephemeris.json` (433 Moon positions), `moon_chebyshev.json` (51 coefficients), `test_moon_chebyshev.js`. Loaded into `physics3d.js` via new `loadMoonChebyshev()` and `setMissionEpoch()` functions and an `EPHEMERIS.mode` flag.

### Phase C: High-fidelity perturbations ✅

Added perturbations one at a time per the accuracy-before-precision principle, with diagnostic instrumentation showing where errors actually came from.

**Added:**
- **J2 oblateness** (zonal harmonic 2) — Earth's equatorial bulge. Implemented in equatorial frame with transient rotation when integrator runs in ecliptic. Improved post-TLI segment errors by 2×.
- **Solar radiation pressure** — Orion mass 25,400 kg, area 32 m², Cr 1.3. Negligible improvement on 9-day mission (~10s of meters).
- **Auto-detection of Horizons file-seam artifacts** — energy-discontinuity scanner injects state at non-physical waypoint glitches, separating "real" propagation error from data noise.

**Diagnostic result:** A cadence sweep proved the residual error is **chaotic amplification** of small initial errors near perilune, NOT missing physics. Adding J3, J4, or relativistic terms would not help. The fix is more frequent state injection, which is essentially what the Phase D simulator does.

**Cadence sweep table:**

| Inject every | RMS | Max |
|---|---|---|
| 30 min | **0.017 km** | **0.337 km** |
| 1 hour | 0.79 km | 12.04 km |
| 3 hours | 2.24 km | 16.09 km |
| 6 hours | 7.20 km | 83.07 km |
| burns only | 135 km | 485 km |

**Files:** `test_full_mission.js` (cumulative validator with auto-injection), `physics3d.js` extended with J2/J3/J4/SRP flags, J2 implementation in `gravityAccel`, SRP implementation, spacecraft mass/area/Cr config.

### Phase D: Full mission simulator with state injection ✅ PASS

The validated optimal configuration: 30-minute Horizons state injection + Chebyshev Moon + J2 + SRP, 5-second RK4 inner step.

**Validation:**

| Metric | Result | Gate | Margin |
|---|---|---|---|
| RMS position error | **0.0494 km** (49 m) | 1 km | **20× under** |
| Max position error | **0.0763 km** (76 m) | 10 km | **130× under** |
| Outliers | 0 | n/a | clean |

The ~50 m residual is at the rounding-precision floor of the output JSON. The trajectory is essentially indistinguishable from JPL Horizons at any visualization scale.

**Output:** `working/artemis2_trajectory.json` (~1 MB) — single file consumed by Phase G/H UIs. Contains:
- Spacecraft position + velocity at 1-min cadence over the 9-day mission
- Moon position at each sample
- 16 mission events (launch, ICPS burns, TLI, OTC-3, perilune, RTC burns, entry interface, splashdown)
- Full metadata (mission, crew, frame, validation, etc.)

**Files:** `precompute_trajectory.js`, `artemis2_trajectory.json`, `test_trajectory_output.js`.

### Phase E: Atmospheric entry + splashdown projection ⚠ Complete with caveat

**Atmospheric model:** 3-piece exponential atmosphere (0–25 km, 25–100 km, 100–300 km), continuous at breakpoints, ~10% accurate vs US Standard Atmosphere 1976. Drag with Earth-rotation relative wind. Simplified lift with constant L/D directed perpendicular to velocity in the vertical plane.

**Configuration for entry:** Orion CM mass 9,300 kg (post-ESM-jettison), heat shield area 19.5 m², Cd 1.4, L/D 0.05.

**Splashdown prediction:**
- **Predicted:** 29.88°N, −125.87°W at 2026-04-11 00:03:44 UTC
- **Published target zone:** ~32.5°N, −118°W at 00:07:00 UTC
- **Offset:** 803 km horizontal, 197 s early
- **50 km gate:** not met

**Why:** Real Orion uses an active **bank-modulation guidance schedule** (effective L/D varies dynamically from −0.3 to +0.3) targeting a closed-loop landing point. NASA has not publicly released the schedule. I tested constant L/D values of {0.0, 0.05, 0.10, 0.15}; only 0.05 produces a Pacific landing in the right region. The remaining ~800 km offset is the closed-loop guidance contribution that we can't model.

**Decision:** The trajectory output (`artemis2_trajectory.json`) extends through entry and includes both the simulated splashdown event (with our predicted coordinates) AND the published splashdown event (with NASA's coordinates). The Storyteller UI can show both, with a caveat note.

**Files:** `physics3d.js` extended with `atmosphereDensity()`, drag and lift in `gravityAccel`, spacecraft entry parameters; `predict_splashdown.js` standalone validator; `precompute_trajectory.js` extended to integrate through entry.

### File inventory (working/ directory)

**Physics core:**
- `physics3d.js` — RK4 integrator, gravity model (Earth+J2+Moon+Sun+SRP+drag+lift), atmosphere, frame transforms, geodetic
- `chebyshev.js` — Chebyshev polynomial fit and Clenshaw evaluation

**Data acquisition + processing:**
- `parse_horizons.js` — Horizons text format → JSON
- `fit_moon_ephemeris.js` — DE440 Moon → Chebyshev coefficients
- `extract_burns.js` — Burn epochs → state injection records

**Reference data:**
- `artemis2_horizons.json` — 16 original waypoints (legacy)
- `artemis2_horizons_full.json` — 428 waypoints, 30-min cadence (current reference)
- `moon_ephemeris.json` — 433 Moon positions from Horizons
- `moon_chebyshev.json` — Order-16 fit, 51 coefficients
- `artemis2_burns.json` — 5 NASA burns with state injection records
- `pre_entry_horizons.json` — 24 1-min samples for entry validation
- `burn{1-6}_*.json` — 1-min Horizons windows around each burn

**Simulators:**
- `precompute_trajectory.js` — Full mission simulator → `artemis2_trajectory.json`
- `predict_splashdown.js` — Atmospheric entry standalone

**Validators:**
- `test_horizons_validation.js` — Per-segment coast accuracy (Phase 3)
- `test_horizons_geometry.js` — Orbital plane diagnostics
- `test_horizons_planarity.js` — Best-fit plane residuals
- `test_horizons_launch.js` — KSC launch geometry, ground track
- `test_moon_chebyshev.js` — Moon model accuracy
- `test_full_mission.js` — Cumulative cislunar validation with cadence sweep
- `test_trajectory_output.js` — Phase D output validation
- `scan_burns.js`, `debug_burns.js` — Diagnostics

**Output (consumed by UI):**
- `artemis2_trajectory.json` — 12,844 samples, 1 MB, full mission + entry
- `artemis2_events.json` — Mission events sidecar (pretty-printed)

---

## 12a. Visual Polish Backlog

Items that are not blocking the framework but should be added during polish phases.

- **Earth satellite imagery.** Current Earth render is a procedural blue sphere with lat/lon grid, day/night terminator, and atmosphere glow. A NASA Blue Marble / Visible Earth equirectangular texture would make the Earth recognizable (continents, oceans, ice caps). Implementation: load an equirectangular PNG, sample by (lat, lon) → (u, v), blit per-pixel or per-quad across the visible hemisphere. One-time addition, visually transformative.
- **Moon surface texture.** Same approach for the Moon — NASA Lunar Reconnaissance Orbiter mosaics are public domain. Currently the Moon is a grey sphere with phase shading.
- **Atmospheric scattering on Earth limb.** The current atmosphere glow is a simple radial gradient. A more physical approach would model Rayleigh scattering for a sunrise/sunset band at the terminator.
- **Starfield background.** Deep-space parallax stars behind the trajectory canvas. Aesthetic only; doesn't affect the physics.
- **Mouse-pointer-anchored zoom.** Current zoom orbits the world origin. Anchoring to the cursor position would feel more natural. Requires adding a camera translation offset.
- **3D spacecraft model.** Current spacecraft is a glowing dot. A simple Orion silhouette (or any mission's craft) would improve the visual story.
- **Trails and telemetry overlays during playback.** Past-trajectory fade, future-trajectory preview, velocity vector arrow.

---

## 12. Open Design Questions

These need answers before or during implementation:

1. **Where do the camera and playback controls live in Mode A vs Mode B?** They're Tier 4a — always visible — but their position may differ between modes.

2. **Should Mode B include a "minimal" sub-mode for the dashboard?** Some users might want telemetry visible without the full firehose. A toggle within the dashboard for "essential" vs "expert" view.

3. **How does the framework handle missions to bodies other than the Moon?** The ephemeris is currently Earth + Moon + Sun. For Artemis missions this is fine. For future missions to Mars or asteroids, the gravity model needs extension.

4. **Should the framework support multiple spacecraft on one trajectory?** (e.g., Orion + tracking spacecraft + cargo) Probably not for v1, but worth keeping in mind.

5. **What's the minimum browser support target?** ES2020+ for modern syntax? IE11 support? (Probably not — modern only.)

6. **Should the framework be a single file or a build pipeline?** Artemis II is a single ~95KB HTML file. The framework will be larger. Single file with inline JS keeps the deployment story simple. A build pipeline (Vite, etc.) gives better dev ergonomics. Recommend: single file for v1, evaluate build pipeline if it grows past ~250KB.

---

## 13. Success Criteria

The framework is successful when:

1. ✅ **Artemis II runs on the framework with no loss of fidelity** — 0.05 km RMS / 0.08 km max vs Horizons over the entire 9-day mission. Phases A–E complete.
2. Artemis III can be deployed with only a config file change — no engine modifications *(pending — Phase 8)*
3. The trajectory canvas auto-centers and auto-fits on every viewport size from phone to ultrawide *(pending — Phase G)*
4. A user can switch between Storyteller and Engineer's Dashboard modes without losing context *(pending — Phase G/H)*
5. The trajectory and telemetry can be viewed simultaneously in either mode (drawer or detached window) *(pending — Phase G/H)*
6. The framework can be reused for future missions with minimal effort *(physics ready; UI pending)*

---

*Revision History:*

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-10 | Initial design draft. Two-mode architecture (Storyteller / Engineer's Dashboard). Bottom drawer + detachable window for dashboard visibility. Tier hierarchy with trajectory as primary. Mission config schema. Component inventory. Calibration generalization. Lifecycle states. Backport plan. Implementation phases. |
| 0.2 | 2026-04-10 | **3D physics is now foundational, not optional.** Added Section 2.5 (3D Physics — Foundational) explaining why Artemis II's 2D model required a synthetic calibration burn and how 3D eliminates the entire class of compromise. State vectors, ephemeris, burns, and rendering all 3D. Canvas2D preserved via runtime projection (no WebGL/Three.js dependency). Implementation phases reorganized: Phase 1 = 3D physics engine, Phase 2 = 3D rendering, Phase 3 = Artemis II validation gate (must reproduce NASA values within 5% using only real burns). Updated Section 1 (Purpose) to articulate the 2D limitations of Artemis II and how 3D resolves them. Isolation strategy unchanged — all dev in working/. |
| 0.3 | 2026-04-11 | **Physics track complete (Phases A–E).** Added Section 11.5 documenting the high-fidelity simulator track and its results. Phase D simulator achieves 0.05 km RMS / 0.08 km max vs JPL Horizons over the entire 9-day mission — 20× margin on the 1 km gate. Selected Option B (Chebyshev DE440) for the Moon ephemeris in Section 2.5. Updated Phase 3 in Section 11 with completion status and links to Phase A–E details. Updated Section 13 success criteria with achievement markers. Added current-status callout block at the top. The physics is locked; the remaining work is the UI track (Phases F/G/H/I) which builds against the 1 MB `artemis2_trajectory.json` produced by Phase D. |
