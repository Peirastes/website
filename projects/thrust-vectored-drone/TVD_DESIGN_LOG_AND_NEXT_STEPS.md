# Thrust-Vectored Drone — Design Log & Resume-Here

**Status: PARKED (2026-06-27).** Finishing the **Aeropendulum** first — it's the *same* 1-DOF control problem and builds the exact competency this project needs (see §6).

Companion doc: **`TVD_MVP_Requirements.md`** (the full requirements + error budget). This file is the "where were we / what's next."

---

## 1. Where to resume (critical path)

The long pole is **control-loop competency**: can you close a 1-DOF attitude loop on a fresh FC? The airframe, the gimbal, and the rig all inherit that one skill.

**First action on resume:** 1-DOF TVC Test Rig, **task 1 = FC + sensor selection**, then **Phase A** (thrust-controlled angle).

**Two open decisions** (answer these and the rig task-1 spec — BOM + wiring + Phase-A loop derivation — can be written):
1. What **motor/ESC** is on hand, or spec one to the budget?
2. **Teensy 4.1** (own the control law) or a **real FC** (fly its firmware)?

> Note (2026-06-27): measuring the wine glass is **not** critical path — it refines budget numbers and is a 10-min bench job anytime before airframe sizing. Don't let it gate the control work.

## 2. Architecture (locked)

Three subsystems — all the **same 1-DOF platform-alignment control problem**:

1. **TVC airframe** — fly / hover / recover with *small body tilt* via thrust vectoring.
2. **Drink-Stabilization Gimbal** — 2-axis tray that points the cup's "up" along the measured effective-gravity vector (the actual no-spill defense), decoupled from the airframe.
3. **1-DOF TVC Test Rig** — prove the loop before flight: **Phase A** (throttle→angle PID, aeropendulum analog) **then Phase B** (servo-vectored thrust→angle, true TVC).

**Decision: do BOTH** airframe TVC *and* the stabilized tray — tray does fine spill protection, TVC keeps body excursions small + recovers bumps.

## 3. Key results (full detail in TVD_MVP_Requirements.md)

- No-spill ⇔ keep the **effective-gravity vector inside the freeboard cone**. **Brimful wine = worst case**; "brimful" is an asymptote (0 mm → 0° tolerance, infeasible) → design point **f = 3 mm → θ_spill ≈ 5.7°**; with slosh margin (~3–5 Hz), **budget ≤ 3° peak residual tilt**.
- The **gimbal carries the spill defense** (residual tilt = gimbal tracking error). Airframe limits: **accel ≤ 0.7 m/s², rate ≤ 60°/s, jerk-limited below slosh.**
- Bump spec: **Δv ≈ 0.3 m/s / 10° kick, settle < 1 s.**
- Payload ≈ **0.5 kg** (brimful wine + glass) → AUW ≈ 1.8–2.3 kg, **T/W ≥ 2.**
- **LiDAR avoidance is spill-bounded:** detect ≥ ~2 m out so braking decel stays within the spill budget (`d_stop = v²/2a`, scales as v²).
- Four numbers to measure later: glass radius `r`, fill freeboard `f`, slosh frequency, glass+wine mass.

## 4. Test-rig build plan (recommended)

- **Compute:** Teensy 4.1 — write the loop yourself, trivial SD logging, fast PWM/DShot. (Real ArduPilot/PX4 FC only if you want to fly its exact firmware.)
- **Sensor:** **AS5048A** magnetic absolute encoder on the pivot — 14-bit, no drift, no fusion. (IMU optional, only to rehearse the drone's estimator.)
- **Actuation:** representative drone motor + ESC (DShot); bench PSU with current limit + **hard kill switch**.
- **Phase-A control:** feedback-linearize the thrust map (`T ≈ k·u²` → command in thrust), add a **gravity feedforward** (`∝ sin θ`), then a PID/cascade on angle sees a near-linear double-integrator.
- **Phase B:** add a single-axis vectoring servo at ~fixed thrust; vectoring mixer + attitude PID.

## 5. Plant model sketch (Phase A, for the task-1 spec)

Arm pivots about one axis (angle θ), motor thrust `T` ⟂ arm at lever `L`:

```
J·θ̈ = T·L − m·g·d·sin(θ) − b·θ̇
```

- `T ≈ k·u²` (thrust ∝ rpm² ∝ ~throttle²) → invert the map so the loop commands `T` linearly.
- Gravity feedforward `T_ff = m·g·d·sin(θ)/L` cancels the `sin θ` term → PID sees ≈ `J·θ̈ = τ_cmd`.
- Identify `k`, `J`, `m·g·d`, `b` on the rig (step + free-decay tests).

## 6. Why the Aeropendulum comes first (and isn't a detour)

The **Aeropendulum** (portfolio: *Dynamic Control of an Aeropendulum*) **is** rig Phase A — a 1-DOF, thrust-controlled attitude loop with the same `sin θ` gravity term and the same `T ≈ k·u²` nonlinearity. Finishing it for real delivers:

- a working thrust-map linearization + gravity feedforward,
- a tuned PID/cascade on a 1-DOF pivot,
- the sensing + logging + safety workflow.

All of that **transfers directly** into the TVC rig (Phase A), the gimbal, and the airframe. So the aeropendulum is the foundation stone, not a side quest.

## 7. ETM state

**One** tracked project — **Thrust-Vectored Drone** (Projects domain), **paused 2026-06-27** pending the aeropendulum. Consolidated 2026-06-27 from three separate projects into one, with the three arcs as **sub-area task groups** (by subcategory), 32 tasks total:
- **Airframe** — 13 tasks (incl. LiDAR/avoidance)
- **Test Rig** — 10 tasks (Phase A → B)
- **Gimbal** — 9 tasks

Resume by un-pausing and starting at the **Test Rig** group's first task, "Spec rig + select the new flight controller" (§1).
