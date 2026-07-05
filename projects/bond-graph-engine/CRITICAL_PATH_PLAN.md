# Bond Graph Modeler — Critical Path Plan

> **Created:** 2026-03-28
> **Status:** Planning
> **Goal:** Browser-based bond graph modeler with live domain switching

---

## 0. Foundational Architecture Decision

**Build the bond graph engine first, not the thermofluidic builder.**

The temptation is to build a working thermofluidic cycle tool (immediately useful for ENGR 3211) and "generalize later." This is a trap. Retrofitting a domain-specific solver into a domain-agnostic engine is a rewrite, not a refactor. The correct order is:

1. Build the abstract bond graph solver (effort/flow/power)
2. Build the canvas and wiring UI
3. Add the thermofluidic domain skin as the *first* skin
4. Add electrical, mechanical skins later — each is just a component palette + renderer

This means the thermofluidic builder takes slightly longer to reach v1, but every subsequent domain is nearly free. The TE Lab App continues to serve ENGR 3211 in the meantime.

---

## 1. Critical Path Dependency Chain

```
[M1: Bond Graph Solver Engine]
    │
    ├──► [M2: Canvas + Wiring UI]
    │        │
    │        └──► [M4: Thermofluidic Skin] ◄── [M3: CoolProp WASM Integration]
    │                │
    │                └──► [M5: Closed-Loop Iteration]
    │                        │
    │                        └──► [M6: T-s / P-h Diagrams]
    │                                │
    │                                └──► [M7: Animated Flow Visualization]
    │
    ├──► [M8: Electrical Skin] (parallel after M2)
    │
    ├──► [M9: Mechanical Skin] (parallel after M2)
    │
    └──► [M10: Live Domain Switching] (requires M4 + M8 or M9)
```

**Critical path:** M1 → M2 → M4 (with M3) → M5 → M6 → M7 → M10

**Parallel tracks after M2:** Electrical skin (M8) and Mechanical skin (M9) can develop independently.

---

## 2. Milestones

### M1: Bond Graph Solver Engine
**Dependency:** None (foundational)
**Deliverable:** A JavaScript module that accepts a bond graph topology and computes all effort/flow values at steady state.

**What to build:**
- Bond graph data model: elements (R, C, I, Se, Sf), junctions (0, 1), transformers (TF), gyrators (GY)
- Each element stores its constitutive law:
  - R: e = R · f (or nonlinear function)
  - C: f = C · de/dt → at steady state, f = 0 across C (or integrate for transient)
  - I: e = I · df/dt → at steady state, e = 0 across I (or integrate for transient)
  - Se: effort source (fixed e)
  - Sf: flow source (fixed f)
- Junction laws:
  - 0-junction: all efforts equal, flows sum to zero
  - 1-junction: all flows equal, efforts sum to zero
- Causality assignment algorithm (Sequential Causality Assignment Procedure — SCAP)
- State equation derivation: extract dx/dt = Ax + Bu from the causal bond graph
- Steady-state solver: set dx/dt = 0, solve Ax = -Bu
- Transient solver: RK4 integration of the state equations

**Validation:** Build a simple RLC series circuit as bond graph elements. Verify that:
- Steady-state DC gives correct V/I through R (C is open, I is short)
- Transient response matches analytical step response of RLC
- Energy conservation holds (sum of power at junctions = 0)

**Risk:** The causality assignment and state equation extraction are algorithmic but non-trivial. Karnopp & Rosenberg describe the procedure — follow it exactly. This is the highest-risk milestone because if the solver is wrong, everything built on top of it is wrong.

**Estimated complexity:** Medium-high. ~800–1200 lines for the solver core.

---

### M2: Canvas + Wiring UI
**Dependency:** M1 (solver must exist to validate connections)
**Deliverable:** D3.js canvas where users can place bond graph elements, connect them with power bonds, and see effort/flow values update.

**What to port from Pipeline IDE:**
- SVG canvas with pan/zoom (`PipelineCanvas.js` → adapt)
- Node rendering with input/output ports
- Bézier curve wires between ports
- Drag-and-drop from component palette
- Undo/redo (port `PipelineState.js` state management)
- Node selection, deletion, property editing

**What to build new:**
- Bond graph element renderers (half-arrow notation for power bonds)
- Causality stroke display (the short perpendicular line indicating causality assignment)
- Port types: power port (effort/flow pair) vs signal port (for modulated elements)
- Wire tooltip/annotation showing (e, f, P) values
- Component property panel (edit R value, C value, source magnitude, etc.)

