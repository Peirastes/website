# Kinematics Lab — Specification

> First PSE-I summer 2026 simulation. Covers Core 1: Chapters 1–4 (Introduction → 1D Kinematics → Vectors → 2D Kinematics). Module-split pattern matching Optics Lab and Induction Lab precedents.

> **Lead:** Cole Prather  
> **Status:** Specification (pre-build)  
> **Spec Date:** 2026-06-03  
> **Target Deploy:** `peirastes.com/kinematics-lab/`  
> **Build Window:** Summer 2026 Wk 1–3 (deployed before Exam 1, Thu Jun 18)

---

## 1. Purpose

A browser-based instrument that lets students manipulate the parameters of motion (initial velocity, acceleration, launch angle, time) and immediately see what changes in the trajectory, the position/velocity/acceleration plots, and the live readouts. The lab is designed to be referenced inline from PSE-I Chapters 2–4 lecture notes, used by students during HW1/HW2 preparation, and demonstrated in lecture as a live derivation tool.

**Driving question:** Can a PSE-I student build correct intuition about the three kinematic equations + 2D projectile motion by varying inputs and watching position, velocity, and trajectory respond in real time — and is the uncertainty envelope viz the right way to introduce error propagation visually?

---

## 2. Scope

### Chapters covered

| Chapter | Title | What the lab covers |
|---|---|---|
| Ch 1 | Introduction to Physics | **Tangential touchpoint only.** Uncertainty envelope on Projectile module (the Exam 1 P5 pattern) demonstrates sig-fig/error-propagation discipline that Ch 1 introduces. |
| Ch 2 | One-Dimensional Kinematics | **Central.** Constant-acceleration kinematic equations; x(t), v(t), a(t) plots; free-fall as special case ($a = -g$). |
| Ch 3 | Vectors | **Central.** Vector addition, decomposition, magnitude/direction; graphical adder with sliders + canvas. |
| Ch 4 | Two-Dimensional Kinematics | **Central.** Projectile motion (range, max height, time of flight); 2D vector position $\vec{r}(t)$; uncertainty envelopes for derived quantities. |

### Out of scope (deferred to other labs)

- Forces and Newton's 2nd Law (Ch 5–6) → **Forces Lab**
- Energy / work-energy theorem (Ch 7–8) → **Energy Lab**
- Momentum / collisions (Ch 9) → **already covered by existing Collisions Lab**
- Anything involving causation (forces, energy, momentum)

The Kinematics Lab is intentionally **kinematics only** — it describes motion without asking what causes it. This matches Cole's Ch 5 split: "Chapter 5's job (forces)" is when the *why* enters.

---

## 3. Content Sources

Per the planning framework discussed 2026-05-31, labs anchor in **lecture worked examples** and **conceptual demonstrations**, not in exam/HW problems directly (to avoid becoming answer keys).

### Lecture worked examples to anchor as default presets

