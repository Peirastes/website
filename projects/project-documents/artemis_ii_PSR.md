# Project Status Report (PSR)

**Project:** Artemis II Orbital Trajectory Simulator
**Lead:** Cole Prather
**Report Date:** 2026-04-07
**Version:** v2.1 (shipped April 6, 2026)

---

## Executive Summary

Built and shipped a real-time orbital trajectory simulator for NASA's Artemis II mission in approximately 48 hours of active development (April 3–6, 2026) while the mission was in progress. The simulator computes Orion's trajectory from first principles using three-body Runge-Kutta integration, calibrated against NASA mission control data to within 3 minutes of the published lunar flyby time. Deployed as a single HTML file at peirastes.com/artemis-ii on Flight Day 6 — the day of the lunar flyby.

---

## Timeline

| Date | Milestone |
|------|-----------|
| Apr 1 | Artemis II launches. v1 already live with two-body physics. |
| Apr 3 | Renamed from "Orion" to "Artemis II". Mobile layout optimization begins. URL moved to /artemis-ii/. |
| Apr 5 | Discovered 20-hour perilune timing error. Built calibration testbed. Added Sun gravity (6 lines). Error dropped from 32,569s to 2,877s (11× improvement). Added post-flyby TCM. Peirastes instrument aesthetic applied. |
| Apr 6 (FD6) | Scrolling tape gauges, LUNAR distance gauge, fidelity indicators, callout labels, info panel rewrite, crew tribute, NASA livestream button. v2 shipped. Lunar flyby occurs ~6 PM CDT. |
| Apr 7 | Documentation (POD, PSR, social posts). Final card description update. |

Total commits: ~100 across 4 days.

---

## Challenges & Struggles

### 1. The 20-Hour Error (Sun Gravity)

**The problem:** v1's two-body model (Earth + Moon) showed the lunar flyby on April 5. NASA published April 6. A full day off.

**Root cause:** The Sun's tidal acceleration on a spacecraft at lunar distance is ~3×10⁻⁵ m/s² — seemingly negligible. But integrated over 5 days of translunar coast, it accumulates to ~13 m/s of velocity perturbation. That's enough to shift the perilune arrival by hours. In a 2-body model, this force doesn't exist.

**The fix:** Six lines of code in `gravAccel()` adding the Sun as a third body with tidal correction (non-inertial Earth-centered frame). The perilune error dropped from -19h 56m to -2m 20s.

**The lesson:** In orbital mechanics, there are no small forces over long timescales. The Sun's influence is 0.003% of Earth's gravity at the spacecraft, yet it's the difference between "flyby today" and "flyby tomorrow." In a real mission, this would be the difference between hitting the re-entry corridor or missing Earth entirely.

### 2. The Calibration Coupling Problem

**The problem:** The trajectory depends on 5 coupled parameters: HEO apogee, TLI delta-v, start angle offset, flyby target time, and HEO burn time. Changing any one breaks the others. The "optical alignment" approach (tune chronologically) failed because Mirror 5 (HEO burn), Mirror 7 (TLI Δv), and the start angle are geometrically inseparable.

**What we tried:** Single-parameter sweeps, 2D grid search, fixed-time TLI mode, various HEO apogee values. Many configurations produced trajectories that either missed the Moon entirely (perilune altitude 230,000+ km) or slingshot past it without returning (max distance 700,000+ km).

