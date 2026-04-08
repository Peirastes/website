# Project Overview Document (POD)

**Project:** Artemis II Orbital Trajectory Simulator
**Lead:** Cole Prather
**Status:** Active (v2 shipped)
**Last Updated:** 2026-04-07

---

## The Problem

General relativity predicts that clocks at different gravitational potentials and velocities tick at different rates, but this effect is almost never presented in terms of a real, ongoing space mission. NASA's Artemis II — the first crewed lunar flight since Apollo 17 in 1972 — provides a rare opportunity to make orbital mechanics and relativistic physics tangible: a spacecraft carrying four astronauts on a 10-day free-return trajectory around the Moon, with every phase computable from first principles. Most online trackers during the mission showed animated dots on pre-recorded paths. None computed the trajectory from physics in real time, and none were transparent about their model's accuracy.

**Driving Question:** Can a single-file browser app predict a real spacecraft's position to within minutes of NASA's published timeline using nothing but Newtonian gravity and a numerical integrator — and be honest about where it's wrong?

---

## What's Novel

1. **Physics-first trajectory** — RK4 integration under three-body gravity (Earth + Moon + Sun), not pre-recorded animation or NASA ephemeris consumption. The trajectory is computed from scratch on every page load.
2. **Transparent fidelity indicators** — every mission event has a colored confidence rating with hover tooltips explaining the physics, the approximation, and the known error. No other public Artemis II tracker did this.
3. **Scrolling aviation tape gauges** — real cockpit instrument behavior where the scale moves past a fixed center readout. Four gauges: velocity, altitude, lunar distance, gravitational potential.
4. **LUNAR distance gauge** — a real-time proximity meter to the Moon that drops dramatically at perilune. Obvious in retrospect; absent from every other tracker.
5. **Time dilation decomposition** — gravitational blueshift vs velocity dilation tracked as separate cumulative components, visible in the expanded time panel.
6. **Canceled OTC burns** — reflecting actual NASA mission decisions (all three outbound corrections were canceled because the TLI was nominal).
7. **Calibration testbed** — a standalone Node.js tool with 2D parameter search, sweep modes, and a chronological diff table for tuning against NASA data.

---

## Goals

**Primary Objective:** Deliver a browser-based instrument that tracks a real lunar mission in real time using computed physics, with enough fidelity to be pedagogically valuable and enough transparency to be scientifically honest.

**Achieved (v2):**
1. Three-body physics calibrated against NASA mission control (perilune within 3 min, splashdown within 10 min)
2. Responsive layout for desktop and mobile
3. Peirastes Instrument tier aesthetic
4. Fidelity indicators, hover tooltips, scrolling tape gauges
5. Real screenshot replacing placeholder thumbnail
6. Shipped during the mission (Flight Day 6, lunar flyby day)

**Next (v3 candidates):**
1. Elliptical Moon orbit from JPL ephemeris
2. 3D trajectory with out-of-plane components
3. Finite-duration burns (real TLI is 5m50s)
4. Post-mission validation against actual NASA telemetry
5. Auto-zoom during lunar flyby approach
6. Spacecraft icon with attitude indication

---

## What Works

- Full 10-day trajectory computed via RK4 under Earth + Moon + Sun gravity (10s timestep, ~13k points)
- Calibrated against NASA: launch exact, perilune -2m 20s, splashdown -10m 10s
- Scrolling aviation tape gauges (VEL, ALT, LUNAR, Φ) with major/half/minor demarcations
- Four-trace Flight Dynamics graph (altitude, velocity, potential, Δτ)
- Mission log with fidelity indicators, hover tooltips, canceled OTC burns, brief event T+ elapsed
- Collapsible mission time panel with Earth/Orion clocks and Δτ gravitational/velocity decomposition
- Callout-style canvas labels with leader lines and fan-out overlap avoidance
- Live mode syncs to real mission elapsed time
- NASA livestream button
- Responsive: desktop right-column panels + mobile bottom-anchored telemetry/graphs
- Single HTML file (~95KB), no frameworks, no backend

## What Doesn't

- Flyby altitude is ~2× NASA's value (12,349 km vs 6,546 km) — the start-angle calibration trades altitude precision for timing accuracy
- 2D orbital plane — real Artemis II has out-of-plane components
- Circular Moon orbit (real: 363k–405k km elliptical)
- Impulsive burns (real TLI is 5m50s, not instantaneous)
- Post-flyby TCM is synthetic (calibrated for correct splashdown, not replicating a real burn)
- No J2 Earth oblateness, no solar radiation pressure
- Callout labels can still go off-screen on some mobile viewports (clamping implementation reverted due to rendering bug)
- Graph panel too small to be genuinely useful on mobile
- No data export

---

## Open Questions

1. Once post-mission telemetry is published, how closely does the three-body trajectory match the actual flight path?
2. Can the flyby altitude be improved without sacrificing timing accuracy? (May require 3D integration or elliptical Moon orbit.)
3. Would adapting the framework to Artemis III (NRHO + landing) be feasible in the same single-file architecture?

---

## Project Disposition (2026-04-07)

**Status: v2 complete. No v3 planned. Maintenance mode.**

The simulator's peak value was the lunar flyby (April 6). The return coast is 4 days of gradually decreasing altitude — no dramatic events until splashdown on April 11. The audience that shared and engaged with the app did so during the flyby window. Adding 3D trajectories, JPL ephemeris, or finite-duration burns now would be engineering for engineering's sake — the public audience won't notice the difference.

The v3 candidates (elliptical Moon orbit, 3D rendering, finite burns) are better foundations for a **generalized orbital mechanics engine** aimed at Artemis III, which will involve NRHO, docking, and a lunar landing — a genuinely new project that justifies the effort.

**Remaining tasks before archive:**
1. Verify splashdown renders correctly on April 11 (quick live check)
2. After splashdown: swap NASA livestream button for "Mission Complete" badge or link to NASA's mission summary
3. After splashdown: update info panel "Future Plans" to note mission concluded successfully

**Reusable assets for future projects:**
- Calibration testbed (Node.js CLI with parameter sweeps and diff tables)
- Scrolling aviation tape gauge component
- `drawCallout()` canvas label system with fan-out overlap avoidance
- `stackPanels()` dynamic responsive layout pattern
- Fidelity indicator pattern (transparent model confidence reporting)

---

*Revision History:*

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-04-03 | Initial creation as "Orion Lab". Two-body physics (Earth + Moon). ~20-hour perilune timing error. |
| 2.0 | 2026-04-05 | Renamed to "Artemis II". Added Sun gravity, post-flyby TCM, NASA calibration (perilune -2m, splashdown -10m). Peirastes instrument aesthetic. Responsive layout. |
| 2.1 | 2026-04-06 | Scrolling aviation tape gauges, LUNAR distance gauge, fidelity indicators, hover tooltips, callout labels, NASA livestream, info panel rewrite, crew tribute. Shipped on Flight Day 6 (lunar flyby day). ~100 commits. |
| 2.1.1 | 2026-04-07 | Documentation (POD v2, PSR, social posts). Project disposition: maintenance mode. |

---

*This document provides orientation. For challenges and lessons learned, see the Project Status Report (PSR).*
