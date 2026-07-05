# Power Stack: A Physics-Based Workout Program Builder & Tracker

## Project Orientation Document (POD)

**Author:** Peirastes  
**Version:** 0.1 — foundational architecture  
**Date:** 2026-03-29  
**Status:** Active development

---

## 1. Thesis

Muscular adaptation is a nonlinear dynamical system. The fitness industry treats it as linear ("add 5 lbs per week"), which works for beginners and fails for everyone else. This project applies the mathematical frameworks of circuit theory, control systems, and nonlinear dynamics to build a training program that is *predictive* rather than prescriptive — one that models the athlete's current state and computes the optimal next stimulus rather than following a static schedule.

The core claim: **if you model each muscle group's stimulus-recovery-adaptation (SRA) cycle as an impulse response of a damped second-order system, and you model the mesocycle trajectory as capacitor charging with diminishing returns, you can construct a training split that maximizes the integral of supercompensation across all muscle groups simultaneously.**

This is not metaphor. The math is the same math. The question is whether the parameters can be identified from real training data — and the Power Stack spreadsheet already demonstrates that they can.

---

## 2. The Physics

### 2.1 The RC Adaptation Model (Mesocycle Scale)

Within a single mesocycle (4-12 weeks), adaptation to a given stimulus follows:

```
G(t) = G_max · (1 - e^(-t/τ_adapt))
```

where:
- `G(t)` = cumulative adaptation (strength gain, hypertrophy) at time t
- `G_max` = maximum adaptation achievable at the current training stimulus (the asymptote)
- `τ_adapt` = adaptation time constant (varies by training status, muscle group, stimulus type)

This is identical to the voltage across a charging capacitor: `V(t) = V_max · (1 - e^(-t/RC))`.

**Key insight from the MRAM analogy (Figure 2):** Just as V_DD must reach V_DD(min) = 2.7V before MRAM writes are enabled, there exists a *minimum effective stimulus threshold* below which a training session does not produce meaningful adaptation. Sub-threshold sessions are the biological equivalent of write-inhibited states. The 400μs power-up time maps to the minimum recovery period before the next productive session.

**Diminishing returns are inherent to the model.** Early in a mesocycle, each session contributes substantially to G(t) because the exponential is far from saturation. As t → ∞, dG/dt → 0. This is why periodization exists: you must change the stimulus (increase V_max) to start a new charging curve, or deload (discharge) to allow fatigue to dissipate while adaptation persists.

**Fatigue accumulates on a shorter time constant:**

```
F(t) = F_max · (1 - e^(-t/τ_fatigue))    where τ_fatigue < τ_adapt
```

The τ mismatch between fatigue and adaptation is the entire basis for deloading. During a deload week, stimulus drops to ~30%. Fatigue decays as `F · e^(-t/τ_fatigue)` (fast), while adaptation decays as `G · e^(-t/τ_retain)` (slow, τ_retain >> τ_fatigue). The athlete emerges with less fatigue and nearly the same adaptation — a net performance gain.

### 2.2 The Impulse Response Model (Session Scale)

Each training session is an impulse δ(t) applied to a specific muscle group. The system response is *not* a simple RC charge — it is a damped second-order oscillation:

```
h(t) = A · e^(-ζω_n · t) · sin(ω_d · t + φ)
```

where:
- `A` = amplitude (proportional to session intensity and volume)
- `ζ` = damping ratio (training status — beginners are underdamped, advanced athletes are closer to critically damped)
- `ω_n` = natural frequency (intrinsic recovery rate of the muscle group)
- `ω_d = ω_n · √(1 - ζ²)` = damped natural frequency
- `φ` = initial phase

In practice, the SRA curve has three phases mapped to this response:

1. **Stimulus (t = 0):** The impulse. Performance drops acutely due to mechanical damage, metabolic depletion, and neural fatigue. This is the initial negative deflection.
2. **Recovery (0 < t < t_super):** The exponential return to baseline, governed by `e^(-ζω_n·t)`. Protein synthesis elevates. Glycogen replenishes. Neural pathways consolidate.
3. **Supercompensation (t_super < t < t_decay):** The overshoot. Performance temporarily exceeds baseline. This is the optimal window for re-stimulation.

The supercompensation window varies by muscle group (see §4.1) and by intensity. Higher intensity deepens the initial trough but also raises the supercompensation peak — at the cost of a wider recovery period.

### 2.3 The Polyphase Split Model (Weekly Scale)

In 3-phase AC power, three sinusoidal sources offset by 120° deliver constant net power to the load. No single phase is always "on" — the phase offset ensures that at any instant, at least one phase is near its peak.

