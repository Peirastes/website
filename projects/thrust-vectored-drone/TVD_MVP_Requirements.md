# Thrust-Vectored Drone — MVP Requirements & Error Budget

**Project:** Thrust-Vectored Drone (TVD) — the "robot waiter"
**Rev:** 0.1 (first pass, 2026-06-27) — numbers below are **engineering estimates to be replaced by measurement** where noted.
**Author:** Cole (Engineer hat)

---

## 1. Mission (MVP)

A compact drone that:

1. **Holds station** at bar-top height (~1.0–1.2 m) in a "standby" hover.
2. **Transports a full glass** to a guest at **≤ human walking pace (≈ 1.4 m/s)**.
3. **Recovers from a bump/jostle** (person or object) and **resists obstacles** in a cluttered bar.
4. Does all of the above **without spilling a drop.**

**Single binding success metric: no spill.** Everything else (speed, control bandwidth, sizing, sensing) is derived from it.

**Worst-case drink (design point):** a **brim-full glass of wine.** This is deliberately the hardest case — see §2.

---

## 2. The Spill Criterion → Freeboard Angle

A drink does not spill while the **net (effective) acceleration vector** `g_eff = g − a` (gravity minus the vehicle/payload lateral acceleration) stays pointed *into the glass*, within the cone set by how full it is.

For a glass of surface radius `r` with the liquid sitting a height `f` (**freeboard**) below the rim, the static surface can tilt — relative to the glass — by:

```
θ_spill = atan( f / r )
```

before liquid crosses the rim. Representative wine glass, surface radius **r ≈ 3 cm** (MEASURE the actual glass at the fill line):

| Freeboard f | θ_spill |
|---|---|
| **0 mm (literally brimful)** | **0° — uncontrollable** |
| 2 mm | 3.8° |
| **3 mm (design point)** | **5.7°** |
| 5 mm | 9.5° |
| 8 mm | 14.9° |
| 10 mm | 18.4° |

**Key consequence — "brimful" is an asymptote, not a setpoint.** At literally 0 mm freeboard, *any* residual tilt spills, which no real controller can guarantee. So we define a **practical worst case: a near-brimful pour with f = 3 mm** (about a meniscus below the rim) → **θ_spill ≈ 5.7°.** If the brand of glass / pour is different, re-read the table.

**Slosh dynamic margin.** The liquid is not rigid — it has a fundamental sloshing mode at roughly

```
f_slosh ≈ (1/2π)·√( g·1.841/r · tanh(1.841·h/r) ) ≈ 3–5 Hz   (r≈3 cm)   [MEASURE]
```

A transient or a correction with energy near that band produces a **peak surface excursion 1.5–2× the static tilt.** So design to a fraction of θ_spill:

> **Spill budget (design): keep peak residual liquid-surface tilt ≤ 3°** (≈ ½ of θ_spill, reserving the rest for slosh peaks).

The "residual liquid-surface tilt" is the angle between the **tray/glass normal** and **g_eff**. With the stabilized gimbal (§5.3) tracking g_eff, this residual *is the gimbal's tracking error* — which is why the gimbal, not the airframe, is the primary spill defense.

---

## 3. Motion Error Budget (the ≤ 3° allocation)

| Contributor | Budget | Notes |
|---|---|---|
| Gimbal static/trim alignment error | ≤ 1.0° | DC calibration of tray-normal vs accel vector |
| Gimbal dynamic tracking lag (maneuvers + bumps) | ≤ 1.5° | within control bandwidth; grows with g_eff slew rate |
| Mechanical (bearing friction, backlash, flex) | ≤ 0.5° | low-friction bearings, counterbalanced axes |
| **Total residual (RSS ≈ 1.9°, worst-case sum 3.0°)** | **≤ 3°** | leaves slosh dynamic margin to θ_spill |

The **airframe** doesn't appear directly in this table — if the gimbal decouples perfectly, body attitude doesn't spill. The airframe enters as **how fast it forces g_eff to move**, which sets how hard the gimbal has to work:

- **Cruise lateral acceleration ≤ 0.7 m/s²** → g_eff swings by `atan(0.7/9.81) ≈ 4°` — slow enough for the gimbal to track within budget. (Reach 1.4 m/s over ≥ 2 s.)
- **Body angular rate ≤ ~60 °/s** and **jerk-limited** trajectories — keep commanded motion content **below f_slosh** so the airframe never injects the slosh frequency through the gimbal.
- The gimbal closed-loop **bandwidth must exceed the maneuver content** (a few Hz) yet be **shaped (rate/jerk limit or notch) to avoid pumping the ~4 Hz slosh mode.**

---

## 4. Disturbance / Bump Spec

Define the disturbance the system must survive without spilling:

- **Nominal bump:** a lateral nudge imparting **Δv ≈ 0.3 m/s** to the airframe, or an **attitude kick of ≈ 10°** to the body.
- **Requirement:** during recovery, **peak residual liquid tilt stays ≤ θ_spill (5.7°)** and **settles < 1 s**, no overshoot beyond budget.
- This sets the **bandwidth target for both loops**: the airframe TVC must arrest the body excursion with bounded overshoot, and the gimbal must hold the tray on g_eff throughout the transient.

> The bump spec is what makes "recovers if jostled" quantitative. Validate it on the **1-DOF TVC Test Rig** (airframe loop) and the **gimbal tilt/bump platform** (payload loop) before integration.

---

## 5. Subsystem Requirements

