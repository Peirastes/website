# Capacitor Dielectric Lab — Project Specification

## Project Overview

The Capacitor Dielectric Lab is an interactive browser-based simulation of a parallel-plate capacitor in an RC circuit, designed for use in PSE II (Physics for Scientists and Engineers II) lectures and lab sessions. It models the real-time charging and discharging of a capacitor through a series resistor, with user-adjustable physical parameters and interchangeable dielectric materials. The app serves as a virtual substitute for a physical demonstration apparatus, allowing students to observe how capacitance, time constants, and circuit voltages respond to changes in geometry, material properties, and circuit parameters.

**Course context:** Chapter 25 (Capacitance and Dielectrics), building on the electrostatics foundation of Chapters 22–24.

**Target audience:** Undergraduate students in calculus-based introductory physics.

---

## Physics Model

### Core Equations

The simulation is built on three relationships:

- **Capacitance:** C = κε₀A/d, where κ is the dielectric constant, ε₀ = 8.854 × 10⁻¹² F/m, A is plate area, and d is plate separation.
- **Charging:** V_cap(t) = V₀(1 − e^(−t/τ)), where τ = RC is the time constant.
- **Discharging:** V_cap(t) = V₀ e^(−t/τ).

### Derived Quantities (computed in real time)

- Capacitance C (from geometry and dielectric)
- Time constant τ = RC
- Capacitor voltage V_cap(t)
- Resistor voltage V_R(t) = V_supply − V_cap (charging) or V_R = V_cap (discharging)
- Current I(t) = (V₀/R) e^(−t/τ)
- Stored charge Q = CV_cap
- Stored energy U = ½CV_cap²
- Resistor power dissipation P_R = I²R

### Dielectric Materials Library

Nine materials spanning four orders of magnitude in κ:

| Material | κ | Category |
|----------|---|----------|
| Vacuum | 1.0000 | Baseline |
| Air | 1.0006 | Calibration reference |
| Paper | 3.7 | Common insulator |
| Glass | 4.7 | Common insulator |
| Mica | 5.4 | Common insulator |
| Rubber | 7.0 | Common insulator |
| Water | 80 | Polar liquid |
| BaTiO₃ | ~300 | Perovskite ceramic |
| SrTiO₃ | ~310 | Perovskite ceramic |

Each material has a unique visual fill pattern (dots, lines, crosshatch, ripple, etc.) and color for identification in the apparatus diagram.

---

## Application Architecture

### Technology Stack

- **Framework:** React (functional components with hooks)
- **Rendering:** SVG (apparatus diagram), HTML5 Canvas (oscilloscope), CSS-in-JS (inline styles)
- **Fonts:** JetBrains Mono (monospace, loaded from Google Fonts)
- **Dependencies:** None beyond React core — no external physics or charting libraries

### Component Hierarchy

```
CapacitorLab (root)
├── GuidedPanel          — Step-by-step calibration workflow
├── ApparatusDiagram     — SVG cross-section of the physical setup
│   ├── Capacitor plates (positive/negative, with charge signs)
│   ├── Dielectric fill (patterned, color-coded by material)
│   ├── Electric field arrows OR polarization dipoles (togglable)
│   ├── Resistor zigzag symbol (on positive lead)
│   ├── Wire leads (color-coded red/navy)
│   └── DC power supply box (with live voltage readout)
├── Knob (×4)            — Drag-to-adjust rotary controls
├── Oscilloscope         — Canvas-rendered scope display
│   ├── Grid, crosshair, axis labels
│   ├── τ markers (dashed vertical lines at 1τ, 2τ, ... 5τ)
│   ├── CH1 trace: V_cap (green)
│   └── CH2 trace: V_R (orange)
├── Readout (×6)         — Capacitor measured quantities
├── Readout (×4)         — Load resistor panel with KVL check
└── Governing Equations  — Reference formulas and dielectric comparison
```

### State Management

All state is managed via React `useState` hooks in the root `CapacitorLab` component. No external state library is used. Key state variables:

- **Control parameters:** supplyVoltage, resistance, plateArea, separation, dielectric
- **Simulation state:** isRunning, isCharging, simTime, traceData (array of {t, vCap, vR}), currentVoltage
- **UI state:** mode (explore/guided), guidedStep, scopeChannel (cap/resistor/both), showPolarization

### Simulation Engine

The simulation runs via `requestAnimationFrame` with a time-scaling factor that maps wall-clock time to simulation time such that the oscilloscope trace fills the display in approximately 4 seconds regardless of the actual τ value. This keeps the visual experience engaging whether τ is microseconds (small C, small R) or seconds (large C, large R). The trace stores both V_cap and V_R at each time step for dual-channel display.

---

## User Interface

### Layout

Two-column grid (max-width 1100px):

- **Left column:** Guided panel (if active), apparatus diagram, control panel
- **Right column:** Oscilloscope, measured quantities, load resistor readout, governing equations

### Controls

| Control | Type | Range | Default | Unit |
|---------|------|-------|---------|------|
| Supply voltage | Rotary knob | 1–50 | 12 | V |
| Resistance | Rotary knob | 0.1–100 | 10 | kΩ |
| Plate area | Rotary knob | 25–2500 | 400 | cm² |
| Separation | Rotary knob | 0.5–20 | 2 | mm |
| Dielectric | Button group | 9 materials | Air | — |
| Charge | Button | — | — | — |
| Discharge | Button | — | — | — |
| Stop | Button (during sim) | — | — | — |
| Show polarization | Checkbox | on/off | off | — |
| Scope channel | Button group | V_cap / V_R / Both | Both | — |

