# Refrigerator Door Tip-Recover Simulator

A constraint-aware 3D rigid-body simulator of a tall, slender can on a swinging
refrigerator-door shelf. Open the door briskly and the can leans, hesitates, and
either **recovers** or **topples** — a finite-width window of inputs produces a
large transient excursion that returns to equilibrium. The simulator captures
four regimes — **static · slide · tip-recover · topple** — with explicit
constraint-manifold switching (flat base → rim point → fallen).

The physics, motivation, validation, and research framing live in
[`refrigerator_tip_project_brief.md`](./refrigerator_tip_project_brief.md). This
README is the engineering reference: how it's built, how to run it, and how to
reproduce the results.

---

## Quick start

```bash
npm install       # one-time
npm run dev       # Vite dev server (hot reload) → http://localhost:5173
npm run build     # static production bundle → dist/
npm run preview   # serve the built dist/
```

Stack: Vite + React 18 + [`@react-three/fiber`](https://docs.pmnd.rs/react-three-fiber) + `drei`
(the same stack the site's `electrostatics-lab` deploys). `base: './'` in
`vite.config.js` makes the build work when served from a subfolder.

## Headless harnesses (Node, no build step)

The physics is a pure ES module (`physicsCore.mjs`), so the analysis runs
directly under Node and shares the *exact* integrator the UI uses:

```bash
npm run validate     # node validate.mjs    — analytical limiting-case checks (must pass)
npm run sweep        # node sweep.mjs        — 2-D (peak τ, pulse) basin map
node sweep.mjs --line                        #   1-D τ sweep vs the brief §3.4 table
node sweep.mjs --csv basin.csv               #   also write a CSV grid
npm run robustness   # node robustness.mjs   — N2 sweep over geometry (r,h) and friction μ
npm run converge     # node converge.mjs     — N1 convergence study (dt, k_N, seed, hysteresis)
```

`validate.mjs` exits non-zero on failure (CI-friendly). Run it after any change
to `physicsCore.mjs`.

## File structure

| File | Role |
|------|------|
| `physicsCore.mjs` | **Single source of truth.** Pure physics: state, integrator, contact phases, `simulateRun`, `classifyOutcome`. React-free. |
| `RefrigeratorTipSimulator.jsx` | R3F view: 3D scene, HUD, phase portrait, test-case panel, traces. Imports the core. |
| `main.jsx` / `index.html` | Vite entry point. |
| `vite.config.js`, `package.json` | Build config + scripts. |
| `validate.mjs` | Analytical limiting-case validation. |
| `sweep.mjs` | 2-D basin sweep (+ `--line`, `--csv`). |
| `robustness.mjs` | N2 geometry/friction robustness sweep. |
| `converge.mjs` | N1 numerical convergence study. |
| `refrigerator_tip_project_brief.md` | The canonical write-up (theory, methodology, PSCPR status). |

## Physics model (one-paragraph summary)

Door motion is **derived** from a half-sine torque pulse `τ(t)` and door inertia
`I_door` (`I_door θ̈ = τ − c·θ̇`), so peak torque has a direct physical meaning.
The cylinder is integrated in the rotating **shelf frame** at a fixed 1/2000 s
substep, with inertial pseudo-forces (`−ω̇×r − ω×(ω×r) − 2ω×v`) added at the CM.
Contact is handled by phase with hysteresis: flat base (CM pinned, Coulomb
friction), single rim-point (stiff penalty normal force + friction → rim
rolling), and fallen. Orientation is a quaternion with explicit Euler-equation
integration. The two analytic thresholds are `a_tip = 2gr/h` (tip) and
`a_slip = μg` (slide); the critical tip angle is `φ_c = arctan(2r/h)`. See the
brief §2–§3 for the full treatment.

## Test cases

The UI's **Test Cases** panel loads the documented §3.4 scenarios (default
geometry, varying peak torque). The **regime** (static / tip-recover / topple)
is the pass criterion; `φ_max` is shown for reference only — the N1 study found
excursion depth is tens-of-percent sensitive to contact parameters, while the
topple/no-topple boundary is solid to a few percent.

| Case | Peak τ (N·m) | Expected | φ_max (at production dt) |
|------|-------------|----------|--------------------------|
| T1 · static        | 2.5 | static      | ~0° |
| T2 · barely tips    | 3.5 | tip-recover | 2.0° |
| T3 · clear recover  | 4.5 | tip-recover | 4.9° |
| T4 · deep recover   | 5.2 | tip-recover | 18.7° |
| T5 · topple         | 6.5 | topple      | 88.8° |

T4 (5.2 N·m, 18.7° — 84% of φc) deliberately sits in the *production-dt* recover
window: above the converged topple edge (~5.14) but below the production-dt
topple edge (~5.22). It is the only case whose PASS verdict depends on the
timestep choice — chosen for visual drama; flagged here so it isn't mistaken
for a result robust to refinement.

## Results status (see brief §5 for the full account)

- **Sign fix:** the Euler/Coriolis pseudo-force terms were sign-corrected to be
  consistent with the centrifugal term. Regime thresholds were unaffected;
  tip direction and the rim-rolling coupling were.
- **N1 (numerical artifact?)** — **rejected.** The topple edge converges
  (`τ_topple → ~5.14 N·m` as `dt→0`) and is robust to `k_N`, the tip-seed, and
  hysteresis. Caveat: excursion depth is parameter-soft, and the flat→tip seed
  is a non-physical (load-bearing) handoff.
- **N2 (fragile to geometry?)** — **rejected** on the geometry/friction axis:
  the basin is scale-invariant (~20–25% normalised area) across a robust range,
  collapsing only across the predicted `μ < 2r/h` slide-first boundary.
- **N3 (rim wobble an artifact?)** — untested.

## Conventions / gotchas

- The cylinder lives at lateral **`z = 0`** in the physics frame. The door/shelf
  meshes are offset (Δz = −0.08) so the shelf centres on the can. **Do not**
  recentre by moving the cylinder's rest `z` — an off-radial offset perturbs the
  pseudo-forces and breaks the validated cases (z = 0.08 flips T1→slide,
  T4→topple).
- The top-centre trace is recorded in the **lab frame** and rendered at the
  Canvas root (not inside the rotating door group). Moving it back inside would
  re-pin it to the door.
- Use `dt ≥ 1/4000` for figures that report excursion depth or the §4.1 scaling;
  the live view's `1/2000` is fine for topple/no-topple.

## Status — deployed

Live at **https://peirastes.com/rotating-extended-cylinder/** (built dist at the
site root; `projects.json` `project37`). The deployed build carries the
canonical v3.5 cinematic chrome, the documented test cases, the lab-frame
trace, the phase portrait on a glass-graph surface, and Acrylic HUD
instruments (the slider is a minimal-tactile variant diverged from catalogue
S1 — candidate for promotion as S2).