The training split is the polyphase system. Each muscle group occupies a "phase" with its own SRA impulse response. The split is designed so that:

1. **At any point in the week, at least one muscle group is in its supercompensation window.** This means systemic recovery demand is distributed, not stacked.
2. **No two muscle groups with overlapping movement patterns are in their fatigue trough simultaneously.** (e.g., triceps recover before the next chest session, since bench press loads both.)
3. **The phase offset between groups is not equal** — it is proportional to each group's recovery τ. Large muscle groups (quads, back) have longer recovery periods and need wider phase spacing. Small groups (arms, side delts) recover quickly and can be re-stimulated with tighter spacing.

This is *not* a sinusoidal model — it is a staggered impulse response model. Each "phase" fires an impulse, and the responses overlap in time. The optimization problem is: **find the impulse timing that maximizes ∫ supercompensation(t) dt across all groups, subject to the constraint that total systemic fatigue remains below a threshold.**

### 2.4 Neural Phase Lead

The nervous system adapts faster than muscle tissue. In control theory terms, there is a **phase lead** in the neural transfer function relative to the hypertrophic transfer function. Early strength gains (weeks 1-4 for a new stimulus) are primarily neural: improved motor unit recruitment, rate coding, and intermuscular coordination. Hypertrophy lags by 2-4 weeks.

This has practical implications:
- Strength increases in the first mesocycle overestimate hypertrophic adaptation.
- Deloads should not be timed purely by strength plateaus — the neural system may plateau before the hypertrophic system has saturated.
- Periodization between "neural" (heavy/low-rep) and "metabolic" (moderate/high-rep) phases exploits the different τ values of these two adaptation pathways.

### 2.5 Aperiodicity and Long-Term Dynamics

While the weekly split provides a quasi-periodic structure, the long-term trajectory is fundamentally aperiodic. Reasons:

- **G_max shifts over time** as the athlete approaches genetic ceiling (the ultimate asymptote). Each successive mesocycle charges a smaller capacitor.
- **τ_adapt increases with training age.** Beginners: τ ≈ weeks. Intermediate: τ ≈ mesocycles. Advanced: τ ≈ macrocycles.
- **Sensitivity to initial conditions.** Stress, sleep, nutrition, hormonal state all modulate τ and G_max on timescales outside the training program's control. The system is weakly chaotic in the long term.
- **Bifurcation points.** At certain accumulated fatigue levels, the same stimulus that previously drove adaptation can instead drive overtraining — a qualitative state change, not a quantitative one.

Contrast with truly periodic biological rhythms: circadian rhythm (~24h), ultradian hormone pulses (~90min), menstrual cycle (~28d). These are clock-driven. Muscular adaptation is *event-driven* — the timing of the next response depends on the magnitude of the last stimulus and the current system state.

---

## 3. Existing Data Infrastructure

The Power Stack v1.1 spreadsheet provides the empirical foundation:

### 3.1 Current Maxes (as of latest entries, ~2025)

| Lift | 1RM | 5RM | Type |
|------|-----|-----|------|
| Deadlift | 455 | 405 | Conventional |
| Squat | 350 | 285 | Back |
| Bench | 275 | 225 | Flat |
| OHP | ~135 | — | Barbell |
| Row | ~225 | — | Barbell |

### 3.2 What the Spreadsheet Already Models

- **Weight → rep projection:** Linear and exponential regression models for predicting reps at a given weight (and vice versa). The exponential model uses `W(r) = W_0 · e^(k·r)` where k ≈ -0.031 is remarkably consistent across lifts (range: -0.028 to -0.036).
- **Strength / endurance / power decomposition:** Each lift is decomposed into a strength total (weighted by heavy reps) and an endurance total, with a power ratio.
- **PR history tracking:** Dated endurance snapshots showing progression over time — this is longitudinal data that could be used to estimate τ_adapt empirically.
- **Cross-over points:** The weight at which the athlete transitions from the "strength" to "endurance" domain, identified from the regression curves.
- **Fatigue coefficient estimation:** The exponential exponent k across lifts (Sheet1) provides a direct estimate of the fatigue rate — the rate at which performance decays as reps increase beyond the power zone.

### 3.3 What the Spreadsheet Does Not Yet Model

- **Time-series SRA tracking:** No session-by-session recovery state estimation.
- **Volume tracking:** Sets × reps × weight per session per muscle group is not aggregated.
- **Periodization structure:** No mesocycle/macrocycle planning layer.
- **Split optimization:** No model connecting the training split to the SRA dynamics.
- **Autoregulation:** No feedback mechanism adjusting intensity based on readiness.