**Validation:** Place Se → 1-junction → R → 0-junction → C. Connect, solve, verify values display correctly on wires.

**Risk:** Low — this is largely a port of existing Pipeline IDE code. The new parts (bond graph notation, causality strokes) are rendering concerns.

**Estimated complexity:** Medium. ~1500 lines, but ~60% is ported.

---

### M3: CoolProp WASM Integration
**Dependency:** None (can develop in parallel with M1 and M2)
**Deliverable:** CoolProp compiled to WASM, callable from JavaScript, with a clean API for property lookups.

**What to build:**
- Load CoolProp WASM module (pre-built binaries exist at coolprop.org)
- Wrapper API:
  - `props(fluid, input1, value1, input2, value2, output)` → e.g., `props("Water", "T", 373, "P", 101325, "H")` → enthalpy
  - Common lookups: T(P,h), h(T,P), s(T,P), quality(T,P), phase(T,P)
- Saturation curve data for T-s and P-h diagram backgrounds
- Error handling for two-phase lookups, out-of-range inputs

**Validation:**
- Verify steam tables: T_sat at 1 atm = 100°C, h_fg = 2257 kJ/kg
- Verify refrigerant properties: R-134a saturation at common pressures
- Benchmark: 1000 property lookups in < 100ms (needed for real-time)

**Risk:** Medium. The WASM build exists but browser integration quirks (async loading, memory) need testing. Performance is the key unknown — if lookups are too slow, the real-time feel breaks.

**Estimated complexity:** Low-medium. ~300 lines of wrapper code, but debugging WASM integration can be unpredictable.

---

### M4: Thermofluidic Domain Skin
**Dependency:** M1 (solver), M2 (canvas), M3 (CoolProp)
**Deliverable:** Users can build thermofluidic systems using domain-specific components that internally map to bond graph elements.

**Component palette — each maps to bond graph primitives:**

| Thermofluidic Component | Bond Graph Mapping |
|---|---|
| Pipe / Duct | R (fluid resistance) + I (fluid inertance) |
| Heat Exchanger | Two coupled R elements with TF between thermal and fluid domains |
| Pump | Sf (flow source) with modulated effort |
| Compressor | TF (pressure ratio) + R (isentropic inefficiency) |
| Turbine | TF (pressure ratio) + R (isentropic inefficiency) |
| Evaporator | R (thermal) with phase-change constitutive law via CoolProp |
| Condenser | R (thermal) with phase-change constitutive law via CoolProp |
| Throttle Valve | R (isenthalpic constraint: h_in = h_out) |
| Heater / Cooler | Se (effort source — fixed temperature or Q) |
| Reservoir / Tank | C (fluid capacitance — accumulator) |
| Mixer | 0-junction (common pressure, flows sum) |
| Splitter | 1-junction (common flow, pressures equal) with flow ratio |

**What to build:**
- Component definitions: each specifies its internal bond graph substructure, configurable parameters, and CoolProp calls for property evaluation
- Domain renderer: draws components in engineering schematic style (not bond graph notation) — pumps look like pumps, HXs look like HXs
- State display: wires show T, P, h, s, x, ṁ (derived from effort/flow via CoolProp)
- "Show Bond Graph" toggle: switches rendering from schematic view to raw bond graph view of the same system

**Validation:** Build a simple Rankine cycle (boiler → turbine → condenser → pump). Verify:
- η_thermal matches textbook value for given conditions
- All state points match steam tables
- Energy balance closes (Q_in - Q_out = W_net)
- "Show Bond Graph" displays the correct abstract topology

**Risk:** The mapping from engineering components to bond graph elements is the core intellectual challenge. Heat exchangers and phase-change components are particularly tricky because they couple thermal and fluid domains. The TE Lab App's ε-NTU model provides a starting point.

**Estimated complexity:** High. ~2000–3000 lines. This is where the physics lives.

---

### M5: Closed-Loop Iteration
**Dependency:** M4 (need thermofluidic components to test cycles)
**Deliverable:** Solver handles closed thermodynamic loops (Rankine, refrigeration) where outlet of last component feeds back to inlet of first.

