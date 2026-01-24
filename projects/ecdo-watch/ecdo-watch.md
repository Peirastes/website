---
title: "ECDO / Tau Watch — Project Synthesis"
subtitle: "Daily falsification-first geophysics observer (Tau Point approach detection)"
date: 2026-01-24
---

## 1) Mission and framing

You’re building a **daily-updated “ECDO / Tau Watch” dashboard** for your website (Quarto `.qmd` rendered to HTML) whose purpose is **early warning and structured falsification** of an ECDO-like internal Earth event (the “approaching Tau Point”), **not prediction** and not narrative confirmation.

This is an **inference pipeline**, not a forecasting engine. Its primary job is to reduce false positives by:

- **Gating** (confound control)
- **Long baselines** (avoid “wiggle-reading”)
- **Robust features** (not raw plots)
- **Cross-channel coherence** (agreement or it doesn’t count)

---

## 2) Objective

Create an **inference pipeline** that watches for **internal Earth-system anomalies** (rotation/orientation, mass distribution, ground magnetic-field behavior) while **aggressively controlling for confounds** (solar-driven geomagnetic storms), so you can identify a **credible, low–false-positive marker/index** that an ECDO-like process *could be underway*.

---

## 3) Application (what the app does)

### Daily update workflow
- Runs a **daily updater script** that:
  - pulls authoritative sources (space weather, EOP, magnetometers, C20)
  - transforms raw feeds into **signal-extracted indicators** (robust z-scores, composites, coherence)
  - writes charts + a `summary.md` “status card” for the Quarto page

### Web delivery
- Renders a Quarto/HTML dashboard organized as a **5-step critical path**.
- The dashboard is intended to be updated **daily** and read in minutes.

---

## 4) The 5-step logic (core design)

### Step 1 — External forcing gate (confound control)
Uses Kp and Dst to decide whether magnetospheric disturbance is externally driven (solar forcing).  
**Rule:** if disturbed → suppress internal inference by default.

### Step 2 — Earth orientation/rotation (EOP)
Tracks LOD and polar motion and flags unusual behavior relative to multi-year baselines using robust anomaly metrics.

### Step 3 — Mass distribution proxy (C20; lagged)
A slow confirmatory channel (not real-time). Used to test longer-window consistency.

### Step 4 — Ground magnetic residuals (multi-station)
Converts magnetometer signals into station-normalized residuals and a composite, with quiet-day weighting.

### Step 5 — Inference layer (coherence + watch score)
Only after Step 1 is quiet:
- tests cross-channel agreement (MAG ↔ EOP)
- summarizes into an **experimental** watch score (explicitly “analysis only”)

---

## 5) Governing philosophy (how it should behave)

- **Epistemic humility:** assume benign explanations first.
- **Deontological doubt:** moral duty to avoid false positives.
- **Ontological confidence:** reality has structure; test it with gating + baselines + coherence.

Operational translation:
- A “signal” must survive the null hypothesis and confounds before it is allowed to influence a watch level.
- Single-channel anomalies are *diagnostic*, not *decisive*.
- Quiet-day behavior is weighted more than storm-day behavior.

---

## 6) What we learned (hindsight)

### A) “Laundry list” failure mode
Raw chart dumps without interpretation are not actionable.  
Fix: restructure the page as a **stepwise inference sequence** with explicit jobs, null interpretation, and “what matters” statements.

### B) Baseline length matters
Short windows (e.g., 90d) produce false narratives.  
Fix: add **long baselines** (e.g., 10-year EOP; multi-year Kp context) and require that “signals” persist when baselines expand.

### C) Data plumbing is half the project
Two key failure classes were identified and fixed:
1. **USGS magnetometer parsing**: IAGA2002 output contains `BOUH` plus `NUL` columns; naive parsers read `99999` and drop everything.
2. **Asset path mismatches**: images written to `assets/` while the page referenced `assets/charts/` (or vice versa).

Result: the pipeline now has a proven “it can run daily and render” baseline.

---

## 7) Rebuild-from-scratch plan of attack (hindsight-informed)

This is the recommended path if rebuilding cleanly.

### Phase 0 — Non-negotiables and success criteria
**Success =** in one glance:
- “Is inference allowed today?”
- “If yes, are internal channels cohering beyond baseline?”
- “If no, why (confound / missing data / insufficient quiet-day sample)?”

### Phase 1 — Architecture that prevents recurring breakage
**Canonical output rule**
- All charts go to: `assets/charts/`
- Quarto references: `assets/charts/*.png` only
- `summary.md` + `summary.json` live at `assets/`

**Modular pipeline rule**
Each step/module outputs:
- status (OK/WARN/FAIL)
- freshness (age)
- data table (tidy)
- extracted features (z/composite)
- plots (filenames)
- notes (human-readable)

### Phase 2 — Minimal vertical slice MVP (end-to-end)
Build only:
- Step 1 gate + Step 2 EOP + summary card
- long baselines and robust z-scores
Stop only when daily runs are stable.

### Phase 3 — Add MAG (Step 4) with a robust single-source implementation
Start with USGS only:
- request IAGA2002
- select `<STATION>H` column explicitly
- daily aggregation + robust station normalization
- multi-station composite using a robust aggregator (median > mean)

### Phase 4 — Add coherence diagnostics (Step 5) *before* fancy scoring
Add:
- quiet-day scatter (MAG vs EOP)
- rolling quiet-day correlation (30d) with required N≥10 quiet days in window
- quiet-day sample counts always displayed

### Phase 5 — Add C20 as lagged confirmatory (Step 3)
Treat as:
- not real-time
- sanity check over longer windows
- optional when source is stale/missing (do not break the daily run)

### Phase 6 — Backtesting + rarity percentiles (to earn “watch levels”)
Before enabling any alerting:
- compute historic distributions for composites and coherence on quiet days
- report percentiles (“today is 96th percentile vs 2010–2025 quiet days”)
- replace arbitrary thresholds with tested rarity gates

---

## 8) Key implementation rules (carry-forward)

1. **Join by UTC day**, not timestamp, for gate logic (`floor('D')`).
2. **Never treat storm-day magnetometer anomalies as internal evidence**.
3. **Prefer robust features** (median/MAD z-scores; medians across stations).
4. **Always show sample size** for coherence metrics (N quiet days).
5. **Degrade gracefully**: missing Step 3/4 should not break Step 1/2.
6. **One canonical chart path** to prevent invisible output.

---

## 9) Bottom line

This app is a **daily, falsification-first geophysics observer** designed to produce a **disciplined, low-noise monitoring view** of whether internal dynamics consistent with an ECDO-like process are emerging—by requiring **quiet-day gating**, **baseline-normalized anomalies**, and **cross-channel coherence** before anything can be treated as a meaningful “watch” signal.

The rebuild plan focuses on: **robust plumbing, long baselines, explicit null interpretation, and coherence with sample-size transparency**—so the dashboard becomes an evidence filter rather than a chart gallery.