| Source | Preset Name | Module |
|---|---|---|
| Ch 2 §2.4 (TBD — verify with Cole's draft) | "Free-Fall from Rest" | 1D Motion |
| Ch 2 §2.5 (kinematic-equation worked example) | "Sprinter Acceleration" | 1D Motion |
| Ch 3 §3.X — vector addition example (TBD) | "Force Vectors Sum" | Vector Decomposition |
| Ch 4 — projectile worked example (TBD) | "Cannon at 45°" | Projectile |
| Exam 1 P5 (canonical uncertainty-envelope problem) | "P5 Uncertainty Envelope" | Projectile (with envelope mode) |

### Confirmed conceptual demonstrations

- **Galileo's free-fall principle:** drop two objects with same $a = -g$, different $v_0$. Toggleable air resistance later (Forces Lab).
- **Independence of horizontal and vertical motion (projectile):** sliders for $v_x$ and $v_y$ independently change only their respective component; trajectory shape responds.
- **Range symmetry about 45°:** at $\theta_0 = 30°$ and $\theta_0 = 60°$, ranges match.
- **Time of flight scales with $v_y$:** flat trajectory vs. high arc with same range.

### What's NOT a preset (avoid answer-keying HW)

HW1–HW2 problems' specific scenarios get *related-but-different* default configurations. Students should be able to **adapt** the lab to their HW problem, not run the HW problem directly.

---

## 4. Modules

Module-split pattern, matching Optics Lab (5 modules in 2 groups) and Induction Lab (7 modules in 2 groups).

### Module 1: 1D Motion (constant acceleration)

**Inputs (sliders):**
- $x_0$ (initial position, m): $-10$ to $10$
- $v_0$ (initial velocity, m/s): $-20$ to $20$  
- $a$ (acceleration, m/s²): $-20$ to $20$ (includes $-9.81$ for free-fall preset)
- $t_{\max}$ (simulation time, s): $0.1$ to $10$

**Visualization:**
- Three stacked plots: $x(t)$, $v(t)$, $a(t)$
- Vertical playhead line that sweeps left to right during playback
- Live readouts: current $t$, $x$, $v$, $a$
- Equation overlay (toggleable): the three kinematic equations rendered via KaTeX, with current numerical values substituted in

**Presets:** Free-Fall from Rest ($v_0 = 0$, $a = -9.81$, $x_0 = 10$), Sprinter Acceleration ($v_0 = 0$, $a = 4$, $t_{\max} = 5$), Thrown Upward ($v_0 = +10$, $a = -9.81$).

**Pedagogical hook:** the three equations are the three views of the same motion. Students should see that fixing the curve $x(t)$ determines $v(t)$ and $a(t)$ uniquely.

### Module 2: Vector Decomposition

**Inputs (sliders + drag-on-canvas):**
- Vector A: magnitude (0–10), angle (0°–360°)
- Vector B: magnitude (0–10), angle (0°–360°)
- Toggle: show components, show projection lines, show resultant

**Visualization:**
- 2D plot with origin
- Vectors A and B drawn in STEEL (primary)
- Components $A_x, A_y, B_x, B_y$ drawn in SLATE thinner with dashed projection lines in MIST (per PSEI figure conventions)
- Resultant $\vec{R} = \vec{A} + \vec{B}$ drawn in AMBER bold
- Live readouts: $\vec{A}$ in $(A_x, A_y)$ and $(|A|, \theta_A)$; same for $\vec{B}$ and $\vec{R}$

**Presets:** Two Forces (Cole's Ch 3 worked example), 45° + 45° (parallel vectors), Perpendicular (90° apart).

**Pedagogical hook:** "vector addition is graphical OR algebraic — same answer." Toggle between head-to-tail visualization and component-sum readout.

### Module 3: Projectile Motion

**Inputs (sliders):**
- $v_0$ (launch speed, m/s): 1 to 50
- $\theta_0$ (launch angle above horizontal, deg): 0 to 90
- $y_0$ (launch height, m): 0 to 20
- Toggle: show velocity vector, show acceleration vector ($-g\hat{y}$), show component decomposition

**Visualization:**
- 2D trajectory plot with ground line at $y = 0$
- Trajectory drawn in STEEL bold (nominal)
- Velocity vector at current $t$ in AMBER (toggleable)
- Range marker (AMBER tick on ground line)
- Max height marker (AMBER horizontal line)
- Time of flight readout
- Live readouts: $t$, $x$, $y$, $v_x$, $v_y$, $|v|$

**Animation:** play/pause/reset/scrub timeline. Playback shows the ball moving along the trajectory with the velocity vector updating in real time.

**Presets:** Cannon at 45° (max range), Steep Launch (75°), Flat Launch (15°), Drop from Height ($v_0 = 0$ but launched horizontally — bridges to projectile from a tower problem).

**Pedagogical hook:** see the parabolic trajectory emerge from independent $x(t) = v_0 \cos\theta_0 \cdot t$ and $y(t) = v_0 \sin\theta_0 \cdot t - \tfrac{1}{2}gt^2$.

### Module 4: Projectile with Uncertainty Envelope ★

**The PSE-I differentiator.** Mirrors the Exam 1 P5 pattern documented in `project_psei_figure_techniques.md` (memory).

**Inputs:**
- $v_0$ and $\theta_0$ as Module 3
- $\delta v_0$ (uncertainty, ±%): 0 to 10
- $\delta \theta_0$ (uncertainty, ±°): 0 to 5
- Toggle which source of uncertainty to visualize (just $\delta v_0$, just $\delta \theta_0$, or both combined)

**Visualization:**
- Nominal trajectory in STEEL bold (the "answer" curve)
- Upper and lower bound trajectories in dashed SLATE
- Filled envelope between bounds in MIST with `alpha=0.4`
- Three landing markers: light min, AMBER bold nominal, light max
- Range dimension at the bottom: spans min-to-max with AMBER tick at nominal $R$
- Readouts: $R_{\min}$, $R_{\text{nominal}}$, $R_{\max}$, $\delta R = R_{\max} - R_{\min}$

**Pedagogical hook:** at $\theta_0 = 45°$, angle uncertainty contributes ~zero to $\delta R$ (the derivative $\partial R / \partial \theta$ vanishes); at $\theta_0 = 30°$ or $60°$, angle uncertainty contributes significantly. Students should **discover** which source dominates by toggling.

**Preset:** "Exam 1 P5" — $v_0 = 18.0\,\text{m/s} \pm 5\%$, $\theta_0 = 45° \pm 1°$. Lets students reproduce the exam problem after they've taken Exam 1.

### Module ordering and groups

```
1D Motion · 2D Vectors  →  Projectile · Projectile + Envelope
   (Ch 2)    (Ch 3)         (Ch 4)          (Ch 1 + Ch 4 capstone)
```

Tab labels (per Optics Lab UX): "Kinematics 1D" · "Vectors" · "Projectile" · "Envelope".

---

## 5. Architecture

### Shared physics core (pure JS, no DOM)

```js
// Constant-acceleration 1D
function kinematics1D({ x0, v0, a, t }) → { x, v, a }

// Vector arithmetic
function vectorFromPolar(magnitude, angleDeg) → { x, y, magnitude, angleDeg }
function vectorAdd(a, b) → { x, y, magnitude, angleDeg }
function vectorDecompose(magnitude, angleDeg) → { x, y }

// Projectile (no air resistance)
function projectileTrajectory({ v0, theta0Deg, y0, g, dt }) → [{ t, x, y, vx, vy }]
function projectileRange(v0, theta0Deg, g, y0=0) → number
function projectileMaxHeight(v0, theta0Deg, g) → number
function projectileTimeOfFlight(v0, theta0Deg, g, y0=0) → number

// Uncertainty envelope (analytical bounds)
function projectileEnvelope({ v0, dV0Pct, theta0Deg, dTheta0Deg, g, mode }) → {
  nominal: [{x,y}],
  minBound: [{x,y}],
  maxBound: [{x,y}],
  rMin, rNom, rMax, deltaR
}
```

**Reusability:** the Forces Lab will need `kinematics1D` (for inclined-plane motion) and `vectorFromPolar` / `vectorAdd` (for force superposition). The Energy Lab will need `projectileTrajectory` (for projectile energy curves). The physics core lives in a separate file (e.g., `physics-core.js`) imported by the Kinematics Lab and forward-imported by later labs. **This is the first sim; designing the core as reusable now saves rework.**

### DOM structure (single-file HTML)

```
<body>
  <!-- Cinematic v3.5 chrome (carbon copy from artemis2_v3_5_ui.html) -->
  <div class="cin-flank cin-flank--left">
    <a class="cin-wordmark" href="https://peirastes.com/">PEIRASTES</a>
    <span class="cin-version">v0.1</span>
  </div>
  <div class="cin-title">
    <div class="cin-title__name">KINEMATICS<span>·LAB</span></div>
    <div class="cin-title__sub">Motion in 1D and 2D · PSE-I Core 1</div>
    <div class="cin-title__crew">1D Motion · Vectors · Projectile · Envelope</div>
  </div>
  <div class="cin-flank cin-flank--right">
    <!-- Info, Settings buttons (placeholders) -->
  </div>
  <!-- Corner ticks -->
  <div class="cin-tick cin-tick--tl"></div>
  ...

  <!-- Lab body: tabs + module surface -->
  <nav class="tabs">
    <button class="tab on" data-module="1d">Kinematics 1D</button>
    <button class="tab" data-module="vectors">Vectors</button>
    <button class="tab" data-module="projectile">Projectile</button>
    <button class="tab" data-module="envelope">Envelope</button>
  </nav>

  <main class="instrument-stage">
    <!-- Lab-as-void layout (per Optics Lab pattern) -->
    <!-- Controls float left on top of deep-space backdrop -->
    <aside class="control-panel acrylic-panel">
      <!-- Per-module sliders, toggles, presets -->
    </aside>
    <section class="display-area">
      <!-- Canvas for current module's visualization -->
      <canvas id="main-canvas"></canvas>
      <!-- Readout cards floating bottom -->
      <div class="cards">...</div>
      <!-- Equation strip (KaTeX) at very bottom -->
      <div class="eq-strip">...</div>
    </section>
  </main>

  <!-- Cinematic grain finish -->
  <div class="cin-grain"></div>

  <script>...</script>
</body>
```

### Tech stack

- **Single-file HTML+JS+CSS** (modeled on Optics Lab — 1530 lines, single file works)
- **Vanilla JS + Canvas 2D** for rendering (no React, no D3, no framework)
- **KaTeX** via CDN for equation rendering (already used in Induction Lab, Optics Lab)
- **No build step** required for development; opens directly in browser

Estimated total size: 1500–1800 lines (Optics Lab is 1530; we have one more module).

---

## 6. Visual style

### Outer chrome: Cinematic Tier v3.5

Carbon-copy from `Website/projects/mission-tracker/working/artemis2_v3_5_ui.html` per the canonical-clone-source convention. Per memory `feedback_v3_5_retrofit_topology.md`: "Chrome row (`.cin-flank`/`.cin-title`/`.cin-tick`/`.cin-action`) must be copied byte-for-byte... every font/size/inset matters."

Palette (cinematic outer): `--accent: #7dd6ff` cyan + `--gold: #ffae20` neon amber (inside-instrument variant). Cinzel for PEIRASTES wordmark only; Orbitron 700 for "KINEMATICS·LAB" title; Inter for UI; Share Tech Mono for numerical readouts.

### Inner working surface: Calm Mechanical (PSE-I figure palette)

For all plots, vectors, trajectories, and figures *inside* the lab's data-display surfaces, use the PSE-I Calm Mechanical palette from `psei_figures.py`:

- `INK #2B2B2B` — primary linework, axis labels
- `STEEL #3F6280` — primary trace, nominal trajectory, vectors A and B
- `SLATE #5E707C` — secondary lines, dashed bounds, dimension lines, projection lines
- `MIST #A8B3BC` — filled envelopes, ambient shading
- `AMBER #B8853A` — emphasis: resultant vector, range markers, current-time velocity vector
- `PAPER #F8F4EC` — background tint for plots

**This is the first lab where the in-instrument palette is PSE-I-specific.** PSE-II's labs (Optics, Induction) use the EM-tier palette (cyan/amber/circuit colors). PSE-I's Kinematics Lab uses Calm Mechanical to match the PSE-I lecture notes' figure conventions — consistency across the student's experience of the course.

The Cinematic outer chrome stays cyan/amber (universal Peirastes v2 outer-shell identity); only the *inner data-display surfaces* switch to Calm Mechanical.

### Lab-as-void layout

Per Optics Lab and Smoke Sim precedent. Control panel floats on left over a deep-space backdrop (radial dark gradient, soft border, glass shadow). Display area occupies the rest. Cards float at bottom of the display area for live readouts. Equation strip at the very bottom for KaTeX-rendered formulas.

---

## 7. Acceptance criteria

### Functional

- [ ] All four modules work end-to-end with sliders, presets, and animations
- [ ] Physics core matches analytical solutions to within numerical tolerance (verify against textbook problems Cole has authored)
- [ ] Module switcher preserves state per module (changing tabs doesn't reset sliders)
- [ ] Free-fall preset in 1D Motion module reproduces $a = -9.81$ behavior and matches projectile vertical motion when $\theta_0 = 90°$
- [ ] Projectile range matches $R = v_0^2 \sin(2\theta_0)/g$ at $y_0 = 0$
- [ ] Uncertainty envelope at $\theta_0 = 45°$ shows minimal angle-uncertainty contribution; at $\theta_0 = 30°$ shows visible angle-uncertainty contribution
- [ ] All canvases are HiDPI-aware (no blur on Retina displays — catches the bug noted in Collisions Lab POD weakness)

### Pedagogical

- [ ] Each module has 3–4 presets, at least one tied to a Cole lecture worked example
- [ ] Equation overlays (KaTeX) render correctly in 1D Motion and Projectile modules
- [ ] Readouts use 3 sig figs (consistent with PSE-I Ch 1 sig-fig discipline)
- [ ] Inputs match SI units (m, s, m/s, m/s²) with units shown on slider labels
- [ ] Angle inputs in degrees (NOT radians) for student accessibility

### Visual + brand

- [ ] Outer chrome is byte-identical to v3.5 canonical (PEIRASTES wordmark, version, title, corner ticks, action buttons row, hint glyphs)
- [ ] Inner plot palette uses Calm Mechanical tokens (no leaked EM-palette colors)
- [ ] Responsive: usable on tablet (768px+); mobile gets a "rotate device" prompt
- [ ] No console errors at any module on Chrome + Firefox + Safari
- [ ] SEO `<head>` block complete (meta description, OG tags, favicon, manifest) — avoid the Tip-Recover gap

### Deployment

- [ ] Deployed at `peirastes.com/kinematics-lab/` with minimal wrapper
- [ ] Listed in `projects.json` with subtype `Simulator` per the 2026-05-19 taxonomy
- [ ] Real screenshot thumbnail (no placeholder SVG)
- [ ] Sitemap.xml updated
- [ ] GH Pages deploy verified

---

## 8. Build phases

### Phase 1 — Physics core + 1D Motion module (Wk 1, ~6 hours)

Build `physics-core.js` with `kinematics1D`, `vectorFromPolar`, `vectorAdd`, `vectorDecompose`. Get the 1D Motion module rendering on the page with sliders, x(t)/v(t)/a(t) plots, playback, and free-fall preset. Validates the architecture before adding more.

### Phase 2 — Cinematic chrome + Vectors module (Wk 1–2, ~4 hours)

Carbon-copy v3.5 chrome from canonical clone source. Add Vector Decomposition module. Tab switcher between 1D Motion and Vectors. Confirm chrome inset, fonts, palette match the canonical pattern exactly.

### Phase 3 — Projectile module (Wk 2, ~4 hours)

Build `projectileTrajectory`, `projectileRange`, `projectileMaxHeight`, `projectileTimeOfFlight`. Wire up Projectile module with sliders, animation, velocity vector overlay. Add the four projectile presets.

### Phase 4 — Uncertainty Envelope module (Wk 2–3, ~5 hours)

Build `projectileEnvelope` analytical computation. Visualize nominal + bounds + envelope fill + landing markers. Implement the source-of-uncertainty toggle. Add the Exam 1 P5 preset. This is the PSE-I differentiator and gets extra care.

### Phase 5 — Deploy + polish (Wk 3, ~2 hours)

Real screenshot, projects.json entry, sitemap.xml update, SEO head block, HiDPI canvas pass, three-browser smoke test. Ship before Exam 1 (Thu Jun 18) so students can use it for exam prep.

**Total: ~21 hours of CE work, spread across Wk 1–3 of the semester.** Realistic given Cole's parallel content production load.

---

## 9. Reusable infrastructure for later labs

When Phase 1 completes, the `physics-core.js` becomes the foundation for:

- **Forces Lab** — imports `kinematics1D` (for inclined-plane motion), `vectorAdd` and `vectorDecompose` (for force superposition)
- **Energy Lab** — imports `projectileTrajectory` (for projectile KE+PE over trajectory), `kinematics1D` (for 1D motion energy curves)
- **Oscillations Lab** — imports `vectorFromPolar` (for SHM phase representation); may add `simpleHarmonicOscillator(omega, amplitude, phase, t)` to the core
- **Rotation Lab (if pursued)** — imports rotational analogs that mirror the linear functions

This argues for a discipline: every function added to `physics-core.js` should be **pure** (no DOM, no canvas, no global state) and **named after the physics**, not the lab. The core is the operation's mechanics library.

---

## 10. Open questions

1. **Inline references in lecture notes?** Should `PSEI_Notes_Chapter_2.md` include "see live demo at peirastes.com/kinematics-lab/#1d" or are the labs strictly out-of-class supplements? Inline references create durable cross-links but add a website-uptime dependency during class.
2. **Telemetry / adoption signal?** D-8 in `decisions_pending.md` flagged that PSE-II Induction/Optics labs are unmeasurable from inside. For PSE-I, do we add a single conceptual exit-question pattern at the end of each module to produce some adoption signal? Or do we accept the unmeasurability and proceed?
3. **Module 5: 2D non-projectile motion?** Things like circular motion at constant $|v|$, oscillation $\vec{r}(t) = A\cos(\omega t)\hat{x}$, etc., live in the borderlands between Ch 4 (kinematics) and Ch 6 (curved motion). Defer to Forces Lab, or add a fifth Kinematics Lab module?
4. **Equation-overlay design.** When a student moves the $a$ slider, should the equation overlay re-render with the substituted numerical values (so they see "$x(t) = 0 + 5t + \tfrac{1}{2}(2)t^2$") or keep symbolic ("$x(t) = x_0 + v_0 t + \tfrac{1}{2}at^2$") with a separate "computed value" readout? Both are valid pedagogically. **Lean: symbolic + computed value side-by-side. Tabbed view if real estate gets tight.**

---

## 11. References

### Physics + content
- `Lectures/PSEI Lectures 2026/Chapter 2/PSEI_Notes_Chapter_2.md` (1D Kinematics)
- `Lectures/PSEI Lectures 2026/Chapter 3/*.md` (Vectors)
- `Lectures/PSEI Lectures 2026/Chapter 4/*.md` (2D Kinematics)
- `Exams/PSEI Exams Summer 2026/PSEI_Exam_1.md` (P5 uncertainty envelope source problem)
- `Homework/HW1/PSEI_HW1_v5_Summer_2026.md` (P5 if it migrated to HW)

### Visual + brand
- `Website/STYLE_GUIDE.md` § Cinematic Tier (v2.3)
- `Website/projects/mission-tracker/working/artemis2_v3_5_ui.html` — canonical clone source for chrome
- `Lectures/PSEI_Style_Guide.md` § Calm Mechanical Palette + § Figure Style Module
- `Lectures/psei_figures.py` — `StyleConfig` tokens (referenced from JS as hex constants, not imported)

### Architecture + precedent
- `Website/optics-lab/index.html` — single-file pattern + tab switcher + lab-as-void layout reference
- `Website/induction-lab/induction_lab.html` — module-split pattern (7 modules) reference
- `Website/projects/collisions-lab/collision_lab.html` — 2D physics + canvas animation reference
- CE agent memory: § JS-preserving CSS refactor (Optics Lab 2026-05-09); § Preserve every JS-referenced class name; § Test your assumptions with the smallest viable script

### Related memories
- `project_psei_summer_2026_redesign.md` — 5-Core Energy Spine, 14 SLOs, schedule
- `project_psei_lecture_layout.md` — Ch 1 canonical, build pipeline, layout-check workflow
- `project_psei_figure_techniques.md` — Pattern 1: Uncertainty Envelope (source of Module 4 design)
- `project_keleustes_coursework_arc.md` — PSE-I as Keleustes proving ground (this lab is also a Keleustes input for a possible future "lab generation pipeline")
- `feedback_exam_key_layout.md` — back-to-front facing-page grading (relevant to how this lab links from Exam 1)

---

*Kinematics Lab Specification v0.1 — drafted in CE hat, 2026-06-03. First spec deliverable in the PSE-I simulation suite.*
