# Bond Graph Engine — Project Outline

> **Status:** Vision / Pre-development
> **Created:** 2026-03-28
> **Category:** Engineering, Education, Interactive Simulation
> **Build plan:** See `CRITICAL_PATH_PLAN.md` in this directory
> **Origin:** Evolved from TE Lab App (data center cooling sim) → thermofluidic cycle builder idea → generalized bond graph engine with live domain switching

---

## 1. Vision

A browser-based, real-time, interactive drag-and-drop thermodynamic circuit builder where users place mechanical/thermal components onto a canvas, wire them together with fluid state connections, and a solver propagates thermodynamic state (T, P, h, s, x) through the network in real-time.

**One-liner:** MultiSim for thermodynamic cycles — build Rankine, Brayton, refrigeration, or any custom cycle by wiring components on a canvas.

**Lineage:** Direct evolution of the TE Lab App (single-system simulation) and the Agent Pipeline IDE (visual DAG builder with execution engine). This project merges both paradigms — the Pipeline IDE's canvas/wiring/execution architecture with the TE Lab App's real-time thermal physics and animated visualization.

---

## 2. Gap Analysis

No existing tool combines all six required properties:

| Requirement | Status in Market |
|---|---|
| Browser-based | Professional tools are all desktop |
| Drag-and-drop components | Educational browser tools use fixed layouts |
| Arbitrary cycle topology | Only professional tools ($10K+/yr) support this |
| Real-time state propagation | Browser tools are either calculators or slider-based |
| Student-focused | Professional tools target practicing engineers |
| Free / open-source | Nothing free has all the above |

### Closest Precedents

- **CyclePad** (Northwestern, 1990s) — The conceptual gold standard. Drag-and-drop components, automatic state propagation, articulate explanation engine for students. Dead Windows app, never open-sourced, never rebuilt for the web.
- **TESPy** (Python, open-source) — The closest solver engine. Propagates T/P/h/s through networks of turbines, compressors, HXs, etc. with CoolProp. No GUI — code-only. A browser front-end on TESPy's logic is the fastest path.
- **DWSIM** (open-source) — Full drag-and-drop flowsheeting with thermodynamic models, but chemical engineering focused (distillation, reactors) and not browser-native.
- **Thermoflex / HYSYS / Flownex** — Professional-grade drag-and-drop with full solvers. Desktop-only, $10K–$50K/year.
- **LearnChemE / SteamPlot / pocketTHERM** — Browser-based educational tools, but fixed-layout viewers or property calculators — no circuit building.

---

## 3. Architecture Concept

### 3.1 Component Library (~12–15 core types)

| Component | Inputs | Outputs | Physics |
|---|---|---|---|
| Compressor | P_in, T_in, P_ratio, η_s | P_out, T_out, W_in | Isentropic + efficiency |
| Turbine | P_in, T_in, P_ratio, η_s | P_out, T_out, W_out | Isentropic + efficiency |
| Pump | P_in, T_in, P_out, η_s | T_out, W_in | Incompressible isentropic |
| Heat Exchanger | Two inlets, two outlets, ε or UA | State propagation | ε-NTU or LMTD method |
| Evaporator | P, T_in or x_in | T_out, x_out, Q_in | Phase change at constant P |
| Condenser | P, T_in or x_in | T_out, x_out, Q_out | Phase change at constant P |
| Boiler / Heater | Q_in or T_out target | State propagation | Constant P heat addition |
| Cooler | Q_out or T_out target | State propagation | Constant P heat rejection |
| Throttle Valve | — | — | Isenthalpic (h_in = h_out) |
| Mixer | Multiple inlets | Single outlet | Mass + energy balance |
| Splitter | Single inlet | Multiple outlets | Equal state, split mass flow |
| Pipe / Duct | Length, D, roughness | ΔP, ΔT | Friction + heat loss |
| Source / Sink | Boundary conditions | — | Fixed state specification |

### 3.2 Wire State Variables

Each wire carries the full thermodynamic state:
- **T** — Temperature (K or °C)
- **P** — Pressure (kPa or bar)
- **h** — Specific enthalpy (kJ/kg)
- **s** — Specific entropy (kJ/(kg·K))
- **x** — Quality (0–1 for two-phase, null for subcooled/superheated)
- **ṁ** — Mass flow rate (kg/s)

### 3.3 Fluid Property Backend

**CoolProp** (compiled to WASM for browser) — 100+ fluids, real gas properties, phase equilibrium. Already has a JavaScript/WASM wrapper. This is the critical enabling technology — it provides the h(T,P), s(T,P), T(h,P), etc. lookups that make the solver work.

### 3.4 Solver

Topological sort (same as Pipeline IDE's Kahn's algorithm) with iterative convergence for cycles:
1. Sort components in execution order
2. Forward-propagate known states
3. For closed loops (recirculation), iterate until convergence (successive substitution or Newton-Raphson on the residual)
4. Detect over/under-constrained systems and report to user