Knobs use pointer drag (vertical motion) for precise analog-style adjustment.

### Oscilloscope Features

- Dark green-on-black phosphor aesthetic
- 10×8 grid with center crosshair
- Auto-scaled time axis (μs, ms, or s depending on τ)
- Voltage axis auto-scaled to next multiple of 5V above supply voltage
- Dashed τ markers at 1τ through 5τ with labels
- Dual-channel display: CH1 (V_cap, green) and CH2 (V_R, orange)
- Glowing dot at the current trace position
- Channel selector: V_cap only, V_R only, or both overlaid

### Apparatus Diagram Features

- 2D cross-section of parallel plates with color-coded charge signs
- Dielectric fill with material-specific SVG patterns
- Electric field arrows in the gap (when polarization is off)
- Bound charge polarization dipoles (when polarization is on) showing induced dipole alignment
- Zigzag resistor symbol on the positive lead with live resistance label
- DC power supply box at top with live voltage display
- Red/navy wire color coding matching plate polarity
- Dynamic geometry: plate height scales with area, gap width scales with separation
- Dimension labels (d and A) and dielectric material label below capacitor

### Operating Modes

**Free Explore:** All controls unlocked, no guidance. Students manipulate parameters freely and observe results.

**Guided Lab:** A 5-step calibration workflow:

1. Set dielectric to Air (baseline)
2. Record baseline capacitance and observe charging curve
3. Insert a dielectric material and observe capacitance jump
4. Compare time constants between air and dielectric
5. Free exploration with full parameter access

Each step includes an instruction, a status check (validates the current parameter state), and navigation buttons.

---

## Color Scheme

Consistent with the PSE II figure toolkit:

| Role | Color | Hex |
|------|-------|-----|
| Positive charge/plate | Red | #E63946 |
| Negative charge/plate | Navy | #1D3557 |
| Electric field | Blue | #457B9D |
| Velocity/teal accent | Teal | #2A9D8F |
| Gold accent (κ, τ) | Gold | #E9C46A |
| Force/resistor | Orange | #E76F51 |
| Scope trace (V_cap) | Green | #22c55e |
| Scope trace (V_R) | Orange | #E76F51 |
| UI background | Dark | #0a0e1a |
| Panel background | Dark gray | #111827 |

---

## Pedagogical Features

- **KVL verification:** The load resistor panel continuously displays V_R + V_cap and compares to V_supply, giving students a live Kirchhoff's voltage law check.
- **Dielectric comparison ratios:** The governing equations panel shows C/C_vacuum and τ/τ_vacuum, both equal to κ, reinforcing that the dielectric constant is a simple multiplicative factor.
- **SI prefix formatting:** All readouts automatically select appropriate SI prefixes (pF, nF, μF; μs, ms, s; nA, μA, mA; etc.) so students see realistic instrument-style readings.
- **Polarization visualization:** Togglable bound charge dipoles show the microscopic mechanism by which dielectrics increase capacitance.
- **τ markers on oscilloscope:** Dashed lines at integer multiples of τ connect the abstract time constant to the visible curve shape (63.2% at 1τ, 86.5% at 2τ, etc.).

---

## Goals and Next Steps

### Immediate (pre-class deployment)

- **UI repackaging:** Restructure the interface layout for a different presentation format (in progress — the current two-column layout may be adapted for projection, tablet, or standalone kiosk use).

### Short-term enhancements

- **Trace persistence / overlay:** Allow students to "freeze" a trace and overlay a second run with different parameters for direct visual comparison (e.g., air vs. glass on the same scope screen).
- **Energy bar chart:** Add a real-time stacked bar showing energy stored in the capacitor vs. energy dissipated in the resistor vs. energy delivered by the supply, reinforcing energy conservation.
- **Breakdown voltage warning:** Flag when E = V/d approaches the dielectric strength of the selected material, introducing the concept of dielectric breakdown.
- **Export data:** Allow students to download the trace data as CSV for analysis in a spreadsheet or Python notebook (connects to Tier 2 homework framework).

### Medium-term extensions

- **Series and parallel capacitor configurations:** Add a second capacitor and a topology switch (series/parallel) to demonstrate equivalent capacitance.
- **AC driving:** Replace the DC supply with an AC source to show impedance Z = 1/(ωC), phase relationships, and frequency-dependent behavior — bridging toward AC circuits.
- **LC oscillation mode:** Replace the resistor with an inductor to demonstrate undamped oscillations, connecting to the spring analogy (C ↔ 1/k, L ↔ m, ω = 1/√(LC)).
- **RLC mode:** Full RLC circuit with underdamped, critically damped, and overdamped regimes visible on the oscilloscope.

### Long-term vision

- **Integration with Electrostatics Lab:** Port the capacitor simulation into the existing Three.js-based Electrostatics Lab as a new module, providing 3D visualization of the electric field between the plates and equipotential surfaces within the dielectric.
- **Physical apparatus companion:** If the physical demonstration setup is eventually built, the app can serve as a prediction/comparison tool — students predict the oscilloscope trace using the simulation, then observe the real measurement and reconcile differences.
- **Homework integration:** Design Tier 2 problems where students use the simulation to collect data, fit exponential curves, extract κ from measured time constants, and perform uncertainty analysis.