**What to build:**
- Loop detection in the bond graph topology
- Tear variable selection: choose one wire in each loop to "tear" (break the loop)
- Initial guess propagation: use CoolProp to estimate starting state
- Successive substitution: propagate forward around the loop, compare tear variable, iterate
- Newton-Raphson fallback: if successive substitution is slow, compute Jacobian numerically and converge quadratically
- Convergence criteria: |Δe| < ε and |Δf| < ε at tear point
- Divergence detection: if residual grows for 3+ iterations, report to user with diagnostic

**Validation:**
- Simple Rankine: converges in < 10 iterations
- Refrigeration cycle: converges with two-phase states
- Deliberately broken system (impossible constraints): reports meaningful error

**Risk:** Medium-high. Convergence is not guaranteed for all topologies. Two-phase regions can cause discontinuities in property derivatives. May need damping (α · x_new + (1-α) · x_old) or continuation methods.

**Estimated complexity:** Medium. ~500–800 lines for the iteration logic itself, but debugging convergence issues is time-intensive.

---

### M6: T-s and P-h Diagrams
**Dependency:** M4 (need state points to plot)
**Deliverable:** Live thermodynamic diagrams showing all state points and process paths.

**What to build:**
- Saturation dome (from CoolProp) as background curve
- State points plotted at their (T,s) or (P,h) coordinates
- Process paths drawn between connected states (isobaric, isentropic, isenthalpic, isothermal lines)
- Click a state point on the diagram → highlights corresponding wire on canvas (and vice versa)
- Fluid selector (Water, R-134a, R-410A, CO2, Air, etc.) → redraws dome and recalculates

**Validation:** Rankine cycle on T-s diagram should show the textbook shape: isentropic pump, isobaric boiler, isentropic turbine, isobaric condenser.

**Risk:** Low. This is visualization, not solver work. CoolProp provides all the data.

**Estimated complexity:** Medium. ~800–1000 lines for the chart components.

---

### M7: Animated Flow Visualization
**Dependency:** M4 (need schematic rendering), M6 (nice to have alongside diagrams)
**Deliverable:** Animated dashes on schematic wires showing flow direction and temperature gradients, ported from TE Lab App.

**What to port from TE Lab App:**
- `FlowLine` and `FlowPath` components
- Temperature-based color gradients on wires (blue→red based on T)
- Flow-rate-based animation speed
- SVG linearGradient with userSpaceOnUse

**What to build new:**
- Automatic gradient assignment based on wire state (T value maps to color)
- Phase indicator: subcooled = solid blue, two-phase = gradient, superheated = red
- Flow direction from sign of flow variable

**Risk:** Low — direct port from proven TE Lab App code.

**Estimated complexity:** Low. ~400 lines, mostly ported.

---

### M8: Electrical Domain Skin
**Dependency:** M2 (canvas + wiring)
**Deliverable:** Users can build electrical circuits using standard schematic symbols that map to bond graph elements.

**Component palette:**

| Electrical Component | Bond Graph Element |
|---|---|
| Resistor | R (e = R·f, V = R·I) |
| Capacitor | C (f = C·de/dt, I = C·dV/dt) |
| Inductor | I (e = I·df/dt, V = L·dI/dt) |
| Voltage Source | Se |
| Current Source | Sf |
| Ground | Reference node (0 effort) |
| Ideal Transformer | TF (turns ratio) |
| Op-Amp (ideal) | Constrained junction structure |
| Diode | Nonlinear R (piecewise constitutive law) |

**What to build:**
- Electrical schematic renderer (resistor zigzag, capacitor plates, inductor coils, etc.)
- Node voltage / branch current display on wires
- AC steady-state mode: phasor analysis (impedance Z = R + jωL + 1/jωC)
- Transient mode: RK4 integration of state equations (already in M1 solver)
- Standard circuit templates: RC, RL, RLC series/parallel, voltage divider, Wheatstone bridge

**Validation:** RLC series step response matches analytical solution. AC impedance at resonance matches Z_min = R.

**Risk:** Low. Electrical circuits are the most natural fit for bond graphs — this is the domain bond graphs were designed around. No property lookups needed (no CoolProp equivalent).

**Estimated complexity:** Medium. ~1000–1500 lines.

---

### M9: Mechanical Domain Skin
**Dependency:** M2 (canvas + wiring)
**Deliverable:** Users can build translational and rotational mechanical systems.

**Component palette:**

| Mechanical Component | Bond Graph Element |
|---|---|
| Mass | I (F = m·dv/dt) |
| Spring | C (v = (1/k)·dF/dt) |
| Damper | R (F = b·v) |
| Force Source | Se |
| Velocity Source | Sf |
| Lever / Gear | TF (ratio) |
| Rack-and-Pinion | GY (translational ↔ rotational) |
| Fixed Wall | Reference (0 velocity) |