**What worked:** A 2D grid search over (TLI_DV, START_ANGLE_OFFSET) space, evaluated against both perilune time AND splashdown success. The sweet spot was narrow: TLI_DV=0.335 km/s, START_ANGLE_OFFSET=3.145 — a configuration that produces a close-ish flyby (12,349 km vs NASA's 6,546 km), correct timing (-2m 20s), AND a return trajectory that splashdowns within 10 minutes of NASA's projection.

**The lesson:** Orbital trajectory calibration is a constrained optimization problem with qualitative regime changes. Small parameter changes can flip the trajectory between "close flyby + return" and "distant flyby + escape." The calibration testbed (Node.js, CLI sweeps, diff tables) was essential — without it, we'd have been blind-tuning.

### 3. Mobile CSS vs JavaScript Positioning

**The problem:** The telemetry and Flight Dynamics panels were invisible on mobile for over an hour of debugging. They existed in the DOM (confirmed via JS), the mobile breakpoint was firing (confirmed via viewport overlay), but the panels wouldn't appear.

**Root cause:** CSS media query declarations with `!important` were overriding inline styles set by JavaScript's `setAttribute('style', ...)`. Specifically, `left:8px !important;right:8px !important;width:auto !important` in the media query beat the JS-computed pixel positions, forcing both panels to full width and stacking on top of each other — effectively invisible because one obscured the other.

**The fix:** Removed all `!important` declarations from the mobile telemetry/graph CSS and let JavaScript have full control via `setAttribute('style', ...)` with `position:fixed`. This was the nuclear option but the only reliable cross-browser approach.

**The lesson:** On mobile, if you're using JS to position panels dynamically, don't also have CSS media queries with `!important` targeting the same elements. One system should own positioning — mixing CSS and JS positioning authority is a specificity war you'll lose hours debugging.

### 4. Scrolling Tape Gauge Label Alignment

**The problem:** The tape labels (0, 2, 4, 6... on the VEL tape) showed the wrong values next to the readout. At velocity 0.6 km/s, the tape showed "11" and "12" next to the center window.

**Root cause (first bug):** Labels were indexed as `labels[length - 1 - idx]` which reversed the scale — max values at the bottom (frac=0) instead of the top. A leftover from the old static tape layout.

**Root cause (second bug):** ALT and LUNAR tapes used log-scale frac formulas in `updateGauges` but the tape labels were placed at linearly-spaced positions. The label "100" was at linear position 0.2 but the scroll moved to log position 0.35 for the same value — mismatch.

**The fix:** Each label now specifies its exact frac value computed with the SAME formula used in `updateGauges`. For ALT: `{frac: logFrac(100, 500000), label: '100'}`. The label position and the scroll position use identical math.

**The lesson:** When a display element (label) and a computation (scroll position) must agree, they should share the same function — not independently implement the same formula.

### 5. The Flyby Altitude Trade-Off

**The problem:** We could match NASA's perilune timing (within 3 minutes) OR NASA's flyby altitude (6,546 km), but not both simultaneously. The 2-body + Sun model doesn't have enough geometric degrees of freedom.

**What happens:** At TLI_DV=0.325 with START_ANGLE_OFFSET=3.06, altitude matches NASA (6,961 km) but timing is -4h 16m off. At TLI_DV=0.335 with START_ANGLE_OFFSET=3.145, timing is -2m 20s but altitude is 12,349 km (1.9× NASA).

**Decision:** Prioritize timing over altitude. For a live-tracking simulator during an active mission, showing "Lunar flyby" on the correct day matters more than the exact closest-approach distance. The altitude discrepancy is noted in the fidelity indicators.

**The lesson:** In constrained models, prioritize the dimension your users care about most. For a mission tracker, that's timing. For a scientific analysis tool, it would be geometry. The fidelity indicators let you be transparent about the trade-off instead of hiding it.

### 6. Panel Alignment on Mobile

**The problem:** The telemetry and Flight Dynamics panels had matched heights in CSS (`height: Xpx`) but their bottoms didn't visually align on mobile.

**What we tried:** Shared `height` property with `box-sizing: border-box`, matching `display:flex`, hiding section labels. None worked.

**The fix:** Removed the `height` property entirely. Both panels use identical `top` and `bottom` values instead (`top: 78vh; bottom: 8px`). The browser computes height from the anchors — guaranteed pixel-perfect alignment because there's no computed value to differ.

**The lesson:** For two panels that must align, anchor them to the same edges (top + bottom) rather than giving them computed heights. Heights can diverge due to content, padding, or subpixel rounding. Shared anchors can't.

---

## Metrics

| Metric | Value |
|--------|-------|
| Development time | ~48 hours (Apr 3–6) |
| Total commits | ~100 |
| Final file size | ~95 KB (single HTML) |
| Dependencies | KaTeX (CDN), Google Fonts (CDN) |
| Perilune timing error | -2m 20s (vs NASA) |
| Splashdown timing error | -10m 10s (vs NASA) |
| Weighted mean abs error | 2,877s (v1 baseline: 32,569s) |
| Improvement factor | 11× |
| Physics model | 3-body RK4 (Earth + Moon + Sun) |
| Integration timestep | 10 seconds |
| Trajectory points | ~13,000 |
| Tape gauges | 4 (VEL, ALT, LUNAR, Φ) |
| Mission log events | 14 (including 3 canceled OTCs) |
| Breakpoints | 768px (mobile), 500px (landscape) |

---

## Key Decisions

1. **Single HTML file** — no build tools, no backend. Maximizes portability and eliminates deployment friction. Trade-off: harder to maintain at 95KB.
2. **Physics from scratch** — compute trajectory on page load rather than consuming NASA ephemeris. Slower to load but the trajectory responds to parameter changes and the model is self-contained.
3. **Transparent fidelity** — show confidence ratings and limitations rather than hiding them. Scientifically honest; builds trust with technically literate users.
4. **Timing over altitude** — when the model can't satisfy both constraints, prioritize the dimension that matters for a live mission tracker.
5. **Ship during the mission** — the simulator's value is highest while Artemis II is flying. Shipping v2 on flyby day (with known limitations documented) was the right call vs. waiting for perfection.

---

## Applicability to Future Projects

### Patterns to reuse:
- **Calibration testbed** — standalone CLI tool for parameter sweeps against reference data. Should be standard for any physics sim.
- **Fidelity indicators** — transparent confidence ratings with hover explanations. Applicable to any model-driven visualization.
- **Scrolling tape gauges** — reusable SVG instrument component. Could become a shared library.
- **`stackPanels()` dynamic layout** — JS-measured panel positioning with consistent gaps. Solves the CSS-specificity problem for complex responsive layouts.
- **`drawCallout()` canvas labels** — leader lines + background + fan-out overlap avoidance. Reusable for any data visualization.

### Mistakes to avoid:
- **Don't mix CSS `!important` with JS inline styles** on the same elements. Pick one system.
- **Don't use CSS custom variables (`var(--amber)`) in canvas `fillStyle`** — canvas doesn't resolve them.
- **Don't use `roundRect()`** — not supported in all browsers/WebViews. Use `fillRect`.
- **Calibrate parameters together, not independently** — orbital mechanics parameters are coupled. Grid search over 2+ dimensions.
- **Test mobile on the actual device** (or accurate emulator) from day one, not after the desktop version is "done."

---

*Next report: post-mission validation against NASA telemetry data (target: late April 2026).*