### 3.5 Canvas & Rendering

Reuse Pipeline IDE's D3.js canvas architecture:
- SVG node rendering with input/output ports
- Bézier curve wires between ports
- Drag-and-drop from component palette
- Pan/zoom
- Wire state displayed as tooltip or inline annotation (T, P, h, s, x, ṁ)

### 3.6 Visualization Features

- **T-s diagram** — Live plot of all states, with process paths drawn between connected components
- **P-h diagram** — Same, alternative view
- **Animated flow** — Reuse TE Lab App's FlowPath component with color gradients showing temperature along wires
- **Component internals** — Expandable detail view (like TE Lab's HX internals)
- **Energy balance dashboard** — System-level W_net, Q_in, Q_out, η_thermal, COP

---

## 4. Example Cycles (Built-in Templates)

| Cycle | Components | Key Learning |
|---|---|---|
| Simple Rankine | Boiler → Turbine → Condenser → Pump | Steam power basics |
| Rankine w/ Reheat | + Reheater between HP/LP turbine stages | Efficiency improvement |
| Ideal Refrigeration | Compressor → Condenser → Throttle → Evaporator | Vapor-compression, COP |
| Brayton (Gas Turbine) | Compressor → Combustor → Turbine | Air-standard cycle |
| Brayton w/ Regenerator | + HX between turbine exhaust and compressor outlet | Waste heat recovery |
| Combined Cycle | Brayton topping + Rankine bottoming via HRSG | System integration |
| Heat Pump | Same as refrigeration, different Q focus | Heating vs cooling COP |
| ORC | Organic fluid Rankine for low-grade heat | Working fluid selection |
| Data Center Cooling | Chip → Cold Plate → HX → Facility loop | Direct evolution of TE Lab App |

---

## 5. Differentiation from Pipeline IDE

| Aspect | Pipeline IDE | Thermo Cycle Lab |
|---|---|---|
| Node types | AI agents, scripts, file I/O | Physical components |
| Wire data | Text, files, JSON | Thermodynamic state (T, P, h, s, x, ṁ) |
| Execution | Sequential DAG, one-shot | Steady-state solver, iterative for loops |
| Visualization | Execution log, previews | T-s / P-h diagrams, animated flow |
| Backend | Claude API, shell, Pandoc | CoolProp WASM (client-side) |

Shared infrastructure: D3 canvas, node rendering, wire routing, pan/zoom, topological sort, component palette, undo/redo.

---

## 6. Technical Risks & Open Questions

1. **CoolProp WASM performance** — Can CoolProp compiled to WASM handle real-time property lookups fast enough for interactive feedback? Need to benchmark.
2. **Cycle convergence** — Closed loops (recirculation) require iterative solving. How many iterations before convergence? Does successive substitution work or do we need Newton-Raphson?
3. **Two-phase regions** — Phase change components (evaporator, condenser) need careful handling of quality and saturation properties. Edge cases at exactly x=0 or x=1.
4. **Over/under-constrained detection** — Users can build systems with too many or too few specifications. Need clear error reporting (like CyclePad's explanation engine).
5. **Scope creep** — The component library could grow without bound. Start with ~12 core components and prove the architecture before expanding.

---

## 7. Development Phases

### Phase 1: Core Canvas + Simple Components
- Port D3 canvas from Pipeline IDE
- Implement Source, Sink, Pipe, Heater, Cooler, Throttle
- CoolProp WASM integration
- Forward propagation solver (no loops yet)
- Wire state display

### Phase 2: Rotating Machinery + Closed Loops
- Compressor, Turbine, Pump with isentropic efficiency
- Iterative solver for closed loops
- Simple Rankine and Brayton templates
- T-s and P-h diagram plotting

### Phase 3: Heat Exchangers + Multi-Fluid
- HX with ε-NTU method (port from TE Lab App)
- Two-fluid wiring (hot side / cold side)
- Counter-flow / co-current (port from TE Lab App)
- Refrigeration cycle template

### Phase 4: Visualization + Polish
- Animated flow with temperature gradients (port from TE Lab App)
- Component internal visualization
- Energy balance dashboard
- COP / η_thermal calculation
- Sensitivity analysis (vary one parameter, plot another)

### Phase 5: Advanced Features
- Combined cycles
- Regeneration / reheat
- Custom component definition
- Export cycle data to CSV
- Embeddable cycle widgets for course pages

---

## 8. North Star: Bond Graph Generalization

The thermofluidic cycle builder (Phases 1–5) is the entry point. The long-term architecture is a **browser-based bond graph modeler** that subsumes electrical, mechanical, thermal, and hydraulic circuits under a single formalism.

### 8.1 Why Bond Graphs

Bond graphs are the domain-agnostic power network formalism. Every physical domain reduces to:

- **Effort × Flow = Power** (the universal power conjugate pair)
- **Three element types:** Resistance (R), Capacitance (C), Inertance (I)
- **Two junction types:** 0-junction (common effort), 1-junction (common flow)
- **Inter-domain coupling:** Transformers (TF) and Gyrators (GY)

The solver generates state equations automatically from the graph topology — Karnopp & Rosenberg's standard procedure. The domain-specific circuit builders become rendering skins on top of the same engine.

### 8.2 Domain Mapping

| Domain | Effort (e) | Flow (f) | R | C | I |
|---|---|---|---|---|---|
| Electrical | Voltage (V) | Current (A) | Resistor | Capacitor | Inductor |
| Mech. Translation | Force (N) | Velocity (m/s) | Damper | Spring (1/k) | Mass |
| Mech. Rotation | Torque (N·m) | Ang. velocity (rad/s) | Rot. damper | Torsion spring | Flywheel |
| Thermal | Temperature (K) | Heat flow (W) | Thermal resistance | Thermal mass | — |
| Hydraulic | Pressure (Pa) | Volume flow (m³/s) | Fluid resistance | Tank/accumulator | Fluid inertance |

### 8.3 The Novel Feature: Live Domain Switching

A student builds an RLC circuit. Clicks "Show Bond Graph" — sees the abstract power network. Clicks "Thermal Analog" — same topology renders as thermal resistances and capacitances with temperature/heat-flow labels. Clicks "Mechanical Analog" — same topology renders as mass-spring-damper. The math never changes. Only the labels, units, and visual rendering change.

**No existing tool does this.** SPICE does electrical. Simulink does block diagrams. CyclePad did thermo cycles. None let you see that they're all the same equation by switching domain skins on a single underlying bond graph.

### 8.4 Connection to the ODS Treatise

This tool is the *instrument* that tests the *treatise*. The ODS paper (On Dynamical Systems) proves the mathematical equivalence of the product structure B = R × D across domains — the constitutive laws, cross-domain analogies, effort/flow power conjugacy, and the underdetermination theorem. The bond graph modeler makes that proof interactive and explorable.

### 8.5 Pedagogical Integration

| Course | What students build | What they discover |
|---|---|---|
| PSE-II (Physics) | RC/RLC circuits | Same math as thermal decay |
| ENGR 3211 (Thermal) | Cooling loops, Rankine cycles | Same math as electrical networks |
| Dynamics | Mass-spring-dampers | Same math as LC circuits |
| Controls | Transfer functions from bond graphs | Unified state-space formulation |
| Capstone | Multi-domain systems (e.g., motor driving a pump driving a fluid loop cooling an electronic load) | The full cross-domain analogy in one model |

### 8.6 Architecture Implication

The Phase 1–5 thermofluidic builder should be designed with the bond graph generalization in mind:

- **Component model layer** should separate the *physics* (constitutive equations) from the *rendering* (how the component looks on canvas)
- **Solver** should work on the abstract effort/flow/power level, not on domain-specific variables
- **Wire state** should carry generalized (effort, flow, power) with domain-specific naming as a display concern
- **Component palette** should be extensible — adding a new domain means adding a new palette of components that map to the same R/C/I/junction primitives

This way the thermofluidic builder isn't throwaway work — it's the first domain skin on an engine that will eventually support all of them.

---

## 9. Phasing Summary

| Phase | Scope | Immediate Value |
|---|---|---|
| 1–5 | Thermofluidic cycle builder | ENGR 3211 lab tool, fills the CyclePad gap |
| 6 | Bond graph engine + electrical skin | PSE-II circuit analogy |
| 7 | Mechanical skin | Dynamics course |
| 8 | Multi-domain coupling (TF/GY) | Cross-domain capstone projects |
| 9 | Live domain switching | The ODS treatise as an interactive instrument |

---

## 10. References

- **CyclePad** — https://www.qrg.northwestern.edu/projects/NSF/Cyclepad/aboutcp.html (conceptual model)
- **TESPy** — https://github.com/oemof/tespy (solver architecture reference)
- **CoolProp** — https://coolprop.org/ (fluid property backend, has JS/WASM wrapper)
- **DWSIM** — https://dwsim.org/ (open-source flowsheeting reference)
- **TE Lab App** — `Website/te-lab-app/` (our prototype for HX modeling, animated flow, material selection)
- **Pipeline IDE** — `Website/projects/agent-pipeline-ide/` (our D3 canvas, DAG execution, component architecture)
- **On Dynamical Systems** — `Website/projects/on-dynamical-systems.html` (the treatise proving the cross-domain analogy this tool embodies)
- **Karnopp, Margolis, Rosenberg** — *System Dynamics: Modeling, Simulation, and Control of Mechatronic Systems* (bond graph formalism reference)
- **CoolProp WASM** — https://coolprop.org/coolprop/wrappers/Javascript/index.html (browser-ready fluid properties)