**What to build:**
- Mechanical schematic renderer (mass blocks, spring zigzags, damper pistons)
- Displacement/velocity/force display
- Free-body diagram auto-generation from bond graph
- Standard templates: mass-spring-damper, coupled oscillators, gear train

**Validation:** Mass-spring-damper step response matches analytical solution (underdamped, critically damped, overdamped). Natural frequency ω_n = √(k/m).

**Risk:** Low-medium. Translational is straightforward. Rotational adds complexity. The gyrator (GY) for translational↔rotational coupling needs careful implementation.

**Estimated complexity:** Medium. ~1000–1500 lines.

---

### M10: Live Domain Switching
**Dependency:** M4 + (M8 or M9) — need at least two domain skins
**Deliverable:** Toggle button that re-renders the same bond graph in different domain representations.

**What to build:**
- Domain mapping table: for each bond graph element in the system, store the equivalent component in each domain
- Re-render function: given a target domain, replace each component's visual and labels while preserving topology
- Unit conversion: effort/flow values re-labeled (V→T→F, A→Q→v, etc.)
- Transition animation: smooth morph between schematic styles (optional, nice-to-have)
- "Show Bond Graph" mode: renders the raw abstract bond graph (always available regardless of current skin)
- Side-by-side mode: two canvases showing the same system in two domains simultaneously

**The key UX moment:** Student builds an RC circuit. Clicks "Thermal Analog." The capacitor morphs into a thermal mass, the resistor becomes thermal resistance, voltage becomes temperature, current becomes heat flow. The values change units but the *numbers* (in normalized form) are identical. The differential equation shown below the canvas is the same equation with different variable names.

**Validation:**
- RC circuit (electrical) → thermal mass + thermal resistance (thermal): τ = RC = ρcV/hA
- RLC circuit (electrical) → mass-spring-damper (mechanical): ω_n, ζ match
- Thermofluidic pipe section → equivalent electrical transmission line

**Risk:** Medium. The mapping is mathematically clean but the UX of making it *feel* revelatory (not just confusing) requires careful design. The equation display that shows "same math, different labels" is critical — without it, students might just see two different-looking diagrams and miss the point.

**Estimated complexity:** Medium. ~800–1200 lines for the switching logic and renderers. UX iteration will take additional time.

---

## 3. Non-Critical-Path Items (Important but Not Blocking)

These can be developed at any point after M2:

- **Undo/redo** — port from Pipeline IDE (low effort)
- **Save/load** — serialize bond graph to JSON (low effort)
- **Export** — SVG export of diagrams, CSV of state data
- **Templates** — pre-built example systems for each domain
- **Equation display panel** — show the derived state equations in LaTeX (MathJax/KaTeX)
- **Sensitivity analysis** — vary one parameter, plot another (CyclePad had this)
- **Explanation engine** — like CyclePad's articulate hypertext: click any computed value, see the reasoning chain ("T_2 = 450K because isentropic compression from T_1 = 300K at pressure ratio 10 gives...")
- **Multi-domain coupling** — TF and GY elements connecting different domain skins (motor driving a pump driving a fluid loop cooling a chip — the capstone demo)

---

## 4. Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| Canvas | D3.js (SVG) | Proven in Pipeline IDE, handles pan/zoom/drag |
| Solver | Pure JavaScript | No server dependency, runs entirely in browser |
| Fluid properties | CoolProp WASM | 100+ fluids, phase equilibrium, browser-ready |
| Math rendering | KaTeX | Fast LaTeX rendering for equation display |
| Charting | Recharts or D3 | T-s / P-h diagrams (Recharts proven in TE Lab App) |
| App shell | Vite + React | Consistent with Pipeline IDE and other apps |
| Deployment | Static files on GitHub Pages | No backend needed — everything client-side |

---

## 5. Build Order Summary

