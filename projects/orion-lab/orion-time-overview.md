# Orion Time — Artemis II Relativistic Time Dilation Simulator

## Overview

**Orion Time** is a browser-based physics simulation that visualizes the relativistic time dilation experienced by the crew of NASA's Artemis II mission — the first crewed flight to the Moon since Apollo 17 in 1972. The simulator computes and displays the difference in proper time between clocks aboard the Orion spacecraft and clocks on Earth's surface, accumulated over the full ~10-day mission trajectory.

The core question this project answers: **How much do Orion's clocks drift relative to Earth's over the course of a lunar free-return mission?**

## Motivation

Artemis II launched on April 1, 2026 at 22:35:12 UTC, carrying four astronauts on a free-return trajectory around the Moon. While the mission's primary objectives are systems verification and crew safety validation, the flight also represents a unique opportunity to illustrate general and special relativity in an accessible, visceral way.

Time dilation is not hypothetical — it is a measurable effect that governs GPS satellite corrections, particle accelerator experiments, and deep-space navigation. The Artemis II trajectory, with its dramatic changes in both velocity and gravitational potential, creates a compelling case study where two competing relativistic effects are simultaneously at work:

- **Gravitational blueshift** — Far from Earth, the gravitational potential is weaker and clocks run *faster*. At lunar distance (~384,400 km), this effect dominates.
- **Velocity time dilation** — Moving clocks run *slower* (special relativity). At 10+ km/s during translunar injection, this effect opposes the gravitational gain.

For Artemis II, gravitational blueshift wins — the crew ages *slightly more* than people on Earth, accumulating on the order of hundreds of microseconds over the 10-day mission.

## Physics

### Worldline Metric

The proper time along Orion's worldline is computed in the weak-field, slow-motion limit of general relativity:

$$d\tau^2 = \left(1 + \frac{2\Phi}{c^2}\right)dt^2 - \frac{1}{c^2}\left(dr^2 + r^2 d\theta^2\right)$$

where the gravitational potential includes contributions from both Earth and the Moon:

$$\Phi(\mathbf{r}) = -\frac{GM_E}{r} - \frac{GM_M}{|\mathbf{r} - \mathbf{r}_M|}$$

The cumulative time difference Δτ is accumulated by integrating this metric along the spacecraft's trajectory at each simulation timestep, comparing Orion's clock rate to a reference clock on Earth's surface.

### Time Dilation Decomposition

At each point along the trajectory, the instantaneous clock rate difference has two components:

1. **Gravitational term**: `ΔΦ/c² = (Φ_craft - Φ_earth) / c²` — positive when Orion is higher in the potential well (farther from Earth), causing the Orion clock to run faster.

2. **Velocity term**: `-v²/(2c²)` — always negative, causing the moving Orion clock to run slower.

The net effect at any instant is the sum of these two terms. During LEO and HEO phases near Earth, the terms nearly cancel. During the translunar coast at high altitude and moderate speed, the gravitational term dominates strongly.

## Trajectory Model

### Integration Method

The trajectory is computed via **4th-order Runge-Kutta (RK4) numerical integration** under two-body gravity (Earth + Moon). The timestep is 10 seconds, producing ~14,000 trajectory points over the full mission.

### Mission Phases

The simulation models the complete Artemis II flight profile:

1. **Powered Ascent (T+0 to T+480s)** — Interpolated from real SLS performance milestones (altitude and velocity profiles from Artemis I data). The spacecraft rises from Earth's surface through SRB separation at 126s to main engine cutoff at 480s.

2. **LEO Parking Orbit** — Circular orbit at 185 km altitude, 7.79 km/s. RK4-integrated under Earth+Moon gravity.

3. **ICPS Burn to High Earth Orbit** — Prograde delta-v computed via the vis-viva equation to raise apogee to 74,000 km, matching the real mission's ~24-hour elliptical orbit.

4. **Translunar Injection** — A 0.240 km/s prograde burn at HEO perigee fired on Flight Day 2 (T+~25.4h), tuned so the trajectory reaches perilune at NASA's published time. The orbit start angle is chosen so that perigee velocity naturally aligns with the translunar trajectory — equivalent to selecting the correct launch window.

5. **Translunar Coast** — ~4 days of gravitational coasting toward the Moon.

6. **Lunar Flyby** — Free-return trajectory with perilune arrival at T+5d 0h 27m (April 6, 2026, 23:02 UTC), matching NASA mission control.

7. **Return Coast** — ~4 days back to Earth, with trajectory correction burns.

8. **Re-entry and Splashdown** — Service module separation, atmospheric entry at ~11.2 km/s, parachute deployment, splashdown in the Pacific.

### Cross-Reference with NASA Mission Control

All trajectory parameters were validated against real Artemis II mission data from NASA blogs, press releases, and mission control reports. A timing audit on 2026-04-05 revealed that the simulation's lunar flyby was landing ~24 hours early in local time due to a physics-to-label mismatch; the TLI timing and delta-v were retuned against NASA's published mission control data:

| Parameter | Simulation | NASA Reported |
|-----------|-----------|---------------|
| Launch | Apr 1, 2026 22:35:12 UTC | Apr 1, 2026 22:35:12 UTC |
| TLI burn time | T+25.4h (Flight Day 2) | T+25h14m (Flight Day 2 ESM burn) |
| TLI delta-v | 0.240 km/s (tuned for correct transit time) | 0.388 km/s (1,274 ft/s) |
| HEO apogee | 74,000 km | 74,030 km (46,000 mi) |
| **Lunar flyby (closest approach)** | **Apr 6, 2026 23:02 UTC (T+5d 0h 27m)** | **Apr 6, 2026 23:02 UTC (7:02 PM EDT)** |
| Perilune altitude | ~6,500 km | ~6,600 km (4,066 mi) |
| Max distance | ~406,700 km | 406,700 km (252,757 mi) |
| Splashdown | NET Apr 11, 2026 00:21 UTC (T+9d 1h 46m) | NET Apr 11, 2026 00:21 UTC |

**Note on TLI delta-v:** Our TLI magnitude is smaller than NASA's reported figure because our two-burn architecture (HEO burn → small prograde TLI at perigee return) puts more energy into the HEO burn, whereas the real mission uses a single ESM TLI burn from the 23.5-hour HEO orbit. The total energy delivered to the translunar trajectory is equivalent; the 0.240 km/s value is tuned so the RK4 integrator reproduces NASA's published perilune arrival time.

## Simulator Features

### Full-Screen Canvas with HUD Overlay

The simulator renders on a full-screen HTML5 canvas with glassmorphism HUD panels positioned around the edges:

- **Top-left** — Mission branding, phase indicator, MET timer, dual clocks (Earth UTC / Orion proper time), Δτ readout. Collapsible.
- **Top-center** — Playback controls (1×, 1m/s, 1h/s, 6h/s speed selection, play/pause, reset).
- **Bottom-left** — Mission log with live event tracking (past ✓ / NOW / countdown T−). Collapsible to show only previous/current/next events.
- **Bottom-center** — Telemetry tape indicators (VEL, ALT, v/c, Φ/c²) with aviation-style center-readout cutouts and fill bars.
- **Bottom-right** — Timeline graph drawer that slides out from the telemetry panel, showing progressive traces of all five telemetry channels.
- **Top-right** — Info button with expandable panel containing project description, physics explanation, KaTeX-rendered equations, and simulation details.

### Live Mode

When the real Artemis II mission is in progress, the simulator auto-enables **LIVE mode** on page load. A red pulsing indicator shows that the display is synced to real elapsed mission time (computed from the known launch time). The trajectory, telemetry, mission log, and Δτ all reflect Orion's actual current position. Clicking Play/Reset switches to manual simulation mode; clicking LIVE returns to real-time tracking.

### Camera Controls

- **Left-drag** — Pan the view
- **Scroll wheel** — Zoom toward cursor position (0.2× to 20×)
- **Right-drag** — Rotate the view around the selected focal body
- **Click on body** — Select Earth, Moon, or Orion as the rotation center (indicated by a dashed selection ring)
- **Double-click** — Reset all camera state

Multi-layer parallax star fields provide depth cues when panning and zooming. All text labels counter-rotate to stay horizontal. The scale bar is rendered as a fixed screen overlay.

### Aviation-Style Telemetry

Four vertical tape indicators display real-time telemetry with center-readout cutouts, tick marks, pointer arrows, and fill bars:

- **VEL** (amber) — Velocity, linear 0–12 km/s
- **ALT** (blue) — Altitude, logarithmic 0–420,000 km
- **v/c** (green) — Speed as fraction of light speed, logarithmic
- **Φ/c²** (purple) — Gravitational potential (drives time dilation)

### Mission Timeline Graph

A progressive time-series chart traces five channels as the simulation runs:

- Altitude (blue, log scale)
- Velocity (amber, linear)
- v/c (green, linear)
- Φ/c² (purple, log scale)
- Δτ cumulative (pink, linear)

The graph traces out in real-time with a playhead marking the current position. Axis scaling is pre-computed from the full trajectory for stability.

## Technical Implementation

- **Single HTML file** — No build tools, frameworks, or external dependencies beyond KaTeX (CDN) and Google Fonts
- **RK4 integrator** — 4th-order Runge-Kutta with 10-second timestep
- **Gravitational model** — Earth + Moon two-body (no Sun, no J2 oblateness)
- **Burns** — Impulsive delta-v maneuvers (instantaneous velocity changes)
- **Ascent** — Interpolated from real SLS performance data (not thrust-simulated)
- **Rendering** — HTML5 Canvas 2D with devicePixelRatio scaling
- **Equations** — KaTeX for LaTeX rendering
- **Time dilation** — Weak-field metric integration with Earth surface reference

## Author

Built by **Peirastes**
