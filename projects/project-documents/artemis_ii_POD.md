# Project Overview Document (POD)

> A POD is a 1-2 page snapshot. Read time: 3 minutes.

---

**Project:** Artemis II Orbital Trajectory Simulator (v1, v2, v3.5)
**Lead:** Cole Prather
**Status:** Complete — three deployments live; mission concluded 2026-04-11
**Last Updated:** 2026-05-26

---

## The Problem

NASA's Artemis II — the first crewed lunar flight since Apollo 17 — was a rare opportunity to make orbital mechanics tangible in real time: a spacecraft on a 10-day free-return trajectory around the Moon, every phase computable from first principles. Most online trackers showed animated dots on pre-recorded paths. The project's three deployments answer three different questions: **v1** ("can a single-file browser app track a real mission in real time?"), **v2** ("how close can we actually get with high-fidelity physics?"), and **v3.5** ("what is the canonical chrome pattern for a Peirastes mission tracker?"). All three live on peirastes.com; the public Projects listing points at v3.5 as the production face.

**Driving Question:** Can a real spacecraft's trajectory be tracked from physics rather than ephemeris consumption — and what's the cleanest way to present that to a visitor?

---

## What's Novel

- **v1**: physics-first trajectory (RK4 under three-body gravity) shipped *during the live mission* — Flight Day 6, lunar flyby day — with transparent fidelity indicators on every event. No other public tracker did this.
- **v2**: high-fidelity 3D rebuild validated to **0.05 km RMS / 0.08 km max** against JPL Horizons (DE440 + 5 real burns) — engineering-grade.
- **v3.5**: the project that locked **the canonical Peirastes v2 (Cinematic Tier) chrome vocabulary** for all future cinematic instruments. Same v2 lab frame + physics + JS preserved verbatim; new outer chrome that propagates to Tip-Recover, Optics Lab, Smoke Sim, and any future mission tracker.

---

## Goals

**Primary Objective:** Three goals, one per version. v1 — track the live mission. v2 — get engineering-grade accuracy. v3.5 — establish the cinematic instrument template. **All three achieved.**

**Near-Term** (1-3 months):

1. Update Mission Tracker POD/PSR to reflect that v3.5 is its first deployment and the UI-track unblocking happened by inlining chrome rather than waiting for the Acrylic HUD library.
2. Real screenshot replacing the placeholder thumbnail (Artemis II v2 entry in `projects.json` currently shows v1's `artemis-ii.png`; `artemis-ii-v2.png` exists unused).
3. Decide whether v1 stays preserved as a "live-mission artifact" or eventually retires.

**Long-Term** (3-12 months):

1. Reuse v3.5 chrome + v2 physics as the seed of a generalized **Mission Tracker** framework (Artemis III, Mars Sample Return, etc.).
2. Post-mission telemetry comparison — once NASA publishes the actual flight reconstruction, validate the three-body model against ground truth.

---

## What Works

- **v1** (`/artemis-ii/`, deployed 2026-04-06) — RK4 three-body trajectory, scrolling aviation tape gauges, four-trace Flight Dynamics graph, fidelity indicators with hover tooltips, mission log with canceled OTC burns, callout-style canvas labels with fan-out, time-dilation decomposition (gravitational vs. velocity). Single HTML file (~95 KB). Post-splashdown updates landed 2026-04-26 (livestream button → "Mission Complete", info panel update).
- **v2** (`/artemis-ii-v2/`, deployed 2026-04-26) — high-fidelity 3D, Chebyshev DE440 Moon ephemeris, state-injection burn modeling (5 real burns, no synthetic calibration), 0.05 km RMS / 0.08 km max vs. Horizons. iPad and mobile layout shipped 2026-04-26.
- **v3.5** (`/artemis-ii-v3-5/`, deployed 2026-05-09, LOCKED) — Cinematic Tier reimagining. Same v2 physics; new outer chrome (`.cin-flank` / `.cin-title` / `.cin-tick` / `.cin-action` vocabulary, gold + cyan palette, Cinzel-wordmark-only typography). Now public-facing as "Artemis II v2" in `projects.json` project36. **Canonical clone source for future cinematic instruments** at `Website/projects/mission-tracker/working/artemis2_v3_5_ui.html`.
- **Calibration testbed** — Node.js CLI with 2D parameter search, sweep modes, chronological diff table. Reusable.

## What Doesn't

- **v1's flyby altitude** is ~2× NASA's value (12,349 km vs. 6,546 km) — the start-angle calibration traded altitude precision for timing accuracy. v2 fixed this (0.05 km RMS).
- **v3.5 has SEO `<head>` block** (added in SA audit 2026-05-22) but the Vite-source clone template at `mission-tracker/working/artemis2_v3_5_ui.html` does **not**. Future missions cloned from it will inherit the gap. (SA backlog item.)
- **Image wiring inconsistency**: `project36` (v3.5 / "Artemis II v2") in `projects.json` points to `artemis-ii.png` (v1's image); `artemis-ii-v2.png` exists unused.
- **Post-mission ground-truth comparison not yet run.** Once NASA publishes the official flight reconstruction, v1 should be validated against it.

---

## Next Steps

| Priority | Action | Target |
|----------|--------|--------|
| 1 | Mission Tracker POD/PSR update (downstream from this POD revision) | 2026-06-02 |
| 2 | Patch `artemis2_v3_5_ui.html` clone source with SEO `<head>` block | 2026-06-15 |
| 3 | Swap project36 image wiring to `artemis-ii-v2.png`; real v2 screenshot capture | 2026-07-01 |

---

## Open Questions

1. Does v1 stay alive indefinitely as a "live-mission artifact" — preserved exactly as it was during the mission — or eventually retire to a static archive page?
2. When NASA publishes post-mission telemetry, does the three-body model match to within v1's own fidelity-indicator claims, or does post-hoc analysis reveal larger errors than the live model admitted?
3. Is the cinematic chrome vocabulary genuinely reusable for an *unmanned* mission (Mars Sample Return, etc.) or is "Mission" implicitly crewed in the chrome's visual language?

---

*Revision History:*

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-04-03 | Initial creation as "Orion Lab". Two-body physics. |
| 2.0 | 2026-04-05 | Renamed to Artemis II. Sun gravity, post-flyby TCM, NASA calibration. Shipped Flight Day 6. |
| 2.1 | 2026-04-06 | Tape gauges, fidelity indicators, callout labels, NASA livestream, mobile responsive. |
| 3.0 | 2026-04-16 | Mission concluded 2026-04-11. v2 physics track complete (0.05 km RMS vs Horizons). v2 UI track paused pending Acrylic HUD library. |
| 4.0 | 2026-05-26 | **v2 deployed at `/artemis-ii-v2/` on 2026-04-26.** **v3.5 LOCKED 2026-05-09** at `/artemis-ii-v3-5/` (public-facing as "Artemis II v2" in `projects.json` project36). v3.5 unblocked the UI track by inlining its own Cinematic chrome; the Acrylic HUD library is no longer a gating dependency. v3.5 is now the canonical clone source for future cinematic mission instruments. Status remains Complete; the project has stopped accumulating fundamental version changes. |

---

*This document provides orientation. For detailed analysis, see the Project Status Report (PSR).*
