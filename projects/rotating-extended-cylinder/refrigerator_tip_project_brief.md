# The Refrigerator Door Tip-Recover Problem
### A bounded basin of attraction in a constrained rigid-body system

---

## 1. Motivation

Open a refrigerator briskly and a tall, slender beverage on the door shelf will sometimes lean visibly, hesitate, and settle back down without falling. Open it slightly harder and the same container topples. Open it slightly softer and nothing perceptible happens at all. This everyday observation — repeatable in any kitchen, with any sufficiently slender container — is a clean instance of a phenomenon that is not obvious from textbook treatments of rigid-body mechanics: a finite-width window in the space of input impulses inside which a constrained rigid body undergoes a large transient excursion and returns to its initial equilibrium.

The phenomenon is interesting for three reasons that compound.

First, it is a regime-structured system. The same continuous physical setup exhibits qualitatively distinct behaviors — no motion, pure translation against friction, tip-and-recover, and toppling — separated by sharp transitions across the input-parameter manifold. This is the kind of structure that motivates the *On Dynamical Systems* (ODS) research program: behavior that cannot be described by a single closed-form solution and instead requires explicit accounting of the constraint manifold the system operates on at each moment.

Second, the tip-recover regime is a genuine stable transient. The cylinder visits states (φ > 0, with nonzero kinetic energy) that, if the input persisted, would lead to toppling. What makes recovery possible is not damping or restoring force in the conventional sense — it is the *time-bounded character of the input* together with the fact that the unforced system has a stable equilibrium at φ = 0 with a basin of attraction that extends to the critical tip angle φ_c. The regime is stable in a Lyapunov sense only conditionally on the input class.

Third, it is a setting where the contact constraint changes during the motion. The cylinder transitions between a planar disk contact (full base on shelf), a single-point rim contact (during tipping), and possibly a knife-edge or fallen contact. Each transition changes the dimensionality of the constraint manifold and the degrees of freedom available to the system. Off-the-shelf rigid-body solvers handle this poorly because the contact graph is treated as discrete events rather than as a continuous element of the dynamics. A purpose-built simulation forces explicit accounting of what most physics tooling hides.

The pedagogical motivation runs alongside the research motivation. Engineering Physics II students at UCO encounter rigid-body rotation, moments of inertia, and torque balance as separate textbook chapters. The refrigerator problem couples them into a single observable phenomenon they can replicate at home — and it does so in a way that exposes the limits of the closed-form treatments those chapters offer.

---

## 2. Theory

### 2.1 Setup

A refrigerator door of moment of inertia `I_door` rotates about a vertical hinge axis under an applied torque `τ(t)`. A right-circular cylinder of mass `m`, radius `r`, and height `h` rests on a shelf attached to the door at radial distance `x` from the hinge. The shelf surface is horizontal and supports the cylinder against gravity with normal force and Coulomb friction characterized by a coefficient `μ`. The cylinder starts at rest with its symmetry axis vertical.

The shelf is a non-inertial frame. A point on the shelf at radius `x` experiences acceleration components due to the door's rotation: tangential `x θ̈`, centripetal `x θ̇²`, and Coriolis terms `-2 θ̇ × v_rel` for any body moving relative to the shelf. The Euler (tangential) term dominates for short, sharp impulses.

### 2.2 Regime boundaries

Two scalar quantities determine which regime the cylinder enters in response to a shelf acceleration of magnitude `a`.

The **slide threshold** is the acceleration at which the inertial force on the cylinder exceeds the static friction limit:

```
a_slide = μ g
```

The **tip threshold** is the acceleration at which the moment of the inertial force about the downstream base edge exceeds the restoring moment of gravity. Taking moments about the base-edge contact line:

```
m a (h/2) = m g r       ⟹       a_tip = 2 g r / h
```

These two thresholds partition the (a, geometry, friction) parameter space. The ordering of `a_tip` and `a_slide` determines which regime the cylinder enters first as input grows. For a tall slender container on a moderately grippy shelf — `h/r` large and `μ > 2r/h` — tipping precedes sliding. For a short squat container on a slippery shelf, sliding precedes tipping. The refrigerator scenario is overwhelmingly in the former regime.

### 2.3 The critical tip angle

Once the cylinder begins to rotate about a base edge, the relevant geometric quantity is the angle `φ_c` at which the center of mass passes directly over the pivot edge. For a right cylinder this is:

```
φ_c = arctan(2 r / h)
```

This is the **separatrix** of the unforced tip dynamics. With no applied torque, gravity acting through the CM produces a restoring moment for `0 ≤ φ < φ_c` and an overturning moment for `φ > φ_c`. The unforced tip equation about the base edge is:

```
I_edge φ̈ = -m g d sin(φ_c - φ)        for φ < φ_c
I_edge φ̈ = +m g d sin(φ - φ_c)        for φ > φ_c
```

where `d = √(r² + (h/2)²)` is the distance from the CM to the pivot edge and `I_edge = I_cm + m d²` by the parallel axis theorem.

### 2.4 The tip-recover regime as a conditional basin

The tip-recover regime is the set of input pulses `τ(t)` for which the cylinder enters the tipping phase but `φ(t)` stays below `φ_c` for the entire duration the input is active and afterward. This is not a stability statement about the system in general; it is a statement about the trajectory class admitted by the input.

The boundary of this set in input space is determined by an implicit condition that couples the door dynamics, the inertial force history at the shelf, and the resulting trajectory `φ(t)`. Closed-form expressions are not available except in degenerate limits. The boundary is the object of numerical study in this project.

### 2.5 What 2D models miss

A planar (side-view) treatment of this problem captures the regime structure — slide threshold, tip threshold, recovery — but loses two physical effects that distinguish the real phenomenon from the simplified one.

The first is **rim rolling**. When the cylinder tips, its contact with the shelf is not a knife edge running through the base diameter; it is a single point on the circular rim. As the cylinder leans and recovers, that contact point migrates around the rim. If friction is sufficient to prevent slipping at the contact, the migration is coupled to the cylinder's rotation about its symmetry axis by a holonomic constraint identical in form to the rolling-coin problem. This produces a yaw rotation of the cylinder during recovery — a real, observable wobble that looks superficially like gyroscopic precession but arises from rolling kinematics, not from spin angular momentum.

The second is **off-radial impulse coupling**. The shelf acceleration is tangential to the door arc, not purely radial from the cylinder's perspective. The fraction of the input that is purely radial vs. tangential depends on the cylinder's location on the shelf and on small misalignments. This breaks the planar symmetry of the 2D model and excites a yaw degree of freedom in addition to the tilt.

A faithful model requires the cylinder's orientation in `SO(3)`, not a single scalar tilt angle. This is the threshold of complexity at which 3D becomes obligatory rather than ornamental.

### 2.6 The constraint manifold

The cylinder occupies one of three contact regimes during the motion, each with a different effective configuration space:

- **Flat-base contact.** The base disk rests fully on the shelf. Configuration space is 3-dimensional: the position of the cylinder's center on the shelf (`x`, `z`) and its yaw angle about the vertical. The vertical position is constrained to `h/2`.
- **Edge-tipped contact.** A single rim point contacts the shelf. Configuration space expands to 5-dimensional: full `SO(3)` orientation minus one constraint (the contact point's height equals zero) plus 2D shelf position. This is where rim-rolling lives.
- **Side contact (fallen).** The cylindrical surface contacts the shelf along a line. Configuration space is again restricted; the cylinder can roll along its side.

The transitions between these regimes are not events in the usual numerical-integration sense; they are changes in the dimensionality and structure of the constraint manifold. The simulator must detect them explicitly and reformulate the equations of motion across each transition.

---

## 3. Methodology

### 3.1 Implementation choices

The simulator is implemented as a React component using `@react-three/fiber` for the 3D scene. Physics integration runs in a `requestAnimationFrame` loop at a fixed substep size of 1/2000 s, with the rendering tick decoupled from the physics tick. The cylinder's state is held in a mutable ref to avoid triggering React reconciliation on every physics frame; only the visual props are reactive.

The physics is isolated in a pure, React-free module (`physicsCore.mjs`) imported both by the interactive component (`RefrigeratorTipSimulator.jsx`) and by four headless harnesses that run under Node with no build step: `validate.mjs` (analytical limiting-case checks, §3.4), `sweep.mjs` (the 2-D basin map, §5.4), `robustness.mjs` (the N2 geometry/friction sweep, §5.2), and `converge.mjs` (the N1 convergence study, §5.2). This guarantees the displayed simulation, the validation, and the swept basin are all the *same* integrator. The classification of a run into static / slide / tip-recover / topple is done by one shared `classifyOutcome` function used by both the live view and the harnesses, so the app, the test-case verdicts, and the documented results cannot disagree.

The interactive app is packaged as a small Vite + React project (`package.json`, `vite.config.js`, `index.html`, `main.jsx`) using `@react-three/fiber` + `drei` — the same stack the site's `electrostatics-lab` already deploys. `npm run dev` serves it; `npm run build` emits a static `dist/`. It carries a panel of documented **test-case presets** (the §3.4 cases), an orbit camera, a lab-frame trace of the cylinder's top-centre point, and a transparent door so the can stays visible from any angle.

A sign-convention note: the inertial pseudo-accelerations are added as `−ω̇×r − ω×(ω×r) − 2ω×v_rel`. An earlier revision carried the Euler and Coriolis terms with the sign opposite to the (correct) centrifugal term, leaving the three fictitious forces internally inconsistent. The magnitude-based tip threshold was unaffected, but the tip *direction* and the Coriolis coupling that the rim-rolling/off-radial story (§2.5) depends on were not. This has been corrected; all three terms now share the standard rotating-frame convention.

Door motion is **derived**, not prescribed. The user specifies a torque profile `τ(t)` (currently a half-sine of adjustable peak amplitude and duration) and a door moment of inertia `I_door`. The door's angular position and velocity are integrated forward from `I_door θ̈ = τ(t) - c_damp θ̇`. This means the input parameter (peak torque) has a direct physical interpretation: the user can compare it to what a hand can apply.

The cylinder is integrated in the **shelf frame** (rotating with the door). Inertial pseudo-forces (Euler, centripetal, Coriolis) are added at the center of mass each substep. This avoids the conceptual and numerical hazards of integrating across a rotating reference frame at the level of every contact-point calculation.

### 3.2 State and integration

The cylinder's state is `(x_cm, v_cm, q, ω_body)` — a position, velocity, unit quaternion, and body-frame angular velocity. Quaternion integration uses the standard `q̇ = ½ q ⊗ (0, ω_body)` update with explicit renormalization each substep. Euler's equations for the body-frame angular dynamics are integrated explicitly (the gyroscopic coupling terms are evaluated at the current ω); the small fixed substep keeps this stable against the stiff penalty contact. The inertia tensor in the body frame is diagonal for a right cylinder with the symmetry axis along body `+y`:

```
I_xx = I_zz = m (r²/4 + h²/12)
I_yy = m r² / 2
```

### 3.3 Contact handling

Contact is handled by phase. The phase variable is determined each substep from the cylinder's tilt angle (deviation of the body symmetry axis from world vertical) with hysteresis: a small tilt enters the tip phase eagerly, but the phase returns to flat only when the tilt is essentially zero AND angular velocity is small. This hysteresis is essential — without it, transient excursions through small tilts repeatedly re-engage the flat-base constraint and bleed off angular momentum that should drive the recovery dynamics.

During the **flat phase**, the cylinder's vertical position is pinned to `h/2` and a Coulomb friction model handles horizontal motion. The tipping criterion `a_pseudo · (h/2) > g · r` is checked each substep; when satisfied, the simulator transitions to the tip phase by computing the angular acceleration about the pivot edge from the torque balance and seeding the body-frame angular velocity with the corresponding ω.

During the **tip phase**, contact is a single point at the rim. The simulator analytically determines the lowest rim point each substep by computing the body axes in world frame and finding the angle around the rim that minimizes world-y coordinate. A stiff penalty normal force (`k_N = 80,000` N/m with damping) maintains the unilateral contact, and Coulomb friction at the contact point couples linear and angular dynamics — this is the mechanism that produces rim rolling.

During the **fallen phase**, motion is heavily damped and the cylinder rests on its side. This is a placeholder; full rolling-cylinder-on-tilted-surface dynamics is a separate problem and not required for the questions of interest.

### 3.4 Validation

Validation runs at two levels. First, an automated limiting-case harness (`validate.mjs`) checks the integrator against facts derivable independently of the contact model: (i) the geometric formulas for `φ_c`, `a_tip`, `a_slip`; (ii) a **separatrix test** — released at rest from `0.85 φ_c` the cylinder recovers, from `1.10 φ_c` it topples, confirming the *sign* of the net torque across the unstable equilibrium; and (iii) an **energy-barrier test** — from upright, the minimum tilt-rate to just reach `φ_c` is `φ̇_crit = √(2 m g (d − h/2) / I_edge)`, and the full 3D penalty-contact run recovers at `0.80 φ̇_crit` (reaching ≈9.6°) and topples at `1.20 φ̇_crit`, bracketing the analytic barrier. All checks pass; this is the limiting-case validation the integrator previously lacked.

Second, the regime sequence is swept with peak torque, distance from hinge, and cylinder aspect ratio, with each run's regime assigned by an **outcome-based classifier** (computed from the whole trajectory, independent of the live HUD heuristic). For the default parameter set (350 g can, 3.3 cm radius, 16 cm height, 30 cm from hinge, μ = 0.5, 80 ms pulse, 0.15 kg·m² door inertia), the sweep produces a clean regime sequence:

| Case | Peak τ (N·m) | Regime       | φ_max (deg) | Notes                                          |
|------|--------------|--------------|-------------|------------------------------------------------|
| T1   | 2.5          | static       | ~0          | shelf accel below tip threshold                |
| T2   | 3.5          | tip-recover  | 2.0         | barely tips — small but visible lean, settles  |
| T3   | 4.5          | tip-recover  | 4.9         | clear tip-and-recover                          |
| T4   | 5.2          | tip-recover  | 18.7        | very deep excursion (84% of φc); sits just below the production-dt topple edge — would topple at finer dt |
| T5   | 6.5          | topple       | 88.8        | exceeds φ_c = 22.4°, falls over                |

These five points are exactly the cases exposed as presets in the app's **Test Cases** panel (§3.5), so the documented sequence and the in-app verdicts are the same set. The **regime** is the validated quantity; `φ_max` is reference-only, since the N1 study (§5.2) found excursion depth is tens-of-percent sensitive to the contact parameters. T4 (5.2 N·m, φ_max ≈ 18.7°) deliberately sits in the *production-dt* recover window — above the converged topple edge (≈5.14 N·m) but below the production-dt topple edge (≈5.22 N·m) — to give the deepest visible recovery the app can produce. It is the only case whose PASS verdict depends on the timestep choice; the other four are robust across the dt range tested in N1.

The tip-recover regime spans approximately τ ∈ [2.75, 5.15] N·m for this geometry — the lower edge from the headless sweep, the upper edge being the *converged* topple threshold from the N1 study (§5.2). (At the coarse production timestep recovery persists to ≈5.2, which is why T4 at 5.1 N·m recovers; the earlier [2.8, 5.3] estimate used the live display heuristic before the pseudo-force sign correction.) This is a finite-width band in the 1-D τ-slice, consistent with — but not by itself proof of — the prediction that the regime is a measurable subset of input space rather than a measure-zero transition curve. The stronger 2-D claim is addressed in §5.4.

### 3.5 Outputs

The simulator produces four concurrent outputs:

1. A real-time 3D view (orbit camera, transparent door) of the refrigerator, door, shelf, and cylinder, carrying two traces: an **orange contact-point trace** on the shelf, drawn in the *door frame* (it reveals rim rolling on the shelf surface), and a **cyan top-centre trace**, drawn in the *lab (inertial) frame* — the arc the can's top sweeps as the door swings. A static can therefore traces a clean circular arc; tipping superimposes wobble on that arc; toppling adds a large excursion. Both traces persist until the run is restarted or reset (they are not cleared when a run auto-stops).
2. A HUD overlay reporting current door angle and angular velocity, cylinder tilt and tilt rate, and the live values of the slide and tip thresholds.
3. A phase portrait in `(φ, φ̇)` coordinates with the `φ_c` separatrix drawn as a dashed red line. Tilt `φ` is computed as the unsigned angle of the symmetry axis from vertical, so trajectories live in the `φ ≥ 0` half-plane (a single separatrix at `+φ_c`, not the symmetric `±φ_c` pair); tip-recover runs are arcs that turn back before `φ_c`, topple runs cross it. Resolving the sign of the tip (and hence the full `[−φ_c, φ_c]` portrait) would require projecting the tilt onto the push axis — a deferred refinement.
4. A panel of **documented test cases** (the §3.4 validation set, retuned for visual contrast: a static case, three increasingly deep tip-recover cases, and a topple). Loading a case sets the default geometry and that case's peak torque; after a run the panel reports expected-vs-measured outcome with a PASS/FAIL badge. The **regime is the pass criterion** (robust to a few percent); `φ_max` is shown for reference only, because the N1 study (§5.2) found excursion depth carries tens-of-percent sensitivity to the contact parameters.

---

## 4. Goals

The project has near-term goals tied to the simulator itself and longer-term goals tied to the broader research program.

### 4.1 Near-term: characterize the basin

The first concrete goal is a quantitative map of the tip-recover basin as a function of the input parameters `(τ_peak, pulse_width, I_door, x)` and the cylinder parameters `(m, r, h)`. The boundary of this basin in input space is the central object — it tells us how the duration of the impulse trades against its peak amplitude, and how the cylinder's geometry sets the size of the survivable input window.

A specific testable prediction follows from dimensional analysis. If the tip dynamics during the impulse are dominated by the impulsive forcing rather than gravity (short pulse limit), then the boundary of the tip-recover basin should scale as a function of the angular impulse `J = ∫ τ dt` divided by `I_door`, with corrections of order `(pulse_width × ω_natural)` where `ω_natural = √(g·d / I_edge)` is the small-angle natural frequency of the tipping pendulum. In the long-pulse limit the dynamics are quasi-static and the boundary should approach a hard cutoff at `a_pseudo = a_tip`. The simulator can test this scaling directly by sweeping both axes.

### 4.2 Near-term: pedagogical deployment

A polished version of the simulator belongs on peirastes.com as part of the existing simulation portfolio (Orion Time, Optics Lab, the fluid simulators). The pedagogical case is strong: PHY 2114 students cover rotational dynamics in the same semester they encounter non-inertial frames and friction, and this problem couples all three into a single observable.

**Status — deployed.** The app is live at **https://peirastes.com/rotating-extended-cylinder/** (built dist at root, projects.json `project37`, deployed 2026-05-22). The deployment carries the full canonical v3.5 cinematic chrome (verbatim from `Website/artemis-ii-v3-5/index.html`) with floating glass `inst-panel` cards over a full-bleed 3D canvas, the documented test cases (T1–T5) with regime-vs-φmax PASS/FAIL verdicts via the shared `classifyOutcome`, the lab-frame top-centre trace, the state-owned phase portrait on a `glass-graph` data surface, and Acrylic HUD instrument controls (a minimal-tactile slider variant diverged from the catalogue's locked S1, and the `.ctrl-led`/`.led-dot` regime pill).

**Pedagogical deployment items — done since the initial deploy:**

- **Responsive / mobile layout** (2026-05-22). One `@media (max-width: 768px)` block + an extra-narrow `(max-width: 420px)` block stack the cards vertically below a 55-vh-tall stage, tighten the chrome row, and hide the corner ticks and crew line that would otherwise overlap. Desktop layout untouched.
- **In-UI basin diagram** (2026-05-23). The 2-D `(τ_peak, pulse_width)` regime map (504 cells precomputed at default geometry, bundled as `basin.json`) is rendered as a `glass-graph` data surface in the right column between the Readout and the Phase Portrait. Cells are colored by regime (gray static / green tip-recover / red topple); the five test cases T1–T5 are overlaid as labeled amber dots at the default 80 ms pulse; the current operating point `(peakTau, pulseWidth)` is a live cyan crosshair that follows the sliders. The cells reflect default geometry — operating-point tracking is live, but cell colors don't recompute when the user changes `(m, r, h, μ, I_door)`. Live recompute via Web Worker is the natural next iteration if needed.
- **Camera defaults** picked by the user via a live `cam xyz` / `tgt xyz` readout in the Readout card (the readout itself is retained for now, flagged for removal later).

**Pedagogical deployment items still remaining**, in approximate order of visible impact:

1. **Real screenshot thumbnail.** Currently a placeholder SVG (one of ~14 site placeholders). A clean capture of the running scene (3D view + chrome + a test case mid-run) would land better on the projects page and OG previews.
2. **Wire the Info chrome button.** Both `btnInfo` and `btnSettings` are disabled stubs; the canonical chrome reserves Info for an "about this sim" modal. A glass-modal with one paragraph and a link to the brief would close the visual debt without scope creep.
3. **"Hand force × distance × duration" input mode** (§6). Students reading "peak τ = 4.5 N·m" don't know what that *feels* like; a toggle to "I push the door at distance D with force F for duration T" computes the same torque profile in intuitive units.
4. **Exposition of the regime boundaries** at undergraduate level, and a **homework set** asking students to predict the boundary for a given can and check against the simulation. CD/TA-hat deliverables; per the N1 caveat, student-facing copy should treat tilt **qualitatively** (whether it topples is solid; how deep it leans is model-soft).
5. **Live basin recompute** (Web Worker) so the basin cells follow the geometry sliders, not just the operating point. Pre-baked-at-default was the faster ship; live recompute would close the small honesty gap when users perturb the geometry.
6. **Remove the `cam xyz` / `tgt xyz` debug rows** from the Readout card now that the default view is locked in (kept temporarily by the user's request).

### 4.3 Connection to *On Dynamical Systems*

The longer-term goal is to position this problem as a case study within the ODS research program. The relevant features are: (i) regime-structured behavior with sharp transitions across the input-parameter manifold; (ii) constraint-manifold dimensionality changes during the motion; (iii) a stable transient regime that requires explicit accounting of the time-bounded character of the input rather than asymptotic analysis. These features are not unique to the refrigerator problem — they appear in skidding vehicles, tippe tops, bipedal balance recovery, and any number of mechanical systems with intermittent contact — but the refrigerator problem is unusually clean: it has a small number of state variables, the constraint structure is easy to enumerate, and the regime boundaries are partly analytically tractable.

The hypothesis this work tests, in ODS terms, is that the tip-recover regime is **not** a fine-tuned phenomenon. The basin should have nonzero measure for a robust range of geometric and frictional parameters, meaning the phenomenon is generic rather than exceptional. The simulator allows this hypothesis to be tested by direct sweep across the parameter space.

### 4.4 What this project deliberately is not

This project does not aim to build a general-purpose rigid-body simulator. The contact model is purpose-built for the three relevant phases of this specific scenario; transplanting it to a different problem would require rework. The fallen-phase dynamics are intentionally crude because once the cylinder has toppled, the questions of interest have already been answered.

The project also does not aim to model the contents of the cylinder. A real beverage can with liquid has an internal degree of freedom (the liquid's CM can shift relative to the can's CM during the motion), and the resulting fluid-structure interaction substantially modifies the tipping basin. This is a known extension and is mentioned in section 6; it is not in the current scope.

---

## 5. Project status: PSCPR self-location

This section locates the project within the Problem-Solving and Critical Path Reasoning (PSCPR) framework. The purpose is methodological honesty: to state explicitly which inferential stages have been completed, which are in progress, and which have not yet been undertaken. This matters because the strength of any claim issuing from this project depends on which stage that claim lives in.

### 5.1 Where each PSCPR stage stands

**Stage 1: Observation and problem identification.** Complete. The phenomenon is reproducible (any tall slender container, any refrigerator, sufficient impulse), the regime structure is qualitatively unambiguous (four distinct behaviors separated by sharp transitions in input space), and the problem has been formulated in terms that admit quantitative treatment.

**Stage 2: Hypothesis formation and methodology design.** This is the stage the project currently occupies. The central hypothesis — that the tip-recover regime constitutes a basin of nonzero measure in input space across a robust range of geometric and frictional parameters — has been articulated. The methodology for testing it (direct numerical sweep across the parameter manifold using a constraint-aware simulator) has been designed, implemented, and partially validated. The validation in section 3.4 demonstrates that the simulator produces the four expected regimes in the expected ordering for the default parameter set; this is necessary but not sufficient for the central hypothesis to be tested.

**Stage 3: Systematic data generation and analysis.** Just begun. A headless sweep harness (`sweep.mjs`) now exists and the first 2-D basin diagram in `(τ_peak, pulse_width)` at the default geometry has been produced (§5.4, deliverable 1). It shows a connected tip-recover band occupying ≈20% of the sampled input rectangle, with the band collapsing toward the `a_tip` cutoff at long pulses and widening at short pulses — qualitatively the scaling §4.1 predicts. The geometry/friction robustness sweep (N2) found the basin scale-invariant across the tips-first region (§5.2), and the convergence study (N1) confirmed the band edge survives the continuum limit (`dt→0`) and is robust to the contact knobs — so the *existence* of a finite-measure basin is now demonstrated for this model, not merely consistent with it. What keeps Stage 3 open: the convergence study also showed the *excursion depth* `φ_max` is tens-of-percent sensitive to the contact parameters, so the quantitative §4.1 scaling test must wait on either tighter numerics or the contact-model upgrade; and the initial-condition perturbations (N2 remainder) and the wobble convergence (N3) are still unrun. The full characterization as a function of `(τ_peak, pulse_width, x, m, r, h, μ, I_door)` and the quantitative scaling test of §4.1 are still outstanding.

**Stage 4: Synthesis and inference to broader claims.** Not yet undertaken. The proposed positioning of this problem as a case study within the ODS research program (section 4.3) is currently a claim about what the project will be, not what it has demonstrated. The ODS-level inferences — that constraint-manifold transitions are a generic feature of stable transient regimes, that this class of phenomena resists asymptotic analysis — require multiple case studies, not one. This project provides at most one of those case studies.

### 5.2 Null hypotheses currently in scope

For honesty's sake, the relevant null hypotheses that the systematic sweep (stage 3) could in principle falsify the central claims against:

The first is **N1: the tip-recover regime is measure-zero or a numerical artifact**. Under this null, what looks like a finite-width basin in the τ-sweep is either (a) an artifact of the contact-stiffness penalty parameter `k_N`, (b) sensitive to integration step size in a way that suggests it would shrink to zero in the continuum limit, or (c) sensitive to the specific torque profile in a way that breaks under reparameterization. Testing N1 requires sweeps over `k_N`, `dt`, and the torque profile shape, holding the input impulse constant. Two further numeric choices in the current implementation must be included in this convergence study because they were chosen for stability rather than derived from physics: the `~3 ms` angular-velocity seed applied when the flat→tip transition fires, and the tilt/ω hysteresis thresholds governing the tip→flat return. If the basin width depends materially on either, that is an N1 result.

**Tested** (`converge.mjs`, §5.4 deliverable 3). N1's strong form is **rejected**: holding the input at a basin-interior point and refining `dt`, the upper band edge `τ_topple` (the topple threshold at 80 ms) converges — 5.48 → 5.20 → 5.18 → 5.148 → 5.145 N·m as `dt` halves from 1/1000 to 1/16000 (final step 0.06%) — and varies only ≈2% as `k_N` increases 16× and ≈3–5% across the seed and hysteresis ranges. The band is therefore a real, convergent feature, not a continuum-limit artifact. Two honest caveats survive the test, both consequences of the penalty/hysteresis contact handling rather than of the underlying dynamics: (a) with `seedDur = 0` the cylinder never tips at all (`φ_max = 0`) — entering the tip phase with zero seeded ω, the recovery hysteresis catches it at `tilt≈0, ω≈0` and returns it to flat before any tilt develops — so the flat→tip seed is load-bearing and non-physical; (b) the *excursion depth* `φ_max` carries tens-of-percent sensitivity to `dt`, `seedDur`, and the hysteresis thresholds (≈3.2–4.8° at the interior point), far more than the band edge. The decision-relevant observable (*does it topple*) is good to a few percent; the *how-deep-does-it-lean* observable is not. This bounds the §4.1 quantitative-scaling work, which depends on trajectory shape, and is the strongest argument for the Lagrange-multiplier contact upgrade of §6 (which would remove the seed/hysteresis contrivance entirely).

The second is **N2: the regime structure is fragile to small perturbations in initial conditions or geometry**. Under this null, the basin exists for the default parameters but vanishes or fragments when the cylinder is slightly off-center, when the shelf is slightly tilted, or when the cylinder has small CM asymmetries. This would weaken the claim that the phenomenon is generic. Testing N2 requires sweeps with perturbed initial conditions and geometric imperfections. **Partially tested** (`robustness.mjs`, §5.4 deliverable 2): a sweep over radius, height, friction, and aspect ratio shows the basin is *not* fragile to geometry/friction — with the τ-axis normalised by each geometry's torque scale `τ_ref = a_tip·I_door/x`, the tip-recover area holds at ≈20–25% and the band at ≈[1.4, 2.6]·τ_ref across r∈[2.5,4.0] cm, h∈[13,24] cm, μ∈[0.5,1.0], and aspect ratio h/r∈[4, 9.6]. It collapses to ≈0% only across the analytically predicted slide-first boundary (`a_tip > a_slip` ⇔ `μ < 2r/h`: squat cans, slippery shelves), and even there persists at short pulses because a sharp impulse can tip the cylinder before sliding develops. This is a regime crossover, not fragility — N2 is not supported on the geometry/friction axis. The initial-condition perturbations (off-centre placement, shelf tilt, CM asymmetry) remain untested.

The third is **N3: the rim-rolling wobble is a numerical artifact rather than a physical effect**. The current simulator produces the wobble via the friction-coupled contact at the rim point, but the magnitude of the effect is sensitive to the friction coefficient and the contact stiffness. Testing N3 requires either (a) convergence analysis as `k_N → ∞` and `dt → 0`, or (b) direct experimental measurement, which is feasible but not currently planned.

Status of the three nulls: **N1** (strong form) is rejected — the band converges and is robust to the numerical knobs (above). **N2** is rejected on the geometry/friction axis and untested on initial-condition perturbations. **N3** (rim-rolling wobble as artifact) remains untested. The *existence* of a finite-measure tip-recover basin can now be stated as demonstrated for this model; the *quantitative* claims (excursion depth, the §4.1 scaling, the wobble) remain "consistent with" pending the φ_max-sensitivity caveat, the contact-model upgrade, and N3.

### 5.3 The "Not Wrong ≠ Correct" check

The simulator currently produces results that are consistent with the theoretical regime boundaries (section 3.4). This is a "not wrong" result in the PSCPR sense — the simulator passes a basic sanity check. It is not yet a "correct" result in the stronger sense, because:

- The validation tested whether the regime sequence appears in the right ordering, not whether the boundary locations are quantitatively predicted by theory.
- No comparison has been made against an independent implementation or against experiment.
- The contact model uses a penalty stiffness whose value was chosen for visual stability, not derived from any physical property of the shelf material.

A simulator that is consistent with theory is necessary but not sufficient for the conclusions the project aims to support. Treating "the regimes appear" as evidence for "the basin has nonzero measure across the parameter manifold" would be an unjustified leap from stage 2 to stage 4 that bypasses the systematic stage-3 work.

### 5.4 Critical path forward

The shortest path from current state to a defensible stage-4 inference passes through three specific stage-3 deliverables, in order:

1. **A 2D basin diagram** in `(τ_peak, pulse_width)` space, colored by regime, at the default geometric parameters. This is the minimum artifact that demonstrates the basin is two-dimensional and finite. **Done** (first pass): `sweep.mjs` produces it (504-run grid in ≈3 s); the tip-recover band is connected and occupies ≈20% of the sampled rectangle, and the 1-D τ-slice reproduces the §3.4 table band ([2.75, 5.00] N·m). Remaining: render it as a publication figure and refine the boundary resolution near the band edges.
2. **A robustness sweep** that varies cylinder geometry `(r, h)` and friction `μ` independently, and reports the area of the basin in `(τ_peak, pulse_width)` space as a function of these. This addresses N2 directly. **Done** (geometry/friction axis): `robustness.mjs` runs a normalised 2-D basin sweep at each of ~20 geometry/friction points (≈3200 runs, ~40 s). Result: the basin is scale-invariant (≈20–25% normalised area) throughout the tips-first region and vanishes only across the `μ = 2r/h` slide-first boundary — see N2 above. Remaining: the initial-condition/asymmetry perturbations, and rendering area-vs-parameter as a figure.
3. **A convergence study** that holds the input parameters fixed at a basin-interior point and varies `k_N`, `dt`, the tip-seed duration, and the hysteresis thresholds, checking that the trajectory and the basin width converge. This addresses N1 and N3. **Done** (`converge.mjs`): `τ_topple` converges to ≈5.14 N·m as `dt→0` and is robust (≈2–5%) to `k_N`, seed, and hysteresis — N1 strong form rejected (see §5.2 N1 for the result and its two caveats). Practical consequence: the interactive view's `dt = 1/2000` is fine for *whether-it-topples*, but figures reporting excursion depth or the §4.1 scaling should integrate at `dt ≥ 1/4000`. N3 (does the rim-rolling wobble survive `k_N→∞, dt→0`?) is not yet isolated and remains the next convergence target.

Only after all three are completed does the project have license to make stage-4 claims about the genericity of constraint-manifold transient stability.

---

## 6. Open questions and possible extensions

A handful of specific questions are not addressed by the current implementation and would benefit from follow-on work.

The first is the **liquid-sloshing extension**. A can with a half-full liquid contents has a CM that moves during the tipping motion, with dynamics that can be approximated as a pendulum attached at some height inside the cylinder. The effect on the basin geometry is nontrivial: for the right liquid mass and natural frequency, sloshing can either widen the basin (by absorbing kinetic energy from the tipping motion) or narrow it (by adding overturning moment at the peak of the excursion). This is a coupled-oscillator problem with the basin as the observable.

The second is the **2D basin diagram in input space**. Rather than presenting individual trajectories, the simulator sweeps `(τ_peak, pulse_width)` on a grid and colors each cell by the resulting regime. A first pass exists (`sweep.mjs`, see §5.4); the follow-on work is to render it as a publication-quality figure, push resolution near the band boundary, and overlay the §4.1 scaling curve `J/I_door` to test the prediction quantitatively rather than qualitatively.

The third is the **realistic torque-from-arm-motion mode**. The current input parameterization is peak torque and duration, which is conceptually clean but operationally remote from the everyday experience of opening a fridge. An alternative input mode would specify the hand force, the hand's distance from the hinge, and the duration of the push — quantities a user can estimate. This would make the simulator more useful as a pedagogical tool without changing the underlying physics.

The fourth is the **contact-model upgrade**. The current penalty-based contact produces small high-frequency artifacts in the normal force during the tip phase. A proper Lagrange-multiplier contact solver (LCP or similar) would eliminate these and would also handle the edge cases of contact loss and recovery more cleanly. This is an investment that pays off only if the project moves toward more general contact configurations.

---

## Appendix: notation

| Symbol | Meaning |
|--------|---------|
| `m, r, h` | cylinder mass, radius, height |
| `x` | radial distance from hinge to cylinder center on shelf |
| `μ` | Coulomb friction coefficient (shelf surface) |
| `I_door` | moment of inertia of the door about the hinge axis |
| `τ(t)` | applied torque on the door |
| `θ` | door angle |
| `φ` | cylinder tilt angle from vertical |
| `φ_c = arctan(2r/h)` | critical tip angle |
| `d = √(r² + (h/2)²)` | distance from CM to pivot edge |
| `I_edge = I_cm + m d²` | moment of inertia about pivot edge |
| `a_tip = 2gr/h` | shelf-acceleration threshold for tipping |
| `a_slide = μg` | shelf-acceleration threshold for sliding |