| Order | Milestone | Depends On | Effort | Risk |
|---|---|---|---|---|
| 1 | M1: Bond Graph Solver | — | Medium-high | High (core correctness) |
| 2 | M2: Canvas + Wiring | M1 | Medium | Low (mostly ported) |
| 2 | M3: CoolProp WASM | — | Low-medium | Medium (WASM quirks) |
| 3 | M4: Thermofluidic Skin | M1+M2+M3 | High | Medium (component mapping) |
| 3 | M8: Electrical Skin | M1+M2 | Medium | Low |
| 4 | M5: Closed-Loop Iteration | M4 | Medium | Medium-high (convergence) |
| 5 | M6: T-s / P-h Diagrams | M4 | Medium | Low |
| 5 | M9: Mechanical Skin | M1+M2 | Medium | Low-medium |
| 6 | M7: Animated Flow | M4 | Low | Low (ported) |
| 7 | M10: Live Domain Switching | M4+(M8 or M9) | Medium | Medium (UX) |

---

## 6. Session Log: 2026-03-28/29

### What was built

**M1: ✅ COMPLETE**
- `src/solver/BondGraph.js` — Full solver: R, C, I, Se, Sf elements, 0/1 junctions, TF transformers
- Constraint-based propagation (iterative junction resolution, R algebraic fill)
- RK4 transient integrator + DC steady-state solver
- `test/rlc-validation.html` — Validated against analytical RLC step response: 0.0000% error on V_C at all 7 time points, power balance exact

**M2: ~90% COMPLETE**
- `app.html` — Full interactive application (single-file, React + Recharts from CDN)
- SVG canvas: drag-and-drop nodes, pan/zoom, node selection, property editing
- Component palette: Se, Sf, R, C, I, 0-junction, 1-junction
- Port-to-port wiring with auto-orient (sources→junctions→elements)
- Causality stroke rendering (SCAP-based assignment after solve)
- Half-arrow power direction indicators on bonds
- DC steady-state solve button
- **Transient simulation**: Play/Stop/Reset, requestAnimationFrame loop calling stepRK4, auto-scaled dt/steps based on system characteristic frequency
- **Recharts time-series chart**: Live-streaming effort/flow traces with domain-specific labels, distinct colors per element, solid (effort) vs dashed (flow)
- Bottom panel with tabs: Schematic view + Transient chart
- Missing from M2: undo/redo, Bézier curve wires (currently straight lines)

**M8+M9 (Electrical + Mechanical skins): ~70% COMPLETE (ahead of plan)**
- Domain metadata system: DOMAINS object with effort/flow names, units, element descriptions, accent colors for 5 domains (generic, electrical, mechanical, thermal, hydraulic)
- Domain-specific SVG symbols inside nodes: zigzag resistor, capacitor plates, inductor coils, damper piston, spring zigzag, mass block, thermometer, flame, tank, pipe restriction, pump
- Auto-generated traditional schematic panel: series loop (1-junction) and parallel ladder (0-junction) layouts with domain symbols
- 5 built-in examples: RLC Series, RC Parallel, Mass-Spring-Damper, Thermal RC, Hydraulic Pump+Pipe
- Domain badge in header, per-element bond graph type label

**M10 (Live Domain Switching): Early prototype**
- Switching between examples instantly changes all visual identity (symbols, labels, units, colors, schematic layout)
- Domain metadata drives rendering — no hardcoded domain logic in the renderer
- True interactive switching (build a circuit, change domain) not yet implemented — currently tied to example loading

### What's next (pick up here)

1. **Polish M2**: Chart legend clarity (flow labels should say "through" not "across"), undo/redo, better port hit targets, wire deletion
2. **True domain switching (M10)**: Add domain selector dropdown that re-skins the current graph without changing topology. This is the "wow moment" — build an RLC, click "Mechanical," watch it become mass-spring-damper
3. **Equation display panel**: Show the derived state equations in LaTeX (KaTeX) — "same equation, different variable names" is the pedagogical punch
4. **M3+M4**: CoolProp WASM + thermofluidic skin (only needed for cycle builder use case)
5. **M5**: Closed-loop iteration for thermodynamic cycles

### Architecture notes for next session
- The solver (`BondGraphSolver`) is inlined in `app.html` for file:// compatibility. The canonical source is `src/solver/BondGraph.js` (ES module version). Keep them in sync or migrate to Vite build.
- The `DOMAINS` object is the key abstraction for domain switching. Adding a new domain = adding an entry to this object + symbol cases in `DomainSymbol`.
- The schematic auto-generator handles 1-junction (series loop) and 0-junction (parallel ladder). Multi-junction topologies need manual schematic layout or a more sophisticated auto-router.
- Transient sim auto-scales dt from storage element values. Works well for RLC/MSD. May need tuning for thermal (very slow τ) or hydraulic (very fast) systems.