---

## 4. The Training Program Architecture

### 4.1 Muscle Group Recovery Parameters

These are estimated from exercise science literature, calibrated to an intermediate-advanced lifter (Peirastes's training age and current maxes). They will be refined with personal data over time.

| Muscle Group | τ_fatigue (h) | τ_recovery (h) | Supercompensation Window (h) | Optimal Frequency |
|---|---|---|---|---|
| Quads | 22 | 48 | 56–96 | 2×/week |
| Hamstrings/Glutes | 20 | 44 | 48–84 | 2×/week |
| Back (lats, traps, rhomboids) | 20 | 40 | 48–80 | 2×/week |
| Chest (pecs) | 18 | 36 | 48–72 | 2–3×/week |
| Shoulders (all heads) | 14 | 28 | 36–56 | 2–3×/week |
| Biceps | 12 | 24 | 24–48 | 2–3×/week |
| Triceps | 12 | 24 | 24–48 | 2–3×/week |
| Core | 10 | 20 | 20–36 | 3–4×/week |
| Calves / Forearms | 10 | 20 | 20–36 | 3–4×/week |

### 4.2 The Recommended Split: 5-Day Upper/Lower Polyphase

**Design rationale:** Given the recovery parameters above and the goal of maximizing supercompensation coverage across all major groups, a 5-day rotation provides the best phase distribution:

```
Mon (Day 1):  Upper Push (chest, front delts, triceps)     — Phase A
Tue (Day 2):  Lower Compound (quads, hamstrings, glutes)   — Phase B
Wed (Day 3):  Rest / Active Recovery
Thu (Day 4):  Upper Pull (back, rear delts, biceps)        — Phase C
Fri (Day 5):  Lower Focused (deadlift pattern + weak points)— Phase B'
Sat (Day 6):  Full Upper (moderate intensity, all upper)   — Phase A' + C'
Sun (Day 7):  Rest
```

**Phase analysis:**
- **Chest** fires on Day 1 (primary) and Day 6 (secondary). Spacing: ~120h between sessions. Well within the 48–72h supercompensation window — the Day 6 session catches the tail end.
- **Back** fires on Day 4 (primary) and Day 6 (secondary). Spacing: ~48h. Tight but within the window for moderate-intensity work.
- **Quads** fire on Day 2 (primary). Single heavy stimulus per week is sufficient for an intermediate-advanced lifter doing compound movements, with indirect work on Day 5.
- **Hamstrings/Glutes** fire on Day 2 (squats — secondary) and Day 5 (deadlifts — primary). Spacing: ~72h. Dead center of their supercompensation window.
- **Arms** receive indirect work on every upper-body day and can tolerate the frequency. Direct arm work on Day 6 catches the supercompensation from Day 4's pulling.
- **Shoulders** receive indirect work on Day 1 (pressing), Day 4 (rear delts), and direct work on Day 6. High frequency matches their short τ.

### 4.3 Intensity Prescription by Goal

| Goal | Primary Rep Range | Intensity (% 1RM) | Sets/Muscle/Week | Rest Periods |
|---|---|---|---|---|
| Strength | 1–5 reps | 80–90% | 10–15 | 3–5 min |
| Hypertrophy | 6–12 reps | 65–80% | 15–22 | 1.5–3 min |
| Recomposition | Mixed (3–15) | 65–85% | 12–18 | 1–3 min |

### 4.4 Mesocycle Periodization (The Capacitor Charging Schedule)

Each mesocycle follows a volume ramp structured as an RC charge:

```
V(week) = V_start + (V_peak - V_start) · (1 - e^(-week / τ_meso))
```

Practical implementation for a 6-week mesocycle:

| Week | Volume Multiplier | Intensity | Character |
|---|---|---|---|
| 1 | 0.70× | Moderate | Introduction / re-sensitization |
| 2 | 0.80× | Moderate-High | Building |
| 3 | 0.90× | High | Pushing |
| 4 | 0.95× | High | Overreaching (approaching asymptote) |
| 5 | 1.00× | Very High | Peak (near V_max) |
| 6 | 0.45× | Low-Moderate | Deload (discharge cycle) |

The deload is the "discharge" — fatigue drops rapidly (short τ_fatigue), adaptation is retained (long τ_retain). The athlete exits the mesocycle with a net performance increase, and the next mesocycle begins a new charging curve at a higher baseline (higher G_0).

---

## 5. Application Architecture (Future Work)

### 5.1 Target Platform

Web application (React + TypeScript) deployable to peirastes.com, with potential for mobile companion. Offline-first with local storage — no server dependency for core tracking.

### 5.2 Core Modules

1. **Program Builder** — Configure training goal, available days, equipment, and generate an optimized split based on the polyphase model. Allow manual overrides.
2. **Session Logger** — Log sets/reps/weight per exercise per session. Compute session volume, intensity, and estimated stimulus magnitude.
3. **SRA Tracker** — Per-muscle-group recovery state estimation. Visual display of where each group sits on its SRA curve at any given time. "Readiness" indicator.
4. **Mesocycle Planner** — Plan mesocycles with automatic volume ramping (RC charge model). Detect when the current mesocycle is approaching saturation (dG/dt ≈ 0) and recommend a deload or stimulus change.
5. **Analytics Dashboard** — Long-term progression tracking. Import from existing Power Stack spreadsheet data. Regression models for 1RM estimation. Fatigue coefficient trending.
6. **Autoregulation Engine** — Given today's readiness state (estimated from SRA model + user-reported RPE/sleep/stress), adjust prescribed intensity and volume. The system should suggest, not dictate.

### 5.3 Data Model (Draft)

```
Athlete
  ├── profile (bodyweight, training_age, goals)
  ├── maxes[] (lift, weight, reps, date, type)
  └── programs[]
        ├── mesocycle (start_date, duration_weeks, goal, volume_model)
        ├── split[] (day_of_week, focus, exercises[])
        └── sessions[]
              ├── date, day_label, readiness_score
              └── sets[]
                    ├── exercise, weight, reps, rpe, rest_s
                    └── computed: volume_load, estimated_1rm, stimulus_magnitude
```

### 5.4 Integration with Power Stack

The existing spreadsheet data should be importable. Key mappings:
- Bench/Deadlift/Squat/OHP/Row Data sheets → maxes[] and session history
- Exponential coefficients → initial fatigue model parameters
- PR history dates → longitudinal data for τ_adapt estimation

---

## 6. Philosophical Grounding

### 6.1 Epistemology

This project applies the same epistemic framework as the PSCPR rubric and the AI Agent Philosophical Briefing:

- **Null hypothesis thinking:** The default assumption is that any given training intervention has no effect. The burden of evidence falls on the claim that a specific split, volume, or intensity produces superior results. The model should help detect signal from noise in personal training data.
- **Ethical skepticism:** The fitness industry is rife with unfalsifiable claims, survivorship bias, and argument from authority. This system trusts data over dogma. If the athlete's SRA data contradicts the literature's recovery estimates, the personal data takes precedence.
- **Epistemic humility:** The models are approximations. RC charging is not muscle physiology — it is a useful abstraction whose parameters must be continuously updated from observation. The system should always surface its uncertainty.

### 6.2 What This Is Not

This is not a replacement for a coach. It is an analytical instrument — like an oscilloscope for training load. It shows you the waveform. You still decide what to do with it.

---

## 7. Open Questions

1. **Parameter identification from training logs.** Can τ_fatigue and τ_recovery be estimated from session-to-session performance variation? This requires dense enough data (RPE or velocity on every working set).
2. **Interaction terms.** Muscle groups are not independent systems. Squats fatigue the back; bench fatigues the triceps. The model needs coupling coefficients.
3. **Diet integration.** Caloric state modulates both τ_adapt (slower in a deficit) and G_max (lower ceiling in a deficit). Phase 2 of this project.
4. **Sleep/stress as modulators.** These shift the transfer function parameters in real time. How to incorporate them without requiring burdensome self-reporting?
5. **Long-term model.** The capacitor model works within a mesocycle. Across mesocycles, is there a higher-order model? Possibly: each mesocycle charges a progressively smaller capacitor (approaching genetic ceiling), with the maximum charge rate decreasing logarithmically with training age.
6. **The exponential consistency.** The k ≈ -0.031 average across all five lifts in the Power Stack data is striking. Is this a genuine invariant of human neuromuscular fatigue, or an artifact of the measurement method? Worth investigating with more data points.

---

## 8. Next Steps

1. **Review and refine this document.** Correct any physics, adjust the split for personal preferences and equipment availability.
2. **Define the PSR (Project Status Report)** for tracking implementation progress.
3. **Prototype the SRA tracker** as a standalone interactive widget — extend the version built in the initial conversation.
4. **Design the session logging interface** — this is the data collection bottleneck. It must be fast enough to use between sets.
5. **Import Power Stack data** and attempt empirical τ estimation from the PR history timeseries.