## Remaining deployment items (brief §4.2)

Ordered by visible impact:

1. **Responsive / mobile layout** — fixed 300 px columns; iPad/phone will break.
2. **In-UI basin diagram** — surface the `sweep.mjs` result as a panel; the
   project's headline finding currently lives only in the terminal.
3. **Real thumbnail** — placeholder SVG → screenshot of the running scene.
4. **Info chrome button** — wire to an "about this sim" glass modal (currently
   a disabled stub).
5. **"Hand force × distance × duration" input mode** — students don't intuit
   "peak τ = 4.5 N·m" the way they intuit a push at arm's length.
6. **Undergraduate exposition + homework set** — CD/TA-hat deliverables.

## Outstanding science gaps (brief §5)

- **N3 (rim wobble convergence)** — untested. The sign-fix made this finally
  meaningful to test; not yet done.
- **N2 initial-condition perturbations** — geometry/friction axis cleared the
  null; off-centre placement, shelf tilt, and CM asymmetry remain.
- **§4.1 quantitative scaling test** — gated on the φ_max softness (N1 caveat);
  truly trusting trajectory shape needs the contact-model upgrade.
- **Contact-model upgrade (Lagrange-multiplier; brief §6)** — would remove the
  load-bearing seed/hysteresis handoff at flat→tip and is the prerequisite for
  trusting the excursion-depth work and the §4.1 scaling.
