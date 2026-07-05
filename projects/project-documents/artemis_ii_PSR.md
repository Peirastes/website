# Project Status Report (PSR)

**Project:** Artemis II Orbital Trajectory Simulator (v1, v2, v3.5)
**Lead:** Cole Prather
**Report Date:** 2026-05-26
**Version:** v4.0 (v2 deployed 2026-04-26; v3.5 LOCKED 2026-05-09 — three live deployments)

---

## Executive Summary

The Artemis II project now spans three live deployments — v1 (live-mission tracker, single-file, 95 KB), v2 (engineering-reference 3D simulator at `/artemis-ii-v2/`, 0.05 km RMS vs Horizons), and v3.5 (Cinematic Tier reimagining at `/artemis-ii-v3-5/`, public-facing as "Artemis II v2" in `projects.json`). Built and shipped v1 in approximately 48 hours of active development (April 3–6, 2026) while the mission was in progress; Artemis II splashed down successfully on April 11, 00:07 UTC. The v2 physics rebuild completed concurrently; v2 was deployed publicly on April 26 with iPad/mobile layout, then re-imagined as v3.5 with cinematic chrome on May 9. The v3.5 LOCK established the **canonical Peirastes v2 chrome vocabulary** (`.cin-flank` / `.cin-title` / `.cin-tick` / `.cin-action`) and is now the clone source for all future cinematic instrument wrappers (Tip-Recover, Smoke Sim, Optics Lab, future missions).

**Post-2026-04-16 update (4/26–5/9):** v2 deployed publicly with mobile + iPad layout fixes; v3.5 superseded v2 as the production-facing entry. The Acrylic HUD library is no longer the gating dependency it was — v3.5 inlined its own chrome rather than waiting. Post-splashdown v1 cleanup (livestream button → "Mission Complete" badge, info panel update) landed 2026-04-26.

**Bottom Line:** Three deployments, one canonical chrome vocabulary, one engineering-grade physics track. The project has stopped accumulating fundamental version changes; the remaining work is downstream (Mission Tracker framework reuse, post-mission telemetry comparison when NASA publishes the official flight reconstruction).

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

---

## Post-Mission Update (April 7–16)

### Mission Outcome
Artemis II splashed down April 11, 00:07 UTC. The v1 simulator's predicted splashdown was ~10 minutes early — a 0.014% timing error over 9 days. The mission was a complete success (first crewed lunar flight since Apollo 17 in 1972).

### v2 High-Fidelity Rebuild (Physics Track)
A complete 3D rebuild was undertaken using real NASA Horizons data:

| Phase | Result |
|-------|--------|
| A — Burn data extraction | 5 burns canonicalized via state injection (TLI, OTC-3, RTC-1/2/3) |
| B — Chebyshev DE440 Moon | 0.46 mm Moon position max error (51 coefficients) |
| C — J2 + SRP perturbations | Cadence sweep proved residual is chaotic, not missing physics |
| D — Full mission simulator | **0.05 km RMS / 0.08 km max** vs Horizons |
| E — Atmospheric entry | 803 km off published target — Orion bank schedule not public |

Key insight: state injection (resetting spacecraft state to Horizons values at burn epochs) beat naive velocity differencing for small RTC burns. The cislunar gravity assist is chaotic — small errors near perilune amplify exponentially, making state injection essential.

Output: `artemis2_trajectory.json` — 12,844 samples at 1-min cadence, consumed by the pending UI phases.

### v2 UI Track — Resolved by v3.5 (May 2026)
The earlier blocking on the Acrylic HUD library was resolved by a different path than originally planned. Rather than wait for the library, v3.5 (2026-05-09) inlined its own cinematic chrome — same v2 lab frame + physics + JS, restyled. Phases G–I of the original plan are effectively superseded by the v3.5 deploy.

### v1 Remaining Tasks — Closed
Both post-splashdown ETM tasks completed 2026-04-26: NASA livestream button swapped for "Mission Complete" badge, info panel updated to reflect mission concluded.

---

## v2 Deployment + v3.5 Reimagining (2026-04-26 → 2026-05-09)

### v2 deployed (2026-04-26)
v2 went live at `/artemis-ii-v2/`. iPad layout fix (mission log + graph sizing for the smaller viewport) and mobile layout (vertical scroll panels, no horizontal clip) shipped same day. v2 is the engineering reference — `visible: false` in `projects.json` so it doesn't compete with the cinematic-styled public entry.

### v3 chrome-on-v2 attempt (2026-05-09 AM) — REJECTED
First attempt at applying cinematic chrome was an overlay on v2's existing header (`artemis2_v3_ui.html`). Failed for the reason most chrome-stacking attempts fail: doubled identity. PEIRASTES brand link in v2's header AND a new chrome wordmark; "Artemis II" in v2's header AND a new profile pip. The result read as two competing UIs occupying the same screen. Cole rejected. Lesson: when two pieces of chrome name the same thing, dissolve one.