### 5.1 Airframe (Thrust-Vectored Drone)
- **Thrust-vectoring** so horizontal force / disturbance rejection happens with **small body tilt** → small, fast attitude excursions (the spill-friendly way to move).
- Attitude-loop bandwidth sufficient to meet §4 bump recovery.
- Accel/rate/jerk limiting per §3 baked into the trajectory generator.

### 5.2 Payload mass & propulsion sizing
- **Worst-case payload:** brim-full large wine glass + stemware ≈ **0.5 kg** [MEASURE actual]; plus the gimbal mechanism ≈ 0.2–0.3 kg → **payload assembly ≈ 0.7–0.8 kg.**
- **Tension to flag:** "smallish" + a 0.5 kg liquid payload + a 2-axis gimbal pulls AUW up. Estimate **AUW ≈ 1.8–2.3 kg.**
- **Thrust-to-weight ≥ 2** (for TVC authority + bump rejection) → **total thrust ≈ 36–46 N** → ~9–11 N/motor (quad). Size motors/props/battery to that, then check endurance for a serving cycle (target ≥ a few minutes hover + transport).

### 5.3 Drink-Stabilization Gimbal (the no-spill subsystem)
- **2-axis (pitch + roll)** — yaw is irrelevant (axisymmetric glass).
- Points the **tray normal along measured g_eff** (accel + gyro fusion), decoupled from the airframe.
- Tracking error budget per §3 (≤ ~1.9° RSS). Bandwidth above maneuver content, shaped to avoid slosh.
- Secure cup retention; counterbalanced about both axes to minimize servo torque.

### 5.4 Sensing & Obstacle Avoidance (LiDAR)  ← new in this rev
A bar is cluttered and **dynamic** (people, the guest's reaching hand, bottles, the bar edge). Add ranging for **obstacle detection + avoidance + geofencing.**

- **Sensor options:**
  - **2-D 360° LiDAR** (e.g. RPLIDAR-class, ~12 m, ~0.1 kg) — horizontal obstacle ring; lightweight, MVP-friendly.
  - **Solid-state multi-zone ToF** (e.g. VL53L5CX) — very light proximity, good as a supplement for the vertical/under directions and the bar edge.
  - (3-D solid-state ToF camera later if vertical clutter demands it.)
  - MVP lean: **2-D LiDAR for the horizontal plane + a down/edge ToF.**
- **Critical coupling — avoidance must obey the spill budget.** An emergency stop cannot brake harder than the drink allows. With `v = 1.4 m/s` and `a_max = 0.7 m/s²` (§3), the gentle stopping distance is:

```
d_stop = v² / (2·a_max) = 1.4² / (2·0.7) ≈ 1.4 m
```

> **Derived requirement: detect obstacles and begin braking ≥ ~2 m out** (1.4 m stop + sensing/planning latency margin) so the avoidance maneuver itself stays within the spill envelope. **The drink, not the motors, sets the max deceleration** — so faster cruise demands proportionally longer detection range (`d_stop ∝ v²`).
- **Failsafe:** if an obstacle appears inside the gentle-stop distance, the safe action is a **spill-bounded decel to hover-in-place**, not a hard dodge.

### 5.5 1-DOF TVC Test Rig
- Proves the airframe control loop (Phase A thrust-controlled, then Phase B vectored) and the bump spec on a single axis before flight. Same control problem as the gimbal and the aeropendulum.

---

## 6. Safety Case (operating near people with liquid)
- **Ducted or guarded props** — mandatory; bound max blade kinetic energy.
- **Geofence / keep-out** via the LiDAR; hard altitude cap.
- **Failsafe ladder:** lost link / low battery / fault → controlled descent to a safe zone or spill-bounded hover-and-hold.
- **Kill switch** + current limiting on the bench and in flight.

## 7. Performance Targets (summary)
| Parameter | Target |
|---|---|
| Hover height | 1.0–1.2 m (bar-top) |
| Transport speed | ≤ 1.4 m/s (walking pace) |
| Cruise lateral accel | ≤ 0.7 m/s² |
| Peak residual liquid tilt | ≤ 3° (θ_spill ≈ 5.7° @ 3 mm freeboard) |
| Bump survived | Δv ≈ 0.3 m/s / 10° body kick, settle < 1 s |
| Obstacle detection range | ≥ 2 m @ 1.4 m/s (scales as v²) |
| Worst-case payload | ≈ 0.5 kg (brim-full wine + glass) |
| Thrust-to-weight | ≥ 2 |

---

## 8. Assumptions to Replace With Measurement
1. Wine-glass surface radius `r` at the fill line (assumed 3 cm).
2. Design freeboard `f` (assumed 3 mm) — pick the actual served fill.
3. Slosh fundamental `f_slosh` (assumed 3–5 Hz) — measure on the real glass.
4. Glass + wine mass (assumed 0.5 kg).
5. Bump magnitude to spec against (assumed Δv 0.3 m/s) — pick from real "jostle" expectation.

## 9. How this feeds the projects
- **Gimbal** carries the spill defense → its tracking-error budget (§3) is the hard spec.
- **Airframe** is accel/rate/jerk-limited (§3) and must hit the bump-recovery bandwidth (§4); **LiDAR avoidance is spill-bounded** (§5.4).
- **Test Rig** validates the bump spec on one axis first.
- Derived ETM tasks (LiDAR sensing + spill-bounded avoidance) added to the Thrust-Vectored Drone project; gimbal/airframe tasks already track to these budgets.