### v3.5 fresh-start cinematic (2026-05-09 PM) — LOCKED
Pivoted to a fresh-start cinematic version (`artemis2_v3_5_ui.html`). Same v2 lab frame + physics + JS preserved verbatim; v2's header bar entirely removed; mission title floats centered between a left flank (PEIRASTES wordmark + version label, stacked) and a right flank (action button row only — no status pip). Final spec:

- **Palette:** neon amber `#ffae20` + cool cyan `#7dd6ff`. Earlier warm gold `#f0c060` was rejected as "too dull" for the engineering-display feel inside the instrument.
- **Typography:** Cinzel for PEIRASTES wordmark only (canonical brand). Orbitron 700 for instrument titles. Inter for UI prose. Share Tech Mono for numerical readouts (MET, gauge values).
- **Frame:** all chrome aligned to a shared 1.6rem inset on all four edges. Cartographic L-bracket corner ticks (universal site signature).
- **Components preserved with palette-shift:** tape gauges (recessed-channel depth), flight dynamics graph (glass slab with cyan + amber chromatic side-edges), mission log (v2 tabular layout), acrylic glass scrollbar (8 px chromatic-edged pill thumb). All v2 component depth retained — palette shifted.
- **Status pip removed** across all v3.5-pattern apps (initially in right flank; Cole's verdict: clutter).
- **Action buttons rectangular** (gradient face + inset bevel + 2 px transparent left-border + outer drop shadow). Round pills deprecated.

### Public-facing wiring
v3.5 is now project36 in `projects.json` titled "Artemis II v2" — same display name as the engineering-reference v2 because the public doesn't need the internal versioning. The Projects listing links to `/artemis-ii-v3-5/`. v1 remains live at `/artemis-ii/` listed as project30 (preserved as a live-mission artifact). v2 at `/artemis-ii-v2/` is hidden — engineering reference only.

### Propagation
v3.5 is the canonical clone source at `Website/projects/mission-tracker/working/artemis2_v3_5_ui.html`. The chrome pattern subsequently propagated to **eleven instruments** during the 2026-05-09 → 2026-05-13 v3.5 retrofit wave (Optics Lab, Smoke Sim, Collision Lab, Rotating Slot, Induction Lab, Capacitor Lab, KB Explorer, ECDO Watch, DSL, Electrostatics Lab, TE Lab), then to Tip-Recover (native, 2026-05-22). Style Guide v2.3 (2026-05-25) documents the pattern.

### Open work after v3.5
- The Vite-source clone template (`artemis2_v3_5_ui.html`) is missing the SEO `<head>` block that the deployed v3.5 wrapper now has. Future missions cloned from it will inherit the gap. (SA backlog item.)
- `project36` in `projects.json` references `artemis-ii.png` (v1's image); the existing `artemis-ii-v2.png` is unused. Cosmetic.
- Post-mission telemetry comparison still pending; NASA has not yet published the official flight reconstruction at PSR date.

---

## Appendices

### B. Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-07 | Initial PSR. v2 shipped April 6 (lunar flyby day). ~100 commits, 48 hours development. |
| 2.0 | 2026-04-07 | Added detailed Challenges section (Sun gravity, calibration coupling, mobile CSS, tape gauges, flyby altitude trade-off, panel alignment). Added Metrics, Key Decisions, Applicability sections. |
| 3.0 | 2026-04-16 | PM portfolio review. Mission concluded (splashdown 2026-04-11 00:07 UTC). Added Post-Mission Update: v2 physics track results (0.05 km RMS), state injection methodology, v2 UI track paused pending Acrylic HUD. Updated Executive Summary. v1 remaining tasks noted. |
| 4.0 | 2026-05-26 | **v2 deployed publicly** at `/artemis-ii-v2/` (2026-04-26) with mobile + iPad layout; v1 post-splashdown updates landed (Mission Complete badge, info panel update). **v3.5 LOCKED** (2026-05-09) at `/artemis-ii-v3-5/` — Cinematic Tier reimagining of v2, now public-facing as "Artemis II v2" in `projects.json` project36. Updated Executive Summary; rewrote v2 UI Track section (was "paused", now "resolved by v3.5"); added new section *v2 Deployment + v3.5 Reimagining* documenting the iteration arc (v3 chrome-on-v2 rejected → v3.5 fresh-start locked), final chrome spec, palette + typography choices, propagation to eleven other instruments. Updated v1 remaining tasks (closed). Style Guide v2.3 (2026-05-25) documents the canonical pattern. |

---

*This document provides detailed analysis. For quick orientation, see the Project Overview Document (POD).*
